"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  mobs,
  type Mob,
} from "../../data/mobs";

import {
  bludgeons,
  pickaxes,
  type WeaponType,
} from "../../data/weapons";
import { CollapsibleSection } from "../../components/ui/CollapsibleSection";
import { NumberInput, SelectInput, ToggleCard } from "../../components/ui/CalculatorInputs";
import { StatBox, MiniStat, RecommendationStat } from "../../components/ui/StatCards";

/* =========================================================
   TYPES
   ========================================================= */

type Tier =
  | 3
  | 4
  | 5;

type Talisman =
  | "None"
  | "Builders Talisman T1"
  | "Builders Talisman T2"
  | "Builders Talisman T3"
  | "Ash Talisman";

type PetName =
  | "No Pet"
  | "Silver Serpent"
  | "Bone Dragon";

type OpenSections = {
  combat: boolean;
  bestMob: boolean;

  tier3: boolean;
  tier4: boolean;
  tier5: boolean;

  mobs: Record<
    string,
    boolean
  >;
};

type PvESavedState = {
  currentTier: Tier;

  weaponType:
    | "pickaxe"
    | "bludgeon";

  weaponId: string;

  attackSpeed: number;

  autumnEvent: boolean;

  talisman: Talisman;

  t3DamageUpgrade: number;

  t5DamageUpgrade: number;

  boneDragonOwned: boolean;

  boneDragonLevel: number;

  silverSerpentOwned: boolean;

  silverSerpentLevel: number;

  bestDrop: string;

  farmTimeHours: number;

  openSections: OpenSections;
};

type CombatResult = {
  effectiveHp: number;

  hitsToKill: number;

  timeToKill: number;

  normalKillsPerHour: number;

  effectiveKillsPerHour: number;

  ashPerKill: number;

  ashPerHour: number;

  starShardsPerHour: number;

  dragonRoarChance: number;

  serpentHpReduction: number;
};

type MobResult = {
  mob: Mob;

  tier: Tier;

  accessible: boolean;

  damagePerHit: number;

  noPet: CombatResult;

  silverOnly: CombatResult;

  boneOnly: CombatResult;

  active: CombatResult;
};

type BestMobCandidate = {
  mob: Mob;

  tier: Tier;

  pet: PetName;

  scenario: CombatResult;

  dropChanceOneIn: number;

  dropsPerHour: number;

  expectedDrops: number;

  hoursPerDrop: number;
};

/* =========================================================
   STORAGE
   ========================================================= */

const STORAGE_KEY =
  "t5-mission-control-pve";

/* =========================================================
   TALISMANS
   ========================================================= */

const TALISMANS: Talisman[] = [
  "None",
  "Builders Talisman T1",
  "Builders Talisman T2",
  "Builders Talisman T3",
  "Ash Talisman",
];

/* =========================================================
   DAMAGE OPTIONS
   ========================================================= */

const T3_DAMAGE_OPTIONS = [
  0,
  0.1,
  0.2,
  0.3,
  0.4,
  0.5,
  0.6,
  0.7,
];

const T5_DAMAGE_OPTIONS = [
  0,
  0.05,
  0.1,
  0.15,
  0.2,
  0.25,
  0.3,
  0.35,
];

/* =========================================================
   MOB TIERS
   ========================================================= */

const TIER_3_MOBS = [
  "fire-slinger",
  "fire-mage",
  "zhurak",
];

const TIER_4_MOBS = [
  "frozen-alex",
  "frozen-captain",
];

const TIER_5_MOBS = [
  "corruptonaut",
  "stardust-wizard",
  "space-pirate",
  "galactic-terror",
  "celestial-emperor",
];

/* =========================================================
   DEFAULT STATE
   ========================================================= */

const DEFAULT_OPEN_SECTIONS: OpenSections = {
  combat: true,

  bestMob: true,

  tier3: true,

  tier4: true,

  tier5: true,

  mobs: {},
};

const DEFAULT_STATE: PvESavedState = {
  currentTier: 5,

  weaponType:
    "pickaxe",

  weaponId:
    "volcanic-bite-pickaxe-2-star",

  attackSpeed: 5,

  autumnEvent: false,

  talisman: "None",

  t3DamageUpgrade: 0,

  t5DamageUpgrade: 0,

  boneDragonOwned: false,

  boneDragonLevel: 1,

  silverSerpentOwned: false,

  silverSerpentLevel: 1,

  bestDrop: "T4 Key",

  farmTimeHours: 1,

  openSections:
    DEFAULT_OPEN_SECTIONS,
};

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

function formatCompact(
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
    1_000_000_000
  ) {
    return `${formatNumber(
      value /
        1_000_000_000,
      2
    )}B`;
  }

  if (
    absolute >=
    1_000_000
  ) {
    return `${formatNumber(
      value /
        1_000_000,
      2
    )}M`;
  }

  if (
    absolute >=
    1_000
  ) {
    return `${formatNumber(
      value /
        1_000,
      2
    )}K`;
  }

  return formatNumber(
    value,
    2
  );
}

function formatDurationFromHours(
  hours: number
) {
  if (
    !Number.isFinite(
      hours
    ) ||
    hours <= 0
  ) {
    return "—";
  }

  const seconds =
    hours *
    3600;

  if (
    seconds <
    60
  ) {
    return `${formatNumber(
      seconds,
      1
    )} sec`;
  }

  const minutes =
    seconds /
    60;

  if (
    minutes <
    60
  ) {
    return `${formatNumber(
      minutes,
      1
    )} min`;
  }

  if (
    hours <
    24
  ) {
    return `${formatNumber(
      hours,
      2
    )} hr`;
  }

  const days =
    hours /
    24;

  if (
    days <
    365
  ) {
    return `${formatNumber(
      days,
      2
    )} days`;
  }

  return `${formatNumber(
    days /
      365,
    2
  )} yrs`;
}

