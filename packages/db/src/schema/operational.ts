// Operational schema (REQUIREMENTS.md E6 to E10; PLAN.md section 6.2). Created at
// runtime in each environment database, never copied between environments. Body
// measurements are stored encrypted at rest (the *_enc columns hold ciphertext;
// encryption happens in the app layer). The order snapshot is immutable: written
// once and never updated. Status strings are validated by the core status
// machine (@cutura/core), not by a DB enum, so the single source of truth stays
// in one place.

import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

import { timestamps } from "./columns";

export const customer = sqliteTable("customer", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  locale: text("locale").notNull().default("de"),
  marketingConsent: integer("marketing_consent", { mode: "boolean" }).notNull().default(false),
  deletionState: text("deletion_state", { enum: ["active", "deletion_requested", "deleted"] })
    .notNull()
    .default("active"),
  // Internal back-office notes + tags (FR-1080); never customer-visible.
  notes: text("notes"),
  tags: text("tags", { mode: "json" }).$type<string[]>(),
  ...timestamps(),
});

// Server session reference (also held in KV); the signed cookie carries the id.
export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const address = sqliteTable("address", {
  id: text("id").primaryKey(),
  customerId: text("customer_id").notNull(),
  line1: text("line1").notNull(),
  line2: text("line2"),
  city: text("city").notNull(),
  zip: text("zip").notNull(),
  country: text("country", { enum: ["CH", "LI"] }).notNull(),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  ...timestamps(),
});

// One profile per customer (transient for guests; only persisted on registration).
export const measurementProfile = sqliteTable("measurement_profile", {
  id: text("id").primaryKey(),
  customerId: text("customer_id"),
  name: text("name"),
  currentVersion: integer("current_version").notNull().default(1),
  // Soft-archive (FR-630): hide from the active profile list without losing versions.
  archivedAt: text("archived_at"),
  ...timestamps(),
});

// Every change creates a new version; prior versions retained. The three layers
// are stored separately; confirmed (and original/derived) body values are
// encrypted at rest.
export const measurementVersion = sqliteTable(
  "measurement_version",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id").notNull(),
    version: integer("version").notNull(),
    previousVersion: integer("previous_version"),
    garmentType: text("garment_type").notNull(),
    method: text("method", { enum: ["detailed", "wizard"] }).notNull(),
    originalInputsEnc: text("original_inputs_enc"),
    derivedValuesEnc: text("derived_values_enc"),
    confirmedValuesEnc: text("confirmed_values_enc").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [uniqueIndex("measurement_version_unique").on(t.profileId, t.version)],
);

export const order = sqliteTable("order", {
  id: text("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerId: text("customer_id"),
  guestEmail: text("guest_email"),
  guestTrackingToken: text("guest_tracking_token").unique(),
  locale: text("locale").notNull().default("de"),
  currency: text("currency").notNull().default("CHF"),
  totalMinor: integer("total_minor").notNull(),
  acceptedTermsVersion: text("accepted_terms_version").notNull(),
  acceptedPrivacyVersion: text("accepted_privacy_version").notNull(),
  // Rolled-up status; validated by the core status machine.
  status: text("status").notNull().default("new"),
  shopifyOrderId: text("shopify_order_id").unique(),
  // The Shopify draft order id + its hosted-checkout invoice URL, for resume and
  // link-expiry handling (FR-7I0).
  shopifyDraftId: text("shopify_draft_id"),
  invoiceUrl: text("invoice_url"),
  // Internal back-office notes + tags (FR-1080); never customer-visible.
  notes: text("notes"),
  tags: text("tags", { mode: "json" }).$type<string[]>(),
  ...timestamps(),
});

export const orderItem = sqliteTable("order_item", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull(),
  baseModelId: text("base_model_id").notNull(),
  status: text("status").notNull().default("new"),
  // Encrypted, frozen snapshot inputs captured at checkout (config + upgrades +
  // confirmed measurements + per-piece override + price breakdown). The paid
  // webhook builds the immutable production snapshot from this, independent of the
  // transient guest measurement blob in KV (FR-810/811).
  configEnc: text("config_enc"),
  ...timestamps(),
});

// The immutable production snapshot for one garment. Written once on paid; never
// updated. snapshotEnc holds the encrypted, frozen configuration plus confirmed
// measurements (the effective values including any per-piece override).
export const productionPackage = sqliteTable("production_package", {
  id: text("id").primaryKey(),
  orderItemId: text("order_item_id").notNull().unique(),
  garmentType: text("garment_type").notNull(),
  supplierId: text("supplier_id"),
  snapshotEnc: text("snapshot_enc").notNull(),
  internalNotes: text("internal_notes"),
  createdAt: text("created_at").notNull(),
});

