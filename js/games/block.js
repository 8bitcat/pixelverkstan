// Fallande block i tre lägen: 'tetris' (fyll rader), 'columns' (tre ädelstenar i stapel, matcha tre
// i rad – vågrätt, lodrätt, diagonalt) och 'lumines' (2×2-block i två färger, rensa kvadrater).
import { W, H, R, text, hud, overBox, irnd } from './common.js';

const PIECES = [[[1, 1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1]], [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]], [[1, 1, 0], [0, 1, 1]], [[0, 1, 1], [1, 1, 0]]];
const COLS = ['#3fd0e0', '#f0e030', '#b58cff', '#3a78d8', '#e07a2e', '#3fb04a', '#e23b5a'];
export function create(skin = {}) {
  const S = { mode: 'tetris', ...skin };
  if (S.mode === 'columns') return columns(S, skin);
  if (S.mode === 'lumines') return lumines(S, skin);
  const BW = 10, BH = 16, CS = 9, OX = (W - BW * CS) / 2, OY = 8;
  const g = { title: S.title || 'BLOCK', score: 0, lives: -1, over: false, t: 0, lines: 0, level: 1, fall: 0, board: [], next: null, das: 0 };
  for (let y = 0; y < BH; y++) g.board.push(new Array(BW).fill(0));
  const collide = (p, dx, dy, s = p.s) => s.some((row, j) => row.some((v, i) => v && (p.x + i + dx < 0 || p.x + i + dx >= BW || p.y + j + dy >= BH || (p.y + j + dy >= 0 && g.board[p.y + j + dy][p.x + i + dx]))));
  const spawn = () => { const k = g.next ?? irnd(0, 6); g.next = irnd(0, 6); g.cur = { k, s: PIECES[k].map((r) => [...r]), x: 3, y: 0 }; if (collide(g.cur, 0, 0)) g.over = true; };
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
    R(ctx, 0, 0, W, H, S.bg || '#101018');
    const ink = S.bg && S.bg > '#888888' ? '#1a1a1e' : '#f4f2ec', dim = S.bg && S.bg > '#888888' ? '#5a5a66' : '#8a8f9c';
    R(ctx, OX - 2, OY - 2, BW * CS + 4, BH * CS + 4, '#3a3a44'); R(ctx, OX, OY, BW * CS, BH * CS, '#05060a');
    const cell = (x, y, k) => { R(ctx, OX + x * CS, OY + y * CS, CS - 1, CS - 1, COLS[k]); R(ctx, OX + x * CS, OY + y * CS, CS - 1, 1, 'rgba(255,255,255,.4)'); };
    g.board.forEach((row, y) => row.forEach((v, x) => { if (v) cell(x, y, v - 1); }));
    if (!g.over) g.cur.s.forEach((row, j) => row.forEach((v, i) => { if (v && g.cur.y + j >= 0) cell(g.cur.x + i, g.cur.y + j, g.cur.k); }));
    text(ctx, 'NÄSTA', OX + BW * CS + 10, 12, dim);
    PIECES[g.next].forEach((row, j) => row.forEach((v, i) => { if (v) R(ctx, OX + BW * CS + 10 + i * 7, 20 + j * 7, 6, 6, COLS[g.next]); }));
    text(ctx, 'RADER ' + g.lines, OX + BW * CS + 10, 50, ink); text(ctx, 'NIVÅ ' + g.level, OX + BW * CS + 10, 60, ink);
    text(ctx, 'PIL UPP = VRID', 4, 130, dim); text(ctx, 'B = SLÄPP', 4, 138, dim);
    hud(ctx, g.score, -1);
    if (g.over) overBox(ctx);
  };
  return g;
}

