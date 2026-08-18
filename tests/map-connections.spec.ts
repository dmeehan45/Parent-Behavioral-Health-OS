import { expect, test } from "@playwright/test";

test("stage connections expose their projected depth without leaving the map", async ({ page }) => {
  await page.goto("/map");

  const connection = page.getByRole("button", { name: /Inspect (handoff|return|feedback)/ }).first();
  await expect(connection).toBeVisible({ timeout: 15_000 });
  await connection.click();

  const sheet = page.getByRole("complementary", { name: "Stage connection detail" });
  await expect(sheet).toBeVisible();
  await expect(sheet).toContainText("Connection");
  await expect(sheet).toContainText(/Operating handoffs|Data & state crossing|Still unmodelled|Problems that span this boundary/);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, `opening a connection makes the page overflow by ${overflow}px`).toBeLessThanOrEqual(1);

  // Connection selection is part of the shareable view just like an open node.
  await expect.poll(() => new URL(page.url()).searchParams.has("connection")).toBe(true);
});

test("isolating Experience shows unmodelled experience boundaries instead of an empty map", async ({ page }) => {
  await page.goto("/map");
  await expect(page.getByRole("button", { name: "Layers" })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Layers" }).click();

  await page.getByRole("checkbox", { name: "Hide Operating flow" }).uncheck();
  await page.getByRole("checkbox", { name: "Hide Data & state" }).uncheck();
  await page.getByRole("checkbox", { name: "Hide Learning" }).uncheck();

  await expect(page.getByText("experience · gap").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Inspect handoff" }).first()).toBeVisible();
});
