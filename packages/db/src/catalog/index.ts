// Catalog data-layer helpers: generic CRUD on a Database plus the allow-list,
// toggle, and localized-content utilities the admin handlers use to author the
// catalog in the control database. Authoring writes go here; the cross-database
// publish routine lives in ../publish. All functions take a Database so they are
// exercised on the Workers pool against real D1.

import type { BatchItem } from "drizzle-orm/batch";
import { and, eq } from "drizzle-orm";

import type { Database } from "../getDb";
import { type IdTable } from "../publish/upsert";

export * from "./read";
import {
  LOCALES,
  type Locale,
  baseModel,
  collection,
  collectionMember,
  fabric,
  media,
  modelAllowedFabric,
  modelAllowedOption,
  modelAllowedUpgrade,
  optionGroup,
  optionValue,
} from "../schema";

type Row<T extends IdTable> = T["$inferInsert"] & { id: string };

/** List all rows of a catalog table. */
export function listRows<T extends IdTable>(db: Database, table: T): Promise<T["$inferSelect"][]> {
  return db.select().from(table) as Promise<T["$inferSelect"][]>;
}

/** Get a single row by id, or undefined. */
export async function getRow<T extends IdTable>(
  db: Database,
  table: T,
  id: string,
): Promise<T["$inferSelect"] | undefined> {
  const rows = (await db.select().from(table).where(eq(table.id, id))) as T["$inferSelect"][];
  return rows[0];
}

/** Create or replace a full row by id (authoring save from a form). */
export async function saveRow<T extends IdTable>(
  db: Database,
  table: T,
  row: Row<T>,
): Promise<void> {
  await db.delete(table).where(eq(table.id, row.id));
  await db.insert(table).values(row);
}

/** Delete a catalog row from the control database (retiring is a separate flag). */
export async function deleteRow<T extends IdTable>(
  db: Database,
  table: T,
  id: string,
): Promise<void> {
  await db.delete(table).where(eq(table.id, id));
}

function replaceAllowList<T extends IdTable>(
  db: Database,
  table: T,
  scope: ReturnType<typeof eq>,
  rows: Array<Row<T>>,
): Promise<unknown> {
  const stmts: BatchItem<"sqlite">[] = [db.delete(table).where(scope)];
  for (const row of rows) stmts.push(db.insert(table).values(row));
  return db.batch(stmts as [BatchItem<"sqlite">, ...BatchItem<"sqlite">[]]);
}

/** Replace the model's allowed fabrics (no deny rules; order preserved). */
export function setModelAllowedFabrics(
  db: Database,
  baseModelId: string,
  fabricIds: string[],
): Promise<unknown> {
  const rows = fabricIds.map((fabricId, position) => ({
    id: `${baseModelId}:${fabricId}`,
    baseModelId,
    fabricId,
    position,
  }));
  return replaceAllowList(
    db,
    modelAllowedFabric,
    eq(modelAllowedFabric.baseModelId, baseModelId),
    rows,
  );
}

/** Replace the model's allowed option groups (required flag per group). */
export function setModelAllowedOptions(
  db: Database,
  baseModelId: string,
  options: Array<{ optionGroupId: string; required: boolean }>,
): Promise<unknown> {
  const rows = options.map((o, position) => ({
    id: `${baseModelId}:${o.optionGroupId}`,
    baseModelId,
    optionGroupId: o.optionGroupId,
    required: o.required,
    position,
  }));
  return replaceAllowList(
    db,
    modelAllowedOption,
    eq(modelAllowedOption.baseModelId, baseModelId),
    rows,
  );
}

/** Replace the model's allowed upgrades. */
export function setModelAllowedUpgrades(
  db: Database,
  baseModelId: string,
  upgradeIds: string[],
): Promise<unknown> {
  const rows = upgradeIds.map((upgradeId, position) => ({
    id: `${baseModelId}:${upgradeId}`,
    baseModelId,
    upgradeId,
    position,
  }));
  return replaceAllowList(
    db,
    modelAllowedUpgrade,
    eq(modelAllowedUpgrade.baseModelId, baseModelId),
    rows,
  );
}

/** Toggle whether a fabric is available for new configurations (FR-1B0, FR-250). */
export async function setFabricAvailability(
  db: Database,
  id: string,
  available: boolean,
): Promise<void> {
  await db
    .update(fabric)
    .set({ available, updatedAt: new Date().toISOString() })
    .where(eq(fabric.id, id));
}

/** Set a model orderable / view-only / draft (FR-1B1, FR-1B2, FR-250). */
export async function setBaseModelStatus(
  db: Database,
  id: string,
  status: "draft" | "view_only" | "orderable",
): Promise<void> {
  await db
    .update(baseModel)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(eq(baseModel.id, id));
}

