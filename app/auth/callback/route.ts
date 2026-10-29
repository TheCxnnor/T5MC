import { NextResponse } from "next/server";
import { getServerSupabase } from "../../../lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  // Discord sign-in and identity linking always return to the account page.
  if (code) {
    try {
      const supabase = await getServerSupabase();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL("/account", url.origin));
    } catch {
      // Return an actionable message without exposing tokens or provider internals.
    }
  }
  return NextResponse.redirect(new URL("/account?authError=1", url.origin));
}
