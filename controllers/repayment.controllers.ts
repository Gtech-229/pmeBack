import asyncHandler from "express-async-handler";
import { AuthRequest } from "../types";
import { Response } from "express";
import { creditRepaymentSchema } from "../schemas/project.schema";
import { prisma } from "../lib/prisma";
import { uploadToCloudinary } from "../utils/UploadToCloudinary";
import { sendPushNotification } from "../utils/sendPushNotifications";


/**
 * @description Add a new repayment
 * @route  POST/credits/:creditId/repayments
 * @access Connected User
 **/
export const addRepayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    res.status(401)
    throw new Error("Unauthorized")
  }

  const { creditId } = req.params

  if (!creditId) {
    res.status(400)
    throw new Error("L'id du credit est requis")
    
  }

  

  const parsed = creditRepaymentSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400)
    throw new Error(parsed.error.message)
  }

  const { amountPaid, paidAt, note } = parsed.data

  // fetch credit
  const credit = await prisma.projectCredit.findUnique({
    where: { id: creditId },
    include: {
      repayments: {
        orderBy: { paidAt: 'desc' },
        take: 1,
      }
    }
  })

  if (!credit) {
    res.status(404)
    throw new Error("Crédit introuvable")
  }

  if (credit.status === "COMPLETED") {
    res.status(400)
    throw new Error("Ce crédit est déjà soldé")
  }

  if (amountPaid > credit.remainingBalance) {
    res.status(400)
    throw new Error(`Seulement (${credit.remainingBalance}) reste a payer`)
  }

  // ── Handle document upload ──────────────────────────────────────────────
  let documentUrl: string | null = null
  let documentName: string | null = null
  let mimeType: string | null = null
  let size: number | null = null

  const file = req.file // multer single file

  if (file) {
    const uploaded = await uploadToCloudinary(file) // your existing storage util
    documentUrl = uploaded.url
    documentName = (req.body.documentLabel as string) ?? file.originalname
    mimeType = file.mimetype
    size = file.size
  }
  // ───────────────────────────────────────────────────────────────────────

 // ✅ Get actual total count separately
const repaymentCount = await prisma.creditRepayment.count({
  where: { creditId }
})

// compute server-side fields
const remainingAfter = credit.remainingBalance - amountPaid

// next payment number = how many already paid + 1
const nextPaymentNumber = repaymentCount + 1
const expectedDate = new Date(credit.startDate)
expectedDate.setDate(1) // normalize day to avoid overflow
expectedDate.setMonth(expectedDate.getMonth() + nextPaymentNumber)

const isLate = new Date(paidAt) > expectedDate

  

 // ── Transaction result ────────────────────────────────────────────────
  const updated = await prisma.$transaction(async (tx) => {
    await tx.creditRepayment.create({
      data: {
        creditId,
        amountPaid,
        paidAt: new Date(paidAt),
        remainingAfter,
        isLate,
        note: note ?? null,
        documentUrl,
        documentName,
        mimeType,
        size,
      }
    })

    return tx.projectCredit.update({
      where: { id: creditId },
      data: {
        remainingBalance: remainingAfter,
        status: remainingAfter === 0 ? "COMPLETED" : "ACTIVE",
      },
      include: {
        repayments: { orderBy: { paidAt: 'desc' } }
      }
    })
  })

  // ── User ──────────────────────────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { pushToken: true }
  })

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  // ── Notifications + activities (fire and forget — don't await all) ────
  const notifications: Promise<any>[] = []

  // 1 — repayment recorded
  notifications.push(
    prisma.activity.create({
      data: {
        type: 'REPAYMENT',
        title: 'Remboursement enregistré',
        message: `Remboursement de ${amountPaid.toLocaleString('fr-FR')} enregistré. Solde restant : ${remainingAfter.toLocaleString('fr-FR')}`,
        userId: req.user.id,
      }
    })
  )

  if (user.pushToken) {
    notifications.push(
      sendPushNotification(
        user.pushToken,
        'Remboursement enregistré ✅',
        `${amountPaid.toLocaleString('fr-FR')} enregistré. Solde restant : ${remainingAfter.toLocaleString('fr-FR')}`,
        { creditId, type: 'REPAYMENT' }
      )
    )
  }

  // 2 — late payment
  if (isLate) {
    notifications.push(
      prisma.activity.create({
        data: {
          type: 'REPAYMENT_LATE',
          title: 'Remboursement en retard',
          message: `Ce remboursement a été enregistré après la date prévue.`,
          userId: req.user.id,
        }
      })
    )

    if (user.pushToken) {
      notifications.push(
        sendPushNotification(
          user.pushToken,
          'Remboursement en retard ⚠️',
          `Votre remboursement a été enregistré en retard.`,
          { creditId, type: 'REPAYMENT_LATE' }
        )
      )
    }
  }

  // 3 — credit completed
  if (remainingAfter === 0) {
    notifications.push(
      prisma.activity.create({
        data: {
          type: 'CREDIT_COMPLETED',
          title: 'Crédit entièrement remboursé 🎉',
          message: 'Félicitations ! Vous avez remboursé la totalité de ce crédit.',
          userId: req.user.id,
        }
      })
    )

    if (user.pushToken) {
      notifications.push(
        sendPushNotification(
          user.pushToken,
          'Crédit soldé 🎉',
          'Félicitations ! Vous avez remboursé la totalité de ce crédit.',
          { creditId, type: 'CREDIT_COMPLETED' }
        )
      )
    }
  }

  // Run all notifications in parallel — don't block the response
  await Promise.allSettled(notifications)

  res.status(201).json(updated)
})

 



/**
 * @description Delete a  repayment
 * @route  DELETE/credits/:creditId/repayments/:id
 * @access Connected Admin
 * **/ 

export const deleteRepayment = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { creditId, id } = req.params

  if (!req.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(req.user?.role)) {
    res.status(401)
    throw new Error("Accès refusé")
  }

  if (!creditId || !id) {
    res.status(400)
    throw new Error("Paramètres manquants")
  }

  // fetch credit with repayments sorted desc
  const credit = await prisma.projectCredit.findUnique({
    where: { id: creditId },
    include: {
      repayments: {
        orderBy: { paidAt: 'desc' }
      }
    }
  })

  if (!credit) {
    res.status(404)
    throw new Error("Crédit introuvable")
  }

  // verify repayment exists and belongs to this credit
  const repayment = credit.repayments.find(r => r.id === id)
  if (!repayment) {
    res.status(404)
    throw new Error("Remboursement introuvable")
  }

  // only allow deleting the most recent repayment
  const isLatest = credit.repayments[0]?.id === id
  if (!isLatest) {
    res.status(400)
    throw new Error("Seul le dernier remboursement peut être supprimé")
  }

  // transaction — delete repayment + restore credit balance
  const updated = await prisma.$transaction(async (tx) => {
    await tx.creditRepayment.delete({
      where: { id }
    })

    const restoredBalance = credit.remainingBalance + repayment.amountPaid

    return tx.projectCredit.update({
      where: { id: creditId },
      data: {
        remainingBalance: restoredBalance,
        status: restoredBalance > 0 ? "ACTIVE" : "COMPLETED",
      },
      include: {
        repayments: {
          orderBy: { paidAt: 'desc' }
        }
      }
    })
  })

  res.status(200).json(updated)
})




