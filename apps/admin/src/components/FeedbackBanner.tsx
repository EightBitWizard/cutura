// Server-rendered banner for admin action feedback. Action routes redirect
// with query params (?saved=1, ?error=...); pages pass their awaited search
// params here so the outcome is visible instead of silently dropped.

import { feedbackMessage } from "./feedbackMessages";

const STYLES = {
  success: "mt-4 rounded border border-success/40 bg-success/10 px-3 py-2 text-sm text-success",
  error: "mt-4 rounded border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent",
} as const;

export function FeedbackBanner({
  params,
}: {
  params: Record<string, string | string[] | undefined>;
}) {
  const message = feedbackMessage(params);
  if (!message) return null;
  return (
    <div role={message.kind === "error" ? "alert" : "status"} className={STYLES[message.kind]}>
      {message.text}
    </div>
  );
}
