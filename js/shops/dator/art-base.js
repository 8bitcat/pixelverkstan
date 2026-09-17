// Pixelgrafik: arbetsbänk, öppet chassi och moderkort för alla epoker.
//   classic – nätagget i taket, enhetsplatser fram, AT/ATX-kort med ISA/VLB/PCI/AGP
//   modern  – nätagget i botten under kåpa, ATX-kort med PCIe och M.2
import { hex, shade, mix } from '../../core/raster.js';
import { textBitmap } from '../../core/pixfont.js';
import { C, fan, honeycomb, hash, led, brushed, smd, traces, perforated, pcbArt, icTop, capTop, TB, screwHead, screwHole, modelText } from './art-common.js';
import { BOARD_Z, kindOf, geometry, cardRows, boardPorts, ROW_SPAN } from './rig-geo.js';

const CASE = { u0: 0, u1: 26, v0: 0, v1: 24, z0: 0, z1: 0.5, wall: 5 };

export function drawMat(R, id) {
  const m = { u0: -1, u1: 26.5, v0: -1, v1: 25 };
  R.box(m.u0, m.u1, m.v0, m.v1, -0.4, 0, (f, x, y) => {
    if (f !== 'top') return 0x283039;
    const line = (x % 2) < 0.12 || (y % 2) < 0.12;
    if (line) return 0x4a5664;
    if (x > m.u1 - m.u0 - 3.2 && y < 2 && ((x * 4 | 0) % 2)) return 0x46505e; // linjal i hörnet
    return hash(x * 3 | 0, y * 3 | 0) > 0.93 ? 0x404a57 : 0x39424f;
  }, id);
}

// ---------- Fläktenhet (fram/bak/tak) ----------
// s = fläktplatsens låda { u0,u1,v0,v1, face }
export function drawFanUnit(R, s, look, o, id, key = 'fan') {
  if (!s) return;
  const frame = hex(look.frame || '#1d1d1d'), blade = hex(look.blade || '#2a2a2a');
  const z0 = CASE.z1 + 0.1, z1 = z0 + Math.min(4.8, (s.v1 - s.v0) + (s.u1 - s.u0) - 0.2);
  const k = key.charCodeAt(key.length - 1);
  R.box(s.u0, s.u1, s.v0, s.v1, z0, z1, (f, x, y, W, H) => {
    if (f !== s.face) {
      if (look.rgb && f !== 'top' && (y > H / 2 - 0.12 && y < H / 2 + 0.12)) return led(o, look.key, k);
      return (x < 0.3 || x > W - 0.3) ? C.rubber : frame;
    }
    const c = fan(x, y, W / 2, H / 2, Math.min(W, H) / 2 - 0.25, {
      spin: o.spin || 0, frame, blade, hub: shade(frame, 1.2), blades: 9,
      ring: look.rgb ? led(o, look.key, k) : -1,
    });
    return c < 0 ? -1 : c;
  }, id);
}

// ---------- Skruvar ----------
export function drawScrewPts(R, pts, done, id) {
  pts.forEach(([u, v, z], i) => {
    if (done.has(i)) {
      R.box(u - 0.3, u + 0.3, v - 0.3, v + 0.3, z, z + 0.12, (f, x, y) => {
        if (f === 'top') return screwHead(x, y, 0.3, 0.3, 0.29);
        return Math.abs(x - 0.3) < 0.24 ? C.steelDark : -1;
      }, id);
    } else {
      R.box(u - 0.32, u + 0.32, v - 0.32, v + 0.32, z, z + 0.015, (f, x, y) => f === 'top' ? screwHole(x, y, 0.32, 0.32, 0.31) : -1, id, { noEdges: true });
    }
  });
}

// ---------- Öppet chassi ----------
export function drawCase(R, part, o, rig) {
  const G = rig?.geo || geometry('modern', { form: 'ATX', year: 2022 });
  if (G.kind === 'classic') caseClassic(R, part, o, G);
  else caseModern(R, part, o, G);
  const light = ((hex(part.look.color) >> 16) & 255) > 150;
  const fanLook = { frame: light ? '#ececea' : '#1a1a1c', blade: light ? '#f4f4f2' : '#2b2b2e', rgb: part.rgb, key: 'case' };
  for (const s of part.fans || []) drawFanUnit(R, G.fanSlots[s], fanLook, o, o.ids?.case || 0, s);
}

function caseColors(part) {
  const L = part.look, col = hex(L.color), inner = hex(L.inner || L.color);
  const light = ((col >> 16) & 255) > 150;
  return { L, col, inner, light, edge: shade(col, light ? 0.85 : 1.35) };
}

function caseModern(R, part, o, G) {
  const c = CASE, { L, col, inner, edge } = caseColors(part);
  const id = o.ids?.case || 0;
  const stand = [...G.mbScrews, [9.5, 2.5], [9.5, 9], [9.5, 16]];
  R.box(c.u0, c.u1, c.v0, c.v1, c.z0, c.z1, (f, x, y) => {
    if (f !== 'top') return shade(col, 0.95);
    if (x < 0.2 || y < 0.2 || x > c.u1 - 0.2 || y > c.v1 - 0.2) return edge;
    for (const [su, sv] of stand) {
      const dx = x - su, dy = y - sv, d2 = dx * dx + dy * dy;
      if (d2 < 0.09) return d2 < 0.017 ? 0x3a3020 : C.brass;
    }
    if (x > 4.4 && x < 9.4 && y > 3.2 && y < 8.4) return (x < 4.55 || x > 9.25 || y < 3.35 || y > 8.25) ? shade(inner, 0.8) : 0x121214; // CPU-hål
    for (const gv of [3, 7, 11, 15]) if (x > 18.2 && x < 19.3 && y > gv && y < gv + 2.2) return (x < 18.35 || x > 19.15 || y < gv + 0.15 || y > gv + 2.05) ? 0x1a1a1a : 0x0c0c0c;
    const p = G.psu;
    if (x > p.u0 + 1 && x < p.u1 - 1 && y > p.v0 + 0.6 && y < p.v1 - 0.6 && honeycomb(x, y, 0.45) === false) return shade(inner, 0.45);
    if (x > 16.8 && x < 24.7 && y > 18.6 && y < 23 && (((y - 18.6) * 2.2) | 0) % 2 === 0 && (x < 17.1 || x > 24.4)) return C.steelDark;
    if (x > 20.5 && x < 23.8 && y > 1 && y < 17 && perforated(x, y, 0.3, 0.07)) return shade(inner, 0.55);
    return brushed(inner, x, y, 'x');
  }, id);
  // tak med nätventiler
  R.box(c.u0, c.u1, c.v0, c.v0 + 0.5, c.z1, c.wall, (f, x, y, W, H) => {
    if (f === 'top') return edge;
    if (f === 'left' && x > 3.5 && x < 22.5 && y > 0.5 && y < H - 0.6) return honeycomb(x, y, 0.42) ? shade(col, 0.9) : shade(inner, 0.35);
    return col;
  }, id);
  // bakpanel: I/O, fläktgaller, expansionsluckor, nätaggsöppning
  R.box(c.u0, c.u0 + 0.5, c.v0 + 0.5, c.v1, c.z1, c.wall, (f, x, y) => {
    if (f === 'top') return edge;
    if (f !== 'right') return col;
    const v = x + 0.5, z = c.wall - y;
    if (v > 1.6 && v < 7.1 && z > 0.8 && z < 2.6) return 0x0d0d0e;
    if (v > 7.6 && v < 12.4 && z > 0.8 && z < 4.8) return honeycomb(v, y, 0.4) ? shade(col, 0.9) : 0x121214;
    if (v > 12.1 && v < 17.4 && z > 1.2 && z < 4.8) {
      const slot = ((v - 12.1) / 0.75) | 0, fx = (v - 12.1) - slot * 0.75;
      if (fx < 0.08) return shade(col, 0.6);
      if (z > 4.35 && (fx - 0.37) * (fx - 0.37) + (z - 4.58) * (z - 4.58) < 0.0144) return C.steelDark;
      return (fx > 0.25 && fx < 0.5 && z < 4.2 && ((z * 3) | 0) % 2) ? shade(col, 0.75) : shade(col, 1.05);
    }
    if (v > 18.3 && v < 23.3 && z > 0.6 && z < 3.6) return 0x0d0d0e;
    return col;
  }, id);
  const glass = L.front === 'glass';
  R.box(c.u1 - 0.5, c.u1, c.v0 + 0.5, c.v1, c.z1, glass ? c.wall : c.z1 + 0.9, (f, x, y) => {
    if (glass) return f === 'top' ? edge : ((x + y * 0.6) % 3 < 0.35 ? 0xffffff : 0xbfd6e0);
    return f === 'top' ? edge : col;
  }, id, glass ? { alpha: 0.22 } : {});
  R.box(c.u0 + 0.5, c.u1 - 0.5, c.v1 - 0.5, c.v1, c.z1, c.z1 + 0.9, (f) => f === 'top' ? edge : col, id);
  // nätaggskåpa med kabelhål
  R.box(c.u0 + 0.5, c.u1 - 0.5, 17.7, 18.1, c.z1, c.z1 + 1.1, (f, x) => {
    if ((x > 9 && x < 11) || (x > 14.5 && x < 16)) return -1;
    return f === 'top' ? edge : shade(col, 1.05);
  }, id);
  // hårddiskbur
  const b = G.bay, bid = o.ids?.bay || id;
  R.box(b.u0, b.u1, b.v0 + 0.2, b.v1 - 0.2, c.z1, c.z1 + 0.04, (f, x, y, W, H) => {
    const e = x < 0.25 || y < 0.25 || x > W - 0.25 || y > H - 0.25;
    return e ? C.steelDark : (((x * 2) | 0) % 3 === 0 ? shade(inner, 0.75) : shade(inner, 0.92));
  }, bid);
  R.box(b.u0 - 0.2, b.u0, b.v0 + 0.2, b.v1 - 0.2, c.z1, c.z1 + 1.6, (f, x, y) => (y * 3 | 0) % 2 ? C.steel : C.steelDark, bid);
  psuPlaceholder(R, o, G, id);
}

