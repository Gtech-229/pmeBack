"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUserById = exports.getUsers = exports.createUser = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = require("../lib/prisma");
const user_schemas_1 = require("../schemas/user.schemas");
const password_1 = require("../utils/password");
const auth_1 = require("../utils/auth");
/**
 * @desc CREATE user
 * @route POST /api/users
 * @access Private
 */
exports.createUser = (0, express_async_handler_1.default)(async (req, res) => {
    // Zod validation
    const data = user_schemas_1.createUserSchema.parse(req.body);
    const existingUser = await prisma_1.prisma.user.findUnique({
        where: { email: data.email }
    });
    if (existingUser) {
        res.status(409);
        throw new Error("Il semblerait que vous ayez déjà un compte; Connectez-vous");
    }
    const passwordHash = await (0, password_1.hashPassword)(data.password);
    const user = await prisma_1.prisma.user.create({
        data: {
            email: data.email,
            passwordHash,
            firstName: data.firstName ?? null,
            lastName: data.lastName ?? null,
            role: data.role ?? "PME"
        },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            createdAt: true
        }
    });
    const token = (0, auth_1.generateToken)({ id: user.id, role: user.role });
    const refreshTkn = (0, auth_1.generateRefreshToken)(user.id);
    const hashedToken = await (0, password_1.hashPassword)(refreshTkn);
    await prisma_1.prisma.refreshToken.create({
        data: {
            token: hashedToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
    });
    // Welcome activity
    await prisma_1.prisma.activity.create({
        data: {
            type: 'WELCOME',
            title: 'Bienvenue 🎉',
            message: `${user.firstName} , Votre compte a été créé avec succès. Plus que quelques étapes  et vous pourrez avoir accès à toutes les fonctionnalités de la plateforme`,
            userId: user.id
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
    res.status(201).json(user);
});
/**
 * @desc GET all users
 * @route GET /api/users
 * @access Private
 */
exports.getUsers = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user?.id || !["SUPER_ADMIN", "ADMIN"].includes(req.user?.role)) {
        res.status(401);
        throw new Error("Not authorized");
    }
    const users = await prisma_1.prisma.user.findMany({
        orderBy: { createdAt: "desc" }
    });
    if (!users) {
        res.status(404);
        throw new Error("No user found");
    }
    res.status(200).json(users);
});
/**
 *@desc  GET user by id
 * @route GET /api/users/:id
 * @access Private
 */
exports.getUserById = (0, express_async_handler_1.default)(async (req, res) => {
    const id = await req.params.id;
    // Get access to the aythentificated user
    const currentUser = req.user;
    if (!id) {
        res.status(400);
        throw new Error("Missing user id");
    }
    const user = await prisma_1.prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true,
            pme: true
        }
    });
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }
    res.json(user);
});
/**
 *@desc  UPDATE user (PUT / PATCH)
 * @route PUT|PATCH /api/users/:id
 * @access Private
 */
exports.updateUser = (0, express_async_handler_1.default)(async (req, res) => {
    const id = req.params.id;
    if (!id) {
        res.status(400);
        throw new Error("Missing user id");
    }
    const received = req.body;
    const data = user_schemas_1.updateUserSchema.parse(received);
    const userExists = await prisma_1.prisma.user.findUnique({
        where: { id }
    });
    if (!userExists) {
        res.status(404);
        throw new Error("User not found");
    }
    const updateData = {
        ...(data.email !== undefined && { email: data.email }),
        ...(data.firstName !== undefined && { firstName: data.firstName ?? null }),
        ...(data.lastName !== undefined && { lastName: data.lastName ?? null }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.isActive !== undefined && { isActive: data.isActive })
    };
    const updatedUser = await prisma_1.prisma.user.update({
        where: { id },
        data: updateData,
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            updatedAt: true
        }
    });
    res.json(updatedUser);
});
/**
 *@desc DELETE user
 * @route DELETE /api/users/:id
 * @access Private
 */
exports.deleteUser = (0, express_async_handler_1.default)(async (req, res) => {
    const id = req.params.id;
    if (!id) {
        res.status(400);
        throw new Error("Missing user id");
    }
    const userExists = await prisma_1.prisma.user.findUnique({
        where: { id }
    });
    if (!userExists) {
        res.status(404);
        throw new Error("User not found");
    }
    await prisma_1.prisma.user.delete({
        where: { id }
    });
    res.status(204).send();
});
//# sourceMappingURL=user.controllers.js.map