"use client";

import { Suspense } from "react";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { locales } from "@/i18n/config";

import { localeSwitchHref } from "./localeSwitchHref";

const LOCALE_COOKIE = "cutura_locale";

function linkClass(locale: string, current: string): string {
  return locale === current
    ? "font-medium text-ink"
    : "text-ink-subtle transition-colors hover:text-ink";
}

function rememberLocale(locale: string): void {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${60 * 60 * 24 * 365}`;
}

// useSearchParams needs a Suspense boundary; the fallback keeps the switcher
// visible (without query preservation) during a static prerender.
function SwitcherLinks({ current }: { current: string }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  return (
    <>
      {locales.map((l) => (
        <Link
          key={l}
          href={localeSwitchHref(l, pathname, search)}
          onClick={() => rememberLocale(l)}
          className={linkClass(l, current)}
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </>
  );
}

function FallbackLinks({ current }: { current: string }) {
  const pathname = usePathname();
  return (
    <>
      {locales.map((l) => (
        <Link
          key={l}
          href={localeSwitchHref(l, pathname, "")}
          onClick={() => rememberLocale(l)}
          className={linkClass(l, current)}
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </>
  );
}

/**
 * Manual language switcher (FR-1221): links the current path (including its
 * query parameters) under each locale and remembers the choice.
 */
export function LanguageSwitcher({ current }: { current: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <Suspense fallback={<FallbackLinks current={current} />}>
        <SwitcherLinks current={current} />
      </Suspense>
    </div>
  );
}
