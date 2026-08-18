"use client";

import { useState } from "react";
import styles from "./evidence-directed-review.module.css";

type Confidence = "high" | "medium" | "low";
type EvidenceKind = "eligibility" | "predictive";
type Route = "request" | "review";

type Evidence = {
  label: string;
  value: string;
  kind: EvidenceKind;
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
  decisionTitle: string;
  decisionPrompt: string;
  whyItMatters: string;
  routeWhy: string;
  evidence: Evidence[];
};

const ATTENTION: Prospect[] = [
  {
    id: "park",
    name: "Jamie Park",
    credential: "LPC",
    focus: "Youth anxiety and caregiver work",
    route: "request",
    routeLabel: "One detail needed",
    decisionTitle: "One question blocks the handoff",
    decisionPrompt: "How do you prefer to involve caregivers when you are working with an adolescent?",
    whyItMatters:
      "The current profile has evidence about youth work and interpersonal skill, but not enough context about caregiver involvement to finish this screen confidently.",
    routeWhy:
      "The modeled route asks for one bounded detail before spending a full reviewer pass. The point of this prototype is to test whether that is actually less work and still feels human-backed.",
    evidence: [
      {
        label: "License for target practice",
        value: "Verified",
        kind: "eligibility",
        confidence: "high",
        source: "Synthetic registry check",
        note: "Modeled as a true eligibility gate for this prototype, not as evidence of care quality.",
      },
      {
        label: "Interpersonal work sample",
        value: "Evidence available",
        kind: "predictive",
        confidence: "medium",
        source: "Synthetic structured exercise",
        note: "A performance-based signal class supported by the research, but not a validated production score.",
      },
      {
        label: "Caregiver involvement",
        value: "Missing",
        kind: "predictive",
        confidence: "low",
        source: "Not yet captured",
        note: "This is the one missing item the prototype proposes collecting before deciding whether deeper review is needed.",
      },
    ],
  },
  {
    id: "shah",
    name: "Amir Shah",
    credential: "LCSW",
    focus: "Child and family behavioral health",
    route: "review",
    routeLabel: "Human judgment needed",
    decisionTitle: "Two sources disagree",
    decisionPrompt: "Which recent care contexts best represent Amir's current family-care practice?",
    whyItMatters:
      "The profile and application describe different recent practice patterns. Another automated summary would preserve the contradiction rather than resolve it.",
    routeWhy:
      "This modeled route reserves reviewer time for a contradiction that could materially change whether the prospect advances. The review itself is not built in this iteration.",
    evidence: [
      {
        label: "License for target practice",
        value: "Verified",
        kind: "eligibility",
        confidence: "high",
        source: "Synthetic registry check",
        note: "No eligibility issue is represented in this case.",
      },
      {
        label: "Family-care experience",
        value: "Sources disagree",
        kind: "predictive",
        confidence: "low",
        source: "Synthetic profile and application",
        note: "One source describes substantial family work while another describes a more adult-heavy recent caseload.",
      },
      {
        label: "Interpersonal work sample",
        value: "Incomplete",
        kind: "predictive",
        confidence: "low",
        source: "Synthetic structured exercise",
        note: "The record is incomplete enough that the prototype does not use it to resolve the contradiction automatically.",
      },
    ],
  },
];

const HANDLED = [
  {
    name: "Elena Morales, LMFT",
    outcome: "Advanced",
    destination: "Qualified → Evaluate & Select",
  },
  {
    name: "Sam Rivera, LMFT",
    outcome: "Eligibility hold",
    destination: "Leaves active review until the required status can be verified",
  },
];

