import { Fragment, useState } from 'react';
import { motion } from 'motion/react';
import { DOMAINS } from '../data';
import type { Store } from '../lib/storage';
import { nextStep, visaCount, type NodeState, type P } from '../lib/progress';
import { TUTOR } from '../lib/tutor';
import { escapeHtml } from '../lib/utils';
import { Tutor, type TutorMsg } from '../components/Tutor';
import { Island } from '../components/Island';

interface Props {
  store: Store;
  onName: (name: string) => void;
  onToggleMute: () => void;
  onStart: (di: number, p: number) => void;
  onPassport: () => void;
  onSeenUnlock: (key: string) => void;
}

function greeting(store: Store) {
  const name = escapeHtml(store.name);
  if (!name) return `مرحبا! أنا ${TUTOR} 🦉 غادي نكون معاك فهاد المغامرة. كتب سميتك وختار جزيرة باش نبداو!`;
  const visas = visaCount(DOMAINS, store);
  const next = nextStep(DOMAINS, store);
  const hint = next ? ` الخطوة الجاية: <bdi><b>${next.d.name} · Parcours ${next.p}</b></bdi>` : '';
  if (visas === 0) return `مرحبا بيك يا ${name}! 👋 ختار جزيرة وبدا المغامرة.${hint}`;
  return `مرحبا بيك يا ${name}! 👋 عندك ${visas} ديال الـ VISA فالباسبور ديالك 🛂.${hint}`;
}

export function Home({ store, onName, onToggleMute, onStart, onPassport, onSeenUnlock }: Props) {
  const [msg, setMsg] = useState<TutorMsg | null>(null);
  const [editing, setEditing] = useState(!store.name);
  const visas = visaCount(DOMAINS, store);
  const say = (html: string, mood: TutorMsg['mood']) => setMsg(m => ({ html, mood, id: (m?.id ?? 0) + 1 }));

  function pick(di: number, p: P, state: NodeState) {
    if (state === 'locked') say(`خصك الـ VISA ديال Parcours ${p - 1} باش تفتح هاد المرحلة 🔒 كمّل، راك قريب!`, 'sad');
    else if (state === 'soon') say('هاد المرحلة مازال كنوجدوها 🚧 رجع من بعد!', 'proud');
    else onStart(di, p);
  }

  return (
    <>
      <div className="brand">
        <h1>
          Math 2AC<small>L'aventure des maths · 2ème année collège</small>
        </h1>
        <div className="brand-actions">
          <motion.button className="icon-btn passport-btn" onClick={onPassport} aria-label="Mon passeport" whileTap={{ scale: 0.92 }}>
            🛂{visas > 0 && <span className="badge">{visas}</span>}
          </motion.button>
          <button className="icon-btn" onClick={onToggleMute} aria-label={store.muted ? 'Activer le son' : 'Couper le son'}>
            {store.muted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>
      <Tutor msg={msg ?? { html: greeting(store), mood: '', id: 0 }} />
      {editing ? (
        <form
          className="name-row"
          onSubmit={e => {
            e.preventDefault();
            if (store.name) setEditing(false);
          }}
        >
          <input
            maxLength={20}
            placeholder="Ton prénom"
            defaultValue={store.name}
            autoComplete="off"
            aria-label="Ton prénom"
            onChange={e => onName(e.target.value.trim())}
          />
          {store.name && (
            <button type="submit" className="icon-btn ok-btn" aria-label="Valider">
              ✓
            </button>
          )}
        </form>
      ) : (
        <button className="name-chip" onClick={() => setEditing(true)}>
          👤 {store.name} <span aria-hidden="true">✏️</span>
        </button>
      )}
      <div className="map">
        {DOMAINS.map((d, di) => (
          <Fragment key={d.id}>
            {di > 0 && (
              <div className="route" aria-hidden="true">
                <svg viewBox="0 0 120 50">
                  <path d={di % 2 ? 'M40 0 C 20 20, 100 30, 80 50' : 'M80 0 C 100 20, 20 30, 40 50'} />
                </svg>
                <span>⛵</span>
              </div>
            )}
            <Island d={d} index={di} store={store} onPick={(p, s) => pick(di, p, s)} onSeen={onSeenUnlock} />
          </Fragment>
        ))}
      </div>
    </>
  );
}
