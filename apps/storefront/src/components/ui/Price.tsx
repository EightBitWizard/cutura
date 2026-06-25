import { formatCHF } from "@cutura/core";

// All displayed prices are all-inclusive (VAT and standard shipping). Tabular figures
// keep the digits aligned. Pricing is computed server-side; this only formats.
export function Price({ minor, className = "" }: { minor: number; className?: string }) {
  return <span className={`tabular-nums ${className}`}>{formatCHF(minor)}</span>;
}
