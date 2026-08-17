import Link from "next/link";
import { Breadcrumb, KindBadge } from "@/components/model/badges";
import { DetailBlocks } from "@/components/model/detail-blocks";
import { EXPERIMENT_SECTIONS } from "@/lib/content/body";
import { projectModel } from "@/lib/model/graph";

/**
 * The run screen around a prototype route.
 *
 * This is the surface that goes in front of a participant, so it carries as
 * little of the model as honesty allows: a ribbon naming what this is, the bet
 * it tests, and that nothing in it is real — then the interaction. The
 * reasoning a product or technical reader wants — the problem, the experiment,
 * the evidence — lives on the bet's own page, one link away, where it was
 * already rendered from the same projection. Repeating it here made the page a
 * second bet record with software in the middle, and the participant read the
 * answer sheet before the experience.
 *
 * The bet is still resolved from the route, never written in here, so renaming
 * or retargeting a bet updates this surface without touching it.
 */
export function PrototypeShell({ route, children }: { route: string; children: React.ReactNode }) {
  const graph = projectModel();
  const prototype = graph.nodes.find((node) => node.kind === "prototype" && node.href === route);
  const bet = prototype ? graph.nodes.find((node) => node.kind === "bet" && node.contentId === prototype.contentId) : undefined;

  if (!prototype || !bet) {
    return (
      <main className="shell page">
        <Breadcrumb trail={[{ label: "System map", href: "/map" }, { label: "Unlinked prototype" }]} />
        <header className="page-head">
          <div className="page-head-main">
            <h1>This prototype is not linked to a bet</h1>
            <p className="lede">
              No Bet in <code>content/bets/</code> declares <code>prototype.route: {route}</code>, so there is nothing to
              say about what it is testing. Add the route to a Bet to connect it to the model.
            </p>
          </div>
        </header>
        <section className="prototype-stage">{children}</section>
      </main>
    );
  }

  // What a facilitator may need mid-session: what this is meant to settle,
  // what was deliberately left out, and what to watch for. Derived from the
  // Bet's projected blocks, so rewording the model updates the drawer without
  // touching this file. Claims, metrics, and targets stay on the bet's page —
  // they are for the reading audience, not for somebody running a session.
  const experiment = new Set<string>(EXPERIMENT_SECTIONS);
  const context = bet.blocks.filter(
    (block) =>
      (block.type === "links" && block.label === "The problem this answers") ||
      (block.type === "prose" && block.label === "Intervention") ||
      (block.type === "markdown" && (experiment.has(block.label) || block.label.toLowerCase().includes("question"))),
  );

  return (
    <main className="shell prototype-run">
      {/* The page needs a name, but the participant does not need a title
          card. Same pattern as the map's own h1. */}
      <h1 className="visually-hidden">{bet.title} — prototype</h1>

      <div className="run-ribbon">
        <KindBadge kind="prototype" />
        <Link className="run-ribbon-bet" href={bet.href}>
          Tests the bet: {bet.title} <span aria-hidden="true">→</span>
        </Link>
        <span className="run-ribbon-note" title="No real patient, clinician, or practice data appears here">
          Synthetic data · nothing saved
        </span>
      </div>

      <section className="prototype-stage" aria-label="Prototype">
        {children}
      </section>

      {/* Collapsed so a participant never reads what the session is watching
          for before the session. Native disclosure, keyboard-operable as-is. */}
      <details className="disclosure run-about">
        <summary>What this prototype is testing</summary>
        <DetailBlocks blocks={context} />
      </details>
    </main>
  );
}
