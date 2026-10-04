// Textures dessinées par le code (pas d'asset à télécharger) : eau, écume, nuages, oiseaux, halo, bateau…
import Phaser from 'phaser';

function canvasTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h)!;
  draw(tex.getContext());
  tex.refresh();
}

export function makeTextures(scene: Phaser.Scene) {
  // Eau : deux tons + petites vagues en pixels, se répète sans couture (32 × 32)
  canvasTexture(scene, 'water', 32, 32, c => {
    c.fillStyle = '#4FA4DE';
    c.fillRect(0, 0, 32, 32);
    c.fillStyle = '#5BB0E8';
    for (let y = 0; y < 32; y += 8) c.fillRect(0, y, 32, 3);
    c.fillStyle = '#9AD3F5';
    [
      [3, 2], [19, 10], [9, 18], [25, 26],
    ].forEach(([x, y]) => {
      c.fillRect(x, y, 4, 1);
      c.fillRect(x + 1, y - 1, 2, 1);
    });
  });
  // Reflets qui brillent sur l'eau (couche au-dessus, défile dans l'autre sens)
  canvasTexture(scene, 'water2', 64, 64, c => {
    c.fillStyle = 'rgba(255,255,255,.55)';
    [
      [6, 9], [40, 20], [22, 44], [52, 54], [14, 30],
    ].forEach(([x, y]) => c.fillRect(x, y, 3, 1));
  });
  // Écume du rivage
  canvasTexture(scene, 'foam', 4, 4, c => {
    c.fillStyle = '#fff';
    c.fillRect(0, 0, 4, 4);
  });
  // Nuage doux
  canvasTexture(scene, 'cloud', 96, 48, c => {
    c.fillStyle = '#fff';
    [
      [26, 30, 18], [46, 22, 22], [68, 30, 17], [48, 34, 16],
    ].forEach(([x, y, r]) => {
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
    });
  });
  // Oiseau : 2 images (ailes hautes / basses)
  canvasTexture(scene, 'bird', 14, 6, c => {
    c.fillStyle = '#2B2F4A';
    // ailes hautes
    c.fillRect(0, 0, 2, 1); c.fillRect(2, 1, 2, 1); c.fillRect(4, 2, 1, 1); c.fillRect(5, 1, 2, 1);
    // ailes basses (décalées de 7 px)
    c.fillRect(7, 3, 2, 1); c.fillRect(9, 2, 1, 1); c.fillRect(10, 2, 1, 1); c.fillRect(11, 3, 2, 1);
  });
  const bird = scene.textures.get('bird');
  bird.add(0, 0, 0, 0, 7, 6);
  bird.add(1, 0, 7, 0, 7, 6);
  // Halo lumineux (lieu avec VISA)
  canvasTexture(scene, 'glow', 64, 64, c => {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,248,214,.95)');
    g.addColorStop(0.4, 'rgba(255,212,96,.55)');
    g.addColorStop(1, 'rgba(255,190,60,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
  });
  // Étincelle
  canvasTexture(scene, 'spark', 3, 3, c => {
    c.fillStyle = '#FFF4B8';
    c.fillRect(1, 0, 1, 3);
    c.fillRect(0, 1, 3, 1);
  });
  // Ombre sous le personnage
  canvasTexture(scene, 'shadow', 12, 4, c => {
    c.fillStyle = 'rgba(0,0,0,.25)';
    c.beginPath();
    c.ellipse(6, 2, 6, 2, 0, 0, Math.PI * 2);
    c.fill();
  });
  // Marqueur de destination (clic)
  canvasTexture(scene, 'target', 9, 5, c => {
    c.strokeStyle = 'rgba(255,255,255,.9)';
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(4.5, 2.5, 4, 2, 0, 0, Math.PI * 2);
    c.stroke();
  });
  // Petit bateau en pixel art (vu de côté, 24 × 16)
  canvasTexture(scene, 'boat', 24, 18, c => {
    const px = (col: string, x: number, y: number, w = 1, h = 1) => {
      c.fillStyle = col;
      c.fillRect(x, y, w, h);
    };
    px('#3B2A2A', 11, 1, 1, 11); // mât
    px('#FFFFFF', 12, 2, 7, 7); // voile
    px('#E7E7EF', 12, 8, 7, 1);
    px('#D18A1E', 12, 2, 7, 2); // bande or
    px('#3B2A2A', 1, 11, 22, 1); // coque
    px('#8A5A3C', 2, 12, 20, 3);
    px('#6B4430', 4, 15, 16, 1);
    px('#C68B5E', 3, 12, 18, 1);
  });
}
