import asyncHandler from "express-async-handler";
import { AuthRequest } from "types";
import { Response, Request } from "express";
import { prisma } from "../lib/prisma";
import { removeFromCloudinary } from "../utils/RemoveFromCloudinary";
import { uploadToCloudinary } from "../utils/UploadToCloudinary";


// GET /params



export const getParams = asyncHandler(async (req: Request, res: Response) => {
  let params = await prisma.generalParams.findFirst()

  // Auto-create defaults if none exist
  if (!params) {
    params = await prisma.generalParams.create({
      data: { appName: "Suivi-Mp" }
    })
  }

  res.status(200).json(params)
})

// PATCH /params
export const updateParams = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!["ADMIN", "SUPER_ADMIN"].includes(req.user?.role ?? "")) {
    res.status(401)
    throw new Error("Accès refusé")
  }

  let params = await prisma.generalParams.findFirst()

  if (!params) {
    params = await prisma.generalParams.create({ data: { appName: "Suivi-Mp" } })
  }

  // Handle logo upload
  if (req.file) {
    if (params.logoPublicId) await removeFromCloudinary(params.logoPublicId)
    const upload = await uploadToCloudinary(req.file, "general/logo")
    req.body.logoUrl = upload.url
    req.body.logoPublicId = upload.publicId
  }

  const updated = await prisma.generalParams.update({
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
  })

  res.status(200).json(updated)
})