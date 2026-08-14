# Adversarial review of the current system map

**Review date:** 2026-08-14  
**Review object:** the canonical model under `content/` at this repository revision  
**Purpose:** expose questionable boundaries, unsupported linkages, missing mechanisms,
and evidence needs before the team treats the map as an answer.

## Executive conclusion

The current artifact is a coherent early model of **clinician acquisition and
activation for a care marketplace or practice platform**. It is not yet a coherent
model of an EHR used by clinicians focused on parents.

That conclusion is about the shape of the artifact, not the quality of its intent.
Of 14 Steps, 12 describe clinician supply or onboarding. The parent/family never
appears as a Step input or output. The patient and appointment Entities are never
transformed. Matching, Care Initiation, and Quality & Outcomes have no Steps even
though the map depends on all three. The only detailed process path jumps from
`become-match-ready` directly to `first-successful-family`, both inside Clinician
Onboarding, bypassing the separate Matching and Care Initiation Stages.

The review therefore recommends **neither polishing the existing funnel nor
immediately replacing it**. The first decision is the product boundary: is this a
model of an EHR, a care-delivery operating system, a marketplace, or a business
system containing all three? Until that is explicit, the map will continue to mix
different kinds of Stages and optimize for whichever actor happens to be most
detailed.

The most consequential findings are:

1. **The title and the modeled work disagree.** EHR-defining work—assessment,
   clinical formulation, care planning, documentation, communication, consent,
   safety, measurement, and transitions—is absent.
2. **The topology is asserted more strongly than the process model supports.** Six
   of eight Stages have one or zero Steps, and several Stage edges have no modeled
   carrier or handoff.
3. **The parent is currently a source of demand, not a participating actor.** This
   is especially risky for a product whose differentiation is focus on parents.
4. **The model conflates administrative activation with started clinical care.**
   `first-successful-family` creates an accepted Match and initiated Care
   Relationship without representing family assessment, consent, scheduling, a
   clinical encounter, or the separate Stages meant to own those changes.
5. **The evidence layer is too thin to close the feedback loops it draws.** Both
   Claims are low-confidence author hypotheses, all seven Metrics have unknown data
   status, and none measures parent experience, clinical change, safety, access
   equity, continuity, or documentation burden.

These are useful discoveries at this stage. They show where to investigate rather
than which fields to fill.

## Method and evidence discipline

This review used four passes:

1. inventory the model actually encoded in `content/`;
2. reconstruct a minimum care-record system from actors, decisions, state changes,
   and failure paths without relying on current Stage names;
3. challenge the result through distinct perspective lenses;
4. audit every current Stage edge, material Step handoff, Claim, and Metric.

The review uses these labels:

- **Repository observation:** directly visible in canonical files.
- **Inference:** a reasoned interpretation of those files; it may be wrong.
- **Hypothesis:** a proposition requiring research or operational data.
- **Product decision:** a normative choice only the accountable team can make.

The perspective passes below are simulated critiques, not interviews. They are a
way to generate questions and counterexamples. They must not be represented as
parent, clinician, legal, safety, or compliance evidence.

External research was not incorporated in this pass because network access was
unavailable. That limitation is deliberate in the findings: common domain
expectations are framed as research questions, not validated facts. Any later
source-backed work should enter through the repository's research handoff process.

## Inventory: what the map currently emphasizes

| Primitive | Count | Material observation |
| --- | ---: | --- |
| Stages | 8 | The set mixes demand generation, workforce supply, care delivery, outcomes, and business growth. |
| Steps | 14 | 5 are in Clinician Supply, 7 in Clinician Onboarding, 1 in Practice Operations, and 1 in Retention & Growth. |
| Entities | 11 | Only Clinician declares a state model. Family, Patient, Appointment, Match, and Care Relationship do not. |
| Claims | 2 | Both are low-confidence, proposed, author-sourced hypotheses. |
| Metrics | 7 | All have unknown data status; six optimize speed, effort, yield, or selection. |
| Problems | 1 | It concerns clinician productivity after onboarding. |
| Bets | 1 | It proposes guiding a clinician's first caseload. |

Stage coverage is uneven:

| Stage | Steps | What is modeled |
| --- | ---: | --- |
| Family Demand | 0 | A summary and exit conditions only. |
| Clinician Supply | 5 | A connected candidate funnel from stated supply need through selection. |
| Clinician Onboarding & Activation | 7 | A connected administrative funnel ending in a first family. |
| Matching | 0 | Acceptance is asserted at Stage level. |
| Care Initiation | 0 | First session and intent to continue are asserted at Stage level. |
| Practice Operations | 1 | A clinician moves from active to establishing. |
| Quality & Outcomes | 0 | Observability and feedback are asserted at Stage level. |
| Retention & Growth | 1 | A clinician and caseload become sustaining/sustainable. |

