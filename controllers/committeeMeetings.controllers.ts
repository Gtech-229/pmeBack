import { AuthRequest, ProjectStatus } from "types"
import asyncHandler from "express-async-handler"
import { Response } from "express"
import { createCommitteeMeetingSchema, updateMeetingSchema } from "../schemas/committee.schema"
import { prisma } from "../lib/prisma"
import { createMeetingReportSchema } from "../schemas/committee.schema"
import { combineDateAndTime } from "../utils/combinateDateAndHour"
import { uploadToCloudinary } from "../utils/UploadToCloudinary"
import { ActivityType } from "generated/prisma/enums"

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

    if (!committeeMember) {
      res.status(403)
      throw new Error("User is not a committee member")
    }

    //  Secrétaire uniquement
    if (committeeMember.memberRole !== "secretary") {
      res.status(403)
      throw new Error("Only the committee secretary can submit the meeting report")
    }

    //  Empêcher doublon
    if (meeting.report) {
      res.status(409)
      throw new Error("Meeting report already exists")
    }



   

   

    // Valider les membres presents
    // vérifier que les membres appartiennent bien au comité
const validMembers = await prisma.committeeMember.findMany({
  where: {
    id: { in: data.presentMembers.map(m => m.id) },
    committeeId: meeting.committeeId,
  },
})



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


/****/ 


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
   throw new Error('Meeting report not found')

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
  throw new Error('Only present members can sign the report')
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
  throw new Error('You have already signed this report')
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
  /**
   * 1. Mettre à jour le statut du rapport
   */
  await tx.meetingReport.update({
    where: { id: report.id },
    data: { status: 'APPLIED' },
  })

  /**
   * 2. Récupérer les décisions de projets
   */
  const decisions = await tx.meetingProjectDecision.findMany({
    where: { reportId: report.id },
  })

  /**
   * 3. Appliquer les décisions projet par projet
   */

  const emailQueue: {
  to: string
  subject: string
  html: string
}[] = []

 for (const decision of decisions) {
  let newStatus: ProjectStatus | null = null
  let activityType: ActivityType | null = null
  let activityTitle = ''
  let activityMessage = ''

  switch (decision.decision) {
    case 'approved':
      newStatus = 'approved'
      activityType = 'PROJECT_APPROVED'
      activityTitle = 'Projet approuvé'
      activityMessage = 'Votre projet a été approuvé suite à la réunion du comité.'
      break

    case 'rejected':
      newStatus = 'rejected'
      activityType = 'PROJECT_REJECTED'
      activityTitle = 'Projet rejeté'
      activityMessage = 'Votre projet a été rejeté suite à la réunion du comité.'
      break
  }

  if (!newStatus || !activityType) continue

  /**
   * 1. Mettre à jour le projet
   */
  const project = await tx.project.update({
    where: { id: decision.projectId },
    data: { status: newStatus },
    include: {
      pme: true
      
    },
  })

  /**
   * 2. Créer l'activité
   */
  await tx.activity.create({
    data: {
      type: activityType,
      title: activityTitle,
      message: activityMessage,
      userId: project.pme.ownerId,
      projectId: project.id,
      pmeId: project.pmeId ?? undefined,
    },
  })

  /**
   * 3. Préparer email (envoyé après la transaction)
   */
  emailQueue.push({
    to: project.pme.email,
    subject: activityTitle,
    html: `
      <p>Bonjour ${project.pme.name},</p>
      <p>${activityMessage}</p>
      <p>
        Projet concerné : <strong>${project.title}</strong>
      </p>
      <p>Cordialement,<br/>L’équipe</p>
    `,
  })
}


  /**
   * 4. (OPTIONNEL) Historique / audit
   */
  // await tx.projectHistory.createMany(...)
})

res.status(200).json({
  message: 'Report signed and applied successfully',
  isApplied: true,
})

})
