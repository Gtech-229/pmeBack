import asyncHandler from "express-async-handler"
import { AuthRequest } from "types"
import { Response } from "express"
import { prisma } from "../lib/prisma"
import { createCampaignSchema, createCampaignStepsSchema } from "../schemas/campaign.schema"

/**
 * @description Get campaigns
 * @route GET /campaign
 * @access Authenticated admin
 */

export const getCampaigns = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    // Vérification du rôle admin
    if (!req.user) {
      res.status(403)
      throw new Error("Access denied")
    }

    // Récupérer toutes les campagnes
    const campaigns = await prisma.campaign.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include : {
        steps : {
          include : {
            committee : true
          }
        }
      }
    })

    res.status(200).json(campaigns)
  }
)



/**
 * @description Create a campaign
 * @route POST /campaign
 * @access Authenticated admin
 */

export const createCampaign = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    if (!req.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(req.user?.role)) {
      res.status(403)
      throw new Error("Access denied")
    }

    const parsed = createCampaignSchema.parse(req.body)
    if(!parsed){
      res.status(400)
      throw new Error('Invalid datas')
    }

    const {
      name,
      description,
      start_date,
      end_date,
      status,
      targetProject
    } = parsed

   

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        start_date,
        end_date,
        status,
        targetProjects  : Number(targetProject) ?? null
      },
    })

    res.status(201).json(campaign)
  }
)


/**
 * @description Get a single campaign details
 * @route GET /campaign/:id
 * @access Authenticated admin
 */

export const getCampaignById = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    // Vérification auth
    if (!req.user) {
      res.status(403)
      throw new Error("Access denied")
    }

    const { id } = req.params

    if(!id){
      res.status(400)
      throw new Error('The campaign id is required')

    }

    const campaign = await prisma.campaign.findUnique({
      where : {id},
      include : {
        committees : {
          include : {
            members : {
              include : {
                user : true
              }
            },

            meetings : true,
            step : true
          }
        },

        steps : {
          include : {
            committee : true
          }
        },

        projects : true,
        
      }
     
    })

    if (!campaign) {
      res.status(404)
      throw new Error("Campaign not found")
    }

    res.status(200).json(campaign)
  }
)


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


    const {order, name, campaignId } = parsed.data

    if (!req.user) {
      res.status(403)
      throw new Error("Access denied")
    }

    if (!campaignId) {
      res.status(400)
      throw new Error("No campaign id")
    }
   
 

   

    

    // Vérifier que la campagne existe
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
    })

    if (!campaign) {
      res.status(404)
      throw new Error("Campaign not found")
    }


    // (optionnel mais recommandé) bloquer si des steps existent déjà
    const existingStep = await prisma.campaignStep.findFirst({
      where: { campaignId , order},
    })

    if (existingStep) {
      res.status(409)
      throw new Error("step existant a lordre renseigne ")
    }
  

    // Création du step
    await prisma.campaignStep.create({
      data : {
        name,
        order,
        campaignId
      },
      include : {
        campaign : true
      }
    })


    res.status(201).json("Created successfully")
  }
)


/**
 * @description Delete a campaign validation step
 * @route DELETE /campaign/:campaignId/steps/:id
 * @access Authenticated Admin
 */
export const deleteCampaignStep = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const { campaignId, id } = req.params

    if (!req.user) {
      res.status(403)
      throw new Error("Access denied")
    }

    if (!campaignId || !id) {
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
        id,
        campaignId
      }
    })

    if (!step) {
      res.status(404)
      throw new Error("Step not found for this campaign")
    }

   
    const linkedCommittee = await prisma.committee.findUnique({
      where: {
        stepId: id
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
      where: { id }
    })

    res.status(200).json("Deleted successfully")
  }
)


/**
 * @description Update a campaign
 * @route PUT /campaign/:id
 * @access Authenticated Admin
 */
export const updateCampaign = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params
    const { name, description, status, targetProjects } = req.body

    if (!req.user) {
      res.status(403)
      throw new Error("Access denied")
    }

    if (!id) {
      res.status(400)
      throw new Error("Missing campaign id")
    }

    // Vérifier que la campagne existe
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include : {
        steps : true
      }
    })

    if (!campaign) {
      res.status(404)
      throw new Error("Campaign not found")
    }

    // Validation minimale
    if (!name && !description && !status) {
      res.status(400)
      throw new Error("No data provided for update")
    }

    if(status === 'OPEN' && campaign.steps.length === 0){
      res.status(400)
      throw new Error("Au moins une etape est necessaire pour le lancement d'une campagne")
    }

    // Mise à jour
    const updatedCampaign = await prisma.campaign.update({
      where: { id},
      data: {
        name: name ?? campaign.name,
        description: description ?? campaign.description,
        status: status ?? campaign.status,
        targetProjects : Number(targetProjects)
      }
    })

    res.status(200).json({
      message: "Campaign updated successfully",
      campaign: updatedCampaign
    })
  }
)

