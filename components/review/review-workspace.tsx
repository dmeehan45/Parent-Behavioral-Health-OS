"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge, Breadcrumb } from "@/components/model/badges";
import { ConversationReviewBridge } from "@/components/review/conversation-review-bridge";
import { FindingCard } from "@/components/review/finding-card";
import {
  DISPOSITIONS,
  DISPOSITION_MEANING,
  DISPOSITION_TONE,
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
      [...run.findings, ...run.candidates].map((item) => [
        item.decisionId,
        item.decision
          ? {
              disposition: item.decision.disposition as Disposition,
              rationale: item.decision.rationale ?? "",
              editedRecommendation: item.decision.editedRecommendation ?? "",
              supersedes: ("supersedes" in item.decision ? item.decision.supersedes : undefined) ?? "",
            }
          : { ...EMPTY },
      ]),
    ),
  );
  const [copied, setCopied] = useState(false);
  // Notes get one control for the whole set, which is the entire point of them.
  // Per-note state here would rebuild the expensive lane for the cheap material.
  const [notesDisposition, setNotesDisposition] = useState<"noted" | "discard" | "">(run.notesDecision?.disposition ?? "");

  const update = (id: string, patch: Partial<Draft>) => {
    setDrafts((current) => ({ ...current, [id]: { ...(current[id] ?? EMPTY), ...patch } }));
    setCopied(false);
  };

  const decidable = [...run.findings, ...run.candidates];
  const answered = decidable.filter((item) => drafts[item.decisionId]?.disposition);

  // The same rules the validator enforces, said before the file is written
  // rather than after it is committed.
  const incomplete = answered.filter((item) => {
    const draft = drafts[item.decisionId];
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
      // Dated so "what has happened since I last looked" is answerable at all.
      // Without it a decision has no position in time and the research surface
      // can only ever show a set, never a sequence.
      `decidedAt: ${new Date().toISOString().slice(0, 10)}`,
      // This page is one of two lanes. Stamping which one produced the file
      // costs nothing here and is the only way a later audit can tell them
      // apart — the guarantees are identical, so nothing else distinguishes them.
      "decidedVia: review",
      "decisions:",
    ];
    for (const item of [...run.findings, ...run.candidates]) {
      const draft = drafts[item.decisionId];
      if (!draft?.disposition) continue;
      lines.push(`  - id: ${item.decisionId}`, `    disposition: ${draft.disposition}`);
      if (draft.rationale.trim()) lines.push(`    rationale: ${scalar(draft.rationale.trim())}`);
      if (draft.editedRecommendation.trim()) lines.push(`    editedRecommendation: ${scalar(draft.editedRecommendation.trim())}`);
      if (draft.supersedes) lines.push(`    supersedes: ${draft.supersedes}`);
    }
    if (answered.length === 0) lines.push("  []");
    if (run.notes.length && notesDisposition) lines.push("notes:", `  disposition: ${notesDisposition}`);
    return `${lines.join("\n")}\n`;
  }, [answered.length, drafts, notesDisposition, reviewer, run.candidates, run.findings, run.hash, run.id, run.notes.length]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(yaml);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const status = runStatus(run);

  /** Compared loosely: whitespace and a trailing question mark are not a difference. */
  const sameSentence = (a: string, b: string) =>
    a.replace(/\s+/g, " ").trim().replace(/[?.]$/, "").toLowerCase() ===
    b.replace(/\s+/g, " ").trim().replace(/[?.]$/, "").toLowerCase();
  const answersBeyondTitle = run.answers.filter((answer) => !sameSentence(answer.question, run.question));

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
          {/* A run usually answers the queued question it was named after, and
              printing that back under the heading set the same forty words
              twice, a line apart. Only the questions the title does not already
              carry are worth saying. */}
          {answersBeyondTitle.length ? (
            <p className="small muted">
              Answering: {answersBeyondTitle.map((answer) => answer.question).join("; ")}
            </p>
          ) : null}
        </div>
      </header>

      {/* One block, not two. The guarantee and the way of working were two
          near-identical blue callouts stacked on top of each other, which read
          as one long advisory nobody finishes. */}
      <section className="review-gate" aria-label="How this page works">
        <p>
          <strong>Nothing here has changed the model.</strong> A decision authorizes a later, separate change to{" "}
          <code>content/</code> — it does not make one.
        </p>
        <p>
          This page is the organized record and the authorization surface, not the place where complex ideas have to be
          finished. Work with the run in conversation first, then let it write back a reflection, questions, or explicit
          decisions through GitHub.
        </p>
        <ConversationReviewBridge
          runId={run.id}
          question={run.question}
          findings={run.findings.length}
          candidates={run.candidates.length}
        />
      </section>

      <section className="review-findings" aria-label="Findings">
        <h2 className="field-label">
          {run.findings.length} finding{run.findings.length === 1 ? "" : "s"} to decide
        </h2>

        {/* The vocabulary, once. It describes the five words rather than any
            one finding, and it was previously reprinted under every card —
            thirty sentences on a page holding six. Folded, because the words
            themselves carry most of it and the nuance is only wanted while
            somebody is undecided. */}
        <details className="disclosure review-vocab">
          <summary>What the five decisions mean</summary>
          <dl className="define-list">
            {DISPOSITIONS.map((option) => (
              <div key={option}>
                <dt>
                  <Badge tone={DISPOSITION_TONE[option]}>{option}</Badge>
                </dt>
                <dd>{DISPOSITION_MEANING[option]}</dd>
              </div>
            ))}
          </dl>
          <p className="small muted">
            Leave a finding undecided while it still needs interpretation or refinement. A disposition is the point
            where you authorize what happens next.
          </p>
        </details>
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

      {run.candidates.length ? (
        <section className="review-candidates" aria-label="Proposed for the model">
          <h2 className="field-label">
            {run.candidates.length} proposal{run.candidates.length === 1 ? "" : "s"} for the model
          </h2>
          <p className="small muted">
            Each proposes that something should <em>exist</em>. None carries a name — accepting one composes a skeleton
            with the references filled in and the naming left to you, because a name written by the analysis is how a
            fix gets recorded as a problem.
          </p>
          {run.candidates.map((candidate) => {
            const draft = drafts[candidate.decisionId] ?? EMPTY;
            return (
              <article className="candidate-card" key={candidate.decisionId}>
                <Badge tone="accent">{candidate.kind}</Badge>
                <p>{candidate.description}</p>
                {candidate.targets.length ? (
                  <p className="small muted">
                    Bites{" "}
                    {candidate.targets.map((target, index) => (
                      <span key={target.id}>
                        {index > 0 ? ", " : ""}
                        <Link href={target.href}>{target.title}</Link>
                      </span>
                    ))}
                  </p>
                ) : null}
                {candidate.rationale ? <p className="small muted">Why it ranks here: {candidate.rationale}</p> : null}
                {candidate.wouldWeakenIf ? (
                  <p className="small muted">Would weaken if: {candidate.wouldWeakenIf}</p>
                ) : null}
                <div className="field">
                  <label htmlFor={`candidate-${candidate.decisionId}`}>Decision</label>
                  <select
                    id={`candidate-${candidate.decisionId}`}
                    value={draft.disposition ?? ""}
                    onChange={(event) =>
                      update(candidate.decisionId, { disposition: (event.target.value || undefined) as Disposition })
                    }
                  >
                    <option value="">not yet decided</option>
                    {DISPOSITIONS.map((disposition) => (
                      <option key={disposition} value={disposition}>
                        {disposition}
                      </option>
                    ))}
                  </select>
                </div>
                {draft.disposition && requiresRationale(draft.disposition) ? (
                  <div className="field">
                    <label htmlFor={`candidate-why-${candidate.decisionId}`}>Why</label>
                    <textarea
                      id={`candidate-why-${candidate.decisionId}`}
                      value={draft.rationale}
                      onChange={(event) => update(candidate.decisionId, { rationale: event.target.value })}
                    />
                  </div>
                ) : null}
                {draft.disposition && requiresEditedRecommendation(draft.disposition) ? (
                  <div className="field">
                    <label htmlFor={`candidate-edit-${candidate.decisionId}`}>What it should say instead</label>
                    <textarea
                      id={`candidate-edit-${candidate.decisionId}`}
                      value={draft.editedRecommendation}
                      onChange={(event) => update(candidate.decisionId, { editedRecommendation: event.target.value })}
                    />
                  </div>
                ) : null}
              </article>
            );
          })}
        </section>
      ) : null}

      {run.notes.length ? (
        <section className="review-notes" aria-label="Context notes">
          <h2 className="field-label">
            {run.notes.length} context note{run.notes.length === 1 ? "" : "s"} — decided as a set
          </h2>
          <p className="small muted">
            These change no claim and can never be cited as evidence. Read them, then say once whether this run&rsquo;s
            context is worth keeping. Anything here that needs its own judgement should have been a finding — say so
            rather than accepting it as context.
          </p>
          <ul className="review-list">
            {run.notes.map((note) => (
              <li key={note.id}>
                {note.statement}
                <span className="small muted">
                  {" "}
                  — for{" "}
                  {note.anchors.map((anchor, index) => (
                    <span key={anchor.id}>
                      {index > 0 ? ", " : ""}
                      <Link href={anchor.href}>{anchor.title}</Link>
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
          <div className="field">
            <label htmlFor="notes-disposition">Keep this context?</label>
            <select
              id="notes-disposition"
              value={notesDisposition}
              onChange={(event) => {
                setNotesDisposition(event.target.value as "noted" | "discard" | "");
                setCopied(false);
              }}
            >
              <option value="">not yet decided</option>
              <option value="noted">noted — keep all {run.notes.length}</option>
              <option value="discard">discard — none of it is worth keeping</option>
            </select>
          </div>
        </section>
      ) : null}

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
