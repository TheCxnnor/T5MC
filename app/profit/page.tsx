"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  progressionCores,
  type ProgressionCore,
} from "../../data/coreProgression";

import { materials } from "../../data/materials";
import { CollapsibleSection } from "../../components/ui/CollapsibleSection";
import { NumberInput, SelectInput, ToggleCard } from "../../components/ui/CalculatorInputs";
import { StatBox, MiniStat, RecommendationStat } from "../../components/ui/StatCards";

/* =========================================================
   TYPES
   ========================================================= */

type PotionTier =
  | "No Potion"
  | "T1"
  | "T2"
  | "T3"
  | "T4";

type Planet =
  | "moon"
  | "mars"
  | "sun";

type PowerRank =
  | "T5 P1"
  | "T5 P2"
  | "T5 P3";

type DropDefinition = {
  material: string;
  odds: number;
};

type OreDefinition = {
  id: string;
  name: string;
  planet: Planet;

  refineryId: string;
  hasteId: string;

  breakTimes: number[];

  drops: DropDefinition[];
};

type CoreSavedState = {
  magmaStorage?: number;

  selectedLevels?: Record<
    string,
    number
  >;

  openSections?: Record<
    string,
    boolean
  >;
};

type ProfitOpenSections = {
  settings: boolean;
  progression: boolean;
  recommendation: boolean;
  moon: boolean;
  mars: boolean;
  sun: boolean;
};

type ProfitSavedState = {
  baseFortune: number;

  potion: PotionTier;

  t4PotCost: number;

  cashRegister: boolean;

  afkTime: number;

  magmaPrice: number;

  duneRamOwned: boolean;
  duneRamLevel: number;

  ravenOwned: boolean;
  ravenLevel: number;

  openSections: ProfitOpenSections;
};

type DropResult = {
  material: string;

  odds: number;

  expectedPerHour: number;

  expectedForSession: number;

  magmaValue: number;

  magmaPerHour: number;

  magmaForSession: number;
};

type PotionCostResult = {
  stackCostT: number;

  perPotionCostT: number;

  durationSeconds: number;

  theoreticalCostPerHourT: number;

  potionsNeeded: number;

  sessionCostT: number;

  sessionCostCoins: number;

  effectiveSessionCostPerHourCoins: number;
};

type OreResult = {
  id: string;

  name: string;

  planet: Planet;

  potion: PotionTier;

  hasteLevel: number;

  refineryLevel: number;

  breakTime: number;

  blocksPerHour: number;

  baseSellPrice: number;

  refinerySellPrice: number;

  effectiveSellPrice: number;

  effectiveFortune: number;

  revenuePerHour: number;

  sessionRevenue: number;

  potionData: PotionCostResult;

  sessionNetProfit: number;

  netProfitPerHour: number;

  margin: number;

  drops: DropResult[];

  magmaPerHour: number;

  magmaForSession: number;

  magmaValuePerHour: number;

  magmaValueForSession: number;
};

/* =========================================================
   STORAGE
   ========================================================= */

const CORE_STORAGE_KEY =
  "t5-mission-control-cores";

const PROFIT_STORAGE_KEY =
  "t5-mission-control-profit";

/* =========================================================
   DEFAULTS
   ========================================================= */

const DEFAULT_OPEN_SECTIONS: ProfitOpenSections =
  {
    settings: true,
    progression: true,
    recommendation: true,
    moon: true,
    mars: true,
    sun: true,
  };

const DEFAULT_PROFIT_STATE: ProfitSavedState =
  {
    baseFortune: 1_000_000,

    potion: "No Potion",

    t4PotCost: 150,

    cashRegister: false,

    afkTime: 1,

    magmaPrice: 200,

    duneRamOwned: false,
    duneRamLevel: 1,

    ravenOwned: false,
    ravenLevel: 1,

    openSections:
      DEFAULT_OPEN_SECTIONS,
  };

/* =========================================================
   POTIONS

   Times are SECONDS.

   T1 = 30 seconds
   T2 = 45 seconds
   T3 = 60 seconds
   T4 = 75 seconds
   ========================================================= */

const potionTiers: PotionTier[] = [
  "No Potion",
  "T1",
  "T2",
  "T3",
  "T4",
];

const potionData: Record<
  PotionTier,
  {
    fortuneMultiplier: number;
    durationSeconds: number;
    t4PriceDivisor: number;
  }
> = {
  "No Potion": {
    fortuneMultiplier: 1,
    durationSeconds: 0,
    t4PriceDivisor: 0,
  },

  T1: {
    fortuneMultiplier: 2,
    durationSeconds: 30,
    t4PriceDivisor: 27,
  },

  T2: {
    fortuneMultiplier: 3,
    durationSeconds: 45,
    t4PriceDivisor: 9,
  },

  T3: {
    fortuneMultiplier: 4.5,
    durationSeconds: 60,
    t4PriceDivisor: 3,
  },

  T4: {
    fortuneMultiplier: 6,
    durationSeconds: 75,
    t4PriceDivisor: 1,
  },
};

/* =========================================================
   ORES
   ========================================================= */

