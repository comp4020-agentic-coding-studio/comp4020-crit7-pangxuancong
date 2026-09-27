import { desc, eq } from "drizzle-orm";
import { db } from "../db";
import {
  type Payment,
  type PaymentEvent,
  type PaymentMethod,
  type StudentAccount,
  paymentEvents,
  payments,
  studentAccounts,
  students,
} from "../schema";
import { generateReference } from "./reference";
import { type PaymentAction, nextStatus } from "./state-machine";
import { STATUS_COPY } from "./status";

// A payment is "active" while it's still moving — a COMPLETED or FAILED
// payment is history, and the dashboard should let the student start a new
// one instead of treating it as in progress.
const TERMINAL = new Set(["COMPLETED", "FAILED"]);

export class NoActivePaymentError extends Error {}

/** The one seeded demo tuition account, joined with its student. */
export function getDemoAccount(): { account: StudentAccount; studentName: string } {
  const row = db
    .select({ account: studentAccounts, studentName: students.name })
    .from(studentAccounts)
    .innerJoin(students, eq(studentAccounts.studentId, students.id))
    .limit(1)
    .get();
  if (!row) throw new Error("No seeded student account — run `pnpm db:seed`.");
  return row;
}

export function getLatestPayment(accountId: number): Payment | undefined {
  return db
    .select()
    .from(payments)
    .where(eq(payments.accountId, accountId))
    .orderBy(desc(payments.id))
    .limit(1)
    .get();
}

function insertEvent(paymentId: number, status: Payment["status"]) {
  const copy = STATUS_COPY[status];
  db.insert(paymentEvents)
    .values({ paymentId, status, title: copy.title, description: copy.description })
    .run();
}

/**
 * Starts a new payment for the account, or returns the existing one if a
 * payment is already in flight — the dashboard steers the student to "track
 * payment" rather than letting them start a duplicate (spec: no arbitrary
 * duplicate payments while one is active).
 */
export function startPayment(accountId: number, method: PaymentMethod): Payment {
  // One active payment per account at a time, whichever method it's using —
  // landing on /pay/bank or /pay/card while one is already in flight resumes
  // it instead of starting a second, concurrent payment.
  const existing = getLatestPayment(accountId);
  if (existing && !TERMINAL.has(existing.status)) return existing;

  const account = db.select().from(studentAccounts).where(eq(studentAccounts.id, accountId)).get();
  if (!account) throw new Error(`No account ${accountId}`);

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const payment = db
        .insert(payments)
        .values({
          studentId: account.studentId,
          accountId,
          amountCents: account.outstandingBalanceCents,
          currency: account.currency,
          method,
          referenceCode: generateReference(),
          status: "INITIATED",
        })
        .returning()
        .get();
      insertEvent(payment.id, "INITIATED");
      return payment;
    } catch (error) {
      // reference_code is UNIQUE; a collision is astronomically unlikely but
      // cheap to retry rather than let it surface as a 500.
      if (attempt === 4 || !(error instanceof Error) || !error.message.includes("UNIQUE")) throw error;
    }
  }
  throw new Error("unreachable");
}

export function getPayment(id: number): Payment | undefined {
  return db.select().from(payments).where(eq(payments.id, id)).get();
}

export function getEvents(paymentId: number): PaymentEvent[] {
  return db
    .select()
    .from(paymentEvents)
    .where(eq(paymentEvents.paymentId, paymentId))
    .orderBy(paymentEvents.id)
    .all();
}

/**
 * Applies a state-machine action to a payment: validates the transition,
 * updates the payment row, and appends the PaymentEvent that makes the
 * timeline durable. Completing a payment also zeroes the tuition balance —
 * both writes happen in one transaction so the two can't disagree.
 */
export function applyAction(paymentId: number, action: PaymentAction): Payment {
  return db.transaction((tx) => {
    const payment = tx.select().from(payments).where(eq(payments.id, paymentId)).get();
    if (!payment) throw new Error(`No payment ${paymentId}`);

    const status = nextStatus(payment.status, action);
    const updated = tx
      .update(payments)
      .set({
        status,
        updatedAt: new Date().toISOString(),
        completedAt: status === "COMPLETED" ? new Date().toISOString() : payment.completedAt,
      })
      .where(eq(payments.id, paymentId))
      .returning()
      .get();

    const copy = STATUS_COPY[status];
    tx.insert(paymentEvents)
      .values({ paymentId, status, title: copy.title, description: copy.description })
      .run();

    if (status === "COMPLETED") {
      tx.update(studentAccounts)
        .set({ outstandingBalanceCents: 0, updatedAt: new Date().toISOString() })
        .where(eq(studentAccounts.id, payment.accountId))
        .run();
    }

    return updated;
  });
}

/** The account's payment currently in flight, for the demo panel. Throws if there is none. */
export function getActivePayment(accountId: number): Payment {
  const latest = getLatestPayment(accountId);
  if (!latest || TERMINAL.has(latest.status)) throw new NoActivePaymentError();
  return latest;
}
