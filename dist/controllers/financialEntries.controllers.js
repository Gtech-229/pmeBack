"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFinancialEntry = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const project_schema_1 = require("../schemas/project.schema");
const prisma_1 = require("../lib/prisma");
const UploadToCloudinary_1 = require("../utils/UploadToCloudinary");
exports.addFinancialEntry = (0, express_async_handler_1.default)(async (req, res) => {
    console.log(req.body);
    const { projectId } = req.params;
    if (!projectId) {
        res.status(400);
        throw new Error("Id du projet manquant");
    }
    const parsed = project_schema_1.financialEntrySchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400);
        throw new Error(parsed.error.message);
    }
    const { type, category, label, amount, date, note } = parsed.data;
    // verify project exists and belongs to requesting user
    const project = await prisma_1.prisma.project.findUnique({
        where: { id: projectId },
        select: {
            id: true,
            pme: { select: { promoter: { select: { userId: true } } } }
        }
    });
    if (!project) {
        res.status(404);
        throw new Error("Projet introuvable");
    }
    if (project.pme.promoter?.userId !== req.user?.id) {
        res.status(403);
        throw new Error("Accès refusé");
    }
    // handle file upload if present
    let documentUrl = null;
    let documentName = null;
    let mimeType = null;
    let size = null;
    if (req.file) {
        // assuming you use cloudinary or similar — adapt to your upload logic
        const uploaded = await (0, UploadToCloudinary_1.uploadToCloudinary)(req.file);
        documentUrl = uploaded.url;
        documentName = req.body.documentName ?? req.file.originalname;
        mimeType = req.file.mimetype;
        size = req.file.size;
    }
    const entry = await prisma_1.prisma.financialEntry.create({
        data: {
            projectId,
            type,
            category,
            label,
            amount,
            date: new Date(date),
            note: note ?? null,
            documentUrl,
            documentName,
            mimeType,
            size,
        }
    });
    // map to DTO shape
    res.status(201).json({
        id: entry.id,
        projectId: entry.projectId,
        type: entry.type,
        category: entry.category,
        label: entry.label,
        amount: entry.amount,
        date: entry.date.toISOString(),
        note: entry.note,
        documentUrl: entry.documentUrl,
        documentName: entry.documentName,
        mimeType: entry.mimeType,
        size: entry.size,
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
    });
});
//# sourceMappingURL=financialEntries.controllers.js.map