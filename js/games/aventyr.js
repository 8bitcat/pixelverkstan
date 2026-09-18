// Äventyr uppifrån: rum för rum – slå (eller fånga, eller skjut) fienderna så öppnas dörren till
// höger. Hjärtan, invincibility, rum som blir svårare. (Zelda, rollspel, Pokémon, Tomb Raider …)
import { W, H, R, text, hud, overBox, hit, rnd, irnd } from './common.js';
import { hero as drawHero, foe as drawFoe, item as drawItem } from './sprites.js';

const TS = 16, CW = 15, CH = 9, OY = 12;
const TILES = {
  grass: { floor: '#3fb04a', floor2: '#38a044', block: '#5a3d2b', blockTop: '#2f8f46', wall: '#2f6f3a' },
  dungeon: { floor: '#3a3a44', floor2: '#34343e', block: '#5a5a66', blockTop: '#6a6a7a', wall: '#2a2a34' },
  desert: { floor: '#e0b040', floor2: '#d8a838', block: '#c98a4a', blockTop: '#e0a02a', wall: '#a06a2a' },
  snow: { floor: '#e8f0f8', floor2: '#dce8f4', block: '#8a8f9c', blockTop: '#f4f2ec', wall: '#5a6a8a' },
  lab: { floor: '#8a8f9c', floor2: '#7f8491', block: '#3a3a44', blockTop: '#5a5a66', wall: '#2a2a34' },
  lava: { floor: '#3a2a2a', floor2: '#452a2a', block: '#e07a2e', blockTop: '#f0b429', wall: '#1a1a1e' },
  water: { floor: '#3a9ad8', floor2: '#348fcc', block: '#e0b040', blockTop: '#3fb04a', wall: '#1a5a8a' },
  jungle: { floor: '#2f8f46', floor2: '#2a823f', block: '#5a3d2b', blockTop: '#3fb04a', wall: '#1a4a24' },
  city: { floor: '#5a5a66', floor2: '#54545f', block: '#3a3a44', blockTop: '#8a8f9c', wall: '#2a2a34' },
};
export function create(skin = {}) {
  const S = { hero: 'link', heroCol: '#3fb04a', foeKind: 'orc', foeCol: '#c98a4a', tile: 'grass', weapon: 'sword', calm: false, ...skin };
  const T = TILES[S.tile] || TILES.grass, ranged = S.weapon === 'ball' || S.weapon === 'gun';
  const g = { title: S.title || 'ÄVENTYR', score: 0, lives: 3, over: false, t: 0, room: 1, hp: 6, caught: 0 };
  const room = () => {
    g.grid = []; for (let y = 0; y < CH; y++) { const row = []; for (let x = 0; x < CW; x++) row.push(x === 0 || y === 0 || x === CW - 1 || y === CH - 1 ? 1 : 0); g.grid.push(row); }
    for (let i = 0; i < 6 + g.room; i++) { const x = irnd(2, CW - 3), y = irnd(2, CH - 3); if (!(x < 4 && y > 2 && y < 6)) g.grid[y][x] = 2; }
    g.grid[Math.floor(CH / 2)][CW - 1] = 3;
    g.foes = []; const n = S.calm ? 1 + Math.floor(g.room / 2) : 3 + Math.min(5, g.room);
    for (let i = 0; i < n; i++) { let x, y, k = 0; do { x = irnd(6, CW - 2); y = irnd(1, CH - 2); } while (g.grid[y][x] && k++ < 50); g.foes.push({ x: x * TS + 8, y: y * TS + 8, hp: 2, t: rnd(0, 3), fr: 0, wander: [0, 0] }); }
    g.p = { x: 24, y: Math.floor(CH / 2) * TS + 8, dir: [1, 0], atk: 0, inv: 0, fr: 0 }; g.balls = []; g.drops = []; g.msg = `RUM ${g.room}`; g.msgT = 1.2;
  };
  room();
  const solid = (px, py) => { const x = Math.floor(px / TS), y = Math.floor(py / TS), c = g.grid[y]?.[x]; return c === undefined || c === 1 || c === 2 || (c === 3 && g.foes.length > 0); };
  const move = (o, dx, dy) => { if (!solid(o.x + dx - 4, o.y - 4) && !solid(o.x + dx + 3, o.y - 4) && !solid(o.x + dx - 4, o.y + 3) && !solid(o.x + dx + 3, o.y + 3)) o.x += dx; if (!solid(o.x - 4, o.y + dy - 4) && !solid(o.x + 3, o.y + dy - 4) && !solid(o.x - 4, o.y + dy + 3) && !solid(o.x + 3, o.y + dy + 3)) o.y += dy; };
  g.update = (dt, inp) => {
    g.t += dt;
    if (g.over) { if (inp.start) Object.assign(g, create(skin)); return; }
    g.msgT = Math.max(0, g.msgT - dt);
    const p = g.p, sp = 62 * dt;
    let dx = 0, dy = 0;
    if (inp.left) { dx = -sp; p.dir = [-1, 0]; } if (inp.right) { dx = sp; p.dir = [1, 0]; } if (inp.up) { dy = -sp; p.dir = [0, -1]; } if (inp.down) { dy = sp; p.dir = [0, 1]; }
    if (p.atk <= 0) move(p, dx, dy);
    if (dx || dy) p.fr = Math.floor(g.t * 8) % 2;
    p.atk = Math.max(0, p.atk - dt); p.inv = Math.max(0, p.inv - dt);
    if (inp.aHit && p.atk <= 0) { p.atk = 0.22; if (ranged) g.balls.push({ x: p.x, y: p.y, vx: p.dir[0] * 150, vy: p.dir[1] * 150, t: 0 }); }
    const sw = p.atk > 0.05 && !ranged ? { x: p.x + p.dir[0] * 12 - 6, y: p.y + p.dir[1] * 12 - 6, w: 12, h: 12 } : null;
    for (const b of g.balls) { b.x += b.vx * dt; b.y += b.vy * dt; b.t += dt; if (solid(b.x, b.y) || b.t > 1) b.dead = true; }
    for (const f of g.foes) {
      f.t += dt; f.hurt = Math.max(0, (f.hurt || 0) - dt);
      const ddx = p.x - f.x, ddy = p.y - f.y, d = Math.hypot(ddx, ddy) || 1;
      if (f.t % 1.5 < dt) f.wander = [rnd(-1, 1), rnd(-1, 1)];
      const chase = d < 70 && !S.calm, vx = chase ? ddx / d : f.wander[0], vy = chase ? ddy / d : f.wander[1], s = (chase ? 34 : 18) * dt * (f.hurt ? 0 : 1);
      move(f, vx * s, vy * s); f.fr = Math.floor(f.t * 6) % 2;
      const fb = { x: f.x - 4, y: f.y - 4, w: 8, h: 8 };
      if (sw && hit(sw, fb) && !f.hurt) { f.hp--; f.hurt = 0.3; f.x += p.dir[0] * 6; f.y += p.dir[1] * 6; if (f.hp <= 0) { f.dead = true; g.score += 50; if (Math.random() < 0.25) g.drops.push({ x: f.x - 3, y: f.y - 3, w: 6, h: 6 }); } }
      for (const b of g.balls) if (!b.dead && hit({ x: b.x - 2, y: b.y - 2, w: 4, h: 4 }, fb)) { b.dead = true; if (S.weapon === 'ball') { f.dead = true; g.score += 80; g.caught++; } else { f.hp--; f.hurt = 0.2; if (f.hp <= 0) { f.dead = true; g.score += 50; } } }
      if (!f.dead && p.inv <= 0 && hit({ x: p.x - 3, y: p.y - 3, w: 6, h: 6 }, fb)) { g.hp--; p.inv = 1; p.x -= ddx / d * 8; p.y -= ddy / d * 8; if (g.hp <= 0) { g.lives--; if (g.lives <= 0) { g.over = true; return; } g.hp = 6; room(); return; } }
    }
    g.foes = g.foes.filter((f) => !f.dead); g.balls = g.balls.filter((b) => !b.dead);
    for (const dr of g.drops) if (hit({ x: p.x - 3, y: p.y - 3, w: 6, h: 6 }, dr)) { dr.dead = true; g.hp = Math.min(6, g.hp + 2); g.score += 20; }
    g.drops = g.drops.filter((d) => !d.dead);
    if (!g.foes.length && p.x > (CW - 1) * TS - 4) { g.room++; g.score += 200; room(); }
  };
  g.draw = (ctx) => {
    R(ctx, 0, 0, W, H, T.wall);
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
      const c = g.grid[y][x], px = x * TS, py = OY + y * TS;
      if (c === 0) R(ctx, px, py, TS, TS, (x + y) % 2 ? T.floor : T.floor2);
      else if (c === 2) { R(ctx, px + 1, py + 1, TS - 2, TS - 2, T.block); R(ctx, px + 2, py + 2, TS - 4, 5, T.blockTop); }
      else if (c === 3) { const open = !g.foes.length; R(ctx, px, py, TS, TS, open ? '#1a1a1e' : T.wall); if (open) R(ctx, px + 4, py + 2, 8, 12, Math.floor(g.t * 3) % 2 ? '#f0e030' : '#e0a02a'); }
    }
    for (const dr of g.drops) drawItem(ctx, 'heart', Math.round(dr.x), Math.round(OY + dr.y), g.t);
    const p = g.p;
    for (const f of g.foes) drawFoe(ctx, S.foeKind, Math.round(f.x - 4), Math.round(OY + f.y + 4), f.fr, f.hurt ? '#f4f2ec' : S.foeCol);
    if (p.atk > 0.05 && !ranged) { const big = S.weapon === 'bigsword', L = big ? 14 : 10; R(ctx, p.x + p.dir[0] * 9 - (p.dir[0] ? (p.dir[0] < 0 ? L - 2 : 2) : 1), OY + p.y + p.dir[1] * 9 - (p.dir[1] ? (p.dir[1] < 0 ? L - 2 : 2) : 1) - 4, p.dir[0] ? L : 2, p.dir[1] ? L : 2, big ? '#e8c26a' : '#c8c8d0'); }
    for (const b of g.balls) { if (S.weapon === 'ball') { R(ctx, b.x - 2, OY + b.y - 2, 4, 4, '#e23b5a'); R(ctx, b.x - 2, OY + b.y, 4, 2, '#f4f2ec'); } else R(ctx, b.x - 1, OY + b.y - 1, 3, 2, '#f0e030'); }
    if (p.inv <= 0 || Math.floor(g.t * 10) % 2) drawHero(ctx, S.hero, Math.round(p.x), Math.round(OY + p.y + 6), p.dir[0] || 1, p.fr, S.heroCol);
    for (let i = 0; i < 3; i++) { const full = g.hp >= (i + 1) * 2, half = g.hp === i * 2 + 1; R(ctx, W - 40 + i * 9, 2, 6, 5, full ? '#e23b5a' : half ? '#a02a3a' : '#3a3a44'); }
    hud(ctx, g.score, -1, S.weapon === 'ball' ? `FÅNGADE ${g.caught}   RUM ${g.room}` : `RUM ${g.room}   A = ${S.weapon === 'gun' ? 'SKJUT' : 'SLÅ'}`);
    if (g.msgT > 0) text(ctx, g.msg, 100, 70, '#f4f2ec', true);
    if (g.over) overBox(ctx);
  };
  return g;
}
