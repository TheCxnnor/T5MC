export type HelmetRegion =
  | "space"
  | "sun";

export type HelmetRequirement = {
  material: string;
  amount: number;
  note?: string;
};

export type HelmetUpgrade = {
  id: string;
  name: string;
  region: HelmetRegion;
  stars: number;
  requirements: HelmetRequirement[];
};

export const helmets: HelmetUpgrade[] = [
  /* =======================================================
     SPACE HELMET
     ======================================================= */

  {
    id: "space-helmet-1-star",
    name: "Space Helmet 1★",
    region: "space",
    stars: 1,
    requirements: [
      {
        material: "coinsQd",
        amount: 1,
      },
      {
        material: "starShards",
        amount: 100_000,
      },
    ],
  },

  {
    id: "space-helmet-2-star",
    name: "Space Helmet 2★",
    region: "space",
    stars: 2,
    requirements: [
      {
        material: "lunarFragment",
        amount: 32,
      },
      {
        material: "basaltShard",
        amount: 16,
      },
    ],
  },

  {
    id: "space-helmet-3-star",
    name: "Space Helmet 3★",
    region: "space",
    stars: 3,
    requirements: [
      {
        material: "coinsQd",
        amount: 4,
      },
      {
        material: "starShards",
        amount: 1_000_000,
      },
    ],
  },

  {
    id: "space-helmet-4-star",
    name: "Space Helmet 4★",
    region: "space",
    stars: 4,
    requirements: [
      {
        material: "chisiliteShard",
        amount: 32,
      },
      {
        material: "breccaPowder",
        amount: 16,
      },
    ],
  },

  {
    id: "space-helmet-5-star",
    name: "Space Helmet 5★",
    region: "space",
    stars: 5,
    requirements: [
      {
        material: "lunarFragment",
        amount: 64,
      },
      {
        material: "basaltShard",
        amount: 32,
      },
    ],
  },

  {
    id: "space-helmet-6-star",
    name: "Space Helmet 6★",
    region: "space",
    stars: 6,
    requirements: [
      {
        material: "chisiliteShard",
        amount: 64,
      },
      {
        material: "breccaPowder",
        amount: 32,
      },
    ],
  },

  {
    id: "space-helmet-7-star",
    name: "Space Helmet 7★",
    region: "space",
    stars: 7,
    requirements: [
      {
        material: "regolithSoil",
        amount: 16,
      },
      {
        material: "sunflowerSeedGrown",
        amount: 1,
      },
    ],
  },

  {
    id: "space-helmet-8-star",
    name: "Space Helmet 8★",
    region: "space",
    stars: 8,
    requirements: [
      {
        material: "lunarFragment",
        amount: 64,
      },
      {
        material: "basaltShard",
        amount: 64,
      },
    ],
  },

  {
    id: "space-helmet-9-star",
    name: "Space Helmet 9★",
    region: "space",
    stars: 9,
    requirements: [
      {
        material: "chisiliteShard",
        amount: 64,
      },
      {
        material: "breccaPowder",
        amount: 64,
      },
    ],
  },

  {
    id: "space-helmet-10-star",
    name: "Space Helmet 10★",
    region: "space",
    stars: 10,
    requirements: [
      {
        material: "regolithSoil",
        amount: 32,
      },
      {
        material: "sunflowerSeedGrown",
        amount: 2,
      },
    ],
  },

  {
    id: "space-helmet-11-star",
    name: "Space Helmet 11★",
    region: "space",
    stars: 11,
    requirements: [
      {
        material: "souls",
        amount: 1_000,
      },
      {
        material: "mythicMysticSword",
        amount: 1,
      },
    ],
  },

  {
    id: "space-helmet-12-star",
    name: "Space Helmet 12★",
    region: "space",
    stars: 12,
    requirements: [
      {
        material: "regolithSoil",
        amount: 64,
      },
      {
        material: "sunflowerSeedGrown",
        amount: 3,
      },
    ],
  },

  {
    id: "space-helmet-13-star",
    name: "Space Helmet 13★",
    region: "space",
    stars: 13,
    requirements: [
      {
        material: "amberFragment",
        amount: 64,
      },
      {
        material: "ametrine",
        amount: 32,
      },
    ],
  },

  {
    id: "space-helmet-14-star",
    name: "Space Helmet 14★",
    region: "space",
    stars: 14,
    requirements: [
      {
        material: "coinsQd",
        amount: 10,
      },
      {
        material: "starShards",
        amount: 2_500_000,
      },
    ],
  },

  {
    id: "space-helmet-15-star",
    name: "Space Helmet 15★",
    region: "space",
    stars: 15,
    requirements: [
      {
        material: "souls",
        amount: 2_500,
      },
      {
        material: "mythicPants",
        amount: 1,
      },
    ],
  },

  /* =======================================================
     SUNSUIT HELMET
     ======================================================= */

  {
    id: "sunsuit-helmet-base",
    name: "Sunsuit Helmet",
    region: "sun",
    stars: 0,
    requirements: [
      {
        material: "chisiliteShard",
        amount: 128,
      },
      {
        material: "ametrine",
        amount: 256,
      },
      {
        material: "rhodnite",
        amount: 128,
      },
      {
        material: "starShards",
        amount: 10_000_000,
      },
    ],
  },

  {
    id: "sunsuit-helmet-1-star",
    name: "Sunsuit Helmet 1★",
    region: "sun",
    stars: 1,
    requirements: [
      {
        material: "plasmaShard",
        amount: 16,
      },
      {
        material: "plasmaCompactedLunarAlloy",
        amount: 1,
      },
    ],
  },

  {
    id: "sunsuit-helmet-2-star",
    name: "Sunsuit Helmet 2★",
    region: "sun",
    stars: 2,
    requirements: [
      {
        material: "fiber",
        amount: 16,
      },
      {
        material: "plasmaCompactedMartianAlloy",
        amount: 3,
      },
    ],
  },

  {
    id: "sunsuit-helmet-3-star",
    name: "Sunsuit Helmet 3★",
    region: "sun",
    stars: 3,
    requirements: [
      {
        material: "sunFragment",
        amount: 64,
      },
      {
        material: "plasmaCompactedSolarAlloy",
        amount: 4,
      },
    ],
  },

  {
    id: "sunsuit-helmet-4-star",
    name: "Sunsuit Helmet 4★",
    region: "sun",
    stars: 4,
    requirements: [
      {
        material: "plasmaCompactedMartianAlloy",
        amount: 16,
      },
      {
        material: "plasmaCompactedSolarAlloy",
        amount: 8,
      },
    ],
  },

  {
    id: "sunsuit-helmet-5-star",
    name: "Sunsuit Helmet 5★",
    region: "sun",
    stars: 5,
    requirements: [
      {
        material: "compactedCoins",
        amount: 16,
      },
      {
        material: "starShards",
        amount: 25_000_000,
      },
    ],
  },
];