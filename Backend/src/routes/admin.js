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
  console.log("👥 [ADMIN] Entering: Fetching users list...");
  try {
    const result = await db.select().from(users).orderBy(users.created_at);
    console.log(`✅ [ADMIN] Exiting: Users fetched successfully (Count: ${result.length})`);
    res.json({ users: result });
  } catch (err) {
    console.error("❌ [ADMIN] Error fetching users:", err);
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

/**
 * POST /api/admin/users
 * Create a new user or admin manually.
 */
router.post("/users", authenticate, requireAdmin, async (req, res) => {
  console.log("👥 [ADMIN] Entering: Manually creating user...");
  try {
    const { name, email, password, role } = req.body;
    console.log(`🔍 [ADMIN] Payload details: name=${name}, email=${email}, role=${role}`);
    const result = await db.insert(users).values({
      name,
      email,
      password,
      role: role || "user",
      is_verified: true,
    }).returning();
    console.log(`✅ [ADMIN] Exiting: User created successfully with ID: ${result[0].id}`);
    res.status(201).json({ message: "User created successfully.", user: result[0] });
  } catch (err) {
    console.error("❌ [ADMIN] Error creating user manually:", err);
    res.status(500).json({ error: "Failed to create user." });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Update user details.
 */
router.patch("/users/:id", authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  console.log(`👥 [ADMIN] Entering: Updating user details for ID: ${id}`);
  try {
    const updates = req.body;
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    console.log(`✅ [ADMIN] Exiting: User ID: ${id} updated successfully`);
    res.json({ message: "User updated.", user: result[0] });
  } catch (err) {
    console.error(`❌ [ADMIN] Error updating user ID: ${id}`, err);
    res.status(500).json({ error: "Failed to update user." });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user.
 */
router.delete("/users/:id", authenticate, requireAdmin, async (req, res) => {
  const { id } = req.params;
  console.log(`👥 [ADMIN] Entering: Deleting user ID: ${id}`);
  try {
    await db.delete(users).where(eq(users.id, id));
    console.log(`✅ [ADMIN] Exiting: User ID: ${id} deleted successfully`);
    res.json({ message: "User deleted successfully." });
  } catch (err) {
    console.error(`❌ [ADMIN] Error deleting user ID: ${id}`, err);
    res.status(500).json({ error: "Failed to delete user." });
  }
});

module.exports = router;
