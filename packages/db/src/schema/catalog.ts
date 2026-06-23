// Owned catalog schema (REQUIREMENTS.md E1, E2; PLAN.md section 6.1). Authored in
// the control database; published copies live in environment databases. Garment
// types, models, fabrics, options, upgrades, collections, attributes, media, and
// per-model allow-lists are all data here - there is no Shopify catalog.
// Compatibility is expressed only as per-model allow-lists; there are no deny rules.

import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import type { LocalizedText } from "./columns";
import { timestamps } from "./columns";

// Garment types are data: each references a measurement schema, a supplier-spec
// template, and a QC template by id (FR-101 to FR-104).
export const garmentType = sqliteTable("garment_type", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(), // "shirt", "trouser"
  nameI18n: text("name_i18n", { mode: "json" }).$type<LocalizedText>().notNull(),
  measurementSchemaId: text("measurement_schema_id"),
  supplierSpecTemplateId: text("supplier_spec_template_id"),
  qcTemplateId: text("qc_template_id"),
  ...timestamps(),
});

// Per garment type: measurement fields, units, plausible ranges (JSON), versioned.
export const measurementSchema = sqliteTable("measurement_schema", {
  id: text("id").primaryKey(),
  garmentTypeId: text("garment_type_id").notNull(),
  version: integer("version").notNull().default(1),
  fields: text("fields", { mode: "json" }).$type<unknown>().notNull(),
  ...timestamps(),
});

export const supplierSpecTemplate = sqliteTable("supplier_spec_template", {
  id: text("id").primaryKey(),
  garmentTypeId: text("garment_type_id").notNull(),
  structure: text("structure", { mode: "json" }).$type<unknown>().notNull(),
  ...timestamps(),
});

export const qcTemplate = sqliteTable("qc_template", {
  id: text("id").primaryKey(),
  garmentTypeId: text("garment_type_id").notNull(),
  items: text("items", { mode: "json" }).$type<unknown>().notNull(),
  ...timestamps(),
});

// Standalone reusable fabric (FR-120 to FR-123).
export const fabric = sqliteTable("fabric", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  nameI18n: text("name_i18n", { mode: "json" }).$type<LocalizedText>().notNull(),
  descriptionI18n: text("description_i18n", { mode: "json" }).$type<LocalizedText>(),
  material: text("material"),
  fibreComposition: text("fibre_composition", { mode: "json" }).$type<unknown>(),
  careData: text("care_data", { mode: "json" }).$type<unknown>(),
  colorFamily: text("color_family"),
  weightGsm: integer("weight_gsm"),
  surchargeMinor: integer("surcharge_minor").notNull().default(0),
  available: integer("available", { mode: "boolean" }).notNull().default(true),
  supplierId: text("supplier_id"),
  attributes: text("attributes", { mode: "json" }).$type<unknown>(),
  ...timestamps(),
});

// Sellable model under a garment type (FR-110 to FR-112).
export const baseModel = sqliteTable("base_model", {
  id: text("id").primaryKey(),
  garmentTypeId: text("garment_type_id").notNull(),
  handle: text("handle").notNull().unique(),
  nameI18n: text("name_i18n", { mode: "json" }).$type<LocalizedText>().notNull(),
  descriptionI18n: text("description_i18n", { mode: "json" }).$type<LocalizedText>(),
  basePriceMinor: integer("base_price_minor").notNull(),
  leadTimeMinDays: integer("lead_time_min_days").notNull(),
  leadTimeMaxDays: integer("lead_time_max_days").notNull(),
  // Orderability, independent of publish state (FR-1B1, FR-1B2).
  status: text("status", { enum: ["draft", "view_only", "orderable"] })
    .notNull()
    .default("draft"),
  attributes: text("attributes", { mode: "json" }).$type<unknown>(),
  ...timestamps(),
});

// Option groups and values, scoped per garment type, selected per model (FR-130 to FR-132).
export const optionGroup = sqliteTable("option_group", {
  id: text("id").primaryKey(),
  garmentTypeId: text("garment_type_id").notNull(),
  code: text("code").notNull(),
  labelI18n: text("label_i18n", { mode: "json" }).$type<LocalizedText>().notNull(),
  ...timestamps(),
});

export const optionValue = sqliteTable("option_value", {
  id: text("id").primaryKey(),
  optionGroupId: text("option_group_id").notNull(),
  code: text("code").notNull(),
  labelI18n: text("label_i18n", { mode: "json" }).$type<LocalizedText>().notNull(),
  descriptionI18n: text("description_i18n", { mode: "json" }).$type<LocalizedText>(),
  surchargeMinor: integer("surcharge_minor").notNull().default(0),
  ...timestamps(),
});

