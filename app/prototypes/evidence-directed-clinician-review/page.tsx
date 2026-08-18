import { EvidenceDirectedReview } from "@/components/evidence-directed-review";
import { PrototypeShell } from "@/components/prototype/prototype-shell";

export const dynamic = "force-dynamic";

const ROUTE = "/prototypes/evidence-directed-clinician-review";

export default function EvidenceDirectedClinicianReviewPrototype() {
  return (
    <PrototypeShell route={ROUTE}>
      <EvidenceDirectedReview />
    </PrototypeShell>
  );
}
