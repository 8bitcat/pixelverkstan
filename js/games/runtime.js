// Körmiljön för minispelen: helskärmsyta, tangentbord/touch, FPS-räknare, hack-simulering,
// tidstypiska felskärmar och highscore. Arkadmaskiner kör alltid felfritt i 60 fps;
// speldatorn kör så bra som delarna tillåter.
import { W, H } from './common.js';
import { SMALL, BIG, textW, eachTextPixel } from '../core/floor-pix.js';

const ENGINES = {
  rymd: () => import('./rymd.js'), labyrint2d: () => import('./labyrint2d.js'), plattform: () => import('./plattform.js'),
  racer: () => import('./racer.js'), fight: () => import('./fight.js'), raycast: () => import('./raycast.js'),
  gun: () => import('./gun.js'), dance: () => import('./dance.js'), block: () => import('./block.js'),
};
// spel som saknar egen motor lånar en
export const ENGINE_ALIAS = { rpg: 'plattform', aventyr: 'plattform', city: 'racer', sport: 'plattform', sim: 'plattform', kong: 'plattform', maze: 'labyrint2d', invaders: 'rymd', road: 'racer', basket: 'plattform', corridor: 'raycast', blocks: 'block', platform: 'plattform' };
export const engineFor = (name) => (ENGINES[name] ? name : ENGINE_ALIAS[name] || 'plattform');

const $ = (s) => document.querySelector(s);
const KEYS = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'up', w: 'up', ArrowDown: 'down', s: 'down', ' ': 'a', z: 'a', Control: 'a', x: 'b', Shift: 'b', Enter: 'start' };

