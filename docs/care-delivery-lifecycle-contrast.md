# Care-delivery lifecycle contrast

**Status:** investigation frame, not accepted topology  
**Created:** 2026-08-14 in response to adversarial review decisions D3, D5, D6, and D7

This contrast starts from the work required to deliver and improve care rather than from the map's current Stage names. Its purpose is to show what the current model cannot yet reason about. It does not assert a universal clinical workflow, prescribe care, or authorize canonical detail.

## Candidate lifecycle

A productizable care-delivery operating system may need to support these distinct transformations:

1. **Seek and access help.** A parent, caregiver, or patient expresses needs, constraints, preferences, affordability or coverage needs, and urgency; the system makes failed access visible rather than treating only completed intake as demand.
2. **Understand participants and authority.** The relevant patient, caregivers, households, care-team participants, decision rights, consent, and information boundaries are understood at the level needed for the next decision.
3. **Assess needs, fit, and risk.** Participants and clinicians gather and interpret enough information to decide what kind of help is appropriate, what is urgent, and whether the platform can serve it.
4. **Find and choose care.** The system proposes an available clinician under explicit constraints; family and clinician review independently, accept, decline, or seek another path.
5. **Initiate care.** Operational prerequisites are resolved, a first encounter occurs, and the family and clinician separately decide whether and how to continue.
6. **Agree goals and a plan.** The patient and appropriate caregivers participate in goals and next actions; the clinician records the reasoning, uncertainty, and information sources needed to revise them.
7. **Deliver and coordinate repeated care.** Encounters, between-session work, communication, scheduling, documentation, coverage, and coordination form a loop rather than a one-way funnel.
8. **Observe and interpret.** Progress, experience, safety, access, burden, and context are observed at appropriate levels; missing follow-up and disagreement remain information rather than being silently discarded.
9. **Review and adapt.** The clinician and appropriate participants use observations to continue, revise, coordinate, escalate, pause, rematch, transfer, or close care. Platform learning is downstream of safe care review, not a shortcut around it.
10. **Transition or close.** The system preserves why care ended, what happens next, what may be shared, and how a participant can re-enter without corrupting the record.

## The flow is not linear

At every point, rejection, changed needs, incorrect information, disagreement, affordability or coverage barriers, deterioration, cancellation, dropout, and changing authority can return work to an earlier decision or route it to escalation, transfer, or closure. The current map should not gain a single universal loop to imply these routes are settled. Contributions should name known recovery mechanisms and log the unknown ones.

## Contrast with the current map

| Candidate transformation | Current coverage | Strongest next question |
| --- | --- | --- |
| Seek and access help | `family-demand` summary; no family Step | What makes a family ready and able to enter matching, and who is excluded before that state? |
| Participants and authority | Family and Patient prose only | Which semantic roles and changing relationships matter before any technical permission design? |
| Assess needs, fit, and risk | Not modeled | What minimum decisions belong before matching, during fit review, and at the first encounter? |
| Find and choose care | Proposed and accepted Match are now separate | Which constraints, explanations, choices, and recovery paths create a high-quality matching experience? |
| Initiate care | Planning, completing, and continuing are now separate proposed Steps | What prerequisites and quality signals distinguish access speed from good initiation? |
| Goals and plan | Not modeled | How do parent, patient, and clinician goals coexist and change? |
| Repeated care and coordination | Not modeled | Which repeated work is essential to care quality and prototypeable by the platform? |
| Observe and interpret | Stage aspiration only | What quality constructs are useful at encounter, relationship, clinician, and platform levels? |
| Review and adapt | Vague feedback edges | Which actor may use which signal for which decision, under what uncertainty and safeguards? |
| Transition or close | Not modeled | What closure, transfer, rematching, and re-entry states must remain distinct? |

## Focused quality agenda

The first quality-definition work should concentrate where current product thinking is deepest:

### Clinician onboarding

- For the clinician: comprehension, confidence, burden, correction/rework, and readiness for the actual families they may serve.
- For families and patients: whether administrative speed creates genuinely available, appropriate, and supported capacity.
- For the platform: throughput and operator effort, balanced by readiness defects, later rework, access, safety, and clinician experience.
- Measurement questions: What is the readiness threshold? Who judges it? Over what interval? Which later failures reveal false readiness without treating all later outcomes as caused by onboarding?

### Patient matching

- For families and patients: access, affordability or coverage, understandable choice, fit with stated needs and preferences, burden, trust, and equitable wait or rejection patterns.
- For clinicians: scope and preference fit, usable context, current capacity, ability to decline, and avoidable rematching work.
- For the platform: speed and acceptance, balanced by continuation, rematching, differential access, safety, and uncertainty.
- Measurement questions: What is the unit—a proposal, accepted match, first encounter, or relationship? Whose acceptance matters? What denominators include people never proposed a match? How do missing follow-up, case mix, constrained supply, and changing needs alter interpretation?

## Work that remains accountable to people

This frame cannot determine family or patient authority, consent and sharing rules, safety pathways, valid clinical-quality constructs, causal attribution, or acceptable trade-offs. Those require parent/caregiver lived experience, clinician workflow evidence, clinical quality and safety leadership, family-systems and accessibility/equity input, qualified privacy/records review, and operational data feasibility. Until then they remain questions, not implied product requirements.
