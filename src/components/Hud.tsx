import { useEffect, useState, type CSSProperties } from 'react';
import { DOMAINS } from '../data';
import { keyOf, PARCOURS, visaCount } from '../lib/progress';
import type { Store } from '../lib/storage';
import { HEROES } from '../game/config';
import { HeroSprite } from './HeroSprite';

interface Props {
  store: Store;
  onPassport: () => void;
  onToggleMute: () => void;
  onHero: () => void;
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen().catch(() => {});
}

/** Barre d'infos au-dessus du monde : île, VISA, passeport, son, plein écran */
export function Hud({ store, onPassport, onToggleMute, onHero }: Props) {
  const [full, setFull] = useState(!!document.fullscreenElement);
  useEffect(() => {
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  const d = DOMAINS[0];
  const visas = PARCOURS.filter(p => store.best[keyOf(d, p)]?.visa).length;
  const total = visaCount(DOMAINS, store);

  return (
    <>
      <div className="hud hud-left" style={{ '--dc': d.color } as CSSProperties}>
        <button className="hud-player" onClick={onHero} title="Changer de personnage">
          <HeroSprite frame={HEROES[store.hero ?? 0].frame} size={56} />
          <span>{store.name}</span>
        </button>
        <div className="hud-island">
          <b>Île des Fractions</b>
          <span className="ar">جزيرة الكسور</span>
          <span className="hud-visa">🛂 {visas}/3</span>
        </div>
      </div>
      <div className="hud hud-right">
        <button className="hud-btn" onClick={onPassport} aria-label="Mon passeport">
          🛂<span>Passeport</span>
          {total > 0 && <i className="badge">{total}</i>}
        </button>
        <button className="hud-btn" onClick={onToggleMute} aria-label={store.muted ? 'Activer le son' : 'Couper le son'}>
          {store.muted ? '🔇' : '🔊'}
        </button>
        <button className="hud-btn" onClick={toggleFullscreen} aria-label={full ? 'Quitter le plein écran' : 'Plein écran'}>
          {full ? '🗗' : '⛶'}
        </button>
      </div>
      <div className="hud hud-help">⬆⬇⬅➡ / ZQSD / WASD ou clic pour marcher · Entrée près d'un lieu</div>
    </>
  );
}
