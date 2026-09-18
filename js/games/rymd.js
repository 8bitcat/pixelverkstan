// Rymdskjutare: rader av fiender som marscherar, bomber, vågor. (Space Invaders / Galaga)
import { W, H, R, text, hud, overBox, hit, rnd, irnd, clamp } from './common.js';

export function create(skin = {}, opts = {}) {
  const dive = !!skin.dive;   // galaga-läge: fiender dyker
  const g = {
    title: skin.title || 'RYMD', score: 0, lives: 3, over: false, wave: 1, t: 0,
    ship: { x: W / 2 - 4, y: H - 14, w: 8, h: 6 }, shots: [], bombs: [], enemies: [], dir: 1, speed: 12, cool: 0, hitT: 0, stars: [],
  };
  for (let i = 0; i < 40; i++) g.stars.push([irnd(0, W), irnd(0, H), rnd(4, 20)]);
  const spawn = () => {
    g.enemies = [];
    for (let r = 0; r < 3 + Math.min(2, g.wave - 1); r++) for (let c = 0; c < 7; c++) g.enemies.push({ x: 30 + c * 24, y: 16 + r * 13, w: 10, h: 7, r, dive: null, fr: 0 });
    g.speed = 12 + g.wave * 4; g.dir = 1;
  };
  spawn();
  const cols = ['#e23b5a', '#f0e030', '#3fb04a', '#3a78d8', '#b58cff'];
  g.update = (dt, inp) => {
    g.t += dt;
    for (const s of g.stars) { s[1] += s[2] * dt; if (s[1] > H) { s[1] = 0; s[0] = irnd(0, W); } }
    if (g.over) { if (inp.start) Object.assign(g, create(skin, opts)); return; }
    const sh = g.ship;
    if (inp.left) sh.x -= 90 * dt; if (inp.right) sh.x += 90 * dt;
    sh.x = clamp(sh.x, 2, W - 10);
    g.cool -= dt;
    if (inp.a && g.cool <= 0 && g.shots.length < 3) { g.shots.push({ x: sh.x + 3, y: sh.y - 4, w: 2, h: 5 }); g.cool = 0.28; }
    for (const s of g.shots) s.y -= 160 * dt;
    g.shots = g.shots.filter((s) => s.y > -6);
    // fiender marscherar
    let edge = false;
    for (const e of g.enemies) {
      if (e.dive) { e.dive.t += dt; e.x += Math.sin(e.dive.t * 4) * 60 * dt; e.y += 45 * dt; if (e.y > H) { e.y = 10; e.dive = null; } continue; }
      e.x += g.dir * g.speed * dt; if (e.x < 4 || e.x > W - 14) edge = true;
      e.fr = Math.floor(g.t * 3) % 2;
    }
    if (edge) { g.dir *= -1; for (const e of g.enemies) if (!e.dive) e.y += 4; }
    if (dive && Math.random() < dt * 0.4 && g.enemies.length) { const e = g.enemies[irnd(0, g.enemies.length - 1)]; if (!e.dive) e.dive = { t: 0 }; }
    if (Math.random() < dt * (0.6 + g.wave * 0.2) && g.enemies.length) { const e = g.enemies[irnd(0, g.enemies.length - 1)]; g.bombs.push({ x: e.x + 4, y: e.y + 6, w: 2, h: 4 }); }
    for (const b of g.bombs) b.y += 70 * dt;
    g.bombs = g.bombs.filter((b) => b.y < H);
    // träffar
    for (const s of g.shots) for (const e of g.enemies) if (!e.dead && hit(s, e)) { e.dead = true; s.dead = true; g.score += e.dive ? 150 : 10 + (2 - Math.min(2, e.r)) * 10; }
    g.shots = g.shots.filter((s) => !s.dead); g.enemies = g.enemies.filter((e) => !e.dead);
    g.hitT -= dt;
    if (g.hitT <= 0) for (const b of g.bombs) if (hit(b, sh)) { b.dead = true; g.lives--; g.hitT = 1.5; if (g.lives <= 0) g.over = true; }
    for (const e of g.enemies) if (e.y + e.h >= sh.y && !e.dive) { g.lives = 0; g.over = true; }
    g.bombs = g.bombs.filter((b) => !b.dead);
    if (!g.enemies.length) { g.wave++; g.score += 100; spawn(); }
  };
  g.draw = (ctx) => {
    R(ctx, 0, 0, W, H, skin.bg || '#05060a');
    for (const s of g.stars) R(ctx, s[0], s[1], 1, 1, '#4a4a66');
    for (const e of g.enemies) {
      const c = cols[e.r % cols.length];
      R(ctx, e.x, e.y, 10, 2, c); R(ctx, e.x + (e.fr ? 1 : 0), e.y + 2, 10 - (e.fr ? 2 : 0), 3, c);
      R(ctx, e.x + 2, e.y + 5, 2, 2, c); R(ctx, e.x + 6, e.y + 5, 2, 2, c); R(ctx, e.x + 3, e.y + 2, 1, 1, '#05060a'); R(ctx, e.x + 6, e.y + 2, 1, 1, '#05060a');
    }
    for (const s of g.shots) R(ctx, s.x, s.y, 2, 5, '#f4f2ec');
    for (const b of g.bombs) R(ctx, b.x, b.y, 2, 4, '#f0e030');
    const sh = g.ship;
    if (g.hitT <= 0 || Math.floor(g.t * 10) % 2) { R(ctx, sh.x, sh.y + 2, 8, 4, '#3fb04a'); R(ctx, sh.x + 3, sh.y, 2, 3, '#3fb04a'); R(ctx, sh.x + 1, sh.y + 6, 6, 1, '#2f8f46'); }
    for (let i = 0; i < 3; i++) R(ctx, 30 + i * 80, H - 26, 18, 5, '#3fb04a');
    hud(ctx, g.score, g.lives, 'VÅG ' + g.wave);
    if (g.over) overBox(ctx);
  };
  return g;
}
