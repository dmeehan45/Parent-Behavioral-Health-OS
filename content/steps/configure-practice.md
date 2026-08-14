---
id: configure-practice
title: Configure Practice
stage: clinician-onboarding
order: 3
next:
  - set-clinical-preferences
purpose: >
  Establish the clinician’s basic practice configuration.
entryConditions:
  - required verification is complete
inputs:
  - entity: clinician
    state: verified
outputs:
  - entity: practice
    state: configured
  - entity: clinician
    state: configured
exitConditions:
  - practice configuration is usable
roles:
  primary: [clinician]
  supporting: [platform-operations]
authority: proposed
provenance: { source: author, references: [] }
lastReviewed: 2026-08-13
---

This concise step is a hypothesis that can be progressively enriched as evidence develops.
