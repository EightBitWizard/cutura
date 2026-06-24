import Link from "next/link";

const LINKS: Array<[string, string]> = [
  ["/dashboard", "Dashboard"],
  ["/orders/board", "Board"],
  ["/orders", "Orders"],
  ["/fit-reviews", "Fit reviews"],
  ["/customers", "Customers"],
  ["/suppliers", "Suppliers"],
  ["/shipping", "Shipping"],
  ["/settings", "Settings"],
  ["/content", "Content"],
  ["/cross-sell", "Cross-sell"],
  ["/redirects", "Redirects"],
  ["/audit", "Audit"],
  ["/", "Catalog"],
];

/** Shared back-office top navigation, rendered on every admin page. */
export function Nav() {
  return (
    <nav className="border-b border-neutral-200 bg-neutral-50">
      <div className="mx-auto flex max-w-5xl flex-wrap gap-x-4 gap-y-1 px-6 py-2 text-sm">
        {LINKS.map(([href, label]) => (
          <Link key={href} href={href} className="text-neutral-700 hover:text-neutral-900">
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
