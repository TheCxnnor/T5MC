export type ArmorRegion =
  | "moonMars"
  | "sun";

export type ArmorPieceType =
  | "spaceplate"
  | "spacepants"
  | "spaceboots";

export type ArmorRequirement = {
  material: string;
  amount: number;
};

export type ArmorTier = {
  id: string;
  name: string;
  region: ArmorRegion;
  pieces: {
    type: ArmorPieceType;
    name: string;
    requirements: ArmorRequirement[];
  }[];
};

/* =========================================================
   HELPER
   ========================================================= */

function createStandardArmorTier({
  id,
  name,
  region,
  coinsQd,
  starShards,
  extraRequirements = [],
}: {
  id: string;
  name: string;
  region: ArmorRegion;
  coinsQd: number;
  starShards: number;
  extraRequirements?: ArmorRequirement[];
}): ArmorTier {
  const createRequirements =
    (): ArmorRequirement[] => [
      {
        material: "coinsQd",
        amount: coinsQd,
      },

      ...extraRequirements,

      {
        material: "starShards",
        amount: starShards,
      },
    ];

  return {
    id,
    name,
    region,

    pieces: [
      {
        type: "spaceplate",
        name: "Spaceplate",
        requirements:
          createRequirements(),
      },

      {
        type: "spacepants",
        name: "Spacepants",
        requirements:
          createRequirements(),
      },

      {
        type: "spaceboots",
        name: "Spaceboots",
        requirements:
          createRequirements(),
      },
    ],
  };
}

/* =========================================================
   ARMOR DATA
   ========================================================= */

export const armor: ArmorTier[] = [
  /* =======================================================
     MOON / MARS ARMOR
     ======================================================= */

  createStandardArmorTier({
    id: "stardust",
    name: "Stardust",
    region: "moonMars",

    coinsQd: 2,

    starShards:
      300_000,
  }),

  createStandardArmorTier({
    id: "voidcore",
    name: "Voidcore",
    region: "moonMars",

    coinsQd: 4,

    starShards:
      300_000,
  }),

  createStandardArmorTier({
    id: "nebulite",
    name: "Nebulite",
    region: "moonMars",

    coinsQd: 6,

    starShards:
      300_000,
  }),

  createStandardArmorTier({
    id: "etherealite",
    name: "Etherealite",
    region: "moonMars",

    coinsQd: 8,

    starShards:
      300_000,
  }),

  createStandardArmorTier({
    id: "astroflare",
    name: "Astroflare",
    region: "moonMars",

    coinsQd: 10,

    starShards:
      300_000,
  }),

  createStandardArmorTier({
    id: "eclipse",
    name: "Eclipse",
    region: "moonMars",

    coinsQd: 12,

    starShards:
      300_000,
  }),

  /* =======================================================
     SUN ARMOR
     ======================================================= */

  createStandardArmorTier({
    id: "galactic",
    name: "Galactic",
    region: "sun",

    coinsQd: 14,

    starShards:
      400_000,
  }),

  createStandardArmorTier({
    id: "supernova",
    name: "Supernova",
    region: "sun",

    coinsQd: 16,

    starShards:
      400_000,
  }),

  createStandardArmorTier({
    id: "neutronic",
    name: "Neutronic",
    region: "sun",

    coinsQd: 18,

    starShards:
      400_000,
  }),

  createStandardArmorTier({
    id: "quasar",
    name: "Quasar",
    region: "sun",

    coinsQd: 20,

    starShards:
      400_000,
  }),

  createStandardArmorTier({
    id: "pulsar",
    name: "Pulsar",
    region: "sun",

    coinsQd: 22,

    starShards:
      400_000,
  }),

  createStandardArmorTier({
    id: "cosmogenesis",
    name: "Cosmogenesis",
    region: "sun",

    coinsQd: 22,

    starShards:
      400_000,

    extraRequirements: [
      {
        material:
          "compactedCoins",

        amount: 2,
      },
    ],
  }),

  createStandardArmorTier({
    id: "omniversal",
    name: "Omniversal",
    region: "sun",

    coinsQd: 24,

    starShards:
      400_000,

    extraRequirements: [
      {
        material:
          "plasmaCompactedCoins",

        amount: 2,
      },
    ],
  }),
];

/* =========================================================
   OPTIONAL HELPERS
   ========================================================= */

export const moonMarsArmor =
  armor.filter(
    (tier) =>
      tier.region ===
      "moonMars"
  );

export const sunArmor =
  armor.filter(
    (tier) =>
      tier.region ===
      "sun"
  );

/* =========================================================
   TOTALS PER TIER

   Each tier has 3 pieces, so these totals are useful for
   the future armour page.
   ========================================================= */

export function getArmorTierTotals(
  tier: ArmorTier
) {
  const totals =
    new Map<
      string,
      number
    >();

  tier.pieces.forEach(
    (piece) => {
      piece.requirements.forEach(
        (requirement) => {
          totals.set(
            requirement.material,

            (
              totals.get(
                requirement.material
              ) ??
              0
            ) +
              requirement.amount
          );
        }
      );
    }
  );

  return Array.from(
    totals.entries()
  ).map(
    ([
      material,
      amount,
    ]) => ({
      material,
      amount,
    })
  );
}