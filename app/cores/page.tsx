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
  type CoreCost,
  type CoreLevel,
} from "../../data/coreProgression";
import {
  canonicalCoreName,
  combineCosts,
  getCoreRecipe,
  getRecursiveCoreDependencies,
  getRecursiveRawMaterials,
  prepareDisplayCosts,
  type CoreRecipe,
} from "../../lib/coreRecipes";
import { MaterialTotals } from "../../components/ui/MaterialTotals";
import { getCoreMaterialSummary } from "../../lib/materialTotals";

type Region = "moon" | "mars" | "sun";

type OpenSections = {
  magma: boolean;
  power: boolean;
  moon: boolean;
  mars: boolean;
  sun: boolean;
  totals: boolean;
};

type DisplayCoreLevel = CoreLevel & {
  sellPrice?: number;
};

type Theme = {
  sectionBorder: string;
  sectionGlow: string;
  badgeText: string;
  badgeBg: string;
  titleText: string;
  sectionBg: string;
  cardBg: string;
  cardBorder: string;
  cardGlow: string;
  selectBg: string;
  selectBorder: string;
  selectFocus: string;
  progressTrack: string;
  progressFill: string;
  sellBg: string;
  panelBg: string;
  divider: string;
  collapseBtn: string;
  collapseBtnText: string;
};

type SavedCoreState = {
  magmaStorage: number;
  selectedLevels: Record<string, number>;
  openSections: OpenSections;
};

const STORAGE_KEY = "t5-mission-control-cores";

const defaultOpenSections: OpenSections = {
  magma: true,
  power: true,
  moon: true,
  mars: true,
  sun: true,
  totals: false,
};

const magmaStages = [
  { storage: 1000, nextCost: 1 },
  { storage: 1500, nextCost: 2 },
  { storage: 2000, nextCost: 4 },
  { storage: 2500, nextCost: 6 },
  { storage: 3000, nextCost: 10 },
  { storage: 3500, nextCost: 32 },
  { storage: 4000, nextCost: 48 },
  { storage: 4500, nextCost: 64 },
  { storage: 5000, nextCost: 96 },
  { storage: 7500, nextCost: 128 },
  { storage: 10000, nextCost: 0 },
];

function formatNumber(value: number) {
  return value.toLocaleString();
}

function formatDecimal(value: number) {
  if (Number.isInteger(value)) {
    return value.toString();
  }

  return value.toFixed(2).replace(/\.?0+$/, "");
}

function formatCompactNumber(value: number) {
  if (value >= 1_000_000_000_000_000) {
    return `${formatDecimal(
      value / 1_000_000_000_000_000
    )}Qd`;
  }

  if (value >= 1_000_000_000_000) {
    return `${formatDecimal(
      value / 1_000_000_000_000
    )}T`;
  }

  if (value >= 1_000_000_000) {
    return `${formatDecimal(
      value / 1_000_000_000
    )}B`;
  }

  if (value >= 1_000_000) {
    return `${formatDecimal(
      value / 1_000_000
    )}M`;
  }

  if (value >= 1_000) {
    return `${formatDecimal(
      value / 1_000
    )}K`;
  }

  return formatNumber(value);
}

function formatCostValue(cost: CoreCost) {
  if (cost.name === "Qd Coins") {
    return `${formatNumber(cost.amount)}Qd`;
  }

  if (cost.name === "Coins") {
    return formatCompactNumber(cost.amount);
  }

  return formatNumber(cost.amount);
}

function getDisplayCostName(cost: CoreCost) {
  if (cost.name === "Qd Coins") {
    return "Coins";
  }

  return cost.name;
}

function getMoonTheme(): Theme {
  return {
    sectionBorder: "border-[#405a78]",
    sectionGlow:
      "shadow-[0_0_0_1px_rgba(96,141,196,0.12)]",
    badgeText: "text-[#9bbcff]",
    badgeBg: "bg-[#243446]",
    titleText: "text-white",
    sectionBg: "bg-[#202833]",
    cardBg: "bg-[#2b3744]",
    cardBorder: "border-[#6785a8]",
    cardGlow:
      "shadow-[0_8px_28px_rgba(0,0,0,0.15)]",
    selectBg: "bg-[#253341]",
    selectBorder: "border-[#6785a8]",
    selectFocus: "focus:border-[#9bbcff]",
    progressTrack: "bg-[#1a2430]",
    progressFill: "bg-[#8ea9d6]",
    sellBg: "bg-[#22303d]",
    panelBg: "bg-[#24303b]",
    divider: "border-white/10",
    collapseBtn:
      "bg-[#253242] hover:bg-[#2d3d4f]",
    collapseBtnText: "text-[#9bbcff]",
  };
}

