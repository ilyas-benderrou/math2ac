import type { Figure as Fig } from '../types';

/** Droite graduée de 0 à 1 partagée en `parts`, avec des points nommés */
function numberLine(parts: number, pts: { tick: number; label: string }[]) {
  const x0 = 24, x1 = 296, y = 56, step = (x1 - x0) / parts;
  let s = `<svg viewBox="0 0 320 96" width="320" role="img" aria-label="Droite graduée de 0 à 1 partagée en ${parts} parts">`;
  s += `<line x1="8" y1="${y}" x2="312" y2="${y}" stroke="currentColor" stroke-width="2.5"/>`;
  s += `<path d="M312 ${y} l-9 -5 v10 z" fill="currentColor"/>`;
  for (let k = 0; k <= parts; k++) {
    const x = x0 + k * step, big = k === 0 || k === parts;
    s += `<line x1="${x}" y1="${y - (big ? 11 : 7)}" x2="${x}" y2="${y + (big ? 11 : 7)}" stroke="currentColor" stroke-width="${big ? 3 : 2}"/>`;
  }
  s += `<text x="${x0}" y="${y + 32}" text-anchor="middle" font-size="18" font-weight="700" fill="currentColor">0</text>`;
  s += `<text x="${x1}" y="${y + 32}" text-anchor="middle" font-size="18" font-weight="700" fill="currentColor">1</text>`;
  pts.forEach(({ tick, label }) => {
    const x = x0 + tick * step;
    s += `<circle cx="${x}" cy="${y}" r="6" fill="var(--dc)"/>`;
    s += `<text x="${x}" y="${y - 18}" text-anchor="middle" font-size="19" font-weight="800" fill="var(--dc)">${label}</text>`;
  });
  return s + `</svg>`;
}

/** Courbe de f passant par des points entiers, x de 0 à 4, y de 0 à 4 */
function graph(points: [number, number][]) {
  const ox = 40, oy = 210, u = 46;
  const X = (v: number) => ox + v * u, Y = (v: number) => oy - v * u;
  let s = `<svg viewBox="0 0 280 245" width="280" role="img" aria-label="Courbe de la fonction f">`;
  for (let i = 0; i <= 4; i++) {
    s += `<line x1="${X(i)}" y1="${Y(0)}" x2="${X(i)}" y2="${Y(4.3)}" stroke="var(--line)" stroke-width="1.5"/>`;
    s += `<line x1="${X(0)}" y1="${Y(i)}" x2="${X(4.6)}" y2="${Y(i)}" stroke="var(--line)" stroke-width="1.5"/>`;
  }
  s += `<line x1="${X(-0.2)}" y1="${Y(0)}" x2="${X(5)}" y2="${Y(0)}" stroke="currentColor" stroke-width="2.5"/>`;
  s += `<path d="M${X(5)} ${Y(0)} l-9 -5 v10 z" fill="currentColor"/>`;
  s += `<line x1="${X(0)}" y1="${Y(-0.2)}" x2="${X(0)}" y2="${Y(4.6)}" stroke="currentColor" stroke-width="2.5"/>`;
  s += `<path d="M${X(0)} ${Y(4.6)} l-5 9 h10 z" fill="currentColor"/>`;
  for (let i = 1; i <= 4; i++) {
    s += `<text x="${X(i)}" y="${Y(0) + 22}" text-anchor="middle" font-size="16" font-weight="700" fill="currentColor">${i}</text>`;
    s += `<text x="${X(0) - 12}" y="${Y(i) + 6}" text-anchor="middle" font-size="16" font-weight="700" fill="currentColor">${i}</text>`;
  }
  s += `<text x="${X(0) - 12}" y="${Y(0) + 22}" text-anchor="middle" font-size="16" font-weight="700" fill="currentColor">0</text>`;
  s += `<polyline points="${points.map(([a, b]) => X(a) + ',' + Y(b)).join(' ')}" fill="none" stroke="var(--dc)" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>`;
  points.forEach(([a, b]) => {
    s += `<circle cx="${X(a)}" cy="${Y(b)}" r="4.5" fill="var(--dc)"/>`;
  });
  s += `<text x="${X(4.15)}" y="${Y(0.6)}" font-size="17" font-weight="800" font-style="italic" fill="var(--dc)">C</text><text x="${X(4.15) + 12}" y="${Y(0.6) + 5}" font-size="12" font-weight="800" font-style="italic" fill="var(--dc)">f</text>`;
  return s + `</svg>`;
}

export function Figure({ fig }: { fig: Fig }) {
  const svg = fig.type === 'numberLine' ? numberLine(fig.parts, fig.points) : graph(fig.points);
  return <div className="fig" dangerouslySetInnerHTML={{ __html: svg }} />;
}
