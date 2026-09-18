// Sport i fem lägen: 'soccer' och 'hockey' (uppifrån, du styr spelaren närmast bollen, A = skott,
// B = pass), 'basket' (halvplan, ladda kastet med A), 'track' (100 m: hamra vänster/höger växelvis)
// och 'tennis' (racket mot datorn, A = hårt slag). NHL 94, FIFA, NBA Jam, Summer Games, Wii Sports.
import { W, H, R, text, centered, hud, overBox, rnd, irnd, clamp } from './common.js';

export function create(skin = {}) {
  const S = { mode: 'soccer', ...skin };
  if (S.mode === 'basket') return basket(S, skin);
  if (S.mode === 'track') return track(S, skin);
  if (S.mode === 'tennis' || S.mode === 'pinball') return tennis(S, skin);
  const ice = S.mode === 'hockey';
  const OY = 14, FH = H - OY - 4, GOAL = ice ? 20 : 26, gy0 = OY + FH / 2 - GOAL / 2;
  const g = { title: S.title || (ice ? 'HOCKEY' : 'FOTBOLL'), score: 0, lives: -1, over: false, t: 0, time: 90, goals: [0, 0], msgT: 0, msg: '' };
  const mk = (team) => { const list = []; for (let i = 0; i < 4; i++) list.push({ x: team ? W - 40 - i * 30 : 40 + i * 30, y: OY + 20 + (i * 33) % (FH - 30), team, fr: 0, home: null }); for (const p of list) p.home = { x: p.x, y: p.y }; return list; };
  const reset = () => { g.ball = { x: W / 2, y: OY + FH / 2, vx: 0, vy: 0 }; g.a = mk(0); g.b = mk(1); g.own = null; };
  reset();
  const nearest = (team) => team.reduce((b, p) => (!b || Math.hypot(p.x - g.ball.x, p.y - g.ball.y) < Math.hypot(b.x - g.ball.x, b.y - g.ball.y) ? p : b), null);
  const kick = (p, tx, ty, power) => { const a = Math.atan2(ty - p.y, tx - p.x); g.ball.vx = Math.cos(a) * power; g.ball.vy = Math.sin(a) * power; g.own = null; g.kickT = 0.2; };
  g.update = (dt, inp) => {
    g.t += dt;
    if (g.over) { if (inp.start) Object.assign(g, create(skin)); return; }
    if (g.msgT > 0) { g.msgT -= dt; if (g.msgT <= 0) reset(); return; }
    g.time -= dt; if (g.time <= 0) { g.over = true; g.msg = g.goals[0] > g.goals[1] ? 'DU VANN!' : g.goals[0] === g.goals[1] ? 'OAVGJORT' : 'FÖRLUST'; return; }
    const b = g.ball, sp = (ice ? 78 : 66) * dt, me = nearest(g.a);
    g.kickT = Math.max(0, (g.kickT || 0) - dt);
    let dx = 0, dy = 0; if (inp.left) dx -= sp; if (inp.right) dx += sp; if (inp.up) dy -= sp; if (inp.down) dy += sp;
    me.x = clamp(me.x + dx, 4, W - 4); me.y = clamp(me.y + dy, OY + 4, OY + FH - 4); if (dx || dy) me.fr = Math.floor(g.t * 8) % 2;
    for (const p of g.a) if (p !== me) { const tx = (p.home.x + b.x) / 2, ty = (p.home.y + b.y) / 2; p.x += (tx - p.x) * dt; p.y += (ty - p.y) * dt; }
    const cpu = nearest(g.b);
    for (const p of g.b) { const tx = p === cpu ? b.x : (p.home.x + b.x) / 2, ty = p === cpu ? b.y : (p.home.y + b.y) / 2, d = Math.hypot(tx - p.x, ty - p.y) || 1, s = (p === cpu ? (ice ? 70 : 58) : 30) * dt; p.x += (tx - p.x) / d * Math.min(d, s); p.y += (ty - p.y) / d * Math.min(d, s); p.fr = Math.floor(g.t * 8 + p.x) % 2; }
    // bollen: rullar, studsar på sargen, plockas upp av den som är nära
    b.x += b.vx * dt; b.y += b.vy * dt; const fr = ice ? 0.6 : 0.25; b.vx *= Math.pow(fr, dt); b.vy *= Math.pow(fr, dt);
    if (b.y < OY + 2 || b.y > OY + FH - 2) { b.vy *= -0.8; b.y = clamp(b.y, OY + 2, OY + FH - 2); }
    const inGoalY = b.y > gy0 && b.y < gy0 + GOAL;
    if (b.x < 4) { if (inGoalY) { g.goals[1]++; g.msg = 'MÅL FÖR DATORN'; g.msgT = 1.5; return; } b.vx *= -0.8; b.x = 4; }
    if (b.x > W - 4) { if (inGoalY) { g.goals[0]++; g.score += 100 + Math.round(g.time); g.msg = 'MÅÅÅL!'; g.msgT = 1.5; return; } b.vx *= -0.8; b.x = W - 4; }
    if (g.kickT <= 0) {
      for (const p of [...g.a, ...g.b]) if (Math.hypot(p.x - b.x, p.y - b.y) < 7) { g.own = p; break; }
      if (g.own) { b.x = g.own.x + (g.own.team ? -5 : 5); b.y = g.own.y + 2; if (Math.random() < dt * 0.4 && g.own.team) g.own = null; }
    }
    if (g.own === me) { if (inp.aHit) kick(me, W, OY + FH / 2, ice ? 260 : 200); else if (inp.bHit) { const mate = g.a.filter((p) => p !== me).sort((p, q) => Math.hypot(p.x - me.x, p.y - me.y) - Math.hypot(q.x - me.x, q.y - me.y))[0]; kick(me, mate.x, mate.y, 120); } }
    else if (g.own && g.own.team) { if (g.own.x < 70 || Math.random() < dt * 0.8) kick(g.own, 0, OY + FH / 2 + rnd(-8, 8), ice ? 240 : 190); }
    for (const p of g.a) for (const q of g.b) if (Math.hypot(p.x - q.x, p.y - q.y) < 6) { q.x += (q.x - p.x) * 0.3; p.x += (p.x - q.x) * 0.3; }
  };
  g.draw = (ctx) => {
    R(ctx, 0, 0, W, H, ice ? '#e8f0f8' : '#3fb04a');
    if (!ice) for (let i = 0; i < 8; i++) R(ctx, i * 30, OY, 15, FH, '#38a044');
    R(ctx, 2, OY, W - 4, 1, '#f4f2ec'); R(ctx, 2, OY + FH - 1, W - 4, 1, '#f4f2ec'); R(ctx, 2, OY, 1, FH, '#f4f2ec'); R(ctx, W - 3, OY, 1, FH, '#f4f2ec'); R(ctx, W / 2, OY, 1, FH, '#f4f2ec');
    if (ice) { R(ctx, 30, OY, 1, FH, '#3a78d8'); R(ctx, W - 31, OY, 1, FH, '#3a78d8'); R(ctx, W / 2, OY, 1, FH, '#e23b5a'); }
    for (let i = 0; i < 12; i++) R(ctx, W / 2 - 12 + Math.round(Math.cos(i / 12 * 6.28) * 12), OY + FH / 2 + Math.round(Math.sin(i / 12 * 6.28) * 12), 1, 1, '#f4f2ec');
    R(ctx, 0, gy0, 6, GOAL, ice ? '#e23b5a' : '#f4f2ec'); R(ctx, W - 6, gy0, 6, GOAL, ice ? '#e23b5a' : '#f4f2ec');
    for (const p of [...g.a, ...g.b]) { const c = p.team ? (ice ? '#e23b5a' : '#f4f2ec') : (ice ? '#3a78d8' : '#e23b5a'); R(ctx, p.x - 2, p.y - 8, 4, 4, '#f6d7bf'); R(ctx, p.x - 3, p.y - 4, 6, 5, c); R(ctx, p.x - 3, p.y + 1 + (p.fr ? 1 : 0), 2, 3, '#2d3a5c'); R(ctx, p.x + 1, p.y + 1 + (p.fr ? 0 : 1), 2, 3, '#2d3a5c'); if (ice) R(ctx, p.x + (p.team ? -6 : 3), p.y, 4, 1, '#5a3d2b'); }
    const me = nearest(g.a); R(ctx, me.x - 1, me.y - 13, 3, 3, '#f0e030');
    const b = g.ball; if (ice) R(ctx, b.x - 2, b.y - 1, 4, 2, '#1a1a1e'); else { R(ctx, b.x - 2, b.y - 2, 4, 4, '#f4f2ec'); R(ctx, b.x - 1, b.y - 1, 2, 2, '#1a1a1e'); }
    hud(ctx, g.score, -1, `${g.goals[0]} - ${g.goals[1]}   ${Math.ceil(g.time)} S   A=SKOTT B=PASS`);
    if (g.msgT > 0) centered(ctx, g.msg, 70, '#f0e030', true);
    if (g.over) overBox(ctx, g.msg, `${g.goals[0]} - ${g.goals[1]}`);
  };
  return g;
}

