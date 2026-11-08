# Horolezec — magnetická hra z roku 1955 jako webová aplikace

Work directly on the main branch, do not create new branches, do not use git worktree.

Implement this in **3 phases**. After each phase, stop and wait for my confirmation before continuing to the next phase. Do not run `npm run dev` — the dev server is managed by Claude Code Desktop Preview. Do not fetch localhost — I'll check the result in Preview myself.

> Specifikace v2.0 · 2026-11-08 · repo `r4d3k2/horolezec` · Cesta B (Claude Code → GitHub → Vercel)
> Změna proti v1.0: herní plán a pravidla podle fotografie originálního plánu (27 hor). Dotvořený plán se 61 poli, skoby a úrovně počítače jsou vypuštěné.

---

## O projektu

Digitální verze české magnetické deskové hry **Horolezec** (TOFA Semily, 1955). Závodní hra pro 2–4 hráče: kostkou se stoupá po 27 očíslovaných horách na vrchol. Natištěná pravidla posouvají vpřed i vracejí, na horách 20 a 24 rozhoduje barevná kostka o jízdě lanovkou na vrchol. Hlavní kouzlo originálu: na šesti horách může figurku odpudit magnet a horolezec spadne. Komu se to stane, nikdo předem neví.

Režimy (oba řeší jedno nastavení „kdo hraje“):
1. **Proti počítači** – 1 člověk proti 1–3 počítačovým horolezcům.
2. **Více lidí na jednom zařízení** – 2–4 lidé se střídají u jednoho telefonu nebo monitoru. Lze přidat i počítačové hráče.

Originál je čistě hra na štěstí, hráč nic nerozhoduje. Počítačoví horolezci proto jen hází za sebe – jejich smysl je, aby se dalo hrát i o samotě.

Cílová skupina: rodina, děti zhruba od 7 let i dospělí. Primární zařízení iPhone (Safari, na výšku), sekundárně desktop. Veškeré UI česky. Žádný backend, žádné přihlašování, stav v `localStorage`. Online multiplayer **není** v rozsahu, architektura na něj ale musí být připravená (viz „Připraveno na online“).

Aplikace je příbuzná rodině deskových průvodců (`xiangqi-pruvodce`, `makruk-pruvodce`, `sachovy-pruvodce`) – přebírá mechanismy (témata přes CSS proměnné, plynulý pohyb figur přes stabilní ID a CSS transform, zvýraznění odkud → kam, validátor v `prebuild`). K jejich kódu přístup nemáš, popis v tomto dokumentu je úplný. Barvy a vzhled jsou vlastní.

**Autorská práva:** z originálu přebíráme jen herní prvky – čísla hor, texty pravidel, červené kroužky, čárkované trasy, barevná místa na vrcholu a u hory 13. Ilustrace desky je **vlastní**, původní malbu (krajinu, hrad, vesnici, kompozici) nekopíruj.

---

## Předloha – co víme a co vykládáme

### Ověřeno z fotografie originálního plánu (tiskové označení N 10391 - Sg-4)

- Hory očíslované 1–27, stoupá se podle čísel po klikaté trase zdola nahoru. Hora 27 je vrchol, vedle ní čtyři barevná místa: červené, modré, žluté, zelené.
- Texty u hor (doslovně):

| Hora | Text na plánu |
|---|---|
| 5 | ještě 1x házet |
| 7 | 4 vpřed (čárkovaná šipka na horu 11) |
| 12 | při pádu znovu a 3 hry čekat |
| 13 | při pádu 3x čekat (u hory další dvě kruhová místa rozdělená na čtyři barvy) |
| 15 | ještě 1x házet |
| 17 | 1x čekat (vedle kroužek s červeným křížem) |
| 18 | při pádu na horu č. 1 |
| 19 | 1 zpět |
| 20 | čeká až hodí 6, pak hází barev. kostkou, při černé na č. 13 (čárkovaná šipka na vrchol 27, u hory stanice) |
| 21 | při pádu začít znovu |
| 23 | při pádu na horu č. 11 |
| 24 | házet barev. kostkou, při černé na č. 13 (čárkovaná šipka na vrchol 27) |
| 25 | při pádu na horu č. 13 |

- Hory 10, 14, 16 a 22 mají číslo v **červeném kroužku** (jako dopravní značka), bez textu. Hory 1–4, 6, 8, 9, 11 a 26 jsou bez textu.
- V krabici je vidět bílá kostka s velkým červeným kruhem na stěně a kostka s tmavým kruhem – barevná kostka má tedy na stěnách barevné kruhy. Úplné složení stěn na fotce není.

### Ověřeno z dalších zdrojů (Zatrolené hry, inzeráty Aukro a Hyperinzerce, odkazy v sekci Zdroje)

- TOFA Semily, 1955, 2–4 hráči, od 8 let, zhruba 30 minut.
- Deska 27 × 38 cm na stojánku ve svislé poloze, pod políčky magnetické plošky, které figurku drží, nebo odpuzují. Dřevěné figurky s magnetem v patce.
- Figurky se mezi partiemi měnily, aby si nikdo nezapamatoval svá krizová místa. Lanovky urychlují, z některých míst se padá až na začátek. Vyhrává, kdo první dosáhne vrcholu.

### Výklad (neověřeno, původní návod nemáme)

Všechno v tabulce je nastavitelné v `Rules` nebo v datech `board.ts`, aby šlo po dodání návodu změnit bez zásahu do enginu.

| Otázka | Výchozí výklad | Proč | Alternativa |
|---|---|---|---|
| Kde se začíná | pod horou (pole 0), hod 3 vede na horu 3 | na plánu není startovní pole | — |
| Kde může figurka spadnout | jen na šesti horách s textem „při pádu …“: 12, 13, 18, 21, 23, 25 | jinde by text o pádu chyběl | — |
| Komu magnet vadí | model polarity (viz Magnety): každý horolezec má právě 3 zrádné hory | odpovídá fyzice magnetů i výměně figurek | magnety vypnout |
| Červený kroužek (10, 14, 16, 22) | na horu se nesmí – kdo by na ní skončil, zůstane stát a tah propadá | dopravní značka „zákaz vjezdu“ | `bezUcinku` |
| Hora 12 „znovu a 3 hry čekat“ | zpět pod horu a 3 kola čekat | „znovu“ jako „začít znovu“ u hory 21 | — |
| Hora 13 „3x čekat“ | zůstává na 13 a 3 kola čeká | doslovně | — |
| Stěny barevné kostky | červená, modrá, žlutá, zelená, černá, bílá | 4 barvy figurek + černá z textu + 1 doplněná | upravit `colorDie.faces` |
| Barevná kostka, jiná než černá | lanovkou na vrchol 27 | čárkované šipky z 20 a 24 vedou na vrchol | `vlastniBarva`: na vrchol jen vlastní barva |
| Hora 24 | barevná kostka hned po příchodu | u 24 chybí „čeká“ | — |
| Hora 20 | od dalšího tahu hází kostkou s čísly, dokud nepadne 6, pak barevnou | doslovně | — |
| Zkouška magnetu po přesunu | ano, na každé hoře, kam figurka dorazí (i po „1 zpět“, černé na kostce, pádu na horu 13) | figurka se fyzicky pokládá na horu | — |
| Přesný hod na vrchol | ne | neznámé | `exactFinish` |
| Šestka hází znovu | ne | neznámé | `sixAgain` |
| Vyhazování jako v Člověče | ne | hra je popsaná jako „variace Člověče“, pravidlo ale neznáme | `knockOut` |

