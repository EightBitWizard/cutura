import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

// Verifies the staging seed is valid against the real schema and idempotent.
const MIGRATIONS_DIR = fileURLToPath(new URL("../../../infra/migrations", import.meta.url));
const SEED_FILE = fileURLToPath(new URL("../../../infra/seed/staging-seed.sql", import.meta.url));

function seededDb(applyTwice = false): DatabaseSync {
  const db = new DatabaseSync(":memory:");
  for (const file of readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    db.exec(readFileSync(`${MIGRATIONS_DIR}/${file}`, "utf8"));
  }
  const seed = readFileSync(SEED_FILE, "utf8");
  db.exec(seed);
  if (applyTwice) db.exec(seed);
  return db;
}

function count(db: DatabaseSync, table: string): number {
  const row = db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number };
  return row.n;
}

describe("staging seed", () => {
  it("applies against the real schema and creates the starter catalog", () => {
    const db = seededDb();
    const model = db
      .prepare("SELECT handle, status FROM base_model WHERE id = 'bm_oxford'")
      .get() as { handle: string; status: string } | undefined;
    expect(model?.handle).toBe("oxford-business-shirt");
    expect(model?.status).toBe("orderable");
    // Two garment types (shirt + trouser); five orderable models and eight fabrics across
    // the Business Essentials and Casual Essentials collections.
    expect(count(db, "garment_type")).toBe(2);
    expect(count(db, "base_model")).toBe(5);
    expect(count(db, "fabric")).toBe(8);
    expect(count(db, "model_allowed_fabric")).toBe(11);
    // Option groups: collar + sleeve (shirt); pleats + side/back pockets + closure (trouser).
    expect(count(db, "option_group")).toBe(6);
    // Option values across all groups (incl. the double pleat).
    expect(count(db, "option_value")).toBe(14);
    // Business Essentials (2 members) + Casual Essentials (3 members); reciprocal cross-sell.
    expect(count(db, "collection")).toBe(2);
    expect(count(db, "collection_member")).toBe(5);
    expect(count(db, "cross_sell_rule")).toBe(6);
  });

  it("makes the trouser orderable with its own fabrics + allow-list (FR-104)", () => {
    const db = seededDb();
    const trouser = db
      .prepare(
        "SELECT bm.handle, gt.key FROM base_model bm JOIN garment_type gt ON gt.id = bm.garment_type_id WHERE bm.id = 'bm_chino'",
      )
      .get() as { handle: string; key: string } | undefined;
    expect(trouser?.handle).toBe("city-pleated-trouser");
    expect(trouser?.key).toBe("trouser");
    const allowed = count(db, "model_allowed_fabric WHERE base_model_id = 'bm_chino'");
    expect(allowed).toBe(2);
  });

  it("is idempotent (re-applying does not duplicate rows)", () => {
    const db = seededDb(true);
    expect(count(db, "base_model")).toBe(5);
    expect(count(db, "fabric")).toBe(8);
    expect(count(db, "cross_sell_rule")).toBe(6);
  });
});
