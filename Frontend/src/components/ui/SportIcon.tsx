import type { CSSProperties } from 'react';

// Iconos de deporte como SVG stroke (estilo lucide) en vez de emojis.
const PATHS: Record<string, React.ReactNode> = {
  // Balón de fútbol
  futbol: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m12 7 3.2 2.3-1.2 3.7h-4l-1.2-3.7L12 7Z" />
      <path d="M12 7V3.5M15.2 9.3l3.3-1.1M13.99 13l2 3.2M10 13l-2 3.2M8.8 9.3 5.5 8.2" />
    </>
  ),
  // Raqueta de pádel
  padel: (
    <>
      <path d="M14.5 3.2a6.5 6.5 0 0 1 0 11.6 6.5 6.5 0 0 1-6 0 6.5 6.5 0 0 1 0-11.6 6.5 6.5 0 0 1 6 0Z" />
      <path d="M8.8 12.2 6 19a1.7 1.7 0 0 1-3 .2" />
      <circle cx="10.5" cy="7.5" r=".7" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="9" r=".7" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="10.5" r=".7" fill="currentColor" stroke="none" />
    </>
  ),
  // Balón de voley
  voley_playa: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3c2.4 3 2.4 12 0 18M3.2 9.5c4 2 11 2 14.6-2.4M20.8 14.5c-4-2-11-2-14.6 2.4" />
    </>
  ),
  default: (
    <>
      <path d="M4 21V8l8-5 8 5v13" />
      <path d="M9 21v-6h6v6M9 11h.01M15 11h.01" />
    </>
  ),
};

interface Props {
  sport?: string;
  size?: number;
  stroke?: number;
  className?: string;
  style?: CSSProperties;
}

export default function SportIcon({ sport, size = 18, stroke = 1.85, className, style }: Props) {
  const path = PATHS[sport ?? 'default'] ?? PATHS.default;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}