---

## Pravidla v aplikaci (závazná pro engine)

### Plán

Pole `0` = **pod horou** (start, mimo plán, libovolný počet figurek). Hory `1`–`27`, `27` = **vrchol**.

| Hora | Druh | Účinek v enginu (výchozí výklad) |
|---|---|---|
| 5, 15 | `hodZnovu` | hází hned ještě jednou |
| 7 | `posun` | přesun na 11 po čárkované trase |
| 10, 14, 16, 22 | červený kroužek | nelze na ní skončit, tah propadá |
| 12 | pád | → 0, čeká 3 kola |
| 13 | pád | zůstává na 13, čeká 3 kola |
| 17 | `cekat` | 1 kolo stojí |
| 18 | pád | → 1 |
| 19 | `posun` | → 18 (příchod na 18 se zkouškou magnetu) |
| 20 | `stanice` | od dalšího tahu: šestka → barevná kostka |
| 21 | pád | → 0 |
| 23 | pád | → 11 |
| 24 | `barevnaKostka` | hned barevná kostka |
| 25 | pád | → 13 (příchod na 13 se zkouškou magnetu) |
| 27 | vrchol | cíl |

### Průběh tahu

1. Stojí-li horolezec (`skipTurns > 0`), tah se přeskočí (událost `skip`) a počítadlo se sníží.
2. Čeká-li u lanovky na hoře 20 (`atStation`): hodí kostkou s čísly. Bez šestky tah končí (`stationMiss`). Se šestkou hodí barevnou kostkou (viz Barevná kostka).
3. Jinak hodí kostkou a postoupí o hozený počet hor. Kdyby přelezl vrchol: bez `exactFinish` stojí na vrcholu, s ním tah propadá (`overshoot`).
4. Je-li cílová hora s červeným kroužkem a `redRing: "zakaz"`, figurka se nepohne a tah propadá (`blocked`).
5. **Příchod na horu** (funkce `land`):
   - a) **Zkouška magnetu** (jen hory 12, 13, 18, 21, 23, 25 a jen při `magnets`): odpudí-li magnet figurku → pád podle pravidla hory, tah končí. Vede-li pád na jinou horu se zkouškou (25 → 13), zkouší se magnet i tam.
   - b) Jinak se hora zapíše jako „známá bezpečná“ (jen u hor se zkouškou) a provede se účinek hory. Posun 7 → 11 i 19 → 18 je nový příchod. Zvláštní účinky se nikdy neřetězí, protože cíle posunů účinek nemají (validátor to hlídá).
6. Volitelně `knockOut` a `sixAgain` (viz tabulka volitelných pravidel).
7. Na tahu je další horolezec v pořadí, který nedokončil.

Začínajícího hráče vylosuje generátor, dál se jde podle indexu dokola.

### Magnety (model polarity)

- `createGame`: šest hor se zkouškou dostane náhodně pól `N` nebo `S`, **přesně 3 a 3**. Horolezci dostanou póly vyváženě (2 hráči N + S, 3 hráči 2 + 1, 4 hráči 2 + 2), náhodně přiřazené.
- Stejné póly se odpuzují: figurka spadne na hoře se stejným pólem. Každý horolezec má tedy **právě 3 zrádné hory**. Dva horolezci se stejným pólem padají na stejných horách. Ve hře dvou jsou zrádné hory doplňkové – co shodí jednoho, druhého udrží.
- Póly jsou tajné (nejsou v `PublicView`). Kde horolezec spadl, ukáže se značka magnetu v jeho barvě. Kde zkouškou prošel, je to jeho „známá bezpečná“ hora.
- `magnets: false` → póly se nelosují a nikdo nepadá.

### Barevná kostka

- Stěny v `board.ts` (`colorDie.faces`), výchozí: červená, modrá, žlutá, zelená, černá, bílá.
- Hora 24: hází se hned po příchodu. Hora 20: po hozené šestce, nejdřív v tahu po příchodu.
- **Černá** → horolezec jde na horu 13 (příchod se zkouškou magnetu) a čekání u stanice končí.
- `colorDie: "jinaNezCerna"` (výchozí): jakákoli jiná barva → lanovkou na vrchol 27.
- `colorDie: "vlastniBarva"`: vlastní barva → vrchol. Jiná barva než černá → nic, od dalšího tahu se hraje normálně (u 20 se už nečeká).

### Volitelná pravidla (`Rules`)

| Klíč | Výchozí | Popis |
|---|---|---|
| `magnets` | zapnuto | Magnetické pády. Vypnuto = čistý závod pro nejmenší. |
| `redRing` | `zakaz` | `zakaz`: na horu s červeným kroužkem se nesmí. `bezUcinku`: obyčejná hora. |
| `colorDie` | `jinaNezCerna` | Viz Barevná kostka. |
| `exactFinish` | vypnuto | Na vrchol jen přesným hodem. |
| `sixAgain` | vypnuto | Po šestce hod navíc, jen když tah skončil normálně (bez pádu, zákazu, posunu zpět, mimo stanici). |
| `knockOut` | vypnuto | Kdo skončí na hoře s jiným horolezcem (mimo 0, 13 a vrchol), ten druhý začíná znovu pod horou. |

### Konec hry

- Kdo první dosáhne vrcholu, vyhrává. Hra se zastaví (`phase: "won"`) a nabídne „Hrát o další místa“ (akce `continue`, pokračuje se, dokud nezbude jeden – ten dostane poslední místo, `phase: "over"`) nebo novou hru.
- Pokud po dosažení vrcholu zbývá jen jeden lezoucí (typicky hra dvou), dostane rovnou poslední místo a fáze je `over`.
- Počet kol pro statistiky a validátor = počet tahů vítěze včetně přeskočených.

---

## Tech stack a omezení

- React + TypeScript + Vite + Tailwind (aktuální stabilní verze, nastavení podle oficiálního postupu pro Vite).
- Dev závislost `tsx` pro validátor. **Žádné další knihovny**: žádný framer-motion, žádné UI kity, žádné lucide-react, žádná herní ani animační knihovna. Pokud něco jiného považuješ za nutné, zastav se a zeptej se.
- Ikony jako inline SVG v `src/components/Icon.tsx`. Animace jen CSS (transitions, keyframes). Bez zvuků. Fonty přes Google Fonts v `index.html`.
- Engine (`src/lib/engine.ts`, `rng.ts`) je čistý TypeScript bez Reactu a **bez `Math.random()`**. Veškerá náhoda jde přes seedovaný generátor, jehož stav je součástí herního stavu.
- `localStorage` vždy v `try/catch` (privátní režim Safari). Commit messages česky, krátce a věcně.

---

## Architektura – struktura souborů

