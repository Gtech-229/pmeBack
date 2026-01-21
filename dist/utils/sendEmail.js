"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const resend_1 = require("resend");
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
const sendEmail = async ({ to, subject, html, text, }) => {
    try {
        const payload = {
            from: process.env.NODE_ENV === 'production' ? process.env.RESEND_FROM : "Acme <onboarding@resend.dev>",
            to: process.env.NODE_ENV === 'production' ? to : 'gtech229egn@gmail.com',
            subject,
            html,
            ...(text ? { text } : {}),
        };
        const { data, error } = await resend.emails.send(payload);
        if (error) {
            console.error("Resend error:", error);
            throw new Error("Email sending failed");
        }
        return data;
    }
    catch (err) {
        console.error("SendEmail exception:", err);
        throw err;
    }
};
exports.sendEmail = sendEmail;
//# sourceMappingURL=sendEmail.js.map