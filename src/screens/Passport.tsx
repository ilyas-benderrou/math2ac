import { useEffect, useRef, type CSSProperties } from 'react';
import { motion, useAnimationControls } from 'motion/react';
import { DOMAINS } from '../data';
import type { Store } from '../lib/storage';
import { keyOf, nodeState, PARCOURS, visaCount } from '../lib/progress';
import { sfx } from '../lib/sound';
import { fireworks } from '../lib/confetti';
import { Stamp } from '../components/Stamp';
import { Owl } from '../components/Owl';

interface Props {
  store: Store;
  /** Clé `domaine-parcours` du tampon à imprimer avec animation */
  justStamped?: string;
  onBack: () => void;
}

// Chaque tampon a sa petite inclinaison, comme à la douane
const TILT = [-11, 7, -4];

export function Passport({ store, justStamped, onBack }: Props) {
  const visas = visaCount(DOMAINS, store);
  const total = DOMAINS.length * PARCOURS.length;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <div className="topbar">
        <button className="icon-btn" aria-label="Retour à la carte" onClick={onBack}>
          ←
        </button>
        <div className="t">
          <b>Mon passeport</b>
          <small>Les VISA de mes parcours</small>
        </div>
      </div>

      <motion.div
        className="passport-cover"
        initial={{ rotateY: -25, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        <div className="pc-emblem">
          <Owl mood={visas ? 'proud' : ''} />
        </div>
        <div className="pc-text">
          <span className="pc-title">PASSEPORT DES MATHS</span>
          <span className="pc-title ar">جواز سفر الرياضيات</span>
          <span className="pc-name">{store.name || 'Explorateur'}</span>
          <span className="pc-meta">2ème année collège</span>
        </div>
        <div className="pc-count">
          <b>{visas}</b>/{total}
          <small>VISA</small>
        </div>
      </motion.div>

      {DOMAINS.map(d => (
        <PassportPage key={d.id} d={d} store={store} justStamped={justStamped} />
      ))}
    </>
  );
}

function PassportPage({ d, store, justStamped }: { d: (typeof DOMAINS)[number]; store: Store; justStamped?: string }) {
  const page = useAnimationControls();
  const ref = useRef<HTMLElement>(null);
  const hasNew = PARCOURS.some(p => keyOf(d, p) === justStamped);

  useEffect(() => {
    if (hasNew) setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  }, [hasNew]);

  return (
    <motion.section ref={ref} className="passport-page" style={{ '--dc': d.color, '--ds': d.soft } as CSSProperties} animate={page}>
      <header>
        <h2>{d.name}</h2>
        <span className="ar">{d.ar}</span>
      </header>
      <div className="slots">
        {PARCOURS.map((p, i) => {
          const key = keyOf(d, p);
          const best = store.best[key];
          const state = nodeState(d, p, store);
          const isNew = key === justStamped;
          return (
            <div key={p} className="slot">
              {best?.visa ? (
                <motion.div
                  className="stamp-wrap"
                  initial={isNew ? { scale: 2.6, opacity: 0, y: -30 } : false}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={isNew ? { duration: 0.28, delay: 0.7, ease: [0.5, 0, 0.9, 0.4] } : undefined}
                  onAnimationComplete={() => {
                    if (!isNew) return;
                    sfx.stamp();
                    page.start({ x: [0, -5, 5, -3, 0], y: [0, 3, 0], transition: { duration: 0.25 } });
                    setTimeout(fireworks, 150);
                  }}
                >
                  <Stamp color={d.color} label={`${d.name.split(' ')[0]} · P${p}`} date={best.visaDate} rotate={TILT[i]} size={118} />
                </motion.div>
              ) : (
                <div className="slot-empty">
                  <span className="slot-p">P{p}</span>
                  <span className="slot-state">
                    {state === 'locked' ? '🔒' : state === 'soon' ? 'Bientôt' : best ? `${best.pct}% · pas encore` : 'À jouer'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}
