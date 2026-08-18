import Link from "next/link";
import { Badge, Breadcrumb } from "@/components/model/badges";
import { SinceLastLook } from "@/components/review/since-last-look";
import { projectReview } from "@/lib/research/projection";
import {
  FINDING_STATE_LABEL,
  FINDING_STATE_TONE,
  allFindings,
  runStatus,
  type QueueEntry,
} from "@/lib/research/view";

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
 * Ordered by what is owed, not by what exists: decide, then apply, then choose
 * what to look into. Open research is grouped around the product decision or
 * operating stage it is meant to improve. Model-detected gaps are inventory,
 * collapsed by default, rather than fifty apparent assignments for a reviewer.
 */
export default function ReviewIndexPage() {
  const { runs, queue, families, inventoryGroups, researchBlocked } = projectReview();
  const findings = allFindings(runs);

  const awaiting = findings.filter(({ finding }) => finding.state === "awaiting");
  const accepted = findings.filter(({ finding }) => finding.state === "accepted");
  const settled = runs.filter((run) => run.total > 0 && run.decided === run.total);
  const openRuns = runs.filter((run) => run.decided < run.total);
  const inventoryCount = inventoryGroups.reduce((count, group) => count + group.gaps.length, 0);

  // What is owed, in the same units as the navigation badge: undecided
  // findings *and* undecided proposals. The page once counted findings alone,
  // so the badge said 15 while this line said 7 and the queue looked different
  // depending on where you stood.
  const undecided = runs.reduce((count, run) => count + (run.total - run.decided), 0);
  const proposalsAwaiting = undecided - awaiting.length;

  return (
    <main className="shell page">
      <Breadcrumb trail={[{ label: "System map", href: "/map" }, { label: "Research" }]} />

      <header className="page-head">
        <div className="page-head-main">
          <h1>Research</h1>
          <p className="lede">
            Research exists to improve a decision, Bet, or prototype. Review what we already learned first; then work
            the smallest research family that can change what we build or test next.
          </p>
        </div>
      </header>

      <SinceLastLook ids={[...runs.map((run) => run.id), ...findings.map(({ finding }) => finding.decisionId)]} />

      <p className="review-standing">
        <strong>{undecided}</strong> waiting on you
        {proposalsAwaiting > 0 ? (
          <span className="muted">
            {" "}
            ({awaiting.length} finding{awaiting.length === 1 ? "" : "s"} · {proposalsAwaiting} proposal
            {proposalsAwaiting === 1 ? "" : "s"})
          </span>
        ) : null}{" "}
        · <strong>{accepted.length}</strong> ready to apply · <strong>{queue.length}</strong> queued across{" "}
        <strong>{families.length}</strong> research famil{families.length === 1 ? "y" : "ies"} ·{" "}
        <strong>{inventoryCount}</strong> parked gap{inventoryCount === 1 ? "" : "s"}
      </p>

      {runs.length === 0 ? (
        <p className="empty-note">
          No research has been handed off yet. A run starts with a question — see <code>docs/research-routine.md</code>.
        </p>
      ) : null}

      {openRuns.length ? (
        <section className="review-section" aria-label="Waiting on you">
          <h2 className="field-label">
            Waiting on you <span className="field-count">{undecided}</span>
          </h2>
          <p className="small muted">
            Clear this before starting another run. Research that has already returned is more valuable than another
            question until somebody decides what it changes.
          </p>
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
        <section className="review-section" aria-label="Research families">
          <h2 className="field-label">
            Research families <span className="field-count">{families.length}</span>
          </h2>
          <p className="small muted">
            {researchBlocked
              ? "New research is paused while review or application debt remains. The first marked question is what rises next once that debt is cleared."
              : "These are the questions intentionally admitted to research, grouped by the product decision or operating area they are meant to improve."}
          </p>

          <div className="card-grid">
            {families.map((family) => (
              <article className="card" key={family.id}>
                <div className="card-badges">
                  <Badge tone={family.kind === "bet" ? "accent" : "quiet"}>
                    {family.kind === "bet" ? "Bet-linked" : family.kind === "stage" ? "Stage-linked" : "Cross-cutting"}
                  </Badge>
                  {family.prototypeStatus ? <Badge tone="evidence">prototype · {family.prototypeStatus}</Badge> : null}
                </div>
                <h3>{family.href ? <Link href={family.href}>{family.title}</Link> : family.title}</h3>
                <p className="small muted">{family.detail}</p>
                <QueueList
                  entries={family.questions}
                  nextId={queue[0]?.id}
                  researchBlocked={researchBlocked}
                />
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="review-section" aria-label="Research families">
          <h2 className="field-label">Research families</h2>
          <p className="empty-note">No unanswered question is currently admitted to research.</p>
        </section>
      )}

      {inventoryCount ? (
        <details className="disclosure review-section">
          <summary>
            Research inventory <span className="field-count">{inventoryCount}</span>
          </summary>
          <p className="small muted">
            These are gaps the model or an earlier run noticed. They are not active research work and do not compete
            with the prioritized families above. Promote one only when answering it would change a decision, Bet, or
            prototype.
          </p>
          {inventoryGroups.map((group) => (
            <div key={group.id}>
              <h3>{group.href ? <Link href={group.href}>{group.title}</Link> : group.title}</h3>
              <QueueList entries={group.gaps} />
            </div>
          ))}
        </details>
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

function QueueList({
  entries,
  nextId,
  researchBlocked = false,
}: {
  entries: QueueEntry[];
  nextId?: string;
  researchBlocked?: boolean;
}) {
  return (
    <ul className="review-list">
      {entries.map((entry) => (
        <li key={entry.id} id={entry.kind === "question" ? entry.id : undefined}>
          <p className="review-list-title">
            {entry.priority ? (
              <Badge tone={entry.priority === "high" ? "warn" : "quiet"}>{entry.priority} priority</Badge>
            ) : null}{" "}
            {entry.id === nextId ? (
              <Badge tone="accent">{researchBlocked ? "next after review" : "next research"}</Badge>
            ) : null}{" "}
            {entry.blocking?.length ? <Badge tone="warn">a Bet is waiting</Badge> : null}{" "}
            {entry.kind === "gap" ? <Badge tone="quiet">parked gap</Badge> : null}{" "}
            {entry.question}
          </p>
          <p className="small muted">
            {entry.blocking?.length ? `${entry.blocking.join(", ")} is scoped around not knowing this. ` : ""}
            {entry.detail}
            {entry.targets?.length ? ` Touches ${entry.targets.map((target) => target.title).join(", ")}.` : ""}
            {entry.subject ? (
              <>
                {" "}
                <Link href={entry.subject.href}>
                  Read the {entry.subject.kind} <span aria-hidden="true">→</span>
                </Link>
              </>
            ) : null}
          </p>
          {entry.kind === "gap" ? <code className="queue-command">{askCommand(entry)}</code> : null}
        </li>
      ))}
    </ul>
  );
}

/** The exact line that promotes this parked gap into an authored question. */
function askCommand(entry: QueueEntry) {
  return [
    "npm run research:ask --",
    JSON.stringify(entry.question),
    ...(entry.subject ? [`--targets ${entry.subject.id}`] : []),
    `--why ${JSON.stringify(entry.detail)}`,
  ].join(" ");
}
