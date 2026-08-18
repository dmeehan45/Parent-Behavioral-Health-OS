---
id: clinician-performance-loses-context
title: Clinician performance loses its context
targets: [clinician-onboarding, matching, quality-outcomes]
summary: >
  Clinician performance can be reused as if it describes the clinician alone even when case mix, match conditions, platform configuration, workload, support, prior routing, and observable-label conditions contributed to the result.
status: open
authority: proposed
provenance: { source: author-and-reviewed-public-research, references: [] }
researchTrace:
  - run: 2026-08-18-deepen-matching-quality
    decision: decide-2026-08-18-deepen-matching-quality-finding-contextual-performance-can-inform-pairing-not-rank
    finding: finding-contextual-performance-can-inform-pairing-not-rank
    stance: qualifies
    sources: [source-constantino-strength-matching-rct, source-predictive-selection-run]
  - run: 2026-08-18-deepen-matching-quality
    decision: decide-2026-08-18-deepen-matching-quality-finding-learning-needs-decision-time-label-context
    finding: finding-learning-needs-decision-time-label-context
    stance: contextualizes
    sources: [source-chang-disparate-censorship]
lastReviewed: 2026-08-18
---

# What happens today

The model can accumulate observations about a clinician without requiring the conditions that produced those observations to travel with them. For matching, that context also includes what the system knew when it routed care, which alternatives were available, whether supply was constrained, which cases the clinician was exposed to, and which outcomes became observable at all.

# Why it matters

Later matching, monitoring, ranking, support, or training decisions can learn the wrong lesson if a clinician-system interaction is reduced to a static clinician trait. A contextual strength that is useful for a particular patient or problem can also become misleading if it is turned into a general rank or if the labeling process forgets the state of the network when the observation was created.

# Open questions

- What minimum case, match, platform, workload, support, routing, and observation context should travel with a performance observation?
- Which effects should be attributed to the clinician, the operating system, or their interaction?
- Which contextual clinician strengths are reliable enough to reuse for future routing without turning them into a global performance score?
