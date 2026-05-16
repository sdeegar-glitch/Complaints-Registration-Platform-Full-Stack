const { google } = require("googleapis");

/**
 * Authority Dispatch Bureau: Gmail REST API Service
 * Bypasses SMTP port blocks by using standard HTTPS (Port 443).
 */

async function getGmailService() {
  const OAuth2 = google.auth.OAuth2;
  const oauth2Client = new OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  return google.gmail({ version: "v1", auth: oauth2Client });
}

/**
 * Encodes a MIME message to Base64URL format for the Gmail API.
 */
function createEncodedMessage(to, subject, body) {
  const message = [
    `To: ${to}`,
    `Content-Type: text/html; charset=utf-8`,
    `MIME-Version: 1.0`,
    `Subject: ${subject}`,
    "",
    body,
  ].join("\n");

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sendOtpEmail(to, otp) {
  console.log(`📡 Initializing Gmail API Dispatch for OTP to ${to}...`);
  try {
    const gmail = await getGmailService();
    const body = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #003366;">Identity Verification Bureau</h2>
        <p>You have requested access to the <strong>Police Grievance Portal</strong>.</p>
        <div style="background: #f8fafc; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #C8102E;">${otp}</span>
        </div>
        <p style="font-size: 12px; color: #64748b;">This code will expire shortly. Do not share this token with anyone.</p>
      </div>
    `;

    const raw = createEncodedMessage(to, "Authority Identity Verification", body);
    await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
    
    console.log(`✅ Gmail API Dispatch: OTP Success for ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ Gmail API OTP Error for ${to}:`, error.message);
    throw error;
  }
}

async function sendInquiryEmail(name, fromEmail, query) {
  console.log(`📡 Initializing Gmail API Dispatch for Inquiry from ${fromEmail}...`);
  try {
    const gmail = await getGmailService();
    const body = `Official Inquiry Received:\n\nFrom: ${name} (${fromEmail})\n\nQuery: ${query}`;
    
    const raw = createEncodedMessage("devtshq@gmail.com", `Official Inquiry: ${name}`, body);
    await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
    
    console.log(`✅ Gmail API Dispatch: Inquiry Success for ${fromEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ Gmail API Inquiry Error for ${fromEmail}:`, error.message);
    throw error;
  }
}

async function sendResolutionEmail(to, userName, resolutionText) {
  console.log(`📡 Initializing Gmail API Dispatch for Resolution to ${to}...`);
  try {
    const gmail = await getGmailService();
    const body = `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #003366;">Official Authority Resolution</h2>
        <p>Dear ${userName},</p>
        <p>Following a thorough investigation, an official resolution has been dispatched regarding your grievance:</p>
        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
          <p style="font-style: italic; color: #064e3b;">"${resolutionText}"</p>
        </div>
        <p style="font-size: 12px; color: #64748b;">This investigation is now officially closed.</p>
      </div>
    `;

    const raw = createEncodedMessage(to, "Official Case Resolution Dispatch", body);
    await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
    
    console.log(`✅ Gmail API Dispatch: Resolution Success for ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ Gmail API Resolution Error for ${to}:`, error.message);
    throw error;
  }
}

module.exports = { sendOtpEmail, sendResolutionEmail, sendInquiryEmail };
