# Research practice

How to research *with* a person, and how to judge what you find.

[`research-workflow.md`](research-workflow.md) is the mechanics: the files, the
commands, the pull requests, the gates. This is the craft that runs inside them.
Read both before a run; read this one whenever a finding is about to be written.

Two halves, and they are one job. **The conversation** decides what is worth
learning and makes sure a person learns it too. **The evidence pass** decides
what any of it is allowed to claim. A run that does the second without the first
produces citations nobody asked for; a run that does the first without the
second produces confidence nobody earned.

---

# Part one — researching with a person

Research here is a learning loop with a person, not a batch job that turns
questions into citations. The agent should help the person improve their own
mental model while it improves the repository's model.

## The shape of a run

```text
orient together → investigate → pressure-test → handoff → review/apply → learning checkpoint → choose what is worth learning next
```

Do not skip from one queued question straight into web research, and do not
finish a run by immediately selecting the next question.

## 1. Orient together before researching

Start from the repository rather than from the model's memory of an earlier
chat. Read the queued question, its research brief, the current canonical
records it targets, and the evidence guidance in part two. If the connector
cannot run `research:brief`, reconstruct the same context from
`research/questions/`, prior handoffs and decisions, and the current target
records under `content/`.

Before searching externally, tell the user in plain language:

- what the repository currently says about this part of the system;
- what previous research or decisions materially changed that understanding;
- the important unknowns, assumptions, or tensions already visible;
- the exact question this run will try to answer; and
- what the run is deliberately not trying to answer.

Ask the user to correct that framing. Their correction is part of the research
input, not an interruption to the process.

## 2. Investigate conversationally

Research with public, non-sensitive sources, following part two. Prefer current
and directly transferable evidence, look for counterevidence, and keep claims
within what the source design can support.

The conversation should remain useful while the research is happening:

- distinguish **what the repository currently believes**, **what external
  evidence says**, and **what the agent is inferring**;
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

Do not treat finding a plausible answer as the end of research. Before writing
the handoff, show the user the small candidate finding set and the material
uncertainties.

Ask, in effect: **is this the useful thing we learned, and is any statement
doing more work than the evidence or the user's understanding supports?**

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
5. **Worth asking next** — which new unknowns, if any, deserve an actual place
   in the research queue?
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
Explain why each would change a decision or deepen an important part of the
model. Queue the questions the user agrees are worth pursuing, or ones required
by an explicitly blocked piece of work. Leave the rest as known unknowns.

## Do not move on while the learning loop is open

The default behavior for a human-guided research session is:

**do not begin the next queued research problem until the current run has had a
learning checkpoint, unless the user explicitly chooses to skip it.**

A merged handoff or applied `researchTrace` means the repository learned. It
does not by itself mean the person working with the repository has integrated
what was learned.

## What should persist

Keep this lightweight. Durable outcomes already have homes:

- current understanding belongs in canonical `content/`;
- external findings belong in the handoff;
- human judgment belongs in the decision record;
- evidence lineage belongs in `researchTrace`; and
- user-approved follow-up questions belong in `research/questions/`.

Do not commit conversational transcripts or manufacture another source of truth
just to prove that a checkpoint happened.

## Starting a later conversation

A new conversational agent should be able to enter without the prior chat. It
should reconstruct the current state from the repository, perform the
orientation checkpoint, and let the user correct it before continuing.

The goal is continuity of understanding, not continuity of transcript.

---

# Part two — judging the evidence

This repository uses public research to improve a generalized operating model. A
source being published, peer reviewed, recent, or primary does not make a
finding true. Agents propose findings; a person decides what is strong enough to
enter the model.

The goal is not exhaustive systematic review. It is a fast, transparent evidence
pass that favors evidence most likely to transfer to current parent-focused
behavioral-health operations and makes important limitations visible.

## Prefer current evidence when the world has changed

Recency matters in proportion to how quickly the underlying subject changes.

- **Technology, telehealth workflows, AI, platform operations, reimbursement,
  regulation, and implementation practice:** search the most recent 3-5 years
  first. Evidence older than 5 years needs an explicit reason for use and, when
  available, newer corroboration before it supports a current operating-model
  finding.
- **Care-delivery operations, clinician workflow, training, access, and service
  design:** prefer the most recent 5 years. Extend backward when recent evidence
  is thin, but explain why the older setting still transfers.
