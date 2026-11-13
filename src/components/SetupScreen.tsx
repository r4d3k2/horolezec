// Nastavení: kdo hraje (proti počítači / více lidí na jednom zařízení), 2–4 místa, barvy, jména,
// Člověk/Počítač, volitelná pravidla se značkou „výklad“, statistiky. Pamatuje si poslední nastavení.

import { useState } from "react";
import { CLIMBER_COLORS, type ClimberColor } from "../data/board";
import { AI_NAMES, pickAiName } from "../data/names";
import { seatsForMode } from "../data/setupDefaults";
import { kola, RULE_TOGGLES, UI, vyhry } from "../data/texts";
import type { GameSetup, SeatKind, SeatSetup } from "../lib/engine";
import type { Rules } from "../lib/rules";
import { clearStats, emptyStats, loadStats, type PlayMode, type Settings, type Stats } from "../lib/storage";
import { Pill } from "./Pill";
import { Toggle } from "./Toggle";

const COLOR_LABEL: Record<ClimberColor, string> = {
  red: "červená",
  blue: "modrá",
  yellow: "žlutá",
  green: "zelená",
};

const isDefaultHuman = (name: string) => /^Hráč( \d)?$/.test(name.trim()) || name.trim() === "";

interface Props {
  settings: Settings;
  hasSaved: boolean;
  onResume: () => void;
  onStart: (setup: GameSetup, settings: Settings) => void;
}

