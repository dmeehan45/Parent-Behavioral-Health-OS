# Widening the intake: how a lot of context gets in without burying anyone

> **Status: all six landed; two pieces of content work remain.** Each change is
> marked below. What is deliberately *not* done is the judgement half of two of
> them: converting the deep dive's eight candidate Problems (change 4), and
> deciding which clock `time-to-first-session` runs (change 6). Both are a
> person's sentences, and the infrastructure now exists to receive them.
>
> Kept for the reasoning, the way [`context-flow-plan.md`](context-flow-plan.md)
> is. Three things were learned building it that the plan did not predict, and
> each is recorded with its change: the handoff hash was sensitive to the
> schema's own growth, two copies of that hash recipe had already drifted, and
> the rule that a candidate carries no title was enforced only by accident.

## The workflow this is for

This repository is the persistent record of brainstorming and research that
happens in conversation — ChatGPT, Claude, anything wired to it — pushed in
through a connector, projected onto the map, and read back when thinking about
bets and prototypes. The conversational agent is the main door and stays the
main door. The person's learning is part of the loop, not a byproduct of it:
the system exists so that a large and growing context set stays navigable while
one person reasons about where to place bets.

[`system-state.md`](system-state.md) found the imbalance: six mechanisms keep
bad context out, and nothing helps good context arrive. A lot of context is
coming. The infrastructure has to carry volume without either burying the
reviewer or letting the context base bloat into something nobody can read.

## What the first real run proved

`2026-08-14-what-makes-clinician-onboarding-high-quality` — the first research
run about care delivery rather than about the intake contract itself — is the
evidence this plan is built on. What happened:

- **The loop works.** Five findings from ten sources entered as one handoff,
  a named person decided all five (three `accept-with-edits`), and five
  canonical records now carry a `researchTrace`. The gates all held, and the
  queue derived the question's `Answered` state without anyone editing it.
