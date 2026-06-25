import Link from "next/link";

import { getLandingConfig, getPrimaryMediaId } from "@cutura/db";

import { environmentDb, parseEnvironment } from "@/server/catalog";

export const dynamic = "force-dynamic";

const input = "mt-1 w-full rounded border border-line-strong px-2 py-1 text-sm";
const LOCALES = ["de", "en", "it", "fr"] as const;

const IMAGE_SLOTS: Array<{ slot: string; label: string; hint: string }> = [
  { slot: "hero", label: "Hero image", hint: "Large image at the top of the home page." },
  { slot: "fabric", label: "Fabric / detail image", hint: "Close-up of cloth, seams, buttons." },
  { slot: "workshop", label: "Workshop / craft image", hint: "Tailor, hands at work, atelier." },
];

const TEXT_FIELDS: Array<{ field: string; label: string; long: boolean }> = [
  { field: "heroHeadline", label: "Hero headline", long: false },
  { field: "heroLead", label: "Hero subtext", long: true },
  { field: "fabricTitle", label: "Fabric section title", long: false },
  { field: "fabricBody", label: "Fabric section text", long: true },
  { field: "trustTitle", label: "Trust section title", long: false },
  { field: "trustBody", label: "Trust section text", long: true },
];

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ env?: string; saved?: string; uploaded?: string; removed?: string }>;
}) {
  const { env: envRaw, saved, uploaded, removed } = await searchParams;
  const environment = parseEnvironment(envRaw ?? null);
  const db = environmentDb(environment);
  const config = await getLandingConfig(db);
  const images = Object.fromEntries(
    await Promise.all(
      IMAGE_SLOTS.map(async ({ slot }) => [slot, await getPrimaryMediaId(db, "landing", slot)]),
    ),
  ) as Record<string, string | null>;

  const back = `/landing?env=${environment}`;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Landing page</h1>
        <Link href="/" className="text-sm text-ink-muted underline">
          Dashboard
        </Link>
      </div>

      <div className="mt-2 flex items-center gap-3 text-sm">
        <span className="text-ink-subtle">Environment:</span>
        {(["staging", "production"] as const).map((e) => (
          <Link
            key={e}
            href={`/landing?env=${e}`}
            className={
              e === environment
                ? "font-medium text-ink underline"
                : "text-ink-subtle hover:text-ink"
            }
          >
            {e}
          </Link>
        ))}
      </div>
      <p className="mt-2 text-sm text-ink-subtle">
        Changes apply immediately to the selected environment. Leave a text field blank to use the
        built-in default.
      </p>
      {saved && <p className="mt-2 text-sm text-success">Text saved.</p>}
      {uploaded && <p className="mt-2 text-sm text-success">Image uploaded.</p>}
      {removed && <p className="mt-2 text-sm text-success">Image removed.</p>}

      <section className="mt-8">
        <h2 className="text-lg font-medium">Images</h2>
        <div className="mt-3 flex flex-col gap-6">
          {IMAGE_SLOTS.map(({ slot, label, hint }) => (
            <div key={slot} className="rounded-md border border-line p-4">
              <p className="font-medium">{label}</p>
              <p className="text-sm text-ink-subtle">{hint}</p>
              <div className="mt-3 flex flex-wrap items-end gap-4">
                {images[slot] ? (
                  // eslint-disable-next-line @next/next/no-img-element -- admin preview of an R2 object
                  <img
                    src={`/api/media/${images[slot]}?env=${environment}`}
                    alt={label}
                    className="h-28 w-40 rounded border border-line object-contain"
                  />
                ) : (
                  <div className="flex h-28 w-40 items-center justify-center rounded border border-dashed border-line text-xs text-ink-subtle">
                    none
                  </div>
                )}
                <form
                  method="post"
                  action="/api/landing/media"
                  encType="multipart/form-data"
                  className="flex flex-wrap items-end gap-3"
                >
                  <input type="hidden" name="slot" value={slot} />
                  <input type="hidden" name="environment" value={environment} />
                  <input type="hidden" name="back" value="/landing" />
                  <label className="flex flex-col text-sm">
                    Image
                    <input
                      type="file"
                      name="file"
                      accept="image/*"
                      required
                      className="mt-1 text-sm"
                    />
                  </label>
                  <label className="flex flex-col text-sm">
                    Alt text
                    <input name="alt" className={input} />
                  </label>
                  <button
                    type="submit"
                    className="rounded-md bg-ink px-3 py-2 text-sm font-medium text-paper"
                  >
                    Upload
                  </button>
                </form>
                {images[slot] && (
                  <form method="post" action="/api/landing/media/delete">
                    <input type="hidden" name="slot" value={slot} />
                    <input type="hidden" name="environment" value={environment} />
                    <input type="hidden" name="back" value="/landing" />
                    <button
                      type="submit"
                      className="rounded border border-line-strong px-2 py-1 text-sm"
                    >
                      Remove
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Text</h2>
        <form method="post" action="/api/landing" className="mt-3 flex flex-col gap-5">
          <input type="hidden" name="environment" value={environment} />
          {TEXT_FIELDS.map(({ field, label, long }) => (
            <fieldset key={field} className="rounded border border-line p-3">
              <legend className="px-1 text-sm font-medium">{label}</legend>
              {LOCALES.map((l) => {
                const value =
                  (config[field as keyof typeof config] as Record<string, string> | undefined)?.[
                    l
                  ] ?? "";
                return (
                  <label key={l} className="mt-2 block text-sm">
                    {l.toUpperCase()}
                    {long ? (
                      <textarea
                        name={`${field}_${l}`}
                        rows={2}
                        defaultValue={value}
                        className={input}
                      />
                    ) : (
                      <input name={`${field}_${l}`} defaultValue={value} className={input} />
                    )}
                  </label>
                );
              })}
            </fieldset>
          ))}
          <button
            type="submit"
            className="self-start rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper"
          >
            Save text
          </button>
        </form>
      </section>

      <p className="mt-8 text-sm text-ink-subtle">
        <Link href={back} className="underline">
          Refresh
        </Link>
      </p>
    </main>
  );
}
