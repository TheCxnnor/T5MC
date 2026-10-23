import { getCompactedItem, plasmaCompactedItems } from "../data/compactedItems";
import type { CoreCost } from "../data/coreProgression";
import { materials } from "../data/materials";
import { getCoreRecipe, prepareDisplayCosts } from "./coreRecipes";
import { formatHours, formatNumber } from "./format";
import { getMaterialLabel, type MaterialRequirement } from "./materials";

export const RAW_MATERIAL_GROUPS = [
  { id: "moon", title: "Moon Materials", materials: ["lunarFragment", "basaltShard", "chisiliteShard", "breccaPowder"] },
  { id: "mars", title: "Mars Materials", materials: ["martianDust", "rhodnite", "amberFragment", "ametrine"] },
  { id: "sun", title: "Sun Materials", materials: ["sunFragment", "plasmaShard", "fiber"] },
  { id: "currencies", title: "Currencies", materials: ["coins", "starShards", "ash", "magma", "levels", "ascensions", "candy", "serpentSkin"] },
  { id: "misc", title: "Misc Items", materials: ["redroot", "regolithSoil", "souls", "mythicMysticSword", "mythicPants", "martianBeans", "sunflowerSeedGrown", "coronaSurgeFlare", "stellarPulseFlare", "eternalSingularityFlare", "solarEmberFlare", "radiantNovaFlare"] },
] as const;

export type MaterialGroupId = (typeof RAW_MATERIAL_GROUPS)[number]["id"];

const CORE_NAMES: Readonly<Record<string, string>> = {
  researchCore1: "1★ Research Core",
  researchCore2: "2★ Research Core",
  researchCore3: "3★ Research Core",
  beaconCore1: "1★ Beacon Core",
  beaconCore2: "2★ Beacon Core",
  beaconCore3: "3★ Beacon Core",
  powerCore1: "Power Core 1★",
  powerCore2: "Power Core 2★",
  moltenCore: "Molten Core",
};

const CORE_LABELS: Readonly<Record<string, string>> = {
  researchCore1: "Research Core 1★",
  researchCore2: "Research Core 2★",
  researchCore3: "Research Core 3★",
  beaconCore1: "Beacon Core 1★",
  beaconCore2: "Beacon Core 2★",
  beaconCore3: "Beacon Core 3★",
  powerCore1: "Power Core 1★",
  powerCore2: "Power Core 2★",
  moltenCore: "Molten Core",
};

export function getTotalMaterialLabel(material: string) {
  if (CORE_LABELS[material]) return CORE_LABELS[material];
  if (material === "mythicMysticSword") return "Mythic Sword";

  const compactedId = plasmaCompactedItems[material];
  if (compactedId) return `Plasma (${getCompactedItem(compactedId)?.name ?? compactedId})`;

  return getMaterialLabel(material);
}

const NAME_TO_ID: Readonly<Record<string, string>> = {
  ...Object.fromEntries(
    [...Object.keys(materials), ...RAW_MATERIAL_GROUPS.flatMap(group => [...group.materials])]
      .map(id => [getTotalMaterialLabel(id), id]),
  ),
  ...Object.fromEntries(Object.entries(CORE_NAMES).map(([id, name]) => [name, id])),
  ...Object.fromEntries(Object.entries(CORE_LABELS).map(([id, label]) => [label, id])),
  "Qd Coins": "coinsQd",
  "T Coins": "coinsT",
  Coins: "coins",
};

function normalizeRequirement({ material, amount }: MaterialRequirement): MaterialRequirement {
  const id = NAME_TO_ID[material] ?? material;
  if (id === "coinsQd") return { material: "coins", amount: amount * 1e15 };
  if (id === "coinsT") return { material: "coins", amount: amount * 1e12 };
  return { material: id, amount };
}

function toRequirements(costs: CoreCost[]) {
  return costs.map(cost => normalizeRequirement({ material: cost.name, amount: cost.amount }));
}

/** Some core upgrade lists already include their recipe breakdown. Normalize one upgrade at a time. */
export function getDirectCoreRequirements(requirements: MaterialRequirement[]) {
  if (!requirements.some(req => CORE_NAMES[normalizeRequirement(req).material])) return requirements;

  const costs = requirements.map(requirement => {
    const { material, amount } = normalizeRequirement(requirement);
    return { name: CORE_NAMES[material] ?? getTotalMaterialLabel(material), amount };
  });
  return toRequirements(prepareDisplayCosts(costs));
}

