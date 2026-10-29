import { drills } from "../data/drills";
import { helmets } from "../data/helmets";
import { armor } from "../data/armor";
import { talismans } from "../data/talismans";
import { o2Tanks, quickwarps, miscItems } from "../data/misc";
import { progressionCores } from "../data/coreProgression";
import {
  PROFILE_KEY,
  parseProfileDirectory,
  validateSnapshot,
  type ProgressSnapshot,
} from "./cloudProgress";

export type TrackerRow = { id: string; name: string; completed: boolean };
export type TrackerGroup = { name: string; rows: TrackerRow[] };
export function savedObject(
  snapshot: ProgressSnapshot,
  source: string,
): Record<string, unknown> {
  const raw = snapshot["t5-mission-control-" + source];
  if (!raw) return {};
  const parsed: unknown = JSON.parse(raw);
  return parsed && typeof parsed === "object" && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>)
    : {};
}
function ids(value: unknown) {
  return new Set(
    Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [],
  );
}
function sequential(
  entries: { id: string; name: string }[],
  completed: unknown,
) {
  const done = ids(completed);
  const last = entries.reduce(
    (highest, item, index) => (done.has(item.id) ? index : highest),
    -1,
  );
  return entries.map((item, index) => ({
    id: item.id,
    name: item.name,
    completed: index <= last,
  }));
}
export function trackerGroups(snapshot: ProgressSnapshot): TrackerGroup[] {
  const armorDone = ids(savedObject(snapshot, "armor").completedPieces);
  const talismanDone = ids(savedObject(snapshot, "talismans").obtained);
  const miscDone = ids(savedObject(snapshot, "misc").completed);
  return [
    {
      name: "Drills",
      rows: sequential(drills, savedObject(snapshot, "drills").obtained),
    },
    {
      name: "Helmets",
      rows: sequential(helmets, savedObject(snapshot, "helmets").completed),
    },
    {
      name: "Armor",
      rows: armor.flatMap((tier) =>
        tier.pieces.map((piece) => ({
          id: tier.id + ":" + piece.type,
          name: tier.name + " " + piece.name,
          completed: armorDone.has(tier.id + ":" + piece.type),
        })),
      ),
    },
    {
      name: "Talismans",
      rows: talismans.map((item) => ({
        id: item.id,
        name: item.name,
        completed: talismanDone.has(item.id),
      })),
    },
    {
      name: "Misc items",
      rows: [
        ...o2Tanks.map((item) => ({ ...item, name: item.name + " O₂ Tank" })),
        ...quickwarps.map((item) => ({
          ...item,
          name: item.name + " Quickwarp",
        })),
        ...miscItems,
      ].map((item) => ({
        id: item.id,
        name: item.name,
        completed: miscDone.has(item.id),
      })),
    },
  ];
}
export function trackerCores(snapshot: ProgressSnapshot) {
  const saved = savedObject(snapshot, "cores");
  const levels =
    saved.selectedLevels &&
    typeof saved.selectedLevels === "object" &&
    !Array.isArray(saved.selectedLevels)
      ? (saved.selectedLevels as Record<string, unknown>)
      : {};
  return {
    magma: typeof saved.magmaStorage === "number" ? saved.magmaStorage : 1000,
    rows: progressionCores.map((core) => {
      const level =
        core.levels.find((item) => item.level === levels[core.id]) ??
        core.levels[0];
      return {
        id: core.id,
        name: core.name,
        label: level.label,
        level: level.level,
        max: core.levels[core.levels.length - 1].level,
      };
    }),
  };
}
export function adminProfiles(
  value: unknown,
  userId: string,
  username: string,
) {
  const snapshot = validateSnapshot(value);
  if (snapshot[PROFILE_KEY]) {
    const directory = parseProfileDirectory(JSON.parse(snapshot[PROFILE_KEY]));
    if (directory.ownerId !== userId)
      throw new Error(
        "This save's Minecraft profile owner does not match the selected player.",
      );
    return directory;
  }
  return {
    schema: 1 as const,
    ownerId: userId,
    activeId: "main",
    profiles: [{ id: "main", username, progress: snapshot }],
  };
}