```
src/
  lib/
    rng.ts            seedovaný generátor mulberry32, stav = uint32 v GameState
    rules.ts          typ Rules + DEFAULT_RULES
    engine.ts         createGame, applyAction, legalActions, toPublicView, replayPositions
    eventPlayer.ts    časová osa animací z událostí (čisté funkce, bez Reactu)
    storage.ts        localStorage: nastavení, téma, rozehraná hra, statistiky + migrace
  data/
    board.ts          plán: hory, texty, účinky, pády, trasy, barevná kostka, místa, souřadnice
    texts.ts          texty pravidel, výkladu a šablony hlášek
    names.ts          jména počítačových horolezců
  components/
    Board.tsx         SVG deska: krajina, kopce pod horami, trasy, kotouče, štítky, značky, figurky, stůl
    MountainArt.tsx   vlastní ilustrace krajiny z polygonů
    ClimberToken.tsx  figurka (vnější g = pozice, vnitřní g = efekty)
    Die.tsx           kostka s čísly i barevná kostka (F1 2D, F2 3D CSS)
    TurnPanel.tsx  Journal.tsx  Legend.tsx
    SetupScreen.tsx  ResultScreen.tsx  RulesScreen.tsx
    ThemeSwitcher.tsx  Pill.tsx  Toggle.tsx  Icon.tsx
  hooks/
    useGame.ts        herní stav + přehrávání událostí + automatické tahy počítače
  App.tsx             přepínání obrazovek
  index.css           3 témata přes CSS custom properties, keyframes
scripts/
  validate-game.ts    prebuild: plán, geometrie, invarianty enginu, vyvážení
```

---

## Datové typy a API

```ts
// src/data/board.ts
export type Pole = "N" | "S";
export type ClimberColor = "red" | "blue" | "yellow" | "green";
export type DieColor = ClimberColor | "black" | "white";

export type FieldEffect =
  | { kind: "hodZnovu" }
  | { kind: "posun"; to: number }
  | { kind: "cekat"; turns: number }
  | { kind: "stanice" }            // hora 20: čeká na šestku, pak barevná kostka
  | { kind: "barevnaKostka" };     // hora 24: barevná kostka hned

export interface FallRule { to: number; wait: number; }   // to 0 = pod horu; to = vlastní číslo = zůstává

export interface FieldDef {
  n: number;                     // 1–27
  pos: [number, number];         // střed kotouče ve viewBoxu
  text?: string;                 // doslovný text z originálního plánu
  short?: string;                // krátký štítek na desku
  effect?: FieldEffect;
  fall?: FallRule;               // jen hory se zkouškou magnetu
  redRing?: true;
}

export interface Route {
  from: number; to: number;
  control: [number, number];     // řídicí bod kvadratického Bézieru
  kind: "posun" | "lanovka";
}

export interface BoardDef {
  id: "horolezec-tofa";
  summit: 27;
  viewBox: [number, number, number, number];   // [0, 0, 400, 620]: deska 0–580, stojánek a stůl 580–620
  fields: FieldDef[];                          // 27 položek, index = n - 1
  routes: Route[];
  colorDie: { faces: DieColor[]; blackTo: number; successTo: number };
  spots: {
    start: [number, number][];                 // 4 místa pod horou
    summit: Record<ClimberColor, [number, number]>;
    hub13: [number, number][];                 // 2 vedlejší místa u hory 13
  };
}
```

```ts
// src/lib/rules.ts
export interface Rules {
  magnets: boolean;
  redRing: "zakaz" | "bezUcinku";
  colorDie: "jinaNezCerna" | "vlastniBarva";
  exactFinish: boolean;
  sixAgain: boolean;
  knockOut: boolean;
}
export const DEFAULT_RULES: Rules = {
  magnets: true, redRing: "zakaz", colorDie: "jinaNezCerna",
  exactFinish: false, sixAgain: false, knockOut: false,
};
```

```ts
// src/lib/engine.ts
export type SeatKind = "human" | "ai";
export interface SeatSetup { name: string; color: ClimberColor; kind: SeatKind; }
export interface GameSetup { seats: SeatSetup[]; rules: Rules; }      // 2–4 místa

export interface ClimberStats {
  turns: number;            // tahy včetně přeskočených (= počet kol pro validátor)
  rolls: number; magnetFalls: number; rides: number; blocked: number; waits: number; knockedOthers: number;
}

export interface ClimberState {
  id: "c0" | "c1" | "c2" | "c3";      // stabilní ID = klíč figurky v Reactu
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

export function createGame(setup: GameSetup, seed: number, board?: BoardDef): GameState;
export function applyAction(state: GameState, action: Action, board?: BoardDef):
  { state: GameState; events: GameEvent[] };      // vstupní stav nemutuje
export function legalActions(state: GameState): Action["type"][];   // playing: roll · won: continue · over: nic
export function toPublicView(state: GameState): PublicView;
export function replayPositions(start: Record<string, number>, events: GameEvent[]): Record<string, number>;
```

Zásady enginu:
- `createGame`: `rng = seed >>> 0`, pak v pevném pořadí póly hor, póly horolezců a začínající hráč.
- Stejný seed + stejné akce = identický stav (JSON). Validátor to ověřuje.
- Událost `step` pro každou horu zvlášť (animace hora po hoře). Posun, lanovka, „1 zpět“ a černá na kostce jsou jedna událost `move`.
- `replayPositions` spočítá z událostí konečné pozice. Musí sedět se stavem po akci.
- Počítač nemá co rozhodovat: `useGame` za něj po pauze odešle `roll`. Žádný modul AI.

---

## Herní plán – data (`src/data/board.ts`)

Opiš přesně. Texty `text` jsou doslovné z originálního plánu a validátor je kontroluje znak po znaku.

```ts
viewBox: [0, 0, 400, 620],
fields: [
  { n: 1,  pos: [50, 525] },
  { n: 2,  pos: [100, 512] },
  { n: 3,  pos: [155, 500] },
  { n: 4,  pos: [210, 490] },
  { n: 5,  pos: [265, 482], text: "ještě 1x házet", short: "+1 hod", effect: { kind: "hodZnovu" } },
  { n: 6,  pos: [318, 470] },
  { n: 7,  pos: [368, 445], text: "4 vpřed", short: "4 vpřed", effect: { kind: "posun", to: 11 } },
  { n: 8,  pos: [318, 405] },
  { n: 9,  pos: [262, 395] },
  { n: 10, pos: [206, 385], redRing: true },
  { n: 11, pos: [152, 372] },
  { n: 12, pos: [100, 360], text: "při pádu znovu a 3 hry čekat", short: "pád: start + 3 kola", fall: { to: 0, wait: 3 } },
  { n: 13, pos: [45, 340],  text: "při pádu 3x čekat", short: "pád: 3 kola", fall: { to: 13, wait: 3 } },
  { n: 14, pos: [105, 312], redRing: true },
  { n: 15, pos: [160, 298], text: "ještě 1x házet", short: "+1 hod", effect: { kind: "hodZnovu" } },
  { n: 16, pos: [215, 282], redRing: true },
  { n: 17, pos: [272, 266], text: "1x čekat", short: "1× čekat", effect: { kind: "cekat", turns: 1 } },
  { n: 18, pos: [335, 240], text: "při pádu na horu č. 1", short: "pád: na 1", fall: { to: 1, wait: 0 } },
  { n: 19, pos: [290, 212], text: "1 zpět", short: "1 zpět", effect: { kind: "posun", to: 18 } },
  { n: 20, pos: [235, 195], text: "čeká až hodí 6, pak hází barev. kostkou, při černé na č. 13", short: "lanovka: 6", effect: { kind: "stanice" } },
  { n: 21, pos: [180, 180], text: "při pádu začít znovu", short: "pád: start", fall: { to: 0, wait: 0 } },
  { n: 22, pos: [122, 168], redRing: true },
  { n: 23, pos: [62, 148],  text: "při pádu na horu č. 11", short: "pád: na 11", fall: { to: 11, wait: 0 } },
  { n: 24, pos: [120, 118], text: "házet barev. kostkou, při černé na č. 13", short: "barevná kostka", effect: { kind: "barevnaKostka" } },
  { n: 25, pos: [185, 98],  text: "při pádu na horu č. 13", short: "pád: na 13", fall: { to: 13, wait: 0 } },
  { n: 26, pos: [252, 80] },
  { n: 27, pos: [322, 58] },
],
routes: [
  { from: 7,  to: 11, control: [165, 430], kind: "posun" },
  { from: 20, to: 27, control: [270, 130], kind: "lanovka" },
  { from: 24, to: 27, control: [230, 150], kind: "lanovka" },
],
colorDie: { faces: ["red", "blue", "yellow", "green", "black", "white"], blackTo: 13, successTo: 27 },
spots: {
  start:  [[95, 560], [125, 560], [155, 560], [185, 560]],
  summit: { red: [290, 30], blue: [322, 22], yellow: [354, 30], green: [372, 58] },
  hub13:  [[25, 372], [65, 375]],
},
```

