// Racer: pseudo-3D-väg med kurvor, andra bilar och tid mellan checkpoints. (Out Run, Daytona …)
import { W, H, R, hud, overBox, rnd, irnd, clamp } from './common.js';

export function create(skin = {}) {
  const g = { title: skin.title || 'RACER', score: 0, lives: -1, over: false, t: 0, pos: 0, speed: 0, x: 0, time: 45, cars: [], curve: 0, nextCurve: 0, cp: 0 };
  const SEG = 200, MAXS = 240;
  const curveAt = (z) => Math.sin(z / 900) * 1.4 + Math.sin(z / 2300) * 1.2;
  for (let i = 0; i < 8; i++) g.cars.push({ z: 300 + i * 260, x: rnd(-0.6, 0.6), v: rnd(60, 110), col: ['#3a78d8', '#f0e030', '#3fb04a', '#f4f2ec'][i % 4] });
  g.update = (dt, inp) => {
    g.t += dt;
    if (g.over) { if (inp.start) Object.assign(g, create(skin)); return; }
    const acc = inp.a || !skin.needGas ? 1 : 0;
    g.speed += (acc ? 70 : -50) * dt; if (inp.down) g.speed -= 120 * dt;
    g.speed = clamp(g.speed, 0, MAXS);
    const off = Math.abs(g.x) > 1 ? 1 : 0;
    if (off) g.speed = Math.min(g.speed, 80);
    const c = curveAt(g.pos);
    g.x -= c * (g.speed / MAXS) * 1.1 * dt;
    if (inp.left) g.x -= 1.8 * dt * (g.speed / MAXS + 0.3); if (inp.right) g.x += 1.8 * dt * (g.speed / MAXS + 0.3);
    g.x = clamp(g.x, -1.6, 1.6);
    g.pos += g.speed * dt;
    g.score = Math.floor(g.pos / 10);
    g.time -= dt;
    if (g.pos > (g.cp + 1) * 2600) { g.cp++; g.time += 30; g.bonus = 1.5; }
    g.bonus = Math.max(0, (g.bonus || 0) - dt);
    if (g.time <= 0) g.over = true;
    for (const car of g.cars) {
      car.z += (car.v - g.speed) * dt;
      if (car.z < -60) { car.z += 2200; car.x = rnd(-0.7, 0.7); }
      if (car.z > 2400) { car.z -= 2200; car.x = rnd(-0.7, 0.7); }
      if (car.z > 0 && car.z < 30 && Math.abs(car.x - g.x) < 0.35 && g.speed > car.v) { g.speed = car.v * 0.5; g.crash = 0.5; }
    }
    g.crash = Math.max(0, (g.crash || 0) - dt);
  };
  g.draw = (ctx) => {
    const horizon = 60;
    R(ctx, 0, 0, W, horizon, skin.sky || '#3a9ad8'); R(ctx, 0, horizon - 14, W, 14, skin.sky2 || '#7ab0e0');
    // berg/palmer i bakgrunden rullar med kurvan
    const bgx = -curveAt(g.pos) * 40;
    for (let i = 0; i < 6; i++) { const mx = ((i * 60 + bgx) % (W + 60) + W + 60) % (W + 60) - 30; R(ctx, mx, horizon - 22, 40, 22, skin.hill || '#5a8aaa'); R(ctx, mx + 10, horizon - 30, 20, 8, skin.hill || '#5a8aaa'); }
    R(ctx, 0, horizon, W, H - horizon, skin.grass || '#3fa04a');
    // vägen segment för segment, nerifrån
    let dx = 0, ddx = 0, cx = W / 2 - g.x * 60;
    const rows = H - horizon;
    for (let i = rows - 1; i >= 0; i--) {
      const y = horizon + i, z = (rows - i) / rows;   // 0 nära .. 1 långt
      const depth = 1 / (0.06 + z * 0.94), scale = 1 / depth;
      const worldZ = g.pos + i * i * 0.12;
      ddx = curveAt(worldZ) * 0.9;
      dx += ddx * scale * 0.4;
      const half = 100 * scale + 2, roadX = cx + dx * (1 - scale) * 60;
      const band = Math.floor(worldZ / SEG) % 2;
      R(ctx, 0, y, W, 1, band ? '#3fa04a' : '#3a9048');
      R(ctx, roadX - half - 6 * scale, y, half * 2 + 12 * scale, 1, band ? '#e23b5a' : '#f4f2ec');
      R(ctx, roadX - half, y, half * 2, 1, band ? '#5a5a66' : '#62626e');
      if (band) R(ctx, roadX - 1, y, 2, 1, '#f4f2ec');
      // bilar på det här djupet
      for (const car of g.cars) {
        const cz = car.z / 1.3;
        if (cz > i * i * 0.12 && cz <= (i + 1) * (i + 1) * 0.12) {
          const cw = 22 * scale + 3, ch = 10 * scale + 2, carX = roadX + car.x * half;
          R(ctx, carX - cw / 2, y - ch, cw, ch, car.col); R(ctx, carX - cw / 3, y - ch - ch * 0.5, cw / 1.5, ch * 0.5, '#7ab0e0'); R(ctx, carX - cw / 2, y - 2, cw / 5, 2, '#1a1a1e'); R(ctx, carX + cw / 2 - cw / 5, y - 2, cw / 5, 2, '#1a1a1e');
        }
      }
    }
    // egen bil
    const px = W / 2 + (g.crash ? rnd(-2, 2) : 0), py = H - 10, lean = inp0(g);
    R(ctx, px - 14, py - 12, 28, 12, skin.car || '#e23b5a'); R(ctx, px - 9 + lean, py - 17, 18, 6, '#7ab0e0'); R(ctx, px - 10, py - 12, 20, 1, '#ff9aae');
    R(ctx, px - 16, py - 4, 6, 5, '#1a1a1e'); R(ctx, px + 10, py - 4, 6, 5, '#1a1a1e'); R(ctx, px - 12, py - 6, 4, 2, '#f0e030'); R(ctx, px + 8, py - 6, 4, 2, '#f0e030');
    hud(ctx, g.score, -1, `TID ${Math.max(0, Math.ceil(g.time))}   ${Math.round(g.speed)} KM/H`);
    if (g.bonus > 0) { R(ctx, 70, 40, 100, 12, '#f0e030'); R(ctx, 72, 42, 96, 8, '#1a1a1e'); }
    if (g.over) overBox(ctx, 'TIDEN UTE', `${g.score} POÄNG`);
  };
  const inp0 = (g) => Math.round(Math.sin(g.t * 20) * (g.crash ? 2 : 0));
  return g;
}
