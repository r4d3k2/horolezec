// SVG deska Horolezce (viewBox 0 0 400 620): krajina, kopečky, trasy, kotouče, štítky, místa,
// značky, zvýraznění posledního tahu, figurky, rám, stojánek a stůl.
// Komponenta se během hry nikdy neodmountuje.

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { BOARD, CLIMBER_COLORS, type BoardDef } from "../data/board";
import type { PublicView } from "../lib/engine";
import type { DisplayState } from "../lib/eventPlayer";
import { bezier, bezierTangent, fieldCenter, layoutTokens, routePath, type XY } from "../lib/geometry";
import { ClimberToken } from "./ClimberToken";
import { fieldIcon } from "./fieldIcon";
import { Icon } from "./Icon";
import { MountainArt } from "./MountainArt";

const FIELD_R = 14;
const SPOT_R = 10;
/** Od této vykreslené šířky mají štítky i text. */
const WIDE_PX = 600;

/** Štítky jen s ikonou: střed štítku (na vnější straně řady). */
const LABEL_POS: Record<number, XY> = {
  5: [265, 507],
  7: [370, 470],
  12: [100, 385],
  13: [20, 322],
  15: [160, 323],
  17: [266, 292],
  18: [362, 224],
  19: [313, 193],
  20: [213, 215],
  21: [178, 205],
  23: [34, 168],
  24: [95, 97],
  25: [185, 72],
};

/** Štítky s textem (široká deska): střed ikony a strana, na kterou pokračuje text. Ověřeno bez překryvů. */
const LABEL_TEXT_POS: Record<number, { at: XY; side: "l" | "r" }> = {
  5: { at: [265, 507], side: "r" },
  7: { at: [382, 414], side: "l" },
  12: { at: [22, 401], side: "r" },
  13: { at: [20, 304], side: "r" },
  15: { at: [160, 323], side: "r" },
  17: { at: [262, 298], side: "r" },
  18: { at: [370, 214], side: "l" },
  19: { at: [313, 189], side: "r" },
  20: { at: [213, 230], side: "l" },
  21: { at: [150, 210], side: "r" },
  23: { at: [22, 172], side: "r" },
  24: { at: [42, 84], side: "r" },
  25: { at: [185, 72], side: "l" },
};

/** Značky odhalených zrádných hor: výchozí bod a směr, kterým se řadí (vejdou se čtyři). */
const MARK_ANCHOR: Record<number, { at: XY; dir: XY }> = {
  12: { at: [100, 337], dir: [1, 0] },
  13: { at: [68, 340], dir: [0, 1] },
  18: { at: [348, 264], dir: [1, 0] },
  21: { at: [180, 157], dir: [1, 0] },
  23: { at: [80, 135], dir: [0.58, 0.81] },
  25: { at: [162, 102], dir: [0, 1] },
};

function markXY(field: number, slot: number): XY {
  const a = MARK_ANCHOR[field];
  if (!a) {
    const [x, y] = fieldCenter(field);
    return [x - 15 + slot * 10, y + 20];
  }
  const off = -15 + slot * 10;
  return [a.at[0] + a.dir[0] * off, a.at[1] + a.dir[1] * off];
}

function textWidth(s: string): number {
  return 16 + 3 + s.length * 4.5 + 5;
}

interface BoardProps {
  view: PublicView;
  display: DisplayState;
  showMarks?: boolean;
  /** Klepnutí na horu se štítkem (číslo hory) nebo jinam na desku (null). */
  onTap?: (field: number | null) => void;
  board?: BoardDef;
}

