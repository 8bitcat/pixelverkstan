// Pixelgrafik för komponenterna + ikoner till menyer.
import { Raster, hex, shade, mix, T } from '../../core/raster.js';
import { G, VIEW, BOARD_TOP } from './geom.js';
import { drawMat, drawCase, drawBoard } from './art-base.js';

export { drawMat };

function hsl(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return ((f(0) * 255 | 0) << 16) | ((f(8) * 255 | 0) << 8) | (f(4) * 255 | 0);
}

function drawCpu(R, p, o) {
  const { cu, cv } = G.cpu, s = 1.55, z0 = BOARD_TOP + 0.15;
  const intel = p.look.brand === 'intel';
  R.box(cu - s, cu + s, cv - s, cv + s, z0, z0 + 0.35, (f, x, y, W, H) => {
    if (f !== 'top') return y > H - 0.12 ? 0x2e6b3c : 0xb9bdc2;
    const e = 0.32;
    if (x < e || y < e || x > W - e || y > H - e) return (x < 0.45 && y < 0.45) ? 0xd8b24a : 0x2e6b3c;
    if (o.paste && Math.hypot(x - W / 2, y - H / 2) < 0.75) return ((x * 6 | 0) + (y * 6 | 0)) % 3 ? 0x9da3a8 : 0xb8bdc2;
    if (intel) {
      if (x > 0.7 && x < 1.9 && y > 0.7 && y < 1.1) return 0x2c6fb7;
    } else {
      if (x > 0.7 && x < 1.7 && y > 0.7 && y < 1.1) return 0x1f1f1f;
      if (x > 1.75 && x < 2.05 && y > 0.7 && y < 1.1) return 0xe07a2e;
    }
    if (x > 0.7 && x < 2.5 && ((y > 1.4 && y < 1.52) || (y > 1.75 && y < 1.87))) return 0x7d8187;
    return mix(0xdfe2e5, 0xa9adb2, (x + y) / (W + H));
  }, o.id);
}

function drawCooler(R, p, o) {
  const { cu, cv } = G.cpu, L = p.look, z0 = BOARD_TOP + 0.5;
  const fan = hex(L.fan), blade = hex(L.blade), fin = hex(L.fin);
  const spin = o.spin || 0;
  const finTex = (f, x, y) => f === 'top' ? ((x * 4 | 0) % 2 ? fin : shade(fin, 0.6)) : ((y * 4 | 0) % 2 ? fin : shade(fin, 0.7));
  if (L.type === 'low') {
    R.box(cu - 2, cu + 2, cv - 2, cv + 2, z0, z0 + 0.9, (f, x, y) => ((f === 'top' ? x : y) * 5 | 0) % 2 ? fin : shade(fin, 0.65), o.id);
    R.box(cu - 2.1, cu + 2.1, cv - 2.1, cv + 2.1, z0 + 0.9, z0 + 1.6, (f, x, y, W, H) => {
      if (f !== 'top') return fan;
      const c = T.fan(x, y, W / 2, H / 2, 1.9, spin, shade(fan, 1.6), blade, 0x101010);
      return c < 0 ? fan : c;
    }, o.id);
  } else if (L.type === 'tower') {
    const big = p.id === 'nh-d15';
    const U = big ? 3.4 : 2.2;
    R.box(cu - U / 2, cu + U / 2, cv - 2.3, cv + 2.3, z0, z0 + 5, (f, x, y, W) => {
      if (f === 'top') {
        for (const hv of [0.9, 1.9, 2.8, 3.7]) if (Math.hypot(x - W / 2, y - hv) < 0.22) return 0xc87533;
        if (big && Math.abs(x - W / 2) < 0.35) return fan;
      }
      return finTex(f, x, y);
    }, o.id);
    // fläkt på framsidan (höger yta)
    R.box(cu + U / 2, cu + U / 2 + 0.6, cv - 2.4, cv + 2.4, z0 + 0.1, z0 + 4.9, (f, x, y, W, H) => {
      if (f !== 'right') return fan;
      const c = T.fan(x, y, W / 2, H / 2, 2.2, spin, shade(fan, 1.2), blade, shade(fan, 0.35));
      return c < 0 ? fan : c;
    }, o.id);
  } else {
    // vattenkylning: pumpblock + slangar mot chassiväggen
    R.box(cu - 1.4, cu + 1.4, cv - 1.4, cv + 1.4, z0, z0 + 1.3, (f, x, y, W, H) => {
      if (f !== 'top') return 0x1d1d1d;
      const d = Math.hypot(x - W / 2, y - H / 2);
      return d < 0.9 && d > 0.6 ? 0xe6e6e6 : d < 0.25 ? 0x58a6c9 : 0x262626;
    }, o.id);
    for (const du of [-0.6, 0.2]) R.box(cu + du, cu + du + 0.4, 0.5, cv - 1.4, z0 + 0.8, z0 + 1.2, () => 0x151515, o.id);
  }
}

