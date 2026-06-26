import Link from "next/link";

import { fabric, getRow, listMedia } from "@cutura/db";

import { MediaManager } from "@/components/MediaManager";
import { PublishPanel } from "@/components/PublishPanel";
import { controlDb } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function FabricDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = controlDb();
  const row = await getRow(db, fabric, id);
  if (!row) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p>Fabric not found.</p>
        <Link href="/fabrics" className="underline">
          Back
        </Link>
      </main>
    );
  }
  const mediaRows = await listMedia(db, "fabric", id);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          Fabric: <span className="font-mono">{row.code}</span>
        </h1>
        <Link href="/fabrics" className="text-sm text-ink-muted underline">
          Back
        </Link>
      </div>
      <p className="mt-1 text-ink-muted">{row.nameI18n.de}</p>

      <MediaManager
        entityType="fabric"
        entityId={id}
        backPath={`/fabrics/${id}`}
        media={mediaRows}
        heading="Fabric images (swatch)"
      />

      <PublishPanel entityType="fabric" entityId={id} backPath={`/fabrics/${id}`} />
    </main>
  );
}
