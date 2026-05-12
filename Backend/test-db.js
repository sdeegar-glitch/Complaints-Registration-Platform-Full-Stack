require("dotenv").config();
const postgres = require("postgres");

const sql = postgres({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: "require",
});

(async () => {
  try {
    console.log("Fixing complaints table...\n");

    // Drop old complaints table and recreate with correct schema
    await sql`DROP TABLE IF EXISTS complaints`;
    console.log("✅ Dropped old complaints table");

    await sql`
      CREATE TABLE complaints (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        complaint_text TEXT NOT NULL,
        ai_question TEXT,
        user_answer TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      )
    `;
    console.log("✅ Created complaints table with correct schema");

    // Verify
    const cols = await sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'complaints' ORDER BY ordinal_position
    `;
    console.log("\nColumns:", cols.map(c => c.column_name).join(", "));
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await sql.end();
  }
})();
