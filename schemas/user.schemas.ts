import { z } from "zod"

export const roleEnum = z.enum([
  "SUPER_ADMIN",
  "ADMIN",
  "PME"

])


export const PasswordSchema = z
  .string()
  .min(8, "Le mot de passe doit contenir au moins 8 caractères")
  .refine((pw) => /[a-z]/.test(pw), {
    message: "Au moins une lettre minuscule requise",
  })
  .refine((pw) => /[A-Z]/.test(pw), {
    message: "Au moins une lettre majuscule requise",
  })
  .refine((pw) => /\d/.test(pw), {
    message: "Au moins un chiffre requis",
  })
  .refine((pw) => /[^A-Za-z0-9]/.test(pw), {
    message: "Au moins un caractère spécial requis",
  })

/**
 * CREATE user
 */
export const createUserSchema = z.object({
  email: z
    .string()
    .email("Invalid email format"),

  password: PasswordSchema,

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
