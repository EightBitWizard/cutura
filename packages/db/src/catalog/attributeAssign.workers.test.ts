import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { getDb } from "../getDb";
import { attributeDefinition } from "../schema";
import {
  listEntityAttributeValues,
  removeEntityAttributeValue,
  setEntityAttributeValue,
} from "./index";

const db = () => getDb(env.TARGET_TEST_DB);
const iso = "2026-07-05T10:00:00.000Z";

async function def(key: string): Promise<string> {
  const id = crypto.randomUUID();
  await db()
    .insert(attributeDefinition)
    .values({
      id,
      key,
      labelI18n: { de: key },
      appliesTo: "model",
      createdAt: iso,
      updatedAt: iso,
    });
  return id;
}

describe("entity attribute assignment", () => {
  it("upserts a single value per definition + entity, and clears it", async () => {
    const defId = await def(`colour_${crypto.randomUUID().slice(0, 6)}`);
    const modelId = crypto.randomUUID();

    await setEntityAttributeValue(db(), defId, "model", modelId, "blue");
    let values = await listEntityAttributeValues(db(), "model", modelId);
    expect(values.find((v) => v.attributeDefinitionId === defId)?.value).toBe("blue");

    // Re-set updates in place (single value per def + entity).
    await setEntityAttributeValue(db(), defId, "model", modelId, "green");
    values = await listEntityAttributeValues(db(), "model", modelId);
    expect(values.filter((v) => v.attributeDefinitionId === defId).length).toBe(1);
    expect(values.find((v) => v.attributeDefinitionId === defId)?.value).toBe("green");

    await removeEntityAttributeValue(db(), defId, "model", modelId);
    values = await listEntityAttributeValues(db(), "model", modelId);
    expect(values.find((v) => v.attributeDefinitionId === defId)).toBeUndefined();
  });
});
