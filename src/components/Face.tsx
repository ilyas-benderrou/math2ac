const COLS = ['#2E9B57', '#E9B92A', '#D8433B'];
const MOUTHS = ['M11 19 q5 5 10 0', 'M11 20 h10', 'M11 21 q5 -5 10 0'];

/** Visage du cahier : 0 = acquis (vert), 1 = en cours (jaune), 2 = à revoir (rouge) */
export function Face({ kind, on }: { kind: 0 | 1 | 2; on: boolean }) {
  return (
    <svg className={`face${on ? ' on' : ''}`} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill={COLS[kind]} />
      <circle cx="11.5" cy="13" r="2" fill="#1D2552" />
      <circle cx="20.5" cy="13" r="2" fill="#1D2552" />
      <path d={MOUTHS[kind]} stroke="#1D2552" strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}