This is not merely incomplete detail. The populated areas determine what the map
can currently reason about: clinician throughput, not the clinical work or parent
experience the proposed EHR exists to support.

## First-principles reconstruction

Starting without the current Stage names, a parent-focused clinical record system
would at minimum need to answer the following questions. These are candidate
domains for investigation, not proposed canonical Stages.

### Actors and outcomes

- **Parent or caregiver:** understand the care plan, contribute observations,
  coordinate action outside sessions, control appropriate sharing, and experience
  less—not more—administrative and emotional burden.
- **Child or other patient:** receive appropriate, safe, continuous care while
  retaining rights and voice that may not be identical to a parent's.
- **Clinician:** form and revise clinical judgments, deliver care, coordinate with
  others, document defensibly, recognize risk, and sustain a workable practice.
- **Other caregivers and care-team participants:** contribute or receive the right
  information without assuming that every family member has identical authority or
  goals.
- **Practice operator:** make care accessible and reliable without intruding into
  clinical decisions or requiring invisible manual repair.

### Irreducible state changes

A clinical record must plausibly represent some version of:

1. a person or family seeking help;
2. identity, relationships, authority, and consent being understood;
3. needs and risks being assessed;
4. a clinician and family deciding whether and how to work together;
5. goals and a plan being agreed;
6. care being delivered and documented over repeated encounters;
7. progress, experience, safety, and context being observed;
8. the plan being revised, escalated, coordinated, transferred, or closed;
9. appropriate participants receiving usable information;
10. the record preserving why consequential decisions were made.

The present model represents parts of item 1, clinician readiness for item 4, and
high-level assertions about items 4, 6, and 7. It does not yet represent the
remaining transformations.

### Boundary test

Use this test before adding any domain:

- If the work is necessary to create, interpret, communicate, or safely use the
  longitudinal clinical record, it is likely EHR-relevant.
- If the work recruits labor, generates leads, sets marketplace liquidity, or
  optimizes company growth, it may be important to the business system but is not
  intrinsically EHR work.
- If the work enables reliable delivery around the record—scheduling, access,
  coordination, or billing—it may belong in a surrounding practice platform and
  should be labeled as such.

By this test, Clinician Supply and Retention & Growth need an explicit reason to
sit inside the same top-level map as clinical record work. The model may
intentionally be broader than an EHR, but that is a product decision to state, not
an ambiguity to preserve.

## Perspective dossiers

### Parent or caregiver lens

**Repository observation:** Family Demand describes creating and understanding
appropriate demand. No Step takes Family as an input, changes a Family state, or
names a parent/caregiver role.

**Adversarial questions:**

- Does “demand” describe a parent's job to be done, or only the organization's
  view of a family?
- Where can a parent explain goals, constraints, prior care, preferences, and what
  successful support would mean?
- Where are burden, trust, comprehension, participation, and continuity observed?
- What happens when caregivers disagree, a parent is also receiving care, or the
  parent's goals differ from the patient's?
- What information returns to the parent between sessions, and what action are
  they expected to take?

**Likely gap:** the model needs research into parents as participants in care and
the record, not merely demand supplied to matching.

### Clinician lens

**Repository observation:** the clinician has a detailed acquisition and
activation state ladder but no modeled clinical reasoning or documentation
lifecycle.

**Adversarial questions:**

- What decision does the clinician make after a family is matched?
- Where do assessment, formulation, care planning, progress notes, review, and
  closure occur?
- Which information is clinically useful rather than merely collectible?
- Which proposed automation would reduce work, and which would create review and
  correction work?
- Can the clinician understand why matching or selection signals were produced?

**Likely gap:** the artifact models becoming a clinician on the platform more
fully than being a clinician using the EHR.

### Clinical quality and safety lens

**Repository observation:** Quality & Outcomes has no Steps, quality definition,
quality measure, risk Entity, escalation path, or adverse-event path.

**Adversarial questions:**

- What makes care appropriate and safe before outcomes are observable?
- How are urgent risks recognized, communicated, acknowledged, and resolved?
- Can a good outcome measure distinguish clinician contribution from case mix,
  family context, time, and missing follow-up?
- What prevents feedback from punishing clinicians who serve higher-need families?
- Where are treatment changes and safety-critical decisions recorded?

**Likely gap:** quality is currently a desired feedback signal, not an operating
process with definitions, safeguards, or accountable decisions.

### Family-systems and care-team lens

**Repository observation:** Family and Patient are separate Entities but their
relationship, authority, states, and information boundaries are not modeled.

**Adversarial questions:**

