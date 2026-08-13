import { projectModel } from "@/lib/model/graph";

/**
 * The whole projected model, served fresh on every request.
 *
 * This is what makes the map reactive rather than a build artefact: an open
 * browser polls the revision endpoint and pulls from here whenever `content/`
 * changes underneath it, whether the change came from a push, a merge, or a
 * local edit made through a tool wired to the repository.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(projectModel(), {
    headers: { "cache-control": "no-store, must-revalidate" },
  });
}
