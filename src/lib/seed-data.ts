import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { paymentEvents, payments, studentAccounts, students } from "./schema.ts";

const DEMO_STUDENT = { name: "Alex Student", studentNumber: "u7654321" };
const DEMO_ACCOUNT = {
  semester: "Semester 1, 2027",
  originalBalanceCents: 18_240_00,
  outstandingBalanceCents: 18_240_00,
  dueDate: "2027-03-15",
};

/** Inserts the one demo student + tuition account this prototype models. */
export function insertDemoAccount(db: BetterSQLite3Database): void {
  const student = db.insert(students).values(DEMO_STUDENT).returning().get();
  db.insert(studentAccounts)
    .values({ studentId: student.id, ...DEMO_ACCOUNT })
    .run();
}

/**
 * Seeds the demo account if the database is empty — so a fresh throwaway
 * database (a new Fly volume, the spec harness, a wiped local .data/) boots
 * into a usable app with no manual step. `pnpm db:seed` (scripts/seed.ts)
 * does the same insert after clearing everything, for repeating a Crit demo.
 */
export function ensureSeeded(db: BetterSQLite3Database): void {
  const hasStudents = db.select().from(students).limit(1).all().length > 0;
  if (!hasStudents) insertDemoAccount(db);
}

/** Wipes every payment and restores the untouched demo account, atomically. */
export function resetDemo(db: BetterSQLite3Database): void {
  db.transaction((tx) => {
    tx.delete(paymentEvents).run();
    tx.delete(payments).run();
    tx.delete(studentAccounts).run();
    tx.delete(students).run();
    insertDemoAccount(tx as unknown as BetterSQLite3Database);
  });
}
