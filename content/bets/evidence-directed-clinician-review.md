---
id: evidence-directed-clinician-review
title: Evidence-Directed Clinician Review
problem: scarce-review-time-without-comparable-evidence
status: concept
confidence: medium
awaiting: [define-selection-handoff]
metrics: [operating-effort-per-activation, selection-accuracy, candidate-yield]
authority: proposed
provenance: { source: author, references: [] }
lastReviewed: 2026-08-17
---

# Bet

Build a comparable evidence profile for each in-scope clinician prospect and use evidence sufficiency, uncertainty, and explicit eligibility rules to choose the next action, reserving scarce human review for cases where structured judgment could materially change a consequential decision.

# Questions

- Which evidence is sufficient to advance, stop, or request more information without human review?
- Which forms of uncertainty or contradiction justify scarce reviewer time?
- How often will reviewers override an evidence-directed route, and what do those overrides teach us?
- Which clinician-facing evidence requests can be automated without making the selection experience feel dehumanized or misleadingly machine-decided?

# Learning decision

Whether an operator can use a comparable evidence profile and explicit next-step routing to replace a uniform manual review path for a meaningful share of prospects while retaining accountable human judgment for consequential ambiguity.

# Scope

**Starting state.** A clinician prospect already exists in the candidate pool. The prototype begins with several synthetic prospects whose evidence differs in completeness, confidence, and relevance.

**Operator path.** The reviewer can see what is known, which items are true eligibility gates versus predictive evidence, how trustworthy each signal is, what consequential information is still missing, why the prospect was routed to the current action, and what the smallest useful next step is. The reviewer can accept the route, request additional evidence, send the case to structured human review, or override the recommendation with a reason.

**Clinician-facing safeguard.** When the system requests additional information from a clinician, the experience remains visibly backed by a person. Automated collection is presented as a bounded way to gather or organize a few pieces of information before or around a human interaction, not as "AI interviewing" or a machine making the contracting decision. A named human presence, clear explanation of purpose, and a route to human contact remain visible.

# Out of scope

Prospect generation is a separate problem space. This experiment assumes prospects already exist and does not test role posting, outbound sourcing, inbound volume generation, channel strategy, or how a clinician first enters the pool.

The prototype also does not establish the final predictive model, automate final contracting decisions, prove which screening threshold is legally or clinically valid, or define how the evidence profile persists after selection. The last of those remains open under `define-selection-handoff`.

# Assumptions

Held for this prototype only:

- Enough prospect volume already exists for scarce reviewer capacity to be a meaningful constraint.
- The synthetic evidence shown is representative enough to make routing tradeoffs legible, but none of its scores or thresholds should be read as validated selection criteria.
- Some facts are genuinely noncompensable eligibility requirements while other evidence should remain compensatory or reviewable.
- Automation can prepare, normalize, summarize, or collect evidence without being granted autonomous authority to make the final contracting decision.
- Human presence is part of the selection system, not decorative reassurance added after an automated process is designed.

# Signals and safeguards

**Primary signal.** Whether reviewers follow, override, or abandon the evidence-directed next action, and whether the reason for an override identifies missing evidence, a bad rule, a representation error, or a case where human judgment adds information the structured profile did not contain.

**Efficiency signal.** Which prospects reviewers believe can be resolved without a full manual review and which actions still require meaningful reviewer time. This prototype can compare workflow choices and perceived effort, but it cannot claim a reduction in real `operating-effort-per-activation` until used in an operating process.

**Quality safeguard.** A fast route is not a success if it hides consequential uncertainty or creates unobservable false negatives. The interface must expose confidence, provenance, and why a rule is being used. No synthetic recommendation should be presented as validated clinical truth.

**Clinician-experience safeguard.** Any automated information-gathering step must disclose its bounded purpose, preserve a visible human relationship, and avoid language suggesting that an AI system is independently interviewing, judging, or contracting the clinician.

# Fidelity

- **Content.** Synthetic clinician prospects and synthetic evidence only. Use the evidence domains and lifecycle framing from the current research, but do not invent validated cutoffs.
- **Interaction.** High fidelity for queue prioritization, evidence inspection, next-action choice, override, and the preview of an additional-evidence request. Those are the decisions under test.
- **System.** Local and fake. No real clinician data, communication, enrichment, screening, or contracting action occurs.
- **Visual.** Use the repository design system. Optimize for decision clarity and provenance rather than polish.