function psuPlaceholder(R, o, G, id) {
  const p = G.psu, pid = o.ids?.psu || id;
  if (o.placed?.psu) return;
  R.box(p.u0, p.u1, p.v0, p.v1, CASE.z1, CASE.z1 + 0.03, (f, x, y, W, H) => {
    const e = x < 0.2 || y < 0.2 || x > W - 0.2 || y > H - 0.2;
    return e ? ((Math.floor((x + y) * 2) % 2) ? 0xe0a02a : 0x222222) : -1;
  }, pid);
}

function caseClassic(R, part, o, G) {
  const c = CASE, { col, inner, light, edge } = caseColors(part);
  const id = o.ids?.case || 0, cage = G.cage, psu = G.psu;
  const stand = [...G.mbScrews, [8.8, 6.85], [8.8, 13.5], [8.8, 22.8]];
  const at = !!o.at6 || part.forms?.some((f) => ['XT', 'AT', 'BabyAT'].includes(f));
  // golvplåt: distanser, enhetsburens golv, luftintag nertill fram
  R.box(c.u0, c.u1, c.v0, c.v1, c.z0, c.z1, (f, x, y) => {
    if (f !== 'top') return shade(col, 0.95);
    if (x < 0.2 || y < 0.2 || x > c.u1 - 0.2 || y > c.v1 - 0.2) return edge;
    for (const [su, sv] of stand) {
      const dx = x - su, dy = y - sv, d2 = dx * dx + dy * dy;
      if (d2 < 0.09) return d2 < 0.017 ? 0x3a3020 : C.brass;
      if (d2 < 0.14) return shade(inner, 0.8);
    }
    if (x > cage.u0 && x < cage.u1 && y > cage.v0 && y < cage.v1) {
      if (((y - cage.v0) % 2.05) < 0.1) return C.steelDark;
      if (x < cage.u0 + 0.12) return C.steelDark;
      return perforated(x, y, 0.5, 0.08) ? shade(inner, 0.55) : brushed(shade(inner, 0.94), x, y, 'x');
    }
    if (x > psu.u0 && x < psu.u1 && y > psu.v0 && y < psu.v1) return brushed(shade(inner, 0.88), x, y, 'x');
    if (x > 18 && x < 25 && y > 15 && y < 23.2 && perforated(x, y, 0.36, 0.1)) return shade(inner, 0.5);
    if (x > 0.3 && x < 1.3 && y > 6.2 && y < 23.4 && ((y * 2) | 0) % 4 === 0) return shade(inner, 0.7);   // präglade veck
    return brushed(inner, x, y, 'x');
  }, id);
  // tak
  R.box(c.u0, c.u1, c.v0, c.v0 + 0.5, c.z1, c.wall, (f, x, y) => {
    if (f === 'top') return edge;
    if (f === 'left' && x > 9 && x < 16 && y > 1.4 && y < 3.6) return ((x * 3) | 0) % 2 ? shade(col, 0.82) : col;   // ventilationsslitsar
    return col;
  }, id);
  // bakpanel
  const rows = G.rows;
  R.box(c.u0, c.u0 + 0.5, c.v0 + 0.5, c.v1, c.z1, c.wall, (f, x, y) => {
    if (f === 'top') return edge;
    if (f !== 'right') return col;
    const v = x + 0.5, z = c.wall - y;
    if (v > psu.v0 + 0.1 && v < psu.v1 - 0.1 && z > 0.7 && z < 3.5) return 0x0d0d0e;
    if (at) {
      const dx = v - 7.5, dz = z - 1.4;
      if (dx * dx + dz * dz < 0.2) return 0x0d0d0e;
      if ((v > 9.0 && v < 12.2 && z > 2.0 && z < 2.8) || (v > 9.4 && v < 11.8 && z > 3.3 && z < 3.9)) {
        const e = v < 9.1 || v > 12.1 || z < 2.1 || z > 2.7;
        return (z > 3.3 ? (v < 9.5 || v > 11.7 || z < 3.4 || z > 3.8) : e) ? shade(col, 0.72) : shade(col, 0.95);
      }
    } else if (v > 7.3 && v < 12.9 && z > 0.8 && z < 2.6) return 0x0d0d0e;
    for (const rv of rows) {
      if (v > rv - 0.42 && v < rv + 0.42 && z > 1.1 && z < 4.8) {
        const fx = v - (rv - 0.42);
        if (fx < 0.06 || fx > 0.78) return shade(col, 0.62);
        if (z > 4.35 && (fx - 0.42) * (fx - 0.42) + (z - 4.58) * (z - 4.58) < 0.0144) return C.steelDark;
        return (fx > 0.3 && fx < 0.54 && z < 4.2 && ((z * 3) | 0) % 2) ? shade(col, 0.76) : shade(col, 1.04);
      }
    }
    return col;
  }, id);
  // front- och bottenkant
  R.box(c.u1 - 0.5, c.u1, c.v0 + 0.5, c.v1, c.z1, c.z1 + 0.9, (f) => f === 'top' ? edge : col, id);
  R.box(c.u0 + 0.5, c.u1 - 0.5, c.v1 - 0.5, c.v1, c.z1, c.z1 + 0.9, (f) => f === 'top' ? edge : col, id);
  // enhetsbur: låga skenor med skruvhål
  const rail = (v0, v1) => R.box(cage.u0, cage.u1 - 0.3, v0, v1, c.z1, c.z1 + 1.1, (f, x, y) => {
    if (f === 'top') return C.steel;
    return ((x * 1.6) % 1 < 0.14 && y > 0.35 && y < 0.7) ? 0x2a2a2c : ((y * 6) | 0) % 5 === 0 ? C.steelDark : C.zinc;
  }, id);
  rail(cage.v0, cage.v0 + 0.18); rail(7.05, 7.2); rail(cage.v1 - 0.18, cage.v1);
  R.box(cage.u0, cage.u0 + 0.15, cage.v0, cage.v1, c.z1, c.z1 + 1.1, (f, x, y) => (y * 4 | 0) % 2 ? C.steel : C.steelDark, id);
  // högtalare (PC-speaker) nere i fronten
  R.box(22.3, 24.0, 22.2, 23.4, c.z1, c.z1 + 0.35, (f, x, y) => {
    if (f !== 'top') return 0x2a2a2a;
    const dx = x - 0.85, dy = y - 0.6, d2 = dx * dx + dy * dy;
    return d2 < 0.3 ? (((d2 * 40) | 0) % 2 ? 0x3a3a3a : 0x1e1e1e) : 0x2a2a2a;
  }, id);
  psuPlaceholder(R, o, G, id);
}

// ---------- Moderkort ----------
const BOARD_INFO = new WeakMap();
function boardInfo(part, rig) {
  if (rig) return { G: rig.geo, P: rig.PORTS, rows: rig.geo.rowsInfo };
  let info = BOARD_INFO.get(part);
  if (!info) {
    const kind = kindOf(part);
    info = { G: geometry(kind, part), P: boardPorts(kind, part), rows: cardRows(kind, part, []) };
    BOARD_INFO.set(part, info);
  }
  return info;
}

