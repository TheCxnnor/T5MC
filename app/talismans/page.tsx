"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  talismans,
  type Talisman,
  type TalismanRegion,
  type TalismanRequirement,
} from "../../data/talismans";

import {
  getExpandedRequirement,
  getMaterialLabel,
} from "../../lib/materials";
import { formatHours, formatMaterialValue, formatNumber } from "../../lib/format";
import { CollapsibleSection as MainSection, GroupSection } from "../../components/ui/CollapsibleSection";
import { OverviewStat } from "../../components/ui/StatCards";
import { MaterialTotals } from "../../components/ui/MaterialTotals";
import { getMaterialSummary } from "../../lib/materialTotals";

/* =========================================================
   TYPES
   ========================================================= */

type OpenSections = {
  overview: boolean;
  moon: boolean;
  mars: boolean;
  sun: boolean;
  totals: boolean;
};

type SavedState = {
  obtained: string[];
  openSections: OpenSections;
};

/* =========================================================
   STORAGE
   ========================================================= */

const STORAGE_KEY =
  "t5-mission-control-talismans";

/* =========================================================
   DEFAULT STATE
   ========================================================= */

const DEFAULT_OPEN_SECTIONS: OpenSections = {
  overview: true,
  moon: true,
  mars: true,
  sun: true,
  totals: false,
};

const DEFAULT_STATE: SavedState = {
  obtained: [],
  openSections:
    DEFAULT_OPEN_SECTIONS,
};

/* =========================================================
   HELPERS
   ========================================================= */