const oreDefinitions: OreDefinition[] =
  [
    {
      id: "basalt",

      name: "Basalt",

      planet: "moon",

      refineryId:
        "basalt-refinery",

      hasteId:
        "moon-haste",

      breakTimes: [
        1.5,
        1.3,
        1.2,
        1.05,
        1,
        0.9,
      ],

      drops: [
        {
          material:
            "Lunar Fragment",

          odds: 500,
        },

        {
          material:
            "Basalt Shard",

          odds: 1000,
        },

        {
          material:
            "Chisilite Shard",

          odds: 1000,
        },
      ],
    },

    {
      id: "brecca",

      name:
        "Brecca Crystal",

      planet: "moon",

      refineryId:
        "brecca-refinery",

      hasteId:
        "moon-haste",

      breakTimes: [
        0.75,
        0.7,
        0.65,
        0.6,
        0.55,
        0.55,
      ],

      drops: [
        {
          material:
            "Lunar Fragment",

          odds: 500,
        },

        {
          material:
            "Chisilite Shard",

          odds: 1000,
        },

        {
          material:
            "Brecca Powder",

          odds: 2000,
        },
      ],
    },

    {
      id: "regolith",

      name: "Regolith",

      planet: "mars",

      refineryId:
        "regolith",

      hasteId:
        "mars-haste",

      breakTimes: [
        3.3,
        2.8,
        2.45,
        2.2,
        2,
        1.8,
      ],

      drops: [
        {
          material:
            "Regolith Soil",

          odds: 200,
        },

        {
          material:
            "Martian Dust",

          odds: 500,
        },

        {
          material:
            "Rhodnite",

          odds: 2500,
        },
      ],
    },

    {
      id:
        "amber-rock",

      name:
        "Amber Rock",

      planet: "mars",

      refineryId:
        "amber-rock",

      hasteId:
        "mars-haste",

      breakTimes: [
        1.5,
        1.3,
        1.2,
        1.05,
        1,
        0.9,
      ],

      drops: [
        {
          material:
            "Amber Fragment",

          odds: 500,
        },

        {
          material:
            "Ametrine",

          odds: 1000,
        },

        {
          material:
            "Rhodnite",

          odds: 2500,
        },
      ],
    },

    {
      id:
        "amber-crystal",

      name:
        "Amber Crystal",

      planet: "mars",

      refineryId:
        "amber-crystal",

      hasteId:
        "mars-haste",

      breakTimes: [
        0.75,
        0.7,
        0.65,
        0.6,
        0.55,
        0.55,
      ],

      drops: [
        {
          material:
            "Amber Fragment",

          odds: 500,
        },

        {
          material:
            "Ametrine",

          odds: 1000,
        },

        {
          material:
            "Rhodnite",

          odds: 2500,
        },
      ],
    },

    {
      id:
        "crimson-plasma",

      name:
        "Crimson Plasma",

      planet: "sun",

      refineryId:
        "crimson-plasma",

      hasteId:
        "sun-haste",

      breakTimes: [
        0.75,
        0.7,
        0.65,
        0.6,
        0.55,
        0.55,
      ],

      drops: [
        {
          material:
            "Sun Fragment",

          odds: 500,
        },

        {
          material:
            "Plasma Shard",

          odds: 2000,
        },
      ],
    },

    {
      id:
        "cosmic-fiber",

      name:
        "Cosmic Fiber",

      planet: "sun",

      refineryId:
        "cosmic-fiber",

      hasteId:
        "sun-haste",

      breakTimes: [
        1.5,
        1.3,
        1.2,
        1.05,
        1,
        0.9,
      ],

      drops: [
        {
          material:
            "Sun Fragment",

          odds: 500,
        },

        {
          material:
            "Fiber",

          odds: 1000,
        },
      ],
    },
  ];

/* =========================================================
   MATERIAL VALUES
   ========================================================= */

const materialValues =
  Object.values(
    materials
  ) as Array<{
    name: string;
    magmaValue?: number;
  }>;

/* =========================================================
   HELPERS
   ========================================================= */

function clamp(
  value: number,
  minimum: number,
  maximum: number
) {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value
    )
  );
}

function formatDecimal(
  value: number,
  decimals = 2
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return "0";
  }

  return value
    .toFixed(
      decimals
    )
    .replace(
      /\.?0+$/,
      ""
    );
}

function formatNumber(
  value: number,
  maximumFractionDigits = 0
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return "0";
  }

  return value.toLocaleString(
    undefined,
    {
      maximumFractionDigits,
    }
  );
}

function formatWholeNumber(
  value: number
) {
  return Math.round(
    value
  ).toLocaleString();
}

function formatCoins(
  value: number
) {
  if (
    !Number.isFinite(
      value
    )
  ) {
    return "0";
  }

  const absolute =
    Math.abs(
      value
    );

  if (
    absolute >=
    1_000_000_000_000_000
  ) {
    return `${formatDecimal(
      value /
        1_000_000_000_000_000
    )}Qd`;
  }

  if (
    absolute >=
    1_000_000_000_000
  ) {
    return `${formatDecimal(
      value /
        1_000_000_000_000
    )}T`;
  }

  if (
    absolute >=
    1_000_000_000
  ) {
    return `${formatDecimal(
      value /
        1_000_000_000
    )}B`;
  }

  if (
    absolute >=
    1_000_000
  ) {
    return `${formatDecimal(
      value /
        1_000_000
    )}M`;
  }

  if (
    absolute >=
    1000
  ) {
    return `${formatDecimal(
      value /
        1000
    )}K`;
  }

  return formatDecimal(
    value
  );
}

function getMagmaValue(
  materialName: string
) {
  return (
    materialValues.find(
      (material) =>
        material.name ===
        materialName
    )?.magmaValue ?? 0
  );
}

function getCore(
  id: string
) {
  return progressionCores.find(
    (core) =>
      core.id === id
  );
}

function getSavedCoreLevel(
  selectedLevels: Record<
    string,
    number
  >,

  core:
    | ProgressionCore
    | undefined
) {
  if (!core) {
    return 0;
  }

  const requested =
    selectedLevels[
      core.id
    ];

  if (
    requested !==
      undefined &&
    core.levels.some(
      (level) =>
        level.level ===
        requested
    )
  ) {
    return requested;
  }

  return (
    core.levels[0]
      ?.level ?? 0
  );
}

function getHasteLevel(
  hasteId: string,

  selectedLevels: Record<
    string,
    number
  >
) {
  const core =
    getCore(
      hasteId
    );

  return getSavedCoreLevel(
    selectedLevels,
    core
  );
}

function getSellPriceData(
  refineryId: string,

  selectedLevels: Record<
    string,
    number
  >
) {
  const core =
    getCore(
      refineryId
    );

  if (!core) {
    return {
      level: 0,

      baseSellPrice: 0,

      currentSellPrice: 0,
    };
  }

  const level =
    getSavedCoreLevel(
      selectedLevels,
      core
    );

  const baseSellPrice =
    core.levels[0]
      ?.sellPrice ?? 0;

  const currentSellPrice =
    core.levels.find(
      (entry) =>
        entry.level ===
        level
    )?.sellPrice ??
    baseSellPrice;

  return {
    level,

    baseSellPrice,

    currentSellPrice,
  };
}

/* =========================================================
   POWER
   ========================================================= */

function getPowerCore() {
  const exactIds = [
    "power",
    "power-rank",
    "t5-power",
  ];

  for (
    const id of exactIds
  ) {
    const found =
      getCore(
        id
      );

    if (found) {
      return found;
    }
  }

  return progressionCores.find(
    (core) =>
      core.name
        .toLowerCase()
        .includes(
          "power"
        )
  );
}

function getPowerRank(
  selectedLevels: Record<
    string,
    number
  >
): PowerRank {
  const powerCore =
    getPowerCore();

  const directSavedPower =
    selectedLevels[
      "power"
    ] ??
    selectedLevels[
      "power-rank"
    ] ??
    selectedLevels[
      "t5-power"
    ];

  if (
    !powerCore &&
    directSavedPower !==
      undefined
  ) {
    if (
      directSavedPower >=
      3
    ) {
      return "T5 P3";
    }

    if (
      directSavedPower >=
      2
    ) {
      return "T5 P2";
    }

    return "T5 P1";
  }

  if (!powerCore) {
    return "T5 P1";
  }

  const savedLevel =
    getSavedCoreLevel(
      selectedLevels,
      powerCore
    );

  const selectedEntry =
    powerCore.levels.find(
      (entry) =>
        entry.level ===
        savedLevel
    );

  const label =
    selectedEntry
      ?.label
      ?.toUpperCase() ??
    "";

  if (
    label.includes(
      "P3"
    )
  ) {
    return "T5 P3";
  }

  if (
    label.includes(
      "P2"
    )
  ) {
    return "T5 P2";
  }

  if (
    savedLevel >= 3
  ) {
    return "T5 P3";
  }

  if (
    savedLevel >= 2
  ) {
    return "T5 P2";
  }

  return "T5 P1";
}

