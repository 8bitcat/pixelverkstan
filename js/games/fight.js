// Fight: två fighters, slag, spark, hopp och block; bäst av tre ronder mot datorn. (SF II, MK …)
import { W, H, R, text, centered, hud, overBox, clamp } from './common.js';

export function create(skin = {}) {
  const g = { title: skin.title || 'FIGHT', score: 0, lives: -1, over: false, t: 0, round: 1, wins: [0, 0], msg: 'RONDE 1', msgT: 1.5 };
  const FLOOR = H - 26;
  const mk = (x, col, ai) => ({ x, y: FLOOR, vy: 0, hp: 100, dir: ai ? -1 : 1, col, ai, atk: 0, kind: null, block: false, hitT: 0, cool: 0, think: 0 });
  const reset = () => { g.a = mk(60, skin.p1 || '#e8e6e0', false); g.b = mk(180, skin.p2 || '#e23b5a', true); g.timer = 60; };
  reset();
  const attack = (f, kind) => { if (f.atk > 0 || f.cool > 0) return; f.atk = kind === 'kick' ? 0.36 : 0.24; f.kind = kind; f.cool = 0.1; };
  const step = (f, o, inp, dt) => {
    f.cool = Math.max(0, f.cool - dt); f.hitT = Math.max(0, f.hitT - dt);
    f.dir = o.x > f.x ? 1 : -1;
    if (f.atk > 0) { f.atk -= dt; if (f.atk <= 0) f.kind = null; }
    else if (f.hitT <= 0) {
      f.block = !!inp.down && f.y === FLOOR;
      if (!f.block) { if (inp.left) f.x -= 70 * dt; if (inp.right) f.x += 70 * dt; if (inp.up && f.y === FLOOR) f.vy = -230; }
      if (inp.a) attack(f, 'punch'); if (inp.b) attack(f, 'kick');
    }
    f.vy += 700 * dt; f.y += f.vy * dt; if (f.y >= FLOOR) { f.y = FLOOR; f.vy = 0; }
    f.x = clamp(f.x, 8, W - 8);
    // träff
    if (f.kind && f.atk > (f.kind === 'kick' ? 0.2 : 0.12) && f.atk < (f.kind === 'kick' ? 0.3 : 0.2)) {
      const reach = f.kind === 'kick' ? 22 : 16;
      if (Math.abs(o.x - f.x) < reach && Math.abs(o.y - f.y) < 16 && !f.landed) {
        f.landed = true;
        const dmg = (f.kind === 'kick' ? 9 : 6) * (o.block ? 0.2 : 1);
        o.hp -= dmg; o.hitT = o.block ? 0.1 : 0.35; o.x += f.dir * (o.block ? 4 : 10);
        if (!f.ai && !o.block) g.score += f.kind === 'kick' ? 90 : 60;
      }
    } else f.landed = false;
  };
  const aiInput = (f, o, dt) => {
    f.think -= dt;
    if (f.think <= 0) { f.think = 0.2 + Math.random() * 0.4; f.plan = Math.random(); }
    const d = Math.abs(o.x - f.x), toward = o.x > f.x;
    const inp = { left: false, right: false, up: false, down: false, a: false, b: false };
    if (d > 26) { inp[toward ? 'right' : 'left'] = f.plan < 0.85; }
    else { if (f.plan < 0.35) inp.a = true; else if (f.plan < 0.6) inp.b = true; else if (f.plan < 0.75) inp.down = true; else if (f.plan < 0.85) inp[toward ? 'left' : 'right'] = true; else inp.up = true; }
    if (o.atk > 0 && Math.random() < 0.02) inp.down = true;
    return inp;
  };
  g.update = (dt, inp) => {
    g.t += dt;
    if (g.over) { if (inp.start) Object.assign(g, create(skin)); return; }
    if (g.msgT > 0) { g.msgT -= dt; return; }
    g.timer -= dt;
    step(g.a, g.b, inp, dt);
    step(g.b, g.a, aiInput(g.b, g.a, dt), dt);
    if (g.a.hp <= 0 || g.b.hp <= 0 || g.timer <= 0) {
      const won = g.b.hp < g.a.hp;
      g.wins[won ? 0 : 1]++;
      if (won) g.score += 500 + Math.round(g.timer) * 5;
      if (g.wins[0] >= 2 || g.wins[1] >= 2) { g.over = true; g.msg = g.wins[0] >= 2 ? 'DU VANN!' : 'FÖRLORADE'; return; }
      g.round++; g.msg = 'RONDE ' + g.round; g.msgT = 1.5; reset();
    }
  };
  const fighter = (ctx, f, o) => {
    const x = Math.round(f.x), y = Math.round(f.y), d = f.dir, flash = f.hitT > 0.2 && Math.floor(g.t * 20) % 2;
    const col = flash ? '#f4f2ec' : f.col, skinC = f.ai ? '#e0a97f' : '#f6d7bf';
    const crouch = f.block ? 4 : 0;
    R(ctx, x - 3, y - 22 + crouch, 6, 6, skinC); R(ctx, x - 3, y - 22 + crouch, 6, 2, f.ai ? '#1a1a1e' : '#3b2619');
    R(ctx, x - 5, y - 16 + crouch, 10, 9, col);
    if (f.kind === 'punch') R(ctx, x + d * 5, y - 14 + crouch, d > 0 ? 10 : 10, 3, skinC);
    else if (f.block) { R(ctx, x + d * 4, y - 16, 3, 8, skinC); }
    else R(ctx, x + d * 4, y - 15 + crouch, 3, 6, skinC);
    if (f.kind === 'kick') { R(ctx, x + d * 4, y - 8, d > 0 ? 14 : 14, 3, col); R(ctx, x - 2, y - 7, 4, 7, col); }
    else { R(ctx, x - 4, y - 7 + crouch, 3, 7 - crouch, col); R(ctx, x + 1, y - 7 + crouch, 3, 7 - crouch, col); }
    if (f.kind && f.atk > 0.1 && f.atk < 0.2 && Math.abs(o.x - f.x) < 22) R(ctx, o.x - 3, o.y - 16, 6, 6, '#f0e030');
  };
  g.draw = (ctx) => {
    R(ctx, 0, 0, W, H, skin.sky || '#1a2a4a');
    for (let i = 0; i < 7; i++) R(ctx, i * 36, 70 - (i % 3) * 12, 24, 60 + (i % 3) * 12, skin.bg || '#2a3a5a');
    R(ctx, 0, FLOOR, W, H - FLOOR, skin.floor || '#5a3d2b'); R(ctx, 0, FLOOR, W, 2, '#8a6446');
    // publik
    for (let i = 0; i < 20; i++) R(ctx, 10 + i * 11, 78 + ((i * 7) % 5) + (Math.floor(g.t * 3 + i) % 2), 6, 8, ['#e23b5a', '#3a78d8', '#f0e030', '#3fb04a'][i % 4]);
    fighter(ctx, g.a, g.b); fighter(ctx, g.b, g.a);
    // hälsa
    R(ctx, 10, 12, 100, 6, '#1a1a1e'); R(ctx, 10, 12, Math.max(0, g.a.hp), 6, '#f0e030');
    R(ctx, W - 110, 12, 100, 6, '#1a1a1e'); R(ctx, W - 10 - Math.max(0, g.b.hp), 12, Math.max(0, g.b.hp), 6, '#f0e030');
    text(ctx, skin.p1name || 'DU', 10, 20, '#f4f2ec'); text(ctx, skin.p2name || 'CPU', W - 10 - 11, 20, '#f4f2ec');
    for (let i = 0; i < g.wins[0]; i++) R(ctx, 10 + i * 6, 27, 4, 4, '#3fb04a'); for (let i = 0; i < g.wins[1]; i++) R(ctx, W - 14 - i * 6, 27, 4, 4, '#3fb04a');
    hud(ctx, g.score, -1, String(Math.max(0, Math.ceil(g.timer))));
    if (g.msgT > 0) centered(ctx, g.msg, 60, '#f0e030', true);
    if (g.over) overBox(ctx, g.msg, `${g.score} POÄNG`);
  };
  return g;
}
