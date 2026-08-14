---
id: attract-candidates
title: Attract Candidates
stage: clinician-supply
order: 3
next:
  - screen-candidates
purpose: >
  Give a clinician the system knows of enough reason to enter the candidate pool.
entryConditions:
  - clinicians who plausibly fit the need are known to the system
inputs:
  - entity: clinician
    state: discovered
outputs:
  - entity: clinician
    state: applicant
exitConditions:
  - a candidate has entered the pool and can be assessed
roles:
  primary: [clinician]
  supporting: [platform-operations]
rules: []
exceptions: []
metrics:
  - candidate-yield
authority: proposed
provenance: { source: author, references: [] }
lastReviewed: 2026-08-14
---

# Current model

The first step where the clinician, not the system, is the primary actor. A
candidate who is found but never applies is invisible to every measure taken
after this point.

# Open questions

- What do clinicians weigh when deciding whether to enter a pool at all?
- Where are strong candidates lost between being found and applying?
