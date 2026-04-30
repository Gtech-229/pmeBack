import { AuthRequest, ProjectStatus } from "types"
import asyncHandler from "express-async-handler"
import { Response } from "express"
import { createCommitteeMeetingSchema, FundDisbursementTrancheInput, generatePresenceListSchema, updateMeetingSchema } from "../schemas/committee.schema"
import { prisma } from "../lib/prisma"
import { createMeetingReportSchema } from "../schemas/committee.schema"
import { combineDateAndTime } from "../utils/combinateDateAndHour"
import { uploadToCloudinary } from "../utils/UploadToCloudinary"
import { ActivityType } from "generated/prisma/enums"
import { sendEmail } from "../utils/sendEmail"
import { newStepValidatedMessage } from "../utils/templates/emails/projectvalidated.message"
import { stepNotValidatedMessage } from "../utils/templates/emails/stepNotValidated.message"
import { formatDate } from "../utils/functions"
import { PresenceFileData } from "../types/committeeMeeting.dto"
import { generateMeetingReport } from "../utils/generateMeetingList"
import { Prisma } from "../generated/prisma/client"
import { JsonNull } from "@prisma/client/runtime/client"


/**
 * @description  Create a new committee
 * @route POST /committee/meetings
 * @access  Admin
 * **/ 

export const createMeeting = asyncHandler(
  async (req: AuthRequest, res: Response) => {

    if (!req.user || !["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
      res.status(401)
      throw new Error("Unauthorized")
    }

    const {committeeId} = req.params
    if(!committeeId) {
      res.status(404);
      throw new Error("Aucun comite associé")
    }

    const data = createCommitteeMeetingSchema.parse(req.body)
    const {date, startTime, endTime, location } = data

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
        startTime ,
        endTime ,
        location,
      },
    })

    res.status(201).json(meeting)
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
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        location: true,
        createdAt: true,
        status: true,
        updatedAt : true,
        presences : true, 
        report : true
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
      updatedAt : m.updatedAt.toISOString(),
      presences : m.presences,
      report : m.report
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
            },

            documents : true

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
            },
            step : true
          }
        }
      },
      
    });

    if (!meeting) {
      res.status(404);
      throw new Error("Meeting not found");
    }


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
 * @route PATCH/committee/meetings/:meetingId
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

   const isMember = meeting.committee.members.some(m => m.userId === req.user!.id)
if (!isMember) {
  res.status(403)
  throw new Error("You are not allowed to update this meeting")
}

if (meeting.status === "FINISHED") {
  res.status(400)
  throw new Error("Cannot update a finished meeting")
}

// Status transitions that require secretary role
const statusRequiresSecretary = ["ONGOING", "CANCELED", "POSTPONED"]

if (data.status && statusRequiresSecretary.includes(data.status)) {
  const member = meeting.committee.members.find(m => m.userId === req.user!.id)

  if (member?.memberRole !== "secretary") {
    res.status(403)
    throw new Error("Seul le secrétaire peut modifier le statut de la réunion")
  }
}

// Block invalid status transitions
if (data.status) {
  const validTransitions: Record<string, string[]> = {
    PROGRAMMED: ["ONGOING", "POSTPONED", "CANCELED"],
    ONGOING:    ["FINISHED", "POSTPONED", "CANCELED"],
    POSTPONED:  ["PROGRAMMED", "CANCELED"],
    CANCELED:   [], // terminal
    FINISHED:   [], // terminal — already blocked above
  }

  const allowed = validTransitions[meeting.status] ?? []
  if (!allowed.includes(data.status)) {
    res.status(400)
    throw new Error(
      `Transition invalide : ${meeting.status} → ${data.status}`
    )
  }
}

const updatedMeeting = await prisma.committeeMeeting.update({
  where: { id: meetingId },
  data: {
    ...(data.date ? { date: new Date(data.date) } : {}),
    ...(data.startTime ? { startTime: data.startTime } : {}),
    ...(data.endTime ? { endTime: data.endTime } : {}),
    ...(data.location ? { location: data.location } : {}),
    ...(data.status ? { status: data.status } : {}),
  }
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
      res.status(401)
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
    ...(data.projectDecisions && data.projectDecisions.length > 0 && {
      projectDecisions: {
        create: data.projectDecisions.map(pd => ({
          project: { connect: { id: pd.projectId } },
          note: pd.note ?? '',
          decision: pd.decision,
           tranchesPayload: pd.funding?.tranches ?? JsonNull
        }))
      }
    })
  },
})

  // ── Disbursement tranches ──
  const fundingDecisions = data.projectDecisions?.filter(
    pd => pd.decision === "approved" && pd.funding?.tranches && pd.funding.tranches.length > 0
  ) ?? []



  

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
      size : file.size,
     reportId : report.id,
     mimeType : file.mimetype
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
 * @route POST /committee/meetings/:meetingId/sign
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
  throw new Error('Seuls les membres présents sont autorisés à signer le rapport')
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

