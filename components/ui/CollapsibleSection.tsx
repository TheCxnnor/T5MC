"use client";

import type { ReactNode } from "react";

type CollapsibleSectionProps = {
  eyebrow: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  borderClass: string;
  backgroundClass: string;
  accentClass: string;
  buttonClass: string;
  contentClassName?: string;
  children: ReactNode;
};

export function CollapsibleSection({
  eyebrow,
  title,
  open,
  onToggle,
  borderClass,
  backgroundClass,
  accentClass,
  buttonClass,
  contentClassName = "border-t border-white/10 p-5 md:p-6",
  children,
}: CollapsibleSectionProps) {
  return (
    <section className={`mb-6 overflow-hidden rounded-2xl border ${borderClass} ${backgroundClass}`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left md:px-6"
      >
        <div>
          <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${accentClass}`}>
            {eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-bold">{title}</h2>
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl font-bold ${buttonClass}`}>
          {open ? "−" : "+"}
        </span>
      </button>
      {open && <div className={contentClassName}>{children}</div>}
    </section>
  );
}

type GroupSectionProps = {
  eyebrow: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  completed: number;
  total: number;
  onToggleAll: () => void;
  border: string;
  background: string;
  accent: string;
  badge: string;
  button: string;
  checkbox: string;
  checkboxClassName?: string;
  uncheckedClassName?: string;
  children: ReactNode;
};

export function GroupSection({
  eyebrow,
  title,
  open,
  onToggle,
  completed,
  total,
  onToggleAll,
  border,
  background,
  accent,
  badge,
  button,
  checkbox,
  checkboxClassName = "flex h-8 w-8 items-center justify-center rounded-md border text-sm font-bold",
  uncheckedClassName = "border-white/20 bg-black/10 text-transparent",
  children,
}: GroupSectionProps) {
  const allComplete = completed === total;

  return (
    <section className={`mb-6 overflow-hidden rounded-2xl border ${border} ${background}`}>
      <div className="flex items-center justify-between gap-4 px-5 py-5 md:px-6">
        <button type="button" onClick={onToggle} className="min-w-0 flex-1 text-left">
          <p className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${accent}`}>
            {eyebrow}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold">{title}</h2>
            <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${badge}`}>
              {completed} / {total}
            </span>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={onToggleAll}
            className={`${checkboxClassName} ${allComplete ? `${checkbox} border-transparent` : uncheckedClassName}`}
          >
            ✓
          </button>
          <button
            type="button"
            onClick={onToggle}
            className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold ${button}`}
          >
            {open ? "−" : "+"}
          </button>
        </div>
      </div>
      {open && <div className="border-t border-white/10 p-4 md:p-5">{children}</div>}
    </section>
  );
}
