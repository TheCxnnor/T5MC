"use client";
import { useEffect, useMemo, useState } from "react";
import { drills } from "../data/drills";
import { helmets } from "../data/helmets";
import { armor } from "../data/armor";
import { talismans } from "../data/talismans";
import { o2Tanks, quickwarps, miscItems } from "../data/misc";
import { progressionCores } from "../data/coreProgression";
import { materials } from "../data/materials";
import { getHourlyMiningRates } from "../lib/mining";
import {
  getMaterialSummary,
  getDirectCoreRequirements,
  getTotalMaterialLabel,
} from "../lib/materialTotals";
import {
  getCompactedItem,
  getUnderlyingCompactedItem,
} from "../data/compactedItems";
import { getCoreRecipe, prepareDisplayCosts } from "../lib/coreRecipes";
import type { MaterialRequirement } from "../lib/materials";

type Milestone = { source: string; id: string; level?: number };
type Planet = { name: string; milestones: Milestone[] };
type Saved = Record<string, unknown>;
type Progress = Record<string, Saved>;
type Options = {
  ascension: number;
  includeRefineries: boolean;
  includeHaste: boolean;
  excludeAscensionLocked: boolean;
};
type Rate = ReturnType<typeof getHourlyMiningRates>[number];
type Candidate = {
  id: string;
  name: string;
  requirements: MaterialRequirement[];
};
const KEY = "t5-mission-control-recommendations";
const SOURCES = [
  "helmets",
  "drills",
  "armor",
  "talismans",
  "misc",
  "cores",
  "profit",
];
const UNLOCKS: Record<string, [number, number]> = {
  basalt: [6000, 1],
  brecca: [8000, 1],
  regolith: [10000, 2],
  "amber-rock": [12500, 2],
  "amber-crystal": [16000, 2],
  "crimson-plasma": [20000, 3],
  "cosmic-fiber": [30000, 3],
};
const MAGMA = [
  1000, 1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 7500, 10000,
];
const MAGMA_COST = [1, 2, 4, 6, 10, 32, 48, 64, 96, 128, 0];
const MINED = new Set([
  "lunarFragment",
  "basaltShard",
  "chisiliteShard",
  "breccaPowder",
  "martianDust",
  "regolithSoil",
  "rhodnite",
  "amberFragment",
  "ametrine",
  "sunFragment",
  "plasmaShard",
  "fiber",
]);
const IDS = Object.fromEntries(
  Object.entries(materials).map(([id, item]) => [item.name, id]),
) as Record<string, string>;
const VALUES = Object.fromEntries(
  Object.entries(materials).map(([id, item]) => [
    id,
    "magmaValue" in item ? Number(item.magmaValue) : 0,
  ]),
) as Record<string, number>;
function read(key: string): Saved {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(key) ?? "{}");
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Saved) : {};
  } catch {
    return {};
  }
}
function number(v: unknown, fallback = 0) {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function set(v: unknown) {
  return new Set(
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [],
  );
}
function levels(p: Progress): Record<string, number> {
  const v = p.cores.selectedLevels;
  return v && typeof v === "object" && !Array.isArray(v)
    ? (Object.fromEntries(
        Object.entries(v).filter(
          ([, n]) => typeof n === "number" && Number.isFinite(n),
        ),
      ) as Record<string, number>)
    : {};
}
function next<T extends { id: string }>(entries: T[], done: Set<string>) {
  return entries[
    entries.reduce(
      (highest, item, index) => (done.has(item.id) ? index : highest),
      -1,
    ) + 1
  ];
}
function candidate(m: Milestone, p: Progress, o: Options): Candidate | null {
  const { source, id } = m;
  if (source === "drills" || source === "helmets") {
    const item =
      source === "drills"
        ? next(drills, set(p.drills.obtained))
        : next(helmets, set(p.helmets.completed));
    return item?.id === id
      ? { id, name: item.name, requirements: item.requirements }
      : null;
  }
  if (source === "armor") {
    const [tierId, type] = id.split(":");
    const done = set(p.armor.completedPieces);
    const tier = armor.find(
      (t) =>
        t.pieces.some((piece) => piece.type === type) &&
        !done.has(`${t.id}:${type}`),
    );
    const piece = tier?.pieces.find((piece) => piece.type === type);
    return tier?.id === tierId && piece
      ? {
          id,
          name: `${tier.name} ${piece.name}`,
          requirements: piece.requirements,
        }
      : null;
  }
  if (source === "talismans") {
    const item = talismans.find((item) => item.id === id);
    return item && !set(p.talismans.obtained).has(id)
      ? { id, name: item.name, requirements: item.requirements }
      : null;
  }
  if (source === "misc") {
    const completedItems = set(p.misc.completed);
    const tankIndex = o2Tanks.findIndex((tank) => tank.id === id);
    if (
      tankIndex > 0 &&
      o2Tanks.slice(0, tankIndex).some((tank) => !completedItems.has(tank.id))
    )
      return null;
    const item = [...o2Tanks, ...quickwarps, ...miscItems].find(
      (item) => item.id === id,
    );
    if (!item || set(p.misc.completed).has(id)) return null;
    return {
      id,
      name: id.endsWith("-o2-tank")
        ? `${item.name} O₂ Tank`
        : id.endsWith("-quickwarp")
          ? `${item.name} Quickwarp`
          : item.name,
      requirements: getDirectCoreRequirements(item.requirements),
    };
  }
  if (source !== "cores") return null;
  if (id === "magmaStorage") {
    const i = MAGMA.indexOf(number(p.cores.magmaStorage, 1000));
    return i >= 0 && MAGMA[i + 1] === m.level
      ? {
          id: `magma-${m.level}`,
          name: `Magma Storage → ${m.level?.toLocaleString()}`,
          requirements: [{ material: "moltenCore", amount: MAGMA_COST[i] }],
        }
      : null;
  }
  const core = progressionCores.find((core) => core.id === id);
  if (
    !core ||
    (id !== "power" &&
      (id.endsWith("-haste") ? !o.includeHaste : !o.includeRefineries))
  )
    return null;
  const i = core.levels.findIndex(
    (level) => level.level === (levels(p)[id] ?? core.levels[0].level),
  );
  if (i < 0 || core.levels[i + 1]?.level !== m.level) return null;
  return {
    id: `${id}-${m.level}`,
    name:
      id === "power"
        ? `Power Rank → T5 P${m.level}`
        : `${core.name} → Level ${m.level}`,
    requirements: prepareDisplayCosts(core.levels[i].nextCost).map((cost) => ({
      material: cost.name,
      amount: cost.amount,
    })),
  };
}
function requiredMagmaCapacity(requirements: MaterialRequirement[]): number {
  const directMagma = requirements.reduce(
    (total, requirement) =>
      requirement.material === "magma" || requirement.material === "Magma"
        ? total + Math.max(0, requirement.amount)
        : total,
    0,
  );
  let craftingCapacity = 0;
  for (const requirement of requirements) {
    if (requirement.amount <= 0) continue;
    const compacted =
      getCompactedItem(requirement.material) ??
      getUnderlyingCompactedItem(requirement.material);
    if (compacted) {
      craftingCapacity = Math.max(
        craftingCapacity,
        requiredMagmaCapacity(compacted.requirements),
      );
      continue;
    }
    const core =
      getCoreRecipe(requirement.material) ??
      getCoreRecipe(getTotalMaterialLabel(requirement.material));
    if (core) {
      craftingCapacity = Math.max(
        craftingCapacity,
        requiredMagmaCapacity(
          core.ingredients.map((ingredient) => ({
            material: ingredient.name,
            amount: ingredient.amount,
          })),
        ),
      );
    }
  }
  return Math.max(directMagma, craftingCapacity);
}
function estimate(item: Candidate, rates: Rate[]) {
  const summary = getMaterialSummary(item.requirements);
  const needs = Object.fromEntries(
    summary.rawMaterials
      .filter(
        (item) =>
          MINED.has(item.material) ||
          ["coins", "magma"].includes(item.material),
      )
      .map((item) => [item.material, item.amount]),
  );
  const balance: Record<string, number> = {};
  const plan: { name: string; hours: number }[] = [];
  let hours = 0;
  const drops = (r: Rate) =>
    Object.fromEntries(
      r.drops.map((d) => [IDS[d.material] ?? d.material, d.expectedPerHour]),
    );
  function mine(r: Rate, t: number) {
    if (t <= 0) return;
    hours += t;
    balance.coins = (balance.coins ?? 0) + r.netProfitPerHour * t;
    for (const [id, n] of Object.entries(drops(r)))
      balance[id] = (balance[id] ?? 0) + n * t;
    const step = plan.find((s) => s.name === r.name);
    if (step) step.hours += t;
    else plan.push({ name: r.name, hours: t });
  }
  const raw = Object.entries(needs)
    .filter(([id]) => MINED.has(id))
    .map(([id, amount]) => ({
      id,
      amount,
      best: Math.max(0, ...rates.map((r) => drops(r)[id] ?? 0)),
    }))
    .sort((a, b) => b.amount / b.best - a.amount / a.best);
  for (const need of raw) {
    const missing = Math.max(0, need.amount - (balance[need.id] ?? 0));
    if (!missing) continue;
    const best = [...rates].sort(
      (a, b) => (drops(b)[need.id] ?? 0) - (drops(a)[need.id] ?? 0),
    )[0];
    if (!best || !(drops(best)[need.id] > 0)) return null;
    mine(best, missing / drops(best)[need.id]);
  }
  const coins = Math.max(0, (needs.coins ?? 0) - (balance.coins ?? 0));
  if (coins) {
    const best = [...rates].sort(
      (a, b) => b.netProfitPerHour - a.netProfitPerHour,
    )[0];
    if (!best || best.netProfitPerHour <= 0) return null;
    mine(best, coins / best.netProfitPerHour);
  }
  const surplus = Object.entries(balance).reduce(
    (total, [id, n]) =>
      total + Math.max(0, n - (needs[id] ?? 0)) * (VALUES[id] ?? 0),
    0,
  );
  const magma = Math.max(0, (needs.magma ?? 0) - surplus);
  if (magma) {
    const best = [...rates].sort((a, b) => b.magmaPerHour - a.magmaPerHour)[0];
    if (!best || best.magmaPerHour <= 0) return null;
    mine(best, magma / best.magmaPerHour);
  }
  const finalCoins = Math.max(0, (needs.coins ?? 0) - (balance.coins ?? 0));
  if (finalCoins) {
    const best = [...rates].sort(
      (a, b) => b.netProfitPerHour - a.netProfitPerHour,
    )[0];
    if (!best || best.netProfitPerHour <= 0) return null;
    mine(best, finalCoins / best.netProfitPerHour);
  }
  return {
    hours: hours + summary.totalCompactionHours,
    miningHours: hours,
    compactionHours: summary.totalCompactionHours,
    plan,
  };
}
function estimateWithAscension(
  item: Candidate,
  availableRates: Rate[],
  ascension: number,
  includeLocked: boolean,
) {
  const unlockedRates = availableRates.filter(
    (r) => UNLOCKS[r.id][0] <= ascension,
  );
  const current = estimate(item, unlockedRates);
  if (current) return { ...current, requiredAscension: null as number | null };
  if (!includeLocked) return null;
  const thresholds = [...new Set(availableRates.map((r) => UNLOCKS[r.id][0]))]
    .filter((value) => value > ascension)
    .sort((a, b) => a - b);
  for (const threshold of thresholds) {
    const result = estimate(
      item,
      availableRates.filter((r) => UNLOCKS[r.id][0] <= threshold),
    );
    if (result) return { ...result, requiredAscension: threshold };
  }
  return null;
}
function duration(h: number) {
  const m = Math.ceil(Math.max(0, h) * 60);
  return `${Math.floor(m / 60).toLocaleString()}h ${String(m % 60).padStart(2, "0")}m`;
}
export default function DashboardRecommendations({
  planets,
}: {
  planets: Planet[];
}) {
  const [saved, setSaved] = useState<Progress | null>(null);
  const [options, setOptions] = useState<Options>({
    ascension: 0,
    includeRefineries: false,
    includeHaste: false,
    excludeAscensionLocked: true,
  });
  useEffect(() => {
    const o = read(KEY);
    setOptions({
      ascension: Math.max(0, number(o.ascension)),
      includeRefineries: o.includeRefineries === true,
      includeHaste: o.includeHaste === true,
      excludeAscensionLocked: o.excludeAscensionLocked !== false,
    });
    const refresh = () =>
      setSaved(
        Object.fromEntries(
          SOURCES.map((s) => [s, read(`t5-mission-control-${s}`)]),
        ),
      );
    const visible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);
  function update(change: Partial<Options>) {
    const value = { ...options, ...change };
    setOptions(value);
    try {
      localStorage.setItem(KEY, JSON.stringify(value));
    } catch {
      /* Remain usable without persistence. */
    }
  }
  const results = useMemo(() => {
    if (!saved) return null;
    const current = levels(saved);
    const power = current.power ?? 1;
    const powerRates = getHourlyMiningRates(saved.profit, current).filter(
      (r) => UNLOCKS[r.id] && power >= UNLOCKS[r.id][1],
    );
    const rates = powerRates.filter(
      (r) => options.ascension >= UNLOCKS[r.id][0],
    );
    return planets.map((p) => {
      const planetUnlocked =
        p.name === "Moon" || (p.name === "Mars" ? power >= 2 : power >= 3);
      const candidates = (planetUnlocked ? p.milestones : [])
        .map((m) => candidate(m, saved, options))
        .filter((x): x is Candidate => x !== null);
      const estimates = candidates
        .flatMap((item) => {
          const magmaStorage = number(saved.cores.magmaStorage, 1000);
          if (requiredMagmaCapacity(item.requirements) > magmaStorage)
            return [];
          const time = estimateWithAscension(
            item,
            powerRates,
            options.ascension,
            !options.excludeAscensionLocked,
          );
          return time ? [{ item, ...time }] : [];
        })
        .sort((a, b) => a.hours - b.hours);
      return {
        planet: p.name,
        best: estimates[0],
        remaining: candidates.length,
        unlocked: rates.length,
        planetUnlocked,
      };
    });
  }, [saved, options, planets]);
  return (
    <section className="mt-8" aria-labelledby="recommendations-title">
      <h2 id="recommendations-title" className="text-xl font-semibold">
        Next Recommended Upgrades
      </h2>
      <div className="mt-4 rounded-2xl border border-white/10 bg-[#1b222c] p-5">
        <div className="flex flex-wrap items-end gap-6">
          <label className="block text-sm">
            <span className="mb-2 block text-xs uppercase tracking-wider text-white/50">
              Your Ascension
            </span>
            <input
              type="number"
              min={0}
              step={1}
              value={options.ascension}
              onChange={(e) =>
                update({
                  ascension: Math.max(
                    0,
                    Math.floor(Number(e.target.value) || 0),
                  ),
                })
              }
              className="w-48 rounded-xl border border-white/15 bg-[#151b24] px-3 py-2.5 outline-none focus:border-[#a9cf9f]"
            />
          </label>
          <label className="flex items-center gap-2 py-3 text-sm text-white/70">
            <input
              type="checkbox"
              checked={options.includeRefineries}
              onChange={(e) => update({ includeRefineries: e.target.checked })}
              className="accent-[#a9cf9f]"
            />
            Include refinery upgrades
          </label>
          <label className="flex items-center gap-2 py-3 text-sm text-white/70">
            <input
              type="checkbox"
              checked={options.includeHaste}
              onChange={(e) => update({ includeHaste: e.target.checked })}
              className="accent-[#a9cf9f]"
            />
            Include haste upgrades
          </label>
          <label className="flex items-center gap-2 py-3 text-sm text-white/70">
            <input
              type="checkbox"
              checked={options.excludeAscensionLocked}
              onChange={(e) =>
                update({ excludeAscensionLocked: e.target.checked })
              }
              className="accent-[#a9cf9f]"
            />
            Exclude ascension-locked upgrades
          </label>
        </div>
        <p className="mt-3 text-xs leading-5 text-white/40">
          These options affect recommendations only. Refinery and haste upgrades
          still count towards planet progression.
        </p>
      </div>
      {!results ? (
        <p role="status" className="mt-4 text-sm text-white/45">
          Loading recommendations…
        </p>
      ) : (
        <div className="mt-4 grid gap-4 xl:grid-cols-3">
          {results.map((r) => {
            const accent =
              r.planet === "Moon"
                ? "text-[#b6cbed]"
                : r.planet === "Mars"
                  ? "text-[#e5b38b]"
                  : "text-[#ebd88e]";
            return (
              <article
                key={r.planet}
                className="rounded-2xl border border-white/15 bg-[#1b222c] p-5"
              >
                <h3 className={`text-xl font-bold ${accent}`}>{r.planet}</h3>
                {r.best ? (
                  <>
                    <p className="mt-5 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                      Next Recommended Upgrade
                    </p>
                    <p className="mt-2 text-lg font-bold">{r.best.item.name}</p>
                    {r.best.requiredAscension !== null && (
                      <p className="mt-3 rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-sm text-amber-200">
                        Locked — requires{" "}
                        {r.best.requiredAscension.toLocaleString()} Ascension.
                        Estimated time below applies after unlocking and
                        excludes earning Ascension.
                      </p>
                    )}
                    <p
                      className={`mt-3 text-2xl font-bold tabular-nums ${accent}`}
                    >
                      {duration(r.best.hours)}
                    </p>
                    <p className="mt-1 text-xs text-white/40">
                      Mining: {duration(r.best.miningHours)} · Compaction:{" "}
                      {duration(r.best.compactionHours)}
                    </p>
                    <div className="mt-5 border-t border-white/10 pt-4">
                      <h4 className="text-[10px] uppercase tracking-wider text-white/40">
                        What to Mine
                      </h4>
                      {r.best.plan.length ? (
                        <ol className="mt-3 space-y-2">
                          {r.best.plan.map((s) => (
                            <li
                              key={s.name}
                              className="flex justify-between gap-3 text-sm"
                            >
                              <span className="text-white/75">{s.name}</span>
                              <span className="shrink-0 font-semibold tabular-nums">
                                {duration(s.hours)}
                              </span>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="mt-3 text-sm text-white/60">
                          No mining needed for the counted costs.
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="mt-5 text-sm leading-6 text-white/50">
                    {!r.planetUnlocked
                      ? "This planet is locked by your saved Power Rank."
                      : !r.unlocked
                        ? "No ores unlocked. Enter your Ascension and check your saved Power Rank."
                        : !r.remaining
                          ? "No remaining eligible upgrades with the current options."
                          : "Remaining upgrades need more Magma Storage or materials from ores you have not unlocked yet."}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
      <p className="mt-4 text-xs leading-5 text-white/40">
        Estimates start with no inventory or coins and use hourly Profit
        Calculator rates. Mining credits coins and drops together; surplus drops
        can supply Magma. Compaction is added afterwards. Souls, Ash,
        Star-Shards, equipment and other non-mining costs are ignored. Routes
        are estimates rather than guaranteed optimal schedules.
      </p>
    </section>
  );
}
