import asyncHandler from "express-async-handler"
import { AuthRequest } from "../types"
import { Response } from "express"
import { prisma } from "../lib/prisma"



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
        }
      }
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

  res.status(200).json(updated)
})