- **Stable constructs, measurement theory, research methods, or landmark
  frameworks:** older work may be foundational and should not be discarded only
  because of age. Do not use it by itself to establish that a current
  technology, workflow, or market behaves the same way today.

These are repository defaults, not arbitrary eligibility cutoffs. A run may
search further back when that is necessary to understand the evidence base. The
handoff should make the reason visible rather than quietly treating old and new
evidence as interchangeable.

## Judge the source on more than date

For every finding, consider five things before proposing it:

1. **Directness.** How closely do the population, setting, workflow,
   intervention, and outcome match the claim being made? A recent
   nursing-education simulation may still be indirect evidence for experienced
   behavioral-health clinicians.
2. **Recency.** Has the relevant technology, regulation, workflow, or care model
   changed enough that the result may not transfer now?
3. **Study strength.** Was the design capable of supporting the statement? A
   qualitative study can establish an experienced problem or mechanism; it
   cannot establish an effect size. A simulation can expose a competency gap; it
   does not prove a production gate improves outcomes.
4. **Consistency and triangulation.** Does the finding rely on one study, or do
   independent sources using different methods point in the same direction?
   Prefer triangulation for consequential findings.
5. **Independence and incentives.** Note obvious conflicts, vendor-authored
   evidence, self-evaluation, or duplicated datasets when they materially affect
   interpretation.

`evidenceQuality` in the handoff is a coarse description of the evidence being
used, not a truth score. `primary` does not mean accurate, `secondary` does not
mean weak, and `expert-opinion` does not mean useless. The finding statement and
uncertainty must stay within what the source design can actually support.

## Search order

For a normal research run:

1. Start with recent systematic reviews, consensus or professional guidance, and
   high-quality recent primary research directly related to the question.
2. Look for newer primary studies that test or qualify the synthesis, especially
   when technology or workflow has changed since the review's search date.
3. Search backward for foundational frameworks or unique direct evidence only
   when they add something the recent evidence does not.
4. Search deliberately for a counterexample, null result, implementation
   failure, or conflicting perspective before finalizing a consequential
   finding.

A recent review can already be stale in a fast-moving field because its
literature search may have ended years before publication. Record and reason
from the evidence window when it is available, not only the journal publication
date.

## What belongs in a handoff

A handoff should stay small. Prefer a few atomic findings that survive
source-quality review over a large literature dump.

For each finding:

- cite the sources that actually support that statement;
- keep the statement narrower than the weakest important inferential leap;
- use `uncertainty` to name material limitations in directness, age, design,
  conflicting evidence, or transferability;
- do not average conflicting evidence into a confident sentence; preserve the
  conflict;
- do not create a composite score merely because several dimensions matter;
- do not turn an association into a causal claim;
- do not let a downstream outcome become evidence for an upstream process
  without an explicit attribution argument.

Older evidence used for a current, fast-changing operating claim should say why
it remains relevant in `uncertainty` and should normally be paired with newer
corroboration. If no newer corroboration exists, say so and lower the ambition
of the finding.

## A proportionate evidence bar

The evidence bar rises with the decision the model could support.

- **Exploration and problem naming:** credible contextual evidence and explicit
  uncertainty can be enough.
- **Operating-model definitions and workflow design:** prefer recent, directly
  transferable evidence and triangulation across sources.
- **Metrics and attribution:** require a clear construct, denominator,
  observation window, missingness treatment, and a reason the signal supports
  the proposed interpretation.
- **Clinical safety, clinician selection, matching gates, quality attribution,
  or individual-level decisions:** require the strongest and most direct
  evidence available, explicit counterevidence review, and human scrutiny. A
  plausible study is not enough.

When the available literature cannot meet the bar, the correct output is a
narrower finding, an open question, or `needs-research` — not a more polished
assertion.

## Reviewer questions

Before accepting a finding, ask:

- Would I believe this less if the study were 10 years older? If so, has the
  agent supplied sufficiently current evidence?
- Does the evidence study the thing the finding says, or only something adjacent
  to it?
- Is the finding stronger than the design permits?
- Is one source carrying too much weight?
- What evidence would make me change this decision?
- If accepted, what action could this finding eventually authorize, and is the
  evidence strong enough for that use?

The reviewer can accept, edit, reject, defer, or request more research one
finding at a time. Source quality is a reason to narrow or defer a finding, not
a reason to force a binary good-study/bad-study judgment.
