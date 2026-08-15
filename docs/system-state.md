# The system as it stands

**Written:** 2026-08-14, against `main` at this revision.

Every other document here describes a contract, a workflow, or a decision made
on one day. None of them says what the whole thing currently *is* — what has
been built, what has actually been used, and where the shape is wrong for what
it is being asked to do. This is that document. It is a status report, not a
contract: when it disagrees with `AGENTS.md`, `AGENTS.md` wins.

---

## 1. What this is

An executable model of how a parent-focused behavioural-health practice works as
a business and a care system, plus a learning loop for changing that model when
evidence arrives.

Two halves, and they are unequal:

- **The model.** 49 Markdown files under `content/`, projected into a live graph.
  This is the artifact. It is the thing that is meant to get better.
- **The machinery.** ~11,000 lines of TypeScript that project the model, refuse
  bad changes to it, compose context out of it, and gate what may enter it.

The governing rule is stated in `AGENTS.md` and holds throughout: **context
flows by derivation; belief changes by human authorship.** Anything a machine
can compute is composed. Anything requiring judgement is left blank, and the
interface teaches what the blank means at the moment somebody fills it.

## 2. What it does

Four moving parts.

**A projection.** `projectModel()` turns `content/` into one typed graph — nodes,
edges, derived signals, detail blocks, coverage, per-node content hashes — and
every surface renders that and nothing else. Node positions are derived from
topology, so the same revision draws the same picture. Adding any primitive
requires no code change. `/map` polls a fingerprint of `content/` and redraws
within seconds of a change landing anywhere.

**A set of refusals.** The checks are the load-bearing part, and each one exists
because something specific went wrong:

| Check | What it refuses |
| --- | --- |
| `validate:content` | schema and cross-reference errors; unrenderable headings; evidence labels stronger than the record's own provenance |
| `validate:projection` | a reference field nobody classified as an edge or a deliberate block |
| `checkFlowContinuity` | a state one Step consumes that no `next` path reaches |
| `checkResearchTrace` | a citation not backed by an accepted, unsuperseded decision — enforced in validation *and* in the live projection |
| prototype conformance | `status: working` on a prototype whose experiment has been refined since anybody checked |
| `lint:design` | a literal colour, or a custom property nothing defines |

**Two composers.** `research:brief` prints what earlier runs established about a
question. `prototype:brief` prints everything needed to build one Bet — the
experiment, the problem, the flow it lands on, the evidence and where it is
weak, the honest unknowns, the build contract — and **refuses** when the
experiment has not been shaped. That refusal is the highest-leverage thing in
the repository: it is what stops a builder inventing the decision a prototype is
supposed to test.

**One human gate.** `/review`. Research enters as staging under `research/`,
ordered by what is owed, and only a named person's decision authorises a change
to `content/`. An agent with full write access to this repository still cannot
promote its own research.

## 3. The loop, and how much of it has actually been walked

```text
question → brief → research → handoff → review → decision → model change
                                                                  ↓
              prototype ← packet ← bet ← problem ←────────────────┘
                  ↓
           session handoff ──→ back to review
```

| Join | Built? | Exercised? |
| --- | --- | --- |
| Ask a question / derive one from a gap | yes | yes — questions queued, gaps derived live |
| Brief a run from prior findings | yes | conversationally — the connector reconstructs the orientation the brief composes |
| Research → handoff → CI packet | yes | **yes — once for real**: `2026-08-14-what-makes-clinician-onboarding-high-quality`, 5 findings, 10 sources |
| Review → decision file | yes | yes — one decision file, 5 dispositions, 3 of them `accept-with-edits`, decided in conversation and recorded by the agent |
| Decision → `content/` with `researchTrace` | yes | yes — 5 canonical records now carry a trace |
| Problem → Bet | yes | yes — 1 Problem, 1 Bet |
| Bet → experiment sections → packet | yes | yes — once, and it worked |
| Packet → prototype → conformance stamp | yes | yes — once, and the gate fired for real when `# Out of scope` was split |
| Prototype → session handoff → review | yes | no — `prototype.status` is `working`, never `tested` |

**Both halves have now been walked once.** The research half carried its first
real finding set on 2026-08-14 — `define-onboarding-quality` was answered,
decided, and applied the same day, and the queue derives its `Answered` state
without anyone editing the question file. What that run cost is the evidence
behind [`context-intake-plan.md`](context-intake-plan.md): four pull requests
for one run, every finding read and dispositioned individually, the decision
made in conversation through a lane no document described, and two new craft
documents added to a documentation surface this file already flags as
duplicative. The remaining unwalked join is the prototype session — no
prototype has ever been `tested`.

## 4. What it does not do

Deliberately, and these are not gaps:

