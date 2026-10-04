import { useEffect, useState, type CSSProperties } from 'react';
import { motion, useAnimationControls } from 'motion/react';
import type { Domain } from '../types';
import type { Store } from '../lib/storage';
import { keyOf, nodeState, PARCOURS, type NodeState, type P } from '../lib/progress';
import { sfx } from '../lib/sound';

// Position des 3 étapes sur l'île (repère du viewBox 360 × 240)
const SPOTS: [number, number][] = [
  [70, 160],
  [180, 82],
  [292, 152],
];
const PATHS = ['M70 160 C 95 95, 135 80, 180 82', 'M180 82 C 230 84, 270 110, 292 152'];

// Décor de chaque île : symboles du domaine
const DECOR: Record<string, { t: string; x: number; y: number; s: number }[]> = {
  frac: [
    { t: '½', x: 40, y: 70, s: 30 },
    { t: '¾', x: 300, y: 70, s: 26 },
    { t: '⅓', x: 190, y: 200, s: 24 },
  ],
  rel: [
    { t: '−3', x: 36, y: 72, s: 24 },
    { t: '+5', x: 300, y: 72, s: 24 },
    { t: '±', x: 186, y: 202, s: 28 },
  ],
  alg: [
    { t: 'x', x: 42, y: 72, s: 30 },
    { t: '2x+1', x: 286, y: 70, s: 20 },
    { t: '=', x: 186, y: 204, s: 28 },
  ],
};

const ISLAND = 'M28 132 C 10 80, 70 30, 140 34 C 200 18, 300 20, 336 70 C 362 110, 350 190, 296 214 C 230 236, 120 236, 62 210 C 30 196, 36 160, 28 132 Z';

interface Props {
  d: Domain;
  index: number;
  store: Store;
  onPick: (p: P, state: NodeState) => void;
  onSeen: (key: string) => void;
}

export function Island({ d, index, store, onPick, onSeen }: Props) {
  const states = PARCOURS.map(p => nodeState(d, p, store));
  const visas = states.filter(s => s === 'visa').length;
  // parcours débloqués dont l'animation n'a pas encore été vue
  const [fresh] = useState(() =>
    PARCOURS.filter((p, i) => p > 1 && states[i] !== 'locked' && !store.seenUnlocks.includes(keyOf(d, p))),
  );
  useEffect(() => {
    if (!fresh.length) return;
    const t = setTimeout(() => sfx.unlock(), 350);
    fresh.forEach(p => onSeen(keyOf(d, p)));
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const current = states.findIndex(s => s === 'open' || s === 'done');

  return (
    <motion.section
      className="island"
      style={{ '--dc': d.color, '--ds': d.soft } as CSSProperties}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
    >
      <header className="island-flag">
        <span className="island-num">{index + 1}</span>
        <div className="island-title">
          <h2>{d.name}</h2>
          <span className="island-ar">{d.ar}</span>
        </div>
        <span className="island-count" title="VISA obtenus">
          🛂 {visas}/3
        </span>
      </header>
      <div className="island-land">
        <svg viewBox="0 0 360 240" aria-hidden="true">
          <path d={ISLAND} transform="translate(0 6)" fill="var(--sea-deep)" />
          <path d={ISLAND} fill="var(--sand)" />
          <path d={ISLAND} transform="translate(180 120) scale(.9) translate(-180 -120)" fill="var(--ds)" stroke="var(--dc)" strokeWidth="2" strokeOpacity=".35" />
          {DECOR[d.id]?.map((x, k) => (
            <text key={k} x={x.x} y={x.y} fontSize={x.s} fontWeight="800" fill="var(--dc)" opacity=".22" textAnchor="middle">
              {x.t}
            </text>
          ))}
          {PATHS.map((path, k) => (
            <g key={k}>
              <path d={path} fill="none" stroke="var(--dc)" strokeOpacity=".3" strokeWidth="5" strokeDasharray="2 11" strokeLinecap="round" />
              {states[k] === 'visa' && (
                <motion.path
                  d={path}
                  fill="none"
                  stroke="var(--dc)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  initial={fresh.includes((k + 2) as P) ? { pathLength: 0 } : false}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                />
              )}
            </g>
          ))}
        </svg>
        {PARCOURS.map((p, i) => (
          <Node
            key={p}
            p={p}
            state={states[i]}
            best={store.best[keyOf(d, p)]}
            questions={d.parcours[String(p) as '1']?.questions.length ?? 0}
            pos={SPOTS[i]}
            current={i === current}
            fresh={fresh.includes(p)}
            onClick={() => onPick(p, states[i])}
          />
        ))}
      </div>
    </motion.section>
  );
}

interface NodeProps {
  p: P;
  state: NodeState;
  best?: { pct: number; stars: number };
  questions: number;
  pos: [number, number];
  current: boolean;
  fresh: boolean;
  onClick: () => void;
}

function Node({ p, state, best, questions, pos, current, fresh, onClick }: NodeProps) {
  const controls = useAnimationControls();
  useEffect(() => {
    if (fresh) controls.start({ scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 14, delay: 0.25 } });
  }, [fresh, controls]);
  const disc =
    state === 'locked' ? '🔒' : state === 'soon' ? '🚧' : state === 'open' ? '▶' : `${best?.pct ?? 0}%`;
  const sub =
    state === 'locked'
      ? `VISA P${p - 1} requis`
      : state === 'soon'
        ? 'Bientôt'
        : state === 'open'
          ? `${questions} questions`
          : null;

  return (
    // le conteneur place l'étape sur l'île ; le bouton à l'intérieur porte les animations
    <div className="node-spot" style={{ left: `${(pos[0] / 360) * 100}%`, top: `${(pos[1] / 240) * 100}%` }}>
    <motion.button
      className={`node ${state}${current ? ' current' : ''}`}
      onClick={() => {
        if (state === 'locked' || state === 'soon') controls.start({ x: [0, -6, 6, -4, 0], transition: { duration: 0.3 } });
        onClick();
      }}
      initial={fresh ? { scale: 0.3, opacity: 0 } : false}
      animate={controls}
      whileTap={{ scale: 0.93 }}
      aria-label={`Parcours ${p}${sub ? ' : ' + sub : ''}`}
    >
      {current && (
        <motion.span
          className="node-pin"
          aria-hidden="true"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        >
          🦉
        </motion.span>
      )}
      <span className="disc">
        {disc}
        {state === 'visa' && <span className="mini-visa">VISA</span>}
      </span>
      <span className="label">Parcours {p}</span>
      {sub ? (
        <span className="sub">{sub}</span>
      ) : (
        <span className="node-stars" aria-label={`${best?.stars ?? 0} étoiles`}>
          {[0, 1, 2].map(k => (
            <span key={k} className={k < (best?.stars ?? 0) ? '' : 'off'}>
              ★
            </span>
          ))}
        </span>
      )}
    </motion.button>
    </div>
  );
}
