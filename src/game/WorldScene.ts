import Phaser from 'phaser';
import { DOMAINS } from '../data';
import { nodeState, type NodeState } from '../lib/progress';
import type { Store } from '../lib/storage';
import { bridge, type PlaceInfo } from './bridge';
import { HEROES, reducedMotion, TILE, ZOOM } from './config';
import { BUILDINGS, buildingSize, doorPoint, FRACTIONS, islandGrid, rng, type IslandDef, type PlaceDef } from './islands';
import { makeTextures } from './textures';

const SPEED = 72; // pixels monde par seconde (≈ 4,5 tuiles/s)
const NEAR = 18; // distance à la porte pour proposer le parcours
const GREEN_TREES = [5, 16, 16, 5];
const AUTUMN_TREES = [3, 15, 27];

interface Place {
  def: PlaceDef;
  di: number;
  state?: NodeState;
  sprites: Phaser.GameObjects.Image[];
  door: { x: number; y: number };
  rect: Phaser.Geom.Rectangle;
  label: Phaser.GameObjects.Container;
  labelText: Phaser.GameObjects.Text;
  labelBg: Phaser.GameObjects.Graphics;
  glow?: Phaser.GameObjects.Image;
  sparks?: Phaser.GameObjects.Particles.ParticleEmitter;
}

export class WorldScene extends Phaser.Scene {
  private island: IslandDef = FRACTIONS;
  private grid: number[][] = [];
  private player!: Phaser.Physics.Arcade.Sprite;
  private shadow!: Phaser.GameObjects.Image;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private target: Phaser.Math.Vector2 | null = null;
  private targetMark!: Phaser.GameObjects.Image;
  private places: Place[] = [];
  private near: Place | null = null;
  private paused = false;
  private water!: Phaser.GameObjects.TileSprite;
  private water2!: Phaser.GameObjects.TileSprite;
  private clouds: { img: Phaser.GameObjects.Image; shade: Phaser.GameObjects.Image; v: number }[] = [];
  private walkT = 0;
  private store: Store | null = null;
  private calm = reducedMotion();

  constructor() {
    super('world');
  }

  init(data: { hero: number; store: Store }) {
    this.store = data.store;
    this.registry.set('hero', data.hero);
  }

  preload() {
    this.load.spritesheet('town', 'assets/kenney/town/tilemap_packed.png', { frameWidth: TILE, frameHeight: TILE });
    this.load.spritesheet('dungeon', 'assets/kenney/dungeon/tilemap_packed.png', { frameWidth: TILE, frameHeight: TILE });
  }

