"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteRepayment = exports.addRepayment = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const project_schema_1 = require("../schemas/project.schema");
const prisma_1 = require("../lib/prisma");
/**
 * @description Add a new repayment
 * @route  POST/credits/:creditId/repayments
 * @access Connected User
 * **/
exports.addRepayment = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user?.id) {
        res.status(401);
        throw new Error("Unauthorized");
    }
    const { creditId } = req.params;
    if (!creditId) {
        res.status(400);
        throw new Error("L'id du credit est requis");
    }
    const parsed = project_schema_1.creditRepaymentSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400);
        throw new Error(parsed.error.message);
    }
    const { amountPaid, paidAt, note } = parsed.data;
    // fetch credit
    const credit = await prisma_1.prisma.projectCredit.findUnique({
        where: { id: creditId },
        include: {
            repayments: {
                orderBy: { paidAt: 'desc' },
                take: 1,
            }
        }
    });
    if (!credit) {
        res.status(404);
        throw new Error("Crédit introuvable");
    }
    if (credit.status === "COMPLETED") {
        res.status(400);
        throw new Error("Ce crédit est déjà soldé");
    }
    if (amountPaid > credit.remainingBalance) {
        res.status(400);
        throw new Error(`Seulement (${credit.remainingBalance}) reste a payer`);
    }
    // compute server-side fields
    const remainingAfter = credit.remainingBalance - amountPaid;
    const expectedPaymentCount = credit.repayments.length + 1;
    const expectedDate = new Date(credit.startDate);
    expectedDate.setMonth(expectedDate.getMonth() + expectedPaymentCount);
    const isLate = new Date(paidAt) > expectedDate;
    // transaction — create repayment + update credit
    const updated = await prisma_1.prisma.$transaction(async (tx) => {
        await tx.creditRepayment.create({
            data: {
                creditId,
                amountPaid,
                paidAt: new Date(paidAt),
                remainingAfter,
                isLate,
                note: note ?? null,
            }
        });
        return tx.projectCredit.update({
            where: { id: creditId },
            data: {
                remainingBalance: remainingAfter,
                status: remainingAfter === 0 ? "COMPLETED" : "ACTIVE",
            },
            include: {
                repayments: {
                    orderBy: { paidAt: 'desc' }
                }
            }
        });
    });
    res.status(201).json(updated);
});
/**
 * @description Delete a  repayment
 * @route  DELETE/credits/:creditId/repayments/:id
 * @access Connected Admin
 * **/
exports.deleteRepayment = (0, express_async_handler_1.default)(async (req, res) => {
    const { creditId, id } = req.params;
    if (!req.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(req.user?.role)) {
        res.status(401);
        throw new Error("Accès refusé");
    }
    if (!creditId || !id) {
        res.status(400);
        throw new Error("Paramètres manquants");
    }
    // fetch credit with repayments sorted desc
    const credit = await prisma_1.prisma.projectCredit.findUnique({
        where: { id: creditId },
        include: {
            repayments: {
                orderBy: { paidAt: 'desc' }
            }
        }
    });
    if (!credit) {
        res.status(404);
        throw new Error("Crédit introuvable");
    }
    // verify repayment exists and belongs to this credit
    const repayment = credit.repayments.find(r => r.id === id);
    if (!repayment) {
        res.status(404);
        throw new Error("Remboursement introuvable");
    }
    // only allow deleting the most recent repayment
    const isLatest = credit.repayments[0]?.id === id;
    if (!isLatest) {
        res.status(400);
        throw new Error("Seul le dernier remboursement peut être supprimé");
    }
    // transaction — delete repayment + restore credit balance
    const updated = await prisma_1.prisma.$transaction(async (tx) => {
        await tx.creditRepayment.delete({
            where: { id }
        });
        const restoredBalance = credit.remainingBalance + repayment.amountPaid;
        return tx.projectCredit.update({
            where: { id: creditId },
            data: {
                remainingBalance: restoredBalance,
                status: restoredBalance > 0 ? "ACTIVE" : "COMPLETED",
            },
            include: {
                repayments: {
                    orderBy: { paidAt: 'desc' }
                }
            }
        });
    });
    res.status(200).json(updated);
});
//# sourceMappingURL=repayment.controllers.js.map