export function SetupScreen({ settings, hasSaved, onResume, onStart }: Props) {
  const [showForm, setShowForm] = useState(!hasSaved);
  const [mode, setMode] = useState<PlayMode>(settings.mode);
  const [count, setCount] = useState<number>(settings.count);
  const [seats, setSeats] = useState<SeatSetup[]>(settings.seats);
  const [rules, setRules] = useState<Rules>(settings.rules);
  const [stats, setStats] = useState<Stats>(() => loadStats());
  const [confirmClear, setConfirmClear] = useState(false);

  const active = seats.slice(0, count);

  const changeMode = (m: PlayMode) => {
    if (m === mode) return;
    setMode(m);
    setSeats((prev) => seatsForMode(m).map((s, i) => ({ ...s, color: prev[i].color })));
  };

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

  const setKind = (i: number, kind: SeatKind) => {
    setSeats((prev) => prev.map((s, j) => {
      if (j !== i || s.kind === kind) return s;
      if (kind === "ai") {
        const name = isDefaultHuman(s.name) ? pickAiName(prev.map((x) => x.name)) : s.name;
        return { ...s, kind, name };
      }
      const name = AI_NAMES.includes(s.name) ? (mode === "ai" && i === 0 ? "Hráč" : `Hráč ${i + 1}`) : s.name;
      return { ...s, kind, name };
    }));
  };

  const setRule = (key: keyof Rules, on: boolean) => {
    setRules((r) => {
      switch (key) {
        case "redRing": return { ...r, redRing: on ? "zakaz" : "bezUcinku" };
        case "colorDie": return { ...r, colorDie: on ? "vlastniBarva" : "jinaNezCerna" };
        default: return { ...r, [key]: on };
      }
    });
  };

  const ruleOn = (key: keyof Rules): boolean => {
    if (key === "redRing") return rules.redRing === "zakaz";
    if (key === "colorDie") return rules.colorDie === "vlastniBarva";
    return !!rules[key];
  };

  const start = () => {
    const finalSeats: SeatSetup[] = active.map((s, i) => ({
      ...s,
      name: s.name.trim() || (s.kind === "human" ? `Hráč ${i + 1}` : AI_NAMES[i]),
    }));
    const allSeats = seats.map((s, i) => (i < count ? finalSeats[i] : s));
    onStart(
      { seats: finalSeats, rules: { ...rules } },
      { ...settings, schema: 3, mode, count, seats: allSeats, rules: { ...rules } },
    );
  };

  return (
    <main className="mx-auto w-full max-w-[560px] px-4 py-6 flex flex-col gap-5">
      <header className="text-center flex flex-col gap-2">
        <h1 className="text-[44px] leading-tight text-ink">{UI.title}</h1>
        <p className="text-ink-soft">{UI.subtitle}</p>
      </header>

      {hasSaved ? (
        <section className="flex gap-2">
          <button
            type="button"
            onClick={onResume}
            className="flex-1 h-16 rounded-2xl bg-accent text-accent-contrast text-lg font-semibold shadow-sm px-3"
          >
            {UI.resume}
          </button>
          {!showForm ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="h-16 rounded-2xl border border-line bg-surface text-ink font-semibold px-5"
            >
              {UI.newGame}
            </button>
          ) : null}
        </section>
      ) : null}

      {showForm ? (
        <>
          <section className="rounded-2xl border border-line bg-surface p-4 flex flex-col gap-4">
            <h2 className="text-[22px] text-ink">{UI.whoPlays}</h2>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={UI.whoPlays}>
              {(["ai", "hotseat"] as PlayMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => changeMode(m)}
                  className={`min-h-14 rounded-xl px-3 py-2 font-semibold text-left leading-tight border ${
                    mode === m ? "bg-accent text-accent-contrast border-transparent" : "bg-surface-2 text-ink border-line"
                  }`}
                >
                  {m === "ai" ? UI.modeAi : UI.modeHotseat}
                </button>
              ))}
            </div>
            <p className="text-ink-soft text-sm -mt-1">{mode === "ai" ? UI.modeAiHint : UI.modeHotseatHint}</p>
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
                <li key={i} className="flex items-center gap-2">
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
                  <div className="inline-flex rounded-xl border border-line bg-surface-2 p-0.5 shrink-0" role="radiogroup" aria-label={`Horolezec ${i + 1}`}>
                    {(["human", "ai"] as SeatKind[]).map((k) => (
                      <button
                        key={k}
                        type="button"
                        role="radio"
                        aria-checked={s.kind === k}
                        onClick={() => setKind(i, k)}
                        className={`h-10 px-2.5 rounded-lg text-sm font-semibold ${s.kind === k ? "bg-accent text-accent-contrast" : "text-ink-soft"}`}
                      >
                        {k === "human" ? UI.human : UI.ai}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-2 sm:p-3 flex flex-col">
            <h2 className="text-[22px] text-ink px-2 pt-2 pb-1">{UI.rulesTitle}</h2>
            {RULE_TOGGLES.map((t) => (
              <Toggle
                key={t.key}
                checked={ruleOn(t.key)}
                onChange={(on) => setRule(t.key, on)}
                label={t.label}
                text={t.text}
                badge={t.interpretation}
              />
            ))}
          </section>

          <button
            type="button"
            onClick={start}
            className="h-16 rounded-2xl bg-accent text-accent-contrast text-lg font-semibold shadow-sm"
          >
            {UI.start}
          </button>
        </>
      ) : null}

      {stats.games > 0 ? <StatsSection stats={stats} onClear={() => setConfirmClear(true)} /> : null}

      {confirmClear ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop">
          <div role="alertdialog" aria-modal="true" aria-labelledby="clear-title" className="fade-in w-full max-w-[360px] rounded-2xl border border-line bg-surface p-5 flex flex-col gap-4 shadow-xl">
            <p id="clear-title" className="text-ink">{UI.statsClearConfirm}</p>
            <div className="flex gap-2">
              <button type="button" autoFocus onClick={() => setConfirmClear(false)} className="flex-1 h-12 rounded-xl border border-line bg-surface-2 text-ink font-semibold">
                {UI.statsClearNo}
              </button>
              <button
                type="button"
                onClick={() => {
                  clearStats();
                  setStats(emptyStats());
                  setConfirmClear(false);
                }}
                className="flex-1 h-12 rounded-xl bg-accent text-accent-contrast font-semibold"
              >
                {UI.statsClearYes}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

/** Statistiky dohraných výprav: počet, nejkratší výstup a výhry podle jména. */
function StatsSection({ stats, onClear }: { stats: Stats; onClear: () => void }) {
  const wins = Object.entries(stats.wins).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "cs"));
  return (
    <section className="rounded-2xl border border-line bg-surface p-4 flex flex-col gap-3" aria-labelledby="stats-title">
      <h2 id="stats-title" className="text-[22px] text-ink">{UI.stats}</h2>
      <dl className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-surface-2 px-3 py-2">
          <dt className="text-sm text-ink-soft">{UI.statsGames}</dt>
          <dd className="text-2xl font-semibold text-ink tabular">{stats.games}</dd>
        </div>
        <div className="rounded-xl bg-surface-2 px-3 py-2 min-w-0">
          <dt className="text-sm text-ink-soft">{UI.statsShortest}</dt>
          <dd className="text-ink">
            {stats.shortest ? (
              <>
                <span className="text-2xl font-semibold tabular">{kola(stats.shortest.turns)}</span>
                <span className="block text-sm text-ink-soft truncate">{stats.shortest.name}</span>
              </>
            ) : "–"}
          </dd>
        </div>
      </dl>
      <div>
        <h3 className="font-body font-semibold text-ink mb-1">{UI.statsWins}</h3>
        <ul className="flex flex-col">
          {wins.map(([name, n]) => (
            <li key={name} className="flex items-center justify-between gap-3 py-1.5 border-b border-line last:border-b-0">
              <span className="text-ink truncate">{name}</span>
              <span className="text-ink-soft tabular whitespace-nowrap">{vyhry(n)}</span>
            </li>
          ))}
        </ul>
      </div>
      <button type="button" onClick={onClear} className="self-start h-11 px-4 rounded-xl border border-line bg-surface-2 text-ink font-semibold">
        {UI.statsClear}
      </button>
    </section>
  );
}

export default SetupScreen;
