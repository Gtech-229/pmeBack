import { CampaignType } from "../generated/prisma/enums"

export interface DimensionStat {
  label: string
  totalProjects: number
  profitableProjects: number
  unprofitableProjects: number
  profitabilityRate: number

}



export type StatsDimension = "sector" | "gender" | "ageRange" | "projectType" | "maritalStatus"  | "hasDisability"

export interface CampaignStatisticsDTO {
  campaignId: string
  totalProjects: number
  profitableProjects: number
  unprofitableProjects: number
  profitabilityRate: number
  dimension: StatsDimension | null
  breakdown: DimensionStat[]
  availableYears: number[]
}


export interface CampaignCriteriaProfile {
  hasSectorRestriction: boolean
  hasGenderRestriction: boolean
  hasAgeRestriction: boolean
  hasProjectTypeRestriction: boolean
  hasDisabilityRestriction: boolean
  hasMaritalStatusRestriction: boolean
}

export interface CampaignGeneralStatDTO {
  campaignId: string
  campaignName: string
  type: CampaignType
  totalFundedProjects: number
  profitableProjects: number
  unprofitableProjects: number
  profitabilityRate: number
  criteria: CampaignCriteriaProfile
}

export interface GeneralDimensionStat {
  label: string
  totalCampaigns: number
  profitableCampaigns: number
  unprofitableCampaigns: number
  avgProfitabilityRate: number
}

export interface GeneralStatisticsDTO {
  dimension: StatsDimension | null
  availableYears: number[]
  data: GeneralDimensionStat[]
}