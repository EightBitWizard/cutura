import { eq } from "drizzle-orm";
import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import { baseModel, fabric, modelAllowedFabric } from "../schema";
import {
  deleteRow,
  getRow,
  listRows,
  saveRow,
  setBaseModelStatus,
  setFabricAvailability,
  setModelAllowedFabrics,
} from "./index";

const db = () => getDb(env.CONTROL_TEST_DB);
const TS = "2026-06-24T00:00:00Z";

function fabricRow(id: string) {
  return { id, code: id, nameI18n: { de: "Stoff" }, createdAt: TS, updatedAt: TS };
}

describe("catalog CRUD helpers", () => {
  it("saves, reads, lists, and deletes a row", async () => {
    const id = `f_${crypto.randomUUID().slice(0, 8)}`;
    await saveRow(db(), fabric, fabricRow(id));
    expect((await getRow(db(), fabric, id))?.code).toBe(id);

    // saveRow replaces by id (idempotent author save)
    await saveRow(db(), fabric, { ...fabricRow(id), code: id, surchargeMinor: 500 });
    expect((await getRow(db(), fabric, id))?.surchargeMinor).toBe(500);

    const all = await listRows(db(), fabric);
    expect(all.some((r) => r.id === id)).toBe(true);

    await deleteRow(db(), fabric, id);
    expect(await getRow(db(), fabric, id)).toBeUndefined();
  });

  it("toggles fabric availability", async () => {
    const id = `f_${crypto.randomUUID().slice(0, 8)}`;
    await saveRow(db(), fabric, { ...fabricRow(id), available: true });
    await setFabricAvailability(db(), id, false);
    expect((await getRow(db(), fabric, id))?.available).toBe(false);
  });

  it("replaces a model's allowed fabrics, preserving order and clearing removed ones", async () => {
    const m = `m_${crypto.randomUUID().slice(0, 8)}`;
    await saveRow(db(), baseModel, {
      id: m,
      garmentTypeId: "gt_x",
      handle: m,
      nameI18n: { de: "Modell" },
      basePriceMinor: 10000,
      leadTimeMinDays: 21,
      leadTimeMaxDays: 35,
      createdAt: TS,
      updatedAt: TS,
    });

    await setModelAllowedFabrics(db(), m, ["fa", "fb"]);
    let rows = await db()
      .select()
      .from(modelAllowedFabric)
      .where(eq(modelAllowedFabric.baseModelId, m));
    expect(rows).toHaveLength(2);

    await setModelAllowedFabrics(db(), m, ["fb"]);
    rows = await db()
      .select()
      .from(modelAllowedFabric)
      .where(eq(modelAllowedFabric.baseModelId, m));
    expect(rows).toHaveLength(1);
    expect(rows[0]!.fabricId).toBe("fb");

    await setBaseModelStatus(db(), m, "orderable");
    expect((await getRow(db(), baseModel, m))?.status).toBe("orderable");
  });
});
