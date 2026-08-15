# Research review: example-public-research

> Generated from handoff hash `c30fd2c910dc019c83e886f4b7f02c3f777b524b562b72f4d53923e7bdaf5171`. Derived from the handoff; do not edit by hand.

## Question

How should public research enter the generalized model?

## Synthesis

Public research should remain a proposal until a reviewer makes explicit decisions.

## Proposed changes and evidence

### finding-review-first

Unreviewed research should not change the canonical system map.

- Classification: **new** (advisory; no automatic merge or promotion)
- Evidence: **contextualizes**; quality **primary**
- Generalized applicability: **yes**
- Sources: `source-project-readme`
- Suggested targets: `clinician-onboarding`
- Existing Claim candidates: none
- Proposed Claim: `claim-review-first-research` — Research intake needs human review before it changes the generalized operating model.
- Uncertainty: none recorded

**Decision `decide-example-public-research-finding-review-first`**

Allowed response: accept | reject | defer | needs-research | accept-with-edits.

## Context notes

1 note(s). These change no claim and cannot be cited by `researchTrace`. Read them as a set and disposition them in one line; anything here that needs its own judgement should have been proposed as a finding.

- **note-projection-is-derived** — The application renders a projection of content/, so a model change needs no application change.
  Anchored to: `clinician-onboarding`. Sources: `source-project-readme`.

## Open questions

- **question-review-owner:** Who is the accountable reviewer for a given intake pull request?

## Sources

- **source-project-readme** (available, repository): Parent Behavioral Health OS README; publication date not recorded; identity `github-parent-health-os-readme`.

## Recording decisions

Copy this into `research/decisions/example-public-research.yaml`, replace every `TODO`, and run `npm run validate:research`.

```yaml
contractVersion: 1
runId: example-public-research
reviewedHandoffHash: c30fd2c910dc019c83e886f4b7f02c3f777b524b562b72f4d53923e7bdaf5171
reviewer: TODO who is accountable for this decision
decidedAt: TODO today, as YYYY-MM-DD
decidedVia: review   # or 'conversation', if the reviewer decided in the chat
decisions:
  - id: decide-example-public-research-finding-review-first
    disposition: TODO accept | reject | defer | needs-research | accept-with-edits
    # rationale: required for reject, defer, and needs-research
    # editedRecommendation: required for accept-with-edits
notes:
  disposition: TODO noted | discard   # all 1 of them, in one line
  # except: [note-id]   # the few going the other way
```

## Canonical change gate

No canonical change is authorized by this packet. Create a decision file, validate it, and apply accepted decisions in a separate model-change pull request referencing the run and decision IDs.
