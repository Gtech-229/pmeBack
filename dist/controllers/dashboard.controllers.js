"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSummury = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = require("../lib/prisma");
exports.getSummury = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401);
        throw new Error('Unauthorized');
    }
    const user = await prisma_1.prisma.user.findUnique({
        where: {
            id: req.user.id,
            role: req.user.role
        }
    });
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }
    const lastLogin = user.lastLoginAt ?? new Date(0);
    // 🔹 Nouveaux utilisateurs
    const newUsers = await prisma_1.prisma.user.count({
        where: {
            createdAt: { gt: lastLogin }
        }
    });
    // 🔹 Nouveaux projets
    const newProjects = await prisma_1.prisma.project.count({
        where: {
            createdAt: { gt: lastLogin }
        }
    });
    // 🔹 Nouvelles réunions de comité
    const newMeetings = await prisma_1.prisma.committeeMeeting.count({
        where: {
            createdAt: { gt: lastLogin }
        }
    });
    // 🔹 Dernières réunions (ex: 5)
    const latestMeetings = await prisma_1.prisma.committeeMeeting.findMany({
        orderBy: {
            startTime: 'desc'
        },
        take: 5,
        include: {
            committee: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });
    const summary = {
        newUsers,
        newProjects,
        newMeetings,
        latestMeetings
    };
    res.status(200).json(summary);
});
//# sourceMappingURL=dashboard.controllers.js.map