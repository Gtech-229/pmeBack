"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCampaign = exports.updateCampaign = exports.getCampaignSteps = exports.updateCampaignStep = exports.deleteCampaignStep = exports.createCampaignSteps = exports.getCampaignById = exports.createCampaign = exports.getCampaigns = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = require("../lib/prisma");
const campaign_schema_1 = require("../schemas/campaign.schema");
/**
 * @description Get campaigns
 * @route GET /campaign
 * @access Authenticated admin
 */
exports.getCampaigns = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user) {
        res.status(403);
        throw new Error("Access denied");
    }
    const { status, search, page, limit, sector, projectType, minAge, maxAge, gender, maritalStatus, hasDisability } = req.query;
    const take = parseInt(limit) || 20;
    const skip = (parseInt(page) - 1 || 0) * take;
    const where = {
        ...(status && status !== "all" ? { status: status } : {}),
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
        ...((sector || projectType || minAge || maxAge || gender || maritalStatus || hasDisability !== undefined) ? {
            criteria: {
                ...(projectType && projectType !== "all" ? { projectType: projectType } : {}),
                ...(gender && gender !== "all" ? { gender: gender } : {}),
                ...(maritalStatus && maritalStatus !== "all" ? { maritalStatus: maritalStatus } : {}),
                ...(hasDisability !== undefined && hasDisability !== "all" ? {
                    hasDisability: hasDisability === "true"
                } : {}),
                ...(minAge ? { minAge: { lte: parseInt(minAge) } } : {}),
                ...(maxAge ? { maxAge: { gte: parseInt(maxAge) } } : {}),
                ...(sector ? {
                    sectors: {
                        some: {
                            sector: { name: { contains: sector, mode: "insensitive" } }
                        }
                    }
                } : {})
            }
        } : {})
    };
    const [data, total] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.campaign.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
            include: {
                steps: {
                    include: { committee: true },
                },
                criteria: {
                    include: {
                        sectors: {
                            include: { sector: true }
                        }
                    }
                }
            },
        }),
        prisma_1.prisma.campaign.count({ where }),
    ]);
    res.status(200).json({
        data,
        meta: {
            total,
            page: parseInt(page) || 1,
            limit: take,
            totalPages: Math.ceil(total / take),
        },
    });
});
/**
 * @description Create a campaign
 * @route POST /campaign
 * @access Authenticated admin
 */
exports.createCampaign = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(req.user?.role)) {
        res.status(403);
        throw new Error("Access denied");
    }
    const parsed = campaign_schema_1.createCampaignSchema.parse(req.body);
    if (!parsed) {
        res.status(400);
        throw new Error('Invalid datas');
    }
    const { name, description, start_date, end_date, status, targetProject, type, criteria } = parsed;
    const campaign = await prisma_1.prisma.$transaction(async (tx) => {
        const createdCampaign = await tx.campaign.create({
            data: {
                name,
                description,
                start_date,
                end_date,
                status,
                targetProjects: targetProject ? Number(targetProject.replace(/\s/g, '').replace(',', '.')) : null,
                type,
            },
        });
        if (criteria) {
            const { minAge, maxAge, gender, maritalStatus, projectType, sectorIds } = criteria;
            const createdCriteria = await tx.campaignCriteria.create({
                data: {
                    campaignId: createdCampaign.id,
                    minAge: minAge ? Number(minAge) : null,
                    maxAge: maxAge ? Number(maxAge) : null,
                    gender: gender ?? null,
                    maritalStatus: maritalStatus ?? null,
                    projectType: projectType ?? null,
                    hasDisability: criteria.hasDisability ?? null,
                },
            });
            if (sectorIds && sectorIds.length > 0) {
                await tx.campaignCriteriaSector.createMany({
                    data: sectorIds.map((sectorId) => ({
                        criteriaId: createdCriteria.id,
                        sectorId,
                    })),
                });
            }
        }
        return tx.campaign.findUnique({
            where: { id: createdCampaign.id },
            include: {
                steps: true,
                criteria: {
                    include: {
                        sectors: {
                            include: { sector: true }
                        }
                    }
                }
            }
        });
    });
    res.status(201).json(campaign);
});
/**
 * @description Get a single campaign details
 * @route GET /campaign/:id
 * @access Authenticated admin
 */
