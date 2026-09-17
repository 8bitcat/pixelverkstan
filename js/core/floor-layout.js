// Butiksgolvets planlösning (logiska pixlar, 512×384) och gångvägar.
// Koordinater för personer = fötternas position. Golvet börjar vid y = WALL_Y.
// Ingen DOM här – kan testas i Node (tools/floor2nav.mjs).

export const FW = 512, FH = 384;
export const WALL_Y = 86;            // väggens fot / golvets början
export const SIDEWALK_Y = 76;        // trottoaren utanför (bakom fönstren)
export const DOOR = { x0: 180, x1: 233, cx: 206, inY: 100 };
export const SPAWN_X = [-18, 266];   // utanför bildens glas (dolda bakom väggen)

export const COUNTER = { x0: 286, x1: 506, top: 117, front: 129, base: 150, split: 400 };
export const KEEPER_HOME = [338, 134], KEEPER_PICKUP = [453, 134];
export const QUEUE = [[318, 176], [318, 210], [318, 244], [318, 278]];
export const PICKUP = [[453, 176], [453, 210], [453, 244]];

// glasmontrar: x0/x1, baslinje (golvkontakt fram), djup på golvet
export const VITRINES = [
  { x0: 14, x1: 170, base: 162 },
  { x0: 14, x1: 132, base: 258 },
  { x0: 14, x1: 132, base: 354 },
];
export const VIT_DEPTH = 40;
export const HERO = { cx: 214, base: 318 };
export const ROPE = { x0: 148, x1: 280, back: 256, front: 336 };
export const SOFA = { x0: 356, x1: 452, base: 306 };
export const ARMCHAIR = { x0: 462, x1: 496, base: 306 };
export const TABLE = { x0: 388, x1: 444, base: 348 };
export const PLANTS = [[268, 106], [494, 374], [312, 372]];
export const GATES = [179, 233];
export const AFRAME = [148, SIDEWALK_Y + 4]; // trottoarskylt utanför

// väntplatser: sit = sitter (sorteras framför soffan), via = kliv ut/in-punkt
export const SPOTS = [
  { x: 377, y: 305, dir: 'down', sit: true, via: [377, 322], kind: 'seat' },
  { x: 404, y: 305, dir: 'down', sit: true, via: [404, 322], kind: 'seat' },
  { x: 431, y: 305, dir: 'down', sit: true, via: [431, 322], kind: 'seat' },
  { x: 479, y: 305, dir: 'down', sit: true, via: [479, 322], kind: 'seat' },
  { x: 92, y: 175, dir: 'up', kind: 'case', vit: 0 },
  { x: 48, y: 175, dir: 'up', kind: 'case', vit: 0 },
  { x: 136, y: 175, dir: 'up', kind: 'case', vit: 0 },
  { x: 73, y: 271, dir: 'up', kind: 'case', vit: 1 },
  { x: 73, y: 367, dir: 'up', kind: 'case', vit: 2 },
  { x: 214, y: 352, dir: 'up', kind: 'hero' },
  { x: 292, y: 312, dir: 'left', kind: 'hero' },
  { x: 180, y: 352, dir: 'up', kind: 'hero' },
];

// hinder på golvet (fotnivå) [x0, y0, x1, y1]
export const OBSTACLES = [
  [COUNTER.x0 - 6, WALL_Y - 6, FW, COUNTER.base],
  ...VITRINES.map((v) => [v.x0, v.base - VIT_DEPTH, v.x1, v.base]),
  [ROPE.x0, ROPE.back, ROPE.x1, ROPE.front],
  [SOFA.x0, SOFA.base - 24, SOFA.x1, SOFA.base],
  [ARMCHAIR.x0, ARMCHAIR.base - 22, ARMCHAIR.x1, ARMCHAIR.base],
  [TABLE.x0, TABLE.base - 14, TABLE.x1, TABLE.base],
  ...PLANTS.map(([x, y]) => [x - 8, y - 10, x + 8, y + 1]),
  ...GATES.map((x) => [x - 3, WALL_Y, x + 3, 104]),
];
const MARGIN = 6;
const BOUNDS = [10, WALL_Y + 8, FW - 10, FH - 6];

