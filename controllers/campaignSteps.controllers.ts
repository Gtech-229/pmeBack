import asyncHandler from "express-async-handler"
import { AuthRequest } from "types"
import { Response } from "express"
import { prisma } from "../lib/prisma"
import {  createCampaignStepsSchema,  updateCampaignStepsSchema } from "../schemas/campaign.schema"
import { CampaignStepDocument } from "generated/prisma/client"



/**
 * @description Create campaign validation step
 * @route POST /campaign/:campaignId/steps
 * @access Authenticated Admin
 */
export const createCampaignSteps = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const parsed = createCampaignStepsSchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400)
      throw parsed.error
    }

    const { order, name, campaignId, setsProjectStatus, committeeId , documents} =
      parsed.data

    if (!req.user) {
      res.status(401)
      throw new Error("Access denied")
    }

    

    //  transaction 
    const step = await prisma.$transaction(async (tx) => {
     
     //  vérifier campagne
      const campaign = await tx.campaign.findUnique({
        where: { id: campaignId },
      })

      if (!campaign) {
        res.status(404)
        throw new Error("Campaign not found")
      }

      //  Verifier impact global
      if (setsProjectStatus) {
  const existingStatus = await tx.campaignStep.findFirst({
    where: {
      campaignId,
      setsProjectStatus,
    },
    select: { id: true },
  })

  if (existingStatus) {
    res.status(409)
    throw new Error(
      "Une étape avec le meme impact exist deja dans la campagne ."
    )
  }
}

      //  vérifier unicité order
      const existingStep = await tx.campaignStep.findFirst({
        where: { campaignId, order },
      })

      if (existingStep) {
        res.status(409)
        throw new Error("Une étape existe déjà avec cet ordre")
      }

      //  vérifier comité si fourni
      if (committeeId) {
        const committee = await tx.committee.findUnique({
          where: { id: committeeId },
          select: { id: true, stepId: true },
        })

        if (!committee) {
          res.status(404)
          throw new Error("Comité introuvable")
        }

        if (committee.stepId) {
          res.status(409)
          throw new Error("Ce comité est déjà assigné à une autre étape")
        }
      }

   

      //  créer la step
      const createdStep = await tx.campaignStep.create({
        data: {
          name,
          order,
          campaignId,
          setsProjectStatus: setsProjectStatus ?? null,
          
        },
      })

      //  attacher le comité si présent
      if (committeeId) {
        await tx.committee.update({
          where: { id: committeeId },
          data: { stepId: createdStep.id },
        })
      }

      // créer les documents si présents
if (documents && documents.length > 0) {
  await tx.campaignStepDocument.createMany({
    data: documents.map(d => ({
      name: d.name,
      isRequired: d.isRequired,
      stepId: createdStep.id,
    }))
  })
}

    return tx.campaignStep.findUnique({
      where: { id: createdStep.id },
      include: { documents: true, committee: true }
    })
    })

    res.status(201).json(step)
  }
)



/**
 * @description Delete a campaign validation step
 * @route DELETE /campaign/:campaignId/steps/:id
 * @access Authenticated Admin
 */
export const deleteCampaignStep = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const { campaignId, stepId } = req.params

    if (!req.user) {
      res.status(401)
      throw new Error("Access denied")
    }

    if (!campaignId || !stepId) {
      res.status(400)
      throw new Error("Missing campaign id or step id")
    }

    // Vérifier que la campagne existe
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    })

    if (!campaign) {
      res.status(404)
      throw new Error("Campaign not found")
    }

    // Vérifier que l’étape existe et appartient à la campagne
    const step = await prisma.campaignStep.findFirst({
      where: {
        id : stepId,
        campaignId
      },
      include : {projectSteps : true}
    })

    if (!step) {
      res.status(404)
      throw new Error("Step not found for this campaign")
    }

 
    const linkedProgressStep = await prisma.projectStepProgress.findFirst({
      where: { campaignStepId: stepId }
    })

    if (linkedProgressStep) {
      res.status(409)
      throw new Error(
        "Impossible de supprimer cette étape car elle est liée à la progression de projets en cours"
      )
    }

   
   
    const linkedCommittee = await prisma.committee.findUnique({
      where: {
        stepId: stepId
      }
    })

  

    if (linkedCommittee) {
      res.status(409)
      throw new Error(
        "Impossible de supprimer une étape déjà assignée à un comité"
      )
    }



    

    // Suppression de l’étape
    await prisma.campaignStep.delete({
      where: { id : stepId }
    })

    

    res.status(200).json("Deleted successfully")
  }
)

/**
 * @description Update a campaign validation steps
 * @route PUT /campaign/:campaignId/steps
 * @access Authenticated Admin
 */

export const updateCampaignStep = asyncHandler(
  async (req: AuthRequest, res: Response) => {
  
    const { campaignId } = req.params

    if (!campaignId) {
      res.status(400)
      throw new Error("L'id de la campagne est manquant")
    }
   
    const parsed = updateCampaignStepsSchema.safeParse(req.body)

    if (!parsed.success) {
      res.status(400)
      throw new Error("Payload invalide")
    }

    const steps = parsed.data

 // Detacher les comites 
for (const step of steps) {
  await prisma.committee.updateMany({
    where: { stepId: step.id },
    data: { stepId: null },
  })
  // Attacher a nouveau les vouveles steps aux comites
  if (step.committeeId) {
    await prisma.committee.update({
      where: { id: step.committeeId },
      data: { stepId: step.id },
    })
  }
}

// ── Transaction  ──
await prisma.$transaction(async (tx) => {
  // Phase 1 — neutralize orders
  await Promise.all(
    steps.map(step =>
      tx.campaignStep.update({
        where: { id: step.id },
        data: { order: step.order + 1000  },
      })
    )
  )

   // Phase 2 — null out setsProjectStatus to avoid unique constraint collision
    await Promise.all(
    steps.map(step =>
      tx.campaignStep.update({
        where: { id: step.id },
        data: { setsProjectStatus: null },
      })
    )
  )

  // Phase 3 — apply real values
  await Promise.all(
    steps.map(step =>
      tx.campaignStep.update({
        where: { id: step.id },
        data: {
          name: step.name,
          order: step.order,
          setsProjectStatus: step.setsProjectStatus ?? null,
        },
      })
    )
  )

   // Phase 4 — sync documents (delete all + recreate)
  await Promise.all(
    steps.map(async step => {
      // delete existing
      await tx.campaignStepDocument.deleteMany({
        where: { stepId: step.id }
      })
      // recreate if any
      if (step.document && step.document.length > 0) {
        await tx.campaignStepDocument.createMany({
          data: step.document.map(d => ({
            name: d.name,
            isRequired: d.isRequired,
            stepId: step.id,
          }))
        })
      }
    })
  )
}, { timeout: 30000 })

res.status(200).json({ success: true, message: "Étapes mises à jour avec succès" })
  }
)



/**
 * @description Get campaign progression steps
 * @route GET /campaign/:campaignId/steps
 * @access Authenticated Admin
 */

export const getCampaignSteps = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { campaignId } = req.params
   if(!campaignId) {
    res.status(400)
    throw new Error("Id de la campagne requise")
   }
    if (!req.user) {
      res.status(401)
      throw new Error("Access denied")
    }

    const campaignWithSteps = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        steps: {
          include : {
             committee : true,
             documents : true
          },
          orderBy: { order: "asc" },
        },
      },
    })

    if (!campaignWithSteps) {
      res.status(404)
      throw new Error("Campaign not found")
    }

    res.status(200).json(campaignWithSteps.steps)
  }
)
