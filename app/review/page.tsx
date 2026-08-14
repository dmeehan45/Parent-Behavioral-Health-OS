import Link from "next/link";
import { Badge, Breadcrumb } from "@/components/model/badges";
import { SinceLastLook } from "@/components/review/since-last-look";
import { projectReview } from "@/lib/research/projection";
import { FINDING_STATE_LABEL, FINDING_STATE_TONE, allFindings, runStatus } from "@/lib/research/view";

/**
 * Research is staging, and staging changes whenever somebody pushes a handoff.
 * A prerendered index would show yesterday's queue.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Research · Parent Behavioral Health OS",
  description: "What research has proposed, what is waiting on a decision, and what is worth investigating next.",
};

/** How much of the queue is worth showing before it becomes a wall. */
const QUEUE_PREVIEW = 5;

/**
 * The operator's surface.
 *
 * Ordered by what is owed, not by what exists: decide, then apply, then choose
 * what to look into. Everything already settled is one disclosure away rather
 * than on the page — history is worth keeping and is almost never what somebody
 * opened this to read.
 */
export default function ReviewIndexPage() {
  const { runs, queue } = projectReview();
  const findings = allFindings(runs);

  const awaiting = findings.filter(({ finding }) => finding.state === "awaiting");
  const accepted = findings.filter(({ finding }) => finding.state === "accepted");
  const settled = runs.filter((run) => run.total > 0 && run.decided === run.total);
  const openRuns = runs.filter((run) => run.decided < run.total);

  return (
    <main className="shell page">
      <Breadcrumb trail={[{ label: "System map", href: "/map" }, { label: "Research" }]} />

      <header className="page-head">
        <div className="page-head-main">
          <h1>Research</h1>
          <p className="lede">
            Research arrives as a proposal, never as a change. Deciding what it means is where the model actually learns
            something, and it is the only step a person does.
          </p>
        </div>
      </header>

      <SinceLastLook ids={[...runs.map((run) => run.id), ...findings.map(({ finding }) => finding.decisionId)]} />

      <p className="review-standing">
        <strong>{awaiting.length}</strong> waiting on you · <strong>{accepted.length}</strong> ready to apply ·{" "}
        <strong>{queue.length}</strong> worth investigating
      </p>

      {runs.length === 0 ? (
        <p className="empty-note">
          No research has been handed off yet. A run starts with a question — see <code>docs/research-routine.md</code>.
        </p>
      ) : null}

      {openRuns.length ? (
        <section className="review-section" aria-label="Waiting on you">
          <h2 className="field-label">
            Waiting on you <span className="field-count">{awaiting.length}</span>
          </h2>
          <div className="card-grid">
            {openRuns.map((run) => {
              const status = runStatus(run);
              return (
                <Link className="card" key={run.id} href={`/review/${run.id}`}>
                  <div className="card-badges">
                    <Badge tone={status.tone}>{status.label}</Badge>
                    <Badge tone="quiet">{run.createdAt}</Badge>
                  </div>
                  <h3>{run.question}</h3>
                  <p className="small muted">{run.synthesis}</p>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {accepted.length ? (
        <section className="review-section" aria-label="Ready to apply">
          <h2 className="field-label">
            Ready to apply <span className="field-count">{accepted.length}</span>
          </h2>
          <p className="small muted">
            You decided these are true. The model does not say them yet — that takes a separate change to{" "}
            <code>content/</code>.
          </p>
          <ul className="review-list">
            {accepted.map(({ run, finding }) => (
              <li key={finding.decisionId}>
                <p className="review-list-title">
                  <Link href={`/review/${run.id}`}>{finding.statement}</Link>
                </p>
                <p className="small muted">
                  {finding.suggestedTargets.length
                    ? `Would land on ${finding.suggestedTargets.map((target) => target.title).join(", ")}.`
                    : "No target suggested."}
                </p>
              </li>
            ))}
          </ul>
          <div className="review-actions">
            <Link className="button" href="/review/apply">
              Apply these <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      ) : null}

      {queue.length ? (
        <section className="review-section" aria-label="Worth investigating">
          <h2 className="field-label">
            Worth investigating <span className="field-count">{queue.length}</span>
          </h2>
          <p className="small muted">
            Questions somebody asked, then gaps the model has in itself. A scheduled run picks from the top.
          </p>
          <QueueList entries={queue.slice(0, QUEUE_PREVIEW)} />
          {queue.length > QUEUE_PREVIEW ? (
            <details className="disclosure">
              <summary>The other {queue.length - QUEUE_PREVIEW}</summary>
              <QueueList entries={queue.slice(QUEUE_PREVIEW)} />
            </details>
          ) : null}
        </section>
      ) : null}

      {settled.length ? (
        <details className="disclosure">
          <summary>
            Decided <span className="field-count">{settled.length}</span>
          </summary>
          <div className="card-grid">
            {settled.map((run) => (
              <Link className="card" key={run.id} href={`/review/${run.id}`}>
                <div className="card-badges">
                  {[...new Set(run.findings.map((finding) => finding.state))].map((state) => (
                    <Badge key={state} tone={FINDING_STATE_TONE[state]}>
                      {FINDING_STATE_LABEL[state]}
                    </Badge>
                  ))}
                </div>
                <h3>{run.question}</h3>
                <p className="small muted">
                  {run.createdAt} · reviewed by {run.reviewer ?? "someone"}
                </p>
              </Link>
            ))}
          </div>
        </details>
      ) : null}
    </main>
  );
}

function QueueList({ entries }: { entries: ReturnType<typeof projectReview>["queue"] }) {
  return (
    <ul className="review-list">
      {entries.map((entry) => (
        <li key={entry.id}>
          <p className="review-list-title">
            <Badge tone={entry.kind === "question" ? "accent" : "quiet"}>
              {entry.kind === "question" ? "asked" : "gap"}
            </Badge>{" "}
            {entry.question}
          </p>
          <p className="small muted">
            {entry.detail}
            {/* The question already names the subject, so the link is a way in
                rather than a repeat of it. */}
            {entry.subject ? (
              <>
                {" "}
                <Link href={entry.subject.href}>
                  Read the {entry.subject.kind} <span aria-hidden="true">→</span>
                </Link>
              </>
            ) : null}
          </p>
          {/* A gap is something the model noticed about itself; nobody has
              asked it yet. The command carries what raised it, so the queued
              question knows what it bites instead of arriving anonymous. */}
          {entry.kind === "gap" ? <code className="queue-command">{askCommand(entry)}</code> : null}
        </li>
      ))}
    </ul>
  );
}

/** The exact line that queues this gap as a question, ready to paste. */
function askCommand(entry: ReturnType<typeof projectReview>["queue"][number]) {
  return [
    "npm run research:ask --",
    JSON.stringify(entry.question),
    ...(entry.subject ? [`--targets ${entry.subject.id}`] : []),
    `--why ${JSON.stringify(entry.detail)}`,
  ].join(" ");
}