// ---- basket: halvplan, ladda kastet, försvararen stör ----
function basket(S, skin) {
  const g = { title: S.title || 'BASKET', score: 0, lives: -1, over: false, t: 0, time: 60, p: { x: W / 2, y: 120, fr: 0 }, d: { x: W / 2, y: 80 }, charge: 0, shot: null, made: 0, msg: '', msgT: 0 };
  const HOOP = { x: W / 2, y: 30 };
  g.update = (dt, inp) => {
    g.t += dt;
    if (g.over) { if (inp.start) Object.assign(g, create(skin)); return; }
    g.time -= dt; if (g.time <= 0) { g.over = true; return; }
    g.msgT = Math.max(0, g.msgT - dt);
    const p = g.p, sp = 70 * dt;
    if (!g.shot) { if (inp.left) p.x -= sp; if (inp.right) p.x += sp; if (inp.up) p.y -= sp; if (inp.down) p.y += sp; p.x = clamp(p.x, 10, W - 10); p.y = clamp(p.y, 50, H - 10); p.fr = Math.floor(g.t * 8) % 2; }
    const d = g.d; d.x += (p.x - d.x) * 2 * dt; d.y += ((p.y + HOOP.y) / 2 - d.y) * 2 * dt;
    if (!g.shot) {
      if (inp.a) g.charge = Math.min(1, g.charge + dt * 1.4);
      else if (g.charge > 0) { const dist = Math.hypot(p.x - HOOP.x, p.y - HOOP.y), sweet = Math.abs(g.charge - 0.75) < 0.12, blocked = Math.hypot(d.x - p.x, d.y - p.y) < 14; const ok = sweet && !blocked && Math.random() < 1.05 - dist / 220; g.shot = { x: p.x, y: p.y, t: 0, ok, pts: dist > 90 ? 3 : 2 }; g.charge = 0; }
    } else {
      const s = g.shot; s.t += dt; const f = Math.min(1, s.t / 0.9); s.x = g.p.x + (HOOP.x - g.p.x) * f + (s.ok ? 0 : (f > 0.5 ? (f - 0.5) * 40 : 0)); s.y = g.p.y + (HOOP.y - g.p.y) * f - Math.sin(f * Math.PI) * 50;
      if (f >= 1) { if (s.ok) { g.score += s.pts * 100; g.made++; g.msg = s.pts === 3 ? 'TREPOÄNGARE!' : 'MÅL!'; } else g.msg = 'MISS'; g.msgT = 0.8; g.shot = null; g.p.x = rnd(40, W - 40); g.p.y = rnd(70, 140); }
    }
  };
  g.draw = (ctx) => {
    R(ctx, 0, 0, W, H, '#c98a4a'); for (let i = 0; i < 24; i++) R(ctx, i * 10, 10, 1, H, 'rgba(0,0,0,.08)');
    R(ctx, 40, 10, 160, 60, '#b07a3a'); R(ctx, W / 2 - 30, 10, 60, 30, '#a06a2a');
    R(ctx, HOOP.x - 14, HOOP.y - 14, 28, 18, '#f4f2ec'); R(ctx, HOOP.x - 7, HOOP.y - 2, 14, 3, '#e23b5a'); for (let i = 0; i < 5; i++) R(ctx, HOOP.x - 6 + i * 3, HOOP.y + 1, 1, 6, '#f4f2ec');
    const d = g.d; R(ctx, d.x - 2, d.y - 10, 4, 4, '#e0a97f'); R(ctx, d.x - 3, d.y - 6, 6, 6, '#3a78d8'); R(ctx, d.x - 3, d.y, 2, 4, '#1a1a1e'); R(ctx, d.x + 1, d.y, 2, 4, '#1a1a1e');
    const p = g.p; R(ctx, p.x - 2, p.y - 10, 4, 4, '#f6d7bf'); R(ctx, p.x - 3, p.y - 6, 6, 6, '#e23b5a'); R(ctx, p.x - 3, p.y + (p.fr ? 1 : 0), 2, 4, '#1a1a1e'); R(ctx, p.x + 1, p.y + (p.fr ? 0 : 1), 2, 4, '#1a1a1e');
    if (g.shot) R(ctx, g.shot.x - 2, g.shot.y - 2, 5, 5, '#e07a2e'); else R(ctx, p.x + 4, p.y - 4 + Math.round(Math.sin(g.t * 12) * 2), 4, 4, '#e07a2e');
    if (g.charge > 0) { R(ctx, p.x - 10, p.y - 18, 20, 4, '#1a1a1e'); R(ctx, p.x - 10, p.y - 18, 20 * g.charge, 4, Math.abs(g.charge - 0.75) < 0.12 ? '#3fb04a' : '#f0e030'); R(ctx, p.x - 10 + 20 * 0.75 - 1, p.y - 19, 2, 6, '#f4f2ec'); }
    hud(ctx, g.score, -1, `${Math.ceil(g.time)} S   ${g.made} I KORGEN   HÅLL A, SLÄPP I GRÖNT`);
    if (g.msgT > 0) centered(ctx, g.msg, 90, '#f0e030', true);
    if (g.over) overBox(ctx, 'SLUT', `${g.score} POÄNG`);
  };
  return g;
}

