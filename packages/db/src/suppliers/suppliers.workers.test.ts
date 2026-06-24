import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import { listSuppliers, setDefaultSupplier, upsertSupplier } from "./index";

const db = () => getDb(env.TARGET_TEST_DB);

describe("suppliers", () => {
  it("keeps a single default across create + set-default", async () => {
    const a = await upsertSupplier(
      db(),
      { name: `A_${crypto.randomUUID()}`, isDefault: true },
      "admin",
    );
    const b = await upsertSupplier(
      db(),
      { name: `B_${crypto.randomUUID()}`, isDefault: true },
      "admin",
    );
    // b became default -> a no longer default
    let rows = await listSuppliers(db());
    expect(rows.find((s) => s.id === b.id)?.isDefault).toBe(true);
    expect(rows.find((s) => s.id === a.id)?.isDefault).toBe(false);
    expect(rows.filter((s) => s.isDefault).length).toBe(1);

    expect(await setDefaultSupplier(db(), a.id, "admin")).toBe(true);
    rows = await listSuppliers(db());
    expect(rows.find((s) => s.id === a.id)?.isDefault).toBe(true);
    expect(rows.filter((s) => s.isDefault).length).toBe(1);
    expect(await setDefaultSupplier(db(), "missing", "admin")).toBe(false);
  });
});