function getRegionLabel(
  region: TalismanRegion
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

/* =========================================================
   PAGE
   ========================================================= */

export default function TalismansPage() {
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
        "Could not load talisman progression:",
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
        "Could not save talisman progression:",
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
     GROUPS
     ======================================================= */

  const groupedTalismans =
    useMemo(() => {
      return {
        moon:
          talismans.filter(
            (
              talisman
            ) =>
              talisman.region ===
              "moon"
          ),

        mars:
          talismans.filter(
            (
              talisman
            ) =>
              talisman.region ===
              "mars"
          ),

        sun:
          talismans.filter(
            (
              talisman
            ) =>
              talisman.region ===
              "sun"
          ),
      };
    }, []);

  /* =======================================================
     COUNTS
     ======================================================= */

  const completedCount =
    state.obtained.length;

  const progressPercentage =
    talismans.length >
    0
      ? (
          completedCount /
          talismans.length
        ) *
        100
      : 0;

  const moonCompleted =
    groupedTalismans.moon.filter(
      (
        talisman
      ) =>
        obtainedSet.has(
          talisman.id
        )
    ).length;

  const marsCompleted =
    groupedTalismans.mars.filter(
      (
        talisman
      ) =>
        obtainedSet.has(
          talisman.id
        )
    ).length;

  const sunCompleted =
    groupedTalismans.sun.filter(
      (
        talisman
      ) =>
        obtainedSet.has(
          talisman.id
        )
    ).length;

  const nextTalisman =
    useMemo(() => {
      return (
        talismans.find(
          (
            talisman
          ) =>
            !obtainedSet.has(
              talisman.id
            )
        ) ??
        null
      );
    }, [
      obtainedSet,
    ]);

  /* =======================================================
     REMAINING MATERIAL TOTALS
     ======================================================= */

  const remainingMaterialTotals = useMemo(
    () => getMaterialSummary(talismans.filter(talisman => !obtainedSet.has(talisman.id))
      .flatMap(talisman => talisman.requirements)),
    [obtainedSet]
  );

  /* =======================================================
     TOGGLE TALISMAN
     ======================================================= */

  function toggleTalisman(
    id: string
  ) {
    setState(
      (
        current
      ) => {
        const exists =
          current.obtained.includes(
            id
          );

        return {
          ...current,

          obtained:
            exists
              ? current.obtained.filter(
                  (
                    talismanId
                  ) =>
                    talismanId !==
                    id
                )
              : [
                  ...current.obtained,
                  id,
                ],
        };
      }
    );
  }

  /* =======================================================
     TOGGLE REGION COMPLETE
     ======================================================= */

  function toggleRegionComplete(
    region: TalismanRegion
  ) {
    const regionTalismans =
      groupedTalismans[
        region
      ];

    const regionIds =
      regionTalismans.map(
        (
          talisman
        ) =>
          talisman.id
      );

    const allComplete =
      regionIds.every(
        (
          id
        ) =>
          obtainedSet.has(
            id
          )
      );

    setState(
      (
        current
      ) => {
        if (
          allComplete
        ) {
          return {
            ...current,

            obtained:
              current.obtained.filter(
                (
                  id
                ) =>
                  !regionIds.includes(
                    id
                  )
              ),
          };
        }

        const combined =
          new Set([
            ...current.obtained,
            ...regionIds,
          ]);

        return {
          ...current,

          obtained:
            Array.from(
              combined
            ),
        };
      }
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
            Talismans
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-[#9aa4af] md:text-base">
            Track Moon, Mars and Sun talismans and view the materials required for each upgrade.
          </p>

        </div>

        {/* =================================================
            OVERVIEW
            ================================================= */}

        <MainSection
          eyebrow="Progress"
          title="Talisman Progression"

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
              label="Obtained"

              value={`${completedCount} / ${talismans.length}`}

              description="Total talismans obtained"
            />

            <OverviewStat
              label="Moon"

              value={`${moonCompleted} / ${groupedTalismans.moon.length}`}

              description="Moon talismans obtained"
            />

            <OverviewStat
              label="Mars"

              value={`${marsCompleted} / ${groupedTalismans.mars.length}`}

              description="Mars talismans obtained"
            />

            <OverviewStat
              label="Sun"

              value={`${sunCompleted} / ${groupedTalismans.sun.length}`}

              description="Sun talismans obtained"
            />

          </div>

          <div className="mt-5">

            <div className="mb-2 flex items-center justify-between gap-4 text-xs text-white/40">

              <span>
                0%
              </span>

              <span>
                {Math.round(
                  progressPercentage
                )}%
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

          {nextTalisman ? (

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/10 p-5">

              <div className="flex flex-wrap items-start justify-between gap-4">

                <div>

                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                    Next Unobtained
                  </p>

                  <h3 className="mt-2 text-2xl font-bold">
                    {nextTalisman.name}
                  </h3>

                </div>

                <RegionBadge
                  region={
                    nextTalisman.region
                  }
                />

              </div>

              <div className="mt-4 space-y-3">

                {nextTalisman.requirements.map(
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
                All talismans obtained
              </p>

              <p className="mt-1 text-sm text-white/45">
                Every tracked Moon, Mars and Sun talisman has been marked complete.
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
            MOON
            ================================================= */}

        <TalismanSection
          title="Moon Talismans"
          region="moon"

          open={
            state
              .openSections
              .moon
          }

          onToggle={() =>
            toggleSection(
              "moon"
            )
          }

          completed={
            moonCompleted
          }

          total={
            groupedTalismans
              .moon
              .length
          }

          onToggleAll={() =>
            toggleRegionComplete(
              "moon"
            )
          }
        >

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">

            {groupedTalismans.moon.map(
              (
                talisman
              ) => (

                <TalismanCard
                  key={
                    talisman.id
                  }

                  talisman={
                    talisman
                  }

                  obtained={
                    obtainedSet.has(
                      talisman.id
                    )
                  }

                  onToggle={() =>
                    toggleTalisman(
                      talisman.id
                    )
                  }
                />

              )
            )}

          </div>

        </TalismanSection>

        {/* =================================================
            MARS
            ================================================= */}

        <TalismanSection
          title="Mars Talismans"
          region="mars"

          open={
            state
              .openSections
              .mars
          }

          onToggle={() =>
            toggleSection(
              "mars"
            )
          }

          completed={
            marsCompleted
          }

          total={
            groupedTalismans
              .mars
              .length
          }

          onToggleAll={() =>
            toggleRegionComplete(
              "mars"
            )
          }
        >

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">

            {groupedTalismans.mars.map(
              (
                talisman
              ) => (

                <TalismanCard
                  key={
                    talisman.id
                  }

                  talisman={
                    talisman
                  }

                  obtained={
                    obtainedSet.has(
                      talisman.id
                    )
                  }

                  onToggle={() =>
                    toggleTalisman(
                      talisman.id
                    )
                  }
                />

              )
            )}

          </div>

        </TalismanSection>

        {/* =================================================
            SUN
            ================================================= */}

        <TalismanSection
          title="Sun Talismans"
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

          completed={
            sunCompleted
          }

          total={
            groupedTalismans
              .sun
              .length
          }

          onToggleAll={() =>
            toggleRegionComplete(
              "sun"
            )
          }
        >

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">

            {groupedTalismans.sun.map(
              (
                talisman
              ) => (

                <TalismanCard
                  key={
                    talisman.id
                  }

                  talisman={
                    talisman
                  }

                  obtained={
                    obtainedSet.has(
                      talisman.id
                    )
                  }

                  onToggle={() =>
                    toggleTalisman(
                      talisman.id
                    )
                  }
                />

              )
            )}

          </div>

        </TalismanSection>

        {/* =================================================
            MATERIAL TOTALS
            ================================================= */}

        <MainSection
          eyebrow="Materials"
          title="Material Totals"

          open={
            state
              .openSections
              .totals
          }

          onToggle={() =>
            toggleSection(
              "totals"
            )
          }

          borderClass="border-[#56734f]"
          backgroundClass="bg-[#202a20]"
          accentClass="text-[#a9cf9f]"
          buttonClass="bg-[#30432d] text-[#b9dfaf]"
        >

          <MaterialTotals
            summary={remainingMaterialTotals}
            description="Cumulative requirements for every talisman you have not obtained."
            emptyMessage="All talismans completed. You have no remaining talisman materials."
          />

        </MainSection>

      </div>

    </main>
  );
}

/* =========================================================
   TALISMAN CARD
   ========================================================= */

function TalismanCard({
  talisman,
  obtained,
  onToggle,
}: {
  talisman: Talisman;
  obtained: boolean;
  onToggle: () => void;
}) {
  const theme =
    getRegionTheme(
      talisman.region
    );

  return (

    <article
      className={`flex min-w-0 flex-col rounded-2xl border p-4 transition ${
        obtained
          ? "border-white/5 bg-black/10 opacity-55"
          : `${theme.cardBorder} ${theme.cardBackground}`
      }`}
    >

      <div className="flex items-start justify-between gap-3">

        <h3 className="min-w-0 break-words text-lg font-bold">
          {talisman.name}
        </h3>

        <button
          type="button"

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

      <div className="mt-4 min-w-0 space-y-3">

        {talisman.requirements.map(
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
            talisman.region
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
  requirement: TalismanRequirement;
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
          {formatMaterialValue(
            requirement.material,
            requirement.amount
          )}
        </span>

      </div>

    );
  }

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
            {formatMaterialValue(
              requirement.material,
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

      {open && (

        <div className="border-t border-white/5 bg-black/10 px-3 py-3">

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
                    {formatMaterialValue(
                      ingredient.material,
                      ingredient.amount
                    )}
                  </span>

                </div>

              )
            )}

          </div>

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
   TALISMAN SECTION
   ========================================================= */

function TalismanSection({
  title,
  region,
  open,
  onToggle,
  completed,
  total,
  onToggleAll,
  children,
}: {
  title: string;
  region: TalismanRegion;
  open: boolean;
  onToggle: () => void;
  completed: number;
  total: number;
  onToggleAll: () => void;
  children: ReactNode;
}) {
  const theme = getRegionTheme(region);

  return (
    <GroupSection
      eyebrow={getRegionLabel(region)}
      title={title}
      open={open}
      onToggle={onToggle}
      completed={completed}
      total={total}
      onToggleAll={onToggleAll}
      border={theme.border}
      background={theme.background}
      accent={theme.accent}
      badge={theme.badge}
      button={theme.button}
      checkbox={theme.checkbox}
      checkboxClassName="flex h-8 w-8 items-center justify-center rounded-md border text-sm font-bold transition"
      uncheckedClassName="border-white/20 bg-black/10 text-transparent hover:border-white/40"
    >
      {children}
    </GroupSection>
  );
}


/* =========================================================
   REGION BADGE
   ========================================================= */

function RegionBadge({
  region,
}: {
  region: TalismanRegion;
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
  region: TalismanRegion
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

      accent:
        "text-[#efaa91]",

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