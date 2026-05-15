const nodemailer = require("nodemailer");
const dns = require("dns");

// Force IPv4 for this service to avoid Render's IPv6 issues
dns.setDefaultResultOrder("ipv4first");

// Create a transporter using the Gmail service shortcut with pooling
const transporter = nodemailer.createTransport({
  service: "gmail",
  pool: true, // Use pooling to keep connections alive
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  connectionTimeout: 20000, // 20 seconds
  greetingTimeout: 20000,
});

// Verify connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email Transporter Error:", error.message);
  } else {
    console.log("🚀 Email Server is ready to take messages");
  }
});

// No startup verify to prevent boot-time hangs on cloud hosts

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
