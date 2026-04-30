import asyncHandler from "express-async-handler";
import { AuthRequest } from "types";
import { Response } from "express";
import { prisma } from "../lib/prisma";
import { fullOnboardingSchema } from "../schemas/pme.onBoarding";
import { removeFromCloudinary } from "../utils/RemoveFromCloudinary";
import { uploadToCloudinary } from "../utils/UploadToCloudinary";
import { Prisma } from "../generated/prisma/client";
import { createPMESchema } from "./pme.controllers";
import { createProjectBodySchema } from "../schemas/project.schema";
import { computeCreditDetails } from "../utils/functions";
import { sendPushNotification } from "../utils/sendPushNotifications";




/**
 * @description Admin creates a project for a PME user
 * @route POST /admin/projects/:userId
 * @access ADMIN | SUPER_ADMIN
 */
export const adminCreateProject = asyncHandler(async (req: AuthRequest, res: Response) => {
  /* ---------------- AUTH ---------------- */
  if (!req.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
    res.status(401)
    throw new Error("Accès refusé")
  }

  const { userId } = req.params
  if(!userId) {
    res.status(400)
    throw new Error("Id de l'utilisateur requis")
  }

 
  /* ---------------- USER + PME CHECK ---------------- */
  let user = await prisma.user.findUnique({
    where: { id: userId },
    include: { pme: true }
  })

  if (!user) {
    res.status(404)
    throw new Error("Utilisateur introuvable")
  }

 /* ---------------- CREATE PME IF NEEDED ---------------- */
if (!user.pme && req.body.organisation) {
  let organisationData
  try {
    organisationData = typeof req.body.organisation === "string"
      ? JSON.parse(req.body.organisation)
      : req.body.organisation
  } catch {
    res.status(400)
    throw new Error("Format JSON invalide pour l'organisation")
  }

  const parsedOrg = createPMESchema.safeParse(organisationData)
  if (!parsedOrg.success) {
    res.status(400)
    throw parsedOrg.error
  }

  const data = parsedOrg.data
  const { promoter, ...pmeData } = data

  const hasAdministrative = pmeData.administrative &&
    Object.keys(pmeData.administrative).length > 0

  const location = hasAdministrative
    ? { administrative: pmeData.administrative, city: null }
    : { administrative: {}, city: pmeData.city ?? null }

    const hasOrganisation = await prisma.pME.findUnique({
      where : {email : pmeData.email}
    })

    if(hasOrganisation){
      res.status(400)
      throw new Error("Une pme avec cet email existe déjà")
    }

  await prisma.$transaction(async (tx) => {
    const pme = await tx.pME.create({
      data: {
        ownerId: userId,
        name: pmeData.name,
        phone: pmeData.phone,
        address: pmeData.address,
        email: pmeData.email,
        description: pmeData.description,
        type: pmeData.type,
        size: pmeData.size,
        currency : pmeData.currency,
        country: pmeData.country,
        administrative: location.administrative,
        city: location.city,
        isActive: true,
      }
    })

    // Create promoter if provided
    if (promoter) {
      await tx.promoter.create({
        data: {
          userId,
          pmeId: pme.id,
          gender: promoter.gender,
          birthDate: new Date(promoter.birthDate),
          maritalStatus: promoter.maritalStatus,
          hasDisability: promoter.hasDisability,
          disabilityType: promoter.hasDisability ? promoter.disabilityType! : null,
        }
      })
    }

    await tx.user.update({
      where: { id: userId },
      data: { validatedAt: new Date(), isActive: true }
    })

    await tx.activity.create({
      data: {
        type: "ACCOUNT_VERIFIED",
        title: "Compte Vérifié",
        message: "Votre organisation a été validée par un administrateur.",
        userId,
        pmeId: pme.id
      }
    })
  })

  // Refresh user with new pme
  user = await prisma.user.findUnique({
    where: { id: userId },
    include: { pme: true }
  }) as typeof user
}

if (!user?.pme?.id) {
  res.status(403)
  throw new Error("Aucune organisation associée à cet utilisateur")
}

const pmeId = user.pme.id

/* ---------------- BODY PARSING ---------------- */
let requestCredits
try {
  requestCredits = req.body.credits ? JSON.parse(req.body.credits) : undefined
} catch {
  res.status(400)
  throw new Error("Format JSON invalide pour les crédits")
}

const parsedBody = createProjectBodySchema.safeParse({
  ...req.body,
  credits: requestCredits
})

if (!parsedBody.success) {
  res.status(400)
  throw parsedBody.error
}

const { title, description, requestedAmount, hasCredit, campaignId, credits, type, sectorId } = parsedBody.data


 

/* ---------------- CAMPAIGN CHECK ---------------- */
const campaign = await prisma.campaign.findUnique({
  where: { id: campaignId },
  select: { type: true, status: true }
})

if (!campaign) {
  res.status(404)
  throw new Error("Campagne introuvable")
}

if (campaign.status !== "OPEN") {
  res.status(400)
  throw new Error("Cette campagne n'est pas ouverte aux soumissions")
}

// Only block for MONO_PROJECT
if (campaign.type === "MONO_PROJECT") {
  const hasAlreadyCampaignProject = await prisma.project.findFirst({
    where: { campaignId, pmeId }
  })

  if (hasAlreadyCampaignProject) {
    res.status(400)
    throw new Error("Cette organisation dispose déjà d'un projet pour cette campagne mono projet")
  }
}


  /* ---------------- FILES ---------------- */
  const files = req.files as Express.Multer.File[]

  if (!files || files.length === 0) {
    res.status(400)
    throw new Error("Au moins un document est requis")
  }

  /* ---------------- CAMPAIGN STEPS ---------------- */
  const campaignSteps = await prisma.campaignStep.findMany({
    where: { campaignId },
    orderBy: { order: "asc" }
  })

  if (!campaignSteps || campaignSteps.length === 0) {
    res.status(400)
    throw new Error("La campagne ne contient aucune étape")
  }

 

  /* ---------------- TRANSACTION ---------------- */
  const result = await prisma.$transaction(async (tx) => {
    const createdProject = await tx.project.create({
      data: {
        title,
        description,
        requestedAmount,
        hasCredit: hasCredit === "true",
        pmeId,
        campaignId,
        status: "pending",
        currentStepOrder: 1,
       type,
       sectorId : sectorId ?? null
      }
    })

    await tx.projectStatusHistory.create({
      data: { projectId: createdProject.id, status: "pending" }
    })

    let firstStepId: string | null = null

    for (const step of campaignSteps) {
      const createdStep = await tx.projectStepProgress.create({
        data: {
          projectId: createdProject.id,
          campaignStepId: step.id,
          status: step.order === 1 ? "IN_PROGRESS" : "PENDING"
        }
      })
      if (step.order === 1) firstStepId = createdStep.id
    }

    if (!firstStepId) throw new Error("Aucune étape initiale trouvée")

    return { project: createdProject, firstStepId }
  })

  /* ---------------- CREDITS ---------------- */
  if (credits && Array.isArray(credits) && credits.length > 0) {
    await prisma.projectCredit.createMany({
       data: credits.map((c) => {
         const amount = Number(c.amount)
         const interestRate = Number(c.interestRate)
         const durationMonths = Number(c.durationMonths)
         const remainingBalance = Number(c.remainingBalance)
         const startDate = new Date(c.startDate)
   
         const { monthlyPayment, endDate } = computeCreditDetails({
           amount,
           interestRate,
           durationMonths,
           startDate,
         })
   
         return {
           borrower: c.borrower,
           amount,
           interestRate,
           durationMonths,
           monthlyPayment,        
           remainingBalance,      
           startDate,
           endDate,               
           status: remainingBalance === 0 ? "COMPLETED" : "ACTIVE",
           projectId: result.project.id,
         }
       })
     })
  }

  /* ---------------- DOCUMENTS ---------------- */
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const label = req.body.documentsMeta?.[i]?.label

    if (!file || !label) throw new Error(`Document ou intitulé manquant (index ${i})`)

    const uploadResult = await uploadToCloudinary(file, `projects/${result.project.id}`)

    await prisma.document.create({
      data: {
        label,
        fileUrl: uploadResult.url,
        publicId: uploadResult.publicId,
        mimeType: file.mimetype,
        size: file.size,
        projectId: result.project.id,
        projectStepId: result.firstStepId
      }
    })
  }

  /* ---------------- ACTIVITY ---------------- */
 // After the documents upload loop — replace existing activity block

/* ---------------- NOTIFICATIONS + ACTIVITIES ---------------- */
const targetUser = await prisma.user.findUnique({
  where: { id: userId },
  select: { pushToken: true }
})

const notifications: Promise<any>[] = []

// PROJECT_CREATED activity
notifications.push(
  prisma.activity.create({
    data: {
      type: 'PROJECT_CREATED',
      title: 'Nouveau projet soumis',
      message: `Le projet "${title}" a été soumis par un administrateur pour votre organisation.`,
      userId,
      pmeId
    }
  })
)

if (targetUser?.pushToken) {
  notifications.push(
    sendPushNotification(
      targetUser.pushToken,
      'Nouveau projet soumis 📁',
      `Le projet "${title}" a été soumis pour votre organisation.`,
      { type: 'PROJECT_CREATED' }
    )
  )
}



await Promise.allSettled(notifications)

  /* ---------------- RESPONSE — full project for optimistic replace ---------------- */
  const fullProject = await prisma.project.findUnique({
    where: { id: result.project.id },
    include: {
      pme: { include: { owner: true , promoter : {include : {user : true}}} },
      documents: true,
      credits: true,
      stepProgress: true,
      campaign : true,
      
    }
  })

  res.status(201).json(fullProject)
})