export function EvidenceDirectedReview() {
  const [selectedId, setSelectedId] = useState(ATTENTION[0].id);
  const [view, setView] = useState<"operator" | "clinician">("operator");
  const [clinicianChoice, setClinicianChoice] = useState<"answer" | "human" | null>(null);
  const [status, setStatus] = useState("");

  const prospect = ATTENTION.find((candidate) => candidate.id === selectedId) ?? ATTENTION[0];

  const selectProspect = (id: string) => {
    setSelectedId(id);
    setView("operator");
    setClinicianChoice(null);
    setStatus("");
  };

  if (view === "clinician") {
    return (
      <ClinicianEvidenceRequest
        prospect={prospect}
        choice={clinicianChoice}
        onChoose={setClinicianChoice}
        onBack={() => {
          setView("operator");
          setClinicianChoice(null);
        }}
        onComplete={(message) => setStatus(message)}
      />
    );
  }

  return (
    <div className={styles.reviewWorkspace}>
      <WorkflowContext />

      <div className={styles.workArea}>
        <aside className={styles.attentionQueue} aria-label="Prospects needing operator attention">
          <div className={styles.queueHeading}>
            <span className={styles.eyebrow}>Your queue</span>
            <h2>2 prospects need you</h2>
            <p>Automation has already removed the cases that do not need a full reviewer pass right now.</p>
          </div>

          <ul className={styles.attentionList}>
            {ATTENTION.map((candidate) => (
              <li key={candidate.id}>
                <button
                  type="button"
                  className={`${styles.prospectButton} ${candidate.id === prospect.id ? styles.prospectSelected : ""}`}
                  aria-pressed={candidate.id === prospect.id}
                  onClick={() => selectProspect(candidate.id)}
                >
                  <span className={styles.prospectName}>{candidate.name}, {candidate.credential}</span>
                  <span className={styles.prospectFocus}>{candidate.focus}</span>
                  <span className={styles.routeLabel}>{candidate.routeLabel}</span>
                </button>
              </li>
            ))}
          </ul>

          <details className={styles.handledCases}>
            <summary>2 prospects did not need full review</summary>
            <ul>
              {HANDLED.map((candidate) => (
                <li key={candidate.name}>
                  <strong>{candidate.name}</strong>
                  <span>{candidate.outcome}</span>
                  <small>{candidate.destination}</small>
                </li>
              ))}
            </ul>
          </details>
        </aside>

        <main className={styles.prospectDetail} aria-label={`Review ${prospect.name}`}>
          <header className={styles.prospectHeader}>
            <div>
              <span className={styles.eyebrow}>Prospect requiring attention</span>
              <h2>{prospect.name}, {prospect.credential}</h2>
              <p>{prospect.focus}</p>
            </div>
            <span className={styles.routeBadge}>{prospect.routeLabel}</span>
          </header>

          <section className={styles.decisionCard} aria-labelledby="current-decision">
            <span className={styles.eyebrow}>Your decision now</span>
            <h3 id="current-decision">{prospect.decisionTitle}</h3>
            <p className={styles.decisionQuestion}>{prospect.decisionPrompt}</p>
            <p className={styles.why}>{prospect.whyItMatters}</p>

            <div className={styles.primaryActions}>
              {prospect.route === "request" ? (
                <>
                  <button
                    type="button"
                    className="button"
                    onClick={() => {
                      setClinicianChoice(null);
                      setView("clinician");
                    }}
                  >
                    Request this detail
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => setStatus("Prototype only: Jamie would move to a human reviewer instead of receiving the evidence request.")}
                  >
                    Review Jamie instead
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="button"
                    onClick={() => setStatus("Prototype only: Amir would enter a structured human review to resolve the contradiction.")}
                  >
                    Start human review
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => setStatus("Prototype only: the team would seek the missing assessment evidence before reviewing Amir.")}
                  >
                    Get missing evidence first
                  </button>
                </>
              )}
            </div>

            <details className={styles.routeReason}>
              <summary>Why was this routed to me?</summary>
              <p>{prospect.routeWhy}</p>
            </details>
          </section>

          <Handoff prospect={prospect} />

          <section className={styles.evidenceSection} aria-labelledby="evidence-snapshot">
            <div className={styles.sectionHeading}>
              <div>
                <span className={styles.eyebrow}>Evidence snapshot</span>
                <h3 id="evidence-snapshot">What this decision is based on</h3>
              </div>
              <span className={styles.sectionHint}>Open a row for provenance</span>
            </div>

            <div className={styles.evidenceList}>
              {prospect.evidence.map((item) => (
                <details className={styles.evidenceItem} key={item.label}>
                  <summary>
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.kind === "eligibility" ? "Eligibility" : "Predictive evidence"}</small>
                    </span>
                    <span className={item.value === "Missing" || item.value === "Sources disagree" || item.value === "Incomplete" ? styles.evidenceNeedsAttention : styles.evidenceReady}>
                      {item.value}
                    </span>
                  </summary>
                  <div className={styles.evidenceDetail}>
                    <p><strong>Confidence</strong> {item.confidence}</p>
                    <p><strong>Source</strong> {item.source}</p>
                    <p>{item.note}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>

          {status ? <p className={styles.status} role="status">{status}</p> : null}

          <p className={styles.prototypeBoundary}>
            Synthetic workflow only. The routes and thresholds shown here are hypotheses for review, not validated selection policy.
          </p>
        </main>
      </div>
    </div>
  );
}

function WorkflowContext() {
  return (
    <section className={styles.workflowContext} aria-labelledby="workflow-title">
      <div className={styles.workflowIntro}>
        <span className={styles.eyebrow}>Operator workspace · clinician supply</span>
        <h2 id="workflow-title">You are finishing candidate screening</h2>
        <p>
          Prospects arrive here after entering the pool and after cheap evidence has been assembled. Your job is to resolve only the cases the system cannot safely route on its own.
        </p>
      </div>

      <ol className={styles.workflowRail} aria-label="Clinician prospect workflow">
        <li className={styles.workflowDone}>
          <span>Handoff in</span>
          <strong>Candidate in pool</strong>
          <small>Applicant + available evidence</small>
        </li>
        <li className={styles.workflowCurrent}>
          <span>You are here</span>
          <strong>Screen Candidates</strong>
          <small>Resolve evidence gaps or ambiguity</small>
        </li>
        <li>
          <span>Next</span>
          <strong>Evaluate & Select</strong>
          <small>Deeper selection judgment</small>
        </li>
        <li>
          <span>Handoff out</span>
          <strong>Selection Complete</strong>
          <small>Selected clinician enters onboarding</small>
        </li>
      </ol>
    </section>
  );
}

