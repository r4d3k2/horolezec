// Přepínání obrazovek: nastavení → hra (s oknem vítěze).

import { useState } from "react";
import { Board } from "./components/Board";
import { Icon } from "./components/Icon";
import { SetupScreen } from "./components/SetupScreen";
import { TurnPanel, TurnStrip } from "./components/TurnPanel";
import { WinnerDialog } from "./components/WinnerDialog";
import { UI } from "./data/texts";
import { useGame } from "./hooks/useGame";
import type { GameSetup } from "./lib/engine";

export default function App() {
  const game = useGame();
  const [lastSetup, setLastSetup] = useState<GameSetup | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmNew, setConfirmNew] = useState(false);

  const startGame = (setup: GameSetup) => {
    setLastSetup(setup);
    game.start(setup);
  };

  const toSetup = () => {
    setMenuOpen(false);
    setConfirmNew(false);
    game.stop();
  };

  if (!game.view || !game.display) {
    return <SetupScreen initial={lastSetup} onStart={startGame} />;
  }

  const { view, display, busy } = game;
  const finished = !busy && (view.phase === "won" || view.phase === "over");

  return (
    <div className="min-h-svh flex flex-col items-center">
      <header className="w-full max-w-[1100px] flex items-center justify-between px-3 h-12 shrink-0">
        <span className="font-display text-[22px] text-ink">{UI.title}</span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-label={UI.menu}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-ink hover:bg-surface-2"
          >
            <Icon name="menu" size={24} />
          </button>
          {menuOpen ? (
            <div className="absolute right-0 top-12 z-10 w-56 rounded-xl border border-line bg-surface shadow-lg p-1 fade-in">
              <button
                type="button"
                onClick={() => { setMenuOpen(false); setConfirmNew(true); }}
                className="w-full h-11 text-left px-3 rounded-lg text-ink hover:bg-surface-2"
              >
                {UI.newGame}
              </button>
            </div>
          ) : null}
        </div>
      </header>

      <main className="w-full flex flex-col items-center gap-2 px-2 pb-3 min-[900px]:flex-row min-[900px]:items-start min-[900px]:justify-center min-[900px]:gap-6 min-[900px]:pt-2">
        <div className="w-full max-w-[600px] min-[900px]:hidden">
          <TurnStrip view={view} display={display} busy={busy} />
        </div>
        <div className="game-board shrink-0 mt-1">
          <Board view={view} display={display} />
        </div>
        <aside className="flex flex-col gap-3 w-full max-w-[600px] min-[900px]:w-[340px] min-[900px]:max-w-[340px]">
          <div className="hidden min-[900px]:block">
            <TurnStrip view={view} display={display} busy={busy} />
          </div>
          <TurnPanel view={view} display={display} busy={busy} onRoll={game.roll} />
        </aside>
      </main>

      {finished ? <WinnerDialog view={view} onPlayOn={game.playOn} onNewGame={toSetup} /> : null}

      {confirmNew ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4" style={{ background: "color-mix(in srgb, var(--text) 45%, transparent)" }}>
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
