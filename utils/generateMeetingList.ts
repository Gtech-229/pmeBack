import { CommitteeMeeting } from '../generated/prisma/client'
import puppeteer from 'puppeteer'
import { buildPresenceTemplate } from './templates/pdfs/buildPresenceListTemplate'
import { PresenceFileData } from '../types/committeeMeeting.dto'
import os from 'os'







const getChromiumPath = (): string | undefined => {
  switch (os.platform()) {
    case 'win32':
      return 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
        // or try:
        // 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
    case 'darwin':
      return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    case 'linux':
      return '/usr/bin/google-chrome'
    default:
      return undefined // let puppeteer find it
  }
}

export const generateMeetingReport = async (data: PresenceFileData): Promise<Buffer> => {
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox']
})

  const page = await browser.newPage()
  await page.setContent(await buildPresenceTemplate(data), { waitUntil: 'networkidle0' })

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '1.5cm', bottom: '1.5cm', left: '2cm', right: '2cm' }
  })

  await browser.close()
  return Buffer.from(pdf)
}