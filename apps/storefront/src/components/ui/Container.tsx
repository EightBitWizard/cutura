import type { ReactNode } from "react";

// The shared content column. Keeps the storefront on one consistent grid width.
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto w-full max-w-5xl px-6 ${className}`}>{children}</div>;
}
