"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  miscItems,
  o2Tanks,
  quickwarps,
  type MiscRequirement,
  type Quickwarp,
} from "../../data/misc";

/* =========================================================
   TYPES
   ========================================================= */

type OpenSections = {
  overview: boolean;
  tanks: boolean;
  quickwarps: boolean;
  misc: boolean;
  totals: boolean;
};

type SavedState = {
  completed: string[];
  openSections: OpenSections;
};

type MaterialTotal = {
  material: string;
  amount: number;
};

/* =========================================================
   STORAGE
   ========================================================= */

const STORAGE_KEY =
  "t5-mission-control-misc";

/* =========================================================
   DEFAULT STATE
   ========================================================= */

const DEFAULT_OPEN_SECTIONS: OpenSections = {
  overview: true,
  tanks: true,
  quickwarps: true,
  misc: true,
  totals: false,
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
  lunarFragment:
    "Lunar Fragment",

  chisiliteShard:
    "Chisilite Shard",

  basaltShard:
    "Basalt Shard",

  breccaPowder:
    "Brecca Powder",

  amberFragment:
    "Amber Fragment",

  ametrine:
    "Ametrine",

  martianDust:
    "Martian Dust",

  rhodnite:
    "Rhodnite",

  plasmaShard:
    "Plasma Shard",

  fiber:
    "Fiber",

  magma:
    "Magma",

  starShards:
    "Star-Shards",

  coinsT:
    "Coins",

  researchCore1:
    "Research Core 1★",

  regolithSoil:
    "Regolith Soil",

  redroot:
    "Redroot",

  ash:
    "Ash",
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

/* =========================================================
   MATERIAL VALUE FORMATTER
   ========================================================= */

function formatMaterialValue(
  material: string,
  amount: number
) {
  if (
    material ===
    "coinsT"
  ) {
    return `${formatNumber(
      amount
    )}T`;
  }

  return formatNumber(
    amount
  );
}

function addRequirements(
  totals: Map<
    string,
    number
  >,
  requirements: MiscRequirement[]
) {
  requirements.forEach(
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

/* =========================================================
   PAGE
   ========================================================= */

export default function MiscPage() {
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
        "Could not load Tanks / Quickwarps / Misc progression:",
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
        "Could not save Tanks / Quickwarps / Misc progression:",
        error
      );
    }
  }, [
    state,
    loaded,
  ]);

  /* =======================================================
     COMPLETED SET
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
     COUNTS
     ======================================================= */

  const tankCompleted =
    o2Tanks.filter(
      (
        tank
      ) =>
        completedSet.has(
          tank.id
        )
    ).length;

  const quickwarpCompleted =
    quickwarps.filter(
      (
        quickwarp
      ) =>
        completedSet.has(
          quickwarp.id
        )
    ).length;

  const miscCompleted =
    miscItems.filter(
      (
        item
      ) =>
        completedSet.has(
          item.id
        )
    ).length;

  const totalItems =
    o2Tanks.length +
    quickwarps.length +
    miscItems.length;

  const completedCount =
    tankCompleted +
    quickwarpCompleted +
    miscCompleted;

  const progressPercentage =
    totalItems >
    0
      ? (
          completedCount /
          totalItems
        ) *
        100
      : 0;

  /* =======================================================
     REMAINING MATERIALS
     ======================================================= */

  const remainingMaterialTotals =
    useMemo(() => {
      const totals =
        new Map<
          string,
          number
        >();

      o2Tanks
        .filter(
          (
            tank
          ) =>
            !completedSet.has(
              tank.id
            )
        )
        .forEach(
          (
            tank
          ) => {
            addRequirements(
              totals,
              tank.requirements
            );
          }
        );

      quickwarps
        .filter(
          (
            quickwarp
          ) =>
            !completedSet.has(
              quickwarp.id
            )
        )
        .forEach(
          (
            quickwarp
          ) => {
            addRequirements(
              totals,
              quickwarp.requirements
            );
          }
        );

      miscItems
        .filter(
          (
            item
          ) =>
            !completedSet.has(
              item.id
            )
        )
        .forEach(
          (
            item
          ) => {
            addRequirements(
              totals,
              item.requirements
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
      completedSet,
    ]);

  /* =======================================================
     TOGGLE ITEM
     ======================================================= */

  function toggleItem(
    id: string
  ) {
    setState(
      (
        current
      ) => {
        const exists =
          current.completed.includes(
            id
          );

        return {
          ...current,

          completed:
            exists
              ? current.completed.filter(
                  (
                    itemId
                  ) =>
                    itemId !==
                    id
                )
              : [
                  ...current.completed,
                  id,
                ],
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
     MARK WHOLE GROUP
     ======================================================= */

  function toggleGroup(
    ids: string[]
  ) {
    const allComplete =
      ids.every(
        (
          id
        ) =>
          completedSet.has(
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

            completed:
              current.completed.filter(
                (
                  id
                ) =>
                  !ids.includes(
                    id
                  )
              ),
          };
        }

        return {
          ...current,

          completed:
            Array.from(
              new Set([
                ...current.completed,
                ...ids,
              ])
            ),
        };
      }
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
            Tanks / Quickwarps / Misc
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-[#9aa4af] md:text-base">
            Track O₂ Tanks, Quickwarps and miscellaneous progression items.
          </p>

        </div>

        {/* =================================================
            OVERVIEW
            ================================================= */}

        <CollapsibleSection
          eyebrow="Progress"
          title="Overall Progress"

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

          border="border-[#536272]"
          background="bg-[#1e252d]"
          accent="text-[#a8bad0]"
          button="bg-[#293440] text-[#b9c9dc]"
        >

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            <OverviewStat
              label="Completed"
              value={`${completedCount} / ${totalItems}`}
              description="Total items obtained"
            />

            <OverviewStat
              label="O₂ Tanks"
              value={`${tankCompleted} / ${o2Tanks.length}`}
              description="Tank upgrades obtained"
            />

            <OverviewStat
              label="Quickwarps"
              value={`${quickwarpCompleted} / ${quickwarps.length}`}
              description="Quickwarps unlocked"
            />

            <OverviewStat
              label="Other Items"
              value={`${miscCompleted} / ${miscItems.length}`}
              description="Miscellaneous items obtained"
            />

          </div>

          <div className="mt-5">

            <div className="mb-2 flex items-center justify-between text-xs text-white/40">

              <span>
                Progress
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

        </CollapsibleSection>

        {/* =================================================
            O2 TANKS
            ================================================= */}

        <GroupSection
          eyebrow="O₂"
          title="O₂ Tanks"

          open={
            state
              .openSections
              .tanks
          }

          onToggle={() =>
            toggleSection(
              "tanks"
            )
          }

          completed={
            tankCompleted
          }

          total={
            o2Tanks.length
          }

          onToggleAll={() =>
            toggleGroup(
              o2Tanks.map(
                (
                  tank
                ) =>
                  tank.id
              )
            )
          }

          border="border-[#405a78]"
          background="bg-[#202a35]"
          accent="text-[#9bbcff]"
          badge="bg-[#2d4054] text-[#9bbcff]"
          button="bg-[#2d4054] text-[#9bbcff]"
          checkbox="bg-[#6688ac] text-white"
        >

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

            {o2Tanks.map(
              (
                tank
              ) => (

                <ItemCard
                  key={
                    tank.id
                  }

                  name={
                    tank.name
                  }

                  requirements={
                    tank.requirements
                  }

                  obtained={
                    completedSet.has(
                      tank.id
                    )
                  }

                  onToggle={() =>
                    toggleItem(
                      tank.id
                    )
                  }

                  border="border-[#557494]"
                  background="bg-[#2b3744]"
                  checkbox="bg-[#6688ac] text-white"
                />

              )
            )}

          </div>

        </GroupSection>

        {/* =================================================
            QUICKWARPS
            ================================================= */}

        <GroupSection
          eyebrow="Travel"
          title="Quickwarps"

          open={
            state
              .openSections
              .quickwarps
          }

          onToggle={() =>
            toggleSection(
              "quickwarps"
            )
          }

          completed={
            quickwarpCompleted
          }

          total={
            quickwarps.length
          }

          onToggleAll={() =>
            toggleGroup(
              quickwarps.map(
                (
                  item
                ) =>
                  item.id
              )
            )
          }

          border="border-[#9a5a49]"
          background="bg-[#2c211f]"
          accent="text-[#efaa91]"
          badge="bg-[#4b2d28] text-[#efaa91]"
          button="bg-[#4b2d28] text-[#efaa91]"
          checkbox="bg-[#b66f59] text-white"
        >

          <div className="grid gap-4 md:grid-cols-3">

            {quickwarps.map(
              (
                quickwarp
              ) => (

                <QuickwarpCard
                  key={
                    quickwarp.id
                  }

                  quickwarp={
                    quickwarp
                  }

                  obtained={
                    completedSet.has(
                      quickwarp.id
                    )
                  }

                  onToggle={() =>
                    toggleItem(
                      quickwarp.id
                    )
                  }
                />

              )
            )}

          </div>

        </GroupSection>

        {/* =================================================
            OTHER ITEMS
            ================================================= */}

        <GroupSection
          eyebrow="Utility"
          title="Other Items"

          open={
            state
              .openSections
              .misc
          }

          onToggle={() =>
            toggleSection(
              "misc"
            )
          }

          completed={
            miscCompleted
          }

          total={
            miscItems.length
          }

          onToggleAll={() =>
            toggleGroup(
              miscItems.map(
                (
                  item
                ) =>
                  item.id
              )
            )
          }

          border="border-[#8b783a]"
          background="bg-[#2b281d]"
          accent="text-[#e4cc7e]"
          badge="bg-[#463e25] text-[#e4cc7e]"
          button="bg-[#463e25] text-[#e4cc7e]"
          checkbox="bg-[#a89048] text-white"
        >

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">

            {miscItems.map(
              (
                item
              ) => (

                <ItemCard
                  key={
                    item.id
                  }

                  name={
                    item.name
                  }

                  requirements={
                    item.requirements
                  }

                  obtained={
                    completedSet.has(
                      item.id
                    )
                  }

                  onToggle={() =>
                    toggleItem(
                      item.id
                    )
                  }

                  border="border-[#9a8645]"
                  background="bg-[#3a3423]"
                  checkbox="bg-[#a89048] text-white"
                />

              )
            )}

          </div>

        </GroupSection>

        {/* =================================================
            MATERIAL TOTALS
            ================================================= */}

        <CollapsibleSection
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

          border="border-[#56734f]"
          background="bg-[#202a20]"
          accent="text-[#a9cf9f]"
          button="bg-[#30432d] text-[#b9dfaf]"
        >

          <div className="rounded-2xl border border-white/10 bg-black/10 p-4 md:p-5">

            <div>

              <h3 className="text-lg font-bold">
                Remaining Materials
              </h3>

              <p className="mt-1 text-xs text-white/35">
                Everything still required for items you have not marked complete.
              </p>

            </div>

            {remainingMaterialTotals.length >
            0 ? (

              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                {remainingMaterialTotals.map(
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

            ) : (

              <div className="mt-4 rounded-xl border border-white/10 bg-black/10 p-5 text-center">

                <p className="font-semibold text-[#b9dfaf]">
                  Everything completed
                </p>

                <p className="mt-1 text-sm text-white/35">
                  You have no remaining materials on this page.
                </p>

              </div>

            )}

          </div>

        </CollapsibleSection>

      </div>

    </main>
  );
}

/* =========================================================
   ITEM CARD
   ========================================================= */

function ItemCard({
  name,
  requirements,
  obtained,
  onToggle,
  border,
  background,
  checkbox,
}: {
  name: string;
  requirements: MiscRequirement[];
  obtained: boolean;
  onToggle: () => void;
  border: string;
  background: string;
  checkbox: string;
}) {
  return (

    <article
      className={`flex min-w-0 flex-col rounded-2xl border p-4 transition ${
        obtained
          ? "border-white/5 bg-black/10 opacity-55"
          : `${border} ${background}`
      }`}
    >

      <div className="flex items-start justify-between gap-3">

        <h3 className="min-w-0 break-words text-base font-bold">
          {name}
        </h3>

        <button
          type="button"

          onClick={
            onToggle
          }

          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-sm font-bold transition ${
            obtained
              ? `${checkbox} border-transparent`
              : "border-white/20 bg-black/10 text-transparent hover:border-white/40"
          }`}
        >
          ✓
        </button>

      </div>

      <div className="mt-4 space-y-2">

        {requirements.map(
          (
            requirement
          ) => (

            <RequirementRow
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

    </article>

  );
}

/* =========================================================
   QUICKWARP CARD
   ========================================================= */

function QuickwarpCard({
  quickwarp,
  obtained,
  onToggle,
}: {
  quickwarp: Quickwarp;
  obtained: boolean;
  onToggle: () => void;
}) {
  const theme =
    getQuickwarpTheme(
      quickwarp.region
    );

  return (

    <article
      className={`flex min-w-0 flex-col rounded-2xl border p-4 ${
        obtained
          ? "border-white/5 bg-black/10 opacity-55"
          : `${theme.border} ${theme.background}`
      }`}
    >

      <div className="flex items-start justify-between gap-3">

        <div>

          <p
            className={`text-[9px] font-semibold uppercase tracking-[0.14em] ${theme.accent}`}
          >
            {quickwarp.region}
          </p>

          <h3 className="mt-1 text-lg font-bold">
            {quickwarp.name}
          </h3>

        </div>

        <button
          type="button"

          onClick={
            onToggle
          }

          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-sm font-bold ${
            obtained
              ? `${theme.checkbox} border-transparent`
              : "border-white/20 bg-black/10 text-transparent"
          }`}
        >
          ✓
        </button>

      </div>

      <div className="mt-4 space-y-2">

        {quickwarp.requirements.map(
          (
            requirement
          ) => (

            <RequirementRow
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

    </article>

  );
}

/* =========================================================
   REQUIREMENT ROW
   ========================================================= */

function RequirementRow({
  requirement,
}: {
  requirement: MiscRequirement;
}) {
  return (

    <div className="flex min-w-0 items-center justify-between gap-3 rounded-lg bg-black/10 px-3 py-2 text-xs">

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

/* =========================================================
   MATERIAL BOX

   Same visual style used on Drills and Armor.
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
        {formatMaterialValue(
          material,
          amount
        )}
      </p>

    </div>

  );
}

/* =========================================================
   GROUP SECTION
   ========================================================= */

function GroupSection({
  eyebrow,
  title,
  open,
  onToggle,
  completed,
  total,
  onToggleAll,
  border,
  background,
  accent,
  badge,
  button,
  checkbox,
  children,
}: {
  eyebrow: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  completed: number;
  total: number;
  onToggleAll: () => void;
  border: string;
  background: string;
  accent: string;
  badge: string;
  button: string;
  checkbox: string;
  children: ReactNode;
}) {
  const allComplete =
    completed ===
    total;

  return (

    <section
      className={`mb-6 overflow-hidden rounded-2xl border ${border} ${background}`}
    >

      <div className="flex items-center justify-between gap-4 px-5 py-5 md:px-6">

        <button
          type="button"

          onClick={
            onToggle
          }

          className="min-w-0 flex-1 text-left"
        >

          <p
            className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${accent}`}
          >
            {eyebrow}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3">

            <h2 className="text-2xl font-bold">
              {title}
            </h2>

            <span
              className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${badge}`}
            >
              {completed} / {total}
            </span>

          </div>

        </button>

        <div className="flex shrink-0 items-center gap-3">

          <button
            type="button"

            onClick={
              onToggleAll
            }

            className={`flex h-8 w-8 items-center justify-center rounded-md border text-sm font-bold ${
              allComplete
                ? `${checkbox} border-transparent`
                : "border-white/20 bg-black/10 text-transparent"
            }`}
          >
            ✓
          </button>

          <button
            type="button"

            onClick={
              onToggle
            }

            className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold ${button}`}
          >
            {open
              ? "−"
              : "+"}
          </button>

        </div>

      </div>

      {open && (

        <div className="border-t border-white/10 p-4 md:p-5">
          {children}
        </div>

      )}

    </section>

  );
}

/* =========================================================
   COLLAPSIBLE SECTION
   ========================================================= */

function CollapsibleSection({
  eyebrow,
  title,
  open,
  onToggle,
  border,
  background,
  accent,
  button,
  children,
}: {
  eyebrow: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  border: string;
  background: string;
  accent: string;
  button: string;
  children: ReactNode;
}) {
  return (

    <section
      className={`mb-6 overflow-hidden rounded-2xl border ${border} ${background}`}
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
            className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${accent}`}
          >
            {eyebrow}
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            {title}
          </h2>

        </div>

        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl font-bold ${button}`}
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

      <p className="mt-2 text-xl font-bold">
        {value}
      </p>

      <p className="mt-1 text-xs text-white/30">
        {description}
      </p>

    </div>

  );
}

/* =========================================================
   QUICKWARP THEMES
   ========================================================= */

function getQuickwarpTheme(
  region:
    | "moon"
    | "mars"
    | "sun"
) {
  if (
    region ===
    "moon"
  ) {
    return {
      border:
        "border-[#405a78]",

      background:
        "bg-[#2b3744]",

      accent:
        "text-[#9bbcff]",

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
        "bg-[#3a2a28]",

      accent:
        "text-[#efaa91]",

      checkbox:
        "bg-[#b66f59] text-white",
    };
  }

  return {
    border:
      "border-[#8b783a]",

    background:
      "bg-[#3a3423]",

    accent:
      "text-[#e4cc7e]",

    checkbox:
      "bg-[#a89048] text-white",
  };
}