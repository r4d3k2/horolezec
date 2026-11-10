// Přepínač zapnuto/vypnuto s popiskem, vysvětlující větou a volitelnou značkou „výklad“.

import { UI } from "../data/texts";

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  text?: string;
  badge?: boolean;
}

export function Toggle({ checked, onChange, label, text, badge }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full flex items-start gap-3 text-left rounded-xl px-2 py-2 min-h-11 hover:bg-surface-2"
    >
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-ink">{label}</span>
          {badge ? (
            <span className="text-xs rounded-full border border-line px-2 py-0.5 text-ink-muted">{UI.interpretation}</span>
          ) : null}
        </span>
        {text ? <span className="block text-sm text-ink-soft leading-snug mt-0.5">{text}</span> : null}
      </span>
      <span
        aria-hidden="true"
        className="relative shrink-0 mt-0.5 w-12 h-7 rounded-full border border-line transition-colors"
        style={{ background: checked ? "var(--accent)" : "var(--surface-2)" }}
      >
        <span
          className="absolute top-0.5 w-6 h-6 rounded-full transition-all"
          style={{
            left: checked ? "calc(100% - 26px)" : "2px",
            background: checked ? "var(--accent-contrast)" : "var(--text-muted)",
          }}
        />
      </span>
    </button>
  );
}

export default Toggle;
