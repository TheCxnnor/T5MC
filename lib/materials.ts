import {
  compactedItems,
  getCompactedItem,
  getUnderlyingCompactedItem,
  plasmaCompactedItems,
  type CompactedItem,
} from "../data/compactedItems";
import { materials } from "../data/materials";

export type MaterialRequirement = {
  material: string;
  amount: number;
};

export type ExpandedRequirement = {
  compactedItem: CompactedItem;
  isPlasma: boolean;
  amount: number;
  ingredients: MaterialRequirement[];
  timeHours: number;
};

const MATERIAL_LABELS: Readonly<Record<string, string>> = {
  ...Object.fromEntries(
    Object.entries(materials).map(([id, material]) => [id, material.name]),
  ),
  ...Object.fromEntries(compactedItems.map((item) => [item.id, item.name])),
  ...Object.fromEntries(
    Object.entries(plasmaCompactedItems).map(([id, compactedId]) => [
      id,
      `Plasma ${getCompactedItem(compactedId)?.name ?? compactedId}`,
    ]),
  ),
  coinsQd: "Coins",
  coinsT: "Coins",
  starShards: "Star-Shards",
  levels: "Levels",
  ash: "Ash",
  candy: "Candy",
  serpentSkin: "Serpent Skin",
  ascensions: "Ascensions",
  sunflowerSeedGrown: "Sunflower Seed (Grown)",
  souls: "Souls",
  mythicMysticSword: "Mythic (Mystic) Sword",
  mythicPants: "Mythic Pants",
  solarEmberFlare: "Solar Ember Flare",
  radiantNovaFlare: "Radiant Nova Flare",
  researchCore1: "Research Core 1★",
  redroot: "Redroot",
};

export function getMaterialLabel(
  material: string,
  overrides: Readonly<Record<string, string>> = {},
) {
  return (
    overrides[material] ??
    MATERIAL_LABELS[material] ??
    material
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (character) => character.toUpperCase())
  );
}

export function getExpandedRequirement(
  requirement: MaterialRequirement,
): ExpandedRequirement | null {
  const direct = getCompactedItem(requirement.material);
  const compactedItem = direct ?? getUnderlyingCompactedItem(requirement.material);

  if (!compactedItem) {
    return null;
  }

  return {
    compactedItem,
    isPlasma: !direct,
    amount: requirement.amount,
    ingredients: compactedItem.requirements.map((ingredient) => ({
      material: ingredient.material,
      amount: ingredient.amount * requirement.amount,
    })),
    timeHours: compactedItem.timeHours * requirement.amount,
  };
}