- Who is the patient, who is the customer, and who is the participant in each
  kind of care?
- Can multiple parents, guardians, or households have different permissions and
  responsibilities?
- How does the clinician coordinate with prescribers, pediatricians, schools, or
  other supports without treating the family as one undifferentiated actor?
- How are conflicts, absent participants, and changes in authority handled?

**Likely gap:** the noun “family” currently hides relationships that may determine
both clinical work and record access.

### Practice-operations lens

**Repository observation:** Appointment exists but is unused. Practice Operations
contains only `reach-operating-rhythm`, which changes the clinician state after a
week without unresolved friction.

**Adversarial questions:**

- Where are referrals, scheduling, reminders, cancellations, rescheduling,
  waitlists, communication, and failed outreach represented?
- Who detects unresolved friction, and what action clears it?
- Does “without operator intervention” describe a good family experience, or only
  low operating cost?
- Which exceptions require human judgment rather than automation?

**Likely gap:** the Stage names a large domain but models one clinician ramp state,
leaving family-facing reliability and exception work invisible.

### Equity and accessibility lens

**Repository observation:** supply needs include population and place, but no
current Claim or Metric tests differential access, burden, match acceptance,
continuity, or outcomes.

**Adversarial questions:**

- Who becomes “inappropriate demand” because the available supply cannot serve
  them?
- Do matching and selection reproduce language, geography, disability, cultural,
  affordability, or technology barriers?
- Does optimizing candidate yield or speed improve aggregate results while
  worsening access for smaller populations?
- Which families vanish before the first modeled state?

**Likely gap:** equity is neither a state transition nor a balancing measure, so
the current optimization metrics could conceal exclusion.

### Privacy, records, and authority lens

**Repository observation:** the map does not represent consent, information
provenance, correction, disclosure, access, or differences between parent and
patient authority.

**Adversarial questions:**

- Whose statement is each piece of information, and who may see it?
- How are conflicting accounts preserved rather than overwritten?
- What happens when authority changes or a participant requests correction?
- Which information can be shared with another caregiver or care-team member?
- Can the system explain who used consequential information and why?

**Likely gap:** the record itself is absent as an Entity or lifecycle. Legal and
compliance conclusions require qualified review; this finding only identifies the
unmodeled decision space.

### Health-economics lens

**Repository observation:** the map optimizes candidate yield, activation time,
operator effort, clinician effort, selection accuracy, and caseload sustainability.

**Adversarial questions:**

- Whose value is primary when speed, match quality, clinician utilization, and
  parent choice conflict?
- Does a sustainable caseload for the clinician imply affordable, timely care for
  families?
- Who pays, what creates revenue, and can those incentives distort clinical or
  matching decisions?
- Does Retention & Growth describe improved continuity or business expansion?

**Likely gap:** the model lacks explicit value trade-offs and balancing measures,
so growth and clinical continuity can be mistaken for each other.

### Evidence-methods lens

**Repository observation:** the two Claims are low-confidence hypotheses, and all
Metrics have unknown data status.

**Adversarial questions:**

- What observation would falsify each Claim?
- What is the comparison group, time horizon, denominator, and missing-data rule?
- Can selection accuracy be separated from which cases clinicians later receive?
- Can retention be separated from compensation, demand, workload, support, and
  outside opportunities?
- Are feedback signals measurements of quality or proxies chosen because they are
  available?

**Likely gap:** the graph shows evidence relationships before it has an
identification strategy for learning from them.

### EHR and product-systems lens

**Repository observation:** the README describes an operational practice platform
and explicitly says the repository is not an EHR, while the motivating question
asks what a best-in-class EHR looks like.

**Adversarial questions:**

- Is the repository intended to model the entire business and care system in
  which an EHR sits, or the EHR product itself?
- Which Stages are context, which are product capabilities, and which are desired
  outcomes?
- Can a reviewer tell what the software owns versus what people or external
  systems do?
- Would the model remain intelligible if clinician recruiting were removed?

**Likely gap:** there is no explicit boundary primitive or view distinguishing the
business system, care-delivery system, and record/product system.

### Hostile and failure-mode lens

**Repository observation:** only `screen-candidates` declares a substantive
exception; most Steps have empty exception arrays, and Stage topology is almost
entirely a happy path.

**Adversarial questions:**

- What happens after rejection, disagreement, dropout, no-show, deterioration,
  incorrect data, failed matching, or loss of clinician capacity?
- Which decisions are reversible, and which require an audit trail?
- What if a metric is gamed, an automated suggestion is wrong, or no one acts on
  a signal?
- Can a family or clinician re-enter at an earlier state without duplicating or
  corrupting the record?

