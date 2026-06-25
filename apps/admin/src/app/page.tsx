import Link from "next/link";

export default function AdminHome() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">CUTURA Admin</h1>
      <p className="mt-2 text-ink-muted">
        Control plane for the catalog, publishing, and operations.
      </p>
      <nav className="mt-6 flex flex-col gap-2">
        <Link className="text-ink underline" href="/orders">
          Orders
        </Link>
        <Link className="text-ink underline" href="/garment-types">
          Garment types
        </Link>
        <Link className="text-ink underline" href="/base-models">
          Base models
        </Link>
        <Link className="text-ink underline" href="/fabrics">
          Fabrics
        </Link>
        <Link className="text-ink underline" href="/option-groups">
          Option groups
        </Link>
        <Link className="text-ink underline" href="/upgrades">
          Upgrades
        </Link>
        <Link className="text-ink underline" href="/collections">
          Collections
        </Link>
        <Link className="text-ink underline" href="/attributes">
          Attributes
        </Link>
        <Link className="text-ink underline" href="/suppliers">
          Suppliers
        </Link>
      </nav>
      <form method="post" action="/api/auth/logout" className="mt-10">
        <button type="submit" className="rounded border border-line-strong px-3 py-1 text-sm">
          Sign out
        </button>
      </form>
    </main>
  );
}
