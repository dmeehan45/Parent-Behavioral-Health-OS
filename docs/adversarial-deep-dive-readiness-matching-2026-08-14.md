# Adversarial deep dive: readiness, matching, and the first care transition

**Review date:** 2026-08-14  
**Status:** decision packet; repository analysis only, not accepted research or canonical model truth  
**Focus:** clinician onboarding/readiness, family-patient matching, and the transition from an accepted match to continued care

## Executive conclusion

The earlier review separated administrative onboarding, match proposal, mutual acceptance, a first encounter, and continuation. That fixed a structural collapse, but it did not yet establish what makes any transition *good*.

The current model still has three consequential blind spots:

1. **Readiness is a presence check, not a demonstrated capability.** `become-match-ready` receives only a Clinician whose availability is defined, then asserts readiness when configuration, preferences, and availability are present. It does not represent freshness, comprehension, family-specific scope, support needs, correction, disagreement, or an accountable readiness decision.
2. **Matching begins after the hardest family work has already happened.** `propose-match` consumes a Family in `match-ready`, but no Step produces that state. Eligibility, need interpretation, affordability or coverage, urgency, family/patient roles, willingness, and the no-viable-option population remain outside the process.
3. **The existing clocks cannot diagnose the journey they summarize.** Time to first match has clinician and family as primary perspectives but starts only at clinician readiness. Time to first session is described from clinician readiness even though its decision says it diagnoses the accepted-match-to-encounter transition. Neither clock distinguishes waiting, work, rejection, expiry, constrained supply, or missing follow-up.

The next prototype should therefore not attempt to automate a readiness score or matching rank. The stronger first targets are:

- a **readiness review and correction experience** that makes uncertainty, freshness, and family-specific limits visible before a clinician receives proposals; and
- a **mutual match decision and recovery experience** that helps each party understand a proposal, decline safely, and preserve the reason needed for the next useful action.

These recommendations are provisional. Public-source research could not be completed in this environment, and no parent, clinician, operator, clinical, safety, equity, or privacy participant was interviewed. The packet ranks what to investigate and prototype; it does not authorize a Claim, Problem, Bet, Metric, or topology change.

## Method and evidence labels

This pass used:

1. a boundary audit of every current onboarding, matching, and care-initiation Step;
2. an actor-by-actor decision reconstruction independent of current Step names;
3. counterexample and recovery-path testing;
4. a measurement denominator, missingness, confounder, and misuse audit;
5. prototypeability and learning-value ranking.

Every conclusion uses one of four labels:

- **Repository observation:** encoded directly in the current files.
- **Inference:** a reasoned interpretation of repository observations.
- **Hypothesis:** plausible but requiring direct evidence or accepted research.
- **Accountable decision:** a choice only the reviewer can authorize.

Simulated family, patient, clinician, and operator perspectives generate questions. They are not lived-experience evidence.

## Boundary audit

### Onboarding and readiness

| Current Step | Decision or transformation currently represented | What is actually observable | Material ambiguity |
| --- | --- | --- | --- |
| `credential-verify` | professional and operating prerequisites are verified | Clinician moves `selected` → `verified`; Credential becomes `verified` | Which prerequisites, expiry, disagreement, correction, and who decides are unknown. |
| `configure-practice` | practice configuration becomes usable | Clinician moves `verified` → `configured`; Practice becomes `configured` | “Usable” is not defined for clinician, family, or operator, and no later Step consumes Practice. |
| `set-clinical-preferences` | matching preferences become available | Clinician moves `configured` → `preferences-defined` | Preference, clinical scope, exclusion, support need, and current willingness are not distinguished. |
| `establish-availability` | enough usable availability exists | Availability becomes `matchable`; Clinician becomes `availability-defined` | Minimum amount, time horizon, freshness, reservation, expiry, and family feasibility are unknown. |
| `become-match-ready` | proposed inputs are confirmed | presence of configuration, preferences, and availability; Clinician becomes `match-ready` | Presence is treated as readiness; no reviewer, comprehension check, family-specific constraint, defect, expiry, or return path exists. |

