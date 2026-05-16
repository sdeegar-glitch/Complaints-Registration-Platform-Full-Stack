const nodemailer = require("nodemailer");
const { google } = require("googleapis");

/**
 * Authority Dispatch Bureau: OAuth2 Email Service
 * Handles secure transmission of OTPs and Resolutions via Google OAuth2.
 */

async function createTransporter() {
  console.log("📡 Initializing OAuth2 Transporter Bureau...");
  try {
    const OAuth2 = google.auth.OAuth2;
    const oauth2Client = new OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );

    console.log("🔑 Setting credentials with Refresh Token...");
    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });

    console.log("⏳ Requesting fresh Access Token...");
    const accessToken = await new Promise((resolve, reject) => {
      oauth2Client.getAccessToken((err, token) => {
        if (err) {
          console.error("❌ OAuth2 Token Error Details:", err.response ? err.response.data : err);
          reject("Failed to create access token: " + (err.response ? err.response.data.error_description : err.message));
        }
        resolve(token);
      });
    });

    console.log("✅ Access Token Secured. Establishing SMTP Bureau via Port 587...");
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // Use STARTTLS for better cloud compatibility
      auth: {
        type: "OAuth2",
        user: process.env.GMAIL_USER,
        accessToken,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      },
      tls: {
        rejectUnauthorized: false // Ensures connection stability on some cloud platforms
      }
    });
  } catch (error) {
    console.error("❌ Transporter Initialization Failed:", error.message || error);
    throw error;
  }
}

async function sendOtpEmail(to, otp) {
  try {
    const transporter = await createTransporter();
    const mailOptions = {
      from: `"UP Police Authority" <${process.env.GMAIL_USER}>`,
      to,
      subject: "Authority Identity Verification",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #003366;">Identity Verification Bureau</h2>
          <p>You have requested access to the <strong>Police Grievance Portal</strong>.</p>
          <div style="background: #f8fafc; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #C8102E;">${otp}</span>
          </div>
          <p style="font-size: 12px; color: #64748b;">This code will expire shortly. Do not share this token with anyone.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OAuth2 Dispatch: OTP Success for ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ OAuth2 OTP Error for ${to}:`, error.message);
    throw error;
  }
}

async function sendInquiryEmail(name, fromEmail, query) {
  try {
    const transporter = await createTransporter();
    const mailOptions = {
      from: `"Inquiry Desk" <${process.env.GMAIL_USER}>`,
      to: "devtshq@gmail.com",
      subject: `Official Inquiry: ${name}`,
      text: `Official Inquiry Received:\n\nFrom: ${name} (${fromEmail})\n\nQuery: ${query}`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OAuth2 Dispatch: Inquiry Success for ${fromEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ OAuth2 Inquiry Error for ${fromEmail}:`, error.message);
    throw error;
  }
}

async function sendResolutionEmail(to, userName, resolutionText) {
  try {
    const transporter = await createTransporter();
    const mailOptions = {
      from: `"Official Resolution Dispatch" <${process.env.GMAIL_USER}>`,
      to,
      subject: "Official Case Resolution Dispatch",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #003366;">Official Authority Resolution</h2>
          <p>Dear ${userName},</p>
          <p>Following a thorough investigation, an official resolution has been dispatched regarding your grievance:</p>
          <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
            <p style="font-style: italic; color: #064e3b;">"${resolutionText}"</p>
          </div>
          <p style="font-size: 12px; color: #64748b;">This investigation is now officially closed.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OAuth2 Dispatch: Resolution Success for ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ OAuth2 Resolution Error for ${to}:`, error.message);
    throw error;
  }
}

module.exports = { sendOtpEmail, sendResolutionEmail, sendInquiryEmail };
