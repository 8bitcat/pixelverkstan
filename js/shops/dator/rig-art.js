// Ritar byggscenen för en rigg: chassi, moderkort och delar på sina platser,
// skruvar, kontrollerkort och lösa Molex-kontakter.
import { drawMat, drawCase, drawBoard, drawFanUnit, drawScrewPts, drawCtrlCard, drawMolexPlug } from './art-base.js';
import { drawPart } from './art.js';
import * as AP from './art-parts.js';
import { BOARD_Z } from './rig-geo.js';

// Ankare för delarnas ritning (o.at), se art-parts.js
export function partAnchor(rig, slot, part) {
  const G = rig.geo;
  switch (slot.id) {
    case 'cpu': case 'cooler': return [G.cpu[0], G.cpu[1], BOARD_Z];
    case 'ram': return [G.ramU[0], G.ramV[0], BOARD_Z];
    case 'm2': return [G.m2.u0, (G.m2.v0 + G.m2.v1) / 2, BOARD_Z];
    case 'bay': return [(G.bay.u0 + G.bay.u1) / 2, (G.bay.v0 + G.bay.v1) / 2, 0.55];
    case 'gpu': case 'snd': return [1.0, slot.row.v, BOARD_Z];
    case 'psu': return [G.psu.u0, G.psu.v0, G.psu.z0];
    case 'media': case 'media2': case 'floppy': return [slot.box.u0, slot.box.v0, slot.box.z0];
  }
  return null;
}

function placeholderBox(R, slot, part, id) {
  // reservritning om grafiken för kategorin saknas
  const b = slot.box || { u0: 1.0, u1: 8.5, v0: slot.row.v - 0.08, v1: slot.row.v + 0.08, z0: BOARD_Z + 0.1, z1: 3.2 };
  const col = part.cat === 'sound' ? 0x2e6b3c : part.look?.color === 'black' ? 0x1e1e20 : 0xd8cfb4;
  R.box(b.u0, b.u1, b.v0, b.v1, b.z0, b.z1, (f, x, y) => f === 'top' ? col : ((y * 3) | 0) % 4 === 0 ? 0x555555 : col, id);
}

export function drawRigScene(rig, R, b, anim = {}) {
  const S = rig.SLOTS, G = rig.geo;
  const ids = Object.fromEntries(S.map((s) => [s.id, s.n]));
  drawMat(R, b.placed.case ? 0 : ids.case);
  const base = {
    ids, spin: anim.spin || 0, t: anim.t || 0, placed: b.placed, powered: anim.powered, lit: anim.lit,
    paste: rig.actDone(b, 'paste'), leverClosed: !rig.ACTION.lever || rig.actDone(b, 'lever'),
    jumpersSet: rig.actDone(b, 'jumpers'), geo: G, ramU: G.ramU, ramV: G.ramV, era: rig.year,
  };
  for (const s of S) {
    const p = b.placed[s.id];
    if (!p) continue;
    const o = { ...base, id: ids[s.id], at: partAnchor(rig, s, p), slot: s.id, row: s.row, box: s.box };
    if (s.id === 'case') drawCase(R, p, o, rig);
    else if (s.id === 'mb') drawBoard(R, p, o, rig);
    else if (s.id === 'fans' && G.kind === 'classic') {
      ['front1', 'front2'].slice(0, Math.max(1, Math.min(2, p.count || 1))).forEach((k) => drawFanUnit(R, G.fanSlots[k], { ...p.look, rgb: p.rgb, key: 'fans' }, o, ids.fans, k));
    } else if (p.cat === 'media' && !AP.drawMedia) placeholderBox(R, s, p, ids[s.id]);
    else if (p.cat === 'sound' && !AP.drawSound) placeholderBox(R, s, p, ids[s.id]);
    else drawPart(R, p, o);
    const sc = rig.SCREW_OF[s.id];
    if (sc && rig.ACTION[sc.act]) drawScrewPts(R, rig.ACTION[sc.act].points, rig.actSet(b, sc.act), ids[s.id]);
  }
  const ctrl = rig.ACTION.ctrl_card;
  if (ctrl && rig.actDone(b, 'ctrl_card')) {
    const ports = Object.entries(rig.PORTS).filter(([, p]) => p.owner === 'act:ctrl_card').map(([k]) => rig.portPos(k, b));
    drawCtrlCard(R, ctrl.row.v, ids.mb || 0, ports);
    drawScrewPts(R, ctrl.points, new Set([0]), ids.mb || 0);
  }
  if (b.placed.psu && rig.PORTS.PSU_MOLEX1) {
    const busy = new Set(b.cables.values());
    ['PSU_MOLEX1', 'PSU_MOLEX2', 'PSU_MOLEX3'].forEach((k) => { if (!busy.has(k)) drawMolexPlug(R, rig.portPos(k, b), ids.psu); });
  }
}
