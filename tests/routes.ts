import { expect, type Page } from "@playwright/test";
import type { NodeKind } from "../lib/model/types";

/**
 * Every route the browser checks visit, derived from the model.
 *
 * The routes come from `/api/model` rather than from a list here, for the same
 * reason the interface does: adding a stage or a bet must not require editing
 * application code, and a hardcoded ID here would rot the first time content
 * moved.
 *
 * Shared by `responsive.spec.ts` and `legibility.spec.ts` — the same rule the
 * repository applies to prose applies to test fixtures. Two copies of this
 * would drift, and the second one to drift would be the one nobody notices.
 */

/** Static routes that exist regardless of what is in `content/`. */
export const FIXED_ROUTES = ["/", "/map", "/prototypes", "/review", "/review/apply"];

/**
 * One record page per primitive, so every page template gets looked at once —
 * plus *every* prototype.
 *
 * Record pages all render through one template, so a second stage would test
 * nothing a first did not. A prototype is the opposite: each one is bespoke
 * interaction code, and it is the most likely thing in the repository to be
 * written by somebody who has not read the design system. Sampling one of them
 * would leave the rest unchecked, which is the same "the empty state cannot
 * fail" trap these checks exist to avoid.
 */
export async function routesFromModel(page: Page): Promise<string[]> {
  const response = await page.request.get("/api/model");
  expect(response.ok()).toBeTruthy();
  const model = (await response.json()) as {
    nodes: Array<{ kind: NodeKind; href: string; contentId: string }>;
  };

  const seen = new Map<NodeKind, string>();
  const prototypes: string[] = [];
  for (const node of model.nodes) {
    // A prototype whose bet declares no route falls back to that bet's own page,
    // which the bet template already covers. Recognised by where it falls back
    // *to* rather than by a `/prototypes/` prefix: the route is whatever the bet
    // declares, and assuming its shape here is the kind of convention that
    // quietly stops being true.
    const unbuilt = node.href === `/bets/${node.contentId}`;
    if (node.kind === "prototype" && !unbuilt) prototypes.push(node.href);
    else if (!seen.has(node.kind)) seen.set(node.kind, node.href);
  }
  return [...new Set([...seen.values(), ...prototypes])];
}

/** Every route, static and derived. */
export async function allRoutes(page: Page): Promise<string[]> {
  return [...FIXED_ROUTES, ...(await routesFromModel(page))];
}