// Add-on upgrade (FR-140 to FR-143): priced extra with optional placement.
export const upgrade = sqliteTable("upgrade", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  nameI18n: text("name_i18n", { mode: "json" }).$type<LocalizedText>().notNull(),
  descriptionI18n: text("description_i18n", { mode: "json" }).$type<LocalizedText>(),
  priceMinor: integer("price_minor").notNull(),
  placement: text("placement"),
  ...timestamps(),
});

export const collection = sqliteTable("collection", {
  id: text("id").primaryKey(),
  handle: text("handle").notNull().unique(),
  nameI18n: text("name_i18n", { mode: "json" }).$type<LocalizedText>().notNull(),
  descriptionI18n: text("description_i18n", { mode: "json" }).$type<LocalizedText>(),
  bannerMediaId: text("banner_media_id"),
  ...timestamps(),
});

export const collectionMember = sqliteTable(
  "collection_member",
  {
    id: text("id").primaryKey(),
    collectionId: text("collection_id").notNull(),
    baseModelId: text("base_model_id").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [uniqueIndex("collection_member_unique").on(t.collectionId, t.baseModelId)],
);

// Per-model allow-lists. No deny rules anywhere (FR-231, FR-420).
export const modelAllowedFabric = sqliteTable(
  "model_allowed_fabric",
  {
    id: text("id").primaryKey(),
    baseModelId: text("base_model_id").notNull(),
    fabricId: text("fabric_id").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [uniqueIndex("model_allowed_fabric_unique").on(t.baseModelId, t.fabricId)],
);

export const modelAllowedOption = sqliteTable(
  "model_allowed_option",
  {
    id: text("id").primaryKey(),
    baseModelId: text("base_model_id").notNull(),
    optionGroupId: text("option_group_id").notNull(),
    required: integer("required", { mode: "boolean" }).notNull().default(false),
    position: integer("position").notNull().default(0),
  },
  (t) => [uniqueIndex("model_allowed_option_unique").on(t.baseModelId, t.optionGroupId)],
);

export const modelAllowedUpgrade = sqliteTable(
  "model_allowed_upgrade",
  {
    id: text("id").primaryKey(),
    baseModelId: text("base_model_id").notNull(),
    upgradeId: text("upgrade_id").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [uniqueIndex("model_allowed_upgrade_unique").on(t.baseModelId, t.upgradeId)],
);

// Structured, filterable attributes for discovery (FR-1A0, FR-1A1, FR-2C0).
export const attributeDefinition = sqliteTable("attribute_definition", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(), // colour_family, occasion, fit, fabric_weight
  labelI18n: text("label_i18n", { mode: "json" }).$type<LocalizedText>().notNull(),
  appliesTo: text("applies_to", { enum: ["model", "fabric"] }).notNull(),
  ...timestamps(),
});

export const attributeValue = sqliteTable(
  "attribute_value",
  {
    id: text("id").primaryKey(),
    attributeDefinitionId: text("attribute_definition_id").notNull(),
    entityType: text("entity_type").notNull(), // "model" | "fabric"
    entityId: text("entity_id").notNull(),
    value: text("value").notNull(),
  },
  (t) => [
    uniqueIndex("attribute_value_unique").on(t.attributeDefinitionId, t.entityType, t.entityId),
  ],
);

// Media in R2, referenced by entities (FR-170 to FR-172).
export const media = sqliteTable("media", {
  id: text("id").primaryKey(),
  r2Key: text("r2_key").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  alt: text("alt"),
  kind: text("kind"),
  position: integer("position").notNull().default(0),
  isPrimary: integer("is_primary", { mode: "boolean" }).notNull().default(false),
  ...timestamps(),
});

// Editable content and legal pages, versioned (FR-370, FR-371, FR-1362).
export const contentPage = sqliteTable("content_page", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  kind: text("kind", { enum: ["content", "legal"] }).notNull(),
  titleI18n: text("title_i18n", { mode: "json" }).$type<LocalizedText>().notNull(),
  bodyI18n: text("body_i18n", { mode: "json" }).$type<LocalizedText>().notNull(),
  version: integer("version").notNull().default(1),
  ...timestamps(),
});

// Publication: per entity, the publish targets, with audit (FR-190 to FR-192).
// An item published only to staging cannot reach production because production
// is a separate database; this table records what was published where.
export const publication = sqliteTable(
  "publication",
  {
    id: text("id").primaryKey(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    environment: text("environment", { enum: ["staging", "production"] }).notNull(),
    publishedAt: text("published_at").notNull(),
    publishedBy: text("published_by").notNull(),
  },
  (t) => [uniqueIndex("publication_unique").on(t.entityType, t.entityId, t.environment)],
);
