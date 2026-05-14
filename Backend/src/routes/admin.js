const express = require("express");
const { db } = require("../db");
const { users, complaints } = require("../db/schema");
const { eq, sql, count } = require("drizzle-orm");
const { authenticate, requireAdmin } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/admin/stats
 * Returns counts for dashboard cards.
 */
router.get("/stats", authenticate, requireAdmin, async (req, res) => {
  console.log("📊 Fetching admin stats...");
  try {
    const userCount = await db.select({ val: sql`count(*)` }).from(users);
    const totalComplaints = await db.select({ val: sql`count(*)` }).from(complaints);
    const pendingComplaints = await db.select({ val: sql`count(*)` }).from(complaints).where(eq(complaints.status, "pending"));
    const resolvedComplaints = await db.select({ val: sql`count(*)` }).from(complaints).where(eq(complaints.status, "resolved"));

    const data = {
      users: Number(userCount[0].val) || 0,
      total: Number(totalComplaints[0].val) || 0,
      pending: Number(pendingComplaints[0].val) || 0,
      resolved: Number(resolvedComplaints[0].val) || 0,
    };
    
    console.log("✅ Stats calculated:", data);
    res.json(data);
  } catch (err) {
    console.error("❌ Stats Error:", err.message);
    res.status(500).json({ error: "Failed to fetch stats: " + err.message });
  }
});

/**
 * GET /api/admin/users
 * List all users.
 */
router.get("/users", authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await db.select().from(users).orderBy(users.created_at);
    res.json({ users: result });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

/**
 * POST /api/admin/users
 * Create a new user or admin manually.
 */
router.post("/users", authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const result = await db.insert(users).values({
      name,
      email,
      password,
      role: role || "user",
      is_verified: true,
    }).returning();
    res.status(201).json({ message: "User created successfully.", user: result[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to create user." });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Update user details.
 */
router.patch("/users/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    res.json({ message: "User updated.", user: result[0] });
  } catch (err) {
    res.status(500).json({ error: "Failed to update user." });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user.
 */
router.delete("/users/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(users).where(eq(users.id, id));
    res.json({ message: "User deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user." });
  }
});

module.exports = router;
