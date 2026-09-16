// Butiksgolvet: ritar butiken i 256×192 pixlar och flyttar kunderna mellan
// dörr → kö → väntplats → utlämning → dörr.
import { drawPerson, SHOPKEEPER } from './people.js';
import { drawText, textWidth } from './pixfont.js';

export const FW = 256, FH = 192;
const DOOR_IN = [236, 172], OUTSIDE = [272, 172];
const QUEUE = [[128, 100], [128, 124], [128, 148]];
const PICKUP = [184, 100];
const SEATS = [[24, 150], [44, 150], [64, 150], [24, 178], [44, 178]];
const SPEED = 40;

export class Floor {
  constructor(canvas, game) {
    this.canvas = canvas; this.game = game; this.shop = game.shop;
    this.buf = document.createElement('canvas'); this.buf.width = FW; this.buf.height = FH;
    this.ctx = this.buf.getContext('2d');
    this.particles = [];
    this.onCustomerClick = null;
    this.t = 0;
    canvas.addEventListener('pointerdown', (e) => this.click(e));
    canvas.addEventListener('pointermove', (e) => { const c = this.hit(e); canvas.style.cursor = c && this.clickable(c) ? 'pointer' : 'default'; });
  }

  // ---------- Logik ----------
  target(c) {
    const g = this.game;
    if (c.phase === 'arriving' || c.phase === 'queue') {
      const i = Math.min(g.queue().indexOf(c), QUEUE.length - 1);
      return QUEUE[Math.max(0, i)];
    }
    if (c.phase === 'waiting') {
      const w = g.customers.filter((x) => x.phase === 'waiting');
      return SEATS[Math.min(w.indexOf(c), SEATS.length - 1)];
    }
    if (c.phase === 'ready') return PICKUP;
    return OUTSIDE;
  }

  update(dt) {
    this.t += dt;
    const g = this.game;
    for (const c of [...g.customers]) {
      let [tx, ty] = this.target(c);
      // gå via dörren när man är utanför eller på väg ut
      const outside = c.x > 240;
      if ((outside && tx < 240) || (c.phase === 'leaving' && c.x < 230)) {
        if (Math.hypot(c.x - DOOR_IN[0], c.y - DOOR_IN[1]) > 3) [tx, ty] = DOOR_IN;
      }
      const dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy);
      if (d > 0.8) {
        const s = Math.min(d, SPEED * dt);
        c.x += dx / d * s; c.y += dy / d * s;
        c.walk += dt * 8;
        c.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
        c.moving = true;
      } else {
        c.moving = false;
        if (c.phase === 'arriving') c.phase = 'queue';
        if (c.phase === 'queue') c.dir = 'up';
        if (c.phase === 'waiting') c.dir = 'down';
        if (c.phase === 'ready' && c.payout) {
          c.dir = 'up';
          const p = c.payout; c.payout = null;
          this.coins(c.x, c.y - 22, Math.min(14, 4 + Math.floor(p.total / 1500)));
          g.pay(p, c);
          c.phase = 'leaving'; c.mood = 'happy'; c.bubbleT = 3;
        }
        if (c.phase === 'leaving' && c.x > 265) g.customers.splice(g.customers.indexOf(c), 1);
      }
      if (c.bubbleT > 0) c.bubbleT -= dt;
    }
    for (const p of this.particles) { p.vy += 260 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  coins(x, y, n) {
    for (let i = 0; i < n; i++) this.particles.push({ x, y, vx: (Math.random() - 0.5) * 70, vy: -90 - Math.random() * 70, life: 0.9 + Math.random() * 0.4 });
  }

  // ---------- Input ----------
  toLocal(e) {
    const r = this.canvas.getBoundingClientRect();
    return [(e.clientX - r.left - this.offX) / this.scale, (e.clientY - r.top - this.offY) / this.scale];
  }
  hit(e) {
    const [x, y] = this.toLocal(e);
    let best = null;
    for (const c of this.game.customers) {
      if (x > c.x - 7 && x < c.x + 7 && y > c.y - 30 && y < c.y + 2) if (!best || c.y > best.y) best = c;
    }
    return best;
  }
  clickable(c) { return c.phase === 'queue' && this.game.queue()[0] === c; }
  click(e) {
    const c = this.hit(e);
    if (c && this.onCustomerClick) this.onCustomerClick(c);
  }

  // ---------- Rendering ----------
  resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
    const top = 52, bottom = w < 760 ? Math.min(h * 0.36, 230) : 10;
    const sc = Math.min(w / FW, (h - top - bottom) / FH);
    this.scale = sc >= 2 ? Math.floor(sc * 2) / 2 : sc;
    this.offX = Math.round((w - FW * this.scale) / 2);
    this.offY = Math.round(top + (h - top - bottom - FH * this.scale) / 2);
    if (w >= 760) this.offX = Math.max(10, Math.min(this.offX, w - 310 - FW * this.scale));
    this.dpr = dpr;
  }