- Souřadnice jsou **vlastní rozvržení** podle trasy originálu (zdola zleva doprava, klikatě nahoru, vrchol vpravo nahoře), řady jsou proti originálu roztažené kvůli čitelnosti na telefonu.
- Ověřeno výpočtem v Pythonu (2026-11-08): kotouče hor r 14 a místa r 10 mají mezi okraji nejméně 10 jednotek. Čárkované trasy (kvadratický Bézier) vedou od středů ostatních hor nejméně 25,7 jednotky.
- Pořadí barev na vrcholu je jako na originále: červená, modrá, žlutá, zelená.

---

## Validátor (`scripts/validate-game.ts`)

`package.json`: `"prebuild": "tsx scripts/validate-game.ts"`. Při chybě skončí nenulovým kódem a vypíše, co přesně neprošlo. Celý běh do ~15 s.

1. **Plán:**
   - 27 hor, `n` = index + 1. Texty `text` přesně podle tabulky v Předloze (validátor má vlastní kopii doslovných textů).
   - Cíle posunů a pádů leží v 0–27. Cíle posunů nemají `effect` ani `redRing`.
   - Pády jsou přesně na 12, 13, 18, 21, 23, 25. Jediný řetěz pádů je 25 → 13 a končí (13 → 13).
   - Hory s `redRing` (přesně 10, 14, 16, 22) nemají `effect` ani `fall` a nejsou cílem posunu, pádu ani barevné kostky.
   - Trasy odpovídají účinkům: 7 → 11 `posun`, 20 → 27 a 24 → 27 `lanovka`.
2. **Geometrie:** kotouče r 14, místa (start, vrchol, hub13) r 10. Mezera mezi okraji jakýchkoli dvou ≥ 6. Vše uvnitř x 10–390, y 10–575. Každá trasa (vzorkovaná po 1/200) vede od středů ostatních hor ve vzdálenosti ≥ 24.
3. **Invarianty enginu:** 5 000 náhodných her, 2–4 horolezci, náhodné kombinace pravidel. Po každé akci platí:
   - pozice v 0–27;
   - při `magnets` má každý horolezec právě 3 zrádné hory a odpovídají jeho pólu;
   - `revealed ⊆ danger`, `knownSafe ∩ danger = ∅`;
   - při `redRing: "zakaz"` nikdo nestojí na hoře s červeným kroužkem;
   - `atStation` jen na hoře 20;
   - pořadí dokončení bez duplicit, hra skončí do 1 000 tahů vítěze;
   - `replayPositions(pozice před akcí, události)` = pozice po akci;
   - `JSON.stringify(toPublicView(state))` neobsahuje `"danger"`, `"pole"` ani `"fieldPoles"`.
4. **Determinismus:** dva běhy se stejným seedem a stejnými akcemi dají identický JSON.
5. **Vyvážení** (výchozí pravidla, 2 horolezci, 20 000 her, seed 12345). Vypiš tabulku: p10, p50, p90, p99 a max počtu kol do prvního vítěze, pády na hru, % her s pádem, % her s návratem pod horu (pád na 12 nebo 21), % her vyhraných lanovkou, % her se zákazem červeného kroužku. Pro informaci vypiš i 3 a 4 horolezce. **Selže**, když p50 mimo 10–16, p90 > 34, max ≥ 300, pád < 80 %, návrat pod horu mimo 45–72 %, výhra lanovkou mimo 60–85 %, zákaz < 85 %.
   - Reference (Python, stejný výklad pravidel, ověřeno 2026-11-08): 2 horolezci p10 7, p50 13, p90 28, p99 48, max 93; 3,18 pádu na hru; 88,0 % her s pádem; 58,5 % s návratem pod horu; 72,3 % vyhraných lanovkou; 93,5 % se zákazem. 3 horolezci p50 11, p90 21. 4 horolezci p50 10, p90 18.
   - Varianty pro informaci (2 horolezci, p50): bez magnetů 8; červený kroužek bez účinku 9; barevná kostka jen vlastní barva 16 (lanovkou vyhráno jen 19 %); přesný hod 14; šestka znovu 12; vyhazování 15.

---

## Vizuální design

**Námět:** svislá magnetická deska z roku 1955 na stojánku, pod ní stůl. Řada kopců s očíslovanými vrcholky stoupá k hlavnímu masivu, každá hora stojí na vlastním kopečku. Barvy hráčů jsou barvy originálních figurek (červená, modrá, žlutá, zelená). Jediný výrazný efekt celé aplikace je **magnetický pád figurky z desky na stůl**, všechno ostatní je klidné a střídmé.

### Témata (CSS custom properties, `data-theme` na `<html>`)

Žádná komponenta nemá barvu natvrdo. Přepínač: ☀️ Jasný den / 📜 Tisk 1955 / 🌙 Bivak v noci.

| Proměnná | `hory-den` (výchozí) | `retro-1955` | `hory-noc` |
|---|---|---|---|
| `--bg` | `#eef4f8` | `#ece1c3` | `#0d1726` |
| `--surface` | `#ffffff` | `#f4ead0` | `#16233a` |
| `--surface-2` | `#e3ecf2` | `#e2d4ae` | `#1d2d48` |
| `--border` | `#c9d6df` | `#b9a77c` | `#2b3f5e` |
| `--text` | `#1c2630` | `#2b2620` | `#e6edf5` |
| `--text-soft` | `#4a5866` | `#554b3d` | `#b3c1d1` |
| `--text-muted` | `#5c6975` | `#635744` | `#8a99ad` |
| `--accent` | `#5b46b8` | `#1f4e79` | `#a993ff` |
| `--accent-contrast` | `#ffffff` | `#ffffff` | `#0d1726` |
| `--sky-1` / `--sky-2` | `#bcdcf0` / `#eef7fc` | `#c9d9da` / `#ece1c3` | `#0b1424` / `#1c2f4d` |
| `--ridge-far` | `#a9bccb` | `#9fb3b0` | `#23344d` |
| `--rock` / `--rock-dark` | `#7d8995` / `#5b6672` | `#6f7d84` / `#4c5a62` | `#3a4b61` / `#2a384b` |
| `--snow` | `#ffffff` | `#f7f1e0` | `#cfdcea` |
| `--hill-4` (nejdál, nahoře) | `#b4c6c9` | `#aab6a5` | `#2b3a55` |
| `--hill-3` | `#9db9a9` | `#9eab86` | `#283a48` |
| `--hill-2` | `#8fb47a` | `#93a066` | `#263a3a` |
| `--hill-1` (nejblíž, dole) | `#7fae5a` | `#8a9a4b` | `#23382c` |
| `--meadow` / `--forest` | `#8bb867` / `#3e6e47` | `#8a9a4b` / `#4f6332` | `#2c4636` / `#1d3326` |
| `--route` | `#c62828` | `#a3322a` | `#ff8a80` |
| `--field-fill` | `#ffffff` | `#f7efd9` | `rgba(255, 228, 160, 0.16)` |
| `--field-stroke` | `#2a333c` | `#2b2620` | `#f3dc9b` |
| `--ring-red` | `#c62828` | `#b3261e` | `#ff6b6b` |
| `--frame` | `#8a6a4a` | `#7a5634` | `#3b2f25` |
| `--table` / `--table-dark` | `#b58a5f` / `#8c6644` | `#9b7148` / `#6e4e30` | `#4a3a2c` / `#34281e` |
| `--good` / `--bad` | `#2e7d32` / `#c62828` | `#4f6b2a` / `#a3322a` | `#81c784` / `#ff8a80` |
| `--misreg` / `--misreg-opacity` | `#000` / `0` | `#a3322a` / `0.35` | `#000` / `0` |

