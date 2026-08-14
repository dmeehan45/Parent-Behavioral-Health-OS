import { projectModel } from "@/lib/model/graph";
import { MapWorkspace, type MapView } from "@/components/map/map-workspace";
import type { LensId } from "@/lib/model/types";

/**
 * Rendered per request so a deep link opens on the current model, then the
 * workspace keeps itself in step with `content/` from the client.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "System map · Parent Behavioral Health OS",
  description: "An interactive projection of how the operating model works, what we believe, and what we are betting on.",
};

type Search = Promise<Record<string, string | string[] | undefined>>;

/** View state arrives in the URL, so a shared link opens the same picture. */
function readView(params: Record<string, string | string[] | undefined>, lensIds: LensId[], nodeIds: Set<string>): MapView {
  const single = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined);

  const lensParam = single("lens") as LensId | undefined;
  const lens = lensParam && lensIds.includes(lensParam) ? lensParam : "flow";

  // An id that no longer resolves is passed through rather than dropped. The
  // sheet already has a "No longer in the model" state for the live case, and
  // silently ignoring it left someone following a shared link to a renamed
  // primitive looking at the default view with no idea why.
  // Anything shaped like a node id is kept even when nothing answers to it; the
  // sheet renders its "No longer in the model" state and the reader learns why
  // they are not looking at what they were sent.
  const openParam = single("open");
  const open = openParam?.includes(":") ? openParam : undefined;

  const expand = (single("expand") ?? "")
    .split(",")
    .map((id) => `stage:${id.trim()}`)
    .filter((id) => nodeIds.has(id));

  return { lens, open, expand };
}

export default async function MapPage({ searchParams }: { searchParams: Search }) {
  const graph = projectModel();
  const params = await searchParams;
  const view = readView(
    params,
    graph.lenses.map((lens) => lens.id),
    new Set(graph.nodes.map((node) => node.id)),
  );

  return <MapWorkspace initialGraph={graph} initialView={view} />;
}
