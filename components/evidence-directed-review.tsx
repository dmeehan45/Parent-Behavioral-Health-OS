"use client";

import { useMemo, useState } from "react";
import styles from "./evidence-directed-review.module.css";

type Route = "advance" | "request" | "review" | "stop";
type EvidenceKind = "eligibility" | "predictive";
type Confidence = "high" | "medium" | "low";

type Evidence = {
  label: string;
  value: string;
  kind: EvidenceKind;
  maturity: "verified" | "assessed" | "reported";
  confidence: Confidence;
  source: string;
  note: string;
};

type Prospect = {
  id: string;
  name: string;
  credential: string;
  focus: string;
  route: Route;
  routeLabel: string;
  routeWhy: string;
  nextAction: string;
  evidence: Evidence[];
  unknowns: string[];
};

const PROSPECTS: Prospect[] = [
  {
    id: "morales",
    name: "Elena Morales",
    credential: "LMFT",
    focus: "Parent and adolescent care",
    route: "advance",
    routeLabel: "Can progress",
    routeWhy:
      "The synthetic record contains no unresolved eligibility gate and the evidence selected for this prototype is internally consistent. A full manual re-read is unlikely to add new information at this moment.",
    nextAction: "Advance to the next structured selection step",
    evidence: [
      {
        label: "License for target practice",
        value: "Active and verified",
        kind: "eligibility",
        maturity: "verified",
        confidence: "high",
        source: "Synthetic registry check",
        note: "Modeled as a true gate for this prototype, not as a quality signal.",
      },
      {
        label: "Parent and adolescent practice",
        value: "Relevant experience documented",
        kind: "predictive",
        maturity: "reported",
        confidence: "medium",
        source: "Synthetic clinician profile",
        note: "Useful context, but self-report is not treated as proof of later care quality.",
      },
      {
        label: "Interpersonal work sample",
        value: "Clear evidence available",
        kind: "predictive",
        maturity: "assessed",
        confidence: "medium",
        source: "Synthetic structured exercise",
        note: "Represents the performance-based signal class supported by the research, not a validated production score.",
      },
    ],
    unknowns: ["Longitudinal care performance does not exist yet and is not inferred here."],
  },
  {
    id: "park",
    name: "Jamie Park",
    credential: "LPC",
    focus: "Youth anxiety and caregiver work",
    route: "request",
    routeLabel: "Needs one detail",
    routeWhy:
      "The available evidence is promising enough to keep the prospect moving, but one match-relevant practice detail is missing. Collecting that detail is cheaper than assigning a full human review now.",
    nextAction: "Request one missing practice detail before review",
    evidence: [
      {
        label: "License for target practice",
        value: "Active and verified",
        kind: "eligibility",
        maturity: "verified",
        confidence: "high",
        source: "Synthetic registry check",
        note: "Modeled as a true gate for this prototype.",
      },
      {
        label: "Interpersonal work sample",
        value: "Clear evidence available",
        kind: "predictive",
        maturity: "assessed",
        confidence: "medium",
        source: "Synthetic structured exercise",
        note: "The work sample adds evidence but does not settle population fit.",
      },
      {
        label: "Caregiver participation experience",
        value: "Not yet captured",
        kind: "predictive",
        maturity: "reported",
        confidence: "low",
        source: "No source yet",
        note: "This is the smallest missing item the prototype treats as worth collecting next.",
      },
    ],
    unknowns: ["How Jamie prefers to involve caregivers in adolescent care."],
  },
  {
    id: "shah",
    name: "Amir Shah",
    credential: "LCSW",
    focus: "Child and family behavioral health",
    route: "review",
    routeLabel: "Human review",
    routeWhy:
      "The synthetic sources disagree in a way that matters to the selection decision. More automation would repeat the contradiction rather than resolve it, so the case is routed to structured human judgment.",
    nextAction: "Use a structured human review to resolve the contradiction",
    evidence: [
      {
        label: "License for target practice",
        value: "Active and verified",
        kind: "eligibility",
        maturity: "verified",
        confidence: "high",
        source: "Synthetic registry check",
        note: "No eligibility issue is represented.",
      },
      {
        label: "Family-care experience",
        value: "Sources disagree",
        kind: "predictive",
        maturity: "reported",
        confidence: "low",
        source: "Synthetic profile and application",
        note: "One source describes substantial family work; another describes an adult-heavy recent caseload.",
      },
      {
        label: "Interpersonal work sample",
        value: "Evidence is incomplete",
        kind: "predictive",
        maturity: "assessed",
        confidence: "low",
        source: "Synthetic structured exercise",
        note: "The record is too incomplete for the system to resolve the contradiction mechanically.",
      },
    ],
    unknowns: ["Which recent care contexts best represent Amir's current practice strengths?", "Whether the incomplete work sample reflects missing data or an unfinished assessment."],
  },
  {
    id: "rivera",
    name: "Sam Rivera",
    credential: "LMFT",
    focus: "Family systems",
    route: "stop",
    routeLabel: "Eligibility stop",
    routeWhy:
      "A required eligibility fact cannot be verified for the target practice context. The prototype treats this as noncompensable, so predictive evidence is not used to outweigh it.",
    nextAction: "Stop until the eligibility requirement can be verified",
    evidence: [
      {
        label: "License for target practice",
        value: "Required status cannot be verified",
        kind: "eligibility",
        maturity: "verified",
        confidence: "high",
        source: "Synthetic registry check",
        note: "This is a deliberately simple example of a true gate. It is not a production rule or legal determination.",
      },
      {
        label: "Family-care experience",
        value: "Relevant experience documented",
        kind: "predictive",
        maturity: "reported",
        confidence: "medium",
        source: "Synthetic clinician profile",
        note: "Predictive evidence remains visible but does not compensate for the modeled eligibility gate.",
      },
    ],
    unknowns: ["Whether the eligibility record is stale or the requirement is genuinely unmet."],
  },
];

