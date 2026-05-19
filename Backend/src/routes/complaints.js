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
  const { id } = req.params;
  console.log(`🤖 [COMPLAINTS] Entering: Generate AI suggestion for ID: ${id}`);
  try {
    const complaint = await db.select().from(complaints).where(eq(complaints.id, id));

    if (complaint.length === 0) {
      console.log(`⚠️ [COMPLAINTS] Complaint ID: ${id} not found`);
      return res.status(404).json({ error: "Complaint not found." });
    }

    const suggestion = await generateResolution(complaint[0].complaint_text);
    console.log(`✅ [COMPLAINTS] Exiting: AI suggestion generated successfully`);
    res.json({ suggestion });
  } catch (err) {
    console.error(`❌ [COMPLAINTS] Error generating AI suggestion for ID: ${id}:`, err);
    res.status(500).json({ error: "Failed to generate AI suggestion." });
  }
});

/**
 * POST /api/ai/question
 * Generates an AI follow-up question for a complaint.
 */
router.post("/ai/question", authenticate, async (req, res) => {
  console.log("🤖 [COMPLAINTS] Entering: Generate AI follow-up question");
  try {
    const { complaint_text } = req.body;

    if (!complaint_text) {
      console.log("⚠️ [COMPLAINTS] Empty complaint text submitted");
      return res.status(400).json({ error: "Complaint text is required." });
    }

    const question = await generateFollowUpQuestion(complaint_text);
    console.log("✅ [COMPLAINTS] Exiting: AI follow-up question generated successfully");
    res.json({ question });
  } catch (err) {
    console.error("❌ [COMPLAINTS] Error generating AI follow-up question:", err);
    res.status(500).json({ error: "Failed to generate AI question. Please try again." });
  }
});

/**
 * POST /api/complaints
 * Creates a new complaint for the logged-in user.
 */
router.post("/complaints", authenticate, async (req, res) => {
  console.log(`📝 [COMPLAINTS] Entering: Creating new complaint for user ID: ${req.user.id}`);
  try {
    const { complaint_text, ai_question, ai_answer } = req.body;

    if (!complaint_text) {
      console.log("⚠️ [COMPLAINTS] Missing complaint_text in body");
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

    console.log(`✅ [COMPLAINTS] Exiting: Complaint created successfully with ID: ${result[0].id}`);
    res.status(201).json({ message: "Complaint submitted successfully.", complaint: result[0] });
  } catch (err) {
    console.error("❌ [COMPLAINTS] Error submitting complaint:", err);
    res.status(500).json({ error: "Failed to submit complaint. Please try again." });
  }
});

/**
 * GET /api/complaints/my
 * Returns all complaints belonging to the logged-in user.
 */
router.get("/complaints/my", authenticate, async (req, res) => {
  console.log(`📝 [COMPLAINTS] Entering: Fetching complaints for user ID: ${req.user.id}`);
  try {
    const result = await db
      .select()
      .from(complaints)
      .where(eq(complaints.user_id, req.user.id))
      .orderBy(complaints.created_at);

    console.log(`✅ [COMPLAINTS] Exiting: Fetched ${result.length} complaints for user`);
    res.json({ complaints: result });
  } catch (err) {
    console.error(`❌ [COMPLAINTS] Error fetching complaints for user ID: ${req.user.id}:`, err);
    res.status(500).json({ error: "Failed to fetch complaints." });
  }
});

/**
 * GET /api/admin/complaints
 * Returns all complaints from all users (admin only).
 */
router.get("/admin/complaints", authenticate, requireAdmin, async (req, res) => {
  console.log("📝 [COMPLAINTS] Entering: [ADMIN] Fetching all complaints");
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

    console.log(`✅ [COMPLAINTS] Exiting: [ADMIN] Fetched ${result.length} complaints`);
    res.json({ complaints: result });
  } catch (err) {
    console.error("❌ [COMPLAINTS] Error fetching admin complaints list:", err);
    res.status(500).json({ error: "Failed to fetch complaints." });
  }
});

/**
 * PATCH /api/admin/complaints/:id/resolve
 * Resolves a complaint with a resolution text (admin only).
 */
