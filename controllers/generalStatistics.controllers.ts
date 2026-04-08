import asyncHandler from "express-async-handler";
import { AuthRequest } from "types";
import { Response } from "express";
import { prisma } from "../lib/prisma";
import { CampaignGeneralStatDTO, GeneralDimensionStat, StatsDimension } from "../types/campaign.dto";
import { getProjectFinancials } from "../utils/functions";


/**
 * @description Get general statistics across all campaigns
 * @route GET /statistics/campaigns?dimension=sector&year=2025
 * @access ADMIN, SUPER_ADMIN
 */
export const getGeneralStatistics = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id || !["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
    res.status(403)
    throw new Error("Accès refusé")
  }

  const { dimension, year } = req.query

  const validDimensions: StatsDimension[] = [
    "sector", "gender", "ageRange",
    "projectType", "maritalStatus", "hasDisability"
  ]

  if (dimension && !validDimensions.includes(dimension as StatsDimension)) {
    res.status(400)
    throw new Error("Dimension invalide")
  }

  // ── Fetch closed campaigns ──
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: "CLOSED",
      ...(year && {
        updatedAt: {
          gte: new Date(`${year}-01-01`),
          lte: new Date(`${year}-12-31`),
        }
      })
    },
    include: {
      criteria: {
        include: { sectors: { include: { sector: true } } }
      },
      projects: {
        where: { status: "funded" },
        include: {
          financialEntries: true,
          disbursements: true,
        }
      }
    }
  })

  // ── Compute available years ──
  const availableYears = [
    ...new Set(campaigns.map(c => new Date(c.updatedAt).getFullYear()))
  ].sort((a, b) => b - a)

  // ── Filter campaigns with at least one funded project ──
  const eligible = campaigns.filter(c => c.projects.length > 0)

  if (!eligible.length) {
    res.status(200).json({
      dimension: dimension ?? null,
      availableYears,
      data: []
    })
    return
  }

  // ── Determine if a campaign is profitable ──
  const isCampaignProfitable = (campaign: typeof eligible[0]): boolean => {
    const total = campaign.projects.length
    if (total === 0) return false
    const profitable = campaign.projects.filter(p => {
      const { isProfitable } = getProjectFinancials(p)
      return isProfitable
    }).length
    return Math.round((profitable / total) * 100) > 50
  }

  // ── Group campaigns by dimension option ──
  const groupCampaignsByDimension = (
    campaigns: typeof eligible,
    dim: StatsDimension
  ): Record<string, typeof eligible> => {
    const groups: Record<string, typeof eligible> = {}

    for (const campaign of campaigns) {
      const criteria = campaign.criteria
      let options: string[] = []

      switch (dim) {
        case "sector":
          options = criteria?.sectors?.map(s => s.sector.name) ?? []
          break

        case "gender":
          if (criteria?.gender && criteria.gender !== "ALL") {
            options = [criteria.gender]
          }
          break

        case "maritalStatus":
          options = criteria?.maritalStatus ?? []
          break

        case "projectType":
          if (criteria?.projectType && criteria.projectType !== "ALL") {
            options = [criteria.projectType]
          }
          break

        case "ageRange":
          if (criteria?.minAge || criteria?.maxAge) {
            const min = criteria.minAge ? `${criteria.minAge}` : ""
            const max = criteria.maxAge ? `${criteria.maxAge}` : ""
            const label = min && max
              ? `${min} – ${max} ans`
              : min ? `Min. ${min} ans`
              : `Max. ${max} ans`
            options = [label]
          }
          break

        case "hasDisability":
          if (criteria?.hasDisability !== null && criteria?.hasDisability !== undefined) {
            options = [criteria.hasDisability ? "Avec handicap" : "Sans handicap"]
          }
          break
      }

      // campaign contributes to each option bar
      for (const option of options) {
        if (!groups[option]) groups[option] = []
        groups[option].push(campaign)
      }
    }

    return groups
  }

  // ── Build data ──
  let data: GeneralDimensionStat[] = []

  if (dimension) {
    const groups = groupCampaignsByDimension(eligible, dimension as StatsDimension)

    data = Object.entries(groups)
      .filter(([_, campaigns]) => campaigns.length >= 2) // minimum threshold
      .map(([label, campaigns]) => {
        const totalCampaigns = campaigns.length
        const profitableCampaigns = campaigns.filter(isCampaignProfitable).length
        const unprofitableCampaigns = totalCampaigns - profitableCampaigns
        const avgProfitabilityRate = Math.round(
          (profitableCampaigns / totalCampaigns) * 100
        )

        return {
          label,
          totalCampaigns,
          profitableCampaigns,
          unprofitableCampaigns,
          avgProfitabilityRate,
        }
      })
      .sort((a, b) => b.avgProfitabilityRate - a.avgProfitabilityRate)
  }

  res.status(200).json({
    dimension: dimension ?? null,
    availableYears,
    data,
  })
})