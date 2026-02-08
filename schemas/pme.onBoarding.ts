import { z } from "zod"
import { AFRICA_FR_ADMIN_DIVISIONS } from "../utils/admin-division"


export const step1Schema = z.object({
  name: z
    .string({
       error: (iss) => iss.input === undefined ? "Le nom est requis" : "Invalid input."
    })
    .min(2, {
  error : "Nom trop court"
}),

  type: z
    .enum(["non_profit","for_profit", "ong"],{
  error: (iss) => iss.input === undefined ? "Selectionnez un type" : "Invalid input."
})
,
    

  size: z
    .enum(["small","middle"],{ error: (iss) => iss.input === undefined ? "Selectionnez une taille " : "Invalid input."}),
    

  description: z
    .string({error : (iss)=> iss.input === undefined ? "Une description devotre entreprise est requise" : "Invalid input"})
    .min(30, {error : "Trop court"}),

    activityField : z
 .string()
 .min(4,{
  error : (iss) => iss.input === undefined ? "Saisissew votre secteur d'activite" : "Entree invalide"
 }),
    

  userRole: z
    .string()
    .optional(),
})









export const step2Schema  = z.object({
  email: z.string({
    error: (iss) =>
      iss.input === undefined
        ? "L’email est requis"
        : "Email invalide",
  }).email("Format d’email invalide"),

  phone: z.string({
    error: (iss) =>
      iss.input === undefined
        ? "Le numéro de téléphone est requis"
        : "Numéro invalide",
  }).min(6, "Le numéro doit contenir au moins 6 chiffres"),


  website: z
    .string({
      error: "URL invalide",
    })
    .url("URL invalide")
    .optional()
    .or(z.literal("")),

  country: z.string({
    error: (iss) =>
      iss.input === undefined
        ? "Le pays est requis"
        : "Valeur invalide",
  }).min(2, "Nom du pays trop court"),

  administrative: z.record(
      z.string(),
      z.string().min(2, "Champ requis")
    ),

    city: z.string().optional(),


  address: z.string({
    error: (iss) =>
      iss.input === undefined
        ? "L’adresse est requise"
        : "Valeur invalide",
  }).min(4, "Adresse trop courte"),

  logoUrl: z
    .string({
      error: "URL du logo invalide",
    })
    .url("URL du logo invalide")
    .optional()
    .or(z.literal("")),
}).superRefine((data, ctx) => {
    const config = AFRICA_FR_ADMIN_DIVISIONS[data.country]
    if (!config) return

    for (const level of config.levels) {
      if (!data.administrative?.[level.key]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["administrative", level.key],
          message: `${level.label} requis`,
        })
      }
    }
  })



export const fullOnboardingSchema =
  step1Schema
    .merge(step2Schema)
    



    export type OnboardingFormValues = z.infer<typeof fullOnboardingSchema>
