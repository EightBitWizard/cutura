// Producer catalog mapping: CUTURA catalog codes -> one producer's external
// codes (e.g. Kutetailor style/fabric/option codes). Lives in the environment DB
// next to the supplier rows it belongs to (operational routing data, never
// published to the storefront). getProducerCodeMap assembles the ProducerCodeMap
// consumed by the pure order-sheet builder in @cutura/core.

import type { ProducerCodeMap } from "@cutura/core";
import { and, eq } from "drizzle-orm";

import { writeAudit } from "../audit";
import type { Database } from "../getDb";
import { baseModel, producerCatalogMap } from "../schema";

export type ProducerMappingRow = typeof producerCatalogMap.$inferSelect;

export type ProducerMappingEntityType = "model" | "fabric" | "option_value" | "upgrade";

const nowIso = () => new Date().toISOString();

export interface ProducerMappingInput {
  producer: string;
  entityType: ProducerMappingEntityType;
  /** Model handle, fabric code, "groupCode:valueCode", or upgrade code. */
  entityKey: string;
  externalCode: string;
  extra?: unknown;
}

export function listProducerMappings(
  db: Database,
  producer: string,
): Promise<ProducerMappingRow[]> {
  return db
    .select()
    .from(producerCatalogMap)
    .where(eq(producerCatalogMap.producer, producer))
    .orderBy(producerCatalogMap.entityType, producerCatalogMap.entityKey);
}

/** Insert or update the entry for (producer, entityType, entityKey). */
export async function upsertProducerMapping(
  db: Database,
  input: ProducerMappingInput,
  actor: string,
): Promise<{ id: string }> {
  const now = nowIso();
  const [existing] = await db
    .select()
    .from(producerCatalogMap)
    .where(
      and(
        eq(producerCatalogMap.producer, input.producer),
        eq(producerCatalogMap.entityType, input.entityType),
        eq(producerCatalogMap.entityKey, input.entityKey),
      ),
    );
  const id = existing?.id ?? crypto.randomUUID();
  if (existing) {
    await db
      .update(producerCatalogMap)
      .set({
        externalCode: input.externalCode,
        extra: input.extra ?? existing.extra,
        updatedAt: now,
      })
      .where(eq(producerCatalogMap.id, id));
  } else {
    await db.insert(producerCatalogMap).values({
      id,
      producer: input.producer,
      entityType: input.entityType,
      entityKey: input.entityKey,
      externalCode: input.externalCode,
      extra: input.extra ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }
  await writeAudit(db, {
    actor,
    action: existing ? "producer_mapping.update" : "producer_mapping.create",
    entityType: "producer_catalog_map",
    entityId: id,
  });
  return { id };
}

export async function deleteProducerMapping(
  db: Database,
  id: string,
  actor: string,
): Promise<boolean> {
  const [existing] = await db
    .select()
    .from(producerCatalogMap)
    .where(eq(producerCatalogMap.id, id));
  if (!existing) return false;
  await db.delete(producerCatalogMap).where(eq(producerCatalogMap.id, id));
  await writeAudit(db, {
    actor,
    action: "producer_mapping.delete",
    entityType: "producer_catalog_map",
    entityId: id,
  });
  return true;
}

export interface CodeMapKeys {
  modelHandle: string;
  fabricCode: string;
  /** "groupCode:valueCode" pairs from the snapshot configuration. */
  optionPairs: string[];
  upgradeCodes: string[];
}

/** Assemble the ProducerCodeMap for one order item; unmapped keys stay absent. */
export async function getProducerCodeMap(
  db: Database,
  producer: string,
  keys: CodeMapKeys,
): Promise<ProducerCodeMap> {
  const rows = await listProducerMappings(db, producer);
  const byKey = new Map(rows.map((r) => [`${r.entityType}:${r.entityKey}`, r.externalCode]));
  const options: Record<string, string> = {};
  for (const pair of keys.optionPairs) {
    const code = byKey.get(`option_value:${pair}`);
    if (code) options[pair] = code;
  }
  const upgrades: Record<string, string> = {};
  for (const u of keys.upgradeCodes) {
    const code = byKey.get(`upgrade:${u}`);
    if (code) upgrades[u] = code;
  }
  return {
    model: byKey.get(`model:${keys.modelHandle}`),
    fabric: byKey.get(`fabric:${keys.fabricCode}`),
    options,
    upgrades,
  };
}

/** The published model handle for an item's base model id (order sheets key mappings by handle). */
export async function getBaseModelHandle(
  db: Database,
  baseModelId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ handle: baseModel.handle })
    .from(baseModel)
    .where(eq(baseModel.id, baseModelId));
  return row?.handle ?? null;
}
