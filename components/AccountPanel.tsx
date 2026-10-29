"use client";

import Link from "next/link";
import MinecraftProfiles from "./MinecraftProfiles";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { displayUsername, validateUsername } from "../lib/username";
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

type Mode = "login" | "signup" | "forgot";
type CloudInfo = { version: number; updated_at: string };
const inputClass =
  "mt-2 w-full rounded-xl border border-white/15 bg-[#151b24] px-3 py-3 text-white outline-none focus:border-[#a9cf9f]";
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

export default function AccountPanel({
  resetPassword = false,
}: {
  resetPassword?: boolean;
}) {
  const sync = useCloudAutoSave();
  const configured = accountConfigured();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(configured);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const userId = user?.id;
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
            "Sign-in could not be completed. Try again in the same browser where you started, or request a fresh password reset link if you were resetting your password.",
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
      const supabase = getSupabase();
      if (resetPassword) {
        if (!user)
          throw new Error(
            "Open the password reset link from your email first.",
          );
        if (password !== confirmPassword)
          throw new Error("The passwords do not match.");
        const { error: authError } = await supabase.auth.updateUser({
          password,
        });
        if (authError) throw authError;
        setPassword("");
        setConfirmPassword("");
        router.replace("/account");
      } else if (mode === "forgot") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo:
              window.location.origin +
              "/auth/callback?next=/account/reset-password",
          },
        );
        if (authError) throw authError;
        setNotice(
          "If an account exists for that email, a password reset link will arrive shortly.",
        );
      } else if (mode === "signup") {
        if (password !== confirmPassword)
          throw new Error("The passwords do not match.");
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin + "/auth/callback",
            data: { username: validateUsername(signupUsername) },
          },
        });
        if (authError) throw authError;
        setPassword("");
        setConfirmPassword("");
        setNotice(
          data.session
            ? "Your account is ready."
            : "Check your email to confirm your account, then return here to sign in.",
        );
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) throw authError;
        setPassword("");
        setNotice(
          "Signed in. Choose whether to save this browser's progress or load your cloud save.",
        );
      }
    });
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
      const options = { redirectTo: window.location.origin + "/auth/callback" };
      const result = connect
        ? await supabase.auth.linkIdentity({ provider: "discord", options })
        : await supabase.auth.signInWithOAuth({ provider: "discord", options });
      if (result.error) {
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
      <div
        className={
          user && !resetPassword ? "mx-auto max-w-4xl" : "mx-auto max-w-lg"
        }
      >
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a9cf9f]">
          Your account
        </p>
        <h1 className="mt-2 text-3xl font-bold">
          {resetPassword ? "Choose a new password" : "Account & Cloud Saves"}
        </h1>
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
        ) : user && !resetPassword ? (
          <div className="mt-6 space-y-5">
            <section className="rounded-2xl border border-white/10 bg-[#1b222c] p-6">
              <p className="text-xs uppercase tracking-wider text-white/40">
                Signed in as
              </p>
              <p className="mt-2 break-all font-semibold">
                {displayUsername(user.user_metadata) ?? "Choose a username"}
              </p>
              <p className="mt-1 break-all text-sm text-white/50">
                {user.email}
              </p>
              <form
                className="mt-5 max-w-md"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = new FormData(event.currentTarget);
                  void run(async () => {
                    const username = validateUsername(
                      String(form.get("username") ?? ""),
                    );
                    await verifiedUser();
                    const { data, error: profileError } =
                      await getSupabase().auth.updateUser({
                        data: { username },
                      });
                    if (profileError) throw profileError;
                    setUser(data.user);
                    setNotice("Username updated.");
                  });
                }}
              >
                <label
                  className="block text-sm text-white/70"
                  htmlFor="account-username"
                >
                  Username
                </label>
                <input
                  key={
                    user.id + ":" + (displayUsername(user.user_metadata) ?? "")
                  }
                  id="account-username"
                  name="username"
                  className={inputClass}
                  defaultValue={displayUsername(user.user_metadata) ?? ""}
                  autoComplete="nickname"
                  minLength={3}
                  maxLength={24}
                  required
                  disabled={busy}
                  spellCheck={false}
                  autoCapitalize="none"
                  aria-describedby="username-help"
                />
                <p
                  id="username-help"
                  className="mt-2 text-xs leading-5 text-white/40"
                >
                  3–24 letters, numbers, underscores or hyphens. This is a
                  display name; sign in with Discord or your email address.
                </p>
                <button
                  type="submit"
                  disabled={busy}
                  className={"mt-3 " + primaryClass}
                >
                  Save username
                </button>
              </form>
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
                {user.identities?.some(
                  (identity) => identity.provider === "email",
                ) && (
                  <button
                    className={buttonClass}
                    disabled={busy}
                    onClick={() => {
                      setMode("forgot");
                      setEmail(user.email ?? "");
                      run(async () => {
                        const { error: authError } =
                          await getSupabase().auth.resetPasswordForEmail(
                            user.email ?? "",
                            {
                              redirectTo:
                                window.location.origin +
                                "/auth/callback?next=/account/reset-password",
                            },
                          );
                        if (authError) throw authError;
                        setNotice(
                          "Check your email for a password reset link.",
                        );
                      });
                    }}
                  >
                    Reset password
                  </button>
                )}
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
                preferences for all your Minecraft accounts. After choosing your
                browser or cloud save, changes save automatically a few seconds
                after you stop editing. Wait for “Saved to cloud” before closing
                the site. On another device, use Load cloud save to restore your
                latest progress. Signing in or out does not replace this
                browser’s progress.
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
          <section className="mt-6 max-w-lg rounded-2xl border border-white/10 bg-[#1b222c] p-6">
            {!resetPassword && mode !== "forgot" && (
              <div className="mb-6">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => discordLogin()}
                  className="flex w-full items-center justify-center rounded-xl bg-[#5865f2] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#4752c4] disabled:opacity-40"
                >
                  Continue with Discord
                </button>
                <p className="mt-2 text-center text-xs leading-5 text-white/45">
                  No separate T5MC password needed.
                </p>
                <p className="mt-4 border-t border-white/10 pt-4 text-center text-xs text-white/35">
                  Or use email
                </p>
              </div>
            )}
            {!resetPassword && (
              <div className="mb-6 flex gap-2">
                {(["login", "signup"] as const).map((value) => (
                  <button
                    key={value}
                    disabled={busy}
                    className={mode === value ? primaryClass : buttonClass}
                    onClick={() => {
                      setMode(value);
                      setError("");
                      setNotice("");
                      setPassword("");
                      setConfirmPassword("");
                    }}
                  >
                    {value === "login" ? "Log in" : "Create account"}
                  </button>
                ))}
              </div>
            )}
            {resetPassword && !user ? (
              <p className="text-sm leading-6 text-white/65">
                Open your password reset email link first.{" "}
                <Link className="text-[#a9cf9f] underline" href="/account">
                  Return to login
                </Link>{" "}
                to request a new link.
              </p>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <h2 className="text-xl font-semibold">
                  {resetPassword
                    ? "New password"
                    : mode === "forgot"
                      ? "Reset your password"
                      : mode === "signup"
                        ? "Create your T5MC account"
                        : "Welcome back"}
                </h2>
                {!resetPassword && mode === "signup" && (
                  <label className="block text-sm text-white/70">
                    Username
                    <input
                      className={inputClass}
                      autoComplete="nickname"
                      value={signupUsername}
                      onChange={(event) =>
                        setSignupUsername(event.target.value)
                      }
                      minLength={3}
                      maxLength={24}
                      required
                      disabled={busy}
                      spellCheck={false}
                      autoCapitalize="none"
                      aria-describedby="signup-username-help"
                    />
                    <span
                      id="signup-username-help"
                      className="mt-2 block text-xs text-white/40"
                    >
                      3–24 letters, numbers, underscores or hyphens.
                    </span>
                  </label>
                )}
                {!resetPassword && (
                  <label className="block text-sm text-white/70">
                    Email address
                    <input
                      className={inputClass}
                      type="email"
                      autoComplete="email"
                      required
                      maxLength={254}
                      disabled={busy}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </label>
                )}
                {(resetPassword || mode !== "forgot") && (
                  <label className="block text-sm text-white/70">
                    {resetPassword ? "New password" : "Password"}
                    <input
                      className={inputClass}
                      type="password"
                      autoComplete={
                        resetPassword || mode === "signup"
                          ? "new-password"
                          : "current-password"
                      }
                      minLength={resetPassword || mode === "signup" ? 8 : 1}
                      maxLength={128}
                      required
                      disabled={busy}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </label>
                )}
                {(resetPassword || mode === "signup") && (
                  <label className="block text-sm text-white/70">
                    Confirm password
                    <input
                      className={inputClass}
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      maxLength={128}
                      disabled={busy}
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                    />
                    <span className="mt-2 block text-xs text-white/40">
                      Use at least 8 characters.
                    </span>
                  </label>
                )}
                <button className={primaryClass} type="submit" disabled={busy}>
                  {busy
                    ? "Please wait…"
                    : resetPassword
                      ? "Update password"
                      : mode === "forgot"
                        ? "Send reset link"
                        : mode === "signup"
                          ? "Create account"
                          : "Log in"}
                </button>
                {!resetPassword && mode === "login" && (
                  <button
                    className="block text-sm text-[#a9cf9f] underline"
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setMode("forgot");
                      setError("");
                      setNotice("");
                      setPassword("");
                    }}
                  >
                    Forgot password?
                  </button>
                )}
              </form>
            )}
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
