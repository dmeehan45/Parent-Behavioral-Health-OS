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
const FIXED_ROUTES = ["/", "/map", "/prototypes"];

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
 * The primitive with the most to say, whatever it currently is.
 *
 * The sheet only misbehaves once its content is taller than the screen, so the
 * test needs the longest record in the model rather than a written-down id that
 * would rot the first time content moved.
 */
async function longestRecordId(page: Page): Promise<string> {
  const response = await page.request.get("/api/model");
  expect(response.ok()).toBeTruthy();
  const model = (await response.json()) as {
    nodes: Array<{ id: string; blocks?: unknown[] }>;
  };

  const richest = model.nodes.reduce((best, node) =>
    (node.blocks?.length ?? 0) > (best.blocks?.length ?? 0) ? node : best,
  );
  return richest.id;
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
   * The map fitting the viewport was already checked — but only with nothing
   * open, which is the one state where the sheet cannot push it out of shape.
   * The sheet is the tallest thing the workspace ever holds, so it is the thing
   * that finds an indefinite height, and the failure is silent: the shell grows
   * to fit the content instead of the content scrolling inside the shell, the
   * scrollport never overflows, and the wheel moves the document instead.
   */
  test("an open detail sheet scrolls inside the map instead of growing the page", async ({ page }) => {
    await page.goto("/map");
    const target = await longestRecordId(page);

    await page.goto(`/map?open=${encodeURIComponent(target)}`);
    await expect(page.locator(".sheet-body")).toBeVisible({ timeout: 15_000 });

    const vertical = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollHeight - doc.clientHeight;
    });
    expect(vertical, `an open sheet made the page ${vertical}px taller than the viewport`)
      .toBeLessThanOrEqual(1);

    const viewport = page.viewportSize()!;
    const pane = await page.evaluate(() => {
      const element = document.querySelector(".sheet-body")!;
      return { visible: element.clientHeight, content: element.scrollHeight };
    });

    /*
     * A scrollport taller than the window is a scrollport that can never
     * overflow, and a pane that never overflows never scrolls. This is the
     * measurement that tells a bounded pane from one sized by its own content.
     */
    expect(pane.visible, `the sheet's scrollport is ${pane.visible}px inside a ${viewport.height}px window`)
      .toBeLessThan(viewport.height);

    // And the part that a reader would actually notice.
    const reachedEnd = await page.evaluate(async () => {
      const element = document.querySelector(".sheet-body")!;
      element.scrollTop = element.scrollHeight;
      await new Promise((resolve) => requestAnimationFrame(resolve));
      return Math.abs(element.scrollTop + element.clientHeight - element.scrollHeight) < 3;
    });
    expect(reachedEnd, "the end of the record cannot be reached by scrolling the sheet").toBe(true);
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
