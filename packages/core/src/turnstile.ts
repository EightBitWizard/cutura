// Cloudflare Turnstile verification (NFR-18 bot protection). Pass-through (allow)
// when no secret is configured, so the site works before Turnstile is provisioned;
// once a secret is set, a missing/invalid token is rejected. The fetch impl is
// injectable for tests.
const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(
  token: string | null | undefined,
  secret: string | null | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  if (!secret) return true;
  if (!token) return false;
  const res = await fetchImpl(SITEVERIFY, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
  });
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}
