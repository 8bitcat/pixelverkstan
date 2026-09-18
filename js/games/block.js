// Fallande block: fyll rader. (Tetris)
import { W, H, R, text, hud, overBox, irnd } from './common.js';

const PIECES = [
  [[1, 1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1]], [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]], [[1, 1, 0], [0, 1, 1]], [[0, 1, 1], [1, 1, 0]],
];
const COLS = ['#3fd0e0', '#f0e030', '#b58cff', '#3a78d8', '#e07a2e', '#3fb04a', '#e23b5a'];
const BW = 10, BH = 16, CS = 9, OX = (W - BW * CS) / 2, OY = 8;
export function create(skin = {}) {
  const g = { title: skin.title || 'BLOCK', score: 0, lives: -1, over: false, t: 0, lines: 0, level: 1, fall: 0, board: [], next: null, das: 0 };
  for (let y = 0; y < BH; y++) g.board.push(new Array(BW).fill(0));
  const spawn = () => { const k = g.next ?? irnd(0, 6); g.next = irnd(0, 6); g.cur = { k, s: PIECES[k].map((r) => [...r]), x: 3, y: 0 }; if (collide(g.cur, 0, 0)) g.over = true; };
  const collide = (p, dx, dy, s = p.s) => s.some((row, j) => row.some((v, i) => v && (p.x + i + dx < 0 || p.x + i + dx >= BW || p.y + j + dy >= BH || (p.y + j + dy >= 0 && g.board[p.y + j + dy][p.x + i + dx]))));
  const rotate = (s) => s[0].map((_, i) => s.map((r) => r[i]).reverse());
  const lock = () => {
    g.cur.s.forEach((row, j) => row.forEach((v, i) => { if (v && g.cur.y + j >= 0) g.board[g.cur.y + j][g.cur.x + i] = g.cur.k + 1; }));
    let cleared = 0;
    for (let y = BH - 1; y >= 0; y--) if (g.board[y].every((v) => v)) { g.board.splice(y, 1); g.board.unshift(new Array(BW).fill(0)); cleared++; y++; }
    if (cleared) { g.lines += cleared; g.score += [0, 100, 300, 500, 800][cleared] * g.level; g.level = 1 + Math.floor(g.lines / 10); }
    spawn();
  };
  spawn();
  g.update = (dt, inp) => {
    g.t += dt;
    if (g.over) { if (inp.start) Object.assign(g, create(skin)); return; }
    const p = g.cur;
    if (inp.leftHit && !collide(p, -1, 0)) p.x--; if (inp.rightHit && !collide(p, 1, 0)) p.x++;
    g.das = (inp.left || inp.right) ? g.das + dt : 0;
    if (g.das > 0.25) { g.das = 0.17; if (inp.left && !collide(p, -1, 0)) p.x--; if (inp.right && !collide(p, 1, 0)) p.x++; }
    if (inp.upHit || inp.hit) { const r = rotate(p.s); if (!collide(p, 0, 0, r)) p.s = r; else if (!collide(p, -1, 0, r)) { p.x--; p.s = r; } else if (!collide(p, 1, 0, r)) { p.x++; p.s = r; } }
    const speed = Math.max(0.08, 0.6 - g.level * 0.05) * (inp.down ? 0.12 : 1);
    g.fall += dt;
    if (g.fall >= speed) { g.fall = 0; if (!collide(p, 0, 1)) p.y++; else lock(); }
    if (inp.bHit) { while (!collide(p, 0, 1)) p.y++; lock(); }
  };
  g.draw = (ctx) => {
    R(ctx, 0, 0, W, H, skin.bg || '#101018');
    R(ctx, OX - 2, OY - 2, BW * CS + 4, BH * CS + 4, '#3a3a44'); R(ctx, OX, OY, BW * CS, BH * CS, '#05060a');
    const cell = (x, y, k) => { R(ctx, OX + x * CS, OY + y * CS, CS - 1, CS - 1, COLS[k]); R(ctx, OX + x * CS, OY + y * CS, CS - 1, 1, 'rgba(255,255,255,.4)'); };
    g.board.forEach((row, y) => row.forEach((v, x) => { if (v) cell(x, y, v - 1); }));
    if (!g.over) g.cur.s.forEach((row, j) => row.forEach((v, i) => { if (v && g.cur.y + j >= 0) cell(g.cur.x + i, g.cur.y + j, g.cur.k); }));
    text(ctx, 'NÄSTA', OX + BW * CS + 10, 12, '#8a8f9c');
    PIECES[g.next].forEach((row, j) => row.forEach((v, i) => { if (v) R(ctx, OX + BW * CS + 10 + i * 7, 20 + j * 7, 6, 6, COLS[g.next]); }));
    text(ctx, 'RADER ' + g.lines, OX + BW * CS + 10, 50, '#f4f2ec'); text(ctx, 'NIVÅ ' + g.level, OX + BW * CS + 10, 60, '#f4f2ec');
    text(ctx, 'PIL UPP = VRID', 4, 130, '#8a8f9c'); text(ctx, 'B = SLÄPP', 4, 138, '#8a8f9c');
    hud(ctx, g.score, -1);
    if (g.over) overBox(ctx);
  };
  return g;
}
