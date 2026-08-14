# Evidence and seed-quality audit

**Audit date:** 2026-08-14
**Scope:** canonical content, research staging, review artifacts, prototype framing,
repository guidance, and merged pull-request descriptions available through the
public GitHub API at this revision.
**Question:** where does the repository present speculation as evidence, imply
data it does not have, carry weak seed material, or leave consequential gaps?

## Bottom line

The canonical files are more honest than the merged rationale that introduced
some of them. The repository contains **no recorded interview, observation,
operational dataset, experiment, or applied public-research evidence** for a
canonical record. Of 49 records, 40 cite `author` with no references and nine
cite an accountable review decision. Both Claims are explicitly low-confidence
hypotheses, all seven Metrics say their data status is unknown, and no canonical
record has a `researchTrace`.

That means the main defect is not fabricated measurements inside `content/`.
It is **evidence-layer drift**: prose in a merged pull request claimed interviews
and data that the affected records, history, and research intake do not record.
There are also several places where proposed author reasoning is written in the
grammar of an observed operating fact, one internally contradictory Metric
clock, unverifiable decision references, and seed fields that implied knowledge
while saying nothing.

The audit does not conclude that an interview or dataset never existed. It
concludes that the repository has no evidence of either, so nobody can audit,
challenge, or safely reason from those claims.

## Inventory

| Signal | Result | Interpretation |
| --- | ---: | --- |
| Canonical Markdown records | 49 | 8 Stages, 18 Steps, 12 Entities, 2 Claims, 7 Metrics, 1 Problem, 1 Bet |
| `provenance.source: author` | 40 | Author reasoning, not external evidence |
| Author records with no references | 40 | No source recorded beyond the author |
| Accountable-reviewer records | 9 | All point to D2/D4/D7 prose decisions |
| Canonical `researchTrace` entries | 0 | No reviewed research has been applied |
| Claims | 2 low-confidence hypotheses | Neither is supported or observed |
| Metrics | 7 with `dataStatus: unknown` | No canonical Metric claims available data |
| Open research questions | 3 high-priority | Authority roles, matching quality, onboarding quality |
| Generated research findings | 1 example, undecided | It concerns the intake contract, not care operations |
| Working prototypes ready under the current experiment contract | 1 of 1 | The Bet now carries all five experiment sections and a participant |
| Empty Step `rules` / `exceptions` fields found | 22 | Seed filler; removed by this change |
| Verbatim `purpose` / `activity` pairs found | 6 | Seed duplication; `activity` removed by this change |

Counts describe this checkout, not the completeness of the real-world domain.

## Findings

### Critical — merged PR #20 claims evidence the records deny

PR #20, **“Add clinician supply and practice operations steps,”** says its new
primitives emerged from “Interviews revealing” a missing selection feedback loop
and “Data showing” asymmetric onboarding effort. The affected commit records the
new Claim as `kind: hypothesis`, `confidence: low`, `authority: proposed`, and
`provenance: { source: author, references: [] }`. Its four new Metrics all record
`dataStatus: unknown` and the same author/no-reference provenance. There is no
handoff, decision, `researchTrace`, interview reference, observation reference,
or data reference for the change.

This is a direct contradiction, not merely thin documentation. The PR rationale
can lead a reviewer or future agent to weight the supply model, clinician-effort
Metric, and selection feedback hypothesis as observed evidence when canonical
content correctly says they are untested author reasoning.

**Disposition:** keep the canonical uncertainty. Correct PR #20's description or
add a conspicuous maintainer comment stating that the two bullets are unsupported
and should read “author reasoning; no interview or data evidence is recorded.” Do
not backfill a source unless the original material can be identified and safely
entered through the research workflow.

### High — the topology itself has no provenance contract

`content/map.yaml` asserts ten Stage relationships, including two feedback loops,
but `mapSchema` has no authority, provenance, review date, or research trace.
Individual Stage provenance does not establish why one Stage `informs`,
`supplies`, or `influences` another. The selection Claim even reasons from a
quality-to-supply feedback edge whose evidentiary basis cannot be expressed.

