// Byggriggen för EN beställning: platser, handgrepp, kablar och uttag anpassade
// efter datorns epok. Två chassiupplägg:
//   'classic' – nätagget i taket och enhetsplatser fram (AT-datorer 1983– och ATX t.o.m. 2008)
//   'modern'  – nätagget i botten under en kåpa (ATX-kort från 2009)
// core/build.js pratar bara med riggens API (samma namn som gamla layout.js).
import { DB } from './parts/index.js';
import * as C from './compat.js';
import { VIEW, MAX_K, GPU_LEN } from './geom.js';
import { CONN, connectorIcon, drawCablePixels, cableCurve } from './connectors.js';
import { BOARD_Z, CARD_Z, kindOf, geometry, cardRows, rowAccepts, boardPorts, bayBox as bayBoxOf } from './rig-geo.js';
import { drawRigScene } from './rig-art.js';

const ROW_NAME = { pcie: 'PCIe x16-slot', pcie1: 'PCIe x1-slot', agp: 'AGP-slot', pci: 'PCI-slot', vlb: 'VLB-slot', isa16: 'ISA-slot', isa8: '8-bit ISA-slot' };

// ---------- Riggen ----------
const CACHE = new WeakMap();
export function resetRig(order) { CACHE.delete(order); }
export function rigFor(order) {
  if (CACHE.has(order)) return CACHE.get(order);
  const rig = makeRig(order);
  CACHE.set(order, rig);
  return rig;
}

function orderParts(order) {
  const out = {};
  for (const it of order.items) {
    const p = it.part ? DB.part[it.part] : null;
    (out[it.cat] ||= []).push(p || { cat: it.cat, choice: true });
  }
  return out;
}

