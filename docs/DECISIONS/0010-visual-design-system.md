# ADR 0010: Visual design system ("Warmed Swiss Method")

- Status: accepted
- Date: 2026-06-25

## Context

With both apps live, the founder judged the storefront generic ("like every online
shop ever") and the admin raw HTML. The storefront was Tailwind v4 zero-config
(`globals.css` just `@import "tailwindcss";`, system fonts, default grays, no brand
identity). Made-to-measure asks the customer for body measurements and an up-front
payment, so the interface has to earn confidence. The founder chose the direction:
Swiss-precise structure, warmed so it reads as handcrafted rather than tech. North
star: "A precise online system for handcrafted made-to-measure clothing." This batch
is a reskin plus an additive image feature; it changes no pricing, snapshot,
status-machine, or measurement behaviour and no requirement.

## Decisions

1. **Tokens live in each app's `globals.css` `@theme` block, not a shared package.**
   The brand ramp is expressed as Tailwind v4 `@theme` custom properties so utilities
   (`bg-paper`, `text-ink`, `text-accent`, `text-eyebrow`) generate from it. A shared
   `packages/config/theme.css` was considered but rejected for now: a cross-package CSS
   `@import` resolves differently under `next build` vs OpenNext `cf:build`, and this
   project has already been bitten by build-tool-specific divergence. The storefront
   `globals.css` is canonical; the admin will mirror a denser subset (WS5).

2. **Palette: warm and restrained.** paper `#F6F4EF`, surface `#FCFBF8`, sunken
   `#EDEAE3`; ink `#1F1D1A` (AAA on paper) with muted/subtle tiers; lines `#E0DBD1` /
   `#C6BFB2`. One accent red `#A4332A` (AA), reserved for small highlights only: focus
   ring, active-nav underline, selected state, danger text, required markers. CTAs are
   ink, never red. Status colors are muted (forest/ochre), not traffic-light.

3. **Type: Inter only, self-hosted via `next/font`.** A warm-precise grotesk with full
   German coverage and tabular figures for prices/measurements; weights 400/500/600;
   no serif. The uppercase `text-eyebrow` token is the main Swiss signal. The font is
   exposed as `--font-inter` and referenced by the `--font-sans` token.

4. **Tight, near-flat, calm.** 8px spacing base, radii 3-4px (images square), hairlines
   and whitespace instead of shadow (one whisper shadow reserved for sticky bars),
   restrained motion wrapped in `prefers-reduced-motion: reduce`.

5. **A small per-app UI primitive layer, not a component-library dependency.**
   Storefront `components/ui/` (Button, Card, Section, Container, Price, Field, Input,
   Badge, Eyebrow) built from Tailwind + a pure, unit-tested `buttonClasses` helper.
   Primitives stay presentational (no pricing/measurement/status logic). `Price` wraps
   `formatCHF`; displayed prices stay all-inclusive.

6. **Accessibility is non-negotiable and gated.** Every image keeps `alt`, every
   image-bearing control keeps a text label, one `h1` per page, `lang` on `<html>`, a
   visible red focus ring. The live Playwright `@a11y`/`@smoke` tests gate every slice.

7. **`.claude/` is gitignored.** Local Claude agent definitions + auto-saved agent
   memory are machine-local (agents still load from disk) and would otherwise keep
   reintroducing em dashes and failing `check:dashes` on every agent run.

## Consequences

New: `apps/storefront/src/components/ui/*` + `buttonClasses` (+ test),
`components/NavLink.tsx`, localized footer labels (`getFooterMessages`), and the
`@theme` token block + base + reduced-motion CSS in `globals.css`. The header/footer
and `LanguageSwitcher` are restyled to tokens. No schema change, no behaviour change.
Delivery is sliced: WS0 (this) is the foundation; WS1-WS5 reskin the pages, add catalog
image management (admin upload UI for fabrics/options/upgrades + storefront swatches),
and polish the admin. See the batch plan and docs/CONVENTIONS.md.
