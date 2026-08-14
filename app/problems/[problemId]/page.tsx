import { notFound } from "next/navigation";
import { RecordPage } from "@/components/model/record-page";
import { findNode, nodeMetadata } from "@/lib/model/lookup";

/** Rendered per request so a push to `content/` is reflected without a rebuild. */
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ problemId: string }> };

export async function generateMetadata({ params }: Params) {
  const resolved = await params;
  return nodeMetadata("problem", resolved.problemId);
}

export default async function Page({ params }: Params) {
  const resolved = await params;
  const found = findNode("problem", resolved.problemId);
  if (!found) notFound();
  return <RecordPage graph={found.graph} node={found.node} />;
}
