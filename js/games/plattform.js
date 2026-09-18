// Plattform: spring åt höger, hoppa över tunnor och hål, ta mynt. (Donkey Kong, Mario, Sonic …)
import { W, H, R, hud, overBox, hit, rnd, irnd, clamp, dude } from './common.js';

export function create(skin = {}) {
  const g = { title: skin.title || 'PLATTFORM', score: 0, lives: 3, over: false, t: 0, cam: 0, dist: 0 };
  const GROUND = H - 24;
  const reset = () => {
    g.p = { x: 30, y: GROUND, vy: 0, w: 6, h: 14, onGround: true, fr: 0, dir: 1, inv: 0 };
    g.cam = 0; g.plats = []; g.foes = []; g.coins = []; g.holes = []; g.next = 120; g.spd = 60;
  };
  reset();
  const gen = () => {
    while (g.next < g.cam + W + 60) {
      const x = g.next, r = Math.random();
      if (r < 0.25) g.holes.push({ x, w: irnd(18, 30) });
      else if (r < 0.55) { const y = GROUND - irnd(28, 50); g.plats.push({ x, y, w: irnd(30, 60) }); for (let i = 0; i < 3; i++) g.coins.push({ x: x + 6 + i * 12, y: y - 12, w: 6, h: 6 }); }
      else if (r < 0.85) g.foes.push({ x: x + 20, y: GROUND, w: 8, h: 8, vx: -30 - rnd(0, 20), roll: 0 });
      else for (let i = 0; i < 4; i++) g.coins.push({ x: x + i * 10, y: GROUND - 24, w: 6, h: 6 });
      g.next += irnd(60, 110);
    }
  };
  const groundAt = (x) => g.holes.some((h) => x > h.x && x < h.x + h.w) ? H + 40 : GROUND;
  g.update = (dt, inp) => {
    g.t += dt;
    if (g.over) { if (inp.start) Object.assign(g, create(skin)); return; }
    const p = g.p;
    g.spd = 60 + Math.min(60, g.dist / 40);
    if (inp.right) { p.x += g.spd * dt; p.dir = 1; } if (inp.left) { p.x -= g.spd * 0.7 * dt; p.dir = -1; }
    p.x = clamp(p.x, g.cam + 4, g.cam + W - 10);
    if (inp.a && p.onGround) { p.vy = -175; p.onGround = false; }
    p.vy += 480 * dt; p.y += p.vy * dt;
    // mark och plattformar
    let floor = groundAt(p.x + 3);
    for (const pl of g.plats) if (p.x + 6 > pl.x && p.x < pl.x + pl.w && p.y - p.vy * dt <= pl.y && p.y >= pl.y) floor = Math.min(floor, pl.y);
    if (p.vy > 0 && p.y >= floor) { p.y = floor; p.vy = 0; p.onGround = true; } else p.onGround = false;
    if (p.y > H + 20) { g.lives--; if (g.lives <= 0) { g.over = true; return; } p.y = GROUND; p.vy = 0; p.x = g.cam + 30; p.inv = 2; g.holes = g.holes.filter((h) => h.x > p.x + 20); }
    p.fr = Math.floor(g.t * 8) % 2;
    p.inv = Math.max(0, p.inv - dt);
    // kameran följer
    if (p.x - g.cam > W * 0.4) g.cam = p.x - W * 0.4;
    g.dist = Math.max(g.dist, g.cam);
    gen();
    for (const f of g.foes) { f.x += f.vx * dt; f.roll += dt * 10; if (f.x < g.cam - 20) f.dead = true; }
    g.foes = g.foes.filter((f) => !f.dead);
    const pb = { x: p.x, y: p.y - p.h, w: p.w, h: p.h };
    for (const c of g.coins) if (hit(pb, c)) { c.dead = true; g.score += 10; }
    g.coins = g.coins.filter((c) => !c.dead);
    for (const f of g.foes) {
      const fb = { x: f.x, y: f.y - f.h, w: f.w, h: f.h };
      if (!hit(pb, fb)) continue;
      if (p.vy > 0 && p.y - p.h < f.y - f.h + 2) { f.dead = true; g.score += 50; p.vy = -120; }
      else if (p.inv <= 0) { g.lives--; p.inv = 2; if (g.lives <= 0) g.over = true; }
    }
    g.foes = g.foes.filter((f) => !f.dead);
    g.plats = g.plats.filter((x) => x.x + x.w > g.cam - 10); g.holes = g.holes.filter((x) => x.x + x.w > g.cam - 10); g.coins = g.coins.filter((x) => x.x > g.cam - 10);
    g.score = Math.max(g.score, Math.floor(g.dist / 10) + g.score % 10 + Math.floor(g.score / 10) * 10 - Math.floor(g.dist / 10) + Math.floor(g.dist / 10));
  };
  g.draw = (ctx) => {
    const sky = skin.sky || '#3a78d8', grd = skin.ground || '#5a8a3a';
    R(ctx, 0, 0, W, H, sky);
    for (let i = 0; i < 5; i++) { const cx = ((i * 70 - g.cam * 0.3) % (W + 40) + W + 40) % (W + 40) - 20; R(ctx, cx, 20 + i * 9, 18, 5, '#f4f2ec'); R(ctx, cx + 4, 17 + i * 9, 10, 3, '#f4f2ec'); }
    for (let i = 0; i < 8; i++) { const hx = ((i * 60 - g.cam * 0.5) % (W + 60) + W + 60) % (W + 60) - 30; R(ctx, hx, GROUND - 30, 40, 30, skin.hill || '#2f6f3a'); }
    const ox = -Math.round(g.cam);
    R(ctx, 0, GROUND, W, H - GROUND, grd); R(ctx, 0, GROUND, W, 2, '#3fb04a');
    for (const h of g.holes) R(ctx, h.x + ox, GROUND, h.w, H - GROUND, '#05060a');
    for (const pl of g.plats) { R(ctx, pl.x + ox, pl.y, pl.w, 6, skin.plat || '#c98a4a'); R(ctx, pl.x + ox, pl.y, pl.w, 1, '#e8c26a'); }
    for (const c of g.coins) { const sq = Math.floor(g.t * 6 + c.x) % 3; R(ctx, c.x + ox + sq, c.y, 6 - sq * 2, 6, '#f0e030'); }
    for (const f of g.foes) { R(ctx, f.x + ox, f.y - 8, 8, 8, skin.foe || '#c98a4a'); R(ctx, f.x + ox + 1 + Math.floor(f.roll) % 3, f.y - 6, 2, 4, '#5a3d2b'); }
    const p = g.p;
    if (p.inv <= 0 || Math.floor(g.t * 10) % 2) dude(ctx, p.x + ox + 3, p.y, p.dir, p.onGround ? p.fr : 1, skin.hero || '#e23b5a');
    hud(ctx, g.score, g.lives, `${Math.floor(g.dist / 10)} M`);
    if (g.over) overBox(ctx);
  };
  return g;
}
