// Časová osa animací z událostí enginu. Čisté funkce bez Reactu.
// UI zobrazuje „zobrazovaný stav“, který přehrávač posouvá snímek po snímku.
// Na konci se zobrazovaný stav srovná se stavem enginu (displayFromView).

import { BOARD, type BoardDef, type DieColor } from "../data/board";
import { narrate, type NameOf } from "../data/texts";
import type { GameEvent, PublicClimber, PublicView } from "./engine";
import { bezier, fieldCenter, findRoute, layoutTokens, type XY } from "./geometry";

export type TokenFx = "none" | "hop" | "step" | "sway" | "wobble" | "magnetSway" | "tip" | "lying" | "rise";

/** Tempo hry: násobí všechny animace i pauzy (Pomalu ×1,4 / Normálně ×1 / Rychle ×0,5). */
export type Tempo = "slow" | "normal" | "fast";
export const TEMPOS: Tempo[] = ["slow", "normal", "fast"];
export const TEMPO_FACTOR: Record<Tempo, number> = { slow: 1.4, normal: 1, fast: 0.5 };

export interface TokenFxState {
  kind: TokenFx;
  nonce: number;
  ms?: number;                                      // vlastní délka animace (jinak podle CSS)
}

export interface DisplayState {
  current: string;                                  // id horolezce na tahu
  positions: Record<string, number>;                // hora každé figurky
  overrides: Record<string, XY>;                    // přesné souřadnice během jízdy po trase, odskoku a pádu
  hidden: Record<string, boolean>;                  // prolnutí (omezení pohybu)
  atStation: Record<string, boolean>;
  skipTurns: Record<string, number>;
  revealed: Record<string, number[]>;
  lastMove: { climberId: string; from: number; to: number } | null;
  die: number | null;
  dieNonce: number;
  colorDie: DieColor | null;                        // barevná kostka jen když se jí hází
  colorNonce: number;
  fx: Record<string, TokenFxState>;
  pulse: { field: number; nonce: number } | null;   // pulz červeného kroužku
  ride: string | null;                              // kdo jede lanovkou (kabinka jede s figurkou)
  flagNonce: number;                                // zavlání vlajky na vrcholu
  moveMs: number;                                   // délka přechodu pozice figurek v tomto snímku
  moveEase: string;
  fadeMs: number;
  lines: string[];                                  // hlášky poslední akce
}

export interface Frame {
  state: DisplayState;
  duration: number;                                 // jak dlouho snímek drží (ms)
}

export interface TimelineOptions {
  reduced?: boolean;                                // prefers-reduced-motion: vše 0 ms, jen pád 150 ms prolnutí
  tempo?: Tempo;
  board?: BoardDef;
}

/** Stůl pod deskou: sem figurka spadne. */
export const TABLE_Y = 600;

/**
 * Časování v tempu Normálně (ms), pomalé jako u deskové hry. Tempo hry násobí všechny hodnoty
 * kromě prolnutí při omezení pohybu.
 */
export const TIMING = {
  roll: 900,            // hod kostkou (s čísly i barevnou)
  rollShow: 400,        // výsledek kostky zůstane vidět, než se figurka pohne
  step: 420,            // jedna hora s poskokem (figurka se zvedne asi o 12 jednotek), celkem bez stropu
  land: 450,            // pauza po příchodu na horu, než se projeví její účinek
  posun: 1400,          // 7 → 11 po čárkované trase
  lanovka: 2000,        // lanovkou na vrchol
  zpet: 600,            // 19 → 18
  cernaSway: 400,       // černá na kostce: kývnutí
  cernaSlide: 1300,     // … a sjezd na horu 13
  fallSway: 600,        // magnetický pád: kývání
  fallDrop: 650,        // … odpadnutí na stůl
  fallLie: 700,         // … ležení na stole
  fallRise: 1000,       // … zvednutí a návrat na cíl pádu
  blocked: 900,         // odskok od červeného kroužku
  knockDrop: 500,       // vyhazování (celkem 1600): oběť spadne na stůl,
  knockLie: 400,        // … leží
  knockRise: 700,       // … a jde na své startovní místo
  summit: 1400,         // vrchol: poskok a vlajka
  summitHop: 700,
  info: 400,            // čekat, stojí, bez šestky, přehoz
  stationEnter: 250,
  extraRoll: 300,
  markPop: 200,         // značka magnetu naskočí
  badgePop: 250,
  flash: 1200,          // zvýraznění proužku „Na tahu“ při předání zařízení
  aiPause: 1400,        // pauza před tahem počítače
  between: 500,         // pauza mezi tahy
  reducedFade: 150,     // omezení pohybu: jen prolnutí při pádu
};