// ---- Columns: stapel om tre färger, matcha tre i rad ----
function columns(S, skin) {
  const BW = 6, BH = 13, CS = 10, OX = (W - BW * CS) / 2, OY = 12, NC = 5;
  const GEMS = ['#e23b5a', '#3fb04a', '#3a78d8', '#f0e030', '#b58cff'];
  const g = { title: S.title || 'COLUMNS', score: 0, lives: -1, over: false, t: 0, level: 1, fall: 0, board: [], jewels: 0, flashT: 0 };
  for (let y = 0; y < BH; y++) g.board.push(new Array(BW).fill(0));
  const spawn = () => { g.cur = { x: 2, y: -2, c: [irnd(1, NC), irnd(1, NC), irnd(1, NC)] }; if (g.board[0][2]) g.over = true; };
  const free = (x, y) => x >= 0 && x < BW && y < BH && (y < 0 || !g.board[y][x]);
  const canBe = (x, y) => free(x, y) && free(x, y - 1) && free(x, y - 2);
  const matches = () => {
    const kill = new Set();
    for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) { const c = g.board[y][x]; if (!c) continue;
      for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) { let n = 1; while (g.board[y + dy * n]?.[x + dx * n] === c) n++; if (n >= 3) for (let i = 0; i < n; i++) kill.add(`${x + dx * i},${y + dy * i}`); } }
    if (!kill.size) return 0;
    for (const k of kill) { const [x, y] = k.split(',').map(Number); g.board[y][x] = 0; }
    for (let x = 0; x < BW; x++) { const col = []; for (let y = BH - 1; y >= 0; y--) if (g.board[y][x]) col.push(g.board[y][x]); for (let y = BH - 1; y >= 0; y--) g.board[y][x] = col[BH - 1 - y] || 0; }
    return kill.size;
  };
  const lock = () => {
    for (let i = 0; i < 3; i++) { const y = g.cur.y - i; if (y < 0) { g.over = true; return; } g.board[y][g.cur.x] = g.cur.c[i]; }
    let chain = 0, n;
    while ((n = matches())) { chain++; g.jewels += n; g.score += n * 30 * chain * g.level; g.flashT = 0.2; }
    g.level = 1 + Math.floor(g.jewels / 30);
    spawn();
  };
  spawn();
  g.update = (dt, inp) => {
    g.t += dt; g.flashT = Math.max(0, g.flashT - dt);
    if (g.over) { if (inp.start) Object.assign(g, create(skin)); return; }
    const p = g.cur;
    if (inp.leftHit && canBe(p.x - 1, p.y)) p.x--; if (inp.rightHit && canBe(p.x + 1, p.y)) p.x++;
    if (inp.upHit || inp.hit) p.c.unshift(p.c.pop());
    const speed = Math.max(0.1, 0.7 - g.level * 0.06) * (inp.down ? 0.1 : 1);
    g.fall += dt;
    if (g.fall >= speed) { g.fall = 0; if (free(p.x, p.y + 1)) p.y++; else lock(); }
    if (inp.bHit) { while (free(p.x, p.y + 1)) p.y++; lock(); }
  };
  g.draw = (ctx) => {
    R(ctx, 0, 0, W, H, '#1a1a24');
    R(ctx, OX - 2, OY - 2, BW * CS + 4, BH * CS + 4, '#c8a24a'); R(ctx, OX, OY, BW * CS, BH * CS, '#05060a');
    const gem = (x, y, c) => { const px = OX + x * CS, py = OY + y * CS; R(ctx, px + 2, py + 1, CS - 4, CS - 2, GEMS[c - 1]); R(ctx, px + 1, py + 3, CS - 2, CS - 6, GEMS[c - 1]); R(ctx, px + 3, py + 2, 2, 2, '#f4f2ec'); };
    g.board.forEach((row, y) => row.forEach((v, x) => { if (v) gem(x, y, v); }));
    if (!g.over) for (let i = 0; i < 3; i++) if (g.cur.y - i >= 0) gem(g.cur.x, g.cur.y - i, g.cur.c[i]);
    text(ctx, 'ÄDELSTENAR', OX + BW * CS + 12, 14, '#8a8f9c'); text(ctx, String(g.jewels), OX + BW * CS + 12, 24, '#f4f2ec', true);
    text(ctx, 'NIVÅ ' + g.level, OX + BW * CS + 12, 44, '#f4f2ec');
    text(ctx, 'PIL UPP =', 4, 120, '#8a8f9c'); text(ctx, 'BYT ORDNING', 4, 128, '#8a8f9c'); text(ctx, 'B = SLÄPP', 4, 140, '#8a8f9c');
    if (g.flashT) R(ctx, OX, OY, BW * CS, BH * CS, 'rgba(255,255,255,.15)');
    hud(ctx, g.score, -1);
    if (g.over) overBox(ctx);
  };
  return g;
}

