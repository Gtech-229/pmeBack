"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCampaignStatistics = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = require("../lib/prisma");
const functions_1 = require("../utils/functions");
/**
 * @description Get campaign statistics
 * @route GET /campaign/:campaignId/statistics?dimension=sector&year=2025
 * @access ADMIN, SUPER_ADMIN
 */
exports.getCampaignStatistics = (0, express_async_handler_1.default)(async (req, res) => {
    const { campaignId } = req.params;
    const { dimension, year } = req.query;
    if (!campaignId) {
        res.status(400);
        throw new Error("Campaign id manquant");
    }
    const validDimensions = [
        "sector", "gender", "ageRange",
        "projectType", "maritalStatus", "hasDisability"
    ];
    if (dimension && !validDimensions.includes(dimension)) {
        res.status(400);
        throw new Error("Dimension invalide");
    }
    // ── Fetch funded projects ──
    const projects = await prisma_1.prisma.project.findMany({
        where: {
            campaignId,
            status: "funded",
            ...(year && {
                updatedAt: {
                    gte: new Date(`${year}-01-01`),
                    lte: new Date(`${year}-12-31`),
                }
            })
        },
        include: {
            financialEntries: true,
            disbursements: true,
            sector: true,
            pme: {
                include: {
                    promoter: {
                        include: { user: true }
                    }
                }
            }
        }
    });
    // ── Compute available years from actual data ──
    const availableYears = [
        ...new Set(projects.map(p => new Date(p.updatedAt).getFullYear()))
    ].sort((a, b) => b - a); // most recent first
    // ── Empty state ──
    if (!projects.length) {
        res.status(200).json({
            campaignId,
            totalProjects: 0,
            profitableProjects: 0,
            unprofitableProjects: 0,
            profitabilityRate: 0,
            dimension: dimension ?? null,
            breakdown: [],
            availableYears,
        });
        return;
    }
    // ── Enrich ──
    const enriched = projects.map(p => {
        const financials = (0, functions_1.getProjectFinancials)(p);
        return {
            projectId: p.id,
            sector: p.sector?.name ?? "Non renseigné",
            gender: p.pme.promoter?.gender ? functions_1.genderLabel[p.pme.promoter?.gender] : "Non renseigné",
            ageRange: (0, functions_1.getAgeRange)(p.pme.promoter?.birthDate),
            projectType: functions_1.formatProjectTypeLabel[p.type],
            maritalStatus: p.pme.promoter?.maritalStatus ? functions_1.maritalStatusLabel[p.pme.promoter?.maritalStatus] : "Non renseigné",
            hasDisability: p.pme.promoter?.hasDisability
                ? "En situation de handicap"
                : "Sans handicap",
            ...financials,
        };
    });
    // ── Global stats ──
    const profitableProjects = enriched.filter(p => p.isProfitable).length;
    const unprofitableProjects = enriched.length - profitableProjects;
    // ── Breakdown ──
    const breakdown = dimension
        ? (0, functions_1.aggregate)((0, functions_1.groupBy)(enriched, dimension))
        : [];
    res.status(200).json({
        campaignId,
        totalProjects: enriched.length,
        profitableProjects,
        unprofitableProjects,
        profitabilityRate: Math.round((profitableProjects / enriched.length) * 100),
        dimension: dimension ?? null,
        breakdown,
        availableYears,
    });
});
//# sourceMappingURL=campaignStatistics.controllers.js.map