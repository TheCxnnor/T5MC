"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { drills } from "../../data/drills";

import {
  compactedItems,
  getUnderlyingCompactedItem,
  type CompactedItem,
} from "../../data/compactedItems";

/* =========================================================
   TYPES
   ========================================================= */

type Region =
  | "moon"
  | "mars"
  | "sun";

type Requirement = {
  material: string;
  amount: number;
};

type Drill = {
  id: string;
  name: string;
  prerequisite: string;
  region: Region;
  requirements: Requirement[];
};

type OpenSections = {
  overview: boolean;
  target: boolean;
  moon: boolean;
  mars: boolean;
  sun: boolean;
};

type SavedState = {
  obtained: string[];
  targetDrillId: string;
  openSections: OpenSections;
};

type MaterialTotal = {
  material: string;
  amount: number;
};

type ExpandedRequirement = {
  compactedItem: CompactedItem;
  isPlasma: boolean;
  amount: number;
  ingredients: MaterialTotal[];
  timeHours: number;
};

/* =========================================================
   TYPED DRILL DATA

   drills.ts currently infers region as string.
   This narrows it to the Region type used by this page.
   ========================================================= */

const typedDrills =
  drills as Drill[];

/* =========================================================
   STORAGE
   ========================================================= */

const STORAGE_KEY =
  "t5-mission-control-drills";

/* =========================================================
   DEFAULTS
   ========================================================= */

const DEFAULT_OPEN_SECTIONS: OpenSections = {
  overview: true,
  target: true,
  moon: true,
  mars: true,
  sun: true,
};

const DEFAULT_STATE: SavedState = {
  obtained: [],

  targetDrillId:
    typedDrills[
      typedDrills.length - 1
    ]?.id ?? "",

  openSections:
    DEFAULT_OPEN_SECTIONS,
};

/* =========================================================
   MATERIAL LABELS
   ========================================================= */

const MATERIAL_LABELS: Record<
  string,
  string
> = {
  lunarFragment:
    "Lunar Fragment",

  chisiliteShard:
    "Chisilite Shard",

  basaltShard:
    "Basalt Shard",

  breccaPowder:
    "Brecca Powder",

  magma:
    "Magma",

  rhodnite:
    "Rhodnite",

  martianDust:
    "Martian Dust",

  amberFragment:
    "Amber Fragment",

  ametrine:
    "Ametrine",

  sunFragment:
    "Sun Fragment",

  plasmaShard:
    "Plasma Shard",

  fiber:
    "Fiber",

  compactedLunarAlloy:
    "Compacted Lunar Alloy",

  compactedMartianAlloy:
    "Compacted Martian Alloy",

  compactedSolarAlloy:
    "Compacted Solar Alloy",

  plasmaCompactedLunarAlloy:
    "Plasma Compacted Lunar Alloy",

  plasmaCompactedMartianAlloy:
    "Plasma Compacted Martian Alloy",

  plasmaCompactedSolarAlloy:
    "Plasma Compacted Solar Alloy",

  compactedMagma:
    "Compacted Magma",

  plasmaCompactedMagma:
    "Plasma Compacted Magma",

  coronaSurgeFlare:
    "Corona Surge Flare",

  stellarPulseFlare:
    "Stellar Pulse Flare",

  eternalSingularityFlare:
    "Eternal Singularity Flare",

  levels:
    "Levels",

  starShards:
    "Star-Shards",

  ash:
    "Ash",

  candy:
    "Candy",

  serpentSkin:
    "Serpent Skin",

  coinsQd:
    "Qd Coins",

  ascensions:
    "Ascensions",
};

/* =========================================================
   REGION ORDER
   ========================================================= */

const REGION_ORDER: Region[] = [
  "moon",
  "mars",
  "sun",
];

/* =========================================================
   HELPERS
   ========================================================= */

function formatNumber(
  value: number
) {
  return value.toLocaleString(
    undefined,
    {
      maximumFractionDigits: 2,
    }
  );
}

function formatHours(
  value: number
) {
  if (
    Number.isInteger(
      value
    )
  ) {
    return `${value}h`;
  }

  return `${formatNumber(
    value
  )}h`;
}

