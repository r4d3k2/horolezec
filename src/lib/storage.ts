// localStorage: nastavení, téma, rozehraná hra (statistiky od F3).
// Vše v try/catch (privátní režim Safari): chyba čtení = jako by klíč nebyl.
// Nekompatibilní data se nemažou potichu, ale přesunou pod klíč s příponou ".backup".

import { CLIMBER_COLORS, type ClimberColor } from "../data/board";
import type { GameState, SeatSetup } from "./engine";
import { DEFAULT_RULES, type Rules } from "./rules";

export const KEYS = {
  settings: "horolezec.v2.settings",
  theme: "horolezec.v2.theme",
  game: "horolezec.v2.game",
  stats: "horolezec.v2.stats",
} as const;

export type ThemeId = "hory-den" | "retro-1955" | "hory-noc";
export const THEMES: ThemeId[] = ["hory-den", "retro-1955", "hory-noc"];

export type Speed = "normal" | "fast" | "instant";
export type PlayMode = "ai" | "hotseat";

export interface Settings {
  schema: 2;
  mode: PlayMode;
  count: number;
  seats: SeatSetup[];       // vždy 4 místa, aktivní je prvních `count`
  rules: Rules;
  speed: Speed;
  showMarks: boolean;
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

/**
 * Převod uložených dat na aktuální schéma. Vrací null, když data nejdou použít.
 * Schéma 2 je první verze aplikace; starší neexistují.
 */
export function migrate(key: string, data: unknown): unknown | null {
  if (!isObj(data) || data.schema !== 2) return null;
  if (key === KEYS.settings) {
    const seats = Array.isArray(data.seats) ? data.seats.filter(isSeat).slice(0, 4) : [];
    if (seats.length !== 4) return null;
    const count = typeof data.count === "number" && data.count >= 2 && data.count <= 4 ? data.count : 2;
    const speed: Speed = data.speed === "fast" || data.speed === "instant" ? data.speed : "normal";
    const settings: Settings = {
      schema: 2,
      mode: data.mode === "hotseat" ? "hotseat" : "ai",
      count,
      seats,
      rules: migrateRules(data.rules),
      speed,
      showMarks: data.showMarks !== false,
    };
    return settings;
  }
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
  return load<Settings>(KEYS.settings);
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
