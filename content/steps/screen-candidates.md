---
id: screen-candidates
title: Screen Candidates
stage: clinician-supply
order: 4
next:
  - select-clinician
purpose: >
  Establish eligibility and evidence sufficiency cheaply enough to route prospects without spending deeper selection judgment indiscriminately.
entryConditions:
  - a candidate has entered the pool
inputs:
  - entity: clinician
    state: applicant
outputs:
  - entity: clinician
    state: qualified
exitConditions:
  - a candidate is either removed, sent for more evidence, or advanced to evaluation
roles:
  primary: [candidate-qualification]
  supporting: [clinician]
exceptions:
  - condition: a candidate is screened out on incomplete information
    outcome: the candidate is lost, and nothing in the model revisits the decision
metrics:
  - candidate-yield
authority: proposed
provenance: { source: author, references: [] }
lastReviewed: 2026-08-18
---

# Current model

Screening exists to protect expensive judgment, but that does not make it a purely automated filter. The functional role here is candidate qualification: assembling and verifying available evidence, resolving cheap gaps, requesting bounded additional information, and deciding when the record is sufficient to hand forward.

`candidate-qualification` is a role in the work, not an org chart. A small network may have the same person screen and select. A scaled network may assign this work to a different internal team, an external partner, or a system-supported operations function. What matters is that the evidence and uncertainty are explicit before the next decision owner receives the prospect.

Screening should not silently become the final quality decision. Its errors are especially hard to see because a candidate removed here leaves no downstream performance evidence.

# Open questions

- Which screening and enrichment signals are genuinely cheap once collection effort is counted?
- Which missing evidence can be gathered without qualified human interaction, and which requires it?
- How would we know a strong candidate had been wrongly screened out?
- What evidence state is sufficient to hand a prospect to deeper selection judgment?
