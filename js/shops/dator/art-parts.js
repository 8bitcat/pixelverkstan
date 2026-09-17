// Pixelgrafik för komponenterna som monteras (CPU, kylare, RAM, lagring, GPU, nätagg, fläktar, skruvar).
import { hex, shade, mix } from '../../core/raster.js';
import { textBitmap } from '../../core/pixfont.js';
import { G, BOARD_TOP, GPU_LEN, SCREWS, driveBox } from './geom.js';
import { C, fan, honeycomb, hash, led, isLit, screwHead } from './art-common.js';
import { drawFanUnit } from './art-base.js';

const TXT = (s) => textBitmap(s);

// ---------- CPU ----------
export function drawCpu(R, p, o) {
  const { cu, cv } = G.cpu, z0 = BOARD_TOP + 0.15;
  const intel = p.look.brand === 'intel';
  const [hu, hv] = intel ? [1.35, 1.65] : [1.6, 1.6];
  const brand = TXT(intel ? 'INTEL' : 'AMD');
  const model = TXT(intel ? (p.look.ultra ? 'ULTRA' : 'CORE') : 'RYZEN');
  const am5 = p.socket === 'AM5';
  R.box(cu - hu, cu + hu, cv - hv, cv + hv, z0, z0 + 0.38, (f, x, y, W, H) => {
    if (f !== 'top') return y > H - 0.14 ? C.pcbGreen : 0xb4b8bd;
    const e = 0.28;
    const sub = x < e || y < e || x > W - e || y > H - e;
    const cut = intel ? (x < e + 0.35 && Math.abs(y - H / 2) < 0.35) || (x > W - e - 0.35 && Math.abs(y - H / 2) < 0.35)
      : am5 && ((x < e + 0.45 || x > W - e - 0.45) && y > 0.75 && y < H - 0.75);
    if (sub || cut) {
      if (x < 0.42 && y < 0.42) return C.gold;
      if (cut && hash(x * 9 | 0, y * 9 | 0) > 0.6) return 0x8a6a3a;
      return intel ? 0x2a5a36 : 0x2f6f3e;
    }
    if (o.paste && Math.hypot(x - W / 2, y - H / 2) < 0.85) return (hash(x * 12 | 0, y * 12 | 0) > 0.5) ? 0x9da3a8 : 0xb8bdc2;
    if (brand.on(((x - 0.6) / 0.11) | 0, ((y - 0.62) / 0.11) | 0)) return intel ? 0x2c6fb7 : 0x1b1b1b;
    if (model.on(((x - 0.6) / 0.09) | 0, ((y - 1.3) / 0.09) | 0)) return 0x5d6167;
    if (y > 1.95 && y < 2.05 && x > 0.6 && x < W - 0.6) return 0x8d9197;
    const sheen = ((x - y) % 1.6 + 1.6) % 1.6 < 0.15 ? 1.08 : 1;
    return shade(mix(0xe2e5e8, 0xa9adb2, (x + y) / (W + H)), sheen);
  }, o.id);
}

