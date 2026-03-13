"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signReport = exports.addMeetingReport = exports.updateMeeting = exports.getMeetingDetails = exports.getMeetings = exports.createMeeting = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const committee_schema_1 = require("../schemas/committee.schema");
const prisma_1 = require("../lib/prisma");
const committee_schema_2 = require("../schemas/committee.schema");
const UploadToCloudinary_1 = require("../utils/UploadToCloudinary");
const sendEmail_1 = require("../utils/sendEmail");
const projectvalidated_message_1 = require("../utils/templates/emails/projectvalidated.message");
const stepNotValidated_message_1 = require("../utils/templates/emails/stepNotValidated.message");
const functions_1 = require("../utils/functions");
/**
 * @description  Create a new committee
 * @route POST /committee/meetings
 * @access  Admin
 * **/
exports.createMeeting = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user || !["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
        res.status(403);
        throw new Error("Unauthorized");
    }
    const { committeeId } = req.params;
    if (!committeeId) {
        res.status(404);
        throw new Error("Aucun comite associé");
    }
    const data = committee_schema_1.createCommitteeMeetingSchema.parse(req.body);
    const { date, startTime, endTime, location } = data;
    if (startTime >= endTime) {
        res.status(400);
        throw new Error("Start time must be before end time");
    }
    const committee = await prisma_1.prisma.committee.findUnique({
        where: { id: committeeId },
    });
    if (!committee) {
        res.status(404);
        throw new Error("Committee not found");
    }
    const existingMeeting = await prisma_1.prisma.committeeMeeting.findFirst({
        where: {
            committeeId,
            date: new Date(date),
            status: "PROGRAMMED",
        },
    });
    if (existingMeeting) {
        res.status(409);
        throw new Error("A meeting is already scheduled for this date");
    }
    const meeting = await prisma_1.prisma.committeeMeeting.create({
        data: {
            committeeId,
            date: new Date(date),
            startTime,
            endTime,
            location,
        },
    });
    res.status(201).json(meeting);
});
/**
 * @description get a committee's meetings
 * @route GET /committee/:committeeId/meetings
 * @access Private
 */
exports.getMeetings = (0, express_async_handler_1.default)(async (req, res) => {
    const { committeeId } = req.params;
    if (!committeeId) {
        res.status(400);
        throw new Error("Committee id is required");
    }
    // Vérifier que le comité existe
    const committee = await prisma_1.prisma.committee.findUnique({
        where: { id: committeeId },
        select: {
            id: true
        },
    });
    if (!committee) {
        res.status(404);
        throw new Error("Committee not found");
    }
    // Récupération des réunions
    const meetings = await prisma_1.prisma.committeeMeeting.findMany({
        where: { committeeId },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
            location: true,
            createdAt: true,
            status: true,
            updatedAt: true,
            presences: true,
            report: true
        },
    });
    // Mapping DTO 
    const data = meetings.map((m) => ({
        id: m.id,
        date: m.date.toISOString(),
        startTime: m.startTime,
        endTime: m.endTime,
        location: m.location,
        createdAt: m.createdAt.toISOString(),
        status: m.status,
        committeeId,
        updatedAt: m.updatedAt.toISOString(),
        presences: m.presences,
        report: m.report
    }));
    res.status(200).json(data);
});
/**
 * @description get a single meeting details
 * @route GET /committee/meetings/:meetingId
 * @access Private
 */
exports.getMeetingDetails = (0, express_async_handler_1.default)(async (req, res) => {
    const { meetingId } = req.params;
    if (!req.user?.id) {
        res.status(401);
        throw new Error("Unauthorized");
    }
    if (!meetingId) {
        res.status(400);
        throw new Error("L'id de la reunion est requise");
    }
    //  Récupérer le meeting + committeeId
    const meeting = await prisma_1.prisma.committeeMeeting.findUnique({
        where: { id: meetingId },
        select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
            location: true,
            status: true,
            createdAt: true,
            report: {
                include: {
                    signatures: {
                        include: {
                            member: {
                                include: {
                                    user: true
                                }
                            }
                        }
                    },
                    projectDecisions: {
                        include: {
                            project: true
                        }
                    }
                },
            },
            presences: {
                include: {
                    member: {
                        include: {
                            user: true
                        }
                    }
                }
            },
            committeeId: true,
            committee: {
                include: {
                    members: {
                        include: {
                            user: true
                        }
                    },
                    step: true
                }
            }
        },
    });
    if (!meeting) {
        res.status(404);
        throw new Error("Meeting not found");
    }
    // 3 Mapper vers DTO
    const meetingDTO = {
        id: meeting.id,
        date: meeting.date.toISOString(),
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        location: meeting.location,
        status: meeting.status,
        committeeId: meeting.committeeId,
        createdAt: meeting.createdAt.toISOString(),
        committee: meeting.committee,
        report: meeting.report,
        presences: meeting.presences
    };
    res.status(200).json(meetingDTO);
});
/**
 * @description Update a committee meeting
 * @route PATCH/committee/meetings/:meetingId
 * @access Private
 */
