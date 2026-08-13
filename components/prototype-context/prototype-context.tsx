import Link from "next/link";
import { getRepository } from "@/lib/content/repository";
import { MetricChip } from "@/components/metric-chip/metric-chip";

/**
 * The context band shown on a prototype page: which bet it tests, what that bet
 * targets, and which metrics would move if it worked.
 *
 * A prototype finds its own bet by matching the route it is mounted at, so this
 * stays correct when a bet's targets or metrics change. The alternative — typing
 * the bet's title, targets, and metrics into the page — drifts silently, which
 * is what it did before.
 */
export function PrototypeContext({ route }: { route: string }) {
  const repo = getRepository();
  const bet = repo.bets.find((b) => b.prototype?.route === route);
  if (!bet) return null;

  const targets = bet.targets
    .map((id) => {
      const stage = repo.stages.find((s) => s.id === id);
      if (stage) return { id, title: stage.title, href: `/stages/${id}` };
      const step = repo.steps.find((s) => s.id === id);
      return step ? { id, title: step.title, href: `/steps/${id}` } : null;
    })
    .filter((x) => x !== null);

  const metrics = repo.metrics.filter((m) => bet.metrics?.includes(m.id));

  return (
    <section className="section grid two">
      <div>
        <span className="eyebrow">This prototype tests</span>
        <h2 style={{ marginTop: 10 }}>
          <Link href={`/bets/${bet.id}`}>{bet.title}</Link>
        </h2>
        {targets.length > 0 && (
          <>
            <p className="muted">Against:</p>
            <div className="chips">
              {targets.map((t) => (
                <Link className="chip" key={t.id} href={t.href}>
                  {t.title}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
      {metrics.length > 0 && (
        <div>
          <span className="eyebrow">Success would affect</span>
          <div className="chips" style={{ marginTop: 10 }}>
            {metrics.map((m) => (
              <MetricChip key={m.id} id={m.id} title={m.title} status={m.dataStatus} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
