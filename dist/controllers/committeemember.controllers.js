"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommitteeMembers = exports.addNewMember = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = require("../lib/prisma");
const committee_schema_1 = require("../schemas/committee.schema");
/**
 * @description Add new member to a committee
 *
 * @route POST/committee/members
 *
 * @access Private
 * **/
exports.addNewMember = (0, express_async_handler_1.default)(async (req, res) => {
    // Verifier l'eligibilite de celui qui soumet la requete
    if (!req.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(req.user?.role)) {
        res.status(401);
        throw new Error('Unauthorized');
    }
    console.log('received data :', req.body);
    //  Validation Zod
    const data = committee_schema_1.createCommitteeMemberSchema.parse(req.body);
    const { userId, memberRole, committeeId } = data;
    // Vérifier que le comité existe
    const committee = await prisma_1.prisma.committee.findUnique({
        where: { id: committeeId },
        include: {
            members: true
        }
    });
    if (!committee) {
        res.status(404);
        throw new Error("Committee not found");
    }
    // Appartenance au comite de l'envoyeur
    const ismember = committee.members?.some(m => m.userId === req.user?.id);
    if (!ismember) {
        res.status(403);
        throw new Error('Seuls les membres du comites sont autorises a cette action');
    }
    //  Vérifier si l'utilisateur est déjà membre (doublon)
    const existingMember = await prisma_1.prisma.committeeMember.findFirst({
        where: {
            committeeId,
            memberRole
        },
    });
    if (existingMember) {
        res.status(409);
        throw new Error("User is already a member of this committee");
    }
    // Vérifier les rôles uniques (président / vice)
    if (memberRole === "president" || memberRole === "vice_president") {
        const roleAlreadyTaken = await prisma_1.prisma.committeeMember.findFirst({
            where: {
                committeeId,
                memberRole,
            },
        });
        if (roleAlreadyTaken) {
            res.status(409);
            throw new Error(`Role ${memberRole} is already assigned in this committee`);
        }
    }
    //  Créer le nouveau membre
    const member = await prisma_1.prisma.committeeMember.create({
        data: {
            committeeId,
            userId,
            memberRole,
        },
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
    });
    //  Réponse
    res.status(201).json({
        success: true,
        data: member,
    });
});
/**
 * @description Get a committee's members
 * @route GET /committee/:committeeId/members
 * @access Private
 */
exports.getCommitteeMembers = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401);
        throw new Error("Unauthorized");
    }
    const { committeeId } = req.params;
    if (!committeeId) {
        res.status(400);
        throw new Error("committeeId is required");
    }
    // Vérifier que le comité existe
    const committee = await prisma_1.prisma.committee.findUnique({
        where: { id: committeeId },
        select: { id: true },
    });
    if (!committee) {
        res.status(404);
        throw new Error("Committee not found");
    }
    //  Vérifier l'appartenance
    const isMember = await prisma_1.prisma.committeeMember.findUnique({
        where: {
            committeeId_userId: {
                committeeId,
                userId: req.user.id,
            },
        },
    });
    if (!isMember) {
        res.status(403);
        throw new Error("Access denied");
    }
    //  Récupérer les membres
    const members = await prisma_1.prisma.committeeMember.findMany({
        where: { committeeId },
        orderBy: { createdAt: "asc" },
        include: {
            user: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
    });
    res.status(200).json({
        success: true,
        data: members,
    });
});
//# sourceMappingURL=committeemember.controllers.js.map