import asyncHandler from "express-async-handler"
import { prisma } from "../lib/prisma"
import { AuthRequest } from "types"
import { Response } from "express"

/**
 * @description Get all sectors
 * @route GET /sectors
 * @access Public
 */
export const getSectors = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id ) {
    res.status(403)
    throw new Error("Accès refusé")
  }

  const sectors = await prisma.sector.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true }
  })

  res.status(200).json(sectors)
})

/**
 * @description Create a sector
 * @route POST /sectors
 * @access ADMIN | SUPER_ADMIN
 */
export const createSector = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
    res.status(403)
    throw new Error("Accès refusé")
  }

  const { name } = req.body

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    res.status(400)
    throw new Error("Le nom du secteur est requis (min. 2 caractères)")
  }

  const existing = await prisma.sector.findUnique({
    where: { name: name.trim() }
  })

  if (existing) {
    res.status(409)
    throw new Error("Ce secteur existe déjà")
  }

  const sector = await prisma.sector.create({
    data: { name: name.trim() },
    select: { id: true, name: true }
  })

  res.status(201).json(sector)
})

/**
 * @description Delete a sector
 * @route DELETE /sectors/:sectorId
 * @access ADMIN | SUPER_ADMIN
 */
export const deleteSector = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
    res.status(403)
    throw new Error("Accès refusé")
  }

  const { sectorId } = req.params

  if(!sectorId){
    res.status(400)
    throw new Error("Invalid params")
  }

  const sector = await prisma.sector.findUnique({
    where: { id: sectorId }
  })

  if (!sector) {
    res.status(404)
    throw new Error("Secteur introuvable")
  }

  await prisma.sector.delete({ where: { id: sectorId } })

  res.status(200).json({ success: true })
})