// Racer: pseudo-3D-väg i fyra lägen – 'road' (Out Run: tid mellan checkpoints), 'gt' (varv och
// placering mot rivaler), 'kart' (bananer på vägen, turbo-plattor, placering) och 'drift' (natt, skarpa kurvor).
import { W, H, R, hud, overBox, rnd, irnd, clamp } from './common.js';

export function create(skin = {}) {
  const S = { mode: 'road', car: '#e23b5a', night: false, dirt: false, laps: 3, ...skin };
  const M = S.mode, LAP = 5200;
  const g = { title: S.title || 'RACER', score: 0, lives: -1, over: false, t: 0, pos: 0, speed: 0, x: 0, time: M === 'road' ? 45 : 999, cars: [], cp: 0, lap: 1, items: [], spin: 0, boost: 0, rank: 1 };
  const SEG = 200, MAXS = M === 'kart' ? 200 : 240, sharp = M === 'drift' ? 2 : 1;
  const curveAt = (z) => (Math.sin(z / 900) * 1.4 + Math.sin(z / 2300) * 1.2) * sharp;
  const cols = M === 'kart' ? ['#3fb04a', '#f0e030', '#3a78d8', '#f4f2ec', '#b58cff', '#e07a2e', '#ff9acb'] : ['#3a78d8', '#f0e030', '#3fb04a', '#f4f2ec'];
  for (let i = 0; i < (M === 'road' ? 8 : 7); i++) g.cars.push({ z: 300 + i * 260, x: rnd(-0.6, 0.6), v: M === 'road' ? rnd(60, 110) : rnd(150, 200), col: cols[i % cols.length], dist: 300 + i * 260 });
  if (M === 'kart') for (let i = 0; i < 12; i++) g.items.push({ z: 400 + i * 420, x: rnd(-0.7, 0.7), kind: Math.random() < 0.6 ? 'banana' : 'boost' });
  g.update = (dt, inp) => {
    g.t += dt;
    if (g.over) { if (inp.start) Object.assign(g, create(skin)); return; }
    const acc = inp.a || inp.up || !S.needGas ? 1 : 0;
    g.spin = Math.max(0, g.spin - dt); g.boost = Math.max(0, g.boost - dt);
    g.speed += (acc ? 70 : -50) * dt; if (inp.down) g.speed -= 120 * dt;
    if (g.spin) g.speed = Math.min(g.speed, 40);
    g.speed = clamp(g.speed, 0, MAXS + (g.boost ? 80 : 0));
    if (Math.abs(g.x) > 1) g.speed = Math.min(g.speed, S.dirt ? 120 : 80);
    const c = curveAt(g.pos);
    g.x -= c * (g.speed / MAXS) * (M === 'drift' ? 1.4 : 1.1) * dt;
    const steer = 1.8 * dt * (g.speed / MAXS + 0.3) * (g.spin ? 0.3 : 1);
    if (inp.left) g.x -= steer; if (inp.right) g.x += steer;
    g.x = clamp(g.x, -1.6, 1.6);
    g.pos += g.speed * dt;
    if (M === 'road') { g.score = Math.floor(g.pos / 10); g.time -= dt; if (g.pos > (g.cp + 1) * 2600) { g.cp++; g.time += 30; g.bonus = 1.5; } if (g.time <= 0) g.over = true; }
    else {
      if (g.pos >= g.lap * LAP) { g.lap++; g.bonus = 1.5; if (g.lap > S.laps) { g.over = true; g.msg = g.rank === 1 ? 'DU VANN!' : `PLATS ${g.rank}`; g.score += g.rank === 1 ? 2000 : Math.max(0, 800 - g.rank * 100); } }
      g.rank = 1 + g.cars.filter((car) => car.dist > g.pos).length;
      g.score = Math.floor(g.pos / 20) + (8 - g.rank) * 10;
    }
    g.bonus = Math.max(0, (g.bonus || 0) - dt);
    for (const car of g.cars) {
      if (M === 'road') { car.z += (car.v - g.speed) * dt; if (car.z < -60) { car.z += 2200; car.x = rnd(-0.7, 0.7); } if (car.z > 2400) { car.z -= 2200; car.x = rnd(-0.7, 0.7); } }
      else { car.dist += car.v * dt * (0.9 + Math.sin(g.t + car.dist) * 0.08); car.z = car.dist - g.pos; if (Math.random() < dt * 0.3) car.x = clamp(car.x + rnd(-0.3, 0.3), -0.7, 0.7); }
      if (car.z > 0 && car.z < 30 && Math.abs(car.x - g.x) < 0.35 && g.speed > car.v) { g.speed = car.v * 0.5; g.crash = 0.5; }
    }
    for (const it of g.items) { const z = it.z - g.pos; if (z > -10 && z < 20 && Math.abs(it.x - g.x) < 0.3 && !it.used) { it.used = true; if (it.kind === 'banana') { g.spin = 0.8; g.crash = 0.6; } else { g.boost = 1.5; g.speed = MAXS + 80; } } if (it.z - g.pos < -100) { it.z += LAP; it.used = false; it.x = rnd(-0.7, 0.7); } }
    g.crash = Math.max(0, (g.crash || 0) - dt);
  };
  g.draw = (ctx) => {
    const horizon = 60, night = S.night;
    R(ctx, 0, 0, W, horizon, night ? '#0a0a2a' : S.sky || '#3a9ad8'); R(ctx, 0, horizon - 14, W, 14, night ? '#1a1a3a' : S.sky2 || '#7ab0e0');
    if (night) for (let i = 0; i < 25; i++) R(ctx, (i * 37) % W, (i * 17) % 40, 1, 1, '#f4f2ec');
    const bgx = -curveAt(g.pos) * 40;
    for (let i = 0; i < 6; i++) { const mx = ((i * 60 + bgx) % (W + 60) + W + 60) % (W + 60) - 30; R(ctx, mx, horizon - 22, 40, 22, night ? '#1a1a2a' : S.hill || '#5a8aaa'); R(ctx, mx + 10, horizon - 30, 20, 8, night ? '#1a1a2a' : S.hill || '#5a8aaa'); }
    const grass = night ? '#1a2a1a' : S.grass || '#3fa04a', grass2 = night ? '#182818' : S.dirt ? '#b07a3a' : '#3a9048';
    R(ctx, 0, horizon, W, H - horizon, grass);
    let dx = 0, ddx = 0, cx = W / 2 - g.x * 60;
    const rows = H - horizon;
    for (let i = rows - 1; i >= 0; i--) {
      const y = horizon + i, z = (rows - i) / rows, depth = 1 / (0.06 + z * 0.94), scale = 1 / depth, worldZ = g.pos + i * i * 0.12;
      ddx = curveAt(worldZ) * 0.9; dx += ddx * scale * 0.4;
      const half = 100 * scale + 2, roadX = cx + dx * (1 - scale) * 60, band = Math.floor(worldZ / SEG) % 2;
      R(ctx, 0, y, W, 1, band ? grass : grass2);
      R(ctx, roadX - half - 6 * scale, y, half * 2 + 12 * scale, 1, band ? '#e23b5a' : '#f4f2ec');
      R(ctx, roadX - half, y, half * 2, 1, S.dirt ? (band ? '#8a6a3a' : '#9a7a4a') : night ? (band ? '#2a2a34' : '#30303a') : (band ? '#5a5a66' : '#62626e'));
      if (band) R(ctx, roadX - 1, y, 2, 1, '#f4f2ec');
      if (M === 'kart' && Math.floor(worldZ / 10) % 40 === 0) R(ctx, roadX - half, y, half * 2, 1, '#f0e030');
      const zLo = i * i * 0.12, zHi = (i + 1) * (i + 1) * 0.12;
      for (const it of g.items) { const cz = (it.z - g.pos) / 1.3; if (!it.used && cz > zLo && cz <= zHi) { const sz = 8 * scale + 2; if (it.kind === 'banana') R(ctx, roadX + it.x * half - sz / 2, y - sz, sz, sz, '#f0e030'); else R(ctx, roadX + it.x * half - sz, y - 2, sz * 2, 2, '#3fd0e0'); } }
      for (const car of g.cars) {
        const cz = car.z / 1.3;
        if (cz > zLo && cz <= zHi) {
          const cw = 22 * scale + 3, ch = 10 * scale + 2, carX = roadX + car.x * half;
          R(ctx, carX - cw / 2, y - ch, cw, ch, car.col); R(ctx, carX - cw / 3, y - ch - ch * 0.5, cw / 1.5, ch * 0.5, M === 'kart' ? '#f6d7bf' : '#7ab0e0'); R(ctx, carX - cw / 2, y - 2, cw / 5, 2, '#1a1a1e'); R(ctx, carX + cw / 2 - cw / 5, y - 2, cw / 5, 2, '#1a1a1e');
          if (night) { R(ctx, carX - cw / 2, y - 3, 3, 2, '#e23b5a'); R(ctx, carX + cw / 2 - 3, y - 3, 3, 2, '#e23b5a'); }
        }
      }
    }
    const px = W / 2 + (g.crash ? rnd(-2, 2) : 0), py = H - 10, lean = Math.round(Math.sin(g.t * 20) * (g.crash ? 2 : 0));
    if (g.spin) { const a = g.spin * 12; R(ctx, px - 12 + Math.sin(a) * 6, py - 12, 24, 10, S.car); R(ctx, px - 6, py - 16, 12, 5, '#f6d7bf'); }
    else if (M === 'kart') { R(ctx, px - 12, py - 10, 24, 8, S.car); R(ctx, px - 4, py - 20, 8, 10, '#f6d7bf'); R(ctx, px - 5, py - 22, 10, 3, S.car); R(ctx, px - 16, py - 6, 6, 6, '#1a1a1e'); R(ctx, px + 10, py - 6, 6, 6, '#1a1a1e'); }
    else { R(ctx, px - 14, py - 12, 28, 12, S.car); R(ctx, px - 9 + lean, py - 17, 18, 6, '#7ab0e0'); R(ctx, px - 10, py - 12, 20, 1, 'rgba(255,255,255,.4)'); R(ctx, px - 16, py - 4, 6, 5, '#1a1a1e'); R(ctx, px + 10, py - 4, 6, 5, '#1a1a1e'); R(ctx, px - 12, py - 6, 4, 2, night ? '#e23b5a' : '#f0e030'); R(ctx, px + 8, py - 6, 4, 2, night ? '#e23b5a' : '#f0e030'); }
    if (g.boost) R(ctx, px - 6, py - 2, 12, 4, Math.floor(g.t * 20) % 2 ? '#f0e030' : '#3fd0e0');
    if (night) R(ctx, 0, horizon, W, H - horizon, 'rgba(0,0,20,.25)');
    hud(ctx, g.score, -1, M === 'road' ? `TID ${Math.max(0, Math.ceil(g.time))}   ${Math.round(g.speed)} KM/H` : `VARV ${Math.min(g.lap, S.laps)}/${S.laps}   PLATS ${g.rank}/${g.cars.length + 1}   ${Math.round(g.speed)} KM/H`);
    if (g.bonus > 0) { R(ctx, 70, 40, 100, 12, '#f0e030'); R(ctx, 72, 42, 96, 8, '#1a1a1e'); }
    if (g.over) overBox(ctx, g.msg || 'TIDEN UTE', `${g.score} POÄNG`);
  };
  return g;
}
