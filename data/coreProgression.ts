export type CoreCost = {
  name: string;
  amount: number;
};

export type CoreLevel = {
  level: number;
  label: string;
  nextCost: CoreCost[];
  sellPrice?: number;
};

export type ProgressionCore = {
  id: string;
  name: string;
  region: "moon" | "mars" | "sun";
  levels: CoreLevel[];
};

function makeRefineryLevels(
  baseSellPrice: number,
  sellIncrease: number,
  coreName: string,
  materialCosts: CoreCost[]
): CoreLevel[] {
  return Array.from({ length: 11 }, (_, level) => {
    const isMax = level === 10;

    return {
      level,
      label: level.toString(),
      sellPrice: baseSellPrice + level * sellIncrease,

      nextCost: isMax
        ? []
        : [
            {
              name: coreName,
              amount: 1,
            },
            ...materialCosts,
            {
              name: "Coins",
              amount:
                100_000_000 *
                2 ** level,
            },
          ],
    };
  });
}

function makeHasteLevels(
  coreCosts: CoreCost[],
  materialCosts: CoreCost[],
  coinCosts: number[]
): CoreLevel[] {
  return Array.from(
    { length: 6 },
    (_, level) => {
      const isMax =
        level === 5;

      return {
        level,
        label:
          level.toString(),

        nextCost: isMax
          ? []
          : [
              ...coreCosts,
              ...materialCosts,
              {
                name: "Qd Coins",
                amount:
                  coinCosts[
                    level
                  ],
              },
            ],
      };
    }
  );
}