function drawRam(R, p, o) {
  const L = p.look, col = hex(L.color), acc = hex(L.accent);
  const slots = p.sticks > 1 ? [G.ramSlots[1], G.ramSlots[3]] : [G.ramSlots[1]];
  for (const su of slots) {
    R.box(su + 0.03, su + 0.42, G.ramV[0] + 0.1, G.ramV[1] - 0.1, BOARD_TOP + 0.3, BOARD_TOP + 2.9, (f, x, y, W, H) => {
      if (f === 'top') return L.rgb ? hsl((y * 50 + (o.t || 0) * 120) % 360, 0.9, 0.62) : acc;
      if (L.rgb && y < 0.4) return hsl((x * 50 + (o.t || 0) * 120) % 360, 0.9, 0.65);
      if (y > 0.55 && y < 0.8) return acc;
      if (f === 'right' && x > 1 && x < 2.4 && y > 1.1 && y < 1.5) return shade(col, 1.9);
      return col;
    }, o.id);
  }
}

function drawStorage(R, p, o) {
  const lab = hex(p.look.label);
  if (p.kind === 'nvme') {
    const m = G.m2;
    R.box(m.u0, m.u1, m.v0 + 0.05, m.v1 - 0.05, BOARD_TOP + 0.05, BOARD_TOP + 0.22, (f, x, y, W, H) => {
      if (f !== 'top') return 0x1e2b24;
      if (x > W - 0.3) return ((y * 8 | 0) % 2) ? 0xd8b24a : 0x1e2b24;
      if (x > 0.45 && x < W - 0.6 && y > 0.12 && y < H - 0.12) {
        if (y > 0.35 && y < 0.45 && x > 1 && x < 3.2) return 0xf2f2f2;
        return lab;
      }
      return 0x1e2b24;
    }, o.id);
    return;
  }
  const b = G.bay, cu = (b.u0 + b.u1) / 2, cv = (b.v0 + b.v1) / 2, z0 = G.case.z1 + 0.05;
  const hdd = p.kind === 'hdd';
  const U = hdd ? 4.4 : 3.6, V = hdd ? 5.8 : 5, Z = hdd ? 1.1 : 0.5;
  R.box(cu - U / 2, cu + U / 2, cv - V / 2, cv + V / 2, z0, z0 + Z, (f, x, y, W, H) => {
    if (f !== 'top') return hdd ? 0x3a3d42 : 0x2f3338;
    if (hdd) {
      if (x > 0.4 && x < W - 0.4 && y > 1 && y < H - 0.5) return y < 1.6 ? lab : ((y * 3 | 0) % 4 === 0 && x < 3) ? 0xb0b0b0 : 0xededed;
      const d = Math.hypot(x - W / 2, y - H / 2);
      return Math.abs(d - 1.9) < 0.12 ? 0x9a9ea3 : 0xbfc3c7;
    }
    if (x > 0.4 && x < W - 0.4 && y > 0.6 && y < 2.2) return lab;
    return 0x3b3f45;
  }, o.id);
}

function drawGpu(R, p, o) {
  const L = p.look, col = hex(L.color);
  const U = [6.5, 9.5, 12.5][p.len - 1];
  const nv = L.brand === 'nvidia', brand = nv ? 0x76b900 : 0xd8343c;
  const u0 = G.gpu.u0, z0 = BOARD_TOP + 0.35;
  R.box(u0, u0 + U, G.gpu.v0, G.gpu.v1, z0, z0 + 2.7, (f, x, y, W, H) => {
    if (f === 'left') {
      if (y < 0.1) return brand;
      const n = L.fans, sp = W / n, r = Math.min(H / 2 - 0.2, sp / 2 - 0.15);
      for (let i = 0; i < n; i++) {
        const c = T.fan(x, y, sp * (i + 0.5), H / 2, r, (o.spin || 0) * (i % 2 ? -1 : 1), 0x2a2a2a, 0x1c1c1c, 0x0b0b0b);
        if (c >= 0) return c;
      }
      return (y > H - 0.18) ? shade(col, 0.7) : col;
    }
    if (f === 'top') {
      if (x > 1 && x < 3.6 && y > 0.55 && y < 0.95) return brand;
      if (x > W - 2 && x < W - 1 && y > 0.4 && y < 1.1) return 0x0e0e0e;
      return shade(col, 0.8);
    }
    return shade(col, 0.9);
  }, o.id);
}

