import { useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { DOMAINS } from './data';
import { loadStore, saveStore, type Store } from './lib/storage';
import { setMuted, sfx } from './lib/sound';
import { fireworks } from './lib/confetti';
import type { Result } from './lib/evaluation';
import { keyOf } from './lib/progress';
import { Home } from './screens/Home';
import { Quiz } from './screens/Quiz';
import { Results } from './screens/Results';
import { Passport } from './screens/Passport';

type Screen =
  | { kind: 'home' }
  | { kind: 'passport'; justStamped?: string }
  | { kind: 'quiz'; di: number; p: number; run: number }
  | { kind: 'results'; di: number; p: number; result: Result; newVisa: boolean };

const initial = loadStore();
setMuted(initial.muted);

export default function App() {
  const [store, setStore] = useState<Store>(initial);
  const [screen, setScreen] = useState<Screen>({ kind: 'home' });

  const update = (fn: (s: Store) => Store) =>
    setStore(prev => {
      const next = fn(prev);
      saveStore(next);
      return next;
    });

  const home = () => setScreen({ kind: 'home' });
  const start = (di: number, p: number) => setScreen({ kind: 'quiz', di, p, run: Date.now() });

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
    setScreen({ kind: 'results', di, p, result, newVisa });
  }

  let content;
  let screenKey: string = screen.kind;
  if (screen.kind === 'home') {
    content = (
      <Home
        store={store}
        onName={name => update(s => ({ ...s, name }))}
        onToggleMute={() =>
          update(s => {
            setMuted(!s.muted);
            return { ...s, muted: !s.muted };
          })
        }
        onStart={start}
        onPassport={() => setScreen({ kind: 'passport' })}
        onSeenUnlock={key => update(s => (s.seenUnlocks.includes(key) ? s : { ...s, seenUnlocks: [...s.seenUnlocks, key] }))}
      />
    );
  } else if (screen.kind === 'passport') {
    content = <Passport store={store} justStamped={screen.justStamped} onBack={home} />;
  } else {
    const d = DOMAINS[screen.di];
    const pc = d.parcours[String(screen.p) as '1' | '2' | '3']!;
    if (screen.kind === 'quiz') {
      screenKey = `quiz-${screen.run}`;
      content = (
        <Quiz
          domain={d}
          p={screen.p}
          pc={pc}
          name={store.name}
          onQuit={home}
          onFinish={r => finish(screen.di, screen.p, r)}
        />
      );
    } else {
      content = (
        <Results
          domain={d}
          p={screen.p}
          pc={pc}
          name={store.name}
          result={screen.result}
          newVisa={screen.newVisa}
          onHome={home}
          onAgain={() => start(screen.di, screen.p)}
          onStampPassport={() => setScreen({ kind: 'passport', justStamped: keyOf(d, screen.p) })}
        />
      );
    }
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="wrap">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={screenKey}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
