---
id: select-clinician
title: Evaluate & Select
stage: clinician-supply
order: 5
next:
  - selection-complete
purpose: >
  Apply consequential clinical and network judgment to decide whether a qualified candidate should advance, using the accumulated evidence record rather than reconstructing it.
entryConditions:
  - a candidate has passed screening with an explicit evidence record and unresolved uncertainty
inputs:
  - entity: clinician
    state: qualified
outputs:
  - entity: clinician
    state: selected
exitConditions:
  - a selection decision has been made and the clinician can enter onboarding
roles:
  primary: [network-selection]
  supporting: [candidate-qualification, clinician]
claims:
  - claim-selection-predicts-quality
metrics:
  - selection-accuracy
  - operating-effort-per-activation
authority: proposed
provenance: { source: author, references: [] }
lastReviewed: 2026-08-18
---

# Current model

This is the most consequential judgment in clinician supply. The functional role here is network selection: interpret the evidence that survived qualification, resolve ambiguity that changes the decision, and decide whether the clinician should move toward contracting and onboarding.

`network-selection` is not assumed to be a separate department. A small network may have the same person perform qualification and selection; a scaled network may separate them so high-volume evidence work does not consume the capacity needed for harder decisions. The important boundary is that the selection owner receives a legible record of what is known, how it was learned, what remains uncertain, and which evidence was generated through human interaction.

Network need may matter to the decision. Coverage gaps, population demand, geography, and caseload needs can change whether a qualified clinician is useful to contract now, but those conditions should not be allowed to masquerade as evidence that the clinician is clinically better.

# Open questions

- Which selection judgments actually predict later quality, and which are habits?
- Which ambiguities materially change the decision enough to justify senior or specialist human time?
- What evidence and rationale must persist so the decision can be understood, challenged, and learned from later?
- How should network need influence contracting decisions without contaminating the clinician-quality profile?
