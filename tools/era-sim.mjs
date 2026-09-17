// Hjälpare för logiktesterna: bygger en beställning "perfekt" via riggens API och
// kopplar in allt på skrivbordet. Används av era-logic.mjs och era-faults.mjs.
import { rigFor } from '../js/shops/dator/rig.js';
import { Desk } from '../js/shops/dator/desk.js';

export function buildPerfect(order, parts, note = () => {}) {
  const rig = rigFor(order);
  const b = { placed: {}, acts: new Map(), cables: new Map(), errors: 0 };
  const left = [...parts];
  for (let pass = 0; pass < 6; pass++) {
    const last = pass === 5;
    for (const key of rig.STEPS) {
      const [kind, id] = key.split(':');
      if (kind === 'slot') {
        if (b.placed[id]) continue;
        const idx = left.findIndex((p) => rig.slotsFor(p).some((s) => s.id === id));
        if (idx < 0) continue;
        const res = rig.canPlace(rig.SLOT[id], left[idx], b);
        if (!res.ok) { if (last) note(`canPlace ${id}: ${res.msg}`); continue; }
        b.placed[id] = left[idx]; left.splice(idx, 1);
      } else if (kind === 'act') {
        const a = rig.ACTION[id];
        if (!rig.actionReady(a, b)) continue;
        b.acts.set(id, new Set(a.points.map((_, j) => j)));
      } else {
        const c = rig.CABLE[id];
        if (b.cables.has(id) || !rig.cableReady(c, b)) continue;
        const port = c.wants.find((w) => rig.availablePorts(b).includes(w) && !rig.portBusy(w, b));
        if (!port) { if (last) note(`ingen ledig port för ${id} (vill ${c.wants.join('/')}, typ ${rig.cableConn(c, b)})`); continue; }
        const res = rig.canConnect(c, port, b, true);
        if (!res.ok) { if (last) note(`canConnect ${id}→${port}: ${res.msg}`); continue; }
        b.cables.set(id, port);
      }
    }
  }
  if (left.length) note(`delar kvar i lådan: ${left.map((p) => p.cat + ':' + p.id).join(', ')}`);
  return { rig, b, left };
}

export function deskFor(rig, b, order, note = () => {}) {
  const desk = Object.create(Desk.prototype);
  desk.view = { b, L: rig, order, help: true };
  desk.setupEra();
  const d = desk.d;
  d.psuOn = true;
  const ports = desk.ports();
  for (const [pid, plug] of Object.entries(desk.PLUGS)) {
    if (plug.target === 'strip') { d.plugs[pid] = 'STRIP'; continue; }
    const cand = ports.filter((q) => q.type === plug.type && !Object.values(d.plugs).includes(q.key));
    const port = pid === 'video' ? (cand.find((q) => q.owner === (b.placed.gpu ? 'gpu' : 'mb')) || cand[0]) : cand[0];
    if (!port) { note(`inget uttag på baksidan för ${pid} (${plug.type})`); continue; }
    d.plugs[pid] = port.key;
  }
  return desk;
}
