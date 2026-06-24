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
});