/** Délka v ms podle tempa hry. */
export function scaled(ms: number, tempo: Tempo = "normal"): number {
  return Math.round(ms * TEMPO_FACTOR[tempo]);
}

/** CSS proměnné s délkami animací, které běží jen v CSS (kostka, pulz kroužku, značky, vlajka). */
export function tempoCssVars(tempo: Tempo): Record<string, string> {
  const ms = (v: number) => `${scaled(v, tempo)}ms`;
  return {
    "--roll-ms": ms(TIMING.roll),
    "--pulse-ms": ms(TIMING.blocked),
    "--pop-ms": ms(TIMING.markPop),
    "--badge-ms": ms(TIMING.badgePop),
    "--flag-ms": ms(TIMING.summit),
    "--flash-ms": ms(TIMING.flash),
  };
}

/** Události, které jsou účinkem hory: před nimi je po příchodu pauza TIMING.land. */
function isLandingEffect(e: GameEvent | undefined): boolean {
  if (!e) return false;
  switch (e.type) {
    case "magnetFall":
    case "move":
    case "wait":
    case "stationEnter":
    case "colorRoll":
    case "knockOut":
      return true;
    case "extraRoll":
      return e.reason === "field";
    default:
      return false;
  }
}

/** Plynulý rozjezd a dojezd po trase. */
function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
}

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
    ride: null,
    flagNonce: prev?.flagNonce ?? 0,
    moveMs: 300,
    moveEase: "ease-out",
    fadeMs: 280,
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
  opts: TimelineOptions = {},
): Frame[] {
  const board = opts.board ?? BOARD;
  const reduced = !!opts.reduced;
  const tempo = opts.tempo ?? "normal";
  const T = (ms: number) => scaled(ms, tempo);
  const frames: Frame[] = [];
  const narration = narrate(events, nameOf);
  let st: DisplayState = {
    ...start,
    overrides: {},
    hidden: {},
    lastMove: null,
    colorDie: null,
    pulse: null,
    ride: null,
    fadeMs: reduced ? TIMING.reducedFade : 280,
    lines: [],
  };

  /** Snímek: při omezení pohybu bez přechodů a s nulovou délkou. */
  const push = (patch: Partial<DisplayState>, duration: number) => {
    st = { ...st, ...patch };
    if (reduced) st = { ...st, moveMs: 0 };
    frames.push({ state: st, duration: reduced ? 0 : duration });
  };
  const fx = (id: string, kind: TokenFx, ms?: number) => ({
    ...st.fx,
    [id]: { kind, nonce: (st.fx[id]?.nonce ?? 0) + 1, ms },
  });
  const xyOf = (id: string): XY => {
    const places = climbers.map((c, index) => ({
      id: c.id,
      index,
      color: c.seat.color,
      pos: st.positions[c.id] ?? 0,
      waiting: (st.skipTurns[c.id] ?? 0) > 0,
    }));
    return st.overrides[id] ?? layoutTokens(places, board)[id] ?? [0, 0];
  };

  /** Pád na stůl a návrat na cíl (magnet, vyhazování). */
  const fallToTable = (id: string, to: number, drop: number, lie: number, rise: number, patch: Partial<DisplayState>, risePatch: Partial<DisplayState> = {}) => {
    if (reduced) {
      // jen 150 ms prolnutí
      st = { ...st, hidden: { ...st.hidden, [id]: true } };
      frames.push({ state: st, duration: TIMING.reducedFade });
      st = { ...st, ...patch, ...risePatch, positions: { ...st.positions, [id]: to }, hidden: without(st.hidden, id), moveMs: 0 };
      frames.push({ state: st, duration: TIMING.reducedFade });
      return;
    }
    const [x] = xyOf(id);
    push({ ...patch, overrides: { ...st.overrides, [id]: [x, TABLE_Y] }, moveMs: T(drop), moveEase: "ease-in", fx: fx(id, "tip", T(drop)) }, T(drop));
    push({ fx: fx(id, "lying") }, T(lie));
    push({
      ...risePatch,
      positions: { ...st.positions, [id]: to },
      overrides: without(st.overrides, id),
      moveMs: T(rise),
      moveEase: "ease-out",
      fx: fx(id, "rise", T(rise)),
    }, T(rise));
  };

  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const before = frames.length;
    // U pádu se hláška ukáže hned na začátku, ne až po návratu figurky.
    let early = false;
    if (e.type === "magnetFall" || e.type === "knockOut") {
      const add = narration.filter((l) => l.at === i).map((l) => l.text);
      if (add.length > 0) {
        st = { ...st, lines: [...st.lines, ...add] };
        early = true;
      }
    }

    switch (e.type) {
      case "turn":
        st = { ...st, current: e.climberId };
        break;

      case "roll":
        // 900 ms kostka, 400 ms je vidět výsledek
        push({ current: e.climberId, die: e.value, dieNonce: st.dieNonce + 1 }, T(TIMING.roll) + T(TIMING.rollShow));
        break;

      case "colorRoll":
        push({
          colorDie: e.color,
          colorNonce: st.colorNonce + 1,
          atStation: { ...st.atStation, [e.climberId]: false },
        }, T(TIMING.roll) + T(TIMING.rollShow));
        break;

      case "step": {
        // Jedna hora s poskokem, bez stropu na celý pohyb.
        const ms = T(TIMING.step);
        push({
          positions: { ...st.positions, [e.climberId]: e.to },
          moveMs: ms,
          moveEase: "ease-in-out",
          fx: fx(e.climberId, "step", ms),
        }, ms);
        break;
      }

      case "blocked": {
        const from = xyOf(e.climberId);
        const half = Math.round(T(TIMING.blocked) / 2);
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
        push({ fx: fx(e.climberId, "sway", T(TIMING.info)) }, T(TIMING.info));
        break;

      case "move": {
        const id = e.climberId;
        if (e.how === "posun" || e.how === "lanovka") {
          const route = findRoute(e.from, e.to, board);
          const lanovka = e.how === "lanovka";
          const total = T(lanovka ? TIMING.lanovka : TIMING.posun);
          if (route && !reduced) {
            // Po trase s plynulým rozjezdem a dojezdem (krátké úseky, aby byla vidět křivka).
            const segs = lanovka ? 20 : 14;
            const per = Math.round(total / segs);
            const p0 = fieldCenter(route.from, board);
            const p1 = fieldCenter(route.to, board);
            for (let k = 1; k < segs; k++) {
              const p = bezier(p0, route.control, p1, easeInOut(k / segs));
              push({ overrides: { ...st.overrides, [id]: p }, moveMs: per, moveEase: "linear", ride: lanovka ? id : null }, per);
            }
            push({
              positions: { ...st.positions, [id]: e.to },
              overrides: without(st.overrides, id),
              moveMs: per,
              moveEase: "ease-out",
              ride: null,
            }, per);
          } else {
            push({ positions: { ...st.positions, [id]: e.to }, moveMs: total, moveEase: "ease-in-out" }, total);
          }
        } else if (e.how === "zpet") {
          // 1 zpět: poskok o horu dolů
          const ms = T(TIMING.zpet);
          push({ positions: { ...st.positions, [id]: e.to }, moveMs: ms, moveEase: "ease-in-out", fx: fx(id, "step", ms) }, ms);
        } else {
          // černá: kývnutí a sjezd na horu 13 po přímce
          push({ fx: fx(id, "wobble", T(TIMING.cernaSway)), atStation: { ...st.atStation, [id]: false } }, T(TIMING.cernaSway));
          push({ positions: { ...st.positions, [id]: e.to }, moveMs: T(TIMING.cernaSlide), moveEase: "ease-in" }, T(TIMING.cernaSlide));
        }
        break;
      }

      case "magnetFall": {
        // Magnetický pád: kývání, odpadnutí na stůl, ležení, zvednutí a přesun na cíl pádu.
        const id = e.climberId;
        const rev = st.revealed[id] ?? [];
        if (!reduced) push({ fx: fx(id, "magnetSway", T(TIMING.fallSway)) }, T(TIMING.fallSway));
        fallToTable(id, e.to, TIMING.fallDrop, TIMING.fallLie, TIMING.fallRise, {
          revealed: { ...st.revealed, [id]: rev.includes(e.at) ? rev : [...rev, e.at] },
          atStation: { ...st.atStation, [id]: false },
        }, {
          // odznak čekání až po zvednutí figurky (na hoře 13 jde čekající na barevné místo)
          skipTurns: { ...st.skipTurns, [id]: e.wait },
        });
        break;
      }

      case "wait":
        push({ skipTurns: { ...st.skipTurns, [e.climberId]: e.turns }, fx: fx(e.climberId, "sway", T(TIMING.info)) }, T(TIMING.info));
        break;

      case "skip":
        // Na hoře 13 přejde horolezec po posledním čekání z barevného místa na kotouč.
        push({
          current: e.climberId,
          skipTurns: { ...st.skipTurns, [e.climberId]: e.remaining },
          fx: fx(e.climberId, "sway", T(TIMING.info)),
          moveMs: T(TIMING.step),
          moveEase: "ease-in-out",
        }, T(TIMING.info));
        break;

      case "stationMiss":
        push({ fx: fx(e.climberId, "sway", T(TIMING.info)) }, T(TIMING.info));
        break;

      case "stationEnter":
        push({ atStation: { ...st.atStation, [e.climberId]: true } }, T(TIMING.stationEnter));
        break;

      case "extraRoll":
        push({}, T(TIMING.extraRoll));
        break;

      case "knockOut":
        // Oběť spadne na stůl a přejde na své startovní místo pod horou; přijde o stanici i čekání.
        fallToTable(e.victimId, e.to, TIMING.knockDrop, TIMING.knockLie, TIMING.knockRise, {
          atStation: { ...st.atStation, [e.victimId]: false },
          skipTurns: { ...st.skipTurns, [e.victimId]: 0 },
        });
        break;

      case "summit":
        push({
          fx: fx(e.climberId, "hop", T(TIMING.summitHop)),
          flagNonce: st.flagNonce + 1,
          atStation: { ...st.atStation, [e.climberId]: false },
          skipTurns: { ...st.skipTurns, [e.climberId]: 0 },
          moveMs: T(300),
          moveEase: "ease-out",
        }, T(TIMING.summit));
        break;

      case "gameWon":
      case "gameOver":
        break;
    }

    // Pauza po příchodu na horu, než se projeví její účinek (konec řady kroků, posun, pád na jinou horu).
    const landed =
      (e.type === "step" && events[i + 1]?.type !== "step") || e.type === "move" || e.type === "magnetFall";
    if (landed && !reduced && frames.length > before && isLandingEffect(events[i + 1])) {
      const lastFrame = frames[frames.length - 1];
      frames[frames.length - 1] = { ...lastFrame, duration: lastFrame.duration + T(TIMING.land) };
    }

    // Hlášky, které patří za tuto událost.
    const add = early ? [] : narration.filter((l) => l.at === i).map((l) => l.text);
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