// ---------- Kylare ----------
export function drawCooler(R, p, o) {
  const { cu, cv } = G.cpu, L = p.look, z0 = BOARD_TOP + 0.53;
  const fanC = hex(L.fan), blade = hex(L.blade), fin = hex(L.fin);
  const spin = o.spin || 0, ring = p.rgb ? led(o, 'cooler') : -1;
  const fins = (f, x, y) => f === 'top' ? ((x * 5 | 0) % 2 ? fin : shade(fin, 0.55)) : ((y * 5 | 0) % 2 ? fin : shade(fin, 0.62));
  if (L.type === 'low') {
    R.box(cu - 2, cu + 2, cv - 2, cv + 2, z0, z0 + 0.9, (f, x, y) => ((f === 'top' ? x : y) * 6 | 0) % 2 ? fin : shade(fin, 0.6), o.id);
    const logo = TXT('ARCTIC');
    R.box(cu - 2.1, cu + 2.1, cv - 2.1, cv + 2.1, z0 + 0.9, z0 + 1.6, (f, x, y, W, H) => {
      if (f !== 'top') return (x < 0.35 || x > W - 0.35) ? C.rubber : fanC;
      if (logo.on(((x - 1.38) / 0.1) | 0, ((y - 1.9) / 0.1) | 0)) return 0x2c6fb7;
      const c = fan(x, y, W / 2, H / 2, 1.85, { spin, frame: fanC, blade, hub: 0xf2f2f2, blades: 7, ring });
      return c < 0 ? -1 : c;
    }, o.id);
    return;
  }
  if (L.type === 'tower') {
    const big = p.id === 'nh-d15', U = big ? 3.4 : 2.2;
    const top = big ? 0xcfd3d7 : 0x1b1b1d, capC = big ? 0xd9dde1 : 0x2a2a2d;
    R.box(cu - U / 2, cu + U / 2, cv - 2.3, cv + 2.3, z0, z0 + 5, (f, x, y, W, H) => {
      if (f === 'top') {
        if (big && Math.abs(x - W / 2) < 0.38) return (y * 5 | 0) % 2 ? shade(fanC, 0.9) : hex('#8a4b34');
        return (x < 0.12 || x > W - 0.12) ? shade(top, 0.8) : (((x + y) * 3 | 0) % 9 === 0 ? shade(top, 1.2) : top);
      }
      return fins(f, x, y);
    }, o.id);
    // värmerörens toppar
    for (const hv of [-1.5, -0.5, 0.5, 1.5]) R.box(cu - 0.18, cu + 0.18, cv + hv - 0.18, cv + hv + 0.18, z0 + 5, z0 + 5.2, (f) => f === 'top' ? capC : C.copper, o.id);
    const logo = TXT(big ? 'NOCTUA' : 'CM');
    R.box(cu + U / 2, cu + U / 2 + 0.6, cv - 2.45, cv + 2.45, z0 + 0.05, z0 + 4.95, (f, x, y, W, H) => {
      if (f !== 'right') return (y < 0.3 || y > H - 0.3) ? C.rubber : fanC;
      const c = fan(x, y, W / 2, H / 2, 2.2, { spin, frame: fanC, blade, hub: big ? 0xd8c7a7 : 0x222222, blades: big ? 9 : 7, ring });
      if (c >= 0 && Math.hypot(x - W / 2, y - H / 2) < 0.5 && logo.on(((W - x - (W / 2 - 0.45)) / 0.08) | 0, ((y - H / 2 + 0.2) / 0.08) | 0)) return 0xf0f0f0;
      return c < 0 ? -1 : c;
    }, o.id);
    return;
  }
  // AIO: pumpblock + slangar + radiator i taket
  const white = ((fanC >> 16) & 255) > 150;
  R.box(cu - 1.3, cu + 1.3, cv - 1.3, cv + 1.3, z0, z0 + 1.4, (f, x, y, W, H) => {
    if (f !== 'top') return white ? 0xdedede : 0x1d1d1d;
    const d = Math.hypot(x - W / 2, y - H / 2);
    if (L.screen && d < 0.95) return isLit(o, 'cooler') || o.showroom ? mix(0x2a5bd8, 0xc84bd8, (Math.sin((o.t || 0) * 2 + x * 2) + 1) / 2) : 0x0b0b10;
    if (d < 1.15 && d > 0.95) return p.rgb ? led(o, 'cooler', y) : 0xbfbfbf;
    return white ? 0xe9e9e6 : 0x262626;
  }, o.id);
  const tube = white ? 0xdcdcdc : 0x121212;
  for (const du of [-0.55, 0.25]) R.box(cu + du, cu + du + 0.35, 2.35, cv - 1.3, z0 + 0.9, z0 + 1.3, () => tube, o.id);
  for (const du of [-0.55, 0.25]) R.box(cu + du, cu + du + 0.35, 2.0, 2.35, z0 + 0.9, 2.4, () => tube, o.id);
  R.box(5.2, 21.6, 0.5, 1.35, 2.2, 5.4, (f, x, y) => f === 'top' ? ((x * 4 | 0) % 2 ? 0x2a2a2a : 0x1a1a1a) : ((y * 6 | 0) % 2 ? 0x2c2c2c : 0x161616), o.id);
  for (const s of ['top1', 'top2', 'top3']) drawFanUnitAt(R, s, 1.35, 2.3, { frame: L.fan, blade: L.blade, rgb: p.rgb, key: 'cooler' }, o, o.id);
}

// Takfläkt förskjuten (under radiatorn)
function drawFanUnitAt(R, slot, v0, v1, look, o, id) {
  const s = { top1: [5.4, 10.2], top2: [11, 15.8], top3: [16.6, 21.4] }[slot];
  const frame = hex(look.frame), blade = hex(look.blade);
  R.box(s[0], s[1], v0, v1, 2.3, 5.3, (f, x, y, W, H) => {
    if (f !== 'left') return frame;
    const c = fan(x, y, W / 2, H / 2, Math.min(W, H) / 2 - 0.1, { spin: o.spin || 0, frame, blade, hub: shade(frame, 1.2), blades: 9, ring: look.rgb ? led(o, look.key, x) : -1 });
    return c < 0 ? -1 : c;
  }, id);
}

