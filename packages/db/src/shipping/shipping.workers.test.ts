import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import { getShippingForCountry, listShipping, saveShippingMethod, saveShippingZone } from "./index";

const db = () => getDb(env.TARGET_TEST_DB);

describe("shipping config", () => {
  it("resolves the standard method by country, null for an unconfigured country", async () => {
    const zone = await saveShippingZone(db(), {
      name: `CH-LI-${crypto.randomUUID()}`,
      countries: ["CH", "LI"],
    });
    await saveShippingMethod(db(), {
      zoneId: zone.id,
      code: "standard",
      priceMinor: 0,
      kind: "standard",
      includedInPrice: true,
    });

    const ch = await getShippingForCountry(db(), "CH");
    expect(ch?.method.code).toBe("standard");
    expect(ch?.method.includedInPrice).toBe(true);
    expect(await getShippingForCountry(db(), "US")).toBeNull();

    const listed = await listShipping(db());
    expect(listed.some((z) => z.zone.id === zone.id && z.methods.length >= 1)).toBe(true);
  });
});
