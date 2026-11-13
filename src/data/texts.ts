// Texty aplikace, pravidel, výkladu a šablony hlášek.
// Hlášky jsou skládané tak, aby se jméno nemuselo skloňovat ani rodově shodovat (vzor „Bára: …“).

import type { DieColor, FieldDef } from "./board";
import type { GameEvent } from "../lib/engine";
import type { Tempo } from "../lib/eventPlayer";
import type { Rules } from "../lib/rules";
import type { ThemeId } from "../lib/storage";

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
  modeAi: "Proti počítači",
  modeHotseat: "Více lidí na jednom zařízení",
  modeAiHint: "Ty proti 1–3 počítačovým horolezcům. Počítač nic nerozhoduje, jen hází za sebe.",
  modeHotseatHint: "2–4 lidé se střídají u jednoho telefonu nebo monitoru. Lze přidat i počítačové hráče.",
  climberCount: "Počet horolezců",
  human: "Člověk",
  ai: "Počítač",
  rulesTitle: "Pravidla hry",
  interpretation: "výklad",
  start: "Vyrazit na výstup",
  resume: "Pokračovat v rozehrané hře",
  roll: "Hodit kostkou",
  onTurn: "Na tahu",
  aiRolling: "hází počítač",
  newGame: "Nová hra",
  newGameConfirm: "Opravdu začít novou hru? Rozehraná výprava skončí.",
  playOn: "Hrát o další místa",
  yes: "Ano, nová hra",
  no: "Hrát dál",
  menu: "Menu",
  close: "Zavřít",
  rules: "Pravidla",
  legend: "Legenda",
  tempo: "Tempo hry",
  tempoHint: "Platí pro všechny animace i pauzy. Klepnutí na desku dokončí právě běžící pohyb.",
  showMarks: "Ukazovat, kde kdo spadl",
  journal: "Deník výpravy",
  journalEmpty: "Zatím se nic nestalo.",
  inApp: "V aplikaci:",
  hint: "Hoď kostkou a vystoupej o tolik hor.",
  theme: "Téma",
  // výsledky
  results: "Výsledky výpravy",
  ranking: "Pořadí",
  stillClimbing: "ještě leze",
  newExpedition: "Nová výprava",
  changeSettings: "Změnit nastavení",
  whereFall: "Kde by kdo spadl",
  whereFallHint: "Plný kroužek: tady horolezec spadl. Obrys: tady by spadl, kdyby na horu přišel.",
  whereFallHidden: "Kde by kdo spadl, se ukáže po konci hry – kdo ještě leze, ať se nedívá.",
  whereFallReveal: "Ukončit výpravu a ukázat magnety",
  magnetsOff: "Magnety byly vypnuté, nikdo padat nemohl.",
  samePole: "Stejně otočený magnet",
  samePoleNobody: "nikdo jiný",
  polesNote: "V originále si hráči mezi partiemi měnili figurky. Tady se magnety losují znovu při každé nové výpravě.",
  statRolls: "hody",
  statFalls: "pády z magnetu",
  statRides: "jízdy lanovkou",
  statBlocked: "zákazy",
  // statistiky
  stats: "Statistiky",
  statsGames: "Dohrané výpravy",
  statsShortest: "Nejkratší výstup",
  statsWins: "Výhry",
  statsClear: "Smazat statistiky",
  statsClearConfirm: "Opravdu smazat statistiky? Počty výher i nejkratší výstup zmizí.",
  statsClearYes: "Smazat",
  statsClearNo: "Nechat",
};

export const THEME_LABELS: Record<ThemeId, { icon: string; name: string }> = {
  "hory-den": { icon: "☀️", name: "Jasný den" },
  "retro-1955": { icon: "📜", name: "Tisk 1955" },
  "hory-noc": { icon: "🌙", name: "Bivak v noci" },
};

export const TEMPO_LABELS: Record<Tempo, string> = {
  slow: "Pomalu",
  normal: "Normálně",
  fast: "Rychle",
};

