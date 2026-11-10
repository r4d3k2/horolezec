// Proužek „Na tahu“ a panel s kostkami, hlavním tlačítkem a poslední hláškou.

import type { PublicView } from "../lib/engine";
import type { DisplayState } from "../lib/eventPlayer";
import type { Handover } from "../hooks/useGame";
import { UI } from "../data/texts";
import { Die } from "./Die";

export function Dot({ color, number, size = 26 }: { color: string; number: number; size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-semibold tabular shrink-0"
      style={{
        width: size,
        height: size,
        background: `var(--climber-${color})`,
        color: color === "yellow" ? "var(--climber-ink)" : "var(--token-light)",
        border: "1.5px solid var(--climber-ink)",
        fontSize: size * 0.5,
      }}
      aria-hidden="true"
    >
      {number}
    </span>
  );
}

interface StripProps {
  view: PublicView;
  display: DisplayState;
  busy: boolean;
  handover: Handover | null;
}

export function TurnStrip({ view, display, busy, handover }: StripProps) {
  if (view.phase === "over" && !busy) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 h-10 w-full">
        <span className="font-semibold text-ink">Konec hry</span>
      </div>
    );
  }
  const idx = Math.max(0, view.climbers.findIndex((c) => c.id === display.current));
  const c = view.climbers[idx];
  const flash = !busy && handover !== null && handover.climberId === c.id;
  const status = display.skipTurns[c.id] > 0
    ? `stojí (${display.skipTurns[c.id]})`
    : display.atStation[c.id]
      ? "čeká na šestku"
      : c.seat.kind === "ai"
        ? UI.ai.toLowerCase()
        : null;
  return (
    <div
      key={flash ? `flash${handover?.nonce}` : "strip"}
      className={`flex items-center gap-2 rounded-xl border border-line bg-surface px-3 h-10 w-full ${flash ? "strip-flash" : ""}`}
      style={{ borderLeft: `6px solid var(--climber-${c.seat.color})` }}
    >
      <Dot color={c.seat.color} number={idx + 1} size={24} />
      <span className="text-ink-soft">{UI.onTurn}:</span>
      <span className="font-semibold text-ink truncate">{c.seat.name}</span>
      {status ? <span className="ml-auto text-sm text-ink-muted whitespace-nowrap">{status}</span> : null}
    </div>
  );
}

interface PanelProps {
  view: PublicView;
  display: DisplayState;
  busy: boolean;
  handover: Handover | null;
  onRoll: () => void;
}

export function TurnPanel({ view, display, busy, handover, onRoll }: PanelProps) {
  const current = view.climbers.find((c) => c.id === display.current) ?? view.climbers[view.current];
  const isAi = current.seat.kind === "ai";
  const canRoll = !busy && view.phase === "playing" && !isAi;
  const standing = (display.skipTurns[current.id] ?? 0) > 0;
  let label: string = UI.roll;
  if (view.phase === "playing" && isAi) label = `${current.seat.name} hází…`;
  else if (standing) label = "Stojí – další tah";
  else if (handover && handover.climberId === current.id) label = `${current.seat.name}, hoď kostkou`;
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-3">
        <Die kind="cisla" value={display.die} nonce={display.dieNonce} onClick={onRoll} disabled={!canRoll} label="Kostka s čísly" />
        {display.colorDie ? (
          <span className="fade-in">
            <Die kind="barvy" color={display.colorDie} nonce={display.colorNonce} label="Barevná kostka" />
          </span>
        ) : null}
        <button
          type="button"
          onClick={onRoll}
          disabled={!canRoll}
          className="flex-1 min-w-0 h-16 rounded-2xl bg-accent text-accent-contrast text-lg font-semibold px-3 shadow-sm transition-opacity disabled:opacity-50 leading-tight"
        >
          {label}
        </button>
      </div>
      <div aria-live="polite" className="min-h-[2.75rem] text-ink text-[15px] leading-snug">
        {display.lines.length > 0 ? (
          display.lines.slice(-3).map((l, i, arr) => (
            <p key={`${display.dieNonce}-${i}`} className={i === arr.length - 1 ? "font-semibold" : "text-ink-soft"}>
              {l}
            </p>
          ))
        ) : (
          <p className="text-ink-muted">{UI.hint}</p>
        )}
      </div>
    </div>
  );
}

export default TurnPanel;
