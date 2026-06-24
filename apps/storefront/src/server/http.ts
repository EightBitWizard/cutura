/** 303 redirect to a same-origin path (resolved against the request origin). */
export function redirectTo(request: Request, path: string, headers: HeadersInit = {}): Response {
  const h = new Headers(headers);
  h.set("Location", new URL(path, new URL(request.url).origin).toString());
  return new Response(null, { status: 303, headers: h });
}
