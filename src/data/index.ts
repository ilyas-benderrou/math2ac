// Charge les domaines et tous les fichiers `<domaine>-p<parcours>.json` de ce dossier.
// Pour ajouter un parcours, il suffit de créer le fichier JSON (ex. frac-p2.json).
import type { Domain, Parcours } from '../types';
import domains from './domains.json';

const files = import.meta.glob<Parcours>('./*-p[1-3].json', { eager: true, import: 'default' });

export const DOMAINS: Domain[] = domains.map(d => ({ ...d, parcours: {} }));

for (const [path, pc] of Object.entries(files)) {
  const m = path.match(/\.\/(\w+)-p([1-3])\.json$/);
  const d = m && DOMAINS.find(x => x.id === m[1]);
  if (d) d.parcours[m[2] as '1' | '2' | '3'] = pc;
  else console.warn(`Fichier de questions ignoré (domaine inconnu) : ${path}`);
}
