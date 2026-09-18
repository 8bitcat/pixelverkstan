// Plattform: spring åt höger, hoppa, ta föremål – med varje titels egen hjälte, fiender, bana och
// känsla: Mario bumpar ?-block, Sonic accelererar, rullar och fjädrar, Mega Man skjuter, Kong rullar tunnor.
import { W, H, R, hud, overBox, hit, rnd, irnd, clamp } from './common.js';
import { hero as drawHero, foe as drawFoe, item as drawItem } from './sprites.js';

const mod = (a, n) => ((a % n) + n) % n;
export function create(skin = {}) {
  const S = { speed: 60, jump: 175, gravity: 480, hero: 'kid', foe: 'goomba', item: 'coin', bg: 'hills', stomp: true, shoot: false, springs: false, blocks: false, roll: false, kong: false, holes: 0.25, ...skin };
  const g = { title: S.title || 'PLATTFORM', score: 0, pts: 0, lives: 3, over: false, t: 0, cam: 0, dist: 0 };
  const GROUND = H - 24;
  const reset = () => { g.p = { x: 30, y: GROUND, vy: 0, vx: 0, w: 6, h: 14, onGround: true, fr: 0, dir: 1, inv: 0 }; g.cam = 0; g.plats = []; g.foes = []; g.coins = []; g.holes = []; g.blocks = []; g.springs = []; g.shots = []; g.next = 120; g.kongT = 1; };
  reset();
  const gen = () => {
    while (g.next < g.cam + W + 60) {
      const x = g.next, r = Math.random();
      if (r < S.holes) g.holes.push({ x, w: irnd(18, 30) });
      else if (r < 0.55) { const y = GROUND - irnd(28, 50); g.plats.push({ x, y, w: irnd(30, 60) }); for (let i = 0; i < 3; i++) g.coins.push({ x: x + 6 + i * 12, y: y - 12, w: 6, h: 6 }); if (S.blocks && Math.random() < 0.6) g.blocks.push({ x: x + 10, y: y - 30, w: 10, h: 10, used: false }); }
      else if (r < 0.85 && !S.kong) g.foes.push({ x: x + 20, y: GROUND, w: 8, h: 8, vx: -30 - rnd(0, 20), roll: 0, fly: S.foe === 'bat' });
      else for (let i = 0; i < 4; i++) g.coins.push({ x: x + i * 10, y: GROUND - 24, w: 6, h: 6 });
      if (S.springs && Math.random() < 0.3) g.springs.push({ x: x + 40, y: GROUND, w: 8, h: 6, t: 0 });
      g.next += irnd(60, 110);
    }
  };
  const groundAt = (x) => (g.holes.some((h) => x > h.x && x < h.x + h.w) ? H + 40 : GROUND);
  const die = () => { g.lives--; if (g.lives <= 0) { g.over = true; return; } const p = g.p; p.y = GROUND; p.vy = 0; p.vx = 0; p.x = g.cam + 30; p.inv = 2; g.holes = g.holes.filter((h) => h.x > p.x + 20); };
  g.update = (dt, inp) => {
    g.t += dt;
    if (g.over) { if (inp.start) Object.assign(g, create(skin)); return; }
    const p = g.p, top = S.speed + Math.min(60, g.dist / 40);
    // Sonic accelererar och rullar; de andra går i jämn takt
    if (S.roll) { if (inp.right) p.vx = Math.min(top, p.vx + top * 1.5 * dt); else if (inp.left) p.vx = Math.max(-top * 0.7, p.vx - top * 1.5 * dt); else p.vx *= Math.pow(0.02, dt); }
    else p.vx = inp.right ? top : inp.left ? -top * 0.7 : 0;
    if (p.vx > 1) p.dir = 1; else if (p.vx < -1) p.dir = -1;
    p.x = clamp(p.x + p.vx * dt, g.cam + 4, g.cam + W - 10);
    if (inp.a && p.onGround) { p.vy = -S.jump; p.onGround = false; }
    if (!inp.a && p.vy < -70 && !S.roll) p.vy = -70;   // kortare hopp när man släpper
    p.vy += S.gravity * dt; p.y += p.vy * dt;
    let floor = groundAt(p.x + 3);
    for (const pl of g.plats) if (p.x + 6 > pl.x && p.x < pl.x + pl.w && p.y - p.vy * dt <= pl.y && p.y >= pl.y) floor = Math.min(floor, pl.y);
    if (p.vy > 0 && p.y >= floor) { p.y = floor; p.vy = 0; p.onGround = true; } else p.onGround = false;
    // ?-block: bumpa underifrån
    for (const b of g.blocks) if (!b.used && p.vy < 0 && p.x + 6 > b.x && p.x < b.x + b.w && p.y - p.h <= b.y + b.h && p.y - p.h > b.y) { b.used = true; p.vy = 40; g.pts += 100; g.coins.push({ x: b.x + 2, y: b.y - 8, w: 6, h: 6, pop: 0.6 }); }
    for (const s of g.springs) if (p.vy >= 0 && hit({ x: p.x, y: p.y - 2, w: 6, h: 4 }, s)) { p.vy = -S.jump * 1.7; p.onGround = false; s.t = 0.3; }
    if (p.y > H + 20) { die(); if (g.over) return; }
    p.fr = S.roll && Math.abs(p.vx) > top * 0.8 && p.onGround ? 3 : Math.floor(g.t * 8) % 2;
    p.inv = Math.max(0, p.inv - dt);
    if (S.shoot && inp.bHit) g.shots.push({ x: p.x + 3 + p.dir * 5, y: p.y - 8, w: 4, h: 2, vx: p.dir * 220 });
    for (const s of g.shots) s.x += s.vx * dt;
    g.shots = g.shots.filter((s) => s.x > g.cam - 10 && s.x < g.cam + W + 10);
    if (p.x - g.cam > W * 0.4) g.cam = p.x - W * 0.4;
    g.dist = Math.max(g.dist, g.cam);
    gen();
    // Kong: tunnor rullar in från höger och faller ner på marken
    if (S.kong) { g.kongT -= dt; if (g.kongT <= 0) { g.kongT = rnd(1.1, 2); g.foes.push({ x: g.cam + W + 10, y: GROUND - 60, w: 8, h: 8, vx: -(70 + Math.min(60, g.dist / 30)), roll: 0, drop: true }); } }
    for (const f of g.foes) {
      f.x += f.vx * dt; f.roll += dt * 10;
      if (f.fly) f.y = GROUND - 20 + Math.sin(g.t * 3 + f.x) * 12;
      else if (f.drop) f.y = Math.min(GROUND, f.y + 120 * dt);
      if (f.x < g.cam - 20) f.dead = true;
      for (const s of g.shots) if (!s.dead && hit(s, { x: f.x, y: f.y - f.h, w: f.w, h: f.h })) { s.dead = true; f.dead = true; g.pts += 50; }
    }
    g.shots = g.shots.filter((s) => !s.dead); g.foes = g.foes.filter((f) => !f.dead);
    const pb = { x: p.x, y: p.y - p.h, w: p.w, h: p.h };
    for (const c of g.coins) { if (c.pop != null) { c.pop -= dt; c.y -= 30 * dt; if (c.pop <= 0) c.dead = true; continue; } if (hit(pb, c)) { c.dead = true; g.pts += 10; } }
    g.coins = g.coins.filter((c) => !c.dead);
    for (const f of g.foes) {
      if (!hit(pb, { x: f.x, y: f.y - f.h, w: f.w, h: f.h })) continue;
      if (S.stomp && p.vy > 0 && p.y - p.h < f.y - f.h + 2 && !f.drop) { f.dead = true; g.pts += 50; p.vy = -120; }
      else if (p.fr === 3 && S.roll) { f.dead = true; g.pts += 50; }
      else if (p.inv <= 0) { g.lives--; p.inv = 2; if (g.lives <= 0) g.over = true; }
    }
    g.foes = g.foes.filter((f) => !f.dead);
    for (const s of g.springs) s.t = Math.max(0, s.t - dt);
    g.plats = g.plats.filter((x) => x.x + x.w > g.cam - 10); g.holes = g.holes.filter((x) => x.x + x.w > g.cam - 10); g.coins = g.coins.filter((x) => x.x > g.cam - 10); g.blocks = g.blocks.filter((x) => x.x > g.cam - 20); g.springs = g.springs.filter((x) => x.x > g.cam - 20);
    g.score = g.pts + Math.floor(g.dist / 10);
  };
  const bgDraw = (ctx) => {
    const bg = S.bg, px = (i, n, sp) => mod(i * n - g.cam * sp, W + n) - n / 2;
    R(ctx, 0, 0, W, H, S.sky || '#3a78d8');
    if (bg === 'hills' || bg === 'toy') {
      for (let i = 0; i < 5; i++) { const cx = px(i, 70, 0.3); R(ctx, cx, 20 + i * 9, 18, 5, '#f4f2ec'); R(ctx, cx + 4, 17 + i * 9, 10, 3, '#f4f2ec'); }
      for (let i = 0; i < 8; i++) { const hx = px(i, 60, 0.5); R(ctx, hx, GROUND - 30, 40, 30, S.hill || '#2f6f3a'); R(ctx, hx + 8, GROUND - 38, 24, 8, S.hill || '#2f6f3a'); }
    } else if (bg === 'city') {
      for (let i = 0; i < 10; i++) { const bx = px(i, 44, 0.4), h = 40 + (i * 13) % 50; R(ctx, bx, GROUND - h, 30, h, '#3a3a5a'); for (let w = 0; w < 4; w++) for (let k = 0; k < Math.floor(h / 10); k++) if ((i + w + k) % 3) R(ctx, bx + 4 + w * 7, GROUND - h + 4 + k * 10, 3, 4, '#f0e030'); }
    } else if (bg === 'castle') {
      for (let y = 10; y < GROUND; y += 8) for (let x = -16; x < W; x += 16) R(ctx, x + (Math.floor(y / 8) % 2) * 8 - mod(Math.round(g.cam * 0.3), 16), y, 14, 6, '#3a3a44');
    } else if (bg === 'jungle') {
      for (let i = 0; i < 8; i++) { const tx = px(i, 56, 0.5); R(ctx, tx + 8, GROUND - 60, 6, 60, '#5a3d2b'); R(ctx, tx - 4, GROUND - 74, 30, 18, '#2f8f46'); R(ctx, tx, GROUND - 80, 22, 8, '#3fb04a'); }
    } else if (bg === 'cave') {
      for (let i = 0; i < 12; i++) { const sx = px(i, 40, 0.6); R(ctx, sx, 9, 6, 10 + (i * 7) % 14, '#3a2a2a'); R(ctx, sx + 2, 9, 2, 16 + (i * 7) % 14, '#5a4a4a'); }
    } else if (bg === 'space') {
      for (let i = 0; i < 40; i++) R(ctx, mod(i * 53 - g.cam * 0.2, W), (i * 37) % (GROUND - 10), 1, 1, '#f4f2ec');
      R(ctx, px(1, 200, 0.1), 20, 24, 24, '#c8c8d0'); R(ctx, px(1, 200, 0.1) + 6, 26, 6, 6, '#8a8f9c');
    } else if (bg === 'desert') {
      R(ctx, W - 40, 16, 14, 14, '#f0e030');
      for (let i = 0; i < 6; i++) { const dx = px(i, 90, 0.4); R(ctx, dx, GROUND - 16, 60, 16, '#e0b040'); R(ctx, dx + 10, GROUND - 24, 40, 8, '#e0b040'); }
    } else if (bg === 'lab') {
      for (let x = -24; x < W; x += 24) R(ctx, x + 24 - mod(Math.round(g.cam * 0.5), 24), 12, 20, GROUND - 14, '#4a4a56');
      for (let i = 0; i < 6; i++) R(ctx, px(i, 48, 0.5), 30, 8, 3, Math.floor(g.t * 2 + i) % 2 ? '#3fb04a' : '#e23b5a');
    } else if (bg === 'snow') {
      for (let i = 0; i < 8; i++) R(ctx, px(i, 60, 0.5), GROUND - 30, 40, 30, '#e8f0f8');
      for (let i = 0; i < 20; i++) R(ctx, (i * 41 + Math.round(g.t * 10)) % W, (i * 29 + Math.round(g.t * 20)) % GROUND, 1, 1, '#f4f2ec');
    }
  };
  g.draw = (ctx) => {
    bgDraw(ctx);
    const ox = -Math.round(g.cam), grd = S.ground || '#5a8a3a';
    R(ctx, 0, GROUND, W, H - GROUND, grd); R(ctx, 0, GROUND, W, 2, S.bg === 'hills' || S.bg === 'jungle' || S.bg === 'toy' ? '#3fb04a' : S.bg === 'snow' ? '#f4f2ec' : 'rgba(255,255,255,.25)');
    for (const h of g.holes) R(ctx, h.x + ox, GROUND, h.w, H - GROUND, '#05060a');
    for (const pl of g.plats) { R(ctx, pl.x + ox, pl.y, pl.w, 6, S.plat || '#c98a4a'); R(ctx, pl.x + ox, pl.y, pl.w, 1, '#e8c26a'); }
    for (const b of g.blocks) { R(ctx, b.x + ox, b.y, b.w, b.h, b.used ? '#8a6a3a' : '#e0a02a'); if (!b.used) { R(ctx, b.x + ox + 3, b.y + 2, 4, 2, '#5a3d2b'); R(ctx, b.x + ox + 5, b.y + 4, 2, 2, '#5a3d2b'); R(ctx, b.x + ox + 4, b.y + 7, 2, 1, '#5a3d2b'); } }
    for (const s of g.springs) { R(ctx, s.x + ox, s.y - 6 + (s.t ? 3 : 0), 8, 2, '#f0e030'); R(ctx, s.x + ox + 2, s.y - 4 + (s.t ? 2 : 0), 4, 4 - (s.t ? 2 : 0), '#e23b5a'); }
    for (const c of g.coins) drawItem(ctx, S.item, Math.round(c.x + ox), Math.round(c.y), g.t);
    for (const f of g.foes) drawFoe(ctx, S.foe, Math.round(f.x + ox), Math.round(f.y), Math.floor(f.roll) % 2, S.foeCol || '#c98a4a');
    for (const s of g.shots) R(ctx, s.x + ox, s.y, 4, 2, '#f0e030');
    if (S.kong) { R(ctx, W - 48, 12, 48, 5, '#e23b5a'); drawHero(ctx, 'ape', W - 22, 12, -1, Math.floor(g.t * 2) % 2, '#5a3d2b'); }
    const p = g.p;
    if (p.inv <= 0 || Math.floor(g.t * 10) % 2) drawHero(ctx, S.hero, Math.round(p.x + ox + 3), Math.round(p.y), p.dir, p.onGround ? p.fr : (p.fr === 3 ? 3 : 2), S.heroCol || '#e23b5a');
    hud(ctx, g.score, g.lives, `${Math.floor(g.dist / 10)} M${S.shoot ? '   B = SKJUT' : ''}`);
    if (g.over) overBox(ctx);
  };
  return g;
}
