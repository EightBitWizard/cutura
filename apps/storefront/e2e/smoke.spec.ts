import { expect, test } from "@playwright/test";

// Deploy smoke test: asserts rendered content and a live DB, not just HTTP 200,
// so a half-initialized isolate (which can still return a 200 shell) fails the
// gate. Runs on desktop and mobile against the deployed url.

test("@smoke home redirects to a locale and renders the brand", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/(de|en|it|fr)$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("@smoke health endpoint reports the environment and a live DB", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBe(true);
  const body = (await res.json()) as { db: string; environment: string };
  expect(body.db).toBe("ok");
  expect(["staging", "production"]).toContain(body.environment);
});
