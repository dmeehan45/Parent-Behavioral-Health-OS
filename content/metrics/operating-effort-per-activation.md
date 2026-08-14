---
id: operating-effort-per-activation
title: Operating Effort per Activation
unit: hours
direction: lower
targets: [clinician-supply, clinician-onboarding, matching]
perspectives:
  - { actor: practice-management-platform, role: primary }
  - { actor: clinician, role: balancing }
decisionOwner: practice-management-platform
decision: >
  Decide where the platform should simplify, support, or automate activation work when manual operating effort is constraining the path.
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

Hours of platform-operations effort spent for each clinician who reaches active practice. This is a diagnostic measure rather than a required component of onboarding quality. Use it when the simpler activation measure suggests a scaling problem or when manual effort may explain why an otherwise fast path is expensive to operate. High effort can identify where to investigate; by itself it does not establish that a step cannot scale.
