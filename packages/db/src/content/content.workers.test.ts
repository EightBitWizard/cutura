import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import { publishEntity } from "../publish";
import { contentPage } from "../schema";
import { getPublishedContentPage, listPublishedContentPages } from "./index";

const control = () => getDb(env.CONTROL_TEST_DB);
const target = () => getDb(env.TARGET_TEST_DB);
const iso = "2026-07-05T10:00:00.000Z";

describe("content pages", () => {
  it("publishes a content page and reads it localized", async () => {
    const id = crypto.randomUUID();
    const slug = `about-${id.slice(0, 6)}`;
    await control()
      .insert(contentPage)
      .values({
        id,
        slug,
        kind: "content",
        titleI18n: { de: "Ueber uns", en: "About us" },
        bodyI18n: { de: "Hallo", en: "Hello" },
        version: 1,
        createdAt: iso,
        updatedAt: iso,
      });

    await publishEntity("contentPage", id, {
      control: control(),
      target: target(),
      environment: "staging",
      publishedBy: "admin",
    });

    const en = await getPublishedContentPage(target(), slug, "en");
    expect(en?.title).toBe("About us");
    expect(en?.body).toBe("Hello");
    // Locale fallback to German.
    const it = await getPublishedContentPage(target(), slug, "it");
    expect(it?.title).toBe("Ueber uns");

    expect(
      (await listPublishedContentPages(target(), "de", "content")).some((p) => p.slug === slug),
    ).toBe(true);
  });
});