- no database, CMS, graph database, auth, agent framework, MCP, or chat surface
- no PHI, real patient or clinician data, production scheduling, billing,
  credentialing integration, or a real matching engine
- no server-side writes anywhere — `/review` hands back a file, and Git records it
- no generated Problems or Bets, ever, and no auto-promotion of research
- no analytics inside prototypes; observation stays manual
- nothing reads a prototype's source and decides whether it implements its scope;
  a machine proves staleness, a person asserts conformance

Not deliberately — these are the gaps:

- **`family-demand` and `quality-outcomes` have zero Steps.** `propose-match`
  consumes a Family in `match-ready` that no Step in the model produces. Four
  independent sources name this: the adversarial review, the deep dive, the
  lifecycle contrast, and the live gap finder.
- **Six of ten candidate care transformations are unmodelled** — assessment,
  goals and plan, repeated care and coordination, observation, review and adapt,
  transition and closure. `docs/care-delivery-lifecycle-contrast.md` has the table.
- **Five canonical records carry a `researchTrace`; the rest cite `author` or a
  reviewer decision that exists only as prose in a Markdown file**, which the
  evidence audit itself flags as not durable.
- **All 7 Metrics say `dataStatus: unknown`**, and `time-to-first-session` still
  contradicts its own decision about which clock it runs.
- **Both Claims are low-confidence author hypotheses.**

## 5. Where it stands, in numbers

| | |
| --- | ---: |
| Canonical records | 49 |
| Lines of canonical content | 1,291 |
| Lines of TypeScript (`lib/` + `scripts/` + `app/` + `components/`) | ~10,960 |
| **Lines of machinery per line of model** | **~8.5** |
| Problems | 1 |
| Bets | 1 |
| Prototypes | 1 |
| Research handoffs | 2 — one real, one worked example |
| Reviewer decision files | 1, carrying 5 dispositions |
| `researchTrace` citations in `content/` | 5 records |
| Documentation | ~330 KB across 19 files |
| …of which dated point-in-time reviews | 146 KB (~44%) |

## 6. Where this is overbuilt

Not "wrong" — disproportionate. Each of these is individually well-reasoned, and
collectively they are a large fixed cost carried by a very small model.

**The enforcement surface is larger than the thing it protects.** Six mechanisms
guard the research path, and until 2026-08-14 they had processed only the worked
example. The first real run then passed through all of them cleanly — which is
one data point that the gates are workable, and also the run that showed the
ceremony around them costs four pull requests per question.

**There are four places that tell a contributor how to contribute** — `AGENTS.md`
(26 KB), `CONTRIBUTING.md`, `docs/authoring.md`, and `README.md`. This audit
found them disagreeing three separate ways: the loop diagram
(`Question` vs `Problem`), the pre-PR check list (7, 10, or 11 commands), and the
experiment-section count (five in three files, six in the schema). All three are
now fixed, and all three would have drifted again, because four descriptions of
one contract is three too many. The research side had grown the same shape —
four documents describing one workflow, one added per run.

*Addressed.* `AGENTS.md` now states the rule that governs this — a contract
statement lives in exactly one file, everywhere else links — and owns the loop
diagram, the check list, the section tables and the branch rule. `CONTRIBUTING.md`
routes instead of restating. The four research documents are two:
`research-workflow.md` for mechanics and `research-practice.md` for craft.

**Nearly half the documentation is a snapshot rather than a contract.** Four
dated reviews total 146 KB. They are good documents. But a reader cannot tell
from a directory listing which files bind and which merely happened, and two of
the four had drifted into stating things about the model that are no longer
true. Status banners now say so; that is a patch, not a structure.

**The conformance stamp is elaborate for a population of one.** Positional
digests per experiment section, printed by the packet and written by a person,
with the packet leading on what changed — this is the correct design, and it
fired correctly on its first real content change. It is also the third gate on a
path that has produced one prototype.

## 7. Where this is underbuilt — for a system meant to take in a lot of context

This is the important section, and it has a single finding underneath it.

**The repository has six mechanisms for keeping bad context out and none for
helping good context arrive.** Every one of the gates above is a filter. Nothing
in the system widens the intake. That asymmetry is why the research half has
been built for months and carried nothing.

Concretely:

**Context can only land where the model has a place for it.** This is the real
constraint, and it is not a tooling problem. A large body of parent-journey
research has nowhere to attach, because `family-demand` has no Steps. A body of
measurement literature has nowhere to attach, because a Metric's schema has no
field for a denominator, a start and end event, a horizon, missingness,
confounders, balancing risks, or permitted use — the exact seven things the
evidence audit says must exist before any Metric is usable. That content has to
go in prose today, where nothing can validate it, project it, or read it back.
**You widen the funnel by widening the model, not by building an importer.**

