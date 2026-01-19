"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivities = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = require("../lib/prisma");
/**
 * @description  Get recent activities
 * @route GET/activities
 * @access Authentificted user
 * **/
exports.getActivities = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401);
        throw new Error('Not authenticated');
    }
    const userId = req.user?.id;
    const activities = await prisma_1.prisma.activity.findMany({
        where: {
            userId
        },
        select: {
            id: true,
            title: true,
            type: true,
            message: true,
            pme: true,
            user: true,
            createdAt: true
        }
    });
    res.status(200).json(activities);
});
//# sourceMappingURL=activities.controllers.js.map