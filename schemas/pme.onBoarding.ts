import { z } from "zod"



export const step1Schema = z.object({
  name: z
    .string({
       error: (iss) => iss.input === undefined ? "Le nom est requis" : "Invalid input."
    })
    .min(2, {
  error : "Nom trop court"
}),

  type: z
    .enum(["non_profit","for_profit"],{
  error: (iss) => iss.input === undefined ? "Selectionnez un type" : "Invalid input."
})
,
    

  size: z
    .enum(["small","middle"],{ error: (iss) => iss.input === undefined ? "Selectionnez une taille " : "Invalid input."}),
    

  description: z
    .string({error : (iss)=> iss.input === undefined ? "Une description devotre entreprise est requise" : "Invalid input"})
    .min(30, {error : "Trop court"}),
    

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

  city: z.string({
    error: (iss) =>
      iss.input === undefined
        ? "La ville est requise"
        : "Valeur invalide",
  }).min(2, "Nom de la ville trop court"),

  address: z.string({
    error: (iss) =>
      iss.input === undefined
        ? "L’adresse est requise"
        : "Valeur invalide",
  }).min(5, "Adresse trop courte"),

  logoUrl: z
    .string({
      error: "URL du logo invalide",
    })
    .url("URL du logo invalide")
    .optional()
    .or(z.literal("")),
})


export const fullOnboardingSchema =
  step1Schema
    .merge(step2Schema)
    



    export type OnboardingFormValues = z.infer<typeof fullOnboardingSchema>
