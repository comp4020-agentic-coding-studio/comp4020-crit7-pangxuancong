# Your harness

These are the rules I hold the agent to on this repo. They come from the
product spec I wrote before any code, plus a few learned the hard way this
week. The brief and spec for Crit 07 are on the course site; `README.md` says
what good means here.

## The one question

Everything answers: **"What happened to my tuition payment?"** Before adding a
feature, ask whether it improves the payment-status experience or demonstrates
the full-stack slice. If not, don't build it. That rules out analytics, admin
screens, auth, messaging, charts, real financial integrations and unrelated
ANU features.

## How to work

- Inspect before changing. Preserve the starter's configuration (`fly.toml`,
  `Dockerfile`, CI, `spec/` harness) unless there's a stated reason.
- Build vertically: database → backend → UI → persistence → motion → demo
  controls.
- Explain a large structural change before making it. When I've frozen part of
  the system (e.g. "don't touch the backend"), stay out of it unless it's
  genuinely blocking, and say so.
- Commit at logical milestones, not one giant change. Never rewrite history or
  run destructive git commands unasked.
- Chat with me in Chinese. Everything that lands in the repo (code, comments,
  commits, docs) is in English.

## SQLite is the ground truth

- All payment state lives in SQLite via Drizzle. The browser never holds
  authoritative state: no localStorage persistence, and no status decided in
  client JavaScript. A refresh must rebuild every page from the database.
  sessionStorage is allowed only for cosmetic "has this changed since I last
  looked" animation.
- Status changes go through the one transition table in
  `src/lib/payments/state-machine.ts`. Never duplicate transition logic in a
  route or component, and never allow an arbitrary jump. An illegal transition
  is an error (409), not a silent no-op.
- Every transition appends a `payment_events` row, so the timeline is history,
  not reconstruction.
- Completing a payment (status, event, completed timestamp, balance → 0)
  happens in one transaction.
- Money is integer cents. Never floats.
- One payment in flight per account. References (`ANU-1234567`) are generated
  server-side, persisted, and never regenerated on refresh.
- An empty database must boot into a working app (auto-seed). The spec harness
  and a fresh Fly volume both depend on it.
- Schema changes go through `src/lib/schema.ts` → `pnpm db:generate` →
  committed migration. Migrations run at boot.

## Data boundaries

- Never collect real card details, credentials or personal financial data. No
  real bank, card or Stripe integration. The demo controls stand in for bank
  webhooks and are labelled prototype-only.
- Validate IDs and actions on the server. Drizzle queries only, with no SQL
  string interpolation. No secrets in the frontend.
- The app must say, unobtrusively but always, "Student prototype — not an
  official ANU payment service." Never make it look like a real ANU portal.

## Look, copy and motion

- Calm, institutional, trustworthy. Warm neutral ground, near-black text,
  ANU-inspired gold used sparingly. Colour carries meaning: green only for
  confirmed success, amber for delay, red only for failure.
- No gradients, glassmorphism, neon, decorative blobs or card-for-everything.
  Hierarchy comes from typography and spacing.
- Never show a percentage for payment progress. Use a staged timeline that
  distinguishes done, current, future, delayed and failed.
- Copy is plain and reassuring, and always answers "what next / do I need to
  act?". Say "your tuition account", not system jargon.
- Motion communicates a state change and only plays when the state actually
  changed. Nothing replays on a plain refresh, there is no confetti, and
  everything respects `prefers-reduced-motion`.

## Accessibility

Semantic HTML, keyboard-reachable controls, visible focus, status never
conveyed by colour alone, `aria-live` for dynamic status, and a timeline that
reads correctly with motion off. Every route in `spec/routes.ts` passes the
invariants (one `h1`, a `nav`, zero axe violations). Add new routes there.

## Done means verified

- `pnpm check` green before any commit. It builds and runs the specs against
  the built server.
- Tests don't see visuals. After UI work, screenshot the affected states at
  roughly 375, 768 and 1440px and look at them before calling it done.
- After a deploy, walk the core flow on the live URL, including a reload
  mid-flow: bank transfer → receive → process → reload → complete → balance
  $0.
- Keep `spec/payment-tracker.test.ts` passing. It is the executable form of
  the Crit's success criterion.

## Known traps

- Astro rejects form POSTs without a matching `Origin`. Tests and curl must
  send one.
- Node runs `scripts/*.ts` natively, so anything they import needs explicit
  `.ts` extensions.
- A form field named `method` or `action` shadows `form.method` /
  `form.action` in the DOM. Use `getAttribute`.
- The production image has no sharp. Don't route images through Astro's
  `/_image` endpoint.
