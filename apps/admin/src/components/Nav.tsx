"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const pathname = usePathname();
  return (
    <nav className="sticky top-0 z-40 border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-1 px-6 py-3 text-sm">
        <Link href="/" className="mr-3 font-semibold tracking-tight text-ink">
          CUTURA <span className="font-normal text-ink-subtle">Admin</span>
        </Link>
        {LINKS.map(([href, label]) => {
          const active =
            href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
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
    </nav>
  );
}