Barvy horolezců (ve všech tématech stejné): `--climber-red #d32f2f`, `--climber-blue #1e63c6`, `--climber-yellow #f2c200`, `--climber-green #277a35`. Žlutá má tmavý obrys a tmavé číslo.

Kontrasty ověřeny výpočtem podle WCAG (2026-11-07): `--text`, `--text-soft` i `--text-muted` mají na `--bg`, `--surface` i `--surface-2` ve všech třech tématech ≥ 4,5 : 1, text tlačítek na `--accent` ≥ 6,9 : 1, bílé číslo na červené, modré a zelené figurce ≥ 4,9 : 1. Při změně palety kontrast přepočítej.

`body { transition: background-color 0.3s ease; }`, aby přepnutí tématu neproblikávalo.

### Typografie

- Nadpis „Horolezec“ a nadpisy obrazovek: **Alfa Slab One** (jen ≥ 22 px).
- Vše ostatní: **Bitter** 400 a 600. Čísla s `font-variant-numeric: tabular-nums`.
- Oba fonty musí vykreslit českou diakritiku (zkušební věta „Příliš žluťoučký kůň úpěl ďábelské ódy“). Pokud některý font znaky nemá, použij Bitter všude a napiš mi to.
- Věty malými písmeny se zdviženým prvním písmenem, žádné popisky v kapitálkách.

### Rozvržení

- Mobil (< 768 px): sloupec – hlavička (malý nadpis, menu ☰, přepínač tématu) → proužek „Na tahu“ → deska (`aspect-ratio: 400 / 620`, šířka `calc(100vw - 16px)`, výška nejvýš ~62vh, šířka se pak dopočítá) → panel (kostky, hlavní tlačítko, poslední hláška). Na 390 × 844 je při hře vidět deska i tlačítko bez scrollování.
- Desktop (≥ 900 px): tři sloupce – legenda vlevo (240 px), deska uprostřed (výška do 92vh), panel vpravo (340 px).
- Touch targety ≥ 44 px, kostka a hlavní tlačítko 64 px. Na 380 px žádný horizontální scroll (`body { overflow-x: hidden; }` jako pojistka).

### Deska (`Board.tsx`, SVG `viewBox 0 0 400 620`, vlastní ilustrace)

Vrstvy odspodu:
1. Nebe (gradient `--sky-1` → `--sky-2`), vzdálené pohoří `--ridge-far`, hlavní masiv za řadami hor 19–27 (skála a sníh) – v tématu Tisk 1955 vykreslený dvakrát s posunem soutisku (druhá kopie posunutá o 1,5 a 1 v barvě `--misreg`, průhlednost `--misreg-opacity`).
2. **Kopečky pod horami:** každá hora stojí na vlastním jednoduchém kopečku (zaoblený nebo špičatý obrys, šířka 60–90 jednotek), kreslené odzadu dopředu. Barva podle řady: hory 24–27 `--hill-4`, 19–23 `--hill-3`, 14–18 `--hill-2`, 1–13 `--hill-1` (vzdálenější jsou světlejší). Hora 13 má širší kopec se dvěma vedlejšími místy, vrchol 27 plošinu se čtyřmi barevnými místy.
3. Údolí dole (`--meadow`, pár stromků `--forest`), u startovních míst stan. Dekorace jen obecné, žádná kopie originální malby.
4. U hory 17 chatka s červeným křížem (dekorace, souřadnice ~(305, 280)). U hory 20 ikonka stanice lanovky.
5. **Trasy** podle `routes`: čárkovaná čára `--route`, šířka 2,5, `stroke-dasharray: 7 5`, uprostřed malá šipka ve směru pohybu. U lanovek malá kabinka.
6. **Kotouče hor:** r 14, výplň `--field-fill`, obrys `--field-stroke` 1,5, číslo Bitter 600 velikosti 12. Hory s `redRing`: vnitřní kruh `--ring-red` šířky 4 (jako dopravní značka).
7. **Štítky:** u hor s `short` malý štítek vedle kotouče (na vnější straně řady), ikona + text velikosti 8,5. Když je deska vykreslená užší než 600 px, jen ikona. Klepnutí na horu se štítkem otevře bublinu: doslovný text v uvozovkách („čeká až hodí 6, …“) a pod ním „V aplikaci:“ s výkladem.
8. Místa: startovní (4×, r 10), vrcholová (4 barevná kola, r 10), dvě vedlejší místa u hory 13 (kruh rozdělený na čtvrtiny ve čtyřech barvách hráčů, r 10).
9. Značky odhalených zrádných hor → zvýraznění posledního tahu → figurky → rám desky, nožky stojánku a stůl (pruh `y 580–620`, `--table`).

Komponenta `<Board>` se během hry nikdy neodmountuje (žádný `key` závislý na stavu).

### Legenda (`Legend.tsx`)

Seznam hor se štítkem: číslo, ikona, doslovný text a výklad v aplikaci. Na desktopu stále vlevo vedle desky, na mobilu v menu a na obrazovce Pravidla.

### Figurka (`ClimberToken.tsx`)

- Silueta dřevěné figurky: kulatá hlava, tělo, dole seříznutá koule (jako originál). Barva horolezce, přes tělo bílý vodorovný pruh, tmavý obrys. V hlavě číslo hráče 1–4 (přístupnost, nejen barva).
- Výška ≈ 26 jednotek, pata na středu kotouče. Víc figurek na jedné hoře se rozestoupí (posun −8 / +8). Na hoře 13 se další figurky postaví na vedlejší místa `hub13`. Na vrcholu stojí každá na svém barevném místě, pod horou na startovním místě podle pořadí.
- **Dvě vnořené skupiny:**
  - vnější `<g>` = pozice: `style={{ transform: \`translate(${x}px, ${y}px)\` }}`, `transition: transform var(--move-ms) ease-out`. Nikdy SVG atribut `transform` (v Safari by se neanimoval).
  - vnitřní `<g>` = efekty (kývání, otočení při pádu, poskok): keyframes, `transform-box: fill-box; transform-origin: 50% 100%`.
- Klíč komponenty = `climber.id`, nikdy pozice.

