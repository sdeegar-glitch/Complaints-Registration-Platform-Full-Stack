const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  // Force IPv4 — Render's free tier cannot reach Gmail over IPv6
  tls: { family: 4 },
});

/**
 * Send an OTP email to the given address.
 * @param {string} to - Recipient email
 * @param {string} otp - The 6-digit OTP code
 */
async function sendOtpEmail(to, otp) {
  const mailOptions = {
    from: `"Complaints Portal" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Your OTP for Registration",
    text: `Your OTP code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail };
