import { listAuditLog } from "@cutura/db";

import { environmentDb } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const rows = await listAuditLog(environmentDb("staging"));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
      <p className="mt-1 text-sm text-ink-subtle">
        Status changes, admin operations, and sensitive access (staging, newest first).
      </p>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-ink-subtle">
            <th className="py-2">When</th>
            <th>Actor</th>
            <th>Action</th>
            <th>Entity</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b align-top">
              <td className="py-2 font-mono text-xs">
                {r.createdAt.slice(0, 19).replace("T", " ")}
              </td>
              <td>{r.actor}</td>
              <td>{r.action}</td>
              <td className="text-ink-subtle">
                {r.entityType ?? "-"}
                {r.entityId ? ` ${r.entityId.slice(0, 8)}` : ""}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-ink-subtle">
                No audit entries yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </main>
  );
}
