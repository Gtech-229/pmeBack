import { z } from "zod"
import { CommitteeRole } from "../generated/prisma/enums"

export const createCommitteeSchema = z.object({
  name: z.string().min(3, "Le nom du comité est requis"),
  stepId: z.string().uuid().nullable().optional(),
  description: z.string(),
 
})

export type CreateCommitteeInput = z.infer<typeof createCommitteeSchema>

export const updateCommitteeSchema = createCommitteeSchema.partial()
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
  date: z.string().datetime(),
  startTime: z.string().datetime("Invalid start time format (ISO expected)"),
  endTime:  z.string().datetime("Invalid end time format (ISO expected)"),
  location: z.string().min(3),
})







export const updateMeetingSchema = z.object({
  date: z.string().datetime("Invalid date format").optional(),
  startTime: z.string().datetime("Invalid start time format").optional(),
  endTime: z.string().datetime("Invalid end time format").optional(),
  location: z.string().min(2, "Location is required").optional(),
  status: z.enum(["PROGRAMMED", "ONGOING", "FINISHED", "POSTPONED", "CANCELED"]).optional(),
})
.refine(
  (data) => {
    if (data.startTime && data.endTime) return data.startTime < data.endTime
    return true
  },
  { message: "startTime must be before endTime", path: ["endTime"] }
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


export const updateCommitteeMemberSchema = z.object({
  memberRole: z.enum([
    "president",
    "vice_president",
    "secretary",
  ]),
});

export type updateCommitteeMemberType = z.infer<typeof updateCommitteeMemberSchema>




