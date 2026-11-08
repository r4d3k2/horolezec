// Validátor Horolezce (prebuild): plán, geometrie, invarianty enginu, determinismus, vyvážení.
// Při jakékoli chybě skončí nenulovým kódem a vypíše, co přesně neprošlo.

import { BOARD, CLIMBER_COLORS, type BoardDef, type FieldEffect } from "../src/data/board";
import {
  applyAction, createGame, fallFields, legalActions, replayPositions, toPublicView,
  type GameEvent, type GameSetup, type GameState,
} from "../src/lib/engine";
import { Rng } from "../src/lib/rng";
import { DEFAULT_RULES, type Rules } from "../src/lib/rules";

const t0 = Date.now();
const failures: string[] = [];
function fail(section: string, msg: string): void {
  failures.push(`[${section}] ${msg}`);
}
function check(cond: boolean, section: string, msg: string): void {
  if (!cond) fail(section, msg);
}

// ---------------------------------------------------------------------------
// 1. Plán
// ---------------------------------------------------------------------------

// Vlastní kopie doslovných textů z originálního plánu (tabulka v Předloze).
const EXPECTED_TEXTS: Record<number, string> = {
  5: "ještě 1x házet",
  7: "4 vpřed",
  12: "při pádu znovu a 3 hry čekat",
  13: "při pádu 3x čekat",
  15: "ještě 1x házet",
  17: "1x čekat",
  18: "při pádu na horu č. 1",
  19: "1 zpět",
  20: "čeká až hodí 6, pak hází barev. kostkou, při černé na č. 13",
  21: "při pádu začít znovu",
  23: "při pádu na horu č. 11",
  24: "házet barev. kostkou, při černé na č. 13",
  25: "při pádu na horu č. 13",
};

// Vlastní kopie tabulky Plán (účinky a pády).
const EXPECTED_EFFECTS: Record<number, FieldEffect> = {
  5: { kind: "hodZnovu" },
  7: { kind: "posun", to: 11 },
  15: { kind: "hodZnovu" },
  17: { kind: "cekat", turns: 1 },
  19: { kind: "posun", to: 18 },
  20: { kind: "stanice" },
  24: { kind: "barevnaKostka" },
};
const EXPECTED_FALLS: Record<number, { to: number; wait: number }> = {
  12: { to: 0, wait: 3 },
  13: { to: 13, wait: 3 },
  18: { to: 1, wait: 0 },
  21: { to: 0, wait: 0 },
  23: { to: 11, wait: 0 },
  25: { to: 13, wait: 0 },
};
const EXPECTED_RED = [10, 14, 16, 22];

