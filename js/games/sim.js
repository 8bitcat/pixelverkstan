// Sim i tre lägen: 'city' (bygg vägar, hus, affärer och kraftverk – befolkningen växer där det
// finns väg och ström), 'pet' (ett husdjur eller en sim med behov att hålla uppe) och 'farm'
// (så, vattna, skörda). SimCity 2000, The Sims, Nintendogs, Animal Crossing.
import { W, H, R, text, centered, hud, overBox, rnd, irnd, clamp } from './common.js';

export function create(skin = {}) {
  const S = { mode: 'city', pet: 'dog', ...skin };
  if (S.mode === 'pet') return pet(S, skin);
  if (S.mode === 'farm') return farm(S, skin);
  const GW = 12, GH = 7, CS = 20, OX = 0, OY = 14;
  const TOOLS = [['road', 'VÄG', 10, '#5a5a66'], ['house', 'HUS', 50, '#e0a02a'], ['shop', 'AFFÄR', 80, '#3a78d8'], ['power', 'KRAFTVERK', 200, '#8a8f9c'], ['park', 'PARK', 30, '#3fb04a']];
  const g = { title: S.title || 'STADEN', score: 0, lives: -1, over: false, t: 0, money: 500, pop: 0, tool: 0, cx: 5, cy: 3, grid: [], tick: 0, year: 1, msg: '', msgT: 0, moveT: 0 };
  for (let y = 0; y < GH; y++) g.grid.push(new Array(GW).fill(null));
  const at = (x, y) => g.grid[y]?.[x] || null;
  const nearRoad = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => at(x + dx, y + dy)?.k === 'road');
  g.update = (dt, inp) => {
    g.t += dt; g.msgT = Math.max(0, g.msgT - dt); g.moveT = Math.max(0, g.moveT - dt);
    if (g.over) { if (inp.start) Object.assign(g, create(skin)); return; }
    if (g.moveT <= 0) { let m = false; if (inp.left) { g.cx--; m = true; } if (inp.right) { g.cx++; m = true; } if (inp.up) { g.cy--; m = true; } if (inp.down) { g.cy++; m = true; } if (m) g.moveT = 0.14; }
    g.cx = clamp(g.cx, 0, GW - 1); g.cy = clamp(g.cy, 0, GH - 1);
    if (inp.bHit) g.tool = (g.tool + 1) % TOOLS.length;
    if (inp.aHit) { const [k, name, cost] = TOOLS[g.tool]; if (at(g.cx, g.cy)) { g.grid[g.cy][g.cx] = null; g.msg = 'RIVET'; g.msgT = 0.6; } else if (g.money >= cost) { g.money -= cost; g.grid[g.cy][g.cx] = { k, pop: 0, fire: 0 }; } else { g.msg = 'FÖR DYRT'; g.msgT = 0.6; } }
    g.tick += dt;
    if (g.tick >= 2) {
      g.tick = 0; g.year++;
      const powered = g.grid.some((r) => r.some((c) => c?.k === 'power'));
      let pop = 0, income = 0;
      for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const c = at(x, y); if (!c) continue;
        if (c.fire > 0) { c.fire--; if (c.fire === 0) g.grid[y][x] = null; continue; }
        if (c.k === 'house') { if (nearRoad(x, y) && powered) c.pop = Math.min(8, c.pop + 1); else c.pop = Math.max(0, c.pop - 1); pop += c.pop; }
        if (c.k === 'shop' && nearRoad(x, y) && powered) income += 12;
        if (c.k === 'park') pop += 1;
        if (Math.random() < 0.004 && c.k !== 'road') { c.fire = 3; g.msg = 'BRAND!'; g.msgT = 1; }
      }
      g.pop = pop; g.money += income + Math.floor(pop / 2); g.score = pop * 10 + g.year;
      if (g.year >= 60) { g.over = true; g.msg = `${pop} INVÅNARE`; }
    }
  };
  g.draw = (ctx) => {
    R(ctx, 0, 0, W, H, '#2f8f46');
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      const px = OX + x * CS, py = OY + y * CS, c = at(x, y);
      R(ctx, px, py, CS - 1, CS - 1, (x + y) % 2 ? '#3fb04a' : '#38a044');
      if (!c) continue;
      if (c.k === 'road') { R(ctx, px, py, CS - 1, CS - 1, '#5a5a66'); R(ctx, px + 9, py + 2, 2, 4, '#f0e030'); R(ctx, px + 9, py + 12, 2, 4, '#f0e030'); }
      else if (c.k === 'house') { const h = 6 + c.pop; R(ctx, px + 4, py + CS - 3 - h, 12, h, c.pop ? '#e0a02a' : '#8a7a5a'); R(ctx, px + 3, py + CS - 5 - h, 14, 3, '#c04a3a'); for (let i = 0; i < Math.min(3, c.pop); i++) R(ctx, px + 6 + i * 3, py + CS - 6, 2, 2, '#f0e030'); }
      else if (c.k === 'shop') { R(ctx, px + 3, py + 6, 14, 11, '#3a78d8'); R(ctx, px + 3, py + 4, 14, 3, '#e23b5a'); R(ctx, px + 8, py + 10, 4, 7, '#1a1a1e'); }
      else if (c.k === 'power') { R(ctx, px + 4, py + 6, 12, 11, '#8a8f9c'); R(ctx, px + 6, py + 1, 3, 6, '#5a5a66'); R(ctx, px + 11, py + 1, 3, 6, '#5a5a66'); if (Math.floor(g.t * 2) % 2) R(ctx, px + 5, py - 2, 3, 3, '#c8c8d0'); }
      else if (c.k === 'park') { R(ctx, px + 8, py + 8, 4, 8, '#5a3d2b'); R(ctx, px + 4, py + 2, 12, 8, '#2f8f46'); }
      if (c.fire > 0) R(ctx, px + 6, py + 2 + (Math.floor(g.t * 8) % 2) * 2, 8, 10, Math.floor(g.t * 10) % 2 ? '#e23b5a' : '#f0e030');
    }
    R(ctx, OX + g.cx * CS - 1, OY + g.cy * CS - 1, CS + 1, 1, '#f4f2ec'); R(ctx, OX + g.cx * CS - 1, OY + g.cy * CS + CS - 1, CS + 1, 1, '#f4f2ec'); R(ctx, OX + g.cx * CS - 1, OY + g.cy * CS - 1, 1, CS + 1, '#f4f2ec'); R(ctx, OX + g.cx * CS + CS - 1, OY + g.cy * CS - 1, 1, CS + 1, '#f4f2ec');
    const [k, name, cost, col] = TOOLS[g.tool];
    R(ctx, 0, H - 6, W, 6, '#1a1a1e'); R(ctx, 2, H - 5, 4, 4, col); text(ctx, `${name} ${cost} KR   B=BYT VERKTYG  A=BYGG/RIV`, 10, H - 5, '#f4f2ec');
    hud(ctx, g.score, -1, `ÅR ${g.year}   ${g.pop} INV   ${g.money} KR`);
    if (g.msgT > 0) centered(ctx, g.msg, 70, '#f0e030', true);
    if (g.over) overBox(ctx, 'SLUT', g.msg);
  };
  return g;
}