const OVERRIDE_REASONS = [
  "The profile is missing consequential evidence",
  "A rule is being used in the wrong way",
  "The evidence is represented incorrectly",
  "Human context could materially change the decision",
] as const;

const ROUTE_COUNTS = PROSPECTS.reduce<Record<Route, number>>(
  (counts, prospect) => ({ ...counts, [prospect.route]: counts[prospect.route] + 1 }),
  { advance: 0, request: 0, review: 0, stop: 0 },
);

export function EvidenceDirectedReview() {
  const [selectedId, setSelectedId] = useState(PROSPECTS[1].id);
  const [previewRequest, setPreviewRequest] = useState(false);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const prospect = useMemo(() => PROSPECTS.find((candidate) => candidate.id === selectedId) ?? PROSPECTS[0], [selectedId]);

  const chooseProspect = (id: string) => {
    setSelectedId(id);
    setPreviewRequest(false);
    setOverrideOpen(false);
    setOverrideReason("");
    setStatus("");
  };

  const recordPrototypeAction = (message: string) => {
    setStatus(`${message} Prototype only: nothing was sent, saved, or changed.`);
  };

  const useRecommendedRoute = () => {
    if (prospect.route === "request") {
      setPreviewRequest(true);
      setOverrideOpen(false);
      setStatus("");
      return;
    }
    recordPrototypeAction(`You followed the recommended route: ${prospect.nextAction}.`);
  };

  const sendToHumanReview = () => {
    setPreviewRequest(false);
    setOverrideOpen(false);
    recordPrototypeAction("You routed this prospect to structured human review.");
  };

  const openOverride = () => {
    setPreviewRequest(false);
    setOverrideOpen(true);
    setStatus("");
  };

  const applyOverride = () => {
    if (!overrideReason) return;
    setOverrideOpen(false);
    recordPrototypeAction(`You overrode the route because: ${overrideReason}.`);
  };

  return (
    <div className={styles.workspace}>
      <aside className={styles.queue} aria-label="Synthetic clinician prospect queue">
        <div className={styles.queueHead}>
          <p className={styles.eyebrow}>Review queue</p>
          <h2>Where should human time go?</h2>
          <p className={styles.queueIntro}>
            Four synthetic prospects exercise different routing conditions. None of these routes or evidence rules is a validated production policy.
          </p>
        </div>

        <div className={styles.queueSummary} aria-label="Queue routing summary">
          <span>{PROSPECTS.length} prospects</span>
          <span>{ROUTE_COUNTS.review} needs human review</span>
          <span>{ROUTE_COUNTS.request} needs more evidence</span>
        </div>

        <ul className={styles.prospectList}>
          {PROSPECTS.map((candidate) => (
            <li key={candidate.id}>
              <button
                type="button"
                className={`${styles.prospectButton} ${selectedId === candidate.id ? styles.prospectSelected : ""}`}
                aria-pressed={selectedId === candidate.id}
                onClick={() => chooseProspect(candidate.id)}
              >
                <span className={styles.prospectName}>{candidate.name}, {candidate.credential}</span>
                <span className={styles.prospectFocus}>{candidate.focus}</span>
                <span className={`${styles.routeTag} ${styles[`route_${candidate.route}`]}`}>{candidate.routeLabel}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className={styles.detail} aria-label={`Evidence for ${prospect.name}`}>
        <header className={styles.detailHead}>
          <div>
            <p className={styles.eyebrow}>Synthetic prospect</p>
            <h2>{prospect.name}, {prospect.credential}</h2>
            <p className={styles.focusLine}>{prospect.focus}</p>
          </div>
          <span className={`${styles.routeTag} ${styles[`route_${prospect.route}`]}`}>{prospect.routeLabel}</span>
        </header>

        <section className={styles.routePanel} aria-labelledby="recommended-route">
          <p className={styles.eyebrow}>Recommended next action</p>
          <h3 id="recommended-route">{prospect.nextAction}</h3>
          <p>{prospect.routeWhy}</p>
          <p className={styles.provisional}>
            This recommendation exists to test the workflow. It is not a validated clinician-selection rule or quality score.
          </p>
        </section>

        <section className={styles.section} aria-labelledby="evidence-profile">
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrow}>Comparable evidence profile</p>
              <h3 id="evidence-profile">What the system currently knows</h3>
            </div>
            <p className={styles.sectionNote}>Eligibility and predictive evidence stay visibly different.</p>
          </div>

          <div className={styles.evidenceList}>
            {prospect.evidence.map((item) => (
              <article className={styles.evidenceRow} key={item.label}>
                <div className={styles.evidenceLead}>
                  <div className={styles.evidenceLabels}>
                    <span className={`${styles.kindTag} ${item.kind === "eligibility" ? styles.kindEligibility : styles.kindPredictive}`}>
                      {item.kind === "eligibility" ? "Eligibility" : "Predictive evidence"}
                    </span>
                    <span className={styles.maturity}>{item.maturity}</span>
                  </div>
                  <h4>{item.label}</h4>
                  <strong>{item.value}</strong>
                </div>
                <div className={styles.evidenceContext}>
                  <dl>
                    <div>
                      <dt>Confidence</dt>
                      <dd>{item.confidence}</dd>
                    </div>
                    <div>
                      <dt>Source</dt>
                      <dd>{item.source}</dd>
                    </div>
                  </dl>
                  <p>{item.note}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.unknowns} aria-labelledby="consequential-unknowns">
          <p className={styles.eyebrow}>Consequential unknowns</p>
          <h3 id="consequential-unknowns">What we still do not know</h3>
          <ul>
            {prospect.unknowns.map((unknown) => <li key={unknown}>{unknown}</li>)}
          </ul>
        </section>

        <section className={styles.actions} aria-label="Reviewer actions">
          <button type="button" className="button" onClick={useRecommendedRoute}>
            {prospect.route === "request" ? "Preview evidence request" : "Use recommended route"}
          </button>
          {prospect.route !== "review" ? (
            <button type="button" className="button secondary" onClick={sendToHumanReview}>
              Send to human review
            </button>
          ) : null}
          <button type="button" className="button secondary" onClick={openOverride}>
            Override route
          </button>
        </section>

        {overrideOpen ? (
          <section className={styles.overridePanel} aria-labelledby="override-title">
            <p className={styles.eyebrow}>Accountable exception</p>
            <h3 id="override-title">Why should this route change?</h3>
            <p>Choose the reason that best describes information the structured profile failed to carry.</p>
            <div className={styles.overrideReasons}>
              {OVERRIDE_REASONS.map((reason) => (
                <label key={reason} className={styles.overrideReason}>
                  <input
                    type="radio"
                    name="override-reason"
                    value={reason}
                    checked={overrideReason === reason}
                    onChange={(event) => setOverrideReason(event.target.value)}
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
            <div className={styles.inlineActions}>
              <button type="button" className="button" disabled={!overrideReason} onClick={applyOverride}>
                Record override
              </button>
              <button type="button" className="button secondary" onClick={() => setOverrideOpen(false)}>
                Cancel
              </button>
            </div>
          </section>
        ) : null}

        {previewRequest ? (
          <EvidenceRequestPreview
            prospect={prospect}
            onClose={() => setPreviewRequest(false)}
            onPrototypeAction={recordPrototypeAction}
          />
        ) : null}

        <p className={styles.status} aria-live="polite">{status}</p>
      </section>
    </div>
  );
}

function EvidenceRequestPreview({
  prospect,
  onClose,
  onPrototypeAction,
}: {
  prospect: Prospect;
  onClose: () => void;
  onPrototypeAction: (message: string) => void;
}) {
  return (
    <section className={styles.requestPreview} aria-labelledby="request-preview-title">
      <div className={styles.requestHead}>
        <div className={styles.humanMark} aria-hidden="true">ME</div>
        <div>
          <p className={styles.eyebrow}>Clinician-facing preview</p>
          <h3 id="request-preview-title">Morgan is still the point of contact</h3>
          <p className={styles.humanRole}>Morgan Ellis · Clinician Partnerships · synthetic contact</p>
        </div>
      </div>

      <div className={styles.message}>
        <p>Hi {prospect.name.split(" ")[0]}, I’ll be your point of contact through this process.</p>
        <p>
          Before our conversation, there is one detail I would like to clarify so we can spend our time on the parts that need an actual discussion. This short step collects that information and organizes it for me before we talk.
        </p>
      </div>

      <div className={styles.technologyBoundary}>
        <strong>What the technology does</strong>
        <p>It collects and organizes your response for Morgan. It does not make the selection or contracting decision.</p>
      </div>

      <div className={styles.requestQuestion}>
        <span className={styles.eyebrow}>One detail requested</span>
        <strong>{prospect.unknowns[0]}</strong>
      </div>

      <div className={styles.inlineActions}>
        <button
          type="button"
          className="button"
          onClick={() => onPrototypeAction("You chose the short evidence-collection step before the human conversation.")}
        >
          Answer before the call
        </button>
        <button
          type="button"
          className="button secondary"
          onClick={() => onPrototypeAction("You chose to answer the question with Morgan instead.")}
        >
          Answer with Morgan instead
        </button>
        <button type="button" className="button secondary" onClick={onClose}>
          Close preview
        </button>
      </div>

      <p className={styles.previewFoot}>Prototype only. No message was sent and no response will be stored.</p>
    </section>
  );
}
