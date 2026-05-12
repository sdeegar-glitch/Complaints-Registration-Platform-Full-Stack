const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an OTP email using Resend (HTTP-based, works on Render free tier).
 * @param {string} to - Recipient email
 * @param {string} otp - The 6-digit OTP code
 */
async function sendOtpEmail(to, otp) {
  await resend.emails.send({
    from: "Complaints Portal <onboarding@resend.dev>",
    to,
    subject: "Your OTP for Registration",
    text: `Your OTP code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
  });
}

module.exports = { sendOtpEmail };
