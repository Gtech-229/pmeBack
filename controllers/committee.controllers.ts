import { Response } from "express"
import asyncHandler from "express-async-handler"
import { AuthRequest } from "types"
import { prisma } from "../lib/prisma"
import { Role } from "../generated/prisma/enums"
import { createCommitteeSchema, CreateCommitteeInput } from "../schemas/committee.schema"
import { CommitteeMember } from "generated/prisma/client"

/**
 * @description Create campaign committee
 * @route POST /campaign/:campaignId/committee
 * @access Authenticated Admin
 */



export const createCommittee = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const {campaignId}= req.params 
    
   
    if(!campaignId){
      res.status(400)
      throw new Error('No campaign id')
    }

    const parsed = createCommitteeSchema.safeParse(req.body)

if (!parsed.success) {
  res.status(400)
  throw new Error('Invalid datas')
}

const { name, description, members, stepId }: CreateCommitteeInput = parsed.data

   

    /* ================= VALIDATIONS ================= */

    if (!name) {
      res.status(400)
      throw new Error("Le nom du comité est requis")
    }

    if (!members || members.length === 0) {
      res.status(400)
      throw new Error("Un comité doit avoir au moins un membre")
    }

    // Vérifier les doublons
    const userIds = members.map((m: any) => m.userId)
    const hasDuplicates = new Set(userIds).size !== userIds.length

    if (hasDuplicates) {
      res.status(400)
      throw new Error("Un utilisateur ne peut être ajouté qu'une seule fois")
    }


    // Vérifier que l’étape existe et appartient à la campagne
const step = await prisma.campaignStep.findFirst({
  where: {
    id: stepId,
    campaignId
  }
})

if (!step) {
  res.status(404)
  throw new Error("Étape introuvable pour cette campagne")
}

// Vérifier que l’étape n’est pas déjà utilisée
const existingCommittee = await prisma.committee.findUnique({
  where: {
    stepId
  }
})

if (existingCommittee) {
  res.status(409)
  throw new Error(
    "Cette étape est déjà associée à un autre comité"
  )
}

    /* ================= CREATE COMMITTEE ================= */


    const committee = await prisma.committee.create({
      data: {
        name,
        description,
        campaignId ,
        stepId ,
        members: {
          create: members.map((member: any) => ({
            userId: member.userId,
            memberRole: member.memberRole,
            
                
          }))
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    })

    /* ================= RESPONSE ================= */

    res.status(201).json({
      success: true,
      message: "Comité créé avec succès",
      data: committee
    })
  }
)






/**
 * @description Get users to add to a committee
 * @route  GET/commitees/users
 * @access Authentificated Admin
 * **/ 
export const getCommitteUsers = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const users = await prisma.user.findMany({
      where: {
        role: {
          in: [Role.ADMIN, Role.SUPER_ADMIN],
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true, 
      },
      orderBy: {
        lastName: "asc",
      },
    })

    res.status(200).json(users)
  }
)


/**
 * @description Get projects to manage during a committee
 * @route  GET/commitees/projects
 * @access Authentificated Admin
 * **/ 
export const getCommitteeProjects = asyncHandler(
  async (req: AuthRequest, res: Response) => {
     if(!req.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(req.user?.role)){
    res.status(401)
    throw new Error('Unauthorized')
     }
    
    const projects = await prisma.project.findMany(
      {
        include: {
          pme : {
            include : {
              owner : true
            }
          },
          documents : true,
        
        }
      }
    )

    res.status(200).json(projects)
  }
)
/**
 * @description Get committees
 * @route GET /committee
 * @access Authenticated admin
 */

export const getCommittees = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Vérification du rôle admin
  if (!req.user ) {
    res.status(403);
    throw new Error("Access denied");
  }

  // Récupérer tous les comités avec relations
  const committees = await prisma.committee.findMany({
    include: {
      members: {
        include: {
          user : true
        },
      },
      meetings : true
     
    
    },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json(committees);
});

/**
 * @description Get committee details by id
 * @route GET /committee/:id
 * @access Authenticated
 */
export const getCommitteeDetails = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { committeeId } = req.params;

    if (!committeeId) {
      res.status(400);
      throw new Error("Committee id is required");
    }

    const committee = await prisma.committee.findUnique({
      where: { id : committeeId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            presences : true
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        meetings : true,
        step : true
      },
    });

    if (!committee) {
      res.status(404);
      throw new Error("Committee not found");
    }

    res.status(200).json(committee);
  }
);



