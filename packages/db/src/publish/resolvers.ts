import type { BatchItem } from "drizzle-orm/batch";
import { type SQL, and, eq, inArray } from "drizzle-orm";

import type { Database } from "../getDb";
import {
  attributeDefinition,
  attributeValue,
  baseModel,
  collection,
  collectionMember,
  contentPage,
  fabric,
  garmentType,
  measurementSchema,
  media,
  modelAllowedFabric,
  modelAllowedOption,
  modelAllowedUpgrade,
  optionGroup,
  optionValue,
  qcTemplate,
  supplierSpecTemplate,
  upgrade,
} from "../schema";
import { copyById, replaceChildren } from "./upsert";

export class EntityNotFoundError extends Error {
  constructor(entityType: string, id: string) {
    super(`Cannot publish ${entityType} "${id}": not found in the control database.`);
    this.name = "EntityNotFoundError";
  }
}

/** A resolver reads an entity's closure from control and returns target statements. */
export type Resolver = (
  control: Database,
  target: Database,
  id: string,
) => Promise<BatchItem<"sqlite">[]>;

const mediaScope = (entityType: string, entityId: string): SQL =>
  and(eq(media.entityType, entityType), eq(media.entityId, entityId)) as SQL;
const attrScope = (entityType: string, entityId: string): SQL =>
  and(eq(attributeValue.entityType, entityType), eq(attributeValue.entityId, entityId)) as SQL;

export const resolveFabric: Resolver = async (control, target, id) => {
  const [row] = await control.select().from(fabric).where(eq(fabric.id, id));
  if (!row) throw new EntityNotFoundError("fabric", id);
  const mediaRows = await control.select().from(media).where(mediaScope("fabric", id));
  const attrRows = await control.select().from(attributeValue).where(attrScope("fabric", id));
  const defIds = [...new Set(attrRows.map((a) => a.attributeDefinitionId))];
  const defs = defIds.length
    ? await control
        .select()
        .from(attributeDefinition)
        .where(inArray(attributeDefinition.id, defIds))
    : [];

  return [
    ...copyById(target, attributeDefinition, defs),
    ...copyById(target, fabric, [row]),
    ...replaceChildren(target, media, mediaScope("fabric", id), mediaRows),
    ...replaceChildren(target, attributeValue, attrScope("fabric", id), attrRows),
  ];
};

export const resolveGarmentType: Resolver = async (control, target, id) => {
  const [gt] = await control.select().from(garmentType).where(eq(garmentType.id, id));
  if (!gt) throw new EntityNotFoundError("garmentType", id);
  const ms = gt.measurementSchemaId
    ? await control
        .select()
        .from(measurementSchema)
        .where(eq(measurementSchema.id, gt.measurementSchemaId))
    : [];
  const sst = gt.supplierSpecTemplateId
    ? await control
        .select()
        .from(supplierSpecTemplate)
        .where(eq(supplierSpecTemplate.id, gt.supplierSpecTemplateId))
    : [];
  const qct = gt.qcTemplateId
    ? await control.select().from(qcTemplate).where(eq(qcTemplate.id, gt.qcTemplateId))
    : [];

  return [
    ...copyById(target, measurementSchema, ms),
    ...copyById(target, supplierSpecTemplate, sst),
    ...copyById(target, qcTemplate, qct),
    ...copyById(target, garmentType, [gt]),
  ];
};

export const resolveOptionGroup: Resolver = async (control, target, id) => {
  const [group] = await control.select().from(optionGroup).where(eq(optionGroup.id, id));
  if (!group) throw new EntityNotFoundError("optionGroup", id);
  const values = await control.select().from(optionValue).where(eq(optionValue.optionGroupId, id));
  return [
    ...copyById(target, optionGroup, [group]),
    ...replaceChildren(target, optionValue, eq(optionValue.optionGroupId, id), values),
  ];
};

export const resolveUpgrade: Resolver = async (control, target, id) => {
  const [row] = await control.select().from(upgrade).where(eq(upgrade.id, id));
  if (!row) throw new EntityNotFoundError("upgrade", id);
  const mediaRows = await control.select().from(media).where(mediaScope("upgrade", id));
  return [
    ...copyById(target, upgrade, [row]),
    ...replaceChildren(target, media, mediaScope("upgrade", id), mediaRows),
  ];
};

export const resolveAttributeDefinition: Resolver = async (control, target, id) => {
  const [row] = await control
    .select()
    .from(attributeDefinition)
    .where(eq(attributeDefinition.id, id));
  if (!row) throw new EntityNotFoundError("attributeDefinition", id);
  return copyById(target, attributeDefinition, [row]);
};

export const resolveCollection: Resolver = async (control, target, id) => {
  const [row] = await control.select().from(collection).where(eq(collection.id, id));
  if (!row) throw new EntityNotFoundError("collection", id);
  const members = await control
    .select()
    .from(collectionMember)
    .where(eq(collectionMember.collectionId, id));
  const mediaRows = await control.select().from(media).where(mediaScope("collection", id));
  return [
    ...copyById(target, collection, [row]),
    ...replaceChildren(target, media, mediaScope("collection", id), mediaRows),
    ...replaceChildren(target, collectionMember, eq(collectionMember.collectionId, id), members),
  ];
};

export const resolveContentPage: Resolver = async (control, target, id) => {
  const [row] = await control.select().from(contentPage).where(eq(contentPage.id, id));
  if (!row) throw new EntityNotFoundError("contentPage", id);
  return copyById(target, contentPage, [row]);
};

export const resolveBaseModel: Resolver = async (control, target, id) => {
  const [model] = await control.select().from(baseModel).where(eq(baseModel.id, id));
  if (!model) throw new EntityNotFoundError("baseModel", id);

  const allowedFabrics = await control
    .select()
    .from(modelAllowedFabric)
    .where(eq(modelAllowedFabric.baseModelId, id));
  const allowedOptions = await control
    .select()
    .from(modelAllowedOption)
    .where(eq(modelAllowedOption.baseModelId, id));
  const allowedUpgrades = await control
    .select()
    .from(modelAllowedUpgrade)
    .where(eq(modelAllowedUpgrade.baseModelId, id));

  const modelMedia = await control.select().from(media).where(mediaScope("model", id));
  const modelAttrs = await control.select().from(attributeValue).where(attrScope("model", id));
  const defIds = [...new Set(modelAttrs.map((a) => a.attributeDefinitionId))];
  const defs = defIds.length
    ? await control
        .select()
        .from(attributeDefinition)
        .where(inArray(attributeDefinition.id, defIds))
    : [];

  const stmts: BatchItem<"sqlite">[] = [];
  // Referenced rows first: garment type + templates, then the allowed leaves.
  stmts.push(...(await resolveGarmentType(control, target, model.garmentTypeId)));
  for (const r of allowedFabrics) stmts.push(...(await resolveFabric(control, target, r.fabricId)));
  for (const r of allowedOptions)
    stmts.push(...(await resolveOptionGroup(control, target, r.optionGroupId)));
  for (const r of allowedUpgrades)
    stmts.push(...(await resolveUpgrade(control, target, r.upgradeId)));
  // The model itself, its media/attributes, then the allow-list join rows.
  stmts.push(...copyById(target, attributeDefinition, defs));
  stmts.push(...copyById(target, baseModel, [model]));
  stmts.push(...replaceChildren(target, media, mediaScope("model", id), modelMedia));
  stmts.push(...replaceChildren(target, attributeValue, attrScope("model", id), modelAttrs));
  stmts.push(
    ...replaceChildren(
      target,
      modelAllowedFabric,
      eq(modelAllowedFabric.baseModelId, id),
      allowedFabrics,
    ),
  );
  stmts.push(
    ...replaceChildren(
      target,
      modelAllowedOption,
      eq(modelAllowedOption.baseModelId, id),
      allowedOptions,
    ),
  );
  stmts.push(
    ...replaceChildren(
      target,
      modelAllowedUpgrade,
      eq(modelAllowedUpgrade.baseModelId, id),
      allowedUpgrades,
    ),
  );
  return stmts;
};
