// Testar butiksgolvets gångvägar (Node, ingen webbläsare).
import * as L from '../js/core/floor-layout.js';
const pts = { door: [L.DOOR.cx, L.DOOR.inY], q1: L.QUEUE[0], q3: L.QUEUE[2], p1: L.PICKUP[0] };
L.SPOTS.forEach((s, i) => { pts['s' + i + s.kind] = s.via || [s.x, s.y]; });
let bad = 0;
for (const [an, a] of Object.entries(pts)) for (const [bn, b] of Object.entries(pts)) {
  if (an === bn) continue;
  const r = L.route(a[0], a[1], b[0], b[1]);
  // kontrollera att varje segment (utom första/sista mot punkter i hinder) är fritt
  let prev = a, ok = true;
  r.forEach((p, i) => { if (i > 0 && i < r.length - 1 && !L.clear(prev[0], prev[1], p[0], p[1])) ok = false; prev = p; });
  if (!ok) { bad++; console.log('BLOCKERAD', an, '->', bn, JSON.stringify(r)); }
  if (['door->q1', 'q1->s0seat', 's0seat->p1', 'q1->s8case', 'p1->door', 'q1->s9hero', 'door->s5case'].includes(an + '->' + bn)) console.log(an, '->', bn, JSON.stringify(r.map((p) => p.map(Math.round))));
}
for (const s of L.SPOTS) for (const r of L.OBSTACLES) if (s.x > r[0] && s.x < r[2] && s.y > r[1] && s.y < r[3] && !s.sit) console.log('plats i hinder', s);
console.log('noder', L.NAV_NODES.length, 'blockerade', bad);
const lane = L.queueLane(3);
console.log('med kö: vitrin->utlämning', JSON.stringify(L.route(48, 175, L.PICKUP[0][0], L.PICKUP[0][1], lane).map((p) => p.map(Math.round))));
console.log('med kö: q1->soffa', JSON.stringify(L.route(L.QUEUE[0][0], L.QUEUE[0][1], 377, 322, lane).map((p) => p.map(Math.round))));
