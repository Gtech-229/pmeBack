import asyncHandler from "express-async-handler";
import { AuthRequest } from "types";
import { Response } from "express";
import { prisma } from "../lib/prisma";


export const getSummury = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.id) {
    res.status(401)
    throw new Error('Unauthorized')
  }

  const user = await prisma.user.findUnique({
    where: {
      id: req.user.id,
      role: req.user.role
    }
  })

  if (!user) {
    res.status(404)
    throw new Error('User not found')
  }

  const lastLogin = user.lastLoginAt ?? new Date(0)

  // 🔹 Nouveaux utilisateurs
  const newUsers = await prisma.user.count({
    where: {
      createdAt: { gt: lastLogin }
    }
  })

  // 🔹 Nouveaux projets
  const newProjects = await prisma.project.count({
    where: {
      createdAt: { gt: lastLogin }
    }
  })

  // 🔹 Nouvelles réunions de comité
  const newMeetings = await prisma.committeeMeeting.count({
    where: {
      createdAt: { gt: lastLogin }
    }
  })

  // 🔹 Dernières réunions (ex: 5)
  const latestMeetings = await prisma.committeeMeeting.findMany({
    orderBy: {
      startTime: 'desc'
    },
    take: 5,
    include: {
      committee: {
        select: {
          id: true,
          name: true
        }
      }
    }
  })

  const summary = {
    newUsers,
    newProjects,
    newMeetings,
    latestMeetings
  }

  res.status(200).json(summary)
})
