import Link from "next/link";
import { KIND_LABELS } from "@/lib/model/kinds";
import { authorityTone, confidenceTone } from "@/lib/model/vocabulary";
import type { Coverage, NodeKind, Tone } from "@/lib/model/types";

export function KindBadge({ kind, subtle }: { kind: NodeKind; subtle?: boolean }) {
  return (
    <span className={`kind-badge kind-${kind}${subtle ? " subtle" : ""}`} data-kind={kind}>
      {KIND_LABELS[kind]}
    </span>
  );
}

export function Badge({ tone = "neutral", title, children }: { tone?: Tone; title?: string; children: React.ReactNode }) {
  return (
    <span className={`badge tone-${tone}`} title={title}>
      {children}
    </span>
  );
}

/**
 * Authority is the guardrail that keeps speculation from reading as policy, so
 * it is shown wherever a primitive is shown rather than buried in a detail page.
 */
export function AuthorityBadge({ authority, title }: { authority?: string; title?: string }) {
  if (!authority) return null;
  return (
    <Badge tone={authorityTone(authority)} title={title ?? `Authority: ${authority}`}>
      {authority}
    </Badge>
  );
}

export function ConfidenceBadge({ confidence }: { confidence?: string }) {
  if (!confidence) return null;
  return (
    <Badge tone={confidenceTone(confidence)} title={`Confidence: ${confidence}`}>
      {confidence} confidence
    </Badge>
  );
}

/**
 * How much of a primitive has been described.
 *
 * Deliberately not framed as a completion score — the schemas are permissive on
 * purpose. It exists so a reader can tell "nothing here yet" apart from "richly
 * described", and so the next contributor can see where to aim.
 */
export function CoverageMeter({ coverage, label = "described" }: { coverage: Coverage; label?: string }) {
  const ratio = coverage.total === 0 ? 0 : coverage.filled / coverage.total;
  const level = ratio >= 0.66 ? "high" : ratio >= 0.33 ? "medium" : "low";
  return (
    <span
      className={`coverage coverage-${level}`}
      title={
        coverage.missing.length > 0
          ? `Not described yet: ${coverage.missing.join(", ")}`
          : "Every modelable field is populated"
      }
    >
      <span className="coverage-track" aria-hidden="true">
        <span className="coverage-fill" style={{ width: `${Math.round(ratio * 100)}%` }} />
      </span>
      <span className="coverage-text">
        {coverage.filled}/{coverage.total} {label}
      </span>
    </span>
  );
}

/** Names the fields a primitive has not described, so the gap is actionable. */
export function CoverageGaps({ coverage }: { coverage: Coverage }) {
  if (coverage.missing.length === 0) return null;
  return (
    <div className="coverage-gaps">
      <span className="field-label">Not described yet</span>
      <div className="chips">
        {coverage.missing.map((field) => (
          <span className="chip quiet" key={field}>
            {field}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Everything about a primitive that is not the primitive itself.
 *
 * Provenance, freshness, how much has been described, and the file it came from
 * all matter, and none of them are what the reader came for. Gathered here they
 * sit after the substance instead of in front of it, in one place on every
 * surface. Authority is deliberately *not* here: it separates a proposal from an
 * approved rule, so it stays on the face of the record.
 */
export function Provenance({
  provenance,
  lastReviewed,
  coverage,
  file,
  sourceUrl,
  repoUrl,
  authority,
  authorityMeaning,
}: {
  provenance?: string;
  lastReviewed?: string;
  coverage: Coverage;
  file: string;
  sourceUrl?: string;
  /** When set, the source line becomes the invitation to go deeper: the
      repository is the model, and an agent pointed at it reads all of it. */
  repoUrl?: string;
  /** What the record's authority word means, said in words a touch reader can
      reach. It lives here with the rest of the bookkeeping, after the record
      has said its piece, rather than in front of the title. */
  authority?: string;
  authorityMeaning?: string;
}) {
  return (
    <section className="provenance" aria-label="Where this comes from">
      <span className="field-label">Where this comes from</span>
      <div className="provenance-row">
        <CoverageMeter coverage={coverage} />
        {provenance ? <span className="small muted">believed from {provenance}</span> : null}
        {lastReviewed ? <span className="small muted">reviewed {lastReviewed}</span> : null}
      </div>
      {authority && authorityMeaning ? (
        <p className="authority-note">
          <strong>{authority}</strong> — {authorityMeaning}
        </p>
      ) : null}
      <CoverageGaps coverage={coverage} />
      {repoUrl ? (
        <p className="agent-door">
          Projected from <SourceLink file={file} sourceUrl={sourceUrl} />. The repository is the model —{" "}
          <a href={repoUrl} target="_blank" rel="noreferrer">
            clone it
          </a>{" "}
          and ask your agent to go deeper.
        </p>
      ) : (
        <SourceLink file={file} sourceUrl={sourceUrl} />
      )}
    </section>
  );
}

/** Links straight to the canonical file, because the repository is the model. */
export function SourceLink({ file, sourceUrl }: { file: string; sourceUrl?: string }) {
  if (!sourceUrl) return <span className="source-path">{file}</span>;
  return (
    <a className="source-path" href={`${sourceUrl.replace(/\/$/, "")}/${file}`} target="_blank" rel="noreferrer">
      {file} ↗
    </a>
  );
}

export function Breadcrumb({ trail }: { trail: Array<{ label: string; href?: string }> }) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {trail.map((crumb, index) => (
        <span key={`${crumb.label}-${index}`}>
          {index > 0 ? <span aria-hidden="true">/</span> : null}
          {crumb.href ? <Link href={crumb.href}>{crumb.label}</Link> : <span aria-current="page">{crumb.label}</span>}
        </span>
      ))}
    </nav>
  );
}
