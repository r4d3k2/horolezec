// Texty aplikace a šablony hlášek.
// Hlášky jsou skládané tak, aby se jméno nemuselo skloňovat ani rodově shodovat (vzor „Bára: …“).

import type { DieColor } from "./board";
import type { GameEvent } from "../lib/engine";

export const COLOR_NAMES: Record<DieColor, string> = {
  red: "červená",
  blue: "modrá",
  yellow: "žlutá",
  green: "zelená",
  black: "černá",
  white: "bílá",
};

export const UI = {
  title: "Horolezec",
  subtitle: "Magnetická hra z roku 1955. Kdo první vystoupá na vrchol?",
  whoPlays: "Kdo hraje",
  climberCount: "Počet horolezců",
  start: "Vyrazit na výstup",
  roll: "Hodit kostkou",
  onTurn: "Na tahu",
  newGame: "Nová hra",
  newGameConfirm: "Opravdu začít novou hru? Rozehraná výprava skončí.",
  playOn: "Hrát o další místa",
  yes: "Ano, nová hra",
  no: "Hrát dál",
  menu: "Menu",
  rulesDefault: "Hraje se podle výchozích pravidel: magnety zapnuté, na horu s červeným kroužkem se nesmí, na horách 20 a 24 veze lanovkou na vrchol každá barva kromě černé.",
};

/** Jméno počítačového ani lidského hráče se neskloňuje. */
export type NameOf = (climberId: string) => string;

function stoji(name: string, remaining: number): string {
  if (remaining <= 0) return `${name} stojí.`;
  if (remaining === 1) return `${name} stojí (zbývá 1).`;
  return `${name} stojí (zbývají ${remaining}).`;
}

export function kola(n: number): string {
  if (n === 1) return "1 kolo";
  if (n >= 2 && n <= 4) return `${n} kola`;
  return `${n} kol`;
}

export interface NarrationLine {
  /** Index události, po jejímž přehrání se hláška zobrazí. */
  at: number;
  text: string;
}

/** Složí hlášky z událostí jedné akce. */
export function narrate(events: GameEvent[], nameOf: NameOf): NarrationLine[] {
  const lines: NarrationLine[] = [];
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const next = events[i + 1];
    switch (e.type) {
      case "roll": {
        const n = nameOf(e.climberId);
        if (next?.type === "stationMiss") {
          lines.push({ at: i + 1, text: `${n}: hod ${e.value}, na lanovku je potřeba šestka.` });
        } else if (next?.type === "blocked") {
          lines.push({ at: i + 1, text: `${n}: hora ${next.at} má červený kroužek, zůstává na ${next.at - e.value}.` });
        } else if (next?.type === "overshoot") {
          lines.push({ at: i + 1, text: `${n}: na vrchol chybí ${next.missing}, tentokrát nic.` });
        } else if (next?.type === "colorRoll") {
          lines.push({ at: i, text: `${n}: hod 6, hází barevnou kostkou.` });
        } else if (next?.type === "step") {
          let j = i + 1;
          while (events[j + 1]?.type === "step") j++;
          const last = events[j];
          const to = last.type === "step" ? last.to : 0;
          lines.push({ at: j, text: `${n}: hod ${e.value}, hora ${to}.` });
        }
        break;
      }
      case "colorRoll": {
        const n = nameOf(e.climberId);
        const color = COLOR_NAMES[e.color];
        if (next?.type === "move" && next.how === "lanovka") {
          lines.push({ at: i + 1, text: `${n}: barevná kostka – ${color}, lanovkou na vrchol!` });
        } else if (next?.type === "move" && next.how === "cerna") {
          lines.push({ at: i + 1, text: `${n}: barevná kostka – černá! Zpět na horu ${next.to}.` });
        } else {
          lines.push({ at: i, text: `${n}: barevná kostka – ${color}, na vrchol veze jen vlastní barva.` });
        }
        break;
      }
      case "move": {
        const n = nameOf(e.climberId);
        if (e.how === "posun") lines.push({ at: i, text: `${n}: ${e.to - e.from} vpřed, hora ${e.to}.` });
        if (e.how === "zpet") lines.push({ at: i, text: `${n}: ${e.from - e.to} zpět, hora ${e.to}.` });
        break;
      }
      case "magnetFall": {
        const n = nameOf(e.climberId);
        let tail: string;
        if (e.to === e.at) tail = `${kola(e.wait)} čeká.`;
        else if (e.to === 0 && e.wait > 0) tail = `Začíná znovu pod horou a ${kola(e.wait)} čeká.`;
        else if (e.to === 0) tail = "Začíná znovu pod horou.";
        else tail = `Pád na horu ${e.to}.`;
        lines.push({ at: i, text: `${n}: magnet odpuzuje! ${tail}` });
        break;
      }
      case "wait":
        lines.push({ at: i, text: `${nameOf(e.climberId)}: ${e.turns}× čekat.` });
        break;
      case "skip":
        lines.push({ at: i, text: stoji(nameOf(e.climberId), e.remaining) });
        break;
      case "stationEnter":
        lines.push({ at: i, text: `${nameOf(e.climberId)}: lanovka na hoře 20, čeká na šestku.` });
        break;
      case "extraRoll":
        lines.push({ at: i, text: `${nameOf(e.climberId)} hází ještě jednou.` });
        break;
      case "knockOut":
        lines.push({ at: i, text: `Na hoře ${e.at} není místo pro dva. ${nameOf(e.victimId)} začíná znovu.` });
        break;
      case "summit":
        lines.push({
          at: i,
          text: e.rank === 1 ? `${nameOf(e.climberId)} je na vrcholu!` : `${nameOf(e.climberId)} je na vrcholu, ${e.rank}. místo.`,
        });
        break;
      default:
        break;
    }
  }
  return lines;
}
