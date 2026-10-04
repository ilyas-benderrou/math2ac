import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { HEROES } from '../game/config';
import { HeroSprite } from '../components/HeroSprite';
import { Owl } from '../components/Owl';
import { TUTOR } from '../lib/tutor';

interface Props {
  name: string;
  hero?: number;
  onDone: (name: string, hero: number) => void;
}

/** Premier écran : prénom + choix du personnage */
export function HeroSelect({ name: initialName, hero: initialHero, onDone }: Props) {
  const [name, setName] = useState(initialName);
  const [hero, setHero] = useState(initialHero ?? 0);
  const ok = name.trim().length > 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' && e.key !== 'Enter') return;
      if (e.key === 'ArrowRight') setHero(h => (h + 1) % HEROES.length);
      if (e.key === 'ArrowLeft') setHero(h => (h + HEROES.length - 1) % HEROES.length);
      if (e.key === 'Enter' && ok) onDone(name.trim(), hero);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [name, hero, ok, onDone]);

  return (
    <div className="panel hero-panel">
        <div className="hero-head">
          <Owl mood="proud" />
          <div>
            <h1>Math 2AC · L'aventure des maths</h1>
            <p className="ar">مرحبا! أنا {TUTOR} 🦉 كتب سميتك وختار الشخصية ديالك باش نبداو المغامرة!</p>
          </div>
        </div>
        <label className="hero-name">
          <span>Ton prénom</span>
          <input autoFocus maxLength={20} value={name} onChange={e => setName(e.target.value)} placeholder="Ex. : Yassine" autoComplete="off" />
        </label>
        <div className="hero-grid" role="radiogroup" aria-label="Choisis ton personnage">
          {HEROES.map((h, i) => (
            <motion.button
              key={h.frame}
              role="radio"
              aria-checked={hero === i}
              className={`hero-card${hero === i ? ' on' : ''}`}
              onClick={() => setHero(i)}
              whileTap={{ scale: 0.95 }}
              animate={hero === i ? { y: -8 } : { y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <HeroSprite frame={h.frame} size={112} />
              <span>{h.name}</span>
            </motion.button>
          ))}
        </div>
        <button className="cta big" disabled={!ok} onClick={() => onDone(name.trim(), hero)}>
          Commencer l'aventure ⏎
        </button>
    </div>
  );
}
