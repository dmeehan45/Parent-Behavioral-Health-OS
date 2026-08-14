import { defineConfig, devices } from "@playwright/test";

/**
 * Two viewports, a handful of routes, and the few assertions that catch the
 * failure that actually happens: something stops fitting on a phone.
 *
 * This is deliberately thin. The repository is a thinking tool and iteration
 * speed matters more than coverage — these tests exist to stop a push from
 * silently breaking the responsive experience, not to pin the design down.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "line" : "list",

  use: {
    baseURL: "http://127.0.0.1:3210",
    trace: "off",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "mobile",
      use: { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } },
    },
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],

  // `next build` then `next start`: the dev server recompiles on first hit and
  // makes the first navigation slow enough to look like a failure.
  webServer: {
    command: "npm run build && npm run start -- --port 3210",
    url: "http://127.0.0.1:3210",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
