import Link from "next/link";

import type { Metadata } from "next";

import { type LandingConfig, buildAlternates } from "@cutura/core";
import {
  getDb,
  getLandingConfig,
  getPrimaryMediaId,
  getRecommendations,
  listPublishedCollections,
  listPublishedModels,
  localize,
  primaryMediaForEntities,
} from "@cutura/db";

import { MediaImage } from "@/components/MediaImage";
import { ModelCard } from "@/components/ModelCard";
import { RecommendedSection } from "@/components/RecommendedSection";
import { buttonClasses } from "@/components/ui/buttonClasses";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { type Locale, defaultLocale, isLocale, locales } from "@/i18n/config";
import { getFooterMessages, getHomeMessages, getMessages } from "@/i18n/messages";
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

  const [models, collections, landing] = await Promise.all([
    listPublishedModels(db, locale),
    listPublishedCollections(db, locale),
    getLandingConfig(db),
  ]);
  const mediaByModel = await primaryMediaForEntities(
    db,
    "model",
    models.map((m) => m.id),
  );
  const [heroImg, fabricImg, workshopImg] = await Promise.all([
    getPrimaryMediaId(db, "landing", "hero"),
    getPrimaryMediaId(db, "landing", "fabric"),
    getPrimaryMediaId(db, "landing", "workshop"),
  ]);

  // Admin-configured editorial text overrides the built-in default per locale.
  const text = (field: keyof LandingConfig, fallback: string): string => {
    const value = landing[field];
    return (value ? localize(value, locale as Locale) : "") || fallback;
  };

  const modelByHandle = new Map(models.map((m) => [m.handle, m]));
  const firstModel = models[0];
  // The hero falls back to the first product photo, then the branded placeholder.
  const heroMediaId = heroImg ?? (firstModel ? (mediaByModel.get(firstModel.id) ?? null) : null);

  // A curated few for the preview (the first non-empty collection, else the first models),
  // so the home page does not dump the whole catalog.
  const firstCollection = collections.find((c) =>
    c.modelHandles.some((handle) => modelByHandle.has(handle)),
  );
  const previewItems = (
    firstCollection
      ? firstCollection.modelHandles
          .map((handle) => modelByHandle.get(handle))
          .filter((m): m is NonNullable<typeof m> => m !== undefined)
      : models
  ).slice(0, 3);

  const customerId = await getCustomerId();
  const recommended = customerId
    ? await getRecommendations(db, locale, { customerId, limit: 3 })
    : [];

  return (
    <main>
      {/* Hero */}
      <Container className="py-16 sm:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1">
            <Eyebrow>{h.heroEyebrow}</Eyebrow>
            <h1 className="mt-4 text-display text-ink">{text("heroHeadline", t.tagline)}</h1>
            <p className="mt-6 max-w-md text-lg text-ink-muted">{text("heroLead", h.heroLead)}</p>
            <div className="mt-8">
              <Link href={`/${locale}/discover`} className={buttonClasses("primary", "lg")}>
                {h.heroCta}
              </Link>
            </div>
          </div>
          <div className="order-1 overflow-hidden bg-sunken lg:order-2">
            <MediaImage
              mediaId={heroMediaId}
              alt={text("heroHeadline", t.tagline)}
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
        </div>
      </Container>

      {/* How it works */}
      <div className="border-y border-line bg-surface">
        <Container className="py-16 sm:py-24">
          <Eyebrow>{h.processHeading}</Eyebrow>
          <ol className="mt-10 grid gap-10 sm:grid-cols-3">
            {h.steps.map((s, i) => (
              <li key={s.title}>
                <span className="text-sm font-medium tabular-nums text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 text-lg font-medium text-ink">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </div>

      {/* Fabric / craftsmanship */}
      <Container className="py-16 sm:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="overflow-hidden bg-sunken">
            <MediaImage
              mediaId={fabricImg}
              alt={text("fabricTitle", h.fabricTitle)}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
          <div>
            <Eyebrow>{h.fabricEyebrow}</Eyebrow>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {text("fabricTitle", h.fabricTitle)}
            </h2>
            <p className="mt-4 max-w-md leading-relaxed text-ink-muted">
              {text("fabricBody", h.fabricBody)}
            </p>
          </div>
        </div>
      </Container>

      {/* Model preview (curated, not the whole catalog) */}
      {previewItems.length > 0 && (
        <Container className="border-t border-line py-16 sm:py-24">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {h.previewHeading}
            </h2>
            <Link
              href={`/${locale}/discover`}
              className="shrink-0 text-sm text-ink-muted underline transition-colors hover:text-ink"
            >
              {h.viewAll}
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-3">
            {previewItems.map((m) => (
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
          <RecommendedSection
            locale={locale}
            heading={t.recommendedForYou}
            models={recommended}
            fromLabel={t.from}
            notifyLabel={t.notifyMe}
          />
        </Container>
      )}

      {/* Trust / quality */}
      <div className="border-y border-line bg-surface">
        <Container className="py-16 sm:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <Eyebrow>{h.trustEyebrow}</Eyebrow>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                {text("trustTitle", h.trustTitle)}
              </h2>
              <p className="mt-4 max-w-md leading-relaxed text-ink-muted">
                {text("trustBody", h.trustBody)}
              </p>
              <div className="mt-6">
                <Link
                  href={`/${locale}/legal/fit-guarantee`}
                  className="text-sm text-ink underline transition-colors hover:text-ink-muted"
                >
                  {getFooterMessages(locale).fitGuarantee}
                </Link>
              </div>
            </div>
            <div className="order-first overflow-hidden bg-sunken lg:order-last">
              <MediaImage
                mediaId={workshopImg}
                alt={text("trustTitle", h.trustTitle)}
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          </div>
        </Container>
      </div>
    </main>
  );
}
