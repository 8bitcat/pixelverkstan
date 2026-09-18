// Gräv: jord, stenblock som faller, ädelstenar och en utgång som öppnas när du samlat nog –
// Boulder Dash-fysik. 'lode' = guld i stället för stenar. 'mine' = sidovy med tyngdkraft på
// hjälten, hoppa, gräva i alla riktningar (A) och sätta block (B) – Minecraft.
import { W, H, R, hud, overBox, irnd } from './common.js';
import { hero as drawHero, foe as drawFoe, item as drawItem } from './sprites.js';

const CS = 8, GW = 30, GH = 16, OY = 12;
export function create(skin = {}) {
  const S = { mode: 'boulder', hero: 'kid', heroCol: '#3fb04a', dirt: '#8a5a3a', rock: '#8a8f9c', gem: '#3fd0e0', foeKind: 'bat', foeCol: '#e23b5a', ...skin };
  const mine = S.mode === 'mine', lode = S.mode === 'lode';
  const g = { title: S.title || 'GRÄV', score: 0, lives: 3, over: false, t: 0, level: 1, need: 8, got: 0, blocks: 0 };
  const cell = (x, y) => (y < 0 || y >= GH || x < 0 || x >= GW ? '#' : g.grid[y][x]);
  const set = (x, y, c) => { if (y >= 0 && y < GH && x >= 0 && x < GW) g.grid[y][x] = c; };
  const collect = () => { g.got++; g.score += 25; if (g.got >= g.need) g.exitOpen = true; };
  const reset = () => {
    g.grid = [];
    for (let y = 0; y < GH; y++) { const row = []; for (let x = 0; x < GW; x++) { const edge = x === 0 || y === 0 || x === GW - 1 || y === GH - 1, r = Math.random(); row.push(edge ? '#' : mine ? (y < 5 ? ' ' : r < 0.08 ? '*' : r < 0.2 ? 'O' : '.') : r < 0.12 ? 'O' : r < 0.2 ? '*' : r < 0.3 ? ' ' : '.'); } g.grid.push(row); }
    g.p = { x: 1, y: mine ? 4 : 1, dir: 1, moveT: 0, fr: 0 };
    set(1, 1, ' '); set(2, 1, ' '); set(1, 2, ' '); if (mine) { set(1, 5, '.'); set(2, 5, '.'); }
    set(GW - 2, GH - 2, 'E'); g.exitOpen = false; g.got = 0; g.need = 6 + g.level * 2; g.physT = 0; g.dead = 0; g.foes = []; g.falling = new Set();
    for (let i = 0; i < 2 + g.level; i++) { let x, y, k = 0; do { x = irnd(8, GW - 2); y = irnd(1, GH - 2); } while (cell(x, y) === '#' && k++ < 50); set(x, y, ' '); g.foes.push({ x, y }); }
    g.blocks = mine ? 3 : 0;
  };
  reset();
  const physics = () => {
    for (let y = GH - 2; y >= 1; y--) for (let x = 1; x < GW - 1; x++) {
      const c = g.grid[y][x];
      if (c !== 'O' && c !== '*') continue;
      if (g.grid[y + 1][x] === ' ' && !(g.p.x === x && g.p.y === y + 1 && !g.falling.has(`${x},${y}`))) { g.grid[y + 1][x] = c; g.grid[y][x] = ' '; g.falling.add(`${x},${y + 1}`); if (g.p.x === x && g.p.y === y + 1) g.crushed = true; }
      else if (g.falling.has(`${x},${y}`)) g.falling.delete(`${x},${y}`);
    }
    for (const f of g.foes) {
      const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => cell(f.x + dx, f.y + dy) === ' ');
      if (opts.length) { const towards = [...opts].sort((a, b) => Math.hypot(f.x + a[0] - g.p.x, f.y + a[1] - g.p.y) - Math.hypot(f.x + b[0] - g.p.x, f.y + b[1] - g.p.y)); const d = Math.random() < 0.6 ? towards[0] : opts[irnd(0, opts.length - 1)]; f.x += d[0]; f.y += d[1]; }
      if (f.x === g.p.x && f.y === g.p.y) g.crushed = true;
    }
  };
  const tryMove = (dx, dy) => {
    const p = g.p, nx = p.x + dx, ny = p.y + dy, c = cell(nx, ny);
    if (dx) p.dir = dx;
    if (c === '#') return false;
    if (c === 'O') { if (dy === 0 && cell(nx + dx, ny) === ' ') { set(nx + dx, ny, 'O'); set(nx, ny, ' '); } else return false; }
    if (c === '*') collect();
    if (c === '.') g.score += 1;
    if (c === 'E') { if (!g.exitOpen) return false; g.level++; g.score += 300; const sc = g.score, lv = g.lives; reset(); g.score = sc; g.lives = lv; return true; }
    set(nx, ny, ' '); p.x = nx; p.y = ny; p.fr = 1 - p.fr; return true;
  };
  g.update = (dt, inp) => {
    g.t += dt;
    if (g.over) { if (inp.start) Object.assign(g, create(skin)); return; }
    if (g.dead > 0) { g.dead -= dt; if (g.dead <= 0) { const sc = g.score, lv = g.lives, l = g.level; reset(); g.score = sc; g.lives = lv; g.level = l; } return; }
    const p = g.p;
    p.moveT -= dt;
    if (mine) {
      const under = cell(p.x, p.y + 1);
      if ((under === ' ' || under === 'E') && p.moveT <= 0) { p.moveT = 0.1; tryMove(0, 1); }
      else if (p.moveT <= 0) {
        if (inp.left || inp.right) { const dx = inp.left ? -1 : 1, c = cell(p.x + dx, p.y); p.dir = dx; if (c === ' ' || c === '*' || c === 'E') { p.moveT = 0.14; tryMove(dx, 0); } else if (inp.up && cell(p.x, p.y - 1) === ' ' && cell(p.x + dx, p.y - 1) === ' ') { p.moveT = 0.18; p.y--; tryMove(dx, 0); } }
        else if (inp.up && cell(p.x, p.y - 1) === 'E') tryMove(0, -1);
        if (inp.aHit) { const dx = inp.down || inp.up ? 0 : p.dir, dy = inp.down ? 1 : inp.up ? -1 : 0, c = cell(p.x + dx, p.y + dy); if (c === '.' || c === 'O' || c === '*') { if (c === '*') collect(); else g.blocks++; if (c === '.') g.score += 1; set(p.x + dx, p.y + dy, ' '); p.moveT = 0.15; } }
        if (inp.bHit && g.blocks > 0) { const dx = inp.down || inp.up ? 0 : p.dir, dy = inp.down ? 1 : inp.up ? -1 : 0; if (cell(p.x + dx, p.y + dy) === ' ') { set(p.x + dx, p.y + dy, '.'); g.blocks--; p.moveT = 0.15; } }
      }
    } else if (p.moveT <= 0) {
      const dx = inp.left ? -1 : inp.right ? 1 : 0, dy = !dx && inp.up ? -1 : !dx && inp.down ? 1 : 0;
      if (dx || dy) { p.moveT = 0.11; tryMove(dx, dy); }
    }
    g.physT += dt;
    if (g.physT >= 0.12) { g.physT = 0; physics(); }
    if (g.crushed) { g.crushed = false; g.lives--; g.dead = 1; if (g.lives <= 0) g.over = true; }
  };
  g.draw = (ctx) => {
    R(ctx, 0, 0, W, H, mine ? '#7ab0e0' : '#05060a');
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      const c = g.grid[y][x], px = x * CS, py = OY + y * CS;
      if (c === '#') { R(ctx, px, py, CS, CS, mine ? '#3a3a44' : '#5a5a66'); R(ctx, px, py, CS, 1, '#8a8f9c'); }
      else if (c === '.') { R(ctx, px, py, CS, CS, S.dirt); if ((x * 7 + y * 3) % 5 === 0) R(ctx, px + 2, py + 3, 2, 1, '#5a3d2b'); if (mine && cell(x, y - 1) === ' ') R(ctx, px, py, CS, 2, '#3fb04a'); }
      else if (c === 'O') { R(ctx, px + 1, py + 1, CS - 2, CS - 2, S.rock); R(ctx, px + 2, py + 2, 3, 2, '#c8c8d0'); }
      else if (c === '*') drawItem(ctx, lode ? 'gold' : 'gem', px + 1, py + 1, g.t);
      else if (c === 'E') { R(ctx, px, py, CS, CS, g.exitOpen ? '#3fb04a' : '#3a3a44'); if (g.exitOpen && Math.floor(g.t * 4) % 2) R(ctx, px + 2, py + 2, 4, 4, '#f4f2ec'); }
    }
    for (const f of g.foes) drawFoe(ctx, S.foeKind, f.x * CS, OY + f.y * CS + CS, Math.floor(g.t * 6) % 2, S.foeCol);
    const p = g.p;
    if (g.dead <= 0 || Math.floor(g.t * 8) % 2) drawHero(ctx, S.hero, p.x * CS + 4, OY + p.y * CS + CS, p.dir, p.fr, S.heroCol);
    hud(ctx, g.score, g.lives, `${lode ? 'GULD' : 'STENAR'} ${g.got}/${g.need}${mine ? `   BLOCK ${g.blocks}  A=GRÄV B=BYGG` : ''}   NIVÅ ${g.level}`);
    if (g.over) overBox(ctx);
  };
  return g;
}
