import asyncHandler from "express-async-handler"
import { AuthRequest } from "types"
import { Response } from "express"
import { prisma } from "../lib/prisma"
import { createCampaignSchema, createCampaignStepsSchema, updateCampaignStepSchema, updateCampaignStepsSchema } from "../schemas/campaign.schema"
import { CampaignStatus, Gender, MaritalStatus, ProjectType } from "../generated/prisma/enums"
import { Prisma } from "../generated/prisma/client"
import { CampaignWhereInput } from "../generated/prisma/models"
import { sendBroadcastNotification, sendPushNotification } from "../utils/sendPushNotifications"
import { createBroadcastActivity } from "../utils/createBroadCastActivity"

/**
 * @description Get campaigns (paginated)
 * @route GET /campaign
 * @access Authenticated admin
 */

export const getCampaigns = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401)
    throw new Error("Access denied")
  }

  const { 
  status, search, page, limit, 
  sector, projectType, 
  minAge, maxAge, 
  gender, maritalStatus,
  hasDisability
} = req.query

  const take = parseInt(limit as string) || 20
  const skip = (parseInt(page as string) - 1 || 0) * take

  const where: Prisma.CampaignWhereInput = {
  ...(status && status !== "all" ? { status: status as CampaignStatus } : {}),
  ...(search ? { name: { contains: search as string, mode: "insensitive" } } : {}),
 

  ...((sector || projectType || minAge || maxAge || gender || maritalStatus || hasDisability !== undefined) ? {
    criteria: {
      ...(projectType && projectType !== "all" ? { projectType: projectType as ProjectType } : {}),
      ...(gender && gender !== "all" ? { gender: gender as Gender } : {}),
      // ...(maritalStatus && maritalStatus !== "all" ? { maritalStatus: maritalStatus as MaritalStatus } : {}),
      ...(hasDisability !== undefined && hasDisability !== "all" ? { 
        hasDisability: hasDisability === "true" 
      } : {}),
      ...(minAge ? { minAge: { lte: parseInt(minAge as string) } } : {}),
      ...(maxAge ? { maxAge: { gte: parseInt(maxAge as string) } } : {}),
      ...(sector ? {
        sectors: {
          some: {
            sector: { name: { contains: sector as string, mode: "insensitive" } }
          }
        }
      } : {})
    }
  } : {})
}
  const [data, total] = await prisma.$transaction([
    prisma.campaign.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        steps: {
          include: { committee: true, documents : true },
          
        },
        criteria: {
          include: {
            sectors: {
              include: { sector: true }
            }
          }
        }
      },
    }),
    prisma.campaign.count({ where }),
  ])

  res.status(200).json({
    data,
    meta: {
      total,
      page: parseInt(page as string) || 1,
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  })
})



/**
 * @description Create a campaign
 * @route POST /campaign
 * @access Authenticated admin
 */

export const createCampaign = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    if (!req.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(req.user?.role)) {
      res.status(401)
      throw new Error("Access denied")
    }



   const parsed = createCampaignSchema.parse(req.body)
if (!parsed) {
  res.status(400)
  throw new Error('Invalid datas')
}

const { name, description, start_date, end_date, status, targetProject, type, criteria, isNational, targetCountry } = parsed

