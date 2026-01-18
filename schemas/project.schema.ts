import { z } from "zod";

// ==========================
// SubStep DTO & Zod Schema
// ==========================

export const createSubStepSchema = z.object({

  name: z.string().min(1, "Le nom de la sous-étape est requis"),
  description: z.string().optional(),
  state: z.enum(["pending", "in_progress", "validated", "failed"]).optional(),
  dueDate: z.string().datetime().optional(),       // ISO string
  completedAt: z.string().datetime().optional(),
  validatedBy: z.array(z.object({
    id: z.string().uuid(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    role: z.enum(["SUPER_ADMIN" , "ADMIN" , "PME" , "FINANCIER"])
  })).optional(),
  remarks: z.string().optional()
});

export type SubStepDTO = z.infer<typeof createSubStepSchema>;

// ==========================
// Project DTO & Zod Schema
// ==========================

export const createProjectBodySchema = z.object({
  title: z.string().min(3),

  description: z.string().min(20),

  requestedAmount: z
    .string()
    .refine(
      (val) => !isNaN(Number(val)) && Number(val) >= 0,
      "Montant demandé invalide"
    )
    .transform((val) => Number(val)),

  credit: z
    .string()
    .optional()
    .refine(
      (val) => val === undefined || (!isNaN(Number(val)) && Number(val) >= 0),
      "Montant du crédit invalide"
    )
    .transform((val) => (val !== undefined ? Number(val) : undefined)),
    hasCredit : z.enum(["true","false"])
});


export type CreateProjectBodyDTO = z.infer<
  typeof createProjectBodySchema
>



export const updateProjectSchema = z.object({
  title: z
    .string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(255),

  description: z
    .string()
    .min(10, 'La description est trop courte')
    .max(5000),

  requestedAmount: z
    .coerce
    .number()
    .positive('Le montant doit être positif'),

  // ----------------------
  // Existing documents
  // ----------------------
  existingDocuments: z
    .array(
      z.object({
        id: z.string().uuid('ID de document invalide'),
        title: z.string().min(2, 'Intitulé invalide')
      })
    )
    .optional(),

  // ----------------------
  // Removed documents
  // ----------------------
  removedDocuments: z
    .array(z.string().uuid('ID de document invalide'))
    .optional()
})


