import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY!)

type SendEmailParams = {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

export const sendEmail = async ({
  to,
  subject,
  html,
  text,
}: SendEmailParams) => {
  try {
     const payload = {
    from: process.env.RESEND_FROM!,
    to ,
    subject,
    html,
    ...(text ? { text } : {}),
  }
  
    const { data, error } = await resend.emails.send(payload)

    if (error) {
      // console.error("Resend error:", error)
      throw new Error("Email sending failed")
    }

    return data
  } catch (err) {
    // console.error("SendEmail exception:", err)
    throw err
  }
}