  create() {
    makeTextures(this);
    const def = this.island;
    this.grid = islandGrid(def);
    const W = def.cols * TILE, H = def.rows * TILE;
    this.physics.world.setBounds(0, 0, W, H);

    // --- Eau animée (deux couches qui défilent) ---
    this.water = this.add.tileSprite(-200, -200, W + 400, H + 400, 'water').setOrigin(0).setDepth(-10);
    this.water2 = this.add.tileSprite(-200, -200, W + 400, H + 400, 'water2').setOrigin(0).setDepth(-9).setAlpha(0.8);

    // --- Sol : plage + herbe (tilemap) et couche de collision pour l'eau ---
    const map = this.make.tilemap({ tileWidth: TILE, tileHeight: TILE, width: def.cols, height: def.rows });
    const tiles = map.addTilesetImage('town', 'town', TILE, TILE, 0, 0)!;
    const ground = map.createBlankLayer('ground', tiles)!.setDepth(-5);
    const block = map.createBlankLayer('block', tiles)!.setVisible(false);
    const r = rng(def.seed);
    const path = this.pathCells();
    for (let y = 0; y < def.rows; y++)
      for (let x = 0; x < def.cols; x++) {
        const v = this.grid[y][x];
        if (v === 0) block.putTileAt(0, x, y);
        else if (v === 1) ground.putTileAt(25, x, y);
        else if (path.has(`${x},${y}`)) ground.putTileAt(43, x, y);
        else ground.putTileAt(r() < 0.12 ? 2 : r() < 0.35 ? 1 : 0, x, y);
      }
    block.setCollision(0);
    this.drawFoam();

    // --- Ponton + bateau ---
    const dock = this.findDock();
    this.drawDock(dock);

    // --- Lieux des parcours ---
    const di = DOMAINS.findIndex(d => d.id === def.domainId);
    const solids = this.physics.add.staticGroup();
    for (const pl of def.places) this.places.push(this.buildPlace(pl, di, solids));

    // --- Arbres et décor ---
    this.scatterDecor(path, solids, r);

    // --- Personnage ---
    const hero = HEROES[this.registry.get('hero') ?? 0] ?? HEROES[0];
    const start = { x: (dock.x + 0.5) * TILE + (dock.side === 'left' ? TILE * 2 : 0), y: (dock.y - 1.5) * TILE };
    this.shadow = this.add.image(start.x, start.y, 'shadow');
    this.player = this.physics.add.sprite(start.x, start.y, 'dungeon', hero.frame).setOrigin(0.5, 1);
    this.player.body!.setSize(8, 5).setOffset(4, 11);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, block);
    this.physics.add.collider(this.player, solids);
    this.targetMark = this.add.image(0, 0, 'target').setVisible(false).setDepth(1);

    // --- Caméra ---
    const cam = this.cameras.main;
    cam.setBounds(-TILE * 2, -TILE * 2, W + TILE * 4, H + TILE * 4);
    cam.setRoundPixels(true);
    cam.startFollow(this.player, true, 0.12, 0.12);
    this.fitZoom();
    this.scale.on('resize', () => this.fitZoom());

    // --- Ciel vivant ---
    this.spawnClouds(r);
    this.time.addEvent({ delay: 7000, loop: true, callback: () => this.spawnBirds() });
    this.time.delayedCall(1500, () => this.spawnBirds());

