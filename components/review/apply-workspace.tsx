"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Breadcrumb } from "@/components/model/badges";
import {
  CLAIM_KINDS,
  CLAIM_KIND_MEANING,
  CONFIDENCE_LEVELS,
  CONFIDENCE_MEANING,
  PROBLEM_TITLE_RULE,
  applySteps,
  composeCandidate,
  composeProblem,
  hasNowhereToLand,
  problemMaterial,
  suggestedConfidence,
  suggestedKind,
  type ApplyChoice,
  type ClaimKind,
  type ConfidenceLevel,
} from "@/lib/research/apply";
import type { ReviewCandidate, ReviewFinding, ReviewRun } from "@/lib/research/view";

type Item = { run: ReviewRun; finding: ReviewFinding };
type CandidateItem = { run: ReviewRun; candidate: ReviewCandidate };

/**
 * Turning an accepted decision into a change to the model.
 *
 * This was the hole in the loop: research could be reviewed and accepted, and
 * then nothing carried it into `content/`. Accepted findings piled up having
 * changed nothing — the exact failure the review gate exists to prevent, just
 * moved one step later.
 *
 * It composes rather than writes, for the same reason the decision page does:
 * no database, no auth, no server-side writes. What it adds over doing it by
 * hand is the part that is easy to get wrong — the `researchTrace` that proves
 * the change was authorized, which content validation checks and refuses.
 */
