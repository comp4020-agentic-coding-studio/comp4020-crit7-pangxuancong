import type { APIRoute } from "astro";
import { getPayment } from "../../../../lib/payments/service";

// Read-only: lets an open tracker notice a transition made elsewhere (the
// demo page in another window) and refresh itself.
export const GET: APIRoute = ({ params }) => {
  const payment = getPayment(Number(params.id));
  if (!payment) return new Response("Payment not found", { status: 404 });
  return Response.json(
    { status: payment.status, updatedAt: payment.updatedAt },
    { headers: { "cache-control": "no-store" } },
  );
};
