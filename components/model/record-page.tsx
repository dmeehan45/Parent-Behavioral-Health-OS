import Link from "next/link";
import { DetailBlocks } from "@/components/model/detail-blocks";
import {
  AuthorityBadge,
  Badge,
  Breadcrumb,
  ConfidenceBadge,
  KindBadge,
  Provenance,
} from "@/components/model/badges";
import type { ModelGraph, ModelNode } from "@/lib/model/types";

/**
 * The full-page read of any primitive.
 *
 * Stages, steps, problems, bets, claims, metrics, entities, and prototypes all
 * render through here, from the same projection the map uses. That is what keeps
 * the two surfaces honest with each other and means a new kind of content cannot
 * end up with a page that quietly omits half of it.
 *
 * The page reads in one order: what this is, what it says, then where it came
 * from. Coverage, freshness, and the source path used to sit above the first
 * sentence, which put bookkeeping in front of the writing on every record.
 */
export function RecordPage({ graph, node }: { graph: ModelGraph; node: ModelNode }) {
  const parent = node.parentId ? graph.nodes.find((candidate) => candidate.id === node.parentId) : undefined;

  const mapHref = (() => {
    const params = new URLSearchParams();
    const lens = node.lenses[0];
    if (lens && lens !== "flow") params.set("lens", lens);
    params.set("open", node.id);
    if (parent) params.set("expand", parent.contentId);
    return `/map?${params.toString()}`;
  })();

  return (
    <main className="shell page">
      <Breadcrumb
        trail={[
          { label: "System map", href: "/map" },
          ...(parent ? [{ label: parent.title, href: parent.href }] : []),
          { label: node.title },
        ]}
      />

      <header className="page-head">
        <div className="page-head-main">
          <div className="page-head-badges">
            <KindBadge kind={node.kind} />
            <AuthorityBadge
              authority={node.authority}
              title={graph.vocab.authority.find((term) => term.id === node.authority)?.description}
            />
            <ConfidenceBadge confidence={node.confidence} />
            {node.status ? <Badge tone="quiet">{node.status}</Badge> : null}
            {node.dataStatus ? <Badge tone="quiet">data {node.dataStatus}</Badge> : null}
          </div>

          <h1>{node.title}</h1>
          {node.subtitle ? <p className="page-subtitle">{node.subtitle}</p> : null}
          {node.summary ? <p className="lede">{node.summary}</p> : null}
        </div>

        <div className="page-head-aside">
          <Link className="button secondary" href={mapHref}>
            Show on the map <span aria-hidden="true">→</span>
          </Link>
        </div>
      </header>

      {/* No counts strip: every block below already carries its own count, so
          repeating them here said the same thing twice before saying anything. */}
      <DetailBlocks blocks={node.blocks} />

      <Provenance
        provenance={node.provenance}
        lastReviewed={node.lastReviewed}
        coverage={node.coverage}
        file={node.file}
        sourceUrl={graph.sourceUrl}
      />
    </main>
  );
}
