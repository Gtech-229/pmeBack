// src/schemas/campaign/createCampaign.schema.ts
import { z } from "zod"
import { CampaignStatus } from "../generated/prisma/enums"
export const PROJECT_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "funded",
  "completed",
  "failed",
] as const

import { MaritalStatus } from "../generated/prisma/enums";

const maritalStatus = [ "SINGLE",
  "MARRIED",
  "DIVORCED",
  "WIDOWED",] as const
const MaritalStatusSchema = z.enum(maritalStatus);



const normalize = (val: string) =>
  val.replace(/\s/g, '').replace(',', '.')

export const campaignCriteriaSchema = z.object({
  minAge: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true
    const num = Number(val)
    return !isNaN(num) && num >= 0
  }, { message: "Âge invalide" }),

  maxAge: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true
    const num = Number(val)
    return !isNaN(num) && num >= 0
  }, { message: "Âge invalide" }),

  gender: z.enum(["MALE", "FEMALE", "ALL"]),

   maritalStatus: z.array(z.enum(["SINGLE","MARRIED","DIVORCED","WIDOWED"] as const)),
  projectType: z.enum(["INDIVIDUAL", "COLLECTIVE", "ALL"]),
   sectorIds: z.array(z.string().uuid()).optional(),
   hasDisability: z.boolean().optional(),
  
})


export const createCampaignSchema = z.object({
  
    name: z.string().min(3),
    description: z.string().min(10),
    start_date: z.string()
    .datetime("Invalid date format (ISO expected)"),
    end_date: z.string()
    .datetime("Invalid date format (ISO expected)"),
    status: z.nativeEnum(CampaignStatus),
     targetProject: z
  .string()
  .optional()
  .refine(
      (value) => {
        // non défini ou vide → illimité
        if (value === undefined || value.trim() === "") return true;

        // doit être un nombre entier positif
        const num = Number(normalize(value));
        return Number.isInteger(num) && num > 0;
      },
      {
        message:
          "Le nombre de produits doit être un entier positif ou vide",
      }
    ),

    type : z.enum(["MONO_PROJECT", "MULTI_PROJECT"]),
     criteria: campaignCriteriaSchema.optional(),
     isNational : z.boolean(),
     targetCountry : z.string().optional()
  
}).refine(
  (data) => {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    return start < end;
  },
  {
    message: "End date must be after start date",
    path: ["end_date"],
  }
).refine(
  (data) => {
    const { minAge, maxAge } = data.criteria ?? {}
    if (minAge && maxAge) return Number(minAge) < Number(maxAge)
    return true
  },
  { message: "L'âge minimum doit être inférieur à l'âge maximum", path: ["criteria", "maxAge"] }
).superRefine((data, ctx)=>{
    if(data.isNational && !data.targetCountry){
      ctx.addIssue({
        code : z.ZodIssueCode.custom,
        message : "Pays cible manquant"
      })
    }
})


 const createStepDocumentSchema = z.object({
 id : z.string().uuid().optional(),
 stepId : z.string().uuid().optional(),

  name : z.string()
  .min(2, "Entrez le nom du ducument"),

  isRequired : z.boolean()
})



export const createCampaignStepsSchema = z.object({ 
 name : z.string({
  error : (iss) => iss.input === undefined ? "Le nom de l'étape est requis" : "Champ invalide"
 }),

  order : z.number().positive({
    error : (iss) => iss.input === undefined ? "L'ordre est requis" : "Champ order invalide"
  }),

  campaignId : z.string().uuid(), 

  setsProjectStatus: z.enum(PROJECT_STATUSES).optional(),

  documents : z.array(createStepDocumentSchema).optional(),

  committeeId: z.string().uuid().optional()

})


export const updateCampaignStepSchema = z
  .object({

    name: z.string().min(1).optional(),

    order: z.number().int().positive().optional(),

    setsProjectStatus: z
      .enum(["approved", "funded", "completed"])
      .optional()
      .nullable(),

    committee: z.any().optional(), // adapte si tu as un vrai schema
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.order !== undefined ||
      data.setsProjectStatus !== undefined ||
      data.committee !== undefined,
    {
      message: "Au moins un champ doit être fourni pour la mise à jour",
    }
  )





export const updateCampaignStepsSchema = z.array(
  z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    order: z.number().int().positive(),
    setsProjectStatus: z
      .enum(["approved", "funded", "completed"])
      .optional()
      .nullable(),
    committeeId: z.string().uuid().optional(),
    document : z.array(createStepDocumentSchema)
  })
)



