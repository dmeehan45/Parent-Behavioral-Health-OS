---
id: propose-match
title: Propose a Match
stage: matching
order: 1
next: [review-match]
purpose: Present a plausible clinician-family pairing for both parties to consider.
entryConditions:
  - a clinician is match-ready
  - a family is ready to consider a clinician
inputs:
  - { entity: clinician, state: match-ready }
  - { entity: family, state: match-ready }
outputs:
  - { entity: match, state: proposed }
exitConditions:
  - both parties have enough information to consider the proposal
roles:
  primary: [family, clinician]
  supporting: [practice-management-platform]
exceptions:
  - condition: availability or family needs changed before review
    outcome: expire the proposal and return for a new proposal
    route: propose-match
metrics: [time-to-first-match]
authority: proposed
provenance: { source: accountable-reviewer, references: ["Adversarial review decision D4, 2026-08-14"] }
lastReviewed: 2026-08-14
---

# Current model

The platform proposes a pairing; it does not declare the pairing accepted or clinically appropriate on behalf of either party.

# Open questions

- Which family, clinician, access, coverage, and clinical constraints are required before a proposal?
- What information does each party need, and which information should not be exposed?
