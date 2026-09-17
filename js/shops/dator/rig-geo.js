// Chassits och moderkortets geometri per epok (världsenheter, se geom.js).
// Används av byggreglerna (rig.js) och av grafiken (art-base.js).
import { FAN_SLOTS } from './geom.js';
import { profileOf } from './compat.js';

export const BOARD_Z = 0.8;
export const CARD_Z = 3.9;
const WIDE = ['AT', 'ATX'];

// 'classic' = nätagg i taket, enhetsplatser fram. 'modern' = nätagg i botten (2009–)
export const kindOf = (mb) => (profileOf(mb.form) === 'AT' || (mb.year || 2022) < 2009 ? 'classic' : 'modern');

// Slotarnas längd längs u (bakpanelen = u 0)
export const ROW_SPAN = {
  classic: { isa8: [2.8, 8.6], isa16: [2.8, 10.4], vlb: [2.8, 12.4], pci: [3.4, 8.6], agp: [4.2, 8.6], pcie: [2.8, 10.8], pcie1: [2.8, 4.6] },
  modern: { isa8: [3, 9], isa16: [3, 11], vlb: [3, 12.4], pci: [3.4, 9.4], agp: [4.2, 9.4], pcie: [3, 13], pcie1: [3, 5.2] },
};

export function geometry(kind, mb) {
  if (kind === 'modern') {
    return {
      kind,
      board: { u0: 1.5, u1: mb.form === 'ATX' ? 17.5 : 14.5, v0: 1.5, v1: 17, z0: 0.5, z1: BOARD_Z },
      socket: { u0: 5, u1: 8.6, v0: 3.8, v1: 7.4 }, lever: { u0: 8.75, u1: 8.95 },
      ramU: [10.2, 10.9, 11.6, 12.3], ramV: [3, 9.6],
      m2: { u0: 3.5, u1: 8.5, v0: 9.4, v1: 10.4 },
      rows: [14.5, 12.4],
      io: { u0: 1.6, u1: 3.1, v0: 1.6, v1: 7.2 },
      psu: { u0: 0.8, u1: 7.8, v0: 18.3, v1: 23.3, z0: 0.5, z1: 3.4 },
      bay: { u0: 16.5, u1: 25, v0: 18.3, v1: 23.3 },
      cage: null,
      media: [{ u0: 16.8, v0: 1.9 }, { u0: 16.8, v0: 3.9 }], floppy: { u0: 19.4, v0: 5.9 },
      mbScrews: [[2.5, 2.5], [2.5, 9], [2.5, 16], [13.8, 2.5], [13.8, 9], [13.8, 16]],
      psuScrews: [[0.52, 19.2], [0.52, 22.4]],
      psuOut: (k) => [7.8, 19.1 + k * 0.7, 2.4],
      molexAt: (i) => [9.2 + i * 1.5, 20.6, 0.9],
      front: { fpanel: [25.4, 12.5, 1.4], usb: [25.4, 11.0, 1.4], audio: [25.4, 14.0, 1.4], fans: [24.2, 17.3, 1.0] },
      topFans: [21.4, 1.5, 1.2],
      fanSlots: FAN_SLOTS,
    };
  }
  const u1 = WIDE.includes(mb.form) ? 16.4 : 14.0;
  return {
    kind,
    board: { u0: 1.5, u1, v0: 6.4, v1: 23.4, z0: 0.5, z1: BOARD_Z },
    socket: { u0: 3.6, u1: 7.2, v0: 7.6, v1: 11.2 }, lever: { u0: 7.35, u1: 7.55 },
    ramU: [8.1, 8.8, 9.5, 10.2], ramV: [7.0, 12.9],
    m2: null,
    rows: [14.2, 15.5, 16.8, 18.1, 19.4, 20.7, 22.0],
    io: { u0: 1.6, u1: 3.1, v0: 7.3, v1: 12.9 },
    psu: { u0: 0.8, u1: 7.8, v0: 0.8, v1: 5.8, z0: 0.5, z1: 3.4 },
    bay: { u0: 17.2, u1: 25.2, v0: 7.4, v1: 12.8 },
    cage: { u0: 17.0, u1: 25.5, v0: 0.8, v1: 13.0 },
    media: [{ u0: 18.0, v0: 1.1 }, { u0: 18.0, v0: 3.1 }], floppy: { u0: 20.8, v0: 5.4 },
    mbScrews: [[3.2, 6.85], [2.5, 13.5], [2.5, 22.8], [u1 - 1, 6.75], [u1 - 1, 13.6], [u1 - 1, 22.8]],
    psuScrews: [[0.52, 1.7], [0.52, 4.9]],
    psuOut: (k) => [7.8, 1.5 + k * 0.55, 2.0],
    molexAt: (i) => [9.4 + i * 1.6, 3.4, 0.9],
    front: { fpanel: [25.4, 15.5, 1.4], usb: [25.4, 14.2, 1.4], audio: [25.4, 16.8, 1.4], fans: [24.2, 19.0, 1.0] },
    topFans: [24.2, 21.0, 1.2],
    fanSlots: {
      front1: { u0: 24.2, u1: 25.4, v0: 13.6, v1: 18.0, face: 'right' },
      front2: { u0: 24.2, u1: 25.4, v0: 18.4, v1: 22.8, face: 'right' },
      rear: { u0: 0.5, u1: 1.45, v0: 6.6, v1: 10.6, face: 'right' },
    },
  };
}

