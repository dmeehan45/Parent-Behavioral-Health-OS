import { expect, test, type Page } from "@playwright/test";
import { FIXED_ROUTES, routesFromModel } from "./routes";

/**
 * Responsive smoke tests.
 *
 * The one failure worth guarding against is a change that fits on a laptop and
 * breaks on a phone: a fixed width, an unwrapped row, a canvas that pushes the
 * page sideways. That is what these check, and not much else.
 *
 * Whether what fits can be *read* is a different question, and lives in
 * `legibility.spec.ts`. Keeping them apart matters: this file asks about the
 * box, that one asks about the text inside it, and for a long time only the
 * first question was ever asked.
 *
 * The routes are derived from the model in `routes.ts`, shared with that file.
 */

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

  /*
   * The nav is a horizontal scroller with its scrollbar hidden, so when its
   * links stopped fitting they were clipped *inside* it and the document never
   * grew. "every page template fits its viewport" stayed green while the phone
   * showed "Researc" and dropped the count of research waiting on a person.
   * Overflow measured at the document says nothing about that; this measures
   * the link against the box that clips it.
   */
  test("what the nav hides, the nav admits to hiding", async ({ page }) => {
    await page.goto("/");

    const nav = page.locator("header.app-header nav");
    await expect(nav.locator("a").first()).toBeVisible();

    // Measure the settled layout. Before Manrope arrives the labels are set in
    // the fallback face and every width here is a different number — measured
    // at first paint this reads Times New Roman and reports the nav 152px
    // *under* full rather than over.
    await page.evaluate(() => document.fonts.ready);

    const read = () =>
      nav.evaluate((el) => ({
        hidden: el.scrollWidth - el.clientWidth,
        fades: getComputedStyle(el).maskImage !== "none",
        links: [...el.querySelectorAll("a")].map((a) => (a as HTMLElement).innerText.trim().replace(/\s+/g, " ")),
      }));

    // Exact fit is not assertable: the same labels measure differently between
    // browser builds by around ten pixels, and `NEXT_PUBLIC_CONTENT_SOURCE_URL`
    // legitimately adds a fourth link. What must hold either way is that a
    // reader can tell there is more — the original defect was 53px hidden
    // behind no scrollbar, no fade and no cue, which reads as a rendering
    // fault rather than as something to scroll.
    const assertHonest = (state: Awaited<ReturnType<typeof read>>, at: number) => {
      if (state.hidden <= 1) return false;
      expect(
        state.fades,
        `at ${at}px the nav hides ${state.hidden}px of ${state.links.length} links (${state.links.join(", ")}) with no fade to say so`,
      ).toBe(true);
      return true;
    };

    const size = page.viewportSize();
    assertHonest(await read(), size?.width ?? 0);

    // 320px is the narrowest width this interface claims to support, and the
    // one where these labels certainly do not fit. Checked explicitly so the
    // assertion above is exercised rather than skipped everywhere: at the
    // project widths the nav now fits, and a guard whose body never runs is
    // not a guard.
    await page.setViewportSize({ width: 320, height: size?.height ?? 844 });
    await page.evaluate(() => document.fonts.ready);
    const narrow = await read();
    expect(narrow.hidden, "the nav is expected to overflow at 320px").toBeGreaterThan(1);
    assertHonest(narrow, 320);
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

  /*
   * Record ids come from filenames and research is expected to rename and
   * remove things, so a link that was correct when it was sent can name nothing
   * by the time it is opened. Without `app/not-found.tsx` that landed on the
   * framework's own page: white ground, system font, and no way onward.
   */
  test("a dead end is still this product, and still offers a way out", async ({ page }) => {
    await page.goto("/stages/this-id-does-not-exist");

    const main = page.locator("main");
    await expect(main).toBeVisible();

    // A way onward, not just an apology.
    await expect(main.locator('a[href="/map"]')).toBeVisible();

    // On the wash like every other page, rather than the framework's white.
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg, "the dead-end page is not on the app's ground").not.toBe("rgb(255, 255, 255)");
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
