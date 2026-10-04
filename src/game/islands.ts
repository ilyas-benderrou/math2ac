// Plan des îles. Tout est en tuiles de 16 px. La forme est calculée (graine fixe = même île à chaque fois).

export type PlaceKind = 'house' | 'temple' | 'tower';

export interface PlaceDef {
  p: 1 | 2 | 3;
  kind: PlaceKind;
  name: string;
  /** coin haut-gauche du bâtiment, en tuiles */
  tx: number;
  ty: number;
}

export interface IslandDef {
  domainId: string;
  cols: number;
  rows: number;
  /** centre et rayons de l'île, en tuiles */
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  seed: number;
  /** arbres d'automne (or) ou verts */
  autumn: number;
  places: PlaceDef[];
  /** ponton : tuile de plage où accoste le bateau */
  dock: { tx: number; ty: number };
}

// Bâtiments composés de tuiles Tiny Town (index dans la planche 12 × 11)
export const BUILDINGS: Record<PlaceKind, number[][]> = {
  house: [
    [52, 53, 54],
    [64, 65, 66],
    [72, 85, 75],
  ],
  temple: [
    [-1, 63, -1],
    [48, 49, 50],
    [60, 61, 62],
    [76, 89, 79],
  ],
  tower: [
    [96, 97, 98],
    [108, 109, 110],
    [108, 103, 110],
    [120, 121, 122],
  ],
};

export const FRACTIONS: IslandDef = {
  domainId: 'frac',
  cols: 50,
  rows: 36,
  cx: 25,
  cy: 18,
  rx: 19,
  ry: 13,
  seed: 7,
  autumn: 0.55,
  places: [
    { p: 1, kind: 'house', name: 'La Porte', tx: 12, ty: 17 },
    { p: 2, kind: 'temple', name: 'Le Temple', tx: 23, ty: 8 },
    { p: 3, kind: 'tower', name: 'La Tour', tx: 34, ty: 15 },
  ],
  dock: { tx: 11, ty: 28 },
};

export function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 0 = eau, 1 = plage, 2 = herbe */
export function islandGrid(def: IslandDef): number[][] {
  const g: number[][] = [];
  for (let y = 0; y < def.rows; y++) {
    g.push([]);
    for (let x = 0; x < def.cols; x++) {
      const dx = (x + 0.5 - def.cx) / def.rx, dy = (y + 0.5 - def.cy) / def.ry;
      const a = Math.atan2(dy, dx);
      const wobble = 0.07 * Math.sin(a * 3 + def.seed) + 0.04 * Math.sin(a * 7 + def.seed * 2);
      g[y].push(Math.hypot(dx, dy) < 1 + wobble ? 2 : 0);
    }
  }
  // anneau de plage autour de l'herbe
  for (let y = 0; y < def.rows; y++)
    for (let x = 0; x < def.cols; x++) {
      if (g[y][x]) continue;
      for (let j = -1; j <= 1; j++)
        for (let i = -1; i <= 1; i++) if (g[y + j]?.[x + i] === 2) g[y][x] = 1;
    }
  return g;
}

export const buildingSize = (kind: PlaceKind) => ({ w: BUILDINGS[kind][0].length, h: BUILDINGS[kind].length });

/** Point devant la porte (pixels monde) */
export function doorPoint(pl: PlaceDef, tile: number) {
  const { w, h } = buildingSize(pl.kind);
  return { x: (pl.tx + w / 2) * tile, y: (pl.ty + h) * tile + 6 };
}
