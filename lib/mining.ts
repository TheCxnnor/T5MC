import {
  progressionCores,
  type ProgressionCore,
} from "../data/coreProgression";
import { materials } from "../data/materials";

type PotionTier = "No Potion" | "T1" | "T2" | "T3" | "T4";

type Planet = "moon" | "mars" | "sun";

type PowerRank = "T5 P1" | "T5 P2" | "T5 P3";

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

  selectedLevels?: Record<string, number>;

  openSections?: Record<string, boolean>;
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

const CORE_STORAGE_KEY = "t5-mission-control-cores";

const PROFIT_STORAGE_KEY = "t5-mission-control-profit";

/* =========================================================
   DEFAULTS
   ========================================================= */

const DEFAULT_OPEN_SECTIONS: ProfitOpenSections = {
  settings: true,
  progression: true,
  recommendation: true,
  moon: true,
  mars: true,
  sun: true,
};

const DEFAULT_PROFIT_STATE: ProfitSavedState = {
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

  openSections: DEFAULT_OPEN_SECTIONS,
};

/* =========================================================
   POTIONS

   Times are SECONDS.

   T1 = 30 seconds
   T2 = 45 seconds
   T3 = 60 seconds
   T4 = 75 seconds
   ========================================================= */

const potionTiers: PotionTier[] = ["No Potion", "T1", "T2", "T3", "T4"];

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

const oreDefinitions: OreDefinition[] = [
  {
    id: "basalt",

    name: "Basalt",

    planet: "moon",

    refineryId: "basalt-refinery",

    hasteId: "moon-haste",

    breakTimes: [1.5, 1.3, 1.2, 1.05, 1, 0.9],

    drops: [
      {
        material: "Lunar Fragment",

        odds: 500,
      },

      {
        material: "Basalt Shard",

        odds: 1000,
      },

      {
        material: "Chisilite Shard",

        odds: 1000,
      },
    ],
  },

  {
    id: "brecca",

    name: "Brecca Crystal",

    planet: "moon",

    refineryId: "brecca-refinery",

    hasteId: "moon-haste",

    breakTimes: [0.75, 0.7, 0.65, 0.6, 0.55, 0.55],

    drops: [
      {
        material: "Lunar Fragment",

        odds: 500,
      },

      {
        material: "Chisilite Shard",

        odds: 1000,
      },

      {
        material: "Brecca Powder",

        odds: 2000,
      },
    ],
  },

  {
    id: "regolith",

    name: "Regolith",

    planet: "mars",

    refineryId: "regolith",

    hasteId: "mars-haste",

    breakTimes: [3.3, 2.8, 2.45, 2.2, 2, 1.8],

    drops: [
      {
        material: "Regolith Soil",

        odds: 200,
      },

      {
        material: "Martian Dust",

        odds: 500,
      },

      {
        material: "Rhodnite",

        odds: 2500,
      },
    ],
  },

  {
    id: "amber-rock",

    name: "Amber Rock",

    planet: "mars",

    refineryId: "amber-rock",

    hasteId: "mars-haste",

    breakTimes: [1.5, 1.3, 1.2, 1.05, 1, 0.9],

    drops: [
      {
        material: "Amber Fragment",

        odds: 500,
      },

      {
        material: "Ametrine",

        odds: 1000,
      },

      {
        material: "Rhodnite",

        odds: 2500,
      },
    ],
  },

  {
    id: "amber-crystal",

    name: "Amber Crystal",

    planet: "mars",

    refineryId: "amber-crystal",

    hasteId: "mars-haste",

    breakTimes: [0.75, 0.7, 0.65, 0.6, 0.55, 0.55],

    drops: [
      {
        material: "Amber Fragment",

        odds: 500,
      },

      {
        material: "Ametrine",

        odds: 1000,
      },

      {
        material: "Rhodnite",

        odds: 2500,
      },
    ],
  },

  {
    id: "crimson-plasma",

    name: "Crimson Plasma",

    planet: "sun",

    refineryId: "crimson-plasma",

    hasteId: "sun-haste",

    breakTimes: [0.75, 0.7, 0.65, 0.6, 0.55, 0.55],

    drops: [
      {
        material: "Sun Fragment",

        odds: 500,
      },

      {
        material: "Plasma Shard",

        odds: 2000,
      },
    ],
  },

  {
    id: "cosmic-fiber",

    name: "Cosmic Fiber",

    planet: "sun",

    refineryId: "cosmic-fiber",

    hasteId: "sun-haste",

    breakTimes: [1.5, 1.3, 1.2, 1.05, 1, 0.9],

    drops: [
      {
        material: "Sun Fragment",

        odds: 500,
      },

      {
        material: "Fiber",

        odds: 1000,
      },
    ],
  },
];

/* =========================================================
   MATERIAL VALUES
   ========================================================= */

const materialValues = Object.values(materials) as Array<{
  name: string;
  magmaValue?: number;
}>;

/* =========================================================
   HELPERS
   ========================================================= */

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function formatDecimal(value: number, decimals = 2) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return value.toFixed(decimals).replace(/\.?0+$/, "");
}

