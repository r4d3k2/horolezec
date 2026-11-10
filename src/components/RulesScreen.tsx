// Obrazovka Pravidla: úvod, doslovné texty z plánu s výkladem (z board.ts) a tabulka výkladu.

import { INTERPRETATION_TABLE, RULES_INTRO, UI } from "../data/texts";
import type { Rules } from "../lib/rules";
import { Icon } from "./Icon";
import { Legend } from "./Legend";

interface Props {
  rules: Rules;
  onClose: () => void;
}

export function RulesScreen({ rules, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-bg" role="dialog" aria-modal="true" aria-labelledby="rules-title">
      <div className="mx-auto w-full max-w-[720px] px-4 pb-10">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 py-3 bg-bg">
          <h1 id="rules-title" className="text-[28px] text-ink">{UI.rules}</h1>
          <button
            type="button"
            onClick={onClose}
            aria-label={UI.close}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-ink hover:bg-surface-2"
          >
            <Icon name="close" size={24} />
          </button>
        </header>

        <section className="flex flex-col gap-3 text-ink leading-relaxed">
          {RULES_INTRO.map((p) => (
            <p key={p.title}>
              <strong className="font-semibold">{p.title}</strong> {p.text}
            </p>
          ))}
        </section>

        <section className="mt-8">
          <h2 className="text-[22px] text-ink mb-1">Texty z plánu</h2>
          <p className="text-sm text-ink-soft mb-2">Doslovně podle originálního plánu z roku 1955 a jak je hra vykládá.</p>
          <div className="rounded-2xl border border-line bg-surface px-3">
            <Legend rules={rules} />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-[22px] text-ink mb-1">Tabulka výkladu</h2>
          <p className="text-sm text-ink-soft mb-3">Původní návod nemáme. Takhle hra vykládá, co z plánu nevyplývá.</p>
          <ul className="flex flex-col gap-2">
            {INTERPRETATION_TABLE.map((r) => (
              <li key={r.question} className="rounded-xl border border-line bg-surface p-3">
                <p className="font-semibold text-ink">{r.question}</p>
                <p className="text-ink mt-1">{r.reading}</p>
                <p className="text-sm text-ink-soft mt-1">
                  <span className="text-ink-muted">Proč:</span> {r.why}
                </p>
                {r.alternative !== "—" ? (
                  <p className="text-sm text-ink-soft">
                    <span className="text-ink-muted">Jinak:</span> {r.alternative}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default RulesScreen;
