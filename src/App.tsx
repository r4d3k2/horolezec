// Přepínání obrazovek: nastavení → hra (legenda, deska, panel, menu, pravidla) → výsledky.

import { useEffect, useState } from "react";
import { Board } from "./components/Board";
import { FieldBubble } from "./components/FieldBubble";
import { Icon } from "./components/Icon";
import { Journal } from "./components/Journal";
import { Legend } from "./components/Legend";
import { Pill } from "./components/Pill";
import { ResultScreen } from "./components/ResultScreen";
import { RulesScreen } from "./components/RulesScreen";
import { SetupScreen } from "./components/SetupScreen";
import { ThemeSwitcher } from "./components/ThemeSwitcher";
import { Toggle } from "./components/Toggle";
import { TurnPanel, TurnStrip } from "./components/TurnPanel";
import { defaultSettings } from "./data/setupDefaults";
import { TEMPO_LABELS, UI } from "./data/texts";
import { useGame } from "./hooks/useGame";
import { useReducedMotion } from "./hooks/useReducedMotion";
import type { GameSetup } from "./lib/engine";
import { tempoCssVars, TEMPOS } from "./lib/eventPlayer";
import {
  clearGame, loadGame, loadSettings, loadTheme, saveSettings, saveTheme,
  type Settings, type ThemeId,
} from "./lib/storage";