function getMobTier(
  mobId: string
): Tier {
  if (
    TIER_3_MOBS.includes(
      mobId
    )
  ) {
    return 3;
  }

  if (
    TIER_4_MOBS.includes(
      mobId
    )
  ) {
    return 4;
  }

  return 5;
}

function getWeaponList(
  type: WeaponType
) {
  return type ===
    "pickaxe"
    ? pickaxes
    : bludgeons;
}

/* =========================================================
   TALISMAN BONUSES
   ========================================================= */

function getTalismanFlatBonus(
  talisman: Talisman
) {
  return talisman ===
    "Builders Talisman T1"
    ? 250
    : 0;
}

function getTalismanDamageBonus(
  talisman: Talisman
) {
  if (
    talisman ===
    "Builders Talisman T2"
  ) {
    return 0.15;
  }

  if (
    talisman ===
      "Builders Talisman T3" ||
    talisman ===
      "Ash Talisman"
  ) {
    return 0.35;
  }

  return 0;
}

function getAshMultiplier(
  talisman: Talisman
) {
  return talisman ===
    "Ash Talisman"
    ? 1.15
    : 1;
}

/* =========================================================
   DAMAGE
   ========================================================= */

function calculateDamagePerHit(
  weaponDamage: number,
  tier: Tier,
  settings: PvESavedState
) {
  const flatBonus =
    getTalismanFlatBonus(
      settings.talisman
    );

  const talismanBonus =
    getTalismanDamageBonus(
      settings.talisman
    );

  let damage =
    (
      weaponDamage +
      flatBonus
    ) *
    (
      1 +
      settings.t3DamageUpgrade +
      talismanBonus
    );

  if (
    tier ===
    5
  ) {
    damage *=
      1 +
      settings.t5DamageUpgrade;
  }

  if (
    settings.autumnEvent
  ) {
    damage *=
      1.5;
  }

  return Math.max(
    1,
    damage
  );
}

/* =========================================================
   COMBAT CALCULATION
   ========================================================= */

function calculateCombat(
  mob: Mob,
  damagePerHit: number,
  settings: PvESavedState,
  useBoneDragon: boolean,
  useSilverSerpent: boolean
): CombatResult {
  const attackSpeed =
    Math.max(
      0.01,
      settings.attackSpeed
    );

  const silverLevel =
    clamp(
      settings.silverSerpentLevel,
      1,
      100
    );

  const serpentHpReduction =
    useSilverSerpent
      ? silverLevel *
        0.0025
      : 0;

  const effectiveHp =
    Math.max(
      1,

      mob.hp *
        (
          1 -
          serpentHpReduction
        )
    );

  const hitsToKill =
    Math.max(
      1,

      Math.ceil(
        effectiveHp /
          damagePerHit
      )
    );

  const timeToKill =
    hitsToKill /
    attackSpeed;

  const normalKillsPerHour =
    3600 /
    timeToKill;

  const boneLevel =
    clamp(
      settings.boneDragonLevel,
      1,
      100
    );

  const dragonRoarChance =
    useBoneDragon
      ? boneLevel *
        0.0025
      : 0;

  const effectiveKillsPerHour =
    normalKillsPerHour *
    (
      1 +
      dragonRoarChance
    );

  const ashPerKill =
    mob.ash *
    getAshMultiplier(
      settings.talisman
    );

  const ashPerHour =
    effectiveKillsPerHour *
    ashPerKill;

  const starShardsPerHour =
    useBoneDragon
      ? normalKillsPerHour *
        4
      : 0;

  return {
    effectiveHp,

    hitsToKill,

    timeToKill,

    normalKillsPerHour,

    effectiveKillsPerHour,

    ashPerKill,

    ashPerHour,

    starShardsPerHour,

    dragonRoarChance,

    serpentHpReduction,
  };
}

/* =========================================================
   PAGE
   ========================================================= */

