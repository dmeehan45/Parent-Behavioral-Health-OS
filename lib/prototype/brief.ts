import { EXPERIMENT_SECTIONS, EXPERIMENT_SECTION_MEANING, SECTION } from "@/lib/content/body";
import type { Repository } from "@/lib/content/repository";
import {
  betCoverage,
  experimentGaps,
  problemCoverage,
  stageCoverage,
  stepCoverage,
} from "@/lib/model/coverage";
import type { Bet, Claim, Metric, Stage, Step } from "@/lib/schemas";
import type { ReviewFinding, ReviewRun } from "@/lib/research/view";

/**
 * Everything a builder needs to make one Bet concrete, composed from the model.
 *
 * This is the exact analogue of `npm run research:brief`, for the station that
 * had nothing. A research run is handed every statement earlier runs
 * established before it starts; the prototype pass — the one station in the
 * loop actually designed to be carried out by an agent — was handed a reading
 * list spread across six documents plus the projection, and re-derived it every
 * time.
 *
 * Three properties matter more than completeness:
 *
 * - **Derived, not stored.** Like the research brief this is printed, never
 *   committed. A packet on disk would be a second description of a Bet, going
 *   stale the moment the model moved.
 * - **Honest about what it does not know.** Every unfilled modelable field is
 *   listed by name under "unknown", so a blank never quietly becomes plausible
 *   product behaviour in the built artifact.
 * - **It can refuse.** If the Bet has not had its experiment approved, the
 *   packet says so and stops short of a build instruction. The readiness check
 *   `docs/prototype-workflow.md` describes becomes mechanical, and it lives
 *   where an agent starts rather than in a document nobody opened.
 */

export type ResearchNote = { run: ReviewRun; finding: ReviewFinding };

function heading(level: number, text: string) {
  return `${"#".repeat(level)} ${text}`;
}

/** A section, or an explicit note that nobody has written it. */
function prose(label: string, value: string | undefined, absent: string, level = 3) {
  return [heading(level, label), "", value?.trim() ? value.trim() : `*${absent}*`, ""];
}

function bullets(label: string, items: string[], level = 3) {
  return items.length ? [heading(level, label), "", ...items.map((item) => `- ${item}`), ""] : [];
}

function describeException(exception: NonNullable<Step["exceptions"]>[number]) {
  if (typeof exception === "string") return exception;
  return [exception.condition, exception.outcome, exception.route].filter(Boolean).join(" → ");
}

/** A step, at the depth somebody building against it actually needs. */
function renderStep(step: Step, stage: Stage | undefined) {
  const lines = [heading(3, `Step: ${step.title}`), "", `\`${step.id}\`${stage ? ` in ${stage.title}` : ""}`, ""];
  if (step.purpose) lines.push(step.purpose.trim(), "");
  if (step.activity && step.activity !== step.purpose) lines.push(`**What happens:** ${step.activity.trim()}`, "");

  lines.push(
    ...bullets("Before it can start", step.entryConditions ?? [], 4),
    ...bullets(
      "Reads",
      (step.inputs ?? []).map((io) => `\`${io.entity}\` in state \`${io.state}\``),
      4,
    ),
    ...bullets(
      "Leaves behind",
      (step.outputs ?? []).map((io) => `\`${io.entity}\` in state \`${io.state}\``),
      4,
    ),
    ...bullets("Done when", step.exitConditions ?? [], 4),
    ...bullets(
      "Who is involved",
      [
        ...(step.roles?.primary ?? []).map((role) => `${role} (primary)`),
        ...(step.roles?.supporting ?? []).map((role) => `${role} (supporting)`),
      ],
      4,
    ),
    ...bullets(
      "Rules that constrain it",
      (step.rules ?? []).map((rule) => `${rule.statement}${rule.authority ? ` *(${rule.authority})*` : ""}`),
      4,
    ),
    ...bullets("Known exceptions", (step.exceptions ?? []).map(describeException), 4),
  );

  const questions = step.sections[SECTION.openQuestions]?.trim();
  if (questions) lines.push(heading(4, "Open questions here"), "", questions, "");
  return lines;
}

