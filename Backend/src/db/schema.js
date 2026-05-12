const { pgTable, uuid, varchar, text, boolean, timestamp } = require("drizzle-orm/pg-core");

const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }),
  role: varchar("role", { length: 50 }).notNull().default("user"),
  otp: varchar("otp", { length: 6 }),
  otp_expiry: timestamp("otp_expiry"),
  is_verified: boolean("is_verified").notNull().default(false),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

const complaints = pgTable("complaints", {
  id: uuid("id").defaultRandom().primaryKey(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id),
  complaint_text: text("complaint_text").notNull(),
  ai_question: text("ai_question"),
  user_answer: text("user_answer"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

module.exports = { users, complaints };
