"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProjectSchema = exports.createProjectBodySchema = exports.creditSchema = exports.createSubStepSchema = void 0;
const zod_1 = require("zod");
// ==========================
// SubStep DTO & Zod Schema
// ==========================
exports.createSubStepSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Le nom de la sous-étape est requis"),
    description: zod_1.z.string().optional(),
    state: zod_1.z.enum(["pending", "in_progress", "validated", "failed"]).optional(),
    dueDate: zod_1.z.string().datetime().optional(), // ISO string
    completedAt: zod_1.z.string().datetime().optional(),
    validatedBy: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid(),
        firstName: zod_1.z.string().optional(),
        lastName: zod_1.z.string().optional(),
        role: zod_1.z.enum(["SUPER_ADMIN", "ADMIN", "PME", "FINANCIER"])
    })).optional(),
    remarks: zod_1.z.string().optional()
});
// ==========================
// Project DTO & Zod Schema
// ==========================
exports.creditSchema = zod_1.z.object({
    borrower: zod_1.z
        .string()
        .min(1, "nom dde l'emprunteur requis"),
    amount: zod_1.z.coerce
        .number()
        .min(0, "Montant invalide"),
    interestRate: zod_1.z.coerce
        .number()
        .min(0, "Taux invalide"),
    dueDate: zod_1.z.string().datetime(),
    monthlyPayment: zod_1.z.coerce
        .number()
        .min(0, "Mensualité invalide"),
    remainingBalance: zod_1.z.coerce
        .number()
        .min(0, "Reste à payer invalide"),
}).refine(d => d.remainingBalance <= d.amount, {
    message: "Le reste à payer ne peut pas dépasser le montant du crédit",
    path: ["remainingBalance"]
});
exports.createProjectBodySchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    description: zod_1.z.string().min(20),
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
    hasCredit: zod_1.z
        .union([zod_1.z.boolean(), zod_1.z.string()])
        .transform((val) => val === true || val === "true"),
    description: zod_1.z.string().min(10).max(5000),
    requestedAmount: zod_1.z.coerce.number().positive(),
    // ----------------------
    // DOCUMENTS
    // ----------------------
    existingDocuments: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid(),
        title: zod_1.z.string().min(2)
    })).optional(),
    removedDocuments: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    // ----------------------
    // CREDITS
    // ----------------------
    existingCredits: zod_1.z.array(zod_1.z.object({
        id: zod_1.z.string().uuid(),
        borrower: zod_1.z.string(),
        amount: zod_1.z.coerce.number(),
        interestRate: zod_1.z.coerce.number(),
        monthlyPayment: zod_1.z.coerce.number(),
        remainingBalance: zod_1.z.coerce.number(),
        dueDate: zod_1.z.coerce.date()
    })).optional(),
    newCredits: zod_1.z.array(exports.creditSchema).optional(),
    removedCredits: zod_1.z.array(zod_1.z.string().uuid()).optional(),
    campaignId: zod_1.z.string().uuid()
}).superRefine((data, ctx) => {
    const hasAnyCredit = (data.newCredits && data.newCredits.length > 0) ||
        (data.existingCredits && data.existingCredits.length > 0);
    if (data.hasCredit && !hasAnyCredit) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ["credits"],
            message: "Veuillez ajouter au moins un crédit",
        });
    }
});
//# sourceMappingURL=project.schema.js.map