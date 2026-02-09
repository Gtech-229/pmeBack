"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fullOnboardingSchema = exports.step2Schema = exports.step1Schema = void 0;
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
    activityField: zod_1.z
        .string()
        .min(4, {
        error: (iss) => iss.input === undefined ? "Saisissew votre secteur d'activite" : "Entree invalide"
    }),
    userRole: zod_1.z
        .string()
        .optional(),
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
exports.fullOnboardingSchema = exports.step1Schema
    .merge(exports.step2Schema);
//# sourceMappingURL=pme.onBoarding.js.map