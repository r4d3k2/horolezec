// Výsledková obrazovka: pořadí, statistiky každého horolezce a „Kde by kdo spadl“.
// Tajná data (pole, danger) čte jen tady a jen z plného stavu po konci hry (finalState).
// Ve fázi „won“ (ostatní můžou hrát o další místa) se magnety ukážou až na výslovné přání,
// které výpravu ukončí – jinak by odhalení pokazilo hru o další místa.

import { useEffect, useRef, useState } from "react";
import type { ClimberState, GameState, PublicClimber, PublicView } from "../lib/engine";
import { kola, UI } from "../data/texts";
import { Icon, type IconName } from "./Icon";
import { Dot } from "./TurnPanel";

interface Props {
  view: PublicView;
  finalState: GameState | null;
  onPlayOn: () => void;
  onNewExpedition: () => void;
  onChangeSettings: () => void;
  /** Ve fázi „won“ hráči ukončili výpravu, aby viděli magnety (uložená hra se smaže). */
  onEndEarly: () => void;
}

function StatCell({ icon, value, label }: { icon: IconName; value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-lg bg-surface-2 px-1 py-1.5 min-w-0">
      <span className="flex items-center gap-1 text-ink font-semibold tabular">
        <Icon name={icon} size={15} className="text-ink-soft shrink-0" />
        {value}
      </span>
      <span className="text-xs text-ink-muted leading-tight text-center">{label}</span>
    </div>
  );
}

/** Kotouč hory: odhalená zrádná hora plně v barvě horolezce, neodhalená obrysem. */
function DangerField({ n, color, revealed }: { n: number; color: string; revealed: boolean }) {
  const yellow = color === "yellow";
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-semibold tabular text-sm shrink-0"
      style={{
        width: 34,
        height: 34,
        background: revealed ? `var(--climber-${color})` : "var(--surface)",
        color: revealed ? (yellow ? "var(--climber-ink)" : "var(--token-light)") : "var(--text)",
        border: revealed ? "2px solid var(--climber-ink)" : `2.5px dashed var(--climber-${color})`,
      }}
      title={revealed ? `Hora ${n}: pád` : `Hora ${n}: zrádná, bez pádu`}
    >
      <span className="sr-only">{revealed ? `Hora ${n}, tady byl pád.` : `Hora ${n}, zrádná, bez pádu.`}</span>
      <span aria-hidden="true">{n}</span>
    </span>
  );
}

