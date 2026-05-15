// c:\Users\acer\Complaints-Registration-Platform-Full-Stack\Backend\src\services\email.js

/**
 * Send an email using the EmailJS REST API.
 * This is compatible with Render's Free Tier.
 */
async function sendOtpEmail(to, otp) {
  const data = {
    service_id: process.env.EMAILJS_SERVICE_ID,
    template_id: process.env.EMAILJS_TEMPLATE_ID,
    user_id: process.env.EMAILJS_PUBLIC_KEY,
    accessToken: process.env.EMAILJS_PRIVATE_KEY,
    template_params: {
      to_email: to,
      otp: otp,
      to_name: to.split("@")[0], // Simple name fallback
    },
  };

  try {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`EmailJS Error: ${errorText}`);
    }

    console.log(`✅ EmailJS: OTP sent to ${to}`);
    return true;
  } catch (error) {
    console.error("❌ EmailJS Error:", error.message);
    throw error;
  }
}

/**
 * Send a resolution email (Optional, can be implemented if template exists)
 */
async function sendResolutionEmail(to, resolutionText) {
  // Logic similar to sendOtpEmail but with a different template
  console.log("Resolution email would be sent here via EmailJS");
}

module.exports = { sendOtpEmail, sendResolutionEmail };