// Kortplatser uppifrån och ned. cards = [{slot, bus}] får .row (första passande plats)
const ROW_OK = { ISA8: ['isa8', 'isa16'], ISA16: ['isa16'], VLB: ['vlb'], PCI: ['pci'], AGP: ['agp'], PCIe: ['pcie', 'pcie1'] };
export function cardRows(kind, mb, cards = []) {
  const s = mb.slots || {}, types = [];
  const pcie = s.pcie || 0;
  if (pcie) types.push('pcie');
  for (let i = 0; i < (s.agp || 0); i++) types.push('agp');
  if (kind === 'modern') {
    const second = cards[1];
    if (second) types.splice(1, 0, second.bus === 'PCI' && s.pci ? 'pci' : 'pcie1');
    else if (types.length < 2) types.push(pcie > 1 ? 'pcie1' : s.pci ? 'pci' : 'pcie1');
    if (!types.length) types.push('pcie');
  } else {
    for (let i = 0; i < (s.vlb || 0); i++) types.push('vlb');
    for (let i = 0; i < (s.pci || 0); i++) types.push('pci');
    for (let i = 1; i < pcie; i++) types.push('pcie1');
    for (let i = 0; i < (s.isa16 || 0); i++) types.push('isa16');
    for (let i = 0; i < (s.isa8 || 0); i++) types.push('isa8');
  }
  const G = geometry(kind, mb);
  const rows = types.slice(0, G.rows.length).map((type, i) => ({ type, v: G.rows[i], card: null }));
  for (const c of cards) {
    const ok = c.slot === 'gpu' && c.bus === 'PCIe' ? ['pcie'] : (ROW_OK[c.bus] || []);
    const row = rows.find((r) => !r.card && ok.includes(r.type)) || rows.find((r) => !r.card);
    if (row) { row.card = c.slot; c.row = row; }
  }
  return rows;
}
export const rowAccepts = (row, part) => (part.cat === 'gpu' && part.bus === 'PCIe' ? ['pcie'] : (ROW_OK[part.bus] || [])).includes(row.type);

