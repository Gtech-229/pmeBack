"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAdminUserSchema = exports.loginSchema = exports.updateUserSchema = exports.createUserSchema = exports.PasswordSchema = exports.roleEnum = void 0;
const zod_1 = require("zod");
exports.roleEnum = zod_1.z.enum([
    "SUPER_ADMIN",
    "ADMIN",
    "PME"
]);
exports.PasswordSchema = zod_1.z
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
});
/**
 * CREATE user
 */
exports.createUserSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .email("Invalid email format"),
    password: exports.PasswordSchema,
    firstName: zod_1.z
        .string()
        .min(2)
        .optional(),
    lastName: zod_1.z
        .string()
        .min(2)
        .optional(),
    role: exports.roleEnum.optional()
});
/**
 * UPDATE user (PUT / PATCH)
 */
exports.updateUserSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .email()
        .optional(),
    firstName: zod_1.z
        .string()
        .min(2)
        .optional(),
    lastName: zod_1.z
        .string()
        .min(2)
        .optional(),
    role: exports.roleEnum.optional(),
    isActive: zod_1.z
        .boolean()
        .optional()
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .email("Adresse Email invalide"),
    password: zod_1.z
        .string()
        .min(6, "Le mot de passe devrait contenir au moins 6 characteres")
});
exports.createAdminUserSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .email("Invalid email format"),
    password: exports.PasswordSchema,
    firstName: zod_1.z
        .string()
        .min(2),
    lastName: zod_1.z
        .string()
        .min(2),
    role: exports.roleEnum
});
//# sourceMappingURL=user.schemas.js.map