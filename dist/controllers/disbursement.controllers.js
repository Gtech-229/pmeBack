"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.confirmDisbursement = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = require("../lib/prisma");
/**
 * @description Confirm a fund disbursement tranche
 * @route PATCH /disbursements/:id/confirm
 * @access ADMIN, SUPER_ADMIN
 */
exports.confirmDisbursement = (0, express_async_handler_1.default)(async (req, res) => {
    if (!req.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
        res.status(403);
        throw new Error("Accès refusé");
    }
    const { id } = req.params;
    if (!id) {
        res.status(400);
        throw new Error("Id de la tranche manquant");
    }
    const disbursement = await prisma_1.prisma.fundDisbursement.findUnique({
        where: { id },
        include: {
            decision: {
                include: {
                    report: {
                        select: { status: true }
                    }
                }
            }
        }
    });
    if (!disbursement) {
        res.status(404);
        throw new Error("Tranche introuvable");
    }
    // only confirm tranches from applied reports
    if (disbursement.decision.report.status !== "APPLIED") {
        res.status(400);
        throw new Error("Le rapport associé n'a pas encore été appliqué");
    }
    if (disbursement.isDisbursed) {
        res.status(409);
        throw new Error("Cette tranche a déjà été confirmée");
    }
    const updated = await prisma_1.prisma.fundDisbursement.update({
        where: { id },
        data: {
            isDisbursed: true,
            actualDate: new Date(),
        }
    });
    res.status(200).json(updated);
});
//# sourceMappingURL=disbursement.controllers.js.map