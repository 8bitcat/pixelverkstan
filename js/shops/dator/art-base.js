// Pixelgrafik: arbetsbänk, öppet chassi (med inbyggda fläktar) och moderkort
// med sockel, slots, uttag och skruvhål.
import { hex, shade, mix } from '../../core/raster.js';
import { textBitmap } from '../../core/pixfont.js';
import { G, BOARD_TOP, FAN_SLOTS, PORTS, SCREWS } from './geom.js';
import { C, fan, honeycomb, mesh, hash, isLit, led } from './art-common.js';

const STANDOFFS = [[2.5, 2.5], [2.5, 9], [2.5, 16], [9.5, 2.5], [9.5, 9], [9.5, 16], [13.8, 2.5], [13.8, 9], [13.8, 16]];

export function drawMat(R, id) {
  const m = G.mat;
  R.box(m.u0, m.u1, m.v0, m.v1, -0.4, 0, (f, x, y) => {
    if (f !== 'top') return 0x283039;
    const line = (x % 2) < 0.12 || (y % 2) < 0.12;
    if (line) return 0x4a5664;
    if (x > m.u1 - m.u0 - 3.2 && y < 2 && ((x * 4 | 0) % 2)) return 0x46505e; // linjal i hörnet
    return hash(x * 3 | 0, y * 3 | 0) > 0.93 ? 0x404a57 : 0x39424f;
  }, id);
}

