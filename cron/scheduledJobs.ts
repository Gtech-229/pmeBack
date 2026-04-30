// cron/scheduledJobs.ts
import cron from 'node-cron'
import { prisma } from '../lib/prisma'
import { sendPushNotification } from '../utils/sendPushNotifications'

// ─── Run every day at 9:00 AM ─────────────────────────────────────────────────
export const startScheduledJobs = () => {

  cron.schedule('0 9 * * *', async () => {
    console.log('Running scheduled jobs...', new Date().toISOString())
    await Promise.allSettled([
      checkRepaymentReminders(),
      checkCampaignClosingSoon(),
    ])
  })

  console.log('Scheduled jobs registered')
}

// ─── REPAYMENT_REMINDER ───────────────────────────────────────────────────────
// Notify users whose next repayment is due in 3 days

const checkRepaymentReminders = async () => {
  try {
    const in3Days = new Date()
    in3Days.setDate(in3Days.getDate() + 3)
    in3Days.setHours(0, 0, 0, 0)

    const dayAfter = new Date(in3Days)
    dayAfter.setDate(dayAfter.getDate() + 1)

    // fetch all active credits
    const activeCredits = await prisma.projectCredit.findMany({
      where: { status: 'ACTIVE' },
      include: {
        repayments: {
          orderBy: { paidAt: 'desc' },
        },
        project: {
          include: {
            pme: {
              include: {
                owner: {
                  select: { id: true, pushToken: true }
                }
              }
            }
          }
        }
      }
    })

  for (const credit of activeCredits) {
  const repaymentCount = credit.repayments.length
  const nextPaymentNumber = repaymentCount + 1

  // compute next expected payment date
  const expectedDate = new Date(credit.startDate)
  expectedDate.setDate(1)
  expectedDate.setMonth(expectedDate.getMonth() + nextPaymentNumber)

  // check if next payment falls in 3 days
  const isIn3Days =
    expectedDate >= in3Days &&
    expectedDate < dayAfter

  if (!isIn3Days) continue

  const owner = credit.project.pme.owner
  if (!owner) continue

  // ── Prevent duplicate — scoped to this specific credit ───────────────
  const alreadyNotified = await prisma.activity.findFirst({
    where: {
      userId: owner.id,
      type: 'REPAYMENT_REMINDER',
      creditId: credit.id, // ← scope to this credit
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    }
  })

  if (alreadyNotified) continue

  const notifications: Promise<any>[] = [
    prisma.activity.create({
      data: {
        type: 'REPAYMENT_REMINDER',
        title: 'Rappel de remboursement',
        message: `Votre prochain remboursement de ${credit.monthlyPayment.toLocaleString('fr-FR')} est prévu dans 3 jours (${expectedDate.toLocaleDateString('fr-FR')}).`,
        userId: owner.id,
        creditId: credit.id, // ← link to credit
      }
    })
  ]

  if (owner.pushToken) {
    notifications.push(
      sendPushNotification(
        owner.pushToken,
        '⏰ Rappel de remboursement',
        `Votre remboursement de ${credit.monthlyPayment.toLocaleString('fr-FR')} est dû dans 3 jours.`,
        { creditId: credit.id, type: 'REPAYMENT_REMINDER' }
      )
    )
  }

  await Promise.allSettled(notifications)
}

console.log(`Repayment reminders checked for ${activeCredits.length} credits`)

  } catch (err) {
    console.error('checkRepaymentReminders error:', err)
  }
}

// ─── CAMPAIGN_CLOSING_SOON ────────────────────────────────────────────────────
// Notify users who submitted a project to a campaign closing in 5 days

const checkCampaignClosingSoon = async () => {
  try {
    const in5Days = new Date()
    in5Days.setDate(in5Days.getDate() + 5)
    in5Days.setHours(0, 0, 0, 0)

    const dayAfter = new Date(in5Days)
    dayAfter.setDate(dayAfter.getDate() + 1)

    // find campaigns closing in exactly 5 days
    const closingSoon = await prisma.campaign.findMany({
      where: {
        status: 'OPEN',
        end_date: {
          gte: in5Days,
          lt: dayAfter,
        }
      },
      include: {
        projects: {
          include: {
            pme: {
              include: {
                owner: {
                  select: { id: true, pushToken: true }
                }
              }
            }
          }
        }
      }
    })

    for (const campaign of closingSoon) {
      // deduplicate users — one user might have multiple projects
      const uniqueUsers = new Map<string, { id: string; pushToken: string | null }>()

      for (const project of campaign.projects) {
        const owner = project.pme.owner
        if (owner && !uniqueUsers.has(owner.id)) {
          uniqueUsers.set(owner.id, owner)
        }
      }

      const notifications: Promise<any>[] = []

      for (const user of uniqueUsers.values()) {
        notifications.push(
          prisma.activity.create({
            data: {
              type: 'CAMPAIGN_CLOSING_SOON',
              title: 'Campagne bientôt clôturée',
              message: `La campagne "${campaign.name}" se clôture dans 5 jours (${new Date(campaign.end_date).toLocaleDateString('fr-FR')}). Assurez-vous que votre dossier est complet.`,
              userId: user.id,
            }
          })
        )

        if (user.pushToken) {
          notifications.push(
            sendPushNotification(
              user.pushToken,
              '⏳ Campagne bientôt clôturée',
              `La campagne "${campaign.name}" ferme dans 5 jours. Vérifiez votre dossier.`,
              { campaignId: campaign.id, type: 'CAMPAIGN_CLOSING_SOON' }
            )
          )
        }
      }

      await Promise.allSettled(notifications)
      console.log(`Campaign closing soon: notified ${uniqueUsers.size} users for "${campaign.name}"`)
    }

  } catch (err) {
    console.error('checkCampaignClosingSoon error:', err)
  }
}