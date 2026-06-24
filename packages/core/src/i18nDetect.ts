// Pure browser-language negotiation (FR-1220). Parses an Accept-Language header
// and returns the highest-q supported locale, or the fallback. Matches on the
// primary subtag (e.g. "fr-CH" -> "fr").
export function pickLocale<T extends string>(
  acceptLanguage: string | null | undefined,
  supported: readonly T[],
  fallback: T,
): T {
  if (!acceptLanguage) return fallback;
  const entries = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1;
      return { tag: (tag ?? "").trim().toLowerCase(), q: Number.isFinite(q) ? q : 1 };
    })
    .filter((e) => e.tag.length > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of entries) {
    const primary = tag.split("-")[0];
    const match = supported.find((s) => s.toLowerCase() === primary);
    if (match) return match;
  }
  return fallback;
}
