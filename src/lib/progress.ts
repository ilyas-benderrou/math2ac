import type { Domain } from '../types';
import type { Store } from './storage';

export const PARCOURS = [1, 2, 3] as const;
export type P = (typeof PARCOURS)[number];

/** locked : il faut le VISA du parcours précédent · soon : débloqué mais pas encore écrit
 *  open : jouable, jamais terminé · done : terminé sans VISA · visa : VISA obtenu */
export type NodeState = 'locked' | 'soon' | 'open' | 'done' | 'visa';

export const keyOf = (d: Domain, p: number) => `${d.id}-${p}`;

export function nodeState(d: Domain, p: P, store: Store): NodeState {
  const prevVisa = p === 1 || store.best[keyOf(d, p - 1)]?.visa;
  if (!prevVisa) return 'locked';
  if (!d.parcours[String(p) as '1' | '2' | '3']) return 'soon';
  const best = store.best[keyOf(d, p)];
  if (!best) return 'open';
  return best.visa ? 'visa' : 'done';
}

export function visaCount(domains: Domain[], store: Store) {
  return domains.reduce((n, d) => n + PARCOURS.filter(p => store.best[keyOf(d, p)]?.visa).length, 0);
}

/** Prochaine étape conseillée : premier parcours jouable sans VISA */
export function nextStep(domains: Domain[], store: Store) {
  for (const d of domains)
    for (const p of PARCOURS) {
      const s = nodeState(d, p, store);
      if (s === 'open' || s === 'done') return { d, p };
    }
  return null;
}
