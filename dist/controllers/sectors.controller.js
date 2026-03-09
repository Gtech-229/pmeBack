"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSector = exports.createSector = exports.getSectors = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = require("../lib/prisma");
/**
 * @description Get all sectors
 * @route GET /sectors
 * @access Public
 */
exports.getSectors = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user?.id) {
        res.status(403);
        throw new Error("Accès refusé");
    }
    const sectors = await prisma_1.prisma.sector.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true }
    });
    res.status(200).json(sectors);
});
/**
 * @description Create a sector
 * @route POST /sectors
 * @access ADMIN | SUPER_ADMIN
 */
exports.createSector = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
        res.status(403);
        throw new Error("Accès refusé");
    }
    const { name } = req.body;
    if (!name || typeof name !== "string" || name.trim().length < 2) {
        res.status(400);
        throw new Error("Le nom du secteur est requis (min. 2 caractères)");
    }
    const existing = await prisma_1.prisma.sector.findUnique({
        where: { name: name.trim() }
    });
    if (existing) {
        res.status(409);
        throw new Error("Ce secteur existe déjà");
    }
    const sector = await prisma_1.prisma.sector.create({
        data: { name: name.trim() },
        select: { id: true, name: true }
    });
    res.status(201).json(sector);
});
/**
 * @description Delete a sector
 * @route DELETE /sectors/:sectorId
 * @access ADMIN | SUPER_ADMIN
 */
exports.deleteSector = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
        res.status(403);
        throw new Error("Accès refusé");
    }
    const { sectorId } = req.params;
    if (!sectorId) {
        res.status(400);
        throw new Error("Invalid params");
    }
    const sector = await prisma_1.prisma.sector.findUnique({
        where: { id: sectorId }
    });
    if (!sector) {
        res.status(404);
        throw new Error("Secteur introuvable");
    }
    await prisma_1.prisma.sector.delete({ where: { id: sectorId } });
    res.status(200).json({ success: true });
});
//# sourceMappingURL=sectors.controller.js.map