function getMarsTheme(): Theme {
  return {
    sectionBorder: "border-[#9a5a49]",
    sectionGlow:
      "shadow-[0_0_0_1px_rgba(154,90,73,0.12)]",
    badgeText: "text-[#efaa91]",
    badgeBg: "bg-[#3b2b28]",
    titleText: "text-white",
    sectionBg: "bg-[#261f22]",
    cardBg: "bg-[#3a2a28]",
    cardBorder: "border-[#cb8168]",
    cardGlow:
      "shadow-[0_8px_28px_rgba(0,0,0,0.18)]",
    selectBg: "bg-[#432f2c]",
    selectBorder: "border-[#b8735e]",
    selectFocus: "focus:border-[#efaa91]",
    progressTrack: "bg-[#2d2020]",
    progressFill: "bg-[#d48b73]",
    sellBg: "bg-[#332421]",
    panelBg: "bg-[#342625]",
    divider: "border-white/10",
    collapseBtn:
      "bg-[#3a2a28] hover:bg-[#46312e]",
    collapseBtnText: "text-[#efaa91]",
  };
}

function getSunTheme(): Theme {
  return {
    sectionBorder: "border-[#8b783a]",
    sectionGlow:
      "shadow-[0_0_0_1px_rgba(184,156,72,0.12)]",
    badgeText: "text-[#e4cc7e]",
    badgeBg: "bg-[#383221]",
    titleText: "text-white",
    sectionBg: "bg-[#252317]",
    cardBg: "bg-[#3a3423]",
    cardBorder: "border-[#b89c48]",
    cardGlow:
      "shadow-[0_8px_28px_rgba(0,0,0,0.18)]",
    selectBg: "bg-[#453d28]",
    selectBorder: "border-[#b89c48]",
    selectFocus: "focus:border-[#e4cc7e]",
    progressTrack: "bg-[#2d291d]",
    progressFill: "bg-[#d9bf72]",
    sellBg: "bg-[#332f22]",
    panelBg: "bg-[#342f22]",
    divider: "border-white/10",
    collapseBtn:
      "bg-[#3a3423] hover:bg-[#49412a]",
    collapseBtnText: "text-[#e4cc7e]",
  };
}

function getPowerTheme(): Theme {
  return {
    sectionBorder: "border-[#7b5a98]",
    sectionGlow:
      "shadow-[0_0_0_1px_rgba(123,90,152,0.12)]",
    badgeText: "text-[#ceb1ea]",
    badgeBg: "bg-[#30263c]",
    titleText: "text-white",
    sectionBg: "bg-[#241f2c]",
    cardBg: "bg-[#342c3c]",
    cardBorder: "border-[#8f72a5]",
    cardGlow:
      "shadow-[0_8px_28px_rgba(0,0,0,0.18)]",
    selectBg: "bg-[#2d2635]",
    selectBorder: "border-[#8f72a5]",
    selectFocus: "focus:border-[#ceb1ea]",
    progressTrack: "bg-[#221d28]",
    progressFill: "bg-[#b79ac7]",
    sellBg: "bg-[#2c2533]",
    panelBg: "bg-[#2e2735]",
    divider: "border-white/10",
    collapseBtn:
      "bg-[#342c3c] hover:bg-[#403447]",
    collapseBtnText: "text-[#ceb1ea]",
  };
}

function getMagmaTheme(): Theme {
  return {
    sectionBorder: "border-[#b66b3f]",
    sectionGlow:
      "shadow-[0_0_0_1px_rgba(182,107,63,0.16)]",
    badgeText: "text-[#ffbb8f]",
    badgeBg: "bg-[#3a261b]",
    titleText: "text-white",
    sectionBg: "bg-[#241d1a]",
    cardBg: "bg-[#33231d]",
    cardBorder: "border-[#c57c4d]",
    cardGlow:
      "shadow-[0_8px_28px_rgba(0,0,0,0.18)]",
    selectBg: "bg-[#3b2922]",
    selectBorder: "border-[#b66b3f]",
    selectFocus: "focus:border-[#ffbb8f]",
    progressTrack: "bg-[#261b17]",
    progressFill: "bg-[#e6925c]",
    sellBg: "bg-[#2d201b]",
    panelBg: "bg-[#2f221d]",
    divider: "border-white/10",
    collapseBtn:
      "bg-[#33231d] hover:bg-[#402a21]",
    collapseBtnText: "text-[#ffbb8f]",
  };
}

function getTotalsTheme(): Theme {
  return {
    ...getMoonTheme(),
    sectionBorder: "border-[#56734f]",
    sectionBg: "bg-[#202a20]",
    sectionGlow:
      "shadow-[0_0_0_1px_rgba(86,115,79,0.12)]",
    badgeText: "text-[#a9cf9f]",
    badgeBg: "bg-[#30432d]",
    collapseBtn:
      "bg-[#30432d] hover:bg-[#3b5136]",
    collapseBtnText: "text-[#b9dfaf]",
  };
}

function getRegionTheme(region: Region): Theme {
  if (region === "moon") {
    return getMoonTheme();
  }

  if (region === "mars") {
    return getMarsTheme();
  }

  return getSunTheme();
}

function getRemainingCosts(
  core: ProgressionCore,
  selectedLevel: number
) {
  const costs = core.levels
    .filter(
      (level) =>
        level.level >=
        selectedLevel
    )
    .flatMap(
      (level) =>
        level.nextCost
    );

  return combineCosts(costs);
}

function magmaCoreBreakdown(
  coreCount: number
) {
  return [
    {
      name: "Molten Core",
      amount: coreCount,
    },
    {
      name: "Chisilite Shard",
      amount: coreCount * 8,
    },
    {
      name: "Amber Fragment",
      amount: coreCount * 4,
    },
    {
      name: "Magma",
      amount: coreCount * 500,
    },
  ];
}

function getDisplayLevels(
  core: ProgressionCore
): DisplayCoreLevel[] {
  return core.levels as DisplayCoreLevel[];
}

function getProgressPercent(
  current: number,
  max: number
) {
  if (max <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      (current / max) * 100
    )
  );
}

function multiplyRecipe(
  recipe: CoreRecipe,
  quantity: number
) {
  return recipe.ingredients.map(
    (ingredient) => ({
      name: ingredient.name,
      amount:
        ingredient.amount *
        quantity,
    })
  );
}

function getMaterialTotals(
  selectedLevels: Record<string, number>,
  remainingMagmaCores: number
) {
  const required: CoreCost[] = [];

  for (const core of progressionCores) {
    const selectedLevel =
      selectedLevels[core.id] ?? core.levels[0]?.level ?? 0;

    for (const level of core.levels) {
      if (level.level < selectedLevel) {
        continue;
      }

      // Normalize each upgrade's recipe breakdown before combining upgrades.
      // Independent Moon and Mars requirements must not cancel Sun ingredients.
      required.push(...prepareDisplayCosts(level.nextCost));
    }
  }

  if (remainingMagmaCores > 0) {
    required.push({ name: "Molten Core", amount: remainingMagmaCores });
  }

  const craftedCoreAmounts: Record<string, number> = {};
  const raw: Record<string, number> = {};

  for (const cost of combineCosts(required)) {
    if (getCoreRecipe(cost.name)) {
      const canonical = canonicalCoreName(cost.name);
      craftedCoreAmounts[canonical] =
        (craftedCoreAmounts[canonical] ?? 0) + cost.amount;

      // Include lower-star crafting steps while expanding raw ingredients once.
      getRecursiveCoreDependencies(canonical, cost.amount, craftedCoreAmounts);
      getRecursiveRawMaterials(canonical, cost.amount, raw);
    } else {
      raw[cost.name] = (raw[cost.name] ?? 0) + cost.amount;
    }
  }

  return {
    craftedCores: Object.entries(craftedCoreAmounts)
      .filter(([, amount]) => amount > 0)
      .map(([name, amount]) => ({ name, amount })),
    rawMaterials: Object.entries(raw)
      .filter(([, amount]) => amount > 0)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export default function CoresPage() {
  const [
    openSections,
    setOpenSections,
  ] =
    useState<OpenSections>(
      defaultOpenSections
    );

  const [
    magmaStorage,
    setMagmaStorage,
  ] =
    useState(1000);

  const [
    selectedLevels,
    setSelectedLevels,
  ] = useState<
    Record<string, number>
  >({});

  const [
    storageLoaded,
    setStorageLoaded,
  ] =
    useState(false);

  useEffect(() => {
    try {
      const saved =
        window.localStorage.getItem(
          STORAGE_KEY
        );

      if (!saved) {
        setStorageLoaded(
          true
        );
        return;
      }

      const parsed =
        JSON.parse(
          saved
        ) as Partial<SavedCoreState>;

      if (
        typeof parsed.magmaStorage ===
        "number"
      ) {
        const valid =
          magmaStages.some(
            (stage) =>
              stage.storage ===
              parsed.magmaStorage
          );

        if (valid) {
          setMagmaStorage(
            parsed.magmaStorage
          );
        }
      }

      if (
        parsed.selectedLevels &&
        typeof parsed.selectedLevels ===
          "object"
      ) {
        setSelectedLevels(
          parsed.selectedLevels
        );
      }

      if (
        parsed.openSections &&
        typeof parsed.openSections ===
          "object"
      ) {
        setOpenSections({
          ...defaultOpenSections,
          ...parsed.openSections,
        });
      }
    } catch (error) {
      console.error(
        "Could not load saved core progression:",
        error
      );
    } finally {
      setStorageLoaded(
        true
      );
    }
  }, []);

  useEffect(() => {
    if (
      !storageLoaded
    ) {
      return;
    }

    const stateToSave: SavedCoreState = {
      magmaStorage,
      selectedLevels,
      openSections,
    };

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
          stateToSave
        )
      );
    } catch (error) {
      console.error(
        "Could not save core progression:",
        error
      );
    }
  }, [
    magmaStorage,
    selectedLevels,
    openSections,
    storageLoaded,
  ]);

  function toggleSection(
    section: keyof OpenSections
  ) {
    setOpenSections(
      (current) => ({
        ...current,
        [section]:
          !current[
            section
          ],
      })
    );
  }

  function setCoreLevel(
    coreId: string,
    level: number
  ) {
    setSelectedLevels(
      (current) => ({
        ...current,
        [coreId]:
          level,
      })
    );
  }

  const grouped =
    useMemo(() => {
      return {
        power:
          progressionCores.find(
            (core) =>
              core.id ===
              "power"
          ),

        moon:
          progressionCores.filter(
            (core) =>
              core.region ===
              "moon"
          ),

        mars:
          progressionCores.filter(
            (core) =>
              core.region ===
                "mars" &&
              core.id !==
                "power"
          ),

        sun:
          progressionCores.filter(
            (core) =>
              core.region ===
              "sun"
          ),
      };
    }, []);

  const currentMagmaStage =
    magmaStages.find(
      (stage) =>
        stage.storage ===
        magmaStorage
    ) ??
    magmaStages[0];

  const remainingMagmaCores =
    magmaStages
      .filter(
        (stage) =>
          stage.storage >=
          magmaStorage
      )
      .reduce(
        (
          total,
          stage
        ) =>
          total +
          stage.nextCost,
        0
      );

  const nextMagmaCosts =
    currentMagmaStage.nextCost >
    0
      ? magmaCoreBreakdown(
          currentMagmaStage.nextCost
        )
      : [];

  const maxMagmaCosts =
    remainingMagmaCores >
    0
      ? magmaCoreBreakdown(
          remainingMagmaCores
        )
      : [];

  const magmaProgress =
    getProgressPercent(
      magmaStorage,
      10000
    );

  const materialTotals = useMemo(
    () => getCoreMaterialSummary(getMaterialTotals(selectedLevels, remainingMagmaCores)),
    [selectedLevels, remainingMagmaCores]
  );

  return (
    <main className="min-h-screen bg-[#151b24] px-4 py-8 text-white md:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        <div className="mb-8">

          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8ea9d6]">
            Progression
          </p>

          <h1 className="mt-2 text-3xl font-bold md:text-4xl">
            Cores
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-[#9aa4af] md:text-base">
            Track Magma Storage,
            Power and progression
            upgrades across Moon,
            Mars and Sun.
          </p>

        </div>

        <MagmaSection
          open={
            openSections.magma
          }

          onToggle={() =>
            toggleSection(
              "magma"
            )
          }

          magmaStorage={
            magmaStorage
          }

          setMagmaStorage={
            setMagmaStorage
          }

          nextMagmaCosts={
            nextMagmaCosts
          }

          maxMagmaCosts={
            maxMagmaCosts
          }

          progress={
            magmaProgress
          }
        />

        <PowerSection
          open={
            openSections.power
          }

          onToggle={() =>
            toggleSection(
              "power"
            )
          }

          core={
            grouped.power
          }

          selectedLevels={
            selectedLevels
          }

          setCoreLevel={
            setCoreLevel
          }
        />

        <PlanetSection
          title="Moon"
          region="moon"

          open={
            openSections.moon
          }

          onToggle={() =>
            toggleSection(
              "moon"
            )
          }

          cores={
            grouped.moon
          }

          selectedLevels={
            selectedLevels
          }

          setCoreLevel={
            setCoreLevel
          }
        />

        <PlanetSection
          title="Mars"
          region="mars"

          open={
            openSections.mars
          }

          onToggle={() =>
            toggleSection(
              "mars"
            )
          }

          cores={
            grouped.mars
          }

          selectedLevels={
            selectedLevels
          }

          setCoreLevel={
            setCoreLevel
          }
        />

        <PlanetSection
          title="Sun"
          region="sun"

          open={
            openSections.sun
          }

          onToggle={() =>
            toggleSection(
              "sun"
            )
          }

          cores={
            grouped.sun
          }

          selectedLevels={
            selectedLevels
          }

          setCoreLevel={
            setCoreLevel
          }
        />

        <SectionShell
          badge="Materials"
          title="Material Totals"

          open={
            openSections.totals
          }

          onToggle={() =>
            toggleSection(
              "totals"
            )
          }

          theme={
            getTotalsTheme()
          }
        >

          <MaterialTotals
            summary={materialTotals}
            description="Cumulative requirements to max Magma Storage, Power Rank and all planetary upgrades."
            emptyMessage="All upgrades are maxed."
          />

        </SectionShell>

      </div>

    </main>
  );
}

