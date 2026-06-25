import type { ReactNode } from "react";

import { Inter } from "next/font/google";

import { Nav } from "@/components/Nav";

import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "CUTURA Admin",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de" className={inter.variable}>
      <body className="min-h-screen bg-paper font-sans text-ink">
        <Nav />
        {children}
      </body>
    </html>
  );
}
