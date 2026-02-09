"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCode = exports.sendCode = exports.changePassword = exports.refreshToken = exports.getMe = exports.logout = exports.login = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = require("../lib/prisma");
const password_1 = require("../utils/password");
const auth_1 = require("../utils/auth");
const user_schemas_1 = require("../schemas/user.schemas");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const sendEmail_1 = require("../utils/sendEmail");
const generateCode_1 = require("../utils/generateCode");
/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = (0, express_async_handler_1.default)(async (req, res) => {
    const parsed = user_schemas_1.loginSchema.parse(req.body);
    const { email, password } = parsed;
    if (!email || !password) {
        res.status(400);
        throw new Error("Email and password are required");
    }
    const user = await prisma_1.prisma.user.findUnique({
        where: { email }
    });
    if (!user) {
        res.status(404);
        throw new Error("Compte innexistant ");
    }
    const isMatch = await (0, password_1.comparePassword)(password, user.passwordHash);
    if (!isMatch) {
        res.status(401);
        throw new Error("Mot de passe incorrect");
    }
    const token = (0, auth_1.generateToken)({
        id: user.id,
        role: user.role
    });
    const refreshTkn = (0, auth_1.generateRefreshToken)(user.id);
    const hashedToken = await (0, password_1.hashPassword)(refreshTkn);
    await prisma_1.prisma.refreshToken.create({
        data: {
            token: hashedToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
    });
    // Set refresh token in httpOnly cookie
    res.cookie("refreshToken", refreshTkn, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000 //15m
    });
    res.json({ msg: 'Connected succesfully' });
});
/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401);
        throw new Error('You must be connected');
    }
    const refreshTokenPlain = req.cookies.refreshToken;
    if (!refreshTokenPlain) {
        res.status(401);
        throw new Error('User not authentificated');
    }
    const tokens = await prisma_1.prisma.refreshToken.findMany({
        where: {
            revokedAt: null,
            expiresAt: { gt: new Date() }
        }
    });
    for (const token of tokens) {
        const isMatch = await (0, password_1.comparePassword)(refreshTokenPlain, token.token);
        if (isMatch) {
            await prisma_1.prisma.refreshToken.update({
                where: { id: token.id },
                data: { revokedAt: new Date() }
            });
            break;
        }
    }
    await prisma_1.prisma.user.update({
        where: { id: req.user.id },
        data: {
            lastLoginAt: new Date()
        }
    });
    // Supprimer les cookies
    res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production"
    });
    res.clearCookie("jwt", {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production"
    });
    res.status(200).json({ message: "Logged out successfully" });
});
/**
 * @desc    Get personal infos
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401);
        throw new Error("Not authenticated");
    }
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
            pme: {
                include: {
                    projects: {
                        include: {
                            statusHistory: true,
                            stepProgress: {
                                include: {
                                    campaignStep: true
                                }
                            }
                        }
                    },
                }
            },
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            codeIsVerified: true,
            activity: true,
            createdAt: true
        }
    });
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }
    res.status(200).json(user);
});
const REFRESH_SECRET = process.env.JWT_SECRET;
/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public (via refresh token cookie)
 */
exports.refreshToken = (0, express_async_handler_1.default)(async (req, res) => {
    const refreshTokenPlain = req.cookies?.refreshToken || req.body.refreshToken;
    if (!refreshTokenPlain) {
        res.status(401);
        throw new Error("Refresh token missing");
    }
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(refreshTokenPlain, REFRESH_SECRET);
    }
    catch (error) {
        res.status(403);
        throw new Error("Invalid refresh token");
    }
    // 
    const storedTokens = await prisma_1.prisma.refreshToken.findMany({
        where: {
            userId: decoded.id,
            revokedAt: null,
            expiresAt: { gt: new Date() }
        }
    });
    let matchedToken = null;
    for (const token of storedTokens) {
        const isMatch = await (0, password_1.comparePassword)(refreshTokenPlain, token.token);
        if (isMatch) {
            matchedToken = token;
            break;
        }
    }
    if (!matchedToken) {
        res.status(403);
        throw new Error("Refresh token not recognized");
    }
    // 4️⃣ Récupérer l'utilisateur
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: decoded.id }
    });
    if (!user) {
        res.status(401);
        throw new Error("User not found or inactive");
    }
    // !user.isActive
    // Rotation du refresh token (sécurité)
    await prisma_1.prisma.refreshToken.update({
        where: { id: matchedToken.id },
        data: { revokedAt: new Date() }
    });
    const newRefreshToken = (0, auth_1.generateRefreshToken)(user.id);
    const hashedRefreshToken = await (0, password_1.hashPassword)(newRefreshToken);
    await prisma_1.prisma.refreshToken.create({
        data: {
            token: hashedRefreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
    });
    // 6️⃣ Générer un nouvel access token
    const accessToken = (0, auth_1.generateToken)({
        id: user.id,
        role: user.role
    });
    // 7️⃣ Mettre à jour les cookies
    res.cookie("jwt", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000 // 15 min
    });
    res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.status(200).json({ message: "Token refreshed" });
});
/**
 * @des Change password
 * @route PUT/auth/change-password
 * @access Private
 * **/
