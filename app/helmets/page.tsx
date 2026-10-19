"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { helmets } from "../../data/helmets";

import {
  compactedItems,
  getUnderlyingCompactedItem,
  type CompactedItem,
} from "../../data/compactedItems";

/* =========================================================
   TYPES
   ========================================================= */

type HelmetRegion =
  | "space"
  | "sun";

type Requirement = {
  material: string;
  amount: number;
  note?: string;
};

type HelmetUpgrade = {
  id: string;
  name: string;
  region: HelmetRegion;
  stars: number;
  requirements: Requirement[];
};

type OpenSections = {
  overview: boolean;
  space: boolean;
  sun: boolean;
};

type SavedState = {
  completed: string[];
  openSections: OpenSections;
};

type ExpandedRequirement = {
  compactedItem: CompactedItem;
  isPlasma: boolean;
  amount: number;
  ingredients: Requirement[];
  timeHours: number;
};

/* =========================================================
   TYPED DATA
   ========================================================= */

const typedHelmets =
  helmets as HelmetUpgrade[];

/* =========================================================
   STORAGE
   ========================================================= */

const STORAGE_KEY =
  "t5-mission-control-helmets";

/* =========================================================
   DEFAULT STATE
   ========================================================= */

const DEFAULT_OPEN_SECTIONS: OpenSections = {
  overview: true,
  space: true,
  sun: true,
};

const DEFAULT_STATE: SavedState = {
  completed: [],
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
  coinsQd:
    "Qd Coins",

  starShards:
    "Star-Shards",

  lunarFragment:
    "Lunar Fragment",

  chisiliteShard:
    "Chisilite Shard",

  basaltShard:
    "Basalt Shard",

  breccaPowder:
    "Brecca Powder",

  regolithSoil:
    "Regolith Soil",

  sunflowerSeedGrown:
    "Sunflower Seed (Grown)",

  souls:
    "Souls",

  mythicMysticSword:
    "Mythic (Mystic) Sword",

  amberFragment:
    "Amber Fragment",

  ametrine:
    "Ametrine",

  mythicPants:
    "Mythic Pants",

  rhodnite:
    "Rhodnite",

  plasmaShard:
    "Plasma Shard",

  fiber:
    "Fiber",

  sunFragment:
    "Sun Fragment",

  compactedCoins:
    "Compacted Coins",

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
};

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

function getHelmetIndex(
  id: string
) {
  return typedHelmets.findIndex(
    (
      helmet
    ) =>
      helmet.id ===
      id
  );
}

/* =========================================================
   COMPACTED ITEMS
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
   HELMET RANK COLOURS
   ========================================================= */

function getHelmetRankColors(
  upgrade: HelmetUpgrade
): string[] {
  const WHITE =
    "#FFFFFF";

  const LIGHT =
    "#AAAAAA";

  const MID =
    "#555555";

  const DARK =
    "#000000";

  const RED =
    "#FF5555";

  const colors = [
    WHITE,
    WHITE,
    WHITE,
    WHITE,
    WHITE,
  ];

  /* =======================================================
     SUNSUIT
     ======================================================= */

  if (
    upgrade.region ===
    "sun"
  ) {
    const filled =
      Math.min(
        5,
        Math.max(
          0,
          upgrade.stars
        )
      );

    for (
      let index = 0;
      index < filled;
      index++
    ) {
      colors[index] =
        RED;
    }

    return colors;
  }

  /* =======================================================
     SPACE 1 - 5
     ======================================================= */

  if (
    upgrade.stars >=
      1 &&
    upgrade.stars <=
      5
  ) {
    for (
      let index = 0;
      index <
      upgrade.stars;
      index++
    ) {
      colors[index] =
        LIGHT;
    }

    return colors;
  }

  /* =======================================================
     SPACE 6 - 10
     ======================================================= */

  if (
    upgrade.stars >=
      6 &&
    upgrade.stars <=
      10
  ) {
    for (
      let index = 0;
      index < 5;
      index++
    ) {
      colors[index] =
        LIGHT;
    }

    const newTierStars =
      upgrade.stars -
      5;

    for (
      let index = 0;
      index <
      newTierStars;
      index++
    ) {
      colors[index] =
        MID;
    }

    return colors;
  }

  /* =======================================================
     SPACE 11 - 15
     ======================================================= */

  if (
    upgrade.stars >=
      11 &&
    upgrade.stars <=
      15
  ) {
    for (
      let index = 0;
      index < 5;
      index++
    ) {
      colors[index] =
        MID;
    }

    const newTierStars =
      upgrade.stars -
      10;

    for (
      let index = 0;
      index <
      newTierStars;
      index++
    ) {
      colors[index] =
        DARK;
    }

    return colors;
  }

  return colors;
}

