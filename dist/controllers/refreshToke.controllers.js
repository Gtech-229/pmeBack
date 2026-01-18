"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshToken = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../utils/auth");
const password_1 = require("../utils/password");
const refreshToken = (0, express_async_handler_1.default)(async (req, res) => {
    const userId = req.userId;
    const refreshTokenPlain = req.cookies.refreshToken;
    if (!userId) {
        res.status(401);
        throw new Error("Missing user id");
    }
    // 1️⃣ Récupérer tous les refresh tokens ACTIFS du user
    const storedTokens = await prisma_1.prisma.refreshToken.findMany({
        where: {
            userId,
            revokedAt: null,
            expiresAt: { gt: new Date() }
        }
    });
    if (storedTokens.length === 0) {
        res.status(403);
        throw new Error("No valid refresh token found");
    }
    // 2️⃣ Trouver le token correspondant (bcrypt compare)
    let matchedToken = null;
    for (const token of storedTokens) {
        const isMatch = await (0, password_1.comparePassword)(refreshTokenPlain, token.token);
        if (isMatch) {
            matchedToken = token;
            break;
        }
    }
    // 3️⃣ Reuse attack detection
    if (!matchedToken) {
        // 🔥 quelqu’un tente d’utiliser un token déjà révoqué
        await prisma_1.prisma.refreshToken.updateMany({
            where: { userId },
            data: { revokedAt: new Date() }
        });
        res.status(403);
        throw new Error("Refresh token reuse detected");
    }
    // 4️⃣ Révoquer l'ancien refresh token
    await prisma_1.prisma.refreshToken.update({
        where: { id: matchedToken.id },
        data: { revokedAt: new Date() }
    });
    // 3️⃣ Récupérer l'utilisateur
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId }
    });
    if (!user) {
        res.status(401);
        throw new Error("User not found");
    }
    // 4️⃣ Générer nouveaux tokens
    const newAccessToken = (0, auth_1.generateToken)({
        id: user.id,
        role: user.role
    });
    const newRefreshToken = (0, auth_1.generateRefreshToken)(user.id);
    const hashedNewRefreshToken = await (0, password_1.hashPassword)(newRefreshToken);
    // 5️⃣ Sauvegarder le NOUVEAU refresh token
    await prisma_1.prisma.refreshToken.create({
        data: {
            token: hashedNewRefreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
    });
    // 6️⃣ Mettre le refresh token en cookie
    res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict"
    });
    res.json({ accessToken: newAccessToken });
});
exports.refreshToken = refreshToken;
//# sourceMappingURL=refreshToke.controllers.js.map