function validateBoard(board: BoardDef): void {
  const S = "plán";
  check(board.fields.length === 27, S, `má být 27 hor, je ${board.fields.length}`);
  check(board.summit === 27, S, `vrchol má být 27, je ${board.summit}`);
  board.fields.forEach((f, i) => {
    check(f.n === i + 1, S, `hora na indexu ${i} má n = ${f.n}, čekáno ${i + 1}`);
    const exp = EXPECTED_TEXTS[f.n];
    if (exp === undefined) {
      check(f.text === undefined, S, `hora ${f.n} nemá mít text, má "${f.text}"`);
    } else {
      check(f.text === exp, S, `hora ${f.n}: text "${f.text}" se liší od originálu "${exp}"`);
      check(!!f.short, S, `hora ${f.n} s textem nemá krátký štítek`);
    }
    const expEff = EXPECTED_EFFECTS[f.n];
    check(JSON.stringify(f.effect ?? null) === JSON.stringify(expEff ?? null), S,
      `hora ${f.n}: účinek ${JSON.stringify(f.effect)} neodpovídá tabulce Plán (${JSON.stringify(expEff)})`);
    const expFall = EXPECTED_FALLS[f.n];
    check(JSON.stringify(f.fall ?? null) === JSON.stringify(expFall ?? null), S,
      `hora ${f.n}: pád ${JSON.stringify(f.fall)} neodpovídá tabulce Plán (${JSON.stringify(expFall)})`);
  });

  const byN = (n: number) => board.fields[n - 1];
  const inRange = (n: number) => Number.isInteger(n) && n >= 0 && n <= 27;

  // Cíle posunů a pádů.
  const shiftTargets: number[] = [];
  const fallTargets: number[] = [];
  for (const f of board.fields) {
    if (f.effect?.kind === "posun") {
      const to = f.effect.to;
      shiftTargets.push(to);
      check(inRange(to), S, `hora ${f.n}: cíl posunu ${to} mimo 0–27`);
      const t = byN(to);
      check(!!t && !t.effect, S, `hora ${f.n}: cíl posunu ${to} má vlastní účinek`);
      check(!!t && !t.redRing, S, `hora ${f.n}: cíl posunu ${to} má červený kroužek`);
    }
    if (f.fall) {
      fallTargets.push(f.fall.to);
      check(inRange(f.fall.to), S, `hora ${f.n}: cíl pádu ${f.fall.to} mimo 0–27`);
      check(f.fall.wait >= 0, S, `hora ${f.n}: záporné čekání po pádu`);
    }
  }

  // Pády přesně na 12, 13, 18, 21, 23, 25; jediný řetěz 25 → 13 → 13.
  const falls = fallFields(board);
  check(JSON.stringify(falls) === JSON.stringify([12, 13, 18, 21, 23, 25]), S,
    `pády mají být na 12, 13, 18, 21, 23, 25, jsou na ${falls.join(", ")}`);
  for (const n of falls) {
    const to = byN(n).fall!.to;
    if (to === n || to === 0) continue;
    const target = byN(to);
    if (target?.fall) {
      check(n === 25 && to === 13, S, `nepovolený řetěz pádů ${n} → ${to}`);
    }
  }
  check(byN(13).fall?.to === 13, S, "řetěz 25 → 13 musí končit (13 → 13)");

  // Červené kroužky.
  const reds = board.fields.filter((f) => f.redRing).map((f) => f.n);
  check(JSON.stringify(reds) === JSON.stringify(EXPECTED_RED), S,
    `červené kroužky mají být na ${EXPECTED_RED.join(", ")}, jsou na ${reds.join(", ")}`);
  const colorTargets = [board.colorDie.blackTo, board.colorDie.successTo];
  for (const n of reds) {
    const f = byN(n);
    check(!f.effect && !f.fall, S, `hora ${n} s červeným kroužkem nesmí mít účinek ani pád`);
    check(!shiftTargets.includes(n), S, `hora ${n} s červeným kroužkem je cílem posunu`);
    check(!fallTargets.includes(n), S, `hora ${n} s červeným kroužkem je cílem pádu`);
    check(!colorTargets.includes(n), S, `hora ${n} s červeným kroužkem je cílem barevné kostky`);
  }

  // Barevná kostka.
  check(board.colorDie.faces.length === 6, S, "barevná kostka má mít 6 stěn");
  check(board.colorDie.faces.includes("black"), S, "barevná kostka musí mít černou stěnu");
  check(board.colorDie.blackTo === 13 && board.colorDie.successTo === 27, S, "barevná kostka: černá → 13, jinak → 27");

  // Trasy odpovídají účinkům.
  const expectedRoutes = ["7>11:posun", "20>27:lanovka", "24>27:lanovka"].sort();
  const routes = board.routes.map((r) => `${r.from}>${r.to}:${r.kind}`).sort();
  check(JSON.stringify(routes) === JSON.stringify(expectedRoutes), S,
    `trasy mají být ${expectedRoutes.join(", ")}, jsou ${routes.join(", ")}`);
  for (const f of board.fields) {
    if (f.effect?.kind === "posun" && f.effect.to > f.n) {
      const to = f.effect.to;
      check(board.routes.some((r) => r.from === f.n && r.to === to && r.kind === "posun"), S,
        `posun ${f.n} → ${to} nemá čárkovanou trasu`);
    }
    if (f.effect?.kind === "stanice" || f.effect?.kind === "barevnaKostka") {
      check(board.routes.some((r) => r.from === f.n && r.to === board.colorDie.successTo && r.kind === "lanovka"), S,
        `hora ${f.n} nemá lanovku na vrchol`);
    }
  }

  // Místa.
  check(board.spots.start.length === 4, S, "pod horou mají být 4 startovní místa");
  check(board.spots.hub13.length === 2, S, "u hory 13 mají být 2 vedlejší místa");
  check(JSON.stringify(Object.keys(board.spots.summit)) === JSON.stringify(CLIMBER_COLORS), S,
    "barevná místa na vrcholu: červená, modrá, žlutá, zelená");
}