function formatNumber(value: number, maximumFractionDigits = 0) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return value.toLocaleString(undefined, {
    maximumFractionDigits,
  });
}

function formatWholeNumber(value: number) {
  return Math.round(value).toLocaleString();
}

function formatCoins(value: number) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  const absolute = Math.abs(value);

  if (absolute >= 1_000_000_000_000_000) {
    return `${formatDecimal(value / 1_000_000_000_000_000)}Qd`;
  }

  if (absolute >= 1_000_000_000_000) {
    return `${formatDecimal(value / 1_000_000_000_000)}T`;
  }

  if (absolute >= 1_000_000_000) {
    return `${formatDecimal(value / 1_000_000_000)}B`;
  }

  if (absolute >= 1_000_000) {
    return `${formatDecimal(value / 1_000_000)}M`;
  }

  if (absolute >= 1000) {
    return `${formatDecimal(value / 1000)}K`;
  }

  return formatDecimal(value);
}

function getMagmaValue(materialName: string) {
  return (
    materialValues.find((material) => material.name === materialName)
      ?.magmaValue ?? 0
  );
}

function getCore(id: string) {
  return progressionCores.find((core) => core.id === id);
}

function getSavedCoreLevel(
  selectedLevels: Record<string, number>,

  core: ProgressionCore | undefined,
) {
  if (!core) {
    return 0;
  }

  const requested = selectedLevels[core.id];

  if (
    requested !== undefined &&
    core.levels.some((level) => level.level === requested)
  ) {
    return requested;
  }

  return core.levels[0]?.level ?? 0;
}

function getHasteLevel(
  hasteId: string,

  selectedLevels: Record<string, number>,
) {
  const core = getCore(hasteId);

  return getSavedCoreLevel(selectedLevels, core);
}

function getSellPriceData(
  refineryId: string,

  selectedLevels: Record<string, number>,
) {
  const core = getCore(refineryId);

  if (!core) {
    return {
      level: 0,

      baseSellPrice: 0,

      currentSellPrice: 0,
    };
  }

  const level = getSavedCoreLevel(selectedLevels, core);

  const baseSellPrice = core.levels[0]?.sellPrice ?? 0;

  const currentSellPrice =
    core.levels.find((entry) => entry.level === level)?.sellPrice ??
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
  const exactIds = ["power", "power-rank", "t5-power"];

  for (const id of exactIds) {
    const found = getCore(id);

    if (found) {
      return found;
    }
  }

  return progressionCores.find((core) =>
    core.name.toLowerCase().includes("power"),
  );
}

function getPowerRank(selectedLevels: Record<string, number>): PowerRank {
  const powerCore = getPowerCore();

  const directSavedPower =
    selectedLevels["power"] ??
    selectedLevels["power-rank"] ??
    selectedLevels["t5-power"];

  if (!powerCore && directSavedPower !== undefined) {
    if (directSavedPower >= 3) {
      return "T5 P3";
    }

    if (directSavedPower >= 2) {
      return "T5 P2";
    }

    return "T5 P1";
  }

  if (!powerCore) {
    return "T5 P1";
  }

  const savedLevel = getSavedCoreLevel(selectedLevels, powerCore);

  const selectedEntry = powerCore.levels.find(
    (entry) => entry.level === savedLevel,
  );

  const label = selectedEntry?.label?.toUpperCase() ?? "";

  if (label.includes("P3")) {
    return "T5 P3";
  }

  if (label.includes("P2")) {
    return "T5 P2";
  }

  if (savedLevel >= 3) {
    return "T5 P3";
  }

  if (savedLevel >= 2) {
    return "T5 P2";
  }

  return "T5 P1";
}

function getAccessiblePlanets(powerRank: PowerRank): Planet[] {
  if (powerRank === "T5 P3") {
    return ["moon", "mars", "sun"];
  }

  if (powerRank === "T5 P2") {
    return ["moon", "mars"];
  }

  return ["moon"];
}

/* =========================================================
   POTION COSTS
   ========================================================= */

