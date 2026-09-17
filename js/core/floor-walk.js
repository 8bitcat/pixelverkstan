// Gångnät för spelarnas avatarer (A* på ett rutnät). Avatarerna får gå bakom
// disken, till skillnad från kunderna. Ingen DOM – kan testas i Node.
import * as LY from './floor-layout.js';

const CELL = 4;
const GW = Math.ceil(LY.FW / CELL), GH = Math.ceil(LY.FH / CELL);
const C = LY.COUNTER;

// hinder vid fötterna [x0, y0, x1, y1]
const BLOCKS = [
  [C.x0 - 2, LY.WALL_Y - 6, LY.FW, 121],          // bakre skåpet längs väggen
  [C.x0 - 2, 138, LY.FW, C.base + 1],             // själva disken (framsidan)
  ...LY.OBSTACLES.slice(1),                        // allt utom kundernas stora diskblock
];
const PAD = 3;
const free = new Uint8Array(GW * GH);
for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
  const x = gx * CELL + CELL / 2, y = gy * CELL + CELL / 2;
  let ok = x > 8 && x < LY.FW - 8 && y > LY.WALL_Y + 6 && y < LY.FH - 4;
  if (ok) for (const [x0, y0, x1, y1] of BLOCKS) if (x > x0 - PAD && x < x1 + PAD && y > y0 - PAD && y < y1 + PAD) { ok = false; break; }
  free[gy * GW + gx] = ok ? 1 : 0;
}
// dörröppningen upp mot trottoaren
for (let gy = 0; gy < GH; gy++) for (let gx = 0; gx < GW; gx++) {
  const x = gx * CELL + CELL / 2, y = gy * CELL + CELL / 2;
  if (x > LY.DOOR.x0 + 8 && x < LY.DOOR.x1 - 8 && y <= LY.WALL_Y + 8 && y > LY.WALL_Y - 2) free[gy * GW + gx] = 1;
}

const cellOf = (x, y) => [Math.max(0, Math.min(GW - 1, Math.floor(x / CELL))), Math.max(0, Math.min(GH - 1, Math.floor(y / CELL)))];
export const walkable = (x, y) => { const [gx, gy] = cellOf(x, y); return !!free[gy * GW + gx]; };

// närmaste gångbara punkt
export function nearestFree(x, y) {
  const [cx, cy] = cellOf(x, y);
  if (free[cy * GW + cx]) return [x, y];
  for (let r = 1; r < 40; r++) {
    let best = null, bd = Infinity;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const gx = cx + dx, gy = cy + dy;
      if (gx < 0 || gy < 0 || gx >= GW || gy >= GH || !free[gy * GW + gx]) continue;
      const d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = [gx * CELL + CELL / 2, gy * CELL + CELL / 2]; }
    }
    if (best) return best;
  }
  return [x, y];
}

function los(ax, ay, bx, by) {
  const d = Math.hypot(bx - ax, by - ay), n = Math.ceil(d / 2);
  for (let i = 1; i < n; i++) if (!walkable(ax + (bx - ax) * i / n, ay + (by - ay) * i / n)) return false;
  return true;
}

// Väg från (sx,sy) till (tx,ty) → lista med punkter (utan startpunkten)
export function findPath(sx, sy, tx, ty) {
  [tx, ty] = nearestFree(tx, ty);
  if (los(sx, sy, tx, ty)) return [[tx, ty]];
  const [s0, s1] = cellOf(...nearestFree(sx, sy)), [t0, t1] = cellOf(tx, ty);
  const start = s1 * GW + s0, goal = t1 * GW + t0;
  const g = new Float32Array(GW * GH).fill(Infinity), from = new Int32Array(GW * GH).fill(-1), closed = new Uint8Array(GW * GH);
  const open = [start]; g[start] = 0;
  const h = (i) => Math.hypot((i % GW) - t0, Math.floor(i / GW) - t1);
  const f = new Float32Array(GW * GH).fill(Infinity); f[start] = h(start);
  let iter = 0;
  while (open.length && iter++ < 20000) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (f[open[i]] < f[open[bi]]) bi = i;
    const cur = open[bi]; open[bi] = open[open.length - 1]; open.pop();
    if (cur === goal) break;
    closed[cur] = 1;
    const cx = cur % GW, cy = Math.floor(cur / GW);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = cx + dx, ny = cy + dy;
      if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
      const ni = ny * GW + nx;
      if (!free[ni] || closed[ni]) continue;
      if (dx && dy && (!free[cy * GW + nx] || !free[ny * GW + cx])) continue;
      const ng = g[cur] + (dx && dy ? 1.414 : 1);
      if (ng < g[ni]) { g[ni] = ng; f[ni] = ng + h(ni); from[ni] = cur; if (!open.includes(ni)) open.push(ni); }
    }
  }
  if (from[goal] < 0 && goal !== start) return [[tx, ty]].filter(() => los(sx, sy, tx, ty));
  const cells = [];
  for (let i = goal; i !== start && i >= 0; i = from[i]) cells.push([(i % GW) * CELL + CELL / 2, Math.floor(i / GW) * CELL + CELL / 2]);
  cells.reverse();
  cells[cells.length - 1] = [tx, ty];
  // släta ut: hoppa över punkter man ser rakt till
  const out = [];
  let ax = sx, ay = sy, i = 0;
  while (i < cells.length) {
    let j = cells.length - 1;
    while (j > i && !los(ax, ay, cells[j][0], cells[j][1])) j--;
    out.push(cells[j]); [ax, ay] = cells[j]; i = j + 1;
  }
  return out;
}

// Var avataren ställer sig för olika saker
export const SPOTS = {
  counter: [322, 129],                    // bakom disken, mittemot kön
  workshop: [478, 128],                   // dörren till verkstaden
  home: [352, 129],
};
export const DELIVERY = [[248, 124], [270, 140], [244, 150], [266, 162], [250, 112]];
