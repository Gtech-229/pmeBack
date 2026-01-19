"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommitteeDetails = exports.getCommittees = exports.getCommitteeProjects = exports.getCommitteUsers = exports.createCommittee = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = require("../lib/prisma");
const enums_1 = require("../generated/prisma/enums");
const committee_schema_1 = require("../schemas/committee.schema");
/**
 * @description Add a new committee
 * @route  POST/committee
 * @access Authentificated Admin
 * **/
exports.createCommittee = (0, express_async_handler_1.default)(async (req, res) => {
    const parsed = committee_schema_1.createCommitteeSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400);
        throw new Error('Invalid datas');
    }
    const { name, description, members } = parsed.data;
    /* ================= VALIDATIONS ================= */
    if (!name) {
        res.status(400);
        throw new Error("Le nom du comité est requis");
    }
    if (!members || members.length === 0) {
        res.status(400);
        throw new Error("Un comité doit avoir au moins un membre");
    }
    // Vérifier les doublons
    const userIds = members.map((m) => m.userId);
    const hasDuplicates = new Set(userIds).size !== userIds.length;
    if (hasDuplicates) {
        res.status(400);
        throw new Error("Un utilisateur ne peut être ajouté qu'une seule fois");
    }
    /* ================= CREATE COMMITTEE ================= */
    const committee = await prisma_1.prisma.committee.create({
        data: {
            name,
            description,
            members: {
                create: members.map((member) => ({
                    userId: member.userId,
                    memberRole: member.memberRole,
                }))
            }
        },
        include: {
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                }
            }
        }
    });
    /* ================= RESPONSE ================= */
    res.status(201).json({
        success: true,
        message: "Comité créé avec succès",
        data: committee
    });
});
/**
 * @description Get users to add to a committee
 * @route  GET/commitees/users
 * @access Authentificated Admin
 * **/
exports.getCommitteUsers = (0, express_async_handler_1.default)(async (req, res) => {
    const users = await prisma_1.prisma.user.findMany({
        where: {
            role: {
                in: [enums_1.Role.ADMIN, enums_1.Role.SUPER_ADMIN],
            },
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
        },
        orderBy: {
            lastName: "asc",
        },
    });
    res.status(200).json(users);
});
/**
 * @description Get projects to manage during a committee
 * @route  GET/commitees/projects
 * @access Authentificated Admin
 * **/
exports.getCommitteeProjects = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user?.id || !['ADMIN', 'SUPER_ADMIN'].includes(req.user?.role)) {
        res.status(401);
        throw new Error('Unauthorized');
    }
    const projects = await prisma_1.prisma.project.findMany({
        include: {
            pme: {
                include: {
                    owner: true
                }
            },
            documents: true,
            subSteps: true
        }
    });
    res.status(200).json(projects);
});
/**
 * @description Get committees
 * @route GET /committee
 * @access Authenticated admin
 */
exports.getCommittees = (0, express_async_handler_1.default)(async (req, res) => {
    // Vérification du rôle admin
    if (!req.user) {
        res.status(403);
        throw new Error("Access denied");
    }
    // Récupérer tous les comités avec relations
    const committees = await prisma_1.prisma.committee.findMany({
        include: {
            members: {
                include: {
                    user: true
                },
            },
            meetings: true
        },
        orderBy: { createdAt: "desc" },
    });
    res.status(200).json(committees);
});
/**
 * @description Get committee details by id
 * @route GET /committee/:id
 * @access Authenticated
 */
exports.getCommitteeDetails = (0, express_async_handler_1.default)(async (req, res) => {
    const { id } = req.params;
    if (!id) {
        res.status(400);
        throw new Error("Committee id is required");
    }
    const committee = await prisma_1.prisma.committee.findUnique({
        where: { id },
        include: {
            members: {
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                    presences: true
                },
                orderBy: {
                    createdAt: "asc",
                },
            },
        },
    });
    if (!committee) {
        res.status(404);
        throw new Error("Committee not found");
    }
    res.status(200).json(committee);
});
//# sourceMappingURL=committee.controllers.js.map