function getAccessiblePlanets(
  powerRank: PowerRank
): Planet[] {
  if (
    powerRank ===
    "T5 P3"
  ) {
    return [
      "moon",
      "mars",
      "sun",
    ];
  }

  if (
    powerRank ===
    "T5 P2"
  ) {
    return [
      "moon",
      "mars",
    ];
  }

  return [
    "moon",
  ];
}

/* =========================================================
   POTION COSTS
   ========================================================= */

function getPotionCostData(
  potionTier: PotionTier,

  t4StackCostT: number,

  afkHours: number
): PotionCostResult {
  if (
    potionTier ===
    "No Potion"
  ) {
    return {
      stackCostT: 0,

      perPotionCostT: 0,

      durationSeconds: 0,

      theoreticalCostPerHourT:
        0,

      potionsNeeded: 0,

      sessionCostT: 0,

      sessionCostCoins: 0,

      effectiveSessionCostPerHourCoins:
        0,
    };
  }

  const potion =
    potionData[
      potionTier
    ];

  const stackCostT =
    t4StackCostT /
    potion.t4PriceDivisor;

  const perPotionCostT =
    stackCostT /
    64;

  const durationSeconds =
    potion.durationSeconds;

  const theoreticalPotionsPerHour =
    3600 /
    durationSeconds;

  const theoreticalCostPerHourT =
    perPotionCostT *
    theoreticalPotionsPerHour;

  const safeAfkHours =
    Math.max(
      0,
      afkHours
    );

  const sessionSeconds =
    safeAfkHours *
    3600;

  const potionsNeeded =
    sessionSeconds > 0
      ? Math.ceil(
          sessionSeconds /
            durationSeconds
        )
      : 0;

  const sessionCostT =
    potionsNeeded *
    perPotionCostT;

  const sessionCostCoins =
    sessionCostT *
    1_000_000_000_000;

  const effectiveSessionCostPerHourCoins =
    safeAfkHours > 0
      ? sessionCostCoins /
        safeAfkHours
      : theoreticalCostPerHourT *
        1_000_000_000_000;

  return {
    stackCostT,

    perPotionCostT,

    durationSeconds,

    theoreticalCostPerHourT,

    potionsNeeded,

    sessionCostT,

    sessionCostCoins,

    effectiveSessionCostPerHourCoins,
  };
}

/* =========================================================
   ORE CALCULATION
   ========================================================= */

function calculateOre(
  ore: OreDefinition,

  potionTier: PotionTier,

  settings: ProfitSavedState,

  coreLevels: Record<
    string,
    number
  >
): OreResult {
  const afkTime =
    Math.max(
      0,
      settings.afkTime
    );

  const potion =
    potionData[
      potionTier
    ];

  const effectiveFortune =
    settings.baseFortune *
    potion.fortuneMultiplier;

  const currentPotionData =
    getPotionCostData(
      potionTier,
      settings.t4PotCost,
      afkTime
    );

  /*
   * Raven:
   * +1% expected drops per level.
   */
  const ravenMultiplier =
    settings.ravenOwned
      ? 1 +
        clamp(
          settings.ravenLevel,
          1,
          100
        ) /
          100
      : 1;

  /*
   * Dune Ram:
   * +2% refinery BUFF efficiency
   * per level.
   */
  const duneMultiplier =
    settings.duneRamOwned
      ? 1 +
        clamp(
          settings.duneRamLevel,
          1,
          100
        ) *
          0.02
      : 1;

  /*
   * Haste.
   */
  const hasteLevel =
    clamp(
      getHasteLevel(
        ore.hasteId,
        coreLevels
      ),
      0,
      5
    );

  const breakTime =
    ore.breakTimes[
      hasteLevel
    ] ??
    ore.breakTimes[0];

  const blocksPerHour =
    3600 /
    breakTime;

  /*
   * Refinery.
   */
  const sellData =
    getSellPriceData(
      ore.refineryId,
      coreLevels
    );

  const refineryBonus =
    sellData.currentSellPrice -
    sellData.baseSellPrice;

  const enhancedRefineryBonus =
    refineryBonus *
    duneMultiplier;

  const effectiveSellPrice =
    sellData.baseSellPrice +
    enhancedRefineryBonus;

  /*
   * Mining revenue.
   */
  let revenuePerHour =
    blocksPerHour *
    (effectiveFortune /
      100) *
    effectiveSellPrice;

  if (
    settings.cashRegister
  ) {
    revenuePerHour *=
      1.03;
  }

  const sessionRevenue =
    revenuePerHour *
    afkTime;

  /*
   * DROPS
   *
   * Expected drops are rounded to the
   * nearest whole number everywhere.
   */
  const drops =
    ore.drops.map(
      (
        drop
      ): DropResult => {
        const rawPerHour =
          (blocksPerHour /
            drop.odds) *
          ravenMultiplier;

        const rawForSession =
          rawPerHour *
          afkTime;

        const expectedPerHour =
          Math.round(
            rawPerHour
          );

        const expectedForSession =
          Math.round(
            rawForSession
          );

        const magmaValue =
          getMagmaValue(
            drop.material
          );

        const magmaPerHour =
          expectedPerHour *
          magmaValue;

        const magmaForSession =
          expectedForSession *
          magmaValue;

        return {
          material:
            drop.material,

          odds:
            drop.odds,

          expectedPerHour,

          expectedForSession,

          magmaValue,

          magmaPerHour,

          magmaForSession,
        };
      }
    );

  const magmaPerHour =
    drops.reduce(
      (
        total,
        drop
      ) =>
        total +
        drop.magmaPerHour,
      0
    );

  const magmaForSession =
    drops.reduce(
      (
        total,
        drop
      ) =>
        total +
        drop.magmaForSession,
      0
    );

  const magmaValuePerHour =
    magmaPerHour *
    settings.magmaPrice *
    1_000_000_000;

  const magmaValueForSession =
    magmaForSession *
    settings.magmaPrice *
    1_000_000_000;

  /*
   * Mining profit.
   *
   * Magma remains COMPLETELY SEPARATE.
   */
  const sessionNetProfit =
    sessionRevenue -
    currentPotionData.sessionCostCoins;

  const netProfitPerHour =
    afkTime > 0
      ? sessionNetProfit /
        afkTime
      : revenuePerHour -
        currentPotionData
          .effectiveSessionCostPerHourCoins;

  const margin =
    sessionRevenue > 0
      ? (sessionNetProfit /
          sessionRevenue) *
        100
      : revenuePerHour > 0
        ? (netProfitPerHour /
            revenuePerHour) *
          100
        : 0;

  return {
    id:
      ore.id,

    name:
      ore.name,

    planet:
      ore.planet,

    potion:
      potionTier,

    hasteLevel,

    refineryLevel:
      sellData.level,

    breakTime,

    blocksPerHour,

    baseSellPrice:
      sellData.baseSellPrice,

    refinerySellPrice:
      sellData.currentSellPrice,

    effectiveSellPrice,

    effectiveFortune,

    revenuePerHour,

    sessionRevenue,

    potionData:
      currentPotionData,

    sessionNetProfit,

    netProfitPerHour,

    margin,

    drops,

    magmaPerHour,

    magmaForSession,

    magmaValuePerHour,

    magmaValueForSession,
  };
}