function makeRig(order) {
  const op = orderParts(order);
  const one = (cat) => (op[cat] || [])[0] || null;
  const mb = one('mb') || DB.parts.find((p) => p.cat === 'mb');
  const Y = order.year || mb.year || 2022;
  const profile = C.profileOf(mb.form);
  const kind = kindOf(mb);
  const storage = one('storage'), gpu = one('gpu'), sound = one('sound');
  const medias = op.media || [];
  const optical = medias.find((m) => m.kind && !m.kind.startsWith('floppy'));
  const floppy525 = medias.find((m) => m.kind === 'floppy525');
  const floppy35 = medias.find((m) => m.kind === 'floppy35');
  const mbIDE = (mb.storage || []).includes('IDE'), mbSATA = (mb.storage || []).includes('SATA');

  // controllerkort (ISA) när kortet saknar gränssnittet
  const ctrlPorts = [];
  if (storage?.iface === 'MFM') ctrlPorts.push('CTRL_HDC');
  if (storage?.iface === 'IDE' && !mbIDE) ctrlPorts.push('CTRL_IDE');
  if (optical?.iface === 'IDE' && !mbIDE) ctrlPorts.push('CTRL_IDE2');
  if ((floppy525 || floppy35) && !mb.floppy) ctrlPorts.push('CTRL_FDC');
  const needCtrl = ctrlPorts.length > 0;

  const cards = [];
  if (gpu) cards.push({ slot: 'gpu', bus: gpu.bus || 'PCIe' });
  if (sound) cards.push({ slot: 'snd', bus: sound.bus || 'PCI' });
  if (needCtrl) cards.push({ slot: 'ctrl', bus: (mb.slots?.isa16 || 0) > 0 ? 'ISA16' : 'ISA8' });
  const G = geometry(kind, mb);
  G.rowsInfo = cardRows(kind, mb, cards);
  const rowOf = (slot) => cards.find((c) => c.slot === slot)?.row || { v: G.rows[0], type: 'pcie' };
  const cu = (G.socket.u0 + G.socket.u1) / 2, cv = (G.socket.v0 + G.socket.v1) / 2;
  G.cpu = [cu, cv];

  const sock = mb.socket;
  const hasLever = !['DIP40', 'S286', 'S386', 'Slot1', 'SlotA'].includes(sock);
  const hasCooler = !!op.cooler;
  const fanHdr = profile === 'ATX' || mb.year >= 1997;
  const argbHdr = mb.year >= 2016;
  const fanConn = fanHdr ? (mb.year >= 2008 ? 'fan4' : 'fan3') : 'molex';
  const jumperEra = profile === 'AT';

  const media0 = optical || floppy525, media1 = optical && floppy525 ? floppy525 : null;
  const mediaBox = (i, part) => {
    const at = G.media[i];
    const fl = part?.kind === 'floppy525';
    return { u0: at.u0, u1: at.u0 + 7.3, v0: at.v0, v1: at.v0 + 1.7, z0: 0.6, z1: fl ? 4.6 : 5.4 };
  };
  const floppyBox = () => ({ u0: G.floppy.u0, u1: G.floppy.u0 + 4.5, v0: G.floppy.v0, v1: G.floppy.v0 + 1.2, z0: 1.2, z1: 4.8 });

  // ---------- Platser ----------
  const S = [];
  const add = (s) => S.push(s);
  const bd = G.board;
  add({ id: 'case', cat: 'case', name: 'Chassi', requires: [], anchor: [13, 23, 1], hl: [0, 26, 0, 24, 0.5] });
  add({ id: 'mb', cat: 'mb', name: 'Moderkort', requires: ['case'], anchor: [(bd.u0 + bd.u1) / 2, bd.v1 - 1, BOARD_Z], hl: [bd.u0, bd.u1, bd.v0, bd.v1, 0.55] });
  add({ id: 'cpu', cat: 'cpu', name: sock === 'Slot1' || sock === 'SlotA' ? 'Processorslot' : 'Processorsockel', requires: ['mb'], anchor: [cu, cv, 1.2], hl: [G.socket.u0, G.socket.u1, G.socket.v0, G.socket.v1, 0.95] });
  if (hasCooler) add({ id: 'cooler', cat: 'cooler', name: 'CPU-kylare', requires: ['cpu', ...(hasLever ? ['act:lever'] : []), 'act:paste'], anchor: [cu, cv, 4.5], hl: [G.socket.u0 - 0.7, G.socket.u1 + 0.7, G.socket.v0 - 0.7, G.socket.v1 + 0.7, 1.2] });
  add({ id: 'ram', cat: 'ram', name: { DIP: 'Minneskretsarnas socklar', SIMM30: 'SIMM-platser', SIMM72: 'SIMM-platser' }[mb.ram] || 'RAM-platser', requires: ['mb'], anchor: [G.ramU[1] + 0.2, (G.ramV[0] + G.ramV[1]) / 2, 2.8], hl: [G.ramU[0], G.ramU[3] + 0.45, G.ramV[0], G.ramV[1], 1.1] });
  if (storage?.kind === 'nvme' && G.m2) add({ id: 'm2', cat: 'storage', accept: (p) => p.kind === 'nvme', name: 'M.2-plats', requires: ['mb'], anchor: [6, 9.9, 1], hl: [G.m2.u0, G.m2.u1 + 0.5, G.m2.v0, G.m2.v1, 0.85] });
  if (storage && storage.kind !== 'nvme') add({ id: 'bay', cat: 'storage', accept: (p) => p.kind !== 'nvme', name: kind === 'modern' ? 'Hårddiskbur' : 'Hårddiskplats', requires: ['case'], anchor: [(G.bay.u0 + G.bay.u1) / 2, (G.bay.v0 + G.bay.v1) / 2, 1.5], hl: [G.bay.u0, G.bay.u1, G.bay.v0, G.bay.v1, 0.55] });
  if (gpu) { const r = rowOf('gpu'); add({ id: 'gpu', cat: 'gpu', name: ROW_NAME[r.type], row: r, requires: ['mb'], anchor: [7, r.v, 3], hl: [3, 13, r.v - 0.3, r.v + 0.3, 1.15] }); }
  if (sound) { const r = rowOf('snd'); add({ id: 'snd', cat: 'sound', name: `${ROW_NAME[r.type]} (ljudkort)`, row: r, requires: ['mb'], anchor: [6, r.v, 3], hl: [3, 11, r.v - 0.3, r.v + 0.3, 1.15] }); }
  add({ id: 'psu', cat: 'psu', name: 'Nätaggregat', requires: ['case'], anchor: [(G.psu.u0 + G.psu.u1) / 2, (G.psu.v0 + G.psu.v1) / 2, 3.4], hl: [G.psu.u0, G.psu.u1, G.psu.v0, G.psu.v1, 0.55] });
  if (media0) {
    const b = mediaBox(0, media0);
    add({ id: 'media', cat: 'media', accept: (p) => p.kind !== 'floppy35' && !(media1 && p.kind === 'floppy525'), name: '5,25"-plats', box: b, requires: ['case'], anchor: [(b.u0 + b.u1) / 2, (b.v0 + b.v1) / 2, 5], hl: [b.u0, b.u1, b.v0, b.v1, 0.6] });
  }
  if (media1) {
    const b = mediaBox(1, media1);
    add({ id: 'media2', cat: 'media', accept: (p) => p.kind === 'floppy525', name: 'Nedre 5,25"-platsen', box: b, requires: ['case'], anchor: [(b.u0 + b.u1) / 2, (b.v0 + b.v1) / 2, 5], hl: [b.u0, b.u1, b.v0, b.v1, 0.6] });
  }
  if (floppy35) {
    const b = floppyBox();
    add({ id: 'floppy', cat: 'media', accept: (p) => p.kind === 'floppy35', name: '3,5"-plats', box: b, requires: ['case'], anchor: [(b.u0 + b.u1) / 2, (b.v0 + b.v1) / 2, 4.5], hl: [b.u0, b.u1, b.v0, b.v1, 1.2] });
  }
  if (op.fans) {
    const hl = kind === 'modern' ? [5.4, 21.4, 0.5, 1.5, 0.6] : [24.2, 25.4, 13.6, 22.8, 0.6];
    add({ id: 'fans', cat: 'fans', name: kind === 'modern' ? 'Takfläktar' : 'Frontfläktar', requires: ['case'], anchor: kind === 'modern' ? [13, 1, 4] : [24.8, 18, 4], hl });
  }
  S.forEach((s, i) => (s.n = i + 1));
  const SLOT = Object.fromEntries(S.map((s) => [s.id, s]));

  // ---------- Handgrepp ----------
  const A = [];
  if (jumperEra) {
    const xt = mb.form === 'XT';
    const name = xt ? 'Ställ DIP-switcharna' : mb.year >= 1990 ? 'Ställ jumprarna för processorn' : 'Ställ jumprarna på kortet';
    A.push({ id: 'jumpers', name, icon: xt ? '🎚️' : '🔧', requires: ['mb'], points: [[4.4, 11.75, BOARD_Z + 0.3]] });
  }
  A.push({ id: 'mb_screws', name: 'Skruva fast moderkortet', icon: '🪛', requires: ['mb'], points: G.mbScrews.map(([u, v]) => [u, v, BOARD_Z + 0.02]) });
  if (hasLever) A.push({ id: 'lever', name: 'Lås sockelspaken', icon: '🔒', requires: ['cpu'], points: [[G.lever.u0 + 0.1, G.socket.v0 + 0.15, 3.6]] });
  if (hasCooler) A.push({ id: 'paste', name: 'Stryk på kylpasta', icon: '🧴', requires: ['cpu', ...(hasLever ? ['act:lever'] : [])], points: [[cu, cv, 1.35]] });
  if (SLOT.m2) A.push({ id: 'm2_screw', name: 'Skruva fast M.2-disken', icon: '🪛', requires: ['m2'], points: [[G.m2.u0 + 0.12, (G.m2.v0 + G.m2.v1) / 2, 0.95]] });
  if (gpu) A.push({ id: 'gpu_screw', name: 'Skruva fast grafikkortet', icon: '🪛', requires: ['gpu'], points: [[0.82, rowOf('gpu').v + 0.1, 4.25]] });
  if (sound) A.push({ id: 'snd_screw', name: 'Skruva fast ljudkortet', icon: '🪛', requires: ['snd'], points: [[0.82, rowOf('snd').v + 0.1, 4.25]] });
  if (needCtrl) A.push({ id: 'ctrl_card', name: 'Sätt i kontrollerkortet', icon: '🃏', requires: ['mb'], points: [[0.82, rowOf('ctrl').v + 0.1, 4.25]], row: rowOf('ctrl') });
  A.push({ id: 'psu_screws', name: 'Skruva fast nätagget', icon: '🪛', requires: ['psu'], points: G.psuScrews.map(([u, v]) => [u, v, 4.3]) });
  const ACTION = Object.fromEntries(A.map((a) => [a.id, a]));
  const actSet = (b, id) => b.acts.get(id) || new Set();
  const actCount = (b, id) => actSet(b, id).size;
  const actDone = (b, id) => !!ACTION[id] && actCount(b, id) >= ACTION[id].points.length;

  // ---------- Uttag ----------
  // box = [u0,u1,v0,v1,höjd] för uttag på moderkortet; pos(b) för uttag på delar
  const PORTS = boardPorts(kind, mb);
  // uttag på delar
  const gpuLen = (p) => GPU_LEN[Math.max(0, Math.min(2, (p?.len || 2) - 1))];
  PORTS.GPU_PWR = { type: (b) => b.placed.gpu?.pwr || null, owner: 'gpu', label: 'Grafikkortets ström', pos: (b) => [1.0 + gpuLen(b.placed.gpu) - 1.6, rowOf('gpu').v, CARD_Z] };
  if (sound && optical && Y <= 2003) PORTS.SND_CD = { type: 'cdaudio', owner: 'snd', label: 'CD_IN (ljudkortet)', pos: () => [6.2, rowOf('snd').v, 3.2] };
  const ctrlPos = { CTRL_HDC: 3.6, CTRL_IDE: 3.6, CTRL_IDE2: 5.2, CTRL_FDC: 6.8 };
  const ctrlType = { CTRL_HDC: 'mfm', CTRL_IDE: 'ide', CTRL_IDE2: 'ide', CTRL_FDC: 'floppy' };
  const ctrlLabel = { CTRL_HDC: 'Hårddiskkontroller', CTRL_IDE: 'IDE (kontrollerkortet)', CTRL_IDE2: 'IDE 2 (kontrollerkortet)', CTRL_FDC: 'Diskettkontroller' };
  for (const k of ctrlPorts) PORTS[k] = { type: ctrlType[k], owner: 'act:ctrl_card', label: ctrlLabel[k], pos: () => [ctrlPos[k], rowOf('ctrl').v, 3.3] };
  const driveType = (p, what) => {
    if (!p) return null;
    if (what === 'pwr') return p.iface === 'SATA' ? 'satap' : p.iface === 'NVMe' ? null : p.kind === 'floppy35' ? 'berg' : 'molex';
    return { SATA: 'satad', IDE: 'ide', MFM: 'mfm', floppy: 'floppy' }[p.iface] || null;
  };
  const bayBox = (p) => bayBoxOf(G, p);
  if (SLOT.bay) {
    PORTS.BAY_PWR = { type: (b) => driveType(b.placed.bay, 'pwr'), owner: 'bay', label: 'Hårddiskens ström', pos: (b) => { const d = bayBox(b.placed.bay); return [d.u1, d.v0 + (d.v1 - d.v0) * 0.61, (d.z0 + d.z1) / 2]; } };
    PORTS.BAY_DATA = { type: (b) => driveType(b.placed.bay, 'data'), owner: 'bay', label: 'Hårddiskens data', pos: (b) => { const d = bayBox(b.placed.bay); return [d.u1, d.v0 + (d.v1 - d.v0) * 0.21, (d.z0 + d.z1) / 2]; } };
  }
  for (const sid of ['media', 'media2', 'floppy']) {
    const s = SLOT[sid];
    if (!s) continue;
    const K = sid.toUpperCase();
    PORTS[K + '_PWR'] = { type: (b) => driveType(b.placed[sid], 'pwr'), owner: sid, label: `${s.name}: ström`, pos: () => [s.box.u0, (s.box.v0 + s.box.v1) / 2, s.box.z0 + 1.2] };
    PORTS[K + '_DATA'] = { type: (b) => driveType(b.placed[sid], 'data'), owner: sid, label: `${s.name}: data`, pos: () => [s.box.u0, (s.box.v0 + s.box.v1) / 2, s.box.z1 - 1.2] };
  }

  // ---------- Kablar ----------
  const CABLES = [];
  const cab = (c) => CABLES.push(c);
  const allMolex = ['PSU_MOLEX1', 'PSU_MOLEX2', 'PSU_MOLEX3'];
  const P = (b, id) => b.placed[id];

  if (profile === 'AT') {
    cab({ id: 'p8', name: 'P8 → moderkortet', conn: 'at6', from: 'psu', requires: ['psu', 'mb'], wants: ['P8'] });
    cab({ id: 'p9', name: 'P9 → moderkortet', conn: 'at6', from: 'psu', requires: ['psu', 'mb'], wants: ['P9'] });
  } else {
    cab({ id: 'main_pwr', name: `${mb.power === 'ATX20' ? '20' : '24'}-pin ström → moderkortet`, conn: PORTS.ATX_PWR.type, from: 'psu', requires: ['psu', 'mb'], wants: ['ATX_PWR'] });
    if (mb.cpuPower) cab({ id: 'cpu_pwr', name: mb.cpuPower === 'EPS8' ? '8-pin CPU-ström' : '4-pin CPU-ström (P4)', conn: PORTS.CPU_PWR.type, from: 'psu', requires: ['psu', 'mb'], wants: ['CPU_PWR'] });
  }
  if (gpu) cab({ id: 'gpu_pwr', name: 'Ström → grafikkortet', conn: (b) => P(b, 'gpu')?.pwr, from: 'psu', requires: ['psu', 'gpu'], need: (b) => !!P(b, 'gpu')?.pwr, wants: ['GPU_PWR'] });
  if (hasCooler) cab({ id: 'cpu_fan', name: fanHdr ? 'Kylarens fläktkabel' : 'Kylarens fläkt → Molex', conn: fanConn, from: 'cooler', requires: ['cooler', ...(fanHdr ? ['mb'] : ['psu'])], need: (b) => P(b, 'cooler')?.look?.type !== 'heatsink', wants: fanHdr ? ['CPU_FAN'] : allMolex });
  if (hasCooler) cab({ id: 'argb_cooler', name: argbHdr ? 'RGB → kylaren' : 'Kylarens LED → Molex', conn: argbHdr ? 'argb' : 'molex', from: 'cooler', requires: ['cooler', argbHdr ? 'mb' : 'psu'], need: (b) => !!P(b, 'cooler')?.rgb, wants: argbHdr ? ['ARGB_1', 'ARGB_2', 'ARGB_3'] : allMolex });
  if (SLOT.bay) {
    cab({ id: 'bay_pwr', name: 'Ström → hårddisken', conn: (b) => driveType(P(b, 'bay'), 'pwr'), from: 'psu', requires: ['psu', 'bay'], wants: ['BAY_PWR'] });
    const w = storage.iface === 'SATA' ? ['SATA_1', 'SATA_2'] : storage.iface === 'MFM' ? ['CTRL_HDC'] : storage.iface === 'IDE' ? [mbIDE ? 'IDE1' : 'CTRL_IDE'] : [];
    cab({ id: 'bay_data', name: storage.iface === 'MFM' ? 'Flatkablar → kontrollerkortet' : storage.iface === 'IDE' ? 'IDE-flatkabel → hårddisken' : 'SATA-data → moderkortet', conn: (b) => driveType(P(b, 'bay'), 'data'), from: 'bay', requires: ['bay', 'mb'], wants: w });
  }
  for (const sid of ['media', 'media2', 'floppy']) {
    if (!SLOT[sid]) continue;
    const part = sid === 'media' ? media0 : sid === 'media2' ? media1 : floppy35;
    const K = sid.toUpperCase();
    const isFloppy = part.iface === 'floppy';
    const nm = isFloppy ? 'diskettstationen' : part.kind === 'bd' ? 'Blu-ray-spelaren' : part.kind?.startsWith('dvd') ? 'DVD-enheten' : 'CD-enheten';
    cab({ id: sid + '_pwr', name: `Ström → ${nm}`, conn: (b) => driveType(P(b, sid), 'pwr'), from: 'psu', requires: ['psu', sid], wants: [K + '_PWR'] });
    const w = isFloppy ? [mb.floppy ? 'FDD' : 'CTRL_FDC'] : part.iface === 'SATA' ? ['SATA_2', 'SATA_1'] : [mbIDE ? (kind === 'modern' ? 'IDE1' : 'IDE2') : 'CTRL_IDE2'];
    cab({ id: sid + '_data', name: isFloppy ? 'Diskettkabel → diskettstationen' : part.iface === 'SATA' ? `SATA-data → ${nm}` : `IDE-flatkabel → ${nm}`, conn: (b) => driveType(P(b, sid), 'data'), from: sid, requires: [sid, 'mb'], wants: w });
  }
  if (PORTS.SND_CD) cab({ id: 'cd_audio', name: 'CD-ljud → ljudkortet', conn: 'cdaudio', from: 'media', requires: ['media', 'snd'], wants: ['SND_CD'] });
  cab({ id: 'case_fans', name: fanHdr ? 'Chassifläktarnas kabel' : 'Chassifläkten → Molex', conn: fanConn, from: 'case', requires: ['case', fanHdr ? 'mb' : 'psu'], need: (b) => (P(b, 'case')?.fans || []).some((f) => G.fanSlots[f]), wants: fanHdr ? ['SYS_FAN1', 'SYS_FAN2'] : allMolex });
  cab({ id: 'argb_case', name: argbHdr ? 'RGB → chassifläktarna' : 'Chassits LED → Molex', conn: argbHdr ? 'argb' : 'molex', from: 'case', requires: ['case', argbHdr ? 'mb' : 'psu'], need: (b) => !!P(b, 'case')?.rgb && (P(b, 'case').fans || []).some((f) => G.fanSlots[f]), wants: argbHdr ? ['ARGB_1', 'ARGB_2', 'ARGB_3'] : allMolex });
  if (SLOT.fans) {
    cab({ id: 'top_fans', name: kind === 'modern' ? 'Takfläktarnas kabel' : 'Frontfläktarnas kabel', conn: fanConn, from: 'fans', requires: ['fans', fanHdr ? 'mb' : 'psu'], wants: fanHdr ? ['SYS_FAN1', 'SYS_FAN2'] : allMolex });
    cab({ id: 'argb_fans', name: argbHdr ? 'RGB → fläktarna' : 'Fläktarnas LED → Molex', conn: argbHdr ? 'argb' : 'molex', from: 'fans', requires: ['fans', argbHdr ? 'mb' : 'psu'], need: (b) => !!P(b, 'fans')?.rgb, wants: argbHdr ? ['ARGB_1', 'ARGB_2', 'ARGB_3'] : allMolex });
  }
  if (PORTS.F_PANEL) cab({ id: 'fpanel', name: profile === 'AT' ? 'Frontpanel (reset, turbo, lampor)' : 'Frontpanel (startknappen)', conn: PORTS.F_PANEL.type, from: 'case', requires: ['case', 'mb'], wants: ['F_PANEL'] });
  if (PORTS.USB_FRONT) cab({ id: 'usb_front', name: `${PORTS.USB_FRONT.type === 'usb3' ? 'USB 3.0' : 'USB 2.0'} fram`, conn: PORTS.USB_FRONT.type, from: 'case', requires: ['case', 'mb'], need: (b) => (P(b, 'case')?.year || 2020) >= 2001, wants: ['USB_FRONT'] });
  if (PORTS.AUDIO_FRONT) cab({ id: 'audio_front', name: 'Ljud fram (hörlurar)', conn: 'audio', from: 'case', requires: ['case', 'mb'], need: (b) => (P(b, 'case')?.year || 2020) >= 2003, wants: ['AUDIO_FRONT'] });

  // Molex-uttag på nätaggets kablar (för fläktar/LED före moderkortens fläktuttag)
  if (CABLES.some((c) => c.wants === allMolex)) {
    allMolex.forEach((k, i) => (PORTS[k] = { type: 'molex', owner: 'psu', label: `Molex ${i + 1} (nätagget)`, pos: () => G.molexAt(i) }));
  }
  const CABLE = Object.fromEntries(CABLES.map((c) => [c.id, c]));

  // ---------- Hjälpens ordning ----------
  const STEPS = [
    'slot:case', 'slot:mb', 'act:mb_screws', 'act:jumpers', 'slot:cpu', 'act:lever', 'act:paste', 'slot:cooler', 'slot:ram',
    'slot:m2', 'act:m2_screw', 'slot:gpu', 'act:gpu_screw', 'slot:snd', 'act:snd_screw', 'act:ctrl_card',
    'slot:psu', 'act:psu_screws', 'slot:bay', 'slot:media', 'slot:media2', 'slot:floppy', 'slot:fans',
    'cable:p8', 'cable:p9', 'cable:main_pwr', 'cable:cpu_pwr', 'cable:gpu_pwr', 'cable:cpu_fan', 'cable:argb_cooler',
    'cable:bay_pwr', 'cable:bay_data', 'cable:media_pwr', 'cable:media_data', 'cable:media2_pwr', 'cable:media2_data',
    'cable:floppy_pwr', 'cable:floppy_data', 'cable:cd_audio',
    'cable:case_fans', 'cable:argb_case', 'cable:top_fans', 'cable:argb_fans', 'cable:fpanel', 'cable:usb_front', 'cable:audio_front',
  ].filter((k) => { const [kd, id] = k.split(':'); return kd === 'slot' ? !!SLOT[id] : kd === 'act' ? !!ACTION[id] : !!CABLE[id]; });

  // ---------- Regler ----------
  const has = (b, req) => req.startsWith('act:') ? actDone(b, req.slice(4)) : !!b.placed[req];
  const NEED_MSG = {
    case: 'Börja med chassit – allt annat monteras i det.',
    mb: 'Moderkortet måste sitta i först.', cpu: 'Processorn måste sitta i först.', cooler: 'Kylaren måste sitta i först.',
    psu: 'Nätaggregatet måste sitta i först.', bay: 'Hårddisken måste sitta i först.', gpu: 'Grafikkortet måste sitta i först.',
    snd: 'Ljudkortet måste sitta i först.', media: 'Enheten måste sitta i först.', fans: 'Fläktarna måste sitta i först.',
    m2: 'M.2-disken måste sitta i först.',
    'act:lever': 'Lås sockelspaken först – annars sitter processorn löst.',
    'act:paste': 'Stryk på kylpasta på processorn först!',
  };
  function missingReq(reqs, b) {
    for (const r of reqs) if (!has(b, r)) return NEED_MSG[r] || 'Något saknas först.';
    return null;
  }
  const slotsFor = (part) => S.filter((s) => s.cat === part.cat && (!s.accept || s.accept(part)));

  function canPlace(slot, part, b) {
    if (slot.cat !== part.cat) return { ok: false, msg: `${part.name} hör inte hemma i ${slot.name.toLowerCase()}.` };
    if (slot.accept && !slot.accept(part)) {
      if (part.cat === 'storage') return { ok: false, msg: slot.id === 'm2' ? 'M.2-platsen tar bara NVMe-SSD:er.' : 'NVMe-SSD:n ska sitta i M.2-platsen på moderkortet.' };
      return { ok: false, msg: `${part.name} passar inte i ${slot.name.toLowerCase()}.` };
    }
    if (b.placed[slot.id]) return { ok: false, msg: 'Det sitter redan en del där.' };
    const miss = missingReq(slot.requires, b);
    if (miss) return { ok: false, msg: miss };
    const pm = b.placed.mb || mb, cs = b.placed.case;
    if (part.cat === 'mb' && cs && !C.caseFitsMb(cs, part)) return { ok: false, msg: `Passar inte! ${part.name} är ${part.form}, men ${cs.name} rymmer bara ${(cs.forms || cs.fits || []).join('/')}.` };
    if (part.cat === 'case' && !C.caseFitsMb(part, pm)) return { ok: false, msg: `${part.name} rymmer bara ${(part.forms || part.fits || []).join('/')} – moderkortet är ${pm.form}.` };
    if (part.cat === 'cpu' && !C.cpuFitsMb(part, pm)) return { ok: false, msg: `Fel sockel! ${part.name} har sockel ${part.socket}, men moderkortet har ${pm.socket}.` };
    if (part.cat === 'ram' && !C.ramFitsMb(part, pm)) return { ok: false, msg: `Fel minnestyp! ${part.name} är ${part.type}, men moderkortet tar ${pm.ram}.` };
    if (part.cat === 'cooler' && b.placed.cpu && !(part.sockets || []).some((s) => s === b.placed.cpu.socket || (b.placed.cpu.fits || []).includes(s))) return { ok: false, msg: `${part.name} har inga fästen för sockel ${b.placed.cpu.socket}.` };
    if ((part.cat === 'gpu' || part.cat === 'sound') && slot.row) {
      if (!rowAccepts(slot.row, part)) return { ok: false, msg: `${part.name} är ett ${part.bus}-kort – det passar inte i en ${ROW_NAME[slot.row.type]}.` };
    }
    if (part.cat === 'storage' && (b.placed.m2 || b.placed.bay)) return { ok: false, msg: 'Datorn har redan lagring.' };
    if (part.cat === 'storage' && !C.storageFitsMb(part, pm)) return { ok: false, msg: `Moderkortet har inget ${part.iface}-gränssnitt för ${part.name}.` };
    if (part.cat === 'psu') {
      const f = C.psuFits(part, pm, b.placed.cpu || one('cpu') || {}, b.placed.gpu || gpu);
      if (!f.ok) return { ok: false, msg: `${part.name} passar inte: ${f.why}.` };
    }
    if (part.cat === 'fans' && b.placed.cooler?.look?.type === 'aio') return { ok: false, msg: 'Taket är upptaget av vattenkylarens radiator.' };
    if (part.cat === 'cooler' && part.look?.type === 'aio' && b.placed.fans) return { ok: false, msg: 'Radiatorn ska sitta i taket – ta bort takfläktarna först.' };
    return { ok: true };
  }
  function canRemove(slot, b) {
    for (const s of S) if (b.placed[s.id] && s.requires.includes(slot.id)) return { ok: false, msg: `Ta bort ${s.name.toLowerCase()} först.` };
    return { ok: true };
  }
  function onRemove(slot, b) {
    for (const a of A) if (a.requires.includes(slot.id)) b.acts.delete(a.id);
    for (const c of CABLES) if (c.requires.includes(slot.id)) b.cables.delete(c.id);
    for (const [id, key] of [...b.cables]) if (PORTS[key]?.owner === slot.id) b.cables.delete(id);
  }
  const wattNeed = (b) => C.wattNeed(b.placed.cpu, b.placed.gpu, (b.placed.snd ? 10 : 0) + (b.placed.media ? 15 : 0), Y);
  function actionReady(a, b) {
    if (actDone(b, a.id) || missingReq(a.requires, b)) return false;
    if (a.id === 'paste' && b.placed.cooler) return false;
    return true;
  }

  // uttag & kablar
  const portOwnerOk = (p, b) => p.owner.startsWith('act:') ? actDone(b, p.owner.slice(4)) : !!b.placed[p.owner];
  const portType = (key, b) => { const t = PORTS[key]?.type; return typeof t === 'function' ? t(b) : t; };
  function portPos(key, b) {
    const p = PORTS[key];
    if (p.box) { const [u0, u1, v0, v1, h] = p.box; return [(u0 + u1) / 2, (v0 + v1) / 2, BOARD_Z + h]; }
    return p.pos(b);
  }
  const availablePorts = (b) => Object.keys(PORTS).filter((k) => portOwnerOk(PORTS[k], b) && portType(k, b));
  const portLabel = (k) => PORTS[k]?.label || k;
  function portBusy(key, b) { for (const v of b.cables.values()) if (v === key) return true; return false; }
  const cableConn = (c, b) => (typeof c.conn === 'function' ? c.conn(b) : c.conn);
  const cableNeeded = (c, b) => (c.need ? !!c.need(b) : true);
  const cableReady = (c, b) => c.requires.every((r) => b.placed[r]) && cableNeeded(c, b) && !!cableConn(c, b);
  const cableOk = (b, id) => !!CABLE[id] && b.cables.has(id) && CABLE[id].wants.includes(b.cables.get(id));
  const PSU_ORDER = ['p8', 'p9', 'main_pwr', 'cpu_pwr', 'gpu_pwr', 'bay_pwr', 'media_pwr', 'media2_pwr', 'floppy_pwr'];

  function cableFrom(c, b) {
    const [cu0, cv0] = G.cpu;
    switch (c.from) {
      case 'psu': return G.psuOut(Math.max(0, PSU_ORDER.indexOf(c.id)));
      case 'bay': return portPos('BAY_DATA', b);
      case 'media': case 'media2': case 'floppy': return c.id === 'cd_audio' ? [SLOT.media.box.u0, SLOT.media.box.v1 - 0.2, SLOT.media.box.z0 + 2.4] : portPos(c.from.toUpperCase() + '_DATA', b);
      case 'cooler': {
        const t = b.placed.cooler?.look?.type;
        const base = t === 'aio' ? [cu0 + 1.3, cv0 + 0.6, 1.6] : t === 'low' ? [cu0 + 2.1, cv0 + 1.6, 1.8] : [cu0 + 1.7, cv0 + 2.4, 1.4];
        return c.id === 'argb_cooler' ? [base[0], base[1] + 0.4, base[2]] : base;
      }
      case 'case': {
        const F = G.front;
        return { case_fans: F.fans, argb_case: [F.fans[0], F.fans[1] - 0.5, F.fans[2]], fpanel: F.fpanel, usb_front: F.usb, audio_front: F.audio }[c.id] || F.fpanel;
      }
      case 'fans': return c.id === 'argb_fans' ? [G.topFans[0] - 0.6, G.topFans[1], G.topFans[2] + 0.2] : G.topFans;
    }
    return [13, 12, 1];
  }

  function canConnect(c, key, b, help) {
    const conn = cableConn(c, b), type = portType(key, b);
    if (portBusy(key, b)) return { ok: false, msg: `${portLabel(key)} är redan upptaget.` };
    const fits = conn === type || (conn === 'fan3' && type === 'fan4') || (conn === 'fan4' && type === 'fan3');
    if (!fits) return { ok: false, msg: `Fel kontakt! ${CONN[conn]?.name || conn} passar inte i ${portLabel(key)}. Där sitter ${CONN[type]?.name || type} – ${CONN[type]?.desc || ''}.` };
    if (!c.wants.includes(key)) {
      if (help) {
        const extra = c.id === 'p8' || c.id === 'p9' ? ' P8 och P9 ser likadana ut – de svarta sladdarna ska mötas i mitten!' : '';
        return { ok: false, msg: `Den passar i formen, men ${c.name.toLowerCase()} ska sitta i ${c.wants.map(portLabel).join(' eller ')}.${extra}` };
      }
      return { ok: true, wrongPort: true };
    }
    return { ok: true };
  }

  const SCREW_OF = {
    mb: { act: 'mb_screws', where: 'i de blanka hålen i moderkortets hörn och kanter' },
    m2: { act: 'm2_screw', where: 'i änden av M.2-disken (mässingshålet)' },
    gpu: { act: 'gpu_screw', where: 'på metallfliken längst bak på grafikkortet, vid bakpanelen' },
    snd: { act: 'snd_screw', where: 'på ljudkortets metallfläns vid bakpanelen' },
    psu: { act: 'psu_screws', where: 'i bakpanelen bredvid nätagget' },
  };
  function screwStatus(slotId, b) {
    const s = SCREW_OF[slotId];
    if (!s || !ACTION[s.act] || actDone(b, s.act)) return null;
    const n = ACTION[s.act].points.length, left = n - actCount(b, s.act);
    return `Inte fastskruvad (${left} ${left === 1 ? 'skruv' : 'skruvar'} kvar) – skruvhålet sitter ${s.where}. Tryck på hålet.`;
  }
  function standCheck(b) {
    const p = b.placed, out = [];
    if (p.cpu && ACTION.lever && !actDone(b, 'lever')) out.push({ msg: 'Sockelspaken är inte låst – processorn sitter löst!', hint: 'Lås spaken bredvid processorn.' });
    if (p.mb && !actDone(b, 'mb_screws')) out.push({ msg: `Det skramlar! Moderkortet är inte fastskruvat – tryck på skruvhålen ${SCREW_OF.mb.where}.`, hint: '' });
    if (p.gpu && ACTION.gpu_screw && !actDone(b, 'gpu_screw')) out.push({ msg: `Grafikkortet hänger snett – skruva fast det ${SCREW_OF.gpu.where}.`, hint: '' });
    if (p.snd && ACTION.snd_screw && !actDone(b, 'snd_screw')) out.push({ msg: `Ljudkortet glappar – skruva fast det ${SCREW_OF.snd.where}.`, hint: '' });
    if (p.psu && !actDone(b, 'psu_screws')) out.push({ msg: `Nätagget glider runt – skruva fast det ${SCREW_OF.psu.where}.`, hint: '' });
    if (p.m2 && ACTION.m2_screw && !actDone(b, 'm2_screw')) out.push({ msg: `M.2-disken står snett – skruva fast den ${SCREW_OF.m2.where}.`, hint: '' });
    return out;
  }

  const rig = {
    VIEW, MAX_K, CONN, connectorIcon,
    order, kind, profile, year: Y, mb, geo: G, fanHdr, argbHdr, needCtrl,
    SLOTS: S, SLOT, ACTIONS: A, ACTION, CABLES, CABLE, STEPS, PORTS,
    actSet, actCount, actDone, missingReq, slotsFor, canPlace, canRemove, onRemove, wattNeed, actionReady,
    portPos, portType, availablePorts, portLabel, portBusy, cableConn, cableNeeded, cableReady, cableOk, cableFrom, canConnect,
    SCREW_OF, screwStatus, standCheck, bayBox, rowOf, gpuLen,
    fact,
  };
  rig.drawScene = (R, b, anim = {}) => drawRigScene(rig, R, b, anim);
  rig.drawCables = (ctx, R, b, anim = {}) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    for (const [id, key] of b.cables) {
      const c = CABLE[id];
      if (!c || !c.requires.every((r) => b.placed[r]) || !PORTS[key]) continue;
      const a = R.proj(...cableFrom(c, b)), e = R.proj(...portPos(key, b));
      const sc = R.k / 8;
      const lift = Math.min(28 * sc, 8 * sc + Math.hypot(e[0] - a[0], e[1] - a[1]) * 0.18);
      const prog = anim.plug?.id === id ? Math.min(1, anim.plug.t) : 1;
      const conn = cableConn(c, b);
      if (CONN[conn]) drawCablePixels(ctx, cableCurve(a, e, lift), conn, prog, sc);
    }
  };
  return rig;
}

