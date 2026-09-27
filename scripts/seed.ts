import { db } from "../src/lib/db.ts";
import { payments, paymentEvents, studentAccounts, students } from "../src/lib/schema.ts";

// Dev/demo-only reset: wipe every table and reseed one fictional student with
// an outstanding tuition balance, so a Crit demo always starts from the same
// clean state. Never run against a real deployment with real state on it.
db.delete(paymentEvents).run();
db.delete(payments).run();
db.delete(studentAccounts).run();
db.delete(students).run();

const student = db
  .insert(students)
  .values({ name: "Alex Student", studentNumber: "u7654321" })
  .returning()
  .get();

const account = db
  .insert(studentAccounts)
  .values({
    studentId: student.id,
    semester: "Semester 1, 2027",
    originalBalanceCents: 18_240_00,
    outstandingBalanceCents: 18_240_00,
    dueDate: "2027-03-15",
  })
  .returning()
  .get();

console.log("Seeded:", { student, account });
