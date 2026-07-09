"use client";

import type { ReactNode } from "react";

/**
 * Submit button for one-click irreversible admin actions: asks for
 * confirmation via window.confirm and cancels the form submit when declined.
 */
export function ConfirmSubmitButton({
  message,
  className,
  children,
}: {
  message: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
