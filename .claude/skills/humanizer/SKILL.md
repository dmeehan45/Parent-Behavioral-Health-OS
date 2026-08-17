---
name: humanizer
description: >-
  Strip AI writing tells from prose and hold its factual claims to this
  repository's rigor bar. Use whenever drafting, editing, or reviewing prose a
  reader will see: documentation (README.md, CONTRIBUTING.md, AGENTS.md,
  anything under docs/), the markdown body of a content/ primitive, microcopy
  rendered by components/ or app/ (labels, empty states, helper text, derived
  sentences), or a pull request description. Trigger on "humanize", "de-AI",
  "de-slop", "does this sound like ChatGPT", "review the writing", "tighten the
  prose" — and also, unprompted, as a final pass over any change that adds or
  edits reader-facing prose. Runs in two modes: write and review.
---

# Humanizer

One pass, two jobs. The prose has to read like this repository wrote it, and
every factual assertion in it has to survive this repository's rigor bar. The
two fail independently — a sentence can be clean prose resting on nothing, or a
well-sourced claim buried in slop — so check for both and report both.

The pattern catalog this skill applies lives in
[references/patterns.md](references/patterns.md). Read it in full before any
pass over a document or a content body; for a one-line microcopy edit, the
rules in this file plus the catalog's section headings are usually enough.

## Surfaces

This skill governs prose a reader sees:

- Documentation: `README.md`, `CONTRIBUTING.md`, `AGENTS.md`, everything under
  `docs/`.
- The markdown body of every `content/` primitive — the prose below the
  frontmatter.
- Visualization-surface microcopy: strings rendered by `components/` and
  `app/` — labels, empty states, helper text, confirmations, warnings — and
  derived sentences composed in code, such as the open-end lines in
  `lib/model/open-ends.ts`.
- Pull request descriptions and commit message bodies. The first line keeps
  the repository's `kind: summary` commit style and is out of scope.

It defers what other files own, because a contract statement lives in exactly
one file:

- **Frontmatter is data, not prose.** Never reword an `id`, a state name, an
  enum, or a claim's `statement` as part of a humanizing pass. Changing a
  `statement` changes what the model claims, which is a model edit with its own
  review — if a statement reads as slop, report it as a finding and leave the
  edit to a deliberate, separate change.
- Evidence appraisal — source quality, recency, triangulation, the
  proportionate bar — belongs to `docs/research-practice.md`.
- What `authority`, `confidence`, and `provenance` mean belongs to
  `docs/system-model.md` and `docs/authoring.md`.
- Research enters the model only through the review gate. A humanizing pass is
  never the way a finding becomes something the model says.
- Visual rules — hue as category, tokens, spacing — belong to
  `docs/design-system.md`.

## Three rules that bind every edit

**Prose confidence may not outrun frontmatter.** A claim carries `authority`
and `confidence`, and the prose around it has to sit at the same height. A
`proposed` hypothesis at `confidence: low` cannot read as settled fact in a
body, a doc, or a screen — and the inverse holds too: do not hedge a
`validated` result or a `policy` rule into mush. When you tighten a hedged
sentence, check what the record actually asserts before deciding which words
were the slop and which were the calibration.

**Never pad, and never invent the specific.** Incompleteness is valid in this
repository: an empty field is honest, a thin file reads as thin on purpose.
A humanizing pass shortens, sharpens, and grounds — it never fills. The
catalog's cure for a vague sentence is a specific one, but that move is only
available when the specific exists in the model or a named source. Otherwise
the fix is to cut the vague sentence or mark the gap, and inventing a
plausible number, study, or detail to complete the pattern is the one failure
worse than the slop it replaces.

**Link, don't restate.** When prose restates a rule that lives in another
file — the branch rule, the projection contract, the review gate — the
restatement is a finding even if the wording is clean, because two copies of
one contract drift apart. Replace it with a link to the owning file and keep
only what this prose adds.

## The house voice

Upstream humanizer's target voice is a person blogging: first-person, mixed
feelings, mess left in. That is not this repository. The standing voice sample
is `AGENTS.md` and the files under `docs/` — calibrate against them, not
against a generic idea of "human writing". The traits that matter:

- **Plain declaratives.** Say what is true in the shortest grammatical
  sentence that holds it. "The map follows the repository." "Incompleteness is
  valid."
- **The rule first, then the reason.** House prose states the constraint and
  then explains why it exists, usually with the incident that produced it.
  "This has cost two hand-written recovery pull requests" does more work than
  any adjective.
- **Concrete incidents over abstract virtue.** Numbers, filenames, and what
  actually happened. Not "this is important for maintainability".
- **Em dashes are house style.** They set off asides and reversals throughout
  the sample. Their presence is not a tell here; mechanical density — several
  per paragraph, every sentence hinged on one — still is.
- **Bold states the rule being introduced**, once, at the start of its
  paragraph. Bold scattered mid-sentence for emphasis is the tell the catalog
  describes.
- **Sentence case headings.** Always.
- **No first person, no performance.** House prose does not say "I", does not
  reassure, and does not warm up. It also does not perform neutrality — it has
  positions and states them ("that is a decision rather than an omission").
