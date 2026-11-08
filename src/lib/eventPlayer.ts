// Časová osa animací z událostí enginu. Čisté funkce bez Reactu.
// UI zobrazuje „zobrazovaný stav“, který přehrávač posouvá snímek po snímku.
// Na konci se zobrazovaný stav srovná se stavem enginu (displayFromView).

import { BOARD, type BoardDef, type DieColor } from "../data/board";
import { narrate, type NameOf } from "../data/texts";
import type { GameEvent, PublicClimber, PublicView } from "./engine";
import { fieldCenter, findRoute, layoutTokens, routePoints, type XY } from "./geometry";

export type TokenFx = "none" | "hop" | "sway" | "wobble";

export interface DisplayState {
  current: string;                                  // id horolezce na tahu
  positions: Record<string, number>;                // hora každé figurky
  overrides: Record<string, XY>;                    // přesné souřadnice během jízdy po trase / odskoku
  hidden: Record<string, boolean>;                  // prolnutí (zjednodušený pád)
  atStation: Record<string, boolean>;
  skipTurns: Record<string, number>;
  revealed: Record<string, number[]>;
  lastMove: { climberId: string; from: number; to: number } | null;
  die: number | null;
  dieNonce: number;
  colorDie: DieColor | null;                        // barevná kostka jen když se jí hází
  colorNonce: number;
  fx: Record<string, { kind: TokenFx; nonce: number }>;
  pulse: { field: number; nonce: number } | null;   // pulz červeného kroužku
  moveMs: number;                                   // délka přechodu pozice figurek v tomto snímku
  moveEase: string;
  lines: string[];                                  // hlášky poslední akce
}

export interface Frame {
  state: DisplayState;
  duration: number;                                 // jak dlouho snímek drží (ms)
}

export const TIMING = {
  roll: 600,
  stepMax: 200,
  stepTotalMax: 1200,
  blocked: 450,
  posun: 800,
  lanovka: 1100,
  zpet: 300,
  cernaSway: 250,
  cernaSlide: 800,
  fadeOut: 300,
  fadeIn: 320,
  info: 400,
  stationEnter: 250,
  extraRoll: 300,
  summit: 800,
};

/** Zobrazovaný stav přesně podle veřejného pohledu enginu. */
export function displayFromView(view: PublicView, prev?: DisplayState): DisplayState {
  const positions: Record<string, number> = {};
  const atStation: Record<string, boolean> = {};
  const skipTurns: Record<string, number> = {};
  const revealed: Record<string, number[]> = {};
  for (const c of view.climbers) {
    positions[c.id] = c.pos;
    atStation[c.id] = c.atStation;
    skipTurns[c.id] = c.skipTurns;
    revealed[c.id] = [...c.revealed];
  }
  return {
    current: view.climbers[view.current]?.id ?? view.climbers[0].id,
    positions,
    overrides: {},
    hidden: {},
    atStation,
    skipTurns,
    revealed,
    lastMove: view.lastMove ? { ...view.lastMove } : null,
    die: prev?.die ?? null,
    dieNonce: prev?.dieNonce ?? 0,
    colorDie: prev?.colorDie ?? null,
    colorNonce: prev?.colorNonce ?? 0,
    fx: prev?.fx ?? {},
    pulse: null,
    moveMs: 300,
    moveEase: "ease-out",
    lines: prev?.lines ?? [],
  };
}

function without<T>(rec: Record<string, T>, key: string): Record<string, T> {
  const out = { ...rec };
  delete out[key];
  return out;
}

