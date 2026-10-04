import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Domain, Option, Parcours, Question } from '../types';
import { Tex } from '../lib/math';
import { celebrate, confetti } from '../lib/confetti';
import { sfx } from '../lib/sound';
import { SAY } from '../lib/tutor';
import { pick, shuffle } from '../lib/utils';
import { evaluate, type Answered, type Result } from '../lib/evaluation';
import { Tutor, type TutorMsg } from '../components/Tutor';
import { Figure } from '../components/Figure';

interface Props {
  domain: Domain;
  p: number;
  pc: Parcours;
  name: string;
  onQuit: () => void;
  onFinish: (r: Result) => void;
}

type PlayQ = Question & { opts: Option[] };

const STREAKS = [3, 5, 8];

/** Garde l'ordre des compétences, mélange les questions dans chaque compétence et les choix.
 *  Les questions boss passent à la fin du parcours. */
function buildQuiz(pc: Parcours): PlayQ[] {
  const qs: PlayQ[] = [];
  const add = (q: Question) => qs.push({ ...q, opts: shuffle(q.options) });
  pc.comps.forEach((_, ci) => shuffle(pc.questions.filter(q => q.comp === ci + 1 && !q.boss)).forEach(add));
  pc.questions.filter(q => q.boss).forEach(add);
  return qs;
}

