// Deník výpravy: rozbalovací seznam posledních 50 hlášek, nejnovější nahoře.

import { useState } from "react";
import { UI } from "../data/texts";

export function Journal({ entries }: { entries: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-xl border border-line bg-surface">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3 min-h-11 text-left text-ink font-semibold"
      >
        <span>{UI.journal}</span>
        <span className="text-sm text-ink-muted tabular font-normal flex items-center gap-2">
          {entries.length}
          <span aria-hidden="true" style={{ display: "inline-block", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
        </span>
      </button>
      {open ? (
        <ol className="max-h-64 overflow-y-auto px-3 pb-3 flex flex-col gap-1 text-sm">
          {entries.length === 0 ? <li className="text-ink-muted">{UI.journalEmpty}</li> : null}
          {entries.map((e, i) => (
            <li key={`${entries.length - i}`} className={i === 0 ? "text-ink" : "text-ink-soft"}>
              {e}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

export default Journal;
