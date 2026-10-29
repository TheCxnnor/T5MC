"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase/client";

export default function AdminAccessLink({ userId }: { userId: string }) {
  const [access, setAccess] = useState<{
    userId: string;
    allowed: boolean;
  } | null>(null);
  useEffect(() => {
    let active = true;
    void getSupabase()
      .rpc("is_site_admin")
      .then(
        ({ data, error }) => {
          if (active) setAccess({ userId, allowed: !error && data === true });
        },
        () => {
          if (active) setAccess({ userId, allowed: false });
        },
      );
    return () => {
      active = false;
    };
  }, [userId]);
  if (access?.userId !== userId || !access.allowed) return null;
  return (
    <Link
      href="/admin"
      className="block border-t border-white/10 px-4 py-3 text-xs font-semibold text-amber-200 hover:bg-white/5"
    >
      Admin · Player trackers
    </Link>
  );
}