function SectionShell({
  badge,
  title,
  open,
  onToggle,
  theme,
  children,
}: {
  badge: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  theme: Theme;
  children: ReactNode;
}) {
  return (

    <section
      className={`mb-6 min-w-0 overflow-hidden rounded-2xl border ${theme.sectionBorder} ${theme.sectionBg} ${theme.sectionGlow}`}
    >

      <button
        type="button"

        onClick={
          onToggle
        }

        className="flex w-full min-w-0 items-center justify-between gap-4 px-6 py-5 text-left transition"
      >

        <div className="min-w-0">

          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] ${theme.badgeText} ${theme.badgeBg}`}
          >
            {badge}
          </span>

          <h2
            className={`mt-3 text-2xl font-bold ${theme.titleText}`}
          >
            {title}
          </h2>

        </div>

        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-2xl transition ${theme.collapseBtn} ${theme.collapseBtnText}`}
        >
          {open
            ? "−"
            : "+"}
        </span>

      </button>

      {open && (

        <div
          className={`min-w-0 border-t ${theme.divider} px-6 pb-6 pt-5`}
        >
          {children}
        </div>

      )}

    </section>

  );
}

function MagmaSection({
  open,
  onToggle,
  magmaStorage,
  setMagmaStorage,
  nextMagmaCosts,
  maxMagmaCosts,
  progress,
}: {
  open: boolean;
  onToggle: () => void;
  magmaStorage: number;

  setMagmaStorage: (
    value: number
  ) => void;

  nextMagmaCosts: CoreCost[];
  maxMagmaCosts: CoreCost[];
  progress: number;
}) {
  const theme =
    getMagmaTheme();

  return (

    <SectionShell
      badge="Global"
      title="Magma Storage"
      open={open}
      onToggle={
        onToggle
      }
      theme={theme}
    >

      <div className="grid min-w-0 gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">

        <div className="min-w-0">

          <label className="block min-w-0">

            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
              Current Storage
            </span>

            <select
              value={
                magmaStorage
              }

              onChange={(e) =>
                setMagmaStorage(
                  Number(
                    e.target
                      .value
                  )
                )
              }

              className={`mt-2 w-full min-w-0 rounded-xl border px-4 py-2.5 text-sm font-semibold text-white outline-none transition ${theme.selectBg} ${theme.selectBorder} ${theme.selectFocus}`}
            >

              {magmaStages.map(
                (
                  stage
                ) => (

                  <option
                    key={
                      stage.storage
                    }

                    value={
                      stage.storage
                    }
                  >
                    {formatNumber(
                      stage.storage
                    )}
                  </option>

                )
              )}

            </select>

          </label>

          <div className="mt-5 min-w-0">

            <ProgressBar
              label="Progress"

              value={
                progress
              }

              current={`${formatNumber(
                magmaStorage
              )} / 10,000`}

              trackClass={
                theme.progressTrack
              }

              fillClass={
                theme.progressFill
              }
            />

          </div>

        </div>

        <div className="grid min-w-0 gap-4 md:grid-cols-2">

          <CostPanel
            title="Next Level"

            costs={
              nextMagmaCosts
            }

            empty="Max level"

            background={
              theme.panelBg
            }
          />

          <CostPanel
            title="To Max"

            costs={
              maxMagmaCosts
            }

            empty="Already maxed"

            background={
              theme.panelBg
            }
          />

        </div>

      </div>

    </SectionShell>

  );
}

