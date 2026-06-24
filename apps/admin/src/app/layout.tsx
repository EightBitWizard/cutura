import type { ReactNode } from "react";

import { Nav } from "@/components/Nav";

export const metadata = {
  title: "CUTURA Admin",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
