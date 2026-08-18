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
provenance: { source: accountable-reviewer-and-reviewed-public-research, references: ["Adversarial review decision D4, 2026-08-14"] }
researchTrace:
  - run: 2026-08-18-deepen-matching-quality
    decision: decide-2026-08-18-deepen-matching-quality-finding-match-quality-dimensions-stay-separate
    finding: finding-match-quality-dimensions-stay-separate
    stance: supports
    sources: [source-windle-treatment-preference-meta]
  - run: 2026-08-18-deepen-matching-quality
    decision: decide-2026-08-18-deepen-matching-quality-finding-treatment-preference-is-not-clinical-benefit
    finding: finding-treatment-preference-is-not-clinical-benefit
    stance: supports
    sources: [source-windle-treatment-preference-meta]
  - run: 2026-08-18-deepen-matching-quality
    decision: decide-2026-08-18-deepen-matching-quality-finding-racial-concordance-is-preference-not-general-success
    finding: finding-racial-concordance-is-preference-not-general-success
    stance: supports
    sources: [source-cabral-racial-concordance-meta]
lastReviewed: 2026-08-18
---

# Current model

The platform proposes a pairing; it does not declare the pairing accepted or clinically appropriate on behalf of either party. The proposal is a decision surface, not a claim that one composite match score has established compatibility.

Preference and predicted clinical benefit remain distinct. A preference signal, including racial or ethnic concordance when it matters to the person, can help shape which options are worth considering without being presented as evidence of superior clinical outcome by default. Patients and clinicians may need an understandable explanation of why a pairing appears relevant without needing the platform's internal confidence or ranking machinery exposed to them.

# Open questions

- Which family, clinician, access, coverage, and clinical constraints are required before a proposal?
- What information does each party need to decide, which information should not be exposed, and what explanation is useful without overstating certainty?
