"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Breadcrumb } from "@/components/model/badges";
import { FindingCard } from "@/components/review/finding-card";
import {
  DISPOSITIONS,
  requiresEditedRecommendation,
  requiresRationale,
  runStatus,
  type Disposition,
  type ReviewRun,
} from "@/lib/research/view";

export type Draft = {
  disposition?: Disposition;
  rationale: string;
  editedRecommendation: string;
  supersedes: string;
};

const EMPTY: Draft = { rationale: "", editedRecommendation: "", supersedes: "" };

/** A YAML double-quoted scalar, which JSON string syntax already is. */
function scalar(value: string) {
  return JSON.stringify(value);
}

/**
 * The reviewer's workspace.
 *
 * The repository has no database, no authentication and no server-side writes,
 * and it should not grow them to serve this. So the page does the part a file
 * cannot — putting the evidence, the prior art, and what the finding would
 * change all in front of the reader at the moment they decide — and hands back
 * a complete decision file to commit. Thinking happens here; Git still records
 * it.
 */
export function ReviewWorkspace({
  run,
  supersedable,
  sourceUrl,
}: {
  run: ReviewRun;
  supersedable: Array<{ id: string; run: string; statement: string }>;
  sourceUrl?: string;
}) {
  const [reviewer, setReviewer] = useState(run.reviewer ?? "");
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(
      run.findings.map((finding) => [
        finding.decisionId,
        finding.decision
          ? {
              disposition: finding.decision.disposition as Disposition,
              rationale: finding.decision.rationale ?? "",
              editedRecommendation: finding.decision.editedRecommendation ?? "",
              supersedes: finding.decision.supersedes ?? "",
            }
          : { ...EMPTY },
      ]),
    ),
  );
  const [copied, setCopied] = useState(false);

  const update = (id: string, patch: Partial<Draft>) => {
    setDrafts((current) => ({ ...current, [id]: { ...(current[id] ?? EMPTY), ...patch } }));
    setCopied(false);
  };

  const answered = run.findings.filter((finding) => drafts[finding.decisionId]?.disposition);

  // The same rules the validator enforces, said before the file is written
  // rather than after it is committed.
  const incomplete = answered.filter((finding) => {
    const draft = drafts[finding.decisionId];
    const disposition = draft?.disposition;
    if (!disposition) return false;
    if (requiresRationale(disposition) && !draft.rationale.trim()) return true;
    if (requiresEditedRecommendation(disposition) && !draft.editedRecommendation.trim()) return true;
    return false;
  });

  const reviewerMissing = !reviewer.trim() || /^todo\b/i.test(reviewer.trim());
  const ready = answered.length > 0 && incomplete.length === 0 && !reviewerMissing;

  const yaml = useMemo(() => {
    const lines = [
      "contractVersion: 1",
      `runId: ${run.id}`,
      `reviewedHandoffHash: ${run.hash}`,
      `reviewer: ${scalar(reviewer.trim() || "TODO who is accountable for this decision")}`,
      "decisions:",
    ];
    for (const finding of run.findings) {
      const draft = drafts[finding.decisionId];
      if (!draft?.disposition) continue;
      lines.push(`  - id: ${finding.decisionId}`, `    disposition: ${draft.disposition}`);
      if (draft.rationale.trim()) lines.push(`    rationale: ${scalar(draft.rationale.trim())}`);
      if (draft.editedRecommendation.trim()) lines.push(`    editedRecommendation: ${scalar(draft.editedRecommendation.trim())}`);
      if (draft.supersedes) lines.push(`    supersedes: ${draft.supersedes}`);
    }
    if (answered.length === 0) lines.push("  []");
    return `${lines.join("\n")}\n`;
  }, [answered.length, drafts, reviewer, run.findings, run.hash, run.id]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(yaml);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const status = runStatus(run);

  return (
    <main className="shell page review">
      <Breadcrumb trail={[{ label: "System map", href: "/map" }, { label: "Review", href: "/review" }, { label: run.id }]} />

      <header className="page-head">
        <div className="page-head-main">
          <div className="page-head-badges">
            <Badge tone={status.tone}>{status.label}</Badge>
            <Badge tone="quiet">{run.createdAt}</Badge>
            <Badge tone="quiet">{run.preparedBy}</Badge>
          </div>
          <h1>{run.question}</h1>
          <p className="lede">{run.synthesis}</p>
          {run.answers.length ? (
            <p className="small muted">
              Answering: {run.answers.map((answer) => answer.question).join("; ")}
            </p>
          ) : null}
        </div>
      </header>

      <p className="review-gate">
        Nothing here has changed the model. A decision authorizes a later, separate change to <code>content/</code> —
        it does not make one.
      </p>

      <section className="review-findings" aria-label="Findings">
        <h2 className="field-label">
          {run.findings.length} finding{run.findings.length === 1 ? "" : "s"} to decide
        </h2>
        {run.findings.map((finding) => (
          <FindingCard
            key={finding.decisionId}
            finding={finding}
            sources={run.sources}
            draft={drafts[finding.decisionId] ?? EMPTY}
            supersedable={supersedable}
            onChange={(patch) => update(finding.decisionId, patch)}
          />
        ))}
      </section>

      {run.openQuestions.length ? (
        <section className="review-open" aria-label="Open questions">
          <h2 className="field-label">The run could not answer these</h2>
          <ul className="plain-list">
            {run.openQuestions.map((question) => (
              <li key={question.id}>{question.question}</li>
            ))}
          </ul>
          <p className="small muted">
            Queue any of these with <code>npm run research:ask</code> and the next run will pick it up.
          </p>
        </section>
      ) : null}

      <section className="review-output" aria-label="Record your decisions">
        <h2 className="field-label">Record your decisions</h2>

        <div className="field">
          <label htmlFor="reviewer">Who is accountable for these decisions</label>
          <input
            id="reviewer"
            className="text-input"
            value={reviewer}
            placeholder="your name or handle"
            onChange={(event) => {
              setReviewer(event.target.value);
              setCopied(false);
            }}
          />
        </div>

        <p className="small muted">
          {answered.length} of {run.findings.length} decided
          {incomplete.length ? ` · ${incomplete.length} still needs a written reason` : ""}
          {reviewerMissing ? " · name yourself above" : ""}
        </p>

        <div className="review-actions">
          <button type="button" className="button" onClick={copy} disabled={!ready}>
            {copied ? "Copied" : "Copy decision file"}
          </button>
          <span className="small muted">
            Save as <code>{run.decisionFile}</code>, then run <code>npm run validate:research</code>.
          </span>
        </div>

        <pre className="review-yaml" aria-label="Decision file">
          {yaml}
        </pre>
      </section>

      <section className="provenance" aria-label="Where this comes from">
        <span className="field-label">Where this comes from</span>
        <div className="provenance-row">
          <span className="small muted">{run.provenance}</span>
        </div>
        <p className="small muted">
          Handoff hash <code>{run.hash.slice(0, 12)}…</code> — a decision is recorded against this exact revision. If the
          handoff changes, the decisions are re-opened rather than silently carried over.
        </p>
        {sourceUrl ? (
          <a className="source-path" href={`${sourceUrl.replace(/\/$/, "")}/${run.file}`} target="_blank" rel="noreferrer">
            {run.file} ↗
          </a>
        ) : (
          <span className="source-path">{run.file}</span>
        )}
      </section>

      <p className="page-note">
        <Link href="/review">← All research runs</Link>
      </p>
    </main>
  );
}

export { DISPOSITIONS };