**Inference:** `match-ready` currently means “the configured fields exist,” not “this clinician is demonstrably able and willing to make a sound decision about an actual proposed family.”

**Counterexample:** a clinician can have verified credentials, saved preferences, and an open time slot while misunderstanding platform expectations, holding stale availability, needing support, or being unsuitable for the next family presented. The current state cannot distinguish these cases.

### Matching

| Current Step | Decision or transformation currently represented | What is actually observable | Material ambiguity |
| --- | --- | --- | --- |
| `propose-match` | platform presents a plausible pairing | match moves to `proposed` after receiving a ready Clinician and ready Family | No Step creates Family readiness; “plausible,” constraints, recommendation logic, constrained supply, and information boundaries are unknown. |
| `review-match` | family and clinician both accept | Match moves `proposed` → `accepted` | Independent decisions, order, reason codes, pressure, changed information, and disagreement are collapsed into one transition. |

**Inference:** the model represents mutual acceptance but not mutual *informed* choice. It also cannot see families who never receive a proposal, so an acceptance rate calculated from proposed matches would exclude the most access-constrained population.

### First care transition

| Current Step | Decision or transformation currently represented | What is actually observable | Material ambiguity |
| --- | --- | --- | --- |
| `plan-first-encounter` | accepted match becomes a planned appointment | Appointment becomes `planned` | Coverage, consent, urgency, scheduling burden, and other prerequisites are open questions. |
| `complete-first-encounter` | planned encounter occurs | Appointment becomes `completed` | Partial, clinically inappropriate, safety-escalated, and administratively completed encounters are not distinct. |
| `confirm-care-continuation` | both parties intend to continue | Care Relationship becomes `initiated`; Clinician becomes `active` | Family/patient disagreement, time of decision, next action, transition quality, and closure semantics are unresolved. |

**Inference:** the separation is directionally sound, but “completed” and “intend to continue” remain weak proxies for an appropriate first care transition.

## Actor decision atlas

### Clinician

| Moment | Decision the clinician may need to make | Minimum information hypothesis | Current representation | Failure or recovery question |
| --- | --- | --- | --- | --- |
| Verification | Can I satisfy and correct the stated prerequisites? | requirement, source, status, expiry, correction path | completion only | What happens when information is wrong, disputed, or expires? |
| Configuration | Is the practice setup usable for how I deliver care? | workflow, coverage context, support, consequences | configured/not configured | Can the clinician test or revise setup before a family is affected? |
| Scope and preference | Which needs am I able and willing to consider now? | scope, experience, modality, population, constraints, support | one preferences-defined state | Which inputs are hard constraints, preferences, uncertainty, or changeable support needs? |
| Availability | Can I realistically offer the proposed time and continuity? | current slots, cadence, capacity, other commitments | availability exists once | Who owns freshness and what happens when capacity changes? |
| Readiness review | Am I ready to receive and evaluate a real proposal? | unresolved defects, expectations, support, confidence, recency | fields are present | Can the clinician disagree, request help, or be ready only for some families? |
| Match review | Should I accept this proposed family? | sufficient need/context, scope fit, scheduling, coverage, support, uncertainty | mutual acceptance only | Can the clinician decline safely without gaming, penalty, or oversharing a reason? |
| First encounter | Is continued care appropriate, and under what next plan? | encounter information, family/patient goals, safety, fit, constraints | intent to continue | How are uncertainty, transfer, rematch, escalation, or no continuation represented? |

### Parent or caregiver

| Moment | Decision the parent may need to make | Minimum information hypothesis | Current representation | Failure or recovery question |
| --- | --- | --- | --- | --- |
| Enter matching | Is the family ready and able to consider care now? | goals, urgency, logistics, affordability/coverage, authority, preference | unproduced `family: match-ready` input | Who is excluded or delayed before a proposal appears? |
| Review proposal | Is this option understandable, feasible, and acceptable? | clinician explanation, fit rationale, cost/coverage, availability, alternatives, uncertainty | accept/decline collapsed | Can the parent ask, correct, defer, or decline without restarting? |
| Plan encounter | Can the family complete the prerequisites and attend? | schedule, cost, consent, technology/location, expected work | planned appointment | Does failure trigger useful support or look like family dropout? |
| After encounter | Does continuing seem appropriate and feasible? | clinician recommendation, family/patient experience, next action, alternatives | intent to continue | Can the parent express concern or seek another option without damaging access? |

