import { AnimatePresence, motion } from 'motion/react';
import { DOMAINS } from '../data';
import type { PlaceInfo } from '../game/bridge';
import type { Store } from '../lib/storage';
import { escapeHtml } from '../lib/utils';
import { Owl } from './Owl';
import { renderMath } from '../lib/math';
import { TUTOR } from '../lib/tutor';

interface Props {
  near: PlaceInfo | null;
  store: Store;
  /** message d'accueil quand aucun lieu n'est proche */
  intro: string | null;
  onStart: (di: number, p: number) => void;
}

function message(info: PlaceInfo, store: Store) {
  const d = DOMAINS[info.di];
  const pc = d.parcours[String(info.p) as '1'];
  const best = store.best[`${d.id}-${info.p}`];
  const name = store.name ? ` يا ${escapeHtml(store.name)}` : '';
  switch (info.state) {
    case 'locked':
      return `هاد البلاصة مسدودة 🔒 خصك الـ VISA ديال <bdi>Parcours ${info.p - 1}</bdi> باش تحلها.`;
    case 'soon':
      return 'هاد البلاصة مازال كنوجدوها 🚧 رجع من بعد!';
    case 'visa':
      return `عندك الـ VISA ديال هاد الپاركور ⭐ (${best?.pct}%). بغيتي تعاود باش تحسن النتيجة؟`;
    case 'done':
      return `آخر نتيجة: ${best?.pct}%. عاود${name} باش تربح الـ VISA 💪`;
    default:
      return `مرحبا${name}! هادي <bdi><b>${d.name} · Parcours ${info.p}</b></bdi>: ${pc?.questions.length ?? 0} ديال الأسئلة. واجد؟`;
  }
}

/** Nour apparaît en bas de l'écran quand on s'approche d'un lieu */
export function PlacePrompt({ near, store, intro, onStart }: Props) {
  const playable = near && (near.state === 'open' || near.state === 'done' || near.state === 'visa');
  const html = near ? message(near, store) : intro;
  return (
    <AnimatePresence>
      {html && (
        <motion.div
          key={near ? `${near.di}-${near.p}-${near.state}` : 'intro'}
          className="prompt"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Owl mood={near ? (near.state === 'locked' ? 'sad' : 'happy') : 'proud'} trigger={near ? near.p : 0} />
          <div className="prompt-body">
            <span className="who">{TUTOR} 🦉</span>
            <p className="ar" dangerouslySetInnerHTML={{ __html: renderMath(html) }} />
            {playable && (
              <button className="cta" onClick={() => onStart(near.di, near.p)}>
                {near.state === 'open' ? 'Commencer' : 'Rejouer'} <kbd>Entrée</kbd>
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
