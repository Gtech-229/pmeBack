"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.refreshToken = exports.getMe = exports.logout = exports.login = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = require("../lib/prisma");
const password_1 = require("../utils/password");
const auth_1 = require("../utils/auth");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = (0, express_async_handler_1.default)(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400);
        throw new Error("Email and password are required");
    }
    res.json({ msg: 'Connected succesfully', email });
});
/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = (0, express_async_handler_1.default)(async (req, res) => {
    const refreshTokenPlain = req.cookies.refreshToken;
    if (refreshTokenPlain) {
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
    }
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
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true,
            lastLoginAt: true
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
    if (!user || !user.isActive) {
        res.status(401);
        throw new Error("User not found or inactive");
    }
    // 5️⃣ Rotation du refresh token (sécurité)
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
    // 🔐 Vérifier l'ancien mot de passe
    const isMatch = await (0, password_1.comparePassword)(currentPassword, user.passwordHash);
    if (!isMatch) {
        res.status(401);
        throw new Error("Current password is incorrect");
    }
    // 🔐 Hasher le nouveau mot de passe
    const newHashedPassword = await (0, password_1.hashPassword)(newPassword);
    // 🔄 Update password
    await prisma_1.prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHashedPassword }
    });
    // 🔥 Invalider TOUS les refresh tokens
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
//# sourceMappingURL=auth.controllers.js.map