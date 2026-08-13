# System model

The model separates human navigation from semantic depth. A human sees a compact graph of stages and steps. Canonical files can progressively describe purpose, entry conditions, inputs, roles, rules, activity, outputs, exit conditions, and exceptions.

## Primitives

- **Stage:** a high-level operating domain.
- **Step:** a process element inside a Stage that may describe a state transformation.
- **Entity:** a stable reference to something transformed by the system.
- **Claim:** a reported belief, observation, inference, assumption, or hypothesis.
- **Metric:** a measure that matters, independently of whether data exists today.
- **Bet:** a proposed intervention linking a problem, claim, metric, and optional prototype.
- **Prototype:** working software that makes a Bet concrete without becoming production infrastructure.

Authority (`reference`, `proposed`, `validated`, or `policy`) keeps tentative ideas distinct from approved rules. The seed model is proposed and generalized.

`content/map.yaml` owns top-level topology. `next` references in Step files own the internal process sequence. Both are directed relationships rather than assumptions about a universal funnel.

## Navigation

Every primitive has a page, and every reference between primitives is traversable in both directions:

```text
/map → /stages/[id] → /steps/[id] → /bets/[id] → /prototypes/[id]
                          ↓
        /entities/[id]  /claims/[id]  /metrics/[id]
```

An Entity page shows which Steps produce and consume it, and in which states — the lifecycle the model actually claims, assembled from the Steps rather than declared separately. Claim and Metric pages show what they concern and which Bets rest on them.

Provenance is shown wherever it is recorded. Git records who changed a file; provenance records why we believe the content, which is what determines how much weight a reader should give it.
