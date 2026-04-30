import { prisma } from "../lib/prisma"



export const sendPushNotification = async (
  pushToken: string,
  title: string,
  body: string,
  data?: Record<string, any>
) => {
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: pushToken,
      title,
      body,
      data,
      sound: 'default',
    }),
  })
}

export const sendBroadcastNotification = async (
  title: string,
  body: string,
  data?: Record<string, any>
) => {
  // fetch all users with a push token
  const users = await prisma.user.findMany({
    where: {
      pushToken: { not: null },
      isActive: true,
    },
    select: { id: true, pushToken: true }
  })

  if (users.length === 0) return

  // Expo push API accepts up to 100 messages per request
  const chunks = chunkArray(
    users.map(u => ({
      to: u.pushToken!,
      title,
      body,
      data,
      sound: 'default',
    })),
    100
  )

  for (const chunk of chunks) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chunk), // array of up to 100
    })
  }
}

const chunkArray = <T>(arr: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

