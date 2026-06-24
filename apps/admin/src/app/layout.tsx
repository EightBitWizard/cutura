import type { ReactNode } from "react";

export const metadata = {
  title: "CUTURA Admin",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