**One handoff per run, hand-authored, one finding at a time.** The contract takes
`web`, `publication`, `repository` and `session` sources and a list of findings.
There is no path for the cheap, high-volume kind of context: a document set, an
interview corpus, a competitor scan, a literature sweep. Nothing is wrong with
the contract — it was designed for a conversational agent on a GitHub connector,
and it fits that actor exactly. It is simply the only door.

**The reviewer is the entire throughput, and the same bar is applied to
everything.** `/review` decides one finding at a time, and `research-workflow.md`
is explicit that the answer to volume is to slow down rather than lower the bar.
That is right for **belief**. It is applied uniformly to things that are not
belief: that a source exists, that a definition is standard, that a competitor
does X. There is no cheap lane for context that changes no claim, so the
expensive lane is the only lane and it is one person wide.

**Reviewer decisions have no durable home.** Nine canonical records cite
decisions as prose — "Adversarial review decisions D4 and D7, 2026-08-14". Those
strings resolve to nothing. `researchTrace` exists for research-backed change;
there is no equivalent for reviewer-authored direction, even though D1–D8 are
what actually shaped the current topology. `docs/decisions/` holds one ADR, and
it is about tooling.

**Large structured thinking cannot enter as structure.** The deep dive ranks
eight candidate Problems across five dimensions with falsification prompts for
the top three. It is 45 KB of exactly the material this system exists to hold,
and it sits in Markdown that nothing reads. The gap finder cannot see it, the
map cannot draw it, `/review` cannot order it.

**The gap finder only measures thinness, never saturation.** It reports
`unmeasured`, `unevidenced`, `unproven`, `unsupplied`, `thin`. It cannot report
"forty sources bear on this and no Claim has been written," because it reads
`content/` and coverage, never the staging layer's volume.

### Where the balance is right, and should not be touched

- **The projection boundary and the conformance registry.** These scale with the
  model rather than with the number of prototypes, and they are what make adding
  content genuinely free. Every hour spent here has paid for itself.
- **`prototype:brief` refusing.** One command that says *not ready, here are the
  questions to put to a person* is worth more than any amount of validation.
- **The human gate on belief.** Do not automate it, do not batch it, do not add
  a server-side write to make it feel complete.

## 8. What to do next, in order

Ordered by leverage, and the first two are far ahead of the rest.

1. ~~**Answer one queued question for real.**~~ **Done, same day** —
   `define-onboarding-quality` was answered, decided, and applied on 2026-08-14.
   What the run cost and what it had no home for became the evidence for
   [`context-intake-plan.md`](context-intake-plan.md), which now carries the
   infrastructure consequences of this list.
2. **Model the family side of matching.** Give `family-demand` Steps so
   something produces a Family in `match-ready`. This is the most-named gap in
   the repository, it closes the flow's one open end, and — more importantly —
   it is what makes parent-side research landable at all.
3. **Convert the deep dive's eight candidate Problems into canonical Problems.**
   This costs nothing but writing, and the model itself says an unanswered
   Problem is the most useful thing on the map. Today all eight are invisible to
   every surface.
4. **Give Metrics the fields their definitions need** — denominator, start and
   end event, horizon, missingness, confounders, balancing risks, permitted use.
   This is the `AGENTS.md` rule applied to itself: a literal in prose means the
   model is missing a field.
5. **Fix the `time-to-first-session` clock.** Small, named by two audits, and it
   blocks any honest metric work downstream.
6. **Give reviewer decisions a durable identity** so the nine prose citations
   resolve to something with a hash and a named author, the way `researchTrace`
   already does.
7. **Build the second prototype** — readiness review and correction, already
   scoped in the deep dive. A second pass is what shows whether the packet
   generalises or was fitted to one bet.

Note what is *not* on this list: no new surface, no importer, no dashboard, no
agent framework. The constraint is model surface area and one unexercised half of
a loop, and neither is fixed by more software.

## 9. Sources

Everything above is derived from files in this repository at this revision, and
each is worth reading directly:

- `AGENTS.md` — the rules, and the reasoning behind each one
- `docs/context-intake-plan.md` — the planned answer to sections 6 and 7 of this document
- `docs/context-flow-plan.md` — why the loop's joins are shaped as they are
- `docs/adversarial-system-review-2026-08-14.md` — the model's boundary problems
- `docs/adversarial-deep-dive-readiness-matching-2026-08-14.md` — the unconverted backlog
- `docs/evidence-quality-audit-2026-08-14.md` — what the evidence layer does and does not support
- `docs/care-delivery-lifecycle-contrast.md` — the ten transformations, and which are modelled
- `npm run research:queue` — the live version of section 4's gap list
