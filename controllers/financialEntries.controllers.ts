import asyncHandler from "express-async-handler";
import { AuthRequest } from "../types";
import { Response } from "express";
import { financialEntrySchema } from "../schemas/project.schema";
import { prisma } from "../lib/prisma";
import { uploadToCloudinary } from "../utils/UploadToCloudinary";
import { sendPushNotification } from "../utils/sendPushNotifications";

export const addFinancialEntry = asyncHandler(async (req: AuthRequest, res: Response) => {
  console.log(req.body)

  const { projectId } = req.params

  if (!projectId) {
    res.status(400)
    throw new Error("Id du projet manquant")
  }

  const parsed = financialEntrySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400)
    throw new Error(parsed.error.message)
  }

  const { type, category, label, amount, date, note } = parsed.data

  // verify project exists and belongs to requesting user
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      pme: { select: { promoter: {select : {userId : true}} } }
    }
  })

  if (!project) {
    res.status(404)
    throw new Error("Projet introuvable")
  }

  if (project.pme.promoter?.userId !== req.user?.id) {
    res.status(403)
    throw new Error("Accès refusé")
  }

  // handle file upload if present
  let documentUrl: string | null = null
  let documentName: string | null = null
  let mimeType: string | null = null
  let size: number | null = null

  if (req.file) {
    // assuming you use cloudinary or similar — adapt to your upload logic
    const uploaded = await uploadToCloudinary(req.file)
    documentUrl  = uploaded.url
    documentName = req.body.documentName ?? req.file.originalname
    mimeType     = req.file.mimetype
    size         = req.file.size
  }

  const entry = await prisma.financialEntry.create({
    data: {
      projectId,
      type,
      category,
      label,
      amount,
      date: new Date(date),
      note: note ?? null,
      documentUrl,
      documentName,
      mimeType,
      size,
    }
  })

  /* ---------------- ACTIVITY + NOTIFICATION ---------------- */
const entryUser = await prisma.user.findUnique({
  where: { id: req.user!.id },
  select: { pushToken: true }
})

const isIncome = type === 'INCOME'

const notifications: Promise<any>[] = [
  prisma.activity.create({
    data: {
      type: 'PROJECT_UPDATE',
      title: isIncome ? 'Revenu enregistré' : 'Dépense enregistrée',
      message: `${isIncome ? 'Revenu' : 'Dépense'} de ${amount.toLocaleString('fr-FR')} enregistré${isIncome ? '' : 'e'} : ${label}.`,
      userId: req.user!.id,
    }
  })
]

if (entryUser?.pushToken) {
  notifications.push(
    sendPushNotification(
      entryUser.pushToken,
      isIncome ? 'Revenu enregistré 💰' : 'Dépense enregistrée 📊',
      `${label} — ${amount.toLocaleString('fr-FR')}`,
      { projectId, type: 'PROJECT_UPDATE' }
    )
  )
}

await Promise.allSettled(notifications)

  // map to DTO shape
  res.status(201).json({
    id:           entry.id,
    projectId:    entry.projectId,
    type:         entry.type,
    category:     entry.category,
    label:        entry.label,
    amount:       entry.amount,
    date:         entry.date.toISOString(),
    note:         entry.note,
    documentUrl:  entry.documentUrl,
    documentName: entry.documentName,
    mimeType:     entry.mimeType,
    size:         entry.size,
    createdAt:    entry.createdAt.toISOString(),
    updatedAt:    entry.updatedAt.toISOString(),
  })
})