exports.getCampaignById = (0, express_async_handler_1.default)(async (req, res) => {
    // Vérification auth
    if (!req.user) {
        res.status(403);
        throw new Error("Access denied");
    }
    const { id } = req.params;
    if (!id) {
        res.status(400);
        throw new Error('The campaign id is required');
    }
    const campaign = await prisma_1.prisma.campaign.findUnique({
        where: { id },
        include: {
            committees: {
                include: {
                    members: {
                        include: {
                            user: true
                        }
                    },
                    meetings: true,
                    step: true
                }
            },
            steps: {
                include: {
                    committee: true
                }
            },
            projects: true,
            criteria: {
                include: {
                    sectors: {
                        include: {
                            sector: true
                        }
                    }
                }
            }
        }
    });
    if (!campaign) {
        res.status(404);
        throw new Error("Campaign not found");
    }
    res.status(200).json(campaign);
});
/**
 * @description Create campaign validation step
 * @route POST /campaign/:campaignId/steps
 * @access Authenticated Admin
 */
exports.createCampaignSteps = (0, express_async_handler_1.default)(async (req, res) => {
    const parsed = campaign_schema_1.createCampaignStepsSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400);
        throw parsed.error;
    }
    const { order, name, campaignId, setsProjectStatus, committeeId } = parsed.data;
    if (!req.user) {
        res.status(403);
        throw new Error("Access denied");
    }
    //  transaction 
    const step = await prisma_1.prisma.$transaction(async (tx) => {
        //  vérifier campagne
        const campaign = await tx.campaign.findUnique({
            where: { id: campaignId },
        });
        if (!campaign) {
            res.status(404);
            throw new Error("Campaign not found");
        }
        //  Verifier impact global
        if (setsProjectStatus) {
            const existingStatus = await tx.campaignStep.findFirst({
                where: {
                    campaignId,
                    setsProjectStatus,
                },
                select: { id: true },
            });
            if (existingStatus) {
                res.status(409);
                throw new Error("Une étape avec le meme impact exist deja dans la campagne .");
            }
        }
        //  vérifier unicité order
        const existingStep = await tx.campaignStep.findFirst({
            where: { campaignId, order },
        });
        if (existingStep) {
            res.status(409);
            throw new Error("Une étape existe déjà avec cet ordre");
        }
        //  vérifier comité si fourni
        if (committeeId) {
            const committee = await tx.committee.findUnique({
                where: { id: committeeId },
                select: { id: true, stepId: true },
            });
            if (!committee) {
                res.status(404);
                throw new Error("Comité introuvable");
            }
            if (committee.stepId) {
                res.status(409);
                throw new Error("Ce comité est déjà assigné à une autre étape");
            }
        }
        //  créer la step
        const createdStep = await tx.campaignStep.create({
            data: {
                name,
                order,
                campaignId,
                setsProjectStatus: setsProjectStatus ?? null,
            },
        });
        //  attacher le comité si présent
        if (committeeId) {
            await tx.committee.update({
                where: { id: committeeId },
                data: { stepId: createdStep.id },
            });
        }
        return createdStep;
    });
    res.status(201).json(step);
});
/**
 * @description Delete a campaign validation step
 * @route DELETE /campaign/:campaignId/steps/:id
 * @access Authenticated Admin
 */
exports.deleteCampaignStep = (0, express_async_handler_1.default)(async (req, res) => {
    const { campaignId, stepId } = req.params;
    if (!req.user) {
        res.status(403);
        throw new Error("Access denied");
    }
    if (!campaignId || !stepId) {
        res.status(400);
        throw new Error("Missing campaign id or step id");
    }
    // Vérifier que la campagne existe
    const campaign = await prisma_1.prisma.campaign.findUnique({
        where: { id: campaignId }
    });
    if (!campaign) {
        res.status(404);
        throw new Error("Campaign not found");
    }
    // Vérifier que l’étape existe et appartient à la campagne
    const step = await prisma_1.prisma.campaignStep.findFirst({
        where: {
            id: stepId,
            campaignId
        }
    });
    if (!step) {
        res.status(404);
        throw new Error("Step not found for this campaign");
    }
    const linkedCommittee = await prisma_1.prisma.committee.findUnique({
        where: {
            stepId: stepId
        }
    });
    if (linkedCommittee) {
        res.status(409);
        throw new Error("Impossible de supprimer une étape déjà assignée à un comité");
    }
    // Suppression de l’étape
    await prisma_1.prisma.campaignStep.delete({
        where: { id: stepId }
    });
    res.status(200).json("Deleted successfully");
});
/**
 * @description Update a campaign validation step
 * @route PUT /campaign/:campaignId/steps
 * @access Authenticated Admin
 */
