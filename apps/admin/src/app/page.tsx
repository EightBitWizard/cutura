import Link from "next/link";

export default function AdminHome() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">CUTURA Admin</h1>
      <p className="mt-2 text-neutral-600">
        Control plane for the catalog, publishing, and operations.
      </p>
      <nav className="mt-6 flex flex-col gap-2">
        <Link className="text-neutral-900 underline" href="/garment-types">
          Garment types
        </Link>
        <Link className="text-neutral-900 underline" href="/fabrics">
          Fabrics
        </Link>
      </nav>
      <form method="post" action="/api/auth/logout" className="mt-10">
        <button type="submit" className="rounded border border-neutral-300 px-3 py-1 text-sm">
          Sign out
        </button>
      </form>
    </main>
  );
}
