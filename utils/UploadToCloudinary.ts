import cloudinary from "./cloudinary"

export interface CloudinaryUploadResult {
  url: string
  publicId: string
  resourceType: string
}

export const uploadToCloudinary = (
  file: Express.Multer.File,
  folder?: string
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
      const options: any = {
      resource_type: 'auto'
    }

    if (folder) {
      options.folder = folder
    }
    const stream = cloudinary.uploader.upload_stream(
    options,
      (error, result) => {
        if (error || !result) {
          return reject(error)
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type
        })
      }
    )

    stream.end(file.buffer)
  })
}
