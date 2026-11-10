// Vlastní ilustrace krajiny z polygonů: nebe, vzdálené pohoří, hlavní masiv, kopečky pod horami, údolí.
// Nekopíruje původní malbu – jen obecné motivy (skály, sníh, louka, stromky, stan, chatka).

import { memo } from "react";
import { BOARD, type BoardDef, type FieldDef } from "../data/board";

type Pt = [number, number];

const pts = (list: Pt[]) => list.map(([x, y]) => `${x},${y}`).join(" ");

// Hřeben hlavního masivu za řadami hor 19–27 (zleva doprava).
const MASSIF: Pt[] = [
  [0, 120], [26, 96], [56, 58], [80, 76], [102, 92], [128, 62], [150, 36], [174, 58],
  [198, 74], [220, 46], [240, 26], [262, 46], [282, 38], [302, 18], [330, 6], [360, 14],
  [390, 34], [400, 42],
];
const MASSIF_PEAKS: number[] = [2, 6, 10, 14]; // indexy vrcholů se sněhem

const FAR_RIDGE: Pt[] = [
  [0, 112], [40, 88], [100, 66], [150, 82], [196, 52], [238, 70], [276, 30], [312, 48], [352, 38], [400, 58],
];

// Řady hor odzadu dopředu (vzdálenější jsou světlejší).
const ROWS: number[][] = [
  [24, 25, 26, 27],
  [19, 20, 21, 22, 23],
  [14, 15, 16, 17, 18],
  [8, 9, 10, 11, 12, 13],
  [1, 2, 3, 4, 5, 6, 7],
];

/** Souvislý hřeben pod řadou kopečků, aby mezi nimi neprosvítaly vzdálenější řady. */
function rowBandPath(row: number[], board: BoardDef): string {
  const p = row.map((n) => board.fields[n - 1].pos).sort((a, b) => a[0] - b[0]).map(([x, y]): Pt => [x, y + 30]);
  const all: Pt[] = [[0, p[0][1] + 6], ...p, [400, p[p.length - 1][1] + 6]];
  let d = `M 0 600 L ${all[0][0]} ${all[0][1]}`;
  for (let i = 1; i < all.length; i++) {
    const [x0, y0] = all[i - 1];
    const [x1, y1] = all[i];
    d += ` Q ${x0 + (x1 - x0) / 2} ${Math.max(y0, y1) + 10} ${x1} ${y1}`;
  }
  return d + " L 400 600 Z";
}

function hillColor(n: number): string {
  if (n >= 24) return "var(--hill-4)";
  if (n >= 19) return "var(--hill-3)";
  if (n >= 14) return "var(--hill-2)";
  return "var(--hill-1)";
}

/** Obrys kopečku pod horou: zaoblený nebo špičatý, šířka 60–90. */
function hillPath(f: FieldDef, summit: number): string {
  const [x, y] = f.pos;
  const base = 600;
  if (f.n === summit) {
    // Vrchol: plošina se čtyřmi barevnými místy.
    return `M 256 ${base} L 260 74 C 262 30, 290 4, 322 4 C 356 4, 386 26, 389 70 L 394 ${base} Z`;
  }
  const w = f.n === 13 ? 108 : 62 + ((f.n * 7) % 5) * 7;
  const h = w / 2;
  const top = y - 3;
  if (f.n % 3 === 0) {
    // špičatý
    return `M ${x - h} ${base} L ${x - h * 0.85} ${y + 40} L ${x - 9} ${top + 2} Q ${x} ${top - 6} ${x + 9} ${top + 2} L ${x + h * 0.85} ${y + 40} L ${x + h} ${base} Z`;
  }
  // zaoblený
  return `M ${x - h} ${base} C ${x - h} ${y + 22}, ${x - h * 0.45} ${top}, ${x} ${top} C ${x + h * 0.45} ${top}, ${x + h} ${y + 22}, ${x + h} ${base} Z`;
}

function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g>
      <rect x={x - 1.2 * s} y={y - 4 * s} width={2.4 * s} height={5 * s} fill="var(--rock-dark)" />
      <polygon points={pts([[x, y - 22 * s], [x - 7 * s, y - 9 * s], [x + 7 * s, y - 9 * s]])} fill="var(--forest)" />
      <polygon points={pts([[x, y - 16 * s], [x - 8.5 * s, y - 3 * s], [x + 8.5 * s, y - 3 * s]])} fill="var(--forest)" />
    </g>
  );
}

