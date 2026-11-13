// Výchozí nastavení a místa podle režimu „Proti počítači“ / „Více lidí na jednom zařízení“.

import { CLIMBER_COLORS } from "./board";
import { pickAiName } from "./names";
import type { SeatKind, SeatSetup } from "../lib/engine";
import { DEFAULT_RULES } from "../lib/rules";
import type { PlayMode, Settings } from "../lib/storage";

/** Výchozí místa pro daný režim. */
export function seatsForMode(mode: PlayMode): SeatSetup[] {
  if (mode === "hotseat") {
    return CLIMBER_COLORS.map((color, i) => ({ name: `Hráč ${i + 1}`, color, kind: "human" }));
  }
  const taken: string[] = [];
  return CLIMBER_COLORS.map((color, i) => {
    if (i === 0) return { name: "Hráč", color, kind: "human" as SeatKind };
    const name = pickAiName(taken);
    taken.push(name);
    return { name, color, kind: "ai" as SeatKind };
  });
}

export function defaultSettings(): Settings {
  return {
    schema: 3,
    mode: "ai",
    count: 2,
    seats: seatsForMode("ai"),
    rules: { ...DEFAULT_RULES },
    tempo: "normal",
    showMarks: true,
  };
}
