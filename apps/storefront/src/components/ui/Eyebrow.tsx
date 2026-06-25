import type { ReactNode } from "react";

// The small uppercase label above a heading or group: the main Swiss signal.
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-eyebrow uppercase text-ink-subtle ${className}`}>{children}</p>;
}