// ---- 100 meter: hamra vänster/höger växelvis ----
function track(S, skin) {
  const g = { title: S.title || '100 METER', score: 0, lives: -1, over: false, t: 0, x: 0, cx: 0, v: 0, cv: 0, last: null, done: false, time: 0, heat: 1 };
  g.update = (dt, inp) => {
    g.t += dt;
    if (g.over) { if (inp.start) Object.assign(g, create(skin)); return; }
    if (g.done) { g.doneT = (g.doneT || 0) + dt; if (g.doneT > 2) { if (g.heat >= 3) g.over = true; else { g.heat++; g.x = 0; g.cx = 0; g.v = 0; g.cv = 0; g.done = false; g.doneT = 0; g.time = 0; } } return; }
    g.time += dt;
    if (inp.leftHit && g.last !== 'l') { g.v += 9; g.last = 'l'; } if (inp.rightHit && g.last !== 'r') { g.v += 9; g.last = 'r'; }
    g.v = Math.max(0, g.v - 14 * dt); g.x += g.v * dt;
    g.cv = 38 + Math.sin(g.t * 3) * 6 + g.heat * 3; g.cx += g.cv * dt;
    if (g.x >= 100 || g.cx >= 100) { g.done = true; const won = g.x >= g.cx; g.score += won ? 500 + Math.max(0, Math.round((14 - g.time) * 50)) : 100; g.msg = won ? `VANN! ${g.time.toFixed(2)} S` : 'DATORN VANN'; }
  };
  g.draw = (ctx) => {
    R(ctx, 0, 0, W, 60, '#7ab0e0'); R(ctx, 0, 60, W, 100, '#c04a3a');
    for (let i = 0; i < 4; i++) R(ctx, 0, 70 + i * 22, W, 1, '#f4f2ec');
    const cam = clamp(g.x * 2 - 60, 0, 140);
    for (let m = 0; m <= 100; m += 10) { const x = m * 2 - cam + 20; R(ctx, x, 62, 1, 90, 'rgba(255,255,255,.4)'); text(ctx, String(m), x - 3, 150, '#f4f2ec'); }
    R(ctx, 220 - cam, 60, 3, 92, '#f0e030');
    const run = (x, y, col) => { const fr = Math.floor(g.t * 12) % 2; R(ctx, x - 2, y - 14, 4, 4, '#f6d7bf'); R(ctx, x - 3, y - 10, 6, 6, col); R(ctx, x - 5 + (fr ? 6 : 0), y - 4, 3, 4, col); R(ctx, x + 2 - (fr ? 6 : 0), y - 4, 3, 4, col); };
    run(g.x * 2 - cam + 20, 92, '#3a78d8'); run(g.cx * 2 - cam + 20, 114, '#e23b5a');
    text(ctx, 'DU', 4, 78, '#3a78d8'); text(ctx, 'CPU', 4, 100, '#e23b5a');
    hud(ctx, g.score, -1, `HEAT ${g.heat}/3   ${g.time.toFixed(2)} S   HAMRA VÄNSTER/HÖGER`);
    if (g.done) centered(ctx, g.msg, 30, '#f0e030', true);
    if (g.over) overBox(ctx, 'LOPPET SLUT', `${g.score} POÄNG`);
  };
  return g;
}

