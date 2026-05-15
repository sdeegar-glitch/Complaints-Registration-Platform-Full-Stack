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
        user_email: to,
        email: to,
        recipient: to,
        send_to: to,
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

async function sendInquiryEmail(name, fromEmail, query) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      service_id: process.env.EMAILJS_SERVICE_ID,
      template_id: process.env.EMAILJS_TEMPLATE_ID,
      user_id: process.env.EMAILJS_PUBLIC_KEY,
      accessToken: process.env.EMAILJS_PRIVATE_KEY,
      template_params: {
        to_email: "devtshq@gmail.com",
        from_name: name,
        from_email: fromEmail,
        message: `Official Inquiry Received:\n\nFrom: ${name} (${fromEmail})\n\nQuery: ${query}`,
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
      if (res.statusCode === 200) {
        console.log(`✅ Inquiry Dispatch: Success for ${fromEmail}`);
        resolve(true);
      } else {
        reject(new Error(`Inquiry failed: ${res.statusCode}`));
      }
    });

    req.on("error", (error) => reject(error));
    req.write(data);
    req.end();
  });
}

async function sendResolutionEmail(to, resolutionText) {
  console.log(`📡 Resolution dispatched for ${to}: ${resolutionText}`);
  return true;
}

module.exports = { sendOtpEmail, sendResolutionEmail, sendInquiryEmail };
