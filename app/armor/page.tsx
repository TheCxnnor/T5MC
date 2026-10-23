"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  armor,
  type ArmorPieceType,
  type ArmorRequirement,
  type ArmorTier,
} from "../../data/armor";

import {
  getExpandedRequirement,
  getMaterialLabel,
} from "../../lib/materials";
import { formatHours, formatMaterialValue, formatNumber } from "../../lib/format";
import { CollapsibleSection as MainSection } from "../../components/ui/CollapsibleSection";
import { OverviewStat } from "../../components/ui/StatCards";
import { MaterialTotals } from "../../components/ui/MaterialTotals";
import { getMaterialSummary } from "../../lib/materialTotals";

/* =========================================================
   TYPES
   ========================================================= */

type ArmorRegion =
  | "moonMars"
  | "sun";

type OpenSections = {
  overview: boolean;
  moonMars: boolean;
  sun: boolean;
  totals: boolean;
};

type SavedState = {
  completedPieces: string[];
  openSections: OpenSections;
};

/* =========================================================
   STORAGE
   ========================================================= */

const STORAGE_KEY =
  "t5-mission-control-armor";

/* =========================================================
   DEFAULT STATE
   ========================================================= */

const DEFAULT_OPEN_SECTIONS: OpenSections = {
  overview: true,
  moonMars: true,
  sun: true,
  totals: false,
};

const DEFAULT_STATE: SavedState = {
  completedPieces: [],
  openSections:
    DEFAULT_OPEN_SECTIONS,
};

/* =========================================================
   PIECE LABELS
   ========================================================= */

const PIECE_LABELS: Record<
  ArmorPieceType,
  string
> = {
  spaceplate:
    "Spaceplate",

  spacepants:
    "Spacepants",

  spaceboots:
    "Spaceboots",
};

/* =========================================================
   HELPERS
   ========================================================= */

function getPieceKey(
  tierId: string,
  pieceType: ArmorPieceType
) {
  return `${tierId}:${pieceType}`;
}

function getTierIndex(
  tierId: string
) {
  return armor.findIndex(
    (
      tier
    ) =>
      tier.id ===
      tierId
  );
}

/* =========================================================
   PAGE
   ========================================================= */

