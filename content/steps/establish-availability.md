---
id: establish-availability
title: Establish Availability
stage: clinician-onboarding
order: 5
next:
  - become-match-ready
purpose: >
  Establish enough usable appointment availability to participate in matching.
entryConditions:
  - clinical preferences are available
inputs:
  - entity: clinician
    state: preferences-defined
activity: >
  Establish enough usable appointment availability to participate in matching.
outputs:
  - entity: availability
    state: matchable
  - entity: clinician
    state: availability-defined
exitConditions:
  - sufficient availability exists for matching
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
