---
id: clinician-onboarding
title: Clinician Onboarding & Readiness
order: 3
summary: >
  Move selected clinicians from administrative setup into readiness for matching and the technology-enabled work that follows.
status: exploring
entryConditions:
  - clinician has been selected
exitConditions:
  - clinician is operationally ready
  - clinician can receive appropriate family demand
metrics:
  - time-to-activation
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
  - run: 2026-08-14-what-makes-clinician-onboarding-high-quality
    decision: decide-2026-08-14-what-makes-clinician-onboarding-high-quality-finding-separate-burden-from-speed-and-self-report
    finding: finding-separate-burden-from-speed-and-self-report
    stance: supports
    sources: [source-sieja-ehr-training]
lastReviewed: 2026-08-14
---

# Current model

Clinician onboarding begins after selection and ends when the clinician is ready to participate in matching. Readiness is not administrative completion, a single score, or proof of clinician quality. It is the set of onboarding conditions needed to work safely and effectively in the platform's technology-enabled operating environment.

Onboarding may assess platform-specific capabilities when failure is consequential and the capability is observable. It should not claim to establish underlying clinical competence or long-term clinician quality. Those are separate constructs; long-term quality should be informed by ongoing care relationships, outcomes, and clinician and patient experience.

Patient-facing safety, privacy, communication, technology, and access constraints that can reasonably be prepared for before matching belong in onboarding readiness. Conditions created by a particular patient's needs or preferences, a specific match, or the later care relationship do not belong to onboarding by default.

Time to activation remains the simplest operating measure for this stage. Burden and rework are balancing or diagnostic signals when they help explain or improve that measure, not components of a composite onboarding-quality score by default.

# Open questions

- Which observable workflows are sufficiently critical to require demonstrated readiness before matching?
- When a clinician has an onboarding-specific gap, which failures should block matching, trigger remediation, or remain monitored without gating?
- Which post-activation defects are sufficiently close to onboarding to count as onboarding-quality signals, and where should attribution stop?
- Which match-affecting clinician attributes require correctness checks rather than only completeness checks?
- What is the smallest useful measurement set beyond time to activation, and when would burden or rework change a decision?
