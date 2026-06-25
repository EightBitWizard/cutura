import type { ReactNode } from "react";

// Label-above-control field. Labels above (not beside) keep long German strings safe.
export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      {children}
      {hint ? <span className="text-eyebrow uppercase text-ink-subtle">{hint}</span> : null}
    </label>
  );
}
