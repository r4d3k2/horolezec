// localStorage: nastavení, téma, rozehraná hra a statistiky.
// Vše v try/catch (privátní režim Safari): chyba čtení = jako by klíč nebyl.
// Nekompatibilní data se nemažou potichu, ale přesunou pod klíč s příponou ".backup".

import { CLIMBER_COLORS, type ClimberColor } from "../data/board";
import type { GameState, SeatSetup } from "./engine";
import type { Tempo } from "./eventPlayer";
import { DEFAULT_RULES, type Rules } from "./rules";

export const KEYS = {
  settings: "horolezec.v2.settings",
  theme: "horolezec.v2.theme",
  game: "horolezec.v2.game",
  stats: "horolezec.v2.stats",
} as const;

export type ThemeId = "hory-den" | "retro-1955" | "hory-noc";
export const THEMES: ThemeId[] = ["hory-den", "retro-1955", "hory-noc"];

export type PlayMode = "ai" | "hotseat";

/**
 * Nastavení. Schéma 3 (v2.1): „Rychlost počítače“ nahradilo „Tempo hry“ a vyhazování je výchozí.
 * Schéma 2 (Fáze 2) se při načtení jednou převede: knockOut → výchozí (zapnuto), speed → tempo.
 */
export interface Settings {
  schema: 3;
  mode: PlayMode;
  count: number;
  seats: SeatSetup[];       // vždy 4 místa, aktivní je prvních `count`
  rules: Rules;
  tempo: Tempo;
  showMarks: boolean;
}

/** Statistiky dohraných výprav (počítá se, jakmile je znám vítěz). */
export interface Stats {
  schema: 2;
  games: number;
  wins: Record<string, number>;                       // výhry podle jména
  shortest: { turns: number; name: string } | null;   // nejkratší výstup vítěze v kolech
}

/** Minimální rozhraní localStorage (modul jde typově zkontrolovat i bez DOM typů). */
interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function store(): KeyValueStore | null {
  // Už samotný přístup k localStorage může v Safari vyhodit výjimku.
  return (globalThis as unknown as { localStorage?: KeyValueStore }).localStorage ?? null;
}

function readRaw(key: string): string | null {
  try {
    return store()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    store()?.setItem(key, value);
  } catch {
    // privátní režim nebo plné úložiště – hra jede dál bez ukládání
  }
}

function remove(key: string): void {
  try {
    store()?.removeItem(key);
  } catch {
    // ignorovat
  }
}

/** Nekompatibilní data přesune pod klíč s příponou .backup. */
function backup(key: string, raw: string): void {
  write(`${key}.backup`, raw);
  remove(key);
}

