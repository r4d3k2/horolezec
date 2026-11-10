// Přepínač tématu: ☀️ Jasný den / 📜 Tisk 1955 / 🌙 Bivak v noci.

import { THEME_LABELS, UI } from "../data/texts";
import { THEMES, type ThemeId } from "../lib/storage";

interface Props {
  theme: ThemeId;
  onChange: (t: ThemeId) => void;
}

export function ThemeSwitcher({ theme, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label={UI.theme} className="inline-flex rounded-xl border border-line bg-surface-2 p-0.5">
      {THEMES.map((t) => {
        const active = t === theme;
        return (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={THEME_LABELS[t].name}
            title={THEME_LABELS[t].name}
            onClick={() => onChange(t)}
            className={`w-10 h-10 rounded-lg text-lg leading-none flex items-center justify-center ${active ? "bg-surface shadow-sm" : "opacity-70"}`}
          >
            <span aria-hidden="true">{THEME_LABELS[t].icon}</span>
          </button>
        );
      })}
    </div>
  );
}

export default ThemeSwitcher;