**Likely gap:** the present graph describes intended motion, not operational
resilience or recovery.

## Stage audit

| Stage | Boundary challenge | Provisional verdict |
| --- | --- | --- |
| `family-demand` | Treats the family primarily as demand and combines creating demand with understanding need. Neither is represented as a process. | **Split/reframe candidate.** Research help-seeking, intake, access, and family participation separately from demand generation. |
| `clinician-supply` | A coherent workforce funnel, but not intrinsically an EHR domain. Its exit combines a supply-plan outcome with an individual selection outcome. | **Retain as business context pending boundary decision.** Do not let its detail define the EHR. |
| `clinician-onboarding` | Mixes credentialing/configuration with activation, matching, and first care. Its last Step crosses at least two other Stage boundaries. | **Split or narrow.** End administrative onboarding at readiness; model subsequent care transitions in their owning domains. |
| `matching` | Has no Steps, inputs, failure modes, or representation of parent/clinician decisions. | **Retain only as an unvalidated domain.** Define what is matched, by whom, using which constraints, and how acceptance works. |
| `care-initiation` | Exit conditions require a first session and mutual intent, but no clinical, scheduling, consent, or encounter process produces them. | **Retain and investigate deeply.** It may contain assessment, fit confirmation, consent, planning, and early engagement rather than one event. |
| `practice-operations` | Broad summary but one Step about clinician ramp. It mixes care participation, scheduling reliability, family experience, and operator effort. | **Decompose candidate.** Separate longitudinal care operations from clinician ramp and business operations. |
| `quality-outcomes` | Mixes measurement, interpretation, quality judgment, and feedback. It assumes clinician-level attribution. | **Retain as a question, not a feedback mechanism.** Define constructs and decisions before edges. |
| `retention-growth` | Combines clinician retention, family retention, caseload sustainability, outcome observability, and growth. These can conflict. | **Split/reframe candidate.** Distinguish continuity, workforce sustainability, access/capacity, and business growth. |

No current Stage should be deleted on this review alone. The verdicts identify
decisions and research targets, not accepted model changes.

## Topology audit

“Carrier” means the entity, information, or decision that would have to cross an
edge for the relationship to be operational rather than illustrative.

| Current edge | Candidate carrier and mechanism | Counterexample / missing condition | Evidence status | Provisional verdict |
| --- | --- | --- | --- | --- |
| `family-demand` → `clinician-supply` (`informs`) | A quantified `supply-need` derived from assessed family needs changes sourcing priorities. | Unmet needs may be invisible; recruiting lead times may exceed demand visibility; demand may be shaped by current supply. | `state-supply-need` asserts the mechanism; no demand process or data exists. | **Qualify.** Plausible planning loop, not a one-way fact. |
| `clinician-supply` → `clinician-onboarding` (`flows_to`) | A selected Clinician enters verification and setup. | Selection and credential verification may overlap; rejection or expiry can return the clinician upstream. | Strongest supported edge: Step output/input states align. | **Retain with recovery paths.** |
| `clinician-onboarding` → `matching` (`enables`) | Preferences and Availability make a Clinician eligible for Match proposals. | Family readiness, consent, capacity freshness, and clinical constraints may still block matching. | `become-match-ready` supports clinician readiness only. | **Retain but narrow.** Readiness is necessary, not sufficient. |
| `family-demand` → `matching` (`supplies`) | An assessed, ready Family with constraints enters candidate matching. | No Family state, readiness definition, or Step produces this carrier. Demand volume is not a matchable family. | Unsupported in current process model. | **Research and model the carrier before retaining.** |
| `matching` → `care-initiation` (`flows_to`) | An accepted Match triggers scheduling, consent/fit confirmation, and a first encounter. | Acceptance may be provisional; either party can withdraw; operational and clinical prerequisites can fail. | Stage exit asserts acceptance; no Steps implement it. | **Retain as hypothesis; split the handoff.** |
| `care-initiation` → `practice-operations` (`flows_to`) | A started Care Relationship and care plan create recurring operational work. | One session may end care; a relationship may start before a completed encounter; no care plan is modeled. | `reach-operating-rhythm` consumes an active Clinician, not the relationship or family. | **Revise after defining care initiation.** |
| `practice-operations` → `quality-outcomes` (`informs`) | Encounters, plans, observations, measures, and experience data support quality review. | Operational activity is not inherently quality evidence; missing or selective follow-up biases the signal. | No modeled carrier; Appointment is unused. | **Replace vague `informs` with explicit future mechanisms.** |
| `quality-outcomes` → `retention-growth` (`influences`) | Interpreted progress and experience change continuation, support, or capacity decisions. | Retention can reflect access barriers, switching costs, or lack of alternatives rather than quality. | No retention or outcome measures support causality. | **Challenge causal direction; research.** |
| `quality-outcomes` → `clinician-supply` (`feedback_to`) | Validated quality patterns revise selection criteria or sourcing strategy. | Case mix, small samples, delayed outcomes, and selection effects can make clinician rankings misleading. | Explicit low-confidence Claim; no operational feedback Step. | **Keep only as a guarded hypothesis.** |
| `quality-outcomes` → `matching` (`feedback_to`) | Evidence about fit or outcomes changes future matching rules. | Historical patterns can encode inequity; quality may not be attributable to matching; feedback can reduce access for complex families. | No Claim, Metric, rule, or decision owner defines it. | **Do not operationalize; research fairness and validity first.** |

