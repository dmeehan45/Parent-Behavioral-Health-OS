"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Breadcrumb } from "@/components/model/badges";
import {
  CLAIM_KINDS,
  CLAIM_KIND_MEANING,
  CONFIDENCE_LEVELS,
  CONFIDENCE_MEANING,
  applySteps,
  hasNowhereToLand,
  suggestedConfidence,
  suggestedKind,
  type ApplyChoice,
  type ClaimKind,
  type ConfidenceLevel,
} from "@/lib/research/apply";
import type { ReviewFinding, ReviewRun } from "@/lib/research/view";

type Item = { run: ReviewRun; finding: ReviewFinding };

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
export function ApplyWorkspace({ items }: { items: Item[] }) {
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

      {items.length === 0 ? (
        <p className="empty-note">
          Nothing accepted is waiting to be applied. <Link href="/review">Back to research</Link>.
        </p>
      ) : null}

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

            {/*
              The model's loop is Problem → Bet → Prototype. Research produces
              evidence, and evidence is not a plan. Generating a Problem from a
              finding would be inventing content, so this asks the question
              instead and gets out of the way.
            */}
            <div className="apply-next">
              <p className="field-label">Does this change what we should build?</p>
              <p className="small muted">
                A Claim is something we believe. A Problem is somewhere the machine breaks, and a Bet is what we would
                try. If this finding makes one of those obvious, that is a separate, human piece of writing — nothing
                here will guess it for you.
              </p>
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
    </main>
  );
}
