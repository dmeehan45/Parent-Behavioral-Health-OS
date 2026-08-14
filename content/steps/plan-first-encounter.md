---
id: plan-first-encounter
title: Plan the First Encounter
stage: care-initiation
order: 1
next: [complete-first-encounter]
purpose: Turn an accepted match into a feasible first care encounter.
entryConditions:
  - a match has been accepted by both parties
inputs:
  - { entity: match, state: accepted }
outputs:
  - { entity: appointment, state: planned }
exitConditions:
  - a first encounter is planned at a feasible time and under known prerequisites
roles:
  primary: [family, clinician]
  supporting: [practice-management-platform]
exceptions:
  - condition: the encounter is cancelled or prerequisites cannot be met
    outcome: reschedule, return to matching, or close the attempt according to the unresolved reason
metrics: [time-to-first-session]
authority: proposed
provenance: { source: accountable-reviewer, references: ["Adversarial review decisions D4 and D7, 2026-08-14"] }
lastReviewed: 2026-08-14
---

# Current model

Planning the first encounter is a distinct operational transition after match acceptance.

# Open questions

- Which consent, coverage, assessment, safety, and scheduling prerequisites must be resolved here?
- Who owns recovery when prerequisites or scheduling fail?