// ---------------------------------------------------------------------------
// 2. Geometrie
// ---------------------------------------------------------------------------

function validateGeometry(board: BoardDef): void {
  const S = "geometrie";
  const FIELD_R = 14;
  const SPOT_R = 10;
  const circles: { name: string; x: number; y: number; r: number }[] = [];
  for (const f of board.fields) circles.push({ name: `hora ${f.n}`, x: f.pos[0], y: f.pos[1], r: FIELD_R });
  board.spots.start.forEach((p, i) => circles.push({ name: `start ${i + 1}`, x: p[0], y: p[1], r: SPOT_R }));
  for (const c of CLIMBER_COLORS) {
    const p = board.spots.summit[c];
    circles.push({ name: `vrchol ${c}`, x: p[0], y: p[1], r: SPOT_R });
  }
  board.spots.hub13.forEach((p, i) => circles.push({ name: `u hory 13 (${i + 1})`, x: p[0], y: p[1], r: SPOT_R }));

  for (const c of circles) {
    check(c.x - c.r >= 10 && c.x + c.r <= 390 && c.y - c.r >= 10 && c.y + c.r <= 575, S,
      `${c.name} (${c.x}, ${c.y}, r ${c.r}) leží mimo x 10–390, y 10–575`);
  }
  let minGap = Infinity;
  for (let i = 0; i < circles.length; i++) {
    for (let j = i + 1; j < circles.length; j++) {
      const a = circles[i];
      const b = circles[j];
      const gap = Math.hypot(a.x - b.x, a.y - b.y) - a.r - b.r;
      minGap = Math.min(minGap, gap);
      check(gap >= 6, S, `${a.name} a ${b.name}: mezera mezi okraji ${gap.toFixed(1)} < 6`);
    }
  }

  let minRoute = Infinity;
  for (const r of board.routes) {
    const p0 = board.fields[r.from - 1].pos;
    const p1 = board.fields[r.to - 1].pos;
    for (let k = 0; k <= 200; k++) {
      const t = k / 200;
      const x = (1 - t) * (1 - t) * p0[0] + 2 * t * (1 - t) * r.control[0] + t * t * p1[0];
      const y = (1 - t) * (1 - t) * p0[1] + 2 * t * (1 - t) * r.control[1] + t * t * p1[1];
      for (const f of board.fields) {
        if (f.n === r.from || f.n === r.to) continue;
        const d = Math.hypot(x - f.pos[0], y - f.pos[1]);
        minRoute = Math.min(minRoute, d);
        if (d < 24) {
          fail(S, `trasa ${r.from} → ${r.to} vede ${d.toFixed(1)} od středu hory ${f.n} (méně než 24)`);
          k = 201;
          break;
        }
      }
    }
  }
  console.log(`  geometrie: nejmenší mezera mezi okraji ${minGap.toFixed(1)}, trasy nejblíž ${minRoute.toFixed(1)} od středů hor`);
}