### Patient distinct from parent

The current Patient Entity is absent from every Step in scope. The following are hypotheses, not requirements:

- the patient may have preferences, understanding, goals, or willingness distinct from the parent;
- the patient may be the source of some information while the parent is the source of other information;
- age, context, care type, and authority may change whose agreement or participation matters;
- “family accepted” cannot safely be assumed to mean every relevant participant agreed.

**Required input:** lived experience, family-systems expertise, clinical leadership, and qualified privacy/records review before technical permissions or universal consent rules are modeled.

### Practice-management platform

| Moment | Platform decision | Legitimate product role hypothesis | Principal overreach risk |
| --- | --- | --- | --- |
| Readiness | whether prerequisites are complete enough to permit proposals | show state, freshness, uncertainty, correction, and support routes | presenting administrative completion as clinical competence |
| Eligibility | which clinician-family pairs are not viable | apply transparent operational and accepted clinical constraints | encoding undocumented exclusions or hiding constrained supply |
| Recommendation | which viable options to surface and why | reduce search burden while preserving meaningful choice | treating a ranking proxy as appropriateness or steering to easiest cases |
| Recovery | what action follows decline, expiry, or failed initiation | preserve reason and avoid repeated work | pressuring acceptance or silently recycling the same bad option |
| Measurement | which process needs investigation or redesign | diagnose access, burden, defects, and recovery | ranking individuals, causal attribution, or optimizing incomplete denominators |

## Readiness hypothesis model

Readiness should be investigated as a time-bound conclusion over several dimensions, not assumed to be one permanent ladder state.

| Dimension | Candidate evidence | Expiry or change condition | Observable defect if wrong | Counter-hypothesis / attribution limit | Prototypeable behavior |
| --- | --- | --- | --- | --- | --- |
| Administrative | required records verified and current | credential or required record changes/expires | downstream manual block or correction | later care outcomes do not validate paperwork quality | show status, source, freshness, and correction path |
| Configuration | required practice settings can support intended workflow | settings, coverage participation, modality, or tools change | support work, failed scheduling, unusable workflow | a defect may belong to platform design, not clinician readiness | guided test and exception review |
| Scope | clinician has represented relevant scope and limits | experience, supervision, support, population, or willingness changes | repeated family-specific declines or inappropriate proposals | decline may reveal bad intake or constrained supply, not poor clinician quality | express hard limit, preference, uncertainty, and support need separately |
| Capacity | usable appointment supply and continuity exist | slot reserved, schedule changes, caseload changes, time passes | stale proposal, delayed session, inability to continue | family availability and demand timing are separate | freshness confirmation and capacity reservation preview |
| Comprehension | clinician understands the next decisions and consequences | workflow or policy changes; long delay before first use | avoidable errors, repeated help requests, correction work | help-seeking can indicate healthy caution, not failure | scenario-based review and in-context explanation |
| Support | known support needs have an owner and path | need changes or owner fails to respond | hidden operator repair or clinician dropout | needing support is not lack of competence | visible unresolved item and escalation owner |
| Family-specific fit | clinician can responsibly consider this family under current facts | needs, risk, goals, coverage, availability, or context change | decline, rematch, failed initiation, escalation | never valid as a permanent clinician readiness property | proposal-specific confirmation with uncertainty |

### Readiness conclusion states to investigate

Do not add these states canonically without evidence. They show distinctions the current binary hides:

- **information incomplete** — a required input is absent;
- **information stale** — a once-valid input needs reconfirmation;
- **review needed** — facts exist but require judgment;
- **support needed** — readiness may be achievable with an owned intervention;
- **generally ready** — can receive some proposals, not a universal declaration of fit;
- **proposal-specific uncertainty** — only resolvable against a family;
- **paused** — temporarily not receiving proposals without losing history.

