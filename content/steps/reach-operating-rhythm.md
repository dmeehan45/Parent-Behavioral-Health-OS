---
id: reach-operating-rhythm
title: Reach an Operating Rhythm
stage: practice-operations
order: 1
next:
  - reach-sustainable-caseload
purpose: >
  Move a clinician from a first completed session to a repeatable weekly pattern
  of care.
entryConditions:
  - a first care relationship has started
inputs:
  - entity: clinician
    state: active
outputs:
  - entity: clinician
    state: establishing
exitConditions:
  - a clinician has run a full week of scheduled care without unresolved operational friction
roles:
  primary: [clinician]
  supporting: [platform-operations]
metrics:
  - clinician-effort-to-activate
authority: proposed
provenance: { source: author, references: [] }
lastReviewed: 2026-08-14
---

# Current model

Onboarding ends when one family has started care. A repeatable week is a
different achievement, and the model previously had no state between the two.

# Open questions

- What breaks first when a clinician goes from one family to several?
- Is the first difficult week an operations problem, a scheduling problem, or a
  demand problem?
