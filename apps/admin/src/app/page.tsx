import Link from "next/link";

const CATALOG: Array<{ href: string; title: string; desc: string }> = [
  {
    href: "/base-models",
    title: "Models",
    desc: "Products, pricing, descriptions, and allow-lists.",
  },
  {
    href: "/fabrics",
    title: "Fabrics",
    desc: "Cloth options, fibre composition, and availability.",
  },
  {
    href: "/option-groups",
    title: "Options",
    desc: "Option groups and values (collar, pockets, ...) with images.",
  },
  { href: "/upgrades", title: "Upgrades", desc: "Paid add-ons such as a monogram." },
  {
    href: "/collections",
    title: "Collections",
    desc: "Curated groups; choose which show on the landing page.",
  },
  { href: "/attributes", title: "Attributes", desc: "Discovery filters such as occasion." },
  { href: "/garment-types", title: "Garment types", desc: "Shirt, trouser, and future types." },
];

export default function AdminHome() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">CUTURA Admin</h1>
      <p className="mt-2 text-ink-muted">
        Control plane for the catalog, publishing, and operations. Author here, then publish to
        staging.
      </p>

      <h2 className="mt-8 text-sm font-medium uppercase tracking-wide text-ink-subtle">Catalog</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATALOG.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-lg border border-line bg-surface p-4 transition-colors hover:border-line-strong"
          >
            <div className="font-medium text-ink">{c.title}</div>
            <p className="mt-1 text-sm text-ink-muted">{c.desc}</p>
          </Link>
        ))}
      </div>

      <p className="mt-6 text-sm text-ink-subtle">
        Orders, fit reviews, and settings are in the top navigation.
      </p>

      <form method="post" action="/api/auth/logout" className="mt-10">
        <button type="submit" className="rounded border border-line-strong px-3 py-1 text-sm">
          Sign out
        </button>
      </form>
    </main>
  );
}