function PowerSection({
  open,
  onToggle,
  core,
  selectedLevels,
  setCoreLevel,
}: {
  open: boolean;
  onToggle: () => void;
  core?: ProgressionCore;

  selectedLevels: Record<
    string,
    number
  >;

  setCoreLevel: (
    coreId: string,
    level: number
  ) => void;
}) {
  const theme =
    getPowerTheme();

  if (!core) {
    return (

      <SectionShell
        badge="Global"
        title="Power Cores/Rank"
        open={open}
        onToggle={
          onToggle
        }
        theme={theme}
      >

        <EmptyState text="Power progression data hasn't been added yet." />

      </SectionShell>

    );
  }

  const levels =
    getDisplayLevels(
      core
    );

  const selectedLevel =
    selectedLevels[
      core.id
    ] ??
    levels[0]?.level ??
    1;

  const currentLevel =
    levels.find(
      (
        level
      ) =>
        level.level ===
        selectedLevel
    );

  const maxLevel =
    levels.length > 0
      ? Math.max(
          ...levels.map(
            (
              level
            ) =>
              level.level
          )
        )
      : 0;

  const progress =
    getProgressPercent(
      selectedLevel,
      maxLevel
    );

  const maxCosts =
    levels.length > 0
      ? getRemainingCosts(
          core,
          selectedLevel
        )
      : [];

  return (

    <SectionShell
      badge="Global"
      title="Power Cores / Rank"
      open={open}
      onToggle={
        onToggle
      }
      theme={theme}
    >

      <div className="grid min-w-0 gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">

        <div className="min-w-0">

          <label className="block min-w-0">

            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
              Current Rank
            </span>

            <select
              value={
                selectedLevel
              }

              onChange={(e) =>
                setCoreLevel(
                  core.id,
                  Number(
                    e.target
                      .value
                  )
                )
              }

              className={`mt-2 w-full min-w-0 rounded-xl border px-4 py-2.5 text-sm font-semibold text-white outline-none transition ${theme.selectBg} ${theme.selectBorder} ${theme.selectFocus}`}
            >

              {levels.map(
                (
                  level
                ) => (

                  <option
                    key={
                      level.level
                    }

                    value={
                      level.level
                    }
                  >
                    {
                      level.label
                    }
                  </option>

                )
              )}

            </select>

          </label>

          <div className="mt-5 min-w-0">

            <ProgressBar
              label="Progress"

              value={
                progress
              }

              current={`${selectedLevel} / ${maxLevel}`}

              trackClass={
                theme.progressTrack
              }

              fillClass={
                theme.progressFill
              }
            />

          </div>

        </div>

        <div className="grid min-w-0 gap-4 md:grid-cols-2">

          <CostPanel
            title="Next Rank"

            costs={
              currentLevel
                ?.nextCost ??
              []
            }

            empty="Max rank"

            background={
              theme.panelBg
            }
          />

          <CostPanel
            title="To Max"

            costs={
              maxCosts
            }

            empty="Already maxed"

            background={
              theme.panelBg
            }
          />

        </div>

      </div>

    </SectionShell>

  );
}

function PlanetSection({
  title,
  region,
  open,
  onToggle,
  cores,
  selectedLevels,
  setCoreLevel,
}: {
  title: string;
  region: Region;
  open: boolean;
  onToggle: () => void;
  cores: ProgressionCore[];

  selectedLevels: Record<
    string,
    number
  >;

  setCoreLevel: (
    coreId: string,
    level: number
  ) => void;
}) {
  const theme =
    getRegionTheme(
      region
    );

  const gridClass =
    region === "mars"
      ? "grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-4"
      : "grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3";

  return (

    <SectionShell
      badge="Planet"
      title={title}
      open={open}
      onToggle={
        onToggle
      }
      theme={theme}
    >

      <div
        className={
          gridClass
        }
      >

        {cores.map(
          (
            core
          ) => (

            <CoreCard
              key={
                core.id
              }

              core={
                core
              }

              selectedLevel={
                selectedLevels[
                  core.id
                ] ??
                core.levels[0]
                  ?.level ??
                0
              }

              onLevelChange={(
                level
              ) =>
                setCoreLevel(
                  core.id,
                  level
                )
              }

              customTheme={
                theme
              }

              compact={
                region ===
                "mars"
              }
            />

          )
        )}

      </div>

    </SectionShell>

  );
}

