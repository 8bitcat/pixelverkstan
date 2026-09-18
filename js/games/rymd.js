// Rymdskjutare i fyra lägen: 'march' (Space Invaders), 'dive' (Galaga), 'river' (River Raid:
// flod som rullar, bränsle, båtar) och 'horde' (fiender från alla håll, automatisk eld – StarCraft, Vampire Survivors).
import { W, H, R, text, hud, overBox, hit, rnd, irnd, clamp } from './common.js';
import { hero as drawHero, foe as drawFoe } from './sprites.js';

export function create(skin = {}, opts = {}) {
  const S = { mode: skin.dive ? 'dive' : 'march', ...skin };
  if (S.mode === 'river') return river(S, skin);
  if (S.mode === 'horde') return horde(S, skin);
  const dive = S.mode === 'dive';
  const g = { title: S.title || 'RYMD', score: 0, lives: 3, over: false, wave: 1, t: 0, ship: { x: W / 2 - 4, y: H - 14, w: 8, h: 6 }, shots: [], bombs: [], enemies: [], dir: 1, speed: 12, cool: 0, hitT: 0, stars: [] };
  for (let i = 0; i < 40; i++) g.stars.push([irnd(0, W), irnd(0, H), rnd(4, 20)]);
  const spawn = () => { g.enemies = []; for (let r = 0; r < 3 + Math.min(2, g.wave - 1); r++) for (let c = 0; c < 7; c++) g.enemies.push({ x: 30 + c * 24, y: 16 + r * 13, w: 10, h: 7, r, dive: null, fr: 0 }); g.speed = 12 + g.wave * 4; g.dir = 1; };
  spawn();
  const cols = S.foeCol ? [S.foeCol, '#f0e030', '#3fb04a', '#3a78d8', '#b58cff'] : ['#e23b5a', '#f0e030', '#3fb04a', '#3a78d8', '#b58cff'];
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
    for (const s of g.shots) for (const e of g.enemies) if (!e.dead && hit(s, e)) { e.dead = true; s.dead = true; g.score += e.dive ? 150 : 10 + (2 - Math.min(2, e.r)) * 10; }
    g.shots = g.shots.filter((s) => !s.dead); g.enemies = g.enemies.filter((e) => !e.dead);
    g.hitT -= dt;
    if (g.hitT <= 0) for (const b of g.bombs) if (hit(b, sh)) { b.dead = true; g.lives--; g.hitT = 1.5; if (g.lives <= 0) g.over = true; }
    for (const e of g.enemies) if (e.y + e.h >= sh.y && !e.dive) { g.lives = 0; g.over = true; }
    g.bombs = g.bombs.filter((b) => !b.dead);
    if (!g.enemies.length) { g.wave++; g.score += 100; spawn(); }
  };
  g.draw = (ctx) => {
    R(ctx, 0, 0, W, H, S.bg || '#05060a');
    for (const s of g.stars) R(ctx, s[0], s[1], 1, 1, '#4a4a66');
    for (const e of g.enemies) {
      const c = cols[e.r % cols.length];
      if (dive) { R(ctx, e.x + 3, e.y, 4, 7, c); R(ctx, e.x + (e.fr ? 0 : 1), e.y + 2, 3, 3, c); R(ctx, e.x + 7 - (e.fr ? 0 : 1), e.y + 2, 3, 3, c); R(ctx, e.x + 4, e.y + 2, 2, 2, '#f4f2ec'); }
      else { R(ctx, e.x, e.y, 10, 2, c); R(ctx, e.x + (e.fr ? 1 : 0), e.y + 2, 10 - (e.fr ? 2 : 0), 3, c); R(ctx, e.x + 2, e.y + 5, 2, 2, c); R(ctx, e.x + 6, e.y + 5, 2, 2, c); R(ctx, e.x + 3, e.y + 2, 1, 1, '#05060a'); R(ctx, e.x + 6, e.y + 2, 1, 1, '#05060a'); }
    }
    for (const s of g.shots) R(ctx, s.x, s.y, 2, 5, '#f4f2ec');
    for (const b of g.bombs) R(ctx, b.x, b.y, 2, 4, '#f0e030');
    const sh = g.ship;
    if (g.hitT <= 0 || Math.floor(g.t * 10) % 2) { R(ctx, sh.x, sh.y + 2, 8, 4, dive ? '#f4f2ec' : '#3fb04a'); R(ctx, sh.x + 3, sh.y, 2, 3, dive ? '#e23b5a' : '#3fb04a'); R(ctx, sh.x + 1, sh.y + 6, 6, 1, '#2f8f46'); }
    if (!dive) for (let i = 0; i < 3; i++) R(ctx, 30 + i * 80, H - 26, 18, 5, '#3fb04a');
    hud(ctx, g.score, g.lives, 'VÅG ' + g.wave);
    if (g.over) overBox(ctx);
  };
  return g;
}

