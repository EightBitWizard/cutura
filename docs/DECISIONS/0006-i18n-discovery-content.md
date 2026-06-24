# ADR 0006: Internationalization, discovery, and content

- Status: accepted
- Date: 2026-06-24

## Context

M6 completes the four-language storefront with real discovery, editable content,
public images, merchandising tools, and the localized parcel card. A few decisions
are worth recording.

## Decisions

1. **Public media serving mirrors the admin safe serve.** The storefront
   `GET /api/media/[id]` serves only allow-listed raster types inline (shared
   `isAllowedImageType` in `packages/core/src/media.ts`); anything else is an
   opaque download with `nosniff` + a locked-down CSP. It reads the media row from
   the env DB and the object from the env `MEDIA` bucket. Copying the R2 object
   into the target bucket on publish is a go-live follow-up (no live objects yet).

2. **Locale negotiation is a pure function.** `pickLocale(acceptLanguage, ...)`
   (core) picks the highest-q supported primary subtag, German fallback. The
   middleware uses it only on an unprefixed entry, then redirects and remembers the
   choice in a cookie; the `LanguageSwitcher` links the current path under each
   locale. Locale-prefixed URLs and `localize()` (locale -> de -> "") were already
   in place.

3. **SEO is built from one pure helper.** `buildAlternates(path, ...)` (core)
   produces canonical + hreflang languages (incl. `x-default`); `generateMetadata`
   on the key pages and a dynamic `app/sitemap.ts` + `robots` consume it. `SITE_URL`
   is a constant, override at provisioning.

4. **Discovery is read-only over the catalog.** `attributeValue` already stored
   per-item assignments; `listAttributeFacets` + `listPublishedModelsFiltered`
   (filter OR-within-key / AND-across-keys, sort, orderable-only) drive the
   `/discover` page. Occasion browsing is a preset of the same query; collections
   and search reuse the same model grid. Launch catalog is small, so filtering +
   search run in memory over the published rows; indexing is a scale follow-up.

5. **Content + legal pages are DB-backed + published.** `contentPage` gained a
   publish resolver; the admin authors them in control and publishes; the storefront
   renders `/content/[slug]` and `/legal/[slug]` from the env DB. Legal slugs fall
   back to a calm placeholder before the founder seeds the final, lawyer-reviewed
   text (that, and the lawyer sign-off, stay M7). New visible copy is professional-
   grade in four languages but human/translator review remains a founder step
   (FR-1250); we do not self-certify it.

6. **Cross-sell is curated, not behavioural.** A new `crossSellRule` table
   (migration 0004) maps a source (model handle or attribute `key:value`) to a
   suggested model; it publishes like other catalog and powers the PDP "you might
   also like".

7. **The parcel card is localized + immutability-safe.** `parcelCardContent` (core,
   4 langs) + `renderParcelCardPdf` (pdf-lib) drive the card from the order's stored
   language and snapshot; the sewn-in label stays language-neutral (composition +
   international care symbols). The admin packaging step downloads the card.

## Consequences

New pure helpers in `packages/core` (`media`, `i18nDetect`, `seo`, `format`,
`parcelCard`); new db modules `content`, `crosssell`, `notify`, plus discovery/
media helpers in `catalog/read`. The live half (real images in the env bucket,
end-to-end language verification, SEO/hreflang validation, real translation review)
awaits provisioning + a translator/lawyer. Excluded as planned: Spanish, config
sharing, recently-viewed, editable nav, lookbook, rule-based collections.