function renderClaim(claim: Claim) {
  return `**${claim.statement.trim()}**  \n  \`${claim.id}\` · ${claim.kind} · ${claim.confidence} confidence · ${claim.status}${
    claim.authority ? ` · ${claim.authority}` : ""
  }`;
}

function renderMetric(metric: Metric, repo: Repository) {
  const owner = metric.decisionOwner
    ? repo.entities.find((entity) => entity.id === metric.decisionOwner)?.title ?? metric.decisionOwner
    : undefined;
  const parts = [
    `**${metric.title}**  \n  \`${metric.id}\``,
    metric.unit ? `measured in ${metric.unit}` : undefined,
    metric.direction ? `${metric.direction} is better` : undefined,
    `data ${metric.dataStatus ?? "unknown"}`,
  ].filter(Boolean);
  const lines = [parts.join(" · ")];
  if (metric.perspectives?.length) {
    lines.push(
      `  Whose measure: ${metric.perspectives.map((p) => `${p.actor} (${p.role})`).join(", ")}`,
    );
  }
  if (metric.decision) lines.push(`  Informs: ${metric.decision.trim()}`);
  if (owner) lines.push(`  Owned by: ${owner}`);
  return lines.join("  \n");
}

/**
 * The line the whole packet turns on.
 *
 * `docs/prototype-workflow.md` lists five things a person approves before
 * implementation. When they are missing the honest output is not a smaller
 * packet — it is a refusal plus the questions worth asking, because a build
 * that proceeds anyway has to invent the answers.
 */
export function readiness(bet: Bet) {
  const missing = experimentGaps(bet);
  return { ready: missing.length === 0, missing };
}