// ---- River Raid: floden rullar nedåt, håll dig i vattnet, skjut båtar, tanka ----
function river(S, skin) {
  const g = { title: S.title || 'FLODEN', score: 0, lives: 3, over: false, t: 0, y: 0, ship: { x: W / 2, w: 8, h: 8 }, shots: [], foes: [], fuel: 100, hitT: 0, segs: [], speed: 60 };
  const segAt = (y) => { const i = Math.floor(y / 16); while (g.segs.length <= i + 1) { const prev = g.segs[g.segs.length - 1] || { l: 60, r: 180 }; const l = clamp(prev.l + irnd(-14, 14), 20, 100), r = clamp(prev.r + irnd(-14, 14), l + 60, W - 20); g.segs.push({ l, r, fuel: Math.random() < 0.12, foe: Math.random() < 0.35 ? { x: rnd(l + 8, r - 16), dir: Math.random() < 0.5 ? 1 : -1, alive: true } : null }); } return g.segs[i]; };
  g.update = (dt, inp) => {
    g.t += dt;
    if (g.over) { if (inp.start) Object.assign(g, create(skin)); return; }
    const sh = g.ship;
    g.speed = inp.up ? 110 : inp.down ? 35 : 65;
    if (inp.left) sh.x -= 90 * dt; if (inp.right) sh.x += 90 * dt;
    g.y += g.speed * dt; g.score += Math.floor(g.speed * dt / 4) ;
    g.fuel -= dt * 4; if (g.fuel <= 0) { g.fuel = 0; g.lives--; g.hitT = 1.5; g.fuel = 60; if (g.lives <= 0) g.over = true; }
    g.cool = Math.max(0, (g.cool || 0) - dt);
    if (inp.a && g.cool <= 0) { g.shots.push({ x: sh.x + 3, y: g.y + H - 30, w: 2, h: 6 }); g.cool = 0.25; }
    for (const s of g.shots) s.y += 200 * dt;
    g.shots = g.shots.filter((s) => s.y < g.y + H + 20);
    const shipY = H - 24, worldY = g.y + shipY;
    const seg = segAt(worldY);
    g.hitT -= dt;
    if (g.hitT <= 0 && (sh.x < seg.l || sh.x + sh.w > seg.r)) { g.lives--; g.hitT = 1.5; sh.x = (seg.l + seg.r) / 2; if (g.lives <= 0) g.over = true; }
    for (let i = Math.floor(g.y / 16); i < Math.floor((g.y + H) / 16) + 1; i++) {
      const s = segAt(i * 16), sy = i * 16;
      if (s.foe?.alive) { s.foe.x += s.foe.dir * 28 * dt; if (s.foe.x < s.l + 4 || s.foe.x > s.r - 16) s.foe.dir *= -1; const fb = { x: s.foe.x, y: sy + 4, w: 12, h: 8 };
        for (const sh2 of g.shots) if (!sh2.dead && hit(sh2, fb)) { sh2.dead = true; s.foe.alive = false; g.score += 60; }
        if (g.hitT <= 0 && hit(fb, { x: sh.x, y: worldY, w: 8, h: 8 })) { g.lives--; g.hitT = 1.5; s.foe.alive = false; if (g.lives <= 0) g.over = true; } }
      if (s.fuel && hit({ x: (s.l + s.r) / 2 - 5, y: sy + 2, w: 10, h: 12 }, { x: sh.x, y: worldY, w: 8, h: 8 })) g.fuel = Math.min(100, g.fuel + 40 * dt);
    }
    g.shots = g.shots.filter((s) => !s.dead);
  };
  g.draw = (ctx) => {
    R(ctx, 0, 0, W, H, '#2f8f46');
    const off = g.y % 16;
    for (let i = Math.floor(g.y / 16); i < Math.floor((g.y + H) / 16) + 2; i++) {
      const s = segAt(i * 16), sy = i * 16 - g.y;
      R(ctx, s.l, sy, s.r - s.l, 16, '#3a78d8'); R(ctx, s.l, sy, 2, 16, '#e0b040'); R(ctx, s.r - 2, sy, 2, 16, '#e0b040');
      if (s.fuel) { R(ctx, (s.l + s.r) / 2 - 5, sy + 2, 10, 12, '#e23b5a'); text(ctx, 'F', (s.l + s.r) / 2 - 2, sy + 5, '#f4f2ec'); }
      if (s.foe?.alive) { R(ctx, s.foe.x, sy + 6, 12, 5, '#8a8f9c'); R(ctx, s.foe.x + 3, sy + 3, 5, 3, '#e23b5a'); }
    }
    for (const s of g.shots) R(ctx, s.x, s.y - g.y, 2, 6, '#f0e030');
    const sh = g.ship;
    if (g.hitT <= 0 || Math.floor(g.t * 10) % 2) { R(ctx, sh.x + 3, H - 24, 2, 8, '#f0e030'); R(ctx, sh.x, H - 20, 8, 3, '#f0e030'); R(ctx, sh.x + 2, H - 17, 4, 2, '#f0e030'); }
    R(ctx, 60, H - 8, 120, 5, '#1a1a1e'); R(ctx, 60, H - 8, 120 * g.fuel / 100, 5, g.fuel > 30 ? '#f0e030' : '#e23b5a'); text(ctx, 'BRÄNSLE', 20, H - 8, '#f4f2ec');
    hud(ctx, g.score, g.lives, 'UPP = FART');
    if (g.over) overBox(ctx);
  };
  return g;
}

