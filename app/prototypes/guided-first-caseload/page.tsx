import { GuidedCaseload } from "@/components/guided-caseload";
import { PrototypeShell } from "@/components/prototype/prototype-shell";

export const dynamic = "force-dynamic";

/**
 * The prototype interaction only. Every piece of surrounding context — which
 * bet this tests, what it is aimed at, which metrics would move — is resolved
 * by the shell from the Bet that points at this route.
 */
const ROUTE = "/prototypes/guided-first-caseload";

export default function GuidedFirstCaseloadPrototype() {
  return (
    <PrototypeShell route={ROUTE}>
      <GuidedCaseload />
    </PrototypeShell>
  );
}
