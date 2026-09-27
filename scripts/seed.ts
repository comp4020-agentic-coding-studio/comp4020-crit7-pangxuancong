import { db } from "../src/lib/db.ts";
import { payments, paymentEvents, studentAccounts, students } from "../src/lib/schema.ts";
import { insertDemoAccount } from "../src/lib/seed-data.ts";

// Dev/demo-only reset: wipe every table and reseed one fictional student with
// an outstanding tuition balance, so a Crit demo always starts from the same
// clean state. Never run against a real deployment with real state on it.
db.delete(paymentEvents).run();
db.delete(payments).run();
db.delete(studentAccounts).run();
db.delete(students).run();

insertDemoAccount(db);
console.log("Seeded demo student and tuition account.");
