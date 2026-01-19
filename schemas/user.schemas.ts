import { z } from "zod"

export const roleEnum = z.enum([
  "SUPER_ADMIN",
  "ADMIN",
  "PME",
  "FINANCIER"
])

/**
 * CREATE user
 */
export const createUserSchema = z.object({
  email: z
    .string()
    .email("Invalid email format"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),

  firstName: z
    .string()
    .min(2)
    .optional(),

  lastName: z
    .string()
    .min(2)
    .optional(),

  role: roleEnum.optional()
})

/**
 * UPDATE user (PUT / PATCH)
 */
export const updateUserSchema = z.object({
  email: z
    .string()
    .email()
    .optional(),

  firstName: z
    .string()
    .min(2)
    .optional(),

  lastName: z
    .string()
    .min(2)
    .optional(),

  role: roleEnum.optional(),

  isActive: z
    .boolean()
    .optional()
})




export const loginSchema = z.object({
  email: z
    .string()
    .email("Adresse Email invalide"),
  password: z
    .string()
    .min(6, "Le mot de passe devrait contenir au moins 6 characteres")
})