export function drawBoard(R, part, o, rig) {
  const info = boardInfo(part, rig);
  if (info.G.kind === 'classic') boardClassic(R, part, o, info);
  else boardModern(R, part, o, info);
}

// Stiftlister och kontakter på kortet
export function portTex(type, acc) {
  switch (type) {
    case 'atx24': case 'eps8': case 'pcie6':
      return (f, x, y) => f === 'top' ? ((((x * 3.3) | 0) + ((y * 3) | 0)) % 2 ? 0x3a3a3a : 0x0d0d0d) : (y < 0.15 ? 0x2a2a2a : 0x161616);
    case 'atx20': case 'atx12v4':
      return (f, x, y) => f === 'top' ? ((((x * 3.3) | 0) + ((y * 3) | 0)) % 2 ? 0x8a8a84 : 0xe8e8e2) : (y < 0.15 ? 0xf4f4ef : 0xd6d6cf);
    case 'at6':
      return (f, x, y, W, H) => {
        if (f !== 'top') return y < 0.12 ? 0xf2f2ee : 0xd8d8d0;
        if (x < 0.08 || x > W - 0.08) return 0xe8e8e2;
        const p = (y % 0.35) / 0.35;
        return p > 0.2 && p < 0.8 && x > 0.2 && x < W - 0.2 ? C.tin : 0xf2f2ee;
      };
    case 'fan4': case 'fan3':
      return (f, x, y, W, H) => f === 'top' ? ((((W > H ? x : y) * 6.5) | 0) % 2 === 0 ? C.gold : 0xf2f2ee) : 0xe2e2dd;
    case 'argb':
      return (f, x, y, W, H) => {
        const a = W > H ? x : y, n = (a * 6.6) | 0;
        return f === 'top' ? (n % 2 === 0 && n !== 2 ? C.gold : 0xf2f2ee) : 0xe2e2dd;
      };
    case 'fpanel': case 'fpanel_at': case 'usb2':
      return (f, x, y) => f === 'top' ? ((((x * 7) | 0) % 2 === 0 && ((y * 6.6) | 0) % 2 === 0) ? C.gold : 0x121212) : 0x121212;
    case 'usb3':
      return (f, x, y, W, H) => f === 'top' ? ((x > 0.18 && x < W - 0.18 && y > 0.15 && y < H - 0.15) ? 0x0e1a33 : 0x2d63c8) : 0x2d63c8;
    case 'audio':
      return (f, x, y, W, H) => f === 'top' ? ((x > 0.12 && x < W - 0.12 && y > 0.12 && y < H - 0.12) ? ((((x * 7) | 0) % 2 === 0) ? C.gold : 0x0a0a0a) : 0x1c1c1c) : 0x1c1c1c;
    case 'satad':
      return (f, x, y, W, H) => f === 'top' ? ((y > 0.15 && y < H - 0.15 && x > 0.2) ? 0x050505 : 0x2a2a2a) : (x > W - 0.2 ? 0x050505 : 0x262626);
    case 'ide': case 'floppy':
      // lådhylsa med styrhack och två rader stift
      return (f, x, y, W, H) => {
        if (f !== 'top') return (W > H ? x : y) > (W > H ? W : H) / 2 - 0.15 && (W > H ? x : y) < (W > H ? W : H) / 2 + 0.15 && y < 0.2 ? 0x080808 : 0x2a2a2a;
        const across = W > H ? y : x, along = W > H ? x : y, wd = W > H ? H : W;
        if (across < 0.07 || across > wd - 0.07) return 0x303030;
        if (across > 0.12 && across < wd - 0.12) {
          const p = (along % 0.14) / 0.14, q = across < wd / 2 ? across - 0.12 : across - wd / 2;
          return p > 0.3 && p < 0.7 && q > 0.04 && q < 0.14 ? C.gold : 0x0c0c0c;
        }
        return 0x1d1d1d;
      };
  }
  return () => acc;
}

// Kortplatser (slots)
const ROW_COL = { isa8: 0x1b1b1b, isa16: 0x1b1b1b, vlb: 0x1b1b1b, pci: 0xefeee6, agp: 0x6e4a26, pcie: 0x1d1d1d, pcie1: 0x1d1d1d };
function drawRows(R, rows, kind, zt, idOf, tier) {
  const span = ROW_SPAN[kind], half = kind === 'modern' ? 0.3 : 0.22;
  for (const r of rows) {
    const [u0, u1] = span[r.type], v0 = r.v - half, v1 = r.v + half, id = idOf(r);
    const body = ROW_COL[r.type], light = r.type === 'pci';
    const isaEnd = r.type === 'vlb' ? 10.4 : u1;
    const notch = r.type === 'isa16' || r.type === 'vlb' ? u0 + (isaEnd - u0) * 0.64 : r.type === 'pci' ? u0 + (u1 - u0) * 0.8 : r.type === 'agp' ? u0 + (u1 - u0) * 0.35 : r.type === 'pcie' ? u0 + 0.9 : -9;
    const armor = r.type === 'pcie' && tier >= 3;
    R.box(u0, isaEnd, v0, v1, zt, zt + 0.35, (f, x, y, W, H) => {
      const u = u0 + x;
      if (f === 'top') {
        if (Math.abs(u - notch) < 0.07) return shade(body, light ? 0.8 : 1.6);
        if (r.type === 'pcie' && x > W - 0.35) return 0xf0f0ee;                       // spärr
        if (armor && (y < 0.1 || y > H - 0.1)) return 0xd6dade;
        if (y > H / 2 - 0.07 && y < H / 2 + 0.07) {
          const p = (x % 0.1) / 0.1;
          return p < 0.45 ? (light ? 0x6a6a64 : 0x050505) : (light ? 0x9a9a92 : C.goldDark);
        }
        return y < 0.05 ? shade(body, light ? 1 : 1.5) : body;
      }
      return armor ? 0xaeb2b7 : shade(body, f === 'left' ? 0.95 : 0.85);
    }, id);
    if (r.type === 'vlb') {
      // VESA Local Bus: brun förlängning i linje med ISA-sloten
      R.box(10.6, u1, v0 + 0.02, v1 - 0.02, zt, zt + 0.35, (f, x, y, W, H) => {
        if (f === 'top' && y > H / 2 - 0.05 && y < H / 2 + 0.05) return ((x % 0.07) / 0.07) < 0.45 ? 0x1a0e04 : C.goldDark;
        return f === 'top' ? 0x7a4e22 : 0x5a3818;
      }, id);
    }
  }
}

