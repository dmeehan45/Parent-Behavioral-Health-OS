# Building a prototype from a Bet

A prototype is a small, executable question. It makes one Bet concrete enough
for a person to react to, without pretending the Bet is proven or becoming a
production system.

This workflow is the bridge in the repository's learning loop:

```text
Map → Problem → Bet → prototype plan → Prototype → learn → research or model proposal
```

It is designed for a person working with an agent. The agent can assemble
context, expose gaps, recommend a narrow plan, build, and validate. The person
remains accountable for the question being tested, consequential product
choices, acceptable risk, and any change to canonical content.

## Non-negotiable rules

1. **Build from one canonical Bet.** The Bet names the proposed answer; its
   Problem names where the system breaks and the Stages or Steps affected. Do
   not retarget or rewrite either inside prototype code.
2. **Test a decision, not a feature list.** Name what somebody should be able to
   learn or decide after trying the prototype. If no decision changes, there is
   no reason to build it yet.
3. **Use the smallest complete user flow.** Include enough beginning, choice,
   consequence, and ending for a participant to understand the idea. Do not
   build adjacent administration merely to make the artifact look complete.
4. **Keep uncertainty visible.** Separate what the model says, what evidence
   supports, what the team assumes for the prototype, and what remains unknown.
   Never turn a blank model field into plausible product behavior.
5. **Prefer reversible choices.** An agent may decide routine presentation and
   implementation details. A person decides scope or behavior that materially
   changes the Bet, participant agency, safety, fairness, clinical meaning,
   measurement, or the intended learning.
6. **Prototype, do not simulate production.** Use synthetic data only. Do not
   add PHI, authentication, databases, production integrations, real matching,
   billing, clinical decision-making, or autonomous actions.
7. **Learning does not edit truth automatically.** Observations may create a
   new research question, handoff, Problem, Bet, or model-change proposal. An
   agent cannot promote research or prototype observations into `content/` on
   its own.

## 1. Run the brief

```bash
npm run prototype:brief -- <bet-id>
```

Everything that used to be a reading list is composed for you: the Bet and its
approved experiment, the Problem it answers, every targeted Stage and Step with
roles, entities, rules and exceptions, the Claims and Metrics with their
confidence and data status, the research that names any of it, an honest
known/assumed/unknown, and the build contract.

It is **derived and printed, never committed.** A packet on disk would be a
second description of a Bet, going stale the moment the model moved — the same
reason `npm run research:brief` prints rather than writes.

Hand its output to whoever is building, together with `AGENTS.md`. That is the
whole handover; there is no chat summary to reconstruct.

### The brief can refuse, and usually should at first

The packet opens with a verdict, because a prototype tests a decision and a Bet
that has not named one cannot be built against without somebody inventing the
answer:

```text
## Is this ready to build?

**Not yet — do not start building.**
```

What it needs is the shape of the experiment, written in the Bet itself as five
optional sections. They are what the person accountable for the Bet approves,
and they are a canonical part of it rather than a note in a plan:

| Section | What it settles |
| --- | --- |
| `# Learning decision` | What somebody should be better able to decide after trying this. If no decision changes, there is no reason to build it yet. |
| `# Scope` | Who encounters it, at what moment, the thinnest path that tests the decision, and what is deliberately not represented. |
| `# Assumptions` | What the prototype assumes in order to run, kept apart from what the model claims. |
| `# Signals and safeguards` | The observable signal that would support or weaken the bet, and the harm to watch while looking for it. |
| `# Fidelity` | How real this needs to be, dimension by dimension, so polish has a stated reason. |

A Bet may also name `participant: <entity-id>` — the actor the experiment
studies, in a form the projection can link. `# Scope` still says which moment
and what path.

The readiness check is therefore mechanical rather than a matter of memory: the
brief names exactly which sections are missing and what each one is for, and a
Bet with a prototype underway and no learning decision says so on its own page
under **Where this is still open**.

### Refining the experiment is what re-opens the build

Readiness answers a question about the *bet*. Once something is built, there is
a second question about the *artifact*, and it is the one that goes stale: a
scope widened after the software was written leaves the prototype testing the
old question while `prototype.status: working` claims otherwise.

So a built prototype records the experiment it was checked against:

```yaml
prototype:
  status: working
  route: /prototypes/guided-first-caseload
  builtAgainst: deea66-943d88-f1a58e-127106-acd1c7
```

`npm run prototype:brief` prints that value; a **person** writes it, because it
says *somebody looked at both of these*. This is the same trust boundary the
research intake uses, for the same reason: **a machine can prove staleness; only
a person can assert conformance.** Nothing reads the prototype's source and
decides whether it implements a scope — that is semantics, which deterministic
tooling here does not resolve.

Refine any of the five sections and the stamp no longer matches. Validation says
which section moved and what to do:

```text
Stale prototype in content/bets/guided-first-caseload.md: # Scope changed after
the prototype was last checked against it, so prototype.status 'working' is
claiming something nobody has confirmed since.
```

