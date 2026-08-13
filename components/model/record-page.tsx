import Link from "next/link";
import { DetailBlocks } from "@/components/model/detail-blocks";
import {
  AuthorityBadge,
  Badge,
  Breadcrumb,
  ConfidenceBadge,
  CoverageGaps,
  CoverageMeter,
  Freshness,
  KindBadge,
  SourceLink,
} from "@/components/model/badges";
import { KIND_LABELS } from "@/lib/model/kinds";
import type { ModelGraph, ModelNode } from "@/lib/model/types";

/**
 * The full-page read of any primitive.
 *
 * Stages, steps, bets, claims, metrics, entities, and prototypes all render
 * through here, from the same projection the map uses. That is what keeps the
 * two surfaces honest with each other and means a new kind of content cannot
 * end up with a page that quietly omits half of it.
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
          <Freshness lastReviewed={node.lastReviewed} provenance={node.provenance} />
        </div>

        <div className="page-head-aside">
          <CoverageMeter coverage={node.coverage} />
          <Link className="button secondary" href={mapHref}>
            Show on the map <span aria-hidden="true">→</span>
          </Link>
          <SourceLink file={node.file} sourceUrl={graph.sourceUrl} />
        </div>
      </header>

      {node.signals.some((signal) => signal.value > 0) ? (
        <div className="page-signals">
          {node.signals
            .filter((signal) => signal.value > 0)
            .map((signal) => (
              <span key={signal.label} className={`page-signal tone-${signal.tone}`}>
                <b>{signal.value}</b>
                {signal.label}
              </span>
            ))}
        </div>
      ) : null}

      <DetailBlocks blocks={node.blocks} />

      <CoverageGaps coverage={node.coverage} />

      <p className="page-note">
        This {KIND_LABELS[node.kind].toLowerCase()} is projected from <code>{node.file}</code>. The repository is
        canonical; this page is a view of it.
      </p>
    </main>
  );
}