- **Hedges are calibration, not caution.** The sample hedges exactly where the
  model is uncertain and nowhere else. "Usually", "rarely", and "when in
  doubt" appear where they carry information.

## The rigor test

Two questions gate every factual assertion in a piece. Ask them of each
sentence that claims something about the world, the system, or the evidence.

1. **Can a reader trace it?** In this repository, traceable means it resolves
   to one of: a claim record (whose `authority` and `confidence` the prose must
   match), a metric with its units, a `provenance` or `researchTrace` entry, a
   named source, a file the reader can open, or an explicit marker that the
   thing is open, unknown, or proposed. If none of those exists, the sentence
   either loses the claim or gains the marker.
2. **Could it be false?** "Streamlines the workflow", "a robust foundation",
   "significantly improves the experience" cannot be false, so they assert
   nothing. Replace the unfalsifiable phrase with the mechanism, the number, or
   the named thing — or cut it.

Red flags, each one a finding:

- "Studies show", "research suggests", "it is well established" with nothing
  named.
- A number with no unit, date, or source it could be checked against.
- An adjective standing in for a measurement: "dramatically faster", "much
  more reliable".
- Prose asserting as fact what its record marks `proposed` or
  `confidence: low` — or prose hedging what its record marks `validated`.
- A specific that appears nowhere in the model or a named source — the
  invented-detail failure described above.
- A restated contract that another file owns.
- Opinion wearing the grammar of established fact, with no marker that it is
  ours.

## Write mode

Use when the input is a topic, a brief, or rough notes to turn into prose.

1. **Name the load-bearing assertions first.** List what the piece will claim
   before drafting. For each, find what it traces to — record, metric, source,
   or an honest "open". What traces to nothing gets marked or dropped now, not
   discovered in review.
2. **Draft in the house voice**, against the traits above, with the catalog's
   patterns as the negative space.
3. **Run the anti-AI pass** (below).
4. **Run the mechanical checks** (below) if the edit touched `content/`,
   `components/`, `app/`, or `lib/`.

## Review mode

Use when the input is existing prose to audit. Do not silently rewrite a
finished piece — report first, and apply fixes when that is the task or the
author asks.

1. **Gather the prose.** The file itself, or the branch diff
   (`git diff main -- <paths>`) when reviewing a change.
2. **Extract the factual assertions** and grade each against the rigor test.
3. **Scan against the catalog**, pattern by pattern for a document, headings
   plus the high-frequency word list for microcopy.
4. **Report**, then fix if asked. Open with a one-line verdict — **ship**,
   **revise**, or **not ready** — and the count of blocking findings. Then the
   findings, grouped by severity, each as a quote or location, the rule it
   breaks, and the concrete fix.

Severities:

- **Blocking.** An untraceable assertion presented as fact; prose confidence
  contradicting the record's `authority` or `confidence`; an invented
  specific; a rewrite that changed what a sentence claims; a restated
  contract another file owns.
- **Should fix.** Catalog patterns: AI vocabulary, participle padding,
  negative parallelism, rule-of-three, copula avoidance, signposting, chatbot
  artifacts, unfalsifiable puffery, and the rest.
- **Polish.** A vague phrase that could be a real specific already available
  in the model; rhythm; a sentence doing no work.

## The anti-AI pass

Kept from upstream because it catches what the catalog misses. After any
draft or rewrite:

1. Ask: "What makes the text below obviously AI generated?"
2. Answer honestly, in two or three bullets — remaining tells, rhythm that is
   too even, a closer that sounds like a slogan.
3. Revise once more against that answer.
4. Then ask the repository's own question: "Did any edit change what a
   sentence claims, or make it sound more certain than its record?" If yes,
   put the meaning back.

## Mechanical checks

After edits, run what the change touched:

- `content/` bodies: `npm run validate:content`
- `components/`, `app/`, `lib/`: `npm run lint && npm run typecheck`
- A fast tell scan over changed prose, useful before the full catalog pass:

```bash
rg -in "delve|testament|pivotal|tapestry|underscore|showcase|vibrant|crucial|evolving landscape|it's not just|not only|game-changer|deep dive|studies show|let's dive|in today's" <changed files>
```

A hit is a candidate, not a verdict — "not only" and "crucial" have
legitimate uses — but each one deserves a look.

## Attribution

Adapted from the [Hermes Agent port](https://github.com/NousResearch/hermes-agent/tree/main/skills/creative/humanizer)
of [blader/humanizer](https://github.com/blader/humanizer) by Siqi Chen (MIT,
license preserved in [LICENSE](LICENSE)), itself built on
[Wikipedia: Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing),
maintained by WikiProject AI Cleanup. The rigor half adapts the `content-rigor`
skill from [dmeehan45/agent_skills](https://github.com/dmeehan45/agent_skills/tree/main/skills/content-rigor),
remapped from the codebase it was written against onto this repository's
surfaces and its existing machinery — `authority`, `provenance`,
`researchTrace`, and `docs/research-practice.md` — rather than duplicating
them. The voice guidance replaces upstream's blogging register with this
repository's own, sampled from `AGENTS.md` and `docs/`.