### Značky na desce

- **Odhalená zrádná hora:** malá ikona podkovového magnetu v barvě horolezce vedle kotouče (posun podle indexu horolezce, vejdou se čtyři). Přepínač „Ukazovat, kde kdo spadl“ (výchozí zapnuto).
- **Poslední tah (odkud → kam):** výchozí hora tenký čárkovaný kroužek, cílová plný kroužek, obojí v barvě horolezce. Samostatná vrstva, `pointer-events: none`, drží do dalšího tahu. Při pádu je plný kroužek na cíli pádu, místo pádu ukazuje značka magnetu.
- **Čeká na šestku:** u figurky na hoře 20 malý odznak „6“.
- **Stojí:** u figurky s `skipTurns > 0` malý odznak s počtem kol.

### Kostky (`Die.tsx`)

- `kind="cisla"`: puntíky. `kind="barvy"`: bílá kostka s velkým barevným kruhem na stěně (bílá stěna má jen obrys kruhu).
- Barevná kostka se v panelu objeví jen ve chvíli, kdy se jí hází (hora 24, šestka na hoře 20).
- F1: 2D stěna, krátké zatřesení 300 ms. F2: 3D kostka z CSS (6 stěn, `transform-style: preserve-3d`), hod 700 ms, dopadne na hozenou stěnu. Při `prefers-reduced-motion` bez rotace.
- Klepnutí na kostku s čísly = „Hodit kostkou“.

---

## Animace – přehrávání událostí (`src/lib/eventPlayer.ts`)

Engine vrátí stav i seznam událostí. UI zobrazuje pozice ze „zobrazovaného stavu“, který přehrávač posouvá událost po události. Na konci se zobrazovaný stav rovná stavu enginu. Během přehrávání jsou tlačítka zablokovaná. Klepnutí na desku přehrávání dokončí okamžitě.

| Událost | Animace | Trvání |
|---|---|---|
| `roll`, `colorRoll` | kostka | 600 ms (F2: 700 ms) |
| `step` | figurka přeskočí na další horu | 200 ms na horu, celý pohyb nejvýš 1200 ms |
| `blocked` | figurka poskočí k červenému kroužku a vrátí se, kroužek pulzne | 450 ms |
| `move` posun | po čárkované trase 7 → 11 | 800 ms |
| `move` lanovka | po trase na vrchol, s figurkou jede kabinka | 1100 ms |
| `move` zpet | 19 → 18 | 300 ms |
| `move` cerna | krátké kývnutí a sjezd na horu 13 po přímce `ease-in` | 250 + 800 ms |
| `magnetFall` | **magnetický pád** (níže) | ~1750 ms |
| `wait`, `skip`, `stationMiss` | hláška, figurka se lehce zhoupne | 400 ms |
| `stationEnter` | odznak „6“ se objeví | 250 ms |
| `knockOut` | oběť spadne na stůl a přesune se pod horu | 1200 ms |
| `summit` | figurka přejde na své barevné místo, poskočí, vlajka zavlaje | 800 ms |
| pauza před tahem počítače | Normálně 700 ms / Rychle 250 ms / Okamžitě 0 ms a bez animací | |

**Magnetický pád (jediný výrazný efekt):**
1. 350 ms kývání: vnitřní skupina −10° → +10° → −6° (magnet figurku odpuzuje).
2. 450 ms odpadnutí: vnější skupina sjede na stůl (stejné x, y = 600) s `ease-in` (gravitace), vnitřní se otočí o 90° (figurka leží). Současně se u hory objeví značka magnetu (scale 0 → 1, 200 ms).
3. 350 ms figurka leží na stole.
4. 600 ms figurka se zvedne (rotace zpět) a přesune `ease-out` na cíl pádu (pod horou na své startovní místo).

`@media (prefers-reduced-motion: reduce)`: všechna trvání 0, jen pád má 150 ms prolnutí. Žádná 3D rotace kostek.

---

## Obrazovky a texty

Hlášky skládej tak, aby se jméno **nemuselo skloňovat ani rodově shodovat** (vzor „Bára: …“). Šablony v `texts.ts`:

| Událost | Hláška |
|---|---|
| hod a pohyb | „Bára: hod 4, hora 9.“ |
| zákaz | „Bára: hora 10 má červený kroužek, zůstává na 6.“ |
| hod navíc | „Bára hází ještě jednou.“ |
| 4 vpřed | „Bára: 4 vpřed, hora 11.“ |
| 1x čekat / stojí | „Bára: 1× čekat.“ / „Bára stojí (zbývají 2).“ |
| 1 zpět | „Bára: 1 zpět, hora 18.“ |
| stanice | „Bára: lanovka na hoře 20, čeká na šestku.“ / „Bára: hod 3, na lanovku je potřeba šestka.“ |
| barevná kostka | „Bára: barevná kostka – modrá, lanovkou na vrchol!“ / „Bára: barevná kostka – černá! Zpět na horu 13.“ |
| magnetický pád | „Bára: magnet odpuzuje! Pád na horu 1.“ / „… Začíná znovu pod horou.“ / „… 3 kola čeká.“ |
| přehoz při přesném hodu | „Bára: na vrchol chybí 3, tentokrát nic.“ |
| vyhazování | „Na hoře 9 není místo pro dva. Tonda začíná znovu.“ |
| vrchol | „Bára je na vrcholu!“ |

### 1. Nastavení (`SetupScreen`)

- „Horolezec“ (Alfa Slab One), pod tím „Magnetická hra z roku 1955. Kdo první vystoupá na vrchol?“
- Je-li uložená rozehraná hra: hlavní tlačítko „Pokračovat v rozehrané hře“, vedle „Nová hra“.
- **Kdo hraje:** volby „Proti počítači“ / „Více lidí na jednom zařízení“, počet horolezců 2–4, řádky míst: barevná tečka (klepnutí = další volná barva), jméno (max. 12 znaků), Člověk/Počítač.
  - „Proti počítači“: místo 1 člověk „Hráč“, ostatní počítač s náhodnými jmény z `names.ts` (Jirka, Bára, Honza, Věra, Tonda, Marta, Pepa, Hana – bez opakování).
  - „Více lidí“: všichni lidé „Hráč 1“ až „Hráč n“.
- **Pravidla hry:** přepínače z tabulky volitelných pravidel, každý s jednou větou vysvětlení a značkou „výklad“ tam, kde jde o výklad (červený kroužek, barevná kostka, přesný hod, šestka, vyhazování).
- Tlačítko „Vyrazit na výstup“.

### 2. Hra

- Hlavička: „Horolezec“ malým písmem, menu ☰ (Pravidla, Legenda, Nová hra s potvrzením, Rychlost počítače, Ukazovat, kde kdo spadl), přepínač tématu.
- Proužek „Na tahu: Bára“ s barvou a číslem figurky. Když po člověku přijde jiný člověk, proužek na 1,2 s zvýrazni a tlačítko zní „Bára, hoď kostkou“.
- Panel: kostka s čísly, podle potřeby barevná kostka, hlavní tlačítko „Hodit kostkou“, poslední hláška. Hlášky jdou i do `aria-live="polite"`.
- „Deník výpravy“ (F2): rozbalovací seznam posledních 50 hlášek, nejnovější nahoře.

### 3. Výsledek (`ResultScreen`, F3)

