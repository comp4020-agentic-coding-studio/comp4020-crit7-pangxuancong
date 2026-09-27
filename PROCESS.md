# Process overview

## What I built

A tracker for the gap between paying tuition and seeing the balance change:
a persisted payment reference, a status timeline driven by a server-side state
machine, and prototype controls that simulate the bank's side. `README.md`
covers what it is and what good means here. This file is how I got there.

## How I got here

I started by writing the whole product down before any code: a long spec
covering the payment states, the two happy paths (bank transfer and card) with
delay and failure branches, money as integer cents, the copy for every state,
and a visual direction. I asked the agent to audit the starter against it
before touching anything. That audit is why the first commit replaces the
guestbook schema outright instead of bending it: students, tuition accounts,
payments, and an append-only event table that makes the timeline durable
([`6801b33`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-pangxuancong/commit/6801b33)).
Then I told it to keep going without checking in:

> 直接提交就好了，然后一路开发直到出现演示demo跑dev给我看

(just commit, then keep building until there's a demo running in dev to show
me)

That run produced the whole lifecycle
([`0003d95`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-pangxuancong/commit/0003d95)).
The test harness caught two things I wouldn't have seen by clicking around.
First, it boots the server against an empty database, so every page returned
500 until the app learned to seed itself when the database is empty. That is
also exactly what a fresh Fly volume needs. Second, Astro's CSRF check rejects
form POSTs with no `Origin` header. I turned the spec's one checkable line
("the core flow persists across a reload") into
`spec/payment-tracker.test.ts`, which drives a transfer to completion over
HTTP and re-fetches the pages.

It worked, but it looked like coursework. I asked for a critique before a
rewrite, with the backend frozen:

> The current UI technically works, but visually it is too simplistic and feels
> like a basic HTML coursework prototype. DO NOT redesign the database, payment
> state machine, routes, persistence logic, or API architecture unless
> absolutely necessary.

The redesign
([`d1a829d`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-pangxuancong/commit/d1a829d))
kept every test green. But passing tests say nothing about how it looks, so the
agent screenshotted every state at 1440, 768 and 375px in headless Chromium.
That turned up four bugs the tests couldn't see: a CSS selector that hid the
status icon, "Sept" instead of "Sep", a toast covering the header, and the demo
panel covering the payment details. After trying the demo myself I asked for a
reset between run-throughs
([`7b1f9e1`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-pangxuancong/commit/7b1f9e1)),
which got its own test.

Finally I deployed it to Fly and walked the flow against the live URL. I also
restarted the machine mid-payment to confirm the state lives on the volume and
not in the container.
