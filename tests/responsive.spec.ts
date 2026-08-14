import { expect, test, type Page } from "@playwright/test";
import type { NodeKind } from "../lib/model/types";

/**
 * Responsive smoke tests.
 *
 * The one failure worth guarding against is a change that fits on a laptop and
 * breaks on a phone: a fixed width, an unwrapped row, a canvas that pushes the
 * page sideways. That is what these check, and not much else.
 *
 * The routes come from `/api/model` rather than from a list here, for the same
 * reason the interface does: adding a stage or a bet must not require editing
 * application code, and a hardcoded ID here would rot the first time content
 * moved.
 */

/** Static routes that exist regardless of what is in `content/`. */
const FIXED_ROUTES = ["/", "/map", "/prototypes", "/review"];

/** One record page per primitive, so every page template gets looked at once. */
async function routesFromModel(page: Page): Promise<string[]> {
  const response = await page.request.get("/api/model");
  expect(response.ok()).toBeTruthy();
  const model = (await response.json()) as {
    nodes: Array<{ kind: NodeKind; href: string }>;
  };

  const seen = new Map<NodeKind, string>();
  for (const node of model.nodes) {
    if (!seen.has(node.kind)) seen.set(node.kind, node.href);
  }
  return [...seen.values()];
}

/**
 * The page may exceed the viewport by a sub-pixel from a fractional layout;
 * anything past that is a real overflow a reader would feel as a sideways
 * scrollbar.
 */
async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth - doc.clientWidth;
  });
}

test.describe("responsive shell", () => {
  test("every page template fits its viewport", async ({ page }) => {
    await page.goto("/");
    const routes = [...FIXED_ROUTES, ...(await routesFromModel(page))];

    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("header.app-header")).toBeVisible();

      const overflow = await horizontalOverflow(page);
      expect(overflow, `${route} overflows its viewport by ${overflow}px`).toBeLessThanOrEqual(1);
    }
  });

  test("primary navigation is reachable and hits the 44px target", async ({ page }) => {
    await page.goto("/");

    const links = page.locator("header.app-header nav a");
    await expect(links.first()).toBeVisible();

    for (const link of await links.all()) {
      const box = await link.boundingBox();
      expect(box, "a nav link has no box").not.toBeNull();
      // The design system's floor for anything you tap.
      expect(box!.height, `nav link "${await link.innerText()}" is ${box!.height}px tall`)
        .toBeGreaterThanOrEqual(44);
    }
  });

  test("the map canvas renders and stays inside the page", async ({ page }) => {
    await page.goto("/map");

    // React Flow paints client-side; wait for a node rather than a timeout.
    await expect(page.locator(".react-flow__node").first()).toBeVisible({ timeout: 15_000 });

    /*
     * A node having a box is not the same as the map being on screen. React
     * Flow's root asks for `height: 100%`, so if an ancestor's height stops
     * being definite the root collapses to zero and clips everything inside it
     * — the nodes still measure correctly, and the map renders blank.
     */
    const canvas = await page.locator(".react-flow").boundingBox();
    expect(canvas!.height, "the canvas collapsed — the map renders blank").toBeGreaterThan(200);

    const overflow = await horizontalOverflow(page);
    expect(overflow, `the map overflows its viewport by ${overflow}px`).toBeLessThanOrEqual(1);

    /*
     * The map is one screen: header, then a canvas that takes exactly what is
     * left. It is sized by subtracting the header from the viewport, so any
     * change to the header's height silently pushes the minimap and the zoom
     * controls off the bottom edge. That is the regression this catches.
     */
    const vertical = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollHeight - doc.clientHeight;
    });
    expect(vertical, `the map is ${vertical}px taller than the viewport`).toBeLessThanOrEqual(1);

    /*
     * The canvas clips its own overflow, so a control that runs off the bottom
     * is invisible rather than scrollable — it just quietly stops being usable
     * on a phone. Check the floating furniture explicitly.
     */
    const viewport = page.viewportSize()!;
    const boxes: Record<string, { x: number; y: number; width: number; height: number }> = {};

    for (const selector of [".canvas-minimap", ".canvas-controls"]) {
      const box = await page.locator(selector).boundingBox();
      if (!box) continue; // Hidden at this width is a legitimate answer.
      boxes[selector] = box;
      expect(box.y + box.height, `${selector} runs past the bottom edge`).toBeLessThanOrEqual(
        viewport.height,
      );
      expect(box.x + box.width, `${selector} runs past the right edge`).toBeLessThanOrEqual(
        viewport.width,
      );
    }

    // Both are bottom-right panels and are kept apart by hand-tuned margins,
    // which is exactly the kind of thing that silently stops being true.
    const [a, b] = Object.values(boxes);
    if (a && b) {
      const overlaps =
        a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
      expect(overlaps, "the minimap and the zoom controls are on top of each other").toBe(false);
    }
  });

  /*
   * The review page carries a generated decision file in a `<pre>`, which is
   * the first unbreakable long line in the application — and it pushed every
   * page sideways on a phone.
   *
   * The shell is a flex item whose `margin: 0 auto` are cross-axis auto
   * margins, so it is sized by fit-content rather than stretched. Fit-content
   * never drops below min-content, and `min-width: 0` cannot lower that floor,
   * so the longest line in the decision file set the width of the document and
   * the child's own `overflow-x: auto` did nothing. The fix is a definite width
   * on `.shell`; this is the case that would have caught it.
   */
  test("wide content scrolls inside its own box rather than widening the page", async ({ page }) => {
    const response = await page.request.get("/api/model");
    expect(response.ok()).toBeTruthy();

    await page.goto("/review");
    const firstRun = page.locator(".card-grid a").first();
    if ((await firstRun.count()) === 0) return; // No research handed off yet.

    await firstRun.click();
    const block = page.locator(".review-yaml");
    await expect(block).toBeVisible();

    const overflow = await horizontalOverflow(page);
    expect(overflow, `the review page overflows its viewport by ${overflow}px`).toBeLessThanOrEqual(1);

    const box = await block.boundingBox();
    expect(box!.width, "the decision file is wider than the viewport").toBeLessThanOrEqual(
      page.viewportSize()!.width,
    );
  });

  test("body copy stays readable rather than stretching the full width", async ({ page }) => {
    await page.goto("/");

    const lede = page.locator(".home .lede").first();
    await expect(lede).toBeVisible();

    const box = await lede.boundingBox();
    // 720px is the system's article measure. Allow the padding either side.
    expect(box!.width).toBeLessThanOrEqual(760);
  });
});