export const progressionCores: ProgressionCore[] =
  [
    //
    // POWER
    //

    {
      id: "power",
      name: "Power Cores/Rank",
      region: "mars",

      levels: [
        {
          level: 1,
          label: "T5 P1",

          nextCost: [
            {
              name: "Power Core 1★",
              amount: 4,
            },
            {
              name: "Lunar Fragment",
              amount: 32,
            },
            {
              name: "Chisilite Shard",
              amount: 16,
            },
            {
              name: "Magma",
              amount: 2_000,
            },
            {
              name: "Qd Coins",
              amount: 10,
            },
          ],
        },

        {
          level: 2,
          label: "T5 P2",

          nextCost: [
            {
              name: "Power Core 1★",
              amount: 16,
            },
            {
              name: "Lunar Fragment",
              amount: 128,
            },
            {
              name: "Chisilite Shard",
              amount: 64,
            },
            {
              name: "Power Core 2★",
              amount: 16,
            },
            {
              name: "Amber Fragment",
              amount: 128,
            },
            {
              name: "Martian Dust",
              amount: 64,
            },
            {
              name: "Magma",
              amount: 22_000,
            },
            {
              name: "Qd Coins",
              amount: 50,
            },
            {
              name: "Martian Beans",
              amount: 3,
            },
          ],
        },

        {
          level: 3,
          label: "T5 P3",
          nextCost: [],
        },
      ],
    },

    //
    // MOON
    //

    {
      id: "basalt-refinery",
      name: "Basalt",
      region: "moon",

      levels:
        makeRefineryLevels(
          75_000,
          1_875,
          "1★ Research Core",
          [
            {
              name: "Lunar Fragment",
              amount: 16,
            },
            {
              name: "Chisilite Shard",
              amount: 8,
            },
            {
              name: "Magma",
              amount: 500,
            },
          ]
        ),
    },

    {
      id: "brecca-refinery",
      name: "Brecca",
      region: "moon",

      levels:
        makeRefineryLevels(
          40_000,
          1_000,
          "1★ Research Core",
          [
            {
              name: "Lunar Fragment",
              amount: 16,
            },
            {
              name: "Chisilite Shard",
              amount: 8,
            },
            {
              name: "Magma",
              amount: 500,
            },
          ]
        ),
    },

    {
      id: "moon-haste",
      name: "Moon Haste",
      region: "moon",

      levels:
        makeHasteLevels(
          [
            {
              name: "1★ Beacon Core",
              amount: 1,
            },
          ],

          [
            {
              name: "Lunar Fragment",
              amount: 8,
            },
            {
              name: "Chisilite Shard",
              amount: 4,
            },
            {
              name: "Magma",
              amount: 250,
            },
          ],

          [
            1,
            2,
            5,
            10,
            25,
          ]
        ),
    },

    //
    // MARS
    //

    {
      id: "regolith",
      name: "Regolith",
      region: "mars",

      levels:
        makeRefineryLevels(
          180_000,
          4_500,
          "2★ Research Core",
          [
            {
              name: "Lunar Fragment",
              amount: 16,
            },
            {
              name: "Chisilite Shard",
              amount: 8,
            },
            {
              name: "Amber Fragment",
              amount: 16,
            },
            {
              name: "Martian Dust",
              amount: 8,
            },
            {
              name: "Magma",
              amount: 1_500,
            },
          ]
        ),
    },

    {
      id: "amber-rock",
      name: "Amber Rock",
      region: "mars",

      levels:
        makeRefineryLevels(
          88_000,
          2_200,
          "2★ Research Core",
          [
            {
              name: "Lunar Fragment",
              amount: 16,
            },
            {
              name: "Chisilite Shard",
              amount: 8,
            },
            {
              name: "Amber Fragment",
              amount: 16,
            },
            {
              name: "Martian Dust",
              amount: 8,
            },
            {
              name: "Magma",
              amount: 1_500,
            },
          ]
        ),
    },

    {
      id: "amber-crystal",
      name: "Amber Crystal",
      region: "mars",

      levels:
        makeRefineryLevels(
          46_000,
          1_150,
          "2★ Research Core",
          [
            {
              name: "Lunar Fragment",
              amount: 16,
            },
            {
              name: "Chisilite Shard",
              amount: 8,
            },
            {
              name: "Amber Fragment",
              amount: 16,
            },
            {
              name: "Martian Dust",
              amount: 8,
            },
            {
              name: "Magma",
              amount: 1_500,
            },
          ]
        ),
    },

    {
      id: "mars-haste",
      name: "Mars Haste",
      region: "mars",

      levels:
        makeHasteLevels(
          [
            {
              name: "1★ Beacon Core",
              amount: 1,
            },
            {
              name: "2★ Beacon Core",
              amount: 1,
            },
          ],

          [
            {
              name: "Lunar Fragment",
              amount: 8,
            },
            {
              name: "Chisilite Shard",
              amount: 4,
            },
            {
              name: "Amber Fragment",
              amount: 8,
            },
            {
              name: "Martian Dust",
              amount: 4,
            },
            {
              name: "Magma",
              amount: 750,
            },
          ],

          [
            2,
            5,
            10,
            25,
            50,
          ]
        ),
    },

    //
    // SUN
    //

    {
      id: "crimson-plasma",
      name: "Crimson Plasma",
      region: "sun",

      levels:
        makeRefineryLevels(
          68_000,
          1_700,
          "3★ Research Core",
          [
            {
              name: "Lunar Fragment",
              amount: 16,
            },
            {
              name: "Chisilite Shard",
              amount: 8,
            },
            {
              name: "Amber Fragment",
              amount: 16,
            },
            {
              name: "Martian Dust",
              amount: 8,
            },
            {
              name: "Sun Fragment",
              amount: 16,
            },
            {
              name: "Plasma Shard",
              amount: 8,
            },
            {
              name: "Magma",
              amount: 3_500,
            },
          ]
        ),
    },

    {
      id: "cosmic-fiber",
      name: "Cosmic Fiber",
      region: "sun",

      levels:
        makeRefineryLevels(
          95_000,
          2_375,
          "3★ Research Core",
          [
            {
              name: "Lunar Fragment",
              amount: 16,
            },
            {
              name: "Chisilite Shard",
              amount: 8,
            },
            {
              name: "Amber Fragment",
              amount: 16,
            },
            {
              name: "Martian Dust",
              amount: 8,
            },
            {
              name: "Sun Fragment",
              amount: 16,
            },
            {
              name: "Plasma Shard",
              amount: 8,
            },
            {
              name: "Magma",
              amount: 3_500,
            },
          ]
        ),
    },

    {
      id: "sun-haste",
      name: "Sun Haste",
      region: "sun",

      levels:
        makeHasteLevels(
          [
            {
              name: "1★ Beacon Core",
              amount: 1,
            },
            {
              name: "2★ Beacon Core",
              amount: 1,
            },
            {
              name: "3★ Beacon Core",
              amount: 1,
            },
          ],

          [
            {
              name: "Lunar Fragment",
              amount: 8,
            },
            {
              name: "Chisilite Shard",
              amount: 4,
            },
            {
              name: "Amber Fragment",
              amount: 8,
            },
            {
              name: "Martian Dust",
              amount: 4,
            },
            {
              name: "Sun Fragment",
              amount: 8,
            },
            {
              name: "Plasma Shard",
              amount: 4,
            },
            {
              name: "Magma",
              amount: 1_750,
            },
          ],

          [
            3,
            10,
            25,
            50,
            75,
          ]
        ),
    },
  ];