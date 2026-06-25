import Link from "next/link";

// Global 404 (designed, not the framework default). Locale-neutral since it can be
// hit outside a locale segment; links back into the default locale.
export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">404</h1>
      <p className="mt-3 text-ink-muted">
        This page could not be found. / Diese Seite wurde nicht gefunden.
      </p>
      <Link href="/" className="mt-6 inline-block rounded-md bg-ink px-4 py-2 text-paper">
        CUTURA
      </Link>
    </main>
  );
}
