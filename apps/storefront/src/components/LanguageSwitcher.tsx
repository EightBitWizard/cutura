"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { locales } from "@/i18n/config";

const LOCALE_COOKIE = "cutura_locale";

function stripLocale(pathname: string): string {
  const parts = pathname.split("/");
  if (parts.length > 1 && (locales as readonly string[]).includes(parts[1] ?? "")) {
    const rest = "/" + parts.slice(2).join("/");
    return rest === "/" ? "" : rest;
  }
  return pathname === "/" ? "" : pathname;
}

/** Manual language switcher (FR-1221); links the current path under each locale and remembers the choice. */
export function LanguageSwitcher({ current }: { current: string }) {
  const pathname = usePathname();
  const rest = stripLocale(pathname);
  return (
    <div className="flex gap-2 text-sm">
      {locales.map((l) => (
        <Link
          key={l}
          href={`/${l}${rest}`}
          onClick={() => {
            document.cookie = `${LOCALE_COOKIE}=${l};path=/;max-age=${60 * 60 * 24 * 365}`;
          }}
          className={
            l === current
              ? "font-medium text-ink"
              : "text-ink-subtle transition-colors hover:text-ink"
          }
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </div>
  );
}
