import { z } from "zod";
import { researchTraceSchema } from "@/lib/research/schema";

export const idSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "expected a lowercase kebab-case ID");
export const authoritySchema = z.enum(["reference", "proposed", "validated", "policy"]);
export const confidenceSchema = z.enum(["low", "medium", "high"]);
export const provenanceSchema = z.object({ source: z.string().optional(), references: z.array(z.string()).default([]) });
export const stateRefSchema = z.object({ entity: idSchema, state: z.string().min(1) });
export const ruleSchema = z.object({ id: idSchema, statement: z.string().min(1), authority: authoritySchema.optional() });
export const exceptionSchema = z.union([z.string(), z.object({ condition: z.string(), outcome: z.string().optional(), route: z.string().optional() })]);
const common = {
  provenance: provenanceSchema.optional(),
  lastReviewed: z.coerce.date().optional(),
  researchTrace: z.array(researchTraceSchema).optional(),
};

export const stageSchema = z.object({
  id: idSchema, title: z.string().min(1), order: z.number().int().optional(), summary: z.string().optional(),
  entryConditions: z.array(z.string()).optional(), exitConditions: z.array(z.string()).optional(), metrics: z.array(idSchema).optional(),
  status: z.string().optional(), authority: authoritySchema.optional(), ...common
});
export const stepSchema = z.object({
  id: idSchema, title: z.string().min(1), stage: idSchema, order: z.number().int().optional(), next: z.array(idSchema).optional(),
  purpose: z.string().optional(), entryConditions: z.array(z.string()).optional(), inputs: z.array(stateRefSchema).optional(),
  roles: z.object({ primary: z.array(z.string()).optional(), supporting: z.array(z.string()).optional() }).optional(), activity: z.string().optional(),
  rules: z.array(ruleSchema).optional(), outputs: z.array(stateRefSchema).optional(), exitConditions: z.array(z.string()).optional(),
  // No `bets`: a Step is reached by the Problems that name it as a target, so a
  // back-reference here would be a second, driftable statement of the same link.
  exceptions: z.array(exceptionSchema).optional(), metrics: z.array(idSchema).optional(), claims: z.array(idSchema).optional(),
  authority: authoritySchema.optional(), ...common
});
// `states` is optional. Declaring it opts the entity into state validation: every
// `{ entity, state }` reference in a Step must then name a declared state. Leave
// it out while the state model for an entity is still unknown.
export const entitySchema = z.object({ id: idSchema, title: z.string().min(1), states: z.array(z.string().min(1)).optional(), ...common });
export const claimSchema = z.object({
  id: idSchema, statement: z.string().min(1), kind: z.enum(["reported", "observed", "inference", "assumption", "hypothesis"]),
  confidence: confidenceSchema, targets: z.array(idSchema).min(1), status: z.enum(["active", "supported", "contradicted", "retired"]).default("active"),
  authority: authoritySchema.optional(), ...common
});
export const metricSchema = z.object({
  id: idSchema, title: z.string().min(1), unit: z.string().optional(), direction: z.enum(["lower", "higher", "target"]).optional(),
  targets: z.array(idSchema).optional(),
  perspectives: z.array(z.object({
    actor: idSchema,
    role: z.enum(["primary", "balancing", "operator"]),
  })).optional(),
  decisionOwner: idSchema.optional(), decision: z.string().min(1).optional(),
  dataStatus: z.enum(["unknown", "available", "partially-available", "not-measured"]).optional(), ...common
});
// A Problem is where the machine is thought to break. `targets` is required
// because a problem that bites nowhere is not a problem with this system, and
// the Stage-to-Problem link is what lets a stage show what it has to answer for.
export const problemSchema = z.object({
  id: idSchema, title: z.string().min(1), targets: z.array(idSchema).min(1), summary: z.string().optional(),
  status: z.enum(["open", "exploring", "addressed", "parked"]).default("open"),
  claims: z.array(idSchema).optional(), metrics: z.array(idSchema).optional(),
  authority: authoritySchema.optional(), ...common
});
// A Bet is a proposed solution, so it names the Problem it answers rather than
// attaching straight to a Stage. Where it lands in the machine follows from the
// Problem, which keeps one statement of where the trouble is.
export const betSchema = z.object({
  id: idSchema, title: z.string().min(1), problem: idSchema, status: z.string().optional(), confidence: confidenceSchema.optional(),
  claims: z.array(idSchema).optional(), metrics: z.array(idSchema).optional(), prototype: z.object({ status: z.enum(["not-started", "concept", "working", "tested", "retired"]), route: z.string().startsWith("/").optional() }).optional(),
  authority: authoritySchema.optional(), ...common
});
export const relationshipSchema = z.enum(["flows_to", "supplies", "enables", "depends_on", "constrains", "informs", "influences", "feedback_to"]);
export const mapSchema = z.object({ id: idSchema, title: z.string(), stages: z.array(idSchema), edges: z.array(z.object({ from: idSchema, to: idSchema, relationship: relationshipSchema })) });

export type Stage = z.infer<typeof stageSchema> & { body: string; sections: Record<string, string>; file: string };
export type Step = z.infer<typeof stepSchema> & { body: string; sections: Record<string, string>; file: string };
export type Entity = z.infer<typeof entitySchema> & { body: string; sections: Record<string, string>; file: string };
export type Claim = z.infer<typeof claimSchema> & { body: string; sections: Record<string, string>; file: string };
export type Metric = z.infer<typeof metricSchema> & { body: string; sections: Record<string, string>; file: string };
export type Problem = z.infer<typeof problemSchema> & { body: string; sections: Record<string, string>; file: string };
export type Bet = z.infer<typeof betSchema> & { body: string; sections: Record<string, string>; file: string };
export type SystemMap = z.infer<typeof mapSchema>;
export type Provenance = z.infer<typeof provenanceSchema>;
