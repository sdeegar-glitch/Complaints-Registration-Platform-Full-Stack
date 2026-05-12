const nodemailer = require("nodemailer");
const dns = require("dns");

/**
 * Resolve a hostname to an IPv4 address.
 * Tries dns.resolve4 first, falls back to dns.lookup with family:4.
 */
function resolveIPv4(hostname) {
  return new Promise((resolve, reject) => {
    // Try resolve4 first (uses DNS servers directly)
    dns.resolve4(hostname, (err, addresses) => {
      if (!err && addresses && addresses.length > 0) {
        return resolve(addresses[0]);
      }
      // Fallback to lookup with family:4 (uses OS resolver)
      dns.lookup(hostname, { family: 4 }, (err2, address) => {
        if (err2) return reject(err2);
        resolve(address);
      });
    });
  });
}

/**
 * Send an OTP email to the given address.
 * Resolves smtp.gmail.com to IPv4 to avoid ENETUNREACH on Render (no IPv6).
 * @param {string} to - Recipient email
 * @param {string} otp - The 6-digit OTP code
 */
async function sendOtpEmail(to, otp) {
  // Resolve Gmail SMTP to IPv4 address
  const ipv4Host = await resolveIPv4("smtp.gmail.com");

  const transporter = nodemailer.createTransport({
    host: ipv4Host,
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    tls: {
      servername: "smtp.gmail.com", // Required for TLS cert validation when using IP
    },
  });

  const mailOptions = {
    from: `"Complaints Portal" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Your OTP for Registration",
    text: `Your OTP code is: ${otp}\n\nThis code will expire in 10 minutes.\n\nIf you did not request this, please ignore this email.`,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendOtpEmail };
