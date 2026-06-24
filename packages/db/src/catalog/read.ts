// Read the published catalog from an environment database for the storefront.
// Every row in an environment DB is published by construction (it got there via
// the publish routine), so these queries do not filter on a publish flag; they
// resolve per-model allow-lists, localize content (German fallback), and respect
// orderability and fabric availability. See REQUIREMENTS.md E3 (FR-320), E4
// (FR-420), E12 (FR-1202).

import { and, eq, inArray } from "drizzle-orm";

import type { SewnInLabel } from "@cutura/core";

import type { Database } from "../getDb";
import {
  type Locale,
  attributeDefinition,
  attributeValue,
  baseModel,
  collection,
  collectionMember,
  fabric,
  garmentType,
  media,
  modelAllowedFabric,
  modelAllowedOption,
  modelAllowedUpgrade,
  optionGroup,
  optionValue,
  upgrade,
} from "../schema";

/** Pick the locale's value, falling back to German, then empty. */
export function localize(
  text: Partial<Record<Locale, string>> | null | undefined,
  locale: Locale,
): string {
  return text?.[locale] ?? text?.de ?? "";
}

export interface PublishedModelSummary {
  id: string;
  handle: string;
  name: string;
  description: string;
  basePriceMinor: number;
  leadTimeMinDays: number;
  leadTimeMaxDays: number;
  status: "view_only" | "orderable";
}

export interface PublishedModelDetail extends PublishedModelSummary {
  /** The garment type key (e.g. "shirt"), used by the snapshot, QC, and supplier spec. */
  garmentType: string;
  fabrics: Array<{
    code: string;
    name: string;
    surchargeMinor: number;
    available: boolean;
    fibreComposition: unknown;
  }>;
  optionGroups: Array<{
    code: string;
    label: string;
    required: boolean;
    values: Array<{ code: string; label: string; surchargeMinor: number }>;
  }>;
  upgrades: Array<{ code: string; name: string; priceMinor: number; placement: string | null }>;
}

function byPosition<T extends { position: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.position - b.position);
}

export async function listPublishedModels(
  db: Database,
  locale: Locale,
): Promise<PublishedModelSummary[]> {
  const rows = await db.select().from(baseModel);
  return rows
    .filter((r) => r.status !== "draft")
    .map((r) => ({
      id: r.id,
      handle: r.handle,
      name: localize(r.nameI18n, locale),
      description: localize(r.descriptionI18n, locale),
      basePriceMinor: r.basePriceMinor,
      leadTimeMinDays: r.leadTimeMinDays,
      leadTimeMaxDays: r.leadTimeMaxDays,
      status: r.status as "view_only" | "orderable",
    }));
}

export async function getPublishedModel(
  db: Database,
  handle: string,
  locale: Locale,
): Promise<PublishedModelDetail | undefined> {
  const [model] = await db.select().from(baseModel).where(eq(baseModel.handle, handle));
  if (!model || model.status === "draft") return undefined;

  const [gt] = await db.select().from(garmentType).where(eq(garmentType.id, model.garmentTypeId));

  // Allowed fabrics, in allow-list order, available only.
  const af = byPosition(
    await db.select().from(modelAllowedFabric).where(eq(modelAllowedFabric.baseModelId, model.id)),
  );
  const fabricIds = af.map((r) => r.fabricId);
  const fabricRows = fabricIds.length
    ? await db.select().from(fabric).where(inArray(fabric.id, fabricIds))
    : [];
  const fabricById = new Map(fabricRows.map((f) => [f.id, f]));
  const fabrics = fabricIds
    .map((id) => fabricById.get(id))
    .filter((f): f is NonNullable<typeof f> => f !== undefined && f.available)
    .map((f) => ({
      code: f.code,
      name: localize(f.nameI18n, locale),
      surchargeMinor: f.surchargeMinor,
      available: f.available,
      fibreComposition: f.fibreComposition,
    }));

  // Allowed option groups + their values.
  const ao = byPosition(
    await db.select().from(modelAllowedOption).where(eq(modelAllowedOption.baseModelId, model.id)),
  );
  const groupIds = ao.map((r) => r.optionGroupId);
  const groupRows = groupIds.length
    ? await db.select().from(optionGroup).where(inArray(optionGroup.id, groupIds))
    : [];
  const valueRows = groupIds.length
    ? await db.select().from(optionValue).where(inArray(optionValue.optionGroupId, groupIds))
    : [];
  const groupById = new Map(groupRows.map((g) => [g.id, g]));
  const optionGroups = ao
    .map((r) => {
      const group = groupById.get(r.optionGroupId);
      if (!group) return undefined;
      return {
        code: group.code,
        label: localize(group.labelI18n, locale),
        required: r.required,
        values: valueRows
          .filter((v) => v.optionGroupId === group.id)
          .map((v) => ({
            code: v.code,
            label: localize(v.labelI18n, locale),
            surchargeMinor: v.surchargeMinor,
          })),
      };
    })
    .filter((g): g is NonNullable<typeof g> => g !== undefined);

  // Allowed upgrades.
  const au = byPosition(
    await db
      .select()
      .from(modelAllowedUpgrade)
      .where(eq(modelAllowedUpgrade.baseModelId, model.id)),
  );
  const upgradeIds = au.map((r) => r.upgradeId);
  const upgradeRows = upgradeIds.length
    ? await db.select().from(upgrade).where(inArray(upgrade.id, upgradeIds))
    : [];
  const upgradeById = new Map(upgradeRows.map((u) => [u.id, u]));
  const upgrades = upgradeIds
    .map((id) => upgradeById.get(id))
    .filter((u): u is NonNullable<typeof u> => u !== undefined)
    .map((u) => ({
      code: u.code,
      name: localize(u.nameI18n, locale),
      priceMinor: u.priceMinor,
      placement: u.placement,
    }));

  return {
    id: model.id,
    handle: model.handle,
    name: localize(model.nameI18n, locale),
    description: localize(model.descriptionI18n, locale),
    basePriceMinor: model.basePriceMinor,
    leadTimeMinDays: model.leadTimeMinDays,
    leadTimeMaxDays: model.leadTimeMaxDays,
    status: model.status as "view_only" | "orderable",
    garmentType: gt?.key ?? "shirt",
    fabrics,
    optionGroups,
    upgrades,
  };
}