### Missing or hidden topology to investigate

- Care delivery needs a repeated loop among assessment, plan, encounter,
  observation, interpretation, and revision—not only a forward path to outcomes.
- Family and clinician decisions may return Matching to intake, supply planning, or
  closure after rejection or changed needs.
- Safety signals may bypass ordinary flow and trigger escalation, coordination, or
  transfer.
- Outcomes should plausibly feed care-plan revision before they inform recruiting
  or matching.
- Changes in clinician Availability should feed Matching continuously, not only at
  onboarding.
- Family access barriers and failed initiation should feed demand understanding and
  operational improvement.

## Step and state-handoff audit

### Supported chain with caveats

The Clinician Supply chain has explicit Clinician states:

`discovered` → `applicant` → `qualified` → `selected`.

Its principal weaknesses are not broken state references but decision quality and
loss visibility. Screening emits only `qualified`; screened-out candidates have no
state. Selection emits only `selected`; rejected, deferred, reconsidered, and later
invalidated decisions are absent. The supply need is not consumed or updated when
a clinician is selected, so the map cannot show whether a need was partially or
fully satisfied.

The administrative Onboarding chain also aligns mechanically:

`selected` → `verified` → `configured` → `preferences-defined` →
`availability-defined` → `match-ready`.

However, `selection-complete` makes no state change, and five Onboarding Steps
repeat their purpose verbatim as activity. That is honest evidence that the
activity is not understood; it should remain incomplete rather than be padded.
The review should ask whether `selection-complete` represents a real accountable
handoff or duplicates the boundary between Stages.

### Broken or semantically overloaded handoffs

1. **`become-match-ready` → `first-successful-family`:** the `next` edge skips the
   top-level Matching Stage. The destination creates an accepted Match without a
   Family input and creates an initiated Care Relationship without a care process.
2. **`first-successful-family` ownership:** it sits in Clinician Onboarding but its
   purpose and outputs span Matching and Care Initiation. “Successful” is undefined
   and may privilege activation over family or clinical success.
3. **Care Initiation → `reach-operating-rhythm`:** the Stage claims a first session
   occurred and both sides intend to continue. The Step consumes only an active
   Clinician, so the Family, Appointment, Match, and Care Relationship vanish at the
   handoff.
4. **`reach-operating-rhythm` → `reach-sustainable-caseload`:** a `next` edge crosses
   directly from Practice Operations to Retention & Growth, bypassing Quality &
   Outcomes even though top-level topology places quality between them.
5. **Availability lifecycle:** Availability becomes `matchable` once and is never
   consumed, reserved, changed, expired, or released.
6. **Caseload lifecycle:** Caseload becomes `open` at match-readiness and
   `sustainable` later, but accepted relationships do not add to it and closures do
   not reduce it.

### Unused or underused Entities

- **Family:** never used by a Step.
- **Patient:** never used by a Step; its relationship to Family is prose only.
- **Appointment:** never used, despite first-session and weekly-schedule exit
  conditions.
- **Practice:** produced as configured but never consumed.
- **Credential:** produced as verified but never consumed; the Clinician state
  carries the handoff instead.
- **Match:** created already accepted, so proposal, review, rejection, expiry, and
  acceptance are not represented.
- **Care Relationship:** created initiated and then never used in ongoing care,
  quality, continuity, or closure.

The absence of use can mean either “important concept not yet modeled” or “noun
prematurely added.” Research should decide which; coverage should not.

## Assumption and evidence ledger

