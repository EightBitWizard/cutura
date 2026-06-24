import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

// Locks the schema-drift failure class from the previous build: the migrations
// must apply cleanly and create the expected tables. D1 is SQLite, so applying
// the generated DDL into Node's built-in SQLite proves it is valid and complete.
const MIGRATIONS_DIR = fileURLToPath(new URL("../../../infra/migrations", import.meta.url));

function applyAllMigrations(): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    db.exec(readFileSync(`${MIGRATIONS_DIR}/${file}`, "utf8"));
  }
  return db;
}

function tableNames(db: DatabaseSync): Set<string> {
  const rows = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all();
  return new Set(rows.map((r) => (r as { name: string }).name));
}

function columnNames(db: DatabaseSync, table: string): Set<string> {
  const rows = db.prepare(`PRAGMA table_info("${table}")`).all();
  return new Set(rows.map((r) => (r as { name: string }).name));
}

describe("D1 migrations", () => {
  it("apply cleanly as valid SQLite", () => {
    expect(() => applyAllMigrations()).not.toThrow();
  });

  it("create the core catalog and operational tables", () => {
    const tables = tableNames(applyAllMigrations());
    const required = [
      "garment_type",
      "base_model",
      "fabric",
      "option_group",
      "option_value",
      "upgrade",
      "collection",
      "model_allowed_fabric",
      "publication",
      "customer",
      "measurement_profile",
      "measurement_version",
      "order",
      "order_item",
      "production_package",
      "status_event",
      "qc_record",
      "supplier",
      "payment_event",
      "config",
      "feature_flag",
    ];
    for (const table of required) {
      expect(tables.has(table), `missing table: ${table}`).toBe(true);
    }
  });

  it("apply the M3 checkout columns (order_item.config_enc, order draft/invoice)", () => {
    const db = applyAllMigrations();
    expect(columnNames(db, "order_item").has("config_enc")).toBe(true);
    const orderCols = columnNames(db, "order");
    expect(orderCols.has("shopify_draft_id")).toBe(true);
    expect(orderCols.has("invoice_url")).toBe(true);
  });

  it("apply the M4 profile archive column", () => {
    expect(columnNames(applyAllMigrations(), "measurement_profile").has("archived_at")).toBe(true);
  });

  it("apply the M5 notes/tags columns on order + customer", () => {
    const db = applyAllMigrations();
    for (const col of ["notes", "tags"]) {
      expect(columnNames(db, "order").has(col), `order.${col}`).toBe(true);
      expect(columnNames(db, "customer").has(col), `customer.${col}`).toBe(true);
    }
  });

  it("apply the M6 cross_sell_rule table", () => {
    const cols = columnNames(applyAllMigrations(), "cross_sell_rule");
    for (const col of ["source_type", "source_key", "suggested_model_id", "position"]) {
      expect(cols.has(col), `cross_sell_rule.${col}`).toBe(true);
    }
  });
});
