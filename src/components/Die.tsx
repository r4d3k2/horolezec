// Kostka s čísly (puntíky) a barevná kostka (bílá kostka s velkým barevným kruhem). Fáze 1: 2D stěna.

import type { DieColor } from "../data/board";
import { COLOR_NAMES } from "../data/texts";

const PIPS: Record<number, [number, number][]> = {
  1: [[32, 32]],
  2: [[20, 20], [44, 44]],
  3: [[19, 19], [32, 32], [45, 45]],
  4: [[20, 20], [44, 20], [20, 44], [44, 44]],
  5: [[19, 19], [45, 19], [32, 32], [19, 45], [45, 45]],
  6: [[20, 18], [44, 18], [20, 32], [44, 32], [20, 46], [44, 46]],
};

function dieFill(color: DieColor): string {
  if (color === "black") return "var(--die-black)";
  if (color === "white") return "var(--die-white)";
  return `var(--climber-${color})`;
}

interface DieProps {
  kind: "cisla" | "barvy";
  value?: number | null;
  color?: DieColor | null;
  nonce: number;            // změna = nový hod (zatřesení)
  size?: number;
  onClick?: () => void;
  disabled?: boolean;
  label: string;
}

export function Die({ kind, value = null, color = null, nonce, size = 64, onClick, disabled, label }: DieProps) {
  const face = (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect x="3" y="3" width="58" height="58" rx="11" fill="var(--die-white)" stroke="var(--field-stroke)" strokeWidth="2.5" />
      {kind === "cisla" && value !== null
        ? PIPS[value]?.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5.2" fill="var(--field-stroke)" />)
        : null}
      {kind === "cisla" && value === null ? (
        <text x="32" y="33" textAnchor="middle" dominantBaseline="central" fontSize="26" fontWeight="600" fill="var(--text-muted)">?</text>
      ) : null}
      {kind === "barvy" && color !== null ? (
        <circle
          cx="32"
          cy="32"
          r="17"
          fill={color === "white" ? "none" : dieFill(color)}
          stroke={color === "white" || color === "yellow" ? "var(--field-stroke)" : "none"}
          strokeWidth={color === "white" ? 2.5 : 1.5}
        />
      ) : null}
    </svg>
  );

  const shaking = <span key={nonce} className={nonce > 0 ? "die-shake inline-block" : "inline-block"}>{face}</span>;
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
        className="shrink-0 rounded-2xl p-0 border-0 bg-transparent disabled:opacity-80"
        style={{ width: size, height: size }}
      >
        {shaking}
      </button>
    );
  }
  return (
    <div role="img" aria-label={aria} className="shrink-0" style={{ width: size, height: size }}>
      {shaking}
    </div>
  );
}

export default Die;
