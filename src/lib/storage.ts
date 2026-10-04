export interface Best {
  pct: number;
  stars: number;
  visa: boolean;
  /** Date du premier VISA obtenu */
  visaDate?: number;
  date: number;
}

export interface Store {
  name: string;
  muted: boolean;
  best: Record<string, Best>;
  /** Parcours dont l'animation de déblocage a déjà été montrée */
  seenUnlocks: string[];
}

const KEY = 'math2ac:v1';

export function loadStore(): Store {
  const store: Store = { name: '', muted: false, best: {}, seenUnlocks: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) Object.assign(store, JSON.parse(raw));
  } catch {
    /* stockage indisponible : on garde les valeurs par défaut */
  }
  // anciennes sauvegardes (étape 1) : pas d'étoiles ni de date de VISA
  for (const b of Object.values(store.best)) {
    b.stars ??= b.pct >= 90 ? 3 : b.pct >= 70 ? 2 : b.pct >= 40 ? 1 : 0;
    if (b.visa) b.visaDate ??= b.date;
  }
  return store;
}

export function saveStore(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}