### Readiness falsification agenda

A proposed readiness definition should be considered weak if it cannot predict or explain any outcome closer than long-term retention. Candidate near-term defects to investigate include:

- required manual repair before a proposal can be evaluated;
- clinician reports not understanding the next decision;
- stale or unusable availability;
- repeated proposals outside represented scope;
- preventable scheduling or configuration failure;
- unresolved support need;
- clinician cannot explain or correct the information used for eligibility;
- readiness is declared but no family can feasibly use the capacity.

None of these alone proves onboarding caused the defect. The event needs a reason, timing, and competing explanation.

## Matching mechanism model

### Distinct mechanisms

1. **Family readiness:** determine whether matching is the right next action and which constraints or unresolved needs must travel with it.
2. **Clinician freshness:** reconfirm capacity, scope, and relevant uncertainty close enough to proposal time.
3. **Eligibility:** exclude only pairs that violate explicit, reviewable constraints.
4. **Viable-set disclosure:** represent when no option or only constrained options exist; never turn absence of supply into family inappropriateness.
5. **Recommendation:** surface one or more viable options with a bounded explanation and uncertainty.
6. **Independent review:** give family and clinician appropriate, non-identical information and a way to correct, question, defer, accept, or decline.
7. **Mutual acceptance:** record both decisions and their timing without treating acceptance as started care.
8. **Initiation:** resolve prerequisites, plan and complete the first encounter, and make continuation or transition explicit.
9. **Recovery:** use the reason and changed facts to choose reproposal, new intake/assessment, support, rescheduling, transfer, escalation, pause, or closure.

### Failure and recovery taxonomy

| Outcome | What it means | It must not be silently counted as | Minimum reason/context needed | Candidate next actions |
| --- | --- | --- | --- | --- |
| no viable option | current supply cannot satisfy required constraints | family rejection or matching success denominator exclusion | binding constraints, time, considered supply | wait/support, broaden with informed choice, external route, reassess later |
| proposal not understandable | party lacks information needed to decide | decline or indecision | missing/unclear information and actor | clarify, correct, disclose uncertainty |
| family declined | family did not accept this proposal | clinician quality failure | voluntary reason if offered, burden, alternatives | revise constraints, new proposal, pause, external route |
| clinician declined | clinician did not accept this proposal | family unsuitability or clinician failure | scope/capacity/support/other category without unnecessary sensitive detail | refresh inputs, support, new proposal, reassess eligibility |
| proposal expired | no current mutual decision | rejection | freshness and response timing | confirm interest, refresh, repropose |
| accepted but prerequisites failed | both accepted but encounter could not be planned | successful match or family dropout | coverage, consent, schedule, access, technology/location, other blocker | resolve, rematch, external route, close |
| planned but not completed | appointment did not occur | started care | cancellation/no-show/clinical/technical category and actor-neutral context | reschedule, support, rematch, close |
| completed but no continuation | encounter occurred without ongoing relationship | failed matching by default | fit, preference, clinical disposition, external transition, unknown | rematch, transfer, appropriate closure, escalation |
| early rematch | continuation was attempted but changed | simple retention failure | time, initiating actor, reason, care/safety context | rematch, transfer, review system defect |
| outcome unknown | follow-up is absent or unusable | success, failure, or neutral missingness | last observable event and follow-up attempts | improve follow-up; preserve as unknown |

### Constrained-supply truth test

A matching system is not credible if it reports only the quality of proposals it chose to make. At minimum, analysis needs to keep visible:

- families entering the matching decision;
- families receiving no proposal;
- time spent with no viable option;
- constraints relaxed and by whom;
- families leaving before proposal;
- proposals by family and clinician characteristics only where ethically, legally, and statistically appropriate;
- declines, expiry, acceptance, initiation, and unknown outcomes;
- work and burden shifted to families, clinicians, and operators.

This is a measurement requirement, not a recommendation to collect sensitive attributes indiscriminately. Qualified review must determine what can and should be observed.

## Metric interpretation protocol

