import Link from "next/link";
import { Badge, Breadcrumb } from "@/components/model/badges";
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

/**
 * The operator's surface.
 *
 * Someone running this has research arriving from conversations they held
 * elsewhere and from scheduled runs they did not watch. The question they open
 * this page with is not "list the runs" — it is *what needs me, what did I
 * already decide, and what should we look into next*. So the page is ordered by
 * what is owed rather than by what exists: work waiting on them, then work
 * waiting on the model, then the queue, then history.
 */
export default function ReviewIndexPage() {
  const { runs, queue } = projectReview();
  const findings = allFindings(runs);

  const awaiting = findings.filter(({ finding }) => finding.state === "awaiting");
  const accepted = findings.filter(({ finding }) => finding.state === "accepted");
  const settled = runs.filter((run) => run.total > 0 && run.decided === run.total);

  return (
    <main className="shell page">
      <Breadcrumb trail={[{ label: "System map", href: "/map" }, { label: "Research" }]} />

      <header className="page-head">
        <div className="page-head-main">
          <h1>Research</h1>
          <p className="lede">
            Research arrives here as a proposal, never as a change. Reading a run and deciding what it means is the step
            where the model actually learns something — and the only step a person does.
          </p>
        </div>
      </header>

      <section className="review-summary" aria-label="Where things stand">
        <div>
          <strong>{awaiting.length}</strong>
          <span>waiting on you</span>
        </div>
        <div>
          <strong>{accepted.length}</strong>
          <span>accepted, not yet in the model</span>
        </div>
        <div>
          <strong>{queue.length}</strong>
          <span>worth investigating</span>
        </div>
      </section>

      {runs.length === 0 ? (
        <p className="empty-note">
          No research has been handed off yet. A run starts with a question — see <code>docs/research-routine.md</code>.
        </p>
      ) : null}

      {awaiting.length ? (
        <section className="review-section" aria-label="Waiting on you">
          <h2 className="field-label">Waiting on you</h2>
          <p className="small muted">
            Each of these is a claim somebody wants the model to make. Deciding is where you work out whether it is
            true, and what it would change.
          </p>
          <div className="card-grid">
            {runs
              .filter((run) => run.decided < run.total)
              .map((run) => {
                const status = runStatus(run);
                return (
                  <Link className="card" key={run.id} href={`/review/${run.id}`}>
                    <div className="card-badges">
                      <Badge tone={status.tone}>{status.label}</Badge>
                      <Badge tone="quiet">{run.createdAt}</Badge>
                    </div>
                    <h3>{run.question}</h3>
                    <p className="small muted">{run.synthesis}</p>
                    <p className="small muted">prepared by {run.preparedBy}</p>
                  </Link>
                );
              })}
          </div>
        </section>
      ) : null}

      {accepted.length ? (
        <section className="review-section" aria-label="Accepted, not yet in the model">
          <h2 className="field-label">Accepted, not yet in the model</h2>
          <p className="small muted">
            You decided these are true. The model does not say them yet — that takes a separate change to{" "}
            <code>content/</code> citing the run, decision, and finding in <code>researchTrace</code>.
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
                    : "No target suggested."}{" "}
                  Cite <code>{finding.decisionId}</code> in a <code>researchTrace</code>.
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {queue.length ? (
        <section className="review-section" aria-label="Worth investigating">
          <h2 className="field-label">Worth investigating</h2>
          <p className="small muted">
            Questions somebody asked, then gaps the model has in itself. A scheduled run picks from the top of this
            list. It is the same list <code>npm run research:queue</code> prints.
          </p>
          <ul className="review-list">
            {queue.slice(0, 10).map((entry) => (
              <li key={entry.id}>
                <p className="review-list-title">
                  <Badge tone={entry.kind === "question" ? "accent" : "quiet"}>
                    {entry.kind === "question" ? "asked" : "gap"}
                  </Badge>{" "}
                  {entry.question}
                </p>
                <p className="small muted">
                  {entry.detail}
                  {/* The question already names the subject, so the link is an
                      affordance to go and look at it rather than a repeat of it. */}
                  {entry.subject ? (
                    <>
                      {" "}
                      <Link href={entry.subject.href}>
                        Read the {entry.subject.kind} <span aria-hidden="true">→</span>
                      </Link>
                    </>
                  ) : null}
                </p>
              </li>
            ))}
          </ul>
          {queue.length > 10 ? <p className="small muted">…and {queue.length - 10} more.</p> : null}
        </section>
      ) : null}

      {settled.length ? (
        <section className="review-section" aria-label="Decided">
          <h2 className="field-label">Decided</h2>
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
        </section>
      ) : null}
    </main>
  );
}
