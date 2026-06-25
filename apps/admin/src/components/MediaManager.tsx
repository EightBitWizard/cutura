// Reusable image gallery + uploader for any catalog entity. The media API routes
// (/api/catalog/media, .../[id]/primary, .../[id]/delete) are generic over
// entityType/entityId, so this works for models, fabrics, option groups and values,
// and upgrades. Images appear on the storefront only after the entity is published.

interface MediaRow {
  id: string;
  alt: string | null;
  isPrimary: boolean;
}

export function MediaManager({
  entityType,
  entityId,
  backPath,
  media,
  heading = "Images",
}: {
  entityType: string;
  entityId: string;
  backPath: string;
  media: MediaRow[];
  heading?: string;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-medium">{heading}</h2>
      {media.length === 0 ? (
        <p className="text-sm text-neutral-500">No images yet.</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-4">
          {media.map((m) => (
            <div key={m.id} className="w-40 text-xs">
              {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of an R2 object */}
              <img
                src={`/api/media/${m.id}`}
                alt={m.alt ?? ""}
                className="h-32 w-40 rounded border border-neutral-200 object-cover"
              />
              <div className="mt-1 text-neutral-500">{m.isPrimary ? "primary" : ""}</div>
              <div className="mt-1 flex gap-1">
                {!m.isPrimary && (
                  <form method="post" action={`/api/catalog/media/${m.id}/primary`}>
                    <input type="hidden" name="entityType" value={entityType} />
                    <input type="hidden" name="entityId" value={entityId} />
                    <input type="hidden" name="back" value={backPath} />
                    <button type="submit" className="rounded border border-neutral-300 px-1">
                      Make primary
                    </button>
                  </form>
                )}
                <form method="post" action={`/api/catalog/media/${m.id}/delete`}>
                  <input type="hidden" name="back" value={backPath} />
                  <button type="submit" className="rounded border border-neutral-300 px-1">
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
      <form
        method="post"
        action="/api/catalog/media"
        encType="multipart/form-data"
        className="mt-4 flex flex-wrap items-end gap-3"
      >
        <input type="hidden" name="entityType" value={entityType} />
        <input type="hidden" name="entityId" value={entityId} />
        <input type="hidden" name="back" value={backPath} />
        <label className="flex flex-col text-sm">
          Image
          <input type="file" name="file" accept="image/*" required className="mt-1 text-sm" />
        </label>
        <label className="flex flex-col text-sm">
          Alt text
          <input name="alt" className="mt-1 rounded border border-neutral-300 px-2 py-1" />
        </label>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white"
        >
          Upload
        </button>
      </form>
    </section>
  );
}