- „Bára je na vrcholu!“, pořadí, u každého: hody, pády z magnetu, jízdy lanovkou, zákazy, počet kol.
- **„Kde by kdo spadl“:** po konci hry odhal tajemství – u každého horolezce jeho 3 zrádné hory (odhalené plně, neodhalené obrysem) a kdo měl magnet otočený stejně. Tady smí UI číst plný stav.
- Tlačítka: „Hrát o další místa“ (když lezou ještě aspoň dva), „Nová výprava“ (stejné nastavení, nový seed = nové magnety), „Změnit nastavení“.

### 4. Pravidla (`RulesScreen`)

Text z `texts.ts`, tabulka doslovných textů z plánu s výkladem (generovaná z `board.ts`) a tabulka výkladu z Předlohy. Výchozí úvod:

> **Jak se hraje.** Hoď kostkou a vystoupej o tolik hor. Vyhrává, kdo první stane na vrcholu.
>
> **Magnety.** V originále stála deska svisle a pod šesti horami s nápisem „při pádu …“ byly magnety. Figurka má v patce magnet otočený jedním ze dvou směrů. Když se potká se stejně otočeným magnetem hory, odpudí ho a spadne. Každý horolezec má tedy tři zrádné hory a nikdo neví které. Kde někdo spadl, označí se magnetem v jeho barvě. Dva horolezci se stejně otočeným magnetem padají na stejných horách.
>
> **Hory s textem** fungují podle legendy. Na horu s červeným kroužkem se nesmí. Na horách 20 a 24 rozhoduje barevná kostka: černá vrací na horu 13, jiná barva veze lanovkou na vrchol.
>
> **Odkud hra je.** Horolezce vydala TOFA Semily v roce 1955 jako svislou magnetickou desku na stojánku s dřevěnými figurkami. Hráči si mezi partiemi figurky měnili, aby si nikdo nezapamatoval svá krizová místa. Čísla hor a texty jsou podle originálního plánu, ilustrace je nová. Část pravidel vykládáme, protože původní návod nemáme – přehled je v tabulce výkladu.

---

## Perzistence (`src/lib/storage.ts`)

- Klíče: `horolezec.v2.settings` (poslední nastavení, pravidla, rychlost počítače, zobrazování značek), `horolezec.v2.theme`, `horolezec.v2.game` (celý `GameState` po každé dokončené akci), `horolezec.v2.stats` (od F3).
- Vše v `try/catch`, chyba čtení = jako by klíč nebyl. Pole `schema` a funkce `migrate()`. Nekompatibilní data nemaž potichu, přesuň je pod klíč s příponou `.backup`.
- Uložená hra obsahuje i póly (nutné pro pokračování). U rodinné aplikace je to v pořádku.

---

## Připraveno na online (jen architektura, nic síťového neimplementovat)

- Engine je čistý reducer `(stav, akce) → (stav, události)`, stav je serializovatelný do JSON a seed + posloupnost akcí partii přesně zopakuje.
- UI kreslí z `PublicView` a událostí. Tajná data (`pole`, `danger`, `fieldPoles`) zná jen engine a výsledková obrazovka po konci hry.
- Online režim půjde doplnit později jako přenos akcí, kde engine poběží u hostitele nebo na serveru. **Žádný síťový kód, žádné API ani WebSockety teď nepřidávej.**

---

## FÁZE 1 — Engine, herní plán, validátor a hra pro lidi

**Cíl:** hratelná hra 2–4 lidí na jednom zařízení s celým enginem (včetně všech volitelných pravidel), ověřenými daty plánu a jedním tématem.

### Implementuj

1. Projekt Vite + React + TypeScript + Tailwind, dev závislost `tsx`, fonty Alfa Slab One a Bitter v `index.html`, `Icon.tsx` se základními ikonami (kostka, barevná kostka, lanovka, posun vpřed, zpět, čekat, pád, magnet, stan, chatka, červený kříž, vlajka, menu, info).
2. `rng.ts`, `rules.ts`, `engine.ts` podle sekce Datové typy, se všemi volitelnými pravidly (`magnets`, `redRing`, `colorDie`, `exactFinish`, `sixAgain`, `knockOut`).
3. `data/board.ts` přesně podle zadání.
4. `scripts/validate-game.ts` body 1–5 a `prebuild` hook.
5. `Board.tsx` a `MountainArt.tsx` ve zjednodušené podobě: nebe, masiv, kopečky pod horami, trasy, kotouče, červené kroužky, štítky (zatím jen ikony), místa na startu, vrcholu a u hory 13, rám, stojánek a stůl. Jen téma `hory-den`.
6. `ClimberToken.tsx` se stabilními ID a dvěma vnořenými skupinami. Základní `eventPlayer`: pohyb hora po hoře, `move` (posun, lanovka, zpět, černá), odskok u červeného kroužku. Pád zatím zjednodušeně (prolnutí ven a dovnitř na cíli).
7. Značky odhalených zrádných hor, zvýraznění posledního tahu, odznaky „6“ a „stojí“.
8. Jednoduché nastavení (2–4 lidé, jména, výchozí pravidla), herní obrazovka s oběma kostkami ve 2D, tlačítkem a poslední hláškou, jednoduché okno vítěze s „Nová hra“.
9. Ve vývojovém režimu jde seed zadat parametrem `?seed=123` (kvůli opakovatelnému testování).

### Mimo rozsah Fáze 1
Počítačoví hráči, 3D kostky, efektní pád na stůl, deník, legenda, bubliny, obrazovka pravidel, další témata, ukládání rozehrané hry, výsledková obrazovka, statistiky, PWA, zvuky, online.

### Akceptační kritéria Fáze 1
- [ ] `npm run build` projde, `prebuild` vypíše tabulku vyvážení a hodnoty jsou v mezích.
- [ ] Hru 2–4 lidí jde dohrát do konce. Magnetický pád nastane a odhalí značku. Všechny hory s textem, červené kroužky a barevná kostka fungují podle tabulky Plán.
- [ ] Figurky se pohybují plynule hora po hoře i v Safari na iPhonu (ne skokem).
- [ ] Šířka 380 px bez horizontálního scrollu. Na 390 × 844 je při hře vidět deska i tlačítko bez scrollování.
- [ ] Česká diakritika se vykresluje v obou fontech.
- [ ] Commit a push.

**Stop a počkej na potvrzení před Fází 2.**

---

## FÁZE 2 — Hra proti počítači, animace, pravidla, témata

**Cíl:** plnohodnotná hra proti 1–3 počítačovým horolezcům i pro víc lidí, s charakteristickým magnetickým pádem, legendou a uložením rozehrané hry.

### Implementuj

1. Počítačoví hráči: `useGame` za ně po pauze podle rychlosti (Normálně / Rychle / Okamžitě) odešle `roll`. Během jejich tahu je vstup zablokovaný.
2. Plné nastavení: volby „Proti počítači“ a „Více lidí na jednom zařízení“, 2–4 místa, Člověk/Počítač, barvy, jména, přepínače všech volitelných pravidel se značkou „výklad“.
3. Úplný `eventPlayer` podle tabulky časování: **magnetický pád na stůl**, jízda lanovkou s kabinkou, sjezd po černé, vyhazování, zrychlení klepnutím na desku, `prefers-reduced-motion`.
4. 3D kostky (s čísly i barevná).
5. Proužek „Na tahu“ pro předávání zařízení, `aria-live`, Deník výpravy.
6. `RulesScreen`, `Legend` a bubliny s doslovným textem a výkladem po klepnutí na horu.
7. Témata `retro-1955` (včetně posunu soutisku) a `hory-noc`, `ThemeSwitcher`, uložení volby.
8. Ukládání rozehrané hry po každé akci, „Pokračovat v rozehrané hře“, zapamatování posledního nastavení.

