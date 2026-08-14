# Contributing

There are three kinds of contribution here, and they are equally welcome:

1. **Model contributions** — a stage, step, entity, claim, metric, or bet in
   `content/`. This is systems thinking, and it requires no application code.
2. **Software contributions** — the projection in `app/`, `components/`, `lib/`,
   or a prototype under `app/prototypes/`.
3. **Research intake** — an untrusted, reviewable handoff under `research/` that
   may inform a later model contribution but never changes the map by itself.

`docs/authoring.md` is the practical guide for the first kind. This file covers
the process around both.

For provider-neutral research intake, follow `docs/research-workflow.md`. Both a
conversational GitHub connector and a coding agent use the same files and npm
commands; no transcript, provider credential, or private material belongs here.

## Setup

```bash
npm install
npm run validate:content
npm run dev
```

Open <http://localhost:3000/map>.

## The loop

```text
Map → Question → Bet → Prototype → Learn → Update Map
```

Edit one small file in `content/`, save, and the application reflects it. If a
change to `content/` requires editing a React component to show up, that is a
bug in the projection — please open an issue.

## Before you open a pull request

```bash
npm run validate:content
npm run validate:research
npm run test:research
npm run lint
npm run typecheck
npm run build
```

CI runs all of these on every pull request, plus `npm run lint:design` and
`npm run test:responsive`.

## Branch from `main`, and target `main`

One rule, and it is enforced: **a pull request is based on `main`**.

A pull request based on another feature branch does not follow that branch onto
`main` when it merges. It stays open, still pointed at a branch nobody is
developing any more, and merging it then pushes the work *down* into that dead
branch. Every check stays green and GitHub reports the pull request as merged,
while `main` never receives a line of it.

This has happened twice here, to PRs #3–#7 and again to #12–#14, and both times
it took a hand-written recovery pull request to undo. The `Pull request shape`
check now fails a pull request based on anything other than `main`.

If a change genuinely cannot be reviewed without an unmerged one, stack it and
add the **`stacked`** label. The check then passes and prints the rule that
makes stacking safe: **merge a stack top down**, starting with the pull request
furthest from `main`. Merging bottom up lands only the first one.

Splitting work into several pull requests does not require stacking. Branch each
one from `main` and accept that the diffs overlap — an overlapping diff is a far
smaller cost than a stranded merge.

## What belongs in a model change

The pull request template asks what we now believe that we did not before, and
where that came from. Please answer both. This repository is meant to record the
evolution of our understanding — a model change with no stated reasoning is much
less useful six months later.

Set `authority: proposed` unless there is a specific reason to claim more.

## What does not belong here

- Real patient data, PHI, or anything HIPAA-regulated
- Real clinician data or identifiable individuals
- Company-confidential material presented as public documentation
- Production infrastructure: databases, auth, billing, scheduling, matching engines

The reference model is a generalized account of how a parent-focused
behavioral-health platform might operate. If company-specific research is added
later, it belongs in a separate folder, clearly distinguished from this canonical
generalized model.

## Reporting

Use the issue templates for proposing a bet, adding a claim, challenging a claim,
or recording a gap in the model. Recording something we do not understand is a
real contribution and does not need a proposed answer.
