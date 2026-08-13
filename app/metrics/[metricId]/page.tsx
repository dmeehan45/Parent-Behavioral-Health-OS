import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepository } from "@/lib/content/repository";
import { ProvenanceNote } from "@/components/provenance/provenance";
import { targetLinks } from "@/lib/content/links";

export function generateStaticParams() {
  return getRepository().metrics.map((metric) => ({ metricId: metric.id }));
}

const DIRECTION: Record<string, string> = {
  lower: "lower is better",
  higher: "higher is better",
  target: "a target value is better",
};

export default async function MetricPage({ params }: { params: Promise<{ metricId: string }> }) {
  const { metricId } = await params;
  const repo = getRepository();
  const metric = repo.metrics.find((m) => m.id === metricId);
  if (!metric) notFound();

  const targets = targetLinks(repo, metric.targets ?? []);
  const bets = repo.bets.filter((bet) => bet.metrics?.includes(metric.id));
  // Stages can nominate a metric from their own frontmatter as well as being
  // named by the metric, so both directions are surfaced together.
  const stages = repo.stages.filter((s) => s.metrics?.includes(metric.id) && !metric.targets?.includes(s.id));

  return (
    <main className="shell main">
      <div className="breadcrumb">
        <Link href="/map">System map</Link>
        <span>→</span>
        <span>Metric</span>
        <span>→</span>
        <span>{metric.title}</span>
      </div>

      <header className="detail-head">
        <div>
          <span className="eyebrow">Metric</span>
          <h1>{metric.title}</h1>
          {metric.body && <p className="lede">{metric.body}</p>}
        </div>
        <div className="meta">
          {metric.unit && <span>{metric.unit}</span>}
          {metric.direction && <span>{DIRECTION[metric.direction] ?? metric.direction}</span>}
        </div>
      </header>

      <div className="grid two">
        <div>
          <section className="section">
            <h2>Data status</h2>
            <p>
              <span className="chip">{metric.dataStatus ?? "unknown"}</span>
            </p>
            <p className="muted">
              An important metric is not necessarily one we currently collect. This field records that
              distinction rather than implying the measure exists.
            </p>
          </section>
          {bets.length > 0 && (
            <section className="section">
              <h2>Bets intending to move it</h2>
              <ul className="list">
                {bets.map((bet) => (
                  <li key={bet.id}>
                    <Link href={`/bets/${bet.id}`}>{bet.title}</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <aside>
          {(targets.length > 0 || stages.length > 0) && (
            <section className="section">
              <h2>Measures</h2>
              <div className="chips">
                {targets.map((target) => (
                  <Link className="chip" key={target.id} href={target.href}>
                    {target.title}
                  </Link>
                ))}
                {stages.map((stage) => (
                  <Link className="chip" key={stage.id} href={`/stages/${stage.id}`}>
                    {stage.title}
                  </Link>
                ))}
              </div>
            </section>
          )}
          <ProvenanceNote provenance={metric.provenance} lastReviewed={metric.lastReviewed} />
        </aside>
      </div>
    </main>
  );
}
