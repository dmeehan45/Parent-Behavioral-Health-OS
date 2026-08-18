---
id: become-ready-to-match
title: Become Ready to Match
stage: family-demand
order: 3
next:
  - propose-match
purpose: >
  Establish that a family can genuinely consider and begin care when a match is
  proposed.
entryConditions:
  - the care need is understood
inputs:
  - entity: family
    state: need-understood
outputs:
  - entity: family
    state: match-ready
exitConditions:
  - a family can participate in matching
roles:
  primary: [family]
  supporting: [platform-operations]
metrics:
  - time-to-first-match
authority: proposed
provenance: { source: author, references: [] }
lastReviewed: 2026-08-18
---

# Current model

The family-side mirror of `become-match-ready`: a threshold into matching, not
a score. A described need alone does not make a family ready — practical
conditions like coverage, schedule, and expectations about care all bear on
whether a proposed match can actually be considered. Which of them should gate
matching, and which are better resolved during it, is undecided, so this step
deliberately does not list requirements.

# Open questions

- Which practical conditions should gate matching, and which belong inside it?
- Does readiness decay — is a family that was ready a month ago still ready?
- Is readiness self-declared by the family, or established by the platform, and
  what does each choice cost?