function drawPsu(R, p, o) {
  const P = G.psu, col = hex(p.look.color), acc = hex(p.look.accent), z0 = G.case.z1 + 0.04;
  R.box(P.u0 + 0.2, P.u1 - 0.2, P.v0 + 0.2, P.v1 - 0.2, z0, z0 + 3.2, (f, x, y, W, H) => {
    if (f === 'top') {
      const d = Math.hypot(x - W / 2, y - H / 2);
      if (d < 0.5) return acc;
      if (d < 2.7) {
        if (Math.floor(d * 3) % 2 === 0) return 0x2a2a2a;
        const c = T.fan(x, y, W / 2, H / 2, 2.6, o.spin || 0, 0x333333, 0x1d1d1d, 0x0c0c0c);
        return c < 0 ? 0x111111 : c;
      }
      return col;
    }
    if (f === 'left') {
      if (x > 0.6 && x < 3.8 && y > 0.5 && y < 1.7) return (y > 0.9 && y < 1.02) || (y > 1.25 && y < 1.37) ? 0xf2f2f2 : acc;
      return col;
    }
    if (x > 1 && x < 5.6 && y > 0.8 && y < 2.4 && ((x * 2 | 0) % 2)) return 0x333538;
    return shade(col, 1.1);
  }, o.id);
}

export function drawPart(R, part, o) {
  switch (part.cat) {
    case 'case': return drawCase(R, part, o);
    case 'mb': return drawBoard(R, part, o);
    case 'cpu': return drawCpu(R, part, o);
    case 'cooler': return drawCooler(R, part, o);
    case 'ram': return drawRam(R, part, o);
    case 'storage': return drawStorage(R, part, o);
    case 'gpu': return drawGpu(R, part, o);
    case 'psu': return drawPsu(R, part, o);
  }
}

// ---------- Ikoner ----------
const ICONS = new Map();

function makeRaster(scale = 1) {
  const R = new Raster(VIEW.w + 20, VIEW.h + 30);
  R.k = VIEW.k * scale; R.hz = VIEW.hz * scale; R.ox = VIEW.ox + 10; R.oy = VIEW.oy + 20;
  R.clear();
  return R;
}
function bbox(R) {
  let x0 = R.w, y0 = R.h, x1 = -1, y1 = -1;
  for (let y = 0; y < R.h; y++) for (let x = 0; x < R.w; x++) {
    if (R.data[(y * R.w + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

// Ritar delen isolerat och beskär till en ikon (W×H). Returnerar en ny canvas varje gång
// (samma källa återanvänds från cache).
export function iconCanvas(part, W = 64, H = 54) {
  const key = part.id + ':' + W + 'x' + H;
  let src = ICONS.get(key);
  if (!src) {
    const o = { ids: {}, id: 0, spin: 0.4 };
    const iconPart = part.cat === 'ram' ? { ...part, sticks: 1 } : part;
    let R = makeRaster(1); drawPart(R, iconPart, o); R.flush();
    let bb = bbox(R);
    const f = Math.min((W - 2) / bb.w, (H - 2) / bb.h);
    if (f < 1) { R = makeRaster(f); drawPart(R, iconPart, o); R.flush(); bb = bbox(R); }
    const s = f >= 2 ? Math.min(3, Math.floor(f)) : 1;
    src = document.createElement('canvas'); src.width = W; src.height = H;
    const cx = src.getContext('2d'); cx.imageSmoothingEnabled = false;
    cx.drawImage(R.canvas, bb.x, bb.y, bb.w, bb.h, Math.round((W - bb.w * s) / 2), Math.round((H - bb.h * s) / 2), bb.w * s, bb.h * s);
    ICONS.set(key, src);
  }
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  c.getContext('2d').drawImage(src, 0, 0);
  return c;
}
