import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: true,
  retries: 0,
  use: {
    baseURL: process.env.PREVIEW_URL || "http://127.0.0.1:3147",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: process.env.PREVIEW_URL
    ? undefined
    : {
        command: "npm run preview",
        url: "http://127.0.0.1:3147",
        reuseExistingServer: !process.env.CI,
      },
});
