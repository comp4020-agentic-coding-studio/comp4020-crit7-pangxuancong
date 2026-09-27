import type { APIRoute } from "astro";
import { applyAction, getPayment } from "../../../../lib/payments/service";
import { InvalidTransitionError, type PaymentAction } from "../../../../lib/payments/state-machine";

const VALID_ACTIONS = new Set<PaymentAction>([
  "confirm-transfer",
  "authorise",
  "decline",
  "receive",
  "process",
  "complete",
  "delay",
  "fail",
]);

// The one write path for advancing a payment — the student's "I've made the
// transfer" / "simulate authorisation" buttons and the demo panel both post
// here. The server validates the transition (see state-machine.ts); nothing
// about payment state is decided in the browser.
export const POST: APIRoute = async ({ params, request, redirect }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || !getPayment(id)) {
    return new Response("Payment not found", { status: 404 });
  }

  const form = await request.formData();
  const action = String(form.get("action") ?? "");
  if (!VALID_ACTIONS.has(action as PaymentAction)) {
    return new Response(`Unknown action "${action}"`, { status: 400 });
  }

  try {
    applyAction(id, action as PaymentAction);
  } catch (error) {
    if (error instanceof InvalidTransitionError) {
      return new Response(error.message, { status: 409 });
    }
    throw error;
  }

  // Always land on the student-facing tracker, so a demo click is visibly
  // answered by the UI the student sees (the tracker animates the change).
  return redirect(`/payments/${id}`, 303);
};
