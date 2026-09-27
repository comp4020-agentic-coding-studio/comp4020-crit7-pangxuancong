import type { PaymentStatus } from "../schema";

// Student-facing copy for each status — the enum never appears on the
// student side of the UI (see COMP4020 crit 7 spec: "visibility of system
// status" means honest, human language, not exposed internals).
export const STATUS_COPY: Record<PaymentStatus, { title: string; description: string }> = {
  INITIATED: {
    title: "Payment started",
    description: "We've created a payment record for this tuition balance.",
  },
  AWAITING_TRANSFER: {
    title: "Waiting for your bank transfer",
    description: "Use the payment reference shown below when making the transfer.",
  },
  AUTHORISED: {
    title: "Card payment authorised",
    description: "The simulated card payment was approved.",
  },
  RECEIVED: {
    title: "Payment received",
    description: "Your payment has reached the payment system.",
  },
  PROCESSING: {
    title: "ANU is processing your payment",
    description: "We're matching this payment to your tuition account.",
  },
  COMPLETED: {
    title: "Payment completed",
    description: "Your tuition account has been updated.",
  },
  DELAYED: {
    title: "Payment is taking longer than expected",
    description: "Bank transfers may take additional time to appear. No action is required yet.",
  },
  FAILED: {
    title: "Payment could not be completed",
    description: "Review the payment information or try another method.",
  },
};

// A step is "done" once the payment has passed through it — used to render
// the timeline's completed/current/future ordering for the two happy paths.
// DELAYED and FAILED are rendered as call-outs on top of this, not as a step
// in the line (see PaymentTimeline).
export const HAPPY_PATH: Record<"BANK_TRANSFER" | "CARD", PaymentStatus[]> = {
  BANK_TRANSFER: ["INITIATED", "AWAITING_TRANSFER", "RECEIVED", "PROCESSING", "COMPLETED"],
  CARD: ["INITIATED", "AUTHORISED", "RECEIVED", "PROCESSING", "COMPLETED"],
};

export function formatCents(cents: number, currency = "AUD"): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency }).format(cents / 100);
}

export function formatTimestamp(iso: string): string {
  // SQLite's datetime('now') is UTC with no offset marker — tell Intl that.
  const date = new Date(iso.includes("T") ? iso : `${iso.replace(" ", "T")}Z`);
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Canberra",
  }).format(date);
}