// ---------------------------------------------------------------------------
// 3. Invarianty enginu
// ---------------------------------------------------------------------------

const NAMES = ["Bára", "Tonda", "Věra", "Pepa"];
function setupFor(n: number, rules: Rules): GameSetup {
  return {
    seats: Array.from({ length: n }, (_, i) => ({ name: NAMES[i], color: CLIMBER_COLORS[i], kind: "human" as const })),
    rules,
  };
}

function positions(s: GameState): Record<string, number> {
  const out: Record<string, number> = {};
  for (const c of s.climbers) out[c.id] = c.pos;
  return out;
}

function checkInvariants(s: GameState, before: GameState, events: GameEvent[], board: BoardDef, label: string): string | null {
  const reds = new Set(board.fields.filter((f) => f.redRing).map((f) => f.n));
  for (const c of s.climbers) {
    if (!(c.pos >= 0 && c.pos <= 27 && Number.isInteger(c.pos))) return `${label}: ${c.id} na pozici ${c.pos}`;
    if (s.rules.magnets) {
      if (c.danger.length !== 3) return `${label}: ${c.id} má ${c.danger.length} zrádných hor místo 3`;
      for (const f of c.danger) {
        if (s.fieldPoles[f] !== c.pole) return `${label}: ${c.id} zrádná hora ${f} neodpovídá pólu`;
      }
      const derived = Object.keys(s.fieldPoles).map(Number).filter((f) => s.fieldPoles[f] === c.pole);
      if (derived.length !== 3) return `${label}: ${c.id} pól ${c.pole} odpuzuje na ${derived.length} horách`;
    } else if (c.danger.length !== 0 || c.pole !== null) {
      return `${label}: bez magnetů má ${c.id} pól nebo zrádné hory`;
    }
    for (const r of c.revealed) if (!c.danger.includes(r)) return `${label}: ${c.id} odhalená hora ${r} není zrádná`;
    for (const k of c.knownSafe) if (c.danger.includes(k)) return `${label}: ${c.id} bezpečná hora ${k} je zrádná`;
    if (s.rules.redRing === "zakaz" && reds.has(c.pos)) return `${label}: ${c.id} stojí na červeném kroužku ${c.pos}`;
    if (c.atStation && c.pos !== 20) return `${label}: ${c.id} čeká u lanovky mimo horu 20 (${c.pos})`;
    if (c.skipTurns < 0) return `${label}: ${c.id} má záporné čekání`;
  }
  if (s.rules.magnets) {
    const poles = Object.values(s.fieldPoles);
    if (poles.length !== 6 || poles.filter((p) => p === "N").length !== 3) return `${label}: póly hor nejsou 3 + 3`;
  }
  const ranks = s.climbers.map((c) => c.finishedRank).filter((r): r is number => r !== null);
  if (new Set(ranks).size !== ranks.length) return `${label}: duplicitní pořadí ${ranks.join(", ")}`;
  const replay = replayPositions(positions(before), events);
  const after = positions(s);
  for (const id of Object.keys(after)) {
    if (replay[id] !== after[id]) return `${label}: replayPositions dává ${id} → ${replay[id]}, stav ${after[id]}`;
  }
  const pub = JSON.stringify(toPublicView(s));
  for (const secret of ['"danger"', '"pole"', '"fieldPoles"']) {
    if (pub.includes(secret)) return `${label}: PublicView obsahuje ${secret}`;
  }
  return null;
}

function randomRules(rng: Rng): Rules {
  return {
    magnets: rng.next() < 0.75,
    redRing: rng.next() < 0.7 ? "zakaz" : "bezUcinku",
    colorDie: rng.next() < 0.6 ? "jinaNezCerna" : "vlastniBarva",
    exactFinish: rng.next() < 0.4,
    sixAgain: rng.next() < 0.4,
    knockOut: rng.next() < 0.4,
  };
}

