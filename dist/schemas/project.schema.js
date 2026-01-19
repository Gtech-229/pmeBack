"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProjectSchema = exports.createProjectBodySchema = exports.createSubStepSchema = void 0;
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
exports.createProjectBodySchema = zod_1.z.object({
    title: zod_1.z.string().min(3),
    description: zod_1.z.string().min(20),
    requestedAmount: zod_1.z
        .string()
        .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "Montant demandé invalide")
        .transform((val) => Number(val)),
    credit: zod_1.z
        .string()
        .optional()
        .refine((val) => val === undefined || (!isNaN(Number(val)) && Number(val) >= 0), "Montant du crédit invalide")
        .transform((val) => (val !== undefined ? Number(val) : undefined)),
    hasCredit: zod_1.z.enum(["true", "false"])
});
exports.updateProjectSchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .min(3, 'Le titre doit contenir au moins 3 caractères')
        .max(255),
    description: zod_1.z
        .string()
        .min(10, 'La description est trop courte')
        .max(5000),
    requestedAmount: zod_1.z
        .coerce
        .number()
        .positive('Le montant doit être positif'),
    // ----------------------
    // Existing documents
    // ----------------------
    existingDocuments: zod_1.z
        .array(zod_1.z.object({
        id: zod_1.z.string().uuid('ID de document invalide'),
        title: zod_1.z.string().min(2, 'Intitulé invalide')
    }))
        .optional(),
    // ----------------------
    // Removed documents
    // ----------------------
    removedDocuments: zod_1.z
        .array(zod_1.z.string().uuid('ID de document invalide'))
        .optional()
});
//# sourceMappingURL=project.schema.js.map