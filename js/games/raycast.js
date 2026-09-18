// Raycast: korridorer i förstaperson, fiender som kommer emot en, skjut och hitta utgången.
// (Wolfenstein 3D, DOOM, Quake, GoldenEye, Halo …) Varje titel har egna väggar, golv, tak,
// fiendetyp och vapen; mjukvaruläge = lägre upplösning och grövre skuggning.
import { W, H, R, text, hud, overBox, rnd, irnd, clamp } from './common.js';

const MAP = [
  '################',
  '#......#.......#',
  '#.##...#..###..#',
  '#.#....#....#..#',
  '#.#..###.##.#..#',
  '#....#.....#...#',
  '####.#.###.#.###',
  '#....#...#.#...#',
  '#.####.#.#.###.#',
  '#......#.......#',
  '#.######.#####.#',
  '#........#...E.#',
  '################',
];
export function create(skin = {}, opts = {}) {
  const S = { wall: '#9a7a4a', wall2: '#7a5a3a', ceil: '#3a3a44', floor: '#5a5a66', foe: '#8a3a3a', foeKind: 'soldier', exit: '#3fb04a', outdoor: false, cartoon: false, portal: false, ...skin };
  const soft = !!opts.software, cols = soft ? 60 : 120;
  const g = { title: S.title || 'KORRIDOR', score: 0, lives: 3, over: false, t: 0, hp: 100, ammo: 30, level: 1 };
  const reset = () => {
    g.px = 1.5; g.py = 1.5; g.ang = 0; g.foes = []; g.flash = 0; g.hurt = 0; g.bob = 0; g.won = 0;
    for (let i = 0; i < 6 + g.level * 2; i++) { let x, y; do { x = irnd(1, 14) + 0.5; y = irnd(1, 11) + 0.5; } while (MAP[Math.floor(y)][Math.floor(x)] !== '.' || Math.hypot(x - 1.5, y - 1.5) < 4); g.foes.push({ x, y, hp: S.foeKind === 'ogre' || S.foeKind === 'covenant' ? 3 : 2, t: rnd(0, 3), fr: 0 }); }
    g.hp = 100; g.ammo = 30;
  };
  reset();
  const wall = (x, y) => (MAP[Math.floor(y)]?.[Math.floor(x)] ?? '#') !== '.' && MAP[Math.floor(y)]?.[Math.floor(x)] !== 'E';
  const exitAt = (x, y) => MAP[Math.floor(y)]?.[Math.floor(x)] === 'E';
  g.update = (dt, inp) => {
    g.t += dt;
    if (g.over) { if (inp.start) Object.assign(g, create(skin, opts)); return; }
    if (g.won > 0) { g.won -= dt; if (g.won <= 0) { g.level++; g.score += 1000; reset(); } return; }
    const turn = 2.2 * dt, sp = 2.4 * dt;
    if (inp.left) g.ang -= turn; if (inp.right) g.ang += turn;
    let mx = 0, my = 0;
    if (inp.up) { mx += Math.cos(g.ang) * sp; my += Math.sin(g.ang) * sp; }
    if (inp.down) { mx -= Math.cos(g.ang) * sp; my -= Math.sin(g.ang) * sp; }
    if (!wall(g.px + mx * 3, g.py)) g.px += mx; if (!wall(g.px, g.py + my * 3)) g.py += my;
    if (mx || my) g.bob += dt * 9;
    g.flash = Math.max(0, g.flash - dt); g.hurt = Math.max(0, g.hurt - dt); g.cool = Math.max(0, (g.cool || 0) - dt);
    if (inp.a && g.cool <= 0 && g.ammo > 0) {
      g.cool = S.foeKind === 'imp' ? 0.22 : 0.3; g.ammo--; g.flash = 0.08;
      let best = null, bd = 1e9;
      for (const f of g.foes) { const dx = f.x - g.px, dy = f.y - g.py, d = Math.hypot(dx, dy); const a = Math.atan2(dy, dx) - g.ang; const rel = Math.atan2(Math.sin(a), Math.cos(a)); if (Math.abs(rel) < 0.12 && d < bd && !blocked(g.px, g.py, f.x, f.y)) { best = f; bd = d; } }
      if (best) { best.hp--; best.hurt = 0.2; if (best.hp <= 0) { best.dead = true; g.score += 100; } }
    }
    for (const f of g.foes) {
      f.t += dt; f.hurt = Math.max(0, (f.hurt || 0) - dt);
      const dx = g.px - f.x, dy = g.py - f.y, d = Math.hypot(dx, dy);
      if (d < 6 && !blocked(f.x, f.y, g.px, g.py) && d > 0.9) { const s = (S.foeKind === 'zombie' ? 0.6 : 0.9) * dt; if (!wall(f.x + dx / d * s * 3, f.y)) f.x += dx / d * s; if (!wall(f.x, f.y + dy / d * s * 3)) f.y += dy / d * s; f.fr = Math.floor(f.t * 6) % 2; }
      if (d < 1.1 && f.t % 1.2 < dt) { g.hp -= 8; g.hurt = 0.3; if (g.hp <= 0) { g.lives--; if (g.lives <= 0) g.over = true; else { g.hp = 100; g.px = 1.5; g.py = 1.5; } } }
    }
    g.foes = g.foes.filter((f) => !f.dead);
    if (Math.random() < dt * 0.15 && g.ammo < 10) g.ammo += 5;
    if (exitAt(g.px, g.py)) g.won = 1.5;
  };
  const blocked = (x0, y0, x1, y1) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 4); for (let i = 1; i < n; i++) if (wall(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n)) return true; return false; };
  const zbuf = new Float32Array(cols);
  const sprite = (ctx, f, x, y, size) => {
    const k = S.foeKind, body = f.hurt ? '#f4f2ec' : S.foe, s = size;
    if (k === 'imp') { R(ctx, x, y + s * 0.2, s / 2, s * 0.55, body); R(ctx, x + s * 0.1, y, s * 0.3, s * 0.22, body); R(ctx, x + s * 0.08, y - s * 0.08, s * 0.08, s * 0.1, '#e8c26a'); R(ctx, x + s * 0.34, y - s * 0.08, s * 0.08, s * 0.1, '#e8c26a'); R(ctx, x + s * 0.16, y + s * 0.06, s * 0.06, s * 0.05, '#f0e030'); R(ctx, x + s * 0.28, y + s * 0.06, s * 0.06, s * 0.05, '#f0e030'); }
    else if (k === 'ogre') { R(ctx, x - s * 0.1, y + s * 0.2, s * 0.7, s * 0.6, body); R(ctx, x + s * 0.12, y, s * 0.26, s * 0.22, '#8aa06a'); R(ctx, x + s * 0.5, y + s * 0.3, s * 0.2, s * 0.08, '#8a8f9c'); }
    else if (k === 'covenant') { R(ctx, x + s * 0.05, y - s * 0.1, s * 0.4, s * 0.9, body); R(ctx, x + s * 0.12, y - s * 0.2, s * 0.26, s * 0.2, '#3fd0e0'); R(ctx, x + s * 0.4, y + s * 0.3, s * 0.2, s * 0.08, '#b58cff'); }
    else if (k === 'zombie') { R(ctx, x, y + s * 0.25, s / 2, s * 0.5, body); R(ctx, x + s * 0.1, y, s * 0.3, s * 0.25, '#8aa06a'); R(ctx, x - s * 0.1, y + s * 0.3, s * 0.7, s * 0.08, '#8aa06a'); }
    else if (k === 'headcrab') { R(ctx, x + s * 0.05, y + s * 0.5, s * 0.4, s * 0.3, body); R(ctx, x, y + s * 0.75, s * 0.1, s * 0.15, body); R(ctx, x + s * 0.4, y + s * 0.75, s * 0.1, s * 0.15, body); }
    else if (k === 'drone') { R(ctx, x + s * 0.1, y + s * 0.2, s * 0.3, s * 0.3, body); R(ctx, x + s * 0.2, y + s * 0.3, s * 0.1, s * 0.1, '#e23b5a'); }
    else if (k === 'nazi') { R(ctx, x, y + s * 0.25, s / 2, s * 0.5, body); R(ctx, x + s * 0.1, y, s * 0.3, s * 0.25, '#e0a97f'); R(ctx, x + s * 0.08, y - s * 0.05, s * 0.34, s * 0.08, '#3a3a44'); R(ctx, x + s * 0.35, y + s * 0.35, s * 0.25, s * 0.06, '#1a1a1e'); }
    else if (k === 'robot') { R(ctx, x, y + s * 0.25, s / 2, s * 0.5, body); R(ctx, x + s * 0.1, y, s * 0.3, s * 0.25, '#c8c8d0'); R(ctx, x + s * 0.18, y + s * 0.08, s * 0.14, s * 0.06, '#3fd0e0'); }
    else { R(ctx, x, y + s * 0.25, s / 2, s * 0.5, body); R(ctx, x + s * 0.1, y, s * 0.3, s * 0.25, S.cartoon ? '#f6d7bf' : '#e0a97f'); R(ctx, x + s * 0.35, y + s * 0.35, s * 0.25, s * 0.06, '#1a1a1e'); R(ctx, x + s * 0.15, y + s * 0.08, s * 0.06, s * 0.06, '#e23b5a'); }
    R(ctx, x + (f.fr ? 0 : s * 0.05), y + s * 0.75, s * 0.18, s * 0.25, '#2a2a34'); R(ctx, x + s * 0.28 + (f.fr ? s * 0.05 : 0), y + s * 0.75, s * 0.18, s * 0.25, '#2a2a34');
  };
  g.draw = (ctx) => {
    const cw = W / cols, horizon = H / 2 + Math.sin(g.bob) * 2;
    if (S.outdoor) { R(ctx, 0, 0, W, horizon, S.ceil); R(ctx, 0, horizon - 12, W, 12, shadeCol(S.ceil, 1.3)); } else R(ctx, 0, 0, W, horizon, S.ceil);
    R(ctx, 0, horizon, W, H - horizon, S.floor);
    const fov = 1.05;
    for (let c = 0; c < cols; c++) {
      const a = g.ang - fov / 2 + (c / cols) * fov, dx = Math.cos(a), dy = Math.sin(a);
      let mapX = Math.floor(g.px), mapY = Math.floor(g.py);
      const ddx = Math.abs(1 / (dx || 1e-9)), ddy = Math.abs(1 / (dy || 1e-9)), sx = dx < 0 ? -1 : 1, sy = dy < 0 ? -1 : 1;
      let sdx = dx < 0 ? (g.px - mapX) * ddx : (mapX + 1 - g.px) * ddx, sdy = dy < 0 ? (g.py - mapY) * ddy : (mapY + 1 - g.py) * ddy, side = 0, dist = 0, ch = '#';
      for (let i = 0; i < 40; i++) { if (sdx < sdy) { sdx += ddx; mapX += sx; side = 0; } else { sdy += ddy; mapY += sy; side = 1; } ch = MAP[mapY]?.[mapX] ?? '#'; if (ch !== '.') break; }
      dist = (side === 0 ? sdx - ddx : sdy - ddy) * Math.cos(a - g.ang);
      zbuf[c] = dist;
      const hgt = Math.min(H * 3, H / (dist + 0.0001));
      const shade = soft ? (dist < 3 ? 1 : dist < 6 ? 0.7 : 0.45) : S.cartoon ? clamp(1.1 - dist * 0.06, 0.5, 1) : clamp(1.2 - dist * 0.12, 0.25, 1);
      const base = ch === 'E' ? S.exit : S.portal && (mapX + mapY) % 5 === 0 ? (side ? '#e07a2e' : '#3a78d8') : side ? S.wall2 : S.wall;
      ctx.fillStyle = shadeCol(base, shade * (side ? 0.8 : 1));
      ctx.fillRect(Math.floor(c * cw), Math.round(horizon - hgt / 2), Math.ceil(cw), Math.round(hgt));
      if (!soft && (Math.floor((side ? g.px + dist * dx : g.py + dist * dy) * 4) % 4 === 0)) { ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(Math.floor(c * cw), Math.round(horizon - hgt / 2), Math.ceil(cw), Math.round(hgt)); }
    }
    const sorted = [...g.foes].map((f) => ({ f, d: Math.hypot(f.x - g.px, f.y - g.py) })).sort((a, b) => b.d - a.d);
    for (const { f, d } of sorted) {
      const a = Math.atan2(f.y - g.py, f.x - g.px) - g.ang, rel = Math.atan2(Math.sin(a), Math.cos(a));
      if (Math.abs(rel) > fov / 2 + 0.3) continue;
      const sxp = (rel + fov / 2) / fov * W, size = Math.min(H, H / (d * Math.cos(rel) + 0.001)) * 0.7, col = Math.floor(sxp / cw);
      if (zbuf[clamp(col, 0, cols - 1)] < d * Math.cos(rel)) continue;
      sprite(ctx, f, sxp - size / 4, horizon + size / 2 - size, size);
    }
    if (soft) for (let y = 0; y < H; y += 2) R(ctx, 0, y, W, 1, 'rgba(0,0,0,.08)');
    const bob = Math.sin(g.bob) * 2, wy = H - 30 + bob + (g.flash ? -4 : 0), wc = S.foeKind === 'covenant' ? '#3fb04a' : S.foeKind === 'imp' ? '#5a5a66' : S.portal ? '#f4f2ec' : '#3a3a44';
    R(ctx, W / 2 - 6, wy, 12, 30, wc); R(ctx, W / 2 - 3, wy - 10, 6, 12, shadeCol(wc, 1.4)); R(ctx, W / 2 - 1, wy - 12, 2, 4, '#8a8f9c');
    if (g.flash) { R(ctx, W / 2 - 8, wy - 24, 16, 12, S.portal ? '#3a78d8' : '#f0e030'); R(ctx, W / 2 - 4, wy - 20, 8, 6, '#f4f2ec'); }
    if (g.hurt) R(ctx, 0, 0, W, H, `rgba(220,40,40,${g.hurt * 1.2})`);
    R(ctx, W / 2 - 1, H / 2 - 4, 2, 8, '#f4f2ec'); R(ctx, W / 2 - 4, H / 2 - 1, 8, 2, '#f4f2ec');
    hud(ctx, g.score, g.lives, `HÄLSA ${Math.max(0, g.hp)}   AMMO ${g.ammo}   NIVÅ ${g.level}`);
    if (g.won > 0) { R(ctx, 60, 60, 120, 20, '#1a1a1e'); text(ctx, 'NIVÅN KLAR!', 84, 66, '#3fb04a', true); }
    if (g.over) overBox(ctx);
  };
  return g;
}
function shadeCol(h, f) {
  const n = parseInt(h.slice(1), 16), r = Math.min(255, (n >> 16 & 255) * f) | 0, gg = Math.min(255, (n >> 8 & 255) * f) | 0, b = Math.min(255, (n & 255) * f) | 0;
  return '#' + ((r << 16) | (gg << 8) | b).toString(16).padStart(6, '0');
}
