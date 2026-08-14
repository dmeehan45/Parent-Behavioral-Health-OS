---
id: credential-verify
title: Credential / Verify
stage: clinician-onboarding
order: 2
next:
  - configure-practice
purpose: >
  Verify the minimum proposed professional and operating prerequisites.
entryConditions:
  - clinician has been selected
inputs:
  - entity: clinician
    state: selected
outputs:
  - entity: credential
    state: verified
  - entity: clinician
    state: verified
exitConditions:
  - required verification is complete
roles:
  primary: [clinician]
  supporting: [platform-operations]
authority: proposed
provenance: { source: author, references: [] }
lastReviewed: 2026-08-13
---

This concise step is a hypothesis that can be progressively enriched as evidence develops.
