import { AuthRequest, ProjectStatus } from "types"
import asyncHandler from "express-async-handler"
import { Response } from "express"
import { createCommitteeMeetingSchema, updateMeetingSchema } from "../schemas/committee.schema"
import { prisma } from "../lib/prisma"
import { createMeetingReportSchema } from "../schemas/committee.schema"
import { combineDateAndTime } from "../utils/combinateDateAndHour"
import { uploadToCloudinary } from "../utils/UploadToCloudinary"
import { ActivityType } from "generated/prisma/enums"
import { sendEmail } from "../utils/sendEmail"


/**
 * @description  Create a new committee
 * @route POST /committee/meetings
 * @access  Admin
 * **/ 

export const createMeeting = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    if (!req.user || !["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
      res.status(403)
      throw new Error("Unauthorized")
    }

    const data = createCommitteeMeetingSchema.parse(req.body)
    const { committeeId, date, startTime, endTime, location } = data

    if (startTime >= endTime) {
      res.status(400)
      throw new Error("Start time must be before end time")
    }

    const committee = await prisma.committee.findUnique({
      where: { id: committeeId },
    })

    if (!committee) {
      res.status(404)
      throw new Error("Committee not found")
    }

    const existingMeeting = await prisma.committeeMeeting.findFirst({
      where: {
        committeeId,
        date: new Date(date),
        status: "PROGRAMMED",
      },
    })

    if (existingMeeting) {
      res.status(409)
      throw new Error("A meeting is already scheduled for this date")
    }

    const meeting = await prisma.committeeMeeting.create({
      data: {
        committeeId,
        date: new Date(date),
        startTime : combineDateAndTime(new Date(date),startTime),
        endTime :  combineDateAndTime(new Date(date),endTime),
        location,
      },
    })

    res.status(201).json({
      success: true,
      data: meeting,
    })
  }
)

/**
 * @description get a committee's meetings
 * @route GET /committee/:committeeId/meetings
 * @access Private
 */
export const getMeetings = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    const { committeeId } = req.params

    if (!committeeId) {
      res.status(400)
      throw new Error("Committee id is required")
    }

    // Vérifier que le comité existe
    const committee = await prisma.committee.findUnique({
      where: { id: committeeId },
      select: {
         id: true 

      },
    })

    if (!committee) {
      res.status(404)
      throw new Error("Committee not found")
    }

 

    // Récupération des réunions
    const meetings = await prisma.committeeMeeting.findMany({
      where: { committeeId },
      orderBy: { date: "desc" },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        location: true,
        createdAt: true,
        status: true,
        updatedAt : true
      },
    })

    // Mapping DTO 
    const data = meetings.map((m) => ({
      id: m.id,
      date: m.date.toISOString(),
      startTime: m.startTime,
      endTime: m.endTime,
      location: m.location,
      createdAt: m.createdAt.toISOString(),
      status: m.status,
      committeeId ,
      updatedAt : m.updatedAt.toISOString()
    }))

    res.status(200).json(data)
  }
)


/**
 * @description get a single meeting details
 * @route GET /committee/meetings/:meetingId
 * @access Private
 */

export const getMeetingDetails = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { meetingId } = req.params;

    if (!req.user?.id) {
      res.status(401);
      throw new Error("Unauthorized");
    }

    if(!meetingId) {
      res.status(400)
      throw new Error("L'id de la reunion est requise");
    }

    //  Récupérer le meeting + committeeId
    const meeting = await prisma.committeeMeeting.findUnique({
      where: { id: meetingId },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        location: true,
        status: true,
        createdAt: true,

        report : {
          include : {
            signatures : {
              include : {
                member : {
                  include : {
                    user : true
                  }
                }
              }
            },

            projectDecisions :{
              include : {
                project : true
              }
            }
          },
          
        },


        presences : {
          include : {
            member : {
              include : {
                user : true
              }
            }
          }
          
        },
        committeeId: true,
        committee : {
          include : {
            members : {
              include : {
                user : true
              }
            }
          }
        }
      },
      
    });

    if (!meeting) {
      res.status(404);
      throw new Error("Meeting not found");
    }

    //  Vérifier que l'utilisateur est membre du comité
    // const isMember = await prisma.committeeMember.findUnique({
    //   where: {
    //     committeeId_userId: {
    //       committeeId: meeting.committeeId,
    //       userId: req.user.id,
    //     },
    //   },
    // });

    // if (!isMember) {
    //   res.status(403);
    //   throw new Error("Access denied: not a committee member");
    // }

    // 3 Mapper vers DTO
    const meetingDTO = {
      id: meeting.id,
      date: meeting.date.toISOString(),
      startTime: meeting.startTime,
      endTime: meeting.endTime,
      location: meeting.location,
      status: meeting.status,
      committeeId : meeting.committeeId,
      createdAt: meeting.createdAt.toISOString(),
      committee : meeting.committee,
      report : meeting.report,
      presences : meeting.presences
     
    };

    
    res.status(200).json(meetingDTO);
  }
);