export default function PvEPage() {
  const [
    settings,
    setSettings,
  ] =
    useState<PvESavedState>(
      DEFAULT_STATE
    );

  const [
    storageLoaded,
    setStorageLoaded,
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
          ) as Partial<PvESavedState>;

        const boneDragonOwned =
          parsed.boneDragonOwned ??
          DEFAULT_STATE.boneDragonOwned;

        const silverSerpentOwned =
          boneDragonOwned
            ? false
            : (
                parsed.silverSerpentOwned ??
                DEFAULT_STATE.silverSerpentOwned
              );

        setSettings({
          ...DEFAULT_STATE,

          ...parsed,

          boneDragonOwned,

          silverSerpentOwned,

          openSections: {
            ...DEFAULT_OPEN_SECTIONS,

            ...(
              parsed.openSections ??
              {}
            ),

            mobs: {
              ...DEFAULT_OPEN_SECTIONS.mobs,

              ...(
                parsed
                  .openSections
                  ?.mobs ??
                {}
              ),
            },
          },
        });
      }
    } catch (
      error
    ) {
      console.error(
        "Could not load PvE settings:",
        error
      );
    } finally {
      setStorageLoaded(
        true
      );
    }
  }, []);

  /* =======================================================
     SAVE
     ======================================================= */

  useEffect(() => {
    if (
      !storageLoaded
    ) {
      return;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,

        JSON.stringify(
          settings
        )
      );
    } catch (
      error
    ) {
      console.error(
        "Could not save PvE settings:",
        error
      );
    }
  }, [
    settings,
    storageLoaded,
  ]);

  /* =======================================================
     WEAPONS
     ======================================================= */

  const availableWeapons =
    useMemo(
      () =>
        getWeaponList(
          settings.weaponType
        ),
      [
        settings.weaponType,
      ]
    );

  const selectedWeapon =
    useMemo(
      () =>
        availableWeapons.find(
          (
            weapon
          ) =>
            weapon.id ===
            settings.weaponId
        ) ??
        availableWeapons[0],
      [
        availableWeapons,
        settings.weaponId,
      ]
    );

  useEffect(() => {
    if (
      !selectedWeapon
    ) {
      return;
    }

    if (
      selectedWeapon.id !==
      settings.weaponId
    ) {
      setSettings(
        (
          current
        ) => ({
          ...current,

          weaponId:
            selectedWeapon.id,
        })
      );
    }
  }, [
    selectedWeapon,
    settings.weaponId,
  ]);

  /* =======================================================
     UNIQUE DROPS
     ======================================================= */

  const availableDrops =
    useMemo(() => {
      const unique =
        new Set<string>();

      mobs.forEach(
        (
          mob
        ) => {
          mob.drops.forEach(
            (
              drop
            ) => {
              unique.add(
                drop.item
              );
            }
          );
        }
      );

      return Array.from(
        unique
      ).sort(
        (
          first,
          second
        ) =>
          first.localeCompare(
            second
          )
      );
    }, []);

  useEffect(() => {
    if (
      availableDrops.length ===
      0
    ) {
      return;
    }

    if (
      !availableDrops.includes(
        settings.bestDrop
      )
    ) {
      setSettings(
        (
          current
        ) => ({
          ...current,

          bestDrop:
            availableDrops[0],
        })
      );
    }
  }, [
    availableDrops,
    settings.bestDrop,
  ]);

  /* =======================================================
     MOB RESULTS
     ======================================================= */

  const results =
    useMemo(() => {
      const weaponDamage =
        selectedWeapon
          ?.damage ??
        0;

      return mobs.map(
        (
          mob
        ): MobResult => {
          const tier =
            getMobTier(
              mob.id
            );

          const damagePerHit =
            calculateDamagePerHit(
              weaponDamage,
              tier,
              settings
            );

          const noPet =
            calculateCombat(
              mob,
              damagePerHit,
              settings,
              false,
              false
            );

          const silverOnly =
            calculateCombat(
              mob,
              damagePerHit,
              settings,
              false,
              true
            );

          const boneOnly =
            calculateCombat(
              mob,
              damagePerHit,
              settings,
              true,
              false
            );

          let active =
            noPet;

          if (
            settings.boneDragonOwned
          ) {
            active =
              boneOnly;
          } else if (
            settings.silverSerpentOwned
          ) {
            active =
              silverOnly;
          }

          return {
            mob,

            tier,

            accessible:
              tier <=
              settings.currentTier,

            damagePerHit,

            noPet,

            silverOnly,

            boneOnly,

            active,
          };
        }
      );
    }, [
      settings,
      selectedWeapon,
    ]);

  /* =======================================================
     BEST MOB CALCULATOR
     ======================================================= */

  const bestMobResults =
    useMemo(() => {
      const farmTime =
        Math.max(
          0,
          settings.farmTimeHours
        );

      const candidates:
        BestMobCandidate[] = [];

      for (
        const result of results
      ) {
        if (
          !result.accessible
        ) {
          continue;
        }

        const drop =
          result.mob.drops.find(
            (
              mobDrop
            ) =>
              mobDrop.item ===
              settings.bestDrop
          );

        if (
          !drop
        ) {
          continue;
        }

        const scenarios: Array<{
          pet: PetName;
          scenario: CombatResult;
        }> = [
          {
            pet:
              "No Pet",

            scenario:
              result.noPet,
          },

          {
            pet:
              "Silver Serpent",

            scenario:
              result.silverOnly,
          },

          {
            pet:
              "Bone Dragon",

            scenario:
              result.boneOnly,
          },
        ];

        const petCandidates =
          scenarios.map(
            (
              entry
            ): BestMobCandidate => {
              const dropsPerHour =
                entry
                  .scenario
                  .effectiveKillsPerHour /
                drop.chanceOneIn;

              const expectedDrops =
                dropsPerHour *
                farmTime;

              const hoursPerDrop =
                dropsPerHour >
                0
                  ? 1 /
                    dropsPerHour
                  : Number.POSITIVE_INFINITY;

              return {
                mob:
                  result.mob,

                tier:
                  result.tier,

                pet:
                  entry.pet,

                scenario:
                  entry.scenario,

                dropChanceOneIn:
                  drop.chanceOneIn,

                dropsPerHour,

                expectedDrops,

                hoursPerDrop,
              };
            }
          );

        petCandidates.sort(
          (
            first,
            second
          ) =>
            second.dropsPerHour -
            first.dropsPerHour
        );

        const bestPetForMob =
          petCandidates[0];

        if (
          bestPetForMob
        ) {
          candidates.push(
            bestPetForMob
          );
        }
      }

      candidates.sort(
        (
          first,
          second
        ) =>
          second.dropsPerHour -
          first.dropsPerHour
      );

      return {
        winner:
          candidates[0],

        ranked:
          candidates,
      };
    }, [
      results,
      settings.bestDrop,
      settings.farmTimeHours,
    ]);

  /* =======================================================
     UPDATE SETTING
     ======================================================= */

  function updateSetting<
    K extends keyof PvESavedState
  >(
    key: K,
    value:
      PvESavedState[K]
  ) {
    setSettings(
      (
        current
      ) => ({
        ...current,

        [key]:
          value,
      })
    );
  }

  /* =======================================================
     WEAPON TYPE
     ======================================================= */

  function changeWeaponType(
    weaponType:
      | "pickaxe"
      | "bludgeon"
  ) {
    const list =
      getWeaponList(
        weaponType
      );

    setSettings(
      (
        current
      ) => ({
        ...current,

        weaponType,

        weaponId:
          list[0]?.id ??
          current.weaponId,
      })
    );
  }

  /* =======================================================
     PET TOGGLES
     ======================================================= */

  function toggleBoneDragon() {
    setSettings(
      (
        current
      ) => {
        const enabling =
          !current.boneDragonOwned;

        return {
          ...current,

          boneDragonOwned:
            enabling,

          silverSerpentOwned:
            enabling
              ? false
              : current.silverSerpentOwned,
        };
      }
    );
  }

  function toggleSilverSerpent() {
    setSettings(
      (
        current
      ) => {
        const enabling =
          !current.silverSerpentOwned;

        return {
          ...current,

          silverSerpentOwned:
            enabling,

          boneDragonOwned:
            enabling
              ? false
              : current.boneDragonOwned,
        };
      }
    );
  }

  /* =======================================================
     SECTION TOGGLES
     ======================================================= */

  function toggleMainSection(
    section:
      | "combat"
      | "bestMob"
  ) {
    setSettings(
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

  function toggleTier(
    tier: Tier
  ) {
    const key =
      `tier${tier}` as
        | "tier3"
        | "tier4"
        | "tier5";

    setSettings(
      (
        current
      ) => ({
        ...current,

        openSections: {
          ...current.openSections,

          [key]:
            !current
              .openSections[
                key
              ],
        },
      })
    );
  }

  function toggleMob(
    mobId: string
  ) {
    setSettings(
      (
        current
      ) => ({
        ...current,

        openSections: {
          ...current.openSections,

          mobs: {
            ...current
              .openSections
              .mobs,

            [mobId]:
              !current
                .openSections
                .mobs[
                  mobId
                ],
          },
        },
      })
    );
  }

  /* =======================================================
     ACTIVE PET
     ======================================================= */

  let activePetLabel =
    "No Pet";

  if (
    settings.boneDragonOwned
  ) {
    activePetLabel =
      "Bone Dragon";
  } else if (
    settings.silverSerpentOwned
  ) {
    activePetLabel =
      "Silver Serpent";
  }

  return (
    <main className="min-h-screen bg-[#151b24] px-4 py-8 text-white md:px-6 lg:px-8">

      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
            ================================================= */}

        <div className="mb-8">

          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d69868]">
            Combat
          </p>

          <h1 className="mt-2 text-3xl font-bold md:text-4xl">
            PvE Calculator
          </h1>

          <p className="mt-2 max-w-3xl text-sm text-[#9aa4af] md:text-base">
            Compare mob kill speed, Ash income and expected drops across PvE tiers.
          </p>

        </div>

        {/* =================================================
            COMBAT VARIABLES
            ================================================= */}

        <CollapsibleSection
          eyebrow="Player Setup"
          title="Combat Variables"

          open={
            settings
              .openSections
              .combat
          }

          onToggle={() =>
            toggleMainSection(
              "combat"
            )
          }

          borderClass="border-[#6f5141]"
          backgroundClass="bg-[#211d1b]"
          accentClass="text-[#e6a97f]"
          buttonClass="bg-[#3b2922] text-[#e6a97f]"
        >

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

            <SelectInput theme="combat"
              label="Current Tier"

              value={`Tier ${settings.currentTier}`}

              options={[
                "Tier 3",
                "Tier 4",
                "Tier 5",
              ]}

              onChange={(
                value
              ) =>
                updateSetting(
                  "currentTier",

                  Number(
                    value.replace(
                      "Tier ",
                      ""
                    )
                  ) as Tier
                )
              }
            />

            <SelectInput theme="combat"
              label="Weapon Type"

              value={
                settings.weaponType ===
                "pickaxe"
                  ? "Pickaxe"
                  : "Bludgeon"
              }

              options={[
                "Pickaxe",
                "Bludgeon",
              ]}

              onChange={(
                value
              ) =>
                changeWeaponType(
                  value ===
                  "Pickaxe"
                    ? "pickaxe"
                    : "bludgeon"
                )
              }
            />

            <SelectInput theme="combat"
              label={
                settings.weaponType ===
                "pickaxe"
                  ? "Pickaxe"
                  : "Bludgeon"
              }

              value={
                selectedWeapon
                  ?.id ??
                ""
              }

              options={
                availableWeapons.map(
                  (
                    weapon
                  ) => ({
                    value:
                      weapon.id,

                    label:
                      weapon.name,
                  })
                )
              }

              onChange={(
                value
              ) =>
                updateSetting(
                  "weaponId",
                  value
                )
              }
            />

            <NumberInput theme="combat"
              label="Attack Speed"

              suffix="Hits/s"

              value={
                settings.attackSpeed
              }

              min={0.01}

              step={0.1}

              onChange={(
                value
              ) =>
                updateSetting(
                  "attackSpeed",

                  Math.max(
                    0.01,
                    value
                  )
                )
              }
            />

            <SelectInput theme="combat"
              label="Bedrock Talisman"

              value={
                settings.talisman
              }

              options={
                TALISMANS
              }

              onChange={(
                value
              ) =>
                updateSetting(
                  "talisman",

                  value as Talisman
                )
              }
            />

            <SelectInput theme="combat"
              label="T3 Damage Upgrader"

              value={String(
                settings.t3DamageUpgrade
              )}

              options={
                T3_DAMAGE_OPTIONS.map(
                  (
                    value
                  ) => ({
                    value:
                      String(
                        value
                      ),

                    label:
                      `${value * 100}%`,
                  })
                )
              }

              onChange={(
                value
              ) =>
                updateSetting(
                  "t3DamageUpgrade",

                  Number(
                    value
                  )
                )
              }
            />

            <SelectInput theme="combat"
              label="T5 Damage Upgrade"

              value={String(
                settings.t5DamageUpgrade
              )}

              options={
                T5_DAMAGE_OPTIONS.map(
                  (
                    value
                  ) => ({
                    value:
                      String(
                        value
                      ),

                    label:
                      `${value * 100}%`,
                  })
                )
              }

              onChange={(
                value
              ) =>
                updateSetting(
                  "t5DamageUpgrade",

                  Number(
                    value
                  )
                )
              }
            />

            <ToggleCard theme="combat"
              label="Autumn Event"

              description="×1.5 damage"

              enabled={
                settings.autumnEvent
              }

              onToggle={() =>
                updateSetting(
                  "autumnEvent",

                  !settings.autumnEvent
                )
              }
            />

          </div>

          {/* PET SETUP */}

          <div className="mt-6 border-t border-white/10 pt-6">

            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
                  Pet Setup
                </p>

                <p className="mt-1 text-sm text-white/35">
                  Only one pet can be active at a time.
                </p>

              </div>

              <span className="rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-xs font-semibold text-white/60">
                Active: {activePetLabel}
              </span>

            </div>

            <div className="grid gap-4 lg:grid-cols-2">

              <PetCard
                name="Bone Dragon"

                description="Dragon's Roar gives a 0.25% chance per level for one instant bonus kill. Bone Offerings gives 4 Star-Shards per normal PvE kill."

                enabled={
                  settings.boneDragonOwned
                }

                level={
                  settings.boneDragonLevel
                }

                effect={
                  settings.boneDragonOwned
                    ? `${formatNumber(
                        clamp(
                          settings.boneDragonLevel,
                          1,
                          100
                        ) *
                          0.25,
                        2
                      )}% Dragon's Roar chance`
                    : "Not active"
                }

                onToggle={
                  toggleBoneDragon
                }

                onLevelChange={(
                  level
                ) =>
                  updateSetting(
                    "boneDragonLevel",

                    clamp(
                      Math.round(
                        level
                      ),
                      1,
                      100
                    )
                  )
                }
              />

              <PetCard
                name="Silver Serpent"

                description="Tail Rattle removes 0.25% of the next PvE mob's HP per level. The reduction does not accumulate."

                enabled={
                  settings.silverSerpentOwned
                }

                level={
                  settings.silverSerpentLevel
                }

                effect={
                  settings.silverSerpentOwned
                    ? `${formatNumber(
                        clamp(
                          settings.silverSerpentLevel,
                          1,
                          100
                        ) *
                          0.25,
                        2
                      )}% next-mob HP reduction`
                    : "Not active"
                }

                onToggle={
                  toggleSilverSerpent
                }

                onLevelChange={(
                  level
                ) =>
                  updateSetting(
                    "silverSerpentLevel",

                    clamp(
                      Math.round(
                        level
                      ),
                      1,
                      100
                    )
                  )
                }
              />

            </div>

          </div>

          {/* QUICK STATS */}

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

            <StatBox wrapValue
              label="Weapon Damage"

              value={formatNumber(
                selectedWeapon
                  ?.damage ??
                  0
              )}
            />

            <StatBox wrapValue
              label="T3 / T4 Damage"

              value={formatNumber(
                calculateDamagePerHit(
                  selectedWeapon
                    ?.damage ??
                    0,

                  3,

                  settings
                )
              )}
            />

            <StatBox wrapValue
              label="T5 Damage"

              value={formatNumber(
                calculateDamagePerHit(
                  selectedWeapon
                    ?.damage ??
                    0,

                  5,

                  settings
                )
              )}
            />

            <StatBox wrapValue
              label="Attack Speed"

              value={`${formatNumber(
                settings.attackSpeed,
                2
              )} Hits/s`}
            />

          </div>

        </CollapsibleSection>

        {/* =================================================
            BEST MOB CALCULATOR
            ================================================= */}

        <CollapsibleSection
          eyebrow="Drop Optimiser"
          title="Best Mob Calculator"

          open={
            settings
              .openSections
              .bestMob
          }

          onToggle={() =>
            toggleMainSection(
              "bestMob"
            )
          }

          borderClass="border-[#4b8f83]"
          backgroundClass="bg-[#1d302f]"
          accentClass="text-[#81d4c7]"
          buttonClass="bg-[#27413e] text-[#81d4c7]"
        >

          <p className="mb-5 text-sm text-white/45">
            Find the fastest accessible mob and best pet for a selected drop.
          </p>

          <div className="grid gap-4 md:grid-cols-2">

            <SelectInput theme="combat"
              label="Drop"

              value={
                settings.bestDrop
              }

              options={
                availableDrops
              }

              onChange={(
                value
              ) =>
                updateSetting(
                  "bestDrop",
                  value
                )
              }
            />

            <NumberInput theme="combat"
              label="Farming Time"

              suffix="Hr"

              value={
                settings.farmTimeHours
              }

              min={0}

              step={0.25}

              onChange={(
                value
              ) =>
                updateSetting(
                  "farmTimeHours",

                  Math.max(
                    0,
                    value
                  )
                )
              }
            />

          </div>

          {bestMobResults.winner ? (

            <>

              <div className="mt-6 rounded-2xl border border-[#81d4c7]/40 bg-black/10 p-5">

                <div className="flex flex-wrap items-start justify-between gap-4">

                  <div>

                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#81d4c7]">
                      Best Choice
                    </p>

                    <h3 className="mt-2 text-3xl font-bold">
                      {bestMobResults.winner.mob.name}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-[#a2eadf]">
                      {bestMobResults.winner.pet}
                    </p>

                  </div>

                  <div className="text-right">

                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                      Drops / Hour
                    </p>

                    <p className="mt-1 text-3xl font-bold text-[#a2eadf]">

                      {formatNumber(
                        bestMobResults.winner.dropsPerHour,
                        4
                      )}

                    </p>

                  </div>

                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

                  <RecommendationStat
                    label="Selected Drop"

                    value={
                      settings.bestDrop
                    }
                  />

                  <RecommendationStat
                    label="Drop Chance"

                    value={`1/${formatNumber(
                      bestMobResults.winner.dropChanceOneIn
                    )}`}
                  />

                  <RecommendationStat
                    label="Kills / Hour"

                    value={formatNumber(
                      bestMobResults.winner.scenario.effectiveKillsPerHour,
                      3
                    )}
                  />

                  <RecommendationStat
                    label="Time / Drop"

                    value={formatDurationFromHours(
                      bestMobResults.winner.hoursPerDrop
                    )}
                  />

                  <RecommendationStat
                    label="Best Pet"

                    value={
                      bestMobResults.winner.pet
                    }
                  />

                  <RecommendationStat
                    label="Hits to Kill"

                    value={formatNumber(
                      bestMobResults.winner.scenario.hitsToKill
                    )}
                  />

                  <RecommendationStat
                    label={`${formatNumber(
                      Math.max(
                        0,
                        settings.farmTimeHours
                      ),
                      2
                    )} Hr Expected Drops`}

                    value={formatNumber(
                      bestMobResults.winner.expectedDrops,
                      3
                    )}
                  />

                  <RecommendationStat
                    label="Native Tier"

                    value={`Tier ${bestMobResults.winner.tier}`}
                  />

                </div>

              </div>

              {/* RANKED MOBS */}

              <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/10">

                <div className="border-b border-white/10 px-4 py-3">

                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                    Mob Comparison
                  </p>

                  <p className="mt-1 text-xs text-white/35">
                    Each mob uses whichever pet gives the highest expected drops/hour.
                  </p>

                </div>

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[820px] text-left text-sm">

                    <thead className="bg-black/10 text-[10px] uppercase tracking-[0.14em] text-white/40">

                      <tr>

                        <th className="px-4 py-3">
                          Mob
                        </th>

                        <th className="px-4 py-3">
                          Best Pet
                        </th>

                        <th className="px-4 py-3">
                          Drop Rate
                        </th>

                        <th className="px-4 py-3">
                          Kills / Hr
                        </th>

                        <th className="px-4 py-3">
                          Time / Drop
                        </th>

                        <th className="px-4 py-3">
                          Expected
                        </th>

                        <th className="px-4 py-3 text-right">
                          Drops / Hr
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {bestMobResults.ranked.map(
                        (
                          candidate,
                          index
                        ) => (

                          <tr
                            key={
                              candidate.mob.id
                            }

                            className="border-t border-white/5"
                          >

                            <td className="px-4 py-3">

                              <div className="flex items-center gap-2">

                                <span className="font-semibold">
                                  {candidate.mob.name}
                                </span>

                                {index ===
                                  0 && (

                                  <span className="rounded-full bg-[#81d4c7]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#a2eadf]">
                                    Best
                                  </span>

                                )}

                              </div>

                            </td>

                            <td className="px-4 py-3 text-white/65">
                              {candidate.pet}
                            </td>

                            <td className="px-4 py-3 text-white/65">

                              1/
                              {formatNumber(
                                candidate.dropChanceOneIn
                              )}

                            </td>

                            <td className="px-4 py-3 text-white/65">

                              {formatNumber(
                                candidate.scenario.effectiveKillsPerHour,
                                3
                              )}

                            </td>

                            <td className="px-4 py-3 text-white/65">

                              {formatDurationFromHours(
                                candidate.hoursPerDrop
                              )}

                            </td>

                            <td className="px-4 py-3 text-white/65">

                              {formatNumber(
                                candidate.expectedDrops,
                                3
                              )}

                            </td>

                            <td className="px-4 py-3 text-right font-bold">

                              {formatNumber(
                                candidate.dropsPerHour,
                                4
                              )}

                            </td>

                          </tr>

                        )
                      )}

                    </tbody>

                  </table>

                </div>

              </div>

            </>

          ) : (

            <div className="mt-6 rounded-xl border border-white/10 bg-black/10 p-5">

              <p className="font-semibold">
                No accessible mob drops {settings.bestDrop}.
              </p>

              <p className="mt-1 text-sm text-white/40">
                Increase your Current Tier or choose another drop.
              </p>

            </div>

          )}

        </CollapsibleSection>

        {/* =================================================
            TIERS
            ================================================= */}

        {[
          3,
          4,
          5,
        ].map(
          (
            tierValue
          ) => {

            const tier =
              tierValue as Tier;

            const key =
              `tier${tier}` as
                | "tier3"
                | "tier4"
                | "tier5";

            const tierResults =
              results.filter(
                (
                  result
                ) =>
                  result.tier ===
                  tier
              );

            return (

              <TierSection
                key={
                  tier
                }

                tier={
                  tier
                }

                open={
                  settings
                    .openSections[
                      key
                    ]
                }

                accessible={
                  tier <=
                  settings.currentTier
                }

                onToggle={() =>
                  toggleTier(
                    tier
                  )
                }
              >

                <div className="space-y-4">

                  {tierResults.map(
                    (
                      result
                    ) => (

                      <MobCard
                        key={
                          result.mob.id
                        }

                        result={
                          result
                        }

                        open={
                          settings
                            .openSections
                            .mobs[
                              result.mob.id
                            ] ??
                          false
                        }

                        boneDragonOwned={
                          settings.boneDragonOwned
                        }

                        silverSerpentOwned={
                          settings.silverSerpentOwned
                        }

                        onToggle={() =>
                          toggleMob(
                            result.mob.id
                          )
                        }
                      />

                    )
                  )}

                </div>

              </TierSection>

            );
          }
        )}

        <div className="mt-6 rounded-xl border border-white/10 bg-[#1d242d] p-4 text-xs leading-5 text-white/45">

          Silver Serpent reduces the HP used to calculate the following mob kill and does not accumulate.

          {" "}

          Bone Dragon bonus kills give normal Ash and item drops, but cannot trigger another Dragon&apos;s Roar and do not award additional Bone Offerings Star-Shards.

        </div>

      </div>

    </main>
  );
}



