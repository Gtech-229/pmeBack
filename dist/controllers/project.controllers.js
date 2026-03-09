"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProject = exports.getMyProjects = exports.deleteProject = exports.getProject = exports.getProjects = exports.createProject = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = require("../lib/prisma");
const UploadToCloudinary_1 = require("../utils/UploadToCloudinary");
const project_schema_1 = require("../schemas/project.schema");
const project_schema_2 = require("../schemas/project.schema");
const RemoveFromCloudinary_1 = require("../utils/RemoveFromCloudinary");
/**
 * @description Create new project
 * @route  POST/projects
 * @access Private(authentificated pme)
 * **/
exports.createProject = (0, express_async_handler_1.default)(async (req, res) => {
    /* ---------------- AUTH ---------------- */
    if (!req.user?.id) {
        res.status(401);
        throw new Error("Unauthorized");
    }
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.user.id },
        include: { pme: true }
    });
    if (!user || !user.pme?.id) {
        res.status(403);
        throw new Error("Utilisateur non autorisé à créer un projet");
    }
    const pmeId = user.pme.id;
    /* ---------------- BODY PARSING ---------------- */
    let requestcredits;
    try {
        requestcredits = req.body.credits ? JSON.parse(req.body.credits) : undefined;
    }
    catch {
        res.status(400);
        throw new Error("Format JSON invalide pour les crédits");
    }
    const bodyToValidate = { ...req.body, credits: requestcredits };
    const parsedBody = project_schema_1.createProjectBodySchema.safeParse(bodyToValidate);
    if (!parsedBody.success) {
        res.status(400);
        throw parsedBody.error;
    }
    const { title, description, requestedAmount, hasCredit, campaignId, credits, type } = parsedBody.data;
    /* ---------------- CAMPAIGN CHECK ---------------- */
    const campaign = await prisma_1.prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { type: true, status: true }
    });
    if (!campaign) {
        res.status(404);
        throw new Error("Campagne introuvable");
    }
    if (campaign.status !== "OPEN") {
        res.status(400);
        throw new Error("Cette campagne n'est pas ouverte aux soumissions");
    }
    // Only block multiple submissions for MONO_PROJECT campaigns
    if (campaign.type === "MONO_PROJECT") {
        const hasAlreadyCampaignProject = await prisma_1.prisma.project.findFirst({
            where: { campaignId, pmeId }
        });
        if (hasAlreadyCampaignProject) {
            res.status(400);
            throw new Error("Votre organisation dispose déjà d'un projet pour le compte de cette campagne");
        }
    }
    /* ---------------- FILES VALIDATION ---------------- */
    const files = req.files;
    if (!files || files.length === 0) {
        res.status(400);
        throw new Error("Au moins un document est requis pour la soumission d'un projet");
    }
    /* ---------------- CAMPAIGN STEPS ---------------- */
    const campaignSteps = await prisma_1.prisma.campaignStep.findMany({
        where: { campaignId },
        orderBy: { order: "asc" }
    });
    if (!campaignSteps || campaignSteps.length === 0) {
        res.status(400);
        throw new Error("La campagne ne contient aucune étape");
    }
    /* ---------------- TRANSACTION ---------------- */
    const project = await prisma_1.prisma.$transaction(async (tx) => {
        const createdProject = await tx.project.create({
            data: {
                title,
                description,
                requestedAmount,
                hasCredit: hasCredit === "true",
                pmeId,
                campaignId,
                status: "pending",
                currentStepOrder: 1,
                type
            },
            include: {
                campaign: true,
                activity: true,
                stepProgress: true,
            }
        });
        await tx.projectStatusHistory.create({
            data: {
                projectId: createdProject.id,
                status: "pending"
            }
        });
        let firstStepId = null;
        for (const step of campaignSteps) {
            const createdStep = await tx.projectStepProgress.create({
                data: {
                    projectId: createdProject.id,
                    campaignStepId: step.id,
                    status: step.order === 1 ? "IN_PROGRESS" : "PENDING"
                }
            });
            if (step.order === 1) {
                firstStepId = createdStep.id;
            }
        }
        if (!firstStepId) {
            throw new Error("Aucune étape initiale trouvée");
        }
        return {
            project: createdProject,
            firstStepId
        };
    });
    if (credits && Array.isArray(credits) && credits.length > 0) {
        await prisma_1.prisma.projectCredit.createMany({
            data: credits.map((c) => ({
                borrower: c.borrower,
                amount: Number(c.amount),
                interestRate: Number(c.interestRate),
                monthlyPayment: Number(c.monthlyPayment),
                dueDate: new Date(c.dueDate),
                remainingBalance: Number(c.remainingBalance),
                projectId: project.project.id
            }))
        });
    }
    /* ---------------- DOCUMENTS UPLOAD ---------------- */
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const label = req.body.documentsMeta?.[i]?.label;
        if (!file || !label) {
            throw new Error(`Document ou intitulé manquant (index ${i})`);
        }
        const uploadResult = await (0, UploadToCloudinary_1.uploadToCloudinary)(file, `projects/${project.project.id}`);
        await prisma_1.prisma.document.create({
            data: {
                title: label,
                fileUrl: uploadResult.url,
                publicId: uploadResult.publicId,
                mimeType: file.mimetype,
                size: file.size,
                projectId: project.project.id,
                projectStepId: project.firstStepId
            }
        });
    }
    /* ---------------- ACTIVITY ---------------- */
    await prisma_1.prisma.activity.create({
        data: {
            type: "PROJECT_CREATED",
            title: "Nouveau projet",
            message: "Votre projet a bien été soumis et est en attente de traitement. Vous serez informé des prochaines étapes.",
            userId: req.user.id,
            pmeId: user.pme.id
        }
    });
    /* ---------------- RESPONSE ---------------- */
    res.status(201).json(project);
});
/**
 * @description Get projects (paginated + filtered)
 * @route  GET /projects
 * @access Private
 */
