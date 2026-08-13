import Link from "next/link";
import { Badge, Breadcrumb, ConfidenceBadge, CoverageMeter } from "@/components/model/badges";
import { projectModel } from "@/lib/model/graph";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Prototypes · Parent Behavioral Health OS",
  description: "Working software that makes individual bets concrete.",
};

/**
 * Every prototype in the model, derived from Bets that declare one. Bets that
 * intend a prototype but have not built it are listed too, because the gap
 * between intent and working software is part of what the model records.
 */
export default function PrototypesPage() {
  const graph = projectModel();
  const prototypes = graph.nodes
    .filter((node) => node.kind === "prototype")
    .map((prototype) => ({
      prototype,
      bet: graph.nodes.find((node) => node.kind === "bet" && node.contentId === prototype.contentId),
    }));

  return (
    <main className="shell page">
      <Breadcrumb trail={[{ label: "System map", href: "/map" }, { label: "Prototypes" }]} />

      <header className="page-head">
        <div className="page-head-main">
          <h1>Prototypes</h1>
          <p className="lede">
            Working software that makes one bet concrete. Prototypes use synthetic data and exist to make an idea
            testable, not to become production systems.
          </p>
        </div>
      </header>

      {prototypes.length === 0 ? (
        <p className="empty-note">
          No Bet in <code>content/bets/</code> declares a prototype yet.
        </p>
      ) : (
        <ul className="card-grid">
          {prototypes.map(({ prototype, bet }) => {
            const launchable = prototype.href.startsWith("/prototypes/");
            return (
              <li key={prototype.id}>
                <article className="card">
                  <div className="card-badges">
                    <Badge tone={launchable ? "accent" : "quiet"}>{prototype.status ?? "unknown"}</Badge>
                    <ConfidenceBadge confidence={bet?.confidence} />
                  </div>
                  <h2>{bet?.title ?? prototype.title}</h2>
                  {bet?.summary ? <p className="muted">{bet.summary}</p> : null}
                  {bet ? <CoverageMeter coverage={bet.coverage} /> : null}
                  <div className="card-actions">
                    {launchable ? (
                      <Link className="button" href={prototype.href}>
                        Launch prototype <span aria-hidden="true">→</span>
                      </Link>
                    ) : (
                      <span className="muted small">Not built yet</span>
                    )}
                    {bet ? (
                      <Link className="button secondary" href={bet.href}>
                        Read the bet
                      </Link>
                    ) : null}
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
