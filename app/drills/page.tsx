"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import { drills } from "../../data/drills";

import {
  getExpandedRequirement,
  getMaterialLabel as getSharedMaterialLabel,
} from "../../lib/materials";
import { formatHours, formatNumber } from "../../lib/format";
import { CollapsibleSection as MainSection } from "../../components/ui/CollapsibleSection";
import { OverviewStat } from "../../components/ui/StatCards";
import { MaterialTotals } from "../../components/ui/MaterialTotals";
import { getMaterialSummary } from "../../lib/materialTotals";

/* =========================================================
   TYPES
   ========================================================= */

type Region = "moon" | "mars" | "sun";

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
   TYPED DRILL DATA
   ========================================================= */

const typedDrills = drills as Drill[];

/* =========================================================
   STORAGE
   ========================================================= */

const STORAGE_KEY = "t5-mission-control-drills";

/* =========================================================
   DEFAULTS
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

  openSections: DEFAULT_OPEN_SECTIONS,
};

/* =========================================================
   REGION ORDER
   ========================================================= */

const REGION_ORDER: Region[] = ["moon", "mars", "sun"];

/* =========================================================
   HELPERS
   ========================================================= */

function getMaterialLabel(material: string) {
  return getSharedMaterialLabel(material, { coinsQd: "Qd Coins" });
}

function getRegionLabel(region: Region) {
  if (region === "moon") {
    return "Moon";
  }

  if (region === "mars") {
    return "Mars";
  }

  return "Sun";
}

function getDrillIndex(drillId: string) {
  return typedDrills.findIndex((drill) => drill.id === drillId);
}

function getProgressPercentage(completedCount: number) {
  if (typedDrills.length === 0) {
    return 0;
  }

  return (completedCount / typedDrills.length) * 100;
}

/* =========================================================
   PAGE
   ========================================================= */