// ---------- RAM ----------
export function drawRam(R, p, o) {
  const L = p.look, col = hex(L.color), acc = hex(L.accent);
  const slots = p.sticks > 1 ? [G.ramSlots[1], G.ramSlots[3]] : [G.ramSlots[1]];
  const low = L.style === 'lpx';
  const H0 = low ? 2.0 : 2.75;
  const word = TXT({ fury: 'FURY', lpx: 'VENGEANCE', rgbbar: 'CORSAIR', trident: 'TRIDENT Z5' }[L.style] || 'RAM');
  for (const [si, su] of slots.entries()) {
    R.box(su + 0.03, su + 0.42, G.ramV[0] + 0.1, G.ramV[1] - 0.1, BOARD_TOP + 0.3, BOARD_TOP + 0.3 + H0, (f, x, y, W, H) => {
      if (f === 'top') return p.rgb ? led(o, 'ram', y * 0.8 + si) : (L.style === 'trident' ? 0x2a2a2a : acc);
      const sx = f === 'right' ? W - x : x;          // så att text läses rätt
      if (L.style === 'fury') {
        const prof = 0.15 + 0.35 * Math.abs(((sx * 0.9) % 2) - 1);
        if (y < prof) return -1;
        if (p.rgb && y < prof + 0.3) return led(o, 'ram', sx + si);
      }
      if (p.rgb && L.style !== 'fury' && y < 0.45) return led(o, 'ram', sx + si);
      if (y > H - 0.3) return y > H - 0.12 ? C.gold : C.pcbGreen;
      if (L.style === 'trident') {
        if (y > 0.45 && y < 0.7) return ((sx * 5) | 0) % 2 ? 0xd8dce0 : 0x9aa0a6;
        if (y > 1.1 && y < 1.6) return 0x1b1b1b;
        if (f === 'right' && word.on(((sx - 1.2) / 0.11) | 0, ((y - 1.12) / 0.11) | 0)) return 0xe6e6e6;
        return ((sx + y) * 4 | 0) % 7 === 0 ? 0xd6dade : col;
      }
      if (y > 0.55 && y < 0.72 && L.style !== 'rgbbar') return acc;
      if (f === 'right' && word.on(((sx - 1.0) / 0.12) | 0, ((y - 1.0) / 0.12) | 0)) return L.style === 'rgbbar' ? 0x4a4a4a : acc;
      if (L.style === 'fury' && ((sx * 2.5) | 0) % 5 === 0 && y > 0.8) return shade(col, 1.6);
      return col;
    }, o.id);
  }
}

// ---------- Lagring ----------
export function drawStorage(R, p, o) {
  const lab = hex(p.look.label);
  const name = TXT(p.name.split(' ').slice(-2, -1)[0] || 'SSD');
  if (p.kind === 'nvme') {
    const m = G.m2, hs = p.look.heatsink;
    R.box(m.u0, m.u1, m.v0 + 0.05, m.v1 - 0.05, BOARD_TOP + 0.05, BOARD_TOP + (hs ? 0.55 : 0.2), (f, x, y, W, H) => {
      if (hs) return f === 'top' ? (((x * 5) | 0) % 2 ? 0x2a2a2a : 0x121212) : 0x1a1a1a;
      if (f !== 'top') return 0x1a2a20;
      if (x > W - 0.28) return ((y * 9) | 0) % 2 ? C.gold : 0x1a2a20;
      if (x > 0.35 && x < W - 0.5 && y > 0.1 && y < H - 0.1) {
        if (name.on(((x - 0.8) / 0.11) | 0, ((y - 0.28) / 0.11) | 0)) return 0xf2f2f2;
        return x < 1.2 && y > 0.55 ? shade(lab, 0.7) : lab;
      }
      return 0x1a2a20;
    }, o.id);
    return;
  }
  const d = driveBox(p), hdd = p.kind === 'hdd';
  R.box(d.u0, d.u1, d.v0, d.v1, d.z0, d.z1, (f, x, y, W, H) => {
    if (f === 'right') {
      // uttagen på kortänden: data (kort) + ström (lång)
      if (y > H * 0.25 && y < H * 0.75) {
        if (x > W * 0.12 && x < W * 0.3) return 0x050505;
        if (x > W * 0.42 && x < W * 0.8) return 0x050505;
      }
      return hdd ? (y > H - 0.2 ? C.pcbGreen : 0x6f747a) : 0x3a3e44;
    }
    if (f !== 'top') return hdd ? (y > H - 0.2 ? C.pcbGreen : 0x8a9097) : 0x33373c;
    if (hdd) {
      if (x > 0.5 && x < W - 1.2 && y > 0.45 && y < H - 0.45) {
        if (y < 1) return lab;
        if (name.on(((x - 0.8) / 0.13) | 0, ((y - 1.3) / 0.13) | 0)) return 0x222222;
        return ((y * 3) | 0) % 4 === 0 && x < 3 ? 0xb4b4b4 : 0xf0f0ec;
      }
      const dd = Math.hypot(x - (W - 1.5), y - H / 2);
      if (Math.abs(dd - 0.9) < 0.1) return 0x9a9ea3;
      return (x < 0.12 || y < 0.12 || x > W - 0.12 || y > H - 0.12) ? 0x9aa0a6 : 0xc5c9cd;
    }
    if (x > 0.35 && x < W - 0.35 && y > 0.5 && y < 1.4) return name.on(((x - 0.5) / 0.1) | 0, ((y - 0.7) / 0.1) | 0) ? 0xffffff : lab;
    return 0x3b3f45;
  }, o.id);
}

