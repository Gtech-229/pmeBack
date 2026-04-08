import { z } from "zod"
import { CommitteeRole } from "../generated/prisma/enums"

const normalizeNumber = (val: unknown) => {
  if (typeof val !== "string") return val
  return Number(val.replace(/\s/g, '').replace(',', '.'))
}

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

// Funding
export const fundDisbursementTrancheSchema = z.object({
  amount: z.preprocess(
      normalizeNumber,
      z.number().min(0, "Montant invalide")
    ),
  plannedDate: z.string()
    .min(1, "Date prévue requise")
    .refine(val => !isNaN(new Date(val).getTime()), "Date invalide")
    .refine(val => new Date(val) >= new Date(), "La date prévue doit être dans le futur"),
  note: z.string().optional(),
})

export type FundDisbursementTrancheInput = z.infer<typeof fundDisbursementTrancheSchema>

export const fundingDecisionSchema = z.object({
  tranches: z.array(fundDisbursementTrancheSchema)
    .min(1, "Au moins une tranche est requise")
    .refine(
      tranches => {
        // dates must be in ascending order
        for (let i = 1; i < tranches.length; i++) {
            const curr = tranches[i]
            const prev = tranches[i - 1]

            if (!curr || !prev) return false

            if (new Date(curr.plannedDate) <= new Date(prev.plannedDate)) {
              return false
            }
          }
        return true
      },
      "Les dates des tranches doivent être en ordre croissant"
    ),
})



/**
 * Projet discuté + décision
 */
export const projectDecisionSchema = z.object({
  projectId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  note: z.string().optional(),
  funding: fundingDecisionSchema.optional(),
})


export const createMeetingReportSchema = z.object({
   
  presentMembers: z
  .array(z.object({ id: z.string().uuid() }))
  .min(1, 'Au moins un membre doit être présent'),

    projectDecisions: z
    .array(projectDecisionSchema)
    .optional(),

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


export const generatePresenceListSchema = z.object({
presentMemberIds: z
  .array(z.string().uuid())
  .min(1, 'Au moins un membre doit être présent'),

})


