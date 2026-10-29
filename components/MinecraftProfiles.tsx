"use client";

import { useEffect, useState, type FormEvent } from "react";
import { getSupabase } from "../lib/supabase/client";
import {
  addProfile,
  initializeProfiles,
  removeProfile,
  renameProfile,
  switchProfile,
} from "../lib/minecraftProfiles";
import type { ProfileDirectory } from "../lib/cloudProgress";
import { withProfileLock, profilesChanged } from "../lib/profileLock";
import { useCloudAutoSave } from "./CloudAutoSave";
import MinecraftAvatar from "./MinecraftAvatar";

const button =
  "rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/75 hover:bg-white/5 disabled:opacity-40";
const input =
  "min-w-0 rounded-lg border border-white/15 bg-[#151b24] px-3 py-2 text-sm outline-none focus:border-[#a9cf9f]";

export default function MinecraftProfiles({
  userId,
  username,
}: {
  userId: string;
  username: string;
}) {
  const sync = useCloudAutoSave();
  const [directory, setDirectory] = useState<ProfileDirectory | null>(null);
  const [owner, setOwner] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState("");
  useEffect(() => {
    let active = true;
    void withProfileLock(() =>
      initializeProfiles(localStorage, userId, username),
    )
      .then((value) => {
        if (active) {
          setDirectory(value);
          setOwner(userId);
          setError("");
          profilesChanged();
        }
      })
      .catch((reason) => {
        if (active) {
          setDirectory(null);
          setOwner(userId);
          setError(
            reason instanceof Error
              ? reason.message
              : "Could not load Minecraft profiles.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [userId, username]);
  const current = owner === userId ? directory : null;
  async function change(action: () => ProfileDirectory, reload = false) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await sync.pause();
      const { data, error: authError } = await getSupabase().auth.getUser();
      if (authError || data.user?.id !== userId)
        throw new Error(
          "Your site account changed. Reload this page before editing Minecraft profiles.",
        );
      const value = await withProfileLock(action);
      setDirectory(value);
      setOwner(userId);
      setNewName("");
      profilesChanged();
      if (reload) window.location.reload();
      else
        setNotice(
          "Minecraft account list updated. Wait for Saved to cloud before switching devices.",
        );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not update Minecraft accounts.",
      );
    } finally {
      sync.resume();
      setBusy(false);
    }
  }
  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void change(() =>
      addProfile(localStorage, userId, newName, crypto.randomUUID()),
    );
  }
  return (
    <section
      id="minecraft-accounts"
      className="rounded-2xl border border-white/10 bg-[#1b222c] p-6"
    >
      <h2 className="text-xl font-bold">Minecraft accounts</h2>
      <p className="mt-3 text-sm leading-6 text-white/50">
        Each Minecraft username has separate progression, calculator settings
        and recommendations. Switching accounts saves the outgoing profile on
        this device and reloads the trackers. All profiles are included in your
        site account’s cloud save.
      </p>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-200">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-4 text-sm text-[#b9dfaf]">
          {notice}
        </p>
      )}
      {!current ? (
        <div className="mt-4">
          {!error ? (
            <p role="status" className="text-sm text-white/50">
              Loading Minecraft accounts…
            </p>
          ) : (
            <button
              className={button}
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    "Start fresh Minecraft profiles for this site account on this browser? A local backup will be kept. Existing cloud data is not loaded or replaced by this action.",
                  )
                ) {
                  sync.unlink();
                  void change(
                    () =>
                      initializeProfiles(localStorage, userId, username, true),
                    true,
                  );
                }
              }}
            >
              Start fresh profiles on this device
            </button>
          )}
        </div>
      ) : (
        <>
          <ul className="mt-5 space-y-3">
            {current.profiles.map((profile) => (
              <li
                key={profile.id}
                className={`rounded-xl border p-4 ${profile.id === current.activeId ? "border-[#a9cf9f]/45 bg-[#a9cf9f]/5" : "border-white/10"}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <MinecraftAvatar username={profile.username} size={36} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {profile.username}
                      </p>
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-white/40">
                        {profile.id === "main"
                          ? "Main account"
                          : "Alternative account"}
                        {profile.id === current.activeId
                          ? " · Tracking now"
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className={button}
                      disabled={busy || profile.id === current.activeId}
                      onClick={() =>
                        change(
                          () => switchProfile(localStorage, userId, profile.id),
                          true,
                        )
                      }
                    >
                      {profile.id === current.activeId ? "Active" : "Switch"}
                    </button>
                    {profile.id !== "main" && (
                      <button
                        className={button}
                        disabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Remove ${profile.username} and its tracked progress? Other Minecraft profiles will stay unchanged.`,
                            )
                          )
                            void change(
                              () =>
                                removeProfile(localStorage, userId, profile.id),
                              true,
                            );
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-white/45">
                    Edit Minecraft username
                  </summary>
                  <form
                    className="mt-3 flex flex-wrap gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      const name = String(
                        new FormData(event.currentTarget).get(
                          "minecraftUsername",
                        ) ?? "",
                      );
                      void change(() =>
                        renameProfile(localStorage, userId, profile.id, name),
                      );
                    }}
                  >
                    <input
                      aria-label={`Minecraft username for ${profile.username}`}
                      key={profile.username}
                      name="minecraftUsername"
                      defaultValue={profile.username}
                      required
                      minLength={3}
                      maxLength={16}
                      spellCheck={false}
                      autoCapitalize="none"
                      disabled={busy}
                      className={input}
                    />
                    <button className={button} disabled={busy} type="submit">
                      Save name
                    </button>
                  </form>
                </details>
              </li>
            ))}
          </ul>
          <form
            onSubmit={create}
            className="mt-5 border-t border-white/10 pt-5"
          >
            <label
              htmlFor="new-minecraft-account"
              className="block text-sm font-semibold"
            >
              Add an alternative account
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                id="new-minecraft-account"
                className={input}
                placeholder="Minecraft username"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                required
                minLength={3}
                maxLength={16}
                spellCheck={false}
                autoCapitalize="none"
                disabled={busy}
              />
              <button
                type="submit"
                className={button}
                disabled={busy || current.profiles.length >= 20}
              >
                Add account
              </button>
            </div>
            <p className="mt-2 text-xs text-white/40">
              Java usernames only. New profiles start with no upgrades. Adding a
              username does not verify ownership of the Minecraft account.
            </p>
          </form>
        </>
      )}
    </section>
  );
}
