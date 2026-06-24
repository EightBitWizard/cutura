import Link from "next/link";

import { formatCHF } from "@cutura/core";
import type { PublishedModelSummary } from "@cutura/db";

import { MediaImage } from "@/components/MediaImage";

// Shared product grid for discovery, collections, occasions, and search.
export function ModelGrid({
  models,
  mediaByModel,
  locale,
  fromLabel,
  notifyLabel,
}: {
  models: PublishedModelSummary[];
  mediaByModel: Map<string, string>;
  locale: string;
  fromLabel: string;
  notifyLabel: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {models.map((m) => (
        <Link
          key={m.handle}
          href={`/${locale}/products/${m.handle}`}
          className="flex flex-col rounded-lg border border-neutral-200 p-4 hover:border-neutral-400"
        >
          <MediaImage
            mediaId={mediaByModel.get(m.id) ?? null}
            alt={m.name}
            className="mb-3 aspect-square w-full rounded bg-neutral-100 object-cover"
          />
          <span className="font-medium">{m.name}</span>
          <span className="mt-1 text-sm text-neutral-500">
            {fromLabel} {formatCHF(m.basePriceMinor)}
          </span>
          {m.status === "view_only" && (
            <span className="mt-1 text-xs text-neutral-400">{notifyLabel}</span>
          )}
        </Link>
      ))}
    </div>
  );
}