// ---- horde: du i mitten, fiender från alla håll, vapnet skjuter mot närmaste av sig självt ----
function horde(S, skin) {
  const g = { title: S.title || 'HORDEN', score: 0, lives: 3, over: false, t: 0, p: { x: W / 2, y: H / 2, dir: 1, fr: 0, inv: 0 }, foes: [], shots: [], cool: 0, wave: 1, kills: 0 };
  g.update = (dt, inp) => {
    g.t += dt;
    if (g.over) { if (inp.start) Object.assign(g, create(skin)); return; }
    const p = g.p, sp = 70 * dt;
    if (inp.left) { p.x -= sp; p.dir = -1; } if (inp.right) { p.x += sp; p.dir = 1; } if (inp.up) p.y -= sp; if (inp.down) p.y += sp;
    p.x = clamp(p.x, 6, W - 6); p.y = clamp(p.y, 20, H - 6); p.fr = Math.floor(g.t * 8) % 2; p.inv = Math.max(0, p.inv - dt);
    const rate = 0.9 + g.wave * 0.25;
    if (Math.random() < dt * rate) { const side = irnd(0, 3); g.foes.push({ x: side === 0 ? -8 : side === 1 ? W + 8 : rnd(0, W), y: side === 2 ? 4 : side === 3 ? H + 8 : rnd(12, H), hp: 1 + Math.floor(g.wave / 3), fr: 0 }); }
    g.cool -= dt;
    if (g.cool <= 0 && g.foes.length) { g.cool = Math.max(0.12, 0.35 - g.wave * 0.02); const n = g.foes.reduce((b, f) => (!b || Math.hypot(f.x - p.x, f.y - p.y) < Math.hypot(b.x - p.x, b.y - p.y) ? f : b), null); const a = Math.atan2(n.y - p.y, n.x - p.x); g.shots.push({ x: p.x, y: p.y - 6, vx: Math.cos(a) * 220, vy: Math.sin(a) * 220, t: 0 }); }
    for (const s of g.shots) { s.x += s.vx * dt; s.y += s.vy * dt; s.t += dt; }
    g.shots = g.shots.filter((s) => s.t < 1.2);
    for (const f of g.foes) {
      const a = Math.atan2(p.y - f.y, p.x - f.x), v = 22 + g.wave * 3; f.x += Math.cos(a) * v * dt; f.y += Math.sin(a) * v * dt; f.fr = Math.floor(g.t * 6 + f.x) % 2;
      for (const s of g.shots) if (!s.dead && Math.hypot(s.x - f.x, s.y - f.y) < 6) { s.dead = true; f.hp--; if (f.hp <= 0) { f.dead = true; g.score += 15 + g.wave * 5; g.kills++; } }
      if (!f.dead && p.inv <= 0 && Math.hypot(f.x - p.x, f.y - p.y) < 7) { g.lives--; p.inv = 1.5; if (g.lives <= 0) g.over = true; }
    }
    g.foes = g.foes.filter((f) => !f.dead); g.shots = g.shots.filter((s) => !s.dead);
    g.wave = 1 + Math.floor(g.t / 25);
  };
  g.draw = (ctx) => {
    R(ctx, 0, 0, W, H, S.bg || '#1a1a2a');
    for (let i = 0; i < 30; i++) R(ctx, (i * 71) % W, 12 + (i * 43) % (H - 12), 2, 2, 'rgba(255,255,255,.08)');
    for (const f of g.foes) drawFoe(ctx, S.foeKind || 'skull', Math.round(f.x - 4), Math.round(f.y + 4), f.fr, S.foeCol || '#e23b5a');
    for (const s of g.shots) R(ctx, s.x - 1, s.y - 1, 3, 3, '#f0e030');
    const p = g.p;
    if (p.inv <= 0 || Math.floor(g.t * 10) % 2) drawHero(ctx, S.hero || 'marine', Math.round(p.x), Math.round(p.y + 7), p.dir, p.fr, S.heroCol || '#3fb04a');
    hud(ctx, g.score, g.lives, `VÅG ${g.wave}   ${g.kills} NER   ${Math.floor(g.t)} S`);
    if (g.over) overBox(ctx, 'ÖVERMANNAD', `${g.kills} FIENDER PÅ ${Math.floor(g.t)} S`);
  };
  return g;
}