function lerp(a: XY, b: XY, t: number): XY {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** Sestaví snímky animace pro události jedné akce. */
export function buildTimeline(
  start: DisplayState,
  events: GameEvent[],
  climbers: PublicClimber[],
  nameOf: NameOf,
  board: BoardDef = BOARD,
): Frame[] {
  const frames: Frame[] = [];
  const narration = narrate(events, nameOf);
  let st: DisplayState = {
    ...start,
    overrides: {},
    hidden: {},
    lastMove: null,
    colorDie: null,
    pulse: null,
    lines: [],
  };

  const push = (patch: Partial<DisplayState>, duration: number) => {
    st = { ...st, ...patch };
    frames.push({ state: st, duration });
  };
  const fx = (id: string, kind: TokenFx) => ({ ...st.fx, [id]: { kind, nonce: (st.fx[id]?.nonce ?? 0) + 1 } });
  const xyOf = (id: string): XY => {
    const places = climbers.map((c, index) => ({ id: c.id, index, color: c.seat.color, pos: st.positions[c.id] ?? 0 }));
    return st.overrides[id] ?? layoutTokens(places, board)[id] ?? [0, 0];
  };

  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const before = frames.length;

    switch (e.type) {
      case "turn":
        st = { ...st, current: e.climberId };
        break;

      case "roll":
        push({ current: e.climberId, die: e.value, dieNonce: st.dieNonce + 1 }, TIMING.roll);
        break;

      case "colorRoll":
        push({
          colorDie: e.color,
          colorNonce: st.colorNonce + 1,
          atStation: { ...st.atStation, [e.climberId]: false },
        }, TIMING.roll);
        break;

      case "step": {
        // 200 ms na horu, celý pohyb nejvýš 1200 ms: délka celé souvislé řady kroků.
        let first = i;
        while (first > 0 && events[first - 1].type === "step") first--;
        let total = 0;
        for (let k = first; events[k]?.type === "step"; k++) total++;
        const per = Math.min(TIMING.stepMax, Math.floor(TIMING.stepTotalMax / total));
        push({ positions: { ...st.positions, [e.climberId]: e.to }, moveMs: per, moveEase: "ease-in-out" }, per);
        break;
      }

      case "blocked": {
        const from = xyOf(e.climberId);
        const half = Math.round(TIMING.blocked / 2);
        const mid = lerp(from, fieldCenter(e.at, board), 0.4);
        push({
          overrides: { ...st.overrides, [e.climberId]: mid },
          moveMs: half,
          moveEase: "ease-out",
          pulse: { field: e.at, nonce: (st.pulse?.nonce ?? 0) + 1 },
        }, half);
        push({ overrides: without(st.overrides, e.climberId), moveMs: half, moveEase: "ease-in" }, half);
        break;
      }

      case "overshoot":
        push({ fx: fx(e.climberId, "sway") }, TIMING.info);
        break;

      case "move": {
        const id = e.climberId;
        if (e.how === "posun" || e.how === "lanovka") {
          const route = findRoute(e.from, e.to, board);
          const total = e.how === "posun" ? TIMING.posun : TIMING.lanovka;
          if (route) {
            const segs = e.how === "posun" ? 8 : 11;
            const per = Math.round(total / segs);
            const pts = routePoints(route, segs, board);
            pts.slice(0, -1).forEach((p) => {
              push({ overrides: { ...st.overrides, [id]: p }, moveMs: per, moveEase: "linear" }, per);
            });
            push({
              positions: { ...st.positions, [id]: e.to },
              overrides: without(st.overrides, id),
              moveMs: per,
              moveEase: "ease-out",
            }, per);
          } else {
            push({ positions: { ...st.positions, [id]: e.to }, moveMs: total, moveEase: "ease-in-out" }, total);
          }
        } else if (e.how === "zpet") {
          push({ positions: { ...st.positions, [id]: e.to }, moveMs: TIMING.zpet, moveEase: "ease-in-out" }, TIMING.zpet);
        } else {
          // černá: krátké kývnutí a sjezd na horu 13 po přímce
          push({ fx: fx(id, "wobble"), atStation: { ...st.atStation, [id]: false } }, TIMING.cernaSway);
          push({ positions: { ...st.positions, [id]: e.to }, moveMs: TIMING.cernaSlide, moveEase: "ease-in" }, TIMING.cernaSlide);
        }
        break;
      }

      case "magnetFall": {
        // Fáze 1: zjednodušený pád – prolnutí ven, značka magnetu, prolnutí dovnitř na cíli.
        const id = e.climberId;
        const rev = st.revealed[id] ?? [];
        push({ hidden: { ...st.hidden, [id]: true } }, TIMING.fadeOut);
        push({
          positions: { ...st.positions, [id]: e.to },
          moveMs: 0,
          revealed: { ...st.revealed, [id]: rev.includes(e.at) ? rev : [...rev, e.at] },
          atStation: { ...st.atStation, [id]: false },
          skipTurns: { ...st.skipTurns, [id]: e.wait },
        }, 60);
        push({ hidden: without(st.hidden, id), moveMs: 200 }, TIMING.fadeIn);
        break;
      }

      case "wait":
        push({ skipTurns: { ...st.skipTurns, [e.climberId]: e.turns }, fx: fx(e.climberId, "sway") }, TIMING.info);
        break;

      case "skip":
        push({ current: e.climberId, skipTurns: { ...st.skipTurns, [e.climberId]: e.remaining }, fx: fx(e.climberId, "sway") }, TIMING.info);
        break;

      case "stationMiss":
        push({ fx: fx(e.climberId, "sway") }, TIMING.info);
        break;

      case "stationEnter":
        push({ atStation: { ...st.atStation, [e.climberId]: true } }, TIMING.stationEnter);
        break;

      case "extraRoll":
        push({}, TIMING.extraRoll);
        break;

      case "knockOut": {
        const v = e.victimId;
        push({ hidden: { ...st.hidden, [v]: true } }, TIMING.fadeOut);
        push({
          positions: { ...st.positions, [v]: e.to },
          atStation: { ...st.atStation, [v]: false },
          moveMs: 0,
        }, 60);
        push({ hidden: without(st.hidden, v), moveMs: 200 }, TIMING.fadeIn);
        break;
      }

      case "summit":
        push({
          fx: fx(e.climberId, "hop"),
          atStation: { ...st.atStation, [e.climberId]: false },
          skipTurns: { ...st.skipTurns, [e.climberId]: 0 },
          moveMs: 300,
          moveEase: "ease-out",
        }, TIMING.summit);
        break;

      case "gameWon":
      case "gameOver":
        break;
    }

    // Hlášky, které patří za tuto událost.
    const add = narration.filter((l) => l.at === i).map((l) => l.text);
    if (add.length > 0) {
      const lines = [...st.lines, ...add];
      if (frames.length > before) {
        st = { ...st, lines };
        frames[frames.length - 1] = { ...frames[frames.length - 1], state: st };
      } else {
        push({ lines }, 0);
      }
    }
  }
  return frames;
}