export function renderPrototypeBrief(
  bet: Bet,
  repo: Repository,
  research: ResearchNote[],
  researchReadable = true,
): string {
  const problem = repo.problems.find((candidate) => candidate.id === bet.problem);
  const targets = problem?.targets ?? [];
  const stages = repo.stages.filter((stage) => targets.includes(stage.id));
  const steps = repo.steps.filter((step) => targets.includes(step.id));
  const claims = repo.claims.filter((claim) => bet.claims?.includes(claim.id));
  const metrics = repo.metrics.filter((metric) => bet.metrics?.includes(metric.id));
  const participant = bet.participant
    ? repo.entities.find((entity) => entity.id === bet.participant)
    : undefined;
  const verdict = readiness(bet);

  const lines: string[] = [
    heading(1, `Prototype brief: ${bet.title}`),
    "",
    `\`${bet.id}\` · ${bet.confidence ?? "unstated"} confidence · ${bet.authority ?? "proposed"} · prototype ${
      bet.prototype?.status ?? "not-started"
    }`,
    "",
    "Composed from the model at this revision. Nothing here is a second source of truth — every line is derived from",
    "`content/`, and the files it came from are named so you can go and read them.",
    "",
  ];

  /* ---- The verdict, first ------------------------------------------------ */

  lines.push(heading(2, "Is this ready to build?"), "");
  if (verdict.ready) {
    lines.push(
      "**Yes.** The experiment has been shaped and approved in the Bet, so you can build the in-scope path below",
      "without asking anybody to invent it for you.",
      "",
    );
  } else {
    lines.push(
      "**Not yet — do not start building.** A prototype tests a decision, and this Bet has not said which decision.",
      "",
      "The following are unwritten. They are judgements about what should be learned and what may be assumed, which is",
      "why nothing here fills them in: a plausible guess would be invented content that the built artifact then makes",
      "look real.",
      "",
      ...verdict.missing.map((name) => `- **${name}** — ${EXPERIMENT_SECTION_MEANING[name]}`),
      "",
      `Put these to the person accountable for the Bet, then add them to \`${bet.file}\` as \`# ${verdict.missing[0]}\``,
      "and the rest. Ask them together, at one checkpoint, rather than one screen at a time.",
      "",
    );
  }

  /* ---- The bet ----------------------------------------------------------- */

  lines.push(
    heading(2, "The bet"),
    "",
    `Source: \`${bet.file}\``,
    "",
    ...prose("Intervention", bet.sections[SECTION.bet], "No intervention written down."),
  );
  if (bet.sections[SECTION.questions]?.trim()) {
    lines.push(heading(3, "What the bet is unsure about"), "", bet.sections[SECTION.questions].trim(), "");
  }
  if (participant) lines.push(`**Who it studies:** ${participant.title} (\`${participant.id}\`)`, "");

  const shaped = EXPERIMENT_SECTIONS.filter((name) => bet.sections[name]?.trim());
  if (shaped.length) {
    lines.push(heading(2, "The experiment, as approved"), "");
    for (const name of shaped) lines.push(heading(3, name), "", bet.sections[name].trim(), "");
  }

  /* ---- The problem ------------------------------------------------------- */

  lines.push(heading(2, "The problem it answers"), "");
  if (!problem) {
    lines.push("*This bet names a problem that does not exist. Stop and fix the model before building.*", "");
  } else {
    lines.push(
      `**${problem.title}**  \n\`${problem.id}\` · ${problem.status} · source \`${problem.file}\``,
      "",
      ...(problem.summary ? [problem.summary.trim(), ""] : []),
      ...prose("What happens today", problem.sections[SECTION.whatHappensToday], "Not written down."),
      ...prose("Why it matters", problem.sections[SECTION.whyItMatters], "Not written down."),
    );
    const open = problem.sections[SECTION.openQuestions]?.trim();
    if (open) lines.push(heading(3, "Open questions about the problem"), "", open, "");
  }

  /* ---- Where it lands ---------------------------------------------------- */

  lines.push(
    heading(2, "Where it lands in the machine"),
    "",
    "The flow the prototype has to be recognisably part of. Roles, rules and exceptions are the model's, not yours to",
    "invent — where one is absent, that absence is listed under *unknown* below.",
    "",
  );
  for (const stage of stages) {
    lines.push(heading(3, `Stage: ${stage.title}`), "", `\`${stage.id}\``, "");
    if (stage.summary) lines.push(stage.summary.trim(), "");
    lines.push(
      ...bullets("Entry conditions", stage.entryConditions ?? [], 4),
      ...bullets("Exit conditions", stage.exitConditions ?? [], 4),
    );
  }
  for (const step of steps) lines.push(...renderStep(step, repo.stages.find((s) => s.id === step.stage)));
  if (!stages.length && !steps.length) lines.push("*The problem names no stages or steps.*", "");

  /* ---- Evidence ---------------------------------------------------------- */

  lines.push(heading(2, "What we believe, and how firmly"), "");
  lines.push(
    ...bullets("Claims this bet rests on", claims.map(renderClaim)),
    ...bullets("What success would move", metrics.map((metric) => renderMetric(metric, repo))),
  );
  if (!claims.length && !metrics.length) {
    lines.push("*Nothing. The bet rests on no recorded claim and names no measure — worth saying out loud before building.*", "");
  }
  const weak = claims.filter((claim) => claim.confidence === "low");
  if (weak.length) {
    lines.push(
      `**Handle with care.** ${weak.length === 1 ? "One claim here is" : `${weak.length} claims here are`} held at low`,
      "confidence. The prototype may explore it; it must not present it to a participant as settled.",
      "",
    );
  }

  /* ---- Research ---------------------------------------------------------- */

  lines.push(heading(2, "Research about any of this"), "");
  if (!researchReadable) {
    lines.push("*`research/` could not be read. Run `npm run validate:research` — it names the file and field.*", "");
  } else if (!research.length) {
    lines.push("*No research names these records.*", "");
  } else {
    for (const { run, finding } of research) {
      lines.push(
        `- **${finding.statement}**  \n  run \`${run.id}\` · ${finding.state}` +
          (finding.state === "accepted"
            ? " — accepted but **not yet in the model**, so do not build as though it says this"
            : ""),
      );
    }
    lines.push("");
  }

  /* ---- Known, assumed, unknown ------------------------------------------- */

  lines.push(
    heading(2, "Known, assumed, unknown"),
    "",
    "Three lists, kept apart so an assumption cannot pass itself off as something the model claims.",
    "",
    heading(3, "Known — the model says this"),
    "",
    `- The bet, the problem, and the flow above, from \`content/\`.`,
    ...claims.map((claim) => `- ${claim.statement.trim()} *(${claim.kind}, ${claim.confidence} confidence)*`),
    "",
    heading(3, "Assumed — true for the prototype only"),
    "",
    bet.sections[SECTION.assumptions]?.trim()
      ? bet.sections[SECTION.assumptions].trim()
      : "*The bet lists no assumptions. Anything you have to assume in order to build belongs here first.*",
    "",
    heading(3, "Unknown — nobody has written this down"),
    "",
    "Do not invent these. Label them in the interface, keep them out of the flow, or ask.",
    "",
  );

  const unknown: string[] = [
    ...betCoverage(bet).missing.map((field) => `${field} — on the bet`),
    ...(problem ? problemCoverage(problem).missing.map((field) => `${field} — on the problem`) : []),
    ...stages.flatMap((stage) => stageCoverage(stage).missing.map((field) => `${field} — on ${stage.title}`)),
    ...steps.flatMap((step) => stepCoverage(step).missing.map((field) => `${field} — on ${step.title}`)),
  ];
  lines.push(...(unknown.length ? unknown.map((item) => `- ${item}`) : ["- *Nothing: every modelable field is filled.*"]), "");

  /* ---- The contract ------------------------------------------------------ */

  lines.push(
    heading(2, "How to build it here"),
    "",
    "These are the repository's rules, not preferences. `AGENTS.md` and `docs/prototype-workflow.md` are the full text.",
    "",
    heading(3, "Non-negotiable"),
    "",
    "- Synthetic data only. No PHI, no real patient, clinician, or practice detail, no realistic identifiers.",
    "- Do not simulate production: no database, no auth, no real matching, billing, scheduling, or clinical decisions.",
    "- Never imply something was saved, matched, delivered, or sent. Give a genuine end state that says what *would*",
    "  happen next in a real system.",
    "- Do not edit the Bet or the Problem to fit what you built. Propose a change; a person decides.",
    "- Represent refusal, correction, and recovery where they are central to the bet, or say explicitly that they are",
    "  out of scope. A participant who cannot disagree is not testing anything.",
    "",
    heading(3, "Where the code goes"),
    "",
    `- \`app/prototypes/${bet.id}/page.tsx\`, wrapped in \`PrototypeShell\` with \`route="/prototypes/${bet.id}"\`.`,
    "- The shell derives the title, problem, targets, claims, metrics and return paths from the Bet. Do not restate any",
    "  of it inside the prototype — that is a second source of truth, and it will drift.",
    `- Then set \`prototype: { status: working, route: /prototypes/${bet.id} }\` on \`${bet.file}\`. Validation checks the`,
    "  route resolves, so add it once the page exists.",
    "- Keep synthetic fixtures beside the prototype and visibly fictional.",
    "",
    heading(3, "Design system"),
    "",
    "- Colours come from the token layer only. A literal colour in `app/` or `components/` fails `npm run lint:design`.",
    "- Hue means category, never decoration, and colour is never the only signal — name the kind in words too.",
    "- 44px minimum for anything tappable; focus uses the shared `:focus-visible` ring; motion is 0.15s on the one curve.",
    "- A scrolling pane needs an ancestor chain with a *definite* height. `min-height` bounds nothing.",
    "",
    heading(3, "Before you call it done"),
    "",
    "```bash",
    "npm run validate:content && npm run lint && npm run lint:design && npm run typecheck && npm run build",
    "npm run test:responsive",
    "```",
    "",
    "- It works at 390px and at 1440px, by keyboard and by touch.",
    "- The primary flow has situation, choice, response and closure.",
    "- Another contributor could learn something from it without you narrating.",
    "",
  );

  /* ---- What to do afterwards --------------------------------------------- */

  lines.push(
    heading(2, "After somebody tries it"),
    "",
    "Observations are not truth. Record them without names, contact details or health information, keep observation,",
    "interpretation and implication apart, and take anything consequential back through `research/` and `/review` — a",
    "prototype session cannot change what the model claims, and neither can you.",
    "",
  );

  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
}