function validateInvariants(board: BoardDef): void {
  const S = "invarianty";
  const rng = new Rng(20261108);
  const GAMES = 5000;
  let actions = 0;
  let errors = 0;
  for (let g = 0; g < GAMES && errors < 10; g++) {
    const n = 2 + rng.int(3);
    const rules = randomRules(rng);
    const seed = Math.floor(rng.next() * 2 ** 32);
    let s = createGame(setupFor(n, rules), seed, board);
    const label0 = `hra ${g} (seed ${seed}, ${n} hráči, ${JSON.stringify(rules)})`;
    const init = checkInvariants(s, s, [], board, label0);
    if (init) { fail(S, init); errors++; continue; }
    let winnerTurns: number | null = null;
    let guard = 0;
    while (s.phase !== "over") {
      if (++guard > 50000) { fail(S, `${label0}: hra neskončila do 50 000 akcí`); errors++; break; }
      const legal = legalActions(s);
      const action = legal.includes("roll") ? { type: "roll" as const } : { type: "continue" as const };
      // Kontrola, že applyAction nemutuje vstup (každá 10. hra, kvůli rychlosti).
      const beforeJson = g % 10 === 0 ? JSON.stringify(s) : null;
      const res = applyAction(s, action, board);
      actions++;
      if (beforeJson !== null && JSON.stringify(s) !== beforeJson) { fail(S, `${label0}: applyAction zmutoval vstupní stav`); errors++; break; }
      const err = checkInvariants(res.state, s, res.events, board, `${label0}, akce ${guard}`);
      if (err) { fail(S, err); errors++; break; }
      s = res.state;
      const winner = s.climbers.find((c) => c.finishedRank === 1);
      if (winner && winnerTurns === null) winnerTurns = winner.stats.turns;
      if (winnerTurns === null && s.climbers.every((c) => c.stats.turns > 1000)) {
        fail(S, `${label0}: nikdo nedošel na vrchol do 1 000 tahů`); errors++; break;
      }
    }
    if (winnerTurns !== null && winnerTurns > 1000) { fail(S, `${label0}: vítěz potřeboval ${winnerTurns} tahů`); errors++; }
    const ranks = s.climbers.map((c) => c.finishedRank).sort();
    if (s.phase === "over" && JSON.stringify(ranks) !== JSON.stringify(Array.from({ length: n }, (_, i) => i + 1))) {
      fail(S, `${label0}: konečné pořadí ${JSON.stringify(ranks)} není 1..${n}`); errors++;
    }
  }
  console.log(`  invarianty: ${GAMES} her, ${actions} akcí`);
}

// ---------------------------------------------------------------------------
// 4. Determinismus
// ---------------------------------------------------------------------------

function playToEnd(setup: GameSetup, seed: number, board: BoardDef): string[] {
  let s = createGame(setup, seed, board);
  const log = [JSON.stringify(s)];
  let guard = 0;
  while (s.phase !== "over" && guard++ < 50000) {
    const action = legalActions(s).includes("roll") ? { type: "roll" as const } : { type: "continue" as const };
    const res = applyAction(s, action, board);
    s = res.state;
    log.push(JSON.stringify(s) + JSON.stringify(res.events));
  }
  return log;
}

function validateDeterminism(board: BoardDef): void {
  const S = "determinismus";
  const seeds = [1, 42, 12345, 987654321, 4294967295];
  const variants: Rules[] = [
    DEFAULT_RULES,
    { magnets: true, redRing: "bezUcinku", colorDie: "vlastniBarva", exactFinish: true, sixAgain: true, knockOut: true },
  ];
  for (const seed of seeds) {
    for (const rules of variants) {
      for (const n of [2, 3, 4]) {
        const a = playToEnd(setupFor(n, rules), seed, board);
        const b = playToEnd(setupFor(n, rules), seed, board);
        check(a.length === b.length && a.every((x, i) => x === b[i]), S,
          `seed ${seed}, ${n} hráči: dva běhy se liší`);
      }
    }
  }
  const a = JSON.stringify(createGame(setupFor(4, DEFAULT_RULES), 7, board));
  const b = JSON.stringify(createGame(setupFor(4, DEFAULT_RULES), 8, board));
  check(a !== b, S, "různé seedy dávají stejný počáteční stav");
  console.log(`  determinismus: ${seeds.length * variants.length * 3} dvojic partií shodných`);
}

