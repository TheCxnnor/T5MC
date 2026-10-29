import { NextResponse } from "next/server";
import { getServerSupabase } from "../../../lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  // Only permit these local destinations; never redirect to an arbitrary query URL.
  const next =
    url.searchParams.get("next") === "/account/reset-password"
      ? "/account/reset-password"
      : "/account";
  if (code) {
    try {
      const supabase = await getServerSupabase();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(next, url.origin));
    } catch {
      // Return an actionable message without exposing tokens or provider internals.
    }
  }
  return NextResponse.redirect(new URL("/account?authError=1", url.origin));
}