// ---- husdjur/sim: fyra behov, fyra knappar ----
function pet(S, skin) {
  const NEEDS = [['HUNGER', '🍖'], ['LEK', '⚽'], ['REN', '🧼'], ['SÖMN', '💤']];
  const ACTS = ['MATA', 'LEKA', 'TVÄTTA', 'SOVA'];
  const g = { title: S.title || 'HUSDJUR', score: 0, lives: -1, over: false, t: 0, needs: [70, 70, 70, 70], sel: 0, act: null, actT: 0, low: 0, day: 1, dayT: 0 };
  g.update = (dt, inp) => {
    g.t += dt;
    if (g.over) { if (inp.start) Object.assign(g, create(skin)); return; }
    if (inp.leftHit) g.sel = (g.sel + 3) % 4; if (inp.rightHit) g.sel = (g.sel + 1) % 4;
    if (inp.aHit && !g.act) { g.act = g.sel; g.actT = 1; }
    if (g.act != null) { g.actT -= dt; g.needs[g.act] = Math.min(100, g.needs[g.act] + 40 * dt); if (g.actT <= 0) g.act = null; }
    for (let i = 0; i < 4; i++) g.needs[i] = Math.max(0, g.needs[i] - dt * (2.5 + i * 0.6 + g.day * 0.3));
    const avg = g.needs.reduce((a, b) => a + b, 0) / 4;
    g.score += Math.floor(avg > 50 ? dt * 10 : 0);
    if (g.needs.some((n) => n <= 0)) { g.low += dt; if (g.low > 8) { g.over = true; g.msg = S.pet === 'dog' ? 'HUNDEN RYMDE' : 'SIMMEN FLYTTADE'; } } else g.low = 0;
    g.dayT += dt; if (g.dayT > 30) { g.dayT = 0; g.day++; }
  };
  g.draw = (ctx) => {
    R(ctx, 0, 0, W, H, S.pet === 'dog' ? '#7ab0e0' : '#e8dcc8'); R(ctx, 0, 100, W, 60, S.pet === 'dog' ? '#3fb04a' : '#8a5a3a');
    const x = W / 2, y = 98, bob = Math.round(Math.sin(g.t * 4) * 2), avg = g.needs.reduce((a, b) => a + b, 0) / 4;
    if (S.pet === 'dog') { R(ctx, x - 14, y - 16 + bob, 26, 14, '#c98a4a'); R(ctx, x + 6, y - 24 + bob, 12, 12, '#c98a4a'); R(ctx, x + 14, y - 22 + bob, 4, 8, '#8a5a3a'); R(ctx, x + 10, y - 20 + bob, 2, 2, '#1a1a1e'); R(ctx, x - 12, y - 2, 4, 4, '#8a5a3a'); R(ctx, x + 4, y - 2, 4, 4, '#8a5a3a'); R(ctx, x - 18, y - 14 + bob + (Math.floor(g.t * 6) % 2 ? 2 : 0), 5, 3, '#c98a4a'); }
    else { R(ctx, x - 4, y - 30 + bob, 8, 8, '#f6d7bf'); R(ctx, x - 4, y - 30 + bob, 8, 2, '#5a3d2b'); R(ctx, x - 6, y - 22 + bob, 12, 12, '#3fb04a'); R(ctx, x - 5, y - 10, 4, 10, '#2d3a5c'); R(ctx, x + 1, y - 10, 4, 10, '#2d3a5c'); R(ctx, x - 2, y - 44, 4, 4, avg > 60 ? '#3fb04a' : avg > 30 ? '#f0e030' : '#e23b5a'); }
    if (g.act === 0) R(ctx, x - 26, y - 6, 8, 6, '#c04a3a'); if (g.act === 1) R(ctx, x + 22 + Math.round(Math.sin(g.t * 10) * 6), y - 8, 6, 6, '#f4f2ec'); if (g.act === 2) for (let i = 0; i < 6; i++) R(ctx, x - 16 + i * 6, y - 30 - (Math.floor(g.t * 8 + i) % 4) * 3, 3, 3, '#e8f0f8'); if (g.act === 3) text(ctx, 'ZZZ', x + 14, y - 36, '#f4f2ec');
    for (let i = 0; i < 4; i++) { const bx = 12 + i * 56; R(ctx, bx, 16, 48, 6, '#1a1a1e'); R(ctx, bx, 16, 48 * g.needs[i] / 100, 6, g.needs[i] > 40 ? '#3fb04a' : g.needs[i] > 15 ? '#f0e030' : '#e23b5a'); text(ctx, NEEDS[i][0], bx, 24, '#f4f2ec'); }
    for (let i = 0; i < 4; i++) { const bx = 12 + i * 56, on = i === g.sel; R(ctx, bx, H - 22, 48, 14, on ? '#f0e030' : '#3a3a44'); text(ctx, ACTS[i], bx + 4, H - 18, on ? '#1a1a1e' : '#f4f2ec'); }
    hud(ctx, g.score, -1, `DAG ${g.day}   PILAR + A`);
    if (g.over) overBox(ctx, g.msg, `${g.day} DAGAR`);
  };
  return g;
}