and the packet turns that refinement into the brief for the next build — it
leads with what changed and hands over the new text verbatim:

```text
## Is this ready to build?

**The experiment moved.** Something is already built here, and one section has
changed since anybody last checked the software against it. What follows is what
to build *to* — the rest of the packet is unchanged and still applies.

### What changed

**Scope** — now reads: …
```

Two honest answers, and one dishonest one. Restamp if the software still tests
the refined section; drop `prototype.status` to `concept` if it does not.
Leaving it as it is is the only answer that is not available.

The check lives in `npm run validate:content`, not in the content loader.
Refining a bet must not make the repository unloadable — that would take down
the map, every record page, and the packet whose whole job is to explain what
changed.

If a section is unanswered, ask the person a focused question, narrow the
prototype to the answerable part, or defer it. Do not compensate by inventing
workflow, policy, clinical rules, or participant preferences — a guess written
here becomes something the built artifact makes look real.

## 2. Ask only decision-shaping questions

The agent should first recommend a complete narrow scope using the brief. Ask the
person only when an answer would materially change what is tested or make the
build unsafe or misleading. Group related questions at one checkpoint rather
than interrupting for every screen.

Good questions expose a concrete trade-off:

- “Is this meant to test whether clinicians want guidance, or how much control
  they need? I recommend testing control first because that is the Bet's open
  decision.”
- “May the participant revise the proposal before confirming, or is the
  recommendation intentionally take-it-or-leave-it?”
- “Is a realistic explanation of match quality necessary for this test, or
  should we label quality as out of scope rather than invent its calculation?”

Do not ask the person to choose framework details, component structure, spacing,
or other reversible implementation choices. Do not offer several broad concepts
when repository context supports one recommendation.

### Required human checkpoint

Before implementation, the person approves or corrects the same five things —
the learning decision, the participant and in-scope flow, the consequential
assumptions and exclusions, the observable signal and safeguards, and the
planned fidelity.

**That approval is a pull request against the Bet**, not a message in a
conversation. The five sections go into `content/bets/<id>.md` and are reviewed
like any other change, so the approval has the same history, provenance and
resistance to drift as everything else here — and the next person to open the
Bet can read what was agreed without asking anybody.

This is approval of the experiment's shape, not approval of every screen.
Implementation can then proceed self-directed until repository reality exposes
a new consequential decision.

## 3. Plan the thinnest honest flow

Describe the flow as participant actions and visible consequences before naming
screens. A useful prototype usually has:

1. **Situation** — enough context to understand why the participant is here.
2. **Choice** — the decision or action that embodies the Bet.
3. **System response** — immediate, understandable feedback using synthetic
   information.
4. **Revision or recovery** — a way to correct, decline, go back, or see what
   happens when the happy path does not hold, when that behavior affects the
   learning decision.
5. **Closure** — a terminal state that says what happened and what would happen
   next in a real system without pretending to perform it.

For each step, mark:

- the model context it represents;
- the assumption it introduces, if any;
- the participant question it helps answer; and
- the observation that would support, weaken, or complicate the Bet.

Include only the most consequential alternate path. A prototype need not model
every exception, but it must not make participant disagreement, refusal, or
correction impossible when those are central to the Bet.

## 4. Set fidelity from the learning need

Choose fidelity dimension by dimension rather than calling the whole artifact
“low” or “high.”

- **Content fidelity:** use realistic synthetic language only where wording is
  under review; otherwise use concise invented examples.
- **Interaction fidelity:** implement the choices and feedback needed to feel
  the consequential part of the flow; static supporting context is acceptable.
- **System fidelity:** fake responses locally and disclose the boundary. Never
  build production infrastructure to make a prototype convincing.
- **Visual fidelity:** use the repository design system so usability feedback is
  not dominated by accidental inconsistency, while avoiding polish unrelated to
  the learning decision.

Raise fidelity only when lower fidelity would cause the participant to answer a
different question. Exploration can proceed with explicit uncertainty; behavior
touching clinical safety, individual selection, matching policy, quality
attribution, access, or fairness needs stronger evidence and qualified human
review before it can be treated as more than a speculative interaction.

## 5. Build inside the repository contract

- Put the interaction at `app/prototypes/<bet-id>/page.tsx` and wrap it in
  `PrototypeShell`. Validation checks this: a declared route that renders
  without the shell is rejected, because it would show the interaction with
  none of the bet, problem or provenance around it. The check reads the source,
  so it proves the shell was invoked and no more.
- Add the route and truthful status to the canonical Bet. The shell derives the
  Bet, Problem, targets, Claims, Metrics, the approved experiment sections,
  provenance, and return paths; prototype components must not restate them.
  A reviewer standing in front of the software can therefore see what it is
  meant to settle without the builder narrating it.
- Keep synthetic fixtures close to the prototype and visibly fictional. Avoid
  realistic identifiers or details that could be mistaken for real people.
