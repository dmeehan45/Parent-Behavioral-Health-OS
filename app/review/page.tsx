import Link from "next/link";
import { Badge, Breadcrumb } from "@/components/model/badges";
import { projectReview } from "@/lib/research/projection";
import { runStatus } from "@/lib/research/view";

/**
 * Research is staging, and staging changes whenever somebody pushes a handoff.
 * A prerendered index would show yesterday's review queue.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Review · Parent Behavioral Health OS",
  description: "Research proposed by an agent, waiting for a person to decide what the model should do about it.",
};

export default function ReviewIndexPage() {
  const { runs } = projectReview();
  const waiting = runs.filter((run) => run.decided < run.total);

  return (
    <main className="shell page">
      <Breadcrumb trail={[{ label: "System map", href: "/map" }, { label: "Review" }]} />

      <header className="page-head">
        <div className="page-head-main">
          <h1>Review</h1>
          <p className="lede">
            Research arrives here as a proposal, never as a change. Nothing on this page has altered the model. Reading a
            run and deciding what it means is the step where the model actually learns something — and the only step a
            person does.
          </p>
        </div>
      </header>

      {runs.length === 0 ? (
        <p className="empty-note">
          No research has been handed off yet. A run starts with a question: <code>npm run research:queue</code> shows
          what is waiting to be asked.
        </p>
      ) : null}

      {waiting.length ? (
        <p className="page-note">
          {waiting.length} run{waiting.length === 1 ? "" : "s"} waiting on you.
        </p>
      ) : null}

      <div className="card-grid">
        {runs.map((run) => {
          const status = runStatus(run);
          return (
            <Link className="card" key={run.id} href={`/review/${run.id}`}>
              <div className="card-badges">
                <Badge tone={status.tone}>{status.label}</Badge>
                <Badge tone="quiet">{run.createdAt}</Badge>
              </div>
              <h2>{run.question}</h2>
              <p className="small muted">{run.synthesis}</p>
              <p className="small muted">
                {run.total} finding{run.total === 1 ? "" : "s"} · prepared by {run.preparedBy}
              </p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
