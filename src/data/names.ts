// Jména počítačových horolezců (neskloňují se v hláškách, vzor „Bára: …“).

export const AI_NAMES = ["Jirka", "Bára", "Honza", "Věra", "Tonda", "Marta", "Pepa", "Hana"];

/** Náhodné jméno, které ještě nikdo nemá. Náhoda tady neovlivňuje hru, jen nabídku jmen. */
export function pickAiName(taken: string[]): string {
  const free = AI_NAMES.filter((n) => !taken.includes(n));
  const pool = free.length > 0 ? free : AI_NAMES;
  return pool[Math.floor(Math.random() * pool.length)];
}