exports.getProjects = (0, express_async_handler_1.default)(async (req, res) => {
    const { status, date, search, campaignId, step, limit, page } = req.query;
    const take = parseInt(limit) || 20;
    const skip = (parseInt(page) - 1 || 0) * take;
    //  Build Prisma where clause dynamically
    const where = {};
    if (status && status !== 'all') {
        where.status = status;
    }
    if (search) {
        where.title = {
            contains: String(search),
            mode: 'insensitive',
        };
    }
    if (date && date !== 'all') {
        const now = new Date();
        switch (date) {
            case 'week':
                where.createdAt = {
                    gte: new Date(now.setDate(now.getDate() - 7)),
                };
                break;
            case 'month':
                where.createdAt = {
                    gte: new Date(now.setMonth(now.getMonth() - 1)),
                };
                break;
            case 'year':
                where.createdAt = {
                    gte: new Date(now.setFullYear(now.getFullYear() - 1)),
                };
                break;
        }
    }
    if (step && step !== 'all') {
        where.stepProgress = {
            some: {
                status: 'IN_PROGRESS',
                campaignStep: {
                    order: Number(step),
                },
            },
        };
    }
    if (campaignId && campaignId !== 'all') {
        where.campaignId = campaignId;
    }
    //  Fetch data + count in one transaction
    const [projects, total] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.project.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
            include: {
                pme: {
                    include: { owner: true, promoter: { include: { user: true } } },
                },
                stepProgress: {
                    include: {
                        campaignStep: true
                    }
                },
                campaign: true
            },
        }),
        prisma_1.prisma.project.count({ where }),
    ]);
    res.status(200).json({
        data: projects,
        meta: {
            page,
            total,
            totalPages: Math.ceil(total / take),
            limit: take
        }
    });
});
/**
 * @description Get single project
 * @route  GET/projects/:id
 * @access Authentificated
 * **/
exports.getProject = (0, express_async_handler_1.default)(async (req, res) => {
    const id = req.params.id;
    if (!id) {
        res.status(400);
        throw new Error("No id specified on the request");
    }
    const project = await prisma_1.prisma.project.findUnique({
        where: { id },
        include: {
            pme: {
                include: {
                    owner: true,
                    projects: {
                        include: {
                            campaign: true
                        }
                    },
                    promoter: { include: { user: true } }
                }
            },
            campaign: true,
            stepProgress: {
                include: {
                    campaignStep: {
                        include: {
                            committee: true
                        }
                    },
                    stepDocuments: true,
                }
            },
            credits: true
        }
    });
    if (!project)
        res.status(404).json({ message: "Project not found" });
    res.status(200).json(project);
});
/**
 * @description delete a project
 * @route  DELETE/projects/id
 * @param id
 * @access Private
 * **/
exports.deleteProject = (0, express_async_handler_1.default)(async (req, res) => {
    const id = req.params.id;
    if (!id) {
        res.status(400);
        throw new Error('No project id');
    }
    const project = await prisma_1.prisma.project.findUnique({ where: { id } });
    if (!project) {
        res.status(404);
        throw new Error('No Project with such id');
    }
    const owner = await prisma_1.prisma.pME.findFirst({
        where: { id: project.pmeId }
    });
    if (!owner || req.user?.id !== owner.ownerId) {
        res.status(401);
        throw new Error("You're not allowed to delete this project");
    }
    await prisma_1.prisma.project.delete({
        where: { id }
    });
    res.json({ message: "Project deleted" });
});
/**
 * @description Get own projects
 * @route  GET/projects/me
 * @access Private
 * **/