function Handoff({ prospect }: { prospect: Prospect }) {
  const isRequest = prospect.route === "request";

  return (
    <section className={styles.handoff} aria-labelledby="handoff-title">
      <span className={styles.eyebrow}>What happens after this action</span>
      <h3 id="handoff-title">The handoff</h3>
      {isRequest ? (
        <div className={styles.handoffFlow}>
          <div>
            <span>Now</span>
            <strong>Jamie remains an applicant</strong>
          </div>
          <div>
            <span>Next owner</span>
            <strong>Morgan requests one detail</strong>
          </div>
          <div>
            <span>Returns here</span>
            <strong>Answer updates the evidence profile</strong>
          </div>
          <div>
            <span>Then</span>
            <strong>Advance or use human review</strong>
          </div>
        </div>
      ) : (
        <div className={styles.handoffFlow}>
          <div>
            <span>Now</span>
            <strong>Amir remains qualified for review</strong>
          </div>
          <div>
            <span>Next owner</span>
            <strong>Human reviewer resolves the contradiction</strong>
          </div>
          <div>
            <span>Produces</span>
            <strong>An explicit selection judgment</strong>
          </div>
          <div>
            <span>Then</span>
            <strong>Advance or stop with a reason</strong>
          </div>
        </div>
      )}
      <p className={styles.handoffCaveat}>These handoff states are prototype hypotheses grounded in the current Screen Candidates → Evaluate & Select → Selection Complete model.</p>
    </section>
  );
}

function ClinicianEvidenceRequest({
  prospect,
  choice,
  onChoose,
  onBack,
  onComplete,
}: {
  prospect: Prospect;
  choice: "answer" | "human" | null;
  onChoose: (choice: "answer" | "human") => void;
  onBack: () => void;
  onComplete: (message: string) => void;
}) {
  return (
    <div className={styles.clinicianView}>
      <div className={styles.perspectiveBar}>
        <div>
          <span className={styles.eyebrow}>Clinician view</span>
          <strong>This is what {prospect.name} would see</strong>
        </div>
        <button type="button" className="button secondary" onClick={onBack}>Back to operator view</button>
      </div>

      <section className={styles.clinicianCard} aria-labelledby="clinician-request-title">
        <header className={styles.humanHeader}>
          <span className={styles.humanInitials} aria-hidden="true">ML</span>
          <div>
            <strong>Morgan Lee</strong>
            <span>Clinician Partnerships</span>
          </div>
        </header>

        <div className={styles.messageBody}>
          <span className={styles.eyebrow}>Before our conversation</span>
          <h2 id="clinician-request-title">One detail would help us use our time well</h2>
          <p>Hi {prospect.name.split(" ")[0]}, I’m looking forward to speaking with you. Before we talk, there’s one part of your practice I’d like to understand better.</p>
          <blockquote>{prospect.decisionPrompt}</blockquote>
          <p>You can answer here now, or we can talk it through together. Either option goes to Morgan; this step is not an automated interview or contracting decision.</p>
        </div>

        <div className={styles.clinicianChoices}>
          <button
            type="button"
            className={`${styles.choiceCard} ${choice === "answer" ? styles.choiceSelected : ""}`}
            aria-pressed={choice === "answer"}
            onClick={() => onChoose("answer")}
          >
            <strong>Answer before my call</strong>
            <span>Share a short response that Morgan can read before you speak.</span>
          </button>
          <button
            type="button"
            className={`${styles.choiceCard} ${choice === "human" ? styles.choiceSelected : ""}`}
            aria-pressed={choice === "human"}
            onClick={() => onChoose("human")}
          >
            <strong>Talk it through with Morgan</strong>
            <span>Skip the form. Morgan will cover the question during your conversation.</span>
          </button>
        </div>

        {choice === "answer" ? (
          <div className={styles.answerPanel}>
            <label htmlFor="clinician-answer">Your answer</label>
            <textarea id="clinician-answer" rows={5} placeholder="Share only what would help Morgan understand your approach." />
            <button
              type="button"
              className="button"
              onClick={() => {
                onComplete("Prototype only: Jamie chose to answer before the call. The response would return to the evidence profile for Morgan to review.");
                onBack();
              }}
            >
              Share with Morgan
            </button>
          </div>
        ) : null}

        {choice === "human" ? (
          <div className={styles.answerPanel}>
            <strong>No form to complete.</strong>
            <p>Morgan will bring this question into your scheduled conversation. Nothing is scored or submitted now.</p>
            <button
              type="button"
              className="button"
              onClick={() => {
                onComplete("Prototype only: Jamie chose to discuss the missing detail with Morgan during the human conversation.");
                onBack();
              }}
            >
              Keep it for the call
            </button>
          </div>
        ) : null}

        <p className={styles.clinicianBoundary}>Prototype only. Nothing here is sent, scored, saved, or used to make a real contracting decision.</p>
      </section>
    </div>
  );
}