    // --- Contrôles ---
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('UP,DOWN,LEFT,RIGHT,W,A,S,D,Z,Q,E,ENTER,SPACE') as Record<string, Phaser.Input.Keyboard.Key>;
    kb.on('keydown-E', () => this.interact());
    kb.on('keydown-ENTER', () => this.interact());
    kb.on('keydown-SPACE', () => this.interact());
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onClick(p));

    // --- Pont avec React ---
    const onProgress = (s: Store) => {
      this.store = s;
      this.refreshPlaces(true);
    };
    const onPause = (v: boolean) => this.setPaused(v);
    bridge.on('progress', onProgress);
    bridge.on('pause', onPause);
    this.events.once('shutdown', () => {
      bridge.off('progress', onProgress);
      bridge.off('pause', onPause);
    });
    this.refreshPlaces(false);
    bridge.emit('ready');
  }

  /** Zoom entier pour garder des pixels nets : 4 en 1080p, 3 en 768p */
  private fitZoom() {
    const z = Math.max(2, Math.round((ZOOM * this.scale.height) / 1080));
    this.cameras.main.setZoom(z);
    this.places.forEach(p => p.labelText.setResolution(z));
  }

  // ------------------------------------------------------------------ construction

  /** Chemin de pierres : ponton → P1 → P2 → P3 (segments en L) */
  private pathCells() {
    const cells = new Set<string>();
    const pts = [this.findDock(), ...this.island.places.map(p => {
      const d = doorPoint(p, TILE);
      return { x: Math.floor(d.x / TILE), y: Math.floor(d.y / TILE) };
    })];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const midY = i === 0 ? a.y - 2 : b.y + 1;
      const seg = (x0: number, y0: number, x1: number, y1: number) => {
        const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
        for (let k = 0; k <= n; k++) cells.add(`${Math.round(x0 + ((x1 - x0) * k) / n)},${Math.round(y0 + ((y1 - y0) * k) / n)}`);
      };
      seg(a.x, a.y, a.x, midY);
      seg(a.x, midY, b.x, midY);
      seg(b.x, midY, b.x, b.y);
    }
    return cells;
  }

  /** Tuile de plage la plus proche du ponton prévu, qui touche l'eau */
  private findDock() {
    const { tx, ty } = this.island.dock;
    let best = { x: tx, y: ty, d: 1e9, side: 'down' as 'down' | 'left' };
    for (let y = 1; y < this.island.rows - 1; y++)
      for (let x = 1; x < this.island.cols - 1; x++) {
        if (this.grid[y]?.[x] !== 1) continue;
        const water = this.grid[y + 1][x] === 0 ? 'down' : this.grid[y][x - 1] === 0 ? 'left' : null;
        if (!water) continue;
        const d = (x - tx) ** 2 + (y - ty) ** 2;
        if (d < best.d) best = { x, y, d, side: water };
      }
    return best;
  }

  private drawFoam() {
    const g = this.add.graphics().setDepth(-6);
    g.fillStyle(0xffffff, 1);
    for (let y = 0; y < this.island.rows; y++)
      for (let x = 0; x < this.island.cols; x++) {
        if (this.grid[y][x] !== 1) continue;
        const X = x * TILE, Y = y * TILE;
        if (this.grid[y - 1]?.[x] === 0) g.fillRect(X, Y - 2, TILE, 2);
        if (this.grid[y + 1]?.[x] === 0) g.fillRect(X, Y + TILE, TILE, 2);
        if (this.grid[y][x - 1] === 0) g.fillRect(X - 2, Y, 2, TILE);
        if (this.grid[y][x + 1] === 0) g.fillRect(X + TILE, Y, 2, TILE);
      }
    if (!this.calm) this.tweens.add({ targets: g, alpha: { from: 0.35, to: 0.85 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    else g.setAlpha(0.6);
  }

  private drawDock(dock: { x: number; y: number; side: 'down' | 'left' }) {
    const g = this.add.graphics().setDepth(-4);
    const X = dock.x * TILE, Y = dock.y * TILE;
    const planks = dock.side === 'down' ? { x: X + 3, y: Y + 8, w: 10, h: 26 } : { x: X - 26, y: Y + 3, w: 34, h: 10 };
    g.fillStyle(0x6b4430).fillRect(planks.x - 1, planks.y - 1, planks.w + 2, planks.h + 2);
    g.fillStyle(0xc68b5e).fillRect(planks.x, planks.y, planks.w, planks.h);
    g.fillStyle(0x8a5a3c);
    if (dock.side === 'down') for (let k = 0; k < planks.h; k += 4) g.fillRect(planks.x, planks.y + k, planks.w, 1);
    else for (let k = 0; k < planks.w; k += 4) g.fillRect(planks.x + k, planks.y, 1, planks.h);
    const bx = dock.side === 'down' ? X + 22 : X - 18, by = dock.side === 'down' ? Y + 34 : Y + 26;
    const boat = this.add.image(bx, by, 'boat').setOrigin(0.5, 1).setDepth(by);
    if (!this.calm) this.tweens.add({ targets: boat, y: by + 1.5, angle: 2, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
  }

  private buildPlace(def: PlaceDef, di: number, solids: Phaser.Physics.Arcade.StaticGroup): Place {
    const layout = BUILDINGS[def.kind];
    const { w, h } = buildingSize(def.kind);
    const sprites: Phaser.GameObjects.Image[] = [];
    const baseY = (def.ty + h) * TILE;
    layout.forEach((row, j) =>
      row.forEach((f, i) => {
        if (f < 0) return;
        sprites.push(this.add.image((def.tx + i) * TILE, (def.ty + j) * TILE, 'town', f).setOrigin(0).setDepth(baseY));
      }),
    );
    // le bâtiment bloque le passage (sauf la rangée du toit, pour pouvoir passer derrière)
    const body = this.add.zone((def.tx + w / 2) * TILE, baseY - TILE * 0.9, w * TILE, TILE * 1.6);
    solids.add(body);
    const rect = new Phaser.Geom.Rectangle(def.tx * TILE, def.ty * TILE, w * TILE, h * TILE);
    const door = doorPoint(def, TILE);

    // étiquette au-dessus du bâtiment
    const labelBg = this.add.graphics();
    const labelText = this.add
      .text(0, 0, '', { fontFamily: '"Baloo Bhaijaan 2", sans-serif', fontSize: '7px', fontStyle: '800', color: '#1D2552' })
      .setOrigin(0.5)
      .setResolution(ZOOM);
    const label = this.add.container((def.tx + w / 2) * TILE, def.ty * TILE - 7, [labelBg, labelText]).setDepth(5000);
    if (!this.calm) this.tweens.add({ targets: label, y: label.y - 1.5, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    return { def, di, sprites, door, rect, label, labelText, labelBg };
  }

  private scatterDecor(path: Set<string>, solids: Phaser.Physics.Arcade.StaticGroup, r: () => number) {
    const def = this.island;
    const dock = this.findDock();
    const busy = (x: number, y: number) =>
      path.has(`${x},${y}`) ||
      Math.abs(x - dock.x) + Math.abs(y - dock.y) < 4 ||
      def.places.some(p => {
        const { w, h } = buildingSize(p.kind);
        return x >= p.tx - 2 && x <= p.tx + w + 1 && y >= p.ty - 2 && y <= p.ty + h + 2;
      });
    for (let y = 2; y < def.rows - 1; y++)
      for (let x = 1; x < def.cols - 1; x++) {
        if (this.grid[y][x] !== 2 || this.grid[y + 1][x] !== 2 || busy(x, y)) continue;
        const roll = r();
        if (roll < 0.075) {
          const frame = r() < def.autumn ? AUTUMN_TREES[Math.floor(r() * 3)] : GREEN_TREES[Math.floor(r() * 4)];
          const tx = x * TILE + 8, ty = (y + 1) * TILE;
          const tree = this.add.image(tx, ty, 'town', frame).setOrigin(0.5, 1).setDepth(ty);
          const trunk = this.add.zone(tx, ty - 3, 6, 5);
          solids.add(trunk);
          if (!this.calm)
            this.tweens.add({ targets: tree, angle: { from: -2.5, to: 2.5 }, duration: 1700 + r() * 1200, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: r() * 1500 });
        } else if (roll < 0.09) {
          const f = [29, 17, 94][Math.floor(r() * 3)];
          this.add.image(x * TILE, y * TILE, 'town', f).setOrigin(0).setDepth((y + 1) * TILE);
        }
      }
    // panneau d'accueil près du ponton
    const sx = (dock.x + 2) * TILE, sy = (dock.y - 1) * TILE;
    this.add.image(sx, sy, 'town', 83).setOrigin(0.5, 1).setDepth(sy);
  }

  private spawnClouds(r: () => number) {
    const W = this.island.cols * TILE, H = this.island.rows * TILE;
    for (let k = 0; k < 5; k++) {
      const x = r() * W, y = r() * H, s = 0.35 + r() * 0.4;
      const shade = this.add.image(x + 10, y + 40, 'cloud').setScale(s).setTint(0x000000).setAlpha(0.06).setDepth(-3);
      const img = this.add.image(x, y, 'cloud').setScale(s).setAlpha(0.55).setDepth(9000);
      this.clouds.push({ img, shade, v: 3 + r() * 4 });
    }
  }

  private spawnBirds() {
    if (this.calm) return;
    const cam = this.cameras.main.worldView;
    const fromLeft = Math.random() < 0.5;
    const y0 = cam.y + 20 + Math.random() * (cam.height * 0.5);
    const x0 = fromLeft ? cam.x - 30 : cam.right + 30, x1 = fromLeft ? cam.right + 60 : cam.x - 60;
    for (let k = 0; k < 3; k++) {
      const b = this.add.sprite(x0 - (fromLeft ? k * 9 : -k * 9), y0 + (k % 2) * 6 + k * 2, 'bird', 0).setDepth(9500).setFlipX(!fromLeft);
      let f = 0;
      const flap = this.time.addEvent({ delay: 180, loop: true, callback: () => b.setFrame((f = 1 - f)) });
      this.tweens.add({
        targets: b,
        x: x1,
        y: b.y - 20,
        duration: 9000 + k * 300,
        onComplete: () => {
          flap.remove();
          b.destroy();
        },
      });
    }
  }

  // ------------------------------------------------------------------ état des lieux

  private refreshPlaces(animate: boolean) {
    if (!this.store) return;
    for (const pl of this.places) {
      const prev = pl.state;
      const state = nodeState(DOMAINS[pl.di], pl.def.p, this.store);
      pl.state = state;
      const dim = state === 'locked';
      pl.sprites.forEach(s => (dim ? s.setTint(0x8f96a8) : s.clearTint()));
      const best = this.store.best[`${DOMAINS[pl.di].id}-${pl.def.p}`];
      const text =
        state === 'locked'
          ? `🔒 Parcours ${pl.def.p}`
          : state === 'soon'
            ? `🚧 Parcours ${pl.def.p} · bientôt`
            : state === 'visa'
              ? `⭐ Parcours ${pl.def.p} · VISA`
              : state === 'done'
                ? `Parcours ${pl.def.p} · ${best?.pct ?? 0}%`
                : `▶ Parcours ${pl.def.p}`;
      pl.labelText.setText(text);
      const bw = pl.labelText.width + 8, bh = 11;
      pl.labelBg.clear();
      pl.labelBg.fillStyle(state === 'visa' ? 0xfff1c2 : state === 'locked' ? 0xe3e7ef : 0xffffff, 0.95);
      pl.labelBg.fillRoundedRect(-bw / 2, -bh / 2, bw, bh, 4);
      pl.labelBg.lineStyle(1, state === 'visa' ? 0xd18a1e : state === 'open' ? 0xd18a1e : 0x9aa3b8, 1);
      pl.labelBg.strokeRoundedRect(-bw / 2, -bh / 2, bw, bh, 4);
      if (state === 'visa') this.lightUp(pl, animate && prev !== undefined && prev !== 'visa');
    }
    if (this.near) bridge.emit('near', this.placeInfo(this.near));
  }

  /** Le lieu s'illumine quand il a le VISA */
  private lightUp(pl: Place, burst: boolean) {
    const cx = pl.rect.centerX, cy = pl.rect.bottom - 8;
    if (!pl.glow) {
      pl.glow = this.add.image(cx, cy, 'glow').setScale(1.6).setDepth(pl.rect.bottom - 1).setAlpha(0.7);
      if (!this.calm) this.tweens.add({ targets: pl.glow, alpha: { from: 0.55, to: 0.9 }, scale: { from: 1.5, to: 1.75 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      if (!this.calm)
        pl.sparks = this.add
          .particles(cx, pl.rect.y + 6, 'spark', {
            x: { min: -pl.rect.width / 2, max: pl.rect.width / 2 },
            y: { min: 0, max: pl.rect.height },
            lifespan: 1200,
            speedY: { min: -14, max: -6 },
            alpha: { start: 1, end: 0 },
            frequency: 260,
            blendMode: 'ADD',
          })
          .setDepth(5001);
    }
    if (burst) {
      pl.glow.setScale(0.2);
      this.tweens.add({ targets: pl.glow, scale: 2.4, duration: 380, yoyo: true, ease: 'Back.out' });
      this.cameras.main.flash(250, 255, 240, 180);
    }
  }

  private placeInfo(pl: Place): PlaceInfo {
    return { di: pl.di, p: pl.def.p, state: pl.state ?? 'locked' };
  }

  // ------------------------------------------------------------------ contrôles

  private setPaused(v: boolean) {
    this.paused = v;
    this.input.keyboard!.enabled = !v;
    if (v) {
      this.input.keyboard!.resetKeys();
      this.player.setVelocity(0);
      this.target = null;
      this.targetMark.setVisible(false);
    }
  }

  private interact() {
    if (this.paused || !this.near) return;
    bridge.emit('interact', this.placeInfo(this.near));
  }

  private onClick(p: Phaser.Input.Pointer) {
    if (this.paused) return;
    const wp = this.cameras.main.getWorldPoint(p.x, p.y);
    const hit = this.places.find(pl => pl.rect.contains(wp.x, wp.y));
    if (hit) {
      if (this.near === hit) return this.interact();
      this.target = new Phaser.Math.Vector2(hit.door.x, hit.door.y);
    } else {
      this.target = new Phaser.Math.Vector2(wp.x, wp.y);
    }
    this.targetMark.setPosition(this.target.x, this.target.y).setVisible(true);
  }

  update(_t: number, dt: number) {
    // eau et nuages bougent même en pause : le monde reste vivant derrière le panneau
    if (!this.calm) {
      this.water.tilePositionX += dt * 0.004;
      this.water.tilePositionY += dt * 0.002;
      this.water2.tilePositionX -= dt * 0.006;
      this.water2.tilePositionY = Math.sin(_t / 1500) * 3;
      const W = this.island.cols * TILE;
      for (const c of this.clouds) {
        c.img.x += (c.v * dt) / 1000;
        if (c.img.x > W + 80) c.img.x = -80;
        c.shade.setPosition(c.img.x + 10, c.img.y + 40);
      }
    }
    if (this.paused) return;

    const k = this.keys;
    let vx = 0, vy = 0;
    if (k.LEFT.isDown || k.A.isDown || k.Q.isDown) vx -= 1;
    if (k.RIGHT.isDown || k.D.isDown) vx += 1;
    if (k.UP.isDown || k.W.isDown || k.Z.isDown) vy -= 1;
    if (k.DOWN.isDown || k.S.isDown) vy += 1;
    if (vx || vy) {
      this.target = null;
      this.targetMark.setVisible(false);
    } else if (this.target) {
      const dx = this.target.x - this.player.x, dy = this.target.y - this.player.y;
      const d = Math.hypot(dx, dy);
      // arrivé, ou bloqué contre un obstacle
      const blocked = this.player.body!.blocked.none === false && d < 24;
      if (d < 2 || blocked) {
        // arrivé : Nour propose le parcours (on ne le lance pas tout seul)
        this.target = null;
        this.targetMark.setVisible(false);
      } else {
        vx = dx / d;
        vy = dy / d;
      }
    }
    const len = Math.hypot(vx, vy) || 1;
    this.player.setVelocity((vx / len) * SPEED, (vy / len) * SPEED);
    const moving = vx !== 0 || vy !== 0;
    if (vx) this.player.setFlipX(vx < 0);
    // petit rebond de marche
    this.walkT = moving ? this.walkT + dt : 0;
    const bob = moving && !this.calm ? -Math.abs(Math.sin(this.walkT / 90)) * 1.5 : 0;
    this.player.setDisplayOrigin(8, 16 - bob);
    this.player.setDepth(this.player.y);
    this.shadow.setPosition(this.player.x, this.player.y - 1).setDepth(this.player.y - 1);
    this.updateNear();
  }

  private updateNear() {
    let best: Place | null = null;
    for (const pl of this.places) if (Phaser.Math.Distance.Between(this.player.x, this.player.y, pl.door.x, pl.door.y) < NEAR) best = pl;
    if (best !== this.near) {
      this.near = best;
      bridge.emit('near', best ? this.placeInfo(best) : null);
    }
  }
}
