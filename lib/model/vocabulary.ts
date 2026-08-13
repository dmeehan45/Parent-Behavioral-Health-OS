/**
 * Display vocabulary for the constrained enums in `lib/schemas`.
 *
 * This file describes *schema* terms, not model content. Adding a stage, bet,
 * or claim never requires touching it; adding a new `authority` value to the
 * schema does. The term lists are generated from the Zod enums so the legend
 * cannot silently drift from what the schema accepts.
 */

import { authoritySchema, confidenceSchema, relationshipSchema } from "@/lib/schemas";
import type { EdgeKind, Tone, VocabTerm } from "@/lib/model/types";

type TermMeta = { label: string; description: string; tone: Tone };

const AUTHORITY_META: Record<string, TermMeta> = {
  reference: {
    label: "Reference",
    description: "Describes how something generally works. Not a commitment.",
    tone: "quiet",
  },
  proposed: {
    label: "Proposed",
    description: "Something we think might be true. The default, and speculative.",
    tone: "neutral",
  },
  validated: {
    label: "Validated",
    description: "Supported by evidence recorded in provenance.",
    tone: "evidence",
  },
  policy: {
    label: "Policy",
    description: "An approved operating rule. Reason from this as settled.",
    tone: "accent",
  },
};

const CONFIDENCE_META: Record<string, TermMeta> = {
  low: { label: "Low confidence", description: "Weakly held.", tone: "warn" },
  medium: { label: "Medium confidence", description: "Plausible, unproven.", tone: "neutral" },
  high: { label: "High confidence", description: "Strongly held.", tone: "evidence" },
};

function toTerms(options: readonly string[], meta: Record<string, TermMeta>): VocabTerm[] {
  return options.map((id) => {
    const described = meta[id];
    return {
      id,
      label: described?.label ?? id,
      description: described?.description ?? "",
      tone: described?.tone ?? "neutral",
    };
  });
}

export const AUTHORITY_TERMS = toTerms(authoritySchema.options, AUTHORITY_META);
export const CONFIDENCE_TERMS = toTerms(confidenceSchema.options, CONFIDENCE_META);

export function authorityTone(authority?: string): Tone {
  return AUTHORITY_TERMS.find((term) => term.id === authority)?.tone ?? "quiet";
}

export function confidenceTone(confidence?: string): Tone {
  return CONFIDENCE_TERMS.find((term) => term.id === confidence)?.tone ?? "quiet";
}

/**
 * Relationships in `content/map.yaml` that read as a loop back through the
 * system rather than forward progress. These are drawn differently and are
 * excluded from layout ranking so the graph stays acyclic.
 */
const FEEDBACK_RELATIONSHIPS = new Set(["feedback_to"]);

export function isFeedbackRelationship(relationship: string): boolean {
  return FEEDBACK_RELATIONSHIPS.has(relationship);
}

/** Every relationship the schema allows, for the legend. */
export const RELATIONSHIP_TERMS = relationshipSchema.options.map((id) => ({
  id,
  label: id.replaceAll("_", " "),
  feedback: isFeedbackRelationship(id),
}));

export const EDGE_LEGEND: Array<{ kind: EdgeKind; label: string; description: string }> = [
  { kind: "flow", label: "Operating flow", description: "How work moves between stages." },
  { kind: "feedback", label: "Feedback loop", description: "What the system learns and sends back." },
  { kind: "process", label: "Process sequence", description: "Step order inside an expanded stage." },
  { kind: "problem", label: "Problem", description: "Where a stage or step is thought to break." },
  { kind: "bet", label: "Bet", description: "A solution proposed against a problem." },
  { kind: "prototype", label: "Prototype", description: "Working software that makes a bet concrete." },
  { kind: "evidence", label: "Evidence", description: "A claim or metric attached to what it describes." },
  { kind: "state", label: "State change", description: "An entity a step reads or produces." },
];
