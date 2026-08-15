import { ApplyWorkspace } from "@/components/review/apply-workspace";
import { projectReview } from "@/lib/research/projection";
import { allFindings } from "@/lib/research/view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Apply accepted research · Parent Behavioral Health OS",
  description: "Turn accepted research into the change that makes the model say it.",
};

export default function ApplyPage() {
  const runs = projectReview().runs;
  const accepted = allFindings(runs).filter(({ finding }) => finding.state === "accepted");
  // An accepted candidate is authorized and has changed nothing, which is the
  // same debt an accepted finding carries — so it belongs on the same page. The
  // difference is what composing it produces: a skeleton to name, not a Claim.
  const candidates = runs.flatMap((run) =>
    run.candidates.filter((candidate) => candidate.state === "accepted").map((candidate) => ({ run, candidate })),
  );
  return <ApplyWorkspace items={accepted} candidates={candidates} />;
}
