import Link from "next/link";
import { Badge, Breadcrumb, ConfidenceBadge, KindBadge, SourceLink } from "@/components/model/badges";
import { DetailBlocks } from "@/components/model/detail-blocks";
import { EXPERIMENT_SECTIONS } from "@/lib/content/body";
import { projectModel } from "@/lib/model/graph";

/**
 * Chrome around a prototype route.
 *
 * A prototype only means something next to the bet it tests, so the surrounding
 * context — the problem, the intervention, what it is aimed at, and what would
 * have to move for it to be working — is resolved from the Bet whose
 * `prototype.route` points here. Nothing about the model is written into the
 * prototype page itself, so renaming a bet or retargeting it updates this
 * automatically.
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

  // The problem comes first: the software only means something next to what it
  // was built against. Both come from the Bet's projected blocks, so retargeting
  // or rewording the model updates this page without touching it.
  const problem = bet.blocks.find((block) => block.type === "links" && block.label === "The problem this answers");
  const targets = bet.blocks.find((block) => block.type === "links" && block.label === "Where it lands");
  // The experiment sections come across whole. A reviewer standing in front of
  // the software should be able to see what it is meant to settle, what was
  // deliberately left out, and what to watch for — without the builder there to
  // narrate it.
  const experiment = new Set<string>(EXPERIMENT_SECTIONS);
  const context = bet.blocks.filter(
    (block) =>
      (block.type === "prose" && block.label === "Intervention") ||
      (block.type === "links" && (block.label === "Success would affect" || block.label === "Supporting claims")) ||
      (block.type === "markdown" && (experiment.has(block.label) || block.label.toLowerCase().includes("question"))),
  );

  return (
    <main className="shell page prototype-page">
      <Breadcrumb
        trail={[
          { label: "System map", href: "/map" },
          { label: "Prototypes", href: "/prototypes" },
          { label: bet.title, href: bet.href },
          { label: "Prototype" },
        ]}
      />

      <header className="page-head">
        <div className="page-head-main">
          <div className="page-head-badges">
            <KindBadge kind="prototype" />
            {prototype.status ? <Badge tone="accent">{prototype.status}</Badge> : null}
            <ConfidenceBadge confidence={bet.confidence} />
            <Badge tone="quiet" title="No real patient, clinician, or practice data appears here">
              synthetic data only
            </Badge>
          </div>
          <h1>{bet.title}</h1>
          {bet.summary ? <p className="lede">{bet.summary}</p> : null}
        </div>

        <div className="page-head-aside">
          <Link className="button secondary" href={bet.href}>
            <span aria-hidden="true">←</span> Back to the bet
          </Link>
          <Link className="button secondary" href={`/map?lens=bets&open=${encodeURIComponent(prototype.id)}`}>
            Show on the map <span aria-hidden="true">→</span>
          </Link>
          <SourceLink file={bet.file} sourceUrl={graph.sourceUrl} />
        </div>
      </header>

      <section className="prototype-stage" aria-label="Prototype">
        {children}
      </section>

      <section className="prototype-context">
        <h2>What this prototype is testing</h2>
        {/* Level three: these sit under this section's own h2, not under the h1. */}
        <DetailBlocks
          blocks={[...(problem ? [problem] : []), ...(targets ? [targets] : []), ...context]}
          headingLevel={3}
        />
      </section>
    </main>
  );
}
