// Geometrie desky: Bézierovy trasy a rozmístění figurek. Čisté funkce bez Reactu.

import { BOARD, type BoardDef, type ClimberColor, type Route } from "../data/board";
import { HUB_FIELD } from "./engine";

export type XY = [number, number];

export function bezier(p0: XY, c: XY, p1: XY, t: number): XY {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * t * u * c[0] + t * t * p1[0], u * u * p0[1] + 2 * t * u * c[1] + t * t * p1[1]];
}

/** Tečna kvadratického Bézieru (nenormovaná). */
export function bezierTangent(p0: XY, c: XY, p1: XY, t: number): XY {
  return [2 * (1 - t) * (c[0] - p0[0]) + 2 * t * (p1[0] - c[0]), 2 * (1 - t) * (c[1] - p0[1]) + 2 * t * (p1[1] - c[1])];
}

export function fieldCenter(n: number, board: BoardDef = BOARD): XY {
  const f = board.fields[n - 1];
  return [f.pos[0], f.pos[1]];
}

export function findRoute(from: number, to: number, board: BoardDef = BOARD): Route | undefined {
  return board.routes.find((r) => r.from === from && r.to === to);
}

/** Body na trase (bez počátečního bodu), rovnoměrně podle parametru t. */
export function routePoints(route: Route, segments: number, board: BoardDef = BOARD): XY[] {
  const p0 = fieldCenter(route.from, board);
  const p1 = fieldCenter(route.to, board);
  const out: XY[] = [];
  for (let k = 1; k <= segments; k++) out.push(bezier(p0, route.control, p1, k / segments));
  return out;
}

export function routePath(route: Route, board: BoardDef = BOARD): string {
  const p0 = fieldCenter(route.from, board);
  const p1 = fieldCenter(route.to, board);
  return `M ${p0[0]} ${p0[1]} Q ${route.control[0]} ${route.control[1]} ${p1[0]} ${p1[1]}`;
}

export interface TokenPlace {
  id: string;
  index: number;          // pořadí horolezce (0–3)
  color: ClimberColor;
  pos: number;
  waiting?: boolean;      // stojí (skipTurns > 0): na hoře 13 jde na barevné místo
}

const SPREAD: Record<number, number[]> = {
  1: [0],
  2: [-8, 8],
  3: [-10, 0, 10],
  4: [-12, -4, 4, 12],
};

/** Souřadnice paty každé figurky: start podle pořadí, vrchol podle barvy, víc figurek se rozestoupí. */
export function layoutTokens(tokens: TokenPlace[], board: BoardDef = BOARD): Record<string, XY> {
  const out: Record<string, XY> = {};
  const byField = new Map<number, TokenPlace[]>();
  for (const t of tokens) {
    if (t.pos <= 0) {
      const s = board.spots.start[t.index] ?? board.spots.start[0];
      out[t.id] = [s[0], s[1]];
    } else if (t.pos >= board.summit) {
      const s = board.spots.summit[t.color];
      out[t.id] = [s[0], s[1]];
    } else {
      const list = byField.get(t.pos) ?? [];
      list.push(t);
      byField.set(t.pos, list);
    }
  }
  for (const [n, list] of byField) {
    list.sort((a, b) => a.index - b.index);
    const [cx, cy] = fieldCenter(n, board);
    if (n === HUB_FIELD) {
      hora13(list, [cx, cy], board).forEach(([id, xy]) => { out[id] = xy; });
      continue;
    }
    const offsets = SPREAD[list.length] ?? SPREAD[4];
    list.forEach((t, i) => { out[t.id] = [cx + offsets[i], cy]; });
  }
  return out;
}

/**
 * Hora 13 má tři místa: kotouč a dvě barevná místa (spots.hub13). Figurky se nepřekrývají:
 * čekající (skipTurns > 0) stojí na barevných místech, ostatní na kotouči. Kdo se do své skupiny
 * nevejde, doplní volná místa v pořadí kotouč → první → druhé barevné místo. Rozestoupí se jen
 * čtvrtá figurka (sdílí místo své skupiny: kotouč, nebo druhé barevné místo).
 */
function hora13(list: TokenPlace[], disc: XY, board: BoardDef): [string, XY][] {
  const hub = board.spots.hub13;
  const places: XY[] = [disc, [hub[0][0], hub[0][1]], [hub[1][0], hub[1][1]]];
  const slots: TokenPlace[][] = [[], [], []];
  const rest: TokenPlace[] = [];
  for (const t of list) {
    if (t.waiting) {
      const k = slots[1].length === 0 ? 1 : slots[2].length === 0 ? 2 : -1;
      if (k > 0) slots[k].push(t);
      else rest.push(t);
    } else if (slots[0].length === 0) {
      slots[0].push(t);
    } else {
      rest.push(t);
    }
  }
  for (const t of rest) {
    const free = slots.findIndex((sl) => sl.length === 0);
    if (free >= 0) slots[free].push(t);
    else slots[t.waiting ? 2 : 0].push(t);
  }
  const out: [string, XY][] = [];
  slots.forEach((sl, k) => {
    const offsets = SPREAD[sl.length] ?? SPREAD[4];
    sl.forEach((t, i) => out.push([t.id, [places[k][0] + offsets[i], places[k][1]]]));
  });
  return out;
}