| Assertion | Type | Current support | Counter-hypothesis | What could change the team's mind? |
| --- | --- | --- | --- | --- |
| Faster initial caseload predicts clinician retention. | Causal hypothesis | Explicit low-confidence author Claim. | Demand quality, compensation, fit, workload, support, or outside opportunities drive both ramp and retention. | Cohort analysis with defined retention, confounders, and comparisons; clinician interviews about departure. |
| Selection judgments predict later quality. | Predictive hypothesis | Explicit low-confidence author Claim. | Observed outcomes reflect case mix, matching, documentation, support, and measurement availability more than selection. | Predeclared selection signals tested against valid later measures with case-mix and missingness analysis. |
| A family need can be translated into a clinician supply need. | Mechanism hypothesis | Stage edge and `state-supply-need`. | Needs change; the binding constraint may be modality, affordability, timing, or coordination rather than clinician attributes. | Trace real needs through planning decisions and record where translation fails or changes. |
| Completing configuration and availability makes a clinician match-ready. | Operational definition | Onboarding state chain. | Readiness also requires current capacity, clinical scope, supervision/support, and family-specific constraints. | Define minimum matching inputs and test readiness failures after the declared threshold. |
| An accepted match can be treated as initiated care. | State-definition hypothesis | `first-successful-family` creates both states. | Acceptance, first encounter, clinical fit, consent, and an ongoing care relationship are separate transitions. | Journey review of accepted matches, including withdrawals and first-session outcomes. |
| One friction-free week indicates an operating rhythm. | Proxy hypothesis | `reach-operating-rhythm` exit condition. | A week is too short or atypical; hidden clinician/family work can make it appear friction-free. | Longitudinal observation of recurring exceptions and effort over an agreed interval. |
| Sustainable caseload is primarily clinician-defined. | Normative and operational choice | Step exit condition. | Family access, clinical complexity, quality, compensation, and support constrain sustainability too. | Joint definition with clinicians and operational/clinical balancing measures. |
| Quality can be observed per clinician and care relationship. | Measurement hypothesis | Quality Stage exit condition. | Attribution may be invalid or harmful when context and team contribution are omitted. | Define quality constructs, units of analysis, minimum samples, missingness, and appropriate uses. |
| Quality should inform future matching. | Causal/policy hypothesis | Top-level feedback edge only. | The feedback could encode inequity, discourage complex care, or optimize a weak proxy. | Prospective, governed evaluation with fairness, safety, and access balancing measures. |
| Retention permits outcomes to become observable. | Descriptive hypothesis | Retention Stage exit condition. | Measurement cadence and follow-up design, not retention alone, determine observability; attrition itself is informative. | Define outcome windows and analyze missing-not-at-random follow-up. |

The ledger should eventually cover assertions embedded in every body paragraph,
but these ten are the most structurally consequential.

## Metric audit

| Metric | Primary value represented | Principal validity or gaming risk | Needed balancing measures |
| --- | --- | --- | --- |
| `candidate-yield` | Operator/workforce throughput | Lowering the bar or favoring easy-to-activate candidates improves yield; excluded candidates disappear. | Later quality, differential yield by population/need, clinician experience, false-negative review. |
| `clinician-effort-to-activate` | Clinician burden | Self-reported or sampled effort can miss correction and cognitive work; minimizing effort can omit necessary preparation. | Readiness defects, clinician comprehension/confidence, later rework, safety. |
| `operating-effort-per-activation` | Operator efficiency | Work can be shifted to clinicians/families or deferred beyond activation. | Total participant effort, rework, exceptions, quality and access outcomes. |
| `selection-accuracy` | Workforce quality proxy | “Quality bar” and denominator are undefined; case mix and missing outcomes bias the result; selecting safer cases can inflate it. | Calibration, case mix, access, false negatives, uncertainty, multi-level quality measures. |
| `time-to-activation` | Speed | Administrative threshold can be declared earlier without real readiness. | Readiness defects, clinician effort, time to meaningful work, dropout. |
| `time-to-first-match` | Marketplace speed | A fast accepted Match may be poor fit or may privilege easier-to-match families. | Acceptance by both parties, later continuation, fit, differential wait, rejection and rematch. |
| `time-to-first-session` | Access/activation speed | A first session can be scheduled quickly without continuity, appropriateness, or low burden. | No-show/cancellation, second-session continuation, parent experience, clinical appropriateness, equity. |

### Missing metric families

Before optimizing the current seven, investigate measures for:

- parent and patient experience, trust, comprehension, participation, and burden;
- clinician documentation and cognitive burden during care, not only activation;
- access and wait differences across relevant populations and needs;
- match rejection, rematching, dropout, continuity, and planned/unplanned closure;
- safety signal recognition, acknowledgement, resolution, and failure;
- appropriateness and meaningful clinical change with explicit validity limits;
- care-plan review and response to non-improvement;
- data correction, missingness, provenance, and follow-up completeness;
- operational exceptions and work shifted among operators, clinicians, and families.

This is a research agenda, not a recommendation to add speculative Metric files.

## Prioritized decision queue

### D1 — Define the artifact's system boundary