function getMaterialLabel(
  material: string
) {
  if (
    MATERIAL_LABELS[
      material
    ]
  ) {
    return MATERIAL_LABELS[
      material
    ];
  }

  return material
    .replace(
      /([A-Z])/g,
      " $1"
    )
    .replace(
      /^./,
      (
        character
      ) =>
        character.toUpperCase()
    );
}

function getRegionLabel(
  region: Region
) {
  if (
    region ===
    "moon"
  ) {
    return "Moon";
  }

  if (
    region ===
    "mars"
  ) {
    return "Mars";
  }

  return "Sun";
}

function getDrillIndex(
  drillId: string
) {
  return typedDrills.findIndex(
    (
      drill
    ) =>
      drill.id ===
      drillId
  );
}

function getProgressPercentage(
  completedCount: number
) {
  if (
    typedDrills.length ===
    0
  ) {
    return 0;
  }

  return (
    completedCount /
    typedDrills.length
  ) *
    100;
}

/* =========================================================
   COMPACTED ITEM HELPERS
   ========================================================= */

function getDirectCompactedItem(
  material: string
) {
  return compactedItems.find(
    (
      item
    ) =>
      item.id ===
      material
  );
}

function getExpandedRequirement(
  requirement: Requirement
): ExpandedRequirement | null {
  const direct =
    getDirectCompactedItem(
      requirement.material
    );

  if (
    direct
  ) {
    return {
      compactedItem:
        direct,

      isPlasma:
        false,

      amount:
        requirement.amount,

      ingredients:
        direct.requirements.map(
          (
            ingredient
          ) => ({
            material:
              ingredient.material,

            amount:
              ingredient.amount *
              requirement.amount,
          })
        ),

      timeHours:
        direct.timeHours *
        requirement.amount,
    };
  }

  const underlying =
    getUnderlyingCompactedItem(
      requirement.material
    );

  if (
    underlying
  ) {
    return {
      compactedItem:
        underlying,

      isPlasma:
        true,

      amount:
        requirement.amount,

      ingredients:
        underlying.requirements.map(
          (
            ingredient
          ) => ({
            material:
              ingredient.material,

            amount:
              ingredient.amount *
              requirement.amount,
          })
        ),

      timeHours:
        underlying.timeHours *
        requirement.amount,
    };
  }

  return null;
}

/* =========================================================
   PAGE
   ========================================================= */

