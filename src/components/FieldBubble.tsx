// Bublina po klepnutí na horu se štítkem: doslovný text z plánu a pod ním výklad v aplikaci.

import { BOARD, type BoardDef } from "../data/board";
import { fieldExplanation, UI } from "../data/texts";
import type { Rules } from "../lib/rules";
import { Icon } from "./Icon";

interface Props {
  field: number;
  rules: Rules;
  onClose: () => void;
  board?: BoardDef;
}

export function FieldBubble({ field, rules, onClose, board = BOARD }: Props) {
  const f = board.fields[field - 1];
  if (!f) return null;
  const [x, y] = f.pos;
  const vb = board.viewBox;
  const left = (x / vb[2]) * 100;
  const top = (y / vb[3]) * 100;
  // Bublina zůstane uvnitř desky: u kraje se posune, v dolní polovině se ukáže nad horou.
  const tx = x < 130 ? "-12%" : x > 270 ? "-88%" : "-50%";
  const below = y < 300;
  return (
    // Vnější vrstva drží polohu (transform), vnitřní má animaci – animace by jinak polohu přepsala.
    <div
      className="absolute z-20 w-[min(250px,80%)]"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        transform: `translate(${tx}, ${below ? "calc(0% + 22px)" : "calc(-100% - 22px)"})`,
      }}
    >
    <div
      role="dialog"
      aria-label={`Hora ${f.n}`}
      className="rounded-xl border border-line bg-surface shadow-lg p-3 fade-in"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start gap-2">
        <p className="flex-1 text-ink">
          <span className="font-semibold tabular">Hora {f.n}</span>
          {f.text ? <span className="block italic mt-0.5">„{f.text}“</span> : null}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label={UI.close}
          className="-mr-1 -mt-1 w-9 h-9 rounded-lg flex items-center justify-center text-ink-soft hover:bg-surface-2 shrink-0"
        >
          <Icon name="close" size={18} />
        </button>
      </div>
      <p className="text-sm text-ink-soft leading-snug mt-1.5">
        <span className="text-ink-muted">{UI.inApp}</span> {fieldExplanation(f, rules)}
      </p>
    </div>
    </div>
  );
}

export default FieldBubble;
