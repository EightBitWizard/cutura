import type { ReactNode } from "react";

// A bordered surface block for grouped content (forms, info panels). Product cards
// are borderless and image-forward; those are built where they are used.
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-md border border-line bg-surface ${className}`}>{children}</div>;
}
