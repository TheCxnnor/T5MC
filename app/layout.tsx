import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import CloudAutoSave from "../components/CloudAutoSave";
import SidebarAccount from "../components/SidebarAccount";

export const metadata: Metadata = {
  title: "T5 Mission Control",
  description: "Progression, profit and upgrade tracking",
};

const navigation = [
  {
    title: "Overview",
    links: [
      { href: "/", label: "Dashboard" },
      { href: "/crafting", label: "Crafting Totals" },
    ],
  },
  {
    title: "Calculators",
    links: [
      { href: "/profit", label: "Mining Profit" },
      { href: "/pve", label: "PvE Calculator" },
    ],
  },
  {
    title: "Progression",
    links: [
      { href: "/drills", label: "Drills" },
      { href: "/armor", label: "Armor" },
      { href: "/helmets", label: "Helmets" },
      { href: "/cores", label: "Cores" },
      { href: "/talismans", label: "Talismans" },
      { href: "/misc", label: "Misc Items" },
    ],
  },
];

function Navigation() {
  return (
    <nav aria-label="Main navigation" className="space-y-7">
      {navigation.map((group) => (
        <section key={group.title}>
          <h2 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#788595]">
            {group.title}
          </h2>

          <ul className="space-y-1">
            {group.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-[#c8d0d8] transition hover:border-white/10 hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a9cf9f]"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#151b24] text-white">
        <CloudAutoSave>
          {/* Desktop sidebar */}
          <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/10 bg-[#1b222c] md:flex">
            <Link
              href="/"
              className="block shrink-0 border-b border-white/10 px-6 py-7"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#a9cf9f]">
                T5
              </p>

              <p className="mt-1 text-xl font-bold tracking-tight">
                Mission Control
              </p>
            </Link>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6">
              <Navigation />
            </div>

            <div className="shrink-0 border-t border-white/10 px-6 py-4">
              <p className="text-xs text-[#788595]">
                Plan upgrades. Track progress.
              </p>
            </div>
          </aside>

          {/* Mobile navigation */}
          <header className="sticky top-0 z-40 border-b border-white/10 bg-[#1b222c] md:hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <Link
                href="/"
                className="min-w-0 truncate text-base font-bold sm:text-lg"
              >
                T5 Mission Control
              </Link>
              <SidebarAccount />
            </div>
            <details className="border-t border-white/5">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[#a9cf9f]">
                Navigation
              </summary>

              <div className="max-h-[65vh] overflow-y-auto px-4 pb-5 pt-2">
                <Navigation />
              </div>
            </details>
          </header>

          {/* Page content */}
          <div className="min-h-screen min-w-0 bg-[#151b24] md:ml-64">
            <div className="hidden h-14 md:block">
              <div className="fixed right-6 top-2 z-50 lg:right-8">
                <SidebarAccount />
              </div>
            </div>
            {children}
          </div>

          <Analytics />
        </CloudAutoSave>
      </body>
    </html>
  );
}
