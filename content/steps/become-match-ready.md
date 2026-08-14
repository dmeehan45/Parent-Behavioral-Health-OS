---
id: become-match-ready
title: Become Match-Ready
stage: clinician-onboarding
order: 6
next:
  - propose-match
purpose: >
  Establish when required matching inputs are present and no known onboarding-specific blocker prevents participation in matching.
entryConditions:
  - configuration, preferences, and availability are present
inputs:
  - entity: clinician
    state: availability-defined
outputs:
  - entity: clinician
    state: match-ready
  - entity: caseload
    state: open
exitConditions:
  - clinician can participate in matching
roles:
  primary: [clinician]
  supporting: [platform-operations]
claims:
  - claim-first-caseload-retention
metrics:
  - time-to-first-match
  - time-to-first-session
authority: proposed
provenance: { source: author-and-reviewed-public-research, references: [] }
researchTrace:
  - run: 2026-08-14-what-makes-clinician-onboarding-high-quality
    decision: decide-2026-08-14-what-makes-clinician-onboarding-high-quality-finding-readiness-includes-operating-environment
    finding: finding-readiness-includes-operating-environment
    stance: supports
    sources: [source-lagoo-physician-onboarding, source-wiese-clinical-orientation, source-hhs-telebehavioral-emergency-plan]
  - run: 2026-08-14-what-makes-clinician-onboarding-high-quality
    decision: decide-2026-08-14-what-makes-clinician-onboarding-high-quality-finding-demonstrate-critical-readiness
    finding: finding-demonstrate-critical-readiness
    stance: supports
    sources: [source-merrill-telebehavioral-social-work, source-jiang-telemental-training-review, source-liew-telepsychiatry-simulation]
  - run: 2026-08-14-what-makes-clinician-onboarding-high-quality
    decision: decide-2026-08-14-what-makes-clinician-onboarding-high-quality-finding-patient-facing-conditions-constrain-readiness
    finding: finding-patient-facing-conditions-constrain-readiness
    stance: supports
    sources: [source-jacob-telehealth-competencies, source-galvin-remote-mental-health, source-hhs-telebehavioral-emergency-plan]
lastReviewed: 2026-08-14
---

This step marks a transition into matching, not a clinician-quality score. Configuration, preferences, and availability are required inputs, but their presence alone does not demonstrate readiness for consequential platform-specific or technology-enabled workflows.

Underlying clinical competence and long-term clinician quality are outside this step. The model has not yet defined which onboarding-specific gaps should block matching, trigger remediation, or remain monitored without gating, so that decision remains open rather than being hidden inside a readiness score.
