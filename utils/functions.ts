import { endOfMonth, endOfWeek, endOfYear, startOfMonth, startOfWeek, startOfYear, subYears } from 'date-fns'
import { Prisma } from 'generated/prisma/client'
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
  