// ---------------------------------------------------------------------------
// 5. Vyvážení
// ---------------------------------------------------------------------------

interface Balance {
  games: number;
  p10: number; p50: number; p90: number; p99: number; max: number;
  fallsPerGame: number;
  pctFall: number;
  pctReturn: number;
  pctRide: number;
  pctBlocked: number;
}

function percentile(sorted: number[], p: number): number {
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[idx];
}

function simulate(n: number, rules: Rules, games: number, seed: number, board: BoardDef): Balance {
  const rng = new Rng(seed);
  const rounds: number[] = [];
  let falls = 0;
  let withFall = 0;
  let withReturn = 0;
  let byRide = 0;
  let withBlocked = 0;
  const setup = setupFor(n, rules);
  for (let g = 0; g < games; g++) {
    let s = createGame(setup, Math.floor(rng.next() * 2 ** 32), board);
    let gFalls = 0;
    let gReturn = false;
    let gBlocked = false;
    let ride = false;
    let guard = 0;
    while (s.phase === "playing" && guard++ < 100000) {
      const res = applyAction(s, { type: "roll" }, board);
      const ev = res.events;
      for (let i = 0; i < ev.length; i++) {
        const e = ev[i];
        if (e.type === "magnetFall") {
          gFalls++;
          if (e.to === 0) gReturn = true;
        } else if (e.type === "blocked") {
          gBlocked = true;
        } else if (e.type === "summit" && e.rank === 1) {
          const prev = ev[i - 1];
          ride = prev?.type === "move" && prev.how === "lanovka";
        }
      }
      s = res.state;
    }
    const winner = s.climbers.find((c) => c.finishedRank === 1);
    rounds.push(winner ? winner.stats.turns : Infinity);
    falls += gFalls;
    if (gFalls > 0) withFall++;
    if (gReturn) withReturn++;
    if (ride) byRide++;
    if (gBlocked) withBlocked++;
  }
  rounds.sort((a, b) => a - b);
  return {
    games,
    p10: percentile(rounds, 0.1),
    p50: percentile(rounds, 0.5),
    p90: percentile(rounds, 0.9),
    p99: percentile(rounds, 0.99),
    max: rounds[rounds.length - 1],
    fallsPerGame: falls / games,
    pctFall: (100 * withFall) / games,
    pctReturn: (100 * withReturn) / games,
    pctRide: (100 * byRide) / games,
    pctBlocked: (100 * withBlocked) / games,
  };
}

function fmt(x: number, d = 1): string {
  return x.toFixed(d).replace(".", ",");
}

function balanceRow(label: string, b: Balance): string {
  return [
    label.padEnd(26),
    String(b.p10).padStart(4), String(b.p50).padStart(4), String(b.p90).padStart(4),
    String(b.p99).padStart(4), String(b.max).padStart(5),
    fmt(b.fallsPerGame, 2).padStart(7),
    `${fmt(b.pctFall)} %`.padStart(9), `${fmt(b.pctReturn)} %`.padStart(9),
    `${fmt(b.pctRide)} %`.padStart(9), `${fmt(b.pctBlocked)} %`.padStart(9),
  ].join(" ");
}

