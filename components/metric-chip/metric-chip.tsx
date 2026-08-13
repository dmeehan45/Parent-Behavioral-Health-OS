import Link from "next/link";

/**
 * A metric reference. Carries its `dataStatus` so a reader can tell a measure we
 * collect from one we merely consider important.
 *
 * Renders as a link when an `id` is supplied, which is how metrics become
 * navigable from the stages, steps, and bets that name them.
 */
export function MetricChip({ id, title, status }: { id?: string; title: string; status?: string }) {
  const label = `${title}${status ? ` · ${status}` : ""}`;
  if (!id) return <span className="chip">{label}</span>;
  return (
    <Link className="chip" href={`/metrics/${id}`}>
      {label}
    </Link>
  );
}