export interface PublishedCollection {
  handle: string;
  name: string;
  description: string;
  modelHandles: string[];
}

export async function listPublishedCollections(
  db: Database,
  locale: Locale,
): Promise<PublishedCollection[]> {
  const collections = await db.select().from(collection);
  const result: PublishedCollection[] = [];
  for (const col of collections) {
    const members = byPosition(
      await db.select().from(collectionMember).where(eq(collectionMember.collectionId, col.id)),
    );
    const modelIds = members.map((m) => m.baseModelId);
    const models = modelIds.length
      ? await db.select().from(baseModel).where(inArray(baseModel.id, modelIds))
      : [];
    const handleById = new Map(
      models.filter((m) => m.status !== "draft").map((m) => [m.id, m.handle]),
    );
    result.push({
      handle: col.handle,
      name: localize(col.nameI18n, locale),
      description: localize(col.descriptionI18n, locale),
      modelHandles: modelIds
        .map((id) => handleById.get(id))
        .filter((h): h is string => h !== undefined),
    });
  }
  return result;
}

export interface PublishedCollectionDetail {
  handle: string;
  name: string;
  description: string;
  bannerMediaId: string | null;
  models: PublishedModelSummary[];
}

/** A single published collection by handle, with its ordered (non-draft) members. Null if unknown. */
export async function getPublishedCollection(
  db: Database,
  handle: string,
  locale: Locale,
): Promise<PublishedCollectionDetail | null> {
  const [col] = await db.select().from(collection).where(eq(collection.handle, handle));
  if (!col) return null;
  const members = byPosition(
    await db.select().from(collectionMember).where(eq(collectionMember.collectionId, col.id)),
  );
  const ids = members.map((m) => m.baseModelId);
  const rows = ids.length
    ? await db.select().from(baseModel).where(inArray(baseModel.id, ids))
    : [];
  const byId = new Map(rows.filter((m) => m.status !== "draft").map((m) => [m.id, m]));
  const models = ids
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
  return {
    handle: col.handle,
    name: localize(col.nameI18n, locale),
    description: localize(col.descriptionI18n, locale),
    bannerMediaId: col.bannerMediaId ?? null,
    models,
  };
}

export interface AttributeFacet {
  key: string;
  label: string;
  values: Array<{ value: string; count: number }>;
}

/** Model-facing attribute facets with per-value model counts, for discovery filters (FR-330). */
export async function listAttributeFacets(db: Database, locale: Locale): Promise<AttributeFacet[]> {
  const defs = await db
    .select()
    .from(attributeDefinition)
    .where(eq(attributeDefinition.appliesTo, "model"));
  const vals = await db.select().from(attributeValue).where(eq(attributeValue.entityType, "model"));
  return defs.map((d) => {
    const counts = new Map<string, number>();
    for (const v of vals) {
      if (v.attributeDefinitionId === d.id) counts.set(v.value, (counts.get(v.value) ?? 0) + 1);
    }
    return {
      key: d.key,
      label: localize(d.labelI18n, locale),
      values: [...counts.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => a.value.localeCompare(b.value)),
    };
  });
}

