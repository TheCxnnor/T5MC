export type TalismanRegion =
  | "moon"
  | "mars"
  | "sun";

export type TalismanRequirement = {
  material: string;
  amount: number;
};

export type Talisman = {
  id: string;
  name: string;
  region: TalismanRegion;
  requirements: TalismanRequirement[];
};

export const talismans: Talisman[] = [
  /* =======================================================
     MOON TALISMANS
     ======================================================= */

  {
    id: "lunar-talisman",
    name: "Lunar Talisman",
    region: "moon",

    requirements: [
      {
        material: "starShards",
        amount: 1_000_000,
      },
      {
        material: "lunarFragment",
        amount: 32,
      },
      {
        material: "chisiliteShard",
        amount: 16,
      },
    ],
  },

  {
    id: "moonstone-ring",
    name: "Moonstone Ring",
    region: "moon",

    requirements: [
      {
        material: "starShards",
        amount: 1_000_000,
      },
      {
        material: "lunarFragment",
        amount: 64,
      },
      {
        material: "chisiliteShard",
        amount: 32,
      },
    ],
  },

  {
    id: "nightfall-relic",
    name: "Nightfall Relic",
    region: "moon",

    requirements: [
      {
        material: "starShards",
        amount: 1_000_000,
      },
      {
        material: "chisiliteShard",
        amount: 64,
      },
      {
        material: "basaltShard",
        amount: 16,
      },
    ],
  },

  {
    id: "eclipse-charm",
    name: "Eclipse Charm",
    region: "moon",

    requirements: [
      {
        material: "starShards",
        amount: 1_000_000,
      },
      {
        material: "basaltShard",
        amount: 32,
      },
      {
        material: "breccaPowder",
        amount: 16,
      },
    ],
  },

  {
    id: "astral-pendant",
    name: "Astral Pendant",
    region: "moon",

    requirements: [
      {
        material: "starShards",
        amount: 1_000_000,
      },
      {
        material: "basaltShard",
        amount: 64,
      },
      {
        material: "breccaPowder",
        amount: 32,
      },
    ],
  },

  /* =======================================================
     MARS TALISMANS
     ======================================================= */

  {
    id: "block-counter",
    name: "Block Counter",
    region: "mars",

    requirements: [
      {
        material: "starShards",
        amount: 1_000_000,
      },
      {
        material: "coinsQd",
        amount: 4.5,
      },
    ],
  },

  {
    id: "crimson-talisman",
    name: "Crimson Talisman",
    region: "mars",

    requirements: [
      {
        material: "starShards",
        amount: 2_500_000,
      },
      {
        material: "martianDust",
        amount: 16,
      },
      {
        material: "rhodnite",
        amount: 16,
      },
    ],
  },

  {
    id: "solar-ring",
    name: "Solar Ring",
    region: "mars",

    requirements: [
      {
        material: "starShards",
        amount: 2_500_000,
      },
      {
        material: "rhodnite",
        amount: 32,
      },
      {
        material: "martianDust",
        amount: 32,
      },
      {
        material: "amberFragment",
        amount: 16,
      },
    ],
  },

  {
    id: "ember-relic",
    name: "Ember Relic",
    region: "mars",

    requirements: [
      {
        material: "starShards",
        amount: 2_500_000,
      },
      {
        material: "rhodnite",
        amount: 64,
      },
      {
        material: "martianDust",
        amount: 64,
      },
      {
        material: "amberFragment",
        amount: 32,
      },
    ],
  },

  {
    id: "martian-charm",
    name: "Martian Charm",
    region: "mars",

    requirements: [
      {
        material: "starShards",
        amount: 2_500_000,
      },
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
        amount: 64,
      },
      {
        material: "rhodnite",
        amount: 64,
      },
    ],
  },

  /* =======================================================
     SUN TALISMANS
     ======================================================= */

  {
    id: "solar-talisman",
    name: "Solar Talisman",
    region: "sun",

    requirements: [
      {
        material: "starShards",
        amount: 5_000_000,
      },
      {
        material: "sunFragment",
        amount: 32,
      },
      {
        material: "plasmaShard",
        amount: 16,
      },
    ],
  },

  {
    id: "sunstone-ring",
    name: "Sunstone Ring",
    region: "sun",

    requirements: [
      {
        material: "starShards",
        amount: 5_000_000,
      },
      {
        material: "sunFragment",
        amount: 64,
      },
      {
        material: "plasmaShard",
        amount: 24,
      },
      {
        material: "fiber",
        amount: 16,
      },
    ],
  },

  {
    id: "daybreak-relic",
    name: "Daybreak Relic",
    region: "sun",

    requirements: [
      {
        material: "starShards",
        amount: 2_000_000,
      },
      {
        material: "plasmaShard",
        amount: 32,
      },
      {
        material: "fiber",
        amount: 32,
      },
      {
        material: "solarEmberFlare",
        amount: 2,
      },
      {
        material: "compactedStarShards",
        amount: 1,
      },
    ],
  },

  {
    id: "flare-charm",
    name: "Flare Charm",
    region: "sun",

    requirements: [
      {
        material: "plasmaShard",
        amount: 48,
      },
      {
        material: "fiber",
        amount: 48,
      },
      {
        material: "solarEmberFlare",
        amount: 4,
      },
      {
        material: "compactedSolarAlloy",
        amount: 1,
      },
      {
        material: "compactedStarShards",
        amount: 1,
      },
      {
        material: "plasmaCompactedStarShards",
        amount: 1,
      },
    ],
  },

  {
    id: "celestial-pendant",
    name: "Celestial Pendant",
    region: "sun",

    requirements: [
      {
        material: "plasmaShard",
        amount: 64,
      },
      {
        material: "fiber",
        amount: 64,
      },
      {
        material: "compactedSolarAlloy",
        amount: 2,
      },
      {
        material: "radiantNovaFlare",
        amount: 1,
      },
      {
        material: "plasmaCompactedStarShards",
        amount: 2,
      },
    ],
  },
];

/* =========================================================
   REGION HELPERS
   ========================================================= */

export const moonTalismans =
  talismans.filter(
    (talisman) =>
      talisman.region ===
      "moon"
  );

export const marsTalismans =
  talismans.filter(
    (talisman) =>
      talisman.region ===
      "mars"
  );

export const sunTalismans =
  talismans.filter(
    (talisman) =>
      talisman.region ===
      "sun"
  );