"use client";

import Link from "next/link";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AutoSave,
  type Binding,
  type SaveReceipt,
  type SyncState,
} from "../lib/autoSave";
import {
  captureProgress,
  restoreProgress,
  assertSnapshotOwner,
  PROFILE_KEY,
  readProfileDirectory,
  type ProgressSnapshot,
} from "../lib/cloudProgress";
import { readCloud, writeCloud } from "../lib/cloudApi";
import { accountConfigured, getSupabase } from "../lib/supabase/client";

const KEY = "t5-cloud-auto-save-binding";
const PAUSE_RESTORE_KEY = "t5-cloud-auto-load-paused";
const SIGNIN_KEY = "t5-cloud-load-on-signin";
type SyncContext = SyncState & {
  pause(): Promise<void>;
  resume(): void;
  link(receipt: SaveReceipt, snapshot: ProgressSnapshot): void;
  unlink(): void;
};
const Context = createContext<SyncContext | null>(null);
export function useCloudAutoSave() {
  const value = useContext(Context);
  if (!value) throw new Error("CloudAutoSave must wrap the application.");
  return value;
}
export default function CloudAutoSave({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SyncState>({
    phase: "guest",
    message: "Saved on this device",
    receipt: null,
  });
  const engineRef = useRef<AutoSave | null>(null);
  const ownerRef = useRef<string | null>(null);
  useEffect(() => {
    if (!accountConfigured()) return;
    let active = true;
    const engine = new AutoSave({
      capture: () => {
        const snapshot = captureProgress(localStorage);
        if (ownerRef.current) assertSnapshotOwner(snapshot, ownerRef.current);
        return snapshot;
      },
      restore: (snapshot) => restoreProgress(localStorage, snapshot),
      reload: () => window.location.reload(),
      binding: () => {
        try {
          const value = JSON.parse(
            localStorage.getItem(KEY) ?? "null",
          ) as Binding | null;
          return value &&
            typeof value.userId === "string" &&
            typeof value.version === "number" &&
            typeof value.fingerprint === "string"
            ? value
            : null;
        } catch {
          return null;
        }
      },
      store: (binding) => {
        if (binding) localStorage.setItem(KEY, JSON.stringify(binding));
        else localStorage.removeItem(KEY);
        localStorage.removeItem(PAUSE_RESTORE_KEY);
        sessionStorage.removeItem(SIGNIN_KEY);
      },
      read: readCloud,
      write: writeCloud,
      notify: (value) => {
        if (active) setState(value);
      },
      now: () => Date.now(),
      online: () => navigator.onLine,
    });
    engineRef.current = engine;
    const initialize = (id: string | null) => {
      let signIn = false,
        pauseRestore = false;
      try {
        signIn = sessionStorage.getItem(SIGNIN_KEY) === "1";
        pauseRestore = localStorage.getItem(PAUSE_RESTORE_KEY) === id;
      } catch {
        /* A missing marker still permits a first-login cloud restore. */
      }
      return engine.initialize(id, { signIn, pauseRestore });
    };
    const supabase = getSupabase();
    let initialized = false;
    const changeOwner = (id: string | null) => {
      if (!active || (initialized && id === ownerRef.current)) return;
      initialized = true;
      ownerRef.current = id;
      // Never call another auth method inside onAuthStateChange's auth lock.
      queueMicrotask(() => {
        if (active && ownerRef.current === id) void initialize(id);
      });
    };
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) =>
      changeOwner(session?.user.id ?? null),
    );
    const interval = window.setInterval(() => {
      void engine.tick();
    }, 750);
    const retry = () => {
      if (active) void initialize(ownerRef.current);
    };
    const marker = () => {
      try {
        const directory = readProfileDirectory(localStorage);
        return directory ? directory.ownerId + ":" + directory.activeId : "";
      } catch {
        return "";
      }
    };
    let profileMarker = marker();
    const localProfiles = () => {
      profileMarker = marker();
    };
    const changedProfiles = (event: StorageEvent) => {
      if (event.key !== PROFILE_KEY) return;
      if (marker() !== profileMarker) {
        engine.stop();
        window.location.reload();
      }
    };
    window.addEventListener("storage", changedProfiles);
    window.addEventListener("t5-profiles-changed", localProfiles);
    window.addEventListener("online", retry);
    return () => {
      active = false;
      engine.stop();
      subscription.unsubscribe();
      clearInterval(interval);
      window.removeEventListener("online", retry);
      window.removeEventListener("storage", changedProfiles);
      window.removeEventListener("t5-profiles-changed", localProfiles);
      if (engineRef.current === engine) engineRef.current = null;
    };
  }, []);
  const retry = () => {
    const id = ownerRef.current;
    void engineRef.current?.initialize(id, {
      signIn: sessionStorage.getItem(SIGNIN_KEY) === "1",
      pauseRestore: localStorage.getItem(PAUSE_RESTORE_KEY) === id,
    });
  };
  return (
    <Context.Provider
      value={{
        ...state,
        pause: async () => {
          await engineRef.current?.pause();
        },
        resume: () => engineRef.current?.resume(),
        link: (receipt, snapshot) => engineRef.current?.link(receipt, snapshot),
        unlink: () => {
          // Undo/start-fresh are deliberate local choices. Do not auto-restore
          // over them on the following page reload.
          const owner = ownerRef.current;
          engineRef.current?.unlink();
          if (owner) localStorage.setItem(PAUSE_RESTORE_KEY, owner);
        },
      }}
    >
      {children}
      {state.phase !== "guest" && (
        <aside
          aria-label="Cloud save status"
          className="fixed bottom-3 right-3 z-50 max-w-xs rounded-xl border border-white/15 bg-[#1b222c] px-4 py-3 text-xs shadow-xl"
        >
          <p
            role="status"
            className={
              state.phase === "error" ||
              state.phase === "conflict" ||
              state.phase === "choose"
                ? "text-amber-200"
                : "text-[#c7e4c0]"
            }
          >
            {state.message}
          </p>
          {["choose", "conflict", "error"].includes(state.phase) && (
            <div className="mt-2 flex gap-4">
              <Link className="text-[#a9cf9f] underline" href="/account">
                Review saves
              </Link>
              {state.phase === "error" && (
                <button
                  type="button"
                  className="text-white/70 underline"
                  onClick={retry}
                >
                  Retry sync
                </button>
              )}
            </div>
          )}
        </aside>
      )}
    </Context.Provider>
  );
}
