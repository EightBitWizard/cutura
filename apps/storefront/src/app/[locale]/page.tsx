import Link from "next/link";

import type { Metadata } from "next";

import { buildAlternates } from "@cutura/core";
import {
  getDb,
  getRecommendations,
  listPublishedCollections,
  listPublishedModels,
  primaryMediaForEntities,
} from "@cutura/db";

import { MediaImage } from "@/components/MediaImage";
import { ModelCard } from "@/components/ModelCard";
import { RecommendedSection } from "@/components/RecommendedSection";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Section } from "@/components/ui/Section";
import { defaultLocale, isLocale, locales } from "@/i18n/config";
import { getHomeMessages, getMessages } from "@/i18n/messages";
import { getEnv } from "@/server/env";
import { getCustomerId } from "@/server/session";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getMessages(locale);
  return {
    title: t.brand,
    description: t.tagline,
    alternates: buildAlternates("/", locale, locales, defaultLocale),
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const t = getMessages(locale);
  const h = getHomeMessages(locale);
  const db = getDb(getEnv().DB);
  const [models, collections] = await Promise.all([
    listPublishedModels(db, locale),
    listPublishedCollections(db, locale),
  ]);
  const mediaByModel = await primaryMediaForEntities(
    db,
    "model",
    models.map((m) => m.id),
  );
  const modelByHandle = new Map(models.map((m) => [m.handle, m]));
  const firstModel = models[0];
  const heroMediaId = firstModel ? (mediaByModel.get(firstModel.id) ?? null) : null;

  // Personalized only when signed in; a guest home would just mirror the catalog.
  const customerId = await getCustomerId();
  const recommended = customerId
    ? await getRecommendations(db, locale, { customerId, limit: 3 })
    : [];

  return (
    <main>
      {/* Hero */}
      <Container className="py-12 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <Eyebrow>{h.heroEyebrow}</Eyebrow>
            <h1 className="mt-4 text-display text-ink">{t.tagline}</h1>
            <p className="mt-5 max-w-md text-lg text-ink-muted">{h.heroLead}</p>
            <div className="mt-8">
              <Link href={`/${locale}/discover`} className={buttonClasses("primary", "lg")}>
                {h.heroCta}
              </Link>
            </div>
          </div>
          <div className="overflow-hidden bg-sunken">
            <MediaImage
              mediaId={heroMediaId}
              alt={firstModel?.name ?? ""}
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
        </div>
      </Container>

      {/* How it works */}
      <div className="border-y border-line bg-surface">
        <Container className="py-12 sm:py-16">
          <Eyebrow>{h.processHeading}</Eyebrow>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3">
            {h.steps.map((s, i) => (
              <li key={s.title}>
                <span className="text-sm font-medium tabular-nums text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 text-lg font-medium text-ink">{s.title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </div>

      <Container>
        <RecommendedSection
          locale={locale}
          heading={t.recommendedForYou}
          models={recommended}
          fromLabel={t.from}
          notifyLabel={t.notifyMe}
        />

        {collections.map((c) => {
          const items = c.modelHandles
            .map((handle) => modelByHandle.get(handle))
            .filter((m): m is NonNullable<typeof m> => m !== undefined);
          if (items.length === 0) return null;
          return (
            <Section key={c.handle}>
              <h2 className="text-2xl font-semibold tracking-tight text-ink">{c.name}</h2>
              {c.description && <p className="mt-2 max-w-2xl text-ink-muted">{c.description}</p>}
              <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
                {items.map((m) => (
                  <ModelCard
                    key={m.handle}
                    locale={locale}
                    model={m}
                    mediaId={mediaByModel.get(m.id) ?? null}
                    fromLabel={t.from}
                    notifyLabel={t.notifyMe}
                  />
                ))}
              </div>
            </Section>
          );
        })}

        <Section>
          <h2 className="text-2xl font-semibold tracking-tight text-ink">{t.allModels}</h2>
          {models.length === 0 ? (
            <p className="mt-3 text-ink-muted">{t.noResults}</p>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
              {models.map((m) => (
                <ModelCard
                  key={m.handle}
                  locale={locale}
                  model={m}
                  mediaId={mediaByModel.get(m.id) ?? null}
                  fromLabel={t.from}
                  notifyLabel={t.notifyMe}
                />
              ))}
            </div>
          )}
        </Section>
      </Container>
    </main>
  );
}
