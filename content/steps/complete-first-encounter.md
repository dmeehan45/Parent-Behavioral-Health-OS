---
id: complete-first-encounter
title: Complete the First Encounter
stage: care-initiation
order: 2
next: [confirm-care-continuation]
purpose: Represent that the first planned care encounter actually occurred.
entryConditions:
  - a first encounter is planned
inputs:
  - { entity: appointment, state: planned }
outputs:
  - { entity: appointment, state: completed }
exitConditions:
  - the encounter occurred and its immediate disposition is known
roles:
  primary: [family, clinician]
  supporting: [practice-management-platform]
exceptions:
  - condition: the family does not attend, the clinician cancels, or the encounter cannot be completed
    outcome: preserve the reason and choose rescheduling, rematching, or closure rather than treating care as started
metrics: [time-to-first-session]
authority: proposed
provenance: { source: accountable-reviewer, references: ["Adversarial review decisions D4 and D7, 2026-08-14"] }
lastReviewed: 2026-08-14
---

# Current model

Completion is separate from mutual intent to continue. This keeps a single encounter from being counted automatically as an ongoing care relationship.

# Open questions

- What makes the encounter clinically and experientially sufficient to support a continuation decision?
- How should failed, partial, or safety-escalated encounters be represented?