export function Board({ view, display, showMarks = true, onTap, board = BOARD }: BoardProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const el = svgRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    // Skutečná vykreslená šířka (contentRect u SVG nemusí odpovídat CSS rozměru).
    const ro = new ResizeObserver(() => {
      setWide(el.getBoundingClientRect().width >= WIDE_PX);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const climbers = view.climbers;
  const places = climbers.map((c, index) => ({
    id: c.id,
    index,
    color: c.seat.color,
    pos: display.positions[c.id] ?? c.pos,
  }));
  const layout = layoutTokens(places, board);

  /** Klidové místo figurky na dané hoře (pro zvýraznění odkud → kam). */
  const restXY = (field: number, idx: number): { xy: XY; r: number } => {
    const c = climbers[idx];
    if (field <= 0) return { xy: board.spots.start[idx], r: SPOT_R + 3 };
    if (field >= board.summit) return { xy: board.spots.summit[c.seat.color], r: SPOT_R + 3 };
    return { xy: fieldCenter(field, board), r: FIELD_R + 3.5 };
  };

  const last = display.lastMove;
  const lastIdx = last ? climbers.findIndex((c) => c.id === last.climberId) : -1;

  const style = {
    "--move-ms": `${display.moveMs}ms`,
    "--move-ease": display.moveEase,
    "--fade-ms": `${display.fadeMs}ms`,
  } as CSSProperties;

  const tapField = (n: number) => (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onTap?.(n);
  };
  const keyField = (n: number) => (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onTap?.(n);
    }
  };

  return (
    <svg
      ref={svgRef}
      className="board-svg"
      viewBox={board.viewBox.join(" ")}
      style={style}
      role="group"
      aria-label="Herní plán Horolezce"
      onClick={() => onTap?.(null)}
    >
      <defs>
        <clipPath id="board-clip">
          <rect x="4" y="4" width="392" height="572" rx="10" />
        </clipPath>
      </defs>

      {/* Stůl a stojánek (pod deskou) */}
      <rect x="0" y="580" width="400" height="40" fill="var(--table)" />
      <rect x="0" y="580" width="400" height="3" fill="var(--table-dark)" />
      <rect x="0" y="614" width="400" height="6" fill="var(--table-dark)" opacity="0.6" />
      <path d="M 52 572 L 82 572 L 88 596 L 46 596 Z" fill="var(--frame)" />
      <path d="M 318 572 L 348 572 L 354 596 L 312 596 Z" fill="var(--frame)" />
      <ellipse cx="200" cy="590" rx="190" ry="4" fill="var(--table-dark)" opacity="0.5" />

      <g clipPath="url(#board-clip)">
        <MountainArt board={board} />

        {/* 5. Trasy: čárkovaná čára, šipka uprostřed, u lanovek kabinka */}
        {board.routes.map((r) => {
          const p0 = fieldCenter(r.from, board);
          const p1 = fieldCenter(r.to, board);
          const mid = bezier(p0, r.control, p1, 0.5);
          const tan = bezierTangent(p0, r.control, p1, 0.5);
          const len = Math.hypot(tan[0], tan[1]) || 1;
          const ux = tan[0] / len;
          const uy = tan[1] / len;
          const tip: XY = [mid[0] + ux * 6, mid[1] + uy * 6];
          const left: XY = [mid[0] - ux * 4 - uy * 4.5, mid[1] - uy * 4 + ux * 4.5];
          const right: XY = [mid[0] - ux * 4 + uy * 4.5, mid[1] - uy * 4 - ux * 4.5];
          const cab = bezier(p0, r.control, p1, 0.3);
          // Kabinka jede s figurkou: během jízdy z této stanice na trase chybí.
          const cabinAway = r.kind === "lanovka" && display.ride !== null &&
            (display.positions[display.ride] ?? -1) === r.from;
          return (
            <g key={`${r.from}-${r.to}`}>
              <path d={routePath(r, board)} fill="none" stroke="var(--route)" strokeWidth="2.5" strokeDasharray="7 5" strokeLinecap="round" />
              <polygon points={`${tip[0]},${tip[1]} ${left[0]},${left[1]} ${right[0]},${right[1]}`} fill="var(--route)" />
              {r.kind === "lanovka" && !cabinAway ? (
                <g>
                  <path d={`M ${cab[0]} ${cab[1]} V ${cab[1] + 4}`} stroke="var(--field-stroke)" strokeWidth="1" />
                  <rect x={cab[0] - 4.5} y={cab[1] + 4} width="9" height="7" rx="1.5" fill="var(--field-fill)" stroke="var(--field-stroke)" strokeWidth="1" />
                  <rect x={cab[0] - 3} y={cab[1] + 5.5} width="6" height="2.5" fill="var(--sky-1)" />
                </g>
              ) : null}
            </g>
          );
        })}

        {/* 8. Místa: start, vrchol, vedlejší místa u hory 13 */}
        {board.spots.start.map(([x, y], i) => (
          <circle key={`start${i}`} cx={x} cy={y} r={SPOT_R} fill="var(--field-fill)" fillOpacity="0.85" stroke="var(--field-stroke)" strokeWidth="1.2" strokeDasharray="3 2.2" />
        ))}
        {CLIMBER_COLORS.map((c) => {
          const [x, y] = board.spots.summit[c];
          return <circle key={`summit-${c}`} cx={x} cy={y} r={SPOT_R} fill={`var(--climber-${c})`} stroke="var(--field-stroke)" strokeWidth="1.5" />;
        })}
        {board.spots.hub13.map(([x, y], i) => (
          <g key={`hub${i}`}>
            {CLIMBER_COLORS.map((c, q) => {
              const a0 = (q * Math.PI) / 2 - Math.PI / 2;
              const a1 = a0 + Math.PI / 2;
              const d = `M ${x} ${y} L ${x + SPOT_R * Math.cos(a0)} ${y + SPOT_R * Math.sin(a0)} A ${SPOT_R} ${SPOT_R} 0 0 1 ${x + SPOT_R * Math.cos(a1)} ${y + SPOT_R * Math.sin(a1)} Z`;
              return <path key={c} d={d} fill={`var(--climber-${c})`} />;
            })}
            <circle cx={x} cy={y} r={SPOT_R} fill="none" stroke="var(--field-stroke)" strokeWidth="1.5" />
          </g>
        ))}

        {/* Vlajka na vrcholu: zavlaje, když někdo dojde nahoru */}
        <g aria-hidden="true">
          <path d="M 384 47 V 19" stroke="var(--field-stroke)" strokeWidth="1.6" strokeLinecap="round" />
          <polygon
            key={display.flagNonce}
            className={`flag-cloth${display.flagNonce > 0 ? " flag-wave" : ""}`}
            points="384,19 369,23.5 384,28"
            fill="var(--ring-red)"
          />
        </g>

        {/* 6. Kotouče hor */}
        {board.fields.map((f) => {
          const [x, y] = f.pos;
          const pulsing = display.pulse?.field === f.n;
          return (
            <g key={f.n}>
              {/* neprůhledný podklad: v nočním tématu je výplň kotouče průsvitná a trasy by prosvítaly */}
              <circle cx={x} cy={y} r={FIELD_R} fill="var(--surface)" />
              <circle cx={x} cy={y} r={FIELD_R} fill="var(--field-fill)" stroke="var(--field-stroke)" strokeWidth="1.5" />
              {f.redRing ? (
                <circle
                  key={pulsing ? `p${display.pulse?.nonce}` : "ring"}
                  className={pulsing ? "ring-pulse" : undefined}
                  cx={x}
                  cy={y}
                  r={10.5}
                  fill="none"
                  stroke="var(--ring-red)"
                  strokeWidth="4"
                />
              ) : null}
              <text x={x} y={y + 0.5} textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="600" fill="var(--field-stroke)">
                {f.n}
              </text>
            </g>
          );
        })}

        {/* 7. Štítky: na úzké desce jen ikona, na široké ikona + text */}
        {board.fields.map((f) => {
          const icon = fieldIcon(f);
          if (!icon || !f.short) return null;
          if (wide && LABEL_TEXT_POS[f.n]) {
            const { at, side } = LABEL_TEXT_POS[f.n];
            const w = textWidth(f.short);
            const x0 = side === "r" ? at[0] - 8 : at[0] + 8 - w;
            const iconX = side === "r" ? x0 + 2 : x0 + w - 14;
            const textX = side === "r" ? x0 + 19 : x0 + 4;
            return (
              <g key={`label${f.n}`} pointerEvents="none">
                <rect x={x0} y={at[1] - 8} width={w} height="16" rx="4" fill="var(--surface)" fillOpacity="0.92" stroke="var(--field-stroke)" strokeWidth="0.8" />
                <Icon name={icon} size={12} x={iconX} y={at[1] - 6} strokeWidth={2.2} color="var(--field-stroke)" />
                <text x={textX} y={at[1] + 0.3} dominantBaseline="central" fontSize="8.5" fill="var(--text)">{f.short}</text>
              </g>
            );
          }
          const at = LABEL_POS[f.n];
          if (!at) return null;
          return (
            <g key={`label${f.n}`} pointerEvents="none">
              <rect x={at[0] - 8} y={at[1] - 8} width="16" height="16" rx="4" fill="var(--surface)" fillOpacity="0.92" stroke="var(--field-stroke)" strokeWidth="0.8" />
              <Icon name={icon} size={12} x={at[0] - 6} y={at[1] - 6} strokeWidth={2.2} color="var(--field-stroke)" />
            </g>
          );
        })}

        {/* 9. Značky odhalených zrádných hor */}
        {showMarks
          ? climbers.map((c, idx) =>
              (display.revealed[c.id] ?? []).map((field) => {
                const [mx, my] = markXY(field, idx);
                return (
                  <g key={`mark-${c.id}-${field}`} pointerEvents="none">
                    <g className="mark-pop">
                      <circle cx={mx} cy={my} r="5.6" fill="var(--surface)" stroke="var(--field-stroke)" strokeWidth="0.7" />
                      <Icon name="magnet" size={8} x={mx - 4} y={my - 4} strokeWidth={2.4} color={`var(--climber-${c.seat.color})`} />
                    </g>
                  </g>
                );
              }),
            )
          : null}

        {/* Zvýraznění posledního tahu (odkud → kam) */}
        {last && lastIdx >= 0 ? (
          <g pointerEvents="none">
            {(() => {
              const color = `var(--climber-${climbers[lastIdx].seat.color})`;
              const from = restXY(last.from, lastIdx);
              const to = restXY(last.to, lastIdx);
              return (
                <>
                  <circle cx={from.xy[0]} cy={from.xy[1]} r={from.r} fill="none" stroke={color} strokeWidth="1.6" strokeDasharray="3 2.5" />
                  <circle cx={to.xy[0]} cy={to.xy[1]} r={to.r} fill="none" stroke={color} strokeWidth="3" />
                </>
              );
            })()}
          </g>
        ) : null}
      </g>

      {/* Rám desky */}
      <rect x="4" y="4" width="392" height="572" rx="10" fill="none" stroke="var(--frame)" strokeWidth="8" />
      <rect x="8.5" y="8.5" width="383" height="563" rx="7" fill="none" stroke="var(--table-dark)" strokeOpacity="0.5" strokeWidth="1" />

      {/* Figurky nad rámem (hlava figurky na vrcholu přesahuje okraj desky). Klíč = stabilní ID. */}
      <g pointerEvents="none">
        {climbers.map((c, idx) => {
          const xy = display.overrides[c.id] ?? layout[c.id] ?? [0, 0];
          return (
            <ClimberToken
              key={c.id}
              number={idx + 1}
              color={c.seat.color}
              name={c.seat.name}
              x={xy[0]}
              y={xy[1]}
              hidden={!!display.hidden[c.id]}
              fx={display.fx[c.id]}
              atStation={!!display.atStation[c.id]}
              skipTurns={display.skipTurns[c.id] ?? 0}
              active={display.current === c.id && view.phase !== "over"}
              riding={display.ride === c.id}
            />
          );
        })}
      </g>

      {/* Klepací plochy hor se štítkem (bublina s textem z plánu) */}
      {onTap
        ? board.fields.filter((f) => f.short).map((f) => (
            <circle
              key={`hit${f.n}`}
              className="field-hit"
              cx={f.pos[0]}
              cy={f.pos[1]}
              r={20}
              fill="transparent"
              role="button"
              tabIndex={0}
              aria-label={`Hora ${f.n}: ${f.short}`}
              onClick={tapField(f.n)}
              onKeyDown={keyField(f.n)}
            />
          ))
        : null}
    </svg>
  );
}

export default Board;
