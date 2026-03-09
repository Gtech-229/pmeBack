import { Response } from "express"
import asyncHandler from "express-async-handler"
import { AuthRequest } from "types"
import { prisma } from "../lib/prisma"
import { Role } from "../generated/prisma/enums"
import { createCommitteeSchema, CreateCommitteeInput, updateCommitteeSchema } from "../schemas/committee.schema"


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

const { name, description,stepId }: CreateCommitteeInput = parsed.data

   

    /* ================= VALIDATIONS ================= */

    if (!name) {
      res.status(400)
      throw new Error("Le nom du comité est requis")
    }

    if(stepId ){
   // Vérifier que l’étape existe et appartient à la campagne
const step = await prisma.campaignStep.findFirst({
  where: {
    id: stepId,
    campaignId
  }
});

if(!step){
  res.status(400);
  throw new Error("Etape non valide")
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
    }

    /* ================= CREATE COMMITTEE ================= */


    const committee = await prisma.committee.create({
      data: {
        name,
        description,
        campaignId ,
        stepId  : stepId ?? null
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
        },
        step : true
      }
    })

    /* ================= RESPONSE ================= */

    res.status(201).json(committee)
  }
)





/**
 * @description Get admins and optionally committee members
 * @route GET /users/admin?committeeId=xxx
 * @access Authenticated Admin
 */

export const getCommitteUsers = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const { committeeId } = req.query;

    //  Récupérer tous les admins
    const admins = await prisma.user.findMany({
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
    });

    // Si pas de committeeId → on renvoie simplement les admins
    if (!committeeId) {
       res.status(200).json(
        admins.map(user => ({
          ...user,
          isMember: false,
          memberRole: null,
        }))
      );
      return
    }

    //  Vérifier que le comité existe
    const committee = await prisma.committee.findUnique({
      where: { id: committeeId as string },
    });

    if (!committee) {
      res.status(404);
      throw new Error("Committee not found");
    }

    // Récupérer les membres du comité
    const committeeMembers = await prisma.committeeMember.findMany({
      where: {
        committeeId: committeeId as string,
      },
      select: {
        userId: true,
        memberRole: true,
      },
    });

    //  Transformer en Map les membres du comites
    const membersMap = new Map(
      committeeMembers.map(member => [
        member.userId,
        member.memberRole,
      ])
    );

    //  Fusion 
    const formattedUsers = admins.map(user => {
      const role = membersMap.get(user.id);

      return {
        ...user,
        isMember: Boolean(role),
        memberRole: role ?? null,
      };
    });

    res.status(200).json(formattedUsers);
  }
);




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
 * @param {campaignId}
 */

export const getCommittees = asyncHandler(async (req: AuthRequest, res: Response) => {

  const {campaignId} =  req.params

  if(!campaignId){
    res.status(400);
    throw new Error("Aucune campagne spécifiée")
  }

  

  // Récupérer tous les comités avec relations
  const committees = await prisma.committee.findMany({
    where : {campaignId},
    include: {
      campaign : true,
      members: {
        include: {
          user : true
        },
      },
      meetings : true,
      step : true
      
    
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
    const { id } = req.params;

    if (!id) {
      res.status(400);
      throw new Error("Committee id is required");
    }

    const committee = await prisma.committee.findUnique({
      where: { id },
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


/**
 * @description Delete a committee by id
 * @route DELETE /committee/:id
 * @access Authenticated
 */
export const deleteCommittee = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    if (!id) {
      res.status(400);
      throw new Error("Committee id is required");
    }

    const committee = await prisma.committee.findUnique({
      where: { id },
    });

    if (!committee) {
      res.status(404);
      throw new Error("Committee not found");
    }

    if(committee.stepId){
      res.status(409);
      throw new Error("Impossible de supprimer un comité déjà assigné à une étape")
    }

    await prisma.committee.delete({
      where: { id },
    });

    res.status(200).json({ message: "Comité supprimé avec succès" });
  }
);

export const updateCommittee = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params

    if (!id) {
      res.status(400)
      throw new Error("No committee id")
    }

    const parsed = updateCommitteeSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400)
      throw new Error("Invalid datas")
    }

    const { name, description, stepId } = parsed.data

    /* ================= CHECK COMMITTEE EXISTS ================= */
    const existing = await prisma.committee.findUnique({
      where: { id},
    })

    if (!existing) {
      res.status(404)
      throw new Error("Comité introuvable")
    }

    /* ================= STEP VALIDATIONS ================= */
    if (stepId && stepId !== existing.stepId) {
      const step = await prisma.campaignStep.findFirst({
        where: { id: stepId, campaignId: existing.campaignId },
      })

      if (!step) {
        res.status(400)
        throw new Error("Etape non valide")
      }

      const stepTaken = await prisma.committee.findFirst({
        where: { stepId, NOT: { id} },
      })

      if (stepTaken) {
        res.status(409)
        throw new Error("Cette étape est déjà associée à un autre comité")
      }
    }

    /* ================= UPDATE ================= */
    const updated = await prisma.committee.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(stepId !== undefined && { stepId: stepId ?? null }),
      },
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
          },
        },
      },
    })

    /* ================= RESPONSE ================= */
    res.status(200).json(updated)
  }
)