exports.updateMeeting = (0, express_async_handler_1.default)(async (req, res) => {
    const { meetingId } = req.params;
    if (!meetingId) {
        res.status(400);
        throw new Error('Please add a meetingId');
    }
    if (!req.user?.id) {
        res.status(401);
        throw new Error("Unauthorized");
    }
    // Validation Zod
    const data = committee_schema_1.updateMeetingSchema.parse(req.body);
    if (!data) {
        res.status(400);
        throw new Error("Données invalides");
    }
    //  Vérifier que la réunion existe
    const meeting = await prisma_1.prisma.committeeMeeting.findUnique({
        where: { id: meetingId },
        include: {
            committee: {
                include: {
                    members: true,
                },
            },
        },
    });
    if (!meeting) {
        res.status(404);
        throw new Error("Meeting not found");
    }
    const isMember = meeting.committee.members.some(m => m.userId === req.user.id);
    if (!isMember) {
        res.status(403);
        throw new Error("You are not allowed to update this meeting");
    }
    if (meeting.status === "FINISHED") {
        res.status(400);
        throw new Error("Cannot update a finished meeting");
    }
    // Status transitions that require secretary role
    const statusRequiresSecretary = ["ONGOING", "CANCELED", "POSTPONED"];
    if (data.status && statusRequiresSecretary.includes(data.status)) {
        const member = meeting.committee.members.find(m => m.userId === req.user.id);
        if (member?.memberRole !== "secretary") {
            res.status(403);
            throw new Error("Seul le secrétaire peut modifier le statut de la réunion");
        }
    }
    // Block invalid status transitions
    if (data.status) {
        const validTransitions = {
            PROGRAMMED: ["ONGOING", "POSTPONED", "CANCELED"],
            ONGOING: ["FINISHED", "POSTPONED", "CANCELED"],
            POSTPONED: ["PROGRAMMED", "CANCELED"],
            CANCELED: [], // terminal
            FINISHED: [], // terminal — already blocked above
        };
        const allowed = validTransitions[meeting.status] ?? [];
        if (!allowed.includes(data.status)) {
            res.status(400);
            throw new Error(`Transition invalide : ${meeting.status} → ${data.status}`);
        }
    }
    const updatedMeeting = await prisma_1.prisma.committeeMeeting.update({
        where: { id: meetingId },
        data: {
            ...(data.date ? { date: new Date(data.date) } : {}),
            ...(data.startTime ? { startTime: data.startTime } : {}),
            ...(data.endTime ? { endTime: data.endTime } : {}),
            ...(data.location ? { location: data.location } : {}),
            ...(data.status ? { status: data.status } : {}),
        }
    });
    res.status(200).json(updatedMeeting);
});
/**
 * @description Add meeting report
 * @route POST /committee/meetings/:meetingId/report
 * @access Private (ADMIN, SUPER_ADMIN, secretary)
 */
