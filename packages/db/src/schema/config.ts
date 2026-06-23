// Per-environment configuration and feature flags (PLAN.md section 6.2, 5.4).
// Holds the capacity cap, pause/vacation state and message, and the feature
// flags (auto-forward, alteration reimbursement, photo method, express
// shipping) that flip without a code change.

import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const config = sqliteTable("config", {
  key: text("key").primaryKey(),
  value: text("value", { mode: "json" }).$type<unknown>(),
  updatedAt: text("updated_at").notNull(),
});

export const featureFlag = sqliteTable("feature_flag", {
  key: text("key").primaryKey(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  value: text("value", { mode: "json" }).$type<unknown>(),
  updatedAt: text("updated_at").notNull(),
});
