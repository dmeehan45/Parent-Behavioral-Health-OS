import type { Provenance } from "@/lib/schemas";

/**
 * Why we believe something, and when it was last looked at.
 *
 * Git records who changed a file. Provenance records the reasoning behind the
 * content, which is the part a future reader — or a future agent — actually
 * needs in order to judge how much weight to give it. Every primitive carries
 * this, so it is worth showing rather than storing invisibly.
 *
 * Renders nothing when a file declares no provenance and no review date.
 */
export function ProvenanceNote({
  provenance,
  lastReviewed,
}: {
  provenance?: Provenance;
  lastReviewed?: Date;
}) {
  const references = provenance?.references ?? [];
  if (!provenance?.source && !lastReviewed && references.length === 0) return null;

  return (
    <section className="section">
      <h2>Provenance</h2>
      {provenance?.source && (
        <p className="muted">
          Source: <strong>{provenance.source}</strong>
        </p>
      )}
      {lastReviewed && <p className="muted">Last reviewed {lastReviewed.toISOString().slice(0, 10)}</p>}
      {references.length > 0 && (
        <ul className="list">
          {references.map((reference) => (
            <li key={reference}>{reference}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
