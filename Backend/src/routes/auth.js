const express = require("express");
const jwt = require("jsonwebtoken");
const { db } = require("../db");
const { users } = require("../db/schema");
const { eq } = require("drizzle-orm");
const { sendOtpEmail } = require("../services/email");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

/**
 * POST /api/auth/send-otp
 * Creates an unverified user and sends an OTP to their email.
 */
router.post("/send-otp", async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required." });
    }

    // Check if email already exists and is verified
    const existing = await db.select().from(users).where(eq(users.email, email));

    if (existing.length > 0 && existing[0].is_verified) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otp_expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (existing.length > 0) {
      // Update existing unverified user
      await db
        .update(users)
        .set({ name, otp, otp_expiry })
        .where(eq(users.email, email));
    } else {
      // Create new user record
      await db.insert(users).values({
        name,
        email,
        otp,
        otp_expiry,
        is_verified: false,
        role: "user",
      });
    }

    // Email successfully handed off to EmailJS
    sendOtpEmail(email, otp).catch(err => console.error("EmailJS sending error:", err));

    console.log(`📡 OTP triggered for ${email}`);
    res.json({ message: "OTP sent successfully! Please check your inbox (and spam folder)." });

  } catch (err) {
    console.error("send-otp error:", err);
    res.status(500).json({ error: "An unexpected error occurred. Please try again." });
  }
});

/**
 * POST /api/auth/verify-otp
 * Validates the OTP without setting a password.
 */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required." });
    }

    const result = await db.select().from(users).where(eq(users.email, email));

    if (result.length === 0 || result[0].otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP. Please check and try again." });
    }

    const user = result[0];

    if (new Date() > new Date(user.otp_expiry)) {
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    res.json({ message: "OTP verified successfully." });
  } catch (err) {
    console.error("verify-otp error:", err);
    res.status(500).json({ error: "Verification failed. Please try again." });
  }
});

/**
 * POST /api/auth/register
 * Verifies the OTP and sets the password.
 */
router.post("/register", async (req, res) => {
  console.log(`📡 Registration Bureau: Finalizing enrollment for ${req.body.email}...`);
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ error: "Email, OTP, and password are required." });
    }

    const result = await db.select().from(users).where(eq(users.email, email));

    if (result.length === 0) {
      return res.status(404).json({ error: "No account found with this email." });
    }

    const user = result[0];

    if (user.is_verified) {
      return res.status(409).json({ error: "This account is already registered." });
    }

    console.log(`🔐 Verifying OTP for ${email}: Received [${otp}], DB has [${user.otp}]`);
    if (user.otp !== otp) {
      console.log("❌ OTP Mismatch!");
      return res.status(400).json({ error: "Invalid OTP. Please check and try again." });
    }

    if (new Date() > new Date(user.otp_expiry)) {
      console.log("❌ OTP Expired");
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    console.log("💾 Updating Personnel Database...");
    await db
      .update(users)
      .set({
        password,
        is_verified: true,
        otp: null,
        otp_expiry: null,
      })
      .where(eq(users.email, email));

    console.log("✅ Personnel Profile Finalized.");
    res.json({ message: "Registration successful! You can now log in." });
  } catch (err) {
    console.error("🔥 CRITICAL REGISTRATION ERROR:", err);
    res.status(500).json({ error: "Registration failed: " + err.message });
  }
});

/**
 * POST /api/auth/login
 * Authenticates the user and sets a JWT cookie.
 */
router.post("/login", async (req, res) => {
  console.log(`🔐 Login attempt for: ${req.body.email}`);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.log("❌ Missing credentials");
      return res.status(400).json({ error: "Email and password are required." });
    }

    console.log("🔍 Searching database...");
    const result = await db.select().from(users).where(eq(users.email, email));
    console.log(`✅ DB Search done. Found: ${result.length} users`);

    if (result.length === 0) {
      console.log("❌ User not found");
      return res.status(404).json({ error: "No account found with this email." });
    }

    const user = result[0];

    if (!user.is_verified && user.role !== 'admin') {
      console.log("❌ User not verified");
      return res.status(403).json({ error: "Please complete registration first." });
    }

    console.log("🔑 Checking password...");
    if (user.password !== password) {
      console.log("❌ Incorrect password");
      return res.status(401).json({ error: "Incorrect password." });
    }

    console.log("✍️ Signing JWT token...");
    const secret = process.env.JWT_SECRET || "fallback-secret-123";
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      secret,
      { expiresIn: "7d" }
    );

    console.log("🍪 Setting cookie...");
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log("🎉 Login successful response being sent!");
    res.json({
      message: "Login successful.",
      token,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error("🔥 CRITICAL LOGIN ERROR:", err);
    res.status(500).json({ error: "Internal server error: " + err.message });
  }
});

/**
 * POST /api/auth/logout
 * Clears the JWT cookie.
 */
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none"
  });
  res.json({ message: "Logged out successfully." });
});

/**
 * GET /api/auth/me
 * Returns the currently logged-in user's information.
 */
router.get("/me", authenticate, (req, res) => {
  res.json({
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
});

/**
 * POST /api/auth/contact
 * Sends an inquiry email to the admin.
 */
router.post("/contact", async (req, res) => {
  try {
    const { name, email, query } = req.body;
    if (!name || !email || !query) {
      return res.status(400).json({ error: "All fields are required for official inquiry." });
    }
    
    const { sendInquiryEmail } = require("../services/email");
    await sendInquiryEmail(name, email, query);
    
    res.json({ message: "Official inquiry sent to admin successfully." });
  } catch (err) {
    console.error("Contact error:", err);
    res.status(500).json({ error: "Failed to dispatch inquiry. Please try again later." });
  }
});

module.exports = router;
