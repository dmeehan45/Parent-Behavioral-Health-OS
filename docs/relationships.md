# References, edges, and the difference between them

This repository has four things that all look like "a connection between two
records", and conflating them is the easiest way to make a mess of the
projection. This is what each one is, why the third exists at all, and what we
deliberately do not build.

## The four things

**A primitive** is something the model asserts exists: a Stage, Step, Problem,
Bet, Claim, Metric, or Entity. It is a file in `content/`. Nouns.

**A reference** is a field in one primitive naming another one's ID.
`claim.targets: [matching]`. A person writes it, in one file, pointing one way.

**An edge** is the projection's derived record of a relationship: one entry in a
single flat list, carrying a `kind`, a direction, and the lenses it belongs to.
Nobody writes an edge. `lib/model/graph.ts` computes them from references.

**A block** is display content on a node — a label and some items, built for
reading. Strings and links.

## Why an edge exists at all

A reference is only visible from the file that holds it.

`content/claims/claim-first-caseload-retention.md` says
`targets: [clinician-onboarding, matching]`. The claim knows about those two
stages. Open `content/stages/matching.md` and there is nothing about the claim
in it — nor should there be, because a second statement of the same link is a
second thing to keep true.

So the question *"what claims are about Matching?"* has no answer in `content/`
without reading every claim. That is exactly the question the map asks when it
draws the evidence lens, and the question a stage page asks to list its claims.

**An edge is the inverse index of an authored reference, plus a type and a
visibility.** It carries no new information. It makes the same statement
answerable from the end that did not write it.

That is the whole idea. An edge is not a fifth primitive, it is not content, and
it is never authored — if you find yourself writing one down, the model has a
missing reference instead.

## Why it came up now

Rendering only ever needs the forward direction. A stage page listing its own
steps, a bet page naming its problem — those read a reference and print it.

`lib/model/open-ends.ts` asks the other kind of question:

- Does anything answer this problem?
- Is anything I rest on held at low confidence?
- Would any of these numbers settle an argument, if somebody collected them?

Every one of those is *"what points at me, and what state is it in"*. Forward
references cannot answer it, and blocks cannot either — a block is strings by
the time it exists. Edges are the only structure in the projection that can be
read from both ends, which is why the feature landed on them.

## Every relationship in the model

| Written in content | Direction | Edge | Drawn on |
| --- | --- | --- | --- |
| `map.yaml` `edges` | stage → stage | `flow` | every lens |
| `step.next` | step → step | `process` | flow |
| `step.exceptions.route` | step → step | `return` | flow |
| `step.stage` | step → stage | — (becomes `parentId`) | containment |
| `step.inputs` / `outputs` | step ↔ entity | `state` | entities |
| `problem.targets` | problem → stage/step | `problem` | bets |
| `bet.problem` | bet → problem | `bet` | bets |
| `bet.prototype.route` | bet → prototype | `prototype` | bets |
| `claim.targets` | claim → stage/step | `evidence` | evidence |
| `step.claims` | step → claim | `evidence` | evidence |
| `metric.targets` | metric → stage/step | `evidence` | evidence |
| `stage.metrics` / `step.metrics` | stage/step → metric | `evidence` | evidence |
| `problem.claims` / `problem.metrics` | problem → claim/metric | `evidence` | evidence |
| `bet.claims` / `bet.metrics` | bet → claim/metric | `evidence` | — (bets lens owns that spine) |
| `metric.perspectives.actor` | metric → entity | — block only | — |
| `metric.decisionOwner` | metric → entity | — block only | — |
| `bet.participant` | bet → entity | — block only | — |

`lib/model/conformance.ts` holds this table in a form the build checks. Every
row is either an edge the projection must derive or a deliberate block-only
decision with its reason, and a reference that is in neither fails
`npm run validate:projection`.

## A relationship counts once, from whichever end wrote it down

`claim.targets` says what a Claim is about. `step.claims` says what a Step rests
on. These are the same link seen from two sides, and a contributor has no reason
to prefer one — so the projection resolves both into the same edge.

Metrics already did this. Claims did not, and the result was two surfaces
disagreeing about the same content: `become-match-ready` listed
`claim-first-caseload-retention` in its frontmatter, so the step page showed the
claim in a block, while the evidence lens drew no line between them and the
step's open ends could not see that it was resting on a low-confidence
hypothesis. One line in `graph.ts` closed that.

The lesson generalises: **when both ends may legitimately author a link, resolve
both and deduplicate.** Do not make contributors learn which side of a
relationship the projection happens to read.

## What we deliberately do not edge

Three references stay as blocks: `metric.perspectives.actor`,
`metric.decisionOwner`, and `bet.participant`. All three name an **Entity**, and
the reasoning is the same for each — an edge would put entities on the evidence
or bets lens, which answer *what we believe* and *what we are trying*. Who is
involved is the entities lens's question, and it already answers it.

That is the test worth applying: not "is this relationship real" — they all are,
or they would not be in the file — but **which canvas would draw it, and is that
the question that canvas answers**.

An earlier draft of this document argued that `problem.claims` and `bet.claims`
should stay blocks too, because a Problem's evidence is reachable through the
Stages it bites. That was wrong, and the model is better for the correction:
`problem.claims` is the problem file saying *this is what my case rests on*,
while a claim that merely targets the same stage is a coincidence of location.
Treating those as the same thing was the error. Only the explicit reference
became an edge, which is the distinction the earlier reasoning missed.

## What an edge costs

Every edge is drawn somewhere, counted in a signal, and traversable by anything
that reads the graph later. Adding one to serve a single feature is how a
projection turns into a second, worse copy of the content. So the questions are:

1. Does some surface need to answer this from the end that did not write it?
2. Is that surface the right place for the answer, or is it one click away on a
   record that already has the edge?
3. Which lens would draw it, and does it belong on that picture?

A "no" to (3) does not always mean no edge. A Bet's claims and metrics are
edges that the bets lens deliberately does not draw — the projection is read for
more than the canvas, and open ends read it too.

## The simpler thing, when an edge is not it

Two alternatives that are usually better than a new edge kind:

- **Resolve an existing edge from both ends**, as claims now do. No new concept,
  no new line on any canvas, and it removes an inconsistency instead of adding a
  mechanism.
- **Link to the record that already has the edge.** A Problem page sending a
  reader to the Stage it bites is one click and no new structure, and the reader
  ends up somewhere with more context than a badge could have carried.

The first was right for `step.claims`, because two surfaces genuinely disagreed
about the same content. The second is right for the three Entity references,
which is why the table still has blanks in it.

## What the build now checks, and what it still cannot

`npm run validate:projection` walks every reference the content actually
authors — `lib/content/repository.ts` collects them while validating, since it
is the one place that already visits them all — and checks the projection
represents each one as its registry entry promises.

It catches the two failures that have happened here: a reference the projection
silently drops, and a reference nobody has classified. It reports the file and
the field, not just that something is wrong.

It cannot catch a field added to a schema that no content uses yet. That is a
real gap and an acceptable one: the check fires the moment somebody authors the
first reference, which is the moment it starts mattering.
