import asyncHandler from "express-async-handler";
import { AuthRequest, Dimension, EnrichedProject } from "types";
import { Response } from "express";
import { prisma } from "../lib/prisma";
import { DimensionStat } from "../types/campaign.dto";
import { aggregate, formatProjectTypeLabel, genderLabel, getAgeRange, getProjectFinancials, groupBy, maritalStatusLabel } from "../utils/functions";







/**
 * @description Get campaign statistics
 * @route GET /campaign/:campaignId/statistics?dimension=sector&year=2025
 * @access ADMIN, SUPER_ADMIN
 */
export const getCampaignStatistics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { campaignId } = req.params
  const { dimension, year } = req.query

  if (!campaignId) {
    res.status(400)
    throw new Error("Campaign id manquant")
  }

  const validDimensions: Dimension[] = [
    "sector", "gender", "ageRange",
    "projectType", "maritalStatus", "hasDisability"
  ]

  if (dimension && !validDimensions.includes(dimension as Dimension)) {
    res.status(400)
    throw new Error("Dimension invalide")
  }

  // ── Fetch funded projects ──
  const projects = await prisma.project.findMany({
    where: {
      campaignId,
      status: "funded",
      ...(year && {
        updatedAt: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        }
      })
    },
    include: {
      financialEntries: true,
      disbursements: true,
      sector: true,
      pme: {
        include: {
          promoter: {
            include: { user: true }
          }
        }
      }
    }
  })

  // ── Compute available years from actual data ──
  const availableYears = [
    ...new Set(
      projects.map(p => new Date(p.updatedAt).getFullYear())
    )
  ].sort((a, b) => b - a) // most recent first

  // ── Empty state ──
  if (!projects.length) {
    res.status(200).json({
      campaignId,
      totalProjects: 0,
      profitableProjects: 0,
      unprofitableProjects: 0,
      profitabilityRate: 0,
      dimension: dimension ?? null,
      breakdown: [],
      availableYears,
    })
    return
  }

  // ── Enrich ──
  const enriched: EnrichedProject[] = projects.map(p => {
    const financials = getProjectFinancials(p)
    return {
      projectId: p.id,
      sector: p.sector?.name ?? "Non renseigné",
      gender: p.pme.promoter?.gender ? genderLabel[p.pme.promoter?.gender] : "Non renseigné",
      ageRange: getAgeRange(p.pme.promoter?.birthDate),
      projectType: formatProjectTypeLabel[p.type],
      maritalStatus:  p.pme.promoter?.maritalStatus  ? maritalStatusLabel[ p.pme.promoter?.maritalStatus ] : "Non renseigné",
      hasDisability: p.pme.promoter?.hasDisability
        ? "En situation de handicap"
        : "Sans handicap",
      ...financials,
    }
  })

  // ── Global stats ──
  const profitableProjects  = enriched.filter(p => p.isProfitable).length
  const unprofitableProjects = enriched.length - profitableProjects

  // ── Breakdown ──
  const breakdown = dimension
    ? aggregate(groupBy(enriched, dimension as keyof EnrichedProject))
    : []

  res.status(200).json({
    campaignId,
    totalProjects: enriched.length,
    profitableProjects,
    unprofitableProjects,
    profitabilityRate: Math.round((profitableProjects / enriched.length) * 100),
    dimension: dimension ?? null,
    breakdown,
    availableYears,
  })
})