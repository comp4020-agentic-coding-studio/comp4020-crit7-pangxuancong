import { beforeAll, describe, expect, inject, it } from "vitest";

// The one mechanically-checkable line in this week's spec: "the core flow
// persists across a reload — create something, and it's still there." This
// drives a real bank-transfer payment through the demo transitions over
// HTTP against the running server (spec/global-setup.ts), the same way a
// tutor would poke the demo panel at the crit, then re-fetches the tracker
// page — a fresh request, not cached client state — to prove SQLite is what
// answers it.
const baseUrl = inject("baseUrl");

function extractTransitionAction(html: string): string {
  const match = html.match(/action="(\/api\/payments\/\d+\/transition)"/);
  if (!match) throw new Error("no transition form found on the page");
  return match[1];
}

async function postAction(actionUrl: string, action: string): Promise<Response> {
  // Astro's built-in CSRF check rejects a form POST whose Origin doesn't
  // match the request's own host, which a bare fetch() doesn't set.
  return fetch(new URL(actionUrl, baseUrl), {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      origin: baseUrl,
    },
    body: `action=${action}`,
  });
}

describe("bank transfer payment: create, advance, survive a reload", () => {
  let transitionUrl: string;
  let trackerUrl: string;
  let reference: string;

  beforeAll(async () => {
    const bankPage = await fetch(new URL("/pay/bank/", baseUrl));
    const html = await bankPage.text();
    transitionUrl = extractTransitionAction(html);
    reference = html.match(/ANU-\d{7}/)?.[0] ?? "";
  });

  it("generates a persisted reference", () => {
    expect(reference).toMatch(/^ANU-\d{7}$/);
  });

  it("confirming the transfer moves the payment to the tracker", async () => {
    const res = await postAction(transitionUrl, "confirm-transfer");
    expect(res.redirected || res.ok).toBe(true);
    trackerUrl = res.url;
    expect(trackerUrl).toMatch(/\/payments\/\d+$/);
  });

  it("advances through the demo transitions", async () => {
    for (const action of ["receive", "process"]) {
      const res = await postAction(transitionUrl, action);
      expect(res.status, `action "${action}" should be accepted`).toBeLessThan(400);
    }
  });

  it("still shows PROCESSING and the same reference after a fresh reload", async () => {
    const reloaded = await fetch(new URL(trackerUrl, baseUrl));
    const html = await reloaded.text();
    expect(html).toMatch(/processing your payment/i);
    expect(html).toContain(reference);
  });

  it("completing the payment zeroes the tuition balance, and it stays zero on reload", async () => {
    await postAction(transitionUrl, "complete");

    const dashboard = await fetch(new URL("/", baseUrl));
    const html = await dashboard.text();
    expect(html).toContain("$0.00");
  });

  it("rejects an out-of-order transition", async () => {
    const res = await postAction(transitionUrl, "process");
    expect(res.status).toBe(409);
  });
});