/* =========================================================
   THEMES
   ========================================================= */

function getPlanetTheme(
  planet: Planet
) {
  if (
    planet ===
    "moon"
  ) {
    return {
      sectionBorder:
        "border-[#405a78]",

      headerBg:
        "bg-[#202833]",

      cardBorder:
        "border-[#6785a8]",

      cardBg:
        "bg-[#2b3744]",

      badge:
        "bg-[#243446] text-[#9bbcff]",

      accent:
        "text-[#9bbcff]",

      panel:
        "bg-[#24303b]",

      button:
        "bg-[#253242] text-[#9bbcff]",
    };
  }

  if (
    planet ===
    "mars"
  ) {
    return {
      sectionBorder:
        "border-[#9a5a49]",

      headerBg:
        "bg-[#261f22]",

      cardBorder:
        "border-[#cb8168]",

      cardBg:
        "bg-[#3a2a28]",

      badge:
        "bg-[#3b2b28] text-[#efaa91]",

      accent:
        "text-[#efaa91]",

      panel:
        "bg-[#342625]",

      button:
        "bg-[#3a2a28] text-[#efaa91]",
    };
  }

  return {
    sectionBorder:
      "border-[#8b783a]",

    headerBg:
      "bg-[#252317]",

    cardBorder:
      "border-[#b89c48]",

    cardBg:
      "bg-[#3a3423]",

    badge:
      "bg-[#383221] text-[#e4cc7e]",

    accent:
      "text-[#e4cc7e]",

    panel:
      "bg-[#342f22]",

    button:
      "bg-[#3a3423] text-[#e4cc7e]",
  };
}

/* =========================================================
   PAGE
   ========================================================= */

