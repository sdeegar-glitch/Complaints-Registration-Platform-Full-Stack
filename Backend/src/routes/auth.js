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

    // Send OTP email in background
    sendOtpEmail(email, otp).catch(e => console.error("BG Email Error:", e));
    console.log(`📡 Sending OTP [${otp}] to ${email} (Background)...`);

    res.json({ message: "OTP sent successfully to your email." });
  } catch (err) {
    console.error("send-otp error:", err);
    res.status(500).json({ error: "Failed to send OTP. Please try again." });
  }
});

/**
 * POST /api/auth/register
 * Verifies the OTP and sets the password.
 */
router.post("/register", async (req, res) => {
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

    if (user.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP. Please check and try again." });
    }

    if (new Date() > new Date(user.otp_expiry)) {
      return res.status(400).json({ error: "OTP has expired. Please request a new one." });
    }

    // Mark user as verified and save password (plain text as per requirements)
    await db
      .update(users)
      .set({
        password,
        is_verified: true,
        otp: null,
        otp_expiry: null,
      })
      .where(eq(users.email, email));

    res.json({ message: "Registration successful! You can now log in." });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
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

    if (!user.is_verified) {
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
      httpOnly: false,
      secure: false,
      sameSite: "lax",
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
  res.clearCookie("token");
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

module.exports = router;
