---
id: confirm-care-continuation
title: Confirm Care Continuation
stage: care-initiation
order: 3
next: [reach-operating-rhythm]
purpose: Make the family and clinician decision to continue explicit after the first encounter.
entryConditions:
  - the first encounter was completed
inputs:
  - { entity: appointment, state: completed }
  - { entity: match, state: accepted }
outputs:
  - { entity: care-relationship, state: initiated }
  - { entity: clinician, state: active }
exitConditions:
  - both parties intend to continue and the next care action is understood
roles:
  primary: [family, clinician]
  supporting: [practice-management-platform]
exceptions:
  - condition: either party does not intend to continue
    outcome: return to matching, transition elsewhere, or close with the reason preserved
    route: propose-match
authority: proposed
provenance: { source: accountable-reviewer, references: ["Adversarial review decisions D4 and D7, 2026-08-14"] }
lastReviewed: 2026-08-14
---

# Current model

An ongoing Care Relationship begins only after a completed encounter and an explicit mutual decision to continue.

# Open questions

- How and when is intent confirmed without pressuring either party?
- What information follows a family into rematching, and what requires renewed consent?
