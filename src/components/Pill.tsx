// Přepínač z několika voleb (segmentovaná tlačítka).

interface PillProps<T extends string | number> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
  /** Přes celou šířku, volby se dělí rovným dílem (menu). */
  full?: boolean;
}

export function Pill<T extends string | number>({ value, options, onChange, label, full }: PillProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className={`${full ? "flex w-full" : "inline-flex"} rounded-xl border border-line bg-surface-2 p-1 gap-1`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`min-w-11 h-11 ${full ? "flex-1 px-1.5" : "px-4"} rounded-lg font-semibold tabular transition-colors ${
              active ? "bg-accent text-accent-contrast" : "text-ink-soft hover:bg-surface"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default Pill;