// CPU-sockel efter typ
function drawSocket(R, mb, o, G, zt, id) {
  const s = G.socket, sk = mb.socket || '', cu = (s.u0 + s.u1) / 2, cv = (s.v0 + s.v1) / 2;
  if (sk === 'DIP40') {
    R.box(cu - 0.5, cu + 0.5, cv - 1.5, cv + 1.5, zt, zt + 0.16, (f, x, y, W, H) => {
      if (f !== 'top') return 0xc9c0a2;
      const row = (x > 0.07 && x < 0.23) || (x > W - 0.23 && x < W - 0.07);
      if (row) { const p = (y % 0.15) / 0.15; return p > 0.25 && p < 0.7 ? 0x2a2622 : 0xddd4b6; }
      if (y < 0.16 && Math.abs(x - W / 2) < 0.12) return 0x8a826c;                     // skåra (stift 1)
      return x > 0.3 && x < W - 0.3 ? ((((y * 6) | 0) % 2) ? 0xbdb495 : 0xb4ab8b) : 0xd9d0b2;
    }, id);
    return;
  }
  if (sk === 'S286') {
    R.box(cu - 0.95, cu + 0.95, cv - 0.95, cv + 0.95, zt, zt + 0.3, (f, x, y, W, H) => {
      if (f !== 'top') return 0x1e1e1e;
      if (x > 0.25 && y > 0.25 && x < W - 0.25 && y < H - 0.25) {
        const e = x < 0.4 || y < 0.4 || x > W - 0.4 || y > H - 0.4;
        return e ? (((x + y) * 7 | 0) % 2 ? C.tin : 0x0a0a0a) : 0x151515;
      }
      return x < 0.25 && y < 0.25 ? 0x0a0a0a : 0x2a2a2a;
    }, id);
    return;
  }
  if (sk === 'Slot1' || sk === 'SlotA') {
    R.box(cu - 0.3, cu + 0.3, 7.3, 12.1, zt, zt + 0.45, (f, x, y, W, H) => {
      if (f !== 'top') return 0x1b1b1b;
      if (x > 0.22 && x < W - 0.22 && y > 0.1 && y < H - 0.1) return ((y % 0.08) / 0.08) < 0.4 ? C.goldDark : 0x050505;
      return Math.abs(y - H * 0.4) < 0.06 ? 0x3a3a3a : 0x1b1b1b;
    }, id);
    for (const pv of [7.0, 12.1]) R.box(cu - 0.45, cu + 0.45, pv, pv + 0.3, zt, zt + 2.6, (f, x, y) => f === 'top' ? 0x2a2a2a : (y < 0.2 ? 0x3a3a3a : 0x1a1a1a), id);
    return;
  }
  const lga = sk.startsWith('LGA') && sk !== 'LGA775' ? true : sk === 'LGA775' || sk === 'AM5';
  if (lga) {
    R.box(s.u0, s.u1, s.v0, s.v1, zt, zt + 0.15, (f, x, y, W, H) => {
      if (f !== 'top') return 0x7d828a;
      const e = 0.3;
      if (x < e || y < e || x > W - e || y > H - e) return (((x + y) * 4 | 0) % 7 === 0 ? 0xdadde1 : C.steel);
      if (sk === 'AM5' && (x < 0.55 || x > W - 0.55) && y > 1 && y < H - 1) return 0x5b6068;
      return ((x * 6 | 0) + (y * 6 | 0)) % 2 ? 0xc79a3a : 0x2c2e33;
    }, id);
    return;
  }
  // PGA-sockel (ZIF för 486 och senare, utan spak för 386)
  const black = ['AM3', 'AM3plus', 'FM1', 'FM2'].includes(sk);
  const beige = sk === 'AM4' || sk === 'S386';
  const base = black ? 0x1f1f1f : beige ? 0xe0d8c3 : 0xf2f0e8;
  const hole = black ? 0x5a5a5a : 0x3a3630;
  const size = sk === 'S386' ? 2.3 : sk === 'Socket8' ? 3.2 : 3.0;
  const lbl = TB({ S486: 'SOCKET 3', Socket4: 'SOCKET 4', Socket5: 'SOCKET 5', Socket7: 'SOCKET 7', Socket8: 'SOCKET 8', Socket370: 'SOCKET 370', SocketA: 'SOCKET A', Socket423: '423', Socket478: 'MPGA478', Socket754: '754', Socket939: '939', AM2: 'AM2', AM3: 'AM3', AM3plus: 'AM3+', FM1: 'FM1', FM2: 'FM2', AM4: 'AM4' }[sk] || '');
  const zif = sk !== 'S386';
  R.box(cu - size / 2, cu + size / 2, cv - size / 2, cv + size / 2, zt, zt + (zif ? 0.28 : 0.18), (f, x, y, W, H) => {
    if (f !== 'top') return shade(base, 0.86);
    if (zif && x > W - 0.42) return ((y * 5) | 0) % 2 ? shade(base, 0.92) : base;           // kamdel mot spaken
    if (x < 0.14 || y < 0.14 || y > H - 0.14) return shade(base, 1.05);
    const cx = x > W / 2 - 0.45 && x < W / 2 + 0.45 && y > H / 2 - 0.45 && y < H / 2 + 0.45;
    if (cx && !beige && sk !== 'AM4') { if (lbl.on(((x - W / 2 + 0.42) / 0.05) | 0, ((y - H / 2 + 0.12) / 0.05) | 0)) return 0x3a3a3a; return base; }
    return ((x * 7.2 | 0) + (y * 7.2 | 0)) % 2 === 0 && ((x * 7.2) % 1) > 0.3 ? hole : base;
  }, id);
  if (zif) {
    const lv = G.lever;
    if (o.leverClosed) R.box(lv.u0, lv.u1, s.v0, s.v1, zt + 0.1, zt + 0.28, (f, x, y) => y < 0.35 ? 0x9aa0a6 : C.steel, id);
    else R.box(lv.u0, lv.u1, s.v0 - 0.1, s.v0 + 0.15, zt + 0.1, zt + 3.2, (f, x, y) => y < 0.3 ? 0x9aa0a6 : C.steel, id);
  }
}

// Minnessocklar efter typ
function drawRamSockets(R, mb, G, zt, id, acc) {
  const t = mb.ram;
  if (t === 'DIP') {
    for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) {
      const u0 = 8.0 + i * 0.46, v0 = 7.2 + r * 1.42;
      R.box(u0, u0 + 0.36, v0, v0 + 1.12, zt, zt + 0.1, (f, x, y, W, H) => {
        if (f !== 'top') return 0xc9c0a2;
        const row = (x > 0.04 && x < 0.1) || (x > W - 0.1 && x < W - 0.04);
        if (row) { const p = (y % 0.14) / 0.14; return p > 0.3 && p < 0.7 ? 0x2a2622 : 0xddd4b6; }
        if (y < 0.1 && Math.abs(x - W / 2) < 0.06) return 0x8a826c;
        return 0xcfc6a8;
      }, id);
    }
    return;
  }
  const simm = t === 'SIMM30' || t === 'SIMM72';
  const [v0, v1] = t === 'SIMM30' ? [G.ramV[0] + 0.5, G.ramV[1] - 0.5] : G.ramV;
  const n = t === 'SIMM30' && G.kind === 'classic' ? 8 : 4;
  const pitch = n === 8 ? 0.36 : G.ramU[1] - G.ramU[0];
  const dimmCol = { SDR: 0x1c1c1c, DDR: 0x1c1c1c, DDR2: [0xe8c030, 0x7a3fb0], DDR3: [0x2c6fb7, 0x1c1c1c] }[t];
  for (let i = 0; i < n; i++) {
    const su = G.ramU[0] + i * pitch, w = n === 8 ? 0.28 : 0.45;
    const col = simm ? 0xf2f0e8 : Array.isArray(dimmCol) ? dimmCol[i % 2] : dimmCol ?? (i % 2 ? 0x2a2a2a : shade(acc, 0.55));
    R.box(su, su + w, v0, v1, zt, zt + 0.3, (f, x, y, W, H) => {
      if (f === 'top') {
        if (simm && (y < 0.25 || y > H - 0.25)) return x < W / 2 ? C.tin : 0xd8dce0;          // metallklämmor
        if (!simm && (y < 0.3 || y > H - 0.3)) return 0xf0f0ee;                              // spärrar
        if (x > W * 0.3 && x < W * 0.62) return ((y % 0.12) / 0.12) < 0.4 ? C.goldDark : 0x050505;
      }
      return f === 'top' ? col : shade(col, 0.85);
    }, id);
  }
}

// ---------- Komponenter på gamla kort ----------
function dipBox(R, u0, v0, pins, zt, id, text, sock = false, body = C.epoxy) {
  const L = pins / 2 * 0.14, bmA = TB(text, 10);
  const z = zt + (sock ? 0.07 : 0);
  if (sock) R.box(u0 - 0.05, u0 + L + 0.05, v0 - 0.05, v0 + 0.47, zt, zt + 0.07, (f, x, y, W, H) => f === 'top' ? ((y < 0.1 || y > H - 0.1) && ((x % 0.14) / 0.14) < 0.5 ? 0x8a826c : 0xcfc6a8) : 0xbdb495, id);
  R.box(u0, u0 + L, v0, v0 + 0.42, z, z + 0.03, (f, x, y, W, H) => (y < 0.07 || y > H - 0.07) && ((x % 0.14) / 0.14) > 0.3 && ((x % 0.14) / 0.14) < 0.7 ? C.tin : -1, id, { noEdges: true });
  R.box(u0, u0 + L, v0 + 0.07, v0 + 0.35, z, z + 0.13, (f, x, y, W, H) => f === 'top' ? icTop(x, y, W, H, bmA, null, 0.045, body) : shade(body, 1.2), id);
}