function CoreCard({
  core,
  selectedLevel,
  onLevelChange,
  customTheme,
  compact = false,
}: {
  core: ProgressionCore;
  selectedLevel: number;

  onLevelChange: (
    level: number
  ) => void;

  customTheme?: Theme;
  compact?: boolean;
}) {
  const theme =
    customTheme ??
    getRegionTheme(
      core.region
    );

  const levels =
    getDisplayLevels(
      core
    );

  const currentLevel =
    levels.find(
      (
        level
      ) =>
        level.level ===
        selectedLevel
    );

  const nextLevel =
    levels.find(
      (
        level
      ) =>
        level.level ===
        selectedLevel +
          1
    );

  const hasData =
    levels.length > 0;

  const minLevel =
    levels.length > 0
      ? Math.min(
          ...levels.map(
            (
              level
            ) =>
              level.level
          )
        )
      : 0;

  const maxLevel =
    levels.length > 0
      ? Math.max(
          ...levels.map(
            (
              level
            ) =>
              level.level
          )
        )
      : 0;

  const progress =
    maxLevel ===
    minLevel
      ? 100
      : getProgressPercent(
          selectedLevel -
            minLevel,
          maxLevel -
            minLevel
        );

  const maxCosts =
    hasData
      ? getRemainingCosts(
          core,
          selectedLevel
        )
      : [];

  return (

    <article
      className={`min-w-0 overflow-hidden rounded-2xl border ${
        compact
          ? "p-3.5"
          : "p-4"
      } ${theme.cardBg} ${theme.cardBorder} ${theme.cardGlow}`}
    >

      <div className="flex min-w-0 items-start justify-between gap-2">

        <div className="min-w-0">

          <h3 className="truncate text-lg font-bold">
            {core.name}
          </h3>

          <p className="mt-1 truncate text-xs capitalize text-white/45">
            {core.region} progression
          </p>

        </div>

        {hasData && (

          <div className="shrink-0 rounded-lg bg-black/15 px-2.5 py-1 text-xs font-semibold text-white/65">
            {selectedLevel}/
            {maxLevel}
          </div>

        )}

      </div>

      {hasData ? (

        <>

          <label className="mt-4 block min-w-0">

            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">
              Current Level
            </span>

            <select
              value={
                selectedLevel
              }

              onChange={(e) =>
                onLevelChange(
                  Number(
                    e.target
                      .value
                  )
                )
              }

              className={`mt-2 w-full min-w-0 rounded-xl border px-3 py-2.5 text-sm text-white outline-none transition ${theme.selectBg} ${theme.selectBorder} ${theme.selectFocus}`}
            >

              {levels.map(
                (
                  level
                ) => (

                  <option
                    key={
                      level.level
                    }

                    value={
                      level.level
                    }
                  >
                    {
                      level.label
                    }
                  </option>

                )
              )}

            </select>

          </label>

          <div className="mt-4 min-w-0">

            <ProgressBar
              label="Progress"

              value={
                progress
              }

              current={`${Math.round(
                progress
              )}%`}

              trackClass={
                theme.progressTrack
              }

              fillClass={
                theme.progressFill
              }
            />

          </div>

          {currentLevel
            ?.sellPrice !==
            undefined && (

            <div
              className={`mt-4 min-w-0 rounded-xl px-4 py-3 ${theme.sellBg}`}
            >

              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
                Sell Price
              </p>

              <div className="mt-1 flex min-w-0 items-center justify-between gap-2">

                <span className="min-w-0 truncate text-lg font-bold">
                  {formatNumber(
                    currentLevel.sellPrice
                  )}
                </span>

                {nextLevel
                  ?.sellPrice !==
                  undefined && (

                  <span className="shrink-0 text-xs font-semibold text-white/60 xl:text-sm">
                    →{" "}
                    {formatNumber(
                      nextLevel.sellPrice
                    )}
                  </span>

                )}

              </div>

            </div>

          )}

          <div className="mt-4 grid min-w-0 gap-3">

            <CostCard
              title="Next Level"

              costs={
                currentLevel
                  ?.nextCost ??
                []
              }

              empty="Max level"

              background={
                theme.panelBg
              }
            />

            <CostCard
              title="To Max"

              costs={
                maxCosts
              }

              empty="Already maxed"

              background={
                theme.panelBg
              }
            />

          </div>

        </>

      ) : (

        <div className="mt-4 min-w-0 rounded-xl bg-black/15 p-4 text-sm text-white/55">
          Progression data
          still needs to be
          added.
        </div>

      )}

    </article>

  );
}

function ProgressBar({
  label,
  value,
  current,
  trackClass,
  fillClass,
}: {
  label: string;
  value: number;
  current: string;
  trackClass: string;
  fillClass: string;
}) {
  return (

    <div className="min-w-0">

      <div className="mb-2 flex min-w-0 items-center justify-between gap-3">

        <p className="min-w-0 truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">
          {label}
        </p>

        <p className="shrink-0 text-xs font-semibold text-white/70">
          {current}
        </p>

      </div>

      <div
        className={`h-2 min-w-0 overflow-hidden rounded-full ${trackClass}`}
      >

        <div
          className={`h-full rounded-full transition-all duration-300 ${fillClass}`}

          style={{
            width:
              `${value}%`,
          }}
        />

      </div>

    </div>

  );
}

function CostPanel({
  title,
  costs,
  empty,
  background,
}: {
  title: string;
  costs: CoreCost[];
  empty: string;
  background: string;
}) {
  const displayCosts =
    prepareDisplayCosts(
      costs
    );

  return (

    <div
      className={`min-w-0 overflow-hidden rounded-2xl border border-white/10 p-4 ${background}`}
    >

      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9aa4af]">
        {title}
      </p>

      {displayCosts.length >
      0 ? (

        <CostList
          costs={
            displayCosts
          }
        />

      ) : (

        <p className="mt-3 text-sm text-[#87919c]">
          {empty}
        </p>

      )}

    </div>

  );
}

function CostCard({
  title,
  costs,
  empty,
  background,
}: {
  title: string;
  costs: CoreCost[];
  empty: string;
  background: string;
}) {
  const displayCosts =
    prepareDisplayCosts(
      costs
    );

  return (

    <div
      className={`min-w-0 overflow-hidden rounded-xl border border-white/10 p-3.5 ${background}`}
    >

      <div className="mb-3 flex min-w-0 items-center justify-between gap-2">

        <p className="min-w-0 truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-white/55">
          {title}
        </p>

        {displayCosts.length >
          0 && (

          <span className="shrink-0 text-[9px] font-medium text-white/35">

            {
              displayCosts.length
            }{" "}

            {displayCosts.length ===
            1
              ? "item"
              : "items"}

          </span>

        )}

      </div>

      {displayCosts.length >
      0 ? (

        <CostList
          costs={
            displayCosts
          }

          compact
        />

      ) : (

        <p className="text-sm text-white/45">
          {empty}
        </p>

      )}

    </div>

  );
}