function MountainArtImpl({ board = BOARD }: { board?: BoardDef }) {
  return (
    <g aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sky-1)" />
          <stop offset="1" stopColor="var(--sky-2)" />
        </linearGradient>
      </defs>

      {/* 1. Nebe a vzdálené pohoří */}
      <rect x="0" y="0" width="400" height="580" fill="url(#sky)" />
      <polygon points={pts([[0, 300], ...FAR_RIDGE, [400, 300]])} fill="var(--ridge-far)" />

      {/* Hlavní masiv: skála, stinné strany, sníh */}
      <polygon points={pts([[0, 280], ...MASSIF, [400, 280]])} fill="var(--rock)" />
      {MASSIF_PEAKS.map((i) => {
        const p = MASSIF[i];
        const r = MASSIF[i + 1];
        return (
          <polygon key={`sh${i}`} points={pts([p, r, [r[0] - 6, r[1] + 70], [p[0] + 4, p[1] + 90]])} fill="var(--rock-dark)" />
        );
      })}
      {MASSIF_PEAKS.map((i) => {
        const [x, y] = MASSIF[i];
        return (
          <polygon
            key={`sn${i}`}
            points={pts([[x, y], [x + 11, y + 11], [x + 6, y + 10], [x + 2, y + 15], [x - 3, y + 10], [x - 8, y + 13], [x - 11, y + 10]])}
            fill="var(--snow)"
          />
        );
      })}

      {/* Tisk 1955: druhý tisk masivu s posunem soutisku (v ostatních tématech průhlednost 0) */}
      <polygon
        points={pts([[0, 280], ...MASSIF, [400, 280]].map(([x, y]): Pt => [x + 1.5, y + 1]))}
        fill="var(--misreg)"
        style={{ opacity: "var(--misreg-opacity)", mixBlendMode: "multiply" }}
      />

      {/* 2. Kopečky pod horami, odzadu dopředu: hřeben řady, pak kopečky řady */}
      {ROWS.map((row) => (
        <g key={row[0]}>
          <path d={rowBandPath(row, board)} fill={hillColor(row[0])} />
          {row
            .map((n) => board.fields[n - 1])
            .sort((a, b) => a.pos[1] - b.pos[1])
            .map((f) => (
              <path
                key={f.n}
                d={hillPath(f, board.summit)}
                fill={hillColor(f.n)}
                stroke="var(--rock-dark)"
                strokeOpacity="0.35"
                strokeWidth="1"
              />
            ))}
        </g>
      ))}
      {/* sníh na vrcholové plošině */}
      <path d="M 270 40 C 284 14, 300 7, 322 7 C 348 7, 370 18, 382 40 C 370 32, 362 36, 352 30 C 340 38, 330 30, 320 36 C 308 30, 298 38, 288 32 C 282 38, 276 36, 270 40 Z" fill="var(--snow)" opacity="0.9" />

      {/* 3. Údolí s loukou, stromky a stanem */}
      <path d="M 0 552 Q 50 540 110 548 T 230 546 T 340 544 T 400 548 L 400 600 L 0 600 Z" fill="var(--meadow)" />
      <Tree x={22} y={572} s={0.9} />
      <Tree x={268} y={566} s={1} />
      <Tree x={290} y={560} s={0.8} />
      <Tree x={352} y={570} s={1.1} />
      <Tree x={378} y={560} s={0.85} />
      {/* stan u startovních míst */}
      <g>
        <polygon points={pts([[212, 571], [228, 545], [244, 571]])} fill="var(--climber-yellow)" stroke="var(--field-stroke)" strokeWidth="1.2" strokeLinejoin="round" />
        <polygon points={pts([[228, 571], [228, 553], [234, 571]])} fill="var(--field-stroke)" opacity="0.55" />
      </g>

      {/* 4. Chatka s červeným křížem u hory 17 */}
      <g>
        <polygon points={pts([[294, 276], [304, 267], [314, 276]])} fill="var(--climber-red)" stroke="var(--field-stroke)" strokeWidth="1" strokeLinejoin="round" />
        <rect x="296" y="276" width="16" height="11" fill="var(--field-fill)" stroke="var(--field-stroke)" strokeWidth="1" />
        <rect x="302" y="280" width="4" height="7" fill="var(--rock-dark)" />
        <circle cx="321" cy="268" r="5.5" fill="var(--field-fill)" stroke="var(--ring-red)" strokeWidth="1.2" />
        <path d="M 321 264.5 V 271.5 M 317.5 268 H 324.5" stroke="var(--ring-red)" strokeWidth="2.2" />
      </g>

      {/* Stanice lanovky u hory 20 */}
      <g>
        <rect x="251" y="206" width="16" height="11" rx="1.5" fill="var(--field-fill)" stroke="var(--field-stroke)" strokeWidth="1" />
        <path d="M 249 207 L 259 200 L 269 207" fill="none" stroke="var(--field-stroke)" strokeWidth="1.2" strokeLinejoin="round" />
        <circle cx="259" cy="211.5" r="3" fill="none" stroke="var(--field-stroke)" strokeWidth="1.1" />
        <circle cx="259" cy="211.5" r="0.9" fill="var(--field-stroke)" />
      </g>
    </g>
  );
}

export const MountainArt = memo(MountainArtImpl);
export default MountainArt;
