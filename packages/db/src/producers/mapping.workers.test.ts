import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import {
  deleteProducerMapping,
  getProducerCodeMap,
  listProducerMappings,
  upsertProducerMapping,
} from "./mapping";

const db = () => getDb(env.TARGET_TEST_DB);

// Each test uses its own producer key so runs stay isolated.
const producerKey = () => `kutetailor_${crypto.randomUUID()}`;

describe("producer catalog mapping", () => {
  it("upserts by (producer, entityType, entityKey) and lists entries", async () => {
    const producer = producerKey();
    await upsertProducerMapping(
      db(),
      { producer, entityType: "fabric", entityKey: "oxf-white", externalCode: "KT-FAB-1" },
      "admin",
    );
    // Same key again: updates in place instead of duplicating.
    await upsertProducerMapping(
      db(),
      { producer, entityType: "fabric", entityKey: "oxf-white", externalCode: "KT-FAB-2" },
      "admin",
    );
    const rows = await listProducerMappings(db(), producer);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.externalCode).toBe("KT-FAB-2");
  });

  it("assembles the ProducerCodeMap the order sheet builder needs", async () => {
    const producer = producerKey();
    const entries = [
      { entityType: "model", entityKey: "oxford-business-shirt", externalCode: "KT-STYLE-1" },
      { entityType: "fabric", entityKey: "oxf-white", externalCode: "KT-FAB-1" },
      { entityType: "option_value", entityKey: "collar:kent", externalCode: "KT-COL-1" },
      { entityType: "option_value", entityKey: "cuff:barrel", externalCode: "KT-CUF-1" },
      { entityType: "upgrade", entityKey: "monogram", externalCode: "KT-UPG-1" },
    ] as const;
    for (const e of entries) await upsertProducerMapping(db(), { producer, ...e }, "admin");

    const map = await getProducerCodeMap(db(), producer, {
      modelHandle: "oxford-business-shirt",
      fabricCode: "oxf-white",
      optionPairs: ["collar:kent", "cuff:barrel", "placket:hidden"],
      upgradeCodes: ["monogram"],
    });

    expect(map).toEqual({
      model: "KT-STYLE-1",
      fabric: "KT-FAB-1",
      options: { "collar:kent": "KT-COL-1", "cuff:barrel": "KT-CUF-1" },
      upgrades: { monogram: "KT-UPG-1" },
    });
  });

  it("returns an empty map when nothing is mapped (sheet still renders with warnings)", async () => {
    const map = await getProducerCodeMap(db(), producerKey(), {
      modelHandle: "oxford-business-shirt",
      fabricCode: "oxf-white",
      optionPairs: ["collar:kent"],
      upgradeCodes: [],
    });
    expect(map).toEqual({ model: undefined, fabric: undefined, options: {}, upgrades: {} });
  });

  it("deletes a mapping entry", async () => {
    const producer = producerKey();
    await upsertProducerMapping(
      db(),
      { producer, entityType: "upgrade", entityKey: "monogram", externalCode: "KT-UPG-1" },
      "admin",
    );
    const [row] = await listProducerMappings(db(), producer);
    expect(row).toBeDefined();
    expect(await deleteProducerMapping(db(), row!.id, "admin")).toBe(true);
    expect(await listProducerMappings(db(), producer)).toHaveLength(0);
  });
});
