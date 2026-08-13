import { z } from "zod";

export const idSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "expected a lowercase kebab-case ID");
export const authoritySchema = z.enum(["reference", "proposed", "validated", "policy"]);
export const confidenceSchema = z.enum(["low", "medium", "high"]);
export const provenanceSchema = z.object({ source: z.string().optional(), references: z.array(z.string()).default([]) });
export const stateRefSchema = z.object({ entity: idSchema, state: z.string().min(1) });
export const ruleSchema = z.object({ id: idSchema, statement: z.string().min(1), authority: authoritySchema.optional() });
export const exceptionSchema = z.union([z.string(), z.object({ condition: z.string(), outcome: z.string().optional(), route: z.string().optional() })]);
const common = { provenance: provenanceSchema.optional(), lastReviewed: z.coerce.date().optional() };

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
  exceptions: z.array(exceptionSchema).optional(), metrics: z.array(idSchema).optional(), claims: z.array(idSchema).optional(), bets: z.array(idSchema).optional(),
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
  targets: z.array(idSchema).optional(), dataStatus: z.enum(["unknown", "available", "partially-available", "not-measured"]).optional(), ...common
});
export const betSchema = z.object({
  id: idSchema, title: z.string().min(1), targets: z.array(idSchema).min(1), status: z.string().optional(), confidence: confidenceSchema.optional(),
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
export type Bet = z.infer<typeof betSchema> & { body: string; sections: Record<string, string>; file: string };
export type SystemMap = z.infer<typeof mapSchema>;