function classicParts(mb, G, P, rows) {
  const y = mb.year || 1990, seed = [...String(mb.id || mb.name || '')].reduce((a, c) => a + c.charCodeAt(0), 0);
  const H = (n) => hash(seed + n * 7, n * 13 + 5);
  const bd = G.board, at = !!P.P8, sk = mb.socket;
  const keep = [];
  const K = (u0, u1, v0, v1) => keep.push({ u0, u1, v0, v1 });
  for (const p of Object.values(P)) if (p.box) K(p.box[0], p.box[1], p.box[2], p.box[3]);
  for (const [u, v] of G.mbScrews) K(u - 0.45, u + 0.45, v - 0.45, v + 0.45);
  K(G.socket.u0 - 0.2, G.socket.u1 + 0.45, G.socket.v0 - 0.2, G.socket.v1 + 0.15);
  K(G.ramU[0] - 0.15, mb.ram === 'DIP' ? 12.3 : G.ramU[3] + 0.6, G.ramV[0] - 0.1, G.ramV[1] + 0.1);
  for (const r of rows) { const [a, b] = ROW_SPAN.classic[r.type]; K(a - 0.2, b + 0.2, r.v - 0.35, r.v + 0.35); }
  if (at) { K(1.5, 2.8, 6.6, 8.1); K(3.7, 5.1, 11.35, 12.15); } else K(G.io.u0 - 0.1, G.io.u1 + 0.1, G.io.v0 - 0.1, G.io.v1 + 0.1);
  K(5.1, 8.1, 22.45, 23.35);   // kortets namn
  const rowEnd = rows.reduce((m, r) => Math.max(m, ROW_SPAN.classic[r.type][1]), 3);
  const zones = [
    { u0: rowEnd + 0.4, u1: bd.u1 - 0.25, v0: 13.9, v1: 22.5 },
    { u0: 13.95, u1: bd.u1 - 0.25, v0: 6.6, v1: 13.9 },
    { u0: 11.0, u1: 13.95, v0: 6.6, v1: 13.9 },
    { u0: 2.9, u1: 8.0, v0: 12.2, v1: 13.85 },
  ];
  const items = [];
  const it = (kind, du, dv, extra = {}) => items.push({ kind, du, dv, ...extra });
  const chipName = (list) => list[Math.floor(H(3) * list.length)];
  // chipset
  if (y >= 1999) { it('nb', 1.5, 1.5, { fan: y >= 2002 && mb.tier >= 3 }); it('qfp', 0.95, 0.95, { text: chipName(['VIA', 'SIS', 'INTEL', 'NVIDIA', 'ALI']) }); }
  else if (y >= 1995) { it('qfp', 1.15, 1.15, { text: chipName(['INTEL 82439', 'SIS 5571', 'VIA VT82C', 'ALI M1541']) }); it('plcc', 1.0, 1.0, { text: chipName(['INTEL PIIX', 'SIS 5513', 'VIA 586B']) }); }
  else if (y >= 1987) { it('plcc', 1.05, 1.05, { text: chipName(['C&T 82C206', 'OPTI 82C495', 'SIS 85C471', 'UMC 82C491', 'CHIPS 82C301']) }); it('plcc', 0.9, 0.9, { text: chipName(['OPTI 82C206', 'SIS 85C407', 'C&T 82C212']) }); }
  // BIOS
  const bios = chipName(['AMI BIOS', 'AWARD', 'PHOENIX', 'AMI']);
  if (y >= 1996) it('bios32', 0.62, 0.7, { text: bios });
  else for (let i = 0; i < (y < 1990 ? 2 : 1); i++) it('dip', 28 / 2 * 0.14, 0.42, { pins: 28, text: bios, sock: true, sticker: true });
  // batteri
  if (y >= 1995) it('coin', 0.95, 0.95);
  else if (y >= 1990 && H(4) > 0.35) it('dallas', 1.05, 0.62);
  else if (y >= 1984) it('barrel', 1.45, 0.52);
  // tangentbordskontroller
  if (at && y <= 1996) it('dip', 40 / 2 * 0.14, 0.42, { pins: 40, text: chipName(['AMI KB-BIOS', 'INTEL 8042', 'VIA KBC']), sock: true });
  // kristaller
  it('xtal', 0.55, 0.55, { text: '14.318' });
  if (y < 1996) it('xtal', 0.55, 0.55, { text: y < 1990 ? '24.000' : '66.000' });
  // cacheminne
  if (y >= 1989 && y <= 1997 && ['S386', 'S486', 'Socket4', 'Socket5', 'Socket7'].includes(sk)) for (let i = 0; i < 8; i++) it('dip', 28 / 2 * 0.14, 0.42, { pins: 28, text: 'UM61512', sock: true });
  // matteprocessorsockel
  if (at && y <= 1992 && ['DIP40', 'S286', 'S386'].includes(sk)) it(sk === 'S386' ? 'pga' : 'dip40s', sk === 'S386' ? 2.1 : 2.8, sk === 'S386' ? 2.1 : 0.62);
  // spänningsregulator (Socket 5/7/Slot 1)
  if (y >= 1994 && y <= 2001) it('vreg', 0.95, 0.95);
  // TTL-logik
  const ttl = at ? Math.max(0, 22 - (y - 1983) * 2) : 0;
  const TTL = ['74LS245', '74LS373', '74F244', '74LS32', '74LS138', '74HCT04', '74ALS573', '74LS74'];
  for (let i = 0; i < ttl; i++) { const pins = H(20 + i) > 0.5 ? 16 : 14; it('dip', pins / 2 * 0.14, 0.42, { pins, text: TTL[i % TTL.length] }); }
  // resistornät + kondensatorer
  for (let i = 0; i < (y < 1997 ? 3 : 0); i++) it('rpack', 1.1, 0.16);
  const caps = y < 1995 ? 4 : y < 2000 ? 8 : 12;
  for (let i = 0; i < caps; i++) it('cap', 0.38, 0.38, { h: 0.45 + H(40 + i) * 0.45, sleeve: y >= 2003 && mb.tier >= 3 ? 0x2a2a2e : [0x1a2a6a, 0x1a1a1a, 0x1f4a2a, 0x6a2a1a][Math.floor(H(60 + i) * 4)] });

  // packa i zonerna
  const placed = [];
  const hit = (b, list) => list.some((k) => b.u0 < k.u1 && b.u1 > k.u0 && b.v0 < k.v1 && b.v1 > k.v0);
  for (const item of items) {
    let done = false;
    for (const z of zones) {
      if (z.u1 - z.u0 < item.du || z.v1 - z.v0 < item.dv) continue;
      for (let v = z.v0; v + item.dv <= z.v1 && !done; v += 0.2)
        for (let u = z.u0; u + item.du <= z.u1 && !done; u += 0.2) {
          const b = { u0: u, u1: u + item.du, v0: v, v1: v + item.dv };
          const pad = { u0: u - 0.1, u1: b.u1 + 0.1, v0: v - 0.1, v1: b.v1 + 0.1 };
          if (!hit(pad, keep) && !hit(pad, placed)) { placed.push({ ...item, ...b }); done = true; }
        }
      if (done) break;
    }
  }
  // spolar vid sockeln (1999–)
  if (y >= 1999) for (let i = 0; i < 3; i++) placed.push({ kind: 'choke', u0: 4.0 + i * 1.05, u1: 4.5 + i * 1.05, v0: 6.95, v1: 7.45 });
  return placed;
}
const CLASSIC_PARTS = new WeakMap();

