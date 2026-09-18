// Gatuslagsmål: gå åt höger, ligisterna kommer i gäng – slå (A), sparka (B), rensa vågen och gå
// vidare. Boss var tredje våg. (Final Fight, Double Dragon, Streets of Rage, Turtles, Golden Axe …)
import { W, H, R, text, centered, hud, overBox, rnd, irnd, clamp } from './common.js';
import { hero as drawHero, foe as drawFoe } from './sprites.js';

const HERO_KIND = { brawler: 'kid', turtle: 'turtle', barbarian: 'viking', beast: 'ape' };
export function create(skin = {}) {
  const S = { hero: 'brawler', heroCol: '#3a78d8', foeKind: 'thug', foeCol: '#c98a4a', street: 'city', weapon: null, ...skin };
  const TOP = 96, BOT = 150;
  const g = { title: S.title || 'GATAN', score: 0, lives: 3, over: false, t: 0, cam: 0, wave: 1, foes: [], p: { x: 40, y: 120, dir: 1, hp: 100, atk: 0, kind: null, fr: 0, inv: 0 }, go: false, msg: '', msgT: 0, kills: 0 };
  const spawn = () => { const boss = g.wave % 3 === 0, n = boss ? 1 : 3 + Math.min(4, g.wave); for (let i = 0; i < n; i++) { const left = Math.random() < 0.35; g.foes.push({ x: g.cam + (left ? -20 : W + 20 + i * 12), y: rnd(TOP + 6, BOT - 6), hp: boss ? 14 : 3 + Math.floor(g.wave / 2), boss, atk: 0, cool: rnd(0.5, 1.5), fr: 0, hurt: 0, dir: left ? 1 : -1 }); } g.go = false; };
  spawn();
  g.update = (dt, inp) => {
    g.t += dt;
    if (g.over) { if (inp.start) Object.assign(g, create(skin)); return; }
    g.msgT = Math.max(0, g.msgT - dt);
    const p = g.p, sp = 70 * dt;
    p.atk = Math.max(0, p.atk - dt); p.inv = Math.max(0, p.inv - dt);
    if (p.atk <= 0) { let dx = 0, dy = 0; if (inp.left) { dx = -sp; p.dir = -1; } if (inp.right) { dx = sp; p.dir = 1; } if (inp.up) dy = -sp; if (inp.down) dy = sp; p.x = clamp(p.x + dx, g.cam + 6, g.cam + W - 6); p.y = clamp(p.y + dy, TOP, BOT); if (dx || dy) p.fr = Math.floor(g.t * 8) % 2; }
    if (p.atk <= 0 && inp.aHit) { p.atk = 0.22; p.kind = 'punch'; p.landed = false; }
    if (p.atk <= 0 && inp.bHit) { p.atk = 0.34; p.kind = 'kick'; p.landed = false; }
    if (g.go && p.x > g.cam + W * 0.6) { g.cam += (p.x - (g.cam + W * 0.6)); if (g.cam > g.next) { g.wave++; g.next = g.cam + 200; spawn(); g.msg = g.wave % 3 === 0 ? 'BOSS!' : `VÅG ${g.wave}`; g.msgT = 1; } }
    const reach = p.kind === 'kick' ? 20 : 14;
    for (const f of g.foes) {
      f.hurt = Math.max(0, f.hurt - dt); f.cool = Math.max(0, f.cool - dt); f.atk = Math.max(0, f.atk - dt);
      const ddx = p.x - f.x, ddy = p.y - f.y, d = Math.abs(ddx);
      f.dir = ddx > 0 ? 1 : -1;
      if (!f.hurt && f.atk <= 0) { const s = (f.boss ? 40 : 32) * dt; if (d > 16) f.x += Math.sign(ddx) * s; if (Math.abs(ddy) > 3) f.y += Math.sign(ddy) * s * 0.7; else if (d <= 18 && f.cool <= 0) { f.atk = 0.5; f.cool = rnd(0.9, 1.6); } f.fr = Math.floor(g.t * 6 + f.x) % 2; }
      if (f.atk > 0.15 && f.atk < 0.25 && d < 18 && Math.abs(ddy) < 10 && p.inv <= 0) { p.hp -= f.boss ? 14 : 7; p.inv = 0.5; p.x += f.dir * 6; if (p.hp <= 0) { g.lives--; if (g.lives <= 0) { g.over = true; return; } p.hp = 100; p.inv = 2; } }
      if (p.kind && p.atk > 0.08 && p.atk < 0.18 && !p.landed && d < reach + (S.weapon ? 8 : 0) && Math.abs(ddy) < 10 && Math.sign(ddx) === p.dir) { p.landed = true; f.hp -= p.kind === 'kick' ? 2 : 1; f.hurt = 0.3; f.x += p.dir * (p.kind === 'kick' ? 12 : 6); g.score += p.kind === 'kick' ? 30 : 20; if (f.hp <= 0) { f.dead = true; g.kills++; g.score += f.boss ? 500 : 100; } }
    }
    g.foes = g.foes.filter((f) => !f.dead);
    if (!g.foes.length && !g.go) { g.go = true; g.next = g.cam + 160; }
  };
  g.draw = (ctx) => {
    const st = S.street, ox = -Math.round(g.cam), mod = (a, n) => ((a % n) + n) % n;
    if (st === 'sewer') { R(ctx, 0, 0, W, H, '#1a3a2a'); R(ctx, 0, TOP - 30, W, 30, '#2a4a3a'); for (let i = 0; i < 8; i++) R(ctx, mod(i * 40 + ox * 0.5, W + 40) - 20, TOP - 60, 20, 30, '#3a5a4a'); R(ctx, 0, TOP - 2, W, 2, '#3fb04a'); }
    else if (st === 'castle') { R(ctx, 0, 0, W, H, '#3a3a44'); for (let y = 0; y < TOP - 2; y += 8) for (let x = -16; x < W; x += 16) R(ctx, x + (Math.floor(y / 8) % 2) * 8 + mod(ox * 0.5, 16), y, 14, 6, '#5a5a66'); for (let i = 0; i < 5; i++) R(ctx, mod(i * 60 + ox * 0.5, W + 60) - 30, 30, 8, 40, '#f0b429'); }
    else if (st === 'grave') { R(ctx, 0, 0, W, H, '#1a1a2a'); R(ctx, 190, 12, 16, 16, '#e8e6e0'); for (let i = 0; i < 8; i++) { const x = mod(i * 36 + ox * 0.5, W + 36) - 18; R(ctx, x, TOP - 24, 12, 22, '#5a5a66'); R(ctx, x + 2, TOP - 28, 8, 6, '#5a5a66'); } }
    else { const night = st === 'night'; R(ctx, 0, 0, W, H, night ? '#0a0a2a' : '#2a3a5a'); for (let i = 0; i < 6; i++) { const x = mod(i * 50 + ox * 0.5, W + 50) - 25; R(ctx, x, 20, 40, TOP - 22, night ? '#1a1a3a' : '#5a4a3a'); R(ctx, x + 4, 30, 32, 20, night ? '#f0e030' : '#7ab0e0'); R(ctx, x + 6, 32, 28, 16, ['#e23b5a', '#3fb04a', '#3a78d8'][i % 3]); R(ctx, x + 14, TOP - 30, 12, 28, '#2a1a14'); } for (let i = 0; i < 4; i++) { const x = mod(i * 70 + ox * 0.7, W + 70) - 35; R(ctx, x, 40, 2, TOP - 42, '#8a8f9c'); R(ctx, x - 3, 38, 8, 3, '#f0e030'); } }
    R(ctx, 0, TOP - 2, W, H - TOP + 2, st === 'sewer' ? '#2a4a3a' : st === 'castle' ? '#5a5a66' : st === 'grave' ? '#3a4a3a' : '#5a5a66');
    for (let i = 0; i < 12; i++) R(ctx, mod(i * 24 + ox, W + 24) - 12, TOP + 8 + (i * 13) % 40, 8, 1, 'rgba(255,255,255,.12)');
    const all = [...g.foes.map((f) => ({ y: f.y, d: () => { const flash = f.hurt && Math.floor(g.t * 20) % 2; if (f.boss) { R(ctx, f.x + ox - 8, f.y - 24, 16, 18, flash ? '#f4f2ec' : '#7a1a10'); R(ctx, f.x + ox - 5, f.y - 30, 10, 7, '#e0a97f'); R(ctx, f.x + ox - 7, f.y - 6 + (f.fr ? 1 : 0), 5, 6, '#1a1a1e'); R(ctx, f.x + ox + 2, f.y - 6 + (f.fr ? 0 : 1), 5, 6, '#1a1a1e'); } else drawFoe(ctx, S.foeKind, Math.round(f.x + ox - 4), Math.round(f.y + 4), f.fr, flash ? '#f4f2ec' : S.foeCol); if (f.atk > 0.15 && f.atk < 0.25) R(ctx, f.x + ox + f.dir * 8, f.y - 8, 6, 3, '#e0a97f'); } })), { y: g.p.y, d: () => { const p = g.p; if (p.inv > 0 && Math.floor(g.t * 10) % 2) return; drawHero(ctx, HERO_KIND[S.hero] || 'kid', Math.round(p.x + ox), Math.round(p.y + 6), p.dir, p.atk > 0 ? 0 : p.fr, S.heroCol); if (p.kind === 'punch' && p.atk > 0.05) R(ctx, p.x + ox + p.dir * 5 - (p.dir < 0 ? 8 : 0), p.y - 6, S.weapon ? 16 : 10, 3, S.weapon ? '#c8c8d0' : '#f6d7bf'); if (p.kind === 'kick' && p.atk > 0.05) R(ctx, p.x + ox + p.dir * 4 - (p.dir < 0 ? 12 : 0), p.y + 1, 14, 3, S.heroCol); } }];
    all.sort((a, b) => a.y - b.y); for (const o of all) o.d();
    R(ctx, 10, 12, 80, 5, '#1a1a1e'); R(ctx, 10, 12, Math.max(0, g.p.hp) * 0.8, 5, g.p.hp > 30 ? '#3fb04a' : '#e23b5a');
    const boss = g.foes.find((f) => f.boss); if (boss) { R(ctx, W - 90, 12, 80, 5, '#1a1a1e'); R(ctx, W - 90, 12, Math.max(0, boss.hp) * 80 / 14, 5, '#e23b5a'); text(ctx, 'BOSS', W - 90, 18, '#f4f2ec'); }
    if (g.go && Math.floor(g.t * 3) % 2) text(ctx, 'GÅ ->', W - 40, 50, '#f0e030', true);
    hud(ctx, g.score, g.lives, `VÅG ${g.wave}   ${g.kills} NER   A=SLÅ B=SPARK`);
    if (g.msgT > 0) centered(ctx, g.msg, 70, '#f0e030', true);
    if (g.over) overBox(ctx);
  };
  return g;
}
