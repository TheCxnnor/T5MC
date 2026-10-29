"use client";

import Link from "next/link";
import MinecraftProfiles from "./MinecraftProfiles";
import { useMainMinecraftUsername } from "./useMainMinecraftUsername";
import { useEffect, useState } from "react";
import { displayUsername } from "../lib/username";
import { useCloudAutoSave } from "./CloudAutoSave";
import { readCloud, writeCloud } from "../lib/cloudApi";
import type { User } from "@supabase/supabase-js";
import { accountConfigured, getSupabase } from "../lib/supabase/client";
import {
  captureProgress,
  restoreProgress,
  restorePreviousBrowserSave,
  hasRestoreBackup,
} from "../lib/cloudProgress";

type CloudInfo = { version: number; updated_at: string };
const buttonClass =
  "rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-40";
const primaryClass =
  "rounded-xl bg-[#a9cf9f] px-4 py-2.5 text-sm font-bold text-[#151b24] transition hover:bg-[#bfdfb7] disabled:cursor-wait disabled:opacity-40";

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : error && typeof error === "object" && "message" in error
      ? String(error.message)
      : "Something went wrong. Please try again.";
}

export default function AccountPanel() {
  const sync = useCloudAutoSave();
  const configured = accountConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const userId = user?.id;
  const mainUsername = useMainMinecraftUsername(userId);
  const [cloudState, setCloudState] = useState<{
    owner?: string;
    info: CloudInfo | null;
    ready: boolean;
  }>({ info: null, ready: false });
  const cloudReady = cloudState.owner === userId && cloudState.ready;
  const metadata = cloudState.owner === userId ? cloudState.info : null;
  const cloud =
    sync.receipt &&
    sync.receipt.userId === userId &&
    sync.receipt.version >= (metadata?.version ?? 0)
      ? sync.receipt
      : metadata;
  function setCloud(info: CloudInfo | null) {
    setCloudState({ owner: userId, info, ready: true });
  }
  const [backup, setBackup] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const enabled = accountConfigured();
    if (!enabled) return;
    let active = true;
    const supabase = getSupabase();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });
    supabase.auth
      .getUser()
      .then(({ data, error: authError }) => {
        if (!active) return;
        setBackup(hasRestoreBackup(localStorage));
        if (new URLSearchParams(window.location.search).has("authError")) {
          setError(
            "Discord sign-in could not be completed. Please try again in the same browser where you started.",
          );
        }
        setUser(data.user);
        setLoading(false);
        if (authError && authError.name !== "AuthSessionMissingError") {
          setError("Could not check your session. Try signing in again.");
        }
      })
      .catch(() => {
        if (active) {
          setError("Could not connect. Check your connection and try again.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    getSupabase()
      .from("player_saves")
      .select("version,updated_at")
      .eq("user_id", userId)
      .maybeSingle()
      .then(
        ({ data, error: dbError }) => {
          if (!active) return;
          if (dbError) {
            setError("Could not read your cloud save. " + dbError.message);
            return;
          }
          setCloudState({
            owner: userId,
            info: data as CloudInfo | null,
            ready: true,
          });
        },
        (reason: unknown) => {
          if (active) setError(errorMessage(reason));
        },
      );
    return () => {
      active = false;
    };
  }, [userId, refresh]); // Reload metadata only when the account or refresh request changes.

  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await sync.pause();
      await action();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      sync.resume();
      setBusy(false);
    }
  }

  async function verifiedUser() {
    const { data, error: authError } = await getSupabase().auth.getUser();
    if (authError || !data.user || data.user.id !== user?.id) {
      throw new Error(
        "Your account changed or your session expired. Reload this page and sign in again.",
      );
    }
    return data.user;
  }

  async function discordLogin(connect = false) {
    await run(async () => {
      const supabase = getSupabase();
      if (connect) await verifiedUser();
      if (!connect) sessionStorage.setItem("t5-cloud-load-on-signin", "1");
      const options = { redirectTo: window.location.origin + "/auth/callback" };
      const result = connect
        ? await supabase.auth.linkIdentity({ provider: "discord", options })
        : await supabase.auth.signInWithOAuth({ provider: "discord", options });
      if (result.error) {
        if (!connect) sessionStorage.removeItem("t5-cloud-load-on-signin");
        if (result.error.code === "manual_linking_disabled") {
          throw new Error(
            "Enable Manual Linking in Supabase authentication settings before connecting Discord to an existing account.",
          );
        }
        throw result.error;
      }
    });
  }

  async function saveCloud() {
    await run(async () => {
      const owner = await verifiedUser();
      const snapshot = captureProgress(localStorage);
      if (!Object.keys(snapshot).length)
        throw new Error("There is no browser progress to save yet.");
      const latest = await readCloud(owner.id);
      if (
        latest &&
        !window.confirm(
          "Keep this browser’s progress and replace the cloud save? Automatic saving will resume using this version.",
        )
      )
        return;
      const receipt = await writeCloud(
        owner.id,
        snapshot,
        latest?.version ?? 0,
      );
      sync.link(receipt, snapshot);
      setCloud(receipt);
      setNotice("Cloud save updated. Future changes will save automatically.");
    });
  }

  async function loadCloud() {
    await run(async () => {
      const owner = await verifiedUser();
      const data = await readCloud(owner.id);
      if (!data) throw new Error("You do not have a cloud save yet.");
      if (
        !window.confirm(
          "Replace this browser's progress with your cloud save? A browser backup will be kept so you can undo this.",
        )
      )
        return;
      restoreProgress(localStorage, data.progress);
      sync.link(data, data.progress);
      setBackup(true);
      setCloud({ version: data.version, updated_at: data.updated_at });
      setNotice(
        "Cloud save loaded. Open any tracker to see your restored progress.",
      );
      // Next.js preserves tracker component state between navigations.
      // A full reload remounts every tracker from the restored browser save.
      window.location.reload();
    });
  }

  return (
    <main className="min-h-screen px-4 py-8 text-white md:px-6 lg:px-8">
      <div className={user ? "mx-auto max-w-4xl" : "mx-auto max-w-lg"}>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a9cf9f]">
          Your account
        </p>
        <h1 className="mt-2 text-3xl font-bold">Account & Cloud Saves</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#9aa4af]">
          Accounts are optional. Keep playing as a guest, or sign in to move
          your progress between devices.
        </p>

        <p className="mt-2 max-w-2xl text-xs leading-5 text-white/40">
          Site admins can view cloud-saved tracker progress in a read-only
          support viewer.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-300/25 bg-red-300/10 p-4 text-sm text-red-200"
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="mt-5 rounded-xl border border-[#a9cf9f]/30 bg-[#a9cf9f]/10 p-4 text-sm text-[#c7e4c0]"
          >
            {notice}
          </p>
        )}

        {loading ? (
          <p role="status" className="mt-8 text-white/60">
            Checking your account…
          </p>
        ) : !configured ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-[#1b222c] p-6">
            Accounts are not configured on this site yet. You can still use all
            trackers as a guest.
          </div>
        ) : user ? (
          <div className="mt-6 space-y-5">
            <section className="rounded-2xl border border-white/10 bg-[#1b222c] p-6">
              <p className="text-xs uppercase tracking-wider text-white/40">
                Signed in as
              </p>
              <p className="mt-2 break-all font-semibold">
                {mainUsername ?? "Set your Main Minecraft username"}
              </p>
              <p className="mt-1 break-all text-sm text-white/50">
                {user.email}
              </p>
              <p className="mt-4 text-sm leading-6 text-white/50">
                Your site username follows your Main Minecraft account. Edit the
                Main username below; it updates your site username when your
                cloud save is synced.
              </p>
              <Link
                href="#minecraft-accounts"
                className="mt-2 inline-block text-sm text-[#a9cf9f] hover:underline"
              >
                Edit Main Minecraft username
              </Link>
              <div className="mt-5 rounded-xl border border-white/10 bg-black/10 p-4">
                <p className="text-sm font-semibold">Discord login</p>
                {user.identities?.some(
                  (identity) => identity.provider === "discord",
                ) ? (
                  <p className="mt-2 text-sm text-[#b9dfaf]">
                    Discord is connected. You can use it to sign into this same
                    site account.
                  </p>
                ) : (
                  <>
                    <p className="mt-2 text-xs leading-5 text-white/50">
                      Connect Discord while signed in to keep your current cloud
                      saves, Minecraft profiles and site permissions.
                    </p>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => discordLogin(true)}
                      className="mt-3 rounded-xl bg-[#5865f2] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4752c4] disabled:opacity-40"
                    >
                      Connect Discord
                    </button>
                  </>
                )}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  className={buttonClass}
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      const { error: authError } =
                        await getSupabase().auth.signOut({ scope: "local" });
                      if (authError) throw authError;
                      setNotice(
                        "Signed out. This browser's progress is still stored on this device.",
                      );
                    })
                  }
                >
                  Sign out
                </button>
              </div>
            </section>
            <MinecraftProfiles
              key={user.id}
              userId={user.id}
              username={displayUsername(user.user_metadata) ?? "Main account"}
            />
            <section className="rounded-2xl border border-[#a9cf9f]/25 bg-[#1b222c] p-6">
              <h2 className="text-xl font-bold">Your cloud save</h2>
              <p className="mt-3 text-sm text-white/60">
                {!cloudReady
                  ? "Checking cloud status…"
                  : cloud
                    ? "Last saved: " +
                      new Date(cloud.updated_at).toLocaleString()
                    : "No cloud save yet. Save this browser's progress to create one."}
              </p>
              <p className="mt-3 text-sm leading-6 text-white/50">
                Includes all progression, calculator settings and recommendation
                preferences for all your Minecraft accounts. Signing in
                automatically loads your cloud save and replaces this browser’s
                tracker progress. A browser backup is kept so you can undo the
                load. If there is no cloud save yet, your browser progress is
                kept for import. Changes then save automatically a few seconds
                after you stop editing. Wait for “Saved to cloud” before closing
                the site. Signing out does not erase browser progress.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  className={primaryClass}
                  disabled={busy || !cloudReady}
                  onClick={saveCloud}
                >
                  {!cloud
                    ? "Import browser progress"
                    : sync.phase === "choose" || sync.phase === "conflict"
                      ? "Keep browser progress"
                      : "Save to cloud"}
                </button>
                <button
                  className={buttonClass}
                  disabled={busy || !cloudReady || !cloud}
                  onClick={loadCloud}
                >
                  {sync.phase === "choose" || sync.phase === "conflict"
                    ? "Use cloud progress"
                    : "Load cloud save"}
                </button>
                <button
                  className={buttonClass}
                  disabled={busy}
                  onClick={() => {
                    setError("");
                    setRefresh((value) => value + 1);
                  }}
                >
                  Refresh cloud status
                </button>
              </div>
              {backup && (
                <button
                  className={"mt-4 " + buttonClass}
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      if (
                        !window.confirm(
                          "Restore the browser progress saved before your last cloud load?",
                        )
                      )
                        return;
                      sync.unlink();
                      restorePreviousBrowserSave(localStorage);
                      setNotice(
                        "Previous browser save restored. Your cloud save has not changed.",
                      );
                      window.location.reload();
                    })
                  }
                >
                  Undo last cloud load
                </button>
              )}
            </section>
          </div>
        ) : (
          <section className="mt-6 rounded-2xl border border-white/10 bg-[#1b222c] p-6">
            <h2 className="text-xl font-semibold">
              Welcome to T5 Mission Control
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/55">
              Sign in with Discord to load your cloud-saved progress
              automatically and track your Minecraft accounts. Existing cloud
              progress replaces this browser’s tracker data, with a local backup
              kept for undo.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => discordLogin()}
              className="mt-5 flex w-full items-center justify-center rounded-xl bg-[#5865f2] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#4752c4] disabled:opacity-40"
            >
              {busy ? "Connecting…" : "Continue with Discord"}
            </button>
            <p className="mt-3 text-center text-xs text-white/40">
              No separate T5MC password needed.
            </p>
          </section>
        )}
        <Link
          href="/"
          className="mt-6 inline-block text-sm text-[#a9cf9f] hover:underline"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
