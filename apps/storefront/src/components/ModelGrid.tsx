import type { PublishedModelSummary } from "@cutura/db";

import { ModelCard } from "@/components/ModelCard";

// Shared product grid for discovery, collections, occasions, search, and recommendations.
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
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
      {models.map((m) => (
        <ModelCard
          key={m.handle}
          locale={locale}
          model={m}
          mediaId={mediaByModel.get(m.id) ?? null}
          fromLabel={fromLabel}
          notifyLabel={notifyLabel}
        />
      ))}
    </div>
  );
}