export function Quiz({ domain: d, p, pc, name, onQuit, onFinish }: Props) {
  const qs = useMemo(() => buildQuiz(pc), [pc]);
  const [i, setI] = useState(0);
  const [tries, setTries] = useState(0);
  const [wrong, setWrong] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [answers, setAnswers] = useState<Answered[]>([]);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [banner, setBanner] = useState<{ n: number; id: number } | null>(null);
  const msgId = useRef(0);
  const [msg, setMsg] = useState<TutorMsg>({
    html: `يلا نبداو ${d.ar}! ${qs.length} ديال الأسئلة. ركز مزيان، وإلا غلطتي غادي نعاونك 😉`,
    mood: '',
    id: 0,
  });
  const nextRef = useRef<HTMLButtonElement>(null);

  const q = qs[i];
  const last = i === qs.length - 1;
  const say = (html: string, mood: TutorMsg['mood']) => setMsg({ html, mood, id: ++msgId.current });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [i]);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => nextRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 120);
    return () => clearTimeout(t);
  }, [done]);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 1300);
    return () => clearTimeout(t);
  }, [banner]);

  const record = (score: number) => setAnswers(a => [...a, { comp: q.comp, boss: !!q.boss, score }]);

  function answer(k: number) {
    if (done) return;
    const o = q.opts[k];
    const t = tries + 1;
    setTries(t);
    if (o.ok) {
      record(t === 1 ? 1 : 0.5);
      setDone(true);
      sfx.good();
      if (t === 1) {
        const ns = streak + 1;
        setStreak(ns);
        setMaxStreak(m => Math.max(m, ns));
        if (STREAKS.includes(ns)) {
          setBanner({ n: ns, id: Date.now() });
          celebrate(ns);
          setTimeout(sfx.streak, 120);
          say(SAY.streak[ns], 'cheer');
        } else {
          confetti(q.boss ? 50 : 18);
          if (q.boss) say('غلبتي الـ Boss! 👑 نجمة زايدة ليك ⭐', 'cheer');
          else say(name && Math.random() < 0.4 ? pick(SAY.correctName(name)) : pick(SAY.correct), 'happy');
        }
      } else {
        setStreak(0);
        say(pick(SAY.second), 'happy');
      }
    } else {
      setWrong(w => [...w, k]);
      sfx.bad();
      setStreak(0);
      if (t === 1) {
        say(`${pick(SAY.retryLead)} ${o.why}<br><b>💡 ${q.hint}</b>`, 'sad');
      } else {
        record(0);
        setDone(true);
        say(`${o.why} ${pick(SAY.reveal)}`, 'sad');
      }
    }
  }

  function next() {
    if (last) {
      onFinish(evaluate(pc, answers, maxStreak));
      return;
    }
    setI(i + 1);
    setTries(0);
    setWrong([]);
    setDone(false);
    if (qs[i + 1].boss) say('هادي هي الـ Question Boss 👑 شوية صعيبة، ولكن نتا قدها!', 'proud');
    else say(pick(SAY.next), '');
  }

  function optClass(k: number) {
    const o = q.opts[k];
    if (wrong.includes(k)) return 'opt wrong';
    if (o.ok && done) return 'opt correct';
    if (done) return 'opt dim';
    return 'opt';
  }

  const pct = Math.round(((i + (done ? 1 : 0)) / qs.length) * 100);

  return (
    <div style={{ '--dc': d.color, '--ds': d.soft } as CSSProperties}>
      <div className="topbar">
        <button
          className="icon-btn"
          aria-label="Retour à la carte"
          onClick={() => {
            if (confirm('Quitter le parcours ? Ta progression sera perdue.')) onQuit();
          }}
        >
          ✕
        </button>
        <div className="t">
          <b>{d.name}</b>
          <small>Parcours {p}</small>
        </div>
        <AnimatePresence>
          {streak >= 2 && (
            <motion.div
              key="streak"
              className="streak"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* un seul badge : seul le nombre « saute » quand la série augmente */}
              <motion.span
                key={streak}
                style={{ display: 'inline-block' }}
                initial={{ scale: 1.5 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.25 }}
              >
                🔥 {streak}
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="progress">
        <motion.i animate={{ width: pct + '%' }} transition={{ duration: 0.35 }} />
      </div>
      <div className="qcount">
        Question {i + 1} sur {qs.length}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={i}
          className={`card${q.boss ? ' boss' : ''}`}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -40, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {q.boss ? (
            <span className="chip boss-chip">👑 Question boss · bonus ⭐</span>
          ) : (
            <span className="chip">
              <Tex>{pc.comps[q.comp - 1].name}</Tex>
            </span>
          )}
          <Tex as="p" className="qtext">
            {q.q}
          </Tex>
          {q.fig && <Figure fig={q.fig} />}
          <div className="opts">
            {q.opts.map((o, k) => (
              <motion.button
                key={k}
                className={optClass(k)}
                disabled={done || wrong.includes(k)}
                onClick={() => answer(k)}
                initial={{ opacity: 0, y: 10 }}
                animate={o.ok && done ? { opacity: 1, y: 0, scale: [1, 1.04, 1] } : { opacity: 1, y: 0 }}
                transition={{ duration: 0.22, delay: done ? 0 : 0.05 + k * 0.05 }}
              >
                <span className="l">{o.ok && done ? '✓' : wrong.includes(k) ? '✗' : 'ABC'[k]}</span>
                <Tex>{o.t}</Tex>
              </motion.button>
            ))}
          </div>
          <AnimatePresence>
            {done && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
                <div className="exp">
                  <b>Correction</b>
                  <Tex>{q.exp}</Tex>
                </div>
                <button ref={nextRef} className="cta" onClick={next}>
                  {last ? 'Voir mon résultat' : 'Question suivante'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
      <Tutor msg={msg} />
      <AnimatePresence>
        {banner && (
          <motion.div
            key="banner"
            className="streak-banner"
            initial={{ scale: 0.3, opacity: 0, rotate: -8 }}
            animate={{ scale: [0.3, 1.12, 1], opacity: 1, rotate: -3 }}
            exit={{ scale: 1.3, opacity: 0 }}
            transition={{ duration: 0.3 }}
            aria-live="polite"
          >
            <span className="sb-fire">{'🔥'.repeat(banner.n >= 8 ? 3 : banner.n >= 5 ? 2 : 1)}</span>
            <b>{banner.n} d'affilée !</b>
            <span className="ar">{banner.n >= 8 ? 'بطل!' : banner.n >= 5 ? 'واعر!' : 'باز عليك!'}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
