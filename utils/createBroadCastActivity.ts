import { ActivityType } from '../generated/prisma/enums'
import {prisma} from '../lib/prisma'
// utils/createBroadcastActivity.ts
export const createBroadcastActivity = async (
  type: ActivityType,
  title: string,
  message: string,
  data?: Record<string, any>
) => {
  // get all PME users
  const users = await prisma.user.findMany({
    where: { role: 'PME', isActive: true },
    select: { id: true }
  })

  // batch create activities
  await prisma.activity.createMany({
    data: users.map(u => ({
      type,
      title,
      message,
      userId: u.id,
      ...data
    }))
  })
}