/** Taille d'une tuile Kenney (pixels du pack) */
export const TILE = 16;
/** Résolution de référence : tout est dessiné pour 1920 × 1080 puis mis à l'échelle */
export const BASE_W = 1920;
export const BASE_H = 1080;
/** Zoom de la caméra : 1 tuile = 64 px à l'écran en 1920 × 1080 */
export const ZOOM = 4;

/** Personnages jouables (index dans la planche Tiny Dungeon) */
export const HEROES = [
  { frame: 96, name: 'Chevalier' },
  { frame: 99, name: 'Princesse' },
  { frame: 84, name: 'Magicien' },
  { frame: 112, name: 'Aventurier' },
  { frame: 88, name: 'Exploratrice' },
  { frame: 87, name: 'Viking' },
];

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
