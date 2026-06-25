import type { ReactNode } from "react";

type Tone = "neutral" | "accent" | "success";

const TONES: Record<Tone, string> = {
  neutral: "bg-sunken text-ink-muted",
  accent: "bg-accent/10 text-accent-strong",
  success: "bg-success/10 text-success",
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-sm px-2 py-0.5 text-eyebrow uppercase ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