export default function ProfitPage() {
  const [
    settings,
    setSettings,
  ] =
    useState<ProfitSavedState>(
      DEFAULT_PROFIT_STATE
    );

  const [
    coreLevels,
    setCoreLevels,
  ] =
    useState<
      Record<
        string,
        number
      >
    >({});

  const [
    storageLoaded,
    setStorageLoaded,
  ] =
    useState(false);

  /*
   * Load Profit Calculator state.
   */
  useEffect(() => {
    try {
      const saved =
        window.localStorage.getItem(
          PROFIT_STORAGE_KEY
        );

      if (saved) {
        const parsed =
          JSON.parse(
            saved
          ) as Partial<ProfitSavedState>;

        setSettings({
          ...DEFAULT_PROFIT_STATE,

          ...parsed,

          openSections: {
            ...DEFAULT_OPEN_SECTIONS,

            ...(parsed.openSections ??
              {}),
          },
        });
      }
    } catch (error) {
      console.error(
        "Could not load profit settings:",
        error
      );
    } finally {
      setStorageLoaded(
        true
      );
    }
  }, []);

  /*
   * Save Profit Calculator state.
   */
  useEffect(() => {
    if (
      !storageLoaded
    ) {
      return;
    }

    try {
      window.localStorage.setItem(
        PROFIT_STORAGE_KEY,

        JSON.stringify(
          settings
        )
      );
    } catch (error) {
      console.error(
        "Could not save profit settings:",
        error
      );
    }
  }, [
    settings,
    storageLoaded,
  ]);

  /*
   * Load progression from Cores.
   */
  useEffect(() => {
    function loadCoreState() {
      try {
        const saved =
          window.localStorage.getItem(
            CORE_STORAGE_KEY
          );

        if (!saved) {
          setCoreLevels(
            {}
          );

          return;
        }

        const parsed =
          JSON.parse(
            saved
          ) as CoreSavedState;

        setCoreLevels(
          parsed.selectedLevels ??
            {}
        );
      } catch (error) {
        console.error(
          "Could not load Cores progression:",
          error
        );
      }
    }

    loadCoreState();

    window.addEventListener(
      "storage",
      loadCoreState
    );

    return () => {
      window.removeEventListener(
        "storage",
        loadCoreState
      );
    };
  }, []);

  function updateSetting<
    K extends keyof ProfitSavedState
  >(
    key: K,

    value: ProfitSavedState[K]
  ) {
    setSettings(
      (current) => ({
        ...current,

        [key]:
          value,
      })
    );
  }

  function toggleSection(
    section: keyof ProfitOpenSections
  ) {
    setSettings(
      (current) => ({
        ...current,

        openSections: {
          ...current.openSections,

          [section]:
            !current.openSections[
              section
            ],
        },
      })
    );
  }

  /* =======================================================
     CALCULATIONS
     ======================================================= */

  const calculations =
    useMemo(() => {
      const powerRank =
        getPowerRank(
          coreLevels
        );

      const accessiblePlanets =
        getAccessiblePlanets(
          powerRank
        );

      /*
       * Normal ore cards use the potion
       * selected by the user.
       */
      const results =
        oreDefinitions.map(
          (ore) =>
            calculateOre(
              ore,
              settings.potion,
              settings,
              coreLevels
            )
        );

      /*
       * Best Setup tests all unlocked ores
       * against all potion tiers.
       *
       * Magma value does NOT affect the winner.
       */
      const candidates:
        OreResult[] = [];

      for (
        const ore of oreDefinitions
      ) {
        if (
          !accessiblePlanets.includes(
            ore.planet
          )
        ) {
          continue;
        }

        for (
          const potion of potionTiers
        ) {
          candidates.push(
            calculateOre(
              ore,
              potion,
              settings,
              coreLevels
            )
          );
        }
      }

      const recommendation =
        [...candidates].sort(
          (
            first,
            second
          ) =>
            second.sessionNetProfit -
            first.sessionNetProfit
        )[0];

      const selectedPotionCost =
        getPotionCostData(
          settings.potion,
          settings.t4PotCost,
          settings.afkTime
        );

      const effectiveFortune =
        settings.baseFortune *
        potionData[
          settings.potion
        ]
          .fortuneMultiplier;

      return {
        powerRank,

        accessiblePlanets,

        results,

        recommendation,

        selectedPotionCost,

        effectiveFortune,
      };
    }, [
      settings,
      coreLevels,
    ]);

  const moonResults =
    calculations.results.filter(
      (result) =>
        result.planet ===
        "moon"
    );

  const marsResults =
    calculations.results.filter(
      (result) =>
        result.planet ===
        "mars"
    );

  const sunResults =
    calculations.results.filter(
      (result) =>
        result.planet ===
        "sun"
    );

  return (
    <main className="min-h-screen bg-[#151b24] px-4 py-8 text-white md:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* PAGE HEADER */}
        <div className="mb-8">

          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#74c3ba]">
            Mining
          </p>

          <h1 className="mt-2 text-3xl font-bold md:text-4xl">
            Profit Calculator
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-[#9aa4af] md:text-base">
            Compare T5 mining profit using your saved
            refinery, Haste and Rank.
          </p>

        </div>

        {/* SETTINGS */}
        <CollapsibleSection
          eyebrow="Calculator"
          title="Settings"
          open={
            settings
              .openSections
              .settings
          }
          onToggle={() =>
            toggleSection(
              "settings"
            )
          }
          borderClass="border-[#46515d]"
          backgroundClass="bg-[#202731]"
          accentClass="text-[#74c3ba]"
          buttonClass="bg-[#26313b] text-[#74c3ba]"
        >

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            <NumberInput
              label="Base Fortune"
              value={
                settings.baseFortune
              }
              min={0}
              step={1000}
              onChange={(
                value
              ) =>
                updateSetting(
                  "baseFortune",
                  value
                )
              }
            />

            <SelectInput
              label="Potion Used"
              value={
                settings.potion
              }
              options={
                potionTiers
              }
              onChange={(
                value
              ) =>
                updateSetting(
                  "potion",
                  value as PotionTier
                )
              }
            />

            <NumberInput
              label="T4 Pot Stack Cost"
              suffix="T"
              value={
                settings.t4PotCost
              }
              min={0}
              step={1}
              onChange={(
                value
              ) =>
                updateSetting(
                  "t4PotCost",
                  value
                )
              }
            />

            <NumberInput
              label="Magma Price"
              suffix="B"
              value={
                settings.magmaPrice
              }
              min={0}
              step={1}
              onChange={(
                value
              ) =>
                updateSetting(
                  "magmaPrice",
                  value
                )
              }
            />

            <NumberInput
              label="AFK Time"
              suffix="Hr"
              value={
                settings.afkTime
              }
              min={0}
              step={0.25}
              onChange={(
                value
              ) =>
                updateSetting(
                  "afkTime",
                  value
                )
              }
            />

            <ToggleCard
              label="Cash Register"
              description="+3% ore revenue"
              enabled={
                settings.cashRegister
              }
              onToggle={() =>
                updateSetting(
                  "cashRegister",
                  !settings.cashRegister
                )
              }
            />

          </div>

          {/* PETS */}
          <div className="mt-6 border-t border-white/10 pt-6">

            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
              Pets
            </p>

            <div className="grid gap-4 lg:grid-cols-2">

              <PetInput
                name="Dune Ram"
                description="Increases refinery buff efficiency by 2% per level."
                owned={
                  settings.duneRamOwned
                }
                level={
                  settings.duneRamLevel
                }
                effect={
                  settings.duneRamOwned
                    ? `+${formatNumber(
                        clamp(
                          settings.duneRamLevel,
                          1,
                          100
                        ) *
                          2
                      )}% refinery buff efficiency`
                    : "Not used in calculations"
                }
                onToggle={() =>
                  updateSetting(
                    "duneRamOwned",
                    !settings.duneRamOwned
                  )
                }
                onLevelChange={(
                  level
                ) =>
                  updateSetting(
                    "duneRamLevel",
                    clamp(
                      level,
                      1,
                      100
                    )
                  )
                }
              />

              <PetInput
                name="Raven"
                description="1% chance per level for ore drops to be doubled."
                owned={
                  settings.ravenOwned
                }
                level={
                  settings.ravenLevel
                }
                effect={
                  settings.ravenOwned
                    ? `${formatNumber(
                        clamp(
                          settings.ravenLevel,
                          1,
                          100
                        )
                      )}% double-drop chance`
                    : "Not used in calculations"
                }
                onToggle={() =>
                  updateSetting(
                    "ravenOwned",
                    !settings.ravenOwned
                  )
                }
                onLevelChange={(
                  level
                ) =>
                  updateSetting(
                    "ravenLevel",
                    clamp(
                      level,
                      1,
                      100
                    )
                  )
                }
              />

            </div>

          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            <StatBox
              label="Effective Fortune"
              value={formatNumber(
                calculations.effectiveFortune
              )}
            />

            <StatBox
              label="Potion Duration"
              value={
                settings.potion ===
                "No Potion"
                  ? "N/A"
                  : `${calculations.selectedPotionCost.durationSeconds}s`
              }
            />

            <StatBox
              label="Pots Needed"
              value={
                settings.potion ===
                "No Potion"
                  ? "0"
                  : formatWholeNumber(
                      calculations.selectedPotionCost.potionsNeeded
                    )
              }
            />

            <StatBox
              label="Session Potion Cost"
              value={
                settings.potion ===
                "No Potion"
                  ? "0"
                  : `${formatDecimal(
                      calculations.selectedPotionCost.sessionCostT
                    )}T`
              }
            />

          </div>

        </CollapsibleSection>

        {/* PROGRESSION */}
        <CollapsibleSection
          eyebrow="From Cores Page"
          title="Current Progression"
          open={
            settings
              .openSections
              .progression
          }
          onToggle={() =>
            toggleSection(
              "progression"
            )
          }
          borderClass="border-[#46515d]"
          backgroundClass="bg-[#202731]"
          accentClass="text-[#74c3ba]"
          buttonClass="bg-[#26313b] text-[#74c3ba]"
        >

          <ProgressionSummary
            coreLevels={
              coreLevels
            }
            powerRank={
              calculations.powerRank
            }
            duneRamOwned={
              settings.duneRamOwned
            }
            duneRamLevel={
              settings.duneRamLevel
            }
          />

        </CollapsibleSection>

        {/* BEST SETUP */}
        <CollapsibleSection
          eyebrow="Optimised Recommendation"
          title="Best Setup"
          open={
            settings
              .openSections
              .recommendation
          }
          onToggle={() =>
            toggleSection(
              "recommendation"
            )
          }
          borderClass="border-[#4b8f83]"
          backgroundClass="bg-[#1d302f]"
          accentClass="text-[#81d4c7]"
          buttonClass="bg-[#27413e] text-[#81d4c7]"
        >

          {calculations.recommendation ? (
            <BestSetup
              result={
                calculations.recommendation
              }
              powerRank={
                calculations.powerRank
              }
              afkTime={
                settings.afkTime
              }
              cashRegister={
                settings.cashRegister
              }
              duneRamOwned={
                settings.duneRamOwned
              }
              duneRamLevel={
                settings.duneRamLevel
              }
              ravenOwned={
                settings.ravenOwned
              }
              ravenLevel={
                settings.ravenLevel
              }
            />
          ) : (
            <p className="text-sm text-white/50">
              No accessible ores found.
            </p>
          )}

        </CollapsibleSection>

        {/* MOON */}
        <PlanetSection
          title="Moon"
          planet="moon"
          results={
            moonResults
          }
          open={
            settings
              .openSections
              .moon
          }
          onToggle={() =>
            toggleSection(
              "moon"
            )
          }
          afkTime={
            settings.afkTime
          }
          unlocked
        />

        {/* MARS */}
        <PlanetSection
          title="Mars"
          planet="mars"
          results={
            marsResults
          }
          open={
            settings
              .openSections
              .mars
          }
          onToggle={() =>
            toggleSection(
              "mars"
            )
          }
          afkTime={
            settings.afkTime
          }
          unlocked={
            calculations.accessiblePlanets.includes(
              "mars"
            )
          }
        />

        {/* SUN */}
        <PlanetSection
          title="Sun"
          planet="sun"
          results={
            sunResults
          }
          open={
            settings
              .openSections
              .sun
          }
          onToggle={() =>
            toggleSection(
              "sun"
            )
          }
          afkTime={
            settings.afkTime
          }
          unlocked={
            calculations.accessiblePlanets.includes(
              "sun"
            )
          }
        />

        <div className="mt-6 rounded-xl border border-white/10 bg-[#1d242d] p-4 text-xs leading-5 text-white/45">
          Best Setup compares every unlocked ore with No
          Potion, T1, T2, T3 and T4. Magma value is shown
          separately and is never included in mining profit.
          Expected drops are rounded to the nearest whole
          item.
        </div>

      </div>

    </main>
  );
}


function PetInput({
  name,
  description,
  owned,
  level,
  effect,
  onToggle,
  onLevelChange,
}: {
  name: string;
  description: string;
  owned: boolean;
  level: number;
  effect: string;
  onToggle: () => void;

  onLevelChange: (
    level: number
  ) => void;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        owned
          ? "border-[#7b6b9f] bg-[#292537]"
          : "border-white/10 bg-[#191f27]"
      }`}
    >

      <div className="flex items-start justify-between gap-4">

        <div>

          <h3 className="font-bold">
            {name}
          </h3>

          <p className="mt-1 text-xs leading-5 text-white/45">
            {description}
          </p>

        </div>

        <button
          type="button"
          onClick={
            onToggle
          }
          className={`relative h-6 w-11 shrink-0 rounded-full transition ${
            owned
              ? "bg-[#a58bc2]"
              : "bg-[#3b444e]"
          }`}
        >

          <span
            className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
              owned
                ? "left-6"
                : "left-1"
            }`}
          />

        </button>

      </div>

      <div
        className={`mt-4 ${
          owned
            ? ""
            : "opacity-40"
        }`}
      >

        <label className="block">

          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
            Level
          </span>

          <input
            type="number"
            min={1}
            max={100}
            value={
              level
            }
            disabled={
              !owned
            }
            onChange={(
              event
            ) =>
              onLevelChange(
                Number(
                  event.target.value
                )
              )
            }
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-[#a58bc2] disabled:cursor-not-allowed"
          />

        </label>

        <p className="mt-3 text-xs font-semibold text-[#c9b2df]">
          {effect}
        </p>

      </div>

    </div>
  );
}



