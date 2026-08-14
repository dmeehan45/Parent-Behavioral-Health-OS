---
id: select-clinician
title: Evaluate & Select
stage: clinician-supply
order: 5
next:
  - selection-complete
purpose: >
  Apply deeper judgement to decide whether a candidate meets the quality bar.
entryConditions:
  - a candidate has passed screening
inputs:
  - entity: clinician
    state: qualified
outputs:
  - entity: clinician
    state: selected
exitConditions:
  - a selection decision has been made and the clinician can enter onboarding
roles:
  primary: [platform-operations]
  supporting: [clinician]
claims:
  - claim-selection-predicts-quality
metrics:
  - selection-accuracy
  - operating-effort-per-activation
authority: proposed
provenance: { source: author, references: [] }
lastReviewed: 2026-08-14
---

# Current model

This is the most expensive judgement in clinician supply and the one the model
can say least about. It hands off to `selection-complete`, which is the
onboarding side of the same boundary.

# Open questions

- Which selection judgements actually predict later quality, and which are
  habits?
- How much of the decision is legible enough to be repeated by someone else?
- What does the model do with a decision it later learns was wrong?
