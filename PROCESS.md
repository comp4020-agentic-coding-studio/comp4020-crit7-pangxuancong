# Process overview

## What I built

A tracker for the gap between paying tuition and seeing the balance change:
a persisted payment reference, a status timeline driven by a server-side state
machine, and prototype controls that simulate the bank's side. `README.md`
covers what it is and what good means here. This file is how I got there.

## How I got here

**The problem, and the slice.** ANU's payment flow is mostly about _how_ to
pay. Once you've sent a transfer, the page can look exactly as it did before:
same options, same balance, no sign anything happened. The UX principle at
stake is visibility of system status. So I scoped the redesign to one
question, "what happened to my tuition payment?", and wrote everything else
(auth, real payments, the rest of the portal) out of scope before starting.

**Spec first.** Before any code I wrote a long spec: the payment states and
legal transitions for bank transfer and card, money as integer cents, SQLite
as ground truth, copy for every state, a visual direction and the Crit demo
script. I asked the agent to audit the starter against it first. The first
commit replaces the guestbook schema outright
([`6801b33`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-pangxuancong/commit/6801b33)).
`payments` holds the current state; `payment_events` is append-only. Keeping
them apart is what makes the timeline durable history rather than something
guessed from a status field. Then I told it to keep going without checking in:

> 直接提交就好了，然后一路开发直到出现演示demo跑dev给我看

(just commit, then keep building until there's a demo running in dev to show
me)

**What the harness caught.** That run produced the lifecycle
([`0003d95`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-pangxuancong/commit/0003d95)),
and the tests corrected it twice. First, the harness boots against an empty
database, so every page 500'd until the app learned to seed itself when the
database is empty. That is also what a fresh Fly volume needs. Second, Astro's
CSRF check rejects form POSTs with no `Origin` header. I turned the spec's
checkable line ("the core flow persists across a reload") into
`spec/payment-tracker.test.ts`, which drives a transfer to completion over
HTTP and re-fetches the pages.

**It worked but looked like coursework.** I asked for a critique before a
rewrite, with the backend frozen:

> The current UI technically works, but visually it is too simplistic and feels
> like a basic HTML coursework prototype. DO NOT redesign the database, payment
> state machine, routes, persistence logic, or API architecture unless
> absolutely necessary.

The redesign
([`d1a829d`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-pangxuancong/commit/d1a829d))
kept every test green. But passing tests say nothing about how it looks, so the
agent screenshotted every state at 1440, 768 and 375px. That found four bugs
the tests couldn't see: a selector that hid the status icon, "Sept" for "Sep",
a toast covering the header, and the demo panel covering the payment details.
Trying the demo myself, I asked for a reset between run-throughs
([`7b1f9e1`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-pangxuancong/commit/7b1f9e1)).

**Live.** I deployed to Fly, walked the flow on the live URL, and restarted
the machine mid-payment to confirm state lives on the volume. The live README
had broken screenshots because the production image lacks sharp, which the
local build never showed
([`35d5e2b`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-pangxuancong/commit/35d5e2b)).
The traps from this week (the `Origin` header, `.ts` imports for Node scripts,
a form field shadowing `form.method`, no sharp in production) are now rules in
`CLAUDE.md`, so the agent doesn't meet them twice.
