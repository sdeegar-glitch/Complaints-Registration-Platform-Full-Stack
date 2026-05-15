const nodemailer = require("nodemailer");
require("dotenv").config();

async function testOAuth2() {
  console.log("🔍 Testing OAuth2 credentials...");
  
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.GMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    },
  });

  try {
    console.log("📡 Sending test email to dev30073@gmail.com...");
    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: "dev30073@gmail.com",
      subject: "OAuth2 Test Email",
      text: "If you receive this, the Gmail API (OAuth2) is working correctly!",
    });
    console.log("✅ SUCCESS:", info.response);
  } catch (error) {
    console.error("❌ FAILED:", error.message);
    if (error.response) console.error("Details:", error.response);
  }
}

testOAuth2();
