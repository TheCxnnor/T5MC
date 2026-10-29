"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { accountConfigured, getSupabase } from "../lib/supabase/client";
import { adminProfiles } from "../lib/adminTracker";
import AdminTrackerSnapshot, { type AdminSave } from "./AdminTrackerSnapshot";
import MinecraftAvatar from "./MinecraftAvatar";

type Player = {
  user_id: string;
  username: string;
  updated_at: string;
  version: number;
  total_count: number;
};
type Listing = {
  key: string;
  owner: string;
  allowed: boolean;
  rows: Player[];
  error: string;
};
const button =
  "rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold hover:bg-white/5 disabled:opacity-40";

function message(error: unknown) {
  return error && typeof error === "object" && "message" in error
    ? String(error.message)
    : "Could not load player trackers.";
}
export default function AdminTrackers() {
  const [actor, setActor] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(!accountConfigured());
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [listing, setListing] = useState<Listing | null>(null);
  const [selected, setSelected] = useState<{
    owner: string;
    save: AdminSave;
  } | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [loadingSave, setLoadingSave] = useState(false);
  const [error, setError] = useState("");
  const request = useRef(0);
  const key = actor + ":" + JSON.stringify([search, offset, refresh]);
  useEffect(() => {
    if (!accountConfigured()) return;
    const {
      data: { subscription },
    } = getSupabase().auth.onAuthStateChange((_event, session) => {
      request.current++;
      setActor(session?.user.id ?? null);
      setAuthReady(true);
      setSelected(null);
      setLoadingSave(false);
      setError("");
    });
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!actor) return;
    let active = true;
    void (async () => {
      try {
        const supabase = getSupabase();
        const access = await supabase.rpc("is_site_admin");
        if (access.error) throw access.error;
        if (!access.data) {
          if (active)
            setListing({
              key,
              owner: actor,
              allowed: false,
              rows: [],
              error: "This site account is not an administrator.",
            });
          return;
        }
        const result = await supabase.rpc("admin_list_saves", {
          p_search: search,
          p_offset: offset,
        });
        if (result.error) throw result.error;
        if (active)
          setListing({
            key,
            owner: actor,
            allowed: true,
            rows: (result.data ?? []) as Player[],
            error: "",
          });
      } catch (reason) {
        if (active)
          setListing({
            key,
            owner: actor,
            allowed: false,
            rows: [],
            error: message(reason),
          });
      }
    })();
    return () => {
      active = false;
    };
  }, [actor, search, offset, key]);

  const current =
    listing?.key === key && listing.owner === actor ? listing : null;
  async function view(id: string) {
    if (!actor) return;
    const sequence = ++request.current;
    setError("");
    setLoadingSave(true);
    setSelectedId(id);
    setSelected(null);
    try {
      // Authorization is enforced inside this RPC on every request.
      const { data, error: dbError } = await getSupabase().rpc(
        "admin_get_save",
        { p_user_id: id },
      );
      if (dbError) throw dbError;
      const row = data?.[0] as AdminSave | undefined;
      if (!row) throw new Error("This player no longer has a cloud save.");
      adminProfiles(row.progress, row.user_id, row.username);
      if (request.current === sequence)
        setSelected({ owner: actor, save: row });
    } catch (reason) {
      if (request.current === sequence) setError(message(reason));
    } finally {
      if (request.current === sequence) setLoadingSave(false);
    }
  }
  return (
    <main className="min-h-screen px-4 py-8 text-white md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">
          Site administration
        </p>
        <h1 className="mt-2 text-3xl font-bold">Player trackers</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-white/50">
          Browse cloud-saved progress without changing the player’s data or your
          own trackers. Only players with a cloud save appear here.
        </p>
        <Link
          href="/account"
          className="mt-4 inline-block text-sm text-[#a9cf9f] hover:underline"
        >
          Back to your account
        </Link>
        {!authReady ? (
          <p role="status" className="mt-6 text-sm text-white/50">
            Checking account…
          </p>
        ) : !actor ? (
          <p className="mt-6 text-sm text-white/60">
            Sign in with your site admin account to continue.{" "}
            <Link href="/account" className="text-[#a9cf9f] underline">
              Log in
            </Link>
          </p>
        ) : (
          <>
            <form
              className="mt-6 flex flex-wrap gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                setSearch(draft.trim());
                setOffset(0);
                setRefresh((value) => value + 1);
              }}
            >
              <label className="sr-only" htmlFor="admin-player-search">
                Search by site username or user UID
              </label>
              <input
                id="admin-player-search"
                className="min-w-0 flex-1 rounded-xl border border-white/15 bg-[#1b222c] px-4 py-3 text-sm outline-none focus:border-amber-200/50"
                placeholder="Search site username or user UID"
                value={draft}
                maxLength={100}
                onChange={(event) => setDraft(event.target.value)}
              />
              <button className={button} type="submit">
                Search
              </button>
              <button
                className={button}
                type="button"
                onClick={() => setRefresh((value) => value + 1)}
              >
                Refresh list
              </button>
            </form>
            {!current ? (
              <p role="status" className="mt-6 text-sm text-white/50">
                Checking admin access and loading cloud saves…
              </p>
            ) : !current.allowed ? (
              <p
                role="alert"
                className="mt-6 rounded-xl border border-red-200/20 bg-red-200/5 p-4 text-sm text-red-200"
              >
                {current.error} If setup is incomplete, run supabase/admin.sql
                and assign your user UID.
              </p>
            ) : (
              <div className="mt-6 grid items-start gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
                <aside className="min-w-0 rounded-2xl border border-white/10 bg-[#1b222c] p-3">
                  <p className="px-2 py-2 text-xs text-white/40">
                    {current.rows[0]?.total_count ?? 0} matching cloud saves
                  </p>
                  {!current.rows.length && (
                    <p className="p-3 text-sm text-white/50">
                      No matching saved players.
                    </p>
                  )}
                  <ul className="space-y-2">
                    {current.rows.map((player) => (
                      <li key={player.user_id}>
                        <button
                          onClick={() => view(player.user_id)}
                          className={`w-full rounded-xl border p-3 text-left transition hover:bg-white/5 ${selectedId === player.user_id ? "border-amber-200/40 bg-amber-200/5" : "border-white/5"}`}
                        >
                          <span className="flex items-center gap-3">
                            <MinecraftAvatar username={player.username} />
                            <span className="min-w-0 truncate text-sm font-semibold">
                              {player.username}
                            </span>
                          </span>
                          <span className="mt-2 block break-all text-[10px] text-white/30">
                            {player.user_id}
                          </span>
                          <span className="mt-1 block text-[10px] text-white/40">
                            {new Date(player.updated_at).toLocaleString()}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 flex justify-between gap-2">
                    <button
                      className={button}
                      disabled={offset === 0}
                      onClick={() =>
                        setOffset((value) => Math.max(0, value - 50))
                      }
                    >
                      Previous
                    </button>
                    <button
                      className={button}
                      disabled={
                        current.rows.length < 50 ||
                        offset + 50 >= Number(current.rows[0]?.total_count ?? 0)
                      }
                      onClick={() => setOffset((value) => value + 50)}
                    >
                      Next
                    </button>
                  </div>
                </aside>
                <div className="min-w-0">
                  {error && (
                    <p
                      role="alert"
                      className="mb-4 rounded-xl border border-red-200/20 p-4 text-sm text-red-200"
                    >
                      {error}
                    </p>
                  )}
                  {loadingSave ? (
                    <p role="status" className="p-5 text-sm text-white/50">
                      Loading saved tracker…
                    </p>
                  ) : selected?.owner === actor ? (
                    <>
                      <div className="mb-3 flex justify-end">
                        <button
                          className={button}
                          onClick={() => view(selected.save.user_id)}
                        >
                          Refresh tracker
                        </button>
                      </div>
                      <AdminTrackerSnapshot
                        key={
                          selected.save.user_id + ":" + selected.save.version
                        }
                        save={selected.save}
                      />
                    </>
                  ) : (
                    <p className="rounded-2xl border border-dashed border-white/15 p-8 text-sm text-white/40">
                      Select a player to view their Minecraft profiles and
                      trackers.
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
