// Figurka horolezce: silueta dřevěné figurky (hlava, tělo s bílým pruhem, seříznutá koule).
// Vnější <g> = pozice přes CSS style.transform v px (nikdy SVG atribut transform – v Safari by se neanimoval).
// Vnitřní <g> = efekty (poskok, kývání) přes keyframes.

import { memo } from "react";
import type { ClimberColor } from "../data/board";
import type { TokenFx } from "../lib/eventPlayer";

interface Props {
  number: number;                 // 1–4, číslo v hlavě
  color: ClimberColor;
  name: string;
  x: number;
  y: number;
  hidden: boolean;
  fx: { kind: TokenFx; nonce: number } | undefined;
  atStation: boolean;
  skipTurns: number;
  active: boolean;
}

function ClimberTokenImpl({ number, color, name, x, y, hidden, fx, atStation, skipTurns, active }: Props) {
  const fill = `var(--climber-${color})`;
  const ink = color === "yellow" ? "var(--climber-ink)" : "var(--token-light)";
  const kind = fx?.kind ?? "none";
  return (
    <g
      className="token"
      style={{ transform: `translate(${x}px, ${y}px)`, opacity: hidden ? 0 : 1 }}
      aria-label={`${name}, figurka ${number}`}
    >
      {active ? <ellipse cx="0" cy="0.5" rx="10" ry="3.2" fill={fill} opacity="0.35" /> : null}
      <g key={fx?.nonce ?? 0} className={`token-fx fx-${kind}`}>
        <ellipse cx="0" cy="0.6" rx="7" ry="1.8" fill="var(--climber-ink)" opacity="0.25" />
        {/* seříznutá koule */}
        <path d="M -4.9 0 A 7 7 0 1 1 4.9 0 Z" fill={fill} stroke="var(--climber-ink)" strokeWidth="1" strokeLinejoin="round" />
        {/* tělo */}
        <path d="M -5.2 -9.5 L -3 -19 L 3 -19 L 5.2 -9.5 Z" fill={fill} stroke="var(--climber-ink)" strokeWidth="1" strokeLinejoin="round" />
        {/* bílý pruh přes tělo */}
        <path d="M -3.9 -15.6 L 3.9 -15.6 L 4.5 -13 L -4.5 -13 Z" fill="var(--token-light)" />
        {/* hlava s číslem */}
        <circle cx="0" cy="-21.5" r="5.5" fill={fill} stroke="var(--climber-ink)" strokeWidth="1" />
        <text x="0" y="-21.3" textAnchor="middle" dominantBaseline="central" fontSize="7.5" fontWeight="600" fill={ink}>
          {number}
        </text>
      </g>
      {atStation ? (
        <g className="badge-pop">
          <rect x="6" y="-30" width="11" height="11" rx="2.5" fill="var(--field-fill)" stroke="var(--field-stroke)" strokeWidth="1" />
          <text x="11.5" y="-24.3" textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="600" fill="var(--text)">6</text>
        </g>
      ) : null}
      {skipTurns > 0 ? (
        <g className="badge-pop">
          <circle cx="-11" cy="-27" r="5.6" fill="var(--accent)" stroke="var(--field-fill)" strokeWidth="1" />
          <text x="-11" y="-26.8" textAnchor="middle" dominantBaseline="central" fontSize="7.5" fontWeight="600" fill="var(--accent-contrast)">
            {skipTurns}
          </text>
        </g>
      ) : null}
    </g>
  );
}

export const ClimberToken = memo(ClimberTokenImpl);
export default ClimberToken;