const updatedSignatures = await prisma.reportSignature.findMany({
  where: { reportId: report.id }
})

/**
 * Vérifier si tous les présents ont signé
 */
const presentMemberIds = report.meeting.presences.map(p => p.memberId)

// Check every present member has signed 
const allSigned = presentMemberIds.every(memberId =>
  updatedSignatures.some(s => s.memberId === memberId)
)

if (!allSigned) {
 res.status(200).json({
    message: 'Report signed successfully',
    isApplied: false,
  })

  return
}

/**
 * TRANSACTION
 * - appliquer le rapport
 * - appliquer toutes les décisions
 */

const decisions = await prisma.meetingProjectDecision.findMany({
  where: { reportId: report.id },
  
})

const projects = await Promise.all(
  decisions.map(d =>
    prisma.project.findUnique({
      where: { id: d.projectId },
      include: {
        stepProgress: {
          include: { campaignStep: true },
          orderBy: { campaignStep: { order: 'asc' } }
        },
        pme: true,
        campaign: true,
        
      },
    })
  )
)

// ── 2. Prepare all write operations data before transaction ──
type WriteOp = {
  currentStepId: string
  isApproved: boolean
  committeeComment: string | null
  newProjectStatus: ProjectStatus | null
  nextStepId: string | null
  projectId: string
  nextStepOrder: number | null
  currentStepOrder: number
  project: NonNullable<typeof projects[0]>
  decision: typeof decisions[0]
}

const writeOps: WriteOp[] = []

for (const decision of decisions) {
  const project = projects.find(p => p?.id === decision.projectId)
  if (!project) continue

 const currentStep = project.stepProgress.find(s => s.status === 'IN_PROGRESS')
  if (!currentStep) continue

 

  const isApproved = decision.decision === 'approved'
  const committeeComment = decision.note ?? null

  let newProjectStatus: ProjectStatus | null = null
  let nextStepOrder: number | null = null
  let nextStepId: string | null = null

if (isApproved) {
  const nextStep = project.stepProgress.find(
    s => s.campaignStep.order === currentStep.campaignStep.order + 1
  )

  if (currentStep.campaignStep.setsProjectStatus) {
    newProjectStatus = currentStep.campaignStep.setsProjectStatus
  }

  

  if (nextStep) {
    nextStepOrder = nextStep.campaignStep.order // ← always set
    nextStepId = nextStep.id
  } else {
    if (!newProjectStatus) {
      newProjectStatus = 'completed'
    }
    nextStepOrder = null // ← explicitly null when no next step
  }
} else {
  newProjectStatus = 'rejected'
  nextStepOrder = null
}

  writeOps.push({
    currentStepId: currentStep.id,
    isApproved,
    committeeComment,
    newProjectStatus,
    nextStepId,
    nextStepOrder,
    currentStepOrder: currentStep.campaignStep.order,
    projectId: project.id,
    project,
    decision,
  })
}

