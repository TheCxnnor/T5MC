"use client";

import { useEffect, useState } from "react";
import DashboardRecommendations from "../components/DashboardRecommendations";

type Source =
  | "helmets"
  | "drills"
  | "armor"
  | "talismans"
  | "misc"
  | "cores";

type Milestone = {
  source: Source;
  id: string;
  level?: number;
};

type Planet = {
  name: string;
  accent: string;
  background: string;
  border: string;
  milestones: Milestone[];
};

type SavedState = Record<string, unknown>;
type Progress = Record<Source, SavedState>;

function items(source: Source, ids: string[]): Milestone[] {
  return ids.map((id) => ({ source, id }));
}

function stars(prefix: string, first: number, last: number) {
  return Array.from(
    { length: last - first + 1 },
    (_, index) => `${prefix}-${first + index}-star`
  );
}

function coreLevels(id: string, maximum: number): Milestone[] {
  return Array.from({ length: maximum }, (_, index) => ({
    source: "cores",
    id,
    level: index + 1,
  }));
}

function armorPieces(tiers: string[]): Milestone[] {
  return items(
    "armor",
    tiers.flatMap((tier) =>
      ["spaceplate", "spacepants", "spaceboots"].map(
        (piece) => `${tier}:${piece}`
      )
    )
  );
}

const moonDrills = [
  "crater-drill",
  "satellite-drill",
  "serene-drill",
  "lunar-drill",
];

const marsDrills = [
  "dust-drill",
  "cold-drill",
  "arid-drill",
  "planetary-drill",
  "martian-drill",
];

const sunDrills = [
  "star-drill",
  "solar-drill",
  "corona-drill",
  "nova-drill",
  "fusion-drill",
];

const helmetOrder = [
  ...stars("space-helmet", 1, 15),
  "sunsuit-helmet-base",
  ...stars("sunsuit-helmet", 1, 5),
];

const drillOrder = [...moonDrills, ...marsDrills, ...sunDrills];

const planets: Planet[] = [
  {
    name: "Moon",
    accent: "text-[#b6cbed]",
    background: "bg-[#8ea9d6]",
    border: "border-[#8ea9d6]/30",
    milestones: [
      ...items("helmets", stars("space-helmet", 1, 6)),
      ...items("drills", moonDrills),
      ...coreLevels("basalt-refinery", 10),
      ...coreLevels("brecca-refinery", 10),
      ...coreLevels("moon-haste", 5),
      { source: "cores", id: "power", level: 2 },
      ...items("talismans", [
        "lunar-talisman",
        "moonstone-ring",
        "nightfall-relic",
        "eclipse-charm",
        "astral-pendant",
      ]),
      ...items("misc", [
        "improved-o2-tank",
        "advanced-o2-tank",
        "masterful-o2-tank",
        "moon-quickwarp",
        "ore-bag",
        "core-bag",
        "oxygen-auto-consumer",
        "pocket-forge",
      ]),
    ],
  },
  {
    name: "Mars",
    accent: "text-[#e5b38b]",
    background: "bg-[#d69868]",
    border: "border-[#d69868]/30",
    milestones: [
      ...items("helmets", [
        ...stars("space-helmet", 7, 15),
        "sunsuit-helmet-base",
      ]),
      ...armorPieces([
        "stardust",
        "voidcore",
        "nebulite",
        "etherealite",
        "astroflare",
        "eclipse",
      ]),
      ...items("drills", marsDrills),
      ...[1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 7500, 10000].map(
        (level): Milestone => ({
          source: "cores",
          id: "magmaStorage",
          level,
        })
      ),
      ...coreLevels("regolith", 10),
      ...coreLevels("amber-rock", 10),
      ...coreLevels("amber-crystal", 10),
      ...coreLevels("mars-haste", 5),
      { source: "cores", id: "power", level: 3 },
      ...items("talismans", [
        "block-counter",
        "crimson-talisman",
        "solar-ring",
        "ember-relic",
        "martian-charm",
      ]),
      ...items("misc", [
        "exquisite-o2-tank",
        "prestigious-o2-tank",
        "illustrious-o2-tank",
        "mars-quickwarp",
        "plant-bag",
        "solar-flare-detector",
      ]),
    ],
  },
  {
    name: "Sun",
    accent: "text-[#ebd88e]",
    background: "bg-[#d5bd62]",
    border: "border-[#d5bd62]/30",
    milestones: [
      ...items("helmets", stars("sunsuit-helmet", 1, 5)),
      ...armorPieces([
        "galactic",
        "supernova",
        "neutronic",
        "quasar",
        "pulsar",
        "cosmogenesis",
        "omniversal",
      ]),
      ...items("drills", sunDrills),
      ...coreLevels("crimson-plasma", 10),
      ...coreLevels("cosmic-fiber", 10),
      ...coreLevels("sun-haste", 5),
      ...items("talismans", [
        "solar-talisman",
        "sunstone-ring",
        "daybreak-relic",
        "flare-charm",
        "celestial-pendant",
      ]),
      ...items("misc", ["sun-quickwarp"]),
    ],
  },
];