function parse(raw: string | null): unknown {
  if (raw === null) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isColor = (v: unknown): v is ClimberColor => typeof v === "string" && (CLIMBER_COLORS as string[]).includes(v);

function isSeat(v: unknown): v is SeatSetup {
  return isObj(v) && typeof v.name === "string" && isColor(v.color) && (v.kind === "human" || v.kind === "ai");
}

function migrateRules(v: unknown): Rules {
  const r = isObj(v) ? v : {};
  return {
    magnets: typeof r.magnets === "boolean" ? r.magnets : DEFAULT_RULES.magnets,
    redRing: r.redRing === "zakaz" || r.redRing === "bezUcinku" ? r.redRing : DEFAULT_RULES.redRing,
    colorDie: r.colorDie === "jinaNezCerna" || r.colorDie === "vlastniBarva" ? r.colorDie : DEFAULT_RULES.colorDie,
    exactFinish: typeof r.exactFinish === "boolean" ? r.exactFinish : DEFAULT_RULES.exactFinish,
    sixAgain: typeof r.sixAgain === "boolean" ? r.sixAgain : DEFAULT_RULES.sixAgain,
    knockOut: typeof r.knockOut === "boolean" ? r.knockOut : DEFAULT_RULES.knockOut,
  };
}

const isTempo = (v: unknown): v is Tempo => v === "slow" || v === "normal" || v === "fast";

/**
 * Převod uložených dat na aktuální schéma. Vrací null, když data nejdou použít.
 * Nastavení: schéma 2 → 3 (jednorázově vyhazování na nový výchozí stav, rychlost → tempo).
 * Rozehraná hra: schéma 2, hra si nechává svá pravidla. Statistiky: schéma 2.
 */
export function migrate(key: string, data: unknown): unknown | null {
  if (!isObj(data)) return null;
  if (key === KEYS.settings) {
    if (data.schema !== 2 && data.schema !== 3) return null;
    const seats = Array.isArray(data.seats) ? data.seats.filter(isSeat).slice(0, 4) : [];
    if (seats.length !== 4) return null;
    const count = typeof data.count === "number" && data.count >= 2 && data.count <= 4 ? data.count : 2;
    const rules = migrateRules(data.rules);
    let tempo: Tempo = isTempo(data.tempo) ? data.tempo : "normal";
    if (data.schema === 2) {
      // Fáze 2 měla vyhazování vypnuté a „Rychlost počítače“ (normal / fast / instant).
      rules.knockOut = DEFAULT_RULES.knockOut;
      tempo = data.speed === "fast" || data.speed === "instant" ? "fast" : "normal";
    }
    const settings: Settings = {
      schema: 3,
      mode: data.mode === "hotseat" ? "hotseat" : "ai",
      count,
      seats,
      rules,
      tempo,
      showMarks: data.showMarks !== false,
    };
    return settings;
  }
  if (data.schema !== 2) return null;
  if (key === KEYS.game) {
    const ok =
      typeof data.seed === "number" &&
      typeof data.rng === "number" &&
      Array.isArray(data.climbers) &&
      data.climbers.length >= 2 &&
      data.climbers.length <= 4 &&
      data.climbers.every((c) => isObj(c) && typeof c.id === "string" && typeof c.pos === "number" && isSeat(c.seat)) &&
      typeof data.current === "number" &&
      (data.phase === "playing" || data.phase === "won" || data.phase === "over") &&
      isObj(data.fieldPoles) &&
      isObj(data.rules);
    return ok ? data : null;
  }
  if (key === KEYS.stats) {
    if (typeof data.games !== "number" || data.games < 0 || !isObj(data.wins)) return null;
    const wins: Record<string, number> = {};
    for (const [name, n] of Object.entries(data.wins)) {
      if (typeof n === "number" && n > 0) wins[name] = n;
    }
    const sh = data.shortest;
    const shortest = isObj(sh) && typeof sh.turns === "number" && typeof sh.name === "string"
      ? { turns: sh.turns, name: sh.name }
      : null;
    const stats: Stats = { schema: 2, games: Math.floor(data.games), wins, shortest };
    return stats;
  }
  return data;
}

function load<T>(key: string): T | null {
  const raw = readRaw(key);
  const data = parse(raw);
  if (data === undefined) return null;
  const migrated = data === null ? null : migrate(key, data);
  if (migrated === null) {
    if (raw !== null) backup(key, raw);
    return null;
  }
  return migrated as T;
}

export function loadSettings(): Settings | null {
  const raw = parse(readRaw(KEYS.settings));
  const s = load<Settings>(KEYS.settings);
  // Převedené nastavení ze schématu 2 hned uložit, aby se migrace provedla jen jednou.
  if (s && isObj(raw) && raw.schema !== 3) saveSettings(s);
  return s;
}

export function saveSettings(s: Settings): void {
  write(KEYS.settings, JSON.stringify(s));
}

export function loadTheme(): ThemeId {
  const raw = readRaw(KEYS.theme);
  return raw !== null && (THEMES as string[]).includes(raw) ? (raw as ThemeId) : "hory-den";
}

export function saveTheme(t: ThemeId): void {
  write(KEYS.theme, t);
}

/** Rozehraná hra (dohraná se neukládá). */
export function loadGame(): GameState | null {
  const g = load<GameState>(KEYS.game);
  if (!g || g.phase === "over") return null;
  return g;
}

export function saveGame(g: GameState): void {
  if (g.phase === "over") {
    clearGame();
    return;
  }
  write(KEYS.game, JSON.stringify(g));
}

export function clearGame(): void {
  remove(KEYS.game);
}

// --- Statistiky ------------------------------------------------------------

export function emptyStats(): Stats {
  return { schema: 2, games: 0, wins: {}, shortest: null };
}

export function loadStats(): Stats {
  return load<Stats>(KEYS.stats) ?? emptyStats();
}

/** Započítá dohranou výpravu (volá se jednou, když je poprvé znám vítěz). */
export function recordWin(name: string, turns: number): Stats {
  const st = loadStats();
  const next: Stats = {
    schema: 2,
    games: st.games + 1,
    wins: { ...st.wins, [name]: (st.wins[name] ?? 0) + 1 },
    shortest: st.shortest === null || turns < st.shortest.turns ? { turns, name } : st.shortest,
  };
  write(KEYS.stats, JSON.stringify(next));
  return next;
}

export function clearStats(): void {
  remove(KEYS.stats);
}
