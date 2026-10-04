import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { motion } from 'motion/react';
import type { Domain, Parcours } from '../types';
import type { Result } from '../lib/evaluation';
import { Tex } from '../lib/math';
import { escapeHtml } from '../lib/utils';
import { Tutor } from '../components/Tutor';
import { Face } from '../components/Face';
import { Stamp } from '../components/Stamp';

interface Props {
  domain: Domain;
  p: number;
  pc: Parcours;
  name: string;
  result: Result;
  /** VISA obtenu pour la première fois sur ce parcours */
  newVisa: boolean;
  onHome: () => void;
  onAgain: () => void;
  onStampPassport: () => void;
}

function tutorMessage(r: Result, name: string, newVisa: boolean) {
  let msg: string;
  if (r.pct >= 90) msg = 'تبارك الله عليك! نتيجة واعرة بزاف 🏆 راك فاهم هاد المجال مزيان.';
  else if (r.pct >= 75) msg = 'برافو عليك! خدمة زوينة 👏 راجع غير الكفايات الصفرة وغادي تولّي بطل.';
  else if (r.pct >= 50) msg = 'مزيان! راك فالطريق الصحيح 💪 شوف الكفايات لي خاصك تراجع وعاود.';
  else msg = 'ما تقلقش، التعلم كيبدا هكا 🌱 راجع الدرس مع التصحيحات وعاود المحاولة، أنا معاك!';
  if (name) msg = `${escapeHtml(name)}، ` + msg;
  if (newVisa) msg += '<br><b>ربحتي الـ VISA ديال هاد الپاركور! 🎉 يلا نطبعوه فالباسبور 🛂</b>';
  else if (r.visa) msg += '<br><b>الـ VISA ديالك ديجا فالباسبور 🛂</b>';
  if (r.bossBonus) msg += '<br>👑 غلبتي الـ Boss: نجمة زايدة!';
  return msg;
}

/** Compte de 0 jusqu'à `to` en ~400 ms */
function useCountUp(to: number) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setV(to);
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 400);
      setV(Math.round(to * (1 - (1 - k) ** 3)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return v;
}

export function Results({ domain: d, p, pc, name, result: r, newVisa, onHome, onAgain, onStampPassport }: Props) {
  const shown = useCountUp(r.pct);
  const toReview = pc.comps.map((c, ci) => ({ c, l: r.levels[ci] })).filter(x => x.l > 0);
  const s = r.maxStreak > 1 ? 's' : '';

  // Entrée : tamponner le passeport s'il y a un nouveau VISA, sinon retour à l'île
  const onKey = useRef<(e: KeyboardEvent) => void>(() => {});
  onKey.current = e => {
    if (e.key !== 'Enter' || e.repeat) return;
    e.preventDefault();
    if (newVisa) onStampPassport();
    else onHome();
  };
  useEffect(() => {
    const h = (e: KeyboardEvent) => onKey.current(e);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  return (
    <div className="panel results-panel" style={{ '--dc': d.color, '--ds': d.soft } as CSSProperties}>
      <div className="topbar">
        <button className="icon-btn" aria-label="Retour à l'île" onClick={onHome}>
          ✕
        </button>
        <div className="t">
          <b>{d.name}</b>
          <small>Parcours {p} terminé</small>
        </div>
      </div>
      <div className="results-body">
        <section className="results-left">
          <Tutor msg={{ html: tutorMessage(r, name, newVisa), mood: r.visa ? 'cheer' : r.pct >= 50 ? 'proud' : 'sad', id: 1 }} />
          <div className="score">
            <div className="pct">{shown}%</div>
            <div className="stars">
              {[0, 1, 2].map(k => (
                <motion.span
                  key={k}
                  className={k < r.stars ? '' : 'off'}
                  initial={{ scale: 0, rotate: -40 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 14, delay: 0.35 + k * 0.12 }}
                >
                  ⭐
                </motion.span>
              ))}
            </div>
            {r.visa && (
              <motion.div
                className="visa-stamp"
                initial={{ scale: 2.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.6, ease: [0.5, 0, 0.9, 0.4] }}
              >
                <Stamp color="var(--stamp)" label={`${d.name.split(' ')[0]} · P${p}`} rotate={-12} size={170} />
              </motion.div>
            )}
            <div className="qcount">
              Meilleure série : {r.maxStreak} bonne{s} réponse{s} d'affilée
            </div>
          </div>
          {newVisa && (
            <motion.button
              className="cta stamp-cta"
              onClick={onStampPassport}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.35 }}
            >
              🛂 Tamponner mon passeport <kbd>Entrée</kbd>
            </motion.button>
          )}
          <div className="btn-row">
            <button className="cta ghost" onClick={onHome}>
              Retour à l'île {!newVisa && <kbd>Entrée</kbd>}
            </button>
            <button className="cta" onClick={onAgain}>
              Rejouer
            </button>
          </div>
        </section>
        <section className="results-right">
          <table className="grid">
            <thead>
              <tr>
                <th>Compétence</th>
                <th>Acquis</th>
                <th>En cours</th>
                <th>À revoir</th>
              </tr>
            </thead>
            <tbody>
              {pc.comps.map((c, ci) => (
                <tr key={ci}>
                  <td className="c">
                    <Tex>{c.name}</Tex>
                    <small>{Math.round(r.compRatios[ci] * 100)}% de réussite</small>
                  </td>
                  {([0, 1, 2] as const).map(k => (
                    <td key={k} className="s">
                      <Face kind={k} on={r.levels[ci] === k} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {toReview.length > 0 && (
            <div className="review">
              <h3>À réviser dans le cahier</h3>
              <ul>
                {toReview.map(x => (
                  <li key={x.c.name}>
                    <Tex>{x.c.name}</Tex> : {x.c.pages}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