export default function DrillsPage() {
  const [
    state,
    setState,
  ] =
    useState<SavedState>(
      DEFAULT_STATE
    );

  const [
    loaded,
    setLoaded,
  ] =
    useState(false);

  /* =======================================================
     LOAD
     ======================================================= */

  useEffect(() => {
    try {
      const saved =
        window.localStorage.getItem(
          STORAGE_KEY
        );

      if (
        saved
      ) {
        const parsed =
          JSON.parse(
            saved
          ) as Partial<SavedState>;

        setState({
          ...DEFAULT_STATE,

          ...parsed,

          openSections: {
            ...DEFAULT_OPEN_SECTIONS,

            ...(
              parsed.openSections ??
              {}
            ),
          },
        });
      }
    } catch (
      error
    ) {
      console.error(
        "Could not load drill progression:",
        error
      );
    } finally {
      setLoaded(
        true
      );
    }
  }, []);

  /* =======================================================
     SAVE
     ======================================================= */

  useEffect(() => {
    if (
      !loaded
    ) {
      return;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,

        JSON.stringify(
          state
        )
      );
    } catch (
      error
    ) {
      console.error(
        "Could not save drill progression:",
        error
      );
    }
  }, [
    state,
    loaded,
  ]);

  /* =======================================================
     OBTAINED
     ======================================================= */

  const obtainedSet =
    useMemo(
      () =>
        new Set(
          state.obtained
        ),
      [
        state.obtained,
      ]
    );

  /* =======================================================
     CURRENT DRILL
     ======================================================= */

  const highestObtainedIndex =
    useMemo(() => {
      let highest =
        -1;

      typedDrills.forEach(
        (
          drill,
          index
        ) => {
          if (
            obtainedSet.has(
              drill.id
            )
          ) {
            highest =
              Math.max(
                highest,
                index
              );
          }
        }
      );

      return highest;
    }, [
      obtainedSet,
    ]);

  const currentDrill =
    highestObtainedIndex >=
    0
      ? typedDrills[
          highestObtainedIndex
        ]
      : null;

  const nextDrill =
    highestObtainedIndex +
      1 <
    typedDrills.length
      ? typedDrills[
          highestObtainedIndex +
            1
        ]
      : null;

  const completedCount =
    highestObtainedIndex +
    1;

  const progressPercentage =
    getProgressPercentage(
      completedCount
    );

  /* =======================================================
     TARGET
     ======================================================= */

  const targetDrill =
    useMemo(
      () =>
        typedDrills.find(
          (
            drill
          ) =>
            drill.id ===
            state.targetDrillId
        ) ??
        typedDrills[
          typedDrills.length -
            1
        ],
      [
        state.targetDrillId,
      ]
    );

  const targetIndex =
    targetDrill
      ? getDrillIndex(
          targetDrill.id
        )
      : -1;

  const drillsToTarget =
    useMemo(() => {
      if (
        targetIndex <
        0
      ) {
        return [];
      }

      if (
        targetIndex <=
        highestObtainedIndex
      ) {
        return [];
      }

      return typedDrills.slice(
        highestObtainedIndex +
          1,
        targetIndex +
          1
      );
    }, [
      highestObtainedIndex,
      targetIndex,
    ]);

  /* =======================================================
     DIRECT TARGET TOTALS
     ======================================================= */

  const targetMaterialTotals =
    useMemo(() => {
      const totals =
        new Map<
          string,
          number
        >();

      drillsToTarget.forEach(
        (
          drill
        ) => {
          drill.requirements.forEach(
            (
              requirement
            ) => {
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
        (
          [
            material,
            amount,
          ]
        ): MaterialTotal => ({
          material,
          amount,
        })
      );
    }, [
      drillsToTarget,
    ]);

  /* =======================================================
     FULLY EXPANDED TARGET TOTALS
     ======================================================= */

  const expandedTargetTotals =
    useMemo(() => {
      const totals =
        new Map<
          string,
          number
        >();

      let totalCompactionHours =
        0;

      drillsToTarget.forEach(
        (
          drill
        ) => {
          drill.requirements.forEach(
            (
              requirement
            ) => {
              const expanded =
                getExpandedRequirement(
                  requirement
                );

              if (
                expanded
              ) {
                totalCompactionHours +=
                  expanded.timeHours;

                expanded.ingredients.forEach(
                  (
                    ingredient
                  ) => {
                    totals.set(
                      ingredient.material,

                      (
                        totals.get(
                          ingredient.material
                        ) ??
                        0
                      ) +
                        ingredient.amount
                    );
                  }
                );

                return;
              }

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

      return {
        materials:
          Array.from(
            totals.entries()
          ).map(
            (
              [
                material,
                amount,
              ]
            ): MaterialTotal => ({
              material,
              amount,
            })
          ),

        totalCompactionHours,
      };
    }, [
      drillsToTarget,
    ]);

  /* =======================================================
     REGION GROUPS
     ======================================================= */

  const groupedDrills =
    useMemo(() => {
      return {
        moon:
          typedDrills.filter(
            (
              drill
            ) =>
              drill.region ===
              "moon"
          ),

        mars:
          typedDrills.filter(
            (
              drill
            ) =>
              drill.region ===
              "mars"
          ),

        sun:
          typedDrills.filter(
            (
              drill
            ) =>
              drill.region ===
              "sun"
          ),
      };
    }, []);

  /* =======================================================
     TOGGLE DRILL
     ======================================================= */

  function toggleDrill(
    drillId: string
  ) {
    const index =
      getDrillIndex(
        drillId
      );

    if (
      index <
      0
    ) {
      return;
    }

    const alreadyObtained =
      obtainedSet.has(
        drillId
      );

    if (
      alreadyObtained
    ) {
      const remaining =
        typedDrills
          .slice(
            0,
            index
          )
          .map(
            (
              drill
            ) =>
              drill.id
          );

      setState(
        (
          current
        ) => ({
          ...current,

          obtained:
            remaining,
        })
      );

      return;
    }

    const completed =
      typedDrills
        .slice(
          0,
          index +
            1
        )
        .map(
          (
            drill
          ) =>
            drill.id
        );

    setState(
      (
        current
      ) => ({
        ...current,

        obtained:
          completed,
      })
    );
  }

  /* =======================================================
     TOGGLE SECTION
     ======================================================= */

  function toggleSection(
    section:
      keyof OpenSections
  ) {
    setState(
      (
        current
      ) => ({
        ...current,

        openSections: {
          ...current.openSections,

          [section]:
            !current
              .openSections[
                section
              ],
        },
      })
    );
  }

  /* =======================================================
     RESET
     ======================================================= */

  function resetProgress() {
    setState(
      (
        current
      ) => ({
        ...current,

        obtained: [],
      })
    );
  }

  return (
    <main className="min-h-screen bg-[#151b24] px-4 py-8 text-white md:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
            ================================================= */}

        <div className="mb-8">

          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9bbcff]">
            Progression
          </p>

          <h1 className="mt-2 text-3xl font-bold md:text-4xl">
            Drills
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-[#9aa4af] md:text-base">
            Track your Moon, Mars and Sun drill progression and calculate the materials required for future upgrades.
          </p>

        </div>

        {/* =================================================
            OVERVIEW
            ================================================= */}

        <MainSection
          eyebrow="Progress"
          title="Drill Progression"

          open={
            state
              .openSections
              .overview
          }

          onToggle={() =>
            toggleSection(
              "overview"
            )
          }

          borderClass="border-[#536272]"
          backgroundClass="bg-[#1e252d]"
          accentClass="text-[#a8bad0]"
          buttonClass="bg-[#293440] text-[#b9c9dc]"
        >

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            <OverviewStat
              label="Current Drill"

              value={
                currentDrill
                  ?.name ??
                "Icehowl Drill"
              }

              description={
                currentDrill
                  ? "Highest drill obtained"
                  : "Starting prerequisite"
              }
            />

            <OverviewStat
              label="Next Drill"

              value={
                nextDrill
                  ?.name ??
                "Maxed"
              }

              description={
                nextDrill
                  ? `${getRegionLabel(
                      nextDrill.region
                    )} progression`
                  : "Fusion Drill obtained"
              }
            />

            <OverviewStat
              label="Completed"

              value={`${completedCount} / ${typedDrills.length}`}

              description="Tracked drills obtained"
            />

            <OverviewStat
              label="Progress"

              value={`${formatNumber(
                Math.round(
                  progressPercentage
                )
              )}%`}

              description="Overall drill progression"
            />

          </div>

          {/* PROGRESS BAR */}

          <div className="mt-5">

            <div className="mb-2 flex items-center justify-between gap-4 text-xs text-white/40">

              <span>
                Icehowl Drill
              </span>

              <span>
                Fusion Drill
              </span>

            </div>

            <div className="h-3 overflow-hidden rounded-full bg-black/20">

              <div
                className="h-full rounded-full bg-[#7c96b2] transition-all duration-300"

                style={{
                  width:
                    `${progressPercentage}%`,
                }}
              />

            </div>

          </div>

          {/* NEXT DRILL */}

          {nextDrill ? (

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/10 p-5">

              <div className="flex flex-wrap items-start justify-between gap-3">

                <div>

                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                    Next Upgrade
                  </p>

                  <h3 className="mt-2 text-2xl font-bold">
                    {nextDrill.name}
                  </h3>

                  <p className="mt-1 text-sm text-white/40">
                    Requires{" "}
                    {nextDrill.prerequisite}
                  </p>

                </div>

                <RegionBadge
                  region={
                    nextDrill.region
                  }
                />

              </div>

              <div className="mt-4 space-y-3">

                {nextDrill.requirements.map(
                  (
                    requirement
                  ) => (

                    <RequirementDisplay
                      key={
                        requirement.material
                      }

                      requirement={
                        requirement
                      }
                    />

                  )
                )}

              </div>

            </div>

          ) : (

            <div className="mt-6 rounded-2xl border border-[#d8c36a]/30 bg-[#342e1d] p-5">

              <p className="font-bold text-[#ead98c]">
                All drills completed
              </p>

              <p className="mt-1 text-sm text-white/45">
                You have reached Fusion Drill.
              </p>

            </div>

          )}

          <div className="mt-5 flex justify-end">

            <button
              type="button"

              onClick={
                resetProgress
              }

              className="rounded-lg border border-white/10 bg-black/10 px-4 py-2 text-xs font-semibold text-white/55 transition hover:border-white/20 hover:text-white"
            >
              Reset Progress
            </button>

          </div>

        </MainSection>

        {/* =================================================
            TARGET CALCULATOR
            ================================================= */}

        <MainSection
          eyebrow="Upgrade Planner"
          title="Target Drill Calculator"

          open={
            state
              .openSections
              .target
          }

          onToggle={() =>
            toggleSection(
              "target"
            )
          }

          borderClass="border-[#6e6a4a]"
          backgroundClass="bg-[#29271d]"
          accentClass="text-[#d8cc87]"
          buttonClass="bg-[#3a3624] text-[#dfd18b]"
        >

          <div className="grid gap-4 md:grid-cols-2">

            <label className="block">

              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50">
                Target Drill
              </span>

              <select
                value={
                  state.targetDrillId
                }

                onChange={(
                  event
                ) =>
                  setState(
                    (
                      current
                    ) => ({
                      ...current,

                      targetDrillId:
                        event.target.value,
                    })
                  )
                }

                className="mt-2 w-full rounded-xl border border-[#505b67] bg-[#171d25] px-3 py-3 text-sm font-semibold text-white outline-none transition focus:border-[#d8cc87]"
              >

                {typedDrills.map(
                  (
                    drill
                  ) => (

                    <option
                      key={
                        drill.id
                      }

                      value={
                        drill.id
                      }
                    >
                      {drill.name}
                    </option>

                  )
                )}

              </select>

            </label>

            <div className="rounded-xl border border-white/10 bg-black/10 p-4">

              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                Upgrades Remaining
              </p>

              <p className="mt-2 text-2xl font-bold">
                {drillsToTarget.length}
              </p>

              <p className="mt-1 text-xs text-white/35">

                {currentDrill
                  ? `From ${currentDrill.name}`
                  : "Starting from Icehowl Drill"}

              </p>

            </div>

          </div>

          {drillsToTarget.length >
          0 ? (

            <>

              {/* UPGRADE PATH */}

              <div className="mt-5">

                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                  Upgrade Path
                </p>

                <div className="mt-3 flex flex-wrap gap-2">

                  {drillsToTarget.map(
                    (
                      drill,
                      index
                    ) => (

                      <div
                        key={
                          drill.id
                        }

                        className="flex items-center gap-2"
                      >

                        <span className="rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-xs font-semibold">
                          {drill.name}
                        </span>

                        {index <
                          drillsToTarget.length -
                            1 && (

                          <span className="text-white/25">
                            →
                          </span>

                        )}

                      </div>

                    )
                  )}

                </div>

              </div>

              {/* DIRECT TOTALS */}

              <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/10">

                <div className="border-b border-white/10 px-4 py-3">

                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                    Drill Recipe Totals
                  </p>

                  <p className="mt-1 text-xs text-white/35">
                    The direct materials listed in each drill recipe.
                  </p>

                </div>

                <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                  {targetMaterialTotals.map(
                    (
                      total
                    ) => (

                      <MaterialBox
                        key={
                          total.material
                        }

                        material={
                          total.material
                        }

                        amount={
                          total.amount
                        }
                      />

                    )
                  )}

                </div>

              </div>

              {/* EXPANDED TOTALS */}

              <div className="mt-6 overflow-hidden rounded-2xl border border-[#b3914d]/30 bg-[#302a1c]">

                <div className="border-b border-white/10 px-4 py-4">

                  <div className="flex flex-wrap items-start justify-between gap-4">

                    <div>

                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#dfc578]">
                        Fully Expanded Materials
                      </p>

                      <p className="mt-1 text-xs text-white/40">
                        Compacted and plasma-compacted items converted into their underlying materials.
                      </p>

                    </div>

                    <div className="rounded-xl border border-[#d2b568]/25 bg-black/10 px-4 py-3">

                      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/35">
                        Total Compaction Time
                      </p>

                      <p className="mt-1 text-xl font-bold text-[#e3ca80]">
                        {formatHours(
                          expandedTargetTotals.totalCompactionHours
                        )}
                      </p>

                    </div>

                  </div>

                </div>

                <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                  {expandedTargetTotals.materials.map(
                    (
                      total
                    ) => (

                      <MaterialBox
                        key={
                          total.material
                        }

                        material={
                          total.material
                        }

                        amount={
                          total.amount
                        }
                      />

                    )
                  )}

                </div>

              </div>

              {/* INDIVIDUAL UPGRADES */}

              <div className="mt-6">

                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                  Individual Upgrade Costs
                </p>

                <div className="mt-3 grid gap-3 lg:grid-cols-2">

                  {drillsToTarget.map(
                    (
                      drill
                    ) => (

                      <div
                        key={
                          drill.id
                        }

                        className="rounded-xl border border-white/10 bg-black/10 p-4"
                      >

                        <div className="flex items-start justify-between gap-3">

                          <div>

                            <p className="font-bold">
                              {drill.name}
                            </p>

                            <p className="mt-1 text-xs text-white/35">
                              Requires{" "}
                              {drill.prerequisite}
                            </p>

                          </div>

                          <RegionBadge
                            region={
                              drill.region
                            }
                          />

                        </div>

                        <div className="mt-4 space-y-3">

                          {drill.requirements.map(
                            (
                              requirement
                            ) => (

                              <RequirementDisplay
                                key={
                                  requirement.material
                                }

                                requirement={
                                  requirement
                                }
                              />

                            )
                          )}

                        </div>

                      </div>

                    )
                  )}

                </div>

              </div>

            </>

          ) : (

            <div className="mt-5 rounded-xl border border-white/10 bg-black/10 p-5">

              <p className="font-semibold">
                Target already reached
              </p>

              <p className="mt-1 text-sm text-white/40">
                Choose a drill later in the progression to calculate remaining materials.
              </p>

            </div>

          )}

        </MainSection>

        {/* =================================================
            REGIONS
            ================================================= */}

        {REGION_ORDER.map(
          (
            region
          ) => (

            <RegionSection
              key={
                region
              }

              region={
                region
              }

              open={
                state
                  .openSections[
                    region
                  ]
              }

              onToggle={() =>
                toggleSection(
                  region
                )
              }
            >

              <div
                className={`grid gap-4 ${
                  region ===
                  "moon"
                    ? "lg:grid-cols-2 xl:grid-cols-4"
                    : "lg:grid-cols-2 xl:grid-cols-5"
                }`}
              >

                {groupedDrills[
                  region
                ].map(
                  (
                    drill
                  ) => {

                    const obtained =
                      obtainedSet.has(
                        drill.id
                      );

                    const drillIndex =
                      getDrillIndex(
                        drill.id
                      );

                    const isNext =
                      drillIndex ===
                      highestObtainedIndex +
                        1;

                    return (

                      <DrillCard
                        key={
                          drill.id
                        }

                        drill={
                          drill
                        }

                        obtained={
                          obtained
                        }

                        isNext={
                          isNext
                        }

                        onToggle={() =>
                          toggleDrill(
                            drill.id
                          )
                        }
                      />

                    );
                  }
                )}

              </div>

            </RegionSection>

          )
        )}

        {/* =================================================
            FOOTNOTE
            ================================================= */}

        <div className="mt-6 rounded-xl border border-white/10 bg-[#1d242d] p-4 text-xs leading-5 text-white/40">

          Drill progression is linear. Marking a later drill as obtained automatically marks all previous drills complete. Removing a drill also removes every drill after it.

          {" "}

          Icehowl Drill is treated as the starting prerequisite and is not included in the tracked drill list.

          {" "}

          Plasma compacted materials use a 1:1 conversion from their matching normal compacted item.

        </div>

      </div>

    </main>
  );
}

/* =========================================================
   REQUIREMENT DISPLAY

   Normal items:
   simple row

   Compacted / Plasma items:
   collapsed by default
   ========================================================= */

function RequirementDisplay({
  requirement,
}: {
  requirement: Requirement;
}) {
  const [
    open,
    setOpen,
  ] =
    useState(false);

  const expanded =
    getExpandedRequirement(
      requirement
    );

  /* =======================================================
     NORMAL MATERIAL
     ======================================================= */

  if (
    !expanded
  ) {
    return (

      <div className="flex items-center justify-between gap-4 rounded-lg bg-black/10 px-3 py-2 text-sm">

        <span className="min-w-0 break-words text-white/60">
          {getMaterialLabel(
            requirement.material
          )}
        </span>

        <span className="shrink-0 font-bold">
          {formatNumber(
            requirement.amount
          )}
        </span>

      </div>

    );
  }

  /* =======================================================
     COMPACTED / PLASMA MATERIAL
     ======================================================= */

  return (

    <div className="overflow-hidden rounded-xl border border-[#a88e4d]/25 bg-black/10">

      {/* HEADER */}

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

        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition hover:bg-white/[0.025]"
      >

        <div className="min-w-0">

          <p className="break-words text-sm font-semibold text-[#e0ca84]">
            {getMaterialLabel(
              requirement.material
            )}
          </p>

          {expanded.isPlasma && (

            <p className="mt-1 text-[10px] text-white/35">
              1:1 plasma conversion
            </p>

          )}

        </div>

        <div className="flex shrink-0 items-center gap-3">

          <span className="text-sm font-bold">
            {formatNumber(
              requirement.amount
            )}
          </span>

          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#413821] text-sm font-bold text-[#e4cc7e]">
            {open
              ? "−"
              : "+"}
          </span>

        </div>

      </button>

      {/* EXPANDED CONTENT */}

      {open && (

        <div className="border-t border-white/5 bg-black/10 px-3 py-3">

          {/* PLASMA UNDERLYING COMPACTED ITEM */}

          {expanded.isPlasma && (

            <div className="mb-3 rounded-lg border border-[#9b8248]/20 bg-[#332d1e] px-3 py-2">

              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/30">
                Underlying Compacted Item
              </p>

              <div className="mt-1 flex items-center justify-between gap-3">

                <span className="text-xs font-semibold text-[#d8c27c]">
                  {expanded.compactedItem.name}
                </span>

                <span className="text-xs font-bold text-[#ead690]">
                  ×
                  {formatNumber(
                    expanded.amount
                  )}
                </span>

              </div>

            </div>

          )}

          {/* RAW INGREDIENTS */}

          <div className="space-y-1.5">

            {expanded.ingredients.map(
              (
                ingredient
              ) => (

                <div
                  key={
                    ingredient.material
                  }

                  className="flex items-center justify-between gap-3 pl-1 text-xs"
                >

                  <span className="min-w-0 break-words text-white/45">
                    ↳{" "}
                    {getMaterialLabel(
                      ingredient.material
                    )}
                  </span>

                  <span className="shrink-0 font-semibold text-white/70">
                    {formatNumber(
                      ingredient.amount
                    )}
                  </span>

                </div>

              )
            )}

          </div>

          {/* TIME */}

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/5 pt-3">

            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35">
              Compaction Time
            </span>

            <span className="text-xs font-bold text-[#e4cc7e]">
              {formatHours(
                expanded.timeHours
              )}
            </span>

          </div>

        </div>

      )}

    </div>

  );
}

/* =========================================================
   MAIN SECTION
   ========================================================= */

function MainSection({
  eyebrow,
  title,
  open,
  onToggle,
  borderClass,
  backgroundClass,
  accentClass,
  buttonClass,
  children,
}: {
  eyebrow: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  borderClass: string;
  backgroundClass: string;
  accentClass: string;
  buttonClass: string;
  children: ReactNode;
}) {
  return (

    <section
      className={`mb-6 overflow-hidden rounded-2xl border ${borderClass} ${backgroundClass}`}
    >

      <button
        type="button"

        onClick={
          onToggle
        }

        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left md:px-6"
      >

        <div>

          <p
            className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${accentClass}`}
          >
            {eyebrow}
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            {title}
          </h2>

        </div>

        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl font-bold ${buttonClass}`}
        >
          {open
            ? "−"
            : "+"}
        </span>

      </button>

      {open && (

        <div className="border-t border-white/10 p-5 md:p-6">
          {children}
        </div>

      )}

    </section>

  );
}

/* =========================================================
   REGION SECTION
   ========================================================= */

function RegionSection({
  region,
  open,
  onToggle,
  children,
}: {
  region: Region;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const theme =
    getRegionTheme(
      region
    );

  return (

    <section
      className={`mb-6 overflow-hidden rounded-2xl border ${theme.border} ${theme.background}`}
    >

      <button
        type="button"

        onClick={
          onToggle
        }

        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left md:px-6"
      >

        <div>

          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${theme.badge}`}
          >
            {getRegionLabel(
              region
            )}
          </span>

          <h2 className="mt-3 text-2xl font-bold">
            {getRegionLabel(
              region
            )} Drills
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
          {children}
        </div>

      )}

    </section>

  );
}

/* =========================================================
   DRILL CARD
   ========================================================= */

function DrillCard({
  drill,
  obtained,
  isNext,
  onToggle,
}: {
  drill: Drill;
  obtained: boolean;
  isNext: boolean;
  onToggle: () => void;
}) {
  const theme =
    getRegionTheme(
      drill.region
    );

  return (

    <article
      className={`flex min-w-0 flex-col rounded-2xl border p-4 transition ${
        obtained
          ? "border-white/5 bg-black/10 opacity-55"
          : isNext
            ? `${theme.cardBorder} ${theme.cardBackground}`
            : "border-white/10 bg-black/10"
      }`}
    >

      <div className="flex items-start justify-between gap-3">

        <div className="min-w-0">

          <div className="flex flex-wrap items-center gap-2">

            <h3 className="break-words text-lg font-bold">
              {drill.name}
            </h3>

            {isNext &&
              !obtained && (

              <span
                className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${theme.badge}`}
              >
                Next
              </span>

            )}

          </div>

          <p className="mt-1 text-xs text-white/35">
            Requires{" "}
            {drill.prerequisite}
          </p>

        </div>

        <button
          type="button"

          aria-label={
            obtained
              ? `Mark ${drill.name} as not obtained`
              : `Mark ${drill.name} as obtained`
          }

          onClick={
            onToggle
          }

          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-sm font-bold transition ${
            obtained
              ? `${theme.checkbox} border-transparent`
              : "border-white/20 bg-black/10 text-transparent hover:border-white/40"
          }`}
        >
          ✓
        </button>

      </div>

      <div className="mt-4 space-y-3">

        {drill.requirements.map(
          (
            requirement
          ) => (

            <RequirementDisplay
              key={
                requirement.material
              }

              requirement={
                requirement
              }
            />

          )
        )}

      </div>

      <div className="mt-auto pt-4">

        <RegionBadge
          region={
            drill.region
          }
        />

      </div>

    </article>

  );
}

/* =========================================================
   OVERVIEW STAT
   ========================================================= */

function OverviewStat({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (

    <div className="rounded-xl border border-white/10 bg-black/10 p-4">

      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
        {label}
      </p>

      <p className="mt-2 break-words text-xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs text-white/30">
        {description}
      </p>

    </div>

  );
}

/* =========================================================
   MATERIAL BOX
   ========================================================= */

function MaterialBox({
  material,
  amount,
}: {
  material: string;
  amount: number;
}) {
  return (

    <div className="rounded-xl border border-white/10 bg-black/10 p-3">

      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35">
        {getMaterialLabel(
          material
        )}
      </p>

      <p className="mt-1 text-lg font-bold">
        {formatNumber(
          amount
        )}
      </p>

    </div>

  );
}

/* =========================================================
   REGION BADGE
   ========================================================= */

function RegionBadge({
  region,
}: {
  region: Region;
}) {
  const theme =
    getRegionTheme(
      region
    );

  return (

    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${theme.badge}`}
    >
      {getRegionLabel(
        region
      )}
    </span>

  );
}

/* =========================================================
   REGION THEMES
   ========================================================= */

function getRegionTheme(
  region: Region
) {
  if (
    region ===
    "moon"
  ) {
    return {
      border:
        "border-[#405a78]",

      background:
        "bg-[#202a35]",

      cardBorder:
        "border-[#557494]",

      cardBackground:
        "bg-[#2b3744]",

      badge:
        "bg-[#2d4054] text-[#9bbcff]",

      button:
        "bg-[#2d4054] text-[#9bbcff]",

      checkbox:
        "bg-[#6688ac] text-white",
    };
  }

  if (
    region ===
    "mars"
  ) {
    return {
      border:
        "border-[#9a5a49]",

      background:
        "bg-[#2c211f]",

      cardBorder:
        "border-[#a86754]",

      cardBackground:
        "bg-[#3a2a28]",

      badge:
        "bg-[#4b2d28] text-[#efaa91]",

      button:
        "bg-[#4b2d28] text-[#efaa91]",

      checkbox:
        "bg-[#b66f59] text-white",
    };
  }

  return {
    border:
      "border-[#8b783a]",

    background:
      "bg-[#2b281d]",

    cardBorder:
      "border-[#9a8645]",

    cardBackground:
      "bg-[#3a3423]",

    badge:
      "bg-[#463e25] text-[#e4cc7e]",

    button:
      "bg-[#463e25] text-[#e4cc7e]",

    checkbox:
      "bg-[#a89048] text-white",
  };
}