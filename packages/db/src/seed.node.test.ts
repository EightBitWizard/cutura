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
    expect(model?.handle).toBe("oxford-business");
    expect(model?.status).toBe("orderable");
    expect(count(db, "fabric")).toBe(2);
    expect(count(db, "model_allowed_fabric")).toBe(2);
    expect(count(db, "option_value")).toBe(2);
  });

  it("is idempotent (re-applying does not duplicate rows)", () => {
    const db = seededDb(true);
    expect(count(db, "base_model")).toBe(1);
    expect(count(db, "fabric")).toBe(2);
  });
});
