// Přepínač z několika voleb (segmentovaná tlačítka).

interface PillProps<T extends string | number> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}

export function Pill<T extends string | number>({ value, options, onChange, label }: PillProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-xl border border-line bg-surface-2 p-1 gap-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`min-w-11 h-11 px-4 rounded-lg font-semibold tabular transition-colors ${
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
