// Ikona hory se štítkem (deska i legenda).

import type { FieldDef } from "../data/board";
import type { IconName } from "./Icon";

export function fieldIcon(f: FieldDef): IconName | null {
  if (f.fall) return "fall";
  switch (f.effect?.kind) {
    case "hodZnovu": return "dice";
    case "posun": return f.effect.to > f.n ? "forward" : "back";
    case "cekat": return "wait";
    case "stanice": return "lanovka";
    case "barevnaKostka": return "colorDie";
    default: return null;
  }
}
