import type { Parcours } from '../types';

/** 0 = acquis (≥ 75 %), 1 = en cours (≥ 50 %), 2 = à revoir */
export const level = (r: number): 0 | 1 | 2 => (r >= 0.75 ? 0 : r >= 0.5 ? 1 : 2);

export const starsFor = (pct: number) => (pct >= 90 ? 3 : pct >= 70 ? 2 : pct >= 40 ? 1 : 0);

export interface Answered {
  comp: number;
  boss: boolean;
  /** 1 au 1er essai, 0,5 au 2e, 0 sinon */
  score: number;
}

export interface Result {
  pct: number;
  compRatios: number[];
  levels: (0 | 1 | 2)[];
  visa: boolean;
  stars: number;
  /** Étoile bonus gagnée grâce à la question boss réussie du 1er coup */
  bossBonus: boolean;
  maxStreak: number;
}

export function evaluate(pc: Parcours, answers: Answered[], maxStreak: number): Result {
  const total = answers.reduce((a, b) => a + b.score, 0);
  const pct = Math.round((total / answers.length) * 100);
  const compRatios = pc.comps.map((_, ci) => {
    const mine = answers.filter(a => a.comp === ci + 1);
    return mine.length ? mine.reduce((s, a) => s + a.score, 0) / mine.length : 0;
  });
  const levels = compRatios.map(level);
  const visa = pct >= 75 && !levels.includes(2);
  const bosses = answers.filter(a => a.boss);
  const bossBonus = bosses.length > 0 && bosses.every(a => a.score === 1);
  const stars = Math.min(3, starsFor(pct) + (bossBonus ? 1 : 0));
  return { pct, compRatios, levels, visa, stars, bossBonus, maxStreak };
}
