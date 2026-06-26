import Link from "next/link";

import { getRow, listMedia, upgrade } from "@cutura/db";

import { MediaManager } from "@/components/MediaManager";
import { PublishPanel } from "@/components/PublishPanel";
import { controlDb } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function UpgradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = controlDb();
  const row = await getRow(db, upgrade, id);
  if (!row) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p>Upgrade not found.</p>
        <Link href="/upgrades" className="underline">
          Back
        </Link>
      </main>
    );
  }
  const mediaRows = await listMedia(db, "upgrade", id);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Upgrade: <span className="font-mono">{row.code}</span>
        </h1>
        <Link href="/upgrades" className="text-sm text-ink-muted underline">
          Back
        </Link>
      </div>
      <p className="mt-1 text-ink-muted">{row.nameI18n.de}</p>

      <MediaManager
        entityType="upgrade"
        entityId={id}
        backPath={`/upgrades/${id}`}
        media={mediaRows}
        heading="Upgrade images"
      />

      <PublishPanel entityType="upgrade" entityId={id} backPath={`/upgrades/${id}`} />
    </main>
  );
}