// ---- tennis: racket längst ner, datorn längst upp ----
function tennis(S, skin) {
  const g = { title: S.title || 'TENNIS', score: 0, lives: -1, over: false, t: 0, p: { x: W / 2 }, c: { x: W / 2 }, ball: { x: W / 2, y: H / 2, vx: 60, vy: 90 }, pts: [0, 0], serveT: 0 };
  g.update = (dt, inp) => {
    g.t += dt;
    if (g.over) { if (inp.start) Object.assign(g, create(skin)); return; }
    if (g.serveT > 0) { g.serveT -= dt; return; }
    const b = g.ball, p = g.p;
    if (inp.left) p.x -= 120 * dt; if (inp.right) p.x += 120 * dt; p.x = clamp(p.x, 14, W - 14);
    g.c.x += (b.x - g.c.x) * Math.min(1, 3 * dt);
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.x < 4 || b.x > W - 4) { b.vx *= -1; b.x = clamp(b.x, 4, W - 4); }
    if (b.vy > 0 && b.y > H - 16 && b.y < H - 10 && Math.abs(b.x - p.x) < 14) { b.vy = -Math.abs(b.vy) * (inp.a ? 1.25 : 1); b.vx += (b.x - p.x) * 6; g.score += 10; }
    if (b.vy < 0 && b.y < 22 && b.y > 16 && Math.abs(b.x - g.c.x) < 12) { b.vy = Math.abs(b.vy); b.vx += (b.x - g.c.x) * 5 + rnd(-20, 20); }
    if (b.y > H) { g.pts[1]++; g.serve(); } if (b.y < 0) { g.pts[0]++; g.score += 100; g.serve(); }
    if (g.pts[0] >= 5 || g.pts[1] >= 5) { g.over = true; g.msg = g.pts[0] >= 5 ? 'GAME, SET, MATCH!' : 'DATORN VANN'; }
  };
  g.serve = () => { g.ball = { x: W / 2, y: H / 2, vx: rnd(-60, 60), vy: (Math.random() < 0.5 ? 1 : -1) * 90 }; g.serveT = 0.8; };
  g.draw = (ctx) => {
    R(ctx, 0, 0, W, H, S.mode === 'pinball' ? '#1a1a44' : '#3fb04a'); R(ctx, 20, 12, W - 40, H - 20, S.mode === 'pinball' ? '#2a2a5a' : '#2f8f46');
    R(ctx, 20, H / 2, W - 40, 2, '#f4f2ec'); R(ctx, 20, 12, 1, H - 20, '#f4f2ec'); R(ctx, W - 21, 12, 1, H - 20, '#f4f2ec');
    R(ctx, g.p.x - 12, H - 12, 24, 4, '#e23b5a'); R(ctx, g.p.x - 2, H - 10, 4, 6, '#f6d7bf');
    R(ctx, g.c.x - 12, 16, 24, 4, '#3a78d8'); R(ctx, g.c.x - 2, 12, 4, 6, '#e0a97f');
    const b = g.ball; R(ctx, b.x - 2, b.y - 2, 4, 4, '#f0e030');
    hud(ctx, g.score, -1, `${g.pts[0]} - ${g.pts[1]}   FÖRST TILL 5   A = HÅRT`);
    if (g.over) overBox(ctx, g.msg, `${g.pts[0]} - ${g.pts[1]}`);
  };
  return g;
}
