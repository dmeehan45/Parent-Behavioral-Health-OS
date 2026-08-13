---
id: selection-complete
title: Selection Complete
stage: clinician-onboarding
order: 1
next:
  - credential-verify
purpose: >
  Confirm that clinician selection is complete and hand off a clear onboarding state.
entryConditions:
  - clinician has met proposed selection criteria
inputs:
  - entity: clinician
    state: selected
activity: >
  Confirm that clinician selection is complete and hand off a clear onboarding state.
outputs:
  - entity: clinician
    state: selected
exitConditions:
  - clinician is ready to enter onboarding
roles:
  primary: [clinician]
  supporting: [platform-operations]
rules: []
exceptions: []
authority: proposed
provenance: { source: author, references: [] }
lastReviewed: 2026-08-13
---

This concise step is a hypothesis that can be progressively enriched as evidence develops.
