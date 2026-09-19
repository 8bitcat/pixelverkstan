// Butiksgolvets planlösning (logiska pixlar, 512×480) och gångvägar. Vilka platser och möbler
// som finns beror på lokalen (floor-plans.js): setPlan(lokal) byter och räknar om hinder och
// gångnät. Koordinater för personer = fötternas position. Golvet börjar vid y = WALL_Y. Ingen DOM.
import { PLANS, SLOT_SIZES, MAX_SLOTS, planFor } from './floor-plans.js';

export const FW = 512, FH = 480;
export const WALL_Y = 86;            // väggens fot / golvets början
export const SIDEWALK_Y = 76;        // trottoaren utanför (bakom fönstren)
export const DOOR = { x0: 180, x1: 233, cx: 206, inY: 100 };
export const SPAWN_X = [-18, 266];   // utanför bildens glas (dolda bakom väggen)

export const COUNTER = { x0: 286, x1: 506, top: 117, front: 129, base: 150, split: 400 };
export const KEEPER_HOME = [338, 134], KEEPER_PICKUP = [453, 134];
export const QUEUE = [[318, 176], [318, 210], [318, 244], [318, 278]];
export const PICKUP = [[453, 176], [453, 210], [453, 244]];
export const SLOT_DEPTH = { wide: 40, medium: 40, small: 24 };
export const VIT_DEPTH = 40;
export const GATES = [179, 233];
export const AFRAME = [148, SIDEWALK_Y + 4]; // trottoarskylt utanför
export { SLOT_SIZES, MAX_SLOTS, PLANS };

// det som byts med lokalen (live-bindningar – läs dem vid anrop, inte vid import)
export let PLAN = planFor(3);
export let SLOTS = [];           // platserna i den här lokalen, med kanoniskt index i
export let VITRINES = [];
export let HERO = null;          // { cx, base } eller null (ingen stjärnmonter i de små lokalerna)
export let ROPE = null;          // { x0, x1, back, front } eller null
export let SOFA = null, ARMCHAIR = null, TABLE = null, BENCH = null;
export let PLANTS = [], EXTRA_PLANTS = [];
export let SPOTS = [];
export let OBSTACLES = [];
export let TABLES = [];          // matbord (restaurangen): { x0, x1, base, booth, seats: [spotIndex], plates: [[x, y]] }
let PLAN_SRC = null;             // verksamhetens egna planlösningar (annars datorbutikens)

// väntplatser: sit = sitter (sorteras framför soffan), via = kliv ut/in-punkt,
// slot = platsen man tittar in i (hoppas över om den är tom)
function makeSpots(plan) {
  const out = [];
  if (plan.sofa) for (const x of [377, 404, 431]) out.push({ x, y: plan.sofa.base - 1, dir: 'down', sit: true, via: [x, plan.sofa.base + 16], kind: 'seat' });
  if (plan.armchair) out.push({ x: 479, y: plan.armchair.base - 1, dir: 'down', sit: true, via: [479, plan.armchair.base + 16], kind: 'seat' });
  if (plan.bench) for (const x of [380, 428]) out.push({ x, y: plan.bench.base - 1, dir: 'down', sit: true, via: [x, plan.bench.base + 16], kind: 'seat' });
  for (const s of plan.slots) {
    const w = s.x1 - s.x0, y = s.base + 13, xs = s.size === 'wide' ? [0.5, 0.22, 0.78] : [0.5];
    for (const f of xs) out.push({ x: Math.round(s.x0 + w * f), y, dir: 'up', kind: 'case', slot: s.i });
  }
  if (plan.hero) out.push({ x: plan.hero.cx, y: plan.hero.base + 34, dir: 'up', kind: 'hero' }, { x: plan.hero.cx + 78, y: plan.hero.base - 6, dir: 'left', kind: 'hero' }, { x: plan.hero.cx - 34, y: plan.hero.base + 34, dir: 'up', kind: 'hero' });
  // matbord: två platser bakom varje bord, brickan står på bordet framför den som sitter
  (plan.tables || []).forEach((t, ti) => {
    for (const x of [t.x0 + 11, t.x0 + 33]) out.push({ x, y: t.base - 17, dir: 'down', sit: true, via: [x, t.base + 12], kind: 'seat', table: ti, plate: [x, t.base - 7] });
  });
  return out;
}
export function setPlan(lokal, plans = undefined) {
  if (plans !== undefined) PLAN_SRC = plans;
  const plan = PLAN_SRC ? (PLAN_SRC[lokal] || PLAN_SRC[3]) : planFor(lokal);
  PLAN = plan;
  SLOTS = plan.slots; VITRINES = SLOTS.slice(0, 3);
  HERO = plan.hero || null;
  ROPE = HERO ? { x0: HERO.cx - 66, x1: HERO.cx + 66, back: HERO.base - 62, front: HERO.base + 18 } : null;
  SOFA = plan.sofa || null; ARMCHAIR = plan.armchair || null; TABLE = plan.table || null; BENCH = plan.bench || null;
  PLANTS = plan.plants || []; EXTRA_PLANTS = plan.extraPlants || [];
  SPOTS = makeSpots(plan);
  TABLES = (plan.tables || []).map((t, ti) => ({ ...t, seats: SPOTS.map((sp, i) => (sp.table === ti ? i : -1)).filter((i) => i >= 0), plates: SPOTS.filter((sp) => sp.table === ti).map((sp) => sp.plate) }));
  // hinder på golvet (fotnivå) [x0, y0, x1, y1]
  OBSTACLES = [
    [COUNTER.x0 - 6, WALL_Y - 6, FW, COUNTER.base],
    ...SLOTS.map((s) => [s.x0, s.base - SLOT_DEPTH[s.size], s.x1, s.base]),
    ...(ROPE ? [[ROPE.x0, ROPE.back, ROPE.x1, ROPE.front]] : []),
    ...(SOFA ? [[SOFA.x0, SOFA.base - 24, SOFA.x1, SOFA.base]] : []),
    ...(ARMCHAIR ? [[ARMCHAIR.x0, ARMCHAIR.base - 22, ARMCHAIR.x1, ARMCHAIR.base]] : []),
    ...(TABLE ? [[TABLE.x0, TABLE.base - 14, TABLE.x1, TABLE.base]] : []),
    ...(BENCH ? [[BENCH.x0, BENCH.base - 16, BENCH.x1, BENCH.base]] : []),
    ...TABLES.map((t) => [t.x0 - 2, t.base - 34, t.x1 + 2, t.base]),
    ...[...PLANTS, ...EXTRA_PLANTS].map(([x, y]) => [x - 8, y - 10, x + 8, y + 1]),
    ...(plan.props || []).map((p) => [p.x0, p.y0, p.x1, p.y1]),
    ...(plan.blocked || []),
    ...GATES.map((x) => [x - 3, WALL_Y, x + 3, 104]),
  ];
  INF = OBSTACLES.map((r) => inflate(r, MARGIN));
  NODES = [...cornerNodes(INF, INF), [DOOR.cx, DOOR.inY]];
  NAV_NODES = NODES;
}
const MARGIN = 6;
const BOUNDS = [10, WALL_Y + 8, FW - 10, FH - 6];

const inflate = (r, m) => [r[0] - m, r[1] - m, r[2] + m, r[3] + m];
let INF = [];
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
let NODES = [];
export let NAV_NODES = NODES;

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

setPlan(3);