const inflate = (r, m) => [r[0] - m, r[1] - m, r[2] + m, r[3] + m];
const INF = OBSTACLES.map((r) => inflate(r, MARGIN));
const inside = (r, x, y) => x > r[0] && x < r[2] && y > r[1] && y < r[3];

// Liang–Barsky: skär sträckan rektangelns inre?
function segHits(r, x0, y0, x1, y1) {
  let t0 = 0, t1 = 1;
  const dx = x1 - x0, dy = y1 - y0;
  const p = [-dx, dx, -dy, dy], q = [x0 - r[0], r[2] - x0, y0 - r[1], r[3] - y0];
  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) { if (q[i] <= 0) return false; continue; }
    const t = q[i] / p[i];
    if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
    else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return t1 - t0 > 1e-6;
}
export function clear(x0, y0, x1, y1, ignoreA = null, ignoreB = null, rects = INF) {
  for (const r of rects) {
    if (r === ignoreA || r === ignoreB) continue;
    if (segHits(r, x0, y0, x1, y1)) return false;
  }
  return true;
}
const containing = (x, y, rects = INF) => rects.find((r) => inside(r, x, y)) || null;

// noder = hörn på uppblåsta hinder
function cornerNodes(rects, all) {
  const out = [];
  for (const r of rects) for (const [x, y] of [[r[0] - 1, r[1] - 1], [r[2] + 1, r[1] - 1], [r[0] - 1, r[3] + 1], [r[2] + 1, r[3] + 1]]) {
    if (x < BOUNDS[0] || y < BOUNDS[1] || x > BOUNDS[2] || y > BOUNDS[3]) continue;
    if (containing(x, y, all)) continue;
    out.push([x, y]);
  }
  return out;
}
const NODES = [...cornerNodes(INF, INF), [DOOR.cx, DOOR.inY]];
export const NAV_NODES = NODES;

// Kortaste väg inne i butiken från (sx, sy) till (tx, ty) → lista av punkter (utan start).
// extra = tillfälliga hinder [x0, y0, x1, y1] (t.ex. kön), redan med marginal.
export function route(sx, sy, tx, ty, extra = []) {
  const rects = extra.length ? [...INF, ...extra] : INF;
  const nodes = extra.length ? [...NODES.filter(([x, y]) => !containing(x, y, extra)), ...cornerNodes(extra, rects)] : NODES;
  const ia = containing(sx, sy, rects), ib = containing(tx, ty, rects);
  if (clear(sx, sy, tx, ty, ia, ib, rects)) return [[tx, ty]];
  const n = nodes.length;
  const dist = new Array(n).fill(Infinity), prev = new Array(n).fill(-1), done = new Array(n).fill(false);
  for (let i = 0; i < n; i++) if (clear(sx, sy, nodes[i][0], nodes[i][1], ia, null, rects)) dist[i] = Math.hypot(sx - nodes[i][0], sy - nodes[i][1]);
  let best = -1, bestD = Infinity;
  for (;;) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0 || dist[u] >= bestD) break;
    done[u] = true;
    const [ux, uy] = nodes[u];
    if (clear(ux, uy, tx, ty, ib, null, rects)) {
      const d = dist[u] + Math.hypot(ux - tx, uy - ty);
      if (d < bestD) { bestD = d; best = u; }
    }
    for (let v = 0; v < n; v++) {
      if (done[v]) continue;
      const w = dist[u] + Math.hypot(ux - nodes[v][0], uy - nodes[v][1]);
      if (w < dist[v] && clear(ux, uy, nodes[v][0], nodes[v][1], null, null, rects)) { dist[v] = w; prev[v] = u; }
    }
  }
  if (best < 0) return [[tx, ty]];
  const path = [[tx, ty]];
  for (let u = best; u >= 0; u = prev[u]) path.unshift(nodes[u]);
  return path;
}

// kölinjen som hinder för andra kunder (n = antal i kön)
export function queueLane(n) {
  if (n <= 0) return [];
  const [qx, qy] = QUEUE[0], last = QUEUE[Math.min(n, QUEUE.length) - 1][1];
  return [[qx - 12 - MARGIN, qy - 14 - MARGIN, qx + 12 + MARGIN, last + 4 + MARGIN]];
}
