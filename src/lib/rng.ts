// Seedovaný generátor mulberry32. Stav je jedno uint32 číslo, které je součástí herního stavu.
// Jediný zdroj náhody v enginu – stejný seed dá vždy stejnou posloupnost.

/** Jeden krok generátoru: vrátí číslo z [0, 1) a nový stav. */
export function rngNext(state: number): { value: number; state: number } {
  const a = (state + 0x6d2b79f5) >>> 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return { value: ((t ^ (t >>> 14)) >>> 0) / 4294967296, state: a };
}

/** Pohodlná obálka nad stavem generátoru pro jednu akci enginu. */
export class Rng {
  state: number;

  constructor(state: number) {
    this.state = state >>> 0;
  }

  /** Číslo z [0, 1). */
  next(): number {
    const r = rngNext(this.state);
    this.state = r.state;
    return r.value;
  }

  /** Celé číslo z [0, n). */
  int(n: number): number {
    return Math.floor(this.next() * n);
  }

  /** Hod šestistěnnou kostkou: 1–6. */
  d6(): number {
    return this.int(6) + 1;
  }

  /** Fisher–Yates, zamíchá kopii pole. */
  shuffle<T>(items: readonly T[]): T[] {
    const a = [...items];
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }
}
