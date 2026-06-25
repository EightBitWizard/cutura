import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={
        "w-full rounded-sm border border-line-strong bg-surface px-3 py-2 text-ink " +
        "placeholder:text-ink-subtle focus-visible:outline-none focus-visible:ring-2 " +
        "focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-paper " +
        className
      }
      {...props}
    />
  );
}
