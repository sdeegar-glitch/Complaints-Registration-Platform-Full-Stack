require("dotenv").config();
const postgres = require("postgres");

console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("Connecting...\n");

const sql = postgres({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: "require",
  connect_timeout: 10,
});

(async () => {
  try {
    const result = await sql`SELECT 1 as test`;
    console.log("✅ Database connected successfully!", result);
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
  } finally {
    await sql.end();
    process.exit(0);
  }
})();

setTimeout(() => {
  console.error("⏰ TIMEOUT: Connection timed out after 20 seconds");
  process.exit(1);
}, 20000);
