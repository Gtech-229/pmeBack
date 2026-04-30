import asyncHandler from "express-async-handler"
import { AuthRequest } from "../types"
import { Response } from "express"
import { prisma } from "../lib/prisma"
import { sendPushNotification } from "../utils/sendPushNotifications"



/**
 * @description Confirm a fund disbursement tranche
 * @route PATCH /disbursements/:id/confirm
 * @access ADMIN, SUPER_ADMIN
 */
export const confirmDisbursement = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
    res.status(403)
    throw new Error("Accès refusé")
  }

  const { id } = req.params
  if (!id) {
    res.status(400)
    throw new Error("Id de la tranche manquant")
  }

  const disbursement = await prisma.fundDisbursement.findUnique({
    where: { id },
    include: {
      decision: {
        include: {
          report: {
            select: { status: true }
          }
        },
        
      },
      project : {include : {pme : {include : {promoter : true}}}}
    }
  })

  if (!disbursement) {
    res.status(404)
    throw new Error("Tranche introuvable")
  }

  // only confirm tranches from applied reports
  if (disbursement.decision.report.status !== "APPLIED") {
    res.status(400)
    throw new Error("Le rapport associé n'a pas encore été appliqué")
  }

  if (disbursement.isDisbursed) {
    res.status(409)
    throw new Error("Cette tranche a déjà été confirmée")
  }

  const updated = await prisma.fundDisbursement.update({
    where: { id },
    data: {
      isDisbursed: true,
      actualDate: new Date(), 
    }
  })

  const user = await prisma.user.findUnique({
    where : {id : disbursement.project.pme.promoter?.userId!}
  })

  if(!user){
     res.status(404)
    throw new Error('User not found')
  }

  const notifications: Promise<any>[] = []

   notifications.push(
    prisma.activity.create({
      data: {
        type: 'DISBURSEMENT_CONFIRMED',
        title: 'Nouvelle tranche de financement approuvée',
        message: `Un financement de  ${disbursement.amount} a été approuvé ce ${updated.actualDate} dans le cadre de votre projet ${disbursement.project.title}.`,
        userId: req.user.id,
      }
    })
  )

  if(user.pushToken){
    notifications.push(
     sendPushNotification(
    user.pushToken,
    'Nouvelle tranche de financement approuvée',
    `Le financement d'un montant de  ${disbursement.amount} a été approuvé ce ${updated.actualDate} dans le cadre de votre projet ${disbursement.project.title} `,
    {id , type : 'DISBURSEMENT_CONFIRMED'}
  )
    )
  }

 
 
  res.status(200).json(updated)
})