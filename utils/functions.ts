import { endOfMonth, endOfWeek, endOfYear, startOfMonth, startOfWeek, startOfYear, subYears } from 'date-fns'
import { CampaignType, Gender, MaritalStatus, Prisma, ProjectType } from '../generated/prisma/client'
import { CreditComputationInput, CreditComputationResult, EnrichedProject } from 'types'
import { DimensionStat } from 'types/campaign.dto'
export const formatDate = (date: Date) =>
  date.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  })


  export const getDateFilter = (date: string): Prisma.ProjectWhereInput => {
    const now = new Date()
  
    switch (date) {
      case "week": {
        const start = startOfWeek(now, { weekStartsOn: 1 }) // Monday
        const end = endOfWeek(now, { weekStartsOn: 1 })
        return { createdAt: { gte: start, lte: end } }
      }
      case "month": {
        const start = startOfMonth(now)
        const end = endOfMonth(now)
        return { createdAt: { gte: start, lte: end } }
      }
      case "year": {
        const start = startOfYear(now)
        const end = endOfYear(now)
        return { createdAt: { gte: start, lte: end } }
      }
      default:
        return {}
    }
  }


  export const getAgeFilter = (minAge: string, maxAge: string): Prisma.ProjectWhereInput => {
  if (!minAge && !maxAge) return {}

  const now = new Date()

  // If promoter is X years old, their birthdate is between (now - X years) and (now - X+1 years)
  // minAge → promoter born at most (now - minAge years) ago  → birthdate <= now - minAge
  // maxAge → promoter born at least (now - maxAge years) ago → birthdate >= now - maxAge

  const birthdateFilter: { gte?: Date; lte?: Date } = {}

  if (maxAge) {
    // oldest allowed: born on or after (now - maxAge years)
    birthdateFilter.gte = subYears(now, Number(maxAge))
  }

  if (minAge) {
    // youngest allowed: born on or before (now - minAge years)
    birthdateFilter.lte = subYears(now, Number(minAge))
  }

  return {
    pme: {
      promoter: {
        birthDate: birthdateFilter,
      },
    },
  }
}


// Credits



export function computeCreditDetails(
  input: CreditComputationInput
): CreditComputationResult {
  const { amount, interestRate, durationMonths, startDate } = input

  const principal = amount
  const monthlyRate = interestRate / 100 / 12

  let monthlyPayment = 0

  // Cas sans intérêt
  if (monthlyRate === 0) {
    monthlyPayment = principal / durationMonths
  } else {
    monthlyPayment =
      (principal * monthlyRate) /
      (1 - Math.pow(1 + monthlyRate, -durationMonths))
  }

  const totalToRepay = monthlyPayment * durationMonths
  const totalInterest = totalToRepay - principal

  // Calcul date de fin
  const start = new Date(startDate)
  const endDate = new Date(start)
  endDate.setMonth(endDate.getMonth() + durationMonths)

  return {
    monthlyPayment: round(monthlyPayment),
    totalInterest: round(totalInterest),
    totalToRepay: round(totalToRepay),
    endDate,
  }
}

// helper pour éviter les floats dégueulasses
export function round(value: number, decimals = 2) {
  return Number(value.toFixed(decimals))
}



// Statistics utility

export const getProjectFinancials = (project: any) => {
  const fundedAmount = project.disbursements
    .filter((d: any) => d.isDisbursed)
    .reduce((sum: number, d: any) => sum + d.amount, 0)

  const totalIncome = project.financialEntries
    .filter((e: any) => e.type === "INCOME")
    .reduce((sum: number, e: any) => sum + e.amount, 0)

  const totalExpense = project.financialEntries
    .filter((e: any) => e.type === "EXPENSE")
    .reduce((sum: number, e: any) => sum + e.amount, 0)

  return {
    fundedAmount,
    totalIncome,
    totalExpense,
    netResult: totalIncome - totalExpense,
    isProfitable: totalIncome + fundedAmount > totalExpense,
  }
}

export const getAgeRange = (birthDate: Date | null | undefined): string => {
  if (!birthDate) return "Non renseigné"
  const age = Math.floor(
    (Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365)
  )
  if (age < 18) return "Moins de 18 ans"
  if (age <= 25) return "18 – 25 ans"
  if (age <= 35) return "26 – 35 ans"
  if (age <= 50) return "36 – 50 ans"
  return "Plus de 50 ans"
}

export const aggregate = (groups: Record<string, EnrichedProject[]>): DimensionStat[] => {
  return Object.entries(groups)
    .map(([label, items]) => {
      const totalProjects = items.length
      const profitableProjects = items.filter(i => i.isProfitable).length
      return {
        label,
        totalProjects,
        profitableProjects,
        unprofitableProjects: totalProjects - profitableProjects,
        profitabilityRate: Math.round((profitableProjects / totalProjects) * 100),
      }
    })
    .sort((a, b) => b.profitabilityRate - a.profitabilityRate)
}

export const groupBy = (
  enriched: EnrichedProject[],
  key: keyof EnrichedProject
): Record<string, EnrichedProject[]> => {
  return enriched.reduce((acc, p) => {
    const val = String(p[key])
    if (!acc[val]) acc[val] = []
    acc[val].push(p)
    return acc
  }, {} as Record<string, EnrichedProject[]>)
}



export const formatProjectTypeLabel :Record<ProjectType, string> ={
  COLLECTIVE : "Collectif",
  INDIVIDUAL : "Individuel",
  ALL        : "Aucune restriction"
}


export const campaignTypeLabel: Record<CampaignType, string> = {
  MONO_PROJECT: "Mono projet",
  MULTI_PROJECT: "Multi projets",
}

export const genderLabel: Record<Gender, string> = {
  MALE: "Homme",
  FEMALE: "Femme",
  ALL: "Aucune restriction",
}

export const maritalStatusLabel: Record<MaritalStatus, string> = {
  SINGLE: "Célibataire",
  MARRIED: "Marié(e)",
  DIVORCED: "Divorcé(e)",
  WIDOWED: "Veuf / Veuve",
}
  