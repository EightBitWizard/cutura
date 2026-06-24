import { PRIVACY_VERSION } from "@/legal";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Datenschutz / Privacy</h1>
      <p className="mt-2 text-sm text-neutral-500">Version {PRIVACY_VERSION}</p>
      <p className="mt-4 text-neutral-600">
        Placeholder privacy policy. Body measurements are encrypted at rest and never sold. The
        final Swiss-reviewed text is added before launch.
      </p>
    </main>
  );
}