No thresholds are proposed. The point is to define what would have to be true before a number could inform a decision.

| Current or candidate measure | Permitted diagnostic use | Denominator / unit | Start and horizon | Missingness | Principal confounders | Required balancing signals | Prohibited inference |
| --- | --- | --- | --- | --- | --- | --- | --- |
| time to activation | locate administrative waiting between selection and general readiness | every selected clinician, including withdrawal and unresolved cases; report terminal state | selection → readiness or terminal disposition | unresolved and withdrawn remain visible | verification complexity, clinician availability, platform backlog, support needs | clinician effort, defects, comprehension, rework | faster means more ready or better clinician |
| clinician effort to activate | find work imposed on clinicians | all selected clinicians; active time plus correction/help effort, not only completers | selection → readiness/exit, with work episodes | non-completers and unreported work separate | prior platform familiarity, complexity, support use | readiness defects, operator effort, experience | lower effort always means better onboarding |
| readiness defect rate | identify inputs or support that fail near first use | every readiness declaration; defect event taxonomy | declaration → defined early-use window | clinicians receiving no proposal stay distinct | demand volume, case mix, match quality, platform change | burden, access, support, severity | all downstream problems were caused by onboarding |
| time to first accepted match | diagnose waiting after each party is actually ready for matching | two cohorts/clocks: ready families and ready clinicians; include no-proposal and terminal cases | actor readiness → acceptance or terminal state | censoring and unresolved states explicit | constrained supply/demand, preferences, coverage, availability, urgency | no-viable-option time, differential wait, declines, burden | speed implies fit or mutual benefit |
| proposal acceptance | examine proposal decision friction | every proposal, with separate family and clinician decisions | proposal → decision/expiry | expiry and no response are not decline | option set, information shown, scarcity, pressure, stale facts | no-proposal population, continuation, rematch, burden | high acceptance proves good recommendation |
| time accepted match to first encounter | diagnose initiation blockers | every accepted match | mutual acceptance → completed encounter or terminal state | unresolved accepted matches remain visible | scheduling, coverage, consent, urgency, family/clinician availability | burden, cancellations, access, appropriateness | short time proves quality or continuation |
| first-encounter continuation disposition | locate transition and recovery needs | every completed first encounter | encounter → explicit disposition within defined short window | unknown separate from no continuation | care type, clinical recommendation, preference, external transition | experience, appropriateness, rematch/transfer, safety | continuation is always success; non-continuation is failure |
| early rematch/transition | detect recoverable mismatch or changed context | every initiated Care Relationship | initiation → agreed early window | lost follow-up separate | changing needs, clinician availability, coverage, clinical disposition | family experience, safety, continuity, appropriate closure | clinician or matching caused every rematch |
| operator effort per resolved transition | find manual repair and scaling constraints | transition attempts, not only successful activations | event-specific work window | hidden/unlogged work acknowledged | exception complexity, tooling, staffing | participant effort, rework, access, quality | shifting work to family/clinician is efficiency |
| selection accuracy | only test a predeclared selection signal against an independently justified construct | predeclared eligible/selected comparison with justified unit | selection → valid observation horizon | missing outcomes and uneven follow-up modeled | case mix, matching, support, access, measurement availability | equity, access, uncertainty, false negatives | a global clinician quality score or causal selection effect |

### Clock inconsistency requiring an accountable correction

The current `time-to-first-session` Metric says its decision is where an **accepted match** fails to become a completed encounter, while its prose starts the clock at **becoming match-ready**. These are different questions. The deeper model recommends the accepted-match clock for initiation diagnosis and a separate readiness-to-match clock for marketplace waiting. Correcting canonical content should occur in the model-change PR after review rather than being smuggled through this research packet.

## Misuse and gaming register

