const express = require("express");
const { db } = require("../db");
const { complaints, users } = require("../db/schema");
const { eq } = require("drizzle-orm");
const { sendOtpEmail, sendResolutionEmail } = require("../services/email");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { generateFollowUpQuestion, generateResolution } = require("../services/ai");

const router = express.Router();

/**
 * POST /api/admin/complaints/:id/ai-suggest
 * Generates an AI resolution suggestion for a complaint.
 */
router.post("/admin/complaints/:id/ai-suggest", authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await db.select().from(complaints).where(eq(complaints.id, id));

    if (complaint.length === 0) {
      return res.status(404).json({ error: "Complaint not found." });
    }

    const suggestion = await generateResolution(complaint[0].complaint_text);
    res.json({ suggestion });
  } catch (err) {
    console.error("AI suggest error:", err);
    res.status(500).json({ error: "Failed to generate AI suggestion." });
  }
});

/**
 * POST /api/ai/question
 * Generates an AI follow-up question for a complaint.
 */
router.post("/ai/question", authenticate, async (req, res) => {
  try {
    const { complaint_text } = req.body;

    if (!complaint_text) {
      return res.status(400).json({ error: "Complaint text is required." });
    }

    const question = await generateFollowUpQuestion(complaint_text);
    res.json({ question });
  } catch (err) {
    console.error("AI question error:", err);
    res.status(500).json({ error: "Failed to generate AI question. Please try again." });
  }
});

/**
 * POST /api/complaints
 * Creates a new complaint for the logged-in user.
 */
router.post("/complaints", authenticate, async (req, res) => {
  try {
    const { complaint_text, ai_question, ai_answer } = req.body;

    if (!complaint_text) {
      return res.status(400).json({ error: "Complaint text is required." });
    }

    const result = await db
      .insert(complaints)
      .values({
        user_id: req.user.id,
        complaint_text,
        ai_question: ai_question || null,
        user_answer: ai_answer || null,
      })
      .returning();

    res.status(201).json({ message: "Complaint submitted successfully.", complaint: result[0] });
  } catch (err) {
    console.error("Create complaint error:", err);
    res.status(500).json({ error: "Failed to submit complaint. Please try again." });
  }
});

/**
 * GET /api/complaints/my
 * Returns all complaints belonging to the logged-in user.
 */
router.get("/complaints/my", authenticate, async (req, res) => {
  try {
    const result = await db
      .select()
      .from(complaints)
      .where(eq(complaints.user_id, req.user.id))
      .orderBy(complaints.created_at);

    res.json({ complaints: result });
  } catch (err) {
    console.error("Fetch my complaints error:", err);
    res.status(500).json({ error: "Failed to fetch complaints." });
  }
});

/**
 * GET /api/admin/complaints
 * Returns all complaints from all users (admin only).
 */
router.get("/admin/complaints", authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await db
      .select({
        id: complaints.id,
        complaint_text: complaints.complaint_text,
        ai_question: complaints.ai_question,
        user_answer: complaints.user_answer,
        status: complaints.status,
        resolution_text: complaints.resolution_text,
        resolved_at: complaints.resolved_at,
        created_at: complaints.created_at,
        user_name: users.name,
        user_email: users.email,
      })
      .from(complaints)
      .innerJoin(users, eq(complaints.user_id, users.id))
      .orderBy(complaints.created_at);

    res.json({ complaints: result });
  } catch (err) {
    console.error("Fetch admin complaints error:", err);
    res.status(500).json({ error: "Failed to fetch complaints." });
  }
});

/**
 * PATCH /api/admin/complaints/:id/resolve
 * Resolves a complaint with a resolution text (admin only).
 */
router.patch("/admin/complaints/:id/resolve", authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution_text } = req.body;

    if (!resolution_text) {
      return res.status(400).json({ error: "Resolution text is required." });
    }

    const result = await db
      .update(complaints)
      .set({
        status: "resolved",
        resolution_text,
        resolved_at: new Date(),
      })
      .where(eq(complaints.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: "Complaint not found." });
    }

    // Get user info to send email (in background)
    const user = await db.select().from(users).where(eq(users.id, result[0].user_id));
    if (user.length > 0) {
      sendResolutionEmail(user[0].email, user[0].name, resolution_text).catch(e => console.error("Email Error:", e));
    }

    res.json({ message: "Complaint resolved.", complaint: result[0] });
  } catch (err) {
    console.error("Resolve complaint error:", err);
    res.status(500).json({ error: "Failed to resolve complaint." });
  }
});

/**
 * PATCH /api/admin/complaints/:id/reopen
 * Reopens a resolved complaint (admin only).
 */
router.patch("/admin/complaints/:id/reopen", authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db
      .update(complaints)
      .set({
        status: "pending",
        resolution_text: null,
        resolved_at: null,
      })
      .where(eq(complaints.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: "Complaint not found." });
    }

    res.json({ message: "Complaint reopened.", complaint: result[0] });
  } catch (err) {
    console.error("Reopen complaint error:", err);
    res.status(500).json({ error: "Failed to reopen complaint." });
  }
});

/**
 * GET /api/complaints/:id
 * Public route to track a complaint by its ID.
 */
router.get("/complaints/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db
      .select({
        id: complaints.id,
        complaint_text: complaints.complaint_text,
        ai_question: complaints.ai_question,
        user_answer: complaints.user_answer,
        status: complaints.status,
        resolution_text: complaints.resolution_text,
        resolved_at: complaints.resolved_at,
        created_at: complaints.created_at,
      })
      .from(complaints)
      .where(eq(complaints.id, id));

    if (result.length === 0) {
      return res.status(404).json({ error: "Complaint not found with this ID." });
    }

    res.json({ complaint: result[0] });
  } catch (err) {
    console.error("Track complaint error:", err);
    res.status(500).json({ error: "Failed to track complaint." });
  }
});

module.exports = router;
