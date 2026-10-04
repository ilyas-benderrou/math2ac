import { motion } from 'motion/react';
import type { Mood } from '../types';
import { renderMath } from '../lib/math';
import { TUTOR } from '../lib/tutor';
import { Owl } from './Owl';

export interface TutorMsg {
  html: string;
  mood: Mood;
  /** Change à chaque message pour relancer les animations */
  id: number;
}

export function Tutor({ msg }: { msg: TutorMsg }) {
  return (
    <div className="tutor">
      <Owl mood={msg.mood} trigger={msg.id} />
      <motion.div
        key={msg.id}
        className="bubble ar"
        initial={msg.id ? { scale: 0.94, opacity: 0.4 } : false}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.22 }}
      >
        <span className="who">{TUTOR} 🦉</span>
        <span dangerouslySetInnerHTML={{ __html: renderMath(msg.html) }} />
      </motion.div>
    </div>
  );
}
