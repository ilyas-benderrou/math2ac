import { useId } from 'react';

interface Props {
  color: string;
  /** ex. « Fractions · P1 » */
  label: string;
  date?: number;
  rotate?: number;
  size?: number;
}

const fmt = (t: number) => new Date(t).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

/** Tampon VISA à l'encre, un peu irrégulier comme un vrai tampon */
export function Stamp({ color, label, date, rotate = -10, size = 128 }: Props) {
  const id = useId().replace(/:/g, '');
  return (
    <svg
      className="stamp"
      viewBox="0 0 140 100"
      width={size}
      style={{ transform: `rotate(${rotate}deg)`, color }}
      role="img"
      aria-label={`VISA ${label}`}
    >
      <defs>
        <filter id={`ink${id}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.1" />
          <feComponentTransfer>
            <feFuncA type="discrete" tableValues="0 .85 .95 1" />
          </feComponentTransfer>
        </filter>
      </defs>
      <g filter={`url(#ink${id})`} fill="none" stroke="currentColor">
        <rect x="4" y="4" width="132" height="92" rx="12" strokeWidth="4" />
        <rect x="11" y="11" width="118" height="78" rx="8" strokeWidth="1.5" />
        <text x="70" y="52" textAnchor="middle" fontSize="34" fontWeight="800" letterSpacing="5" fill="currentColor" stroke="none">
          VISA
        </text>
        <line x1="22" y1="60" x2="118" y2="60" strokeWidth="1.5" />
        <text x="70" y="74" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="currentColor" stroke="none">
          {label}
        </text>
        {date && (
          <text x="70" y="86" textAnchor="middle" fontSize="9.5" fontWeight="600" fill="currentColor" stroke="none">
            {fmt(date)}
          </text>
        )}
        <text x="22" y="30" fontSize="12" fill="currentColor" stroke="none">★</text>
        <text x="108" y="30" fontSize="12" fill="currentColor" stroke="none">★</text>
      </g>
    </svg>
  );
}
