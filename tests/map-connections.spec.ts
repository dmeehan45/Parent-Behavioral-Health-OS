import { expect, test } from "@playwright/test";

test("default and all-layer overviews keep connection text off the stage map", async ({ page }) => {
  await page.goto("/map");
  await expect(page.getByRole("button", { name: "Layers" })).toBeVisible({ timeout: 15_000 });

  // The overview should communicate topology with lines, not repeat a label box
  // between every Stage. This is the state that previously obscured node text.
  await expect(page.locator(".connection-detail-label")).toHaveCount(0);

  await page.getByRole("button", { name: "Layers" }).click();
  await page.getByRole("checkbox", { name: "Show Data & state" }).check();
  await page.getByRole("checkbox", { name: "Show Actors" }).check();

  // Even with every layer enabled, the canvas stays an overview. Layer-specific
  // payload text appears only after the reader isolates a question.
  await expect(page.locator(".connection-detail-label")).toHaveCount(0);
});

test("isolating Actors exposes real role continuity and keeps the connection inspectable", async ({ page }) => {
  await page.goto("/map");
  await expect(page.getByRole("button", { name: "Layers" })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Layers" }).click();

  await page.getByRole("checkbox", { name: "Show Actors" }).check();
  await page.getByRole("checkbox", { name: "Hide Operating flow" }).uncheck();
  await page.getByRole("checkbox", { name: "Hide Learning" }).uncheck();
  await page.getByRole("button", { name: "Close layer controls" }).click();

  const connection = page.getByRole("button", { name: "Inspect actor connection" }).first();
  await expect(connection).toBeVisible();
  await expect(connection).toContainText(/Clinician|Family/);
  await connection.click();

  const sheet = page.getByRole("complementary", { name: "Stage connection detail" });
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText("Actors continuing across the boundary");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, `opening a connection makes the page overflow by ${overflow}px`).toBeLessThanOrEqual(1);
  await expect.poll(() => new URL(page.url()).searchParams.has("connection")).toBe(true);
});