function CostList({
  costs,
  compact = false,
}: {
  costs: CoreCost[];
  compact?: boolean;
}) {
  return (

    <div
      className={`min-w-0 ${
        compact
          ? "space-y-2"
          : "mt-3 space-y-2"
      }`}
    >

      {costs.map(
        (
          cost,
          index
        ) => (

          <ExpandableCostRow
            key={`${cost.name}-${index}`}

            cost={
              cost
            }
          />

        )
      )}

    </div>

  );
}

function ExpandableCostRow({
  cost,
}: {
  cost: CoreCost;
}) {
  const [
    open,
    setOpen,
  ] =
    useState(false);

  const recipe =
    getCoreRecipe(
      cost.name
    );

  if (!recipe) {
    return (

      <div className="flex min-w-0 items-center justify-between gap-3">

        <span className="min-w-0 break-words text-sm text-white/75">
          {getDisplayCostName(
            cost
          )}
        </span>

        <span className="shrink-0 text-sm font-bold text-white">
          {formatCostValue(
            cost
          )}
        </span>

      </div>

    );
  }

  const recipeCosts =
    multiplyRecipe(
      recipe,
      cost.amount
    );

  return (

    <div className="min-w-0">

      <button
        type="button"

        onClick={() =>
          setOpen(
            (
              current
            ) =>
              !current
          )
        }

        className="flex w-full min-w-0 items-center justify-between gap-2 rounded-lg px-1.5 py-1.5 text-left transition hover:bg-white/5"
      >

        <div className="flex min-w-0 items-center gap-1.5">

          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-black/20 text-xs font-bold text-white/60">
            {open
              ? "−"
              : "+"}
          </span>

          <span className="min-w-0 break-words text-sm font-semibold text-white/90">
            {getDisplayCostName(
              cost
            )}
          </span>

          <span className="hidden shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-white/40 min-[1450px]:inline">
            Recipe
          </span>

        </div>

        <span className="shrink-0 text-sm font-bold text-white">
          {formatCostValue(
            cost
          )}
        </span>

      </button>

      {open && (

        <RecipeBox
          costs={
            recipeCosts
          }
        />

      )}

    </div>

  );
}

function RecipeBox({
  costs,
}: {
  costs: CoreCost[];
}) {
  return (

    <div className="mt-1.5 min-w-0 overflow-hidden rounded-lg border border-white/10 bg-black/10 px-2.5 py-2.5">

      <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/35">
        Crafting ingredients
      </p>

      <div className="min-w-0 space-y-2">

        {costs.map(
          (
            cost,
            index
          ) => (

            <RecipeRow
              key={`${cost.name}-${index}`}

              cost={
                cost
              }
            />

          )
        )}

      </div>

    </div>

  );
}

function RecipeRow({
  cost,
}: {
  cost: CoreCost;
}) {
  const [
    open,
    setOpen,
  ] =
    useState(false);

  const recipe =
    getCoreRecipe(
      cost.name
    );

  if (!recipe) {
    return (

      <div className="flex min-w-0 items-center justify-between gap-2">

        <span className="min-w-0 break-words text-xs text-white/65">
          {getDisplayCostName(
            cost
          )}
        </span>

        <span className="shrink-0 text-xs font-semibold text-white/85">
          {formatCostValue(
            cost
          )}
        </span>

      </div>

    );
  }

  const nestedCosts =
    multiplyRecipe(
      recipe,
      cost.amount
    );

  return (

    <div className="min-w-0">

      <button
        type="button"

        onClick={() =>
          setOpen(
            (
              current
            ) =>
              !current
          )
        }

        className="flex w-full min-w-0 items-center justify-between gap-2 rounded-md py-1 text-left"
      >

        <div className="flex min-w-0 items-center gap-1.5">

          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-white/5 text-[10px] text-white/50">
            {open
              ? "−"
              : "+"}
          </span>

          <span className="min-w-0 break-words text-xs font-semibold text-white/75">
            {getDisplayCostName(
              cost
            )}
          </span>

        </div>

        <span className="shrink-0 text-xs font-semibold text-white/85">
          {formatCostValue(
            cost
          )}
        </span>

      </button>

      {open && (

        <div className="mt-1 min-w-0 pl-2">

          <RecipeBox
            costs={
              nestedCosts
            }
          />

        </div>

      )}

    </div>

  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (

    <div className="min-w-0 rounded-2xl border border-white/10 bg-[#1f252c] p-4 text-sm text-[#9aa4af]">
      {text}
    </div>

  );
}