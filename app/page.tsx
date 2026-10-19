import Link from "next/link";

const sections = [
  {
    title: "Profit Calculator",
    description: "Compare mining sources, Magma value and estimated profit.",
    href: "/profit",
    region: "moon",
  },
  {
    title: "Drills",
    description: "View the full drill progression from Crater to Fusion.",
    href: "/drills",
    region: "moon",
  },
  {
    title: "Armor",
    description: "Track armor upgrades across Moon, Mars and Sun.",
    href: "/armor",
    region: "mars",
  },
  {
    title: "Helmets",
    description: "Track Space Helmet and Sunsuit Helmet progression.",
    href: "/helmets",
    region: "sun",
  },
  {
    title: "Cores",
    description: "Track Research, Power, refinery and mining cores.",
    href: "/cores",
    region: "mars",
  },
  {
    title: "Talismans",
    description: "Track your talisman progression and upgrade chains.",
    href: "/talismans",
    region: "sun",
  },
];

function getCardStyle(region: string) {
  if (region === "moon") {
    return "border-[#596f88] bg-[#34485e]";
  }

  if (region === "mars") {
    return "border-[#a56550] bg-[#6d4336]";
  }

  return "border-[#ad8a3f] bg-[#695824]";
}

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#1f2328] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <h1 className="text-4xl font-bold">
            T5 Tracker
          </h1>

          <p className="mt-2 max-w-2xl text-[#aab2bd]">
            Track your Tier 5 progression, upgrades, mining profit and
            requirements across Moon, Mars and Sun.
          </p>
        </div>

        <section>
          <h2 className="mb-4 text-xl font-semibold">
            Tools
          </h2>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {sections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className={`rounded-xl border p-6 transition hover:-translate-y-1 hover:brightness-110 ${getCardStyle(
                  section.region
                )}`}
              >
                <h3 className="text-xl font-bold">
                  {section.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#e1e5e9]">
                  {section.description}
                </p>

                <p className="mt-5 text-sm font-semibold">
                  Open →
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-xl border border-[#3f464d] bg-[#2a3037] p-6">
          <h2 className="text-xl font-semibold">
            Progression Overview
          </h2>

          <p className="mt-2 text-sm text-[#aab2bd]">
            use this area later for your current tier, ascension,
            recommended upgrade, completion percentage and next unlock.
          </p>
        </section>
      </div>
    </main>
  );
}