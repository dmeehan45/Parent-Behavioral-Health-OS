---
id: seek-care
title: Seek Care
stage: family-demand
order: 1
next:
  - understand-care-need
purpose: >
  A family recognizes a behavioral-health need and reaches the practice.
outputs:
  - entity: family
    state: seeking-support
exitConditions:
  - a family has made contact and wants to explore care
roles:
  primary: [family]
  supporting: [platform-operations]
authority: proposed
provenance: { source: author, references: [] }
lastReviewed: 2026-08-18
---

# Current model

This step marks arrival, not acquisition. How families find the practice —
channels, referral paths, what makes them choose it over waiting — is demand
creation, and the model does not describe it yet. What the step asserts is
smaller: a family exists, has recognized a need, and has made contact.

# Open questions

- How do families actually find and choose a parent-focused practice, and who
  refers them?
- What makes arriving demand "appropriate" in the sense the stage's summary
  uses — clinically, geographically, financially?
- Which arrivals are urgent enough that the ordinary path is the wrong one?
