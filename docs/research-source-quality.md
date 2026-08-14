# Research source quality

This repository uses public research to improve a generalized operating model. A source being published, peer reviewed, recent, or primary does not make a finding true. Agents propose findings; a person decides what is strong enough to enter the model.

The goal is not exhaustive systematic review. It is a fast, transparent evidence pass that favors evidence most likely to transfer to current parent-focused behavioral-health operations and makes important limitations visible.

## Prefer current evidence when the world has changed

Recency matters in proportion to how quickly the underlying subject changes.

- **Technology, telehealth workflows, AI, platform operations, reimbursement, regulation, and implementation practice:** search the most recent 3-5 years first. Evidence older than 5 years needs an explicit reason for use and, when available, newer corroboration before it supports a current operating-model finding.
- **Care-delivery operations, clinician workflow, training, access, and service design:** prefer the most recent 5 years. Extend backward when recent evidence is thin, but explain why the older setting still transfers.
- **Stable constructs, measurement theory, research methods, or landmark frameworks:** older work may be foundational and should not be discarded only because of age. Do not use it by itself to establish that a current technology, workflow, or market behaves the same way today.

These are repository defaults, not arbitrary eligibility cutoffs. A run may search further back when that is necessary to understand the evidence base. The handoff should make the reason visible rather than quietly treating old and new evidence as interchangeable.

## Judge the source on more than date

For every finding, consider five things before proposing it:

1. **Directness.** How closely do the population, setting, workflow, intervention, and outcome match the claim being made? A recent nursing-education simulation may still be indirect evidence for experienced behavioral-health clinicians.
2. **Recency.** Has the relevant technology, regulation, workflow, or care model changed enough that the result may not transfer now?
3. **Study strength.** Was the design capable of supporting the statement? A qualitative study can establish an experienced problem or mechanism; it cannot establish an effect size. A simulation can expose a competency gap; it does not prove a production gate improves outcomes.
4. **Consistency and triangulation.** Does the finding rely on one study, or do independent sources using different methods point in the same direction? Prefer triangulation for consequential findings.
5. **Independence and incentives.** Note obvious conflicts, vendor-authored evidence, self-evaluation, or duplicated datasets when they materially affect interpretation.

`evidenceQuality` in the handoff is a coarse description of the evidence being used, not a truth score. `primary` does not mean accurate, `secondary` does not mean weak, and `expert-opinion` does not mean useless. The finding statement and uncertainty must stay within what the source design can actually support.

## Search order

For a normal research run:

1. Start with recent systematic reviews, consensus or professional guidance, and high-quality recent primary research directly related to the question.
2. Look for newer primary studies that test or qualify the synthesis, especially when technology or workflow has changed since the review's search date.
3. Search backward for foundational frameworks or unique direct evidence only when they add something the recent evidence does not.
4. Search deliberately for a counterexample, null result, implementation failure, or conflicting perspective before finalizing a consequential finding.

A recent review can already be stale in a fast-moving field because its literature search may have ended years before publication. Record and reason from the evidence window when it is available, not only the journal publication date.

## What belongs in a handoff

A handoff should stay small. Prefer a few atomic findings that survive source-quality review over a large literature dump.

For each finding:

- cite the sources that actually support that statement;
- keep the statement narrower than the weakest important inferential leap;
- use `uncertainty` to name material limitations in directness, age, design, conflicting evidence, or transferability;
- do not average conflicting evidence into a confident sentence; preserve the conflict;
- do not create a composite score merely because several dimensions matter;
- do not turn an association into a causal claim;
- do not let a downstream outcome become evidence for an upstream process without an explicit attribution argument.

Older evidence used for a current, fast-changing operating claim should say why it remains relevant in `uncertainty` and should normally be paired with newer corroboration. If no newer corroboration exists, say so and lower the ambition of the finding.

## A proportionate evidence bar

The evidence bar rises with the decision the model could support.

- **Exploration and problem naming:** credible contextual evidence and explicit uncertainty can be enough.
- **Operating-model definitions and workflow design:** prefer recent, directly transferable evidence and triangulation across sources.
- **Metrics and attribution:** require a clear construct, denominator, observation window, missingness treatment, and a reason the signal supports the proposed interpretation.
- **Clinical safety, clinician selection, matching gates, quality attribution, or individual-level decisions:** require the strongest and most direct evidence available, explicit counterevidence review, and human scrutiny. A plausible study is not enough.

When the available literature cannot meet the bar, the correct output is a narrower finding, an open question, or `needs-research` — not a more polished assertion.

## Reviewer questions

Before accepting a finding, ask:

- Would I believe this less if the study were 10 years older? If so, has the agent supplied sufficiently current evidence?
- Does the evidence study the thing the finding says, or only something adjacent to it?
- Is the finding stronger than the design permits?
- Is one source carrying too much weight?
- What evidence would make me change this decision?
- If accepted, what action could this finding eventually authorize, and is the evidence strong enough for that use?

The reviewer can accept, edit, reject, defer, or request more research one finding at a time. Source quality is a reason to narrow or defer a finding, not a reason to force a binary good-study/bad-study judgment.
