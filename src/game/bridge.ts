// Pont entre le monde Phaser et l'interface React.
// Phaser → React : 'near' (lieu proche ou null), 'interact' (Entrée/E près d'un lieu), 'ready'
// React → Phaser : 'progress' (sauvegarde à jour), 'pause' (panneau ouvert / fermé)
import Phaser from 'phaser';
import type { NodeState } from '../lib/progress';

export interface PlaceInfo {
  /** index du domaine dans DOMAINS */
  di: number;
  p: 1 | 2 | 3;
  state: NodeState;
}

export const bridge = new Phaser.Events.EventEmitter();
