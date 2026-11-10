// Jednoduché okno vítěze (výsledková obrazovka přijde ve Fázi 3) (pořadí, „Hrát o další místa“, „Nová hra“).

import type { PublicView } from "../lib/engine";
import { kola, UI } from "../data/texts";
import { Dot } from "./TurnPanel";

interface Props {
  view: PublicView;
  onPlayOn: () => void;
  onNewGame: () => void;
}

export function WinnerDialog({ view, onPlayOn, onNewGame }: Props) {
  const winner = view.climbers.find((c) => c.finishedRank === 1);
  const ranked = view.climbers
    .map((c, idx) => ({ c, idx }))
    .filter(({ c }) => c.finishedRank !== null)
    .sort((a, b) => (a.c.finishedRank ?? 0) - (b.c.finishedRank ?? 0));
  const climbing = view.climbers.filter((c) => c.finishedRank === null).length;
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center p-4 backdrop">
      <div role="dialog" aria-modal="true" aria-labelledby="winner-title" className="fade-in w-full max-w-[380px] rounded-2xl border border-line bg-surface p-5 flex flex-col gap-4 shadow-xl">
        <h2 id="winner-title" className="text-[26px] leading-tight text-ink text-center">
          {winner ? `${winner.seat.name} je na vrcholu!` : "Konec hry"}
        </h2>
        <ol className="flex flex-col gap-2">
          {ranked.map(({ c, idx }) => (
            <li key={c.id} className="flex items-center gap-3 rounded-xl bg-surface-2 px-3 h-11">
              <span className="font-semibold tabular w-6 text-ink">{c.finishedRank}.</span>
              <Dot color={c.seat.color} number={idx + 1} size={24} />
              <span className="text-ink truncate">{c.seat.name}</span>
              <span className="ml-auto text-sm text-ink-muted tabular whitespace-nowrap">{kola(c.stats.turns)}</span>
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-2">
          {view.phase === "won" && climbing >= 2 ? (
            <button type="button" onClick={onPlayOn} className="h-12 rounded-xl border border-line bg-surface-2 text-ink font-semibold">
              {UI.playOn}
            </button>
          ) : null}
          <button type="button" onClick={onNewGame} className="h-14 rounded-xl bg-accent text-accent-contrast font-semibold text-lg">
            {UI.newGame}
          </button>
        </div>
      </div>
    </div>
  );
}

export default WinnerDialog;