export interface DiscoveryFilter {
  /** Selected attribute values per definition key (OR within a key, AND across keys). */
  attributes?: Record<string, string[]>;
  sort?: "price_asc" | "price_desc" | "name";
  orderableOnly?: boolean;
}

/** Published models filtered + sorted by customer-centric attributes (FR-330/331). */
export async function listPublishedModelsFiltered(
  db: Database,
  locale: Locale,
  filter: DiscoveryFilter = {},
): Promise<PublishedModelSummary[]> {
  let result = await listPublishedModels(db, locale);
  if (filter.orderableOnly) result = result.filter((m) => m.status === "orderable");

  const attrs = filter.attributes ?? {};
  const activeKeys = Object.keys(attrs).filter((k) => (attrs[k] ?? []).length > 0);
  if (activeKeys.length > 0) {
    const defs = await db.select().from(attributeDefinition);
    const keyById = new Map(defs.map((d) => [d.id, d.key]));
    const vals = await db
      .select()
      .from(attributeValue)
      .where(eq(attributeValue.entityType, "model"));
    const modelAttrs = new Map<string, Map<string, Set<string>>>();
    for (const v of vals) {
      const key = keyById.get(v.attributeDefinitionId);
      if (!key) continue;
      const m = modelAttrs.get(v.entityId) ?? new Map<string, Set<string>>();
      const set = m.get(key) ?? new Set<string>();
      set.add(v.value);
      m.set(key, set);
      modelAttrs.set(v.entityId, m);
    }
    result = result.filter((model) => {
      const ma = modelAttrs.get(model.id);
      return activeKeys.every((key) => {
        const have = ma?.get(key);
        return have ? (attrs[key] ?? []).some((w) => have.has(w)) : false;
      });
    });
  }

  if (filter.sort === "price_asc") result.sort((a, b) => a.basePriceMinor - b.basePriceMinor);
  else if (filter.sort === "price_desc") result.sort((a, b) => b.basePriceMinor - a.basePriceMinor);
  else if (filter.sort === "name") result.sort((a, b) => a.name.localeCompare(b.name));
  return result;
}

function stringifyComposition(value: unknown): string | undefined {
  if (typeof value === "string") return value || undefined;
  if (value && typeof value === "object") {
    const parts = Object.entries(value as Record<string, unknown>).map(([k, v]) =>
      typeof v === "number" ? `${v}% ${k}` : `${k}`,
    );
    return parts.length ? parts.join(", ") : undefined;
  }
  return undefined;
}

function stringifyCare(value: unknown): string | undefined {
  if (typeof value === "string") return value || undefined;
  if (Array.isArray(value)) return value.length ? value.join(", ") : undefined;
  if (value && typeof value === "object") {
    const vals = Object.values(value as Record<string, unknown>).map(String);
    return vals.length ? vals.join(", ") : undefined;
  }
  return undefined;
}

/** The language-neutral sewn-in label (composition + care) for a fabric code (FR-1391). */
export async function getFabricSewnInLabel(db: Database, fabricCode: string): Promise<SewnInLabel> {
  const [f] = await db.select().from(fabric).where(eq(fabric.code, fabricCode));
  if (!f) return {};
  return { composition: stringifyComposition(f.fibreComposition), care: stringifyCare(f.careData) };
}

/** The primary media id for an entity (primary flag first, else lowest position), or null. */
export async function getPrimaryMediaId(
  db: Database,
  entityType: string,
  entityId: string,
): Promise<string | null> {
  const rows = await db
    .select({ id: media.id, isPrimary: media.isPrimary, position: media.position })
    .from(media)
    .where(and(eq(media.entityType, entityType), eq(media.entityId, entityId)));
  if (rows.length === 0) return null;
  rows.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.position - b.position);
  return rows[0]!.id;
}

/** Primary media ids for many entities of one type, as a Map (one query). */
export async function primaryMediaForEntities(
  db: Database,
  entityType: string,
  entityIds: string[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (entityIds.length === 0) return out;
  const rows = await db
    .select({
      id: media.id,
      entityId: media.entityId,
      isPrimary: media.isPrimary,
      position: media.position,
    })
    .from(media)
    .where(and(eq(media.entityType, entityType), inArray(media.entityId, entityIds)));
  const byEntity = new Map<string, typeof rows>();
  for (const r of rows) {
    const list = byEntity.get(r.entityId) ?? [];
    list.push(r);
    byEntity.set(r.entityId, list);
  }
  for (const [entityId, list] of byEntity) {
    list.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.position - b.position);
    out.set(entityId, list[0]!.id);
  }
  return out;
}