function drawClassicPart(R, c, zt, id, o) {
  const { u0, u1, v0, v1 } = c;
  switch (c.kind) {
    case 'dip': dipBox(R, u0, v0, c.pins, zt, id, c.text, c.sock); if (c.sticker) R.box(u0 + 0.25, u1 - 0.25, v0 + 0.1, v1 - 0.1, zt + 0.21, zt + 0.215, (f, x, y, W, H) => f === 'top' ? (((x * 9 + y * 4) | 0) % 3 ? 0xd8dce4 : 0xf4e8a8) : -1, id, { noEdges: true }); break;
    case 'dip40s': R.box(u0, u1, v0, v1, zt, zt + 0.14, (f, x, y, W, H) => {
      if (f !== 'top') return 0xc9c0a2;
      const row = (y > 0.06 && y < 0.18) || (y > H - 0.18 && y < H - 0.06);
      if (row) { const p = (x % 0.14) / 0.14; return p > 0.3 && p < 0.7 ? 0x2a2622 : 0xddd4b6; }
      return 0xcfc6a8;
    }, id); break;
    case 'pga': R.box(u0, u1, v0, v1, zt, zt + 0.16, (f, x, y, W, H) => f !== 'top' ? 0xc9c0a2 : ((x * 6 | 0) + (y * 6 | 0)) % 2 === 0 && x > 0.2 && y > 0.2 && x < W - 0.2 && y < H - 0.2 && !(x > 0.7 && x < W - 0.7 && y > 0.7 && y < H - 0.7) ? 0x3a3630 : 0xdcd4bb, id); break;
    case 'plcc': case 'qfp': {
      const bm = TB(c.text, 11), q = c.kind === 'qfp';
      R.box(u0, u1, v0, v1, zt, zt + 0.02, (f, x, y, W, H) => {
        const e = x < 0.08 || y < 0.08 || x > W - 0.08 || y > H - 0.08;
        return e && (((x + y) / 0.06) | 0) % 2 === 0 ? C.tin : -1;
      }, id, { noEdges: true });
      R.box(u0 + 0.08, u1 - 0.08, v0 + 0.08, v1 - 0.08, zt, zt + (q ? 0.1 : 0.2), (f, x, y, W, H) => f === 'top' ? icTop(x, y, W, H, bm, null, 0.05) : (((x + y) * 12 | 0) % 2 ? C.tin : C.epoxy), id);
      break;
    }
    case 'nb': {
      R.box(u0 + 0.15, u1 - 0.15, v0 + 0.15, v1 - 0.15, zt, zt + 0.1, () => C.epoxy, id);
      R.box(u0, u1, v0, v1, zt + 0.1, zt + 0.55, (f, x, y, W, H) => {
        if (f === 'top') return ((x * 8) % 1) < 0.35 ? shade(C.alu, 0.7) : brushed(C.alu, x, y, 'x');
        return ((f === 'left' ? x : y) * 8 % 1) < 0.35 ? shade(C.alu, 0.55) : C.alu;
      }, id);
      if (c.fan) R.box(u0 + 0.1, u1 - 0.1, v0 + 0.1, v1 - 0.1, zt + 0.55, zt + 0.75, (f, x, y, W, H) => {
        if (f !== 'top') return 0x1a1a1a;
        const r = fan(x, y, W / 2, H / 2, W / 2 - 0.08, { spin: o.spin || 0, frame: 0x1a1a1a, blade: 0x2e2e32, hub: 0x3a3a3e, blades: 7 });
        return r < 0 ? 0x1a1a1a : r;
      }, id);
      break;
    }
    case 'bios32': {
      const bm = TB(c.text, 8);
      R.box(u0, u1, v0, v1, zt, zt + 0.12, (f, x, y, W, H) => f === 'top' ? ((x > 0.08 && x < W - 0.08 && y > 0.12 && y < H - 0.12) ? (bm.on(((x - 0.1) / 0.045) | 0, ((y - 0.25) / 0.045) | 0) ? 0x2a3a6a : ((((x + y) * 10) | 0) % 3 ? 0xd8dce4 : 0xf0e0a0)) : 0x1b1b1b) : 0x1b1b1b, id);
      break;
    }
    case 'coin': R.box(u0, u1, v0, v1, zt, zt + 0.14, (f, x, y, W, H) => {
      if (f !== 'top') return 0x1b1b1b;
      const dx = x - W / 2, dy = y - H / 2, d2 = dx * dx + dy * dy;
      if (d2 < 0.16) { if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.025 || Math.abs(dy) < 0.1 && Math.abs(dx) < 0.025) return 0x6a6f76; return dx + dy < 0 ? 0xe4e7ea : C.steel; }
      return d2 < 0.2 ? C.steelDark : 0x1b1b1b;
    }, id); break;
    case 'dallas': { const bm = TB('DALLAS', 8); R.box(u0, u1, v0, v1, zt, zt + 0.45, (f, x, y, W, H) => f === 'top' ? (bm.on(((x - 0.12) / 0.05) | 0, ((y - 0.2) / 0.05) | 0) ? 0xc9c9c4 : 0x161616) : 0x1e1e1e, id); break; }
    case 'barrel': R.box(u0, u1, v0, v1, zt, zt + 0.5, (f, x, y, W, H) => {
      if (f === 'top') return y > H * 0.35 && y < H * 0.55 ? 0x6aa0e0 : (x < 0.12 || x > W - 0.12 ? C.steel : 0x2a5ab0);
      return x < 0.12 || x > W - 0.12 ? C.steelDark : (y < 0.15 ? 0x4a80d0 : 0x1e4a98);
    }, id); break;
    case 'xtal': { const bm = TB(c.text, 7); R.box(u0, u1, v0, v1, zt, zt + 0.3, (f, x, y, W, H) => f === 'top' ? (bm.on(((x - 0.04) / 0.04) | 0, ((y - 0.18) / 0.04) | 0) ? 0x4a4a4a : brushed(C.steel, x, y)) : C.steelDark, id); break; }
    case 'rpack': R.box(u0, u1, v0, v1, zt, zt + 0.32, (f, x, y) => f === 'top' ? 0x1a1a1a : (y < 0.08 ? 0x2a2a2a : (x % 0.2 < 0.03 ? 0xd8b24a : 0x1c1c1c)), id); break;
    case 'cap': R.box(u0, u1, v0, v1, zt, zt + c.h, (f, x, y, W, H) => {
      if (f === 'top') { const t = capTop(x, y, W / 2, H / 2, W / 2, c.sleeve); return t < 0 ? -1 : t; }
      if (x < 0.04 || x > W - 0.04) return -1;
      return x > W * 0.6 && x < W * 0.8 ? shade(c.sleeve, 2.2) : c.sleeve;
    }, id); break;
    case 'vreg':
      R.box(u0, u0 + 0.35, v0, v1, zt, zt + 0.9, (f, x, y) => f === 'top' ? shade(C.alu, 0.8) : ((y * 7) % 1 < 0.3 ? shade(C.alu, 0.6) : C.alu), id);
      R.box(u0 + 0.35, u0 + 0.6, v0 + 0.2, v1 - 0.2, zt, zt + 0.6, (f) => f === 'top' ? C.epoxy : 0x252525, id);
      break;
    case 'choke': R.box(u0, u1, v0, v1, zt, zt + 0.4, (f, x, y, W, H) => {
      if (f !== 'top') return ((x * 20) | 0) % 2 ? C.copper : shade(C.copper, 0.7);
      const dx = x - W / 2, dy = y - H / 2, d2 = dx * dx + dy * dy;
      return d2 < 0.02 ? 0x1a1a1a : d2 < 0.0625 ? ((Math.atan2(dy, dx) * 6 | 0) % 2 ? C.copper : shade(C.copper, 1.25)) : -1;
    }, id); break;
  }
}

function boardPcb(R, part, G, id, extra) {
  const b = G.board, pcb = hex(part.look?.pcb || '#2e6b3c');
  const silk = mix(pcb, 0xffffff, 0.55), old = (part.year || 2000) < 1997;
  const screws = G.mbScrews;
  R.box(b.u0, b.u1, b.v0, b.v1, b.z0, b.z1, (f, x, y, W, H) => {
    if (f !== 'top') return (x * 3 | 0) % 2 ? shade(pcb, 0.8) : shade(pcb, 0.65);
    const u = x + b.u0, v = y + b.v0;
    for (const [su, sv] of screws) {
      const du = u - su, dv = v - sv, d2 = du * du + dv * dv;
      if (d2 < 0.13) return d2 < 0.035 ? 0x1b1b1b : C.tin;
    }
    if (x < 0.1 || y < 0.1 || x > W - 0.1 || y > H - 0.1) return shade(pcb, 0.6);
    const e = extra(u, v, silk, pcb);
    if (e >= 0) return e;
    if (!old) { const sm = smd(u, v, 0.1, 0.34); if (sm >= 0) return sm; }
    const pa = pcbArt(u, v, pcb, old ? 0.7 : 0.9);
    if (pa >= 0) return pa;
    return hash(u * 2 | 0, v * 2 | 0) > 0.8 ? shade(pcb, 1.06) : pcb;
  }, id);
  return { pcb, silk };
}

