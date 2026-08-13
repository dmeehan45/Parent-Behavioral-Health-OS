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
