---
id: matching
title: Matching
order: 4
summary: >
  Route care demand to plausible clinicians while keeping fit dimensions, uncertainty, and supply constraints distinguishable.
status: exploring
exitConditions:
  - an appropriate clinician and family have been proposed to each other
  - both sides have accepted the proposed match
authority: proposed
provenance:
  source: accountable-reviewer-and-reviewed-public-research
  references: []
researchTrace:
  - run: 2026-08-18-deepen-matching-quality
    decision: decide-2026-08-18-deepen-matching-quality-finding-match-quality-dimensions-stay-separate
    finding: finding-match-quality-dimensions-stay-separate
    stance: supports
    sources: [source-windle-treatment-preference-meta]
  - run: 2026-08-18-deepen-matching-quality
    decision: decide-2026-08-18-deepen-matching-quality-finding-contextual-performance-can-inform-pairing-not-rank
    finding: finding-contextual-performance-can-inform-pairing-not-rank
    stance: qualifies
    sources: [source-constantino-strength-matching-rct, source-predictive-selection-run]
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
  - run: 2026-08-18-deepen-matching-quality
    decision: decide-2026-08-18-deepen-matching-quality-finding-family-perspectives-must-remain-distinct
    finding: finding-family-perspectives-must-remain-distinct
    stance: supports
    sources: [source-roest-alliance-perspectives-meta, source-roest-alliance-outcome-meta]
  - run: 2026-08-18-deepen-matching-quality
    decision: decide-2026-08-18-deepen-matching-quality-finding-early-care-updates-association-not-binary-match
    finding: finding-early-care-updates-association-not-binary-match
    stance: contextualizes
    sources: [source-roest-alliance-perspectives-meta, source-roest-alliance-outcome-meta, source-predictive-selection-run]
  - run: 2026-08-18-deepen-matching-quality
    decision: decide-2026-08-18-deepen-matching-quality-finding-learning-needs-decision-time-label-context
    finding: finding-learning-needs-decision-time-label-context
    stance: contextualizes
    sources: [source-chang-disparate-censorship]
lastReviewed: 2026-08-18
---

# Current model

Matching routes care demand toward plausible clinicians under incomplete evidence. A proposed pairing is not a binary compatibility verdict, and match quality is not one outcome. Feasibility, preference and engagement, expected clinical benefit, access or burden, and continuity should remain distinguishable; acceptance, attendance, dropout, or retention may be observations without becoming universal definitions of a good match.

Clinician evidence is contextual rather than a leaderboard. Historical performance in a relevant problem domain can inform a particular pairing when the evidence is reliable, but it should not become a general clinician rank, and a cold-start clinician may have no usable longitudinal record. Patient preference remains a distinct input. Demographic concordance can be honored when it matters to the person without being treated as evidence of superior clinical outcome by default.

In child and family care, patient, parent or caregiver, and clinician perspectives can differ and should remain distinguishable. Active-care evidence can deepen dimension-specific associations between clinician strengths and future care demand without implying that the current relationship should automatically change. When downstream observations update future routing, the conditions that produced those observations must travel with them, including assignment and exposure, available alternatives, supply constraints, and missing follow-up.

# Open questions

- Which patient, caregiver, family, and clinician evidence is realistically available before matching, and which additional input changes a decision enough to justify collecting it?
- What recency, sample depth, outcome coverage, case-mix similarity, missingness, and attribution conditions make clinician evidence reliable enough to influence a specific future pairing?
- Which dimension-specific clinician-demand associations are useful enough to persist without collapsing into a global clinician score, patient fit score, or binary verdict?
- Which actor has authority over which matching inputs and decisions when the primary client, clinician, parent, caregiver, child, or other care-web participants differ?
- How should access, coverage, burden, current supply, clinical appropriateness, preference, and speed constrain or balance routing without hiding families who were declined, expired, never proposed, or rematched?
