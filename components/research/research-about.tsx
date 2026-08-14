import Link from "next/link";
import { Badge } from "@/components/model/badges";
import { FINDING_STATE_LABEL, FINDING_STATE_TONE, type ReviewFinding, type ReviewRun } from "@/lib/research/view";

/**
 * What research has said about this record.
 *
 * The model and the research about it were two separate worlds: a run named the
 * stage it would land on, and the stage had no idea. Someone reading a stage
 * could not tell that two findings were sitting in review proposing to change
 * it, which is exactly the thing they would want to know before reasoning from
 * it — or before writing a bet against it.
 *
 * Deliberately not on the map. The map's projection reads `content/` only, and
 * `contentRevision()` hashes `content/` only, so a research badge painted on a
 * node would go stale the moment a handoff landed and would not correct itself
 * until something canonical changed. A record page is rendered per request, so
 * here it is always current.
 */
export function ResearchAbout({ items }: { items: Array<{ run: ReviewRun; finding: ReviewFinding }> }) {
  if (items.length === 0) return null;

  const awaiting = items.filter(({ finding }) => finding.state === "awaiting").length;

  return (
    <section className="research-about" aria-label="Research about this">
      <h2 className="field-label">
        Research about this <span className="field-count">{items.length}</span>
      </h2>
      {awaiting ? (
        <p className="small muted">
          {awaiting} of these {awaiting === 1 ? "is" : "are"} waiting on a decision. Nothing here has changed what this
          record says.
        </p>
      ) : null}

      <ul className="review-list">
        {items.map(({ run, finding }) => (
          <li key={finding.decisionId}>
            <Badge tone={FINDING_STATE_TONE[finding.state]}>{FINDING_STATE_LABEL[finding.state]}</Badge>{" "}
            <Link href={`/review/${run.id}`}>{finding.statement}</Link>
            <span className="small muted">
              {" "}
              — {finding.evidenceStance}, {finding.evidenceQuality} evidence, from {run.createdAt}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