**Decision:** state whether the primary object is an EHR, a care-delivery operating
system, a marketplace/practice platform, or a layered model that distinguishes
them.  
**Why first:** every Stage boundary and success metric depends on it.  
**Current recommendation:** use a layered model if the business context must remain,
and make clear which domains the record product owns, supports, or merely observes.  
**Required input:** accountable product decision informed by clinician and parent
research.  
**Do not do yet:** rename or remove Stages.

### D2 — Define who the parent-focused product serves and whose outcomes govern

**Decision:** distinguish parent/caregiver, patient, clinician, other caregivers,
practice, and operator outcomes, including conflicts among them.  
**Why foundational:** “best” is otherwise reducible to throughput or retention.  
**Current recommendation:** no metric should be called successful without naming
the actor receiving value and important balancing harms.  
**Required input:** separate parent, clinician, and family-systems discovery.

### D3 — Reconstruct the care and record lifecycle

**Decision:** identify the minimum clinical transformations from help-seeking
through assessment, plan, repeated care, review, transition, and closure.  
**Why foundational:** current topology leaps from matching to outcomes without
modeling clinical work.  
**Current recommendation:** produce a scratch lifecycle independent of current
Stages, then compare; do not force it into the existing eight.  
**Required input:** clinician workflow observation, clinical leadership, parent
journey research, and records/privacy review.

### D4 — Separate administrative readiness, matching, and care initiation

**Decision:** decide where Clinician Onboarding ends and which distinct transitions
create a proposed Match, accepted Match, first encounter, and ongoing Care
Relationship.  
**Why high impact:** `first-successful-family` currently collapses all of them.  
**Current recommendation:** end onboarding at a validated readiness state unless
research shows a stronger reason not to.  
**Required input:** operational event/journey samples and actor decision mapping.

### D5 — Define family, patient, caregiver, and authority relationships

**Decision:** determine which actors and relationships the model must distinguish
without creating a detailed production record schema.  
**Why high impact:** participation, consent, sharing, and clinical interpretation
cannot be reasoned about through one undifferentiated Family Entity.  
**Current recommendation:** model semantic roles and lifecycle questions before
technical permissions.  
**Required input:** family-systems research plus qualified privacy/legal review.

### D6 — Define quality before using it as feedback

**Decision:** define quality constructs, unit of analysis, interpretation owner,
uncertainty, and permitted decisions.  
**Why high risk:** feedback to selection or matching can produce false confidence
and inequitable incentives.  
**Current recommendation:** prioritize feedback to care review and improvement;
keep workforce/matching feedback hypothetical until validity is demonstrated.  
**Required input:** clinical quality, measurement, equity, and safety expertise.

### D7 — Add failure and recovery paths to the reasoning method

**Decision:** require each future process contribution to consider rejection,
delay, disagreement, incorrect information, deterioration, dropout, re-entry, and
closure where applicable.  
**Why important:** happy-path topology hides the work that often defines an EHR.  
**Current recommendation:** use exceptions selectively when known; do not invent
them to satisfy coverage.  
**Required input:** incident, support, workflow, and journey evidence.

### D8 — Establish an evidence and metric protocol

**Decision:** require consequential Claims and Metrics to state the decision they
inform, denominator/unit, time horizon, missingness, confounders, balancing risks,
and falsification conditions in review material before canonical enrichment.  
**Why important:** current feedback edges cannot be validated by metric names
alone.  
**Current recommendation:** begin with the two explicit Claims and their linked
Metrics.  
**Required input:** operational data feasibility and evidence-methods review.

## Accountable response and implementation disposition

**Response date:** 2026-08-14<br>
**Scope:** decisions supplied directly by the accountable reviewer after reading this queue. These dispositions are product direction, not stakeholder research evidence.

