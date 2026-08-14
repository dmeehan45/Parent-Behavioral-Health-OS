# The research routine

`docs/research-workflow.md` describes one handoff, start to finish. This
describes running that workflow on a schedule, twice a day, without giving
anything a credential or a database.

The routine is deliberately small. A conversational agent connected to this
repository through a GitHub connector does the research and opens a pull
request; the repository's own commands tell it what to work on and what is
already known; a person decides what any of it means. Nothing about it requires
a provider API, an agent framework, or a runner that holds a model key.

## What runs twice a day

A scheduled workflow, `.github/workflows/research-routine.yml`, runs
`npm run research:queue` and keeps one issue up to date with the result. It
calls no model and holds no secret — it publishes the queue so that a person or
an agent has something to open.

Everything else is a conversation. Twice a day, in Claude, ChatGPT, or anything
else wired to this repository:

> Read the research routine issue. Pick the top item. Run
> `npm run research:brief -- <question-id>` and follow it.

## The loop

```text
ask ──▶ queue ──▶ brief ──▶ research ──▶ handoff ──▶ review ──▶ decision ──▶ model change
 │        │         │                                   │                        │
 └── a person or a gap in the model                     └── a person, at /review ┘
```

1. **Ask.** `npm run research:ask -- "..."` queues a question. Or do not: a run
   with nothing queued reads the model's own gaps and picks one.

2. **Queue.** `npm run research:queue` prints what is open, the gaps, and the
   review debt. This is the routine's whole sense of what to do next.

3. **Brief.** `npm run research:brief -- <question-id>` prints what previous
   runs already established, which sources they read, and what the reviewer
   accepted or rejected. **This is the step that makes each run separate from
   the last.** A run that skips it will rediscover things and be rejected.

4. **Research and hand off.** `npm run research:new -- <question-id>` scaffolds
   the handoff with a dated, collision-resistant run ID. Fill it in, then:

   ```bash
   npm run generate:research-review
   npm run validate:research
   npm run scan:safety
   ```

   Branch from `main`, commit, open a pull request. Never edit `content/`.

5. **Review.** A person opens `/review`, reads the run, and decides. The page
   hands back a decision file to commit. This is the only step a person does,
   and it is the point of the whole arrangement.

6. **Apply.** A separate pull request, also from `main`, edits `content/` and
   cites the run, decision, and finding in `researchTrace`. Validation refuses
   any citation that is not backed by an accepted, unsuperseded decision.

## How runs stay separate

A twice-daily agent researching the same public sources will resurface the same
statement forever unless something stops it. Three mechanisms, in the order
they act:

- **Prevention — the brief.** Every previous statement, every source already
  read, and every reviewer decision go into the next run before it starts.
  Repeats mostly do not get produced.

- **Detection — validation.** An exact restatement of an earlier run's finding
  is an error, naming the run that said it first. A reused source identity is
  reported, not blocked: re-reading a source to qualify what it was taken to
  say is precisely what a later run is for.

  Only exact restatement is enforced. Judging whether two differently-worded
  findings are the same claim is semantics, and deterministic tooling here does
  not resolve semantics — that judgement is the reviewer's.

- **Resolution — supersedes.** A later decision can retire an earlier one. When
  it does, the authorization goes with it: any canonical record still citing
  the retired decision stops validating. This is what lets the model change its
  mind rather than accumulate contradictions.

## What the routine cannot do

It cannot decide anything. Every path to `content/` runs through a decision
file a person wrote, and `checkResearchTrace` enforces that at content
validation *and* inside the live map's projection. An agent with full write
access to this repository still cannot change what the model claims.

It cannot judge whether research is good. Validation checks shape, references,
safety declarations, and provenance. Whether a finding is true, well-evidenced,
and worth acting on is a human judgement the tooling deliberately declines to
make.

It cannot catch confidential material written as ordinary prose.
`npm run scan:safety` looks for the shapes of things that must not be in a
public repository — credentials, contact details, patient identifiers, markers
carried over from an internal document. A confidential paragraph in plain
English will pass it. Nothing regex-shaped would catch that, and pretending
otherwise would be worse than the honest gap.

## If it gets noisy

The failure mode to watch is review debt: findings arriving faster than anyone
decides them. `npm run research:queue` and `npm run validate:research` both
print it, and `/review` shows which runs are waiting.

If it grows, slow the routine down rather than lowering the bar for accepting a
finding. The bottleneck is a person reading carefully, and that is the part
worth protecting.
