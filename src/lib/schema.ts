import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

// The schema is the ground truth for the database. To change it: edit here,
// run `pnpm db:generate` to turn the diff into a migration under drizzle/,
// and commit both — the migration applies automatically when the server
// boots (see src/lib/db.ts), locally and deployed. Never edit the database
// by hand: state on the deployed volume outlives every deploy, and the
// migration trail is what keeps old state and new code compatible.

export const students = sqliteTable("students", {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  studentNumber: text("student_number").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const studentAccounts = sqliteTable("student_accounts", {
  id: int().primaryKey({ autoIncrement: true }),
  studentId: int("student_id")
    .notNull()
    .references(() => students.id),
  semester: text().notNull(),
  originalBalanceCents: int("original_balance_cents").notNull(),
  outstandingBalanceCents: int("outstanding_balance_cents").notNull(),
  currency: text().notNull().default("AUD"),
  dueDate: text("due_date").notNull(),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const PAYMENT_METHODS = ["BANK_TRANSFER", "CARD"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = [
  "INITIATED",
  "AWAITING_TRANSFER",
  "AUTHORISED",
  "RECEIVED",
  "PROCESSING",
  "COMPLETED",
  "DELAYED",
  "FAILED",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const payments = sqliteTable("payments", {
  id: int().primaryKey({ autoIncrement: true }),
  studentId: int("student_id")
    .notNull()
    .references(() => students.id),
  accountId: int("account_id")
    .notNull()
    .references(() => studentAccounts.id),
  amountCents: int("amount_cents").notNull(),
  currency: text().notNull().default("AUD"),
  method: text({ enum: PAYMENT_METHODS }).notNull(),
  referenceCode: text("reference_code").notNull().unique(),
  status: text({ enum: PAYMENT_STATUSES }).notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  completedAt: text("completed_at"),
});

export const paymentEvents = sqliteTable("payment_events", {
  id: int().primaryKey({ autoIncrement: true }),
  paymentId: int("payment_id")
    .notNull()
    .references(() => payments.id),
  status: text({ enum: PAYMENT_STATUSES }).notNull(),
  title: text().notNull(),
  description: text(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Student = typeof students.$inferSelect;
export type StudentAccount = typeof studentAccounts.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type PaymentEvent = typeof paymentEvents.$inferSelect;
