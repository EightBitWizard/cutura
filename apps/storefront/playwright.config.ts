import { defineConfig, devices } from "@playwright/test";

// The smoke test runs against a DEPLOYED url (the live-URL deploy gate). CI sets
// BASE_URL after deploying to staging or production; there is no local web
// server because the health route needs the Workers runtime and real bindings.
const baseURL = process.env.BASE_URL;
if (!baseURL) {
  throw new Error(
    "Set BASE_URL to the deployed url to run the smoke test, e.g. BASE_URL=https://cutura-storefront-staging.<account>.workers.dev",
  );
}

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: { baseURL, trace: "on-first-retry" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["iPhone 12"] } },
  ],
});
