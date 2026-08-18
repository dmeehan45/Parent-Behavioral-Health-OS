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
import { OpenEnds } from "@/components/model/open-ends";
import { ResearchAbout } from "@/components/research/research-about";
import { openEnds } from "@/lib/model/open-ends";
import { notesAboutRecord, researchAboutRecord } from "@/lib/research/glance";
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
  // Research is staging and lives outside the model projection, so it is read
  // here rather than folded into `graph`. Keeping the two apart is what stops a
  // handoff from moving the map's revision — and `researchAboutRecord` is the
  // reason an unreviewed file cannot take a stage page down with it.
  const research = researchAboutRecord(node.contentId);
  const notes = notesAboutRecord(node.contentId);
  // Authority is the guardrail that keeps a proposal from reading as policy, so
  // what the word means cannot live in a `title` a touch reader never sees. The
  // map has the legend for this; here it renders with the provenance at the
  // foot — bookkeeping after the record, never in front of the title.
  const authorityMeaning = graph.vocab.authority.find((term) => term.id === node.authority)?.description;

  const mapHref = (() => {
    const params = new URLSearchParams();
    const lens = node.lenses[0];
    if (lens && lens !== "flow") params.set("lens", lens);
    params.set("open", node.id);
    if (parent) params.set("expand", parent.contentId);
    return `/map?${params.toString()}`;
  })();

  // A bet's page is the reasoning; the run screen is the same software with
  // the reasoning stripped away, fit to put in front of a participant. An
  // unbuilt prototype's href falls back to this page's own, and gets no button.
  const runHref = (() => {
    if (node.kind !== "bet") return undefined;
    const prototype = graph.nodes.find(
      (candidate) => candidate.kind === "prototype" && candidate.contentId === node.contentId,
    );
    return prototype && prototype.href !== node.href ? prototype.href : undefined;
  })();

  return (
    /* The page carries the category it belongs to. Every record page looked
       identical regardless of whether it described a part of the machine, a
       place it breaks, or a number that would settle an argument — the only
       difference was a 10px badge. The hue is the map's own vocabulary, and
       the badge below still says the word. */
    <main className={`shell page record record-${node.kind}`}>
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
            <AuthorityBadge authority={node.authority} title={authorityMeaning} />
            <ConfidenceBadge confidence={node.confidence} />
            {node.status ? <Badge tone="quiet">{node.status}</Badge> : null}
            {node.dataStatus ? <Badge tone="quiet">data {node.dataStatus}</Badge> : null}
          </div>

          <h1>{node.title}</h1>
          {node.subtitle ? <p className="page-subtitle">{node.subtitle}</p> : null}
          {node.summary ? <p className="lede">{node.summary}</p> : null}
        </div>

        <div className="page-head-aside">
          {runHref ? (
            <Link className="button" href={runHref}>
              Run the prototype <span aria-hidden="true">→</span>
            </Link>
          ) : null}
          <Link className="button secondary" href={mapHref}>
            Show on the map <span aria-hidden="true">→</span>
          </Link>
        </div>
      </header>

      {/* No counts strip: every block below already carries its own count, so
          repeating them here said the same thing twice before saying anything. */}
      <DetailBlocks blocks={node.blocks} />

      {/* Everything above is what the model says about this bet. This is how to
          get all of it, plus the problem, the flow, the evidence and the build
          contract, in one piece somebody can hand to whoever is building. A line
          of text rather than a control: it composes nothing and changes nothing,
          and the terminal is where the person running it already is. */}
      {node.kind === "bet" ? (
        <section className="record-command" aria-label="Build from this bet">
          <h2 className="field-label">Building against this</h2>
          <p className="small muted">
            Composes everything on this page, the problem it answers, the steps it lands on, the evidence and its
            weaknesses, the honest unknowns, and this repository&rsquo;s build rules — as one brief.
          </p>
          <code className="queue-command">npm run prototype:brief -- {node.contentId}</code>
        </section>
      ) : null}

      <ResearchAbout items={research} notes={notes} />

      <OpenEnds ends={openEnds(graph, node)} />

      <Provenance
        provenance={node.provenance}
        lastReviewed={node.lastReviewed}
        coverage={node.coverage}
        file={node.file}
        sourceUrl={graph.sourceUrl}
        repoUrl={graph.repoUrl}
        authority={node.authority}
        authorityMeaning={authorityMeaning}
      />
    </main>
  );
}
