// Herní stav + přehrávání událostí + automatické tahy počítače.
// UI dostává jen PublicView a zobrazovaný stav; plný stav (s póly) zná jen engine, úložiště
// a výsledková obrazovka po konci hry (finalState).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { applyAction, createGame, toPublicView, type Action, type GameSetup, type GameState, type PublicView } from "../lib/engine";
import { buildTimeline, displayFromView, scaled, TIMING, type DisplayState, type Tempo } from "../lib/eventPlayer";
import { recordWin, saveGame } from "../lib/storage";

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

const JOURNAL_MAX = 50;

export interface Handover {
  climberId: string;
  nonce: number;
}

export interface GameApi {
  view: PublicView | null;
  display: DisplayState | null;
  busy: boolean;
  journal: string[];            // nejnovější nahoře
  handover: Handover | null;    // po člověku přišel jiný člověk
  aiTurn: boolean;
  /** Plný stav včetně pólů – jen když je znám vítěz (pro „Kde by kdo spadl“), jinak null. */
  finalState: GameState | null;
  start: (setup: GameSetup) => void;
  resume: (state: GameState) => void;
  roll: () => void;
  playOn: () => void;
  stop: () => void;
  finishPlayback: () => void;
}

interface Options {
  tempo: Tempo;
  reduced: boolean;
}