function boardClassic(R, part, o, info) {
  const { G, P, rows } = info;
  const id = o.ids?.mb || 0, zt = BOARD_Z, acc = hex(part.look?.accent || '#2a2a2a'), y = part.year || 1990;
  const at = !!P.P8;
  const name = TB(modelText(part, 10), 10);
  const s = G.socket;
  boardPcb(R, part, G, id, (u, v, silk) => {
    if ((Math.abs(u - (s.u0 - 0.12)) < 0.035 || Math.abs(u - (s.u1 + 0.05)) < 0.035) && v > s.v0 - 0.12 && v < s.v1 + 0.12) return silk;
    if ((Math.abs(v - (s.v0 - 0.12)) < 0.035 || Math.abs(v - (s.v1 + 0.12)) < 0.035) && u > s.u0 - 0.12 && u < s.u1 + 0.05) return silk;
    if (u > 5.2 && u < 8.0 && v > 22.55 && v < 23.1 && name.on(((u - 5.25) / 0.09) | 0, ((v - 22.6) / 0.09) | 0)) return silk;
    for (const r of rows) if (v > r.v + 0.3 && v < r.v + 0.36 && u > 3 && u < 3.8) return silk;
    return -1;
  });
  let partsList = CLASSIC_PARTS.get(part);
  if (!partsList) { partsList = classicParts(part, G, P, rows); CLASSIC_PARTS.set(part, partsList); }
  for (const c of partsList) drawClassicPart(R, c, zt, id, o);

  // bakre anslutningar
  if (at) {
    // DIN-5 för tangentbordet
    R.box(1.55, 2.7, 6.75, 7.95, zt, zt + 1.05, (f, x, y, W, H) => {
      if (f === 'top') return x < 0.25 ? C.tin : 0x1a1a1a;
      if (f === 'left') { const dx = x - 0.55, dy = y - 0.5, d2 = dx * dx + dy * dy; return d2 < 0.12 ? (d2 < 0.06 ? 0x050505 : C.tin) : 0x1f1f1f; }
      return 0x1a1a1a;
    }, id);
    // jumprar / DIP-switch
    const xt = part.form === 'XT';
    const set = !!o.jumpersSet;
    if (xt) R.box(3.8, 5.0, 11.5, 12.0, zt, zt + 0.22, (f, x, y, W, H) => {
      if (f !== 'top') return 0xc9323a;
      const i = (x / 0.15) | 0, fx = x - i * 0.15;
      if (y > 0.1 && y < H - 0.1 && fx > 0.03 && fx < 0.12) return (set ? i % 3 !== 1 : i % 2 === 0) ? (y < H / 2 ? 0xf2f2ee : 0x7a1a1e) : (y > H / 2 ? 0xf2f2ee : 0x7a1a1e);
      return 0xc9323a;
    }, id);
    else {
      R.box(3.8, 5.0, 11.5, 11.95, zt, zt + 0.25, (f, x, y) => {
        if (f !== 'top') return 0x1a1a1a;
        return ((x % 0.2) / 0.2) > 0.35 && ((x % 0.2) / 0.2) < 0.65 && ((y % 0.225) / 0.225) > 0.3 && ((y % 0.225) / 0.225) < 0.7 ? C.gold : 0x1a1a1a;
      }, id);
      const caps = set ? [0, 2, 4] : [1, 5];
      for (const i of caps) R.box(3.82 + i * 0.2, 3.98 + i * 0.2, 11.48, 11.97, zt + 0.25, zt + 0.48, (f) => f === 'top' ? 0x2c6fb7 : 0x1e4f8a, id);
    }
  } else {
    // ATX I/O-block: PS/2, USB, parallellport, serieport, ljud/spelport
    const io = G.io, audio = part.audio;
    R.box(io.u0, io.u1, io.v0, io.v1, zt, zt + 1.5, (f, x, y, W, H) => {
      if (f === 'top') {
        if (x < 0.1 || x > W - 0.1) return 0x9aa0a6;
        const segs = [[0, 0.55, 0x7a4fb0], [0.55, 1.1, 0x3f9b3a], [1.2, 2.0, 0x1b1b1b], [2.1, 3.95, 0xb0306a], [4.05, 4.85, 0x2a8a8a], [4.95, 5.55, audio ? 0xd8a82a : 0x9aa0a6]];
        for (const [a, b2, c2] of segs) if (y >= a && y < b2) return (y - a < 0.06 || b2 - y < 0.06) ? shade(c2, 0.6) : (((x * 8) | 0) % 3 === 0 ? shade(c2, 0.85) : c2);
        return 0x9aa0a6;
      }
      return ((y * 5) | 0) % 2 ? 0x8a9097 : 0xa3a8ad;
    }, id);
    if (y >= 2001) R.box(io.u0, io.u0 + 0.9, io.v0 + 1.25, io.v0 + 1.95, zt + 1.5, zt + 1.55, (f, x, yy) => f === 'top' ? (yy > 0.2 && yy < 0.5 ? 0x2d63c8 : 0x1b1b1b) : 0x1b1b1b, id);
  }

  // uttag/stiftlister
  for (const p of Object.values(P)) if (p.box) R.box(p.box[0], p.box[1], p.box[2], p.box[3], zt, zt + p.box[4], portTex(p.type, acc), id);
  // kortplatser, minne, sockel
  drawRows(R, rows, 'classic', zt, (r) => (r.card === 'gpu' ? o.ids?.gpu : r.card === 'snd' ? o.ids?.snd : 0) || id, part.tier || 2);
  drawRamSockets(R, part, G, zt, o.ids?.ram || id, acc);
  drawSocket(R, part, o, G, zt, o.ids?.cpu || id);
}

