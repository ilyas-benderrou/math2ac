import { useEffect, useState, type ReactNode } from 'react';
import { BASE_H, BASE_W } from '../game/config';

/** Scène d'interface de 1920 × 1080 mise à l'échelle de la fenêtre (16:9, centrée).
 *  Tout le CSS de l'interface est écrit pour 1920 × 1080. */
export function Stage({ children }: { children: ReactNode }) {
  const [k, setK] = useState(1);
  useEffect(() => {
    const fit = () => setK(Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H));
    fit();
    window.addEventListener('resize', fit);
    document.addEventListener('fullscreenchange', fit);
    return () => {
      window.removeEventListener('resize', fit);
      document.removeEventListener('fullscreenchange', fit);
    };
  }, []);
  return (
    <div className="ui-root">
      <div className="ui-stage" style={{ zoom: k }}>
        {children}
      </div>
    </div>
  );
}
