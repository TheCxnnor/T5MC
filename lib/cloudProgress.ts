// Authentication tokens and cloud-link bookkeeping are never part of a progress save.
export const TRACKER_KEYS = [
  "helmets",
  "drills",
  "armor",
  "talismans",
  "misc",
  "cores",
  "profit",
  "pve",
  "recommendations",
].map((source) => `t5-mission-control-${source}`);
export const PROFILE_KEY = "t5-mission-control-profiles";
export const PROGRESS_KEYS = [...TRACKER_KEYS, PROFILE_KEY];
export type ProgressSnapshot = Record<string, string>;
export type MinecraftProfile = {
  id: string;
  username: string;
  progress: ProgressSnapshot;
};
export type ProfileDirectory = {
  schema: 1;
  ownerId: string;
  activeId: string;
  profiles: MinecraftProfile[];
};
export const TRANSITION_KEY = "t5-progress-transition";
const BACKUP_KEY = "t5-cloud-restore-backup";

function object(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
export function validateTrackerSnapshot(value: unknown): ProgressSnapshot {
  if (!object(value)) throw new Error("Invalid tracker progress.");
  const result: ProgressSnapshot = {};
  for (const [key, raw] of Object.entries(value)) {
    if (
      !TRACKER_KEYS.includes(key) ||
      typeof raw !== "string" ||
      !object(JSON.parse(raw))
    )
      throw new Error(
        "This save contains unsupported or invalid tracker progress.",
      );
    result[key] = raw;
  }
  return result;
}
export function parseProfileDirectory(value: unknown): ProfileDirectory {
  if (
    !object(value) ||
    value.schema !== 1 ||
    typeof value.ownerId !== "string" ||
    !value.ownerId ||
    typeof value.activeId !== "string" ||
    !Array.isArray(value.profiles) ||
    value.profiles.length < 1 ||
    value.profiles.length > 20
  )
    throw new Error("This Minecraft profile list is invalid.");
  const ids = new Set<string>(),
    names = new Set<string>();
  const profiles = value.profiles.map((entry): MinecraftProfile => {
    if (
      !object(entry) ||
      typeof entry.id !== "string" ||
      !/^[A-Za-z0-9_-]{1,80}$/.test(entry.id) ||
      typeof entry.username !== "string" ||
      !entry.username.trim() ||
      entry.username.length > 24 ||
      ids.has(entry.id) ||
      names.has(entry.username.toLowerCase())
    )
      throw new Error(
        "This Minecraft profile list contains invalid or duplicate accounts.",
      );
    ids.add(entry.id);
    names.add(entry.username.toLowerCase());
    return {
      id: entry.id,
      username: entry.username,
      progress: validateTrackerSnapshot(entry.progress),
    };
  });
  if (!ids.has("main") || !ids.has(value.activeId))
    throw new Error("The main or active Minecraft profile is missing.");
  return {
    schema: 1,
    ownerId: value.ownerId,
    activeId: value.activeId,
    profiles,
  };
}
function sameSnapshot(a: ProgressSnapshot, b: ProgressSnapshot) {
  const keys = Object.keys(a);
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => a[key] === b[key])
  );
}
export function validateSnapshot(value: unknown): ProgressSnapshot {
  if (!object(value))
    throw new Error("This cloud save is not a valid progress snapshot.");
  const rawProfile = value[PROFILE_KEY];
  const trackerEntries = Object.fromEntries(
    Object.entries(value).filter(([key]) => key !== PROFILE_KEY),
  );
  const result = validateTrackerSnapshot(trackerEntries);
  if (rawProfile !== undefined) {
    if (typeof rawProfile !== "string")
      throw new Error("Invalid Minecraft profile data.");
    const directory = parseProfileDirectory(JSON.parse(rawProfile));
    const active = directory.profiles.find(
      (profile) => profile.id === directory.activeId,
    )!;
    if (!sameSnapshot(active.progress, result))
      throw new Error("The active profile and tracker progress do not match.");
    result[PROFILE_KEY] = JSON.stringify(directory);
  }
  if (new TextEncoder().encode(JSON.stringify(result)).length > 900_000)
    throw new Error(
      "This save is too large to upload. Reduce the number of Minecraft profiles.",
    );
  return result;
}
export function assertSnapshotOwner(
  snapshot: ProgressSnapshot,
  userId: string,
) {
  if (
    snapshot[PROFILE_KEY] &&
    parseProfileDirectory(JSON.parse(snapshot[PROFILE_KEY])).ownerId !== userId
  )
    throw new Error(
      "These Minecraft profiles belong to another site account. Load your own cloud save or start fresh profiles.",
    );
}
export function readProfileDirectory(
  storage: Storage,
): ProfileDirectory | null {
  const raw = storage.getItem(PROFILE_KEY);
  return raw === null ? null : parseProfileDirectory(JSON.parse(raw));
}
export function captureTrackers(storage: Storage): ProgressSnapshot {
  const snapshot: ProgressSnapshot = {};
  for (const key of TRACKER_KEYS) {
    const raw = storage.getItem(key);
    if (raw !== null) snapshot[key] = raw;
  }
  return validateTrackerSnapshot(snapshot);
}
export function captureProgress(storage: Storage): ProgressSnapshot {
  if (storage.getItem(TRANSITION_KEY))
    throw new Error("A profile switch is in progress. Wait for it to finish.");
  const snapshot = captureTrackers(storage);
  const directory = readProfileDirectory(storage);
  if (directory) {
    // Pages keep writing to the existing tracker keys. Fold those writes into ONLY
    // the selected Minecraft profile before cloud comparison/upload.
    const active = directory.profiles.find(
      (profile) => profile.id === directory.activeId,
    )!;
    active.progress = { ...snapshot };
    snapshot[PROFILE_KEY] = JSON.stringify(directory);
  }
  return validateSnapshot(snapshot);
}
export function replaceBrowserProgress(
  storage: Storage,
  value: unknown,
  backupKey: string,
) {
  const snapshot = validateSnapshot(value);
  // Keep exact stored bytes for rollback, including an older active-profile mirror.
  const previous: ProgressSnapshot = {};
  for (const key of PROGRESS_KEYS) {
    const raw = storage.getItem(key);
    if (raw !== null) previous[key] = raw;
  }
  storage.setItem(backupKey, JSON.stringify(captureProgress(storage)));
  storage.setItem(TRANSITION_KEY, "1");
  try {
    for (const key of PROGRESS_KEYS) {
      if (key in snapshot) storage.setItem(key, snapshot[key]);
      else storage.removeItem(key);
    }
  } catch (error) {
    for (const key of PROGRESS_KEYS) {
      if (key in previous) storage.setItem(key, previous[key]);
      else storage.removeItem(key);
    }
    throw error;
  } finally {
    storage.removeItem(TRANSITION_KEY);
  }
}
export function restoreProgress(storage: Storage, value: unknown) {
  replaceBrowserProgress(storage, value, BACKUP_KEY);
}
export function restorePreviousBrowserSave(storage: Storage) {
  const raw = storage.getItem(BACKUP_KEY);
  if (!raw) throw new Error("There is no previous browser save to restore.");
  restoreProgress(storage, JSON.parse(raw));
}
export function hasRestoreBackup(storage: Storage) {
  return storage.getItem(BACKUP_KEY) !== null;
}
