---
id: evidence-directed-clinician-review
title: Evidence-Directed Clinician Qualification & Selection
problem: scarce-review-time-without-comparable-evidence
status: concept
confidence: medium
awaiting: [define-selection-handoff]
metrics: [operating-effort-per-activation, selection-accuracy, candidate-yield]
prototype:
  status: working
  route: /prototypes/evidence-directed-clinician-review
  builtAgainst: 02af58-0bba7b-952591-cf113c-10be44-11446f
authority: proposed
provenance: { source: author, references: [] }
lastReviewed: 2026-08-18
---

# Bet

Build one shared clinician evidence profile but separate the work around it into two functional surfaces: qualification and evidence generation before the handoff, then consequential selection and contracting judgment after it. The system should gather, verify, normalize, route, and preserve evidence so human attention is spent on interactions or decisions that add information rather than on reconstructing the candidate. Each evidence item should also carry the decision lever it is meant to inform rather than being flattened into a generic clinician-quality judgment.

# Questions

- Which evidence can the system gather, verify, normalize, or request without qualified human judgment?
- Which clinician interactions are worth human time because they generate meaningful behavioral evidence unavailable from static records?
- Which decision lever is each evidence class actually informative for: eligibility, capability or readiness, network fit, matching context, a defined care-quality domain, or another explicit use?
- What evidence state and uncertainty make a prospect ready to hand from qualification into selection?
- Which ambiguities or contradictions justify senior or specialist selection judgment?
- How should network supply and demand influence a contracting decision without being mistaken for evidence about care performance?
- Which clinician-facing evidence requests can be system-supported without making the experience feel dehumanized or misleadingly machine-decided?

# Learning decision

Whether separating qualification/evidence work from selection and contracting judgment, while carrying one explicit evidence record across the handoff, lets a network absorb greater prospect volume without wasting scarce specialist attention, losing decision context, misusing evidence outside the decision it supports, or degrading clinician trust.

# Scope

**Starting state.** A clinician prospect already exists in the candidate pool. The experiment begins after inbound sourcing and attraction, with synthetic prospects whose available evidence differs in completeness, confidence, and relevance.

**Qualification surface.** A user responsible for candidate qualification sees what evidence the system has already assembled, what decision each item is permitted to inform, which facts are genuine eligibility gates, what is missing or contradictory, and the smallest useful next action. That action may be system collection, a bounded clinician request, or a structured interaction intended to generate evidence that cannot be obtained from static records.

**Selection surface.** A user responsible for consequential selection or contracting judgment receives the resulting evidence profile rather than the raw source trail. They can see provenance, uncertainty, intended use, what was learned through human interaction, and any unresolved issue material to the decision. They decide whether to advance, stop, seek more evidence, or make an accountable exception.

These are **functional roles, not an assumed org chart**. One person may perform both in a small network. At scale they may belong to different internal teams or external partners. The prototype should test whether the handoff remains legible under either arrangement rather than prescribing staffing structure.

**Clinician-facing safeguard.** When the system requests additional information, the experience remains visibly backed by a person and clear about purpose. Automation may support collection and preparation; it should not imply that a machine independently interviewed, judged, or contracted the clinician.

# Out of scope

Prospect generation remains a separate problem space. This experiment does not test role posting, outbound sourcing, inbound channel strategy, or how a clinician first enters the pool.

The prototype also does not establish a final predictive model, validate production screening thresholds, automate final contracting authority, or define the durable downstream persistence rules for the evidence profile. That last boundary remains open under `define-selection-handoff`.

# Assumptions

Held for this prototype only:

- Enough prospect volume exists for allocation of human attention to matter.
- Qualification work and selection judgment are meaningfully different kinds of work even when the same person performs both.
- Evidence can support different decisions without all evidence being interpretable as a general ranking of clinician performance.
- Static clinician attributes may still be useful for eligibility, capability or readiness, network fit, or matching context even when they are weak general predictors of later care outcomes.
- System support can prepare, normalize, summarize, verify, or collect evidence without being granted autonomous final contracting authority.
- Human interaction is valuable when it generates evidence or trust that the system cannot reproduce merely by processing existing data.
- Network need can affect a contracting decision without defining clinical performance.

# Signals and safeguards

**Primary signal.** Whether qualification work produces a record the selection user can act on without reopening the original source material or repeating earlier evidence gathering, and whether disagreements reveal missing evidence, bad routing, representation error, evidence being used for the wrong decision, or genuinely valuable judgment.

**Efficiency signal.** Where human time is spent by function: evidence collection and enrichment, structured clinician interaction, ambiguity resolution, and consequential selection judgment. The prototype can expose whether work moved to a more appropriate role, but it cannot claim real operating-effort reduction until used in an operating process.

**Learning signal.** Whether evidence generated during qualification can later be connected to selection decisions and longitudinal clinician performance so the system can learn which earlier signals were actually useful for which decisions rather than simply collecting more data.

**Evidence-use safeguard.** A fast route is not a success if it hides uncertainty, creates unobservable false negatives, or lets an easily collected attribute influence a decision it was never shown to predict. Provenance, confidence, intended use, and the specific quality or operating domain an item bears on should remain separable.

**Clinician-experience safeguard.** Evidence gathering should preserve a legible human relationship and minimize repeated or unexplained requests. Efficiency that causes strong clinicians to abandon the process is a selection failure.

# Fidelity

- **Content.** Synthetic clinicians and evidence only. Use the working evidence domains and lifecycle framing from current research without inventing validated cutoffs.
- **Interaction.** High fidelity for the qualification-to-selection handoff, evidence inspection, intended-use labeling, targeted evidence collection, role-specific next actions, and accountable override.
- **System.** Local and fake. No real clinician data, communication, enrichment, screening, or contracting action occurs.
- **Visual.** Use the repository design system. Make the distinction between qualification work and selection judgment, and between evidence classes and their intended decision use, legible before adding more workflow depth.

# Review prompts

Use these after working through both functional surfaces rather than asking a reviewer to reason about the workflow abstractly.

- **Role clarity.** Is it obvious what the qualification user owns, what the selection user owns, and which work could be performed by the same person or different teams?
- **Handoff quality.** Does the selection user receive enough evidence and provenance to act without reconstructing the candidate from source material?
- **Evidence use.** Is it clear what each item is allowed to inform, and where does the interface tempt you to infer more from an attribute than the evidence supports?
- **Human attention.** Which interactions or ambiguities genuinely deserve qualified human time, and where is the workflow still spending people on clerical evidence work?
- **Evidence generation.** When a human interaction is used, does it produce decision-relevant evidence that the system could not have gathered another way?
- **Network decision.** Can contracting or network-need context influence the decision without reading as evidence that one clinician is better across unrelated care domains?
- **Clinician trust.** Does system-supported evidence gathering still feel like a human relationship using technology well, or has efficiency started to dominate the experience?
- **Learning loop.** Can you tell how an evidence item gathered here would later be connected to the specific decision it informed and to later observed performance so the system can learn whether it mattered?
