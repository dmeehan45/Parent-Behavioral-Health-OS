---
id: state-supply-need
title: State the Supply Need
stage: clinician-supply
order: 1
next:
  - source-candidates
purpose: >
  Turn observed family demand into a statement of what clinician capacity is
  required, where, and by when.
entryConditions:
  - family demand is understood well enough to describe the care it requires
outputs:
  - entity: supply-need
    state: stated
exitConditions:
  - a supply need is stated specifically enough to search against
roles:
  primary: [platform-operations]
authority: proposed
provenance: { source: author, references: [] }
lastReviewed: 2026-08-14
---

# Current model

Supply is planned rather than assumed. Without this step the model recruits
clinicians in general and discovers only afterwards whether they fit the demand
that arrived.

# Open questions

- What makes a supply need specific enough to act on without being so narrow
  that nobody satisfies it?
- How far ahead of demand can a need usefully be stated?
- Who resolves a need that demand contradicts once it is open?
