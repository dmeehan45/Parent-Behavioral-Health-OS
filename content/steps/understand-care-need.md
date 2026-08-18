---
id: understand-care-need
title: Understand the Care Need
stage: family-demand
order: 2
next:
  - become-ready-to-match
purpose: >
  Understand a family's care need well enough to describe the clinician it
  requires.
entryConditions:
  - a family has sought support and is willing to describe its situation
inputs:
  - entity: family
    state: seeking-support
outputs:
  - entity: family
    state: need-understood
exitConditions:
  - the care need is described well enough to say what clinician it requires
roles:
  primary: [family]
  supporting: [platform-operations]
authority: proposed
provenance: { source: author, references: [] }
lastReviewed: 2026-08-18
---

# Current model

This is understanding for matching, not clinical assessment. Assessment is a
care-delivery transformation the model has not modelled, and collapsing the two
would put clinical judgement before a care relationship exists. Whether this
step is a form, a conversation, or something staged across both is undecided.

Understood needs are also what supply planning aggregates: `state-supply-need`
begins from family demand being understood well enough to describe the care it
requires. That is a stage-level `informs` relationship, not a handoff — one
family's understood need does not itself state a supply requirement.

# Open questions

- Who speaks for the family here — parent, patient, caregiver — and how does
  that authority shift? This is the queued question
  `define-family-patient-caregiver-authority`.
- Where does understanding a need end and clinical assessment begin?
- What is too sensitive to ask before a care relationship exists?
