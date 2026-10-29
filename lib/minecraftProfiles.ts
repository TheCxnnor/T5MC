import {
  PROFILE_KEY,
  captureProgress,
  captureTrackers,
  parseProfileDirectory,
  readProfileDirectory,
  replaceBrowserProgress,
  validateSnapshot,
  type ProfileDirectory,
} from "./cloudProgress";

export function minecraftUsername(value: string) {
  const name = value.trim();
  if (!/^[A-Za-z0-9_]{3,16}$/.test(name))
    throw new Error(
      "Enter a Minecraft Java username: 3–16 letters, numbers or underscores.",
    );
  return name;
}
export function getProfiles(storage: Storage, ownerId: string) {
  const snapshot = captureProgress(storage);
  if (!snapshot[PROFILE_KEY]) return null;
  const directory = parseProfileDirectory(JSON.parse(snapshot[PROFILE_KEY]));
  if (directory.ownerId !== ownerId)
    throw new Error(
      "This browser has Minecraft profiles from another site account. Load your cloud save or start fresh profiles.",
    );
  return directory;
}
function writeDirectory(storage: Storage, directory: ProfileDirectory) {
  const active = directory.profiles.find(
    (profile) => profile.id === directory.activeId,
  );
  if (!active) throw new Error("Select an existing Minecraft profile.");
  const snapshot = validateSnapshot({
    ...active.progress,
    [PROFILE_KEY]: JSON.stringify(directory),
  });
  // The directory key is one atomic localStorage write for add/rename/inactive removal.
  storage.setItem(PROFILE_KEY, snapshot[PROFILE_KEY]);
  return directory;
}
export function initializeProfiles(
  storage: Storage,
  ownerId: string,
  username: string,
  fresh = false,
) {
  if (!fresh) {
    const existing = getProfiles(storage, ownerId);
    if (existing) return existing;
  }
  const progress = fresh ? {} : captureTrackers(storage);
  const directory: ProfileDirectory = {
    schema: 1,
    ownerId,
    activeId: "main",
    profiles: [
      {
        id: "main",
        username: username.trim().slice(0, 24) || "Main account",
        progress,
      },
    ],
  };
  if (fresh) {
    replaceBrowserProgress(
      storage,
      { ...progress, [PROFILE_KEY]: JSON.stringify(directory) },
      "t5-profile-switch-backup",
    );
    return directory;
  }
  return writeDirectory(storage, directory);
}
export function addProfile(
  storage: Storage,
  ownerId: string,
  username: string,
  id: string,
) {
  const directory = getProfiles(storage, ownerId);
  if (!directory) throw new Error("Create your main profile first.");
  if (directory.profiles.length >= 20)
    throw new Error("You can track up to 20 Minecraft accounts.");
  const name = minecraftUsername(username);
  if (
    directory.profiles.some(
      (profile) => profile.username.toLowerCase() === name.toLowerCase(),
    )
  )
    throw new Error("That Minecraft username is already in your account list.");
  directory.profiles.push({ id, username: name, progress: {} });
  return writeDirectory(storage, parseProfileDirectory(directory));
}
export function switchProfile(storage: Storage, ownerId: string, id: string) {
  const directory = getProfiles(storage, ownerId);
  if (!directory || !directory.profiles.some((profile) => profile.id === id))
    throw new Error("That Minecraft profile could not be found.");
  directory.activeId = id;
  const target = directory.profiles.find((profile) => profile.id === id)!;
  // Save outgoing data before loading the destination's distinct tracker state.
  replaceBrowserProgress(
    storage,
    { ...target.progress, [PROFILE_KEY]: JSON.stringify(directory) },
    "t5-profile-switch-backup",
  );
  return directory;
}
export function renameProfile(
  storage: Storage,
  ownerId: string,
  id: string,
  username: string,
) {
  const directory = getProfiles(storage, ownerId);
  const profile = directory?.profiles.find((profile) => profile.id === id);
  if (!directory || !profile)
    throw new Error("That Minecraft profile could not be found.");
  const name = minecraftUsername(username);
  if (
    directory.profiles.some(
      (profile) =>
        profile.id !== id &&
        profile.username.toLowerCase() === name.toLowerCase(),
    )
  )
    throw new Error("That Minecraft username is already in your account list.");
  profile.username = name;
  return writeDirectory(storage, directory);
}
export function removeProfile(storage: Storage, ownerId: string, id: string) {
  if (id === "main")
    throw new Error("Your main Minecraft profile cannot be removed.");
  const directory = getProfiles(storage, ownerId);
  if (!directory || !directory.profiles.some((profile) => profile.id === id))
    throw new Error("That Minecraft profile could not be found.");
  directory.profiles = directory.profiles.filter(
    (profile) => profile.id !== id,
  );
  if (directory.activeId === id) directory.activeId = "main";
  const target = directory.profiles.find(
    (profile) => profile.id === directory.activeId,
  )!;
  replaceBrowserProgress(
    storage,
    { ...target.progress, [PROFILE_KEY]: JSON.stringify(directory) },
    "t5-profile-switch-backup",
  );
  return directory;
}
export function profileOwner(storage: Storage) {
  return readProfileDirectory(storage)?.ownerId ?? null;
}
