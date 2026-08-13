## What changed

<!-- Software change, model change, or both. -->

- [ ] Model (`content/`) — our understanding of the operating system changed
- [ ] Application (`app/`, `components/`, `lib/`) — how the model is projected changed
- [ ] Prototype (`app/prototypes/`) — a bet became executable
- [ ] Documentation (`docs/`, `README.md`)

## Summary

<!-- One or two sentences. -->

## If this changes the model

**Affected primitives**

<!-- Stage / Step / Entity / Claim / Metric / Bet IDs touched or added. -->

**What we now believe that we did not before**

<!-- The point of this repository is that Git records the evolution of our
     understanding, not just of the code. Say what shifted. -->

**Evidence or reasoning**

<!-- Where this came from: author reasoning, public research, interview,
     observation, data, experiment. Reflect it in the `provenance` field. -->

**Authority**

<!-- reference / proposed / validated / policy — and why this level is right.
     Default to `proposed` for anything not yet established. -->

## Checks

- [ ] Based on `main` — or stacked deliberately, labelled `stacked`, and the merge order stated above
- [ ] `npm run validate:content` passes
- [ ] `npm run lint` and `npm run typecheck` pass
- [ ] No PHI, real patient data, real clinician data, or company-confidential material
- [ ] Prototypes use synthetic data only
