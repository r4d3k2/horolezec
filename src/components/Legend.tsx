// Legenda: hory se štítkem – číslo, ikona, doslovný text z plánu a výklad v aplikaci.

import { BOARD, type BoardDef } from "../data/board";
import { fieldExplanation, UI } from "../data/texts";
import type { Rules } from "../lib/rules";
import { fieldIcon } from "./fieldIcon";
import { Icon } from "./Icon";

function FieldNo({ n, red }: { n: number; red?: boolean }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full shrink-0 font-semibold tabular text-sm"
      style={{
        width: 30,
        height: 30,
        background: "var(--surface)",
        color: "var(--text)",
        border: red ? "4px solid var(--ring-red)" : "1.5px solid var(--text)",
      }}
      aria-hidden="true"
    >
      {n}
    </span>
  );
}

interface Props {
  rules: Rules;
  board?: BoardDef;
  compact?: boolean;
}

export function Legend({ rules, board = BOARD, compact }: Props) {
  const fields = board.fields.filter((f) => f.text);
  const reds = board.fields.filter((f) => f.redRing);
  return (
    <div className="flex flex-col gap-1">
      <ul className="flex flex-col">
        {fields.map((f) => {
          const icon = fieldIcon(f);
          return (
            <li key={f.n} className={`flex gap-3 border-b border-line last:border-b-0 ${compact ? "py-2" : "py-3"}`}>
              <FieldNo n={f.n} />
              <div className="min-w-0 flex-1">
                <p className="flex items-start gap-1.5 text-ink">
                  {icon ? <Icon name={icon} size={18} className="shrink-0 mt-0.5 text-ink-soft" /> : null}
                  <span className="italic">„{f.text}“</span>
                </p>
                <p className="text-sm text-ink-soft leading-snug mt-0.5">
                  <span className="text-ink-muted">{UI.inApp}</span> {fieldExplanation(f, rules)}
                </p>
              </div>
            </li>
          );
        })}
        <li className={`flex gap-3 ${compact ? "py-2" : "py-3"}`}>
          <span className="flex -space-x-2 shrink-0">
            {reds.slice(0, 2).map((f) => <FieldNo key={f.n} n={f.n} red />)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-ink">Hory {reds.map((f) => f.n).join(", ")} s červeným kroužkem</p>
            <p className="text-sm text-ink-soft leading-snug mt-0.5">
              <span className="text-ink-muted">{UI.inApp}</span> {fieldExplanation(reds[0], rules)}
            </p>
          </div>
        </li>
      </ul>
    </div>
  );
}

export default Legend;
