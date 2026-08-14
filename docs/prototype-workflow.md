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

## 1. Assemble a prototype brief

Start from repository state, not a chat summary. Read:

- the Bet record's **Where this is still open** invitations; these are derived
  from the live projection and expose missing prototypes, weak evidence, and
  unmeasured decisions without creating another source of truth;
- the Bet's `# Bet` and `# Questions`, authority, confidence, linked Claims,
  Metrics, and prototype status;
- its linked Problem, including impact and open questions;
- the Problem's targeted Stages and Steps, including roles, entities, rules,
  transitions, exceptions, and incomplete fields;
- linked Metric perspectives, decision owner, and decision informed;
- accepted research traces and relevant prior research briefs;
- the design system, current prototype shell, and any interaction patterns that
  already exist.

Record the result as a short working brief in the implementation plan. It should
contain these fields:

| Field | What it means |
| --- | --- |
| Bet | The one proposed intervention being made concrete. |
| Problem and system context | The failure and affected flow inherited through the model. |
| Learning decision | What a reviewer should be better able to decide after using or observing the prototype. |
| Participant and moment | Who encounters the interaction, and at what point in the flow. |
| In-scope path | The thinnest end-to-end path needed to test the decision. |
| Explicitly out of scope | Adjacent workflows and production behavior that will not be represented. |
| Known / assumed / unknown | Three separate lists so assumptions cannot masquerade as canonical facts. |
| Success and safeguards | Observable signals, linked Metrics where applicable, and harms or trade-offs to watch. |
| Fidelity | The minimum realism needed in content, interaction, and system response. |
| Review method | Who will try it, what they will do, and how observations will be captured without sensitive data. |

The brief is a derived planning artifact, not a new model primitive. Do not copy
it into React components and do not add a second canonical description of the
Bet.

### Readiness check

A Bet is ready to prototype when all of these are answerable:

- Which decision will this prototype inform?
- Who is the participant, and what are they trying to accomplish?
- What is the smallest flow that makes the intervention and its consequence
  understandable?
- Which uncertainties are safe to represent as labelled prototype assumptions?
- Which success signal and balancing risk will the review watch?

If one is unanswered, either ask the person a focused question, narrow the
prototype to the answerable part, or defer it. Do not compensate by inventing
workflow, policy, clinical rules, or participant preferences.

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

Before implementation, the person approves or corrects:

1. the learning decision;
2. the participant and in-scope flow;
3. consequential assumptions and exclusions;
4. the observable success signal and safeguards; and
5. the planned fidelity.

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
  `PrototypeShell`.
- Add the route and truthful status to the canonical Bet. The shell derives the
  Bet, Problem, targets, Claims, Metrics, provenance, and return paths; prototype
  components must not restate them.
- Keep synthetic fixtures close to the prototype and visibly fictional. Avoid
  realistic identifiers or details that could be mistaken for real people.
- Make every action operable with keyboard and touch, use the shared focus and
  motion rules, and test the narrowest supported phone and desktop views.
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
