// Stad uppifrån: kör i kvarteren, hämta uppdrag (paket eller passagerare), akta fotgängarna –
// annars kommer polisen. (GTA, Crazy Taxi, Cyberpunk …)
import { W, H, R, text, hud, overBox, rnd, irnd, clamp } from './common.js';

const BLOCK = 64, ROAD = 20, N = 6;
export function create(skin = {}) {
  const S = { mode: 'gta', carCol: '#3a78d8', night: false, neon: false, sun: false, ...skin };
  const g = { title: S.title || 'STAD', score: 0, lives: -1, over: false, t: 0, time: 90, wanted: 0, fares: 0, rider: false };
  const size = N * (BLOCK + ROAD);
  const onRoad = (x, y) => { const m = BLOCK + ROAD, mx = ((x % m) + m) % m, my = ((y % m) + m) % m; return mx < ROAD || my < ROAD; };
  g.car = { x: ROAD / 2, y: ROAD / 2 + BLOCK + ROAD, a: 0, v: 0 };
  g.peds = []; for (let i = 0; i < 24; i++) g.peds.push({ x: irnd(0, size), y: irnd(0, size), a: rnd(0, 6.28), t: 0, col: ['#e23b5a', '#3fb04a', '#f0e030', '#f4f2ec'][i % 4] });
  g.cops = [];
  const newTarget = () => { let x, y, k = 0; do { x = irnd(0, N - 1) * (BLOCK + ROAD) + ROAD / 2; y = irnd(0, N - 1) * (BLOCK + ROAD) + ROAD / 2; } while (Math.hypot(x - g.car.x, y - g.car.y) < 100 && k++ < 20); g.target = { x, y }; };
  newTarget();
  g.update = (dt, inp) => {
    g.t += dt;
    if (g.over) { if (inp.start) Object.assign(g, create(skin)); return; }
    const c = g.car;
    if (inp.up || inp.a) c.v = Math.min(120, c.v + 90 * dt); else if (inp.down) c.v = Math.max(-40, c.v - 120 * dt); else c.v *= Math.pow(0.15, dt);
    const tw = 2.6 * dt * Math.min(1, Math.abs(c.v) / 40);
    if (inp.left) c.a -= tw; if (inp.right) c.a += tw;
    const nx = c.x + Math.cos(c.a) * c.v * dt, ny = c.y + Math.sin(c.a) * c.v * dt;
    if (onRoad(nx, c.y)) c.x = nx; else c.v *= 0.3;
    if (onRoad(c.x, ny)) c.y = ny; else c.v *= 0.3;
    c.x = clamp(c.x, 0, size - 1); c.y = clamp(c.y, 0, size - 1);
    g.time -= dt; if (g.time <= 0) { g.over = true; return; }
    for (const p of g.peds) {
      p.t += dt; if (p.t > 2) { p.t = 0; p.a = rnd(0, 6.28); }
      const px = p.x + Math.cos(p.a) * 12 * dt, py = p.y + Math.sin(p.a) * 12 * dt;
      if (onRoad(px, py)) { p.x = px; p.y = py; } else p.a += 3;
      if (Math.hypot(p.x - c.x, p.y - c.y) < 8 && Math.abs(c.v) > 20) { p.x = irnd(0, size); p.y = irnd(0, size); if (S.mode === 'gta') { g.wanted = Math.min(5, g.wanted + 1); g.score = Math.max(0, g.score - 50); if (g.cops.length < g.wanted) g.cops.push({ x: c.x + rnd(-120, 120), y: c.y + rnd(-120, 120) }); } else g.time -= 3; }
    }
    for (const k of g.cops) { const a = Math.atan2(c.y - k.y, c.x - k.x); k.x += Math.cos(a) * 95 * dt; k.y += Math.sin(a) * 95 * dt; if (Math.hypot(k.x - c.x, k.y - c.y) < 10) { c.v *= 0.5; g.busted = (g.busted || 0) + dt; if (g.busted > 1.2) { g.over = true; g.msg = 'GRIPEN'; } } }
    g.wantedT = (g.wantedT || 0) + dt; if (g.wantedT > 12 && g.wanted > 0) { g.wantedT = 0; g.wanted--; g.cops.pop(); }
    const t = g.target;
    if (t && Math.hypot(t.x - c.x, t.y - c.y) < 14) {
      if (S.mode === 'taxi') { if (!g.rider) { g.rider = true; newTarget(); } else { g.rider = false; g.fares++; const fare = 100 + Math.round(g.time); g.score += fare; g.time += 12; g.pop = { t: 0.8, s: `+${fare}` }; newTarget(); } }
      else { g.score += 100; g.time += 8; g.pop = { t: 0.8, s: '+100' }; newTarget(); }
    }
    if (g.pop) { g.pop.t -= dt; if (g.pop.t <= 0) g.pop = null; }
  };
  g.draw = (ctx) => {
    const c = g.car, camx = Math.round(clamp(c.x - W / 2, 0, size - W)), camy = Math.round(clamp(c.y - H / 2, 0, size - H));
    const night = S.night || S.neon, road = night ? '#2a2a34' : '#5a5a66', side = night ? '#3a3a44' : '#8a8f9c';
    R(ctx, 0, 0, W, H, road);
    for (let by = 0; by < N; by++) for (let bx = 0; bx < N; bx++) {
      const x = bx * (BLOCK + ROAD) + ROAD - camx, y = by * (BLOCK + ROAD) + ROAD - camy;
      if (x > W || y > H || x + BLOCK < 0 || y + BLOCK < 0) continue;
      R(ctx, x, y, BLOCK, BLOCK, side);
      const col = S.neon ? ['#4a1a5a', '#1a3a5a', '#3a1a3a'][(bx + by) % 3] : night ? ['#3a3a5a', '#2a3a4a', '#4a3a3a'][(bx + by) % 3] : ['#c98a4a', '#8a8f9c', '#e0a02a', '#5a8aaa'][(bx * 3 + by) % 4];
      R(ctx, x + 4, y + 4, BLOCK - 8, BLOCK - 8, col);
      for (let wy = 8; wy < BLOCK - 8; wy += 8) for (let wx = 8; wx < BLOCK - 8; wx += 8) if ((wx + wy + bx) % 3) R(ctx, x + wx, y + wy, 3, 3, night ? (S.neon ? ['#e83fb8', '#3fd0e0'][(wx + wy) % 2] : '#f0e030') : '#3a3a44');
      if (S.sun && (bx + by) % 4 === 0) { R(ctx, x + 8, y + 8, 12, 12, '#3fb04a'); R(ctx, x + 12, y + 12, 4, 10, '#5a3d2b'); }
    }
    for (let i = 0; i <= N; i++) { const gx = i * (BLOCK + ROAD) + ROAD / 2 - camx, gy = i * (BLOCK + ROAD) + ROAD / 2 - camy; for (let k = 0; k < size; k += 12) { if (gx >= 0 && gx < W) R(ctx, gx, k - camy, 1, 6, '#f0e030'); if (gy >= 0 && gy < H) R(ctx, k - camx, gy, 6, 1, '#f0e030'); } }
    for (const p of g.peds) { const x = p.x - camx, y = p.y - camy; if (x < -4 || x > W || y < -4 || y > H) continue; R(ctx, x - 1, y - 2, 3, 3, p.col); R(ctx, x - 1, y - 3, 3, 1, '#f6d7bf'); }
    const t = g.target;
    if (t) { const x = t.x - camx, y = t.y - camy; if (S.mode === 'taxi' && !g.rider) { R(ctx, x - 2, y - 5, 4, 3, '#f6d7bf'); R(ctx, x - 3, y - 2, 6, 5, '#f0e030'); if (Math.floor(g.t * 3) % 2) R(ctx, x - 1, y - 12, 2, 5, '#f0e030'); } else R(ctx, x - 4, y - 4, 8, 8, Math.floor(g.t * 4) % 2 ? '#f0e030' : '#e23b5a'); }
    const drawCar = (x, y, a, col) => { const cs = Math.cos(a), sn = Math.sin(a); for (let i = -5; i <= 5; i++) for (let j = -3; j <= 3; j++) { R(ctx, x + i * cs - j * sn, y + i * sn + j * cs, 1.4, 1.4, Math.abs(j) === 3 ? '#1a1a1e' : i > 1 && Math.abs(j) < 2 ? '#7ab0e0' : col); } };
    for (const k of g.cops) drawCar(k.x - camx, k.y - camy, Math.atan2(c.y - k.y, c.x - k.x), Math.floor(g.t * 6) % 2 ? '#3a78d8' : '#f4f2ec');
    drawCar(c.x - camx, c.y - camy, c.a, S.carCol);
    if (t) { const a = Math.atan2(t.y - c.y, t.x - c.x), ax = W / 2 + Math.cos(a) * 24, ay = 30 + Math.sin(a) * 12; R(ctx, ax - 2, ay - 2, 4, 4, '#f0e030'); R(ctx, ax + Math.cos(a) * 4 - 1, ay + Math.sin(a) * 4 - 1, 2, 2, '#f0e030'); }
    if (night) R(ctx, 0, 0, W, H, 'rgba(10,10,40,.25)');
    if (g.pop) text(ctx, g.pop.s, W / 2 - 10, 50, '#f0e030', true);
    hud(ctx, g.score, -1, `TID ${Math.max(0, Math.ceil(g.time))}   ${S.mode === 'taxi' ? (g.rider ? 'KÖR TILL MÅLET' : 'HÄMTA KUNDEN') : `POLIS ${g.wanted}/5`}`);
    if (g.over) overBox(ctx, g.msg || 'TIDEN UTE', `${g.score} POÄNG`);
  };
  return g;
}
