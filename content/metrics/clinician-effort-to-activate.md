---
id: clinician-effort-to-activate
title: Clinician Effort to Activate
unit: hours
direction: lower
targets: [clinician-supply, clinician-onboarding, practice-operations]
perspectives:
  - { actor: clinician, role: primary }
  - { actor: practice-management-platform, role: operator }
decisionOwner: practice-management-platform
decision: >
  Decide which onboarding requirements or support should change when clinician burden is obscuring an otherwise acceptable activation path.
dataStatus: unknown
provenance: { source: author-and-reviewed-public-research, references: [] }
researchTrace:
  - run: 2026-08-14-what-makes-clinician-onboarding-high-quality
    decision: decide-2026-08-14-what-makes-clinician-onboarding-high-quality-finding-separate-burden-from-speed-and-self-report
    finding: finding-separate-burden-from-speed-and-self-report
    stance: supports
    sources: [source-sieja-ehr-training]
lastReviewed: 2026-08-14
---

Hours a clinician spends satisfying the system's requirements between first contact and a settled operating rhythm. This is a balancing or diagnostic measure, not the primary definition of onboarding success. Start with the simpler activation measure; use clinician effort when elapsed time alone may be hiding burden or rework that would change an operating decision.