// Uttag på moderkortet: key → { type, label, box: [u0,u1,v0,v1,höjd] }
export function boardPorts(kind, mb) {
  const P = {};
  const port = (key, type, label, box) => (P[key] = { type, owner: 'mb', label, box });
  const at = profileOf(mb.form) === 'AT', y = mb.year || 2022;
  const fanHdr = !at || y >= 1997;
  const fanConn = fanHdr ? (y >= 2008 ? 'fan4' : 'fan3') : null;
  const ide = (mb.storage || []).includes('IDE'), sata = (mb.storage || []).includes('SATA');
  if (kind === 'modern') {
    port('ATX_PWR', mb.power === 'ATX20' ? 'atx20' : 'atx24', mb.power === 'ATX20' ? 'ATX 20-pin' : 'ATX 24-pin', [13.6, 14.2, 3.5, 7, 0.5]);
    if (mb.cpuPower) port('CPU_PWR', mb.cpuPower === 'EPS8' ? 'eps8' : 'atx12v4', mb.cpuPower === 'EPS8' ? 'CPU_PWR (8-pin)' : 'ATX12V (4-pin)', mb.cpuPower === 'EPS8' ? [3.2, 4.4, 1.7, 2.5, 0.45] : [3.5, 4.1, 1.7, 2.5, 0.45]);
    port('CPU_FAN', fanConn, 'CPU_FAN', [9.4, 10.0, 2.05, 2.35, 0.3]);
    port('SYS_FAN1', fanConn, 'SYS_FAN1', [1.65, 1.95, 8.0, 8.6, 0.3]);
    port('SYS_FAN2', fanConn, 'SYS_FAN2', [10.6, 11.2, 16.25, 16.55, 0.3]);
    if (y >= 2016) {
      port('ARGB_1', 'argb', 'ARGB_1', [9.3, 9.75, 16.25, 16.55, 0.3]);
      port('ARGB_2', 'argb', 'ARGB_2', [13.7, 14.0, 8.05, 8.5, 0.3]);
      port('ARGB_3', 'argb', 'ARGB_3', [13.7, 14.0, 7.35, 7.8, 0.3]);
    }
    port('F_PANEL', 'fpanel', 'F_PANEL', [11.9, 13.2, 16.1, 16.7, 0.3]);
    if (y >= 2011) port('USB_FRONT', 'usb3', 'USB 3.0', [13.55, 14.15, 9.5, 11.0, 0.45]);
    else port('USB_FRONT', 'usb2', 'USB 2.0', [13.65, 14.05, 9.8, 10.8, 0.35]);
    if (mb.audio !== false) port('AUDIO_FRONT', 'audio', 'HD_AUDIO', [2.1, 3.1, 16.1, 16.7, 0.35]);
    if (sata) { port('SATA_1', 'satad', 'SATA 1', [13.4, 14.2, 11.3, 12.1, 0.35]); port('SATA_2', 'satad', 'SATA 2', [13.4, 14.2, 12.1, 12.9, 0.35]); }
    if (ide) port('IDE1', 'ide', 'IDE 1', [13.5, 14.1, 13.2, 15.9, 0.4]);
    return P;
  }
  if (at) {
    port('P8', 'at6', 'P8', [1.95, 2.55, 8.6, 10.7, 0.5]);
    port('P9', 'at6', 'P9', [1.95, 2.55, 10.8, 12.9, 0.5]);
    if (y >= 1986) port('F_PANEL', 'fpanel_at', 'Frontpanel', [11.0, 12.3, 22.75, 23.25, 0.3]);
  } else {
    port('ATX_PWR', mb.power === 'ATX24' ? 'atx24' : 'atx20', mb.power === 'ATX24' ? 'ATX 24-pin' : 'ATX 20-pin', [11.3, 11.9, 7.3, mb.power === 'ATX24' ? 11.0 : 10.4, 0.5]);
    if (mb.cpuPower) port('CPU_PWR', mb.cpuPower === 'EPS8' ? 'eps8' : 'atx12v4', mb.cpuPower === 'EPS8' ? 'CPU_PWR (8-pin)' : 'ATX12V (4-pin)', mb.cpuPower === 'EPS8' ? [3.7, 4.9, 11.45, 12.05, 0.45] : [3.7, 4.3, 11.45, 12.05, 0.45]);
    port('F_PANEL', 'fpanel', 'F_PANEL', [11.0, 12.3, 22.75, 23.25, 0.3]);
    if (y >= 2001) port('USB_FRONT', 'usb2', 'USB 2.0', [8.2, 9.0, 22.75, 23.25, 0.35]);
    if (y >= 2003 && mb.audio) port('AUDIO_FRONT', 'audio', 'Ljud fram', [4.0, 5.0, 22.75, 23.25, 0.35]);
  }
  if (fanHdr) {
    port('CPU_FAN', fanConn, 'CPU_FAN', [5.4, 6.0, 11.55, 11.85, 0.3]);
    port('SYS_FAN1', fanConn, 'SYS_FAN1', [13.3, 13.9, 13.25, 13.55, 0.3]);
    if (y >= 2002) port('SYS_FAN2', fanConn, 'SYS_FAN2', [13.3, 13.9, 19.0, 19.3, 0.3]);
  }
  if (ide) { port('IDE1', 'ide', 'IDE 1 (primär)', [12.6, 13.15, 7.3, 10.2, 0.4]); port('IDE2', 'ide', 'IDE 2 (sekundär)', [13.3, 13.85, 7.3, 10.2, 0.4]); }
  if (mb.floppy) port('FDD', 'floppy', 'FDD (diskett)', [12.6, 13.15, 10.5, 12.5, 0.4]);
  if (sata) { port('SATA_1', 'satad', 'SATA 1', [13.25, 13.95, 16.2, 16.95, 0.35]); port('SATA_2', 'satad', 'SATA 2', [13.25, 13.95, 17.05, 17.8, 0.35]); }
  return P;
}

// Hårddiskens låda i hårddiskplatsen (liggande)
export function bayBox(geo, p) {
  const b = geo.bay, cu = (b.u0 + b.u1) / 2, cv = (b.v0 + b.v1) / 2;
  const st = p?.look?.style;
  const [U, V, Z] = st === 'mfm-fh' ? [7.3, 5.2, 3.0] : st === 'hdd-hh' ? [7.3, 5.2, 1.6] : p?.kind === 'hdd' ? [5.8, 4.2, 1.1] : [3.9, 2.8, 0.4];
  return { u0: cu - U / 2, u1: cu + U / 2, v0: cv - V / 2, v1: cv + V / 2, z0: 0.55, z1: 0.55 + Z };
}
