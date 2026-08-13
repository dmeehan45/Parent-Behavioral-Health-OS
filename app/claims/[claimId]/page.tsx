import { notFound } from "next/navigation";
import { RecordPage } from "@/components/model/record-page";
import { findNode, nodeMetadata } from "@/lib/model/lookup";

/** Rendered per request so a push to `content/` is reflected without a rebuild. */
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ claimId: string }> };

export async function generateMetadata({ params }: Params) {
  const resolved = await params;
  return nodeMetadata("claim", resolved.claimId);
}

export default async function Page({ params }: Params) {
  const resolved = await params;
  const found = findNode("claim", resolved.claimId);
  if (!found) notFound();
  return <RecordPage graph={found.graph} node={found.node} />;
}
