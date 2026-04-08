"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePresenceListSchema = exports.updateCommitteeMemberSchema = exports.createMeetingReportSchema = exports.projectDecisionSchema = exports.fundingDecisionSchema = exports.fundDisbursementTrancheSchema = exports.updateMeetingSchema = exports.createCommitteeMeetingSchema = exports.createCommitteeMemberSchema = exports.updateCommitteeSchema = exports.createCommitteeSchema = void 0;
const zod_1 = require("zod");
const normalizeNumber = (val) => {
    if (typeof val !== "string")
        return val;
    return Number(val.replace(/\s/g, '').replace(',', '.'));
};
exports.createCommitteeSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, "Le nom du comité est requis"),
    stepId: zod_1.z.string().uuid().nullable().optional(),
    description: zod_1.z.string(),
});
exports.updateCommitteeSchema = exports.createCommitteeSchema.partial();
exports.createCommitteeMemberSchema = zod_1.z.object({
    committeeId: zod_1.z.string().uuid("Invalid committee id"),
    userId: zod_1.z.string().uuid("Invalid user id"),
    memberRole: zod_1.z.enum([
        "president",
        "vice_president",
        "member",
        "secretary",
    ]),
});
exports.createCommitteeMeetingSchema = zod_1.z.object({
    date: zod_1.z.string().datetime(),
    startTime: zod_1.z.string().datetime("Invalid start time format (ISO expected)"),
    endTime: zod_1.z.string().datetime("Invalid end time format (ISO expected)"),
    location: zod_1.z.string().min(3),
});
exports.updateMeetingSchema = zod_1.z.object({
    date: zod_1.z.string().datetime("Invalid date format").optional(),
    startTime: zod_1.z.string().datetime("Invalid start time format").optional(),
    endTime: zod_1.z.string().datetime("Invalid end time format").optional(),
    location: zod_1.z.string().min(2, "Location is required").optional(),
    status: zod_1.z.enum(["PROGRAMMED", "ONGOING", "FINISHED", "POSTPONED", "CANCELED"]).optional(),
})
    .refine((data) => {
    if (data.startTime && data.endTime)
        return data.startTime < data.endTime;
    return true;
}, { message: "startTime must be before endTime", path: ["endTime"] });
// Funding
exports.fundDisbursementTrancheSchema = zod_1.z.object({
    amount: zod_1.z.preprocess(normalizeNumber, zod_1.z.number().min(0, "Montant invalide")),
    plannedDate: zod_1.z.string()
        .min(1, "Date prévue requise")
        .refine(val => !isNaN(new Date(val).getTime()), "Date invalide")
        .refine(val => new Date(val) >= new Date(), "La date prévue doit être dans le futur"),
    note: zod_1.z.string().optional(),
});
exports.fundingDecisionSchema = zod_1.z.object({
    tranches: zod_1.z.array(exports.fundDisbursementTrancheSchema)
        .min(1, "Au moins une tranche est requise")
        .refine(tranches => {
        // dates must be in ascending order
        for (let i = 1; i < tranches.length; i++) {
            const curr = tranches[i];
            const prev = tranches[i - 1];
            if (!curr || !prev)
                return false;
            if (new Date(curr.plannedDate) <= new Date(prev.plannedDate)) {
                return false;
            }
        }
        return true;
    }, "Les dates des tranches doivent être en ordre croissant"),
});
/**
 * Projet discuté + décision
 */
exports.projectDecisionSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid(),
    decision: zod_1.z.enum(["approved", "rejected"]),
    note: zod_1.z.string().optional(),
    funding: exports.fundingDecisionSchema.optional(),
});
exports.createMeetingReportSchema = zod_1.z.object({
    presentMembers: zod_1.z
        .array(zod_1.z.object({ id: zod_1.z.string().uuid() }))
        .min(1, 'Au moins un membre doit être présent'),
    projectDecisions: zod_1.z
        .array(exports.projectDecisionSchema)
        .optional(),
    otherDecisions: zod_1.z.string().optional(),
});
exports.updateCommitteeMemberSchema = zod_1.z.object({
    memberRole: zod_1.z.enum([
        "president",
        "vice_president",
        "secretary",
    ]),
});
exports.generatePresenceListSchema = zod_1.z.object({
    presentMemberIds: zod_1.z
        .array(zod_1.z.string().uuid())
        .min(1, 'Au moins un membre doit être présent'),
});
//# sourceMappingURL=committee.schema.js.map