- Make every action operable with keyboard and touch, use the shared focus and
  motion rules, and test the narrowest supported phone and desktop views.
  `npm run test:responsive` visits *every* declared prototype route at both
  widths — record pages share a template, but each prototype is its own.
- Provide a genuine end state. Never imply that data was saved, a match was
  made, care was delivered, or a production action occurred.
- Add no analytics service. If the prototype needs observation aids, use visible
  state, a facilitator script, or a non-sensitive manual note template outside
  the runnable interaction.

The route is not the plan. Planning may change freely before the canonical Bet
declares a route; once declared, validation requires the implementation to
exist.

## 6. Review against a learning script

The review should let the participant act before being asked to explain. Use a
short script:

1. Give the situation and goal without describing the intended solution.
2. Ask the participant to complete the in-scope task while thinking aloud only
   if that method is useful.
3. Observe choices, hesitation, corrections, refusals, expectations, and the
   participant's interpretation of the outcome.
4. Ask what they believed the system did, what control or information was
   missing, and what they would do next.
5. Ask directly about the named safeguard or trade-off; do not infer its absence
   from silence.

Capture observations without names, contact details, health information, or
other identifying data. Separate:

- **observation:** what happened in the session;
- **interpretation:** why the team thinks it happened; and
- **implication:** what decision it may change.

One participant's reaction is not a validated Claim or a Metric result. It can
identify a usability defect, challenge an assumption, or motivate more
discovery.

## 7. Close the loop without automatic promotion

After review, classify each implication:

| Outcome | Next action |
| --- | --- |
| Interaction defect | Fix the prototype without changing the Bet, then rerun the relevant checks. |
| Scope clarification | Update the working plan; ask the person if it changes the approved learning decision or consequential assumptions. |
| Bet weakened, strengthened, or changed | Propose a canonical Bet change for human review; do not silently rewrite it in prototype code. |
| New or revised understanding of the failure | Propose a Problem change separately from any answer. |
| Something the session taught | Write it up as a handoff with a `session` source — see below — and decide it at `/review` like any other research. |
| Evidence needed | Add or use a research question with `npm run research:ask`, then follow the [research handoff workflow](research-workflow.md). |
| Accepted research affects the model | After a person's decision, use `/review/apply` to compose the canonical file or frontmatter and its `researchTrace`; apply that output through a separate model-change pull request. |
| Ready for production consideration | Record that conclusion outside this prototype workflow; it does not authorize production architecture or implementation. |

Update the prototype status only when it truthfully reflects the artifact:

- `not-started`: intent exists, but no interaction has been planned or built;
- `concept`: the interaction is being framed or is not yet a usable end-to-end
  path;
- `working`: the intended synthetic flow can be tried;
- `tested`: the working flow has been reviewed using the named learning script;
- `retired`: the artifact should remain as history but is no longer the current
  expression of the Bet.

`tested` describes an activity, not proof that the Bet is correct. Record what
was learned in a reviewable artifact appropriate to the implication; do not pack
session conclusions into the status field.

### Getting a session back into the model

A review session enters the same way public research does: as a handoff under
`research/`, decided by a person at `/review`. The source kind is `session`, and
its locator names what was observed rather than a URL it does not have:

```yaml
run:
  provenance:
    method: prototype-review
    context: Observations from a moderated session; no transcript.
sources:
  - id: source-session
    identity: session-guided-first-caseload-2026-08-14
    kind: session
    title: Guided First Caseload review session
    locator:
      bet: guided-first-caseload
      observedAt: 2026-08-14
      participants: Three clinicians new to the platform
    access: available
```

`participants` describes people **by their relationship to the system, never by
who they are.** "Three clinicians new to the platform" is a locator; a name, an
employer, or a contact detail is a leak, and this is a public repository.
`npm run scan:safety` catches the shapes of identifiers, and cannot catch a name
written as ordinary prose — that part is yours.

The bar stays where it was: one participant's reaction is a `reported`
observation at best. It can identify a usability defect, challenge an
assumption, or motivate discovery. Whether it changes what the model claims is
a reviewer's judgement, and the same gate applies to it as to everything else.

## Definition of done

A prototype change is ready for review when:

- it is linked to exactly one Bet and inherits its context through the
  projection;
- the approved learning decision and key assumptions are visible in the plan;
- the primary flow has situation, choice, response, and closure;
- consequential refusal, correction, or recovery is represented or explicitly
  excluded;
- all people and data are synthetic and the production boundary is honest;
- the interaction works at phone and desktop widths and meets the design-system
  interaction rules;
- repository validation passes; and
- the review script and possible next actions are clear enough that another
  contributor can learn from the artifact without the builder narrating it.

The goal is not autonomous product development. It is a self-directed learning
system with explicit human accountability: the repository supplies context, an
agent can carry the work forward, the prototype creates observable experience,
and a person decides what that experience is allowed to change.