const campaign = await prisma.$transaction(async (tx) => {
  const createdCampaign = await tx.campaign.create({
    data: {
      name,
      description,
      start_date,
      end_date,
      status,
      targetProjects: targetProject ? Number(targetProject.replace(/\s/g, '').replace(',', '.')) : null,
      type,
      isNational,
      targetCountry : targetCountry ?? null
    },
  })

  if (criteria) {
    const { minAge, maxAge, gender, maritalStatus, projectType, sectorIds } = criteria

    const createdCriteria = await tx.campaignCriteria.create({
      data: {
        campaignId: createdCampaign.id,
        minAge: minAge ? Number(minAge) : null,
        maxAge: maxAge ? Number(maxAge) : null,
        gender: gender,
        maritalStatus: maritalStatus as MaritalStatus[] ?? [] ,
        projectType: projectType,
        hasDisability: criteria.hasDisability ?? null,
      },
    })

    if (sectorIds && sectorIds.length > 0) {
      await tx.campaignCriteriaSector.createMany({
        data: sectorIds.map((sectorId) => ({
          criteriaId: createdCriteria.id,
          sectorId,
        })),
      })
    }
  }

  return tx.campaign.findUnique({
    where: { id: createdCampaign.id },
    include: {
      steps: true,
      criteria: {
        include: {
          sectors: {
            include: { sector: true }
          }
        }
      }
    }
  })
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
      res.status(401)
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
            step : true,
            
          }
        },

        steps : {
          include : {
            committee : true,
            documents : true
          }
        },

        projects : true,
        criteria : {
          include : {
            sectors : {
              include : {
                sector : true
              }
            }
          }
        }
        
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
 * @description Update a campaign
 * @route PUT /campaign/:id
 * @access Authenticated Admin
 */
export const updateCampaign = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    
    const { id } = req.params
    const { name, description, status, targetProjects } = req.body

    if (!req.user) {
      res.status(401)
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

   
  

    const notifications: Promise<any>[] = []

  // ── Campaign just opened ──────────────────────────────────────────────
  if (campaign.status !== 'OPEN' && updatedCampaign.status === 'OPEN') {
    notifications.push(
      sendBroadcastNotification(
        '🎯 Nouvelle campagne ouverte',
        `La campagne "${updatedCampaign.name}" est maintenant ouverte aux projets`,
        { campaignId: updatedCampaign.id, type: 'NEW_OPEN_CAMPAIGN' }
      ),
      createBroadcastActivity(
        'NEW_OPEN_CAMPAIGN',
        '🎯 Nouvelle campagne ouverte',
        `La campagne "${updatedCampaign.name}" est maintenant disponible. Soumettez votre projet dès maintenant.`,
        { campaignId: updatedCampaign.id }
      )
    )
  }

  // ── Campaign just closed ──────────────────────────────────────────────
  if (campaign.status === 'OPEN' && updatedCampaign.status === 'CLOSED') {
    // notify only users who submitted a project to this campaign
    const affectedUsers = await prisma.user.findMany({
      where: {
        pme: {
          projects: {
            some: { campaignId: updatedCampaign.id }
          }
        },
        pushToken: { not: null },
        isActive: true,
      },
      select: { id: true, pushToken: true }
    })

    for (const u of affectedUsers) {
      notifications.push(
        prisma.activity.create({
          data: {
            type: 'CAMPAIGN_CLOSED',
            title: 'Campagne clôturée',
            message: `La campagne "${updatedCampaign.name}" à laquelle vous avez soumis un projet est maintenant clôturée.`,
            userId: u.id,
          }
        })
      )

      if (u.pushToken) {
        notifications.push(
          sendPushNotification(
            u.pushToken,
            'Campagne clôturée 🔒',
            `La campagne "${updatedCampaign.name}" est maintenant clôturée.`,
            { campaignId: updatedCampaign.id, type: 'CAMPAIGN_CLOSED' }
          )
        )
      }
    }
  }

  await Promise.allSettled(notifications)

    res.status(200).json({
      message: "Campaign updated successfully",
      campaign: updatedCampaign
    })
  }
)

/**
 * @description Delete a campaign
 * @route DELETE /campaign/:campaignId
 * @access ADMIN | SUPER_ADMIN
 */
export const deleteCampaign = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
    res.status(401)
    throw new Error("Accès refusé")
  }

  const { id } = req.params
   if(!id){
    res.status(400)
    throw new Error("No campaignId")
   }

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: { projects: true }
  })

  if (!campaign) {
    res.status(404)
    throw new Error("Campagne introuvable")
  }

  if (campaign.projects.length > 0) {
  res.status(400)
  throw new Error(
    `Impossible de supprimer cette campagne : elle contient ${campaign.projects.length} projet(s). Veuillez les supprimer ou les transférer avant de continuer.`
  )
}

  await prisma.campaign.delete({ where: { id } })

  res.status(200).json({ success: true })
})