// ---------- Fakta ----------
export const FACTS = {
  case: (p) => `Chassit är datorns skal.${p.fans?.length ? ` ${p.name} har ${p.fans.length} fläktar som flyttar luft genom datorn.` : ' Förr kyldes datorn nästan bara av nätaggets fläkt.'}`,
  mb: (p) => p.profile === 'AT'
    ? `Moderkortet kopplar ihop allt. ${p.form}-kort som det här har instickskort i ISA-slots och får ström via två kontakter: P8 och P9.`
    : 'Moderkortet kopplar ihop allt. Kopparbanorna är SYSTEMBUSSEN – vägarna där data åker mellan CPU, minne och I/O.',
  cpu: (p) => p.look?.pkg === 'dip'
    ? `${p.name} är ett långt chip med 40 ben. Skåran i ena änden ska åt samma håll som skåran i sockeln – annars går den sönder!`
    : `Processorn är hjärnan: STYRENHETEN bestämmer, ALU:n räknar och REGISTREN minns det allra viktigaste. Sockeln ${p.socket} måste passa moderkortet.`,
  lever: 'Spaken trycker ner processorn mot stiften i sockeln så att alla får kontakt (ZIF = Zero Insertion Force).',
  paste: 'Kylpasta fyller mikroskopiska luftbubblor mellan CPU och kylare, så värmen leds bort bättre.',
  cooler: (p) => p.look?.type === 'heatsink' ? `${p.name} är en passiv kylfläns – aluminiumflänsarna sprider värmen utan fläkt.` : `Kylaren tar bort värmen. ${p.name} klarar ${p.maxW} W – en för varm CPU saktar ner eller stängs av!`,
  ram: (p) => ({
    DIP: `Förr satt arbetsminnet som lösa kretsar i socklar direkt på moderkortet. ${p.name} ger datorn ${p.mb >= 1 ? p.mb + ' MB' : Math.round(p.mb * 1024) + ' KB'}.`,
    SIMM30: 'SIMM-moduler (30 stift) samlade minneskretsarna på ett litet kort – mycket enklare än lösa kretsar!',
    SIMM72: '72-pinnars SIMM rymde mer minne. Moduler med FPM- och EDO-minne var vanliga på 486:or och Pentium-datorer.',
  })[p.type] || `RAM är ARBETSMINNET. CPU:n hämtar instruktioner och data härifrån. Snabbt – men glömmer allt när strömmen går. ${p.type} passar bara i ${p.type}-platser.`,
  storage: (p) => ({
    MFM: 'Tidiga hårddiskar (MFM) behövde ett eget kontrollerkort och två flatkablar. 20 MB var enormt mycket 1985!',
    IDE: 'IDE-disken har kontrollern inbyggd och ansluts med en bred 40-pinnars flatkabel. Den röda kanten = stift 1.',
  })[p.iface] || ({
    nvme: 'M.2 NVMe-SSD minns allt även utan ström och pratar direkt med processorn via PCIe – supersnabbt!',
    hdd: 'Hårddisken har en snurrande skiva och en läsarm. Billig och rymlig, men mycket långsammare än en SSD. Den behöver två kablar: ström och data.',
    ssd: 'SATA-SSD har inga rörliga delar. Snabbare än en hårddisk, långsammare än NVMe. Den behöver ström- och datakabel.',
  })[p.kind] || 'Lagringen minns allt även när strömmen är av.',
  media: (p) => p.iface === 'floppy'
    ? `Diskettstationen läser ${p.kind === 'floppy525' ? '5,25-tums disketter (upp till 1,2 MB)' : '3,5-tums disketter (1,44 MB)'}. Här startade man program och sparade sitt arbete.`
    : 'Den optiska enheten läser skivor med en laser – CD-ROM rymmer 650 MB, lika mycket som 450 disketter!',
  gpu: (p) => {
    const mem = p.vram >= 1024 ? `${+(p.vram / 1024).toFixed(1)} GB` : p.vram >= 1 ? `${Math.round(p.vram)} MB` : `${Math.round(p.vram * 1024)} KB`;
    return p.std && p.std !== '3D' ? `${p.name} är ett ${p.std}-grafikkort med ${mem} videominne. Det gör om datorns bilddata till en signal som skärmen kan visa.` : `Grafikkortet har tusentals små kärnor som räknar samtidigt (parallellt). ${p.name} har ${mem} videominne och drar ${p.watt} W${p.pwr ? ' – den behöver egen strömkabel' : ''}.`;
  },
  sound: (p) => `${p.name} ger datorn riktigt ljud – förr kunde en PC bara pipa med den inbyggda högtalaren!`,
  psu: (p) => p.form === 'AT' ? `AT-nätagget har en stor strömbrytare och två kontakter till moderkortet: P8 och P9. ${p.watt} W räckte gott på den tiden.` : `Nätaggregatet gör om 230 V från väggen till 12 V, 5 V och 3,3 V. ${p.watt} W – räkna CPU + grafikkort + marginal.`,
  fans: (p) => `Fläktarna flyttar varm luft ut ur datorn.${p.rgb ? ' De har RGB och behöver en egen RGB-kabel.' : ''}`,
  mb_screws: 'Skruvarna håller moderkortet på distanserna så att det inte nuddar chassits plåt – annars kan det bli kortslutning!',
  jumpers: 'Förr fanns inga BIOS-menyer för inställningar: man satte små byglar (jumprar) eller DIP-switchar på kortet för klockfrekvens, spänning, minne och grafikläge.',
  ctrl_card: 'Kontrollerkortet är länken mellan moderkortet och hårddisken/disketterna – på den här tiden fanns det inte inbyggt.',
  m2_screw: 'En liten skruv håller M.2-disken på plats.',
  gpu_screw: 'Instickskort skruvas fast i bakpanelen så att de inte böjer sig och glappar.',
  snd_screw: 'Ljudkortet skruvas fast i bakpanelen – annars kan det glappa när man kopplar in hörlurarna.',
  psu_screws: 'Nätagget skruvas fast i bakpanelen så att det sitter stadigt.',
  at6: 'P8 och P9 ger AT-moderkortet ström. De ser likadana ut – regeln är att de svarta sladdarna ska sitta mot varandra i mitten. Fel håll kan bränna kortet!',
  atx20: '20-pinnars ATX-kontakten kom 1995 och gjorde att datorn kunde stängas av mjukt från Windows.',
  atx24: '24-pin-kabeln ger moderkortet ström. Utan den händer ingenting när du trycker på startknappen.',
  atx12v4: '4-pinnars ATX12V (P4-kontakten) kom med Pentium 4 som behövde extra kraft till processorn.',
  eps8: '8-pin CPU-kabeln ger processorn extra kraft. Utan den snurrar fläktarna men skärmen förblir svart.',
  molex: 'Molex-kontakten ger 12 V och 5 V. Den användes till hårddiskar, CD-enheter och fläktar i många år.',
  berg: 'Den lilla Berg-kontakten ger ström till 3,5-tums diskettstationer.',
  pcie6: 'Grafikkort som drog mer än 75 W fick en egen 6-pinnars PCIe-kabel.',
  pcie8: 'Kraftiga grafikkort behöver egen ström direkt från nätagget via 8-pin PCIe.',
  '2xpcie8': 'Riktigt törstiga grafikkort behöver två 8-pinnars kablar – upp till 375 W.',
  '3xpcie8': 'Tre 8-pinnars kablar! Toppkorten drar enorma mängder ström.',
  '12vhpwr': 'Nya grafikkort använder 12V-2x6: en liten kontakt som klarar upp till 600 W. Tryck in den ordentligt!',
  satap: 'SATA-strömkabeln ger hårddisken ström från nätagget.',
  satad: 'SATA-datakabeln skickar data mellan hårddisken och moderkortet.',
  ide: 'IDE-flatkabeln har 40 ledare. Den röda kanten markerar stift 1 – vänd den rätt!',
  floppy: 'Diskettkabeln har ett tvinnat parti: enheten efter tvinningen blir A:, den före blir B:.',
  mfm: 'MFM-disken behöver två flatkablar: en bred för styrning och en smal för själva datan.',
  cdaudio: 'CD-ljudkabeln leder musiken från CD-enheten till ljudkortet – spel som Myst spelade sin musik direkt från skivan.',
  fan3: '3-pinnars fläktkabeln ger ström och skickar varvtalet tillbaka till moderkortet.',
  fan4: '4-pin-fläktkablar låter moderkortet styra fläkthastigheten. Kylarens fläkt MÅSTE sitta i CPU_FAN!',
  argb: 'ARGB-kabeln (5 V) styr RGB-lamporna. Utan den lyser inget.',
  fpanel: 'Frontpanelens små sladdar kopplar startknappen och lamporna till moderkortet – utan dem går datorn inte att starta.',
  fpanel_at: 'På AT-datorer satt strömbrytaren direkt på nätagget. Frontpanelen styr reset, turbo-knappen, lamporna och högtalaren.',
  usb2: 'USB 2.0-kabeln gör att USB-uttagen på framsidan fungerar.',
  usb3: 'USB 3.0-kabeln gör att USB-uttagen på framsidan fungerar.',
  audio: 'Ljudkabeln gör att hörlursuttaget på framsidan fungerar.',
};
export function fact(key, part) { const f = FACTS[key]; return typeof f === 'function' ? f(part || {}) : f || ''; }
