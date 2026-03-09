"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateParams = exports.getParams = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = require("../lib/prisma");
const RemoveFromCloudinary_1 = require("../utils/RemoveFromCloudinary");
const UploadToCloudinary_1 = require("../utils/UploadToCloudinary");
// GET /params
exports.getParams = (0, express_async_handler_1.default)(async (req, res) => {
    let params = await prisma_1.prisma.generalParams.findFirst();
    // Auto-create defaults if none exist
    if (!params) {
        params = await prisma_1.prisma.generalParams.create({
            data: { appName: "Suivi-Mp" }
        });
    }
    res.status(200).json(params);
});
// PATCH /params
exports.updateParams = (0, express_async_handler_1.default)(async (req, res) => {
    if (!["ADMIN", "SUPER_ADMIN"].includes(req.user?.role ?? "")) {
        res.status(403);
        throw new Error("Accès refusé");
    }
    let params = await prisma_1.prisma.generalParams.findFirst();
    if (!params) {
        params = await prisma_1.prisma.generalParams.create({ data: { appName: "Suivi-Mp" } });
    }
    // Handle logo upload
    if (req.file) {
        if (params.logoPublicId)
            await (0, RemoveFromCloudinary_1.removeFromCloudinary)(params.logoPublicId);
        const upload = await (0, UploadToCloudinary_1.uploadToCloudinary)(req.file, "general/logo");
        req.body.logoUrl = upload.url;
        req.body.logoPublicId = upload.publicId;
    }
    const updated = await prisma_1.prisma.generalParams.update({
        where: { id: params.id },
        data: {
            ...(req.body.appName ? { appName: req.body.appName } : {}),
            ...(req.body.logoUrl ? { logoUrl: req.body.logoUrl } : {}),
            ...(req.body.logoPublicId ? { logoPublicId: req.body.logoPublicId } : {}),
            ...(req.body.primaryColor ? { primaryColor: req.body.primaryColor } : {}),
            ...(req.body.contactEmail ? { contactEmail: req.body.contactEmail } : {}),
            ...(req.body.contactPhone ? { contactPhone: req.body.contactPhone } : {}),
            ...(req.body.address ? { address: req.body.address } : {}),
            ...(req.body.website ? { website: req.body.website } : {}),
        }
    });
    res.status(200).json(updated);
});
//# sourceMappingURL=generalParams.controllers.js.map