"use client";

type CalculatorTheme = "mining" | "combat";
type SelectOption = string | { value: string; label: string };

// Keep complete utility classes so Tailwind can detect both calculator themes.
const THEMES = {
  mining: {
    number: "w-full rounded-xl border border-[#505b67] bg-[#171d25] px-3 py-3 pr-12 text-sm font-semibold text-white outline-none transition focus:border-[#74c3ba]",
    select: "mt-2 w-full rounded-xl border border-[#505b67] bg-[#171d25] px-3 py-3 text-sm font-semibold text-white outline-none transition focus:border-[#74c3ba]",
    selectLabel: "block",
    enabledCard: "border-[#74c3ba] bg-[#203631]",
    enabledTrack: "bg-[#74c3ba]",
  },
  combat: {
    number: "w-full rounded-xl border border-[#505b67] bg-[#171d25] px-3 py-3 pr-16 text-sm font-semibold text-white outline-none transition focus:border-[#d69868]",
    select: "mt-2 w-full rounded-xl border border-[#505b67] bg-[#171d25] px-3 py-3 text-sm font-semibold text-white outline-none transition focus:border-[#d69868]",
    selectLabel: "block min-w-0",
    enabledCard: "border-[#d69868] bg-[#34251f]",
    enabledTrack: "bg-[#d69868]",
  },
} satisfies Record<CalculatorTheme, Record<string, string>>;

type NumberInputProps = {
  label: string;
  suffix?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  theme?: CalculatorTheme;
};

export function NumberInput({
  label,
  suffix,
  value,
  min,
  max,
  step,
  onChange,
  theme = "mining",
}: NumberInputProps) {
  return (
    <label className="block min-w-0">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
        {label}
      </span>
      <div className="relative mt-2">
        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          max={max}
          step={step}
          onChange={(event) => {
            const parsed = Number(event.target.value);
            onChange(Number.isFinite(parsed) ? parsed : 0);
          }}
          className={THEMES[theme].number}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-white/40">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

type SelectInputProps = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  theme?: CalculatorTheme;
};

export function SelectInput({ label, value, options, onChange, theme = "mining" }: SelectInputProps) {
  return (
    <label className={THEMES[theme].selectLabel}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
        {label}
      </span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={THEMES[theme].select}>
        {options.map((option) => {
          const optionValue = typeof option === "string" ? option : option.value;
          const optionLabel = typeof option === "string" ? option : option.label;

          return <option key={optionValue} value={optionValue}>{optionLabel}</option>;
        })}
      </select>
    </label>
  );
}

type ToggleCardProps = {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  theme?: CalculatorTheme;
};

export function ToggleCard({ label, description, enabled, onToggle, theme = "mining" }: ToggleCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex min-h-[74px] items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition ${enabled ? THEMES[theme].enabledCard : "border-[#505b67] bg-[#171d25]"}`}
    >
      <div>
        <p className="text-sm font-bold">{label}</p>
        <p className="mt-1 text-xs text-white/45">{description}</p>
      </div>
      <div className={`relative h-6 w-11 shrink-0 rounded-full transition ${enabled ? THEMES[theme].enabledTrack : "bg-[#3b444e]"}`}>
        <div className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${enabled ? "left-6" : "left-1"}`} />
      </div>
    </button>
  );
}