/** List the option values of a group (admin detail view). */
export function listOptionValues(
  db: Database,
  optionGroupId: string,
): Promise<(typeof optionValue.$inferSelect)[]> {
  return db
    .select()
    .from(optionValue)
    .where(eq(optionValue.optionGroupId, optionGroupId)) as Promise<
    (typeof optionValue.$inferSelect)[]
  >;
}

/** Delete an option group and its values from the control database. */
export async function deleteOptionGroup(db: Database, id: string): Promise<void> {
  await db.delete(optionValue).where(eq(optionValue.optionGroupId, id));
  await db.delete(optionGroup).where(eq(optionGroup.id, id));
}

export interface ModelAllowLists {
  fabricIds: string[];
  options: Array<{ optionGroupId: string; required: boolean }>;
  upgradeIds: string[];
}

/** The current per-model allow-lists, ordered by position (for the edit form). */
export async function getModelAllowLists(
  db: Database,
  baseModelId: string,
): Promise<ModelAllowLists> {
  const byPos = <T extends { position: number }>(rows: T[]) =>
    [...rows].sort((a, b) => a.position - b.position);
  const f = await db
    .select()
    .from(modelAllowedFabric)
    .where(eq(modelAllowedFabric.baseModelId, baseModelId));
  const o = await db
    .select()
    .from(modelAllowedOption)
    .where(eq(modelAllowedOption.baseModelId, baseModelId));
  const u = await db
    .select()
    .from(modelAllowedUpgrade)
    .where(eq(modelAllowedUpgrade.baseModelId, baseModelId));
  return {
    fabricIds: byPos(f).map((r) => r.fabricId),
    options: byPos(o).map((r) => ({ optionGroupId: r.optionGroupId, required: r.required })),
    upgradeIds: byPos(u).map((r) => r.upgradeId),
  };
}

/** Delete a base model and its allow-list rows from the control database. */
export async function deleteBaseModel(db: Database, id: string): Promise<void> {
  await db.delete(modelAllowedFabric).where(eq(modelAllowedFabric.baseModelId, id));
  await db.delete(modelAllowedOption).where(eq(modelAllowedOption.baseModelId, id));
  await db.delete(modelAllowedUpgrade).where(eq(modelAllowedUpgrade.baseModelId, id));
  await db.delete(baseModel).where(eq(baseModel.id, id));
}

/** Replace a collection's ordered members (FR-2D0). */
export function setCollectionMembers(
  db: Database,
  collectionId: string,
  baseModelIds: string[],
): Promise<unknown> {
  const rows = baseModelIds.map((baseModelId, position) => ({
    id: `${collectionId}:${baseModelId}`,
    collectionId,
    baseModelId,
    position,
  }));
  return replaceAllowList(
    db,
    collectionMember,
    eq(collectionMember.collectionId, collectionId),
    rows,
  );
}

/** A collection's member base-model ids, in order. */
export async function listCollectionMemberIds(
  db: Database,
  collectionId: string,
): Promise<string[]> {
  const rows = await db
    .select()
    .from(collectionMember)
    .where(eq(collectionMember.collectionId, collectionId));
  return [...rows].sort((a, b) => a.position - b.position).map((r) => r.baseModelId);
}

/** Delete a collection and its member rows from the control database. */
export async function deleteCollection(db: Database, id: string): Promise<void> {
  await db.delete(collectionMember).where(eq(collectionMember.collectionId, id));
  await db.delete(collection).where(eq(collection.id, id));
}

/** Media rows attached to an entity, ordered by position (FR-170, FR-211). */
export async function listMedia(
  db: Database,
  entityType: string,
  entityId: string,
): Promise<(typeof media.$inferSelect)[]> {
  const rows = await db
    .select()
    .from(media)
    .where(and(eq(media.entityType, entityType), eq(media.entityId, entityId)));
  return [...rows].sort((a, b) => a.position - b.position);
}

/** Mark one media row primary and clear the others for the same entity (FR-211). */
export function setPrimaryMedia(
  db: Database,
  entityType: string,
  entityId: string,
  mediaId: string,
): Promise<unknown> {
  const now = new Date().toISOString();
  return db.batch([
    db
      .update(media)
      .set({ isPrimary: false, updatedAt: now })
      .where(and(eq(media.entityType, entityType), eq(media.entityId, entityId))),
    db.update(media).set({ isPrimary: true, updatedAt: now }).where(eq(media.id, mediaId)),
  ] as [BatchItem<"sqlite">, BatchItem<"sqlite">]);
}

/** Locales whose localized value is missing or blank (surfaces incomplete locales, FR-271). */
export function incompleteLocales(
  text: Partial<Record<Locale, string>> | null | undefined,
): Locale[] {
  return LOCALES.filter((locale) => {
    const value = text?.[locale];
    return value === undefined || value === null || value.trim() === "";
  });
}