export default function DrillsPage() {
  const [state, setState] = useState<SavedState>(DEFAULT_STATE);

  const [loaded, setLoaded] = useState(false);

  /* =======================================================
     LOAD
     ======================================================= */

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved) as Partial<SavedState>;

        setState({
          ...DEFAULT_STATE,

          ...parsed,

          openSections: {
            ...DEFAULT_OPEN_SECTIONS,

            ...(parsed.openSections ?? {}),
          },
        });
      }
    } catch (error) {
      console.error("Could not load drill progression:", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  /* =======================================================
     SAVE
     ======================================================= */

  useEffect(() => {
    if (!loaded) {
      return;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,

        JSON.stringify(state),
      );
    } catch (error) {
      console.error("Could not save drill progression:", error);
    }
  }, [state, loaded]);

  /* =======================================================
     OBTAINED
     ======================================================= */

  const obtainedSet = useMemo(() => new Set(state.obtained), [state.obtained]);

  /* =======================================================
     CURRENT DRILL
     ======================================================= */

  const highestObtainedIndex = useMemo(() => {
    let highest = -1;

    typedDrills.forEach((drill, index) => {
      if (obtainedSet.has(drill.id)) {
        highest = Math.max(highest, index);
      }
    });

    return highest;
  }, [obtainedSet]);

  const currentDrill =
    highestObtainedIndex >= 0 ? typedDrills[highestObtainedIndex] : null;

  const nextDrill =
    highestObtainedIndex + 1 < typedDrills.length
      ? typedDrills[highestObtainedIndex + 1]
      : null;

  const completedCount = highestObtainedIndex + 1;

  const progressPercentage = getProgressPercentage(completedCount);

  /* =======================================================
     REGION GROUPS
     ======================================================= */

  const groupedDrills = useMemo(() => {
    return {
      moon: typedDrills.filter((drill) => drill.region === "moon"),

      mars: typedDrills.filter((drill) => drill.region === "mars"),

      sun: typedDrills.filter((drill) => drill.region === "sun"),
    };
  }, []);

  /* =======================================================
     OVERALL REMAINING MATERIAL TOTALS
     ======================================================= */

  const remainingDrills = useMemo(() => {
    return typedDrills.slice(highestObtainedIndex + 1);
  }, [highestObtainedIndex]);

  const remainingMaterialTotals = useMemo(
    () =>
      getMaterialSummary(
        remainingDrills.flatMap((drill) => drill.requirements),
      ),
    [remainingDrills],
  );

  /* =======================================================
     TOGGLE DRILL
     ======================================================= */

  function toggleDrill(drillId: string) {
    const index = getDrillIndex(drillId);

    if (index < 0) {
      return;
    }

    const alreadyObtained = obtainedSet.has(drillId);

    if (alreadyObtained) {
      const remaining = typedDrills.slice(0, index).map((drill) => drill.id);

      setState((current) => ({
        ...current,

        obtained: remaining,
      }));

      return;
    }

    const completed = typedDrills.slice(0, index + 1).map((drill) => drill.id);

    setState((current) => ({
      ...current,

      obtained: completed,
    }));
  }

  /* =======================================================
     TOGGLE SECTION
     ======================================================= */

  function toggleSection(section: keyof OpenSections) {
    setState((current) => ({
      ...current,

      openSections: {
        ...current.openSections,

        [section]: !current.openSections[section],
      },
    }));
  }

  /* =======================================================
     RESET
     ======================================================= */

  function resetProgress() {
    setState((current) => ({
      ...current,

      obtained: [],
    }));
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

          <h1 className="mt-2 text-3xl font-bold md:text-4xl">Drills</h1>

          <p className="mt-2 max-w-3xl text-sm text-[#9aa4af] md:text-base">
            Track your Moon, Mars and Sun drill progression and calculate the
            materials required for future upgrades.
          </p>
        </div>

        {/* =================================================
            OVERVIEW
            ================================================= */}

        <MainSection
          eyebrow="Progress"
          title="Drill Progression"

          open={state.openSections.overview}

          onToggle={() => toggleSection("overview")}

          borderClass="border-[#536272]"
          backgroundClass="bg-[#1e252d]"
          accentClass="text-[#a8bad0]"
          buttonClass="bg-[#293440] text-[#b9c9dc]"
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <OverviewStat
              label="Current Drill"

              value={currentDrill?.name ?? "Icehowl Drill"}

              description={
                currentDrill
                  ? "Highest drill obtained"
                  : "Starting prerequisite"
              }
            />

            <OverviewStat
              label="Next Drill"

              value={nextDrill?.name ?? "Maxed"}

              description={
                nextDrill
                  ? `${getRegionLabel(nextDrill.region)} progression`
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

              value={`${formatNumber(Math.round(progressPercentage))}%`}

              description="Overall drill progression"
            />
          </div>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-4 text-xs text-white/40">
              <span>Icehowl Drill</span>

              <span>Fusion Drill</span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-black/20">
              <div
                className="h-full rounded-full bg-[#7c96b2] transition-all duration-300"

                style={{
                  width: `${progressPercentage}%`,
                }}
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"

              onClick={resetProgress}

              className="rounded-lg border border-white/10 bg-black/10 px-4 py-2 text-xs font-semibold text-white/55 transition hover:border-white/20 hover:text-white"
            >
              Reset Progress
            </button>
          </div>
        </MainSection>

        {/* =================================================
            REGIONS
            ================================================= */}

        {REGION_ORDER.map((region) => (
          <RegionSection
            key={region}

            region={region}

            open={state.openSections[region]}

            onToggle={() => toggleSection(region)}
          >
            <div
              className={`grid gap-4 ${
                region === "moon"
                  ? "lg:grid-cols-2 xl:grid-cols-4"
                  : "lg:grid-cols-2 xl:grid-cols-5"
              }`}
            >
              {groupedDrills[region].map((drill) => {
                const obtained = obtainedSet.has(drill.id);

                const drillIndex = getDrillIndex(drill.id);

                const isNext = drillIndex === highestObtainedIndex + 1;

                return (
                  <DrillCard
                    key={drill.id}

                    drill={drill}

                    obtained={obtained}

                    isNext={isNext}

                    onToggle={() => toggleDrill(drill.id)}
                  />
                );
              })}
            </div>
          </RegionSection>
        ))}

        {/* =================================================
            MATERIAL TOTALS
            ================================================= */}

        <MainSection
          eyebrow="Materials"
          title="Material Totals"

          open={state.openSections.totals}

          onToggle={() => toggleSection("totals")}

          borderClass="border-[#56734f]"
          backgroundClass="bg-[#202a20]"
          accentClass="text-[#a9cf9f]"
          buttonClass="bg-[#30432d] text-[#b9dfaf]"
        >
          <MaterialTotals
            summary={remainingMaterialTotals}
            description="Cumulative requirements from your next drill through Fusion Drill."
            emptyMessage="All drills completed. You have no remaining drill materials."
          />
        </MainSection>

        {/* =================================================
            FOOTNOTE
            ================================================= */}

        <div className="mt-6 rounded-xl border border-white/10 bg-[#1d242d] p-4 text-xs leading-5 text-white/40">
          Drill progression is linear. Marking a later drill as obtained
          automatically marks all previous drills complete. Removing a drill
          also removes every drill after it. Icehowl Drill is treated as the
          starting prerequisite and is not included in the tracked drill list.{" "}
          Plasma compacted materials use a 1:1 conversion from their matching
          normal compacted item.
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   REQUIREMENT DISPLAY
   ========================================================= */

function RequirementDisplay({ requirement }: { requirement: Requirement }) {
  const [open, setOpen] = useState(false);

  const expanded = getExpandedRequirement(requirement);

  if (!expanded) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-lg bg-black/10 px-3 py-2 text-sm">
        <span className="min-w-0 break-words text-white/60">
          {getMaterialLabel(requirement.material)}
        </span>

        <span className="shrink-0 font-bold">
          {formatNumber(requirement.amount)}
        </span>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#a88e4d]/25 bg-black/10">
      <button
        type="button"

        onClick={() => setOpen((current) => !current)}

        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition hover:bg-white/[0.025]"
      >
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-[#e0ca84]">
            {getMaterialLabel(requirement.material)}
          </p>

          {expanded.isPlasma && (
            <p className="mt-1 text-[10px] text-white/35">
              1:1 plasma conversion
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm font-bold">
            {formatNumber(requirement.amount)}
          </span>

          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#413821] text-sm font-bold text-[#e4cc7e]">
            {open ? "−" : "+"}
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
                  ×{formatNumber(expanded.amount)}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            {expanded.ingredients.map((ingredient) => (
              <div
                key={ingredient.material}

                className="flex items-center justify-between gap-3 pl-1 text-xs"
              >
                <span className="min-w-0 break-words text-white/45">
                  ↳ {getMaterialLabel(ingredient.material)}
                </span>

                <span className="shrink-0 font-semibold text-white/70">
                  {formatNumber(ingredient.amount)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/5 pt-3">
            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35">
              Compaction Time
            </span>

            <span className="text-xs font-bold text-[#e4cc7e]">
              {formatHours(expanded.timeHours)}
            </span>
          </div>
        </div>
      )}
    </div>
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
  const theme = getRegionTheme(region);

  return (
    <section
      className={`mb-6 overflow-hidden rounded-2xl border ${theme.border} ${theme.background}`}
    >
      <button
        type="button"

        onClick={onToggle}

        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left md:px-6"
      >
        <div>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${theme.badge}`}
          >
            {getRegionLabel(region)}
          </span>

          <h2 className="mt-3 text-2xl font-bold">
            {getRegionLabel(region)} Drills
          </h2>
        </div>

        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl font-bold ${theme.button}`}
        >
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div className="border-t border-white/10 p-4 md:p-5">{children}</div>
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
  const theme = getRegionTheme(drill.region);

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
            <h3 className="break-words text-lg font-bold">{drill.name}</h3>

            {isNext && !obtained && (
              <span
                className={`rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${theme.badge}`}
              >
                Next
              </span>
            )}
          </div>

          <p className="mt-1 text-xs text-white/35">
            Requires {drill.prerequisite}
          </p>
        </div>

        <button
          type="button"

          aria-label={
            obtained
              ? `Mark ${drill.name} as not obtained`
              : `Mark ${drill.name} as obtained`
          }

          onClick={onToggle}

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
        {drill.requirements.map((requirement) => (
          <RequirementDisplay
            key={requirement.material}

            requirement={requirement}
          />
        ))}
      </div>

      <div className="mt-auto pt-4">
        <RegionBadge region={drill.region} />
      </div>
    </article>
  );
}

/* =========================================================
   REGION BADGE
   ========================================================= */

function RegionBadge({ region }: { region: Region }) {
  const theme = getRegionTheme(region);

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] ${theme.badge}`}
    >
      {getRegionLabel(region)}
    </span>
  );
}

/* =========================================================
   REGION THEMES
   ========================================================= */

function getRegionTheme(region: Region) {
  if (region === "moon") {
    return {
      border: "border-[#405a78]",

      background: "bg-[#202a35]",

      cardBorder: "border-[#557494]",

      cardBackground: "bg-[#2b3744]",

      badge: "bg-[#2d4054] text-[#9bbcff]",

      button: "bg-[#2d4054] text-[#9bbcff]",

      checkbox: "bg-[#6688ac] text-white",
    };
  }

  if (region === "mars") {
    return {
      border: "border-[#9a5a49]",

      background: "bg-[#2c211f]",

      cardBorder: "border-[#a86754]",

      cardBackground: "bg-[#3a2a28]",

      badge: "bg-[#4b2d28] text-[#efaa91]",

      button: "bg-[#4b2d28] text-[#efaa91]",

      checkbox: "bg-[#b66f59] text-white",
    };
  }

  return {
    border: "border-[#8b783a]",

    background: "bg-[#2b281d]",

    cardBorder: "border-[#9a8645]",

    cardBackground: "bg-[#3a3423]",

    badge: "bg-[#463e25] text-[#e4cc7e]",

    button: "bg-[#463e25] text-[#e4cc7e]",

    checkbox: "bg-[#a89048] text-white",
  };
}
