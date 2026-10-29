"use client";

import { useState } from "react";
import {
  adminProfiles,
  savedObject,
  trackerCores,
  trackerGroups,
} from "../lib/adminTracker";
import MinecraftAvatar from "./MinecraftAvatar";

export type AdminSave = {
  user_id: string;
  username: string;
  updated_at: string;
  version: number;
  progress: unknown;
};

export default function AdminTrackerSnapshot({ save }: { save: AdminSave }) {
  // The parent validates this before rendering; this component only reads the snapshot in memory.
  const directory = adminProfiles(save.progress, save.user_id, save.username);
  const [profileId, setProfileId] = useState(directory.activeId);
  const profile =
    directory.profiles.find((item) => item.id === profileId) ??
    directory.profiles[0];
  const groups = trackerGroups(profile.progress);
  const cores = trackerCores(profile.progress);
  return (
    <section className="min-w-0 space-y-4">
      <div className="rounded-2xl border border-amber-200/30 bg-amber-200/5 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-amber-200">
          Read-only admin view
        </p>
        <h2 className="mt-2 break-words text-2xl font-bold">{save.username}</h2>
        <p className="mt-2 break-all text-xs text-white/40">{save.user_id}</p>
        <p className="mt-2 text-xs text-white/60">
          Cloud save: {new Date(save.updated_at).toLocaleString()} · Version{" "}
          {save.version}
        </p>
        <p className="mt-2 text-xs leading-5 text-white/50">
          You are viewing this player’s saved data. Your own trackers are
          unchanged. Unsynced browser changes are not visible here.
        </p>
        <label className="mt-4 block text-sm font-semibold">
          Minecraft account
          <select
            className="mt-2 block w-full rounded-lg border border-white/15 bg-[#151b24] p-3 text-sm"
            value={profile.id}
            onChange={(event) => setProfileId(event.target.value)}
          >
            {directory.profiles.map((item) => (
              <option key={item.id} value={item.id}>
                {item.username}
                {item.id === "main" ? " (Main)" : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-4 flex items-center gap-3">
          <MinecraftAvatar username={profile.username} size={36} />
          <p className="font-semibold">{profile.username}</p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => {
          const count = group.rows.filter((row) => row.completed).length;
          return (
            <div
              key={group.name}
              className="rounded-xl border border-white/10 bg-[#1b222c] p-4"
            >
              <p className="text-xs text-white/45">{group.name}</p>
              <p className="mt-2 text-xl font-bold">
                {count} / {group.rows.length}
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/20">
                <div
                  className="h-full bg-[#a9cf9f]"
                  style={{
                    width:
                      (group.rows.length
                        ? (count / group.rows.length) * 100
                        : 0) + "%",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {groups.map((group) => (
        <details
          key={group.name}
          className="rounded-xl border border-white/10 bg-[#1b222c]"
        >
          <summary className="cursor-pointer px-5 py-4 font-semibold">
            {group.name}
          </summary>
          <ul className="grid gap-x-6 border-t border-white/10 px-5 py-2 sm:grid-cols-2">
            {group.rows.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 border-b border-white/5 py-3 text-sm"
              >
                <span
                  className={row.completed ? "text-white/80" : "text-white/45"}
                >
                  {row.name}
                </span>
                <span
                  className={
                    "shrink-0 text-xs " +
                    (row.completed ? "text-[#a9cf9f]" : "text-white/35")
                  }
                >
                  {row.completed ? "Obtained" : "Remaining"}
                </span>
              </li>
            ))}
          </ul>
        </details>
      ))}
      <details className="rounded-xl border border-white/10 bg-[#1b222c]">
        <summary className="cursor-pointer px-5 py-4 font-semibold">
          Cores & Magma Storage
        </summary>
        <div className="border-t border-white/10 px-5 py-3">
          <p className="mb-3 text-sm">
            Magma Storage: <strong>{cores.magma.toLocaleString()}</strong>
          </p>
          {cores.rows.map((row) => (
            <div
              key={row.id}
              className="flex justify-between gap-4 border-t border-white/5 py-3 text-sm"
            >
              <span className="text-white/60">{row.name}</span>
              <span>
                {row.label}{" "}
                <span className="text-xs text-white/35">
                  ({row.level} / {row.max})
                </span>
              </span>
            </div>
          ))}
        </div>
      </details>
      {["profit", "pve", "recommendations"].map((source) => (
        <details
          key={source}
          className="rounded-xl border border-white/10 bg-[#1b222c]"
        >
          <summary className="cursor-pointer px-5 py-4 font-semibold">
            {source === "profit"
              ? "Mining calculator settings"
              : source === "pve"
                ? "PvE calculator settings"
                : "Recommendation settings"}
          </summary>
          <dl className="border-t border-white/10 px-5 py-3">
            {Object.entries(savedObject(profile.progress, source)).length ===
            0 ? (
              <div>
                <dt className="sr-only">Saved settings</dt>
                <dd className="text-sm text-white/40">No saved settings.</dd>
              </div>
            ) : (
              Object.entries(savedObject(profile.progress, source)).map(
                ([key, value]) => (
                  <div
                    key={key}
                    className="grid gap-2 border-b border-white/5 py-2 text-xs sm:grid-cols-2"
                  >
                    <dt className="break-words text-white/45">
                      {key.replace(/([A-Z])/g, " $1")}
                    </dt>
                    <dd className="break-words text-white/75">
                      {typeof value === "object"
                        ? JSON.stringify(value)
                        : String(value)}
                    </dd>
                  </div>
                ),
              )
            )}
          </dl>
        </details>
      ))}
    </section>
  );
}
