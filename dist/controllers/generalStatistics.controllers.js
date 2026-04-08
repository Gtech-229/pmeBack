"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGeneralStatistics = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = require("../lib/prisma");
const functions_1 = require("../utils/functions");
/**
 * @description Get general statistics across all campaigns
 * @route GET /statistics/campaigns?dimension=sector&year=2025
 * @access ADMIN, SUPER_ADMIN
 */
exports.getGeneralStatistics = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
        res.status(403);
        throw new Error("Accès refusé");
    }
    const { dimension, year } = req.query;
    const validDimensions = [
        "sector", "gender", "ageRange",
        "projectType", "maritalStatus", "hasDisability"
    ];
    if (dimension && !validDimensions.includes(dimension)) {
        res.status(400);
        throw new Error("Dimension invalide");
    }
    // ── Fetch closed campaigns ──
    const campaigns = await prisma_1.prisma.campaign.findMany({
        where: {
            status: "CLOSED",
            ...(year && {
                updatedAt: {
                    gte: new Date(`${year}-01-01`),
                    lte: new Date(`${year}-12-31`),
                }
            })
        },
        include: {
            criteria: {
                include: { sectors: { include: { sector: true } } }
            },
            projects: {
                where: { status: "funded" },
                include: {
                    financialEntries: true,
                    disbursements: true,
                }
            }
        }
    });
    // ── Compute available years ──
    const availableYears = [
        ...new Set(campaigns.map(c => new Date(c.updatedAt).getFullYear()))
    ].sort((a, b) => b - a);
    // ── Filter campaigns with at least one funded project ──
    const eligible = campaigns.filter(c => c.projects.length > 0);
    if (!eligible.length) {
        res.status(200).json({
            dimension: dimension ?? null,
            availableYears,
            data: []
        });
        return;
    }
    // ── Determine if a campaign is profitable ──
    const isCampaignProfitable = (campaign) => {
        const total = campaign.projects.length;
        if (total === 0)
            return false;
        const profitable = campaign.projects.filter(p => {
            const { isProfitable } = (0, functions_1.getProjectFinancials)(p);
            return isProfitable;
        }).length;
        return Math.round((profitable / total) * 100) > 50;
    };
    // ── Group campaigns by dimension option ──
    const groupCampaignsByDimension = (campaigns, dim) => {
        const groups = {};
        for (const campaign of campaigns) {
            const criteria = campaign.criteria;
            let options = [];
            switch (dim) {
                case "sector":
                    options = criteria?.sectors?.map(s => s.sector.name) ?? [];
                    break;
                case "gender":
                    if (criteria?.gender && criteria.gender !== "ALL") {
                        options = [criteria.gender];
                    }
                    break;
                case "maritalStatus":
                    options = criteria?.maritalStatus ?? [];
                    break;
                case "projectType":
                    if (criteria?.projectType && criteria.projectType !== "ALL") {
                        options = [criteria.projectType];
                    }
                    break;
                case "ageRange":
                    if (criteria?.minAge || criteria?.maxAge) {
                        const min = criteria.minAge ? `${criteria.minAge}` : "";
                        const max = criteria.maxAge ? `${criteria.maxAge}` : "";
                        const label = min && max
                            ? `${min} – ${max} ans`
                            : min ? `Min. ${min} ans`
                                : `Max. ${max} ans`;
                        options = [label];
                    }
                    break;
                case "hasDisability":
                    if (criteria?.hasDisability !== null && criteria?.hasDisability !== undefined) {
                        options = [criteria.hasDisability ? "Avec handicap" : "Sans handicap"];
                    }
                    break;
            }
            // campaign contributes to each option bar
            for (const option of options) {
                if (!groups[option])
                    groups[option] = [];
                groups[option].push(campaign);
            }
        }
        return groups;
    };
    // ── Build data ──
    let data = [];
    if (dimension) {
        const groups = groupCampaignsByDimension(eligible, dimension);
        data = Object.entries(groups)
            .filter(([_, campaigns]) => campaigns.length >= 2) // minimum threshold
            .map(([label, campaigns]) => {
            const totalCampaigns = campaigns.length;
            const profitableCampaigns = campaigns.filter(isCampaignProfitable).length;
            const unprofitableCampaigns = totalCampaigns - profitableCampaigns;
            const avgProfitabilityRate = Math.round((profitableCampaigns / totalCampaigns) * 100);
            return {
                label,
                totalCampaigns,
                profitableCampaigns,
                unprofitableCampaigns,
                avgProfitabilityRate,
            };
        })
            .sort((a, b) => b.avgProfitabilityRate - a.avgProfitabilityRate);
    }
    res.status(200).json({
        dimension: dimension ?? null,
        availableYears,
        data,
    });
});
//# sourceMappingURL=generalStatistics.controllers.js.map