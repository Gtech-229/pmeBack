import { z } from "zod"
import { CommitteeRole } from "../generated/prisma/enums"

export const createCommitteeSchema = z.object({
  name: z.string().min(3, "Le nom du comité est requis"),
  description: z.string(),
  members: z.array(
    z.object({
      userId: z.string().uuid(),
      memberRole: z.nativeEnum(CommitteeRole)
    })
  ).min(1, "Un comité doit avoir au moins un membre")
})

export type CreateCommitteeInput = z.infer<typeof createCommitteeSchema>

export const createCommitteeMemberSchema = z.object({
  
  committeeId: z.string().uuid("Invalid committee id"),
  userId: z.string().uuid("Invalid user id"),
  memberRole: z.enum([
    "president",
    "vice_president",
    "member",
    "secretary",
  ]),
 
});

export type CreateCommitteeMemberInput = z.infer<
  typeof createCommitteeMemberSchema
>;



export const createCommitteeMeetingSchema = z.object({
  committeeId: z.string().uuid(),
  date: z.string().datetime(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  location: z.string().min(3),
})





export const updateMeetingSchema = z.object({
  date: z
    .string()
    .datetime("Invalid date format (ISO expected)"),

  startTime: z
    .string()
    .datetime("Invalid start time format (ISO expected)"),

  endTime: z
    .string()
    .datetime("Invalid end Time format (ISO expected)"),

  location: z
    .string()
    .min(2, "Location is required"),

  status: z
    .enum(["PROGRAMMED", "ONGOING", "FINISHED", "POSTPONED", "CANCELED"])
    .optional(),
})
.refine(
  (data) => data.startTime < data.endTime,
  {
    message: "startTime must be before endTime",
    path: ["endTime"],
  }
)

const projectDecisionSchema = z.object({
  projectId: z.string().uuid(),
  decision: z.enum(['approved', 'rejected', 'suspended']),
  note: z.string().optional(),
})


export const createMeetingReportSchema = z.object({
   
  presentMembers: z
  .array(z.object({ id: z.string().uuid() }))
  .min(1, 'Au moins un membre doit être présent'),

    projectDecisions: z
    .array(projectDecisionSchema)
    .min(1, 'Au moins un projet doit être discuté'),

    otherDecisions : z.string().optional(),

    

})

export type CreateMeetingReportType  = z.infer< typeof createMeetingReportSchema>




