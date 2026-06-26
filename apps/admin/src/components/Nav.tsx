"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Grouped so related screens sit together: the catalog editors, day-to-day operations,
// and configuration. Order within a group is by how often it is used.
const GROUPS: Array<{ label: string; links: Array<[string, string]> }> = [
  {
    label: "Catalog",
    links: [
      ["/", "Catalog home"],
      ["/base-models", "Models"],
      ["/fabrics", "Fabrics"],
      ["/option-groups", "Options"],
      ["/upgrades", "Upgrades"],
      ["/collections", "Collections"],
      ["/attributes", "Attributes"],
      ["/garment-types", "Garment types"],
    ],
  },
  {
    label: "Operations",
    links: [
      ["/dashboard", "Dashboard"],
      ["/orders/board", "Board"],
      ["/orders", "Orders"],
      ["/fit-reviews", "Fit reviews"],
      ["/customers", "Customers"],
      ["/suppliers", "Suppliers"],
      ["/shipping", "Shipping"],
      ["/audit", "Audit"],
    ],
  },
  {
    label: "Configuration",
    links: [
      ["/settings", "Settings"],
      ["/landing", "Landing page"],
      ["/content", "Content"],
      ["/cross-sell", "Cross-sell"],
      ["/redirects", "Redirects"],
    ],
  },
];

/** Shared back-office top navigation, grouped, rendered on every admin page. */
export function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav className="sticky top-0 z-40 border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3 text-sm">
        <Link href="/" className="mr-2 font-semibold tracking-tight text-ink">
          CUTURA <span className="font-normal text-ink-subtle">Admin</span>
        </Link>
        {GROUPS.map((group, gi) => (
          <div
            key={group.label}
            className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${
              gi > 0 ? "border-l border-line pl-4" : ""
            }`}
          >
            <span className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">
              {group.label}
            </span>
            {group.links.map(([href, label]) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative py-1 transition-colors ${
                    active ? "text-ink" : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {label}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-0.5 h-px bg-accent"
                    />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </nav>
  );
}
