import type { BatchItem } from "drizzle-orm/batch";
import { type SQL, eq } from "drizzle-orm";
import type { AnySQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";

import type { Database } from "../getDb";

// Building blocks for the publish routine. Every statement is single-row, so no
// statement ever approaches D1's 100-bound-parameter limit; the whole closure is
// run in one atomic target.batch([...]) by publishEntity.

/** A catalog table copied by primary key. All catalog tables use a text `id` PK. */
export type IdTable = SQLiteTable & { id: AnySQLiteColumn };

type Row<T extends IdTable> = T["$inferInsert"] & { id: string };

/**
 * Copy parent rows into the target by id: delete-then-insert per row, so a
 * re-publish overwrites the env copy. Idempotent.
 */
export function copyById<T extends IdTable>(
  db: Database,
  table: T,
  rows: Array<Row<T>>,
): BatchItem<"sqlite">[] {
  const stmts: BatchItem<"sqlite">[] = [];
  for (const row of rows) {
    stmts.push(db.delete(table).where(eq(table.id, row.id)));
    stmts.push(db.insert(table).values(row));
  }
  return stmts;
}

/**
 * Replace a parent's owned children in the target: scoped delete (so children
 * removed in control disappear) then insert the current set, single-row.
 */
export function replaceChildren<T extends IdTable>(
  db: Database,
  table: T,
  scope: SQL,
  rows: Array<Row<T>>,
): BatchItem<"sqlite">[] {
  const stmts: BatchItem<"sqlite">[] = [db.delete(table).where(scope)];
  for (const row of rows) {
    stmts.push(db.insert(table).values(row));
  }
  return stmts;
}