  draw() {
    const ctx = this.ctx, g = this.game, th = this.shop.theme;
    this.drawRoom(ctx, th);
    // y-sorterade figurer + möbler
    const sprites = [];
    sprites.push({ y: 69, draw: () => drawPerson(ctx, 128, 69, SHOPKEEPER, 'down', Math.floor(this.t * 1.5) % 8 === 0 ? 1 : 0) });
    sprites.push({ y: 84, draw: () => this.drawCounter(ctx, th) });
    for (const [sx, sy] of SEATS) sprites.push({ y: sy - 3, draw: () => this.drawChair(ctx, sx, sy) });
    sprites.push({ y: 186, draw: () => this.drawShowcase(ctx) });
    for (const [px, py] of [[12, 60], [244, 60], [86, 150]]) sprites.push({ y: py, draw: () => this.drawPlant(ctx, px, py) });
    for (const c of g.customers) sprites.push({ y: c.y, draw: () => this.drawCustomer(ctx, c) });
    sprites.sort((a, b) => a.y - b.y);
    for (const s of sprites) s.draw();
    // ovanpå: bubblor
    for (const c of g.customers) this.drawBubble(ctx, c);
    ctx.fillStyle = '#f5c542';
    for (const p of this.particles) { ctx.fillRect(p.x | 0, p.y | 0, 3, 3); ctx.fillStyle = '#b8860b'; ctx.fillRect((p.x | 0) + 2, (p.y | 0) + 2, 1, 1); ctx.fillStyle = '#f5c542'; }

    const out = this.canvas.getContext('2d');
    out.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    out.fillStyle = '#2a2433'; out.fillRect(0, 0, this.canvas.width, this.canvas.height);
    out.imageSmoothingEnabled = false;
    out.drawImage(this.buf, this.offX, this.offY, FW * this.scale, FH * this.scale);
  }

  drawRoom(ctx, th) {
    // golv
    for (let y = 46; y < FH; y += 12) for (let x = 0; x < FW; x += 16) {
      ctx.fillStyle = ((x / 16 + (y - 46) / 12) & 1) ? th.floorA : th.floorB;
      ctx.fillRect(x, y, 16, 12);
    }
    // bakvägg
    ctx.fillStyle = th.wall; ctx.fillRect(0, 0, FW, 46);
    ctx.fillStyle = th.wallDark; ctx.fillRect(0, 42, FW, 4);
    for (let x = 0; x < FW; x += 8) { ctx.fillStyle = 'rgba(255,255,255,.04)'; ctx.fillRect(x, 0, 1, 42); }
    // sidoväggar + entrédörr
    ctx.fillStyle = th.wallDark; ctx.fillRect(0, 46, 4, FH - 46); ctx.fillRect(FW - 4, 46, 4, FH - 46);
    ctx.fillStyle = '#9fd8ef'; ctx.fillRect(FW - 4, 152, 4, 36);
    ctx.fillStyle = '#c8b27a'; ctx.fillRect(222, 186, 30, 6); // dörrmatta
    // matta vid kön
    ctx.fillStyle = '#7a1d24'; ctx.fillRect(110, 88, 36, 68); ctx.fillStyle = '#9e1b22'; ctx.fillRect(112, 90, 32, 64);
    ctx.fillStyle = '#e8b230'; for (let y = 94; y < 152; y += 8) ctx.fillRect(126, y, 4, 2);
    // neonskylt
    const sign = this.shop.sign, sw = textWidth(sign, 2);
    const sx = Math.round((FW - sw) / 2);
    ctx.fillStyle = '#1b1f2a'; ctx.fillRect(sx - 6, 3, sw + 12, 16);
    const glow = 0.75 + 0.25 * Math.sin(this.t * 3);
    ctx.globalAlpha = 0.35 * glow; drawText(ctx, sign, sx + 1, 7, th.neon, 2); ctx.globalAlpha = 1;
    drawText(ctx, sign, sx, 6, th.neon, 2);
    // verkstadsdörr bakom disken
    ctx.fillStyle = '#1b1f2a'; ctx.fillRect(109, 21, 38, 8);
    drawText(ctx, 'VERKSTAD', 113, 22, '#e8b230');
    ctx.fillStyle = '#5a3d2b'; ctx.fillRect(114, 29, 28, 15); ctx.fillStyle = '#6e4b35'; ctx.fillRect(116, 31, 11, 13); ctx.fillRect(129, 31, 11, 13);
    ctx.fillStyle = '#e8b230'; ctx.fillRect(125, 37, 2, 2);
    // hyllor med lagret
    this.drawShelf(ctx, 5, 12, 0); this.drawShelf(ctx, 183, 12, 1);
  }