- **It cost four pull requests** — handoff (#49), source-quality guidance
  (#50), decisions (#51), apply (#52) — plus a fifth (#53) for workflow docs.
  One question, five PRs.
- **The decision was made in conversation.** The person decided in chat and
  the agent recorded the decision file naming them. That lane worked, holds
  every guarantee validation actually checks — hash, named reviewer,
  supersession — and is described nowhere. It happened ahead of the documents.
- **The run grew the documentation surface it ran on.** Two new craft
  documents landed, on top of four that already describe contribution, making
  the drift found in the planning-file audit structurally certain to recur.
- **Two kinds of output had no home.** The run's raised questions landed in
  the gap list (good). Its *reflection* — what the session changed, narrowed,
  ruled out — has no durable form, and
  [`conversational-research.md`](conversational-research.md) says so
  explicitly: *"if repeated use shows that a durable learning-state artifact
  is necessary, add it deliberately."* Repeated use has now shown it. And the
  45 KB of ranked candidate Problems in the
  [readiness/matching deep dive](adversarial-deep-dive-readiness-matching-2026-08-14.md)
  still cannot reach any surface that orders or decides things.

## What does not change

The invariants, so nothing below reads as loosening them:

- `content/` is canonical; the application is a projection of it.
- **An agent cannot change what the model claims.** Every path to `content/`
  runs through a decision file naming a person, over the current handoff hash,
  enforced at validation and inside `projectModel()`. Nothing in this plan
  touches that gate — it changes what flows *up to* the gate and how cheaply
  the person can operate it.
- Composition never generates. Anything derivable is composed; judgement is
  left blank, and the interface teaches what the blank means.
- `research/` never moves the map's revision. Staging churn stays off the map.
- No database, no server-side writes, no dashboard, no importer, no second
  review surface, no agent framework.

## The changes

Sequenced by what each unblocks. Change 2 is documentation-only and should land
first; change 1 stops a compounding cost; 3 and 4 share schema work and land in
that order; 5 reads the states 2–4 create; 6 is independent.

### 1. One statement, one home

*Landed.*

**Change.** Give every contributor-facing document exactly one job, and make
duplicated contract statements links instead of copies:

| File | Its one job |
| --- | --- |
| `README.md` | Positioning, the premise, how to run and read the map |
| `AGENTS.md` | **The contract** — the rules and their reasoning, for human and AI contributors alike. The only home of the loop diagram, the check list, and the section tables |
| `CONTRIBUTING.md` | Process mechanics: the three kinds of contribution, branching, PR shape. Links to the contract, restates none of it |
| `docs/authoring.md` | How to write each primitive |
| `docs/research-workflow.md` | Intake mechanics — one run, and the schedule. **Absorbed `research-routine.md`**, which is the same workflow at a cadence |
| `docs/research-practice.md` | The craft — **merged `conversational-research.md` and `research-source-quality.md`**: how to research with a person, and how to judge evidence |
| `docs/prototype-workflow.md` | One Bet becoming a prototype |

Add the rule itself to `AGENTS.md`, because it is the only thing that stops the
next drift: **a contract statement lives in exactly one file; everywhere else
links to it.** The planning-file audit found three statements that had drifted
across four files; each was fixed by editing every copy, which is the fix that
does not last. It carries a second clause worth keeping: adding a document is a
real decision, and a section in the file that already owns the topic is usually
the right answer.

**What it unlocks.** Each future run stops growing the documentation surface —
the first real run added two files; under this shape it would have added
sections to one. A conversational agent orienting itself reads three documents
(contract, mechanics, craft) instead of six with overlaps it cannot rank.

**Deliberately not done.** No mechanical drift-checker greping for duplicated
prose — a lint that judges documentation is machinery this plan exists to
avoid. The rule is cultural, stated once, in the contract.

### 2. Name the conversational review lane

*Landed.*

**Change.** Document what the first run already did, as the intended cheap
lane rather than an improvisation. In `research-workflow.md`:

- **The decision file is the gate, not the page that produced it.** A person
  may decide at `/review`, which composes the file — or in the conversation
  itself, in which case the agent records the decision file naming them, over
  the handoff hash CI printed on the intake pull request. Validation holds
  either way, because everything that matters — hash currency, named reviewer,
  supersession — is checked in the file, not the surface.
- **Decision and apply may share one pull request.** The decision authorizes;
  the apply cites it; validation checks the trace against the decision in the
  same tree, so they are consistent or the PR is red. The handoff stays its
  own PR — staging enters before anyone decides about it, which is what makes
  the decision auditable.
- Add one optional field to the decision file: `decidedVia: conversation |
  review`. Not a gate — provenance of the deciding surface, so a future audit
  of the lane can ask how each decision was actually made.

**What it unlocks.** A run drops from four pull requests to two: intake, then
decision-plus-apply. The person's part of a review becomes what it was in the
first run — reading findings in a conversation they are already in, saying
which to accept and how to narrow them — with the ceremony carried by the
agent and checked by CI.

**Deliberately not done.** No auto-accept, no default reviewer, no decision
composed without a person's stated disposition per finding. `/review` is
untouched and stays the right surface when the reviewer was not in the
conversation — its whole point is deciding *without* the researcher's framing
in your ear, and this lane is explicitly the trade in the other direction.

### 3. Notes: a cheaper unit than a finding

*Landed.* One thing had to be fixed on the way, and it is worth knowing about:
adding a single optional field re-hashed every handoff ever written, because the
hash was taken over the parsed object and a `[]` default is not nothing. A
decision a person had made weeks earlier stopped authorizing anything. Absent
and empty values are now normalized away before hashing, which restores every
existing hash exactly and makes all future optional fields safe — with one
invariant left behind: **add fields, never reorder them.**

**Change.** The handoff contract gains an optional `notes` list alongside
`findings`. A note is atomic context that changes no claim: a source that
exists, a standard definition, a competitor behaviour, a regulation's shape,
background a future run will want. Each note carries a statement, its sources,
and **at least one anchor** — an existing canonical record or queued question
it is context *for*. An unanchored note is a validation error, and that rule is
the bloat defence: context that is not context for anything does not enter.

Review is per-batch, not per-item: the decision file dispositions the note set
in one line (`noted`, or `discard` with named exceptions). Notes cannot be
cited by `researchTrace`, cannot raise a claim's confidence, and never appear
on the map. They surface where anchored context is safe and useful — the
record page's **Research about this** block, via `lib/research/glance.ts`, and
the research brief for the next run on that territory.

**What it unlocks.** The high-volume kind of context — document sets,
literature sweeps, competitor scans, the material a brainstorming session
throws off — enters at the cost of reading rather than the cost of judging.
The reviewer's per-item attention is reserved for findings, which are the only
things that can change belief. And because notes anchor to records, the next
run's brief carries them: context accumulates *where it lands* instead of in a
pile.

**Deliberately not done.** No per-note decisions — the moment a note needs
individual judgement it is a finding, and the agent should propose it as one.
No note-to-claim promotion path: a note that turns out to bear on belief
re-enters as a finding in a later run, through the full gate.

### 4. Reflection runs: large structured thinking enters as structure

*Landed*, except the deep-dive migration itself, which is content work rather
than infrastructure and wants a person's eye on each of the eight. One thing
was learned building it: Zod strips unknown keys, so the rule that a candidate
carries no title was enforced by accident — a `title:` parsed cleanly and was
silently discarded, leaving the author believing they had named it. The
candidate schema is strict now, so writing one is an error that says so.

**Change.** A handoff may declare `run.kind: reflection` (default:
`research`). A reflection is the conversational agent's structured thinking
*about* the model or about prior runs — the learning checkpoint's durable
form, when a session produced something worth keeping. It differs from a
research run in two ways:

- Its sources may be internal: prior runs (`reflectsOn: <run-id>`), repository
  documents, a prototype session — the `repository` source kind already
  exists for this.
- Alongside findings and notes it may carry **`candidates`**: structured
  proposals for what should exist in the model. A candidate names its `kind`
  (`problem` or `question`), the `targets` it would bite, the claims or
  findings it rests on, and a description of the trouble — **never a finished
  title.** Naming stays the person's sentence: accepting a candidate problem
  hands the person the same compose-a-Problem skeleton `/review/apply`
  already offers, with targets, claims, and trace carried, and the title and
  body empty. A candidate question, accepted, becomes the composed
  `research/questions/<id>.yaml` the review surface already knows how to hand
  back.

`/review` orders candidates with everything else it orders. The existing
machinery — packet, decision, supersession — applies unchanged, because a
reflection is a handoff and never anything more.

**The first reflection is a migration.** Convert the readiness/matching deep
dive's candidate-Problem portfolio — eight ranked framings with falsification
prompts, currently invisible to every surface — into a reflection handoff
whose candidates carry that structure. The conversion copies structure that a
person already wrote; it invents nothing. Deciding those eight, at whatever
pace, is then ordinary review work instead of 45 KB of Markdown nobody's
tooling can see.

**What it unlocks.** The two homeless outputs of the first run get homes: a
session's reflection persists as staging a person decides about, and large
structured thinking — a deep dive, a portfolio of candidate problems, an
agent's synthesis across five runs — enters as records the queue can order,
instead of as documents that drift.

**Deliberately not done.** No auto-conversion of reflections into Problems or
questions — a candidate is an invitation with references carried, exactly as
`/review/apply`'s Problem skeleton is today. No requirement that every
learning checkpoint produce a reflection: most checkpoints change the person,
not the repository, and `conversational-research.md`'s "keep it lightweight"
rule stands.

### 5. The gap finder learns saturation

*Landed.*

**Change.** `findGaps` currently measures thinness — `unmeasured`,
`unevidenced`, `unproven`, `unsupplied`, `thin`, `raised`. It cannot see the
opposite failure: context arriving faster than it becomes model. Add gap
kinds that read the research view alongside the projection:

| Kind | What it says |
| --- | --- |
| `undecided` | Findings awaiting a decision, per question — the review debt `research:queue` already prints, made a first-class gap |
| `unapplied` | Accepted findings cited by no `researchTrace` — authorized change that never happened. `findingState()` already distinguishes this; nothing surfaces it as work |
| `unconverted` | Accepted candidates (change 4) with no composed Problem or question |
| `saturated` | A record whose anchored notes and findings have accumulated past a threshold with no canonical change since — the signal that context is piling up where a Claim or a Step should be written |

`research:queue` prints them; the record page's research block carries the
counts it already nearly has. **Not on the map** — research stays off the
projection for the reasons `AGENTS.md` already records, and saturation is a
per-request reading-surface fact like everything else research.

**What it unlocks.** The queue stops being only a to-do list of thinness and
becomes a balance sheet: where the model is thin, and where the intake is
ahead of the model. "Forty sources bear on this and no Claim exists" becomes
a derivable sentence, which is the anti-bloat instrument — bloat is exactly
saturation nobody can see.

**Deliberately not done.** No automatic compaction, expiry, or archiving of
staged research — supersession is the retirement mechanism, a person operates
it, and Git is the archive. No saturation-driven automation of any kind: the
gap invites a person to write the Claim, it does not write one.

### 6. Metrics get a measurement contract

*Landed, except the content decision.* The fields exist, coverage counts them,
and a Metric claiming `available` data without a `startEvent` and `endEvent` is
now refused. **`time-to-first-session` is deliberately untouched:** which clock
it runs is the accountable decision the deep dive queued and the evidence audit
put first, and filling those two fields while nobody was looking is exactly the
move this repository asks nobody to make. The field is now there to record the
decision in.

**Change.** The Metric schema gains the optional structured fields its own
definitions keep needing and putting in prose: `startEvent`, `endEvent`,
`denominator`, `horizon`, `missingness`, `confounders`, `balancingSignals`,
`permittedUse`. Conformance rows classify each (block-only — a metric's
measurement contract is read on the metric, not drawn as edges), coverage
counts them, and the evidence-quality guardrails extend naturally: a Metric
with `dataStatus: available` and no `startEvent`/`endEvent` is claiming a
number nobody could compute.

The first content to use the fields is the fix the audits keep naming: a
person decides which clock `time-to-first-session` runs, and the decision
lands in `startEvent`/`endEvent` instead of in a sentence that can contradict
its own `decision` field again.

**What it unlocks.** Measurement research — the evidence audit's entire
"analysis-ready" agenda, and edited recommendations like the first run's
burden-versus-speed ruling — lands in fields the projection can read, the
packet can print, and validation can cross-check, instead of in prose. This
is the `AGENTS.md` rule applied to itself: the literal in the prose means the
model is missing a field.

**Deliberately not done.** No required fields — a Metric that does not know
its denominator says so by omission, honestly. No composite scores, no
computed metrics, no data.

## The run after these land

A person and the conversational agent spend a morning on
`define-matching-quality`. The agent orients from three documents instead of
six, researches, and the conversation throws off both kinds of material: four
findings that would change what the model claims, and a dozen notes — match
quality frameworks, two competitor behaviours, a regulation — each anchored to
the records it is context for. One PR stages the handoff; CI prints the
packet and the hash.

The person reads the findings in the conversation they are already in,
accepts two, narrows one, rejects one. The agent records the decision file
naming them and composes the apply — Claims chosen by the person, trace
carried — in a second PR. Two PRs, one morning, and every gate held.

At the checkpoint the session turns out to have reshaped how the person
thinks about constrained supply, so the agent writes a reflection: three
candidate problems, structured, targets named, titles absent. They enter the
queue. A week later the person composes one into a canonical Problem in ten
minutes, because everything except its name arrived carried.

Meanwhile `research:queue` shows `matching` saturating — nine notes, two
accepted findings, no new Claim — which is the queue telling the person where
next morning's writing, not researching, should happen.

At no point did an agent change what the model claims. At no point did the
person re-assemble context a machine already held. And the reviewer's
judgement was spent only where judgement was the thing required.

## What is deliberately not built — permanently, as far as this plan is concerned

An importer or bulk-ingest pipeline; a dashboard; auto-promotion of anything;
a second review surface; per-note decisions; generated titles, Problems, or
Bets; saturation-driven automation; a learning-state database; retention
policies a person does not operate. Each would either replace a judgement this
repository deliberately keeps human, or add a surface whose upkeep competes
with the model it exists to serve.
