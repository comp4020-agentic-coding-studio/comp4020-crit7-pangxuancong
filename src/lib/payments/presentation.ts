import type { IconName } from "../icons";
import type { Payment, PaymentEvent, PaymentMethod, PaymentStatus } from "../schema";
import { HAPPY_PATH } from "./status";

// Everything the student-facing UI says about a payment is derived here from
// the persisted payment + its events, so the pages stay declarative and the
// wording lives in one place.

export type Tone = "success" | "progress" | "warning" | "danger" | "neutral";

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "Bank transfer",
  CARD: "Card payment",
};

export const METHOD_ICON: Record<PaymentMethod, IconName> = {
  BANK_TRANSFER: "bank",
  CARD: "card",
};

export const STATUS_LABEL: Record<PaymentStatus, string> = {
  INITIATED: "Started",
  AWAITING_TRANSFER: "Awaiting transfer",
  AUTHORISED: "Authorised",
  RECEIVED: "Received",
  PROCESSING: "Processing",
  COMPLETED: "Completed",
  DELAYED: "Delayed",
  FAILED: "Failed",
};

export function statusTone(status: PaymentStatus): Tone {
  if (status === "COMPLETED") return "success";
  if (status === "FAILED") return "danger";
  if (status === "DELAYED") return "warning";
  if (status === "INITIATED") return "neutral";
  return "progress";
}

export const isTerminal = (status: PaymentStatus) => status === "COMPLETED" || status === "FAILED";

/** The last happy-path status the payment reached — where a delay or failure happened. */
export function anchorStatus(payment: Payment, events: PaymentEvent[]): PaymentStatus {
  if (payment.status !== "DELAYED" && payment.status !== "FAILED") return payment.status;
  for (let i = events.length - 1; i >= 0; i--) {
    const s = events[i].status;
    if (s !== "DELAYED" && s !== "FAILED") return s;
  }
  return "INITIATED";
}

export function heroCopy(payment: Payment, events: PaymentEvent[]): { title: string; description: string } {
  const bank = payment.method === "BANK_TRANSFER";
  const anchor = anchorStatus(payment, events);
  switch (payment.status) {
    case "INITIATED":
      return bank
        ? {
            title: "Your payment is ready",
            description: "Transfer the amount using your payment reference, then let us know you've sent it.",
          }
        : { title: "Your card payment is ready", description: "Complete the simulated card authorisation to continue." };
    case "AWAITING_TRANSFER":
      return {
        title: "Waiting for your bank transfer",
        description: "We'll update this page as soon as your transfer reaches ANU. Transfers usually arrive within 1–2 business days.",
      };
    case "AUTHORISED":
      return {
        title: "Your card payment was approved",
        description: "We're confirming the funds before applying them to your tuition account.",
      };
    case "RECEIVED":
      return {
        title: bank ? "We've received your transfer" : "We've received your payment",
        description: "Your payment has arrived and will be matched to your tuition account shortly.",
      };
    case "PROCESSING":
      return {
        title: "We're processing your payment",
        description: bank
          ? "We've received your bank transfer and are matching it to your tuition account."
          : "We've received your card payment and are applying it to your tuition account.",
      };
    case "COMPLETED":
      return {
        title: "Payment completed",
        description: "Your tuition payment has been successfully applied to your student account.",
      };
    case "DELAYED":
      return {
        title: "Your payment is taking longer than expected",
        description:
          anchor === "PROCESSING"
            ? "Matching your payment to your tuition account is taking longer than usual."
            : "We haven't been able to confirm your bank transfer yet. This happens occasionally and usually resolves on its own.",
      };
    case "FAILED":
      return {
        title: "We couldn't complete this payment",
        description:
          anchor === "INITIATED" && !bank
            ? "The simulated card payment was declined. No change has been made to your tuition balance."
            : "The payment couldn't be applied to your tuition account. No change has been made to your balance.",
      };
  }
}

export function nextSteps(payment: Payment): { title: string; tone: Tone; lines: string[] } {
  const bank = payment.method === "BANK_TRANSFER";
  const none = "No action is required from you right now.";
  switch (payment.status) {
    case "INITIATED":
      return {
        title: "What happens next?",
        tone: "neutral",
        lines: bank
          ? ["Transfer the exact amount using your payment reference.", "Select “I've made the transfer” once it's sent."]
          : ["Complete the simulated card authorisation to continue."],
      };
    case "AWAITING_TRANSFER":
      return {
        title: "What happens next?",
        tone: "progress",
        lines: ["Your bank transfer has not been detected yet.", "Transfers usually arrive within 1–2 business days.", none],
      };
    case "AUTHORISED":
      return {
        title: "What happens next?",
        tone: "progress",
        lines: ["Your card was approved and the funds are on their way.", none],
      };
    case "RECEIVED":
      return {
        title: "What happens next?",
        tone: "progress",
        lines: ["We've received the transfer.", "Next, we'll match it to your tuition account — usually within 1 business day.", none],
      };
    case "PROCESSING":
      return {
        title: "What happens next?",
        tone: "progress",
        lines: ["We're applying the payment to your tuition account.", "This usually completes within 1 business day.", none],
      };
    case "COMPLETED":
      return {
        title: "All done",
        tone: "success",
        lines: ["No further action is required.", "Your tuition balance has been updated."],
      };
    case "DELAYED":
      return {
        title: "What you should know",
        tone: "warning",
        lines: [
          "This is taking longer than usual.",
          "Bank transfers can take 1–2 business days to arrive.",
          `Check that you used the correct reference: ${payment.referenceCode}.`,
          "No action is required yet.",
        ],
      };
    case "FAILED":
      return {
        title: "What you can do",
        tone: "danger",
        lines: ["We could not complete this payment.", "You can try another payment method, or return to your tuition account."],
      };
  }
}

