const nodemailer = require("nodemailer");

// Create a persistent transporter using the Gmail service preset
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Verify connection on startup
transporter.verify((error) => {
  if (error) console.error("❌ SMTP Connection Error:", error.message);
  else console.log("✅ SMTP Server is ready (Persistent Connection Active)");
});

/**
 * Send an OTP email to the given address.
 */
async function sendOtpEmail(to, otp) {
  const mailOptions = {
    from: `"Complaints Hub" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Your OTP for Registration",
    text: `Your OTP code is: ${otp}\n\nThis code will expire in 10 minutes.`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ OTP Email Sent:", info.response);
    return info;
  } catch (error) {
    console.error("❌ OTP Email Error:", error.message);
    throw error;
  }
}

/**
 * Send a resolution notification email to the user.
 */
async function sendResolutionEmail(to, resolutionText) {
  const mailOptions = {
    from: `"Complaints Hub" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Update on your Complaint Resolution",
    text: `Hello,\n\nYour complaint has been resolved with the following message:\n\n"${resolutionText}"\n\nYou can track the full details on our portal.\n\nThank you,\nComplaints Hub Team`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Resolution Email Sent:", info.response);
  } catch (error) {
    console.error("❌ Resolution Email Error:", error.message);
  }
}

module.exports = { sendOtpEmail, sendResolutionEmail };