/**
 * @description Update a committee meeting
 * @route PATCH /committee/meetings/:meetingId
 * @access Private
 */
export const updateMeeting = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { meetingId } = req.params
    if(!meetingId){
      res.status(400)
      throw new Error('Please add a meetingId')
    }
    if (!req.user?.id) {
      res.status(401)
      throw new Error("Unauthorized")
    }
    

    // Validation Zod
    const data = updateMeetingSchema.parse(req.body)

    if(!data) {
      res.status(400)
      throw new Error("Données invalides")
    }
  
    //  Vérifier que la réunion existe
    const meeting = await prisma.committeeMeeting.findUnique({
      where: { id: meetingId },
      include: {
        committee: {
          include: {
            members: true,
          },
        },
      },
    })

    if (!meeting) {
      res.status(404)
      throw new Error("Meeting not found")
    }

    //  Vérifier que l'utilisateur est membre du comité
    const isMember = meeting.committee.members.some(
      (m) => m.userId === req.user!.id
    )

    if (!isMember) {
      res.status(403)
      throw new Error("You are not allowed to update this meeting")
    }

    //  Interdire modification si réunion terminée
    if (meeting.status === "FINISHED") {
      res.status(400)
      throw new Error("Cannot update a finished meeting")
    }

    //  Update
    const updatedMeeting = await prisma.committeeMeeting.update({
      where: { id: meetingId },
      data: {
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        status: data.status ? data.status : meeting.status 
      },
    })

    res.status(200).json(updatedMeeting)
  }
)


/**
 * @description Add meeting report
 * @route POST /committee/meetings/:meetingId/report
 * @access Private (ADMIN, SUPER_ADMIN, secretary)
 */
export const addMeetingReport = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    if (!req.user || !["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
      res.status(403)
      throw new Error("Unauthorized")
    }

    

    const { meetingId } = req.params
    if (!meetingId) {
      res.status(400)
      throw new Error("Meeting id is required")
    }

    const parsedBody = {
  ...req.body,
  projectDecisions: JSON.parse(req.body.projectDecisions)
}

    const data = createMeetingReportSchema.parse(parsedBody)
   const files = req.files as Express.Multer.File[]

  

    
    //  Vérifier le meeting
    const meeting = await prisma.committeeMeeting.findUnique({
      where: { id: meetingId },
      include: { report: true },
    })

    if (!meeting) {
      res.status(404)
      throw new Error("Meeting not found")
    }

    //  Statut meeting
    if (meeting.status !== "ONGOING") {
      res.status(403)
      throw new Error("Meeting must be ONGOING to create a report")
    }

    //  Vérifier membre du comité
    const committeeMember = await prisma.committeeMember.findUnique({
      where: {
        committeeId_userId: {
          committeeId: meeting.committeeId,
          userId: req.user.id,
        },
      },
    })

    if (!committeeMember || committeeMember.memberRole !== "secretary") {
      res.status(403)
      throw new Error("Seul(e) le sécrétaire  du comité est autorisé(e) à soumettre un rapport")
    }

  

    //  Empêcher doublon
    if (meeting.report) {
      res.status(409)
      throw new Error("Un rapport a déjà été soumis pour cette réunion")
    }



   

   

    // Valider les membres presents
    // vérifier que les membres appartiennent bien au comité
const validMembers = await prisma.committeeMember.findMany({
  where: {
    id: { in: data.presentMembers.map(m => m.id) },
    committeeId: meeting.committeeId,
  },
})

if(!validMembers){
  res.status(409)
  throw new Error("Les membres presents associés au rapport ne font pas partir du comité")
}



const report =await prisma.$transaction(async (tx) => {
  const report = await tx.meetingReport.create({
    data: {
      meetingId: meeting.id,
      otherDecisions: data.otherDecisions ?? "",
      status: "DRAFT",
       projectDecisions : {
        create : data.projectDecisions.map(pd => ({
      
          project : {
            connect : {
              id : pd.projectId
            }
          },
          note : pd.note ?? '',
          decision : pd.decision,
          
          
        }))
       }



    },
  })

  

  await tx.meetingPresence.createMany({
    data: validMembers.map(m => ({
      meetingId: meeting.id,
      memberId: m.id,
    })),
  })

  await tx.committeeMeeting.update({
    where: { id: meetingId },
    data: { status: "FINISHED" },
  })

  return report
})



 if (files?.length) {
    for (let i = 0; i < files.length; i++) {
  const file = files[i]
  const label = req.body.documentsMeta[i]?.label

  if(!file || !label){
    throw new Error(`Intitule ou document${i + 1} manquant `)
  }

   const uploadResult = await uploadToCloudinary(file, `reports/${report.id}`)

    await prisma.reportDocument.create({
    data : {
      label : label,
      fileUrl : uploadResult.url,
      publicId : uploadResult.publicId,
     
     reportId : report.id
    }
   })
    }
     

  
  }


    res.status(201).json({
      success: true,
      data: report,
    })
  }
)