// ---------- Grafikkort ----------
export function gpuBox(p) {
  const U = GPU_LEN[p.len - 1];
  return { u0: G.gpu.u0, u1: G.gpu.u0 + U, v0: G.gpu.v0, v1: G.gpu.v1, z0: G.gpu.z0, z1: G.gpu.z1 };
}
export function drawGpu(R, p, o) {
  const L = p.look, col = hex(L.color), acc = L.accent ? hex(L.accent) : -1;
  const nv = L.brand === 'nvidia', brand = nv ? 0x76b900 : 0xd8343c;
  const g = gpuBox(p), U = g.u1 - g.u0;
  const logo = TXT(L.astral ? 'ROG ASTRAL' : nv ? 'GEFORCE RTX' : 'RADEON');
  const spin = o.spin || 0;
  // bracket + flik med skruvhål
  R.box(0.5, 0.75, 13.6, 15.6, BOARD_TOP, 4.35, (f, x, y) => (f === 'right' && ((y * 4) | 0) % 3 === 1) ? 0x2a2a2a : C.steel, o.id);
  R.box(0.2, 0.8, 14.2, 15.0, 4.35, 4.5, () => C.steel, o.id);
  R.box(g.u0, g.u1, g.v0, g.v1, g.z0, g.z1, (f, x, y, W, H) => {
    if (f === 'left') {
      if (p.rgb && y < 0.16) return led(o, 'gpu', x);
      if (L.fe) {
        const band = x > W * 0.36 && x < W * 0.64;
        if (band) return logo.on(((x - W * 0.36 - 0.25) / 0.1) | 0, ((y - H / 2 + 0.25) / 0.1) | 0) ? 0xe8e8e8 : 0x151515;
        for (const cx of [W * 0.18, W * 0.82]) { const c = fan(x, y, cx, H / 2, 1.15, { spin, frame: 0x151515, blade: 0x2b2b2b, hub: 0x3a3a3a, blades: 9, ring: -1 }); if (c >= 0) return c; }
        return ((x + y) * 3 | 0) % 8 === 0 ? shade(col, 1.12) : col;
      }
      const n = L.fans, sp = W / n, r = Math.min(H / 2 - 0.18, sp / 2 - 0.12);
      for (let i = 0; i < n; i++) {
        const c = fan(x, y, sp * (i + 0.5), H / 2, r, { spin: spin * (i % 2 ? -1 : 1), frame: shade(col, 0.8), blade: 0x1c1c1c, hub: acc >= 0 ? acc : 0x303030, blades: 9, ring: -1 });
        if (c >= 0) return c;
      }
      // vinklade dekorlinjer
      const diag = ((x * 0.8 + y) % 2.2);
      if (acc >= 0 && diag < 0.12) return L.astral ? led(o, 'gpu', x * 0.5) : acc;
      if (y > H - 0.16) return shade(col, 0.6);
      return ((x - y) % 1.1 < 0.05) ? shade(col, 1.25) : col;
    }
    if (f === 'top') {
      // kortets ovankant: logga + strömkontakt
      if (logo.on(((x - 1.0) / 0.13) | 0, ((y - 0.45) / 0.13) | 0)) return p.rgb ? led(o, 'gpu', x) : (L.fe ? 0xe8e8e8 : brand);
      if (p.pwr) {
        const px0 = W - 2.1, px1 = p.pwr === '12vhpwr' ? W - 1.35 : W - 0.95;
        if (x > px0 && x < px1 && y > 0.45 && y < 1.15) return ((((x * 7) | 0) + ((y * 7) | 0)) % 2) ? 0x050505 : 0x1e1e1e;
      }
      return ((x * 3) | 0) % 6 === 0 ? shade(col, 0.9) : shade(col, 0.75);
    }
    // kortänden: kylflänsar
    return ((y * 6) | 0) % 2 ? 0x2a2c2f : shade(col, 0.7);
  }, o.id);
}