/** Přepínače volitelných pravidel: jedna věta vysvětlení, značka „výklad“ tam, kde jde o výklad. */
export const RULE_TOGGLES: { key: keyof Rules; label: string; text: string; interpretation: boolean }[] = [
  { key: "magnets", label: "Magnetické pády", text: "Na šesti horách může magnet figurku odpudit. Vypnuto = čistý závod pro nejmenší.", interpretation: false },
  { key: "redRing", label: "Na červený kroužek se nesmí", text: "Kdo by skončil na hoře s červeným kroužkem, zůstane stát. Vypnuto = obyčejná hora.", interpretation: true },
  { key: "colorDie", label: "Na vrchol jen vlastní barva", text: "Lanovka veze na vrchol jen při vlastní barvě. Vypnuto = veze každá barva kromě černé.", interpretation: true },
  { key: "exactFinish", label: "Přesný hod na vrchol", text: "Na vrchol se dá dojít jen přesným hodem.", interpretation: true },
  { key: "sixAgain", label: "Šestka hází znovu", text: "Po šestce hod navíc, když tah skončil normálně.", interpretation: true },
  { key: "knockOut", label: "Vyhazování – na hoře může stát jen jeden horolezec", text: "Kdo přijde na obsazenou horu, pošle horolezce, který tam stál, zpět pod horu (ten přijde i o čekání). Start, hora 13 a vrchol unesou víc horolezců.", interpretation: true },
];

/** Číslovka se správným tvarem podstatného jména: 1 kolo, 2–4 kola, 5+ kol. */
export function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return `${n} ${one}`;
  if (n >= 2 && n <= 4) return `${n} ${few}`;
  return `${n} ${many}`;
}

export function kola(n: number): string {
  return plural(n, "kolo", "kola", "kol");
}

export function vyhry(n: number): string {
  return plural(n, "výhra", "výhry", "výher");
}

/** Výklad hory v aplikaci podle zvolených pravidel. */
export function fieldExplanation(f: FieldDef, rules: Rules): string {
  const fall = (what: string) =>
    rules.magnets ? `Když magnet figurku odpudí: ${what}` : "Magnety jsou vypnuté, tady se nepadá.";
  const colorDie = rules.colorDie === "vlastniBarva"
    ? "černá vrací na horu 13, vlastní barva veze lanovkou na vrchol, jiná barva nic."
    : "černá vrací na horu 13, jiná barva veze lanovkou na vrchol.";
  if (f.redRing) {
    return rules.redRing === "zakaz"
      ? "Na horu s červeným kroužkem se nesmí. Kdo by na ní skončil, zůstane stát a tah propadá."
      : "Červený kroužek nemá účinek, je to obyčejná hora.";
  }
  if (f.fall) {
    const { to, wait } = f.fall;
    if (to === f.n) return fall(`zůstává na hoře ${f.n} a ${kola(wait)} čeká.`);
    if (to === 0 && wait > 0) return fall(`zpět pod horu a ${kola(wait)} čeká.`);
    if (to === 0) return fall("začíná znovu pod horou.");
    return fall(`pád na horu ${to}${to === 13 ? " (i tam rozhoduje magnet)" : ""}.`);
  }
  switch (f.effect?.kind) {
    case "hodZnovu":
      return "Hází hned ještě jednou.";
    case "posun":
      return f.effect.to > f.n
        ? `Po čárkované trase rovnou na horu ${f.effect.to}.`
        : `Zpět na horu ${f.effect.to}${rules.magnets ? " (i tam rozhoduje magnet)" : ""}.`;
    case "cekat":
      return `${kola(f.effect.turns)} stojí.`;
    case "stanice":
      return `Lanovka: od dalšího tahu hází, dokud nepadne 6. Pak barevná kostka – ${colorDie}`;
    case "barevnaKostka":
      return `Hned barevná kostka – ${colorDie}`;
    default:
      return "Obyčejná hora.";
  }
}