| Decision | Disposition now implemented | Still open |
| --- | --- | --- |
| D1 | The artifact models the whole productizable care-delivery operating system: care, participants, and surrounding practice-platform work needed to improve quality, access/coverage and affordability, measurement, personalization, and continuous improvement. Prototypeable product behavior is in scope; non-demonstrable organizational or company actions are context. | Test the boundary with parents, clinicians, clinical leaders, and operators; classify future ambiguous domains as product behavior or context. |
| D2 | Metrics now name actor perspectives, the decision owner, and the decision informed. `practice-management-platform` is an explicit builder/operator actor distinct from Practice, clinician, family, and patient. | Add family/patient, care-quality, access, coverage/affordability, equity, and continuity measures only when their constructs are understood. Resolve real value conflicts through discovery rather than schema defaults. |
| D3 | `docs/care-delivery-lifecycle-contrast.md` reconstructs a scratch lifecycle independently of current Stages and contrasts each transformation with current coverage. | Validate and revise it through direct journey/workflow evidence before promoting missing domains into canonical topology. |
| D4 | Administrative onboarding now ends at `match-ready`. Matching separately proposes and mutually accepts a Match; Care Initiation separately plans and completes a first encounter and confirms mutual continuation before initiating a Care Relationship. | Validate event definitions, prerequisites, actor decisions, state names, and recovery routes against real journeys. |
| D5 | Family/patient/authority questions are explicit in the lifecycle contrast and relevant Stage questions; no production permission model was invented. | Parent/caregiver lived experience, family-systems inquiry, and qualified privacy/records review remain required. |
| D6 | Quality definition is explicitly prioritized for clinician onboarding and patient matching. The contrast names candidate perspectives, balancing outcomes, units, missingness, and attribution questions; the selection-quality feedback remains hypothetical. | Clinical quality/safety, measurement, equity, and operational feasibility work must define valid constructs and permitted uses. |
| D7 | The authoring method now prompts for common failure/recovery classes without requiring invented exceptions. The newly separated matching/initiation Steps show known decline, expiry, cancellation, rematching, and closure branches. | Add evidence-based deterioration, safety escalation, longitudinal dropout/re-entry, correction, transfer, and closure mechanisms as those domains are investigated. |
| D8 | Metric records now identify actor perspective, owner, and decision. Research guidance establishes a proportionate evidence bar and supports iterative ChatGPT/Claude-style GitHub-connected conversations while preserving named-person promotion. | Define denominators, horizons, missingness, confounders, balancing risks, and falsification approaches for the two current Claims and any consequential metric before operational use. |

The remaining items are deliberately logged as open work rather than completed with plausible prose. This implementation improves what the model can distinguish; it does not claim that the care lifecycle, quality system, authority relationships, or evidence strategy are validated.

## Recommended research sequence

1. **Boundary interviews/workshop:** ask product, clinical, parent, and operator
   participants independently what system is being modeled and what the EHR must
   own.
2. **Parent and clinician journey research:** observe actual work and decisions
   from help-seeking through early ongoing care; sample failures, not only completed
   journeys.
3. **Independent care-record lifecycle:** build from observations without current
   Stage labels, then compare with the map.
4. **Family/authority inquiry:** investigate multi-caregiver, patient, consent,
   information-sharing, and conflicting-account scenarios with qualified reviewers.
5. **Quality and measurement inquiry:** define constructs and uses before sourcing
   outcome data or automating feedback.
6. **Targeted causal research:** investigate the two existing Claims with explicit
   alternatives and falsification plans.
7. **Topology decision review:** decide which Stages and edges to retain, split,
   reframe, or treat as surrounding context.
8. **Separate canonical change PRs:** name Problems first; change accepted topology
   and primitives only after decisions, with research traceability where applicable.

## Review completion assessment

This repository-only adversarial pass covers every current Stage, top-level edge,
Step chain, explicit Claim, and Metric through multiple simulated lenses. It does
**not** satisfy the broader review's stakeholder-evidence criterion. The following
remain necessary before the team can call the adversarial review complete:

- lived-experience input from parents/caregivers;
- direct workflow evidence from clinicians focused on parents;
- clinical quality and safety review;
- family-systems, accessibility/equity, and qualified privacy/records review;
- source-backed assessment of common EHR obligations and known failure modes;
- accountable decisions D1–D8.

The appropriate output of this pass is therefore a sharper research and decision
agenda—not a claim that the corrected system map is already known.

## Coverage appendix

This appendix makes the audit boundary mechanically checkable. Inclusion means the
record was inspected in this review; it does not imply a verdict beyond the
relevant sections above.

- **Stages:** `family-demand`, `clinician-supply`, `clinician-onboarding`,
  `matching`, `care-initiation`, `practice-operations`, `quality-outcomes`,
  `retention-growth`.
- **Steps:** `state-supply-need`, `source-candidates`, `attract-candidates`,
  `screen-candidates`, `select-clinician`, `selection-complete`,
  `credential-verify`, `configure-practice`, `set-clinical-preferences`,
  `establish-availability`, `become-match-ready`, `first-successful-family`,
  `reach-operating-rhythm`, `reach-sustainable-caseload`.
- **Entities:** `appointment`, `availability`, `care-relationship`, `caseload`,
  `clinician`, `credential`, `family`, `match`, `patient`, `practice`,
  `supply-need`.
- **Claims:** `claim-first-caseload-retention`,
  `claim-selection-predicts-quality`.
- **Metrics:** `candidate-yield`, `clinician-effort-to-activate`,
  `operating-effort-per-activation`, `selection-accuracy`, `time-to-activation`,
  `time-to-first-match`, `time-to-first-session`.