| Signal or mechanism | Intended use | Plausible misuse or gaming | Who may be harmed | Guardrail before automation |
| --- | --- | --- | --- | --- |
| readiness completion | identify unresolved prerequisites | declare readiness early; avoid clinicians needing support; equate help with failure | clinicians needing accommodation; families receiving unusable capacity | separate presence, freshness, understanding, support, and proposal-specific fit |
| onboarding time | find waiting | lower threshold or move work downstream | clinicians, families, operators | pair with defects, rework, effort, comprehension, and later blockers |
| clinician decline | learn why proposals fail | pressure acceptance or penalize appropriate scope decisions | clinicians and higher-need families | voluntary bounded reasons; monitor proposal quality and constrained supply first |
| family acceptance | reduce decision friction | steer families, limit alternatives, or make declining costly | families/patients | meaningful decline/correction path; disclose alternatives and uncertainty |
| no viable option | expose access constraints | relabel unmet need as inappropriate demand | families with uncommon, costly, or complex needs | keep no-option population in access reporting; governance over exclusions |
| recommendation rank | reduce search burden | optimize easiest acceptance or highest revenue proxy | families, clinicians, equity groups | explicit permitted objective, constrained features, explanation, audit, fallback |
| time to first encounter | locate operational delay | prioritize easy cases or premature encounters | higher-need or constrained families | stratified access review and appropriateness/continuation balances |
| continuation | understand transition | pressure ongoing care or punish appropriate transfer/closure | families, patients, clinicians | disposition taxonomy; appropriate transition is not failure |
| rematch | identify recovery work | blame party or hide early mismatch by delaying state change | families and clinicians | reason, timing, voluntary attribution, unknown state, review of system factors |
| selection accuracy | test hiring hypothesis | rank clinicians on biased, sparse, case-mix-confounded outcomes | clinicians and higher-need families | do not operationalize until construct, samples, missingness, equity, and use governance are accepted |
| operator effort | reduce manual work | shift burden to clinicians/families or leave problems unresolved | clinicians and families | measure total participant effort, resolution, rework, and access |

## Candidate Problem portfolio

These are candidate framings for review, **not canonical Problems**. Scores are directional (1 low, 5 high) and expose the ranking logic; they are not empirical estimates.

| Rank | Candidate Problem | Harm / lost value | Breadth | Uncertainty | Prototypeability | Learning value | Why it ranks here |
| ---: | --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | A clinician can be declared match-ready because fields are present while uncertainty, stale capacity, misunderstanding, or support needs remain invisible. | 4 | 4 | 4 | 5 | 5 | Directly precedes current prototype focus and can be tested without claiming clinical competence. |
| 2 | A family and clinician can receive a proposal without enough understandable, current, actor-appropriate information to make an informed independent decision. | 5 | 4 | 5 | 5 | 5 | Central matching experience with a clear end-user interaction and strong counterexamples. |
| 3 | When a proposal or first transition fails, the system does not preserve enough reason and changed context to choose the next useful action without repeated work. | 4 | 5 | 4 | 5 | 5 | Crosses decline, expiry, cancellation, non-continuation, burden, and operational repair. |
| 4 | Families who receive no viable proposal disappear from matching quality measures, making constrained access look better than it is. | 5 | 3 | 4 | 3 | 5 | High equity/access importance; needs operational denominator and governance before a UI prototype proves much. |
| 5 | Current time metrics combine different actor clocks and terminal states, so they cannot locate whether readiness, supply, choice, or initiation caused waiting. | 3 | 5 | 2 | 3 | 4 | Mechanically evident and important for learning, but primarily an instrumentation/analysis problem. |
| 6 | Match acceptance and care continuation can be optimized as success even when choice was constrained or transition elsewhere was appropriate. | 5 | 4 | 5 | 3 | 4 | Material incentive risk; needs direct and clinical evidence before product behavior is chosen. |
| 7 | Clinician-level selection or quality feedback can encode case mix, matching, support, and missing follow-up as individual performance. | 5 | 3 | 5 | 1 | 4 | High harm, but deliberately not an early prototype target; requires measurement and governance work. |
| 8 | Parent, patient, and caregiver participation are collapsed into “family,” so matching acceptance may hide disagreement or changing authority. | 5 | 3 | 5 | 2 | 4 | Foundational, but qualified and lived-experience input is needed before prototyping a universal interaction. |

### Falsification prompts for the top three