export function ResultScreen({ view, finalState, onPlayOn, onNewExpedition, onChangeSettings, onEndEarly }: Props) {
  const [revealNow, setRevealNow] = useState(view.phase === "over");
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const indexOf = (id: string) => view.climbers.findIndex((c) => c.id === id);
  const winner = view.climbers.find((c) => c.finishedRank === 1);
  const ranked = [...view.climbers].sort((a, b) => {
    const ra = a.finishedRank ?? 99;
    const rb = b.finishedRank ?? 99;
    return ra !== rb ? ra - rb : b.pos - a.pos;
  });
  const climbing = view.climbers.filter((c) => c.finishedRank === null).length;
  const canPlayOn = view.phase === "won" && climbing >= 2 && !revealNow;

  const reveal = () => {
    setRevealNow(true);
    onEndEarly();
  };

  /** Tajná data jen z plného stavu po konci hry. */
  const secretOf = (id: string): ClimberState | undefined =>
    revealNow ? finalState?.climbers.find((c) => c.id === id) : undefined;

  const samePole = (c: PublicClimber): string => {
    const me = secretOf(c.id);
    if (!me || me.pole === null) return UI.samePoleNobody;
    const others = (finalState?.climbers ?? []).filter((o) => o.id !== c.id && o.pole === me.pole);
    return others.length > 0 ? others.map((o) => o.seat.name).join(", ") : UI.samePoleNobody;
  };

  return (
    <div className="safe-area fixed inset-0 z-30 overflow-y-auto bg-bg fade-in" role="dialog" aria-modal="true" aria-labelledby="result-title">
      <div className="mx-auto w-full max-w-[560px] px-4 pt-6 pb-10 flex flex-col gap-6">
        <header className="text-center flex flex-col items-center gap-2">
          <span className="text-ink-soft"><Icon name="flag" size={32} /></span>
          <h1 id="result-title" ref={titleRef} tabIndex={-1} className="text-[32px] leading-tight text-ink outline-none">
            {winner ? `${winner.seat.name} je na vrcholu!` : UI.results}
          </h1>
          {winner ? (
            <p className="text-ink-soft">
              {UI.results} · výstup na vrchol za {kola(winner.stats.turns)}
            </p>
          ) : null}
        </header>

        <section className="flex flex-col gap-2" aria-labelledby="ranking-title">
          <h2 id="ranking-title" className="text-[22px] text-ink">{UI.ranking}</h2>
          <ol className="flex flex-col gap-2">
            {ranked.map((c) => {
              const idx = indexOf(c.id);
              return (
                <li key={c.id} className="rounded-xl border border-line bg-surface p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-semibold tabular w-7 text-ink text-lg shrink-0">
                      {c.finishedRank !== null ? `${c.finishedRank}.` : "–"}
                    </span>
                    <Dot color={c.seat.color} number={idx + 1} size={28} />
                    <span className="font-semibold text-ink truncate">{c.seat.name}</span>
                    {c.seat.kind === "ai" ? <span className="text-xs text-ink-muted shrink-0">{UI.ai.toLowerCase()}</span> : null}
                    <span className="ml-auto text-sm text-ink-soft tabular whitespace-nowrap">
                      {c.finishedRank !== null ? kola(c.stats.turns) : `${UI.stillClimbing}, hora ${c.pos}`}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    <StatCell icon="dice" value={c.stats.rolls} label={UI.statRolls} />
                    <StatCell icon="fall" value={c.stats.magnetFalls} label={UI.statFalls} />
                    <StatCell icon="lanovka" value={c.stats.rides} label={UI.statRides} />
                    <StatCell icon="noEntry" value={c.stats.blocked} label={UI.statBlocked} />
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="flex flex-col gap-2" aria-labelledby="where-title">
          <h2 id="where-title" className="text-[22px] text-ink flex items-center gap-2">
            <Icon name="magnet" size={22} className="text-ink-soft" />
            {UI.whereFall}
          </h2>
          {!view.rules.magnets ? (
            <p className="text-ink-soft">{UI.magnetsOff}</p>
          ) : !revealNow || !finalState ? (
            <div className="rounded-xl border border-line bg-surface p-3 flex flex-col gap-3">
              <p className="text-ink-soft">{UI.whereFallHidden}</p>
              <button
                type="button"
                onClick={reveal}
                className="h-12 rounded-xl border border-line bg-surface-2 text-ink font-semibold px-3"
              >
                {UI.whereFallReveal}
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-ink-soft">{UI.whereFallHint}</p>
              <ul className="flex flex-col gap-2">
                {view.climbers.map((c, idx) => {
                  const secret = secretOf(c.id);
                  return (
                    <li key={c.id} className="rounded-xl border border-line bg-surface p-3 flex flex-col gap-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <Dot color={c.seat.color} number={idx + 1} size={26} />
                        <span className="font-semibold text-ink mr-auto">{c.seat.name}</span>
                        <span className="flex gap-1.5">
                          {(secret?.danger ?? []).map((n) => (
                            <DangerField key={n} n={n} color={c.seat.color} revealed={c.revealed.includes(n)} />
                          ))}
                        </span>
                      </div>
                      <p className="text-sm text-ink-soft">
                        <span className="text-ink-muted">{UI.samePole}:</span> {samePole(c)}
                      </p>
                    </li>
                  );
                })}
              </ul>
              <p className="text-sm text-ink-muted">{UI.polesNote}</p>
            </>
          )}
        </section>

        <div className="flex flex-col gap-2">
          {canPlayOn ? (
            <button type="button" onClick={onPlayOn} className="h-14 rounded-2xl border border-line bg-surface text-ink font-semibold text-lg">
              {UI.playOn}
            </button>
          ) : null}
          <button type="button" onClick={onNewExpedition} className="h-16 rounded-2xl bg-accent text-accent-contrast font-semibold text-lg shadow-sm">
            {UI.newExpedition}
          </button>
          <button type="button" onClick={onChangeSettings} className="h-12 rounded-xl border border-line bg-surface-2 text-ink font-semibold">
            {UI.changeSettings}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultScreen;
