import { expect, test } from "@playwright/test";

// Accessibility smoke (NFR-12), run against the deployed URL post-provisioning
// (`playwright test --grep @a11y`). Component-level a11y is enforced statically by
// eslint-plugin-jsx-a11y (via next/core-web-vitals) in the gate; these checks add
// page-level heuristics. Full axe-core scanning is a deferred enhancement.

test("@a11y home has a lang attribute, one h1, and alt text on images", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/(de|en|it|fr)$/);

  const lang = await page.locator("html").getAttribute("lang");
  expect(lang && /^(de|en|it|fr)$/.test(lang)).toBe(true);

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.locator("h1").count()).toBe(1);

  const imagesMissingAlt = await page.locator("img:not([alt])").count();
  expect(imagesMissingAlt).toBe(0);
});

test("@a11y the configurator controls are reachable + labelled on a product", async ({ page }) => {
  await page.goto("/de");
  const firstProduct = page.getByRole("link").filter({ hasText: /CHF/ }).first();
  if ((await firstProduct.count()) === 0)
    test.skip(true, "no published product in this environment");
  await firstProduct.click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Buttons must have an accessible name.
  for (const button of await page.getByRole("button").all()) {
    expect(((await button.textContent()) ?? "").trim().length).toBeGreaterThan(0);
  }
});
