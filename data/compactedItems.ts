export type CompactedRequirement = {
  material: string;
  amount: number;
};

export type CompactedItem = {
  id: string;
  name: string;
  requirements: CompactedRequirement[];
  timeHours: number;
};

export const compactedItems: CompactedItem[] = [
  {
    id: "compactedLunarAlloy",
    name: "Compacted Lunar Alloy",
    requirements: [
      {
        material: "lunarFragment",
        amount: 64,
      },
      {
        material: "chisiliteShard",
        amount: 64,
      },
      {
        material: "basaltShard",
        amount: 64,
      },
      {
        material: "breccaPowder",
        amount: 64,
      },
    ],
    timeHours: 6,
  },

  {
    id: "compactedMartianAlloy",
    name: "Compacted Martian Alloy",
    requirements: [
      {
        material: "martianDust",
        amount: 16,
      },
      {
        material: "amberFragment",
        amount: 32,
      },
      {
        material: "ametrine",
        amount: 32,
      },
      {
        material: "rhodnite",
        amount: 32,
      },
    ],
    timeHours: 8,
  },

  {
    id: "compactedSolarAlloy",
    name: "Compacted Solar Alloy",
    requirements: [
      {
        material: "sunFragment",
        amount: 64,
      },
      {
        material: "fiber",
        amount: 64,
      },
      {
        material: "plasmaShard",
        amount: 64,
      },
    ],
    timeHours: 10,
  },

  {
    id: "compactedLevels",
    name: "Compacted Levels",
    requirements: [
      {
        material: "levels",
        amount: 1_000,
      },
    ],
    timeHours: 4,
  },

  {
    id: "compactedStarShards",
    name: "Compacted Star Shards",
    requirements: [
      {
        material: "starShards",
        amount: 2_000_000,
      },
    ],
    timeHours: 6.5,
  },

  {
    id: "compactedAsh",
    name: "Compacted Ash",
    requirements: [
      {
        material: "ash",
        amount: 10_000_000_000,
      },
    ],
    timeHours: 9,
  },

  {
    id: "compactedEventTokens",
    name: "Compacted Event Tokens",
    requirements: [
      {
        material: "candy",
        amount: 10_000,
      },
      {
        material: "serpentSkin",
        amount: 3_000,
      },
    ],
    timeHours: 10,
  },

  {
    id: "compactedCoins",
    name: "Compacted Coins",
    requirements: [
      {
        material: "coinsQd",
        amount: 1,
      },
    ],
    timeHours: 11,
  },

  {
    id: "compactedMagma",
    name: "Compacted Magma",
    requirements: [
      {
        material: "magma",
        amount: 5_000,
      },
    ],
    timeHours: 13.5,
  },

  {
    id: "compactedAscension",
    name: "Compacted Ascension",
    requirements: [
      {
        material: "ascensions",
        amount: 1_000,
      },
    ],
    timeHours: 16,
  },
];

/* =========================================================
   PLASMA COMPACTED ITEMS

   Plasma conversion is 1:1.

   These don't have their own base-material recipe.
   They require the matching normal compacted item.
   ========================================================= */

export const plasmaCompactedItems: Record<
  string,
  string
> = {
  plasmaCompactedLunarAlloy:
    "compactedLunarAlloy",

  plasmaCompactedMartianAlloy:
    "compactedMartianAlloy",

  plasmaCompactedSolarAlloy:
    "compactedSolarAlloy",

  plasmaCompactedMagma:
    "compactedMagma",
};

export function getCompactedItem(
  id: string
) {
  return compactedItems.find(
    (item) =>
      item.id === id
  );
}

export function getUnderlyingCompactedItem(
  material: string
) {
  const compactedId =
    plasmaCompactedItems[
      material
    ];

  if (!compactedId) {
    return undefined;
  }

  return getCompactedItem(
    compactedId
  );
}