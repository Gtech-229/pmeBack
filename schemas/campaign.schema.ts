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
        const num = Number(value);
        return Number.isInteger(num) && num > 0;
      },
      {
        message:
          "Le nombre de produits doit être un entier positif ou vide",
      }
    ),
  
}).refine(
  (data) => data.start_date < data.end_date,
  {
    message: "End date must be after start date",
    path: ["endTime"],
  }
)




export const createCampaignStepsSchema = z.object({ 
 name : z.string({
  error : (iss) => iss.input === undefined ? "Le nom du step est requis" : "Champ invalide"
 }),

  order : z.number().positive({
    error : (iss) => iss.input === undefined ? "L'order est requis" : "Champ order invalide"
  }),

  campaignId : z.string().uuid(), 

  setsProjectStatus: z.enum(PROJECT_STATUSES).optional(),


})

