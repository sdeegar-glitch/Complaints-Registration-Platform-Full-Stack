const https = require("https");

/**
 * Send an email using the EmailJS REST API.
 * Using 'https' module for maximum compatibility with all Node.js versions.
 */
async function sendOtpEmail(to, otp) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      accessToken: process.env.EMAILJS_PRIVATE_KEY,
      template_params: {
        to_email: to,
        otp: otp,
        user_email: to, // Added common variations just in case
        message: `Your OTP is ${otp}`,
      },
    });

    const options = {
      hostname: "api.emailjs.com",
      port: 443,
      path: "/api/v1.0/email/send",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
      },
    };

    const req = https.request(options, (res) => {
      let responseBody = "";
      res.on("data", (chunk) => (responseBody += chunk));
      res.on("end", () => {
        if (res.statusCode === 200) {
          console.log(`✅ EmailJS: Success for ${to}`);
          resolve(true);
        } else {
          console.error(`❌ EmailJS Error (${res.statusCode}): ${responseBody}`);
          reject(new Error(`EmailJS failed: ${responseBody}`));
        }
      });
    });

    req.on("error", (error) => {
      console.error("❌ EmailJS Request Error:", error.message);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function sendResolutionEmail(to, resolutionText) {
  console.log("Resolution email logic here");
}

module.exports = { sendOtpEmail, sendResolutionEmail };
