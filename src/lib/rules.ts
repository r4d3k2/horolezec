// Volitelná pravidla. Výchozí hodnoty odpovídají výchozímu výkladu ve specifikaci (v2.1: vyhazování zapnuté).

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
  exactFinish: false, sixAgain: false, knockOut: true,
};