### Mimo rozsah Fáze 2
Výsledková obrazovka s odhalením magnetů, statistiky, PWA, zvuky, online.

### Akceptační kritéria Fáze 2
- [ ] 1 člověk + 3 počítače dohrají hru, počítač táhne sám.
- [ ] 2 lidé se střídají na jednom zařízení, je jasné, kdo je na tahu.
- [ ] Při magnetickém pádu figurka viditelně spadne na stůl a vrátí se na cíl pádu. Jízda lanovkou je vidět po trase.
- [ ] Obnovení stránky uprostřed hry → „Pokračovat“ vrátí přesně stejný stav.
- [ ] Témata se přepínají a pamatují si volbu. Kontrast textu ≥ 4,5 : 1 ve všech třech.
- [ ] Se zapnutým omezením pohybu v systému se nic neanimuje.
- [ ] 380 px bez horizontálního scrollu, validátor projde.
- [ ] Commit a push.

**Stop a počkej na potvrzení před Fází 3.**

---

## FÁZE 3 — Výsledky, odhalení magnetů, statistiky, PWA, dokončení

**Cíl:** výsledková obrazovka s odhalením, kde by kdo spadl, statistiky, instalace na plochu iPhonu a doladění.

### Implementuj

1. `ResultScreen` s pořadím, statistikami a sekcí „Kde by kdo spadl“, tlačítka „Hrát o další místa“, „Nová výprava“, „Změnit nastavení“.
2. Statistiky v `localStorage`: počet her, výhry podle jména, nejkratší výstup v kolech. Zobrazit na úvodní obrazovce, smazání s potvrzením.
3. PWA základ: `manifest.webmanifest`, ikona `public/icon.svg` (figurka na vrcholku), `theme-color`, `apple-mobile-web-app-capable`, `apple-touch-icon`. PNG ikony (180, 192, 512) jen pokud to jde bez nové závislosti, jinak se zastav a zeptej. **Bez service workeru.**
4. Doladění: kontrola na 380 a 768 px, viditelný focus, kontrasty, texty.
5. `CLAUDE.md` podle šablony níže.

### Mimo rozsah Fáze 3
Online hra, účty, backend, service worker, zvuky, další herní plány, vícejazyčnost, skoby a úrovně počítače (vypuštěno ve v2.0).

### Akceptační kritéria Fáze 3
- [ ] Výsledková obrazovka ukáže pořadí, statistiky a zrádné hory všech horolezců.
- [ ] Hra o další místa a statistiky fungují a přežijí obnovení stránky.
- [ ] Aplikace jde v Safari přidat na plochu a spustí se bez lišty prohlížeče.
- [ ] `CLAUDE.md` je v kořeni repa.
- [ ] Commit a push.

---

## CLAUDE.md (vytvoř na konci Fáze 3)

```markdown
# CLAUDE.md — Horolezec

## O projektu
Digitální verze magnetické deskové hry Horolezec (TOFA Semily, 1955). Závodní hra 2–4 hráčů
proti počítači nebo více lidí na jednom zařízení. Česky, bez backendu, stav v localStorage.
Čísla hor a texty jsou podle fotografie originálního plánu (27 hor). Část pravidel je výklad
(tabulka Výklad v horolezec-spec.md), nastavitelný přes Rules a src/data/board.ts.

## Workflow
- Cesta B: Claude Code → GitHub (r4d3k2/horolezec) → Vercel (automatický deploy z main).
- Pracuj jen na větvi main, žádné větve ani git worktree. Commity česky.
- Každý prompt začíná: "Work directly on the main branch, do not create new branches, do not use git worktree."

## Tech stack
React + TypeScript + Vite + Tailwind, tsx pro validátor. Žádné další knihovny bez souhlasu.
Animace jen CSS, bez zvuků. Ikony inline SVG v Icon.tsx.

## Klíčové soubory
- src/lib/engine.ts – čistý reducer (createGame, applyAction, legalActions, toPublicView)
- src/lib/rng.ts – seedovaný generátor, žádné Math.random v enginu
- src/lib/eventPlayer.ts – časování animací z událostí
- src/data/board.ts – plán: hory, doslovné texty, účinky, pády, trasy, barevná kostka, souřadnice
- scripts/validate-game.ts – prebuild: plán, geometrie, invarianty, vyvážení

## Zásady
- Texty hor jsou doslovné z originálu, neměnit. Výklad pravidel měnit jen přes Rules a board.ts.
- Tajná data (pole, danger, fieldPoles) čte jen engine a výsledková obrazovka po konci hry.
- Pozice figurky = CSS style.transform v px na vnější <g>, efekty na vnitřní <g>. Nikdy SVG atribut transform.
- Klíč figurky = stabilní ID horolezce. <Board> se neodmountovává.
- Barvy jen přes CSS proměnné témat (hory-den, retro-1955, hory-noc).
- Ilustrace desky je vlastní, nekopírovat originální malbu.
- localStorage vždy v try/catch, změna tvaru dat jen s migrací.

## Co nedělat
- Nepřidávat backend, účty, analytiku, reklamy, zvuky.
- Neimplementovat online hru bez samostatného rozhodnutí (architektura je připravená).
- Nevymýšlet nová pravidla mimo tabulku Výklad.
```

---

## Kontrolní seznam před commitem Fáze 1

- [ ] `npm run build` projde včetně `prebuild`.
- [ ] V `src/lib/` není `any` ani `Math.random`.
- [ ] `board.ts` odpovídá tabulkám (texty doslovně, účinky, pády, červené kroužky, trasy, místa).
- [ ] Figurky mají klíč podle `climber.id` a pozici přes `style.transform`.
- [ ] `index.css` má všechny proměnné tématu `hory-den`.

---

## Komunikace mezi fázemi

1. Po dokončení fáze commit a push:
   ```
   git add .
   git commit -m "Fáze N hotová: <stručně>"
   git push
   ```
2. Stop a počkej na zprávu typu „Fáze N je v pořádku, pokračuj Fází N+1.“
3. Když najdu chybu, popíšu ji konkrétně. Opravy dělej v rámci současné fáze, nepokračuj do další.

**Žádné spekulativní změny mimo specifikaci.** Pokud něco v tomto dokumentu chybí nebo si odporuje, zeptej se dřív, než to doplníš.

---

## Zdroje předlohy

- Fotografie originálního herního plánu z krabice uživatele (2026-11-08): čísla hor, doslovné texty, červené kroužky, trasy, barevná místa.
- Zatrolené hry – katalog: https://www.zatrolene-hry.cz/spolecenska-hra/horolezec-5390/ (popis, počet hráčů, rok vydání; ověřeno 2026-11-07).
- Aukro – herní deska TOFA: https://aukro.cz/retro-hra-horolezec-orig-provedeni-50-leta-pouze-herni-deska-7079372700 (rozměry, stojánek, magnety pod poli; ověřeno 2026-11-07).
- Hyperinzerce – kompletní hra TOFA: https://hyperinzerce.cz/inzeraty/Index?query=krizovy+stul (figurky s magnetem, výměna figurek mezi partiemi, natištěná pravidla; ověřeno 2026-11-07).
