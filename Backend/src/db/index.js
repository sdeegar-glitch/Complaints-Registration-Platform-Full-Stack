const { drizzle } = require("drizzle-orm/postgres-js");
const { sql } = require("drizzle-orm");
const postgres = require("postgres");
const schema = require("./schema");

// Create the connection string manually to ensure special characters are handled
const connectionString = `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?ssl=true`;

const client = postgres(connectionString, { 
  max: 10, // Increase pool size
  ssl: { rejectUnauthorized: false },
  connect_timeout: 10, // 10 seconds timeout
});

const db = drizzle(client, { schema });

// Connection Test
(async () => {
  try {
    console.log("🔌 Testing database connection...");
    await db.select({ val: sql`1` });
    console.log("✅ Database connected successfully!");
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
})();

module.exports = { db };
