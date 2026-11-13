# CLAUDE.md — Horolezec

## O projektu
Digitální verze magnetické deskové hry Horolezec (TOFA Semily, 1955). Závodní hra 2–4 hráčů
proti počítači nebo více lidí na jednom zařízení. Česky, bez backendu, stav v localStorage.
Čísla hor a texty jsou podle fotografie originálního plánu (27 hor). Část pravidel je výklad
(tabulka Výklad v horolezec-spec.md), nastavitelný přes Rules a src/data/board.ts.
Závazné zadání: horolezec-spec.md (v2.1).

## Workflow
- Cesta B: Claude Code → GitHub (r4d3k2/horolezec) → Vercel (automatický deploy z main, náhledy z větví).
- Lokálně (Claude Code Desktop): pracuj jen na větvi main, žádné větve ani git worktree.
  Každý prompt začíná: "Work directly on the main branch, do not create new branches, do not use git worktree."
- V cloudové relaci (claude.ai/code): jen jedna větev relace, žádné další větve ani worktree, do main nemerguj –
  pull request zkontroluje a sloučí vlastník.
- Commity česky, krátce a věcně.
- Ověření: `npm run build` (prebuild spustí validátor). Dev server spravuje Desktop Preview; v cloudu ho nespouštěj.

## Tech stack
React + TypeScript + Vite + Tailwind, tsx pro validátor. Žádné další knihovny bez souhlasu.
Animace jen CSS, bez zvuků. Ikony inline SVG v Icon.tsx. PWA bez service workeru.

## Klíčové soubory
- src/lib/engine.ts – čistý reducer (createGame, applyAction, legalActions, toPublicView)
- src/lib/rng.ts – seedovaný generátor, žádné Math.random v enginu
- src/lib/eventPlayer.ts – časování animací z událostí (TIMING pro tempo Normálně, TEMPO_FACTOR)
- src/lib/geometry.ts – trasy a rozmístění figurek (hora 13: čekající na barevných místech)
- src/lib/storage.ts – localStorage, schémata a migrace (nastavení schéma 3, hra 2, statistiky 2)
- src/hooks/useGame.ts – herní stav, přehrávání, tahy počítače, zápis statistik
- src/data/board.ts – plán: hory, doslovné texty, účinky, pády, trasy, barevná kostka, souřadnice
- src/data/texts.ts – texty UI, pravidel, tabulky výkladu a šablony hlášek
- scripts/validate-game.ts – prebuild: plán, geometrie, invarianty, vyvážení

## Zásady
- Texty hor jsou doslovné z originálu, neměnit. Výklad pravidel měnit jen přes Rules a board.ts.
- Výchozí pravidla v2.1: vyhazování zapnuté (na hoře jen jeden horolezec, mimo 0, 13 a 27),
  kontrola v `land` po zkoušce magnetu a před účinkem hory. Při změně pravidel uprav validátor i spec.
- Tajná data (pole, danger, fieldPoles) čte jen engine a výsledková obrazovka po konci hry.
- Pozice figurky = CSS style.transform v px na vnější <g>, efekty na vnitřní <g>. Nikdy SVG atribut transform.
- Klíč figurky = stabilní ID horolezce. <Board> se neodmountovává.
- Všechna trvání animací a pauz jdou přes TIMING × Tempo hry (CSS animace přes proměnné z tempoCssVars).
- Barvy jen přes CSS proměnné témat (hory-den, retro-1955, hory-noc).
- Ilustrace desky je vlastní, nekopírovat originální malbu.
- localStorage vždy v try/catch, změna tvaru dat jen s migrací.
- PNG ikony (apple-touch-icon.png, icon-192.png, icon-512.png) jsou vyrenderované z public/icon.svg
  jednorázově Chromiem mimo projekt; při změně ikony je přegeneruj stejně, bez nové závislosti.

## Co nedělat
- Nepřidávat backend, účty, analytiku, reklamy, zvuky, service worker.
- Neimplementovat online hru bez samostatného rozhodnutí (architektura je připravená).
- Nevymýšlet nová pravidla mimo tabulku Výklad.