**Impact:** the lines that make the model causal-looking are less accountable
than the nodes. A reader can distinguish a proposed Step from policy, but cannot
distinguish an author-sketched edge from a validated relationship.

**Disposition:** make map-level or edge-level authority/provenance a deliberate
model-design decision before treating topology as evidence. This audit does not
add the field because its ownership and rendering semantics require review.

### High — proposed process prose often reads as current observation

The UI exposes `authority: proposed`, which is an important mitigation. The prose
still uses unqualified factual language in several author-only records:

- `screen-candidates` says screening is cheap and exists to protect expensive
  judgement; `select-clinician` calls selection the most expensive judgement.
- `activation-without-productivity` says the onboarding-to-work gap “is not
  currently anybody's job.”
- `state-supply-need` starts from “observed family demand” even though no
  observation source or demand data exists.
- `operating-effort-per-activation` says its Metric separates scalable steps
  from steps needing a person, although hours alone cannot establish scalability.

These can be useful hypotheses. The defect is that they are not consistently
phrased as hypotheses, definitions, or proposed mechanisms.

**Disposition:** review these sentences with the accountable author. Prefer
“the model proposes,” “we do not currently represent,” or an explicit Claim over
statements about what happens in a real operation. Changing their meaning is a
canonical decision and is not performed by this audit.

### High — Metric definitions are not yet analysis-ready

All Metrics honestly say data status is unknown, but several definitions could
still produce incorrect data later:

1. `time-to-first-session` says its decision is about accepted-match-to-encounter
   failure while its definition starts at match readiness. Those are different
   clocks and attribute different waiting to care initiation.
2. `candidate-yield` does not define whether “reach active practice” means the
   Clinician's `active`, `establishing`, or `sustaining` state, nor its cohort,
   time horizon, withdrawals, or unresolved candidates.
3. `selection-accuracy` requires a quality bar, observation horizon, comparison
   group, missing-outcome treatment, case-mix handling, and permitted use before
   a percentage is meaningful. Its decision warning correctly blocks individual
   use but does not make the measure computable.
4. The time and effort Metrics do not yet define censoring, terminal states,
   missingness, or whether elapsed and active work clocks include rework.

The deeper readiness/matching review already identifies much of this, including
the first-session clock contradiction. None of it has been promoted to canonical
Metric definitions, so “unknown” must not be mistaken for “well-defined but not
collected.”

**Disposition:** resolve the clock contradiction first, then require a metric
protocol (unit, denominator, start/end event, horizon, missingness, confounders,
balancing signals, and prohibited inference) before changing any Metric to
available or using it for a decision.

### Medium — accountable-reviewer references are not durable decision records

Nine records cite prose such as “Adversarial review decisions D4 and D7,
2026-08-14.” The decisions exist in a Markdown review document, but are not
content-addressed, do not name the reviewer in the reference, and do not use the
hash/supersession protections required of research decisions. They establish a
review trail, not empirical support.

**Disposition:** treat these references as decision provenance only. Do not cite
them as evidence that a workflow occurs or an outcome improves. For future
reviews, use a stable path plus decision identifier and named reviewer; use
`researchTrace` when the decision accepts research evidence.

### Medium — the model's largest loose ends remain upstream of safe automation

The current queue correctly exposes both low-confidence Claims and all seven
unknown-data Metrics. The more consequential semantic gaps are:

- “Family” still collapses patient, parent, caregiver, household, consent, and
  changing decision authority.
- Matching has no accepted definition of quality, constrained-supply denominator,
  permitted inputs, missingness treatment, or safe decline/recovery evidence.
- Onboarding readiness has no accepted definition beyond field/state completion.
- Quality & Outcomes has no Steps, no quality construct, and no observed signal
  that can responsibly feed selection or matching.
- Family Demand has no Steps, so “observed demand” has no represented event,
  actor decision, state transition, or data lineage.

