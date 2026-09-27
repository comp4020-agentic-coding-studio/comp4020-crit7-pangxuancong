# Crit 7 reflection

## What was the breakthrough that moved the work forward?

Writing the whole product down before any code. The spec named every payment
state, which transitions were legal, and that SQLite, not the browser, was the
truth. With that in hand, one instruction to keep building produced a working
vertical slice. The agent wasn't guessing what "done" meant. Modelling the
payment as an append-only event log was the part that made everything else
fall out: once every transition writes a row, the timeline, the reload
persistence and the demo controls are all views of the same table.

The second turn was admitting that working isn't good. All the tests passed
and it still looked like coursework. Tests couldn't tell me that. Screenshots
at three widths could, and they caught four bugs no test would have.

## What did this work change about who I want to be as a software developer?

I want to be the developer who decides what "right" looks like and how it
will be proven, not the one who types the most code. This week my leverage
was in the spec, in freezing the backend when I asked for a redesign, and in
choosing the evidence: a test for behaviour, screenshots for the look, a
machine restart for persistence.

It also changed where I think a feature ends. The payment itself was never
the hard part. What the student sees in the days afterwards is. I want to
keep designing for the moment after the action, when the user is left
wondering whether anything happened.
