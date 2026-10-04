import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls, type Variants } from 'motion/react';
import type { Mood } from '../types';

const ease = [0.3, 0.7, 0.4, 1] as const;

// Corps entier : saute, se penche, danse
const body: Variants = {
  rest: { y: 0, rotate: 0, scale: 1 },
  happy: { y: [0, -16, 0, -5, 0], rotate: [0, -6, 4, 0, 0], transition: { duration: 0.38, ease } },
  proud: { y: [0, -8, 0], scale: [1, 1.06, 1], transition: { duration: 0.36, ease } },
  cheer: {
    y: [0, -24, 0, -14, 0],
    rotate: [0, -12, 12, -6, 0],
    scale: [1, 1.12, 1, 1.06, 1],
    transition: { duration: 0.75, ease },
  },
  sad: { rotate: [0, 7, 7, 7, 0], y: [0, 2, 2, 2, 0], transition: { duration: 1.1, times: [0, 0.15, 0.5, 0.85, 1] } },
};

// Aile gauche : bat des ailes de joie
const wingL: Variants = {
  rest: { rotate: 0 },
  happy: { rotate: [0, 35, 0, 35, 0], transition: { duration: 0.38 } },
  proud: { rotate: [0, 20, 0], transition: { duration: 0.36 } },
  cheer: { rotate: [0, 50, 0, 50, 0, 50, 0], transition: { duration: 0.75 } },
  sad: { rotate: 0 },
};

// Aile droite : bat des ailes, ou monte se gratter la tête
const wingR: Variants = {
  rest: { rotate: 0 },
  happy: { rotate: [0, -35, 0, -35, 0], transition: { duration: 0.38 } },
  proud: { rotate: [0, -20, 0], transition: { duration: 0.36 } },
  cheer: { rotate: [0, -50, 0, -50, 0, -50, 0], transition: { duration: 0.75 } },
  sad: {
    rotate: [0, -150, -125, -150, -125, -150, 0],
    transition: { duration: 1.1, times: [0, 0.18, 0.33, 0.48, 0.63, 0.8, 1] },
  },
};

const box = (origin: string) => ({ transformBox: 'fill-box', transformOrigin: origin }) as const;

/** Nour le hibou. Chaque nouveau `trigger` rejoue l'animation du `mood`. */
export function Owl({ mood, trigger = 0 }: { mood: Mood; trigger?: number }) {
  const controls = useAnimationControls();
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    controls.set('rest');
    if (mood) controls.start(mood);
  }, [mood, trigger, controls]);

  // Clignement des yeux toutes les 2,5 à 5,5 s
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 130);
        loop();
      }, 2500 + Math.random() * 3000);
    };
    loop();
    return () => clearTimeout(t);
  }, []);

  const happyEyes = mood === 'happy' || mood === 'proud' || mood === 'cheer';

  return (
    <svg className="owl" viewBox="-6 -14 112 116" aria-hidden="true">
      <ellipse cx="50" cy="96" rx="26" ry="4" fill="rgba(0,0,0,.08)" />
      <motion.g animate={controls} initial="rest" variants={body} style={box('50% 90%')}>
        {/* ailes derrière le corps */}
        <motion.path variants={wingL} style={box('80% 15%')} d="M24 50 Q8 62 14 82 Q22 78 28 70 Z" fill="var(--owl-dark)" />
        <motion.path variants={wingR} style={box('20% 15%')} d="M76 50 Q92 62 86 82 Q78 78 72 70 Z" fill="var(--owl-dark)" />
        <path d="M22 40 Q20 18 34 22 L40 30 Q50 26 60 30 L66 22 Q80 18 78 40 Q84 70 66 86 Q50 96 34 86 Q16 70 22 40Z" fill="var(--owl)" />
        <ellipse cx="50" cy="68" rx="18" ry="16" fill="#DCE7FF" />
        <path d="M40 64 q3 3 6 0 M48 70 q3 3 6 0 M54 64 q3 3 6 0" stroke="#A7BEF0" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="38" cy="44" r="12" fill="#fff" />
        <circle cx="62" cy="44" r="12" fill="#fff" />
        {happyEyes ? (
          <g fill="none" stroke="#1D2552" strokeWidth="3.5" strokeLinecap="round">
            <path d="M32 47 q6 -8 12 0" />
            <path d="M56 47 q6 -8 12 0" />
          </g>
        ) : (
          <motion.g animate={{ scaleY: blink ? 0.1 : 1 }} transition={{ duration: 0.06 }} style={box('50% 50%')}>
            <circle cx="39" cy="45" r="5.5" fill="#1D2552" />
            <circle cx="61" cy="45" r="5.5" fill="#1D2552" />
            <circle cx="41" cy="43" r="1.8" fill="#fff" />
            <circle cx="63" cy="43" r="1.8" fill="#fff" />
          </motion.g>
        )}
        {mood === 'sad' && <path d="M30 31 l12 3 M70 31 l-12 3" stroke="#1D2552" strokeWidth="2.5" strokeLinecap="round" />}
        <path d="M46 53 L50 60 L54 53 Z" fill="#F2A33A" />
        <path d="M26 20 L50 10 L74 20 L50 30 Z" fill="#1D2552" />
        <rect x="47" y="20" width="6" height="5" fill="#1D2552" />
        <path d="M74 20 v12" stroke="#F2A33A" strokeWidth="2.5" />
        <circle cx="74" cy="33" r="3" fill="#F2A33A" />
      </motion.g>
      <AnimatePresence>
        {mood === 'sad' && (
          <motion.text
            key={`q${trigger}`}
            x="88"
            y="8"
            fontSize="22"
            fontWeight="800"
            fill="var(--owl)"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            ?
          </motion.text>
        )}
        {mood === 'cheer' &&
          [
            [-4, 4],
            [90, 2],
            [96, 44],
          ].map(([x, y], k) => (
            <motion.text
              key={`s${trigger}-${k}`}
              x={x}
              y={y}
              fontSize="14"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1.3, 1] }}
              transition={{ duration: 0.9, delay: k * 0.08 }}
              style={box('50% 50%')}
            >
              ✨
            </motion.text>
          ))}
      </AnimatePresence>
    </svg>
  );
}