**Candidate Problem 1 would weaken if:** observed onboarding shows presence checks closely precede first use, clinicians reliably understand and correct inputs, availability is fresh, support needs are visible, and readiness defects are rare or caused elsewhere.

**Candidate Problem 2 would weaken if:** families and clinicians consistently report having sufficient, understandable, current information; declines are low-burden and safe; explanations do not change decisions; and failures are dominated by supply rather than decision support.

**Candidate Problem 3 would weaken if:** current recovery already preserves structured reason and changed facts, repeat explanation is rare, and operators can reliably route the next action without additional family or clinician burden.

## Prototype recommendations

### First recommendation: readiness review and correction

**Candidate Problem:** readiness is declared from presence while freshness, understanding, uncertainty, and support are invisible.

**User and moment:** a clinician immediately before receiving family proposals, with an operator/support perspective available in the test.

**Smallest interaction:**

1. summarize the inputs the system proposes to rely on;
2. distinguish verified fact, stated preference, hard constraint, uncertainty, and expiring information;
3. let the clinician confirm, correct, say “not sure,” or request support;
4. show what kinds of proposals the current information would permit;
5. make unresolved items and their owner visible;
6. avoid a numerical readiness score.

**Riskiest assumptions:** clinicians can meaningfully review these distinctions; review improves confidence or catches material defects without excessive burden; proposal consequences can be explained without pretending to predict clinical fit.

**Support evidence:** comprehension, correction, stale input, or unresolved support is surfaced in realistic scenarios.

**Kill evidence:** clinicians cannot interpret the distinctions, defects are not material, the interaction duplicates existing work, or it increases burden without changing a decision.

**Must not imply:** clinical competence certification, universal family fit, legal compliance, or algorithmic approval of a clinician.

### Second recommendation: mutual match decision and recovery

**Candidate Problem:** each party lacks an understandable, independent decision and failures do not preserve enough context for recovery.

**User and moment:** parent/caregiver and clinician reviewing the same proposed pairing through appropriately different views.

**Smallest interaction:**

1. show why the pair is being considered and what remains uncertain;
2. separate requirements from preferences and constrained-supply compromises;
3. let each party ask/correct, accept, decline, or defer independently;
4. collect an optional bounded reason designed for routing, not blame;
5. show the next action after decline, expiry, or unresolved information;
6. preserve already supplied context rather than restarting.

**Riskiest assumptions:** an explanation reduces decision burden; safe decline reasons can improve the next action; showing uncertainty builds rather than reduces trust; the system can disclose enough without crossing information boundaries.

**Support evidence:** participants identify missing or wrong information, understand the proposal, decline without pressure, and see a sensible recovery path.

**Kill evidence:** users want different information than the model can safely expose, reasons do not change routing, choice is illusory under constrained supply, or the interaction creates pressure or oversharing.

**Must not imply:** clinical appropriateness, guaranteed availability/coverage, autonomous allocation, or that family and patient are always one decision-maker.

### Why not prototype a match score first

A score would force the team to choose features, weights, outcome labels, and permitted uses before it has valid definitions of readiness, family participation, constrained supply, match quality, missing follow-up, or attribution. It would make the least understood part of the system look the most certain.

## Evidence sequence

### Sequence 1 — repository and operational event definitions

**Output:** a real event dictionary and sample transition audit, using non-PHI synthetic or safely aggregated examples.

- define selection, readiness declaration, family matching entry, proposal, each party's decision, expiry, acceptance, planned encounter, completed encounter, continuation disposition, rematch/transfer/closure, and unknown;
- identify which timestamps and reasons exist today;
- test whether actor clocks and terminal states can be reconstructed;
- measure missingness and invisible manual repair before proposing targets.

**Owner needed:** platform product/operations/data.  
**This pass cannot complete it:** the repository contains no operational event samples or data availability evidence.

### Sequence 2 — clinician readiness discovery

**Output:** observed decision journey, readiness defect taxonomy, and prototype test scenarios.

