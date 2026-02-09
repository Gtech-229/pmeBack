"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCampaignStepsSchema = exports.createCampaignSchema = exports.PROJECT_STATUSES = void 0;
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
        const num = Number(value);
        return Number.isInteger(num) && num > 0;
    }, {
        message: "Le nombre de produits doit être un entier positif ou vide",
    }),
}).refine((data) => data.start_date < data.end_date, {
    message: "End date must be after start date",
    path: ["endTime"],
});
exports.createCampaignStepsSchema = zod_1.z.object({
    name: zod_1.z.string({
        error: (iss) => iss.input === undefined ? "Le nom du step est requis" : "Champ invalide"
    }),
    order: zod_1.z.number().positive({
        error: (iss) => iss.input === undefined ? "L'order est requis" : "Champ order invalide"
    }),
    campaignId: zod_1.z.string().uuid(),
    setsProjectStatus: zod_1.z.enum(exports.PROJECT_STATUSES).optional(),
});
//# sourceMappingURL=campaign.schema.js.map