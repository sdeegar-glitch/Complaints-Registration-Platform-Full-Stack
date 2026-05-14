require("dotenv").config();
const nodemailer = require("nodemailer");

console.log("Forcing Connection via Port 465 (SSL)...");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
});

async function testEmail() {
  try {
    const info = await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: "dev30073@gmail.com",
      subject: "SSL Port 465 Test",
      text: "Testing connection via explicit port 465.",
    });
    console.log("✅ SUCCESS!");
    console.log("Response:", info.response);
  } catch (err) {
    console.error("❌ FAILED!");
    console.error("Code:", err.code);
    console.error("Message:", err.message);
  }
}

testEmail();
