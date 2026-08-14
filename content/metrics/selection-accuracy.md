---
id: selection-accuracy
title: Selection Accuracy
unit: percent
direction: higher
targets: [clinician-supply, quality-outcomes, select-clinician]
perspectives:
  - { actor: practice-management-platform, role: primary }
  - { actor: clinician, role: balancing }
  - { actor: family, role: balancing }
decisionOwner: practice-management-platform
decision: >
  Decide whether selection judgments are valid enough to revise; do not use this metric for individual selection until quality and attribution are defined.
dataStatus: unknown
provenance: { source: author, references: [] }
---

Share of selected clinicians who later meet the quality bar they were selected against. It is the only measure that closes the loop between a selection judgement and what that clinician actually does, and it cannot be computed until quality is observable per clinician.