export default function App() {
  const [settings, setSettings] = useState<Settings>(() => loadSettings() ?? defaultSettings());
  const [theme, setTheme] = useState<ThemeId>(() => loadTheme());
  const [hasSaved, setHasSaved] = useState<boolean>(() => loadGame() !== null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [bubble, setBubble] = useState<number | null>(null);
  const reduced = useReducedMotion();
  const game = useGame({ tempo: settings.tempo, reduced });

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    // Barva lišty systému (PWA, Safari) podle pozadí tématu.
    const bg = getComputedStyle(root).getPropertyValue("--bg").trim();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && bg) meta.setAttribute("content", bg);
  }, [theme]);

  // Délky animací, které běží jen v CSS (kostka, pulz kroužku, značky, vlajka), podle Tempa hry.
  useEffect(() => {
    const root = document.documentElement;
    for (const [name, value] of Object.entries(tempoCssVars(settings.tempo))) root.style.setProperty(name, value);
  }, [settings.tempo]);

  const changeTheme = (t: ThemeId) => {
    setTheme(t);
    saveTheme(t);
  };

  const updateSettings = (patch: Partial<Settings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      saveSettings(next);
      return next;
    });
  };

  const startGame = (setup: GameSetup, next: Settings) => {
    setSettings(next);
    saveSettings(next);
    setBubble(null);
    game.start(setup);
  };

  const resumeGame = () => {
    const saved = loadGame();
    if (saved) game.resume(saved);
    else setHasSaved(false);
  };

  const toSetup = () => {
    setMenuOpen(false);
    setConfirmNew(false);
    setBubble(null);
    clearGame();
    setHasSaved(false);
    game.stop();
  };

  /** Nová výprava: stejní horolezci a pravidla, nový seed = nové magnety. */
  const newExpedition = () => {
    const v = game.view;
    if (!v) return;
    setBubble(null);
    game.start({ seats: v.climbers.map((c) => ({ ...c.seat })), rules: { ...v.rules } });
  };

  /** Výprava ukončená před hrou o další místa (kvůli odhalení magnetů): uloženou hru zahodit. */
  const endEarly = () => {
    clearGame();
    setHasSaved(false);
  };

  const header = (inGame: boolean) => (
    <header className="w-full max-w-[1280px] flex items-center justify-between gap-2 px-3 h-14 shrink-0">
      {inGame ? <span className="font-display text-[22px] text-ink">{UI.title}</span> : <span />}
      <div className="flex items-center gap-1.5">
        <ThemeSwitcher theme={theme} onChange={changeTheme} />
        {inGame ? (
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label={UI.menu}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-ink hover:bg-surface-2"
          >
            <Icon name="menu" size={24} />
          </button>
        ) : null}
      </div>
    </header>
  );

  if (!game.view || !game.display) {
    return (
      <div className="safe-area min-h-svh flex flex-col items-center">
        {header(false)}
        <SetupScreen
          key={hasSaved ? "saved" : "fresh"}
          settings={settings}
          hasSaved={hasSaved}
          onResume={resumeGame}
          onStart={startGame}
        />
      </div>
    );
  }

  const { view, display, busy, journal, handover } = game;
  const finished = !busy && (view.phase === "won" || view.phase === "over");

  /** Klepnutí na desku: během přehrávání ho dokončí, jinak otevře bublinu u hory se štítkem. */
  const onBoardTap = (field: number | null) => {
    if (busy) {
      game.finishPlayback();
      return;
    }
    setBubble((b) => (field === null || field === b ? null : field));
  };

  return (
    <div className="safe-area min-h-svh flex flex-col items-center">
      <div className="relative w-full flex justify-center">
        {header(true)}
        {menuOpen ? (
          <>
            <button type="button" aria-label={UI.close} className="fixed inset-0 z-20 cursor-default" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-3 top-14 z-30 w-[min(300px,calc(100vw-24px))] rounded-xl border border-line bg-surface shadow-lg p-1.5 fade-in flex flex-col">
              <button type="button" onClick={() => { setMenuOpen(false); setRulesOpen(true); }} className="h-11 text-left px-3 rounded-lg text-ink hover:bg-surface-2">
                {UI.rules}
              </button>
              <button type="button" onClick={() => { setMenuOpen(false); setLegendOpen(true); }} className="h-11 text-left px-3 rounded-lg text-ink hover:bg-surface-2">
                {UI.legend}
              </button>
              <button type="button" onClick={() => { setMenuOpen(false); setConfirmNew(true); }} className="h-11 text-left px-3 rounded-lg text-ink hover:bg-surface-2">
                {UI.newGame}
              </button>
              <div className="border-t border-line mt-1 pt-2 px-2 flex flex-col gap-1.5">
                <span className="text-sm text-ink-soft">{UI.tempo}</span>
                <Pill
                  label={UI.tempo}
                  value={settings.tempo}
                  options={TEMPOS.map((t) => ({ value: t, label: TEMPO_LABELS[t] }))}
                  onChange={(t) => updateSettings({ tempo: t })}
                  full
                />
                <span className="text-xs text-ink-muted leading-snug">{UI.tempoHint}</span>
              </div>
              <div className="mt-1">
                <Toggle checked={settings.showMarks} onChange={(v) => updateSettings({ showMarks: v })} label={UI.showMarks} />
              </div>
            </div>
          </>
        ) : null}
      </div>

      <main className="w-full flex flex-col items-center gap-2 px-2 pb-4 min-[900px]:flex-row min-[900px]:items-start min-[900px]:justify-center min-[900px]:gap-6 min-[900px]:pt-1">
        <aside
          className="hidden min-[900px]:block w-[240px] shrink-0 rounded-2xl border border-line bg-surface px-3 overflow-y-auto"
          style={{ maxHeight: "calc(100svh - 80px)" }}
          aria-label={UI.legend}
        >
          <h2 className="text-[22px] text-ink pt-3">{UI.legend}</h2>
          <Legend rules={view.rules} compact />
        </aside>

        <div className="w-full max-w-[600px] min-[900px]:hidden">
          <TurnStrip view={view} display={display} busy={busy} handover={handover} />
        </div>

        <div className="game-board shrink-0 mt-1">
          <Board view={view} display={display} showMarks={settings.showMarks} onTap={onBoardTap} />
          {bubble !== null && !busy ? <FieldBubble field={bubble} rules={view.rules} onClose={() => setBubble(null)} /> : null}
        </div>

        <aside className="flex flex-col gap-3 w-full max-w-[600px] min-[900px]:w-[340px] min-[900px]:max-w-[340px] shrink-0">
          <div className="hidden min-[900px]:block">
            <TurnStrip view={view} display={display} busy={busy} handover={handover} />
          </div>
          <TurnPanel view={view} display={display} busy={busy} handover={handover} onRoll={game.roll} />
          <Journal entries={journal} />
        </aside>
      </main>

      {finished ? (
        <ResultScreen
          key={`${view.seed}-${view.phase}`}
          view={view}
          finalState={game.finalState}
          onPlayOn={game.playOn}
          onNewExpedition={newExpedition}
          onChangeSettings={toSetup}
          onEndEarly={endEarly}
        />
      ) : null}

      {legendOpen ? (
        <div className="safe-area fixed inset-0 z-40 flex items-end sm:items-center justify-center backdrop" onClick={() => setLegendOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="legend-title"
            className="fade-in w-full max-w-[520px] max-h-[85svh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-line bg-surface px-4 pb-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-surface flex items-center justify-between py-3">
              <h2 id="legend-title" className="text-[24px] text-ink">{UI.legend}</h2>
              <button type="button" onClick={() => setLegendOpen(false)} aria-label={UI.close} className="w-11 h-11 rounded-xl flex items-center justify-center text-ink hover:bg-surface-2">
                <Icon name="close" size={24} />
              </button>
            </div>
            <Legend rules={view.rules} />
          </div>
        </div>
      ) : null}

      {rulesOpen ? <RulesScreen rules={view.rules} onClose={() => setRulesOpen(false)} /> : null}

      {confirmNew ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop">
          <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="fade-in w-full max-w-[360px] rounded-2xl border border-line bg-surface p-5 flex flex-col gap-4 shadow-xl">
            <p id="confirm-title" className="text-ink">{UI.newGameConfirm}</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmNew(false)} className="flex-1 h-12 rounded-xl border border-line bg-surface-2 text-ink font-semibold">
                {UI.no}
              </button>
              <button type="button" onClick={toSetup} className="flex-1 h-12 rounded-xl bg-accent text-accent-contrast font-semibold">
                {UI.yes}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