// ---------- Nätaggregat ----------
export function drawPsu(R, p, o) {
  const P = G.psu, col = hex(p.look.color), acc = hex(p.look.accent);
  const watt = TXT(p.watt + 'W'), brand = TXT(p.name.split(' ')[0].replace('!', ''));
  const modular = p.watt >= 750;
  R.box(P.u0, P.u1, P.v0, P.v1, P.z0, P.z1, (f, x, y, W, H) => {
    if (f === 'top') {
      const d = Math.hypot(x - 2.9, y - H / 2);
      if (d < 2.3) {
        if (d < 0.45) return acc;
        if (honeycomb(x, y, 0.36)) return shade(col, 1.5);
        const c = fan(x, y, 2.9, H / 2, 2.2, { spin: o.spin || 0, frame: 0x101010, blade: 0x2a2a2a, hub: acc, blades: 7, ring: -1 });
        return c < 0 ? 0x0a0a0a : shade(c, 0.6);
      }
      if (x > W - 1.8 && x < W - 0.3 && y > 0.5 && y < H - 0.5) {
        if (watt.on(((W - 0.5 - x) / 0.13) | 0, ((y - 0.9) / 0.13) | 0)) return 0x111111;
        return acc;
      }
      return (x < 0.1 || y < 0.1 || x > W - 0.1 || y > H - 0.1) ? shade(col, 1.6) : col;
    }
    if (f === 'left') {
      if (x > 0.5 && x < 4.4 && y > 0.4 && y < 2.4) {
        if (brand.on(((x - 0.7) / 0.13) | 0, ((y - 0.6) / 0.13) | 0)) return 0xffffff;
        if (y > 1.5 && y < 1.65) return 0xffffff;
        return acc;
      }
      if (x > 5 && x < 6.3 && y > 0.5 && y < 1.8) return (x > 5.2 && x < 6.1 && y > 0.7 && y < 1.6) ? 0xd8b24a : 0xf2f2f2; // 80 PLUS
      return col;
    }
    // framsida: modulära uttag eller kabelgenomföring
    if (!modular) { const d = Math.hypot(x - 1.2, y - 1.4); return d < 0.7 ? (d > 0.5 ? 0x333333 : 0x050505) : shade(col, 1.2); }
    const sock = (x0, x1, y0, y1) => x > x0 && x < x1 && y > y0 && y < y1;
    if (sock(0.3, 1.9, 0.4, 1.3) || sock(2.2, 3.0, 0.4, 1.3) || sock(3.2, 4.0, 0.4, 1.3) || sock(0.3, 1.1, 1.6, 2.5) || sock(1.3, 2.1, 1.6, 2.5) || sock(2.4, 4.0, 1.7, 2.3))
      return (((x * 8) | 0) + ((y * 8) | 0)) % 2 ? 0x050505 : 0x222222;
    return shade(col, 1.25);
  }, o.id);
}

// ---------- Chassifläktar (tak) ----------
export function drawFans(R, p, o) {
  for (const s of ['top1', 'top2', 'top3'].slice(0, p.count)) drawFanUnit(R, s, { frame: p.look.frame, blade: p.look.blade, rgb: p.rgb, key: 'fans' }, o, o.id);
}

// ---------- Skruvar ----------
export function drawScrews(R, key, done, id) {
  for (const [i, [u, v, z]] of SCREWS[key].entries()) {
    if (typeof done === 'number' ? i >= done : !done.has(i)) continue;
    if (key === 'gpu' || key === 'psu') {
      R.box(u - 0.02, u + 0.12, v - 0.28, v + 0.28, z - 0.28, z + 0.28, (f, x, y, W, H) => {
        if (f !== 'right') return C.steelDark;
        const c = screwHead(x, y, W / 2, H / 2, 0.27);
        return c < 0 ? C.steelDark : c;
      }, id);
    } else {
      R.box(u - 0.28, u + 0.28, v - 0.28, v + 0.28, z, z + 0.14, (f, x, y, W, H) => {
        if (f !== 'top') return C.steelDark;
        const c = screwHead(x, y, W / 2, H / 2, 0.28);
        return c < 0 ? -1 : c;
      }, id);
    }
  }
}
