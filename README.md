# Horolezec

Digitální verze české magnetické deskové hry **Horolezec** (TOFA Semily, 1955). Závodní hra pro 2–4 hráče:
kostkou se stoupá po 27 očíslovaných horách na vrchol, na šesti horách může figurku odpudit magnet.

Čísla hor a texty jsou podle originálního plánu, ilustrace desky je vlastní. Zadání a výklad pravidel
jsou v [horolezec-spec.md](horolezec-spec.md).

## Vývoj

```bash
npm install
npm run dev        # vývojový server (ve vývoji jde seed zadat parametrem ?seed=123)
npm run validate   # validátor plánu, geometrie, enginu a vyvážení
npm run build      # validátor (prebuild) + typová kontrola + produkční build
```

## Struktura

- `src/lib/engine.ts` – čistý reducer `(stav, akce) → (stav, události)`, seedovaný generátor v `rng.ts`
- `src/lib/eventPlayer.ts` – časová osa animací z událostí
- `src/data/board.ts` – herní plán (hory, doslovné texty, účinky, pády, trasy, barevná kostka, souřadnice)
- `scripts/validate-game.ts` – kontroly spouštěné před každým buildem
