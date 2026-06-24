import { type PublishedModelSummary, getDb, primaryMediaForEntities } from "@cutura/db";

import type { Locale } from "@/i18n/config";
import { getEnv } from "@/server/env";

import { ModelGrid } from "./ModelGrid";

// Renders a recommendation strip (FR-1102). The caller resolves the models via
// getRecommendations; this resolves their primary media and reuses ModelGrid.
export async function RecommendedSection({
  locale,
  heading,
  models,
  fromLabel,
  notifyLabel,
}: {
  locale: Locale;
  heading: string;
  models: PublishedModelSummary[];
  fromLabel: string;
  notifyLabel: string;
}) {
  if (models.length === 0) return null;
  const media = await primaryMediaForEntities(
    getDb(getEnv().DB),
    "model",
    models.map((m) => m.id),
  );
  return (
    <section className="mt-12">
      <h2 className="text-xl font-medium">{heading}</h2>
      <div className="mt-4">
        <ModelGrid
          models={models}
          mediaByModel={media}
          locale={locale}
          fromLabel={fromLabel}
          notifyLabel={notifyLabel}
        />
      </div>
    </section>
  );
}
