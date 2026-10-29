"use client";

import { useSyncExternalStore } from "react";
import { PROFILE_KEY, readProfileDirectory } from "../lib/cloudProgress";

function subscribe(refresh: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key === PROFILE_KEY || event.key === null) refresh();
  };
  window.addEventListener("storage", storage);
  window.addEventListener("t5-profiles-changed", refresh);
  return () => {
    window.removeEventListener("storage", storage);
    window.removeEventListener("t5-profiles-changed", refresh);
  };
}
export function useMainMinecraftUsername(userId: string | undefined) {
  return useSyncExternalStore(
    subscribe,
    () => {
      if (!userId) return null;
      try {
        const directory = readProfileDirectory(localStorage);
        if (directory?.ownerId !== userId) return null;
        const name = directory.profiles.find(
          (profile) => profile.id === "main",
        )?.username;
        return name && /^[A-Za-z0-9_]{3,16}$/.test(name) ? name : null;
      } catch {
        return null;
      }
    },
    () => null,
  );
}