export function useGame({ tempo, reduced }: Options): GameApi {
  const [game, setGame] = useState<GameState | null>(null);
  const [display, setDisplay] = useState<DisplayState | null>(null);
  const [busy, setBusy] = useState(false);
  const [journal, setJournal] = useState<string[]>([]);
  const [handover, setHandover] = useState<Handover | null>(null);

  const gameRef = useRef<GameState | null>(null);
  const displayRef = useRef<DisplayState | null>(null);
  const busyRef = useRef(false);
  const timers = useRef<number[]>([]);
  const finalizeRef = useRef<(() => void) | null>(null);
  const lastHumanRef = useRef<string | null>(null);
  const reducedRef = useRef(reduced);
  const tempoRef = useRef(tempo);

  useEffect(() => {
    reducedRef.current = reduced;
    tempoRef.current = tempo;
  }, [reduced, tempo]);

  const clearTimers = useCallback(() => {
    for (const t of timers.current) window.clearTimeout(t);
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const show = useCallback((d: DisplayState) => {
    displayRef.current = d;
    setDisplay(d);
  }, []);

  const load = useCallback((g: GameState) => {
    clearTimers();
    finalizeRef.current = null;
    gameRef.current = g;
    busyRef.current = false;
    lastHumanRef.current = null;
    setGame(g);
    setBusy(false);
    setJournal([]);
    setHandover(null);
    show(displayFromView(toPublicView(g)));
  }, [clearTimers, show]);

  const start = useCallback((setup: GameSetup) => {
    const g = createGame(setup, pickSeed());
    saveGame(g);
    load(g);
  }, [load]);

  const resume = useCallback((g: GameState) => load(g), [load]);

  const act = useCallback((action: Action) => {
    const g = gameRef.current;
    const d = displayRef.current;
    if (!g || !d || busyRef.current) return;
    const actor = g.climbers[g.current];
    const { state: next, events } = applyAction(g, action);
    if (events.length === 0 && next === g) return;
    gameRef.current = next;
    setGame(next);
    saveGame(next);
    // Statistiky: výprava se započítá jednou, ve chvíli, kdy je poprvé znám vítěz.
    if (g.phase === "playing" && !g.playOn && next.phase !== "playing") {
      const winner = next.climbers.find((c) => c.finishedRank === 1);
      if (winner) recordWin(winner.seat.name, winner.stats.turns);
    }
    if (action.type === "roll" && actor.seat.kind === "human") lastHumanRef.current = actor.id;

    const view = toPublicView(next);
    const names = new Map<string, string>(view.climbers.map((c) => [c.id, c.seat.name]));
    const frames = events.length > 0
      ? buildTimeline(d, events, view.climbers, (id) => names.get(id) ?? id, { reduced: reducedRef.current, tempo: tempoRef.current })
      : [];
    const last = frames.length > 0 ? frames[frames.length - 1].state : d;

    const finalize = () => {
      finalizeRef.current = null;
      clearTimers();
      const cur = displayRef.current ?? last;
      // Efekty figurek se vrátí do klidu (i když se přehrávání přeskočilo uprostřed pádu).
      const fx = Object.fromEntries(Object.entries(cur.fx).map(([id, f]) => [id, { kind: "none" as const, nonce: f.nonce }]));
      show(displayFromView(view, {
        ...cur,
        fx,
        lines: last.lines,
        die: last.die,
        dieNonce: last.dieNonce,
        colorDie: last.colorDie,
        colorNonce: last.colorNonce,
      }));
      if (last.lines.length > 0 && frames.length > 0) {
        setJournal((prev) => [...[...last.lines].reverse(), ...prev].slice(0, JOURNAL_MAX));
      }
      busyRef.current = false;
      setBusy(false);
      // Předávání zařízení: po člověku přichází jiný člověk.
      const nextClimber = view.climbers[view.current];
      if (
        view.phase === "playing" &&
        nextClimber.seat.kind === "human" &&
        lastHumanRef.current !== null &&
        lastHumanRef.current !== nextClimber.id
      ) {
        setHandover((h) => ({ climberId: nextClimber.id, nonce: (h?.nonce ?? 0) + 1 }));
      } else if (nextClimber.seat.kind === "human" && lastHumanRef.current === nextClimber.id) {
        setHandover(null);
      }
    };

    if (frames.length === 0) {
      displayRef.current = { ...last, fx: d.fx };
      finalize();
      return;
    }

    busyRef.current = true;
    setBusy(true);
    finalizeRef.current = finalize;
    let t = 0;
    for (const f of frames) {
      if (t === 0) show(f.state);
      else timers.current.push(window.setTimeout(() => show(f.state), t));
      t += f.duration;
    }
    // Pauza mezi tahy: konečný stav chvíli drží, teprve pak je na tahu další.
    timers.current.push(window.setTimeout(finalize, t + scaled(TIMING.between, tempoRef.current)));
  }, [clearTimers, show]);

  const view = useMemo(() => (game ? toPublicView(game) : null), [game]);
  const current = view ? view.climbers[view.current] : null;
  const aiTurn = !!view && view.phase === "playing" && current?.seat.kind === "ai";

  const finalState = game && game.phase !== "playing" ? game : null;

  // Počítač nemá co rozhodovat: po pauze (1400 ms × tempo) za něj odešleme hod.
  useEffect(() => {
    if (!aiTurn || busy) return;
    const t = window.setTimeout(() => act({ type: "roll" }), scaled(TIMING.aiPause, tempo));
    return () => window.clearTimeout(t);
  }, [aiTurn, busy, tempo, act, game]);

  const roll = useCallback(() => {
    const g = gameRef.current;
    if (!g || g.climbers[g.current].seat.kind !== "human") return;
    act({ type: "roll" });
  }, [act]);

  const playOn = useCallback(() => act({ type: "continue" }), [act]);

  const finishPlayback = useCallback(() => {
    finalizeRef.current?.();
  }, []);

  const stop = useCallback(() => {
    clearTimers();
    finalizeRef.current = null;
    gameRef.current = null;
    displayRef.current = null;
    busyRef.current = false;
    lastHumanRef.current = null;
    setGame(null);
    setDisplay(null);
    setBusy(false);
    setJournal([]);
    setHandover(null);
  }, [clearTimers]);

  return { view, display, busy, journal, handover, aiTurn, finalState, start, resume, roll, playOn, stop, finishPlayback };
}
