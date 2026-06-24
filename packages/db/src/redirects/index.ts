import { desc, eq } from "drizzle-orm";

import type { Database } from "../getDb";
import { redirect } from "../schema";

export type RedirectRow = typeof redirect.$inferSelect;

const nowIso = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();

/** Look up an admin-managed redirect by source path (NFR-20). Null if none. */
export async function getRedirect(
  db: Database,
  fromPath: string,
): Promise<{ toPath: string; code: number } | null> {
  const [row] = await db.select().from(redirect).where(eq(redirect.fromPath, fromPath));
  return row ? { toPath: row.toPath, code: row.code } : null;
}

export function listRedirects(db: Database): Promise<RedirectRow[]> {
  return db.select().from(redirect).orderBy(desc(redirect.createdAt));
}

export async function createRedirect(
  db: Database,
  input: { fromPath: string; toPath: string; code?: number },
): Promise<{ id: string }> {
  const id = uuid();
  const now = nowIso();
  await db
    .insert(redirect)
    .values({
      id,
      fromPath: input.fromPath,
      toPath: input.toPath,
      code: input.code === 302 ? 302 : 301,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: redirect.fromPath,
      set: { toPath: input.toPath, code: input.code === 302 ? 302 : 301, updatedAt: now },
    });
  return { id };
}

export async function deleteRedirect(db: Database, id: string): Promise<void> {
  await db.delete(redirect).where(eq(redirect.id, id));
}
