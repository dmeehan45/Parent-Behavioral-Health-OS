# System model

The model separates human navigation from semantic depth. A human sees a compact graph of stages and steps. Canonical files can progressively describe purpose, entry conditions, inputs, roles, rules, activity, outputs, exit conditions, and exceptions.

## Primitives

- **Stage:** a high-level operating domain.
- **Step:** a process element inside a Stage that may describe a state transformation.
- **Entity:** a stable reference to something transformed by the system.
- **Claim:** a reported belief, observation, inference, assumption, or hypothesis.
- **Metric:** a measure that matters, independently of whether data exists today.
- **Problem:** somewhere the machine is thought to break, and what that costs.
- **Bet:** a proposed answer to one Problem, with an optional prototype.
- **Prototype:** working software that makes a Bet concrete without becoming production infrastructure.

Authority (`reference`, `proposed`, `validated`, or `policy`) keeps tentative ideas distinct from approved rules. The seed model is proposed and generalized.

`content/map.yaml` owns top-level topology. `next` references in Step files own the internal process sequence. Both are directed relationships rather than assumptions about a universal funnel.

## Problem space is modelled, not implied

A map of stages says how the machine is meant to run. It does not say where the
machine is failing, and a Bet attached straight to a Stage does not say it
either — it only records that somebody wanted to build something there.

So the chain is explicit:

```text
Stage or Step → Problem → Bet → Prototype
```

A **Problem** declares `targets`: the Stages and Steps where it bites. That link
is required, because a problem that bites nowhere is not a problem with this
system. A **Bet** declares `problem`: the one Problem it proposes to answer.
That link is also required, and it is the only one — where a Bet lands in the
machine is derived from its Problem rather than restated, so the two can never
disagree.

Three things follow from this that the old shape could not express:

- A Stage can show what it has to answer for, including problems nobody has
  proposed anything about yet. A Problem with no Bet under it is the most useful
  thing on the map.
- A Problem can hold several competing Bets, and they can be compared as answers
  to the same question rather than as unrelated proposals.
- Naming a problem is a complete contribution. It needs `id`, `title`, and
  `targets`, and nothing else — no proposed solution, no evidence.

## How the model is projected

`lib/model/graph.ts` turns the primitives above into one typed graph — nodes,
edges, derived signals, detail blocks, and coverage — which every surface
renders. Nothing downstream reads `content/` directly, so a new kind of content
cannot end up with a page that quietly omits half of it.

### Navigation

Every primitive has a page, and every reference between primitives is traversable
in both directions:

```text
/map → /stages/[id] → /steps/[id] → /problems/[id] → /bets/[id] → /prototypes/[id]
                          ↓
        /entities/[id]  /claims/[id]  /metrics/[id]
```

On the map the same traversal happens without leaving the canvas: selecting a
primitive opens it in a panel, and following a link inside that panel moves
within it. The pages remain the shareable, linkable form of the same projection.

An Entity shows which Steps produce and consume it, and in which states — the
lifecycle the model actually claims, assembled from the Steps rather than
declared separately — alongside any states it declares. Claims and Metrics show
what they concern and which Bets rest on them.

### Lenses

The same graph is shown four ways, so the map can hold more context than a single
diagram could without becoming unreadable:

- **Operating flow** — stages ranked by topology, each expandable in place to reveal its steps in `next` order.
- **Problems & solutions** — the stage spine, then the problems pinned to it, then the bets proposed against those problems, then whatever has been built. It reads downward as the argument runs.
- **Evidence** — the stage spine with claims and metrics beneath what they describe.
- **Entities** — entities as the nouns of the system, with the steps that transform them.

A primitive appears in a lens only where it carries meaning, which is derived
from its own references rather than declared.

### Coverage

Because the schemas are permissive, a primitive with two fields and one with
twelve look identical in a plain graph. Coverage counts how many of a primitive's
modelable fields are populated and names the ones that are not. It exists so that
gaps in the thinking are navigable — a reader can see where the model is thin,
and a contributor can see where to aim. It is not a completeness target, and
filling fields with filler to raise it defeats its purpose.

### Authority and provenance, in view

Authority is not buried in a detail page. Because it is the guardrail that
separates a proposal from an approved rule, it is shown on the face of every
primitive, alongside confidence and status, and explained in the map legend.

Everything else about how we came to believe something — `provenance.source`,
`provenance.references`, `lastReviewed`, coverage, and the file it was projected
from — is gathered into a single block *after* the content, on both the page and
the panel. It all matters, and none of it is what the reader came for. Reading
order is the same everywhere: what this is, what it says, then where it came
from.

Git records who changed a file; provenance records why we believe the content,
which is what determines how much weight a reader should give it.
