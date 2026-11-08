// Herní plán Horolezce (TOFA Semily, 1955).
// Čísla hor, texty `text`, červené kroužky, trasy a barevná místa jsou podle originálního plánu.
// Texty jsou doslovné a validátor je kontroluje znak po znaku – neměnit.
// Souřadnice jsou vlastní rozvržení (viewBox 0 0 400 620), ilustrace desky je vlastní.

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

export const CLIMBER_COLORS: ClimberColor[] = ["red", "blue", "yellow", "green"];

export const BOARD: BoardDef = {
  id: "horolezec-tofa",
  summit: 27,
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
};
