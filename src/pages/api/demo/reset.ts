import type { APIRoute } from "astro";
import { db } from "../../../lib/db";
import { resetDemo } from "../../../lib/seed-data";

// Prototype-only: puts the app back to "unpaid, no payments" between Crit
// run-throughs without touching the server.
export const POST: APIRoute = ({ redirect }) => {
  resetDemo(db);
  return redirect("/", 303);
};
