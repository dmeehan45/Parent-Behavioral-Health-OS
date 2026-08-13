---
id: first-successful-family
title: First Successful Family
stage: clinician-onboarding
order: 7
purpose: >
  Translate activation into an initial accepted care relationship.
entryConditions:
  - clinician is match-ready
inputs:
  - entity: clinician
    state: open
activity: >
  Translate activation into an initial accepted care relationship.
outputs:
  - entity: match
    state: accepted
  - entity: care-relationship
    state: initiated
  - entity: clinician
    state: active
exitConditions:
  - an appropriate first family has started care
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
