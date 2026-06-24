// Canonical + hreflang alternates for a locale-prefixed path (FR-1270). Pure;
// returns the shape Next's Metadata.alternates expects (relative URLs are fine).

export interface AlternatesResult {
  canonical: string;
  languages: Record<string, string>;
}

export function buildAlternates(
  path: string,
  current: string,
  supported: readonly string[],
  fallback: string,
): AlternatesResult {
  const clean = path === "/" || path === "" ? "" : path.startsWith("/") ? path : `/${path}`;
  const languages: Record<string, string> = {};
  for (const l of supported) languages[l] = `/${l}${clean}`;
  languages["x-default"] = `/${fallback}${clean}`;
  return { canonical: `/${current}${clean}`, languages };
}
