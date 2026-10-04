import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { DOMAINS } from './data';
import { loadStore, saveStore, type Store } from './lib/storage';
import { setMuted, sfx } from './lib/sound';
import { fireworks } from './lib/confetti';
import type { Result } from './lib/evaluation';
import { keyOf } from './lib/progress';
import { TUTOR } from './lib/tutor';
import { escapeHtml } from './lib/utils';
import { bridge, type PlaceInfo } from './game/bridge';
import { GameCanvas } from './game/GameCanvas';
import { Stage } from './components/Stage';
import { Hud } from './components/Hud';
import { PlacePrompt } from './components/PlacePrompt';
import { HeroSelect } from './screens/HeroSelect';
import { Quiz } from './screens/Quiz';
import { Results } from './screens/Results';
import { Passport } from './screens/Passport';

type Panel =
  | null
  | { kind: 'hero' }
  | { kind: 'passport'; justStamped?: string }
  | { kind: 'quiz'; di: number; p: number; run: number }
  | { kind: 'results'; di: number; p: number; result: Result; newVisa: boolean };

const initial = loadStore();
setMuted(initial.muted);

export default function App() {
  const [store, setStore] = useState<Store>(initial);
  const [panel, setPanel] = useState<Panel>(initial.hero === undefined || !initial.name ? { kind: 'hero' } : null);
  const [near, setNear] = useState<PlaceInfo | null>(null);
  const [intro, setIntro] = useState(true);
  const panelRef = useRef(panel);
  panelRef.current = panel;

  const update = (fn: (s: Store) => Store) =>
    setStore(prev => {
      const next = fn(prev);
      saveStore(next);
      return next;
    });

  // Monde Phaser ↔ interface
  useEffect(() => {
    bridge.emit('progress', store);
  }, [store]);
  useEffect(() => {
    bridge.emit('pause', panel !== null);
  }, [panel]);
  useEffect(() => {
    const onNear = (info: PlaceInfo | null) => {
      setNear(info);
      if (info) setIntro(false);
    };
    const onInteract = (info: PlaceInfo) => {
      if (info.state === 'open' || info.state === 'done' || info.state === 'visa') start(info.di, info.p);
    };
    // quand le monde (re)démarre, il reçoit l'état actuel
    const onReady = () => bridge.emit('pause', panelRef.current !== null);
    bridge.on('near', onNear);
    bridge.on('interact', onInteract);
    bridge.on('ready', onReady);
    return () => {
      bridge.off('near', onNear);
      bridge.off('interact', onInteract);
      bridge.off('ready', onReady);
    };
  }, []);

  const close = () => setPanel(null);
  const start = (di: number, p: number) => setPanel({ kind: 'quiz', di, p, run: Date.now() });

  function finish(di: number, p: number, result: Result) {
    const key = keyOf(DOMAINS[di], p);
    const prev = store.best[key];
    const newVisa = result.visa && !prev?.visa;
    const now = Date.now();
    update(s => {
      const best = { ...s.best };
      const old = s.best[key];
      const visa = result.visa || !!old?.visa;
      const visaDate = old?.visaDate ?? (result.visa ? now : undefined);
      if (!old || result.pct >= old.pct)
        best[key] = { pct: result.pct, stars: Math.max(result.stars, old?.stars ?? 0), visa, visaDate, date: now };
      else best[key] = { ...old, stars: Math.max(result.stars, old.stars), visa, visaDate };
      return { ...s, best };
    });
    sfx.win();
    if (result.pct >= 75) fireworks();
    setPanel({ kind: 'results', di, p, result, newVisa });
  }

  let content = null;
  if (panel?.kind === 'hero') {
    content = (
      <HeroSelect
        name={store.name}
        hero={store.hero}
        onDone={(name, hero) => {
          update(s => ({ ...s, name, hero }));
          close();
        }}
      />
    );
  } else if (panel?.kind === 'passport') {
    content = <Passport store={store} justStamped={panel.justStamped} onBack={close} />;
  } else if (panel?.kind === 'quiz' || panel?.kind === 'results') {
    const d = DOMAINS[panel.di];
    const pc = d.parcours[String(panel.p) as '1' | '2' | '3']!;
    content =
      panel.kind === 'quiz' ? (
        <Quiz key={panel.run} domain={d} p={panel.p} pc={pc} name={store.name} onQuit={close} onFinish={r => finish(panel.di, panel.p, r)} />
      ) : (
        <Results
          domain={d}
          p={panel.p}
          pc={pc}
          name={store.name}
          result={panel.result}
          newVisa={panel.newVisa}
          onHome={close}
          onAgain={() => start(panel.di, panel.p)}
          onStampPassport={() => setPanel({ kind: 'passport', justStamped: keyOf(d, panel.p) })}
        />
      );
  }

  const introMsg = intro
    ? `مرحبا${store.name ? ' يا ' + escapeHtml(store.name) : ''}! أنا ${TUTOR} 🦉 تمشّى حتى للدار لي فيها <bdi><b>Parcours 1</b></bdi> باش نبداو.`
    : null;

  return (
    <MotionConfig reducedMotion="user">
      {store.hero !== undefined && <GameCanvas hero={store.hero} store={store} key={store.hero} />}
      <Stage>
        {panel?.kind !== 'hero' && (
          <>
            <Hud store={store} onPassport={() => setPanel({ kind: 'passport' })} onToggleMute={() => update(s => (setMuted(!s.muted), { ...s, muted: !s.muted }))} onHero={() => setPanel({ kind: 'hero' })} />
            {!panel && <PlacePrompt near={near} store={store} intro={introMsg} onStart={start} />}
          </>
        )}
        <AnimatePresence mode="wait">
          {content && (
            <motion.div
              key={panel!.kind === 'quiz' ? `quiz-${panel!.run}` : panel!.kind}
              className="panel-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <motion.div
                className="panel-wrap"
                initial={{ scale: 0.96, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.98, y: 8 }}
                transition={{ duration: 0.2 }}
              >
                {content}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Stage>
    </MotionConfig>
  );
}
