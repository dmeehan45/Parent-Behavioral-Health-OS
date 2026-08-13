# Contributing

There are two kinds of contribution here, and they are equally welcome:

1. **Model contributions** — a stage, step, entity, claim, metric, or bet in
   `content/`. This is systems thinking, and it requires no application code.
2. **Software contributions** — the projection in `app/`, `components/`, `lib/`,
   or a prototype under `app/prototypes/`.

`docs/authoring.md` is the practical guide for the first kind. This file covers
the process around both.

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
npm run lint
npm run typecheck
npm run build
```

CI runs all four on every pull request.

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
