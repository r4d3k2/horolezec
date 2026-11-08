// Volitelná pravidla. Výchozí hodnoty odpovídají výchozímu výkladu ve specifikaci.

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
