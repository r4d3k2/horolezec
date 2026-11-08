// Ikony jako inline SVG (viewBox 24 × 24, barva přes currentColor).
// Lze je vložit do HTML i dovnitř SVG desky (vnořené <svg> s x, y).

import type { ReactNode } from "react";

export type IconName =
  | "dice"
  | "colorDie"
  | "lanovka"
  | "forward"
  | "back"
  | "wait"
  | "fall"
  | "magnet"
  | "tent"
  | "hut"
  | "redCross"
  | "flag"
  | "menu"
  | "info"
  | "close";

const PATHS: Record<IconName, ReactNode> = {
  dice: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
      <circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  colorDie: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="3.5" />
      <circle cx="12" cy="12" r="4.6" fill="currentColor" stroke="none" />
    </>
  ),
  lanovka: (
    <>
      <path d="M2.5 5.5 L21.5 2.5" />
      <path d="M12 4 V8" />
      <rect x="6.5" y="8" width="11" height="10" rx="2" />
      <path d="M6.5 12.5 H17.5" />
      <path d="M12 8 V12.5" />
    </>
  ),
  forward: (
    <>
      <path d="M4 12 H18" />
      <path d="M13 6.5 L18.5 12 L13 17.5" />
    </>
  ),
  back: (
    <>
      <path d="M20 12 H6" />
      <path d="M11 6.5 L5.5 12 L11 17.5" />
    </>
  ),
  wait: (
    <>
      <path d="M6.5 3.5 H17.5" />
      <path d="M6.5 20.5 H17.5" />
      <path d="M8 3.5 C8 8.5 16 9 16 12 C16 15 8 15.5 8 20.5" />
      <path d="M16 3.5 C16 8.5 8 9 8 12 C8 15 16 15.5 16 20.5" />
    </>
  ),
  fall: (
    <>
      <path d="M5 4.5 L12 11.5" />
      <path d="M12 4 V17.5" />
      <path d="M7.5 13.5 L12 18 L16.5 13.5" />
      <path d="M4 21 H20" />
    </>
  ),
  magnet: (
    <>
      <path d="M6 3.5 V12 a6 6 0 0 0 12 0 V3.5" strokeWidth="4.2" />
      <path d="M3.9 6.5 H8.1 M15.9 6.5 H20.1" strokeWidth="1.6" />
    </>
  ),
  tent: (
    <>
      <path d="M2.5 20 L12 4 L21.5 20 Z" />
      <path d="M12 20 L12 13 M9 20 L12 13 L15 20" />
    </>
  ),
  hut: (
    <>
      <path d="M3 11 L12 4 L21 11" />
      <path d="M5.5 9.5 V20 H18.5 V9.5" />
      <path d="M10 20 V15 H14 V20" />
    </>
  ),
  redCross: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7 V17 M7 12 H17" strokeWidth="3.2" />
    </>
  ),
  flag: (
    <>
      <path d="M5.5 21 V3.5" />
      <path d="M5.5 4 H18 L15 8 L18 12 H5.5" fill="currentColor" />
    </>
  ),
  menu: (
    <>
      <path d="M4 6.5 H20" />
      <path d="M4 12 H20" />
      <path d="M4 17.5 H20" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11 V17" />
      <circle cx="12" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  close: (
    <>
      <path d="M6 6 L18 18" />
      <path d="M18 6 L6 18" />
    </>
  ),
};

interface IconProps {
  name: IconName;
  size?: number;
  x?: number;
  y?: number;
  className?: string;
  strokeWidth?: number;
  title?: string;
  color?: string;
}

export function Icon({ name, size = 24, x, y, className, strokeWidth = 2, title, color }: IconProps) {
  return (
    <svg
      x={x}
      y={y}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={color ? { color } : undefined}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      overflow="visible"
    >
      {title ? <title>{title}</title> : null}
      {PATHS[name]}
    </svg>
  );
}

export default Icon;
