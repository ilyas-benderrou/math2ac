import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import type { Store } from '../lib/storage';
import { WorldScene } from './WorldScene';

interface Props {
  hero: number;
  store: Store;
}

/** Monde Phaser en plein écran, sous l'interface React. Créé une seule fois. */
export function GameCanvas({ hero, store }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const first = useRef({ hero, store });

  useEffect(() => {
    let game: Phaser.Game | null = null;
    let cancelled = false;
    // la police doit être prête avant que Phaser dessine les étiquettes
    document.fonts.load('800 16px "Baloo Bhaijaan 2"').finally(() => {
      if (cancelled || !ref.current) return;
      game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: ref.current,
        backgroundColor: '#4FA4DE',
        pixelArt: true,
        roundPixels: true,
        scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' },
        physics: { default: 'arcade', arcade: { debug: false } },
        input: { keyboard: true, mouse: true, touch: true },
        audio: { noAudio: true },
        banner: false,
      });
      game.scene.add('world', WorldScene, true, first.current);
      (window as any).__game = game; // pour les tests
    });
    return () => {
      cancelled = true;
      game?.destroy(true);
    };
  }, []);

  return <div ref={ref} className="game-canvas" />;
}