export default function ArmorPage() {
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
        "Could not load armor progression:",
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
        "Could not save armor progression:",
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
          state.completedPieces
        ),
      [
        state.completedPieces,
      ]
    );

  /* =======================================================
     GROUP DATA
     ======================================================= */

  const groupedArmor =
    useMemo(() => {
      return {
        moonMars:
          armor.filter(
            (
              tier
            ) =>
              tier.region ===
              "moonMars"
          ),

        sun:
          armor.filter(
            (
              tier
            ) =>
              tier.region ===
              "sun"
          ),
      };
    }, []);

  /* =======================================================
     TOTALS
     ======================================================= */

  const totalPieces =
    useMemo(() => {
      return armor.reduce(
        (
          total,
          tier
        ) =>
          total +
          tier.pieces.length,
        0
      );
    }, []);

  const completedPieces =
    completedSet.size;

  const completedTiers =
    useMemo(() => {
      return armor.filter(
        (
          tier
        ) =>
          tier.pieces.every(
            (
              piece
            ) =>
              completedSet.has(
                getPieceKey(
                  tier.id,
                  piece.type
                )
              )
          )
      ).length;
    }, [
      completedSet,
    ]);

  const progressPercentage =
    totalPieces >
    0
      ? (
          completedPieces /
          totalPieces
        ) *
        100
      : 0;

  /* =======================================================
     CURRENT TIER
     ======================================================= */

  const currentTier =
    useMemo(() => {
      return (
        armor.find(
          (
            tier
          ) =>
            !tier.pieces.every(
              (
                piece
              ) =>
                completedSet.has(
                  getPieceKey(
                    tier.id,
                    piece.type
                  )
                )
            )
        ) ??
        null
      );
    }, [
      completedSet,
    ]);

  /* =======================================================
     REMAINING MATERIAL TOTALS

     Only counts armor pieces that are not completed.
     ======================================================= */

  const remainingMaterialTotals = useMemo(
    () => getMaterialSummary(armor.flatMap(tier => tier.pieces
      .filter(piece => !completedSet.has(getPieceKey(tier.id, piece.type)))
      .flatMap(piece => piece.requirements))),
    [completedSet]
  );

  /* =======================================================
     TOGGLE PIECE

     Checking a later piece automatically completes that
     piece through all previous tiers.

     Unchecking clears that piece from the selected tier
     and all later tiers.
     ======================================================= */

  function togglePiece(
    tierId: string,
    pieceType: ArmorPieceType
  ) {
    const tierIndex =
      getTierIndex(
        tierId
      );

    if (
      tierIndex <
      0
    ) {
      return;
    }

    const selectedKey =
      getPieceKey(
        tierId,
        pieceType
      );

    const alreadyCompleted =
      completedSet.has(
        selectedKey
      );

    setState(
      (
        current
      ) => {
        const next =
          new Set(
            current.completedPieces
          );

        /* =================================================
           UNCHECK
           ================================================= */

        if (
          alreadyCompleted
        ) {
          armor.forEach(
            (
              tier,
              index
            ) => {
              if (
                index >=
                tierIndex
              ) {
                next.delete(
                  getPieceKey(
                    tier.id,
                    pieceType
                  )
                );
              }
            }
          );

          return {
            ...current,

            completedPieces:
              Array.from(
                next
              ),
          };
        }

        /* =================================================
           CHECK
           ================================================= */

        armor.forEach(
          (
            tier,
            index
          ) => {
            if (
              index <=
              tierIndex
            ) {
              next.add(
                getPieceKey(
                  tier.id,
                  pieceType
                )
              );
            }
          }
        );

        return {
          ...current,

          completedPieces:
            Array.from(
              next
            ),
        };
      }
    );
  }

  /* =======================================================
     TOGGLE WHOLE TIER
     ======================================================= */

  function toggleTier(
    tier: ArmorTier
  ) {
    const tierIndex =
      getTierIndex(
        tier.id
      );

    if (
      tierIndex <
      0
    ) {
      return;
    }

    const tierFullyCompleted =
      tier.pieces.every(
        (
          piece
        ) =>
          completedSet.has(
            getPieceKey(
              tier.id,
              piece.type
            )
          )
      );

    setState(
      (
        current
      ) => {
        const next =
          new Set(
            current.completedPieces
          );

        /* =================================================
           UNCHECK WHOLE TIER
           ================================================= */

        if (
          tierFullyCompleted
        ) {
          armor.forEach(
            (
              armorTier,
              index
            ) => {
              if (
                index >=
                tierIndex
              ) {
                armorTier.pieces.forEach(
                  (
                    piece
                  ) => {
                    next.delete(
                      getPieceKey(
                        armorTier.id,
                        piece.type
                      )
                    );
                  }
                );
              }
            }
          );

          return {
            ...current,

            completedPieces:
              Array.from(
                next
              ),
          };
        }

        /* =================================================
           CHECK WHOLE TIER
           ================================================= */

        armor.forEach(
          (
            armorTier,
            index
          ) => {
            if (
              index <=
              tierIndex
            ) {
              armorTier.pieces.forEach(
                (
                  piece
                ) => {
                  next.add(
                    getPieceKey(
                      armorTier.id,
                      piece.type
                    )
                  );
                }
              );
            }
          }
        );

        return {
          ...current,

          completedPieces:
            Array.from(
              next
            ),
        };
      }
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

        completedPieces: [],
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
            Armor
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-[#9aa4af] md:text-base">
            Track Spaceplate, Spacepants and Spaceboots upgrades across Moon, Mars and Sun armor tiers.
          </p>

        </div>

        {/* =================================================
            OVERVIEW
            ================================================= */}

        <MainSection
          eyebrow="Progress"
          title="Armor Progression"

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
              label="Current Tier"

              value={
                currentTier
                  ?.name ??
                "Maxed"
              }

              description={
                currentTier
                  ? "First tier with pieces remaining"
                  : "All armor pieces obtained"
              }
            />

            <OverviewStat
              label="Completed Pieces"

              value={`${completedPieces} / ${totalPieces}`}

              description="Individual armor pieces obtained"
            />

            <OverviewStat
              label="Completed Tiers"

              value={`${completedTiers} / ${armor.length}`}

              description="Tiers with all 3 pieces obtained"
            />

            <OverviewStat
              label="Progress"

              value={`${Math.round(
                progressPercentage
              )}%`}

              description="Overall armor progression"
            />

          </div>

          {/* =================================================
              PROGRESS BAR
              ================================================= */}

          <div className="mt-5">

            <div className="mb-2 flex items-center justify-between gap-4 text-xs text-white/40">

              <span>
                Stardust
              </span>

              <span>
                Omniversal
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
              CURRENT TIER
              ================================================= */}

          {currentTier ? (

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/10 p-5">

              <div className="flex flex-wrap items-start justify-between gap-4">

                <div>

                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                    Current Tier
                  </p>

                  <h3 className="mt-2 text-2xl font-bold">
                    {currentTier.name}
                  </h3>

                </div>

                <ArmorRegionBadge
                  region={
                    currentTier.region
                  }
                />

              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">

                {currentTier.pieces.map(
                  (
                    piece
                  ) => {

                    const pieceKey =
                      getPieceKey(
                        currentTier.id,
                        piece.type
                      );

                    const completed =
                      completedSet.has(
                        pieceKey
                      );

                    return (

                      <div
                        key={
                          piece.type
                        }

                        className={`rounded-xl border p-4 ${
                          completed
                            ? "border-white/5 bg-black/10 opacity-60"
                            : "border-white/10 bg-black/10"
                        }`}
                      >

                        <div className="flex items-center justify-between gap-3">

                          <p className="font-semibold">
                            {
                              PIECE_LABELS[
                                piece.type
                              ]
                            }
                          </p>

                          <button
                            type="button"

                            onClick={() =>
                              togglePiece(
                                currentTier.id,
                                piece.type
                              )
                            }

                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-sm font-bold transition ${
                              completed
                                ? "border-transparent bg-[#6688ac] text-white"
                                : "border-white/20 bg-black/10 text-transparent hover:border-white/40"
                            }`}
                          >
                            ✓
                          </button>

                        </div>

                        <div className="mt-3 space-y-2">

                          {piece.requirements.map(
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

                    );
                  }
                )}

              </div>

            </div>

          ) : (

            <div className="mt-6 rounded-2xl border border-[#d8c36a]/30 bg-[#342e1d] p-5">

              <p className="font-bold text-[#ead98c]">
                All armor completed
              </p>

              <p className="mt-1 text-sm text-white/45">
                Every Spaceplate, Spacepants and Spaceboots tier has been completed.
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
            MOON / MARS
            ================================================= */}

        <ArmorSection
          eyebrow="Moon / Mars"
          title="Moon / Mars Armor"
          region="moonMars"

          open={
            state
              .openSections
              .moonMars
          }

          onToggle={() =>
            toggleSection(
              "moonMars"
            )
          }
        >

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

            {groupedArmor.moonMars.map(
              (
                tier
              ) => (

                <ArmorTierCard
                  key={
                    tier.id
                  }

                  tier={
                    tier
                  }

                  completedSet={
                    completedSet
                  }

                  current={
                    currentTier?.id ===
                    tier.id
                  }

                  onTogglePiece={
                    togglePiece
                  }

                  onToggleTier={() =>
                    toggleTier(
                      tier
                    )
                  }
                />

              )
            )}

          </div>

        </ArmorSection>

        {/* =================================================
            SUN
            ================================================= */}

        <ArmorSection
          eyebrow="Sun"
          title="Sun Armor"
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

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            {groupedArmor.sun.map(
              (
                tier
              ) => (

                <ArmorTierCard
                  key={
                    tier.id
                  }

                  tier={
                    tier
                  }

                  completedSet={
                    completedSet
                  }

                  current={
                    currentTier?.id ===
                    tier.id
                  }

                  onTogglePiece={
                    togglePiece
                  }

                  onToggleTier={() =>
                    toggleTier(
                      tier
                    )
                  }
                />

              )
            )}

          </div>

        </ArmorSection>

        {/* =================================================
            MATERIAL TOTALS

            Styled the same way as Drills.
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
            description="Cumulative requirements for every armor piece you have not completed."
            emptyMessage="All armor completed. You have no remaining armor materials."
          />

        </MainSection>

      </div>

    </main>
  );
}

/* =========================================================
   ARMOR TIER CARD
   ========================================================= */

function ArmorTierCard({
  tier,
  completedSet,
  current,
  onTogglePiece,
  onToggleTier,
}: {
  tier: ArmorTier;
  completedSet: Set<string>;
  current: boolean;

  onTogglePiece:
    (
      tierId: string,
      pieceType: ArmorPieceType
    ) => void;

  onToggleTier:
    () => void;
}) {
  const theme =
    getArmorTheme(
      tier.region
    );

  const completedCount =
    tier.pieces.filter(
      (
        piece
      ) =>
        completedSet.has(
          getPieceKey(
            tier.id,
            piece.type
          )
        )
    ).length;

  const fullyCompleted =
    completedCount ===
    tier.pieces.length;

  const tierTotals =
    useMemo(() => {
      const totals =
        new Map<
          string,
          number
        >();

      tier.pieces.forEach(
        (
          piece
        ) => {
          piece.requirements.forEach(
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
        ([
          material,
          amount,
        ]) => ({
          material,
          amount,
        })
      );
    }, [
      tier,
    ]);

  return (

    <article
      className={`flex min-w-0 flex-col rounded-2xl border p-4 transition ${
        fullyCompleted
          ? "border-white/5 bg-black/10 opacity-55"
          : current
            ? `${theme.cardBorder} ${theme.cardBackground}`
            : "border-white/10 bg-black/10"
      }`}
    >

      {/* ===================================================
          HEADER
          =================================================== */}

      <div className="flex items-start justify-between gap-3">

        <div className="min-w-0">

          <div className="flex flex-wrap items-center gap-2">

            <h3 className="text-lg font-bold">
              {tier.name}
            </h3>

            {current &&
              !fullyCompleted && (

              <span
                className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${theme.badge}`}
              >
                Current
              </span>

            )}

          </div>

          <p className="mt-1 text-xs text-white/35">
            {completedCount} / 3 pieces
          </p>

        </div>

        <button
          type="button"

          onClick={
            onToggleTier
          }

          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-sm font-bold transition ${
            fullyCompleted
              ? `${theme.checkbox} border-transparent`
              : "border-white/20 bg-black/10 text-transparent hover:border-white/40"
          }`}
        >
          ✓
        </button>

      </div>

      {/* ===================================================
          PIECES
          =================================================== */}

      <div className="mt-4 space-y-3">

        {tier.pieces.map(
          (
            piece
          ) => {

            const pieceKey =
              getPieceKey(
                tier.id,
                piece.type
              );

            const completed =
              completedSet.has(
                pieceKey
              );

            return (

              <div
                key={
                  piece.type
                }

                className={`rounded-xl border p-3 ${
                  completed
                    ? "border-white/5 bg-black/10 opacity-60"
                    : "border-white/10 bg-black/10"
                }`}
              >

                <div className="flex items-center justify-between gap-3">

                  <p className="text-sm font-bold">
                    {
                      PIECE_LABELS[
                        piece.type
                      ]
                    }
                  </p>

                  <button
                    type="button"

                    onClick={() =>
                      onTogglePiece(
                        tier.id,
                        piece.type
                      )
                    }

                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold transition ${
                      completed
                        ? `${theme.checkbox} border-transparent`
                        : "border-white/20 bg-black/10 text-transparent hover:border-white/40"
                    }`}
                  >
                    ✓
                  </button>

                </div>

                <div className="mt-3 space-y-2">

                  {piece.requirements.map(
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

            );
          }
        )}

      </div>

      {/* ===================================================
          TOTAL TIER COST
          =================================================== */}

      <div className="mt-4 border-t border-white/10 pt-4">

        <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/35">
          Total Tier Cost
        </p>

        <div className="mt-2 space-y-1.5">

          {tierTotals.map(
            (
              total
            ) => (

              <div
                key={
                  total.material
                }

                className="flex items-center justify-between gap-3 text-xs"
              >

                <span className="text-white/45">
                  {getMaterialLabel(
                    total.material
                  )}
                </span>

                <span className="font-semibold text-white/75">
                  {formatMaterialValue(
                    total.material,
                    total.amount
                  )}
                </span>

              </div>

            )
          )}

        </div>

      </div>

      <div className="mt-auto pt-4">

        <ArmorRegionBadge
          region={
            tier.region
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
  requirement: ArmorRequirement;
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
   ARMOR SECTION
   ========================================================= */

function ArmorSection({
  eyebrow,
  title,
  region,
  open,
  onToggle,
  children,
}: {
  eyebrow: string;
  title: string;
  region: ArmorRegion;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const theme = getArmorTheme(region);

  return (
    <MainSection
      eyebrow={eyebrow}
      title={title}
      open={open}
      onToggle={onToggle}
      borderClass={theme.border}
      backgroundClass={theme.background}
      accentClass={theme.accent}
      buttonClass={theme.button}
      contentClassName="border-t border-white/10 p-4 md:p-5"
    >
      {children}
    </MainSection>
  );
}


/* =========================================================
   REGION BADGE
   ========================================================= */

function ArmorRegionBadge({
  region,
}: {
  region: ArmorRegion;
}) {
  const theme =
    getArmorTheme(
      region
    );

  return (

    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${theme.badge}`}
    >
      {region ===
      "moonMars"
        ? "Moon / Mars"
        : "Sun"}
    </span>

  );
}

/* =========================================================
   THEMES
   ========================================================= */

function getArmorTheme(
  region: ArmorRegion
) {
  if (
    region ===
    "moonMars"
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