function validateBalance(board: BoardDef): void {
  const S = "vyvážení";
  const GAMES = 20000;
  const SEED = 12345;
  const header = [
    "varianta".padEnd(26), " p10", " p50", " p90", " p99", "  max",
    "  pády", "  s pádem", "pod horu", " lanovka", "   zákaz",
  ].join(" ");
  console.log("");
  console.log(`  Vyvážení (${GAMES} her na řádek, seed ${SEED}, kola = tahy vítěze včetně přeskočených)`);
  console.log("  " + header);
  console.log("  " + "-".repeat(header.length));

  const two = simulate(2, DEFAULT_RULES, GAMES, SEED, board);
  console.log("  " + balanceRow("2 horolezci (výchozí)", two));
  const three = simulate(3, DEFAULT_RULES, GAMES, SEED, board);
  console.log("  " + balanceRow("3 horolezci (výchozí)", three));
  const four = simulate(4, DEFAULT_RULES, GAMES, SEED, board);
  console.log("  " + balanceRow("4 horolezci (výchozí)", four));

  const variants: [string, Partial<Rules>][] = [
    ["2 – bez magnetů", { magnets: false }],
    ["2 – kroužek bez účinku", { redRing: "bezUcinku" }],
    ["2 – jen vlastní barva", { colorDie: "vlastniBarva" }],
    ["2 – přesný hod", { exactFinish: true }],
    ["2 – šestka znovu", { sixAgain: true }],
    ["2 – vyhazování", { knockOut: true }],
  ];
  for (const [label, patch] of variants) {
    const b = simulate(2, { ...DEFAULT_RULES, ...patch }, GAMES, SEED, board);
    console.log("  " + balanceRow(label, b));
  }
  console.log("");
  console.log("  Reference (Python): 2 horolezci p10 7, p50 13, p90 28, p99 48, max 93; 3,18 pádu; 88,0 % s pádem;");
  console.log("  58,5 % pod horu; 72,3 % lanovkou; 93,5 % se zákazem. 3 horolezci p50 11, p90 21. 4 horolezci p50 10, p90 18.");

  check(two.p50 >= 10 && two.p50 <= 16, S, `p50 = ${two.p50}, má být 10–16`);
  check(two.p90 <= 34, S, `p90 = ${two.p90}, má být ≤ 34`);
  check(two.max < 300, S, `max = ${two.max}, má být < 300`);
  check(two.pctFall >= 80, S, `hry s pádem ${fmt(two.pctFall)} %, má být ≥ 80 %`);
  check(two.pctReturn >= 45 && two.pctReturn <= 72, S, `návrat pod horu ${fmt(two.pctReturn)} %, má být 45–72 %`);
  check(two.pctRide >= 60 && two.pctRide <= 85, S, `výhra lanovkou ${fmt(two.pctRide)} %, má být 60–85 %`);
  check(two.pctBlocked >= 85, S, `hry se zákazem ${fmt(two.pctBlocked)} %, má být ≥ 85 %`);
}

// ---------------------------------------------------------------------------

function section(name: string, fn: () => void): void {
  const before = failures.length;
  const start = Date.now();
  try {
    fn();
  } catch (e) {
    fail(name, `výjimka: ${e instanceof Error ? e.stack ?? e.message : String(e)}`);
  }
  const ok = failures.length === before;
  console.log(`${ok ? "OK  " : "CHYBA"} ${name} (${Date.now() - start} ms)`);
}

console.log("Validátor Horolezce");
section("1. plán", () => validateBoard(BOARD));
section("2. geometrie", () => validateGeometry(BOARD));
section("3. invarianty enginu", () => validateInvariants(BOARD));
section("4. determinismus", () => validateDeterminism(BOARD));
section("5. vyvážení", () => validateBalance(BOARD));

console.log("");
if (failures.length > 0) {
  console.error(`Validátor selhal (${failures.length} chyb):`);
  for (const f of failures.slice(0, 50)) console.error("  - " + f);
  process.exit(1);
}
console.log(`Validátor prošel za ${((Date.now() - t0) / 1000).toFixed(1)} s.`);
