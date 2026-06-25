import Link from "next/link";

import { fabric, getRow, listMedia } from "@cutura/db";

import { MediaManager } from "@/components/MediaManager";
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
        <Link href="/fabrics" className="text-sm text-neutral-600 underline">
          Back
        </Link>
      </div>
      <p className="mt-1 text-neutral-600">{row.nameI18n.de}</p>

      <MediaManager
        entityType="fabric"
        entityId={id}
        backPath={`/fabrics/${id}`}
        media={mediaRows}
        heading="Fabric images (swatch)"
      />

      <form method="post" action="/api/catalog/publish" className="mt-8">
        <input type="hidden" name="entityType" value="fabric" />
        <input type="hidden" name="entityId" value={id} />
        <input type="hidden" name="environment" value="staging" />
        <input type="hidden" name="back" value={`/fabrics/${id}`} />
        <button type="submit" className="rounded border border-neutral-300 px-3 py-1 text-sm">
          Publish to staging
        </button>
      </form>
    </main>
  );
}
