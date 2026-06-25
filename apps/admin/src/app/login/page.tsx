export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message =
    error === "rate"
      ? "Too many attempts. Please wait a few minutes and try again."
      : error
        ? "Incorrect password."
        : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold tracking-tight">CUTURA Admin</h1>
      <p className="mt-2 text-sm text-ink-muted">Sign in to manage the catalog.</p>
      {message ? (
        <p className="mt-4 rounded-md bg-accent/5 px-3 py-2 text-sm text-accent">{message}</p>
      ) : null}
      <form method="post" action="/api/auth/login" className="mt-6 flex flex-col gap-3">
        <label className="text-sm font-medium" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-md border border-line-strong px-3 py-2"
        />
        <button type="submit" className="mt-2 rounded-md bg-ink px-4 py-2 font-medium text-paper">
          Sign in
        </button>
      </form>
    </main>
  );
}
