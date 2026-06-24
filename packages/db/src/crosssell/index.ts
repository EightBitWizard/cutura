import { and, eq, inArray } from "drizzle-orm";

import {
  type Locale,
  attributeDefinition,
  attributeValue,
  baseModel,
  crossSellRule,
} from "../schema";
import { type PublishedModelSummary, localize } from "../catalog/read";
import type { Database } from "../getDb";

const nowIso = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

export type CrossSellRuleRow = typeof crossSellRule.$inferSelect;

export function listCrossSellRules(db: Database): Promise<CrossSellRuleRow[]> {
  return db.select().from(crossSellRule);
}

export async function createCrossSellRule(
  db: Database,
  input: {
    sourceType: "model" | "attribute";
    sourceKey: string;
    suggestedModelId: string;
    position?: number;
  },
): Promise<{ id: string }> {
  const id = uuid();
  const now = nowIso();
  await db.insert(crossSellRule).values({
    id,
    sourceType: input.sourceType,
    sourceKey: input.sourceKey,
    suggestedModelId: input.suggestedModelId,
    position: input.position ?? 0,
    createdAt: now,
    updatedAt: now,
  });
  return { id };
}

export async function deleteCrossSellRule(db: Database, id: string): Promise<void> {
  await db.delete(crossSellRule).where(eq(crossSellRule.id, id));
}

/**
 * Curated cross-sell suggestions for a source model (FR-2E0): rules matching the
 * model's handle (sourceType "model") or any of its attribute "key:value"s
 * (sourceType "attribute"), ordered by position, excluding the source + drafts.
 */
export async function getCrossSellSuggestions(
  db: Database,
  locale: Locale,
  source: { id: string; handle: string },
): Promise<PublishedModelSummary[]> {
  const av = await db
    .select({ key: attributeDefinition.key, value: attributeValue.value })
    .from(attributeValue)
    .innerJoin(
      attributeDefinition,
      eq(attributeValue.attributeDefinitionId, attributeDefinition.id),
    )
    .where(and(eq(attributeValue.entityType, "model"), eq(attributeValue.entityId, source.id)));
  const attrKeys = new Set(av.map((a) => `${a.key}:${a.value}`));

  const rules = await db.select().from(crossSellRule);
  const matched = rules
    .filter(
      (r) =>
        (r.sourceType === "model" && r.sourceKey === source.handle) ||
        (r.sourceType === "attribute" && attrKeys.has(r.sourceKey)),
    )
    .sort((a, b) => a.position - b.position);

  const ids: string[] = [];
  for (const r of matched) {
    if (r.suggestedModelId !== source.id && !ids.includes(r.suggestedModelId)) {
      ids.push(r.suggestedModelId);
    }
  }
  if (ids.length === 0) return [];

  const rows = await db.select().from(baseModel).where(inArray(baseModel.id, ids));
  const byId = new Map(rows.filter((m) => m.status !== "draft").map((m) => [m.id, m]));
  return ids
    .map((id) => byId.get(id))
    .filter((m): m is NonNullable<typeof m> => m !== undefined)
    .map((m) => ({
      id: m.id,
      handle: m.handle,
      name: localize(m.nameI18n, locale),
      description: localize(m.descriptionI18n, locale),
      basePriceMinor: m.basePriceMinor,
      leadTimeMinDays: m.leadTimeMinDays,
      leadTimeMaxDays: m.leadTimeMaxDays,
      status: m.status as "view_only" | "orderable",
    }));
}
