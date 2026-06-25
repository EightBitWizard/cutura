import type { ReactNode } from "react";

// Vertical rhythm for page sections; whitespace does the separating, not boxes.
export function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`py-12 sm:py-16 ${className}`}>{children}</section>;
}