exports.addMeetingReport = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user || !["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
        res.status(403);
        throw new Error("Unauthorized");
    }
    const { meetingId } = req.params;
    if (!meetingId) {
        res.status(400);
        throw new Error("Meeting id is required");
    }
    const parsedBody = {
        ...req.body,
        projectDecisions: JSON.parse(req.body.projectDecisions)
    };
    const data = committee_schema_2.createMeetingReportSchema.parse(parsedBody);
    const files = req.files;
    //  Vérifier le meeting
    const meeting = await prisma_1.prisma.committeeMeeting.findUnique({
        where: { id: meetingId },
        include: { report: true },
    });
    if (!meeting) {
        res.status(404);
        throw new Error("Meeting not found");
    }
    //  Statut meeting
    if (meeting.status !== "ONGOING") {
        res.status(403);
        throw new Error("Meeting must be ONGOING to create a report");
    }
    //  Vérifier membre du comité
    const committeeMember = await prisma_1.prisma.committeeMember.findUnique({
        where: {
            committeeId_userId: {
                committeeId: meeting.committeeId,
                userId: req.user.id,
            },
        },
    });
    if (!committeeMember || committeeMember.memberRole !== "secretary") {
        res.status(403);
        throw new Error("Seul(e) le sécrétaire  du comité est autorisé(e) à soumettre un rapport");
    }
    //  Empêcher doublon
    if (meeting.report) {
        res.status(409);
        throw new Error("Un rapport a déjà été soumis pour cette réunion");
    }
    // vérifier que les membres appartiennent bien au comité
    const validMembers = await prisma_1.prisma.committeeMember.findMany({
        where: {
            id: { in: data.presentMembers.map(m => m.id) },
            committeeId: meeting.committeeId,
        },
    });
    if (!validMembers) {
        res.status(409);
        throw new Error("Les membres presents associés au rapport ne font pas partir du comité");
    }
    const report = await prisma_1.prisma.$transaction(async (tx) => {
        const report = await tx.meetingReport.create({
            data: {
                meetingId: meeting.id,
                otherDecisions: data.otherDecisions ?? "",
                status: "DRAFT",
                projectDecisions: {
                    create: data.projectDecisions.map(pd => ({
                        project: {
                            connect: {
                                id: pd.projectId
                            }
                        },
                        note: pd.note ?? '',
                        decision: pd.decision,
                    }))
                }
            },
        });
        await tx.meetingPresence.createMany({
            data: validMembers.map(m => ({
                meetingId: meeting.id,
                memberId: m.id,
            })),
        });
        await tx.committeeMeeting.update({
            where: { id: meetingId },
            data: { status: "FINISHED" },
        });
        return report;
    });
    if (files?.length) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const label = req.body.documentsMeta[i]?.label;
            if (!file || !label) {
                throw new Error(`Intitule ou document${i + 1} manquant `);
            }
            const uploadResult = await (0, UploadToCloudinary_1.uploadToCloudinary)(file, `reports/${report.id}`);
            await prisma_1.prisma.reportDocument.create({
                data: {
                    label: label,
                    fileUrl: uploadResult.url,
                    publicId: uploadResult.publicId,
                    reportId: report.id
                }
            });
        }
    }
    res.status(201).json({
        success: true,
        data: report,
    });
});
/**
 * @description Sign a meeting's report
 * @route POST /committee/meetings/:meetingId/sign
 * @access Present members
 * **/
