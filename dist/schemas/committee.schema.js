"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMeetingReportSchema = exports.updateMeetingSchema = exports.createCommitteeMeetingSchema = exports.createCommitteeMemberSchema = exports.createCommitteeSchema = void 0;
const zod_1 = require("zod");
const enums_1 = require("../generated/prisma/enums");
exports.createCommitteeSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, "Le nom du comité est requis"),
    stepId: zod_1.z.string().uuid(),
    description: zod_1.z.string(),
    members: zod_1.z.array(zod_1.z.object({
        userId: zod_1.z.string().uuid(),
        memberRole: zod_1.z.nativeEnum(enums_1.CommitteeRole)
    })).min(1, "Un comité doit avoir au moins un membre")
});
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
    committeeId: zod_1.z.string().uuid(),
    date: zod_1.z.string().datetime(),
    startTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
    endTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
    location: zod_1.z.string().min(3),
});
exports.updateMeetingSchema = zod_1.z.object({
    date: zod_1.z
        .string()
        .datetime("Invalid date format (ISO expected)"),
    startTime: zod_1.z
        .string()
        .datetime("Invalid start time format (ISO expected)"),
    endTime: zod_1.z
        .string()
        .datetime("Invalid end Time format (ISO expected)"),
    location: zod_1.z
        .string()
        .min(2, "Location is required"),
    status: zod_1.z
        .enum(["PROGRAMMED", "ONGOING", "FINISHED", "POSTPONED", "CANCELED"])
        .optional(),
})
    .refine((data) => data.startTime < data.endTime, {
    message: "startTime must be before endTime",
    path: ["endTime"],
});
const projectDecisionSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid(),
    decision: zod_1.z.enum(['approved', 'rejected', 'suspended']),
    note: zod_1.z.string().optional(),
});
exports.createMeetingReportSchema = zod_1.z.object({
    presentMembers: zod_1.z
        .array(zod_1.z.object({ id: zod_1.z.string().uuid() }))
        .min(1, 'Au moins un membre doit être présent'),
    projectDecisions: zod_1.z
        .array(projectDecisionSchema)
        .min(1, 'Au moins un projet doit être discuté'),
    otherDecisions: zod_1.z.string().optional(),
});
//# sourceMappingURL=committee.schema.js.map