/* =========================================================
   PROGRESSION
   ========================================================= */

function ProgressionSummary({
  coreLevels,
  powerRank,
  duneRamOwned,
  duneRamLevel,
}: {
  coreLevels: Record<
    string,
    number
  >;

  powerRank: PowerRank;

  duneRamOwned: boolean;

  duneRamLevel: number;
}) {
  const rows =
    oreDefinitions.map(
      (ore) => {
        const hasteLevel =
          getHasteLevel(
            ore.hasteId,
            coreLevels
          );

        const sell =
          getSellPriceData(
            ore.refineryId,
            coreLevels
          );

        const refineryBonus =
          sell.currentSellPrice -
          sell.baseSellPrice;

        const duneMultiplier =
          duneRamOwned
            ? 1 +
              clamp(
                duneRamLevel,
                1,
                100
              ) *
                0.02
            : 1;

        const effectiveSell =
          sell.baseSellPrice +
          refineryBonus *
            duneMultiplier;

        return {
          ...ore,

          hasteLevel,

          refineryLevel:
            sell.level,

          currentSell:
            sell.currentSellPrice,

          effectiveSell,
        };
      }
    );

  return (
    <>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#7b5a98] bg-[#241f2c] px-4 py-3">

        <div>

          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#ceb1ea]">
            Current Rank
          </p>

          <p className="mt-1 text-xl font-bold">
            {powerRank}
          </p>

        </div>

        <p className="text-sm text-white/50">

          {powerRank ===
            "T5 P1" &&
            "Moon unlocked"}

          {powerRank ===
            "T5 P2" &&
            "Moon + Mars unlocked"}

          {powerRank ===
            "T5 P3" &&
            "Moon + Mars + Sun unlocked"}

        </p>

      </div>

      <div className="overflow-x-auto">

        <table className="w-full min-w-[720px] text-left text-sm">

          <thead className="bg-black/10 text-[10px] uppercase tracking-[0.16em] text-white/45">

            <tr>

              <th className="px-5 py-3">
                Ore
              </th>

              <th className="px-4 py-3">
                Haste
              </th>

              <th className="px-4 py-3">
                Refinery
              </th>

              <th className="px-4 py-3">
                Sell Price
              </th>

              <th className="px-5 py-3 text-right">
                Effective Sell
              </th>

            </tr>

          </thead>

          <tbody>

            {rows.map(
              (row) => (
                <tr
                  key={
                    row.id
                  }
                  className="border-t border-white/5"
                >

                  <td className="px-5 py-3 font-semibold">
                    {row.name}
                  </td>

                  <td className="px-4 py-3 text-white/65">
                    {row.hasteLevel}
                  </td>

                  <td className="px-4 py-3 text-white/65">
                    Lv{" "}
                    {row.refineryLevel}
                  </td>

                  <td className="px-4 py-3 text-white/65">
                    {formatNumber(
                      row.currentSell
                    )}
                  </td>

                  <td className="px-5 py-3 text-right font-bold">
                    {formatNumber(
                      row.effectiveSell
                    )}
                  </td>

                </tr>
              )
            )}

          </tbody>

        </table>

      </div>

    </>
  );
}

/* =========================================================
   BEST SETUP
   ========================================================= */

