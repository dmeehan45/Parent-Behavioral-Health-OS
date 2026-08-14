---
id: source-candidates
title: Source Candidates
stage: clinician-supply
order: 2
next:
  - attract-candidates
purpose: >
  Identify clinicians who plausibly fit a stated supply need.
entryConditions:
  - a supply need has been stated
inputs:
  - entity: supply-need
    state: stated
outputs:
  - entity: clinician
    state: discovered
exitConditions:
  - clinicians who plausibly fit the need are known to the system
roles:
  primary: [platform-operations]
metrics:
  - operating-effort-per-activation
authority: proposed
provenance: { source: author, references: [] }
lastReviewed: 2026-08-14
---

# Current model

Knowing of a clinician is separate from that clinician wanting to participate.
This step produces the first state on the clinician ladder and nothing more.

# Open questions

- Which sourcing routes produce clinicians who later prove strong, rather than
  clinicians who are merely easy to reach?
- When a need goes unfilled, is the constraint the search or the need itself?