export type TimelineState = "done" | "current" | "future" | "warning" | "failed";

export interface TimelineItem {
  step: PaymentStatus;
  state: TimelineState;
  title: string;
  description?: string;
  time?: string;
  latest: boolean;
}

// Statuses where the payment sits and waits; the others are instantaneous
// events, after which the *next* step is the one in progress.
const WAITING = new Set<PaymentStatus>(["AWAITING_TRANSFER", "PROCESSING"]);

type StepCopy = { done: [string, string]; current: [string, string]; future: string };

function stepCopy(step: PaymentStatus, method: PaymentMethod): StepCopy {
  const bank = method === "BANK_TRANSFER";
  switch (step) {
    case "INITIATED":
      return {
        done: ["Payment initiated", "Payment record created."],
        current: ["Payment initiated", "Payment record created."],
        future: "Payment initiated",
      };
    case "AWAITING_TRANSFER":
      return {
        done: ["Transfer sent", "You confirmed the transfer was made."],
        current: ["Waiting for your bank transfer", "We'll update this as soon as it arrives."],
        future: "Waiting for your bank transfer",
      };
    case "AUTHORISED":
      return {
        done: ["Card authorised", "Your card payment was approved."],
        current: ["Waiting for card authorisation", "Complete the simulated authorisation to continue."],
        future: "Card authorised",
      };
    case "RECEIVED":
      return bank
        ? {
            done: ["Bank transfer detected", "We received confirmation of your transfer."],
            current: ["Waiting to receive your transfer", "Transfers usually arrive within 1–2 business days."],
            future: "Payment received",
          }
        : {
            done: ["Payment received", "The funds reached the payment system."],
            current: ["Receiving your payment", "Confirming the funds with the card network."],
            future: "Payment received",
          };
    case "PROCESSING":
      return {
        done: ["Payment processed", "Matched to your tuition account."],
        current: ["Processing payment", `We're matching this ${bank ? "transfer" : "payment"} to your tuition account.`],
        future: "Processing payment",
      };
    default:
      return {
        done: ["Applied to your tuition account", "Your balance has been updated."],
        current: ["Applying to your tuition account", "Your balance will update in a moment."],
        future: "Applied to your tuition account",
      };
  }
}

export function buildTimeline(payment: Payment, events: PaymentEvent[]): TimelineItem[] {
  const path = HAPPY_PATH[payment.method];
  const anchor = anchorStatus(payment, events);
  const anchorIndex = path.indexOf(anchor);
  const activeIndex =
    payment.status === "COMPLETED" ? path.length : WAITING.has(anchor) ? anchorIndex : anchorIndex + 1;
  const latestIndex = Math.min(activeIndex, path.length - 1);

  const entered = new Map<PaymentStatus, string>();
  for (const e of events) entered.set(e.status, e.createdAt);

  return path.map((step, i) => {
    const copy = stepCopy(step, payment.method);
    let state: TimelineState = i < activeIndex ? "done" : i === activeIndex ? "current" : "future";
    if (state === "current" && payment.status === "DELAYED") state = "warning";
    if (state === "current" && payment.status === "FAILED") state = "failed";

    const item: TimelineItem = { step, state, title: copy.future, latest: i === latestIndex };
    if (state === "done") {
      [item.title, item.description] = copy.done;
      item.time = entered.get(step);
    } else if (state === "current") {
      [item.title, item.description] = copy.current;
      item.time = entered.get(step);
    } else if (state === "warning") {
      item.title = copy.current[0];
      item.description = "This is taking longer than usual.";
      item.time = entered.get("DELAYED");
    } else if (state === "failed") {
      const cardDeclined = step === "AUTHORISED";
      item.title = cardDeclined ? "Card authorisation failed" : "Payment could not be completed";
      item.description = cardDeclined ? "The simulated card payment was declined." : "We couldn't apply this payment.";
      item.time = entered.get("FAILED");
    }
    return item;
  });
}

function toDate(stamp: string): Date {
  // SQLite's datetime('now') is UTC without a zone marker; app writes are ISO.
  return new Date(stamp.includes("T") ? stamp : `${stamp.replace(" ", "T")}Z`);
}

const TZ = "Australia/Canberra";
// ICU now renders September as "Sept"; spell the short months out ourselves.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDateTime(stamp: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ,
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
      .formatToParts(toDate(stamp))
      .map((p) => [p.type, p.value]),
  );
  return `${parts.day} ${MONTHS[Number(parts.month) - 1]} ${parts.year} at ${parts.hour}:${parts.minute} ${String(parts.dayPeriod).toLowerCase()}`;
}

export function formatDate(stamp: string): string {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(stamp);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: dateOnly ? "UTC" : TZ,
      day: "numeric",
      month: "numeric",
      year: "numeric",
    })
      .formatToParts(dateOnly ? new Date(`${stamp}T00:00:00Z`) : toDate(stamp))
      .map((p) => [p.type, p.value]),
  );
  return `${parts.day} ${MONTHS[Number(parts.month) - 1]} ${parts.year}`;
}

export function toIso(stamp: string): string {
  return toDate(stamp).toISOString();
}
