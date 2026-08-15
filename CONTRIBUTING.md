# Contributing

This file is the door: what kinds of contribution exist, where each one is
documented, and what does not belong here.

**[`AGENTS.md`](AGENTS.md) is the contract.** Every rule about how the model
works, what the checks are, how to branch, and how to write a commit lives
there, once, and applies to human and AI contributors alike. This file links to
it rather than restating it — a rule written down twice drifts, and this
repository has already spent an audit fixing three that did.

## Three kinds of contribution, equally welcome

1. **Model** — a stage, step, entity, claim, metric, problem, or bet in
   `content/`. This is systems thinking, and it requires no application code.
   Naming a Problem is a complete contribution: it does not need a proposed
   answer, and a Problem nobody has answered yet is the most useful thing on the
   map. → [`docs/authoring.md`](docs/authoring.md)
2. **Software** — the projection in `app/`, `components/`, `lib/`, or a
   prototype under `app/prototypes/`. → [`AGENTS.md`](AGENTS.md) for the
   projection rules, [`docs/prototype-workflow.md`](docs/prototype-workflow.md)
   for turning a Bet into working software.
3. **Research intake** — an untrusted, reviewable handoff under `research/` that
   may inform a later model contribution but never changes the map by itself.
   → [`docs/research-workflow.md`](docs/research-workflow.md) for the mechanics,
   [`docs/research-practice.md`](docs/research-practice.md) for the craft.

Research never edits `content/`. A person decides what it means, and only an
accepted decision authorizes a later, separate model change. Both a
conversational GitHub connector and a coding agent use the same files; no
transcript, provider credential, or private material belongs here.

Not sure where a contribution fits, or what is worth doing?
[`docs/system-state.md`](docs/system-state.md) says where the model is currently
thin, and `npm run research:queue` says the same thing live.

## Setup

```bash
npm install
npm run validate:content
npm run dev
```

Open <http://localhost:3000/map>.

Edit one small file in `content/`, save, and the application reflects it. If a
change to `content/` requires editing a React component to show up, that is a
bug in the projection — please open an issue.

## Before you open a pull request

Run the checks listed in
[**AGENTS.md → Before opening a pull request**](AGENTS.md#before-opening-a-pull-request).
CI runs every one of them. `test:responsive` needs a browser once:
`npx playwright install chromium`.

Branch from `main` and target `main` — the reasoning, and the two times this
repository paid for getting it wrong, are in
[**AGENTS.md → Branch from `main`**](AGENTS.md#branch-from-main-and-target-main).
The `Pull request shape` check enforces it.

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
- Credentials, contact details, or patient identifiers — `npm run scan:safety`
  looks for the shapes of these on every pull request, and prints the block to
  paste into `research/safety-allowlist.yaml` if it flags something harmless
- Production infrastructure: databases, auth, billing, scheduling, matching engines

The reference model is a generalized account of how a parent-focused
behavioral-health platform might operate. If company-specific research is added
later, it belongs in a separate folder, clearly distinguished from this canonical
generalized model.

## Reporting

Use the issue templates for proposing a bet, adding a claim, challenging a claim,
or recording a gap in the model. Recording something we do not understand is a
real contribution and does not need a proposed answer.