export type CompactionTotal = MaterialRequirement & { timeHours: number };

export type MaterialSummary = {
  rawMaterials: MaterialRequirement[];
  groups: { id: MaterialGroupId; title: string; items: MaterialRequirement[] }[];
  compacted: MaterialRequirement[];
  plasma: MaterialRequirement[];
  cores: MaterialRequirement[];
  compaction: CompactionTotal[];
  totalCompactionHours: number;
};

function sortedRequirements(totals: Map<string, number>) {
  return [...totals].filter(([, amount]) => amount > 0)
    .map(([material, amount]) => ({ material, amount }))
    .sort((a, b) => getTotalMaterialLabel(a.material).localeCompare(getTotalMaterialLabel(b.material)));
}

export function getMaterialSummary(requirements: MaterialRequirement[]): MaterialSummary {
  const raw = new Map<string, number>();
  const compacted = new Map<string, number>();
  const plasma = new Map<string, number>();
  const cores = new Map<string, number>();
  const compaction = new Map<string, number>();
  const add = (totals: Map<string, number>, id: string, amount: number) =>
    totals.set(id, (totals.get(id) ?? 0) + amount);

  function expand(requirement: MaterialRequirement) {
    const { material, amount } = normalizeRequirement(requirement);
    if (amount <= 0) return;

    const plasmaSource = plasmaCompactedItems[material];
    const compactedItem = getCompactedItem(plasmaSource ?? material);
    if (compactedItem) {
      add(plasmaSource ? plasma : compacted, material, amount);
      // One compaction per requested item; plasma conversion consumes it 1:1.
      add(compaction, compactedItem.id, amount);
      compactedItem.requirements.forEach(ingredient => expand({
        material: ingredient.material,
        amount: ingredient.amount * amount,
      }));
      return;
    }

    const recipe = getCoreRecipe(CORE_NAMES[material] ?? material);
    if (recipe) {
      add(cores, material, amount);
      recipe.ingredients.forEach(ingredient => expand({
        material: ingredient.name,
        amount: ingredient.amount * amount,
      }));
      return;
    }

    add(raw, material, amount);
  }

  requirements.forEach(expand);

  const rawMaterials = sortedRequirements(raw);
  const assigned = new Set<string>();
  const groups = RAW_MATERIAL_GROUPS.map(group => {
    const known = group.materials as readonly string[];
    const items = known.flatMap(material => raw.has(material) ? [{ material, amount: raw.get(material)! }] : []);
    items.forEach(item => assigned.add(item.material));
    if (group.id === "misc") items.push(...rawMaterials.filter(item => !assigned.has(item.material)));
    return { id: group.id, title: group.title, items };
  }).filter(group => group.items.length > 0);

  const compactionTotals = sortedRequirements(compaction).map(item => ({
    ...item,
    timeHours: item.amount * getCompactedItem(item.material)!.timeHours,
  }));

  return {
    rawMaterials,
    groups,
    compacted: sortedRequirements(compacted),
    plasma: sortedRequirements(plasma),
    cores: sortedRequirements(cores),
    compaction: compactionTotals,
    totalCompactionHours: compactionTotals.reduce((total, item) => total + item.timeHours, 0),
  };
}

/** The Cores page already expands recipes; reuse its corrected totals without expanding them again. */
export function getCoreMaterialSummary(totals: { rawMaterials: CoreCost[]; craftedCores: CoreCost[] }): MaterialSummary {
  return {
    ...getMaterialSummary(toRequirements(totals.rawMaterials)),
    cores: toRequirements(totals.craftedCores)
      .sort((a, b) => getTotalMaterialLabel(a.material).localeCompare(getTotalMaterialLabel(b.material))),
  };
}

export function formatTotalMaterialValue(material: string, amount: number) {
  if (material === "coins") {
    const units = [[1e15, "Qd"], [1e12, "T"], [1e9, "B"], [1e6, "M"]] as const;
    for (const [scale, suffix] of units) {
      if (amount >= scale) return `${(amount / scale).toLocaleString(undefined, { maximumFractionDigits: 8 })}${suffix}`;
    }
  }
  return formatNumber(amount);
}

export function formatCompactionTime(timeHours: number) {
  return formatHours(timeHours);
}
