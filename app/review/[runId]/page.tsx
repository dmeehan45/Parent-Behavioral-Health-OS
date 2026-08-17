import { notFound } from "next/navigation";
import { ReviewWorkspace } from "@/components/review/review-workspace";
import { projectReview } from "@/lib/research/projection";

export const dynamic = "force-dynamic";

type Params = Promise<{ runId: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { runId } = await params;
  const run = projectReview().runs.find((candidate) => candidate.id === runId);
  return {
    title: run ? `${run.question} · Review` : "Review",
    description: run?.synthesis,
  };
}

export default async function ReviewRunPage({ params }: { params: Params }) {
  const { runId } = await params;
  const { runs, supersedable, sourceUrl } = projectReview();
  const run = runs.find((candidate) => candidate.id === runId);
  if (!run) notFound();

  // The bridge is rendered by the workspace, under the run's own heading. It
  // used to sit here, before it — which put a call to action about the page
  // above anything saying which page it was, and left it outside `<main>`.
  return (
    <ReviewWorkspace
      run={run}
      supersedable={supersedable.filter((entry) => entry.run !== run.id)}
      sourceUrl={sourceUrl}
    />
  );
}
