const express = require("express");
const { db } = require("../db");
const { complaints, users } = require("../db/schema");
const { eq } = require("drizzle-orm");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { generateFollowUpQuestion } = require("../services/ai");

const router = express.Router();

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

module.exports = router;