exports.signReport = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401);
        throw new Error('Unauthorized');
    }
    const userId = req.user.id;
    const { meetingId } = req.params;
    const { reportId } = req.body;
    if (!meetingId || !reportId) {
        res.status(400);
        throw new Error('Meeting and report id are required');
    }
    /**
     * Récupérer le rapport + signatures + meeting + presences
     */
    const report = await prisma_1.prisma.meetingReport.findUnique({
        where: {
            id: reportId,
        },
        include: {
            signatures: true,
            meeting: {
                include: {
                    presences: {
                        include: {
                            member: {
                                include: {
                                    user: true
                                }
                            }
                        }
                    },
                },
            },
        },
    });
    if (!report) {
        res.status(404);
        throw new Error('Rapport non trouvé');
    }
    if (!report || report.status !== 'DRAFT') {
        res.status(409);
        throw new Error('Meeting report not signable');
    }
    /*
    *
     * Vérifier que l'utilisateur est présent à la réunion
   */
    const presence = report.meeting.presences.find((p) => p.member.userId === userId);
    if (!presence) {
        res.status(403);
        throw new Error('Seuls les membres présents sont autorisés à signer le rapport');
    }
    const memberId = presence.memberId;
    /**
     * Vérifier la double signature
     */
    const alreadySigned = report.signatures.some((signature) => signature.memberId === memberId);
    if (alreadySigned) {
        res.status(409);
        throw new Error("Vous ne pouvez signer un rapport plus d'une fois");
    }
    /**
     * Créer la signature
     */
    await prisma_1.prisma.reportSignature.create({
        data: {
            reportId: report.id,
            memberId,
        },
    });
    const updatedSignatures = await prisma_1.prisma.reportSignature.findMany({
        where: { reportId: report.id }
    });
    /**
     * Vérifier si tous les présents ont signé
     */
    const presentMemberIds = report.meeting.presences.map(p => p.memberId);
    // Check every present member has signed — not just count
    const allSigned = presentMemberIds.every(memberId => updatedSignatures.some(s => s.memberId === memberId));
    if (!allSigned) {
        res.status(200).json({
            message: 'Report signed successfully',
            isApplied: false,
        });
        return;
    }
    /**
     * 🔒 TRANSACTION
     * - appliquer le rapport
     * - appliquer toutes les décisions
     */
    const decisions = await prisma_1.prisma.meetingProjectDecision.findMany({
        where: { reportId: report.id },
    });
    const projects = await Promise.all(decisions.map(d => prisma_1.prisma.project.findUnique({
        where: { id: d.projectId },
        include: {
            stepProgress: {
                include: { campaignStep: true },
                orderBy: { campaignStep: { order: 'asc' } }
            },
            pme: true,
            campaign: true,
        },
    })));
    const writeOps = [];
    for (const decision of decisions) {
        const project = projects.find(p => p?.id === decision.projectId);
        if (!project)
            continue;
        const currentStep = project.stepProgress.find(s => s.status !== 'APPROVED');
        if (!currentStep)
            continue;
        const isApproved = decision.decision === 'approved';
        const committeeComment = decision.note ?? null;
        let newProjectStatus = null;
        let nextStepOrder = null;
        let nextStepId = null;
        if (isApproved) {
            // Always try to find next step regardless of setsProjectStatus
            const nextStep = project.stepProgress.find(s => s.campaignStep.order === currentStep.campaignStep.order + 1);
            if (currentStep.campaignStep.setsProjectStatus) {
                // Set the global status
                newProjectStatus = currentStep.campaignStep.setsProjectStatus;
            }
            if (nextStep) {
                nextStepOrder = nextStep.campaignStep.order;
                nextStepId = nextStep.id;
            }
            else {
                if (!newProjectStatus) {
                    newProjectStatus = 'completed';
                }
            }
        }
        else {
            newProjectStatus = 'rejected';
        }
        writeOps.push({
            currentStepId: currentStep.id,
            isApproved,
            committeeComment,
            newProjectStatus,
            nextStepId,
            nextStepOrder,
            currentStepOrder: currentStep.campaignStep.order,
            projectId: project.id,
            project,
            decision,
        });
    }
    // ── 3. Transaction — pure DB writes only, no fetches, no emails ──
    await prisma_1.prisma.$transaction(async (tx) => {
        const updated = await tx.meetingReport.updateMany({
            where: { id: report.id, status: 'DRAFT' },
            data: { status: 'APPLIED' },
        });
        if (updated.count === 0)
            return;
        for (const op of writeOps) {
            // Update current step
            await tx.projectStepProgress.update({
                where: { id: op.currentStepId },
                data: {
                    status: op.isApproved ? 'APPROVED' : 'REJECTED',
                    validatedAt: new Date(),
                    comment: op.committeeComment,
                },
            });
            // Activate next step
            if (op.nextStepId) {
                await tx.projectStepProgress.update({
                    where: { id: op.nextStepId },
                    data: { status: 'IN_PROGRESS' },
                });
            }
            // Update project status
            if (op.newProjectStatus) {
                await tx.project.update({
                    where: { id: op.projectId },
                    data: {
                        status: op.newProjectStatus,
                        currentStepOrder: op.newProjectStatus === 'completed'
                            ? null
                            : op.nextStepOrder ?? op.currentStepOrder,
                    },
                });
                await tx.projectStatusHistory.create({
                    data: {
                        projectId: op.projectId,
                        status: op.newProjectStatus,
                        changedAt: new Date(),
                    },
                });
            }
            // Activity
            await tx.activity.create({
                data: {
                    type: op.isApproved ? 'PROJECT_APPROVED' : 'PROJECT_REJECTED',
                    title: op.isApproved
                        ? 'Nouvelle étape validée'
                        : 'Décision du comité concernant votre projet',
                    message: op.isApproved
                        ? `Félicitations ! Votre projet ${op.project.title} a passé avec succès l'étape "${op.project.stepProgress.find(s => s.id === op.currentStepId)?.campaignStep.name}".`
                        : `Nous vous informons que l'étape n'a pas été validée par le comité.`,
                    userId: op.project.pme.ownerId,
                    projectId: op.projectId,
                    pmeId: op.project.pmeId ?? undefined,
                },
            });
        }
    }, {
        timeout: 15000
    });
    // ── 4. Send emails AFTER transaction commits ──
    const emailQueue = await Promise.all(writeOps.map(async (op) => {
        const stepName = op.project.stepProgress
            .find(s => s.id === op.currentStepId)?.campaignStep.name ?? '';
        return {
            to: op.project.pme.email,
            subject: op.isApproved ? 'Nouvelle étape validée' : 'Étape non validée',
            html: op.isApproved
                ? await (0, projectvalidated_message_1.newStepValidatedMessage)(op.project.title, stepName, (0, functions_1.formatDate)(new Date()))
                : await (0, stepNotValidated_message_1.stepNotValidatedMessage)(op.project.title, stepName, (0, functions_1.formatDate)(new Date())),
        };
    }));
    // Fire and forget — don't let email failures block the response
    for (const email of emailQueue) {
        (0, sendEmail_1.sendEmail)(email).catch(err => console.error(`Failed to send email to ${email.to}`, err));
    }
    res.status(200).json({
        message: 'Report signed and applied successfully',
        isApplied: true,
    });
});
//# sourceMappingURL=committeeMeetings.controllers.js.map