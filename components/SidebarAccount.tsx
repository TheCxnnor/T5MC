"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { accountConfigured, getSupabase } from "../lib/supabase/client";
import { displayUsername } from "../lib/username";
import {
  PROFILE_KEY,
  readProfileDirectory,
  type ProfileDirectory,
} from "../lib/cloudProgress";
import { switchProfile } from "../lib/minecraftProfiles";
import { withProfileLock, profilesChanged } from "../lib/profileLock";
import { useCloudAutoSave } from "./CloudAutoSave";
import MinecraftAvatar from "./MinecraftAvatar";
import AdminAccessLink from "./AdminAccessLink";

const control =
  "inline-flex h-10 max-w-[12rem] shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-[#1b222c] px-2.5 text-xs font-semibold text-[#d9e4d6] transition hover:border-white/20 hover:bg-[#252e39] focus-visible:outline-2 focus-visible:outline-[#a9cf9f]";

export default function SidebarAccount() {
  const sync = useCloudAutoSave();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(accountConfigured);
  const [directory, setDirectory] = useState<ProfileDirectory | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const refreshProfiles = () => {
      try {
        setDirectory(readProfileDirectory(localStorage));
      } catch {
        setDirectory(null);
      }
    };
    if (!accountConfigured()) return;
    const {
      data: { subscription },
    } = getSupabase().auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      refreshProfiles();
    });
    const storage = (event: StorageEvent) => {
      if (event.key === PROFILE_KEY) refreshProfiles();
    };
    window.addEventListener("storage", storage);
    window.addEventListener("t5-profiles-changed", refreshProfiles);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", storage);
      window.removeEventListener("t5-profiles-changed", refreshProfiles);
    };
  }, []);
  const profiles = user && directory?.ownerId === user.id ? directory : null;
  const active = profiles?.profiles.find(
    (profile) => profile.id === profiles.activeId,
  );
  const name =
    active?.username ?? displayUsername(user?.user_metadata) ?? "Account";
  async function selectProfile(id: string) {
    if (!user || busy) return;
    setBusy(true);
    setError("");
    try {
      await sync.pause();
      const { data, error: authError } = await getSupabase().auth.getUser();
      if (authError || data.user?.id !== user.id)
        throw new Error("Your site account changed. Reload before switching.");
      await withProfileLock(() => switchProfile(localStorage, user.id, id));
      profilesChanged();
      window.location.reload();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not switch Minecraft profiles.",
      );
    } finally {
      sync.resume();
      setBusy(false);
    }
  }
  if (!user)
    return (
      <Link
        href="/account"
        className={control}
        aria-label="Log in or create an account"
      >
        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-md bg-[#a9cf9f]/15 text-[#b9dfaf]"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          >
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
          </svg>
        </span>
        {loading ? "Account" : "Log in"}
      </Link>
    );
  return (
    <details key={user.id} className="relative">
      <summary
        className={control + " list-none [&::-webkit-details-marker]:hidden"}
        aria-label={`Tracking ${name}. Switch Minecraft account or manage your site account.`}
      >
        <MinecraftAvatar username={name} />
        <span className="truncate">{name}</span>
        <span aria-hidden="true" className="ml-1 text-white/40">
          ▾
        </span>
      </summary>
      <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-white/15 bg-[#1b222c] shadow-2xl">
        <p className="px-4 pb-2 pt-4 text-[10px] font-semibold uppercase tracking-wider text-white/40">
          Minecraft accounts
        </p>
        {profiles ? (
          <ul className="max-h-[55vh] overflow-y-auto px-2 pb-2">
            {profiles.profiles.map((profile) => (
              <li key={profile.id}>
                <button
                  disabled={busy || profile.id === profiles.activeId}
                  onClick={() => selectProfile(profile.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-xs hover:bg-white/5 disabled:cursor-default disabled:hover:bg-transparent"
                >
                  <MinecraftAvatar username={profile.username} />
                  <span className="min-w-0 flex-1 truncate">
                    {profile.username}
                  </span>
                  {profile.id === profiles.activeId && (
                    <span className="text-[10px] text-[#a9cf9f]">Active</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 pb-3 text-xs leading-5 text-white/50">
            Add Minecraft accounts from your account settings.
          </p>
        )}
        {error && (
          <p role="alert" className="px-4 pb-3 text-xs text-red-200">
            {error}
          </p>
        )}
        {busy && (
          <p role="status" className="px-4 pb-3 text-xs text-white/50">
            Switching Minecraft account…
          </p>
        )}
        <AdminAccessLink userId={user.id} />
        <Link
          href="/account#minecraft-accounts"
          className="block border-t border-white/10 px-4 py-3 text-xs font-semibold text-[#a9cf9f] hover:bg-white/5"
        >
          Manage Minecraft accounts
        </Link>
        <Link
          href="/account"
          className="block px-4 pb-3 pt-1 text-xs text-white/60 hover:text-white"
        >
          Site account & Cloud Saves
        </Link>
      </div>
    </details>
  );
}