// Append-only history of status transitions. Drives the audit trail and board.
export const statusEvent = sqliteTable("status_event", {
  id: text("id").primaryKey(),
  orderId: text("order_id"),
  orderItemId: text("order_item_id"),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  reason: text("reason"),
  actor: text("actor").notNull(),
  createdAt: text("created_at").notNull(),
});

// A recorded QC fail can never be silently dropped or flipped to pass without an
// audited override (override_reason + override_by), enforced by the core status
// machine and the operational layer.
export const qcRecord = sqliteTable("qc_record", {
  id: text("id").primaryKey(),
  productionPackageId: text("production_package_id").notNull().unique(),
  checklist: text("checklist", { mode: "json" }).$type<unknown>().notNull(),
  overallResult: text("overall_result", {
    enum: ["pass", "fail", "pass_with_notes"],
  }).notNull(),
  notes: text("notes"),
  photoR2Keys: text("photo_r2_keys", { mode: "json" }).$type<string[]>(),
  reviewedBy: text("reviewed_by"),
  reviewedAt: text("reviewed_at"),
  overrideReason: text("override_reason"),
  overrideBy: text("override_by"),
  ...timestamps(),
});

export const fitReview = sqliteTable("fit_review", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull(),
  orderItemId: text("order_item_id"),
  reason: text("reason").notNull(),
  photoR2Keys: text("photo_r2_keys", { mode: "json" }).$type<string[]>(),
  status: text("status").notNull().default("open"),
  decision: text("decision", { enum: ["remake", "refund", "alteration"] }),
  remakeOrderId: text("remake_order_id"),
  ...timestamps(),
});

export const fitFeedback = sqliteTable("fit_feedback", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull(),
  overallRating: integer("overall_rating"),
  fitByRegion: text("fit_by_region", { mode: "json" }).$type<unknown>(),
  notes: text("notes"),
  wantsRemake: integer("wants_remake", { mode: "boolean" }).notNull().default(false),
  ...timestamps(),
});

export const supplier = sqliteTable("supplier", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  contact: text("contact", { mode: "json" }).$type<unknown>(),
  capabilities: text("capabilities", { mode: "json" }).$type<unknown>(),
  notes: text("notes"),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  ...timestamps(),
});

export const shippingZone = sqliteTable("shipping_zone", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  countries: text("countries", { mode: "json" }).$type<string[]>().notNull(),
  ...timestamps(),
});

export const shippingMethod = sqliteTable("shipping_method", {
  id: text("id").primaryKey(),
  zoneId: text("zone_id").notNull(),
  code: text("code").notNull(),
  priceMinor: integer("price_minor").notNull().default(0),
  kind: text("kind", { enum: ["standard", "express"] })
    .notNull()
    .default("standard"),
  includedInPrice: integer("included_in_price", { mode: "boolean" }).notNull().default(true),
  ...timestamps(),
});

// Idempotency record for Shopify webhooks: a paid event is processed exactly once.
export const paymentEvent = sqliteTable("payment_event", {
  eventId: text("event_id").primaryKey(),
  orderId: text("order_id"),
  type: text("type").notNull(),
  payload: text("payload", { mode: "json" }).$type<unknown>(),
  processedAt: text("processed_at").notNull(),
});

export const communicationLog = sqliteTable("communication_log", {
  id: text("id").primaryKey(),
  orderId: text("order_id"),
  channel: text("channel").notNull().default("email"),
  template: text("template").notNull(),
  toAddress: text("to_address").notNull(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
});

export const notifyRequest = sqliteTable("notify_request", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  locale: text("locale").notNull().default("de"),
  notifiedAt: text("notified_at"),
  createdAt: text("created_at").notNull(),
});

export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  detail: text("detail", { mode: "json" }).$type<unknown>(),
  createdAt: text("created_at").notNull(),
});

export const orderCost = sqliteTable("order_cost", {
  id: text("id").primaryKey(),
  orderId: text("order_id").notNull().unique(),
  fabricMinor: integer("fabric_minor"),
  productionMinor: integer("production_minor"),
  inboundMinor: integer("inbound_minor"),
  feesMinor: integer("fees_minor"),
  ...timestamps(),
});
