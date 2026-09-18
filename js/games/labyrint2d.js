// Labyrint: ät prickarna, undvik spökena – kraftpiller vänder på steken. (Pac-Man)
import { W, H, R, hud, overBox, irnd } from './common.js';
import { foe as drawFoe } from './sprites.js';

const MAP = [
  '###############',
  '#......#......#',
  '#.##.#.#.#.##.#',
  '#o....#...#..o#',
  '#.##.###.###.##',
  '#....#.....#..#',
  '##.#.#.#.#.#.##',
  '#..#...#...#..#',
  '#.##.#####.##.#',
  '#o...........o#',
  '###############',
];
const CW = 16, CH = 14, OX = 0, OY = 12;

export function create(skin = {}) {
  const S = { wall: '#2a4ad8', heroCol: '#f0e030', dot: '#f4d0a0', ...skin };
  const g = { title: S.title || 'LABYRINT', score: 0, lives: 3, over: false, t: 0, level: 1 };
  const reset = () => {
    g.grid = MAP.map((r) => r.split(''));
    g.dots = 0; for (const row of g.grid) for (const c of row) if (c === '.' || c === 'o') g.dots++;
    g.p = { cx: 7, cy: 5, x: 7, y: 5, dir: [0, 0], want: [0, 0], mouth: 0, power: 0 };
    g.ghosts = [[1, 1, '#e23b5a'], [13, 1, '#ff9acb'], [1, 9, '#3fd0e0'], [13, 9, '#f0a020']].map(([cx, cy, c]) => ({ cx, cy, x: cx, y: cy, dir: [1, 0], c, t: 0 }));
    g.dead = 0;
  };
  reset();
  const wall = (cx, cy) => (g.grid[cy]?.[cx] ?? '#') === '#';
  const step = (o, speed, dt, chooser) => {
    if (o.x === o.cx && o.y === o.cy) {
      const d = chooser(o);
      if (d && !wall(o.cx + d[0], o.cy + d[1])) { o.dir = d; o.tx = o.cx + d[0]; o.ty = o.cy + d[1]; }
      else { o.tx = o.cx; o.ty = o.cy; }
    }
    if (o.tx === undefined) return;
    const dx = o.tx - o.x, dy = o.ty - o.y, d = Math.hypot(dx, dy), s = speed * dt;
    if (d <= s) { o.x = o.tx; o.y = o.ty; o.cx = o.tx; o.cy = o.ty; } else { o.x += dx / d * s; o.y += dy / d * s; }
  };
  g.update = (dt, inp) => {
    g.t += dt;
    if (g.over) { if (inp.start) Object.assign(g, create(skin)); return; }
    if (g.dead > 0) { g.dead -= dt; if (g.dead <= 0) { const sc = g.score, lv = g.lives, l = g.level; reset(); g.score = sc; g.lives = lv; g.level = l; } return; }
    const p = g.p;
    if (inp.left) p.want = [-1, 0]; if (inp.right) p.want = [1, 0]; if (inp.up) p.want = [0, -1]; if (inp.down) p.want = [0, 1];
    step(p, 5.5 + g.level * 0.5, dt, (o) => (!wall(o.cx + o.want[0], o.cy + o.want[1]) ? o.want : o.dir));
    p.mouth = Math.floor(g.t * 8) % 2;
    p.power = Math.max(0, p.power - dt);
    const c = g.grid[p.cy][p.cx];
    if (c === '.' || c === 'o') { g.grid[p.cy][p.cx] = ' '; g.dots--; g.score += c === 'o' ? 50 : 10; if (c === 'o') p.power = 6; }
    if (g.dots <= 0) { g.level++; g.score += 500; const sc = g.score, lv = g.lives, l = g.level; reset(); g.score = sc; g.lives = lv; g.level = l; return; }
    for (const gh of g.ghosts) {
      gh.t += dt;
      step(gh, 4 + g.level * 0.4 - (p.power ? 1.5 : 0), dt, (o) => {
        const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter((d) => !wall(o.cx + d[0], o.cy + d[1]) && !(d[0] === -o.dir[0] && d[1] === -o.dir[1]));
        if (!opts.length) return [-o.dir[0], -o.dir[1]];
        if (Math.random() < 0.35) return opts[irnd(0, opts.length - 1)];
        const sign = p.power ? -1 : 1;
        return opts.sort((a, b) => sign * (Math.hypot(o.cx + a[0] - p.cx, o.cy + a[1] - p.cy) - Math.hypot(o.cx + b[0] - p.cx, o.cy + b[1] - p.cy)))[0];
      });
      if (Math.hypot(gh.x - p.x, gh.y - p.y) < 0.6) {
        if (p.power) { g.score += 200; gh.x = gh.cx = 7; gh.y = gh.cy = 1; gh.tx = undefined; }
        else { g.lives--; g.dead = 1.2; if (g.lives <= 0) g.over = true; }
      }
    }
  };
  g.draw = (ctx) => {
    R(ctx, 0, 0, W, H, '#05060a');
    for (let y = 0; y < MAP.length; y++) for (let x = 0; x < MAP[0].length; x++) {
      const c = g.grid[y][x], px = OX + x * CW, py = OY + y * CH;
      if (c === '#') { R(ctx, px + 1, py + 1, CW - 2, CH - 2, S.wall); R(ctx, px + 3, py + 3, CW - 6, CH - 6, '#05060a'); }
      else if (c === '.') R(ctx, px + 7, py + 6, 2, 2, S.dot);
      else if (c === 'o' && Math.floor(g.t * 4) % 2) R(ctx, px + 5, py + 4, 5, 5, S.dot);
    }
    const p = g.p, px = OX + p.x * CW + 3, py = OY + p.y * CH + 2;
    if (g.dead <= 0 || Math.floor(g.t * 8) % 2) {
      R(ctx, px, py, 10, 10, S.heroCol);
      if (p.mouth) { const d = p.dir; R(ctx, px + 5 + d[0] * 3 - (d[0] < 0 ? 5 : 0) - (d[0] ? 0 : 2), py + 3 + d[1] * 3 - (d[1] < 0 ? 5 : 0), d[0] ? 5 : 4, d[1] ? 5 : 4, '#05060a'); }
    }
    for (const gh of g.ghosts) {
      const col = p.power ? (p.power < 2 && Math.floor(g.t * 6) % 2 ? '#f4f2ec' : '#2a4ad8') : gh.c;
      drawFoe(ctx, 'ghost', OX + gh.x * CW + 4, OY + gh.y * CH + 12, Math.floor(g.t * 6) % 2, col);
    }
    hud(ctx, g.score, g.lives, 'NIVÅ ' + g.level);
    if (g.over) overBox(ctx);
  };
  return g;
}