export function ApplyWorkspace({ items, candidates = [] }: { items: Item[]; candidates?: CandidateItem[] }) {
  const [names, setNames] = useState<Record<string, string>>({});
  const [choices, setChoices] = useState<Record<string, ApplyChoice>>(() =>
    Object.fromEntries(
      items.map(({ finding }) => [
        finding.decisionId,
        { kind: suggestedKind(finding.evidenceQuality), confidence: suggestedConfidence(finding.evidenceQuality) },
      ]),
    ),
  );
  const [copied, setCopied] = useState<string>();

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
    } catch {
      setCopied(undefined);
    }
  };

  return (
    <main className="shell page">
      <Breadcrumb
        trail={[{ label: "System map", href: "/map" }, { label: "Research", href: "/review" }, { label: "Apply" }]}
      />

      <header className="page-head">
        <div className="page-head-main">
          <h1>Apply accepted research</h1>
          <p className="lede">
            You decided these are true. This is the change that makes the model say so — a separate pull request from
            the one that reviewed them, branched from <code>main</code>.
          </p>
        </div>
      </header>

      {items.length === 0 && candidates.length === 0 ? (
        <p className="empty-note">
          Nothing accepted is waiting to be applied. <Link href="/review">Back to research</Link>.
        </p>
      ) : null}

      {candidates.map(({ run, candidate }) => {
        const title = names[candidate.decisionId] ?? "";
        const step = composeCandidate(run, { ...candidate, targets: candidate.targets.map((target) => target.id) }, { id: candidate.decisionId }, title);
        return (
          <article className="review-finding" key={candidate.decisionId}>
            <div className="card-badges">
              <Badge tone="accent">accepted</Badge>
              <Badge tone="quiet">proposes a {candidate.kind}</Badge>
            </div>
            <h2 className="review-statement">{candidate.description}</h2>
            <p className="small muted">{PROBLEM_TITLE_RULE}</p>
            <div className="field">
              <label htmlFor={`name-${candidate.decisionId}`}>
                {candidate.kind === "problem" ? "Name the trouble" : "Write the question"}
              </label>
              <input
                id={`name-${candidate.decisionId}`}
                value={title}
                placeholder={candidate.kind === "problem" ? "A clinician can finish onboarding and still have no work" : "What makes …?"}
                onChange={(event) => {
                  setNames((current) => ({ ...current, [candidate.decisionId]: event.target.value }));
                  setCopied(undefined);
                }}
              />
            </div>
            <p className="small muted">{step.explanation}</p>
            <pre className="apply-body">
              <code>{step.body}</code>
            </pre>
            <p className="small muted">
              Save as <code>{step.path}</code>.
            </p>
            <button type="button" className="button" onClick={() => copy(candidate.decisionId, step.body)}>
              {copied === candidate.decisionId ? "Copied" : "Copy"}
            </button>
          </article>
        );
      })}

      {items.map(({ run, finding }) => {
        const choice = choices[finding.decisionId];
        const steps = applySteps(run, finding, choice);
        const nowhere = hasNowhereToLand(finding);

        return (
          <article className="review-finding" key={finding.decisionId}>
            <div className="card-badges">
              <Badge tone="accent">accepted</Badge>
              <Badge tone="quiet">{run.createdAt}</Badge>
            </div>
            <h2 className="review-statement">{finding.statement}</h2>
            {finding.decision?.editedRecommendation ? (
              <p className="small muted">
                You edited this on accepting it: “{finding.decision.editedRecommendation}”. The composed change uses
                your wording.
              </p>
            ) : null}

            {finding.proposedClaim ? (
              <fieldset className="review-decision">
                <legend className="field-label">What kind of belief is this?</legend>
                <p className="small muted">
                  The run said its evidence was <strong>{finding.evidenceQuality}</strong>. That is what the source is;
                  this is what we now hold, and they are not the same judgement.
                </p>
                <div className="review-options">
                  {CLAIM_KINDS.map((kind) => (
                    <label className={`review-option${choice.kind === kind ? " selected" : ""}`} key={kind}>
                      <input
                        type="radio"
                        name={`${finding.decisionId}-kind`}
                        checked={choice.kind === kind}
                        onChange={() => {
                          setChoices((current) => ({ ...current, [finding.decisionId]: { ...choice, kind: kind as ClaimKind } }));
                          setCopied(undefined);
                        }}
                      />
                      <span className="review-option-name">
                        <Badge tone="neutral">{kind}</Badge>
                      </span>
                      <span className="review-option-meaning">{CLAIM_KIND_MEANING[kind]}</span>
                    </label>
                  ))}
                </div>

                <legend className="field-label">How confident are you?</legend>
                <div className="review-options">
                  {CONFIDENCE_LEVELS.map((level) => (
                    <label className={`review-option${choice.confidence === level ? " selected" : ""}`} key={level}>
                      <input
                        type="radio"
                        name={`${finding.decisionId}-confidence`}
                        checked={choice.confidence === level}
                        onChange={() => {
                          setChoices((current) => ({
                            ...current,
                            [finding.decisionId]: { ...choice, confidence: level as ConfidenceLevel },
                          }));
                          setCopied(undefined);
                        }}
                      />
                      <span className="review-option-name">
                        <Badge tone="neutral">{level}</Badge>
                      </span>
                      <span className="review-option-meaning">{CONFIDENCE_MEANING[level]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            {nowhere ? (
              <p className="empty-note">
                This finding named no target and proposed no Claim, so there is nothing to compose. Decide where it
                belongs in the model, or leave it as evidence on the run.
              </p>
            ) : null}

            {steps.map((step) => {
              const key = `${finding.decisionId}-${step.path}`;
              return (
                <div className="apply-step" key={key}>
                  <p className="apply-step-head">
                    <Badge tone={step.action === "create" ? "evidence" : "accent"}>{step.action}</Badge>{" "}
                    <code>{step.path}</code>
                  </p>
                  <p className="small muted">{step.explanation}</p>
                  <div className="review-actions">
                    <button type="button" className="button secondary" onClick={() => copy(key, step.body)}>
                      {copied === key ? "Copied" : step.action === "create" ? "Copy the file" : "Copy the frontmatter"}
                    </button>
                  </div>
                  <pre className="review-yaml">{step.body}</pre>
                </div>
              );
            })}

            <div className="apply-next">
              <div className="chips">
                {finding.suggestedTargets.map((target) => (
                  <Link className="chip" key={target.id} href={target.href}>
                    What already bites {target.title}
                  </Link>
                ))}
              </div>
            </div>
          </article>
        );
      })}

      {items.length ? <NameAProblem items={items} /> : null}
    </main>
  );
}

/**
 * The step after believing something: saying where the machine breaks.
 *
 * Research produces evidence, and evidence is not a plan — so this composes the
 * references a Problem needs and stops. Naming the trouble stays a person's
 * sentence, which is why the box is empty and the rule sits next to it.
 *
 * It takes several findings at once because that is how the reviewer usually
 * arrives: three findings about the same failure are one Problem, and picking
 * them apart into three would be worse than not offering this at all.
 */
function NameAProblem({ items }: { items: Item[] }) {
  const [chosen, setChosen] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [copied, setCopied] = useState(false);

  const sources = items.filter(({ finding }) => chosen.includes(finding.decisionId));
  const { targets, claims } = problemMaterial(sources);
  const step = composeProblem(sources, title);

  const toggle = (id: string) => {
    setChosen((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
    setCopied(false);
  };

  return (
    <section className="apply-problem" aria-label="Name a problem">
      <h2>Does this say the machine breaks somewhere?</h2>
      <p className="small muted">
        A Claim is something we believe. A Problem is somewhere the machine breaks, and it is the thing a Bet has to
        answer. If this research names one, compose it here — the targets, the claims, and the proof it was reviewed
        come across on their own.
      </p>

      <fieldset className="review-decision">
        <legend className="field-label">Which findings is it built on?</legend>
        <div className="review-options">
          {items.map(({ finding }) => (
            <label className={`review-option stated${chosen.includes(finding.decisionId) ? " selected" : ""}`} key={finding.decisionId}>
              <input
                type="checkbox"
                checked={chosen.includes(finding.decisionId)}
                onChange={() => toggle(finding.decisionId)}
              />
              <span className="review-option-meaning">{finding.statement}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {chosen.length ? (
        <>
          <div className="field">
            <label htmlFor="problem-title">What is the trouble?</label>
            <p className="small muted">{PROBLEM_TITLE_RULE}</p>
            <input
              id="problem-title"
              type="text"
              className="text-input"
              value={title}
              placeholder="A clinician can finish onboarding and still have no work"
              onChange={(event) => {
                setTitle(event.target.value);
                setCopied(false);
              }}
            />
          </div>

          <p className="small muted">
            {targets.length
              ? `It would bite ${targets.join(", ")}.`
              : "The findings you picked named nowhere in the machine, so there is nothing to target yet — a problem that bites nowhere is not a problem with this system."}
            {claims.length ? ` It would rest on ${claims.join(", ")}.` : ""}
          </p>
        </>
      ) : null}

      {step ? (
        <div className="apply-step">
          <p className="apply-step-head">
            <Badge tone="evidence">create</Badge> <code>{step.path}</code>
          </p>
          <p className="small muted">{step.explanation}</p>
          <div className="review-actions">
            <button
              type="button"
              className="button secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(step.body);
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? "Copied" : "Copy the file"}
            </button>
          </div>
          <pre className="review-yaml">{step.body}</pre>
        </div>
      ) : null}
    </section>
  );
}
