---
name: gaps
description: Give a story-driven overview of the current topic, then adaptively locate gaps in the user's mental model. Use when the user invokes /gaps, optionally with a topic as arguments.
---

# Gaps

Help the user build a coherent mental model of the current topic, then identify where that
model is still incomplete.

Use the topic from the arguments when provided; otherwise infer it from the conversation.
Ground the explanation in the conversation, project docs, and codebase. Do not invent
missing project facts.

## 1. Explain the whole before the parts

Start with why the thing exists.

Walk through one concrete example end to end: a request, case, document, event, or piece of
data moving through the system.

Do not begin with definitions, folders, classes, or an architecture dump. Introduce
technical terms only when the story reaches them.

## 2. Explain the system's shape

After the walkthrough, describe only the main components or responsibilities needed to
understand the system.

For each one, state:

- What it owns.
- Why it exists separately.
- What it deliberately does not own, when the boundary matters.

Its reason to exist should usually fit in one sentence. If it cannot, flag the component or
boundary as unclear, overloaded, or possibly accidental instead of inventing a justification.

Then state the two or three cross-cutting rules that govern the design, together with why
they exist.

## 3. Separate facts from interpretation

Clearly distinguish between:

- **Settled:** implemented, documented, or agreed.
- **Open:** undecided, incomplete, or disputed.
- **My read:** an inference from the available evidence.

Do not present proposals, future plans, or inferred intent as facts. Surface conflicts
between documentation and implementation.

End the overview with a one-line glossary for jargon actually used above. Do not create a
general-purpose glossary.

## 4. Locate gaps adaptively

After the overview, identify the single highest-leverage place where the user's mental model
may still be incomplete.

Ask one conversational question at a time. Do not present a batch of questions.

Give the user a concrete diagnosis to react to:

> My current read is that the fuzzy part may be why orchestration owns retries rather than
> each agent. Does that boundary feel arbitrary, or is the gap somewhere earlier?

Keep the diagnosis tentative. Do not claim to know what the user is thinking.

Choose later questions from the user's previous answer, generally moving through:

1. Why it exists.
2. The end-to-end flow.
3. Component responsibilities.
4. Boundaries and ownership.
5. Failure paths.
6. Trade-offs and open decisions.
7. Implementation details.

Do not probe deeper details while an earlier dependency is still unclear, and do not keep
questioning branches the user already understands.

## 5. Inspect facts; ask about understanding

Before asking a factual question, check whether the answer is available in the conversation,
docs, code, tests, examples, or configuration.

Do not ask the user to repeat discoverable information.

Ask instead about:

- Whether a component's reason or boundary makes sense.
- Which connection still feels arbitrary.
- Whether your interpretation matches theirs.
- What deserves a deeper explanation.
- Their intended behavior where the project is genuinely unresolved.

After each answer:

1. Briefly state what now appears clear.
2. Correct important misconceptions without grading the user.
3. Expand only the branch the answer revealed.
4. Ask the next highest-value question, if one remains.

Do not repeat the full overview after every answer.

## 6. Stop when the model is coherent

Stop when:

- The user can follow the end-to-end flow.
- The reasons for the main components and boundaries appear understood.
- Important open decisions are recognized as open.
- Any remaining uncertainty has been explicitly named.

Close with a compact summary of what is now solid, what remains open, and the most useful
next document, code path, diagram, or topic to inspect.

Do not start implementing changes or making project decisions unless asked.

## Tone

- Plain language without removing meaningful technical depth.
- Concrete project language rather than forced analogies.
- Short paragraphs and complete sentences.
- Collaborative, not evaluative.
- Treat confusion as a signal that the explanation or boundary needs work.
- Avoid reference dumping; mention at most one or two useful sources.