export class Play {
  constructor(hooks) {
    this.hooks = hooks;            // { onExit(result), toast(text) }
    this.el = $('#play'); this.canvas = $('#play-canvas'); this.ctx = this.canvas.getContext('2d');
    this.buf = document.createElement('canvas'); this.buf.width = W; this.buf.height = H; this.g = this.buf.getContext('2d');
    this.inp = { left: false, right: false, up: false, down: false, a: false, b: false, start: false };
    this.hits = {};
    this.game = null; this.mode = null; this.t = 0; this.acc = 0; this.frameT = 0; this.fpsShown = 0; this.fpsSamples = [];
    this.onKey = (e) => {
      const k = KEYS[e.key] || KEYS[e.key.toLowerCase?.()];
      if (e.key === 'Escape') { if (e.type === 'keydown') this.exit(); return; }
      if (!k) return;
      e.preventDefault();
      const down = e.type === 'keydown';
      if (down && !this.inp[k]) this.hits[k] = true;
      this.inp[k] = down;
    };
    this.onPtr = (e) => {
      const r = this.canvas.getBoundingClientRect();
      const x = (e.clientX - r.left - this.ox) / this.s, y = (e.clientY - r.top - this.oy) / this.s;
      if (x >= 0 && x <= W && y >= 0 && y <= H) { this.inp.mx = x; this.inp.my = y; if (e.type === 'pointerdown') { this.hits.a = true; this.inp.a = true; setTimeout(() => (this.inp.a = false), 80); } }
    };
    this.touchBtn = (name, el) => {
      const down = (e) => { e.preventDefault(); if (!this.inp[name]) this.hits[name] = true; this.inp[name] = true; };
      const up = (e) => { e.preventDefault(); this.inp[name] = false; };
      el.addEventListener('pointerdown', down); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up);
    };
    this.el.querySelectorAll('[data-k]').forEach((b) => this.touchBtn(b.dataset.k, b));
    $('#play-exit').onclick = () => this.exit();
  }

  // opts: { mode: 'arcade'|'pc', product, engine, skin, machine: { fps, error, software, name }, title }
  async open(opts) {
    // allt som ritloopen tittar på sätts innan motorn laddas
    this.opts = opts; this.mode = opts.mode; this.state = 'load'; this.game = null; this.error = null; this.t = 0; this.hs = loadHs(opts.product?.id);
    this.el.classList.remove('hidden');
    document.body.dataset.screen = 'play';
    this.el.classList.toggle('arcade', this.mode === 'arcade'); this.el.classList.toggle('pc', this.mode === 'pc');
    $('#play-title').textContent = opts.title || '';
    $('#play-sub').textContent = 'Laddar …';
    this.resize();
    const name = engineFor(opts.engine);
    const mod = await ENGINES[name]();
    if (this.opts !== opts) return;   // stängdes eller byttes medan motorn laddades
    this.engineName = name;
    this.game = opts.machine?.error ? null : mod.create({ title: opts.title, ...(opts.skin || {}) }, { software: !!opts.machine?.software });
    this.error = opts.machine?.error || null;
    this.targetFps = this.mode === 'arcade' ? 60 : Math.max(4, Math.min(70, opts.machine?.fps || 60));
    this.state = this.mode === 'arcade' ? 'coin' : (this.error ? 'error' : 'boot');
    this.bootLen = this.mode === 'console' ? 1.1 : 2.2;
    this.bootT = 0; this.acc = 0; this.frameT = 0; this.fpsSamples = []; this.savedHs = false;
    $('#play-sub').textContent = this.mode === 'arcade' ? `${opts.product?.coin ? opts.product.coin + ' kr per spel' : 'gratis'} · ESC = gå därifrån` : this.mode === 'console' ? `${opts.console?.name || 'Konsolen'} i TV-hörnan · ESC = lägg ner handkontrollen` : `${opts.machine?.name || 'Speldatorn'} · ESC = res dig`;
    window.addEventListener('keydown', this.onKey); window.addEventListener('keyup', this.onKey);
    this.canvas.addEventListener('pointerdown', this.onPtr); this.canvas.addEventListener('pointermove', this.onPtr);
    this.resize();
  }
  exit() {
    if (this.el.classList.contains('hidden')) return;
    window.removeEventListener('keydown', this.onKey); window.removeEventListener('keyup', this.onKey);
    this.canvas.removeEventListener('pointerdown', this.onPtr); this.canvas.removeEventListener('pointermove', this.onPtr);
    this.el.classList.add('hidden');
    const result = { score: this.game?.score || 0, product: this.opts?.product, mode: this.mode, played: this.t };
    this.game = null; this.opts = null; this.state = null;
    this.hooks.onExit?.(result);
  }
  resize() {
    const dpr = window.devicePixelRatio || 1, cw = this.canvas.clientWidth, ch = this.canvas.clientHeight;
    if (!cw || !ch) return;
    this.canvas.width = Math.round(cw * dpr); this.canvas.height = Math.round(ch * dpr); this.dpr = dpr;
    let s = Math.min(cw / W, ch / H);
    if (s >= 2) s = Math.floor(s);
    this.s = s; this.ox = Math.round((cw - W * s) / 2); this.oy = Math.round((ch - H * s) / 2);
  }
  get open_() { return !this.el.classList.contains('hidden'); }

  frame(dt) {
    if (!this.open_) return;
    this.t += dt;
    const inp = { ...this.inp };
    for (const k of Object.keys(this.hits)) { inp[k + 'Hit'] = true; if (k === 'a') inp.hit = true; }
    this.hits = {};
    // tillstånd före spelet
    if (this.state === 'coin') { if (inp.hit || inp.startHit || inp.aHit) { this.state = 'run'; this.hooks.onCoin?.(this.opts.product); } }
    else if (this.state === 'boot') { this.bootT += dt; if (this.bootT > (this.bootLen || 2.2) || inp.startHit) this.state = 'run'; }
    else if (this.state === 'error') { if (inp.startHit || inp.hit) this.exit(); }
    if (this.state === 'run' && this.game) {
      // hack-simulering: spelet räknar i fasta steg men bilden ritas bara i målhastigheten (med ryck)
      const jitter = this.targetFps < 25 ? 1 + (Math.sin(this.t * 7.3) + Math.sin(this.t * 3.1)) * 0.35 : 1;
      const frameLen = 1 / this.targetFps * jitter;
      this.acc += dt;
      let steps = 0;
      while (this.acc >= 1 / 60 && steps < 6) { this.game.update(1 / 60, steps === 0 ? inp : { ...inp, hit: false, aHit: false, startHit: false, leftHit: false, rightHit: false, upHit: false, downHit: false, bHit: false }); this.acc -= 1 / 60; steps++; }
      this.frameT += dt;
      if (this.frameT >= frameLen) { this.frameT = 0; this.game.draw(this.g); this.fpsSamples.push(performance.now()); }
      while (this.fpsSamples.length && performance.now() - this.fpsSamples[0] > 1000) this.fpsSamples.shift();
      if (this.game.over && !this.savedHs) { this.savedHs = true; this.saveHs(); }
      if (!this.game.over) this.savedHs = false;
    }
    this.draw();
  }
  saveHs() {
    const sc = this.game?.score || 0;
    if (!this.opts.product || sc <= 0) return;
    const name = (this.hooks.playerName?.() || 'DU').toUpperCase().replace(/[^A-ZÅÄÖ0-9]/g, '').slice(0, 3) || 'DU';
    this.hs.push({ name, score: sc }); this.hs.sort((a, b) => b.score - a.score); this.hs = this.hs.slice(0, 5);
    try { localStorage.setItem('pixelverkstan_hs_' + this.opts.product.id, JSON.stringify(this.hs)); } catch { /* privat läge */ }
    this.hooks.onScore?.(this.opts.product, sc, this.hs[0]?.score === sc && this.hs[0]?.name === name);
  }

  draw() {
    const ctx = this.ctx, g = this.g;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.fillStyle = this.mode === 'arcade' ? '#08060c' : this.mode === 'console' ? '#2a2430' : '#1c1a22'; ctx.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
    if (this.state === 'coin') this.drawCoin(g);
    else if (this.state === 'boot') this.drawBoot(g);
    else if (this.state === 'error') this.drawError(g);
    else if (this.state === 'load') { g.fillStyle = '#05060a'; g.fillRect(0, 0, W, H); txt(g, 'LADDAR ...', 76, '#8a8f9c', true); }
    ctx.imageSmoothingEnabled = false;
    // ram runt skärmen
    const x = this.ox, y = this.oy, w = W * this.s, h = H * this.s;
    ctx.fillStyle = this.mode === 'arcade' ? '#2a2a34' : this.mode === 'console' ? '#3a3a44' : '#d8d0b8'; ctx.fillRect(x - 12, y - 12, w + 24, h + 24);
    ctx.fillStyle = '#0a0a0e'; ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
    ctx.drawImage(this.buf, x, y, w, h);
    // fps-räknare på speldatorn
    if (this.mode === 'pc' && this.state === 'run') {
      // datorns simulerade bildfrekvens (målet ± lite brus – skärmen själv kan bara visa 60/30/20 …)
      const noise = Math.sin(this.t * 5.1) * 1.5 + Math.sin(this.t * 1.7) * (this.targetFps < 25 ? 3 : 1.5);
      const fps = Math.max(1, Math.round(this.targetFps + noise)), col = fps >= 50 ? '#3fb04a' : fps >= 25 ? '#f0e030' : '#e23b5a';
      const s = Math.max(2, Math.floor(this.s / 1.2)), label = fps + ' FPS';
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(x + w - textW(BIG, label, s) - 10, y + 4, textW(BIG, label, s) + 8, 7 * s + 6);
      ctx.fillStyle = col; eachTextPixel(BIG, label, x + w - textW(BIG, label, s) - 6, y + 7, s, (px, py) => ctx.fillRect(px, py, s, s));
    }
    // highscore-lista vid sidan (arkad)
    if (this.mode === 'arcade' && this.hs?.length && this.s * W + 200 < this.canvas.clientWidth) {
      const hx = x + w + 24, hy = y + 10;
      ctx.fillStyle = '#f0e030'; eachTextPixel(BIG, 'HIGH SCORE', hx, hy, 2, (px, py) => ctx.fillRect(px, py, 2, 2));
      this.hs.forEach((h, i) => { ctx.fillStyle = i === 0 ? '#f4f2ec' : '#8a8f9c'; eachTextPixel(BIG, `${i + 1}. ${h.name.padEnd(3)} ${String(h.score).padStart(6, ' ')}`, hx, hy + 24 + i * 20, 2, (px, py) => ctx.fillRect(px, py, 2, 2)); });
    }
  }
  drawCoin(g) {
    g.fillStyle = '#05060a'; g.fillRect(0, 0, W, H);
    const t = this.t, on = Math.floor(t * 2) % 2;
    txt(g, (this.opts.title || 'SPEL').toUpperCase(), 30, '#f0e030', true, 2);
    txt(g, 'INSERT COIN', 80, on ? '#f4f2ec' : '#3a3a44', true);
    txt(g, 'TRYCK SPACE / ENTER ELLER KLICKA', 100, '#8a8f9c');
    txt(g, 'PILAR = RÖR DIG   SPACE = A   X = B', 112, '#8a8f9c');
    if (this.hs.length) txt(g, `REKORD ${this.hs[0].name} ${this.hs[0].score}`, 130, '#e23b5a');
  }
  drawBoot(g) {
    const m = this.opts.machine || {}, era = m.year || 2000, t = this.bootT;
    if (this.mode === 'console') {
      g.fillStyle = '#05060a'; g.fillRect(0, 0, W, H);
      const c = this.opts.console;
      txt(g, (c?.maker || '').toUpperCase(), 56, '#8a8f9c', true);
      txt(g, (c?.name || '').toUpperCase(), 72, '#f4f2ec', true, 1);
      if (t > 0.5) txt(g, (this.opts.title || '').toUpperCase(), 98, '#f0e030', true);
      return;
    }
    g.fillStyle = era < 1995 ? '#000000' : era < 2007 ? '#000080' : '#0a0a0e'; g.fillRect(0, 0, W, H);
    const lines = era < 1995
      ? [`C:\\> ${(this.opts.title || 'GAME').replace(/\s+/g, '').toUpperCase().slice(0, 8)}.EXE`, 'Checking memory ... ' + m.ram + ' KB OK', 'Video: ' + (m.gfx || 'VGA') + ' detected', m.sound ? 'Sound Blaster at 220h IRQ 5' : 'No sound card - PC speaker', 'Loading ...']
      : era < 2007 ? ['Starting ' + (this.opts.title || 'game') + ' ...', 'DirectX ' + (era < 2002 ? '7' : '9.0c') + ' initialized', (m.software ? 'No 3D accelerator - software rendering' : '3D accelerator: ' + (m.gfxName || 'OK')), 'Loading textures ...']
        : ['Loading ' + (this.opts.title || 'game') + ' ...', 'Shader cache: ' + (m.software ? 'software fallback' : 'OK'), 'VRAM: ' + Math.round(m.vram || 0) + ' MB', 'Please wait ...'];
    const shown = Math.min(lines.length, Math.floor(t / 0.4) + 1);
    for (let i = 0; i < shown; i++) txtL(g, lines[i], 8, 12 + i * 12, era < 1995 ? '#c0c0c0' : '#f4f2ec');
    if (Math.floor(t * 3) % 2) txtL(g, '_', 8, 12 + shown * 12, '#c0c0c0');
    if (t > 1.6) { g.fillStyle = '#3a3a44'; g.fillRect(40, H - 24, W - 80, 6); g.fillStyle = '#3fb04a'; g.fillRect(40, H - 24, (W - 80) * Math.min(1, (t - 1.6) / 0.6), 6); }
  }
  drawError(g) {
    const m = this.opts.machine || {}, era = m.year || 2000, e = this.error;
    if (era < 1995) {
      g.fillStyle = '#000000'; g.fillRect(0, 0, W, H);
      txtL(g, 'C:\\> ' + (this.opts.title || 'GAME').replace(/\s+/g, '').toUpperCase().slice(0, 8) + '.EXE', 8, 12, '#c0c0c0');
      txtL(g, e, 8, 28, '#ffff55'); txtL(g, 'Program terminated.', 8, 40, '#c0c0c0'); txtL(g, 'C:\\> _', 8, 56, '#c0c0c0');
    } else {
      g.fillStyle = era < 2007 ? '#3a6ea5' : '#1c1a22'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#f4f2ec'; g.fillRect(30, 40, W - 60, 70); g.fillStyle = era < 2007 ? '#000080' : '#2a2a34'; g.fillRect(30, 40, W - 60, 12);
      txtL(g, (this.opts.title || 'Spel'), 34, 43, '#ffffff');
      txtL(g, e, 36, 62, '#1a1a1e'); txtL(g, m.hint || '', 36, 74, '#5a5a66');
      g.fillStyle = '#d8d0b8'; g.fillRect(W / 2 - 20, 92, 40, 12); g.fillStyle = '#1a1a1e'; g.strokeStyle = '#1a1a1e'; g.strokeRect(W / 2 - 20 + 0.5, 92.5, 39, 11);
      txtL(g, 'OK', W / 2 - 4, 95, '#1a1a1e');
    }
    txt(g, 'ENTER = TILLBAKA', H - 12, '#8a8f9c');
  }
}
function txt(g, s, y, c, big = false, scale = 1) { const F = big ? BIG : SMALL; g.fillStyle = c; eachTextPixel(F, s, Math.round((W - textW(F, s, scale)) / 2), y, scale, (px, py) => g.fillRect(px, py, scale, scale)); }
function txtL(g, s, x, y, c) { g.fillStyle = c; eachTextPixel(SMALL, s, x, y, 1, (px, py) => g.fillRect(px, py, 1, 1)); }
function loadHs(id) { if (!id) return []; try { return JSON.parse(localStorage.getItem('pixelverkstan_hs_' + id) || '[]'); } catch { return []; } }
export const highscore = loadHs;
