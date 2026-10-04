let actx: AudioContext | null = null;
let muted = false;

export const setMuted = (m: boolean) => {
  muted = m;
};

function ctx() {
  actx = actx || new (window.AudioContext || (window as any).webkitAudioContext)();
  return actx;
}

function tone(freqs: number[], dur = 0.12, type: OscillatorType = 'sine', gap = 0.09, vol = 0.18) {
  if (muted) return;
  try {
    const c = ctx();
    freqs.forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + i * gap;
      o.type = type;
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + dur + 0.02);
    });
  } catch {
    /* audio indisponible */
  }
}

/** Coup sourd du tampon : bruit filtré + note grave */
function thud() {
  if (muted) return;
  try {
    const c = ctx();
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * 0.15), c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3;
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    src.buffer = buf;
    f.type = 'lowpass';
    f.frequency.value = 600;
    g.gain.value = 0.9;
    src.connect(f).connect(g).connect(c.destination);
    src.start();
  } catch {
    /* ignore */
  }
  tone([110], 0.2, 'sine', 0, 0.3);
}

export const sfx = {
  good: () => tone([660, 880], 0.16),
  bad: () => tone([220, 180], 0.18, 'triangle', 0.12),
  win: () => tone([523, 659, 784, 1046], 0.22, 'sine', 0.13),
  streak: () => tone([784, 988, 1175, 1568], 0.14, 'triangle', 0.07),
  unlock: () => tone([440, 660, 880], 0.12, 'triangle', 0.08),
  stamp: thud,
};