function BestSetup({
  result,
  powerRank,
  afkTime,
  cashRegister,
  duneRamOwned,
  duneRamLevel,
  ravenOwned,
  ravenLevel,
}: {
  result: OreResult;

  powerRank: PowerRank;

  afkTime: number;

  cashRegister: boolean;

  duneRamOwned: boolean;

  duneRamLevel: number;

  ravenOwned: boolean;

  ravenLevel: number;
}) {
  const theme =
    getPlanetTheme(
      result.planet
    );

  const safeAfkTime =
    Math.max(
      0,
      afkTime
    );

  return (
    <div>

      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-5">

        <div>

          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${theme.badge}`}
          >
            {result.planet}
          </span>

          <h3 className="mt-3 text-3xl font-bold">
            {result.name}
          </h3>

          <p className="mt-1 text-lg font-semibold text-[#a2eadf]">
            {result.potion ===
            "No Potion"
              ? "No Potion"
              : `${result.potion} Fortune Potion`}
          </p>

        </div>

        <div className="text-right">

          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
            Mining Profit
          </p>

          <p className="mt-1 text-3xl font-bold text-[#a2eadf]">
            {formatCoins(
              result.sessionNetProfit
            )}
          </p>

          <p className="mt-1 text-sm text-white/45">
            {formatCoins(
              result.netProfitPerHour
            )}
            /Hr
          </p>

        </div>

      </div>

      {/* ENABLED SETUP VARIABLES */}
      <div className="mt-5 flex flex-wrap gap-2">

        <SetupTag>
          {powerRank}
        </SetupTag>

        {cashRegister && (
          <SetupTag>
            Cash Register
          </SetupTag>
        )}

        {duneRamOwned && (
          <SetupTag>
            Dune Ram Lv{" "}
            {clamp(
              duneRamLevel,
              1,
              100
            )}
          </SetupTag>
        )}

        {ravenOwned && (
          <SetupTag>
            Raven Lv{" "}
            {clamp(
              ravenLevel,
              1,
              100
            )}
          </SetupTag>
        )}

      </div>

      {/* MAIN STATS */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">

        <RecommendationStat
          label="Potion"
          value={
            result.potion
          }
        />

        <RecommendationStat
          label="Pot Duration"
          value={
            result.potion ===
            "No Potion"
              ? "N/A"
              : `${result.potionData.durationSeconds}s`
          }
        />

        <RecommendationStat
          label="Pots Needed"
          value={formatWholeNumber(
            result.potionData.potionsNeeded
          )}
        />

        <RecommendationStat
          label="Session Pot Cost"
          value={formatCoins(
            result.potionData.sessionCostCoins
          )}
        />

        <RecommendationStat
          label="Revenue / Hr"
          value={formatCoins(
            result.revenuePerHour
          )}
        />

        <RecommendationStat
          label={`${formatDecimal(
            safeAfkTime
          )} Hr Mining Profit`}
          value={formatCoins(
            result.sessionNetProfit
          )}
        />

        <RecommendationStat
          label="Magma Profit / Hr"
          value={formatCoins(
            result.magmaValuePerHour
          )}
        />

        <RecommendationStat
          label={`${formatDecimal(
            safeAfkTime
          )} Hr Magma Profit`}
          value={formatCoins(
            result.magmaValueForSession
          )}
        />

      </div>

      {/* MAGMA SUMMARY */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_2fr]">

        <div className="rounded-xl border border-[#4b8f83]/50 bg-black/10 p-4">

          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#81d4c7]">
            Magma
          </p>

          <p className="mt-2 text-2xl font-bold">
            {formatWholeNumber(
              result.magmaForSession
            )}
          </p>

          <p className="mt-1 text-xs text-white/45">
            Magma from expected drops over{" "}
            {formatDecimal(
              safeAfkTime
            )}{" "}
            hours
          </p>

          <div className="mt-4 border-t border-white/10 pt-3">

            <div className="flex items-center justify-between gap-3 text-sm">

              <span className="text-white/50">
                Magma Profit
              </span>

              <span className="font-bold text-[#a2eadf]">
                {formatCoins(
                  result.magmaValueForSession
                )}
              </span>

            </div>

            <p className="mt-2 text-[10px] leading-4 text-white/30">
              Shown separately. This is not included in the
              Best Setup mining profit.
            </p>

          </div>

        </div>

        {/* AVERAGE DROPS */}
        <div className="rounded-xl border border-white/10 bg-black/10 p-4">

          <div className="flex flex-wrap items-end justify-between gap-3">

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                Average Expected Drops
              </p>

              <p className="mt-1 text-xs text-white/35">
                Rounded to nearest whole item
              </p>

            </div>

            <span className="text-xs font-semibold text-white/45">
              {formatDecimal(
                safeAfkTime
              )} Hr AFK
            </span>

          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">

            {result.drops.map(
              (drop) => (
                <div
                  key={
                    drop.material
                  }
                  className="rounded-lg border border-white/5 bg-black/10 px-3 py-3"
                >

                  <p className="truncate text-xs text-white/50">
                    {drop.material}
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {formatWholeNumber(
                      drop.expectedForSession
                    )}
                  </p>

                  <p className="mt-1 text-[9px] text-white/30">
                    {formatWholeNumber(
                      drop.expectedPerHour
                    )}
                    /Hr
                  </p>

                </div>
              )
            )}

          </div>

        </div>

      </div>

      {/* METHOD */}
      <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-4">

        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
          Recommendation Method
        </p>

        <p className="mt-2 text-sm leading-6 text-white/65">
          Every ore available at {powerRank} is tested with
          No Potion, T1, T2, T3 and T4. Potion costs use the
          selected AFK time and round up to whole potions.
          Best Setup is chosen using mining profit only.
          Magma profit is displayed separately and does not
          affect which setup wins.
        </p>

      </div>

    </div>
  );
}

function SetupTag({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span className="rounded-lg border border-white/10 bg-black/15 px-3 py-1.5 text-xs font-semibold text-white/70">
      {children}
    </span>
  );
}



/* =========================================================
   PLANETS
   ========================================================= */

function PlanetSection({
  title,
  planet,
  results,
  open,
  onToggle,
  afkTime,
  unlocked,
}: {
  title: string;

  planet: Planet;

  results: OreResult[];

  open: boolean;

  onToggle: () => void;

  afkTime: number;

  unlocked: boolean;
}) {
  const theme =
    getPlanetTheme(
      planet
    );

  const grid =
    planet ===
    "mars"
      ? "grid gap-4 xl:grid-cols-3"
      : "grid gap-4 lg:grid-cols-2";

  return (
    <section
      className={`mb-6 overflow-hidden rounded-2xl border ${theme.sectionBorder} ${theme.headerBg}`}
    >

      <button
        type="button"
        onClick={
          onToggle
        }
        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left md:px-6"
      >

        <div>

          <div className="flex flex-wrap items-center gap-2">

            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${theme.badge}`}
            >
              Planet
            </span>

            {!unlocked && (
              <span className="rounded-full bg-black/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
                Locked for recommendation
              </span>
            )}

          </div>

          <h2 className="mt-2 text-2xl font-bold">
            {title}
          </h2>

        </div>

        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl font-bold ${theme.button}`}
        >
          {open
            ? "−"
            : "+"}
        </span>

      </button>

      {open && (
        <div className="border-t border-white/10 p-4 md:p-5">

          {!unlocked && (
            <div className="mb-4 rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/50">
              These ores are shown for comparison but are
              excluded from Best Setup at your current rank.
            </div>
          )}

          <div className={grid}>

            {results.map(
              (result) => (
                <OreCard
                  key={
                    result.id
                  }
                  result={
                    result
                  }
                  afkTime={
                    afkTime
                  }
                />
              )
            )}

          </div>

        </div>
      )}

    </section>
  );
}

/* =========================================================
   ORE CARD
   ========================================================= */

function OreCard({
  result,
  afkTime,
}: {
  result: OreResult;

  afkTime: number;
}) {
  const theme =
    getPlanetTheme(
      result.planet
    );

  const safeAfkTime =
    Math.max(
      0,
      afkTime
    );

  return (
    <article
      className={`min-w-0 overflow-hidden rounded-2xl border ${theme.cardBorder} ${theme.cardBg}`}
    >

      <div className="p-4">

        {/* HEADER */}
        <div className="flex items-start justify-between gap-3">

          <div className="min-w-0">

            <h3 className="truncate text-xl font-bold">
              {result.name}
            </h3>

            <p className="mt-1 text-xs text-white/45">
              Haste{" "}
              {result.hasteLevel}
              {" • "}
              Refinery{" "}
              {result.refineryLevel}
              {" • "}
              {result.potion}
            </p>

          </div>

          <span
            className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${theme.badge}`}
          >
            {result.breakTime}s
          </span>

        </div>

        {/* GENERAL STATS */}
        <div className="mt-4 grid grid-cols-2 gap-2">

          <MiniStat
            label="Blocks / Hr"
            value={formatNumber(
              result.blocksPerHour,
              1
            )}
          />

          <MiniStat
            label="Sell / Block"
            value={formatNumber(
              result.effectiveSellPrice
            )}
          />

          <MiniStat
            label="Revenue / Hr"
            value={formatCoins(
              result.revenuePerHour
            )}
          />

          <MiniStat
            label="Magma / Hr"
            value={formatWholeNumber(
              result.magmaPerHour
            )}
          />

        </div>

        {/* POTION */}
        {result.potion !==
          "No Potion" && (
          <div className="mt-3 grid grid-cols-3 gap-2">

            <MiniStat
              label="Pot Duration"
              value={`${result.potionData.durationSeconds}s`}
            />

            <MiniStat
              label="Pots Needed"
              value={formatWholeNumber(
                result.potionData.potionsNeeded
              )}
            />

            <MiniStat
              label="Session Pot Cost"
              value={formatCoins(
                result.potionData.sessionCostCoins
              )}
            />

          </div>
        )}

        {/* DROPS */}
        <div
          className={`mt-3 rounded-xl ${theme.panel} p-3.5`}
        >

          <div className="flex items-start justify-between gap-3">

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                Expected Drops
              </p>

              <p className="mt-1 text-[10px] text-white/30">
                Over{" "}
                {formatDecimal(
                  safeAfkTime
                )}{" "}
                Hr AFK
              </p>

            </div>

            <div className="text-right">

              <p
                className={`text-sm font-bold ${theme.accent}`}
              >
                {formatWholeNumber(
                  result.magmaForSession
                )}{" "}
                Magma
              </p>

              <p className="mt-0.5 text-[9px] text-white/30">
                {formatCoins(
                  result.magmaValueForSession
                )} value
              </p>

            </div>

          </div>

          <div className="mt-3 space-y-2">

            {result.drops.map(
              (drop) => (
                <div
                  key={
                    drop.material
                  }
                  className="flex min-w-0 items-center justify-between gap-3"
                >

                  <div className="min-w-0">

                    <p className="truncate text-sm text-white/75">
                      {drop.material}
                    </p>

                    <p className="mt-0.5 text-[9px] text-white/30">
                      1 /
                      {formatNumber(
                        drop.odds
                      )}
                      {" • "}
                      {formatWholeNumber(
                        drop.expectedPerHour
                      )}
                      /Hr
                      {" • "}
                      {drop.magmaValue} Magma ea.
                    </p>

                  </div>

                  <span className="shrink-0 text-sm font-bold">
                    {formatWholeNumber(
                      drop.expectedForSession
                    )}
                  </span>

                </div>
              )
            )}

          </div>

        </div>

        {/* PROFIT */}
        <div className="mt-3 rounded-xl border border-white/10 bg-black/10 p-3.5">

          <div className="flex items-center justify-between gap-4">

            <span className="text-sm text-white/55">
              Revenue / Hr
            </span>

            <span className="font-bold">
              {formatCoins(
                result.revenuePerHour
              )}
            </span>

          </div>

          <div className="mt-2 flex items-center justify-between gap-4">

            <span className="text-sm text-white/55">
              Session Revenue
            </span>

            <span className="font-semibold">
              {formatCoins(
                result.sessionRevenue
              )}
            </span>

          </div>

          <div className="mt-2 flex items-center justify-between gap-4">

            <span className="text-sm text-white/55">
              Session Potion Cost
            </span>

            <span className="font-semibold text-[#e2b0a1]">
              -
              {formatCoins(
                result.potionData.sessionCostCoins
              )}
            </span>

          </div>

          <div className="my-3 border-t border-white/10" />

          <div className="flex items-end justify-between gap-4">

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                Net Profit / Hr
              </p>

              <p
                className={`mt-1 text-2xl font-bold ${theme.accent}`}
              >
                {formatCoins(
                  result.netProfitPerHour
                )}
              </p>

            </div>

            <div className="text-right">

              <p className="text-[10px] uppercase tracking-[0.12em] text-white/35">
                Margin
              </p>

              <p className="mt-1 text-sm font-bold">
                {formatDecimal(
                  result.margin,
                  2
                )}
                %
              </p>

            </div>

          </div>

          <div className="mt-3 flex items-center justify-between gap-4 rounded-lg bg-black/10 px-3 py-2">

            <span className="text-xs text-white/45">
              {formatDecimal(
                safeAfkTime
              )}{" "}
              Hr AFK Profit
            </span>

            <span className="text-sm font-bold">
              {formatCoins(
                result.sessionNetProfit
              )}
            </span>

          </div>

          <div className="mt-2 flex items-center justify-between gap-4 rounded-lg border border-white/5 bg-black/5 px-3 py-2">

            <span className="text-xs text-white/35">
              Magma Profit
            </span>

            <span className="text-xs font-semibold text-white/55">
              {formatCoins(
                result.magmaValueForSession
              )}
            </span>

          </div>

        </div>

      </div>

    </article>
  );
}

