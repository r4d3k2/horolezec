// Herní stav + přehrávání událostí. UI dostává jen PublicView a zobrazovaný stav.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { applyAction, createGame, toPublicView, type Action, type GameSetup, type GameState, type PublicView } from "../lib/engine";
import { buildTimeline, displayFromView, type DisplayState } from "../lib/eventPlayer";

/** Seed nové hry. Ve vývojovém režimu jde zadat parametrem ?seed=123. */
function pickSeed(): number {
  if (import.meta.env.DEV) {
    const param = new URLSearchParams(window.location.search).get("seed");
    if (param !== null && /^\d+$/.test(param)) return Number(param) >>> 0;
  }
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0];
}

export interface GameApi {
  view: PublicView | null;
  display: DisplayState | null;
  busy: boolean;
  start: (setup: GameSetup) => void;
  roll: () => void;
  playOn: () => void;
  stop: () => void;
}

export function useGame(): GameApi {
  const [game, setGame] = useState<GameState | null>(null);
  const [display, setDisplay] = useState<DisplayState | null>(null);
  const [busy, setBusy] = useState(false);

  const gameRef = useRef<GameState | null>(null);
  const displayRef = useRef<DisplayState | null>(null);
  const busyRef = useRef(false);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    for (const t of timers.current) window.clearTimeout(t);
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const show = useCallback((d: DisplayState) => {
    displayRef.current = d;
    setDisplay(d);
  }, []);

  const start = useCallback((setup: GameSetup) => {
    clearTimers();
    const g = createGame(setup, pickSeed());
    gameRef.current = g;
    busyRef.current = false;
    setGame(g);
    setBusy(false);
    show(displayFromView(toPublicView(g)));
  }, [clearTimers, show]);

  const act = useCallback((action: Action) => {
    const g = gameRef.current;
    const d = displayRef.current;
    if (!g || !d || busyRef.current) return;
    const { state: next, events } = applyAction(g, action);
    gameRef.current = next;
    setGame(next);
    const view = toPublicView(next);
    if (events.length === 0) {
      show(displayFromView(view, d));
      return;
    }
    const names = new Map<string, string>(view.climbers.map((c) => [c.id, c.seat.name]));
    const frames = buildTimeline(d, events, view.climbers, (id) => names.get(id) ?? id);

    busyRef.current = true;
    setBusy(true);
    let t = 0;
    for (const f of frames) {
      if (t === 0) show(f.state);
      else timers.current.push(window.setTimeout(() => show(f.state), t));
      t += f.duration;
    }
    timers.current.push(window.setTimeout(() => {
      show(displayFromView(view, displayRef.current ?? undefined));
      busyRef.current = false;
      setBusy(false);
    }, t));
  }, [show]);

  const roll = useCallback(() => act({ type: "roll" }), [act]);
  const playOn = useCallback(() => act({ type: "continue" }), [act]);

  const stop = useCallback(() => {
    clearTimers();
    gameRef.current = null;
    displayRef.current = null;
    busyRef.current = false;
    setGame(null);
    setDisplay(null);
    setBusy(false);
  }, [clearTimers]);

  const view = useMemo(() => (game ? toPublicView(game) : null), [game]);

  return { view, display, busy, start, roll, playOn, stop };
}
