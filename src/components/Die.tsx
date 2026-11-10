// Kostka s čísly (puntíky) a barevná kostka (bílá kostka s velkým barevným kruhem, bílá stěna jen s obrysem).
// F2: 3D kostka z CSS (6 stěn, preserve-3d), hod 700 ms, dopadne na hozenou stěnu.
// Při prefers-reduced-motion bez rotace (CSS vypne přechod).

import { BOARD, type DieColor } from "../data/board";
import { COLOR_NAMES } from "../data/texts";

const PIPS: Record<number, [number, number][]> = {
  1: [[32, 32]],
  2: [[20, 20], [44, 44]],
  3: [[19, 19], [32, 32], [45, 45]],
  4: [[20, 20], [44, 20], [20, 44], [44, 44]],
  5: [[19, 19], [45, 19], [32, 32], [19, 45], [45, 45]],
  6: [[20, 18], [44, 18], [20, 32], [44, 32], [20, 46], [44, 46]],
};

/** Umístění stěny v krychli a natočení krychle, aby stěna mířila dopředu. */
const FACE_PLACE: Record<number, string> = {
  1: "rotateY(0deg)",
  6: "rotateY(180deg)",
  3: "rotateY(90deg)",
  4: "rotateY(-90deg)",
  5: "rotateX(90deg)",
  2: "rotateX(-90deg)",
};
const SHOW_FACE: Record<number, [number, number]> = {
  1: [0, 0],
  6: [0, 180],
  3: [0, -90],
  4: [0, 90],
  5: [-90, 0],
  2: [90, 0],
};

function dieFill(color: DieColor): string {
  if (color === "black") return "var(--die-black)";
  if (color === "white") return "none";
  return `var(--climber-${color})`;
}

function NumberFace({ value }: { value: number }) {
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
      {PIPS[value].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5.4" fill="var(--die-pip)" />)}
    </svg>
  );
}

function ColorFace({ color }: { color: DieColor }) {
  return (
    <svg viewBox="0 0 64 64" width="100%" height="100%" aria-hidden="true">
      <circle
        cx="32"
        cy="32"
        r="17"
        fill={dieFill(color)}
        stroke={color === "white" || color === "yellow" ? "var(--die-edge)" : "none"}
        strokeWidth={color === "white" ? 2.5 : 1.5}
      />
    </svg>
  );
}

interface DieProps {
  kind: "cisla" | "barvy";
  value?: number | null;
  color?: DieColor | null;
  nonce: number;            // změna = nový hod (krychle se protočí)
  size?: number;
  onClick?: () => void;
  disabled?: boolean;
  label: string;
}

export function Die({ kind, value = null, color = null, nonce, size = 64, onClick, disabled, label }: DieProps) {
  const faces = BOARD.colorDie.faces;
  // Hodnota stěny 1–6, která má mířit dopředu.
  const shown = kind === "cisla" ? value : color !== null ? faces.indexOf(color) + 1 : null;
  const half = size / 2;

  let body;
  if (shown === null || shown < 1) {
    body = (
      <div className="die3d-face flex items-center justify-center" style={{ position: "relative", width: size, height: size }}>
        <span className="text-2xl font-semibold" style={{ color: "var(--die-pip)", opacity: 0.45 }}>?</span>
      </div>
    );
  } else {
    const [bx, by] = SHOW_FACE[shown];
    // Každý hod přidá otočky navíc, aby se krychle viditelně protočila.
    const spinX = bx + 720 * nonce;
    const spinY = by + 360 * nonce;
    body = (
      <div className="die3d" style={{ width: size, height: size }}>
        <div className="die3d-cube" style={{ transform: `translateZ(-${half}px) rotateX(${spinX}deg) rotateY(${spinY}deg)` }}>
          {[1, 2, 3, 4, 5, 6].map((v) => (
            <div key={v} className="die3d-face" style={{ transform: `${FACE_PLACE[v]} translateZ(${half}px)` }}>
              {kind === "cisla" ? <NumberFace value={v} /> : <ColorFace color={faces[v - 1]} />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const aria = kind === "cisla"
    ? `${label}${value !== null ? `: padlo ${value}` : ""}`
    : `${label}${color !== null ? `: ${COLOR_NAMES[color]}` : ""}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={aria}
        className="shrink-0 rounded-2xl p-0 border-0 bg-transparent disabled:opacity-85"
        style={{ width: size, height: size }}
      >
        {body}
      </button>
    );
  }
  return (
    <div role="img" aria-label={aria} className="shrink-0" style={{ width: size, height: size }}>
      {body}
    </div>
  );
}

export default Die;
