// One consistent "publish to staging" control for every catalog detail page, so the
// release action is always in the same place with the same wording. Catalog entities are
// authored as drafts in the control database and copied to an environment on publish.
export function PublishPanel({
  entityType,
  entityId,
  backPath,
}: {
  entityType: string;
  entityId: string;
  backPath: string;
}) {
  return (
    <section className="mt-10 rounded border border-line bg-sunken/40 p-4">
      <h2 className="text-sm font-medium uppercase tracking-wide text-ink-subtle">Publishing</h2>
      <p className="mt-1 text-sm text-ink-subtle">
        This is a draft in the control catalog. Publish to make it live on staging.
      </p>
      <form method="post" action="/api/catalog/publish" className="mt-3">
        <input type="hidden" name="entityType" value={entityType} />
        <input type="hidden" name="entityId" value={entityId} />
        <input type="hidden" name="environment" value="staging" />
        <input type="hidden" name="back" value={backPath} />
        <button
          type="submit"
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper"
        >
          Publish to staging
        </button>
      </form>
    </section>
  );
}
