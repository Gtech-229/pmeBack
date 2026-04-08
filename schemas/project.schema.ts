import { issue } from "zod/v4/core/util.cjs";
import { ProjectType } from "../generated/prisma/enums";
import { z } from "zod";

const normalize = (val: string) =>
  val.replace(/\s/g, '').replace(',', '.')

const normalizeNumber = (val: unknown) => {
  if (typeof val !== "string") return val
  return Number(val.replace(/\s/g, '').replace(',', '.'))
}

export const creditSchema = z.object({
  id: z.string().uuid().optional(),
  borrower: z.string().min(1, "Nom de l'emprunteur requis"),
  amount: z.preprocess(
    normalizeNumber,
    z.number().min(0, "Montant invalide")
  ),
  interestRate: z.preprocess(
    normalizeNumber,
    z.number().min(0, "Taux invalide")
  ),
  durationMonths: z.preprocess(
    normalizeNumber,
    z.number().int("Durée invalide").min(1, "La durée doit être supérieure à 0")
  ),
  remainingBalance: z.preprocess(
    normalizeNumber,
    z.number().min(0, "Montant invalide")
  ),
  startDate: z.string({
    error: (iss) =>
      iss.input === undefined
        ? "Date de début non renseignée"
        : "Date invalide",
  }),
  projectId: z.string().uuid("Projet invalide").optional(),
})
.refine(data => data.remainingBalance <= data.amount, {
  message: "Le solde restant ne peut pas dépasser le montant initial",
  path: ["remainingBalance"]
})


export const creditRepaymentSchema = z.object({
  amountPaid: z.preprocess(
    normalizeNumber,
    z.number().positive("Le montant doit être supérieur à 0")
  ),
  paidAt: z.string()
    .min(1, "Date de paiement requise")
    .refine(val => !isNaN(new Date(val).getTime()), "Date invalide")
    .refine(val => new Date(val) <= new Date(), "La date ne peut pas être dans le futur"),
  note: z.string().optional(),
})







export type CreditInput = z.infer<typeof creditSchema>



export const createProjectBodySchema = z.object({
  type : z.nativeEnum(ProjectType , {
      error : (iss) => iss.input === undefined ? "Type requis" : "Type incorrect"
    }),
  title: z.string().min(3),
  description: z.string().min(20),
  sectorId : z.string().uuid().optional(),

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

  type: z.nativeEnum(ProjectType, {
    error: (iss) =>
      iss.input === undefined ? "Type requis" : "Type incorrect",
  }),

  hasCredit: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === "true"),

  description: z.string().min(10).max(5000),

  requestedAmount: z.coerce.number().positive(),

  // ----------------------
  // DOCUMENTS
  // ----------------------
  keepDocuments: z.preprocess(
    (val) => (typeof val === "string" ? JSON.parse(val) : val),
    z.array(z.string().uuid())
  ).optional(),

  // ----------------------
  // CREDITS (UPDATED ✅)
  // ----------------------
  credits: z.preprocess(
    (val) => (typeof val === "string" ? JSON.parse(val) : val),
    z.array(
      z.object({
        id: z.string().uuid().optional(),

        borrower: z.string().min(1, "Nom requis"),

        amount: z.coerce.number().min(0, "Montant invalide"),

        interestRate: z.coerce.number().min(0, "Taux invalide"),

        durationMonths: z.coerce
          .number()
          .int()
          .min(1, "Durée invalide"),

        monthlyPayment: z.coerce
          .number()
          .min(0, "Mensualité invalide"),

        remainingBalance: z.coerce
          .number()
          .min(0, "Reste invalide"),

        startDate: z.coerce.date({
          error: () => "Date de début invalide",
        }),

        endDate: z.coerce.date({
          error: () => "Date de fin invalide",
        }),

        status: z
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
      })
    )
  ).optional(),

  campaignId: z.string().uuid(),
})
.superRefine((data, ctx) => {
  const hasAnyCredit = data.credits && data.credits.length > 0;

  if (data.hasCredit && !hasAnyCredit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["credits"],
      message: "Veuillez ajouter au moins un crédit",
    });
  }
});


export const financialEntrySchema = z.object({
  type: z.enum(["INCOME", "EXPENSE"]),
  category: z.string().min(1, "Catégorie requise"),
  label: z.string().min(1, "Libellé requis"),
  amount: z.preprocess(
    normalizeNumber,
    z.number().positive("Le montant doit être supérieur à 0")
  ),
  date: z.string()
    .min(1, "Date requise")
    .refine(val => !isNaN(new Date(val).getTime()), "Date invalide")
    .refine(val => new Date(val) <= new Date(), "La date ne peut pas être dans le futur"),
  note: z.string().optional(),
})