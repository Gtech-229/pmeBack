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
/**
 * @desc CREATE user
 * @route POST /api/users
 * @access Private
 */
exports.createUser = (0, express_async_handler_1.default)(async (req, res) => {
    // ✅ Zod validation
    const data = user_schemas_1.createUserSchema.parse(req.body);
    const existingUser = await prisma_1.prisma.user.findUnique({
        where: { email: data.email }
    });
    if (existingUser) {
        res.status(409);
        throw new Error("User already exists");
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
            isActive: true,
            createdAt: true
        }
    });
    res.status(201).json(user);
});
/**
 * @desc GET all users
 * @route GET /api/users
 * @access Private
 */
exports.getUsers = (0, express_async_handler_1.default)(async (_req, res) => {
    const users = await prisma_1.prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            createdAt: true
        }
    });
    res.json(users);
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
            createdAt: true
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
    const id = await req.params.id;
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