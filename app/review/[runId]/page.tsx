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

  return (
    <ReviewWorkspace
      run={run}
      supersedable={supersedable.filter((entry) => entry.run !== run.id)}
      sourceUrl={sourceUrl}
    />
  );
}