router.patch("/admin/complaints/:id/resolve", authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  console.log(`📝 [COMPLAINTS] Entering: [ADMIN] Resolving complaint ID: ${id}`);
  try {
    const { resolution_text } = req.body;

    if (!resolution_text) {
      console.log("⚠️ [COMPLAINTS] Missing resolution_text in request body");
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
      console.log(`⚠️ [COMPLAINTS] Complaint ID: ${id} not found to resolve`);
      return res.status(404).json({ error: "Complaint not found." });
    }

    // Get user info to send email (in background)
    const user = await db.select().from(users).where(eq(users.id, result[0].user_id));
    if (user.length > 0) {
      console.log(`📧 [COMPLAINTS] Sending resolution email to: ${user[0].email}`);
      sendResolutionEmail(user[0].email, user[0].name, resolution_text).catch(e => console.error("Email Error:", e));
    }

    console.log(`✅ [COMPLAINTS] Exiting: [ADMIN] Complaint ID: ${id} resolved successfully`);
    res.json({ message: "Complaint resolved.", complaint: result[0] });
  } catch (err) {
    console.error(`❌ [COMPLAINTS] Error resolving complaint ID: ${id}:`, err);
    res.status(500).json({ error: "Failed to resolve complaint." });
  }
});

/**
 * PATCH /api/admin/complaints/:id/status
 * Updates the status of a complaint (admin only).
 */
router.patch("/admin/complaints/:id/status", authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  console.log(`📝 [COMPLAINTS] Entering: [ADMIN] Updating status for complaint ID: ${id} to: ${status}`);
  try {
    if (!status) {
      console.log("⚠️ [COMPLAINTS] Missing status in request body");
      return res.status(400).json({ error: "Status is required." });
    }

    const result = await db
      .update(complaints)
      .set({ status })
      .where(eq(complaints.id, id))
      .returning();

    if (result.length === 0) {
      console.log(`⚠️ [COMPLAINTS] Complaint ID: ${id} not found to update status`);
      return res.status(404).json({ error: "Complaint not found." });
    }

    console.log(`✅ [COMPLAINTS] Exiting: [ADMIN] Status updated for ID: ${id}`);
    res.json({ message: "Status updated.", complaint: result[0] });
  } catch (err) {
    console.error(`❌ [COMPLAINTS] Error updating status for ID: ${id}:`, err);
    res.status(500).json({ error: "Failed to update status." });
  }
});

/**
 * PATCH /api/admin/complaints/:id/reopen
 * Reopens a resolved complaint (admin only).
 */
router.patch("/admin/complaints/:id/reopen", authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  console.log(`📝 [COMPLAINTS] Entering: [ADMIN] Reopening complaint ID: ${id}`);
  try {
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
      console.log(`⚠️ [COMPLAINTS] Complaint ID: ${id} not found to reopen`);
      return res.status(404).json({ error: "Complaint not found." });
    }

    console.log(`✅ [COMPLAINTS] Exiting: [ADMIN] Reopened complaint ID: ${id}`);
    res.json({ message: "Complaint reopened.", complaint: result[0] });
  } catch (err) {
    console.error(`❌ [COMPLAINTS] Error reopening complaint ID: ${id}:`, err);
    res.status(500).json({ error: "Failed to reopen complaint." });
  }
});

/**
 * GET /api/complaints/:id
 * Public route to track a complaint by its ID.
 */
router.get("/complaints/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`📝 [COMPLAINTS] Entering: Fetching track info for ID: ${id}`);
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
      })
      .from(complaints)
      .where(eq(complaints.id, id));

    if (result.length === 0) {
      console.log(`⚠️ [COMPLAINTS] Track info: Complaint ID ${id} not found`);
      return res.status(404).json({ error: "Complaint not found with this ID." });
    }

    console.log(`✅ [COMPLAINTS] Exiting: Track info loaded for ID: ${id}`);
    res.json({ complaint: result[0] });
  } catch (err) {
    console.error(`❌ [COMPLAINTS] Error tracking complaint ID: ${id}:`, err);
    res.status(500).json({ error: "Failed to track complaint." });
  }
});

module.exports = router;
