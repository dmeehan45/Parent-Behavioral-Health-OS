import Link from "next/link";
import type { OpenEnd } from "@/lib/model/open-ends";

/**
 * The loose ends on this record, as an invitation to think.
 *
 * Placed last, after everything the model does say, because it is the question
 * a reader leaves with rather than the thing they arrived for. Capped at four:
 * the point is to offer somewhere to go next, and a list long enough to need
 * scanning is another wall rather than a way out of one.
 */
export function OpenEnds({ ends }: { ends: OpenEnd[] }) {
  if (ends.length === 0) return null;

  return (
    <section className="open-ends" aria-label="Where this is unfinished">
      <h2 className="field-label">Where this is unfinished</h2>
      <ul className="open-ends-list">
        {ends.slice(0, 4).map((end) => (
          <li key={end.invitation}>
            {end.invitation}
            {end.href ? (
              <>
                {" "}
                <Link href={end.href}>
                  {end.linkLabel} <span aria-hidden="true">→</span>
                </Link>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
