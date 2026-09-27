# Crit 7 reflection

## What was the breakthrough that moved the work forward?

The first version worked. Payments persisted, the state machine refused
illegal steps, and every test passed. But when I used it, it felt dry. The
interface was a narrow column of plain text, the timeline was symbols, and
nothing responded when the payment moved. It technically answered "what
happened to my payment?" without ever making me feel reassured.

The breakthrough was stepping outside the coding loop to talk that feeling
through with ChatGPT. Putting it into words turned "it looks bland" into
something concrete: weak hierarchy, no transaction details, no sense of what
happens next, no feedback when the state changes. From that conversation I
had ChatGPT produce a set of wireframes for every screen and state, plus a
detailed redesign prompt. I then handed both to Claude with the backend
frozen. The second version came out of that: two-column tracker, a real
timeline, "what happens next", motion only when the status changes. Using one
model to think about the design and another to build it gave me a much better
result than asking a single agent to "make it look better".

## What did this work change about who I want to be as a software developer?

I want a wider field of view. My first version was built from the developer's
side: correct states, correct data. That turned out to be only one of the
angles that matter. A student cares whether they can stop worrying about
$18,240. An institution cares whether the service looks trustworthy and cuts
down "did you get my payment?" enquiries. I want to be the developer who
considers the user's experience and the organisation's needs together with
the technical design, rather than treating correctness as the finish line.
