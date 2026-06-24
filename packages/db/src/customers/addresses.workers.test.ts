import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import {
  createAddress,
  deleteAddress,
  getDefaultAddress,
  listAddresses,
  setDefaultAddress,
  updateAddress,
} from "./addresses";
import { findOrCreateCustomer } from "./auth";

const db = () => getDb(env.TARGET_TEST_DB);

describe("addresses", () => {
  it("supports CRUD with a single default", async () => {
    const { customer } = await findOrCreateCustomer(db(), `ad_${crypto.randomUUID()}@x.ch`, "de");
    const a = await createAddress(db(), customer.id, {
      line1: "Bahnhofstrasse 1",
      city: "Zuerich",
      zip: "8001",
      country: "CH",
      isDefault: true,
    });
    const b = await createAddress(db(), customer.id, {
      line1: "Dorfweg 2",
      city: "Vaduz",
      zip: "9490",
      country: "LI",
    });
    expect((await listAddresses(db(), customer.id)).length).toBe(2);
    expect((await getDefaultAddress(db(), customer.id))?.id).toBe(a.id);

    expect(await setDefaultAddress(db(), customer.id, b.id)).toBe(true);
    expect((await getDefaultAddress(db(), customer.id))?.id).toBe(b.id);
    expect((await listAddresses(db(), customer.id)).filter((x) => x.isDefault).length).toBe(1);

    expect(
      await updateAddress(db(), customer.id, a.id, {
        line1: "Neugasse 9",
        city: "Bern",
        zip: "3011",
        country: "CH",
      }),
    ).toBe(true);
    expect(await deleteAddress(db(), customer.id, a.id)).toBe(true);
    expect((await listAddresses(db(), customer.id)).length).toBe(1);
  });

  it("rejects a non-owner", async () => {
    const { customer: a } = await findOrCreateCustomer(db(), `x_${crypto.randomUUID()}@x.ch`, "de");
    const { customer: b } = await findOrCreateCustomer(db(), `y_${crypto.randomUUID()}@x.ch`, "de");
    const addr = await createAddress(db(), a.id, {
      line1: "A",
      city: "Z",
      zip: "8001",
      country: "CH",
    });
    expect(
      await updateAddress(db(), b.id, addr.id, {
        line1: "B",
        city: "Z",
        zip: "8001",
        country: "CH",
      }),
    ).toBe(false);
    expect(await deleteAddress(db(), b.id, addr.id)).toBe(false);
    expect(await setDefaultAddress(db(), b.id, addr.id)).toBe(false);
  });
});