// ---- odla: så, vattna, skörda ----
function farm(S, skin) {
  const GW = 10, GH = 6, CS = 22, OX = 10, OY = 16;
  const g = { title: S.title || 'GÅRDEN', score: 0, lives: -1, over: false, t: 0, coins: 20, cx: 4, cy: 2, grid: [], day: 1, dayT: 0, moveT: 0, msg: '', msgT: 0 };
  for (let y = 0; y < GH; y++) g.grid.push(new Array(GW).fill(null));
  g.update = (dt, inp) => {
    g.t += dt; g.moveT = Math.max(0, g.moveT - dt); g.msgT = Math.max(0, g.msgT - dt);
    if (g.over) { if (inp.start) Object.assign(g, create(skin)); return; }
    if (g.moveT <= 0) { let m = false; if (inp.left) { g.cx--; m = true; } if (inp.right) { g.cx++; m = true; } if (inp.up) { g.cy--; m = true; } if (inp.down) { g.cy++; m = true; } if (m) g.moveT = 0.14; }
    g.cx = clamp(g.cx, 0, GW - 1); g.cy = clamp(g.cy, 0, GH - 1);
    const c = g.grid[g.cy][g.cx];
    if (inp.aHit) { if (!c) { if (g.coins >= 5) { g.coins -= 5; g.grid[g.cy][g.cx] = { g: 0, w: 0, weed: false }; } else { g.msg = 'INGA MYNT'; g.msgT = 0.6; } } else if (c.weed) { g.grid[g.cy][g.cx] = null; } else if (c.g >= 3) { g.grid[g.cy][g.cx] = null; g.coins += 15; g.score += 15; g.msg = '+15'; g.msgT = 0.5; } }
    if (inp.bHit && c && !c.weed) c.w = 1;
    for (const row of g.grid) for (const p of row) if (p && !p.weed && p.g < 3) { p.gt = (p.gt || 0) + dt * (p.w ? 2 : 0.6); if (p.gt > 4) { p.gt = 0; p.g++; p.w = 0; } }
    g.dayT += dt; if (g.dayT > 20) { g.dayT = 0; g.day++; const x = irnd(0, GW - 1), y = irnd(0, GH - 1); if (!g.grid[y][x]) g.grid[y][x] = { weed: true, g: 0 }; if (g.day > 15) { g.over = true; g.msg = `${g.coins} MYNT`; } }
  };
  g.draw = (ctx) => {
    R(ctx, 0, 0, W, H, '#7ab0e0'); R(ctx, 0, 40, W, 120, '#3fb04a');
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      const px = OX + x * CS, py = OY + y * CS, c = g.grid[y][x];
      R(ctx, px, py, CS - 2, CS - 2, c && !c.weed ? (c.w ? '#5a3d2b' : '#8a5a3a') : '#a06a2a');
      if (c?.weed) { R(ctx, px + 6, py + 6, 3, 10, '#2f6f3a'); R(ctx, px + 11, py + 4, 3, 12, '#2f6f3a'); }
      else if (c) { const h = 4 + c.g * 4; R(ctx, px + 9, py + CS - 4 - h, 3, h, '#3fb04a'); if (c.g >= 2) R(ctx, px + 5, py + CS - 8 - h, 4, 4, '#3fb04a'); if (c.g >= 3) R(ctx, px + 7, py + CS - 6 - h, 7, 6, c.g >= 3 ? '#e23b5a' : '#3fb04a'); }
    }
    R(ctx, OX + g.cx * CS - 1, OY + g.cy * CS - 1, CS, 1, '#f4f2ec'); R(ctx, OX + g.cx * CS - 1, OY + g.cy * CS + CS - 2, CS, 1, '#f4f2ec'); R(ctx, OX + g.cx * CS - 1, OY + g.cy * CS - 1, 1, CS, '#f4f2ec'); R(ctx, OX + g.cx * CS + CS - 2, OY + g.cy * CS - 1, 1, CS, '#f4f2ec');
    text(ctx, 'A = SÅ (5) / SKÖRDA / RENSA   B = VATTNA', 4, H - 8, '#f4f2ec');
    hud(ctx, g.score, -1, `DAG ${g.day}/15   ${g.coins} MYNT`);
    if (g.msgT > 0) centered(ctx, g.msg, 70, '#f0e030', true);
    if (g.over) overBox(ctx, 'SÄSONGEN SLUT', g.msg);
  };
  return g;
}
