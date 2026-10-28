"use client";

import { useEffect, useState } from "react";
import { drills } from "../../data/drills";
import { armor } from "../../data/armor";
import { helmets } from "../../data/helmets";
import { talismans } from "../../data/talismans";
import { o2Tanks, quickwarps, miscItems } from "../../data/misc";
import { progressionCores } from "../../data/coreProgression";
import { getMaterialSummary, getDirectCoreRequirements, type MaterialSummary } from "../../lib/materialTotals";
import type { MaterialRequirement } from "../../lib/materials";
import { prepareDisplayCosts } from "../../lib/coreRecipes";
import { MaterialTotals } from "../../components/ui/MaterialTotals";

function readProgress(page: string): Record<string, unknown> {
  try {
    const value = JSON.parse(localStorage.getItem(`t5-mission-control-${page}`) ?? "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}
function completed(value: unknown): Set<string> {
  return new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : []);
}
function remainingLinear<T extends { id: string; requirements: MaterialRequirement[] }>(items: T[], done: Set<string>) {
  const highest = items.reduce((index, item, current) => done.has(item.id) ? current : index, -1);
  return items.slice(highest + 1).flatMap(item => item.requirements);
}
function calculateTotals() {
  const requirements: MaterialRequirement[] = [];
  requirements.push(...remainingLinear(drills, completed(readProgress("drills").obtained)));
  requirements.push(...remainingLinear(helmets, completed(readProgress("helmets").completed)));
  const armorDone = completed(readProgress("armor").completedPieces);
  for (const tier of armor) for (const piece of tier.pieces) {
    if (!armorDone.has(`${tier.id}:${piece.type}`)) requirements.push(...piece.requirements);
  }
  const talismansDone = completed(readProgress("talismans").obtained);
  requirements.push(...talismans.filter(item => !talismansDone.has(item.id)).flatMap(item => item.requirements));
  const miscDone = completed(readProgress("misc").completed);
  requirements.push(...[...o2Tanks, ...quickwarps, ...miscItems].filter(item => !miscDone.has(item.id))
    .flatMap(item => getDirectCoreRequirements(item.requirements)));
  const cores = readProgress("cores");
  const levels = cores.selectedLevels && typeof cores.selectedLevels === "object"
    ? cores.selectedLevels as Record<string, unknown> : {};
  for (const core of progressionCores) {
    const saved = levels[core.id];
    const selected = core.levels.some(level => level.level === saved) ? saved as number : core.levels[0].level;
    for (const level of core.levels.filter(level => level.level >= selected)) {
      requirements.push(...prepareDisplayCosts(level.nextCost).map(cost => ({ material: cost.name, amount: cost.amount })));
    }
  }
  const stages = [[1000,1],[1500,2],[2000,4],[2500,6],[3000,10],[3500,32],[4000,48],[4500,64],[5000,96],[7500,128],[10000,0]];
  const magma = stages.some(([storage]) => storage === cores.magmaStorage) ? cores.magmaStorage as number : 1000;
  requirements.push({ material: "moltenCore", amount: stages.filter(([storage]) => storage >= magma).reduce((sum, [, amount]) => sum + amount, 0) });
  return getMaterialSummary(requirements);
}

export default function CraftingPage() {
  const [summary, setSummary] = useState<MaterialSummary | null>(null);
  useEffect(() => {
    const refresh = () => setSummary(calculateTotals());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return (
    <main className="min-h-screen bg-[#151b24] px-4 py-8 text-white md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a9cf9f]">Crafting</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">Total Crafting Materials</h1>
        <p className="mt-2 mb-8 max-w-3xl text-sm text-white/50">All remaining requirements across Drills, Armor, Helmets, Talismans, Misc and Cores, based on progress saved in this browser.</p>
        {summary ? <MaterialTotals summary={summary} description="Combined remaining requirements across all six trackers. Plasma conversion and lower-star core recipes are included once." /> : <p role="status">Loading saved progress…</p>}
      </div>
    </main>
  );
}
