import confettiLib from 'canvas-confetti';

const COLS = ['#D18A1E', '#DD6430', '#AE4068', '#3C6BD3', '#1E9A60', '#F2C230'];
const base = { colors: COLS, disableForReducedMotion: true, zIndex: 60 };

/** Petite pluie pour une bonne réponse */
export function confetti(n = 26) {
  confettiLib({ ...base, particleCount: n * 2, spread: 70, startVelocity: 35, origin: { y: 0.6 }, ticks: 120 });
}

/** Célébration de série : plus la série est longue, plus c'est grand */
export function celebrate(level: number) {
  if (level >= 8) {
    const end = Date.now() + 900;
    const frame = () => {
      confettiLib({ ...base, particleCount: 6, angle: 60, spread: 55, origin: { x: 0, y: 0.75 } });
      confettiLib({ ...base, particleCount: 6, angle: 120, spread: 55, origin: { x: 1, y: 0.75 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
    confettiLib({ ...base, particleCount: 120, spread: 160, startVelocity: 45, origin: { y: 0.4 }, shapes: ['star'] });
  } else if (level >= 5) {
    confettiLib({ ...base, particleCount: 70, angle: 60, spread: 60, origin: { x: 0, y: 0.7 } });
    confettiLib({ ...base, particleCount: 70, angle: 120, spread: 60, origin: { x: 1, y: 0.7 } });
  } else {
    confettiLib({ ...base, particleCount: 90, spread: 100, origin: { y: 0.55 } });
  }
}

/** Gros feu d'artifice : VISA, fin de parcours réussie */
export function fireworks() {
  confettiLib({ ...base, particleCount: 120, spread: 120, origin: { y: 0.5 } });
  setTimeout(() => confettiLib({ ...base, particleCount: 60, spread: 90, origin: { x: 0.2, y: 0.4 } }), 180);
  setTimeout(() => confettiLib({ ...base, particleCount: 60, spread: 90, origin: { x: 0.8, y: 0.4 } }), 320);
}
