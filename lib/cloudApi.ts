import { assertSnapshotOwner } from "./cloudProgress";
import { createClient } from "@supabase/supabase-js";
import { getSupabase } from "./supabase/client";
import { validateSnapshot, type ProgressSnapshot } from "./cloudProgress";
import type { CloudRecord, SaveReceipt } from "./autoSave";

// Pin each request to the chosen account's token, even if another tab signs in mid-request.
async function clientFor(userId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session || data.session.user.id !== userId)
    throw new Error(
      "Your account changed or your session expired. Sign in again.",
    );
  const token = data.session.access_token;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      accessToken: async () => token,
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, signal: AbortSignal.timeout(15000) }),
      },
    },
  );
}
export async function readCloud(userId: string): Promise<CloudRecord | null> {
  const client = await clientFor(userId);
  const { data, error } = await client
    .from("player_saves")
    .select("progress,version,updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const progress = validateSnapshot(data.progress);
  assertSnapshotOwner(progress, userId);
  return {
    userId,
    version: data.version,
    updated_at: data.updated_at,
    progress,
  };
}
export async function writeCloud(
  userId: string,
  snapshot: ProgressSnapshot,
  version: number,
): Promise<SaveReceipt> {
  assertSnapshotOwner(snapshot, userId);
  const client = await clientFor(userId);
  const { data, error } = await client.rpc("save_player_progress", {
    p_progress: validateSnapshot(snapshot),
    p_expected_version: version,
  });
  if (error) throw error;
  if (!data?.[0])
    throw new Error(
      "The cloud save was not confirmed. Refresh cloud status before retrying.",
    );
  return { userId, version: data[0].version, updated_at: data[0].updated_at };
}
