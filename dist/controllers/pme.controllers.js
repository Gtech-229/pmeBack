"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPmes = exports.deleteProfileImg = exports.updateProfile = exports.getPme = exports.validateAccount = exports.createPMESchema = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = require("../lib/prisma");
const pme_onBoarding_1 = require("../schemas/pme.onBoarding");
const RemoveFromCloudinary_1 = require("../utils/RemoveFromCloudinary");
const UploadToCloudinary_1 = require("../utils/UploadToCloudinary");
exports.createPMESchema = pme_onBoarding_1.fullOnboardingSchema.strict();
/**
 * @description : Set a user's account as validated and create his PME
 * @Route : POST/api/onboarding/pme
 */
exports.validateAccount = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401);
        throw new Error("User not authenticated");
    }
    const userId = req.user.id;
    /* ---------------- VALIDATION ---------------- */
    const parsed = exports.createPMESchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400);
        throw parsed.error;
    }
    const { promoter, ...data } = parsed.data;
    /* ---------------- LOCATION ---------------- */
    const hasAdministrative = data.administrative &&
        Object.keys(data.administrative).length > 0;
    const location = hasAdministrative
        ? { administrative: data.administrative, city: null }
        : { administrative: {}, city: data.city ?? null };
    /* ---------------- USER CHECK ---------------- */
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: userId },
        select: { codeIsVerified: true, validatedAt: true }
    });
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }
    if (!user.codeIsVerified) {
        res.status(403);
        throw new Error("Email not verified");
    }
    if (user.validatedAt) {
        res.status(409);
        throw new Error("Account already validated");
    }
    /* ---------------- TRANSACTION ---------------- */
    await prisma_1.prisma.$transaction(async (tx) => {
        const createdPme = await tx.pME.create({
            data: {
                ownerId: userId,
                name: data.name,
                phone: data.phone,
                address: data.address,
                email: data.email,
                description: data.description,
                type: data.type,
                size: data.size,
                country: data.country,
                currency: data.currency,
                administrative: location.administrative,
                city: location.city,
            }
        });
        await tx.promoter.create({
            data: {
                userId,
                pmeId: createdPme.id,
                gender: promoter.gender,
                birthDate: new Date(promoter.birthDate),
                maritalStatus: promoter.maritalStatus,
                hasDisability: promoter.hasDisability,
                disabilityType: promoter.hasDisability ? promoter.disabilityType : null,
                role: promoter.role ?? "",
            }
        });
        await tx.user.update({
            where: { id: userId },
            data: {
                validatedAt: new Date(),
                isActive: true,
            }
        });
        await tx.activity.create({
            data: {
                type: "ACCOUNT_VERIFIED",
                title: "Compte Vérifié",
                message: "Félicitations. La vérification de votre organisation a été effectuée avec succès. Vous pouvez désormais procéder à la soumission d'un projet.",
                userId,
                pmeId: createdPme.id,
            }
        });
    });
    res.status(200).json({
        success: true,
        message: "Account successfully validated",
    });
});
/**
 * @description : Get the connected user's pme Details
 * @route : GET/api/onboarding/pme
 * @access Private
 * **/
exports.getPme = (0, express_async_handler_1.default)(async (req, res) => {
    // Get the user
    if (!req.user?.id) {
        res.status(401);
        throw new Error('No user Id');
    }
    // Get the xuser's Pme
    const pme = await prisma_1.prisma.pME.findUnique({
        where: {
            ownerId: req.user.id,
        },
        relationLoadStrategy: 'join',
        include: {
            projects: {
                include: {
                    campaign: true,
                    stepProgress: {
                        include: {
                            campaignStep: true
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }
        }
    });
    if (!pme) {
        res.status(404);
        throw new Error("Pas d'organisation");
    }
    res.status(200).json(pme);
});
/**
 * @description : Update pme profil image
 * @Route : PUT/onboarding/pme/:id
 * @Access Private
 * **/
exports.updateProfile = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401);
        throw new Error('Unauthorized');
    }
    const { id: pmeId } = req.params;
    if (!pmeId) {
        res.status(400);
        throw new Error('The pmeId is required');
    }
    if (!req.file) {
        res.status(400);
        throw new Error("No image provided");
    }
    // Vérifier la PME
    const pme = await prisma_1.prisma.pME.findUnique({
        where: { id: pmeId },
    });
    if (!pme) {
        res.status(404);
        throw new Error("PME not found");
    }
    //  Supprimer l’ancienne image si elle existe
    if (pme.logoId) {
        await (0, RemoveFromCloudinary_1.removeFromCloudinary)(pme.logoId);
    }
    const uploadResult = await (0, UploadToCloudinary_1.uploadToCloudinary)(req.file, `profiles/${pme.id}`);
    await prisma_1.prisma.pME.update({
        where: { id: pmeId },
        data: {
            logoUrl: uploadResult.url,
            logoId: uploadResult.publicId,
        },
    });
    res.status(200).json({
        message: "Profile image updated successfully"
    });
});
exports.deleteProfileImg = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401);
        throw new Error('Unauthorized');
    }
    const { id: pmeId } = req.params;
    if (!pmeId) {
        res.status(400);
        throw new Error('The pmeId is required');
    }
    // Vérifier la PME
    const pme = await prisma_1.prisma.pME.findUnique({
        where: { id: pmeId },
    });
    if (!pme) {
        res.status(404);
        throw new Error("PME not found");
    }
    //  Supprimer l’ancienne image si elle existe
    if (pme.logoId) {
        await (0, RemoveFromCloudinary_1.removeFromCloudinary)(pme.logoId);
    }
    await prisma_1.prisma.pME.update({
        where: { id: pmeId },
        data: {
            logoUrl: null,
            logoId: null,
        },
    });
    res.status(200).json({
        message: "Profile image deleted successfully"
    });
});
exports.getPmes = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user) {
        res.status(403);
        throw new Error("Access denied");
    }
    const { search, page, limit } = req.query;
    const take = parseInt(limit) || 20;
    const skip = (parseInt(page) - 1 || 0) * take;
    const where = {
        ...(search
            ? {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                    { city: { contains: search, mode: "insensitive" } }
                ],
            }
            : {}),
    };
    const [data, total] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.pME.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
        }),
        prisma_1.prisma.pME.count({ where }),
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
//# sourceMappingURL=pme.controllers.js.map