exports.getMyProjects = (0, express_async_handler_1.default)(async (req, res) => {
    const userId = req.user.id;
    const projects = await prisma_1.prisma.project.findMany({
        where: {
            pmeId: userId
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
    if (!projects) {
        res.status(404);
        throw new Error('No projects found');
    }
    res.status(200).json(projects);
});
/**
 * @description Update a project
 * @route  PATCH/projects/id
 * @access Private
 * **/
exports.updateProject = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401);
        throw new Error('Not authentificated');
    }
    const user = req.user?.id;
    const projectId = req.params.id;
    if (!projectId) {
        res.status(400);
        throw new Error("Please , specify a project id");
    }
    console.log("Received data :", req.body);
    //     // Zod validation
    const parsedData = project_schema_2.updateProjectSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400);
        throw parsedData.error;
    }
    const { title, description, requestedAmount, existingDocuments, removedDocuments, campaignId, newCredits, existingCredits, removedCredits, hasCredit, type } = parsedData.data;
    const project = await prisma_1.prisma.project.findUnique({
        where: { id: projectId },
        include: {
            documents: true,
            stepProgress: true,
            credits: true
        }
    });
    if (!project) {
        res.status(404);
        throw new Error("Project not found");
    }
    const pme = await prisma_1.prisma.pME.findUnique({
        where: { id: project.pmeId }
    });
    if (!pme || pme.ownerId !== req.user.id) {
        res.status(403);
        throw new Error('Not allowed to update this project');
    }
    const updated = await prisma_1.prisma.project.update({
        where: { id: projectId },
        data: {
            title,
            description,
            requestedAmount,
            campaignId,
            hasCredit,
            type
        },
        include: {
            campaign: { include: { steps: true } },
            credits: true,
            statusHistory: true,
            stepProgress: { include: { stepDocuments: true } }
        }
    });
    if (existingDocuments?.length) {
        for (const doc of existingDocuments) {
            await prisma_1.prisma.document.update({
                where: { id: doc.id },
                data: { title: doc.title }
            });
        }
    }
    if (removedDocuments?.length) {
        const docsToDelete = project.documents.filter(d => removedDocuments.includes(d.id));
        for (const doc of docsToDelete) {
            await (0, RemoveFromCloudinary_1.removeFromCloudinary)(doc.publicId);
            await prisma_1.prisma.document.delete({ where: { id: doc.id } });
        }
    }
    // ---------------------------
    // Upload new documents (FIXED)
    // ---------------------------
    const files = req.files;
    if (files?.length) {
        for (const file of files) {
            /**
             * fieldname example:
             * newDocuments[2][file]
             */
            const match = file.fieldname.match(/newDocuments\[(\d+)\]\[file\]/);
            if (!match)
                continue;
            const index = Number(match[1]);
            const meta = req.body.newDocuments?.[index];
            if (!meta?.title) {
                throw new Error(`Missing title for new document at index ${index}`);
            }
            const upload = await (0, UploadToCloudinary_1.uploadToCloudinary)(file, `projects/${project.id}`);
            const currentStep = project.stepProgress.find((step) => step.status === "IN_PROGRESS");
            if (!currentStep) {
                throw new Error("Aucune étape en cours trouvée pour ce projet");
            }
            await prisma_1.prisma.document.create({
                data: {
                    title: meta.title,
                    fileUrl: upload.url,
                    publicId: upload.publicId,
                    mimeType: file.mimetype,
                    size: file.size,
                    projectId: project.id,
                    projectStepId: currentStep.id
                }
            });
        }
    }
    // Credits
    if (removedCredits?.length) {
        await prisma_1.prisma.projectCredit.deleteMany({
            where: { id: { in: removedCredits } }
        });
    }
    if (existingCredits?.length) {
        for (const credit of existingCredits) {
            await prisma_1.prisma.projectCredit.update({
                where: { id: credit.id },
                data: {
                    borrower: credit.borrower,
                    amount: credit.amount,
                    interestRate: credit.interestRate,
                    monthlyPayment: credit.monthlyPayment,
                    remainingBalance: credit.remainingBalance,
                    dueDate: credit.dueDate
                }
            });
        }
    }
    if (newCredits?.length) {
        await prisma_1.prisma.projectCredit.createMany({
            data: newCredits.map(c => ({
                borrower: c.borrower,
                amount: c.amount,
                interestRate: c.interestRate,
                monthlyPayment: c.monthlyPayment,
                remainingBalance: c.remainingBalance,
                dueDate: c.dueDate,
                projectId: projectId
            }))
        });
    }
    res.status(200).json(updated);
});
//# sourceMappingURL=project.controllers.js.map