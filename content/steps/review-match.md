---
id: review-match
title: Review and Decide on a Match
stage: matching
order: 2
purpose: Keep family and clinician acceptance explicit before care initiation begins.
entryConditions:
  - a match has been proposed
inputs:
  - { entity: match, state: proposed }
outputs:
  - { entity: match, state: accepted }
exitConditions:
  - the family and clinician have both accepted the proposal
roles:
  primary: [family, clinician]
  supporting: [practice-management-platform]
exceptions:
  - condition: either party declines or the proposal expires
    outcome: preserve the decision and return for a new proposal when appropriate
    route: propose-match
metrics: [time-to-first-match]
authority: proposed
provenance: { source: accountable-reviewer, references: ["Adversarial review decisions D4 and D7, 2026-08-14"] }
lastReviewed: 2026-08-14
---

# Current model

Mutual acceptance changes a proposed Match to accepted. It enables care initiation; it does not create a Care Relationship.

# Open questions

- How can either party decline without creating avoidable burden or pressure?
- When should a declined or expired proposal return to intake rather than another proposal?
