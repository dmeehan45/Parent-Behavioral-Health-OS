---
id: reach-sustainable-caseload
title: Reach a Sustainable Caseload
stage: retention-growth
order: 1
purpose: >
  Grow a clinician's caseload toward the level of practice they intend to hold.
entryConditions:
  - a clinician has a repeatable weekly pattern of care
inputs:
  - entity: clinician
    state: establishing
  - entity: caseload
    state: open
outputs:
  - entity: clinician
    state: sustaining
  - entity: caseload
    state: sustainable
exitConditions:
  - a clinician holds a caseload they consider sustainable
roles:
  primary: [clinician]
  supporting: [platform-operations]
rules: []
exceptions: []
claims:
  - claim-first-caseload-retention
authority: proposed
provenance: { source: author, references: [] }
lastReviewed: 2026-08-14
---

# Current model

The end of the clinician ladder, and the point the model previously stopped
short of: `active` described a clinician with one family and a clinician with a
full week identically.

# Open questions

- What caseload does a clinician consider sustainable, and who decides it?
- Does a clinician who ramps slowly ever reach the same level as one who ramps
  quickly?
- Is a sustainable caseload a state that holds, or one that has to be maintained?
