import { v2 as cloudinary } from "cloudinary";

/**
 * Supprime un fichier depuis Cloudinary
 * @param publicId - public_id du fichier Cloudinary
 * @param resourceType - type de ressource (image | raw | video)
 */
export const removeFromCloudinary = async (
  publicId: string,
  
) => {
  if (!publicId) return;

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });

    if (result.result !== "ok" && result.result !== "not found") {
      throw new Error(`Cloudinary deletion failed: ${result.result}`);
    }

    return result;
  } catch (error) {
    console.error("Cloudinary remove error:", error);
    throw error;
  }
};
