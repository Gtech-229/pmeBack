"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPMESchema = exports.fullOnboardingSchema = exports.step4Schema = exports.promoterSchema = exports.step2Schema = exports.step1Schema = void 0;
const zod_1 = require("zod");
const admin_division_1 = require("../utils/admin-division");
exports.step1Schema = zod_1.z.object({
    name: zod_1.z
        .string({
        error: (iss) => iss.input === undefined ? "Le nom est requis" : "Invalid input."
    })
        .min(2, {
        error: "Nom trop court"
    }),
    type: zod_1.z
        .enum(["non_profit", "for_profit", "ong"], {
        error: (iss) => iss.input === undefined ? "Selectionnez un type" : "Invalid input."
    }),
    size: zod_1.z
        .enum(["small", "middle"], { error: (iss) => iss.input === undefined ? "Selectionnez une taille " : "Invalid input." }),
    description: zod_1.z
        .string({ error: (iss) => iss.input === undefined ? "Une description devotre entreprise est requise" : "Invalid input" })
        .min(30, { error: "Trop court" }),
});
exports.step2Schema = zod_1.z.object({
    email: zod_1.z.string({
        error: (iss) => iss.input === undefined
            ? "L’email est requis"
            : "Email invalide",
    }).email("Format d’email invalide"),
    phone: zod_1.z.string({
        error: (iss) => iss.input === undefined
            ? "Le numéro de téléphone est requis"
            : "Numéro invalide",
    }).min(6, "Le numéro doit contenir au moins 6 chiffres"),
    website: zod_1.z
        .string({
        error: "URL invalide",
    })
        .url("URL invalide")
        .optional()
        .or(zod_1.z.literal("")),
    country: zod_1.z.string({
        error: (iss) => iss.input === undefined
            ? "Le pays est requis"
            : "Valeur invalide",
    }).min(2, "Nom du pays trop court"),
    currency: zod_1.z.string(),
    administrative: zod_1.z.record(zod_1.z.string(), zod_1.z.string().min(2, "Champ requis")),
    city: zod_1.z.string().optional(),
    address: zod_1.z.string({
        error: (iss) => iss.input === undefined
            ? "L’adresse est requise"
            : "Valeur invalide",
    }).min(4, "Adresse trop courte"),
    logoUrl: zod_1.z
        .string({
        error: "URL du logo invalide",
    })
        .url("URL du logo invalide")
        .optional()
        .or(zod_1.z.literal("")),
}).superRefine((data, ctx) => {
    const config = admin_division_1.AFRICA_FR_ADMIN_DIVISIONS[data.country];
    if (!config)
        return;
    for (const level of config.levels) {
        if (!data.administrative?.[level.key]) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ["administrative", level.key],
                message: `${level.label} requis`,
            });
        }
    }
});
exports.promoterSchema = zod_1.z.object({
    gender: zod_1.z.enum(["MALE", "FEMALE", "OTHER"], {
        error: (iss) => iss.input === undefined ? "Sélectionnez un genre" : "Invalid input"
    }),
    birthDate: zod_1.z.string({
        error: (iss) => iss.input === undefined ? "Date de naissance requise" : "Invalid input"
    }),
    maritalStatus: zod_1.z.enum(["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"], {
        error: (iss) => iss.input === undefined ? "Sélectionnez une situation" : "Invalid input"
    }),
    hasDisability: zod_1.z.boolean(),
    disabilityType: zod_1.z.string().optional(),
    role: zod_1.z.string().optional()
}).superRefine((data, ctx) => {
    if (data.hasDisability && (!data.disabilityType || !data.disabilityType.trim())) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ["disabilityType"],
            message: "Veuillez préciser le type de handicap",
        });
    }
});
exports.step4Schema = zod_1.z.object({
    promoter: exports.promoterSchema
});
exports.fullOnboardingSchema = exports.step1Schema
    .merge(exports.step4Schema)
    .merge(exports.step2Schema);
exports.createPMESchema = exports.fullOnboardingSchema.strict();
//# sourceMappingURL=pme.onBoarding.js.map