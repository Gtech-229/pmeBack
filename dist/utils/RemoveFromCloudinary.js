"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFromCloudinary = void 0;
const cloudinary_1 = require("cloudinary");
/**
 * Supprime un fichier depuis Cloudinary
 * @param publicId - public_id du fichier Cloudinary
 * @param resourceType - type de ressource (image | raw | video)
 */
const removeFromCloudinary = async (publicId) => {
    if (!publicId)
        return;
    try {
        const result = await cloudinary_1.v2.uploader.destroy(publicId, {
            resource_type: 'image',
        });
        if (result.result !== "ok" && result.result !== "not found") {
            throw new Error(`Cloudinary deletion failed: ${result.result}`);
        }
        return result;
    }
    catch (error) {
        console.error("Cloudinary remove error:", error);
        throw error;
    }
};
exports.removeFromCloudinary = removeFromCloudinary;
//# sourceMappingURL=RemoveFromCloudinary.js.map