/**
 * @description Sign a meeting's report
 * @route 
 * @access Present members
 * **/ 


export const signReport = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    res.status(401)
    throw new Error('Unauthorized')
  }

  const userId = req.user.id
  const { meetingId } = req.params
  const { reportId } = req.body

  if (!meetingId || !reportId) {
    res.status(400)
    throw new Error('Meeting and report id are required')
  }

  /**
   * Récupérer le rapport + signatures + meeting + presences
   */
  const report = await prisma.meetingReport.findUnique({
    where: {
      id: reportId,
    },
    include: {
      signatures: true,
      meeting: {
        include: {
          presences: {
            include : {
              member : {
                include :{
                  user : true
                }
              }
            }
          },
        },
      },
    },
  })

if(!report){
  res.status(404)
   throw new Error('Rapport non trouvé')

}

  if (!report || report.status !== 'DRAFT') {
   res.status(409)
    throw new Error('Meeting report not signable')
  }

  /*
  *
   * Vérifier que l'utilisateur est présent à la réunion
 */
const presence = report.meeting.presences.find(
  (p) => p.member.userId === userId
)

if (!presence) {
  res.status(403)
  throw new Error('seuls les membres présents sont autorisés à signer le rapport')
}

const memberId = presence.memberId

/**
 * Vérifier la double signature
 */
const alreadySigned = report.signatures.some(
  (signature) => signature.memberId === memberId
)

if (alreadySigned) {
  res.status(409)
  throw new Error("Vous ne pouvez signer un rapport plus d'une fois")
}

/**
 * Créer la signature
 */
await prisma.reportSignature.create({
  data: {
    reportId: report.id,
    memberId,
  },
})

/**
 * Vérifier si tous les présents ont signé
 */
const presentMemberIds = report.meeting.presences.map(
  (p) => p.memberId
)

const signaturesCountAfter = report.signatures.length + 1
const allSigned = signaturesCountAfter === presentMemberIds.length

if (!allSigned) {
 res.status(200).json({
    message: 'Report signed successfully',
    isApplied: false,
  })
}

/**
 * 🔒 TRANSACTION
 * - appliquer le rapport
 * - appliquer toutes les décisions
 */