// ── 3. Transaction — pure DB writes only, no fetches, no emails ──
await prisma.$transaction(
  async (tx) => {
    const updated = await tx.meetingReport.updateMany({
      where: { id: report.id, status: 'DRAFT' },
      data: { status: 'APPLIED' },
    })

    if (updated.count === 0) return

    for (const op of writeOps) {
      // Update current step
      await tx.projectStepProgress.update({
        where: { id: op.currentStepId },
        data: {
          status: op.isApproved ? 'APPROVED' : 'REJECTED',
          validatedAt: new Date(),
          comment: op.committeeComment,
        },
      })

      // when newProjectStatus === 'funded'
if (op.newProjectStatus === 'funded') {
  const tranchesPayload = op.decision.tranchesPayload as FundDisbursementTrancheInput[] | null
  
  if (tranchesPayload && tranchesPayload.length > 0) {
    await tx.fundDisbursement.createMany({
      data: tranchesPayload.map(t => ({
        projectId: op.projectId,
        decisionId: op.decision.id,
        amount: Number(t.amount),
        plannedDate: new Date(t.plannedDate),
        note: t.note ?? null,
        isDisbursed: false,
      }))
    })
  }
}

      // Activate next step
      if (op.nextStepId) {
        await tx.projectStepProgress.update({
          where: { id: op.nextStepId },
          data: { status: 'IN_PROGRESS' },
        })
      }

      // Update project status
      if (op.newProjectStatus) {
       await tx.project.update({
            where: { id: op.projectId },
            data: {
              // always update currentStepOrder when approved
              ...(op.isApproved && {
                currentStepOrder: op.nextStepOrder ?? null
              }),
              // only update status when explicitly set
              ...(op.newProjectStatus && {
                status: op.newProjectStatus,
              }),
            },
          })

                if (op.newProjectStatus) {
              await tx.projectStatusHistory.create({
                data: {
                  projectId: op.projectId,
                  status: op.newProjectStatus,
                  changedAt: new Date(),
                },
              })
            }
      }

      // Activity
      await tx.activity.create({
        data: {
          type: op.isApproved ? 'STEP_APPROVED' : 'STEP_REJECTED',
          title: op.isApproved
            ? 'Nouvelle étape validée'
            : 'Décision du comité concernant votre projet',
          message: op.isApproved
            ? `Félicitations ! Votre projet ${op.project.title} a passé avec succès l'étape "${op.project.stepProgress.find(s => s.id === op.currentStepId)?.campaignStep.name}".`
            : `Nous vous informons que l'étape n'a pas été validée par le comité.`,
          userId: op.project.pme.ownerId,
          projectId: op.projectId,
          pmeId: op.project.pmeId ?? undefined,
        },
      })
    }
  },
  {
    timeout: 15000 
  }
)

// ── 4. Send emails AFTER transaction commits ──
const emailQueue = await Promise.all(
  writeOps.map(async (op) => {
    const stepName = op.project.stepProgress
      .find(s => s.id === op.currentStepId)?.campaignStep.name ?? ''

    return {
      to: op.project.pme.email,
      subject: op.isApproved ? 'Nouvelle étape validée' : 'Étape non validée',
      html: op.isApproved
        ? await newStepValidatedMessage(op.project.title, stepName, formatDate(new Date()))
        : await stepNotValidatedMessage(op.project.title, stepName, formatDate(new Date())),
    }
  })
)

// Fire and forget — don't let email failures block the response
for (const email of emailQueue) {
  sendEmail(email).catch(err =>
    console.error(`Failed to send email to ${email.to}`, err)
  )
}





res.status(200).json({
  message: 'Report signed and applied successfully',
  isApplied: true,
})

})



/**
 * @description Generate a meeting presence list
 * @route    POST /committee/meetings/:meetingId/generateAttendance
 * @access  Committee secretary
 * **/ 
export const generatePresenceList = asyncHandler(async(req : AuthRequest, res :Response) =>{
   if(!req.user?.id || !["ADMIN","SUPER_ADMIN"].includes(req.user?.role)){
    res.status(401)
    throw new Error("Unauthorized")
   }

const {meetingId} = req.params

if(!meetingId){
  res.status(400);
  throw new Error("Id de la reunion non specifiée")
}

const meeting = await prisma.committeeMeeting.findFirst({
  where: {
    id: meetingId,
    committee: {
      members: {
        some: {
          userId: req.user.id,
          memberRole: "secretary"
        }
      }
    },
    status : 'ONGOING'
  },
  include: {
    committee: {include : {members : {include : {user : true}}, campaign : true}},
    
   
  }
})

if (!meeting) {
  res.status(404)
  throw new Error("Réunion introuvable ou accès non autorisé")
}


const parsed = generatePresenceListSchema.safeParse(req.body)

if(!parsed.success){
  res.status(400)
  throw parsed.error
  
}



const members = meeting.committee.members.filter(m => parsed.data.presentMemberIds.includes(m.id))






const data: PresenceFileData = {
    presentMembers: members.map(m => ({
      id: m.id,
      role: m.memberRole,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
    })),
    meetingData: {id : meeting.id, startTime : meeting.startTime, endTime : meeting.endTime, location : meeting.location, committee : meeting.committee, date : meeting.date} // already includes committee + campaign from your include
  }

  const pdfBuffer = await generateMeetingReport(data, )

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="presence-${meeting.id}.pdf"`)
  res.send(pdfBuffer)

})