function boardModern(R, part, o, info) {
  const { G, P, rows } = info;
  const b = G.board, L = part.look || {}, acc = hex(L.accent || '#2a2a2a');
  const id = o.ids?.mb || 0, zt = BOARD_Z, tier = part.tier || 2, form = part.form || part.size;
  const ramBm = textBitmap(part.ram || ''), sockBm = textBitmap(part.socket || '');
  const B = (u0, uu1, v0, v1, h, tex, bid = id) => R.box(u0, uu1, v0, v1, zt, zt + h, tex, bid);
  boardPcb(R, part, G, id, (u, v, silk, pcb) => {
    const trace = mix(pcb, 0xd8b24a, 0.3);
    if ((Math.abs(u - 10.05) < 0.04 || Math.abs(u - 12.95) < 0.04) && v > 2.8 && v < 9.8) return silk;
    if (Math.abs(v - 9.8) < 0.04 && u > 10.05 && u < 12.95) return silk;
    if ((Math.abs(u - 4.8) < 0.04 || Math.abs(u - 8.8) < 0.04) && v > 3.6 && v < 7.6) return silk;
    if (u > 10.2 && v > 9.9 && ramBm.on((u - 10.2) / 0.13 | 0, (v - 9.9) / 0.13 | 0)) return silk;
    if (u > 5 && v > 7.62 && sockBm.on((u - 5) / 0.11 | 0, (v - 7.62) / 0.11 | 0)) return silk;
    if (Math.abs(v - 12.9) < 0.04 && u < 4.6 && ((u * 5) | 0) % 2) return silk;
    if (Math.abs(u - 4.6) < 0.04 && v > 12.9 && ((v * 5) | 0) % 2) return silk;
    if (u > 8.6 && u < 10.2 && v > 4.4 && v < 6.8 && ((v * 7) | 0) % 2 === 0) return trace;
    if (u > 9.45 && u < 9.75 && v > 7.4 && v < 14 && ((u * 20) | 0) % 2 === 0) return trace;
    if (u > 3 && u < 9.5 && v > 11 && v < 12.1 && traces(u, v, 0.12, 0.04)) return trace;
    if (u > 10 && u < 13 && v > 13.2 && v < 15.6 && traces(v, u, 0.12, 0.04)) return trace;
    return -1;
  });
  // bakre I/O
  if (tier <= 1) {
    for (const [v0, c] of [[1.8, 0x2c6fb7], [2.8, 0x1b1b1b], [3.8, 0x2a2a2a], [5, C.steel]]) B(1.6, 2.6, v0, v0 + 0.8, 0.9, (f) => f === 'top' ? shade(c, 1.1) : c);
  } else {
    const logo = textBitmap(L.accent === '#c9323a' ? 'ROG' : String(part.name || '').split(' ')[0].slice(0, 4));
    B(1.6, 3.1, 1.6, 7.2, 1.7, (f, x, y) => {
      if (f === 'top') {
        if (part.rgb && x > 1.1 && x < 1.3) return led(o, 'mb', y);
        if (logo.on(((y - 1.2) / 0.12) | 0, ((x - 0.35) / 0.12) | 0)) return 0xeeeeee;
        return ((y * 4) | 0) % 5 === 0 ? shade(acc, 0.7) : acc;
      }
      return f === 'left' ? shade(acc, 0.9) : ((y * 5) | 0) % 2 ? shade(acc, 0.8) : acc;
    });
  }
  // VRM
  for (let i = 0; i < 7; i++) B(4.9 + i * 0.6, 5.35 + i * 0.6, 2.95, 3.45, 0.4, (f) => f === 'top' ? 0x6b7078 : 0x4b4f55);
  for (let i = 0; i < 6; i++) B(3.35, 3.8, 3.3 + i * 0.75, 3.75 + i * 0.75, 0.4, (f) => f === 'top' ? 0x6b7078 : 0x4b4f55);
  if (tier >= 2) {
    const fin = (f, x, y) => f === 'top' ? ((((x + y) * 9) | 0) % 2 ? brushed(acc, x, y) : shade(acc, 0.66)) : (((y * 10) | 0) % 2 ? brushed(acc, x, y, 'y') : shade(acc, 0.78));
    B(4.8, 9.1, 1.95, 2.95, 1.05, fin);
    B(3.25, 4.35, 3.1, 8.1, 1.05, fin);
  }
  for (let i = 0; i < 6; i++) B(5.1 + i * 0.6, 5.4 + i * 0.6, 7.75, 8.05, 0.35, (f, x, y) => f === 'top' ? ((x - 0.15) * (x - 0.15) + (y - 0.15) * (y - 0.15) < 0.0064 ? 0x8a8f96 : 0x202020) : ((y < 0.1) ? C.gold : 0x2a2a2a));
  for (const [cu, cv] of [[2, 13.3], [2.6, 13.3], [3.2, 13.3], [2, 14], [3.8, 13.3]]) B(cu, cu + 0.35, cv, cv + 0.35, 0.4, (f) => f === 'top' ? 0xe0c060 : C.gold);
  B(2.2, 3.8, 14.8, 15.7, 0.15, (f, x, y) => tier >= 3 ? (f === 'top' && x > 0.3 && x < 1.3 && y > 0.3 && y < 0.5 ? acc : C.steel) : 0x151515);
  // chipset
  if (tier >= 2) {
    const cs = textBitmap(String(part.socket || '').startsWith('AM') || String(part.socket || '').startsWith('FM') ? 'AMD' : 'INTEL');
    B(10.8, 13.2, 10.4, 12.3, 0.4, (f, x, y) => {
      if (f === 'top' && cs.on(((x - 0.35) / 0.12) | 0, ((y - 0.7) / 0.12) | 0)) return 0xf2f2f2;
      return f === 'top' ? (((x * 3) | 0) % 5 === 0 ? shade(acc, 0.8) : acc) : shade(acc, 0.85);
    });
  } else {
    B(11.3, 12.7, 10.7, 12, 0.12, (f, x, y) => f === 'top' && x < 0.25 && y < 0.25 ? 0xcccccc : 0x1c1c1c);
  }
  if (form === 'ATX') {
    const m2 = textBitmap('M.2');
    B(14.6, 17.2, 8.9, 13.1, 0.3, (f, x, y) => {
      if (f === 'top' && m2.on(((x - 0.9) / 0.14) | 0, ((y - 1.6) / 0.14) | 0)) return 0xf0f0f0;
      return f === 'top' ? ((((x + y) * 3) | 0) % 6 === 0 ? shade(acc, 1.2) : acc) : shade(acc, 0.8);
    });
    for (let i = 0; i < 4; i++) B(16.3, 17.2, 13.5 + i * 0.8, 14.2 + i * 0.8, 0.4, portTex('satad', acc));
    if (tier >= 5) {
      B(15, 16.6, 2.3, 3.1, 0.12, (f, x, y) => f === 'top' && o.powered && ((x * 5 | 0) % 2) && y > 0.2 && y < 0.6 ? 0xff3030 : 0x0c0c0c);
      B(15.2, 15.9, 3.6, 4.3, 0.25, (f) => f === 'top' ? 0xd8343c : 0x9a2228);
      B(16.2, 16.9, 3.6, 4.3, 0.25, (f) => f === 'top' ? 0x2a2a2a : 0x151515);
    } else {
      B(14.8, 17, 2.3, 7.6, 0.25, (f, x, y) => f === 'top' ? (((y * 4) | 0) % 2 ? shade(acc, 0.9) : acc) : shade(acc, 0.8));
    }
  }
  // BIOS-chip + batteri
  B(11.4, 11.9, 14.95, 15.45, 0.12, () => 0x151515);
  B(6.8, 7.8, 15.6, 16.6, 0.1, (f, x, y) => { const d2 = (x - 0.5) * (x - 0.5) + (y - 0.5) * (y - 0.5); return d2 < 0.25 ? (d2 > 0.176 ? C.steelDark : mix(C.steel, 0xffffff, 0.3)) : -1; });
  for (const p of Object.values(P)) if (p.box) B(p.box[0], p.box[1], p.box[2], p.box[3], p.box[4], portTex(p.type, acc));
  drawSocket(R, part, o, G, zt, o.ids?.cpu || id);
  drawRamSockets(R, part, G, zt, o.ids?.ram || id, acc);
  // M.2-plats
  if ((part.storage || ['NVMe']).includes('NVMe') && G.m2) {
    const m = G.m2, m2Id = o.ids?.m2 || id, silk = mix(hex(L.pcb || '#2e6b3c'), 0xffffff, 0.55);
    R.box(m.u0, m.u1 + 0.5, m.v0, m.v1, zt, zt + 0.02, (f, x, y, W, H) => {
      if (x > W - 0.5) return 0x2a2a2a;
      if ((x - 0.12) * (x - 0.12) + (y - H / 2) * (y - H / 2) < 0.04) return C.brass;
      return (x < 0.06 || y < 0.06 || y > H - 0.06) ? silk : shade(hex(L.pcb || '#2e6b3c'), 1.12);
    }, m2Id);
    R.box(m.u1, m.u1 + 0.5, m.v0 + 0.1, m.v1 - 0.1, zt, zt + 0.25, (f, x) => f === 'top' && x < 0.15 ? C.gold : 0x2a2a2a, m2Id);
  }
  drawRows(R, rows, 'modern', zt, (r) => (r.card === 'gpu' ? o.ids?.gpu : r.card === 'snd' ? o.ids?.snd : 0) || id, tier);
}

// ---------- Kontrollerkort (MFM/IDE/diskett på ISA) ----------
export function drawCtrlCard(R, v, id, ports = []) {
  const z0 = BOARD_Z + 0.08, z1 = 3.3, u0 = 1.0, u1 = 9.0;
  const bm = TB('WD1003', 8);
  R.box(u0, u1, v - 0.07, v + 0.07, z0, z1, (f, x, y, W, H) => {
    if (f === 'top') return 0x1f5a2c;
    if (y > H - 0.28 && x > 1.4 && x < W - 0.4) return (((x * 10) | 0) % 2) ? C.gold : 0x1f5a2c;               // kontaktfingrar
    for (let i = 0; i < 5; i++) {
      const cx = 1.4 + i * 1.25;
      if (x > cx && x < cx + 0.95 && y > 0.9 && y < 1.3) return bm.on(((x - cx - 0.08) / 0.04) | 0, ((y - 1.0) / 0.04) | 0) ? 0xc9c9c4 : C.epoxy;
      if (x > cx && x < cx + 0.7 && y > 1.6 && y < 1.9) return C.epoxy;
    }
    if (x > 5.8 && x < 6.3 && y > 0.4 && y < 0.7) return C.steel;
    return pcbArt(x, y, 0x2e6b3c, 0.6) >= 0 ? pcbArt(x, y, 0x2e6b3c, 0.6) : 0x2e6b3c;
  }, id);
  R.box(0.55, 1.0, v - 0.12, v + 0.12, z0 + 0.1, 4.3, (f, x, y) => f === 'top' ? C.steel : (y < 0.2 ? 0xdfe3e7 : brushed(C.steel, x, y)), id);
  R.box(0.55, 1.35, v - 0.12, v + 0.12, 4.18, 4.3, (f) => f === 'top' ? C.steel : C.steelDark, id);
  for (const [pu] of ports) R.box(pu - 0.55, pu + 0.55, v - 0.16, v + 0.16, z1, z1 + 0.18, portTex('ide', 0), id);
}

// Lös Molex-kontakt på nätaggets kabel
export function drawMolexPlug(R, [u, v, z], id) {
  R.box(u - 0.5, u + 0.5, v - 0.28, v + 0.28, z, z + 0.42, (f, x, y, W, H) => {
    if (f === 'top') return (x < 0.12 && y < 0.12) || (x > W - 0.12 && y < 0.12) ? -1 : 0xefefea;
    if (f === 'left') return ((x / (W / 4)) | 0) % 2 === 0 && y > 0.12 && y < 0.3 ? C.brass : 0xdcdcd4;
    return 0xd4d4cc;
  }, id);
  [0xe0b020, 0x18181a, 0x18181a, 0xc8282a].forEach((c, i) => R.box(u - 0.4 + i * 0.22, u - 0.28 + i * 0.22, v - 0.9, v - 0.28, z + 0.12, z + 0.24, () => c, id));
}