/* =========================================================
   TIER SECTION
   ========================================================= */

function TierSection({
  tier,
  open,
  accessible,
  onToggle,
  children,
}: {
  tier: Tier;

  open: boolean;

  accessible: boolean;

  onToggle:
    () => void;

  children:
    ReactNode;
}) {
  const theme =
    getTierTheme(
      tier
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

          <div className="flex flex-wrap items-center gap-2">

            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${theme.badge}`}
            >
              PvE Tier
            </span>

            {!accessible && (

              <span className="rounded-full bg-black/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35">
                Locked at current tier
              </span>

            )}

          </div>

          <h2 className="mt-2 text-2xl font-bold">
            Tier {tier}
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
   MOB CARD
   ========================================================= */

function MobCard({
  result,
  open,
  boneDragonOwned,
  silverSerpentOwned,
  onToggle,
}: {
  result: MobResult;

  open: boolean;

  boneDragonOwned: boolean;

  silverSerpentOwned: boolean;

  onToggle:
    () => void;
}) {
  const theme =
    getTierTheme(
      result.tier
    );

  const active =
    result.active;

  let activeLabel =
    "No Pet";

  if (
    boneDragonOwned
  ) {
    activeLabel =
      "Bone Dragon";
  } else if (
    silverSerpentOwned
  ) {
    activeLabel =
      "Silver Serpent";
  }

  return (

    <article
      className={`overflow-hidden rounded-2xl border ${theme.cardBorder} ${theme.cardBackground}`}
    >

      <button
        type="button"

        onClick={
          onToggle
        }

        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left md:px-5"
      >

        <div className="min-w-0">

          <div className="flex flex-wrap items-center gap-2">

            <h3 className="text-xl font-bold">
              {result.mob.name}
            </h3>

            {!result.accessible && (

              <span className="rounded-full bg-black/20 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-white/30">
                Locked
              </span>

            )}

          </div>

          <p className="mt-1 text-xs text-white/45">

            {formatCompact(
              result.mob.hp
            )} HP

            {" • "}

            {formatNumber(
              result.mob.ash
            )} Ash / Kill

            {" • "}

            {formatNumber(
              result.damagePerHit
            )} Damage / Hit

          </p>

        </div>

        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg font-bold ${theme.button}`}
        >
          {open
            ? "−"
            : "+"}
        </span>

      </button>

      {open && (

        <div className="border-t border-white/10 p-4 md:p-5">

          {/* ACTIVE SETUP */}

          <div className="mb-4 rounded-xl border border-[#d69868]/50 bg-black/10 p-4">

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e6a97f]">
                Active Pet Setup
              </p>

              <p className="mt-1 font-bold">
                {activeLabel}
              </p>

            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">

              <MiniStat wrapValue
                label="HP"

                value={formatNumber(
                  active.effectiveHp
                )}
              />

              <MiniStat wrapValue
                label="Damage / Hit"

                value={formatNumber(
                  result.damagePerHit
                )}
              />

              <MiniStat wrapValue
                label="Hits to Kill"

                value={formatNumber(
                  active.hitsToKill
                )}
              />

              <MiniStat wrapValue
                label="Time to Kill"

                value={`${formatNumber(
                  active.timeToKill,
                  3
                )}s`}
              />

              <MiniStat wrapValue
                label="Kills / Hour"

                value={formatNumber(
                  active.effectiveKillsPerHour,
                  3
                )}
              />

            </div>

            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">

              <MiniStat wrapValue
                label="Ash / Hour"

                value={formatCompact(
                  active.ashPerHour
                )}
              />

              {boneDragonOwned && (

                <MiniStat wrapValue
                  label="Star-Shards / Hour"

                  value={formatNumber(
                    active.starShardsPerHour,
                    2
                  )}
                />

              )}

              {silverSerpentOwned && (

                <MiniStat wrapValue
                  label="Silver Serpent HP Reduction"

                  value={`${formatNumber(
                    active.serpentHpReduction *
                      100,
                    2
                  )}%`}
                />

              )}

            </div>

          </div>

          {/* PET COMPARISON */}

          <div className="grid gap-3 md:grid-cols-3">

            <ScenarioCard
              title="No Pet"

              result={
                result.noPet
              }

              selected={
                !boneDragonOwned &&
                !silverSerpentOwned
              }
            />

            <ScenarioCard
              title="Silver Serpent"

              result={
                result.silverOnly
              }

              selected={
                silverSerpentOwned
              }
            />

            <ScenarioCard
              title="Bone Dragon"

              result={
                result.boneOnly
              }

              selected={
                boneDragonOwned
              }
            />

          </div>

          {/* DROPS */}

          <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/10">

            <div className="border-b border-white/10 px-4 py-3">

              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                Drops
              </p>

              <p className="mt-1 text-xs text-white/35">
                Drop calculations use your active pet.
              </p>

            </div>

            <div className="overflow-x-auto">

              <table className="w-full min-w-[680px] text-left text-sm">

                <thead className="bg-black/10 text-[10px] uppercase tracking-[0.14em] text-white/40">

                  <tr>

                    <th className="px-4 py-3">
                      Drop
                    </th>

                    <th className="px-4 py-3">
                      Drop Rate
                    </th>

                    <th className="px-4 py-3">
                      Time Per Drop
                    </th>

                    <th className="px-4 py-3 text-right">
                      Drops / Hour
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {result.mob.drops.map(
                    (
                      drop
                    ) => {

                      const dropsPerHour =
                        active.effectiveKillsPerHour /
                        drop.chanceOneIn;

                      const hoursPerDrop =
                        dropsPerHour >
                        0
                          ? 1 /
                            dropsPerHour
                          : 0;

                      return (

                        <tr
                          key={
                            drop.item
                          }

                          className="border-t border-white/5"
                        >

                          <td className="px-4 py-3 font-semibold">
                            {drop.item}
                          </td>

                          <td className="px-4 py-3 text-white/60">

                            1/
                            {formatNumber(
                              drop.chanceOneIn
                            )}

                          </td>

                          <td className="px-4 py-3 text-white/60">

                            {formatDurationFromHours(
                              hoursPerDrop
                            )}

                          </td>

                          <td className="px-4 py-3 text-right font-bold">

                            {formatNumber(
                              dropsPerHour,
                              4
                            )}

                          </td>

                        </tr>

                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          </div>

        </div>

      )}

    </article>

  );
}

/* =========================================================
   SCENARIO CARD
   ========================================================= */

function ScenarioCard({
  title,
  result,
  selected,
}: {
  title: string;

  result: CombatResult;

  selected: boolean;
}) {
  return (

    <div
      className={`rounded-xl border p-4 ${
        selected
          ? "border-[#d69868] bg-[#2a211d]"
          : "border-white/10 bg-black/10"
      }`}
    >

      <div className="flex items-center justify-between gap-3">

        <p className="font-bold">
          {title}
        </p>

        {selected && (

          <span className="rounded-full bg-[#d69868]/15 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#f0b38a]">
            Active
          </span>

        )}

      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">

        <MiniStat wrapValue
          label="Hits to Kill"

          value={formatNumber(
            result.hitsToKill
          )}
        />

        <MiniStat wrapValue
          label="Time to Kill"

          value={`${formatNumber(
            result.timeToKill,
            3
          )}s`}
        />

        <MiniStat wrapValue
          label="Kills / Hour"

          value={formatNumber(
            result.effectiveKillsPerHour,
            3
          )}
        />

        <MiniStat wrapValue
          label="Ash / Hour"

          value={formatCompact(
            result.ashPerHour
          )}
        />

      </div>

    </div>

  );
}

/* =========================================================
   PET CARD
   ========================================================= */

function PetCard({
  name,
  description,
  enabled,
  level,
  effect,
  onToggle,
  onLevelChange,
}: {
  name: string;

  description: string;

  enabled: boolean;

  level: number;

  effect: string;

  onToggle:
    () => void;

  onLevelChange:
    (
      level: number
    ) => void;
}) {
  return (

    <div
      className={`rounded-2xl border p-4 ${
        enabled
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
            enabled
              ? "bg-[#a58bc2]"
              : "bg-[#3b444e]"
          }`}
        >

          <span
            className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
              enabled
                ? "left-6"
                : "left-1"
            }`}
          />

        </button>

      </div>

      <div
        className={`mt-4 ${
          enabled
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
              !enabled
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
   TIER THEMES
   ========================================================= */

function getTierTheme(
  tier: Tier
) {
  if (
    tier ===
    3
  ) {
    return {
      border:
        "border-[#9d5d45]",

      background:
        "bg-[#241d1a]",

      badge:
        "bg-[#3d2821] text-[#e9a17f]",

      button:
        "bg-[#3d2821] text-[#e9a17f]",

      cardBorder:
        "border-[#a96950]",

      cardBackground:
        "bg-[#33241f]",
    };
  }

  if (
    tier ===
    4
  ) {
    return {
      border:
        "border-[#557f9d]",

      background:
        "bg-[#1d252c]",

      badge:
        "bg-[#233444] text-[#9cc8e7]",

      button:
        "bg-[#233444] text-[#9cc8e7]",

      cardBorder:
        "border-[#6595b7]",

      cardBackground:
        "bg-[#253541]",
    };
  }

  return {
    border:
      "border-[#76649b]",

    background:
      "bg-[#211e2b]",

    badge:
      "bg-[#302943] text-[#c8b3ef]",

    button:
      "bg-[#302943] text-[#c8b3ef]",

    cardBorder:
      "border-[#8b76b2]",

    cardBackground:
      "bg-[#2b2638]",
  };
}