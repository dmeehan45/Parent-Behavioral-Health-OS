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

export function Freshness({ lastReviewed, provenance }: { lastReviewed?: string; provenance?: string }) {
  if (!lastReviewed && !provenance) return null;
  return (
    <p className="freshness">
      {provenance ? <>Believed from {provenance}</> : null}
      {provenance && lastReviewed ? " · " : null}
      {lastReviewed ? <>Reviewed {lastReviewed}</> : null}
    </p>
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
