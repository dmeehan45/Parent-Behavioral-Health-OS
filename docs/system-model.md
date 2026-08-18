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

## Boundary: the productizable care-delivery system

This artifact models the whole care-delivery operating system that a practice-management platform could productize. Its intended outcomes include care quality, access and affordability or coverage, measurement and learning, personalization, participant experience, and a viable platform business. No one outcome silently outranks the others; Metrics name whose interest they represent so trade-offs stay visible.

The model includes care work, participant decisions, and surrounding platform operations when they are necessary to explain or prototype a product behavior. Non-prototypeable organizational changes and other company actions may be named as context or an open dependency, but they are not Bets. This is wider than an EHR and narrower than a complete company operating model.

The `Practice Management Platform` Entity is the accountable builder/operator actor. It is not a substitute for the clinician, family, patient, or configured Practice, and platform efficiency is not evidence of a good care outcome.

Authority (`reference`, `proposed`, `validated`, or `policy`) keeps tentative ideas distinct from approved rules. The seed model is proposed and generalized.

`content/map.yaml` owns top-level topology. `next` references in Step files own the internal process sequence. Both are directed relationships rather than assumptions about a universal funnel.

### Topology and flow layers

A relationship between two Stages does not automatically mean one Stage happens after the other. The relationship vocabulary carries several jobs and the projection keeps them separate:

- `flows_to`, `supplies`, and `enables` describe **forward operating progression**. These edges determine left-to-right stage rank.
- `returns_to` describes **operating rework or return**. It loops back through the operating layer and does not participate in forward ranking.
- `informs`, `influences`, `depends_on`, and `constrains` describe **data or contextual coupling**. They stay visible but do not push the target into a later rank.
- `feedback_to` describes **learning feedback**. It is drawn as feedback and never participates in forward ranking.

That distinction is what allows parallel parts of the system to stay parallel and keeps rematching from being mislabeled as learning. Family Demand may inform Clinician Supply while both ultimately converge on Matching; the informational link remains real without turning Demand into a prerequisite stage for Supply. Care can return to Matching without claiming that the return itself is a learning signal.

The Operating flow lens can toggle **Operating flow**, **Data & state**, **Experience**, and **Learning** independently. Toggling changes which relationships are painted, never node position. A shared URL preserves the active layers so two readers can inspect the same slice of the system.

Stage arrows are only headlines. When a `next` transition crosses a Stage boundary and the producing and consuming Steps agree on an Entity state, the map derives that state transfer and shows it on the Stage handoff. For example, if one Step outputs a Clinician in `match-ready` and the next Step consumes that same state across the Onboarding → Matching boundary, the map can say so without repeating the handoff in `map.yaml`.

The same projection attaches canonical Problems that target both sides of a boundary and marks missing boundary detail as a gap rather than inventing it. The Experience layer is deliberately allowed to be empty. Participant experience should become visible when the model has an explicit way to say what is carried across a boundary; the projection must not infer an experience handoff merely because two Stages are adjacent.

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
within it. Stage connections can also be opened in place to inspect what the
projection knows crosses the boundary, which canonical Problems span it, and
which layers are still unmodelled. The pages remain the shareable, linkable form
of the primitive projection.

An Entity shows which Steps produce and consume it, and in which states — the
lifecycle the model actually claims, assembled from the Steps rather than
declared separately — alongside any states it declares. Claims and Metrics show
what they concern and which Bets rest on them.

### Lenses

The same graph is shown four ways, so the map can hold more context than a single
diagram could without becoming unreadable:

- **Operating flow** — stages ranked by forward operating progression, with contextual, return, and learning relationships overlaid; each Stage can expand in place to reveal its Steps in `next` order.
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
