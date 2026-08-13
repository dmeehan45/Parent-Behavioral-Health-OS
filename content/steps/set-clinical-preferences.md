---
id: set-clinical-preferences
title: Set Clinical Preferences
stage: clinician-onboarding
order: 4
next:
  - establish-availability
purpose: >
  Capture concise preferences needed to support appropriate matching.
entryConditions:
  - practice configuration is usable
inputs:
  - entity: clinician
    state: configured
activity: >
  Capture concise preferences needed to support appropriate matching.
outputs:
  - entity: clinician
    state: preferences-defined
exitConditions:
  - matching preferences are available
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
