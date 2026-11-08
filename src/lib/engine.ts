// Engine Horolezce: čistý reducer (stav, akce) → (stav, události).
// Bez Reactu a bez náhody prohlížeče – veškerá náhoda jde přes seedovaný generátor uložený ve stavu.

import { BOARD, type BoardDef, type ClimberColor, type DieColor, type FieldDef, type Pole } from "../data/board";
import { Rng } from "./rng";
import type { Rules } from "./rules";

export type SeatKind = "human" | "ai";
export interface SeatSetup { name: string; color: ClimberColor; kind: SeatKind; }
export interface GameSetup { seats: SeatSetup[]; rules: Rules; }      // 2–4 místa

export interface ClimberStats {
  turns: number;            // tahy včetně přeskočených (= počet kol pro validátor)
  rolls: number; magnetFalls: number; rides: number; blocked: number; waits: number; knockedOthers: number;
}

export type ClimberId = "c0" | "c1" | "c2" | "c3";

export interface ClimberState {
  id: ClimberId;                      // stabilní ID = klíč figurky v Reactu
  seat: SeatSetup;
  pos: number;                        // 0 = pod horou, 27 = vrchol
  skipTurns: number;
  atStation: boolean;                 // čeká u lanovky na hoře 20
  pole: Pole | null;                  // TAJNÉ
  danger: number[];                   // TAJNÉ, odvozené z pólů
  revealed: number[];                 // hory, kde spadl (veřejné)
  knownSafe: number[];                // hory se zkouškou, kde nespadl (veřejné)
  finishedRank: number | null;
  stats: ClimberStats;
}

export type Phase = "playing" | "won" | "over";

export interface GameState {
  schema: 2;
  seed: number;
  rng: number;                        // aktuální stav generátoru
  rules: Rules;
  fieldPoles: Record<number, Pole>;   // TAJNÉ (prázdné při magnets: false)
  climbers: ClimberState[];
  current: number;
  extraRoll: boolean;
  turnNo: number;
  phase: Phase;
  playOn: boolean;
  lastMove: { climberId: string; from: number; to: number } | null;
}

export type Action = { type: "roll" } | { type: "continue" };

export type GameEvent =
  | { type: "turn"; climberId: string }
  | { type: "roll"; climberId: string; value: number }
  | { type: "colorRoll"; climberId: string; color: DieColor }
  | { type: "step"; climberId: string; to: number }                     // jedna hora vpřed
  | { type: "blocked"; climberId: string; at: number }                  // červený kroužek
  | { type: "overshoot"; climberId: string; missing: number }
  | { type: "move"; climberId: string; from: number; to: number; how: "posun" | "lanovka" | "zpet" | "cerna" }
  | { type: "magnetFall"; climberId: string; at: number; to: number; wait: number }
  | { type: "wait"; climberId: string; turns: number }                  // hora 17
  | { type: "stationEnter"; climberId: string }
  | { type: "stationMiss"; climberId: string; value: number }
  | { type: "extraRoll"; climberId: string; reason: "field" | "six" }
  | { type: "skip"; climberId: string; remaining: number }
  | { type: "knockOut"; climberId: string; victimId: string; at: number; to: number }
  | { type: "summit"; climberId: string; rank: number }
  | { type: "gameWon"; climberId: string }
  | { type: "gameOver"; ranking: string[] };

export type PublicClimber = Omit<ClimberState, "pole" | "danger">;
export type PublicView = Omit<GameState, "climbers" | "fieldPoles"> & { climbers: PublicClimber[] };

const CLIMBER_IDS: ClimberId[] = ["c0", "c1", "c2", "c3"];

/** Hory se zkouškou magnetu (mají pravidlo pádu), vzestupně. */
export function fallFields(board: BoardDef = BOARD): number[] {
  return board.fields.filter((f) => f.fall).map((f) => f.n);
}

function emptyStats(): ClimberStats {
  return { turns: 0, rolls: 0, magnetFalls: 0, rides: 0, blocked: 0, waits: 0, knockedOthers: 0 };
}