  drawShelf(ctx, x, y, side) {
    const g = this.game, cats = this.shop.catOrder;
    const mine = cats.filter((_, i) => i % 2 === side);
    ctx.fillStyle = '#6b4a33'; ctx.fillRect(x, y, 68, 32);
    ctx.fillStyle = '#4e3524'; ctx.fillRect(x + 2, y + 2, 64, 28);
    mine.forEach((cat, r) => {
      const n = this.shop.parts.filter((p) => p.cat === cat).reduce((s, p) => s + g.stockFree(p.id), 0);
      const col = this.shop.cats[cat].color;
      const row = y + 2 + r * 7;
      ctx.fillStyle = '#8a6448'; ctx.fillRect(x + 2, row + 6, 64, 1);
      for (let i = 0; i < Math.min(n, 10); i++) {
        ctx.fillStyle = col; ctx.fillRect(x + 4 + i * 6, row + 1, 5, 5);
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x + 4 + i * 6, row + 1, 5, 1);
      }
    });
  }

  drawCounter(ctx, th) {
    ctx.fillStyle = '#1d1a20'; ctx.fillRect(58, 70, 142, 16);
    ctx.fillStyle = '#e8e1d2'; ctx.fillRect(60, 64, 138, 8);      // bänkskiva
    ctx.fillStyle = '#cfc6b3'; ctx.fillRect(60, 71, 138, 1);
    ctx.fillStyle = th.counter; ctx.fillRect(60, 72, 138, 12);    // front
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(60, 81, 138, 3);
    ctx.fillStyle = '#e8b230'; ctx.fillRect(60, 75, 138, 1);
    drawText(ctx, 'BESTÄLL', 90, 77, '#fff');
    drawText(ctx, 'UTLÄMNING', 155, 77, '#fff');
    // kassa
    ctx.fillStyle = '#3a3d42'; ctx.fillRect(146, 58, 14, 8); ctx.fillStyle = '#7ee8a0'; ctx.fillRect(148, 59, 10, 3);
    // skärm
    ctx.fillStyle = '#23262b'; ctx.fillRect(86, 54, 18, 11); ctx.fillStyle = '#3c78d8'; ctx.fillRect(88, 56, 14, 7);
    ctx.fillStyle = '#23262b'; ctx.fillRect(94, 65, 2, 1);
    // en dator som visas upp
    ctx.fillStyle = '#2a2c30'; ctx.fillRect(66, 52, 10, 13); ctx.fillStyle = '#7ee8fa'; ctx.fillRect(68, 54, 1, 9); ctx.fillStyle = '#e07a2e'; ctx.fillRect(71, 56, 3, 3);
  }

  drawPlant(ctx, x, y) {
    const sway = Math.round(Math.sin(this.t * 1.3 + x) * 0.6);
    ctx.fillStyle = '#b5652f'; ctx.fillRect(x - 4, y - 6, 8, 6); ctx.fillStyle = '#8c4a22'; ctx.fillRect(x - 4, y - 6, 8, 1);
    ctx.fillStyle = '#2f8f46'; ctx.fillRect(x - 5 + sway, y - 12, 4, 6); ctx.fillRect(x + 1 + sway, y - 13, 4, 7); ctx.fillRect(x - 2 + sway, y - 16, 4, 9);
    ctx.fillStyle = '#45b964'; ctx.fillRect(x - 1 + sway, y - 15, 2, 5); ctx.fillRect(x + 2 + sway, y - 12, 2, 3);
  }

  drawChair(ctx, x, y) {
    ctx.fillStyle = '#2c6fb7'; ctx.fillRect(x - 7, y - 6, 14, 5);
    ctx.fillStyle = '#1f4f85'; ctx.fillRect(x - 7, y - 1, 14, 2); ctx.fillRect(x - 6, y + 1, 2, 3); ctx.fillRect(x + 4, y + 1, 2, 3);
  }

  drawShowcase(ctx) {
    ctx.fillStyle = '#6b4a33'; ctx.fillRect(170, 176, 44, 12);
    ctx.fillStyle = '#8a6448'; ctx.fillRect(170, 174, 44, 3);
    ctx.fillStyle = '#1b1b1b'; ctx.fillRect(178, 160, 12, 15);
    const hue = (this.t * 90) % 360;
    ctx.fillStyle = `hsl(${hue},90%,60%)`; ctx.fillRect(180, 162, 1, 11);
    ctx.fillStyle = '#23262b'; ctx.fillRect(194, 162, 16, 11); ctx.fillStyle = '#6ad26a'; ctx.fillRect(196, 164, 12, 7);
  }

  drawCustomer(ctx, c) {
    const frame = c.moving ? (Math.floor(c.walk) % 2) + 1 : 0;
    drawPerson(ctx, c.x, c.y, c.look, c.dir, frame);
  }

  drawBubble(ctx, c) {
    const x = Math.round(c.x), top = Math.round(c.y) - 26 + (c.look.kid ? 3 : 0);
    if (this.clickable(c) && !c.moving) {
      const bob = Math.round(Math.sin(this.t * 6) * 1.5);
      ctx.fillStyle = '#17151a'; ctx.fillRect(x - 5, top - 10 + bob, 11, 11);
      ctx.fillStyle = '#e8b230'; ctx.fillRect(x - 4, top - 9 + bob, 9, 9);
      ctx.fillStyle = '#17151a'; ctx.fillRect(x, top - 8 + bob, 1, 4); ctx.fillRect(x, top - 3 + bob, 1, 1);
      ctx.fillRect(x - 1, top + 1 + bob, 3, 1);
    } else if (c.phase === 'queue' && !c.moving) {
      ctx.fillStyle = '#17151a'; ctx.fillRect(x + 5, top + 1, 11, 7);
      ctx.fillStyle = '#fff'; ctx.fillRect(x + 6, top + 2, 9, 5);
      ctx.fillStyle = '#17151a'; for (let i = 0; i < 3; i++) if (Math.floor(this.t * 2) % 4 > i) ctx.fillRect(x + 7 + i * 3, top + 4, 1, 1);
    }
    // tålamodsmätare
    if ((c.phase === 'queue' || c.phase === 'waiting') && isFinite(c.patienceMax) && !c.moving) {
      const f = Math.max(0, c.patience / c.patienceMax);
      ctx.fillStyle = '#17151a'; ctx.fillRect(x - 17, top + 3, 4, 12);
      ctx.fillStyle = f > 0.35 ? '#45b964' : '#c9323a'; const hgt = Math.round(10 * f); ctx.fillRect(x - 16, top + 4 + 10 - hgt, 2, hgt);
    }
    if (c.phase === 'waiting' && !c.moving) {
      ctx.fillStyle = '#fff'; ctx.fillRect(x - 3, top - 5, 7, 6);
      ctx.fillStyle = '#6b7684'; ctx.fillRect(x - 2, top - 4, 5, 3); ctx.fillRect(x - 1, top, 3, 1); // liten skärm-ikon
    }
    if (c.mood && c.bubbleT > 0) {
      const y = top - 8 - Math.round((3 - c.bubbleT) * 3);
      if (c.mood === 'happy') { ctx.fillStyle = '#e23b5a'; ctx.fillRect(x - 3, y, 2, 2); ctx.fillRect(x + 1, y, 2, 2); ctx.fillRect(x - 3, y + 1, 6, 2); ctx.fillRect(x - 2, y + 3, 4, 1); ctx.fillRect(x - 1, y + 4, 2, 1); }
      if (c.mood === 'sad') { ctx.fillStyle = '#58a6c9'; ctx.fillRect(x, y, 1, 1); ctx.fillRect(x - 1, y + 1, 3, 2); }
      if (c.mood === 'angry') { ctx.fillStyle = '#c9323a'; ctx.fillRect(x - 3, y, 2, 1); ctx.fillRect(x + 2, y, 2, 1); ctx.fillRect(x - 2, y + 1, 1, 1); ctx.fillRect(x + 2, y + 1, 1, 1); ctx.fillRect(x - 1, y + 3, 3, 1); }
    }
  }
}
