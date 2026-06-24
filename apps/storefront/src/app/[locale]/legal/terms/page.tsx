import { TERMS_VERSION } from "@/legal";

export const dynamic = "force-dynamic";

export default async function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">AGB / Terms</h1>
      <p className="mt-2 text-sm text-neutral-500">Version {TERMS_VERSION}</p>
      <p className="mt-4 text-neutral-600">
        Placeholder terms. The final Swiss-reviewed text is added before launch.
      </p>
    </main>
  );
}