// ---------- Fläktenhet (fram/bak/tak) ----------
export function drawFanUnit(R, slotKey, look, o, id) {
  const s = FAN_SLOTS[slotKey];
  const frame = hex(look.frame || '#1d1d1d'), blade = hex(look.blade || '#2a2a2a');
  const z0 = G.case.z1 + 0.1, z1 = z0 + 4.8;
  const k = slotKey.charCodeAt(slotKey.length - 1);
  R.box(s.u0, s.u1, s.v0, s.v1, z0, z1, (f, x, y, W, H) => {
    if (f !== s.face) {
      // sidoprofil: ram med gummihörn + ev. RGB-list
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

// ---------- Öppet chassi ----------
export function drawCase(R, part, o) {
  const c = G.case, L = part.look, col = hex(L.color), inner = hex(L.inner);
  const id = o.ids.case || 0, light = ((col >> 16) & 255) > 150;
  const edge = shade(col, light ? 0.85 : 1.35);
  // golvplåt: standoffs, CPU-hål, kabelgenomföringar, ventilation under nätagget
  R.box(c.u0, c.u1, c.v0, c.v1, c.z0, c.z1, (f, x, y) => {
    if (f !== 'top') return shade(col, 0.95);
    if (x < 0.2 || y < 0.2 || x > c.u1 - 0.2 || y > c.v1 - 0.2) return edge;
    for (const [su, sv] of STANDOFFS) {
      const d = Math.hypot(x - su, y - sv);
      if (d < 0.3) return d < 0.13 ? 0x3a3020 : C.brass;
    }
    if (x > 4.4 && x < 9.4 && y > 3.2 && y < 8.4) return (x < 4.55 || x > 9.25 || y < 3.35 || y > 8.25) ? shade(inner, 0.8) : 0x121214; // CPU-hål
    for (const gv of [3, 7, 11, 15]) if (x > 18.2 && x < 19.3 && y > gv && y < gv + 2.2) return (x < 18.35 || x > 19.15 || y < gv + 0.15 || y > gv + 2.05) ? 0x1a1a1a : 0x0c0c0c;
    const p = G.psu;
    if (x > p.u0 + 1 && x < p.u1 - 1 && y > p.v0 + 0.6 && y < p.v1 - 0.6 && honeycomb(x, y, 0.45) === false) return shade(inner, 0.45);
    if (x > 16.8 && x < 24.7 && y > 18.6 && y < 23 && (((y - 18.6) * 2.2) | 0) % 2 === 0 && (x < 17.1 || x > 24.4)) return C.steelDark; // skenor
    return hash(x * 2 | 0, y * 2 | 0) > 0.95 ? shade(inner, 1.05) : inner;
  }, id);

  // tak (v = 0): nätventiler
  R.box(c.u0, c.u1, c.v0, c.v0 + 0.5, c.z1, c.wall, (f, x, y, W, H) => {
    if (f === 'top') return edge;
    if (f === 'left' && x > 3.5 && x < 22.5 && y > 0.5 && y < H - 0.6) return honeycomb(x, y, 0.42) ? shade(col, 0.9) : shade(inner, 0.35);
    return col;
  }, id);
  // bakpanel (u = 0): I/O-hål, fläktgaller, expansionsluckor, nätaggsöppning
  R.box(c.u0, c.u0 + 0.5, c.v0 + 0.5, c.v1, c.z1, c.wall, (f, x, y, W, H) => {
    if (f === 'top') return edge;
    if (f !== 'right') return col;
    const v = x + 0.5, z = c.wall - y;
    if (v > 1.6 && v < 7.1 && z > 0.8 && z < 2.6) return 0x0d0d0e;
    if (v > 7.6 && v < 12.4 && z > 0.8 && z < 4.8) return honeycomb(v, y, 0.4) ? shade(col, 0.9) : 0x121214;
    if (v > 12.9 && v < 17.4 && z > 1.2 && z < 4.8) {
      const slot = ((v - 12.9) / 0.64) | 0, fx = (v - 12.9) - slot * 0.64;
      if (fx < 0.08) return shade(col, 0.6);
      if (z > 4.35 && Math.hypot(fx - 0.32, z - 4.58) < 0.12) return C.steelDark;
      return (fx > 0.2 && fx < 0.44 && z < 4.2 && ((z * 3) | 0) % 2) ? shade(col, 0.75) : shade(col, 1.05);
    }
    if (v > 18.3 && v < 23.3 && z > 0.6 && z < 3.6) return 0x0d0d0e;
    return col;
  }, id);
  // låg front- och bottenkant (glasfront visas som genomskinlig vägg)
  const glass = L.front === 'glass';
  R.box(c.u1 - 0.5, c.u1, c.v0 + 0.5, c.v1, c.z1, glass ? c.wall : c.z1 + 0.9, (f, x, y, W, H) => {
    if (glass) return f === 'top' ? edge : ((x + y * 0.6) % 3 < 0.35 ? 0xffffff : 0xbfd6e0);
    return f === 'top' ? edge : col;
  }, id, glass ? { alpha: 0.22 } : {});
  R.box(c.u0 + 0.5, c.u1 - 0.5, c.v1 - 0.5, c.v1, c.z1, c.z1 + 0.9, (f) => f === 'top' ? edge : col, id);
  // nätaggskåpa (skiljevägg till källaren) med kabelhål
  R.box(c.u0 + 0.5, c.u1 - 0.5, G.shroud.v0, G.shroud.v1, c.z1, c.z1 + 1.1, (f, x) => {
    if ((x > 9 && x < 11) || (x > 14.5 && x < 16)) return -1;
    return f === 'top' ? edge : shade(col, 1.05);
  }, id);
  // hårddiskbur (plats "bay")
  const b = G.bay, bid = o.ids.bay || id;
  R.box(b.u0, b.u1, b.v0 + 0.2, b.v1 - 0.2, c.z1, c.z1 + 0.04, (f, x, y, W, H) => {
    const e = x < 0.25 || y < 0.25 || x > W - 0.25 || y > H - 0.25;
    return e ? C.steelDark : (((x * 2) | 0) % 3 === 0 ? shade(inner, 0.75) : shade(inner, 0.92));
  }, bid);
  R.box(b.u0 - 0.2, b.u0, b.v0 + 0.2, b.v1 - 0.2, c.z1, c.z1 + 1.6, (f, x, y) => (y * 3 | 0) % 2 ? C.steel : C.steelDark, bid);
  // nätaggsplats (plats "psu")
  const p = G.psu, pid = o.ids.psu || id;
  if (!o.placed?.psu) R.box(p.u0, p.u1, p.v0, p.v1, c.z1, c.z1 + 0.03, (f, x, y, W, H) => {
    const e = x < 0.2 || y < 0.2 || x > W - 0.2 || y > H - 0.2;
    return e ? ((Math.floor((x + y) * 2) % 2) ? 0xe0a02a : 0x222222) : -1;
  }, pid);
  // inbyggda fläktar
  const fanLook = { frame: light ? '#ececea' : '#1a1a1c', blade: light ? '#f4f4f2' : '#2b2b2e', rgb: part.rgb, key: 'case' };
  for (const s of part.fans) drawFanUnit(R, s, fanLook, o, id);
}

// ---------- Moderkort ----------
export function drawBoard(R, part, o) {
  const b = G.board, L = part.look, pcb = hex(L.pcb), acc = hex(L.accent);
  const u1 = part.size === 'ATX' ? b.u1ATX : b.u1mATX;
  const id = o.ids.mb || 0, zt = BOARD_TOP, tier = part.tier;
  const silk = mix(pcb, 0xffffff, 0.55), trace = mix(pcb, 0xd8b24a, 0.3);
  const B = (u0, uu1, v0, v1, h, tex, bid = id) => R.box(u0, uu1, v0, v1, zt, zt + h, tex, bid);
  const ramBm = textBitmap(part.ram), sockBm = textBitmap(part.socket);

  R.box(b.u0, u1, b.v0, b.v1, b.z0, b.z1, (f, x, y, W, H) => {
    if (f !== 'top') return (x * 3 | 0) % 2 ? shade(pcb, 0.8) : shade(pcb, 0.65);
    const u = x + b.u0, v = y + b.v0;
    for (const [su, sv] of STANDOFFS) {
      const d = Math.hypot(u - su, v - sv);
      if (d < 0.34) return d < 0.17 ? 0x1b1b1b : C.steel;
    }
    if (x < 0.1 || y < 0.1 || x > W - 0.1 || y > H - 0.1) return shade(pcb, 0.6);
    // silkscreen-ramar
    if ((Math.abs(u - 10.05) < 0.04 || Math.abs(u - 12.95) < 0.04) && v > 2.8 && v < 9.8) return silk;
    if (Math.abs(v - 9.8) < 0.04 && u > 10.05 && u < 12.95) return silk;
    if ((Math.abs(u - 4.8) < 0.04 || Math.abs(u - 8.8) < 0.04) && v > 3.6 && v < 7.6) return silk;
    if (u > 10.2 && v > 9.9 && ramBm.on((u - 10.2) / 0.13 | 0, (v - 9.9) / 0.13 | 0)) return silk;
    if (u > 5 && v > 7.62 && sockBm.on((u - 5) / 0.11 | 0, (v - 7.62) / 0.11 | 0)) return silk;
    // ljuddel avskild med prickad linje
    if (Math.abs(v - 12.9) < 0.04 && u < 4.6 && ((u * 5) | 0) % 2) return silk;
    if (Math.abs(u - 4.6) < 0.04 && v > 12.9 && ((v * 5) | 0) % 2) return silk;
    // kretsbanor (systembussen)
    if (u > 8.6 && u < 10.2 && v > 4.4 && v < 6.8 && ((v * 7) | 0) % 2 === 0) return trace;
    if (u > 9.45 && u < 9.75 && v > 7.4 && v < 14 && ((u * 20) | 0) % 2 === 0) return trace;
    if (v > 12.55 && v < 12.75 && u > 9.6 && u < 13.4) return trace;
    if (v > 9.8 && v < 10.0 && u > 8.5 && u < 9.6) return trace;
    // vias
    if (hash(u * 4 | 0, v * 4 | 0) > 0.985) return 0xc9b37a;
    return hash(u * 2 | 0, v * 2 | 0) > 0.8 ? shade(pcb, 1.07) : pcb;
  }, id);

  // bakre I/O
  if (tier <= 1) {
    for (const [v0, c] of [[1.8, 0x2c6fb7], [2.8, 0x1b1b1b], [3.8, 0x2a2a2a], [5, C.steel]]) B(1.6, 2.6, v0, v0 + 0.8, 0.9, (f) => f === 'top' ? shade(c, 1.1) : c);
  } else {
    const logo = textBitmap(L.accent === '#c9323a' ? 'ROG' : part.name.split(' ')[0].slice(0, 4));
    B(1.6, 3.1, 1.6, 7.2, 1.7, (f, x, y, W, H) => {
      if (f === 'top') {
        if (part.rgb && x > 1.1 && x < 1.3) return led(o, 'mb', y);
        if (logo.on(((y - 1.2) / 0.12) | 0, ((x - 0.35) / 0.12) | 0)) return 0xeeeeee;
        return ((y * 4) | 0) % 5 === 0 ? shade(acc, 0.7) : acc;
      }
      return f === 'left' ? shade(acc, 0.9) : ((y * 5) | 0) % 2 ? shade(acc, 0.8) : acc;
    });
  }
  // VRM: spolar + kylflänsar
  for (let i = 0; i < 7; i++) B(4.9 + i * 0.6, 5.35 + i * 0.6, 2.95, 3.45, 0.4, (f) => f === 'top' ? 0x6b7078 : 0x4b4f55);
  for (let i = 0; i < 6; i++) B(3.35, 3.8, 3.3 + i * 0.75, 3.75 + i * 0.75, 0.4, (f) => f === 'top' ? 0x6b7078 : 0x4b4f55);
  if (tier >= 2) {
    const fin = (f, x, y) => f === 'top' ? (((x + y) * 5 | 0) % 2 ? acc : shade(acc, 0.72)) : ((y * 6 | 0) % 2 ? acc : shade(acc, 0.8));
    B(4.8, 9.1, 1.95, 2.95, 1.05, fin);
    B(3.25, 4.35, 3.1, 8.1, 1.05, fin);
  }
  // kondensatorer
  for (let i = 0; i < 6; i++) B(5.1 + i * 0.6, 5.4 + i * 0.6, 7.75, 8.05, 0.35, (f, x, y) => f === 'top' ? (Math.hypot(x - 0.15, y - 0.15) < 0.08 ? 0x8a8f96 : 0x202020) : ((y < 0.1) ? C.gold : 0x2a2a2a));
  // ljuddel: guldkondensatorer + chip under skärm
  for (const [cu, cv] of [[2, 13.3], [2.6, 13.3], [3.2, 13.3], [2, 14], [3.8, 13.3]]) B(cu, cu + 0.35, cv, cv + 0.35, 0.4, (f) => f === 'top' ? 0xe0c060 : C.gold);
  B(2.2, 3.8, 14.5, 15.7, 0.15, (f, x, y) => tier >= 3 ? (f === 'top' && x > 0.3 && x < 1.3 && y > 0.5 && y < 0.7 ? acc : C.steel) : 0x151515);
  // chipset
  if (tier >= 2) {
    const cs = textBitmap(part.socket.startsWith('AM') ? 'AMD' : 'INTEL');
    B(10.8, 13.2, 10.4, 12.3, 0.4, (f, x, y) => {
      if (f === 'top' && cs.on(((x - 0.35) / 0.12) | 0, ((y - 0.7) / 0.12) | 0)) return 0xf2f2f2;
      return f === 'top' ? (((x * 3) | 0) % 5 === 0 ? shade(acc, 0.8) : acc) : shade(acc, 0.85);
    });
  } else {
    B(11.3, 12.7, 10.7, 12, 0.12, (f, x, y) => f === 'top' && x < 0.25 && y < 0.25 ? 0xcccccc : 0x1c1c1c);
  }
  // ATX: extra M.2-kylare, SATA-rad, POST-display och knappar på toppkorten
  if (part.size === 'ATX') {
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
  // BIOS-chip + batteri + PCIe x1
  B(11.4, 11.9, 14.3, 14.8, 0.12, () => 0x151515);
  B(6.8, 7.8, 15.6, 16.6, 0.1, (f, x, y) => { const d = Math.hypot(x - 0.5, y - 0.5); return d < 0.5 ? (d > 0.42 ? C.steelDark : mix(C.steel, 0xffffff, 0.3)) : -1; });
  B(3, 5.2, 12.2, 12.6, 0.3, (f, x, y) => f === 'top' && y > 0.12 && y < 0.28 ? 0x050505 : 0x1f1f1f);

  // uttag/stiftlister
  for (const [key, p] of Object.entries(PORTS)) {
    if (p.owner !== 'mb') continue;
    const [pu0, pu1, pv0, pv1, h] = p.box;
    B(pu0, pu1, pv0, pv1, h, portTex(p.type, acc));
  }

  // CPU-sockel (plats "cpu") + spak
  const s = G.socket, am4 = part.socket === 'AM4', cpuId = o.ids.cpu || id;
  R.box(s.u0, s.u1, s.v0, s.v1, zt, zt + 0.15, (f, x, y, W, H) => {
    if (f !== 'top') return am4 ? 0xd9d2bf : 0x7d828a;
    const e = 0.3;
    if (x < e || y < e || x > W - e || y > H - e) return am4 ? 0xe8e1ce : (((x + y) * 4 | 0) % 7 === 0 ? 0xdadde1 : C.steel);
    if (am4) return ((x * 5 | 0) + (y * 5 | 0)) % 2 ? 0xe8e1ce : 0x7b7465;
    if (part.socket === 'AM5' && (x < 0.55 || x > W - 0.55) && y > 1 && y < H - 1) return 0x5b6068;
    return ((x * 6 | 0) + (y * 6 | 0)) % 2 ? 0xc79a3a : 0x2c2e33;
  }, cpuId);
  const lv = G.lever;
  if (o.leverClosed) R.box(lv.u0, lv.u1, lv.v0, lv.v1, zt + 0.1, zt + 0.28, (f, x, y) => y < 0.35 ? 0x9aa0a6 : C.steel, cpuId);
  else R.box(lv.u0, lv.u1, lv.v0 - 0.1, lv.v0 + 0.15, zt + 0.1, zt + 3.2, (f, x, y) => y < 0.3 ? 0x9aa0a6 : C.steel, cpuId);

  // RAM-slots med spärrar (plats "ram")
  G.ramSlots.forEach((su, i) => {
    R.box(su, su + 0.45, G.ramV[0], G.ramV[1], zt, zt + 0.3, (f, x, y, W, H) => {
      if (f === 'top') {
        if (y < 0.3 || y > H - 0.3) return 0xf0f0ee;
        if (x > 0.15 && x < 0.3) return 0x050505;
      }
      return i % 2 ? 0x2a2a2a : shade(acc, 0.55);
    }, o.ids.ram || id);
  });
  // M.2-plats (plats "m2")
  const m = G.m2, m2Id = o.ids.m2 || id;
  R.box(m.u0, m.u1 + 0.5, m.v0, m.v1, zt, zt + 0.02, (f, x, y, W, H) => {
    if (x > W - 0.5) return 0x2a2a2a;
    if (Math.hypot(x - 0.12, y - H / 2) < 0.2) return C.brass;
    return (x < 0.06 || y < 0.06 || y > H - 0.06) ? silk : shade(pcb, 1.12);
  }, m2Id);
  R.box(m.u1, m.u1 + 0.5, m.v0 + 0.1, m.v1 - 0.1, zt, zt + 0.25, (f, x, y) => f === 'top' && x < 0.15 ? C.gold : 0x2a2a2a, m2Id);
  // PCIe x16 med metallförstärkning (plats "gpu")
  const pc = G.pcie;
  R.box(pc.u0, pc.u1, pc.v0, pc.v1, zt, zt + 0.35, (f, x, y, W, H) => {
    if (f === 'top') {
      if (x > W - 0.35) return 0xf0f0ee; // spärr
      if (tier >= 3 && (y < 0.12 || y > H - 0.12)) return 0xd6dade;
      return y > 0.22 && y < H - 0.22 ? 0x050505 : 0x1d1d1d;
    }
    return tier >= 3 ? 0xaeb2b7 : 0x1d1d1d;
  }, o.ids.gpu || id);
}

// Stiftlister och kontakter på kortet
export function portTex(type, acc) {
  switch (type) {
    case 'atx24': case 'eps8':
      return (f, x, y) => f === 'top' ? ((((x * 3.3) | 0) + ((y * 3) | 0)) % 2 ? 0x3a3a3a : 0x0d0d0d) : (y < 0.15 ? 0x2a2a2a : 0x161616);
    case 'fan4':
      return (f, x, y, W, H) => f === 'top' ? ((((W > H ? x : y) * 6.5) | 0) % 2 === 0 ? C.gold : 0xf2f2ee) : 0xe2e2dd;
    case 'argb':
      return (f, x, y, W, H) => {
        const a = W > H ? x : y, n = (a * 6.6) | 0;
        return f === 'top' ? (n % 2 === 0 && n !== 2 ? C.gold : 0xf2f2ee) : 0xe2e2dd;
      };
    case 'fpanel':
      return (f, x, y) => f === 'top' ? ((((x * 7) | 0) % 2 === 0 && ((y * 6.6) | 0) % 2 === 0) ? C.gold : 0x121212) : 0x121212;
    case 'usb3':
      return (f, x, y, W, H) => f === 'top' ? ((x > 0.18 && x < W - 0.18 && y > 0.15 && y < H - 0.15) ? 0x0e1a33 : 0x2d63c8) : 0x2d63c8;
    case 'audio':
      return (f, x, y, W, H) => f === 'top' ? ((x > 0.12 && x < W - 0.12 && y > 0.12 && y < H - 0.12) ? ((((x * 7) | 0) % 2 === 0) ? C.gold : 0x0a0a0a) : 0x1c1c1c) : 0x1c1c1c;
    case 'satad':
      return (f, x, y, W, H) => f === 'top' ? ((y > 0.15 && y < H - 0.15 && x > 0.2) ? 0x050505 : 0x2a2a2a) : (x > W - 0.2 ? 0x050505 : 0x262626);
  }
  return () => acc;
}
