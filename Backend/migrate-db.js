require('dotenv').config();
const postgres = require('postgres');

const connectionString = `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?ssl=true`;
const sql = postgres(connectionString, { ssl: { rejectUnauthorized: false } });

async function migrate() {
  try {
    console.log('Adding status column...');
    await sql`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending' NOT NULL`;
    
    console.log('Adding resolution_text column...');
    await sql`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS resolution_text TEXT`;
    
    console.log('Adding resolved_at column...');
    await sql`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP`;
    
    console.log('✅ Database Migration Successful!');
    process.exit(0);
  } catch (e) {
    console.error('❌ Migration Failed:', e.message);
    process.exit(1);
  }
}

migrate();
