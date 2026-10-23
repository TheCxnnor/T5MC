import type { ReactNode } from "react";

type StatProps = { label: string; value: string };

type OverviewStatProps = StatProps & {
  description: string;
  variant?: "standard" | "plain" | "rank";
  stars?: ReactNode;
};

export function OverviewStat({
  label,
  value,
  description,
  variant = "standard",
  stars,
}: OverviewStatProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/10 p-4">
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
        {label}
      </p>
      {(variant !== "rank" || value) ? (
        <p className={variant === "plain" ? "mt-2 text-xl font-bold" : "mt-2 break-words text-xl font-bold"}>
          {value}
        </p>
      ) : null}
      {variant === "rank" && stars && <div className="mt-2">{stars}</div>}
      <p className={variant === "rank" ? "mt-2 text-xs text-white/30" : "mt-1 text-xs text-white/30"}>
        {description}
      </p>
    </div>
  );
}

export function StatBox({ label, value, wrapValue = false }: StatProps & { wrapValue?: boolean }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#171d25] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
        {label}
      </p>
      <p className={wrapValue ? "mt-2 break-words text-xl font-bold" : "mt-2 text-xl font-bold"}>
        {value}
      </p>
    </div>
  );
}

export function MiniStat({ label, value, wrapValue = false }: StatProps & { wrapValue?: boolean }) {
  return (
    <div className={wrapValue ? "min-w-0 rounded-lg bg-black/10 p-3" : "min-w-0 rounded-xl bg-black/10 p-3"}>
      <p className={wrapValue ? "text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35" : "truncate text-[9px] font-semibold uppercase tracking-[0.12em] text-white/35"}>
        {label}
      </p>
      <p className={wrapValue ? "mt-1 break-words text-sm font-bold" : "mt-1 truncate text-sm font-bold"}>
        {value}
      </p>
    </div>
  );
}

export function RecommendationStat({ label, value }: StatProps) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-black/10 p-4">
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/40">
        {label}
      </p>
      <p className="mt-2 break-words text-lg font-bold">{value}</p>
    </div>
  );
}
