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

Not sure where a contribution fits, or what is worth doing? The repository
says its own state — see the lanes below.

## Arriving with an agent: pick a lane from the live state

This repository expects to be worked on through a conversational or coding
agent — pointed at it fresh, with no chat history to lean on. What is useful
to do next is not fixed; it follows from the state of the loop, and two
derived commands say that state:

```bash
npm run research:queue    # what is owed a decision or a sentence, then what to research
npm run prototype:queue   # every bet, and the next build, check, or review action
```

The routine issue — *Routine: what to research, build, or review next* —
republishes both twice a day, for agents that cannot run commands.

Six lanes; the queues say which are live. One rule holds in all of them: the
agent composes, researches, drafts, and does the clerical half; a named
person decides what the model believes.

1. **Decide research with the person.** The queue's `undecided` runs are
   findings waiting on a human disposition. Present each one in conversation
   and record only what the person states — never a disposition they did not
   give. → [`docs/research-workflow.md`](docs/research-workflow.md#two-lanes-for-deciding)
2. **Apply what was accepted.** `unapplied` and `unconverted` are authorized
   changes nobody made. Compose them at `/review/apply`, with the person
   supplying belief kind, confidence, and any name.
   → [`docs/research-workflow.md`](docs/research-workflow.md)
3. **Write down what the context now supports.** `saturated` records and model
   gaps — a stage with no steps, an unsupplied state — are answered by a
   person's sentence, not more research. Help them write it, directly or
   through a reflection handoff.
   → [`docs/authoring.md`](docs/authoring.md), [`docs/conversational-review.md`](docs/conversational-review.md)
4. **Research the top queued question.** Brief first, research in
   conversation, pressure-test, hand off one file.
   → [`docs/research-workflow.md`](docs/research-workflow.md)
5. **Build a bet the queue calls `buildable`** (or rebuild a `stale` one).
   Coding agents only: run `npm run prototype:brief -- <bet-id>` and build to
   the packet. The conformance stamp is a person's to write.
   → [`docs/prototype-workflow.md`](docs/prototype-workflow.md)
6. **Review a `reviewable` prototype.** Put it in front of participants using
   its `# Review prompts`, then write the session up as a handoff with a
   `session` source and let a person decide what it taught.
   → [`docs/prototype-workflow.md`](docs/prototype-workflow.md#6-review-against-a-learning-script)

The lane that does not exist: editing `content/` to say what the agent's own
research found. Every path to canonical belief runs through a decision file a
person wrote — [`AGENTS.md`](AGENTS.md) is the contract.

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
