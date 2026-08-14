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
| `step.stage` | step → stage | — (becomes `parentId`) | containment |
| `step.inputs` / `outputs` | step ↔ entity | `state` | entities |
| `problem.targets` | problem → stage/step | `problem` | bets |
| `bet.problem` | bet → problem | `bet` | bets |
| `bet.prototype.route` | bet → prototype | `prototype` | bets |
| `claim.targets` | claim → stage/step | `evidence` | evidence |
| `step.claims` | step → claim | `evidence` | evidence |
| `metric.targets` | metric → stage/step | `evidence` | evidence |
| `stage.metrics` / `step.metrics` | stage/step → metric | `evidence` | evidence |
| `problem.claims` / `problem.metrics` | problem → claim/metric | — block only | — |
| `bet.claims` / `bet.metrics` | bet → claim/metric | — block only | — |

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

`problem.claims`, `problem.metrics`, `bet.claims` and `bet.metrics` stay as
blocks. Three reasons, and they are worth keeping:

**The question is already answered one hop away.** A Problem names the Stages
and Steps it bites, and those already carry edges to their claims and metrics.
"Is the evidence under this problem shaky?" is a question the Stage page answers
with the edges that exist. Adding a second path to the same answer buys nothing
and doubles what has to stay consistent.

**It would mix two questions on one canvas.** The bets lens answers *where does
this break and what are we doing about it*. Problem → Claim lines would put the
evidence question on the same picture, and the reason there are four lenses is
that one canvas showing everything shows nothing.

**An edge is a commitment.** Every edge is drawn somewhere, counted in a signal,
and traversable by anything that reads the graph later. Adding one to serve a
single feature is how a projection turns into a second, worse copy of the
content.

So the honest answer to "should this be an edge" is usually **no**. Ask instead:

1. Does some surface need to answer this from the end that did not write it?
2. Is that surface the right place for the answer, or is it one click away on a
   record that already has the edge?
3. Which lens would draw it, and does it belong on that picture?

An edge earns its place when the answer to (1) is yes and to (2) is "here" — and
when (3) has a real answer rather than a shrug.

## The simpler thing, when an edge is not it

Two alternatives that are usually better than a new edge kind:

- **Resolve an existing edge from both ends**, as claims now do. No new concept,
  no new line on any canvas, and it removes an inconsistency instead of adding a
  mechanism.
- **Link to the record that already has the edge.** A Problem page sending a
  reader to the Stage it bites is one click and no new structure, and the reader
  ends up somewhere with more context than a badge could have carried.

Both were available here. The first was right for claims because two surfaces
genuinely disagreed. The second is right for problems, and that is why the table
above still has blanks in it.