await prisma.$transaction(async (tx) => {
  // 1️⃣ Mettre à jour le statut du rapport
  const updated = await tx.meetingReport.updateMany({
    where: { id: report.id, status: 'DRAFT' },
    data: { status: 'APPLIED' },
  })

  // Si déjà appliqué ailleurs → stop
  if (updated.count === 0) return

  // 2️⃣ Récupérer les décisions de projets
  const decisions = await tx.meetingProjectDecision.findMany({
    where: { reportId: report.id },
  })

  // Queue d'emails à envoyer après transaction
  const emailQueue: { to: string; subject: string; html: string }[] = []

  for (const decision of decisions) {
    const project = await tx.project.findUnique({
      where: { id: decision.projectId },
      include: {
        stepProgress: { include: { campaignStep: true }, orderBy: { campaignStep: { order: 'asc' } } },
        pme: true,
        campaign: true,
      },
    })

    if (!project) continue

    // Étape en cours
    const currentStep = project.stepProgress.find((s) => s.status === 'IN_PROGRESS')
    if (!currentStep) continue

    const isApproved = decision.decision === 'approved'
    const committeeComment = decision.note ?? null

    // 3️⃣ Mettre à jour l’étape actuelle
    await tx.projectStepProgress.update({
      where: { id: currentStep.id },
      data: {
        status: isApproved ? 'APPROVED' : 'REJECTED',
        validatedAt: new Date(),
        comment: committeeComment,
      },
    })

    // 4️⃣ Déterminer le nouveau statut global
    let newProjectStatus: ProjectStatus | null = null
    let nextStepOrder: number | null = null

    if (isApproved) {
      // ✅ Step définit un statut global → priorité
      if (currentStep.campaignStep.setsProjectStatus) {
        newProjectStatus = currentStep.campaignStep.setsProjectStatus
      } else {
        // Sinon, dernière étape validée → completed
        const nextStep = project.stepProgress.find(
          (s) => s.campaignStep.order === currentStep.campaignStep.order + 1
        )
        if (!nextStep) newProjectStatus = 'completed'
        else nextStepOrder = nextStep.campaignStep.order
      }

      // Activer l’étape suivante si elle existe
      if (nextStepOrder) {
        const nextStep = project.stepProgress.find((s) => s.campaignStep.order === nextStepOrder)
        if (nextStep) {
          await tx.projectStepProgress.update({
            where: { id: nextStep.id },
            data: { status: 'IN_PROGRESS' },
          })
        }
      }
    } else {
      // Rejet → statut global forcé
      newProjectStatus = 'rejected'
    }

    // 5️⃣ Mise à jour du projet + historique
    if (newProjectStatus) {
      await tx.project.update({
        where: { id: project.id },
        data: {
          status: newProjectStatus,
          currentStepOrder:
            newProjectStatus === 'completed'
              ? null
              : nextStepOrder ?? currentStep.campaignStep.order,
        },
      })

      // Historique des statuts
      await tx.projectStatusHistory.create({
        data: {
          projectId: project.id,
          status: newProjectStatus,
          changedAt: new Date(),
        },
      })
    }

    //  Créer activité utilisateur
    await tx.activity.create({
      data: {
        type: isApproved ? 'PROJECT_APPROVED' : 'PROJECT_REJECTED',
        title: isApproved
          ? 'Nouvelle étape validée'
          : 'Décision du comité concernant votre projet',
        message: isApproved
          ? `Félicitations ! Votre projet <strong>${project.title}</strong> a passé avec succès l'étape "${currentStep.campaignStep.name}".`
          : `Nous vous informons que l’étape "${currentStep.campaignStep.name}" n’a pas été validée par le comité. Vous pouvez consulter les observations associées pour plus de détails.`,
        userId: project.pme.ownerId,
        projectId: project.id,
        pmeId: project.pmeId ?? undefined,
      },
    })

    // 7️⃣ Préparer l'email
    emailQueue.push({
      to: project.pme.email,
      subject: isApproved ? 'Votre projet avance' : 'Mise à jour sur votre projet',
      html: isApproved
        ? `<p>Bonjour ${project.pme.name},</p>
           <p>Bonne nouvelle ! Votre projet passe à l'étape suivante : "${currentStep.campaignStep.name}".</p>
           <p><strong>Projet :</strong> ${project.title}</p>
           ${committeeComment ? `<p><strong>Note du comité :</strong> ${committeeComment}</p>` : ''}
           <p>Cordialement,<br>L’équipe</p>`
        : `<p>Bonjour ${project.pme.name},</p>
           <p>Une étape de votre projet n’a pas été validée : "${currentStep.campaignStep.name}".</p>
           <p><strong>Projet :</strong> ${project.title}</p>
           ${committeeComment ? `<p><strong>Note du comité :</strong> ${committeeComment}</p>` : ''}
           <p>Cordialement,<br>L’équipe</p>`,
    })
  }

  // envoyer les emails après la transaction
   for (const email of emailQueue) {
    try {
      await sendEmail(email)
    } catch (err) {
      console.error(`Failed to send email to ${email.to}`, err)
      
    }
  }



})





res.status(200).json({
  message: 'Report signed and applied successfully',
  isApplied: true,
})

})
