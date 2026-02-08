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

export const creditSchema = z.object({
  borrower : z
  .string()
  .min(1, "nom dde l'emprunteur requis"),
  amount: z.coerce
    .number()
    .min(0, "Montant invalide"),

  interestRate: z.coerce
    .number()
    .min(0, "Taux invalide"),



  dueDate: z.string().datetime(),

    monthlyPayment: z.coerce
    .number()
    .min(0, "Mensualité invalide"),
  

  remainingBalance: z.coerce
    .number()
    .min(0, "Reste à payer invalide"),
}).refine(
  d => d.remainingBalance <= d.amount,
  {
    message: "Le reste à payer ne peut pas dépasser le montant du crédit",
    path: ["remainingBalance"]
  }
)

export type CreditInput = z.infer<typeof creditSchema>

export const createProjectBodySchema = z.object({
  title: z.string().min(3),
  description: z.string().min(20),

  requestedAmount: z.coerce
    .number()
    .min(0, "Montant demandé invalide"),

  hasCredit: z.enum(["true", "false"]),

  credits: z.array(creditSchema).optional(),

  campaignId: z.string().uuid()
})
.superRefine((data, ctx) => {
  if (String(data.hasCredit) === "true" && (!data.credits || data.credits.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["credits"],
      message: "Veuillez ajouter au moins un crédit",
    })
  }
})




export const updateProjectSchema = z.object({
  title: z.string().min(3).max(255),

  
 hasCredit: z
  .union([z.boolean(), z.string()])
  .transform((val) => val === true || val === "true"),


  description: z.string().min(10).max(5000),

  
  requestedAmount: z.coerce.number().positive(),

  // ----------------------
  // DOCUMENTS
  // ----------------------
  existingDocuments: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string().min(2)
    })
  ).optional(),

  removedDocuments: z.array(z.string().uuid()).optional(),

  // ----------------------
  // CREDITS
  // ----------------------

  
  existingCredits: z.array(
    z.object({
      id: z.string().uuid(),

      
      borrower: z.string(),
      amount: z.coerce.number(),
      interestRate: z.coerce.number(),
      monthlyPayment: z.coerce.number(),
      remainingBalance: z.coerce.number(),
      dueDate: z.coerce.date()
    })
  ).optional(),

  newCredits: z.array(creditSchema).optional(),

  removedCredits: z.array(z.string().uuid()).optional(),

  
  campaignId: z.string().uuid()

}).superRefine((data, ctx) => {
  
  const hasAnyCredit =
    (data.newCredits && data.newCredits.length > 0) ||
    (data.existingCredits && data.existingCredits.length > 0)

  if (data.hasCredit && !hasAnyCredit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["credits"],
      message: "Veuillez ajouter au moins un crédit",
    })
  }
})