exports.changePassword = (0, express_async_handler_1.default)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401);
        throw new Error("Unauthorized");
    }
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        res.status(400);
        throw new Error("Both passwords are required");
    }
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId }
    });
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }
    //  Vérifier l'ancien mot de passe
    const isMatch = await (0, password_1.comparePassword)(currentPassword, user.passwordHash);
    if (!isMatch) {
        res.status(401);
        throw new Error("Current password is incorrect");
    }
    //  Hasher le nouveau mot de passe
    const newHashedPassword = await (0, password_1.hashPassword)(newPassword);
    //  Update password
    await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHashedPassword }
    });
    //  Invalider TOUS les refresh tokens
    await prisma_1.prisma.refreshToken.updateMany({
        where: {
            userId,
            revokedAt: null
        },
        data: {
            revokedAt: new Date()
        }
    });
    res.status(200).json({
        message: "Password updated successfully"
    });
});
/**
 * @description Send verification code
 * @Route POST/auth/send-code
 * @access Private
 * **/
exports.sendCode = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401);
        throw new Error('Not authenticated');
    }
    // Récupérer l’utilisateur
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.user.id },
    });
    if (user?.verificationCode &&
        user.codeExpires &&
        user.codeExpires.getTime() > Date.now()) {
        throw new Error("Saisissez le code qui vous a été envoyé ou réessayez dans 3 minutes");
    }
    const { email } = req.body;
    if (!email) {
        res.status(400);
        throw new Error('Email is required');
    }
    const code = (0, generateCode_1.generateCode)(6);
    //  Hasher le code
    const hashedCode = await bcryptjs_1.default.hash(code, 10);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    //  Définir expiration (3 minutes)
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000);
    //  Sauvegarder le code
    await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: {
            verificationCode: hashedCode,
            codeExpires: expiresAt,
            codeIsVerified: false
        },
    });
    // Send resend code
    await (0, sendEmail_1.sendEmail)({
        to: `${email}`,
        subject: "Account validation",
        html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">

      <p style="font-size: 22px; font-weight: 500;">
        Salut ${user.firstName},
      </p>

      <p style="font-size: 18px;">
        Veuillez utiliser le code ci-dessous  vérifier votre adresse e-mail en vue de commencer
à collaborer avec les administrateurs de  <strong>PME</strong>.
      </p>

      <p style="font-size: 26px; font-weight: bold; color: #002E3C; letter-spacing: 4px;">
        ${code}
      </p>

      <p style="font-size: 16px;">
        Ce code expirera dans <strong>3 minutes</strong>, à
        <span style="color: #002E3C; font-weight: 500;">
          ${expiresAt.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        })}
        </span>.
      </p>

    

      <p style="font-size: 14px; color: #555;">
        Si vous n'êtes pas à l'origine de ce code ou  si vous avez déjà vérifié votre compte, veuillez ignorer ce courriel.
Ou contactez le support Suivi-Mp si vous avez des questions.
      </p>

      <p style="font-size: 12px; color: #999;">
        — Suivi-Mp , Votre plateforme de gestion de projet
      </p>

    </div>
  `
    });
    // Réponse frontend
    res.status(200).json({
        message: 'Verification code sent',
    });
});
exports.verifyCode = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user?.id) {
        throw new Error('Utiliisateur non connecter');
    }
    const { email, code } = req.body;
    if (!email || !code) {
        res.status(400);
        throw new Error("Email et code requis");
    }
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.user?.id },
    });
    if (!user || !user.verificationCode || !user.codeExpires) {
        res.status(400);
        throw new Error("Code inexistant");
    }
    // ⏱ Vérification expiration
    if (user.codeExpires < new Date()) {
        res.status(400);
        throw new Error("Code expiré");
    }
    //  Hash du code fourni
    const isMatched = await bcryptjs_1.default.compare(code, user.verificationCode);
    if (!isMatched) {
        throw new Error('Code incorrect');
    }
    // Validation du compte
    await prisma_1.prisma.user.update({
        where: { id: user.id },
        data: {
            verificationCode: null,
            codeIsVerified: true,
            codeExpires: null,
        },
    });
    res.status(200).json({
        success: true,
        message: "Email vérifié avec succès",
    });
});
//# sourceMappingURL=auth.controllers.js.map