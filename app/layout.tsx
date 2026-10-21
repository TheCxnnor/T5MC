import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "T5 Mission Control",
  description: "Progression, profit and upgrade tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#1f2328] text-white">
        <header className="border-b border-[#3f464d] bg-[#252a30]">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <Link
              href="/"
              className="text-xl font-bold text-white"
            >
              T5 Mission Control
            </Link>

            <nav className="flex flex-wrap gap-2 text-sm font-medium">
              <Link
                href="/"
                className="rounded-lg px-3 py-2 text-[#c8d0d8] transition hover:bg-[#343b43] hover:text-white"
              >
                Dashboard
              </Link>

              <Link
                href="/profit"
                className="rounded-lg px-3 py-2 text-[#c8d0d8] transition hover:bg-[#343b43] hover:text-white"
              >
                Profit Calculator
              </Link>

              <Link
                href="/pve"
                className="rounded-lg px-3 py-2 text-[#c8d0d8] transition hover:bg-[#343b43] hover:text-white"
              >
                PvE Calculator
              </Link>

              <Link
                href="/drills"
                className="rounded-lg px-3 py-2 text-[#c8d0d8] transition hover:bg-[#343b43] hover:text-white"
              >
                Drills
              </Link>

              <Link
                href="/armor"
                className="rounded-lg px-3 py-2 text-[#c8d0d8] transition hover:bg-[#343b43] hover:text-white"
              >
                Armor
              </Link>

              <Link
                href="/helmets"
                className="rounded-lg px-3 py-2 text-[#c8d0d8] transition hover:bg-[#343b43] hover:text-white"
              >
                Helmets
              </Link>

              <Link
                href="/cores"
                className="rounded-lg px-3 py-2 text-[#c8d0d8] transition hover:bg-[#343b43] hover:text-white"
              >
                Cores
              </Link>

              <Link
                href="/talismans"
                className="rounded-lg px-3 py-2 text-[#c8d0d8] transition hover:bg-[#343b43] hover:text-white"
              >
                Talismans
              </Link>

              <Link
                href="/misc"
                className="rounded-lg px-3 py-2 text-[#c8d0d8] transition hover:bg-[#343b43] hover:text-white"
              >
                Misc
              </Link>
            </nav>
          </div>
        </header>

        {children}

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}