export function createGame(setup: GameSetup, seed: number, board: BoardDef = BOARD): GameState {
  const n = setup.seats.length;
  if (n < 2 || n > 4) throw new Error(`Horolezec je pro 2–4 hráče, zadáno ${n}.`);
  const rng = new Rng(seed >>> 0);
  const rules = { ...setup.rules };

  // Pevné pořadí losování: póly hor, póly horolezců, začínající hráč.
  const fieldPoles: Record<number, Pole> = {};
  const climberPoles: (Pole | null)[] = setup.seats.map(() => null);
  if (rules.magnets) {
    const fields = fallFields(board);
    const half = Math.floor(fields.length / 2);
    const poles = rng.shuffle<Pole>(fields.map((_, i) => (i < half ? "N" : "S")));
    fields.forEach((f, i) => { fieldPoles[f] = poles[i]; });

    const first: Pole = rng.next() < 0.5 ? "N" : "S";
    const other: Pole = first === "N" ? "S" : "N";
    const seatPoles = rng.shuffle<Pole>(setup.seats.map((_, i) => (i % 2 === 0 ? first : other)));
    seatPoles.forEach((p, i) => { climberPoles[i] = p; });
  }
  const current = rng.int(n);

  const climbers: ClimberState[] = setup.seats.map((seat, i) => {
    const pole = climberPoles[i];
    const danger = pole === null
      ? []
      : Object.keys(fieldPoles).map(Number).filter((f) => fieldPoles[f] === pole).sort((a, b) => a - b);
    return {
      id: CLIMBER_IDS[i],
      seat: { ...seat },
      pos: 0,
      skipTurns: 0,
      atStation: false,
      pole,
      danger,
      revealed: [],
      knownSafe: [],
      finishedRank: null,
      stats: emptyStats(),
    };
  });

  return {
    schema: 2,
    seed: seed >>> 0,
    rng: rng.state,
    rules,
    fieldPoles,
    climbers,
    current,
    extraRoll: false,
    turnNo: 0,
    phase: "playing",
    playOn: false,
    lastMove: null,
  };
}

/** Hluboká kopie stavu (rychlejší než JSON, vstupní stav se nikdy nemutuje). */
export function cloneState(s: GameState): GameState {
  return {
    ...s,
    rules: { ...s.rules },
    fieldPoles: { ...s.fieldPoles },
    climbers: s.climbers.map((c) => ({
      ...c,
      seat: { ...c.seat },
      danger: [...c.danger],
      revealed: [...c.revealed],
      knownSafe: [...c.knownSafe],
      stats: { ...c.stats },
    })),
    lastMove: s.lastMove ? { ...s.lastMove } : null,
  };
}

export function legalActions(state: GameState): Action["type"][] {
  if (state.phase === "playing") return ["roll"];
  if (state.phase === "won") return ["continue"];
  return [];
}

/** Pracovní kontext jedné akce. */
interface Ctx {
  s: GameState;
  board: BoardDef;
  rng: Rng;
  events: GameEvent[];
  /** Tah neskončil normálně (pád, zákaz, přehoz, posun zpět, černá, stanice) – bez hodu navíc za šestku. */
  abnormal: boolean;
}

export function applyAction(state: GameState, action: Action, board: BoardDef = BOARD): { state: GameState; events: GameEvent[] } {
  if (!legalActions(state).includes(action.type)) return { state, events: [] };
  const s = cloneState(state);

  if (action.type === "continue") {
    s.phase = "playing";
    s.playOn = true;
    return { state: s, events: [] };
  }

  const ctx: Ctx = { s, board, rng: new Rng(s.rng), events: [], abnormal: false };
  rollTurn(ctx);
  s.rng = ctx.rng.state;
  return { state: s, events: ctx.events };
}

