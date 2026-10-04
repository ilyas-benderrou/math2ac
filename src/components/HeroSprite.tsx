/** Affiche une tuile de la planche Tiny Dungeon (12 colonnes de 16 px), agrandie en pixels nets */
export function HeroSprite({ frame, size = 96 }: { frame: number; size?: number }) {
  const k = size / 16;
  return (
    <span
      className="hero-sprite"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        backgroundSize: `${192 * k}px ${176 * k}px`,
        backgroundPosition: `-${(frame % 12) * size}px -${Math.floor(frame / 12) * size}px`,
      }}
    />
  );
}
