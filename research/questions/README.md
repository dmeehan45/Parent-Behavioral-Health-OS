# Questions

The research queue. One file per question, because two people adding a question
on the same day should not conflict in Git.

Add one with:

```bash
npm run research:ask -- "How do parents actually choose a first clinician?"
```

That writes `research/questions/<id>.yaml`:

```yaml
id: how-do-parents-actually-choose
question: "How do parents actually choose a first clinician?"
askedBy: your name or handle
createdAt: 2026-08-14
status: open
priority: normal
targets: [matching]        # optional — what this bites
why: >                     # optional — what changes if we learn the answer
  We assume parents choose on availability. If they choose on fit, the
  matching stage is solving the wrong problem.
```

Naming a question is a complete contribution. It does not need a proposed
answer, and nobody has to research it for it to have been worth writing down.

`status` is yours: `open`, `parked`, or `closed`. **Answered is not a status** —
it is derived from the runs that declare `run.answers: [<question-id>]`, so the
queue and the research can never disagree about what has been covered.

`npm run research:queue` shows what is open, alongside gaps the model has in
itself — unmeasured metrics, problems with no evidence behind them,
low-confidence assumptions, thinly described primitives, and questions earlier
runs raised and nobody queued. A run with nothing queued picks from those.
