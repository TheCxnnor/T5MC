import type { ReactNode } from "react";

export function MaterialBox({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/10 p-3">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}
