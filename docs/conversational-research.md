# Conversational research loop

Research in this repository is a learning loop with a person, not a batch job that
turns questions into citations. The agent should help the person improve their own
mental model while it improves the repository's model.

Use this alongside `docs/research-workflow.md` and
`docs/research-source-quality.md` whenever research is being conducted through a
conversation.

## The shape of a run

```text
orient together -> investigate -> pressure-test -> handoff -> review/apply -> learning checkpoint -> choose what is worth learning next
```

Do not skip from one queued question straight into web research, and do not finish
a run by immediately selecting the next question.

## 1. Orient together before researching

Start from the repository rather than from the model's memory of an earlier chat.
Read the queued question, its research brief, the current canonical records it
targets, and the source-quality guidance. If the connector cannot run
`research:brief`, reconstruct the same context from `research/questions/`, prior
handoffs and decisions, and the current target records under `content/`.

Before searching externally, tell the user in plain language:

- what the repository currently says about this part of the system;
- what previous research or decisions materially changed that understanding;
- the important unknowns, assumptions, or tensions already visible;
- the exact question this run will try to answer; and
- what the run is deliberately not trying to answer.

Ask the user to correct that framing. Their correction is part of the research
input, not an interruption to the process.

## 2. Investigate conversationally

Research with public, non-sensitive sources and follow
`docs/research-source-quality.md`. Prefer current and directly transferable
evidence, look for counterevidence, and keep claims within what the source design
can support.

The conversation should remain useful while the research is happening:

- distinguish **what the repository currently believes**, **what external evidence
  says**, and **what the agent is inferring**;
- surface conflicts and uncertainty instead of smoothing them into one answer;
- pause when the evidence changes the scope of the question or reveals an
  important choice the user should make;
- explain the emerging model in ordinary language rather than dumping a
  literature review; and
- keep candidate findings small enough that a reviewer could accept one and
  reject another.

The user can redirect the question, ask for stronger evidence, challenge an
assumption, or narrow a finding at any point.

## 3. Pressure-test before the handoff

Do not treat finding a plausible answer as the end of research. Before writing the
handoff, show the user the small candidate finding set and the material
uncertainties.

Ask, in effect: **is this the useful thing we learned, and is any statement doing
more work than the evidence or the user's understanding supports?**

Only then synthesize and push the handoff through the normal intake workflow.
The handoff remains research staging; review and application remain separate.

## 4. Close with a learning checkpoint

After the findings have been reviewed and, when applicable, applied to canonical
content, return to the user before selecting another research problem.

Cover six things briefly:

1. **Changed** — what do we understand now that we did not understand before?
2. **Clarified** — what became easier to explain even if it did not materially
   change?
3. **Narrowed or ruled out** — which tempting interpretations, metrics, or
   solutions should no longer be carried forward?
4. **Still unknown** — what important uncertainty remains?
5. **Worth asking next** — which new unknowns, if any, deserve an actual place in
   the research queue?
6. **Current model** — explain the relevant part of the operating system back to
   the user in plain language as it now stands.

Then ask the user whether that matches their understanding and what they would
correct.

Do not make this a quiz or require the user to restate the research. The agent
teaches the model back; the user corrects it.

## Unknowns are not automatically queue items

Research will usually create more unknowns than it resolves. Preserve important
unknowns in the relevant canonical record, handoff, or conversation, but do not
turn every uncertainty into queue debt.

At the learning checkpoint, propose at most a few candidate follow-up questions.
Explain why each would change a decision or deepen an important part of the model.
Queue the questions the user agrees are worth pursuing, or ones required by an
explicitly blocked piece of work. Leave the rest as known unknowns.

## Do not move on while the learning loop is open

The default behavior for a human-guided research session is:

**do not begin the next queued research problem until the current run has had a
learning checkpoint, unless the user explicitly chooses to skip it.**

A merged handoff or applied `researchTrace` means the repository learned. It does
not by itself mean the person working with the repository has integrated what was
learned.

## What should persist

Keep this lightweight. There is no separate learning-checkpoint schema today.
Durable outcomes already have homes:

- current understanding belongs in canonical `content/`;
- external findings belong in the handoff;
- human judgment belongs in the decision record;
- evidence lineage belongs in `researchTrace`; and
- user-approved follow-up questions belong in `research/questions/`.

Do not commit conversational transcripts or manufacture another source of truth
just to prove that a checkpoint happened. If repeated use shows that a durable
learning-state artifact is necessary, add it deliberately rather than pre-building
one now.

## Starting a later conversation

A new conversational agent should be able to enter without the prior chat. It
should reconstruct the current state from the repository, perform the orientation
checkpoint, and let the user correct it before continuing.

The goal is continuity of understanding, not continuity of transcript.