/** Úvod obrazovky Pravidla. */
export const RULES_INTRO: { title: string; text: string }[] = [
  { title: "Jak se hraje.", text: "Hoď kostkou a vystoupej o tolik hor. Vyhrává, kdo první stane na vrcholu." },
  {
    title: "Magnety.",
    text: "V originále stála deska svisle a pod šesti horami s nápisem „při pádu …“ byly magnety. Figurka má v patce magnet otočený jedním ze dvou směrů. Když se potká se stejně otočeným magnetem hory, odpudí ho a spadne. Každý horolezec má tedy tři zrádné hory a nikdo neví které. Kde někdo spadl, označí se magnetem v jeho barvě. Dva horolezci se stejně otočeným magnetem padají na stejných horách.",
  },
  {
    title: "Hory s textem",
    text: "fungují podle legendy. Na horu s červeným kroužkem se nesmí. Na horách 20 a 24 rozhoduje barevná kostka: černá vrací na horu 13, jiná barva veze lanovkou na vrchol.",
  },
  {
    title: "Na hoře je místo jen pro jednoho.",
    text: "Kdo přijde na obsazenou horu – hodem, po čárkované trase, posunem zpět i pádem –, pošle horolezce, který tam stál, zpět pod horu. Ten přijde i o čekání u lanovky a o zbývající kola stání. Pod horou, na hoře 13 a na vrcholu je místa dost. Vyhazování jde v nastavení vypnout.",
  },
  {
    title: "Odkud hra je.",
    text: "Horolezce vydala TOFA Semily v roce 1955 jako svislou magnetickou desku na stojánku s dřevěnými figurkami. Hráči si mezi partiemi figurky měnili, aby si nikdo nezapamatoval svá krizová místa. Čísla hor a texty jsou podle originálního plánu, ilustrace je nová. Část pravidel vykládáme, protože původní návod nemáme – přehled je v tabulce výkladu.",
  },
];

/** Tabulka výkladu z Předlohy (neověřeno, původní návod nemáme). */
export const INTERPRETATION_TABLE: { question: string; reading: string; why: string; alternative: string }[] = [
  { question: "Kde se začíná", reading: "pod horou (pole 0), hod 3 vede na horu 3", why: "na plánu není startovní pole", alternative: "—" },
  { question: "Kde může figurka spadnout", reading: "jen na šesti horách s textem „při pádu …“: 12, 13, 18, 21, 23, 25", why: "jinde by text o pádu chyběl", alternative: "—" },
  { question: "Komu magnet vadí", reading: "model polarity: každý horolezec má právě 3 zrádné hory", why: "odpovídá fyzice magnetů i výměně figurek", alternative: "magnety vypnout" },
  { question: "Červený kroužek (10, 14, 16, 22)", reading: "na horu se nesmí – kdo by na ní skončil, zůstane stát a tah propadá", why: "dopravní značka „zákaz vjezdu“", alternative: "obyčejná hora" },
  { question: "Hora 12 „znovu a 3 hry čekat“", reading: "zpět pod horu a 3 kola čekat", why: "„znovu“ jako „začít znovu“ u hory 21", alternative: "—" },
  { question: "Hora 13 „3x čekat“", reading: "zůstává na 13 a 3 kola čeká", why: "doslovně", alternative: "—" },
  { question: "Stěny barevné kostky", reading: "červená, modrá, žlutá, zelená, černá, bílá", why: "4 barvy figurek + černá z textu + 1 doplněná", alternative: "jiné složení stěn" },
  { question: "Barevná kostka, jiná než černá", reading: "lanovkou na vrchol 27", why: "čárkované šipky z 20 a 24 vedou na vrchol", alternative: "na vrchol jen vlastní barva" },
  { question: "Hora 24", reading: "barevná kostka hned po příchodu", why: "u 24 chybí „čeká“", alternative: "—" },
  { question: "Hora 20", reading: "od dalšího tahu hází kostkou s čísly, dokud nepadne 6, pak barevnou", why: "doslovně", alternative: "—" },
  { question: "Zkouška magnetu po přesunu", reading: "ano, na každé hoře, kam figurka dorazí (i po „1 zpět“, černé na kostce, pádu na horu 13)", why: "figurka se fyzicky pokládá na horu", alternative: "—" },
  { question: "Přesný hod na vrchol", reading: "ne", why: "neznámé", alternative: "přesný hod" },
  { question: "Šestka hází znovu", reading: "ne", why: "neznámé", alternative: "šestka znovu" },
  { question: "Vyhazování jako v Člověče", reading: "ano: na hoře může stát jen jeden horolezec, kdo přijde na obsazenou horu, pošle druhého zpět pod horu (mimo start, horu 13 a vrchol)", why: "hra je popsaná jako variace Člověče, nezlob se a hora 13 i vrchol mají místa navíc – to dává smysl, jen když hora normálně unese jednu figurku", alternative: "bez vyhazování" },
];

/** Jméno počítačového ani lidského hráče se neskloňuje. */
export type NameOf = (climberId: string) => string;

function stoji(name: string, remaining: number): string {
  if (remaining <= 0) return `${name} stojí.`;
  if (remaining === 1) return `${name} stojí (zbývá 1).`;
  return `${name} stojí (zbývají ${remaining}).`;
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