- interview or observe clinicians with recent onboarding experience;
- sample smooth, support-heavy, delayed, and abandoned onboarding;
- ask what each field meant, what changed, what required correction, and what they expected before the first proposal;
- observe actual proposal decisions rather than only opinions about onboarding;
- include operator repair work and disagreements.

**Owner needed:** clinician research plus operations.  
**Do not infer:** that help requests or additional support indicate low clinician quality.

### Sequence 3 — family/patient matching discovery

**Output:** information-needs map, constrained-choice cases, decline/recovery journey, and prototype test scenarios.

- sample families who received no proposal, declined, accepted, failed to initiate, rematched, and continued;
- separate parent/caregiver and patient perspectives where appropriate;
- investigate affordability/coverage, scheduling, language, accessibility, technology, modality, preference, trust, and urgency;
- test what information supports a decision, what is confusing, and what feels unsafe or intrusive;
- record repeat explanation and recovery burden.

**Owner needed:** parent/patient research with appropriate safeguards and family-systems input.  
**Do not infer:** that completed matches represent the population seeking help.

### Sequence 4 — qualified review

**Output:** explicit constraints, unresolved risks, and allowed prototype claims—not a production compliance design.

- clinical quality and safety review of readiness, fit, first-encounter, deterioration, and escalation boundaries;
- equity/accessibility review of exclusions, constrained supply, choice, measurement, and differential burden;
- family-systems and qualified privacy/records review of roles, authority, disclosure, conflicting accounts, correction, and changes over time;
- measurement review of unit, horizon, missingness, case mix, sample size, and permitted use.

### Sequence 5 — public research intake

**Output:** separate source-backed handoffs answering `define-onboarding-quality` and `define-matching-quality`, generated review packets, and named-person decisions.

Public-source retrieval was attempted through the configured web tool and direct NCBI access. Both were blocked by the environment (HTTP 401 and proxy 403 respectively). No source identities or findings were invented, and the queued questions remain open. A later connected run should execute the existing briefs and use the repository's handoff contract.

### Sequence 6 — prototype learning

**Output:** test report tied to one candidate Problem and explicit kill criteria.

1. test comprehension and correction before visual polish;
2. include failure and constrained-supply scenarios, not only a successful path;
3. capture decision changes, confusion, burden, trust, and requests for human help;
4. avoid outcome claims from a usability test;
5. revise the Problem before expanding the Bet.

## Decision queue

### Decisions the accountable reviewer can make now

1. Accept or revise the top candidate Problem order.
2. Authorize readiness review/correction as the first prototype investigation.
3. Authorize mutual match decision/recovery as the second investigation, not a stacked dependency.
4. Confirm that a match score/ranking prototype is deferred until input, outcome, fairness, and permitted-use questions are stronger.
5. Decide whether accepted-match-to-first-encounter replaces the current canonical `time-to-first-session` clock after a separate model-change review.

### Direct evidence required

- what clinicians actually understand, correct, and need support with;
- which readiness inputs expire or fail at first use;
- what families, patients, and clinicians need to decide on a proposal;
- who receives no proposal and why;
- what declines, failed initiation, rematching, and recovery cost each actor;
- whether proposed prototype interactions change understanding or decisions.

### Qualified review required

- clinical appropriateness and safety boundaries;
- deterioration and escalation pathways;
- family/patient/caregiver roles and changing authority;
- appropriate information disclosure and correction;
- accessibility/equity implications and justified observation of differential access;
- valid quality constructs, attribution, uncertainty, and permitted metric uses.

### Operational data required

- event and timestamp availability;
- denominator completeness;
- missingness and follow-up patterns;
- constrained-supply and no-proposal population;
- reason capture quality;
- manual repair and work shifted across actors;
- enough sample and case context for any comparative analysis.

## Completion boundary

This pass goes deeper than the earlier repository review by turning broad gaps into falsifiable readiness and matching models, a recovery taxonomy, interpretable metric contracts, misuse risks, ranked candidate Problems, and two bounded prototype recommendations.

It does **not** complete public research, stakeholder evidence, event validation, causal analysis, clinical/safety review, privacy/authority review, or canonical promotion. Treating those as complete would create exactly the false confidence this pass is intended to prevent.
