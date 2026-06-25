import { buttonClasses } from "@/components/ui/buttonClasses";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { defaultLocale, isLocale } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

export const dynamic = "force-dynamic";

// The staging access gate (a normal password form, so password managers fill it; the
// cookie it sets is long-lived). Only reachable when SITE_PASSWORD is set; production
// has no gate. The middleware lets this page through so there is no redirect loop.
export default async function SiteAccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : defaultLocale;
  const { next, error } = await searchParams;
  const t = getMessages(locale);
  const safeNext =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-6 py-16">
      <Eyebrow>Staging</Eyebrow>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">{t.brand}</h1>
      <p className="mt-2 text-sm text-ink-muted">
        This site is private during development. Enter the access password to continue.
      </p>
      {error ? <p className="mt-3 text-sm text-accent">Wrong password. Please try again.</p> : null}

      <form method="post" action="/api/site-access" className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="next" value={safeNext} />
        <input type="hidden" name="locale" value={locale} />
        <Field label="Password" htmlFor="site-password">
          <Input
            id="site-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
          />
        </Field>
        <button type="submit" className={buttonClasses("primary", "lg")}>
          Enter
        </button>
      </form>
    </main>
  );
}
