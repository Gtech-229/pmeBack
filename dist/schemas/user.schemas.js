"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.updateUserSchema = exports.createUserSchema = exports.roleEnum = void 0;
const zod_1 = require("zod");
exports.roleEnum = zod_1.z.enum([
    "SUPER_ADMIN",
    "ADMIN",
    "PME",
    "FINANCIER"
]);
/**
 * CREATE user
 */
exports.createUserSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .email("Invalid email format"),
    password: zod_1.z
        .string()
        .min(8, "Password must be at least 8 characters"),
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
//# sourceMappingURL=user.schemas.js.map