function getPotionCostData(
  potionTier: PotionTier,

  t4StackCostT: number,

  afkHours: number,
): PotionCostResult {
  if (potionTier === "No Potion") {
    return {
      stackCostT: 0,

      perPotionCostT: 0,

      durationSeconds: 0,

      theoreticalCostPerHourT: 0,

      potionsNeeded: 0,

      sessionCostT: 0,

      sessionCostCoins: 0,

      effectiveSessionCostPerHourCoins: 0,
    };
  }

  const potion = potionData[potionTier];

  const stackCostT = t4StackCostT / potion.t4PriceDivisor;

  const perPotionCostT = stackCostT / 64;

  const durationSeconds = potion.durationSeconds;

  const theoreticalPotionsPerHour = 3600 / durationSeconds;

  const theoreticalCostPerHourT = perPotionCostT * theoreticalPotionsPerHour;

  const safeAfkHours = Math.max(0, afkHours);

  const sessionSeconds = safeAfkHours * 3600;

  const potionsNeeded =
    sessionSeconds > 0 ? Math.ceil(sessionSeconds / durationSeconds) : 0;

  const sessionCostT = potionsNeeded * perPotionCostT;

  const sessionCostCoins = sessionCostT * 1_000_000_000_000;

  const effectiveSessionCostPerHourCoins =
    safeAfkHours > 0
      ? sessionCostCoins / safeAfkHours
      : theoreticalCostPerHourT * 1_000_000_000_000;

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

export function calculateOre(
  ore: OreDefinition,

  potionTier: PotionTier,

  settings: ProfitSavedState,

  coreLevels: Record<string, number>,
): OreResult {
  const afkTime = Math.max(0, settings.afkTime);

  const potion = potionData[potionTier];

  const effectiveFortune = settings.baseFortune * potion.fortuneMultiplier;

  const currentPotionData = getPotionCostData(
    potionTier,
    settings.t4PotCost,
    afkTime,
  );

  /*
   * Raven:
   * +1% expected drops per level.
   */
  const ravenMultiplier = settings.ravenOwned
    ? 1 + clamp(settings.ravenLevel, 1, 100) / 100
    : 1;

  /*
   * Dune Ram:
   * +2% refinery BUFF efficiency
   * per level.
   */
  const duneMultiplier = settings.duneRamOwned
    ? 1 + clamp(settings.duneRamLevel, 1, 100) * 0.02
    : 1;

  /*
   * Haste.
   */
  const hasteLevel = clamp(getHasteLevel(ore.hasteId, coreLevels), 0, 5);

  const breakTime = ore.breakTimes[hasteLevel] ?? ore.breakTimes[0];

  const blocksPerHour = 3600 / breakTime;

  /*
   * Refinery.
   */
  const sellData = getSellPriceData(ore.refineryId, coreLevels);

  const refineryBonus = sellData.currentSellPrice - sellData.baseSellPrice;

  const enhancedRefineryBonus = refineryBonus * duneMultiplier;

  const effectiveSellPrice = sellData.baseSellPrice + enhancedRefineryBonus;

  /*
   * Mining revenue.
   */
  let revenuePerHour =
    blocksPerHour * (effectiveFortune / 100) * effectiveSellPrice;

  if (settings.cashRegister) {
    revenuePerHour *= 1.03;
  }

  const sessionRevenue = revenuePerHour * afkTime;

  /*
   * DROPS
   *
   * Expected drops are rounded to the
   * nearest whole number everywhere.
   */
  const drops = ore.drops.map((drop): DropResult => {
    const rawPerHour = (blocksPerHour / drop.odds) * ravenMultiplier;

    const rawForSession = rawPerHour * afkTime;

    const expectedPerHour = Math.round(rawPerHour);

    const expectedForSession = Math.round(rawForSession);

    const magmaValue = getMagmaValue(drop.material);

    const magmaPerHour = expectedPerHour * magmaValue;

    const magmaForSession = expectedForSession * magmaValue;

    return {
      material: drop.material,

      odds: drop.odds,

      expectedPerHour,

      expectedForSession,

      magmaValue,

      magmaPerHour,

      magmaForSession,
    };
  });

  const magmaPerHour = drops.reduce(
    (total, drop) => total + drop.magmaPerHour,
    0,
  );

  const magmaForSession = drops.reduce(
    (total, drop) => total + drop.magmaForSession,
    0,
  );

  const magmaValuePerHour = magmaPerHour * settings.magmaPrice * 1_000_000_000;

  const magmaValueForSession =
    magmaForSession * settings.magmaPrice * 1_000_000_000;

  /*
   * Mining profit.
   *
   * Magma remains COMPLETELY SEPARATE.
   */
  const sessionNetProfit = sessionRevenue - currentPotionData.sessionCostCoins;

  const netProfitPerHour =
    afkTime > 0
      ? sessionNetProfit / afkTime
      : revenuePerHour - currentPotionData.effectiveSessionCostPerHourCoins;

  const margin =
    sessionRevenue > 0
      ? (sessionNetProfit / sessionRevenue) * 100
      : revenuePerHour > 0
        ? (netProfitPerHour / revenuePerHour) * 100
        : 0;

  return {
    id: ore.id,

    name: ore.name,

    planet: ore.planet,

    potion: potionTier,

    hasteLevel,

    refineryLevel: sellData.level,

    breakTime,

    blocksPerHour,

    baseSellPrice: sellData.baseSellPrice,

    refinerySellPrice: sellData.currentSellPrice,

    effectiveSellPrice,

    effectiveFortune,

    revenuePerHour,

    sessionRevenue,

    potionData: currentPotionData,

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

export function getHourlyMiningRates(
  saved: Record<string, unknown>,
  levels: Record<string, number>,
) {
  const settings = {
    ...DEFAULT_PROFIT_STATE,
    ...saved,
    afkTime: 1,
  } as ProfitSavedState;
  if (!potionTiers.includes(settings.potion)) settings.potion = "No Potion";
  return oreDefinitions.map((ore) =>
    calculateOre(ore, settings.potion, settings, levels),
  );
}
