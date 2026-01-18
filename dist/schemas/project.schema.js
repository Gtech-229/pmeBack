"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProjectSchema = exports.createSubStepSchema = void 0;
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
exports.createProjectSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Le titre du projet est requis"),
    description: zod_1.z.string().min(1, "La description du projet est requise"),
    requestedAmount: zod_1.z.number().positive("Le montant demandé doit être positif"),
});
//# sourceMappingURL=project.schema.js.map