const sources: Source[] = [
  "helmets",
  "drills",
  "armor",
  "talismans",
  "misc",
  "cores",
];

function readSavedProgress(source: Source): SavedState {
  try {
    const value: unknown = JSON.parse(
      window.localStorage.getItem(`t5-mission-control-${source}`) ?? "{}"
    );

    return value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
      ? (value as SavedState)
      : {};
  } catch {
    return {};
  }
}

function stringSet(value: unknown): Set<string> {
  return new Set(
    Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : []
  );
}

function sequentialProgress(value: unknown, order: string[]): Set<string> {
  const saved = stringSet(value);
  const highest = order.reduce(
    (result, id, index) => (saved.has(id) ? index : result),
    -1
  );

  return new Set(order.slice(0, highest + 1));
}

function numericValue(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallback;
}

function calculateProgress(progress: Progress) {
  const completed = {
    helmets: sequentialProgress(progress.helmets.completed, helmetOrder),
    drills: sequentialProgress(progress.drills.obtained, drillOrder),
    armor: stringSet(progress.armor.completedPieces),
    talismans: stringSet(progress.talismans.obtained),
    misc: stringSet(progress.misc.completed),
  };

  const savedLevels = progress.cores.selectedLevels;

  const coreLevels =
    savedLevels !== null &&
    typeof savedLevels === "object" &&
    !Array.isArray(savedLevels)
      ? (savedLevels as Record<string, unknown>)
      : {};

  return planets.map((planet) => {
    const count = planet.milestones.filter((milestone) => {
      if (milestone.source !== "cores") {
        return completed[milestone.source].has(milestone.id);
      }

      const current =
        milestone.id === "magmaStorage"
          ? numericValue(progress.cores.magmaStorage, 1000)
          : numericValue(
              coreLevels[milestone.id],
              milestone.id === "power" ? 1 : 0
            );

      return current >= (milestone.level ?? 0);
    }).length;

    const total = planet.milestones.length;

    return {
      ...planet,
      completed: count,
      total,
      percentage: (count / total) * 100,
    };
  });
}

type PlanetProgress = ReturnType<typeof calculateProgress>;

export default function HomePage() {
  const [progress, setProgress] = useState<PlanetProgress | null>(null);

  useEffect(() => {
    function refreshProgress() {
      const saved = Object.fromEntries(
        sources.map((source) => [source, readSavedProgress(source)])
      ) as Progress;

      setProgress(calculateProgress(saved));
    }

    function handleStorage(event: StorageEvent) {
      if (
        event.key === null ||
        sources.some(
          (source) => event.key === `t5-mission-control-${source}`
        )
      ) {
        refreshProgress();
      }
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        refreshProgress();
      }
    }

    refreshProgress();

    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", refreshProgress);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", refreshProgress);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <main className="min-h-screen bg-[#151b24] px-4 py-8 text-white md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a9cf9f]">
            Mission Control
          </p>

          <h1 className="mt-2 text-3xl font-bold md:text-4xl">
            Dashboard
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
            Track your progression across Moon, Mars and Sun.
            Each upgrade milestone contributes equally to its planet.
          </p>
        </div>

        <section aria-labelledby="planet-progress-title">
          <h2
            id="planet-progress-title"
            className="mb-4 text-xl font-semibold"
          >
            Planet Progression
          </h2>

          {progress === null ? (
            <p role="status" className="text-sm text-white/45">
              Loading saved progression…
            </p>
          ) : (
            <div className="space-y-4">
              {progress.map((planet) => (
                <article
                  key={planet.name}
                  className={`overflow-hidden rounded-2xl border bg-[#1b222c] ${planet.border}`}
                >
                  <div className="border-b border-white/10 px-5 py-4 md:px-6">
                    <h3 className={`text-lg font-bold ${planet.accent}`}>
                      {planet.name} Progress
                    </h3>
                  </div>

                  <div className="px-5 py-5 md:px-6">
                    <div className="mb-4 flex items-end justify-between gap-4">
                      <p className="text-sm text-white/45">
                        <span className="font-semibold text-white/80">
                          {planet.completed}
                        </span>{" "}
                        / {planet.total} milestones completed
                      </p>

                      <p
                        className={`text-3xl font-bold tabular-nums ${planet.accent}`}
                      >
                        {planet.percentage.toFixed(2)}%
                      </p>
                    </div>

                    <div
                      role="progressbar"
                      aria-label={`${planet.name} progression`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Number(planet.percentage.toFixed(2))}
                      aria-valuetext={`${planet.completed} of ${planet.total} milestones completed`}
                      className="h-3 overflow-hidden rounded-full bg-black/30"
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${planet.background}`}
                        style={{ width: `${planet.percentage}%` }}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        <DashboardRecommendations planets={planets} />
      </div>
    </main>
  );
}