"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateCampaignStepsSchema = exports.updateCampaignStepSchema = exports.createCampaignStepsSchema = exports.createCampaignSchema = exports.campaignCriteriaSchema = exports.PROJECT_STATUSES = void 0;
// src/schemas/campaign/createCampaign.schema.ts
const zod_1 = require("zod");
const enums_1 = require("../generated/prisma/enums");
exports.PROJECT_STATUSES = [
    "pending",
    "approved",
    "rejected",
    "funded",
    "completed",
    "failed",
];
const normalize = (val) => val.replace(/\s/g, '').replace(',', '.');
exports.campaignCriteriaSchema = zod_1.z.object({
    minAge: zod_1.z.string().optional().refine((val) => {
        if (!val || val.trim() === '')
            return true;
        const num = Number(val);
        return !isNaN(num) && num >= 0;
    }, { message: "Âge invalide" }),
    maxAge: zod_1.z.string().optional().refine((val) => {
        if (!val || val.trim() === '')
            return true;
        const num = Number(val);
        return !isNaN(num) && num >= 0;
    }, { message: "Âge invalide" }),
    gender: zod_1.z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    maritalStatus: zod_1.z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"]).optional(),
    projectType: zod_1.z.enum(["INDIVIDUAL", "COLLECTIVE"]).optional(),
    sectorIds: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    hasDisability: zod_1.z.boolean().optional(),
});
const committeeSchema = zod_1.z
    .object({
    id: zod_1.z.string().uuid(),
})
    .passthrough() // pour accepter les autres champs sans erreur
    .nullable()
    .optional();
exports.createCampaignSchema = zod_1.z.object({
    name: zod_1.z.string().min(3),
    description: zod_1.z.string().min(10),
    start_date: zod_1.z.string()
        .datetime("Invalid date format (ISO expected)"),
    end_date: zod_1.z.string()
        .datetime("Invalid date format (ISO expected)"),
    status: zod_1.z.nativeEnum(enums_1.CampaignStatus),
    targetProject: zod_1.z
        .string()
        .optional()
        .refine((value) => {
        // non défini ou vide → illimité
        if (value === undefined || value.trim() === "")
            return true;
        // doit être un nombre entier positif
        const num = Number(normalize(value));
        return Number.isInteger(num) && num > 0;
    }, {
        message: "Le nombre de produits doit être un entier positif ou vide",
    }),
    type: zod_1.z.enum(["MONO_PROJECT", "MULTI_PROJECT"]),
    criteria: exports.campaignCriteriaSchema.optional(),
}).refine((data) => {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    return start < end;
}, {
    message: "End date must be after start date",
    path: ["end_date"],
}).refine((data) => {
    const { minAge, maxAge } = data.criteria ?? {};
    if (minAge && maxAge)
        return Number(minAge) < Number(maxAge);
    return true;
}, { message: "L'âge minimum doit être inférieur à l'âge maximum", path: ["criteria", "maxAge"] });
exports.createCampaignStepsSchema = zod_1.z.object({
    name: zod_1.z.string({
        error: (iss) => iss.input === undefined ? "Le nom du step est requis" : "Champ invalide"
    }),
    order: zod_1.z.number().positive({
        error: (iss) => iss.input === undefined ? "L'order est requis" : "Champ order invalide"
    }),
    campaignId: zod_1.z.string().uuid(),
    setsProjectStatus: zod_1.z.enum(exports.PROJECT_STATUSES).optional(),
    committeeId: zod_1.z.string().uuid().optional()
});
exports.updateCampaignStepSchema = zod_1.z
    .object({
    name: zod_1.z.string().min(1).optional(),
    order: zod_1.z.number().int().positive().optional(),
    setsProjectStatus: zod_1.z
        .enum(["approved", "funded", "completed"])
        .optional()
        .nullable(),
    committee: zod_1.z.any().optional(), // adapte si tu as un vrai schema
})
    .refine((data) => data.name !== undefined ||
    data.order !== undefined ||
    data.setsProjectStatus !== undefined ||
    data.committee !== undefined, {
    message: "Au moins un champ doit être fourni pour la mise à jour",
});
exports.updateCampaignStepsSchema = zod_1.z.array(zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1),
    order: zod_1.z.number().int().positive(),
    setsProjectStatus: zod_1.z
        .enum(["approved", "funded", "completed"])
        .optional()
        .nullable(),
    committeeId: zod_1.z.string().uuid().optional(),
}));
//# sourceMappingURL=campaign.schema.js.map