// ---- Lumines: 2×2-block i två färger, kvadrater av samma färg rensas ----
function lumines(S, skin) {
  const BW = 16, BH = 10, CS = 11, OX = (W - BW * CS) / 2, OY = 30;
  const C = ['#e07a2e', '#f4f2ec'];
  const g = { title: S.title || 'LUMINES', score: 0, lives: -1, over: false, t: 0, fall: 0, board: [], squares: 0, line: 0 };
  for (let y = 0; y < BH; y++) g.board.push(new Array(BW).fill(0));
  const spawn = () => { g.cur = { x: 7, y: -2, c: [irnd(1, 2), irnd(1, 2), irnd(1, 2), irnd(1, 2)] }; if (g.board[0][7] || g.board[0][8]) g.over = true; };
  const free = (x, y) => x >= 0 && x < BW && y < BH && (y < 0 || !g.board[y][x]);
  const fits = (x, y) => free(x, y) && free(x + 1, y) && free(x, y - 1) && free(x + 1, y - 1);
  const settle = () => { for (let x = 0; x < BW; x++) { const col = []; for (let y = BH - 1; y >= 0; y--) if (g.board[y][x]) col.push(g.board[y][x]); for (let y = BH - 1; y >= 0; y--) g.board[y][x] = col[BH - 1 - y] || 0; } };
  const clear = () => {
    const kill = new Set();
    for (let y = 0; y < BH - 1; y++) for (let x = 0; x < BW - 1; x++) { const c = g.board[y][x]; if (c && g.board[y][x + 1] === c && g.board[y + 1][x] === c && g.board[y + 1][x + 1] === c) { kill.add(`${x},${y}`); kill.add(`${x + 1},${y}`); kill.add(`${x},${y + 1}`); kill.add(`${x + 1},${y + 1}`); g.squares++; } }
    for (const k of kill) { const [x, y] = k.split(',').map(Number); g.board[y][x] = 0; }
    if (kill.size) { g.score += kill.size * 10 * (1 + Math.floor(kill.size / 8)); settle(); }
  };
  const lock = () => { const p = g.cur; const cells = [[p.x, p.y - 1, p.c[0]], [p.x + 1, p.y - 1, p.c[1]], [p.x, p.y, p.c[2]], [p.x + 1, p.y, p.c[3]]]; for (const [x, y, c] of cells) { if (y < 0) { g.over = true; return; } g.board[y][x] = c; } settle(); spawn(); };
  spawn();
  g.update = (dt, inp) => {
    g.t += dt;
    if (g.over) { if (inp.start) Object.assign(g, create(skin)); return; }
    const p = g.cur;
    if (inp.leftHit && fits(p.x - 1, p.y)) p.x--; if (inp.rightHit && fits(p.x + 1, p.y)) p.x++;
    if (inp.upHit || inp.hit) p.c = [p.c[2], p.c[0], p.c[3], p.c[1]];
    const speed = 0.5 * (inp.down ? 0.1 : 1);
    g.fall += dt;
    if (g.fall >= speed) { g.fall = 0; if (fits(p.x, p.y + 1)) p.y++; else lock(); }
    if (inp.bHit) { while (fits(p.x, p.y + 1)) p.y++; lock(); }
    // tidslinjen sveper och rensar kvadraterna den passerar
    g.line += dt * 40; if (g.line >= BW * CS) { g.line = 0; } if (Math.floor(g.line / CS) !== g.lastCol) { g.lastCol = Math.floor(g.line / CS); if (g.lastCol === 0) clear(); }
  };
  g.draw = (ctx) => {
    R(ctx, 0, 0, W, H, '#1a1a24');
    for (let i = 0; i < 20; i++) R(ctx, (i * 37 + Math.round(g.t * 8)) % W, (i * 23) % H, 1, 1, '#3a3a5a');
    R(ctx, OX - 2, OY - 2, BW * CS + 4, BH * CS + 4, '#3a3a5a'); R(ctx, OX, OY, BW * CS, BH * CS, '#05060a');
    const cell = (x, y, c) => { R(ctx, OX + x * CS + 1, OY + y * CS + 1, CS - 2, CS - 2, C[c - 1]); R(ctx, OX + x * CS + 2, OY + y * CS + 2, 2, 2, 'rgba(255,255,255,.5)'); };
    g.board.forEach((row, y) => row.forEach((v, x) => { if (v) cell(x, y, v); }));
    if (!g.over) { const p = g.cur; if (p.y - 1 >= 0) { cell(p.x, p.y - 1, p.c[0]); cell(p.x + 1, p.y - 1, p.c[1]); } if (p.y >= 0) { cell(p.x, p.y, p.c[2]); cell(p.x + 1, p.y, p.c[3]); } }
    R(ctx, OX + g.line, OY - 4, 1, BH * CS + 8, '#3fd0e0');
    text(ctx, `KVADRATER ${g.squares}`, 4, 14, '#f4f2ec'); text(ctx, 'PIL UPP = VRID   B = SLÄPP', 4, 150, '#8a8f9c');
    hud(ctx, g.score, -1);
    if (g.over) overBox(ctx);
  };
  return g;
}
