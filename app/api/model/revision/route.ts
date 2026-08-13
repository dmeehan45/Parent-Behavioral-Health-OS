import { contentRevision } from "@/lib/model/revision";

/**
 * A cheap fingerprint of `content/`, polled by every open map.
 *
 * Separating this from the full projection keeps the steady-state cost of
 * staying live to a few bytes per client.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { revision: contentRevision() },
    { headers: { "cache-control": "no-store, must-revalidate" } },
  );
}
