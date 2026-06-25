import Link from "next/link";

import { getRow, listMedia, upgrade } from "@cutura/db";

import { MediaManager } from "@/components/MediaManager";
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
        <Link href="/upgrades" className="text-sm text-neutral-600 underline">
          Back
        </Link>
      </div>
      <p className="mt-1 text-neutral-600">{row.nameI18n.de}</p>

      <MediaManager
        entityType="upgrade"
        entityId={id}
        backPath={`/upgrades/${id}`}
        media={mediaRows}
        heading="Upgrade images"
      />

      <form method="post" action="/api/catalog/publish" className="mt-8">
        <input type="hidden" name="entityType" value="upgrade" />
        <input type="hidden" name="entityId" value={id} />
        <input type="hidden" name="environment" value="staging" />
        <input type="hidden" name="back" value={`/upgrades/${id}`} />
        <button type="submit" className="rounded border border-neutral-300 px-3 py-1 text-sm">
          Publish to staging
        </button>
      </form>
    </main>
  );
}
