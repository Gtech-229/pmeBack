"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.financialEntrySchema = exports.updateProjectSchema = exports.createProjectBodySchema = exports.creditRepaymentSchema = exports.creditSchema = void 0;
const enums_1 = require("../generated/prisma/enums");
const zod_1 = require("zod");
const normalize = (val) => val.replace(/\s/g, '').replace(',', '.');
const normalizeNumber = (val) => {
    if (typeof val !== "string")
        return val;
    return Number(val.replace(/\s/g, '').replace(',', '.'));
};
exports.creditSchema = zod_1.z.object({
    id: zod_1.z.string().uuid().optional(),
    borrower: zod_1.z.string().min(1, "Nom de l'emprunteur requis"),
    amount: zod_1.z.preprocess(normalizeNumber, zod_1.z.number().min(0, "Montant invalide")),
    interestRate: zod_1.z.preprocess(normalizeNumber, zod_1.z.number().min(0, "Taux invalide")),
    durationMonths: zod_1.z.preprocess(normalizeNumber, zod_1.z.number().int("Durée invalide").min(1, "La durée doit être supérieure à 0")),
    remainingBalance: zod_1.z.preprocess(normalizeNumber, zod_1.z.number().min(0, "Montant invalide")),
    startDate: zod_1.z.string({
        error: (iss) => iss.input === undefined
            ? "Date de début non renseignée"
            : "Date invalide",
    }),
    projectId: zod_1.z.string().uuid("Projet invalide").optional(),
})
    .refine(data => data.remainingBalance <= data.amount, {
    message: "Le solde restant ne peut pas dépasser le montant initial",
    path: ["remainingBalance"]
});
exports.creditRepaymentSchema = zod_1.z.object({
    amountPaid: zod_1.z.preprocess(normalizeNumber, zod_1.z.number().positive("Le montant doit être supérieur à 0")),
    paidAt: zod_1.z.string()
        .min(1, "Date de paiement requise")
        .refine(val => !isNaN(new Date(val).getTime()), "Date invalide")
        .refine(val => new Date(val) <= new Date(), "La date ne peut pas être dans le futur"),
    note: zod_1.z.string().optional(),
});
exports.createProjectBodySchema = zod_1.z.object({
    type: zod_1.z.nativeEnum(enums_1.ProjectType, {
        error: (iss) => iss.input === undefined ? "Type requis" : "Type incorrect"
    }),
    title: zod_1.z.string().min(3),
    description: zod_1.z.string().min(20),
    sectorId: zod_1.z.string().uuid().optional(),
    requestedAmount: zod_1.z.coerce
        .number()
        .min(0, "Montant demandé invalide"),
    hasCredit: zod_1.z.enum(["true", "false"]),
    credits: zod_1.z.array(exports.creditSchema).optional(),
    campaignId: zod_1.z.string().uuid()
})
    .superRefine((data, ctx) => {
    if (String(data.hasCredit) === "true" && (!data.credits || data.credits.length === 0)) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ["credits"],
            message: "Veuillez ajouter au moins un crédit",
        });
    }
});
exports.updateProjectSchema = zod_1.z.object({
    title: zod_1.z.string().min(3).max(255),
    type: zod_1.z.nativeEnum(enums_1.ProjectType, {
        error: (iss) => iss.input === undefined ? "Type requis" : "Type incorrect",
    }),
    hasCredit: zod_1.z
        .union([zod_1.z.boolean(), zod_1.z.string()])
        .transform((val) => val === true || val === "true"),
    description: zod_1.z.string().min(10).max(5000),
    requestedAmount: zod_1.z.coerce.number().positive(),
    // ----------------------
    // DOCUMENTS
    // ----------------------
    keepDocuments: zod_1.z.preprocess((val) => (typeof val === "string" ? JSON.parse(val) : val), zod_1.z.array(zod_1.z.string().uuid())).optional(),
    // ----------------------
    // CREDITS (UPDATED ✅)
    // ----------------------
    credits: zod_1.z.preprocess((val) => (typeof val === "string" ? JSON.parse(val) : val), zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid().optional(),
        borrower: zod_1.z.string().min(1, "Nom requis"),
        amount: zod_1.z.coerce.number().min(0, "Montant invalide"),
        interestRate: zod_1.z.coerce.number().min(0, "Taux invalide"),
        durationMonths: zod_1.z.coerce
            .number()
            .int()
            .min(1, "Durée invalide"),
        monthlyPayment: zod_1.z.coerce
            .number()
            .min(0, "Mensualité invalide"),
        remainingBalance: zod_1.z.coerce
            .number()
            .min(0, "Reste invalide"),
        startDate: zod_1.z.coerce.date({
            error: () => "Date de début invalide",
        }),
        endDate: zod_1.z.coerce.date({
            error: () => "Date de fin invalide",
        }),
        status: zod_1.z
            .enum(["ACTIVE", "COMPLETED", "DEFAULTED", "RESTRUCTURED"])
            .optional(),
    })
        .refine((d) => d.remainingBalance <= d.amount, {
        message: "Le reste à payer dépasse le montant",
        path: ["remainingBalance"],
    })
        .refine((d) => d.endDate > d.startDate, {
        message: "La date de fin doit être après la date de début",
        path: ["endDate"],
    }))).optional(),
    campaignId: zod_1.z.string().uuid(),
})
    .superRefine((data, ctx) => {
    const hasAnyCredit = data.credits && data.credits.length > 0;
    if (data.hasCredit && !hasAnyCredit) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ["credits"],
            message: "Veuillez ajouter au moins un crédit",
        });
    }
});
exports.financialEntrySchema = zod_1.z.object({
    type: zod_1.z.enum(["INCOME", "EXPENSE"]),
    category: zod_1.z.string().min(1, "Catégorie requise"),
    label: zod_1.z.string().min(1, "Libellé requis"),
    amount: zod_1.z.preprocess(normalizeNumber, zod_1.z.number().positive("Le montant doit être supérieur à 0")),
    date: zod_1.z.string()
        .min(1, "Date requise")
        .refine(val => !isNaN(new Date(val).getTime()), "Date invalide")
        .refine(val => new Date(val) <= new Date(), "La date ne peut pas être dans le futur"),
    note: zod_1.z.string().optional(),
});
//# sourceMappingURL=project.schema.js.map