function rollTurn(ctx: Ctx): void {
  const { s } = ctx;
  const c = s.climbers[s.current];
  const id = c.id;
  const isExtra = s.extraRoll;
  s.extraRoll = false;
  s.lastMove = null;

  if (!isExtra) {
    s.turnNo += 1;
    c.stats.turns += 1;
    ctx.events.push({ type: "turn", climberId: id });
  }

  // 1. Horolezec stojí.
  if (c.skipTurns > 0) {
    c.skipTurns -= 1;
    c.stats.waits += 1;
    ctx.events.push({ type: "skip", climberId: id, remaining: c.skipTurns });
    endTurn(ctx);
    return;
  }

  const from = c.pos;

  // 2. Čeká u lanovky na hoře 20.
  if (c.atStation) {
    ctx.abnormal = true;
    const value = ctx.rng.d6();
    c.stats.rolls += 1;
    ctx.events.push({ type: "roll", climberId: id, value });
    if (value !== 6) {
      c.stats.waits += 1;
      ctx.events.push({ type: "stationMiss", climberId: id, value });
    } else {
      colorRoll(ctx, c);
    }
    finishMove(ctx, c, from);
    endTurn(ctx);
    return;
  }

  // 3. Normální hod.
  const value = ctx.rng.d6();
  c.stats.rolls += 1;
  ctx.events.push({ type: "roll", climberId: id, value });
  let target = c.pos + value;
  const summit = ctx.board.summit;
  if (target > summit) {
    if (s.rules.exactFinish) {
      ctx.abnormal = true;
      ctx.events.push({ type: "overshoot", climberId: id, missing: summit - c.pos });
      endTurn(ctx);
      return;
    }
    target = summit;
  }

  // 4. Červený kroužek.
  const targetDef = fieldAt(ctx, target);
  if (s.rules.redRing === "zakaz" && targetDef?.redRing) {
    ctx.abnormal = true;
    c.stats.blocked += 1;
    ctx.events.push({ type: "blocked", climberId: id, at: target });
    endTurn(ctx);
    return;
  }

  for (let p = c.pos + 1; p <= target; p++) {
    ctx.events.push({ type: "step", climberId: id, to: p });
  }
  c.pos = target;

  // 5. Příchod na horu.
  land(ctx, c, target);

  // 6. Volitelná pravidla.
  finishMove(ctx, c, from);
  if (
    s.rules.sixAgain && value === 6 && !ctx.abnormal && !s.extraRoll &&
    c.finishedRank === null && !c.atStation && c.skipTurns === 0 && s.phase === "playing"
  ) {
    s.extraRoll = true;
    ctx.events.push({ type: "extraRoll", climberId: id, reason: "six" });
  }
  endTurn(ctx);
}

function fieldAt(ctx: Ctx, n: number): FieldDef | undefined {
  return n >= 1 ? ctx.board.fields[n - 1] : undefined;
}

/** Příchod na horu: zkouška magnetu, pak účinek hory. */
function land(ctx: Ctx, c: ClimberState, n: number): void {
  const { s } = ctx;
  if (n === ctx.board.summit) {
    reachSummit(ctx, c);
    return;
  }
  const def = fieldAt(ctx, n);
  if (!def) return;

  // a) Zkouška magnetu.
  if (def.fall && s.rules.magnets) {
    if (c.danger.includes(n)) {
      ctx.abnormal = true;
      const { to, wait } = def.fall;
      c.stats.magnetFalls += 1;
      if (!c.revealed.includes(n)) c.revealed.push(n);
      c.atStation = false;
      c.pos = to;
      c.skipTurns = wait;
      ctx.events.push({ type: "magnetFall", climberId: c.id, at: n, to, wait });
      // Pád na jinou horu se zkouškou (25 → 13): zkouší se i tam.
      if (to !== n && to >= 1) {
        const toDef = fieldAt(ctx, to);
        if (toDef?.fall) land(ctx, c, to);
      }
      return;
    }
    if (!c.knownSafe.includes(n)) c.knownSafe.push(n);
  }

  // b) Účinek hory.
  const effect = def.effect;
  if (!effect) return;
  switch (effect.kind) {
    case "hodZnovu":
      s.extraRoll = true;
      ctx.events.push({ type: "extraRoll", climberId: c.id, reason: "field" });
      return;
    case "posun": {
      const back = effect.to < n;
      if (back) ctx.abnormal = true;
      c.pos = effect.to;
      ctx.events.push({ type: "move", climberId: c.id, from: n, to: effect.to, how: back ? "zpet" : "posun" });
      land(ctx, c, effect.to);
      return;
    }
    case "cekat":
      c.skipTurns = effect.turns;
      ctx.events.push({ type: "wait", climberId: c.id, turns: effect.turns });
      return;
    case "stanice":
      c.atStation = true;
      ctx.events.push({ type: "stationEnter", climberId: c.id });
      return;
    case "barevnaKostka":
      colorRoll(ctx, c);
      return;
  }
}

