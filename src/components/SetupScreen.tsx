// Fáze 1: jednoduché nastavení – 2–4 lidé na jednom zařízení, jména, barvy, výchozí pravidla.

import { useState } from "react";
import { CLIMBER_COLORS, type ClimberColor } from "../data/board";
import { UI } from "../data/texts";
import type { GameSetup, SeatSetup } from "../lib/engine";
import { DEFAULT_RULES } from "../lib/rules";
import { Pill } from "./Pill";

const COLOR_LABEL: Record<ClimberColor, string> = {
  red: "červená",
  blue: "modrá",
  yellow: "žlutá",
  green: "zelená",
};

function defaultSeats(): SeatSetup[] {
  return CLIMBER_COLORS.map((color, i) => ({ name: `Hráč ${i + 1}`, color, kind: "human" }));
}

interface Props {
  initial?: GameSetup | null;
  onStart: (setup: GameSetup) => void;
}

export function SetupScreen({ initial, onStart }: Props) {
  const [count, setCount] = useState<number>(initial?.seats.length ?? 2);
  const [seats, setSeats] = useState<SeatSetup[]>(() => {
    const base = defaultSeats();
    initial?.seats.forEach((s, i) => { base[i] = { ...s, kind: "human" }; });
    // barvy bez duplicit
    const used = new Set<ClimberColor>();
    return base.map((s) => {
      let color = s.color;
      if (used.has(color)) color = CLIMBER_COLORS.find((c) => !used.has(c)) ?? color;
      used.add(color);
      return { ...s, color };
    });
  });

  const active = seats.slice(0, count);

  const cycleColor = (i: number) => {
    setSeats((prev) => {
      const taken = new Set(prev.slice(0, count).filter((_, j) => j !== i).map((s) => s.color));
      const start = CLIMBER_COLORS.indexOf(prev[i].color);
      for (let k = 1; k <= CLIMBER_COLORS.length; k++) {
        const c = CLIMBER_COLORS[(start + k) % CLIMBER_COLORS.length];
        if (!taken.has(c)) {
          // barvu, kterou místo uvolnilo, dostane neaktivní místo, které ji mělo
          return prev.map((s, j) => {
            if (j === i) return { ...s, color: c };
            if (j >= count && s.color === c) return { ...s, color: prev[i].color };
            return s;
          });
        }
      }
      return prev;
    });
  };

  const rename = (i: number, name: string) => {
    setSeats((prev) => prev.map((s, j) => (j === i ? { ...s, name: name.slice(0, 12) } : s)));
  };

  const start = () => {
    const finalSeats = active.map((s, i) => ({ ...s, name: s.name.trim() || `Hráč ${i + 1}`, kind: "human" as const }));
    onStart({ seats: finalSeats, rules: { ...DEFAULT_RULES } });
  };

  return (
    <main className="mx-auto w-full max-w-[560px] px-4 py-6 flex flex-col gap-6">
      <header className="text-center flex flex-col gap-2">
        <h1 className="text-[44px] leading-tight text-ink">{UI.title}</h1>
        <p className="text-ink-soft">{UI.subtitle}</p>
      </header>

      <section className="rounded-2xl border border-line bg-surface p-4 flex flex-col gap-4">
        <h2 className="text-[22px] text-ink">{UI.whoPlays}</h2>
        <p className="text-ink-soft text-sm">Více lidí na jednom zařízení – horolezci se střídají u jednoho telefonu nebo monitoru.</p>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-ink-soft">{UI.climberCount}</span>
          <Pill
            label={UI.climberCount}
            value={count}
            options={[2, 3, 4].map((n) => ({ value: n, label: String(n) }))}
            onChange={setCount}
          />
        </div>
        <ul className="flex flex-col gap-2">
          {active.map((s, i) => (
            <li key={i} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => cycleColor(i)}
                aria-label={`Barva horolezce ${i + 1}: ${COLOR_LABEL[s.color]}. Klepnutím změníš.`}
                className="w-11 h-11 rounded-full shrink-0 font-semibold tabular"
                style={{
                  background: `var(--climber-${s.color})`,
                  color: s.color === "yellow" ? "var(--climber-ink)" : "var(--token-light)",
                  border: "2px solid var(--climber-ink)",
                }}
              >
                {i + 1}
              </button>
              <input
                type="text"
                value={s.name}
                maxLength={12}
                onChange={(e) => rename(i, e.target.value)}
                aria-label={`Jméno horolezce ${i + 1}`}
                className="flex-1 min-w-0 h-11 rounded-xl border border-line bg-surface-2 px-3 text-ink text-base"
              />
              <span className="text-sm text-ink-muted w-14 text-right">Člověk</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4 flex flex-col gap-2">
        <h2 className="text-[22px] text-ink">Pravidla hry</h2>
        <p className="text-ink-soft text-sm leading-relaxed">{UI.rulesDefault}</p>
      </section>

      <button
        type="button"
        onClick={start}
        className="h-16 rounded-2xl bg-accent text-accent-contrast text-lg font-semibold shadow-sm"
      >
        {UI.start}
      </button>
    </main>
  );
}

export default SetupScreen;
