export type MiscRequirement = {
  material: string;
  amount: number;
};

export type O2Tank = {
  id: string;
  name: string;
  requirements: MiscRequirement[];
};

export type Quickwarp = {
  id: string;
  name: string;
  region: "moon" | "mars" | "sun";
  requirements: MiscRequirement[];
};

export type MiscItem = {
  id: string;
  name: string;
  requirements: MiscRequirement[];
};

/* =========================================================
   O2 TANKS
   ========================================================= */

export const o2Tanks: O2Tank[] = [
  {
    id: "improved-o2-tank",
    name: "Improved",
    requirements: [
      {
        material: "lunarFragment",
        amount: 16,
      },
      {
        material: "chisiliteShard",
        amount: 8,
      },
      {
        material: "magma",
        amount: 150,
      },
    ],
  },

  {
    id: "advanced-o2-tank",
    name: "Advanced",
    requirements: [
      {
        material: "chisiliteShard",
        amount: 16,
      },
      {
        material: "basaltShard",
        amount: 8,
      },
      {
        material: "magma",
        amount: 300,
      },
    ],
  },

  {
    id: "masterful-o2-tank",
    name: "Masterful",
    requirements: [
      {
        material: "basaltShard",
        amount: 16,
      },
      {
        material: "breccaPowder",
        amount: 16,
      },
      {
        material: "magma",
        amount: 600,
      },
    ],
  },

  {
    id: "exquisite-o2-tank",
    name: "Exquisite",
    requirements: [
      {
        material: "basaltShard",
        amount: 32,
      },
      {
        material: "breccaPowder",
        amount: 32,
      },
      {
        material: "amberFragment",
        amount: 16,
      },
      {
        material: "magma",
        amount: 1_500,
      },
    ],
  },

  {
    id: "prestigious-o2-tank",
    name: "Prestigious",
    requirements: [
      {
        material: "amberFragment",
        amount: 32,
      },
      {
        material: "martianDust",
        amount: 16,
      },
      {
        material: "magma",
        amount: 5_000,
      },
    ],
  },

  {
    id: "illustrious-o2-tank",
    name: "Illustrious",
    requirements: [
      {
        material: "amberFragment",
        amount: 64,
      },
      {
        material: "ametrine",
        amount: 64,
      },
      {
        material: "martianDust",
        amount: 32,
      },
      {
        material: "rhodnite",
        amount: 8,
      },
      {
        material: "magma",
        amount: 10_000,
      },
    ],
  },
];

/* =========================================================
   QUICKWARPS
   ========================================================= */

export const quickwarps: Quickwarp[] = [
  {
    id: "moon-quickwarp",
    name: "Moon",
    region: "moon",
    requirements: [
      {
        material: "basaltShard",
        amount: 16,
      },
      {
        material: "breccaPowder",
        amount: 16,
      },
    ],
  },

  {
    id: "mars-quickwarp",
    name: "Mars",
    region: "mars",
    requirements: [
      {
        material: "rhodnite",
        amount: 64,
      },
    ],
  },

  {
    id: "sun-quickwarp",
    name: "Sun",
    region: "sun",
    requirements: [
      {
        material: "plasmaShard",
        amount: 16,
      },
      {
        material: "fiber",
        amount: 16,
      },
    ],
  },
];

/* =========================================================
   OTHER ITEMS
   ========================================================= */

export const miscItems: MiscItem[] = [
  {
    id: "ore-bag",
    name: "Ore Bag",
    requirements: [
      {
        material: "coinsT",
        amount: 500,
      },
      {
        material: "lunarFragment",
        amount: 24,
      },
      {
        material: "chisiliteShard",
        amount: 12,
      },
      {
        material: "basaltShard",
        amount: 4,
      },
      {
        material: "breccaPowder",
        amount: 4,
      },
    ],
  },

  {
    id: "core-bag",
    name: "Core Bag",
    requirements: [
      {
        material: "coinsT",
        amount: 100,
      },
      {
        material: "researchCore1",
        amount: 1,
      },
      {
        material: "lunarFragment",
        amount: 16,
      },
      {
        material: "chisiliteShard",
        amount: 8,
      },
      {
        material: "magma",
        amount: 500,
      },
    ],
  },

  {
    id: "plant-bag",
    name: "Plant Bag",
    requirements: [
      {
        material: "coinsT",
        amount: 750,
      },
      {
        material: "regolithSoil",
        amount: 16,
      },
      {
        material: "redroot",
        amount: 1,
      },
    ],
  },

  {
    id: "oxygen-auto-consumer",
    name: "Oxygen Auto-Consumer",
    requirements: [
      {
        material: "lunarFragment",
        amount: 64,
      },
      {
        material: "chisiliteShard",
        amount: 16,
      },
      {
        material: "magma",
        amount: 500,
      },
      {
        material: "ash",
        amount: 100_000_000,
      },
    ],
  },

  {
    id: "pocket-forge",
    name: "Pocket Forge",
    requirements: [
      {
        material: "lunarFragment",
        amount: 8,
      },
      {
        material: "chisiliteShard",
        amount: 8,
      },
      {
        material: "magma",
        amount: 200,
      },
    ],
  },

  {
    id: "solar-flare-detector",
    name: "Solar Flare Detector",
    requirements: [
      {
        material: "starShards",
        amount: 5_000_000,
      },
      {
        material: "ametrine",
        amount: 128,
      },
      {
        material: "amberFragment",
        amount: 128,
      },
      {
        material: "martianDust",
        amount: 128,
      },
      {
        material: "rhodnite",
        amount: 128,
      },
    ],
  },
];