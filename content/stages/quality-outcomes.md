---
id: quality-outcomes
title: Quality & Outcomes
order: 7
summary: >
  Understand care quality and feed useful signals back into the operating system.
status: exploring
exitConditions:
  - care quality is observable for a clinician and for a care relationship
  - observed quality can be compared against the judgements made when that clinician was selected
authority: proposed
provenance:
  source: author-and-reviewed-public-research
  references: []
researchTrace:
  - run: 2026-08-14-what-makes-clinician-onboarding-high-quality
    decision: decide-2026-08-14-what-makes-clinician-onboarding-high-quality-finding-separate-readiness-from-downstream-outcomes
    finding: finding-separate-readiness-from-downstream-outcomes
    stance: supports
    sources: [source-proctor-implementation-outcomes-review]
  - run: 2026-08-14-what-makes-clinician-onboarding-high-quality
    decision: decide-2026-08-14-what-makes-clinician-onboarding-high-quality-finding-patient-facing-conditions-constrain-readiness
    finding: finding-patient-facing-conditions-constrain-readiness
    stance: supports
    sources: [source-jacob-telehealth-competencies, source-galvin-remote-mental-health, source-hhs-telebehavioral-emergency-plan]
  - run: 2026-08-18-deepen-matching-quality
    decision: decide-2026-08-18-deepen-matching-quality-finding-match-quality-dimensions-stay-separate
    finding: finding-match-quality-dimensions-stay-separate
    stance: supports
    sources: [source-windle-treatment-preference-meta]
  - run: 2026-08-18-deepen-matching-quality
    decision: decide-2026-08-18-deepen-matching-quality-finding-contextual-performance-can-inform-pairing-not-rank
    finding: finding-contextual-performance-can-inform-pairing-not-rank
    stance: qualifies
    sources: [source-constantino-strength-matching-rct, source-predictive-selection-run]
  - run: 2026-08-18-deepen-matching-quality
    decision: decide-2026-08-18-deepen-matching-quality-finding-family-perspectives-must-remain-distinct
    finding: finding-family-perspectives-must-remain-distinct
    stance: supports
    sources: [source-roest-alliance-perspectives-meta, source-roest-alliance-outcome-meta]
  - run: 2026-08-18-deepen-matching-quality
    decision: decide-2026-08-18-deepen-matching-quality-finding-early-care-updates-association-not-binary-match
    finding: finding-early-care-updates-association-not-binary-match
    stance: contextualizes
    sources: [source-roest-alliance-perspectives-meta, source-roest-alliance-outcome-meta, source-predictive-selection-run]
  - run: 2026-08-18-deepen-matching-quality
    decision: decide-2026-08-18-deepen-matching-quality-finding-learning-needs-decision-time-label-context
    finding: finding-learning-needs-decision-time-label-context
    stance: contextualizes
    sources: [source-chang-disparate-censorship]
lastReviewed: 2026-08-18
---

# Current model

Quality is not one construct carried backward through the whole operating system. Onboarding readiness, matching quality, clinician quality, and the quality of an individual care relationship can inform one another without being treated as interchangeable outcomes.

Later care outcomes and experience should inform the platform's longitudinal understanding of clinician quality and can deepen dimension-specific evidence used for future routing. That does not validate or invalidate a prior match as a binary event, make the resulting evidence a global clinician rank, or imply that an active care relationship should automatically be reassigned. In child and family care, patient, parent or caregiver, and clinician perspectives can provide different evidence and should remain distinguishable.

Any downstream observation used to update clinician or matching evidence needs the context that makes the observation interpretable. Case mix and match conditions matter, as do platform configuration, workload, support, prior assignment and exposure, the alternatives that were available, supply constraints, and missing follow-up. A result produced under those conditions should not be reduced to a context-free clinician trait or treated as proof that an upstream decision caused the outcome.

Patient-facing safety, privacy, communication, technology, and access constraints should be interpreted at the part of the system that could reasonably prepare for or influence them. This keeps onboarding from absorbing problems created by a specific match or later care relationship while still allowing real onboarding failures to remain visible.

# Open questions

- Which early-care signals are reliable enough to update future routing evidence without overclaiming clinician or match quality?
- At what unit—encounter, relationship, clinician, family, association dimension, or platform—can each quality construct be interpreted?
- Who owns interpretation, what uncertainty and missingness must travel with it, and which decisions are permitted?
- What minimum decision-time, case, match, platform, workload, and support context must accompany a performance observation before it can influence later routing?
- Which balancing measures prevent speed, throughput, or apparent outcomes from worsening access, burden, equity, or safety?