These are not invitations to fill files with plausible workflows. They are the
reasons the three high-priority research questions should remain ahead of match
scoring, clinician ranking, or optimization work.

### Low — seed scaffolding overstated completeness

Twelve Steps carried empty `rules` and/or `exceptions` arrays, and six repeated
`purpose` verbatim as `activity`. Empty optional arrays visually raised coverage
without recording a known absence; duplicate activity made a thin Step appear
more described without adding information.

**Disposition implemented:** omit those fields. Validation now rejects these two
objective filler patterns while preserving honest incompleteness.

## Guardrails added by this audit

The content loader now rejects only contradictions that can be determined
without judging prose:

- `reference`, `validated`, or `policy` authority without a provenance reference
  or accepted research trace;
- `reported` or `observed` Claims without recorded evidence;
- high confidence without recorded evidence;
- available or partially available data without recorded evidence;
- references with no provenance source;
- verbatim Step purpose/activity duplication; and
- empty optional Step rules/exceptions.

The pull-request template now asks for an explicit per-record evidence-alignment
check and says that “no evidence yet” is valid. A checklist cannot prove semantic
truth, but it makes the exact PR #20 contradiction harder to overlook.

## What the guardrails deliberately do not claim

- A reference proves relevance, quality, or truth.
- An accountable review decision is empirical evidence.
- Author reasoning is bad or should be removed.
- Unknown data makes a Metric unimportant.
- The absence of repository evidence proves no external conversation occurred.
- A deterministic validator can decide whether differently worded prose is the
  same claim or whether a real-world workflow is accurate.

Those remain human review work. The repository can enforce that stronger labels
carry something inspectable; it cannot automate epistemic judgement.

## Recommended review order

1. Correct the public rationale on PR #20 so merged history stops overstating the
   evidence behind eleven introduced primitives.
2. Decide and correct the `time-to-first-session` clock before collecting or
   interpreting that Metric.
3. Run the three queued high-priority research questions through the existing
   handoff and named-reviewer gate.
4. Decide how topology relationships carry authority and provenance.
5. Rewrite current-fact language only where the accountable author agrees it is
   a proposed mechanism rather than a description of observed operations.
6. Do not operationalize selection accuracy, readiness scoring, or match ranking
   until constructs, missingness, attribution, balancing harms, and permitted
   uses are accepted.

## Rebase and merge-impact review

Rechecked against `main` after PRs #31–#41. Those changes added evidence edges
for Problems and Bets, session-source research handoffs, human-authored Problem
composition, a prototype build packet, and authored-reference checks that prove
the projection uses declared relationships. They did not add canonical research
traces, decisions, care-delivery sources, or operational data, so the inventory,
Metric findings, topology-provenance gap, and PR #20 contradiction remain
unchanged. PR #41 resolved the earlier unshaped-experiment gap by adding the five
experiment sections and participant to the canonical Bet. That makes the
prototype build-ready under the repository contract; it does not make the Bet
validated evidence, and no prototype session handoff exists yet.

After the rebase, the functional prototype, research-composition, projection,
and responsive-test changes shown in the earlier combined diff are already on
`main`; they are no longer part of this branch. The remaining merge has these
effects:

- **Intentional authoring break:** content that previously validated will now
  fail if it claims reference/validated/policy authority, reported/observed
  evidence, high confidence, or available data without a reference or accepted
  research trace. Empty Step rules/exceptions and verbatim purpose/activity also
  fail. This is a stricter content contract, not a runtime API break.
- **Small projection shift:** removing empty arrays and duplicated activity from
  existing Steps lowers their displayed coverage to reflect what is actually
  known. It does not change topology, transitions, roles, Claims, Metrics, or
  rendered process prose.
- **Review-process shift:** the pull-request template now requires authors to
  reconcile evidence language with canonical metadata.
- **No application/API break:** this branch adds no routes, component contracts,
  model fields, edge kinds, client behavior, or production data behavior beyond
  what current `main` already contains.

The stricter authoring validation is the only breaking change and is deliberate.
All current canonical records have been migrated and pass it.
