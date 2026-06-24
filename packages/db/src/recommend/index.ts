import { eq } from "drizzle-orm";

import { recommend } from "@cutura/core";

import { type PublishedModelSummary, listPublishedModels } from "../catalog/read";
import { getCrossSellSuggestions } from "../crosssell";
import type { Database } from "../getDb";
import { type Locale, attributeDefinition, attributeValue, order, orderItem } from "../schema";

/** Build a map of model id -> { attributeKey: value } from the model attribute values. */
async function modelAttributeMaps(db: Database): Promise<Map<string, Record<string, string>>> {
  const defs = await db.select().from(attributeDefinition);
  const keyById = new Map(defs.map((d) => [d.id, d.key]));
  const vals = await db.select().from(attributeValue).where(eq(attributeValue.entityType, "model"));
  const map = new Map<string, Record<string, string>>();
  for (const v of vals) {
    const key = keyById.get(v.attributeDefinitionId);
    if (!key) continue;
    const m = map.get(v.entityId) ?? {};
    m[key] = v.value;
    map.set(v.entityId, m);
  }
  return map;
}

/** The distinct base-model ids a customer has ordered (purpose-clear: their own orders). */
async function customerOrderedModelIds(db: Database, customerId: string): Promise<string[]> {
  const rows = await db
    .select({ modelId: orderItem.baseModelId })
    .from(orderItem)
    .innerJoin(order, eq(order.id, orderItem.orderId))
    .where(eq(order.customerId, customerId));
  return [...new Set(rows.map((r) => r.modelId))];
}

export interface RecommendOptions {
  /** Current context models (the PDP model, or the cart's models). */
  sourceModelIds?: string[];
  /** A logged-in customer, to use their own past orders (context + exclude owned). */
  customerId?: string | null;
  limit?: number;
}

/**
 * Content-based + curated recommendations (FR-1101/1102/1110), gathered from the
 * published catalog, model attributes, curated cross-sell, and - for a logged-in
 * customer - their own past orders. Pure ranking is delegated to the core
 * recommender seam; this only assembles candidates and maps the result to models.
 * No body measurements are used (FR-1141).
 */
export async function getRecommendations(
  db: Database,
  locale: Locale,
  opts: RecommendOptions = {},
): Promise<PublishedModelSummary[]> {
  const models = await listPublishedModels(db, locale);
  if (models.length === 0) return [];
  const attrMap = await modelAttributeMaps(db);
  const byId = new Map(models.map((m) => [m.id, m]));

  const candidates = models.map((m) => ({
    id: m.id,
    attributes: attrMap.get(m.id) ?? {},
    orderable: m.status === "orderable",
  }));

  const sourceIds = opts.sourceModelIds ?? [];
  const owned = opts.customerId ? await customerOrderedModelIds(db, opts.customerId) : [];

  const contextIds = [...new Set([...sourceIds, ...owned])];
  const contextAttributes = contextIds
    .map((id) => attrMap.get(id) ?? {})
    .filter((a) => Object.keys(a).length > 0);

  const curatedIds: string[] = [];
  for (const id of sourceIds) {
    const m = byId.get(id);
    if (!m) continue;
    const suggestions = await getCrossSellSuggestions(db, locale, { id: m.id, handle: m.handle });
    for (const s of suggestions) curatedIds.push(s.id);
  }

  const excludeIds = [...new Set([...sourceIds, ...owned])];
  const rankedIds = recommend({
    candidates,
    contextAttributes,
    excludeIds,
    curatedIds,
    limit: opts.limit ?? 4,
  });
  return rankedIds.map((id) => byId.get(id)).filter((m): m is PublishedModelSummary => Boolean(m));
}
