import { ApplyWorkspace } from "@/components/review/apply-workspace";
import { projectReview } from "@/lib/research/projection";
import { allFindings } from "@/lib/research/view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Apply accepted research · Parent Behavioral Health OS",
  description: "Turn accepted research into the change that makes the model say it.",
};

export default function ApplyPage() {
  const accepted = allFindings(projectReview().runs).filter(({ finding }) => finding.state === "accepted");
  return <ApplyWorkspace items={accepted} />;
}
