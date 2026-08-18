import crypto from "node:crypto";
import { EXPERIMENT_SECTIONS, SECTION } from "@/lib/content/body";
import type { Bet } from "@/lib/schemas";

/**
 * Does the software still test the experiment somebody approved?
 *
 * The readiness gate answers a different question. It asks whether the *bet* has
 * been shaped, and once the six sections exist it says "ready to build"
 * forever. Nothing then compared the artifact to them. A scope could be widened
 * from one mode to two, merged, and the prototype would go on testing the old
 * question with `status: working` still claiming otherwise — no error in
 * validation, no warning in the packet, nothing on the page. The first run of
 * this loop did exactly that, and the only thing that caught it was somebody
 * remembering.
 *
 * The mechanism is the one the research intake already uses. A `researchTrace`
 * cites a decision over the *current* handoff hash, so moving the handoff
 * retires the citation. Here a prototype records the experiment it was built
 * against, so moving the experiment retires the claim.
 *
 * That split is deliberate and is the whole design: **a machine can prove
 * staleness; only a person can assert conformance.** Nothing here reads the
 * prototype's source and decides whether it implements a scope — that is
 * semantics, and deterministic tooling in this repository does not resolve
 * semantics. It proves the cheaper, sufficient thing: that somebody looked at
 * both, and that neither has moved since.
 */

/** Per-section, so drift can say which part of the experiment moved. */
const SECTION_DIGEST = 6;

/**
 * Whitespace is collapsed before hashing, so re-wrapping a paragraph is not a
 * change to the experiment. Editing a word is.
 */
function digest(value: string) {
  const normalised = value.trim().replace(/\s+/g, " ");
  return crypto.createHash("sha256").update(normalised).digest("hex").slice(0, SECTION_DIGEST);
}

/**
 * The fingerprint of an approved experiment, or "" when there is not one.
 *
 * Positional: one digest per section, in the order `EXPERIMENT_SECTIONS`
 * declares them. Nobody reads it by hand — the packet prints it and the
 * validator compares it — but the positions are what let drift name the section
 * that moved rather than shrugging at the whole thing.
 */
export function experimentFingerprint(bet: Bet): string {
  const parts = EXPERIMENT_SECTIONS.map((name) => bet.sections[name]);
  if (parts.some((value) => !value?.trim())) return "";
  return parts.map((value) => digest(value as string)).join("-");
}

export type ConformanceState = "unshaped" | "unbuilt" | "unstamped" | "stale" | "current";

export type Conformance = {
  state: ConformanceState;
  /** The value a stamp should carry today. Empty when the bet is unshaped. */
  fingerprint: string;
  /** Which experiment sections moved since the stamp. Empty unless `stale`. */
  drifted: string[];
};

/** Statuses that claim the artifact can actually be tried against the bet. */
const CLAIMS_BUILT = ["working", "tested"];

export function conformance(bet: Bet): Conformance {
  const fingerprint = experimentFingerprint(bet);
  // Nothing approved yet, so there is nothing to conform to. The packet already
  // refuses to clear a build here, which is the gate that belongs at this stage.
  if (!fingerprint) return { state: "unshaped", fingerprint, drifted: [] };

  const prototype = bet.prototype;
  if (!prototype || !prototype.route || !CLAIMS_BUILT.includes(prototype.status)) {
    return { state: "unbuilt", fingerprint, drifted: [] };
  }

  const stamped = prototype.builtAgainst?.trim();
  if (!stamped) return { state: "unstamped", fingerprint, drifted: [] };
  if (stamped === fingerprint) return { state: "current", fingerprint, drifted: [] };

  return { state: "stale", fingerprint, drifted: drift(stamped, fingerprint) };
}

/**
 * Which sections moved.
 *
 * A stamp written against a different number of sections cannot be compared
 * position by position, so it reports the whole experiment rather than guessing
 * — being vague is better than being confidently wrong about which half of the
 * scope somebody needs to re-read.
 */
function drift(stamped: string, current: string): string[] {
  const before = stamped.split("-");
  const after = current.split("-");
  if (before.length !== after.length) return [...EXPERIMENT_SECTIONS];
  return EXPERIMENT_SECTIONS.filter((_, index) => before[index] !== after[index]);
}

/** What to do about it, in the words the person needs. Empty when nothing is owed. */
export function conformanceProblem(bet: Bet): string | undefined {
  const { state, fingerprint, drifted } = conformance(bet);

  if (state === "unstamped") {
    return (
      `Unattested prototype in ${bet.file}: prototype.status is '${bet.prototype?.status}', which claims the software ` +
      `tests the experiment this bet approves — and nothing records that anybody checked. Look at the prototype ` +
      `against the six experiment sections, then say so:\n\n` +
      `  prototype:\n    builtAgainst: ${fingerprint}\n\n` +
      `If it does not test them yet, that is fine and is the honest answer: set prototype.status to 'concept' instead.`
    );
  }

  if (state === "stale") {
    const which = drifted.length === EXPERIMENT_SECTIONS.length ? "The experiment" : drifted.map((name) => `# ${name}`).join(", ");
    return (
      `Stale prototype in ${bet.file}: ${which} changed after the prototype was last checked against it, so ` +
      `prototype.status '${bet.prototype?.status}' is claiming something nobody has confirmed since.\n\n` +
      `Re-read the section${drifted.length === 1 ? "" : "s"} above and decide which is true:\n` +
      `  - the software still tests it — restamp:\n      builtAgainst: ${fingerprint}\n` +
      `  - it does not any more — set prototype.status to 'concept' until it does.\n\n` +
      `npm run prototype:brief -- ${bet.id} prints what changed and everything needed to rebuild.`
    );
  }

  return undefined;
}

/**
 * A runnable prototype also owes the reviewer a deliberate way to interrogate
 * it. "What do you think?" is not an evaluation contract, and a dense artifact
 * without prompts tends to collect taste and first impressions instead of the
 * observations that can refine the Bet.
 *
 * Review prompts are intentionally not part of `experimentFingerprint`. They
 * govern how learning is elicited after trying the artifact; tightening a
 * question should not claim that the interaction itself became stale.
 */
export function reviewPromptProblem(bet: Bet): string | undefined {
  const prototype = bet.prototype;
  if (!prototype || !prototype.route || !CLAIMS_BUILT.includes(prototype.status)) return undefined;
  if (bet.sections[SECTION.reviewPrompts]?.trim()) return undefined;

  return (
    `Unreviewable prototype in ${bet.file}: prototype.status is '${prototype.status}', but the Bet has no ` +
    `# ${SECTION.reviewPrompts} section. A runnable prototype must name the questions a tester should use to ` +
    `pressure-test the learning decision. Add a short set of decision-shaping prompts, or set prototype.status ` +
    `to 'concept' until the evaluation frame exists.`
  );
}
