---
id: become-match-ready
title: Become Match-Ready
stage: clinician-onboarding
order: 6
purpose: >
  Confirm the proposed inputs needed for the clinician to receive family demand.
entryConditions:
  - configuration, preferences, and availability are present
inputs:
  - entity: clinician
    state: availability-defined
activity: >
  Confirm the proposed inputs needed for the clinician to receive family demand.
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
rules: []
exceptions: []
claims:
  - claim-first-caseload-retention
metrics:
  - time-to-first-match
  - time-to-first-session
authority: proposed
provenance: { source: author, references: [] }
lastReviewed: 2026-08-13
---

This concise step is a hypothesis that can be progressively enriched as evidence develops.