/** Hod barevnou kostkou (hora 24 hned, hora 20 po šestce). */
function colorRoll(ctx: Ctx, c: ClimberState): void {
  const { s, board } = ctx;
  const faces = board.colorDie.faces;
  const color = faces[ctx.rng.int(faces.length)];
  ctx.events.push({ type: "colorRoll", climberId: c.id, color });
  const from = c.pos;
  c.atStation = false;

  if (color === "black") {
    ctx.abnormal = true;
    const to = board.colorDie.blackTo;
    c.pos = to;
    ctx.events.push({ type: "move", climberId: c.id, from, to, how: "cerna" });
    land(ctx, c, to);
    return;
  }
  if (s.rules.colorDie === "jinaNezCerna" || color === c.seat.color) {
    const to = board.colorDie.successTo;
    c.pos = to;
    c.stats.rides += 1;
    ctx.events.push({ type: "move", climberId: c.id, from, to, how: "lanovka" });
    land(ctx, c, to);
  }
  // vlastniBarva a cizí barva: nic, od dalšího tahu se hraje normálně.
}

function reachSummit(ctx: Ctx, c: ClimberState): void {
  const { s } = ctx;
  c.pos = ctx.board.summit;
  c.atStation = false;
  c.skipTurns = 0;
  s.extraRoll = false;
  const rank = s.climbers.filter((x) => x.finishedRank !== null).length + 1;
  c.finishedRank = rank;
  ctx.events.push({ type: "summit", climberId: c.id, rank });

  const climbing = s.climbers.filter((x) => x.finishedRank === null);
  if (rank === 1) ctx.events.push({ type: "gameWon", climberId: c.id });
  if (climbing.length === 1) {
    climbing[0].finishedRank = rank + 1;
    s.phase = "over";
    const ranking = [...s.climbers]
      .sort((a, b) => (a.finishedRank ?? 99) - (b.finishedRank ?? 99))
      .map((x) => x.id);
    ctx.events.push({ type: "gameOver", ranking });
  } else if (rank === 1) {
    s.phase = "won";
  }
}

/** Po přesunu: vyhazování a záznam posledního tahu. */
function finishMove(ctx: Ctx, c: ClimberState, from: number): void {
  const { s, board } = ctx;
  if (c.pos !== from) s.lastMove = { climberId: c.id, from, to: c.pos };
  if (!s.rules.knockOut || c.pos === from) return;
  const p = c.pos;
  if (p === 0 || p === board.colorDie.blackTo || p === board.summit) return;
  for (const other of s.climbers) {
    if (other.id === c.id || other.pos !== p || other.finishedRank !== null) continue;
    other.pos = 0;
    other.atStation = false;
    c.stats.knockedOthers += 1;
    ctx.events.push({ type: "knockOut", climberId: c.id, victimId: other.id, at: p, to: 0 });
  }
}

/** Na tahu je další horolezec v pořadí, který nedokončil (při hodu navíc zůstává stejný). */
function endTurn(ctx: Ctx): void {
  const { s } = ctx;
  if (s.phase === "over") return;
  const me = s.climbers[s.current];
  if (s.extraRoll && me.finishedRank === null) return;
  s.extraRoll = false;
  const n = s.climbers.length;
  for (let k = 1; k <= n; k++) {
    const i = (s.current + k) % n;
    if (s.climbers[i].finishedRank === null) {
      s.current = i;
      return;
    }
  }
}

export function toPublicView(state: GameState): PublicView {
  const { climbers, fieldPoles: _secret, ...rest } = state;
  void _secret;
  return {
    ...rest,
    rules: { ...state.rules },
    lastMove: state.lastMove ? { ...state.lastMove } : null,
    climbers: climbers.map(({ pole: _p, danger: _d, ...pub }) => {
      void _p; void _d;
      return {
        ...pub,
        seat: { ...pub.seat },
        revealed: [...pub.revealed],
        knownSafe: [...pub.knownSafe],
        stats: { ...pub.stats },
      };
    }),
  };
}

/** Z událostí spočítá konečné pozice horolezců. */
export function replayPositions(start: Record<string, number>, events: GameEvent[]): Record<string, number> {
  const pos = { ...start };
  for (const e of events) {
    switch (e.type) {
      case "step": pos[e.climberId] = e.to; break;
      case "move": pos[e.climberId] = e.to; break;
      case "magnetFall": pos[e.climberId] = e.to; break;
      case "knockOut": pos[e.victimId] = e.to; break;
      default: break;
    }
  }
  return pos;
}
