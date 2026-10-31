import { defineConfig, devices } from "@playwright/test";
const port = Number(process.env.E2E_PORT ?? 3101);
const origin = `http://127.0.0.1:${port}`;
const basePath = process.env.E2E_BASE_PATH ?? "";
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: { baseURL: origin, trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
    command: `npm run start -- --port ${port}`,
    url: `${origin}${basePath}/`,
    reuseExistingServer: false,
    timeout: 60000,
  },
});
