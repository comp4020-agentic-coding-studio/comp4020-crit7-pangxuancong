import type { PaymentStatus } from "../schema";

// Actions the student triggers directly from the payment-creation screens.
export type StudentAction = "confirm-transfer" | "authorise" | "decline";
// Actions the demo panel triggers to simulate the external/backend events we
// can't call a real bank or card network for (see spec/README for why).
export type DemoAction = "receive" | "process" | "complete" | "delay" | "fail";
export type PaymentAction = StudentAction | DemoAction;

interface ActionRule {
  from: PaymentStatus[];
  to: PaymentStatus;
}

// The one place payment transitions are defined — every route and the demo
// panel call `applyAction`, none of them touch `status` directly. Keeping
// this as data (not scattered `if` statements) is what makes "no arbitrary
// transitions" enforceable and testable without a running server.
const RULES: Record<PaymentAction, ActionRule> = {
  "confirm-transfer": { from: ["INITIATED"], to: "AWAITING_TRANSFER" },
  authorise: { from: ["INITIATED"], to: "AUTHORISED" },
  decline: { from: ["INITIATED"], to: "FAILED" },
  receive: { from: ["AWAITING_TRANSFER", "AUTHORISED", "DELAYED"], to: "RECEIVED" },
  process: { from: ["RECEIVED", "DELAYED"], to: "PROCESSING" },
  complete: { from: ["PROCESSING"], to: "COMPLETED" },
  delay: { from: ["AWAITING_TRANSFER", "PROCESSING"], to: "DELAYED" },
  fail: { from: ["AUTHORISED", "PROCESSING"], to: "FAILED" },
};

export const DEMO_ACTIONS: DemoAction[] = ["receive", "process", "complete", "delay", "fail"];

export class InvalidTransitionError extends Error {
  constructor(from: PaymentStatus, action: PaymentAction) {
    super(`Cannot apply action "${action}" to a payment in status ${from}`);
  }
}

/** Validates and returns the next status for an action, or throws. */
export function nextStatus(current: PaymentStatus, action: PaymentAction): PaymentStatus {
  const rule = RULES[action];
  if (!rule.from.includes(current)) throw new InvalidTransitionError(current, action);
  return rule.to;
}

/** Which of the given actions are legal from the current status. */
export function availableActions<A extends PaymentAction>(
  current: PaymentStatus,
  candidates: A[],
): A[] {
  return candidates.filter((action) => RULES[action].from.includes(current));
}
