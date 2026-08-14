---
id: screen-candidates
title: Screen Candidates
stage: clinician-supply
order: 4
next:
  - select-clinician
purpose: >
  Remove weak-fit candidates before deeper human judgement is spent on them.
entryConditions:
  - a candidate has entered the pool
inputs:
  - entity: clinician
    state: applicant
outputs:
  - entity: clinician
    state: qualified
exitConditions:
  - a candidate is either removed or advanced to evaluation
roles:
  primary: [platform-operations]
rules: []
exceptions:
  - condition: a candidate is screened out on incomplete information
    outcome: the candidate is lost, and nothing in the model revisits the decision
metrics:
  - candidate-yield
authority: proposed
provenance: { source: author, references: [] }
lastReviewed: 2026-08-14
---

# Current model

Screening exists to protect expensive judgement, so it is deliberately separate
from selection. Its purpose is to be cheap, which is also what makes its errors
hard to see: a candidate removed here leaves no trace downstream.

# Open questions

- Which screening signals are genuinely cheap, and which only look cheap once
  the effort of gathering them is counted?
- How would we know a strong candidate had been wrongly screened out?