exports.updateCampaignStep = (0, express_async_handler_1.default)(async (req, res) => {
    const { campaignId } = req.params;
    if (!campaignId) {
        res.status(400);
        throw new Error("L'id de la campagne est manquant");
    }
    const parsed = campaign_schema_1.updateCampaignStepsSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400);
        throw new Error("Payload invalide");
    }
    const steps = parsed.data;
    await prisma_1.prisma.$transaction(async (tx) => {
        //  PHASE 1 — neutraliser les orders
        for (const step of steps) {
            await tx.campaignStep.update({
                where: { id: step.id },
                data: {
                    order: step.order + 1000, // ← offset temporaire
                },
            });
        }
        //  PHASE 2 — appliquer les vraies valeurs
        for (const step of steps) {
            await tx.campaignStep.update({
                where: { id: step.id },
                data: {
                    name: step.name,
                    order: step.order,
                    setsProjectStatus: step.setsProjectStatus ?? null,
                },
            });
        }
        //  PHASE 3 — gérer les comités
        for (const step of steps) {
            // détacher anciens
            await tx.committee.updateMany({
                where: { stepId: step.id },
                data: { stepId: null },
            });
            // attacher nouveau
            if (step.committeeId) {
                await tx.committee.update({
                    where: { id: step.committeeId },
                    data: { stepId: step.id },
                });
            }
        }
    });
    res.status(200).json({
        success: true,
        message: "Étapes mises à jour avec succès",
    });
});
/**
 * @description Get campaign progression steps
 * @route GET /campaign/:campaignId/steps
 * @access Authenticated Admin
 */
exports.getCampaignSteps = (0, express_async_handler_1.default)(async (req, res) => {
    const { campaignId } = req.params;
    if (!campaignId) {
        res.status(400);
        throw new Error("Id de la campagne requise");
    }
    if (!req.user) {
        res.status(403);
        throw new Error("Access denied");
    }
    const campaignWithSteps = await prisma_1.prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
            steps: {
                include: {
                    committee: true
                },
                orderBy: { order: "asc" },
            },
        },
    });
    if (!campaignWithSteps) {
        res.status(404);
        throw new Error("Campaign not found");
    }
    res.status(200).json(campaignWithSteps.steps);
});
/**
 * @description Update a campaign
 * @route PUT /campaign/:id
 * @access Authenticated Admin
 */
exports.updateCampaign = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    const { name, description, status, targetProjects } = req.body;
    if (!req.user) {
        res.status(403);
        throw new Error("Access denied");
    }
    if (!id) {
        res.status(400);
        throw new Error("Missing campaign id");
    }
    // Vérifier que la campagne existe
    const campaign = await prisma_1.prisma.campaign.findUnique({
        where: { id },
        include: {
            steps: true
        }
    });
    if (!campaign) {
        res.status(404);
        throw new Error("Campaign not found");
    }
    // Validation minimale
    if (!name && !description && !status) {
        res.status(400);
        throw new Error("No data provided for update");
    }
    if (status === 'OPEN' && campaign.steps.length === 0) {
        res.status(400);
        throw new Error("Au moins une etape est necessaire pour le lancement d'une campagne");
    }
    // Mise à jour
    const updatedCampaign = await prisma_1.prisma.campaign.update({
        where: { id },
        data: {
            name: name ?? campaign.name,
            description: description ?? campaign.description,
            status: status ?? campaign.status,
            targetProjects: Number(targetProjects)
        }
    });
    res.status(200).json({
        message: "Campaign updated successfully",
        campaign: updatedCampaign
    });
});
/**
 * @description Delete a campaign
 * @route DELETE /campaign/:campaignId
 * @access ADMIN | SUPER_ADMIN
 */
exports.deleteCampaign = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
        res.status(403);
        throw new Error("Accès refusé");
    }
    const { id } = req.params;
    if (!id) {
        res.status(400);
        throw new Error("No campaignId");
    }
    const campaign = await prisma_1.prisma.campaign.findUnique({
        where: { id },
        include: { projects: true }
    });
    if (!campaign) {
        res.status(404);
        throw new Error("Campagne introuvable");
    }
    if (campaign.projects.length > 0) {
        res.status(400);
        throw new Error("Impossible de supprimer une campagne contenant des projets");
    }
    await prisma_1.prisma.campaign.delete({ where: { id } });
    res.status(200).json({ success: true });
});
//# sourceMappingURL=campaign.controllers.js.map