/* =========================================================
   ACCESSIBILITY NAME
   ========================================================= */

function getHelmetProgressName(
  upgrade: HelmetUpgrade
) {
  if (
    upgrade.id ===
    "sunsuit-helmet-base"
  ) {
    return "Sunsuit Helmet Base";
  }

  if (
    upgrade.region ===
    "space"
  ) {
    return `Space Helmet ${upgrade.stars}`;
  }

  return `Sunsuit Helmet ${upgrade.stars}`;
}

/* =========================================================
   PAGE
   ========================================================= */

export default function HelmetsPage() {
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
        "Could not load helmet progression:",
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
        "Could not save helmet progression:",
        error
      );
    }
  }, [
    state,
    loaded,
  ]);

  /* =======================================================
     COMPLETED
     ======================================================= */

  const completedSet =
    useMemo(
      () =>
        new Set(
          state.completed
        ),
      [
        state.completed,
      ]
    );

  /* =======================================================
     CURRENT PROGRESSION
     ======================================================= */

  const highestCompletedIndex =
    useMemo(() => {
      let highest =
        -1;

      typedHelmets.forEach(
        (
          helmet,
          index
        ) => {
          if (
            completedSet.has(
              helmet.id
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
      completedSet,
    ]);

  const currentUpgrade =
    highestCompletedIndex >=
    0
      ? typedHelmets[
          highestCompletedIndex
        ]
      : null;

  const nextUpgrade =
    highestCompletedIndex +
      1 <
    typedHelmets.length
      ? typedHelmets[
          highestCompletedIndex +
            1
        ]
      : null;

  const completedCount =
    highestCompletedIndex +
    1;

  const progressPercentage =
    typedHelmets.length >
    0
      ? (
          completedCount /
          typedHelmets.length
        ) *
        100
      : 0;

  /* =======================================================
     GROUP DATA
     ======================================================= */

  const groupedHelmets =
    useMemo(() => {
      return {
        space:
          typedHelmets.filter(
            (
              helmet
            ) =>
              helmet.region ===
              "space"
          ),

        sun:
          typedHelmets.filter(
            (
              helmet
            ) =>
              helmet.region ===
              "sun"
          ),
      };
    }, []);

  /* =======================================================
     TOGGLE UPGRADE
     ======================================================= */

  function toggleUpgrade(
    id: string
  ) {
    const index =
      getHelmetIndex(
        id
      );

    if (
      index <
      0
    ) {
      return;
    }

    const alreadyCompleted =
      completedSet.has(
        id
      );

    if (
      alreadyCompleted
    ) {
      const remaining =
        typedHelmets
          .slice(
            0,
            index
          )
          .map(
            (
              helmet
            ) =>
              helmet.id
          );

      setState(
        (
          current
        ) => ({
          ...current,

          completed:
            remaining,
        })
      );

      return;
    }

    const completed =
      typedHelmets
        .slice(
          0,
          index +
            1
        )
        .map(
          (
            helmet
          ) =>
            helmet.id
        );

    setState(
      (
        current
      ) => ({
        ...current,

        completed,
      })
    );
  }

  /* =======================================================
     SECTION TOGGLE
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

        completed: [],
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
            Helmets
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-[#9aa4af] md:text-base">
            Track Space Helmet and Sunsuit Helmet progression and view the materials required for every upgrade.
          </p>

        </div>

        {/* =================================================
            OVERVIEW
            ================================================= */}

        <MainSection
          eyebrow="Progress"
          title="Helmet Progression"

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
              label="Current Upgrade"

              value={
                currentUpgrade
                  ? ""
                  : "Not Started"
              }

              description={
                currentUpgrade
                  ? "Highest upgrade obtained"
                  : "No helmet upgrades obtained"
              }

              stars={
                currentUpgrade
                  ? (
                    <HelmetRank
                      upgrade={
                        currentUpgrade
                      }
                    />
                  )
                  : undefined
              }
            />

            <OverviewStat
              label="Next Upgrade"

              value={
                nextUpgrade
                  ? ""
                  : "Maxed"
              }

              description={
                nextUpgrade
                  ? "Next progression step"
                  : "Helmet progression complete"
              }

              stars={
                nextUpgrade
                  ? (
                    <HelmetRank
                      upgrade={
                        nextUpgrade
                      }
                    />
                  )
                  : undefined
              }
            />

            <OverviewStat
              label="Completed"

              value={`${completedCount} / ${typedHelmets.length}`}

              description="Helmet upgrades obtained"
            />

            <OverviewStat
              label="Progress"

              value={`${Math.round(
                progressPercentage
              )}%`}

              description="Overall helmet progression"
            />

          </div>

          {/* =================================================
              PROGRESS BAR
              ================================================= */}

          <div className="mt-5">

            <div className="mb-2 flex items-center justify-between gap-4 text-xs text-white/40">

              <span>
                Space Helmet
              </span>

              <span>
                Sunsuit Helmet
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

          {/* =================================================
              NEXT UPGRADE
              ================================================= */}

          {nextUpgrade ? (

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/10 p-5">

              <div className="flex flex-wrap items-start justify-between gap-4">

                <div>

                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                    Next Upgrade
                  </p>

                  <div className="mt-3">

                    <HelmetRank
                      upgrade={
                        nextUpgrade
                      }
                    />

                  </div>

                </div>

                <HelmetTypeBadge
                  region={
                    nextUpgrade.region
                  }
                />

              </div>

              <div className="mt-4 space-y-3">

                {nextUpgrade.requirements.map(
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
                All helmet upgrades completed
              </p>

              <p className="mt-1 text-sm text-white/45">
                You have completed the full helmet progression.
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
            SPACE HELMET
            ================================================= */}

        <HelmetSection
          title="Space Helmet"
          eyebrow="Space Progression"

          region="space"

          open={
            state
              .openSections
              .space
          }

          onToggle={() =>
            toggleSection(
              "space"
            )
          }
        >

          <div className="overflow-x-auto pb-2">

            <div className="grid min-w-[1250px] grid-cols-5 gap-4">

              {groupedHelmets.space.map(
                (
                  upgrade
                ) => {

                  const index =
                    getHelmetIndex(
                      upgrade.id
                    );

                  const obtained =
                    completedSet.has(
                      upgrade.id
                    );

                  const isNext =
                    index ===
                    highestCompletedIndex +
                      1;

                  return (

                    <HelmetCard
                      key={
                        upgrade.id
                      }

                      upgrade={
                        upgrade
                      }

                      obtained={
                        obtained
                      }

                      isNext={
                        isNext
                      }

                      onToggle={() =>
                        toggleUpgrade(
                          upgrade.id
                        )
                      }
                    />

                  );
                }
              )}

            </div>

          </div>

        </HelmetSection>

        {/* =================================================
            SUNSUIT HELMET
            ================================================= */}

        <HelmetSection
          title="Sunsuit Helmet"
          eyebrow="Sun Progression"

          region="sun"

          open={
            state
              .openSections
              .sun
          }

          onToggle={() =>
            toggleSection(
              "sun"
            )
          }
        >

          <div className="overflow-x-auto pb-2">

            <div className="grid min-w-[1500px] grid-cols-6 gap-4">

              {groupedHelmets.sun.map(
                (
                  upgrade
                ) => {

                  const index =
                    getHelmetIndex(
                      upgrade.id
                    );

                  const obtained =
                    completedSet.has(
                      upgrade.id
                    );

                  const isNext =
                    index ===
                    highestCompletedIndex +
                      1;

                  return (

                    <HelmetCard
                      key={
                        upgrade.id
                      }

                      upgrade={
                        upgrade
                      }

                      obtained={
                        obtained
                      }

                      isNext={
                        isNext
                      }

                      onToggle={() =>
                        toggleUpgrade(
                          upgrade.id
                        )
                      }
                    />

                  );
                }
              )}

            </div>

          </div>

        </HelmetSection>

        {/* =================================================
            FOOTNOTE
            ================================================= */}

        <div className="mt-6 rounded-xl border border-white/10 bg-[#1d242d] p-4 text-xs leading-5 text-white/40">

          Helmet progression is sequential.

          {" "}

          Marking a later upgrade as obtained automatically marks all earlier upgrades complete.

          {" "}

          Removing an upgrade removes that upgrade and every upgrade after it.

          {" "}

          Plasma compacted materials use a 1:1 conversion from the matching normal compacted item.

        </div>

      </div>

    </main>
  );
}

/* =========================================================
   HELMET RANK
   ========================================================= */

function HelmetRank({
  upgrade,
}: {
  upgrade: HelmetUpgrade;
}) {
  const colors =
    getHelmetRankColors(
      upgrade
    );

  return (

    <div
      className="flex items-center gap-[2px]"
      aria-label={
        getHelmetProgressName(
          upgrade
        )
      }
    >

      {colors.map(
        (
          color,
          index
        ) => (

          <span
            key={
              index
            }

            className="select-none text-xl font-bold leading-none"

            style={{
              color,

              textShadow:
                color ===
                "#000000"
                  ? "0 0 1px rgba(255,255,255,0.45)"
                  : "none",
            }}
          >
            ❉
          </span>

        )
      )}

    </div>

  );
}

/* =========================================================
   HELMET SECTION
   ========================================================= */

function HelmetSection({
  title,
  eyebrow,
  region,
  open,
  onToggle,
  children,
}: {
  title: string;
  eyebrow: string;
  region: HelmetRegion;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const theme =
    getHelmetTheme(
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

          <p
            className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${theme.accent}`}
          >
            {eyebrow}
          </p>

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
          {children}
        </div>

      )}

    </section>

  );
}

/* =========================================================
   HELMET CARD
   ========================================================= */

function HelmetCard({
  upgrade,
  obtained,
  isNext,
  onToggle,
}: {
  upgrade: HelmetUpgrade;
  obtained: boolean;
  isNext: boolean;
  onToggle: () => void;
}) {
  const theme =
    getHelmetTheme(
      upgrade.region
    );

  return (

    <article
      className={`flex min-w-[230px] flex-col rounded-2xl border p-4 transition ${
        obtained
          ? "border-white/5 bg-black/10 opacity-55"
          : isNext
            ? `${theme.cardBorder} ${theme.cardBackground}`
            : "border-white/10 bg-black/10"
      }`}
    >

      {/* ===================================================
          HEADER
          =================================================== */}

      <div className="flex items-start justify-between gap-3">

        <div>

          <HelmetRank
            upgrade={
              upgrade
            }
          />

          {isNext &&
            !obtained && (

            <span
              className={`mt-2 inline-flex rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${theme.badge}`}
            >
              Next
            </span>

          )}

        </div>

        <button
          type="button"

          aria-label={
            obtained
              ? `Mark ${getHelmetProgressName(
                  upgrade
                )} as not obtained`
              : `Mark ${getHelmetProgressName(
                  upgrade
                )} as obtained`
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

      {/* ===================================================
          REQUIREMENTS
          =================================================== */}

      <div className="mt-4 space-y-3">

        {upgrade.requirements.map(
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

      {/* ===================================================
          TYPE
          =================================================== */}

      <div className="mt-auto pt-4">

        <HelmetTypeBadge
          region={
            upgrade.region
          }
        />

      </div>

    </article>

  );
}

/* =========================================================
   REQUIREMENT DISPLAY
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
     NORMAL ITEM
     ======================================================= */

  if (
    !expanded
  ) {
    return (

      <div className="flex items-center justify-between gap-3 rounded-lg bg-black/10 px-3 py-2 text-xs">

        <span className="whitespace-nowrap text-white/60">
          {getMaterialLabel(
            requirement.material
          )}
        </span>

        <span className="shrink-0 whitespace-nowrap font-bold">
          {formatNumber(
            requirement.amount
          )}
        </span>

      </div>

    );
  }

  /* =======================================================
     COMPACTED / PLASMA ITEM
     ======================================================= */

  return (

    <div className="overflow-hidden rounded-xl border border-[#a88e4d]/25 bg-black/10">

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

        className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left transition hover:bg-white/[0.025]"
      >

        <span className="whitespace-nowrap text-xs font-semibold text-[#e0ca84]">
          {getMaterialLabel(
            requirement.material
          )}
        </span>

        <span className="ml-auto shrink-0 whitespace-nowrap text-xs font-bold">
          {formatNumber(
            requirement.amount
          )}
        </span>

        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#413821] text-sm font-bold text-[#e4cc7e]">
          {open
            ? "−"
            : "+"}
        </span>

      </button>

      {/* ===================================================
          EXPANDED DETAILS
          =================================================== */}

      {open && (

        <div className="border-t border-white/5 bg-black/10 px-3 py-3">

          {/* =================================================
              PLASMA CONVERSION
              ================================================= */}

          {expanded.isPlasma && (

            <div className="mb-3 rounded-lg border border-[#9b8248]/20 bg-[#332d1e] px-3 py-2">

              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/30">
                1:1 Plasma Conversion
              </p>

              <div className="mt-2 flex items-center justify-between gap-3">

                <span className="whitespace-nowrap text-[11px] font-semibold text-[#d8c27c]">
                  {expanded.compactedItem.name}
                </span>

                <span className="shrink-0 whitespace-nowrap text-xs font-bold text-[#ead690]">
                  ×
                  {formatNumber(
                    expanded.amount
                  )}
                </span>

              </div>

            </div>

          )}

          {/* =================================================
              INGREDIENTS
              ================================================= */}

          <div className="space-y-1.5">

            {expanded.ingredients.map(
              (
                ingredient
              ) => (

                <div
                  key={
                    ingredient.material
                  }

                  className="flex items-center justify-between gap-3 text-[11px]"
                >

                  <span className="whitespace-nowrap text-white/45">
                    ↳{" "}
                    {getMaterialLabel(
                      ingredient.material
                    )}
                  </span>

                  <span className="shrink-0 whitespace-nowrap font-semibold text-white/70">
                    {formatNumber(
                      ingredient.amount
                    )}
                  </span>

                </div>

              )
            )}

          </div>

          {/* =================================================
              TIME
              ================================================= */}

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/5 pt-3">

            <span className="whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35">
              Compaction Time
            </span>

            <span className="shrink-0 whitespace-nowrap text-xs font-bold text-[#e4cc7e]">
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
   OVERVIEW STAT
   ========================================================= */

function OverviewStat({
  label,
  value,
  description,
  stars,
}: {
  label: string;
  value: string;
  description: string;
  stars?: ReactNode;
}) {
  return (

    <div className="rounded-xl border border-white/10 bg-black/10 p-4">

      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
        {label}
      </p>

      {value ? (

        <p className="mt-2 break-words text-xl font-bold">
          {value}
        </p>

      ) : null}

      {stars && (

        <div className="mt-2">
          {stars}
        </div>

      )}

      <p className="mt-2 text-xs text-white/30">
        {description}
      </p>

    </div>

  );
}

/* =========================================================
   TYPE BADGE
   ========================================================= */

function HelmetTypeBadge({
  region,
}: {
  region: HelmetRegion;
}) {
  const theme =
    getHelmetTheme(
      region
    );

  return (

    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${theme.badge}`}
    >
      {region ===
      "space"
        ? "Space"
        : "Sunsuit"}
    </span>

  );
}

/* =========================================================
   THEMES
   ========================================================= */

function getHelmetTheme(
  region: HelmetRegion
) {
  if (
    region ===
    "space"
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

      accent:
        "text-[#9bbcff]",

      badge:
        "bg-[#2d4054] text-[#9bbcff]",

      button:
        "bg-[#2d4054] text-[#9bbcff]",

      checkbox:
        "bg-[#6688ac] text-white",
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

    accent:
      "text-[#e4cc7e]",

    badge:
      "bg-[#463e25] text-[#e4cc7e]",

    button:
      "bg-[#463e25] text-[#e4cc7e]",

    checkbox:
      "bg-[#a89048] text-white",
  };
}