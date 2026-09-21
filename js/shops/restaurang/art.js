// Pixelgrafik för hamburgerbaren: brickan, grillen, brödrosten, burgarens lager, tillbehör,
// drycker och efterrätter. Allt ritas som isometriska lådor (core/raster.js) – runda saker
// får sin form genom att texturen svarar -1 utanför cirkeln. Ingen DOM utom i iconCanvas.
import { Raster, shade, mix, hex } from '../../core/raster.js';
import { layerHeight, bunTopHeight, burgerRadius } from './menu.js';

const hash = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
const H = (c) => (typeof c === 'number' ? c : hex(c));

// ---------- Byggnadsblock ----------
// Rund låda som voxelcylinder: cirkeln delas i rader (steg G enheter) längs u, varje rad blir en
// låda med egna sidor – så blir kanten trappstegsrund både på golvet och på 3D-bänken, i stället
// för en fyrkantig kloss med runt lock. Raderna ritas bakifrån (stigande v) så att de täcker rätt.
// tex(face, x, y, W, H, d): x/y i hela skivans koordinater, d = avstånd från mitten (0..1) för
// toppen; sidorna skuggas efter var runt cylindern de sitter (ljusast rakt mot betraktaren).
export const G = 0.25;
export function disc(R, cu, cv, z0, z1, r, tex, id = 0, opt = {}) {
  const hole = opt.hole || 0, ry = opt.ry || r, wave = opt.wave || 0, waveN = opt.waveN || 6, seed = opt.seed || 0;
  const inside = (u, v) => {
    const dx = (u - cu) / r, dy = (v - cv) / ry, d = Math.hypot(dx, dy);
    const edge = wave ? 1 + wave * Math.sin(Math.atan2(dy, dx) * waveN + seed) : 1;
    return d <= edge && !(hole && d < hole);
  };
  const W = 2 * r, Hh = 2 * ry, gu0 = cu - r, gv0 = cv - ry;
  const shadeAt = (u, v, f) => { const a = Math.atan2((v - cv) / ry, (u - cu) / r); const t = Math.min(1, Math.abs(a - Math.PI / 4) / (Math.PI / 2)); return (f === 'left' ? 0.9 : 0.78) * (1 - t * t * 0.4); };
  const wrap = (ua, ub, va, vb) => (f, x, y, w, h) => {
    if (f === 'top') { const u = ua + x, v = va + y; return tex('top', u - gu0, v - gv0, W, Hh, Math.hypot((u - cu) / r, (v - cv) / ry)); }
    if (f === 'left') { const u = ua + x, c = tex('left', u - gu0, y, W, h, 0); return c < 0 ? c : shade(c, shadeAt(u, vb, f)); }
    const v = va + x, c = tex('right', v - gv0, y, Hh, h, 0); return c < 0 ? c : shade(c, shadeAt(ub, v, f));
  };
  const v0 = Math.floor((cv - ry) / G) * G, v1 = Math.ceil((cv + ry) / G) * G;
  const u0 = Math.floor((cu - r) / G) * G, u1 = Math.ceil((cu + r) / G) * G;
  const bo = { noEdges: true, flat: true, ...opt.box };
  for (let va = v0; va < v1 - 1e-9; va += G) {
    const vm = va + G / 2;
    let run = null;
    for (let ua = u0; ua <= u1 + 1e-9; ua += G) {
      const on = ua < u1 - 1e-9 && inside(ua + G / 2, vm);
      if (on && run === null) run = ua;
      else if (!on && run !== null) { R.box(run, ua, va, va + G, z0, z1, wrap(run, ua, va, va + G), id, bo); run = null; }
    }
  }
}
// fyrkantig platta med samma textursignatur (d = avstånd från mitten 0..1)
function slab(R, cu, cv, z0, z1, s, tex, id = 0) {
  R.box(cu - s, cu + s, cv - s, cv + s, z0, z1, (f, x, y, W, Hh) => (f === 'top' ? tex('top', x, y, W, Hh, Math.max(Math.abs(x - W / 2) / (W / 2), Math.abs(y - Hh / 2) / (Hh / 2))) : tex(f, x, y, W, Hh, 0)), id, { noEdges: true });
}

// ---------- Lager i burgaren ----------
// o = { id, at: [cu, cv, z0], r, bottom: true|false (underbröd), top: true (toppbröd) }
export function drawLayer(R, part, o) {
  const L = part.look || {}, [cu, cv, z0] = o.at, r = o.r || burgerRadius(part), id = o.id || 0;
  const col = H(L.color || '#c8a060'), dark = H(L.dark || shade(col, 0.6));
  switch (L.shape) {
    case 'bun': return o.top ? drawBunTop(R, part, cu, cv, z0, r, id) : drawBunBottom(R, part, cu, cv, z0, r, id);
    case 'patty': {
      const h = layerHeight(part), sq = L.square;
      const tex = (f, x, y, W, Hh, d) => {
        if (f === 'top') {
          if (L.grillmarks && ((x + y) % 1.1) < 0.18) return shade(dark, 0.7);
          if (L.marbled && hash(x * 2 | 0, y * 2 | 0) > 0.82) return shade(col, 1.25);
          if (L.flecks && hash(x * 3 | 0, y * 3 | 0) > 0.85) return mix(col, 0xe8a040, 0.6);
          if (L.crumbs) return hash(x * 4 | 0, y * 4 | 0) > 0.5 ? col : shade(col, 0.85);
          if (L.shredded) return ((x * 2.3 + Math.sin(y * 4)) % 1) < 0.35 ? dark : col;
          if (L.crispy && d > 0.85 && hash(x * 5 | 0, y * 5 | 0) > 0.5) return -1;
          return hash(x * 3 | 0, y * 3 | 0) > 0.9 ? dark : (d > 0.86 ? shade(col, 0.8) : col);
        }
        return hash(x * 3 | 0, y * 3 | 0) > 0.85 ? dark : shade(col, 0.9);
      };
      if (L.split) {   // delad korv: två halvor sida vid sida med ljus snittyta
        for (const dy of [-0.55, 0.55]) R.box(cu - r * 0.95, cu + r * 0.95, cv + dy * r - r * 0.42, cv + dy * r + r * 0.42, z0, z0 + h, (f, x, y, W, Hh) => (f === 'top' ? (Math.abs(y - Hh / 2) < Hh * 0.28 ? shade(col, 1.3) : col) : (hash(x * 3 | 0, y * 3 | 0) > 0.88 ? dark : col)), id, { noEdges: true });
        return;
      }
      if (sq) R.box(cu - r * 0.9, cu + r * 0.9, cv - r * 0.9, cv + r * 0.9, z0, z0 + h, (f, x, y, W, Hh) => tex(f, x, y, W, Hh, 0), id, { noEdges: true });
      else disc(R, cu, cv, z0, z0 + h, r * 0.98, tex, id, { wave: L.crispy ? 0.05 : 0.02, waveN: 9, seed: 1 });
      return;
    }
    case 'cheese': {
      const s = L.round ? r * 0.7 : r * 0.82, h = layerHeight(part);
      const spots = L.spots ? H(L.spots) : null, rind = L.rind ? H(L.rind) : null;
      if (L.crumbled) {   // smulad ost: många små kuber
        for (let i = 0; i < 9; i++) { const x = cu - r * 0.7 + (i % 3) * r * 0.7 + hash(i, 1) * 0.5, y = cv - r * 0.7 + Math.floor(i / 3) * r * 0.7 + hash(i, 2) * 0.5, s2 = 0.35 + hash(i, 3) * 0.3; R.box(x, x + s2, y, y + s2, z0, z0 + 0.35, (f) => (f === 'top' ? col : shade(col, 0.88)), id, { noEdges: true }); }
        return;
      }
      if (L.flakes) {   // hyvlade flingor
        for (let i = 0; i < 7; i++) { const x = cu - r * 0.8 + hash(i, 4) * r * 1.5, y = cv - r * 0.8 + hash(i, 5) * r * 1.5, w = 0.6 + hash(i, 6) * 0.6; R.box(x, x + w, y, y + 0.35, z0 + (i % 2) * 0.08, z0 + 0.1 + (i % 2) * 0.08, () => (hash(i, 7) > 0.5 ? col : shade(col, 0.92)), id, { noEdges: true }); }
        return;
      }
      const tex = (f, x, y, W, Hh, d) => {
        if (L.grillmarks && f === 'top' && ((x + y) % 1.1) < 0.18) return shade(col, 0.6);
        if (rind && f === 'top' && d > 0.85) return rind;
        if (L.crumbs && f === 'top' && hash(x * 4 | 0, y * 4 | 0) > 0.6) return shade(col, 0.8);
        if (spots && hash(x * 2 | 0, y * 2 | 0) > 0.86) return spots;
        if (L.holes && hash(x * 1.5 | 0, y * 1.5 | 0) > 0.9) return shade(col, 0.75);
        if (L.drip && f !== 'top') return hash(x * 2 | 0, 1) > 0.5 ? col : -1;   // rinner ner längs sidorna
        return f === 'top' ? col : shade(col, 0.88);
      };
      if (L.round) disc(R, cu, cv, z0, z0 + (L.crumbs ? 0.5 : h), s, tex, id);
      else R.box(cu - s, cu + s, cv - s, cv + s, z0, z0 + h + (L.drip ? 0.2 : 0), (f, x, y, W, Hh) => {
        // smält ost: hörnen droppar av
        if (L.melt !== false && f === 'top') { const c = Math.min(x, W - x, y, Hh - y); if (c < 0.4 && hash(x * 3 | 0, y * 3 | 0) > 0.55) return -1; }
        return tex(f, x, y, W, Hh, Math.max(Math.abs(x - W / 2) / (W / 2), Math.abs(y - Hh / 2) / (Hh / 2)));
      }, id, { noEdges: true });
      return;
    }
    case 'strips': {
      const fat = H(L.fat || '#f0c8a8'), h = layerHeight(part);
      for (let i = 0; i < 3; i++) {
        const v0 = cv - r * 0.75 + i * r * 0.7, w = r * 0.42;
        R.box(cu - r * 0.9, cu + r * 0.9, v0, v0 + w, z0 + (i % 2) * 0.04, z0 + h, (f, x) => (Math.sin(x * 2.2 + i) > 0.4 ? fat : col), id, { noEdges: true });
      }
      return;
    }
    case 'egg': {
      const white = H(L.white || '#fbf6ea'), yolk = H(L.yolk || '#f2b01e');
      disc(R, cu, cv, z0, z0 + 0.25, r * 0.95, (f) => (f === 'top' ? white : shade(white, 0.9)), id, { wave: 0.08, waveN: 5, seed: 2 });
      disc(R, cu + 0.2, cv - 0.2, z0 + 0.25, z0 + 0.45, r * 0.38, (f, x, y, W, Hh, d) => (f === 'top' ? (d < 0.5 ? shade(yolk, 1.1) : yolk) : shade(yolk, 0.85)), id);
      return;
    }
    case 'rings': {
      const h = layerHeight(part);
      disc(R, cu, cv, z0, z0 + h, r * 0.92, (f, x, y, W, Hh, d) => (f === 'top' ? (d > 0.9 || d < 0.45 ? shade(col, 0.8) : hash(x * 3 | 0, y * 3 | 0) > 0.8 ? shade(col, 1.15) : col) : shade(col, 0.85)), id, { hole: L.hole ? 0.4 : 0 });
      return;
    }
    case 'avocado': {
      for (let i = 0; i < 4; i++) {
        const a = -0.6 + i * 0.55, x = cu + Math.cos(a) * r * 0.45, y = cv + Math.sin(a) * r * 0.45;
        disc(R, x, y, z0, z0 + 0.35, r * 0.42, (f, xx, yy, W, Hh, d) => (f === 'top' ? (d > 0.8 ? dark : d < 0.25 ? shade(col, 1.15) : col) : shade(col, 0.8)), id, { ry: r * 0.3 });
      }
      return;
    }
    case 'leaf': {
      const edge = H(L.edge || shade(col, 0.7)), h = layerHeight(part);
      disc(R, cu, cv, z0, z0 + h, r * 1.08, (f, x, y, W, Hh, d) => (f === 'top' ? (d > 0.82 ? edge : hash(x * 2 | 0, y * 2 | 0) > 0.8 ? shade(col, 1.12) : col) : (hash(x * 3 | 0, y * 2 | 0) > 0.5 ? edge : col)), id, { wave: L.wild ? 0.14 : 0.09, waveN: L.wild ? 9 : 7, seed: 3 });
      return;
    }
    case 'slice': {
      const inner = H(L.inner || shade(col, 1.3)), n = L.n || 2, rr = L.big ? r * 0.95 : L.small ? r * 0.32 : r * 0.55, h = layerHeight(part);
      for (let i = 0; i < n; i++) {
        const a = i * (Math.PI * 2 / n) + 0.7, x = n === 1 ? cu : cu + Math.cos(a) * r * (L.small ? 0.5 : 0.42), y = n === 1 ? cv : cv + Math.sin(a) * r * (L.small ? 0.5 : 0.42);
        disc(R, x, y, z0, z0 + h, rr, (f, xx, yy, W, Hh, d) => (f === 'top' ? (d > 0.82 ? col : d < 0.5 && hash(xx * 2 | 0, yy * 2 | 0) > 0.6 ? shade(inner, 1.1) : inner) : shade(col, 0.85)), id);
      }
      return;
    }
    case 'onion': {
      const ring = H(L.ring || shade(col, 0.8)), h = layerHeight(part);
      if (L.soft) { disc(R, cu, cv, z0, z0 + h, r * 0.9, (f, x, y, W, Hh) => (hash(x * 2 | 0, y * 2 | 0) > 0.55 ? ring : col), id, { wave: 0.1, waveN: 8, seed: 4 }); return; }
      for (const [dx, dy, rr] of [[-0.5, -0.4, 0.62], [0.7, 0.2, 0.5], [-0.2, 0.9, 0.42]]) {
        disc(R, cu + dx, cv + dy, z0, z0 + h, r * rr, (f, x, y, W, Hh, d) => (f === 'top' ? ((d * 8) % 2 < 0.8 ? ring : col) : shade(col, 0.9)), id, { hole: 0.3 });
      }
      return;
    }
    case 'pickles': {
      const h = layerHeight(part);
      for (const [dx, dy] of [[-0.9, -0.7], [0.9, -0.3], [-0.1, 1.0]]) {
        disc(R, cu + dx, cv + dy, z0, z0 + h, r * 0.36, (f, x, y, W, Hh, d) => (f === 'top' ? (L.ring ? (d < 0.4 ? shade(col, 1.4) : d > 0.85 ? shade(col, 0.7) : col) : (d < 0.35 ? shade(col, 1.25) : hash(x * 3 | 0, y * 3 | 0) > 0.8 ? shade(col, 0.8) : col)) : shade(col, 0.85)), id);
      }
      return;
    }
    case 'sauce': {
      const spots = L.spots ? H(L.spots) : null, h = layerHeight(part);
      disc(R, cu, cv, z0, z0 + h, r * 1.0, (f, x, y, W, Hh, d) => (spots && hash(x * 3 | 0, y * 3 | 0) > 0.9 ? spots : f === 'top' ? (d < 0.3 ? shade(col, 1.12) : col) : shade(col, 0.85)), id, { wave: L.drops ? 0.12 : 0.05, waveN: 5, seed: 5 });
      return;
    }
    case 'drizzle': {   // ringlad sås: sicksack-linjer
      const spots = L.spots ? H(L.spots) : null;
      for (let i = 0; i < 5; i++) { const v = cv - r * 0.8 + i * r * 0.4, x0 = cu - r * 0.85 + (i % 2) * 0.4; R.box(x0, x0 + r * 1.5, v, v + 0.22, z0, z0 + 0.1, (f, x) => (spots && hash(x * 4 | 0, i) > 0.7 ? spots : col), id, { noEdges: true }); }
      for (let i = 0; i < 4; i++) { const v = cv - r * 0.6 + i * r * 0.4, x0 = (i % 2) ? cu - r * 0.85 : cu + r * 0.45; R.box(x0, x0 + 0.22, v, v + r * 0.4, z0, z0 + 0.1, () => col, id, { noEdges: true }); }
      return;
    }
    case 'chunky': {
      const light = H(L.light || shade(col, 1.3)), h = layerHeight(part);
      disc(R, cu, cv, z0, z0 + h, r * 0.9, (f, x, y, W, Hh, d) => (hash(x * 2.5 | 0, y * 2.5 | 0) > (L.crisp ? 0.45 : 0.6) ? light : col), id, { wave: 0.12, waveN: 11, seed: 6 });
      return;
    }
    case 'square': {   // platt fyrkant (hash brown, tempeh)
      const h = layerHeight(part);
      slab(R, cu, cv, z0, z0 + h, r * 0.85, (f, x, y, W, Hh) => (f === 'top' ? (L.crumbs && hash(x * 4 | 0, y * 4 | 0) > 0.55 ? dark : hash(x * 3 | 0, y * 3 | 0) > 0.9 ? shade(col, 1.15) : col) : shade(col, 0.85)), id);
      return;
    }
    case 'herb': {   // hackade örter: små bitar utspridda
      for (let i = 0; i < 14; i++) { const x = cu - r * 0.85 + hash(i, 11) * r * 1.7, y = cv - r * 0.85 + hash(i, 12) * r * 1.7; R.box(x, x + 0.3, y, y + 0.3, z0, z0 + 0.12, () => (hash(i, 13) > 0.5 ? col : shade(col, 0.8)), id, { noEdges: true }); }
      return;
    }
  }
  disc(R, cu, cv, z0, z0 + layerHeight(part), r, () => col, id);
}
function bunTex(part, L, col, crust, top) {
  return (f, x, y, W, Hh, d) => {
    if (f !== 'top') return d > 0.4 && hash(x * 3 | 0, y * 3 | 0) > 0.85 ? shade(crust, 0.9) : crust;
    if (!top) { // snittytan: ljust inkråm med skorpa runt om
      if (d > 0.88) return crust;
      if (L.grain) return hash(x * 4 | 0, y * 4 | 0) > 0.6 ? 0xf8f6f0 : 0xe8e4d8;
      return hash(x * 3 | 0, y * 3 | 0) > 0.85 ? shade(0xf0dcb0, 0.92) : 0xf0dcb0;
    }
    if (L.lettuce) return hash(x * 2 | 0, y * 2 | 0) > 0.8 ? shade(col, 0.8) : col;
    if (L.glaze && d < 0.92) return hash(x * 3 | 0, y * 3 | 0) > 0.9 ? shade(H(L.glaze), 0.94) : H(L.glaze);
    if (L.waffle) return ((x * 1.6) % 1 < 0.35 || (y * 1.6) % 1 < 0.35) ? shade(col, 0.75) : col;
    if (L.noodles) return ((x * 2 + Math.sin(y * 3) * 0.8) % 1) < 0.4 ? shade(col, 0.8) : col;
    if (L.grain) return hash(x * 4 | 0, y * 4 | 0) > 0.6 ? 0xf8f6f0 : 0xe8e4d8;
    if (L.star && d < 0.85) { const a = Math.atan2(y - Hh / 2, x - W / 2); if (Math.abs(Math.sin(a * 2.5 + 0.3)) < 0.12) return shade(col, 0.72); }
    if (L.dimples && hash(x | 0, y | 0) > 0.7 && (x % 1) < 0.4 && (y % 1) < 0.4) return shade(col, 0.72);
    if (L.blister && hash(x * 1.5 | 0, y * 1.5 | 0) > 0.85) return shade(col, 0.55);
    if (L.herbs && hash(x * 3 | 0, y * 3 | 0) > 0.86) return 0x4a8a3a;
    if (L.sesame && hash(x * 2.5 | 0, y * 2.5 | 0) > 0.86) return 0xf6ecd0;
    if (L.poppy && hash(x * 3 | 0, y * 3 | 0) > 0.82) return 0x2a2a30;
    if (L.seeds && hash(x * 3 | 0, y * 3 | 0) > 0.85) return 0x6a4a2a;
    if (L.salt && hash(x * 3 | 0, y * 3 | 0) > 0.9) return 0xffffff;
    if (L.flour && hash(x * 1.5 | 0, y * 1.5 | 0) > 0.7) return shade(col, 1.15);
    if (L.bao) return d < 0.3 ? shade(col, 1.03) : col;
    return d < 0.35 && L.gloss ? shade(col, 1.18) : col;
  };
}
function drawBunBottom(R, part, cu, cv, z0, r, id) {
  const L = part.look || {}, col = H(L.color), crust = H(L.crust || shade(col, 0.8)), h = layerHeight(part);
  if (L.lettuce) { disc(R, cu, cv, z0, z0 + h, r * 1.1, bunTex(part, L, col, crust, true), id, { wave: 0.14, waveN: 7, seed: 7 }); return; }
  if (L.square) { slab(R, cu, cv, z0, z0 + h, r * 0.95, bunTex(part, L, col, crust, false), id); return; }
  disc(R, cu, cv, z0, z0 + h, r, bunTex(part, L, col, crust, false), id, { hole: L.hole ? 0.3 : 0 });
}
function drawBunTop(R, part, cu, cv, z0, r, id) {
  const L = part.look || {}, col = H(L.color), crust = H(L.crust || shade(col, 0.8)), tex = bunTex(part, L, col, crust, true);
  if (L.lettuce) { disc(R, cu, cv, z0, z0 + 0.5, r * 1.1, tex, id, { wave: 0.14, waveN: 7, seed: 8 }); return; }
  if (L.flat) { disc(R, cu, cv, z0, z0 + 0.5, r, tex, id); return; }
  if (L.square) { slab(R, cu, cv, z0, z0 + 0.5, r * 0.95, (f, x, y, W, Hh, d) => (f === 'top' ? (hash(x * 3 | 0, y * 3 | 0) > 0.85 ? shade(crust, 1.1) : d > 0.9 ? shade(crust, 0.9) : col) : crust), id); return; }
  const total = bunTopHeight(part), steps = L.bao ? [[1, 0.3], [0.96, 0.25], [0.86, 0.2], [0.66, 0.15], [0.36, 0.1]] : [[1, 0.3], [0.95, 0.2], [0.87, 0.16], [0.75, 0.12], [0.6, 0.1], [0.42, 0.07], [0.2, 0.05]];
  let z = z0;
  for (const [f, hf] of steps) { const h = total * hf; if (L.hole && 0.3 / f >= 0.95) break; disc(R, cu, cv, z, z + h, r * f, (ff, x, y, W, Hh, d) => (ff === 'top' && f < 1 ? tex('top', x, y, W, Hh, d * f) : ff === 'top' ? tex('top', x, y, W, Hh, d) : L.glaze ? H(L.glaze) : crust), id, { hole: L.hole ? 0.3 / f : 0 }); z += h; }
}

// ---------- Tillbehör, drycker, efterrätter ----------
export function drawSide(R, part, o) {
  const L = part.look || {}, [cu, cv, z0] = o.at, id = o.id || 0, col = H(L.color || '#f0c050');
  const paper = 0xd9322a;
  const pocket = () => R.box(cu - 2.2, cu + 2.2, cv - 1.4, cv + 1.4, z0, z0 + 2.0, (f, x, y, W, Hh) => (f === 'top' ? -1 : (Hh - y < 0.25 ? shade(paper, 0.7) : y < 0.3 ? shade(paper, 1.15) : hash(x * 4 | 0, y * 4 | 0) > 0.9 ? shade(paper, 1.1) : paper)), id, { noEdges: true });
  const blobs = (cols, z) => { for (let i = 0; i < 8; i++) { const c = H(cols[i % cols.length]), x = cu - 1.6 + hash(i, 21) * 3.0, y = cv - 0.9 + hash(i, 22) * 1.6; disc(R, x, y, z, z + 0.25, 0.45 + hash(i, 23) * 0.3, (f) => (f === 'top' ? c : shade(c, 0.85)), id); } };
  if (L.shape === 'fries' || L.shape === 'nuggets') {
    pocket();
    if (L.shape === 'fries') {
      if (L.waffle) {   // rutiga plattor
        for (let i = 0; i < 6; i++) { const x = cu - 1.6 + (i % 3) * 1.1, y = cv - 0.9 + Math.floor(i / 3) * 1.0, zz = z0 + 1.2 + (i % 2) * 0.5; R.box(x, x + 1.0, y, y + 0.9, zz, zz + 0.25, (f, xx, yy) => (f === 'top' && ((xx * 3 | 0) % 2 === 0 && (yy * 3 | 0) % 2 === 0) ? -1 : hash(xx * 4 | 0, yy * 4 | 0) > 0.85 ? shade(col, 0.8) : col), id, { noEdges: true }); }
      } else {
        const n = L.wedges ? 6 : L.big ? 15 : 11, w = L.wedges ? 0.8 : L.thick ? 0.6 : 0.42, top = z0 + (L.big ? 3.6 : 2.6);
        for (let i = 0; i < n; i++) {
          const x = cu - 1.7 + (i % 6) * 0.68 + hash(i, 1) * 0.2, y = cv - 0.8 + Math.floor(i / 6) * 0.9 + hash(i, 2) * 0.5, h = top + hash(i, 3) * 1.1;
          R.box(x, x + w, y, y + w * 0.8, z0 + 0.6, h, (f, xx, yy) => (f === 'top' ? shade(col, 1.15) : (L.curly && (yy * 3 | 0) % 2 ? shade(col, 0.8) : hash(xx * 6 | 0, yy * 6 | 0) > 0.85 ? shade(col, 0.8) : col)), id, { noEdges: true });
        }
      }
      if (L.truffle) for (let i = 0; i < 6; i++) { const x = cu - 1.5 + hash(i, 7) * 3, y = cv - 1 + hash(i, 8) * 2; R.box(x, x + 0.25, y, y + 0.25, z0 + 3.2, z0 + 3.3, () => 0x3a2a1a, id, { noEdges: true }); }
      if (L.topping) blobs(L.topping, z0 + 3.0);
    } else if (L.tots) {
      for (let i = 0; i < 7; i++) disc(R, cu - 1.4 + (i % 4) * 0.95, cv - 0.6 + Math.floor(i / 4) * 1.0, z0 + 1.2 + (i > 3 ? 0.4 : 0), z0 + 2.0 + (i > 3 ? 0.4 : 0), 0.5, (f, x, y) => (hash(x * 4 | 0, y * 4 | 0) > 0.8 ? shade(col, 0.82) : f === 'top' ? shade(col, 1.1) : col), id);
    } else if (L.wings) {
      for (let i = 0; i < 5; i++) { const x = cu - 1.7 + (i % 3) * 1.2, y = cv - 0.9 + Math.floor(i / 3) * 1.1; R.box(x, x + 1.4, y, y + 0.6, z0 + 1.2 + (i % 2) * 0.3, z0 + 2.0 + (i % 2) * 0.3, (f, xx, yy) => (hash(xx * 4 | 0, yy * 4 | 0) > 0.75 ? shade(col, 0.7) : f === 'top' ? shade(col, 1.1) : col), id, { noEdges: true }); }
    } else if (L.flat) {
      for (let i = 0; i < 3; i++) R.box(cu - 1.5, cu + 1.5, cv - 0.9 + i * 0.7, cv - 0.3 + i * 0.7, z0 + 1.2 + i * 0.35, z0 + 1.6 + i * 0.35, (f, x, y) => (hash(x * 4 | 0, y * 4 | 0) > 0.7 ? shade(col, 0.8) : f === 'top' ? shade(col, 1.1) : col), id, { noEdges: true });
    } else {
      const n = L.sticks ? 4 : L.small ? 7 : 5;
      for (let i = 0; i < n; i++) {
        const x = cu - 1.6 + (i % 3) * 1.1 + hash(i, 4) * 0.3, y = cv - 0.9 + Math.floor(i / 3) * 1.0, s = L.sticks ? 0.6 : L.small ? 0.7 : 1.1;
        R.box(x, x + (L.sticks ? 0.5 : s), y, y + s * 0.8, z0 + 1.2, z0 + (L.sticks ? 3.4 : 2.4), (f, xx, yy) => (hash(xx * 4 | 0, yy * 4 | 0) > 0.8 ? shade(col, 0.82) : f === 'top' ? shade(col, 1.1) : col), id, { noEdges: true });
      }
    }
    return;
  }
  if (L.shape === 'ringbasket') {
    R.box(cu - 2.3, cu + 2.3, cv - 1.6, cv + 1.6, z0, z0 + 0.4, () => 0xd8cfb8, id, { noEdges: true });   // korg
    for (let i = 0; i < 5; i++) disc(R, cu - 1.3 + (i % 3) * 1.3, cv - 0.5 + Math.floor(i / 3) * 1.0, z0 + 0.4 + (i > 2 ? 0.5 : 0), z0 + 0.9 + (i > 2 ? 0.5 : 0), 1.1, (f, x, y, W, Hh, d) => (f === 'top' ? (hash(x * 3 | 0, y * 3 | 0) > 0.8 ? shade(col, 0.8) : col) : shade(col, 0.85)), id, { hole: 0.45 });
    return;
  }
  if (L.shape === 'salad') {
    const bits = (L.bits || ['#e0392e']).map(H);
    disc(R, cu, cv, z0, z0 + 1.2, 2.2, (f, x, y, W, Hh, d) => (f === 'top' ? (d > 0.86 ? 0xf0ece0 : hash(x * 2 | 0, y * 2 | 0) > 0.7 ? shade(col, 0.75) : hash(x * 3 | 0, y * 3 | 0) > 0.86 ? bits[(x * 7 + y * 3 | 0) % bits.length] : col) : 0xf0ece0), id);
    return;
  }
  if (L.shape === 'corn') {
    R.box(cu - 2.4, cu + 2.4, cv - 0.7, cv + 0.7, z0, z0 + 1.2, (f, x, y) => ((x * 4 | 0) % 2 === (y * 4 | 0) % 2 ? col : shade(col, 0.85)), id, { noEdges: true });
    return;
  }
  if (L.shape === 'mash') {   // kulle av mos i skål med smörklick
    disc(R, cu, cv, z0, z0 + 0.5, 2.2, (f, x, y, W, Hh, d) => (f === 'top' ? (d > 0.85 ? 0xf0ece0 : col) : 0xf0ece0), id);
    for (let i = 0; i < 3; i++) disc(R, cu, cv, z0 + 0.5 + i * 0.4, z0 + 0.9 + i * 0.4, 1.8 - i * 0.5, (f, x, y) => (hash(x * 3 | 0, y * 3 | 0) > 0.85 ? shade(col, 0.92) : col), id, { wave: 0.08, waveN: 6, seed: i });
    disc(R, cu, cv, z0 + 1.7, z0 + 1.95, 0.45, () => 0xf0c030, id);
    return;
  }
  if (L.shape === 'bag') {   // chipspåse: stående med etikett
    const label = H(L.label || '#c02020');
    R.box(cu - 1.3, cu + 1.3, cv - 0.6, cv + 0.6, z0, z0 + 3.6, (f, x, y, W, Hh) => (f === 'top' ? shade(col, 0.8) : (y > 1.0 && y < 2.4 && x > 0.4 && x < W - 0.4 ? label : y < 0.3 || Hh - y < 0.3 ? shade(col, 0.8) : hash(x * 3 | 0, y * 3 | 0) > 0.9 ? shade(col, 1.1) : col)), id, { noEdges: true });
    return;
  }
  if (L.shape === 'sticks') {   // grönsaksstavar i en mugg
    const cols = (L.colors || ['#f08a2a']).map(H), cup = 0xf4f1ea;
    disc(R, cu, cv, z0, z0 + 2.0, 1.3, (f, x, y, W, Hh, d) => (f === 'top' ? (d > 0.8 ? cup : 0xe8e0a0) : cup), id);
    for (let i = 0; i < 6; i++) { const c = cols[i % cols.length], x = cu - 0.8 + hash(i, 31) * 1.4, y = cv - 0.8 + hash(i, 32) * 1.4; R.box(x, x + 0.3, y, y + 0.3, z0 + 1.5, z0 + 3.4 + hash(i, 33) * 0.8, () => c, id, { noEdges: true }); }
    return;
  }
  if (L.shape === 'potato') {   // bakad potatis med smör
    disc(R, cu, cv, z0, z0 + 1.4, 2.0, (f, x, y, W, Hh, d) => (f === 'top' ? (d < 0.55 ? (hash(x * 3 | 0, y * 3 | 0) > 0.8 ? 0xf0e8c8 : 0xfbf6e0) : hash(x * 3 | 0, y * 3 | 0) > 0.8 ? shade(col, 0.8) : col) : shade(col, 0.9)), id, { ry: 1.3 });
    disc(R, cu, cv, z0 + 1.4, z0 + 1.65, 0.4, () => 0xf0c030, id);
    return;
  }
  if (L.shape === 'nachos') {   // korg med chips och ostsås
    R.box(cu - 2.3, cu + 2.3, cv - 1.6, cv + 1.6, z0, z0 + 0.4, () => 0xd8cfb8, id, { noEdges: true });
    for (let i = 0; i < 9; i++) { const x = cu - 1.9 + (i % 3) * 1.3 + hash(i, 41) * 0.3, y = cv - 1.3 + Math.floor(i / 3) * 0.9, zz = z0 + 0.4 + (i % 3) * 0.3; R.box(x, x + 1.1, y, y + 0.8, zz, zz + 0.15, (f, xx, yy, W, Hh) => (f === 'top' && xx + yy > W ? -1 : hash(xx * 4 | 0, yy * 4 | 0) > 0.85 ? shade(col, 0.85) : col), id, { noEdges: true }); }
    if (L.topping) blobs(L.topping, z0 + 1.3);
    return;
  }
  if (L.shape === 'cup') return drawCup(R, part, cu, cv, z0, id);
  if (L.shape === 'dessert') return drawDessert(R, part, cu, cv, z0, id);
  disc(R, cu, cv, z0, z0 + 1, 2, () => col, id);
}
export function drawCup(R, part, cu, cv, z0, id) {
  const L = part.look || {}, cup = H(L.cup || '#f4f1ea'), drink = H(L.color || '#3a1a12');
  if (L.can) { disc(R, cu, cv, z0, z0 + 3.4, 1.3, (f, x, y, W, Hh) => (f === 'top' ? 0xc8ccd0 : y < 0.3 || Hh - y < 0.3 ? 0xc8ccd0 : (y > 1 && y < 2.2 && x > W * 0.3 && x < W * 0.7 ? drink : cup)), id); return; }
  if (L.bottle) {
    disc(R, cu, cv, z0, z0 + 3.2, 1.2, (f, x, y, W, Hh) => (f === 'top' ? shade(drink, 1.2) : (y > 0.9 && y < 2.1 ? cup : shade(drink, 1.15))), id);
    disc(R, cu, cv, z0 + 3.2, z0 + 4.4, 0.55, (f) => (f === 'top' ? 0xc8ccd0 : shade(drink, 1.15)), id);
    return;
  }
  if (L.box) { R.box(cu - 1.1, cu + 1.1, cv - 0.8, cv + 0.8, z0, z0 + 3.4, (f, x, y, W, Hh) => (f === 'top' ? cup : (y > 1 && y < 2.4 && x > 0.3 && x < W - 0.3 ? drink : cup)), id, { noEdges: true }); R.box(cu + 0.4, cu + 0.55, cv - 0.1, cv + 0.05, z0 + 3.4, z0 + 5.2, () => 0xffffff, id, { noEdges: true }); return; }
  if (L.hot) {
    disc(R, cu, cv, z0, z0 + 2.6, 1.4, (f, x, y, W, Hh, d) => (f === 'top' ? (d > 0.82 ? cup : drink) : cup), id);
    R.box(cu + 1.3, cu + 2.0, cv - 0.3, cv + 0.3, z0 + 0.8, z0 + 2.0, () => cup, id, { noEdges: true });   // handtag
    return;
  }
  if (L.glass) {   // genomskinligt glas: drycken syns, ljus kant upptill
    disc(R, cu, cv, z0, z0 + 3.2, 1.2, (f, x, y, W, Hh, d) => (f === 'top' ? (d > 0.85 ? 0xdde6ee : shade(drink, 1.05)) : (y < 0.35 ? 0xdde6ee : x < 0.35 ? shade(drink, 1.25) : shade(drink, 0.95))), id);
    return;
  }
  if (L.slush) {   // slushmugg med kupollock
    disc(R, cu, cv, z0, z0 + 3.4, 1.4, (f, x, y, W, Hh, d) => (f === 'top' ? -1 : (y < 0.3 ? 0xdde6ee : y > 0.5 && y < 2.4 && x > 0.3 && x < W - 0.3 ? drink : cup)), id);
    for (let i = 0; i < 3; i++) disc(R, cu, cv, z0 + 3.4 + i * 0.45, z0 + 3.85 + i * 0.45, 1.4 - i * 0.4, (f, x, y, W, Hh, d) => (f === 'top' ? shade(drink, 1.25 - d * 0.2) : shade(drink, 1.15)), id);
    R.box(cu + 0.2, cu + 0.42, cv - 0.5, cv - 0.3, z0 + 4.5, z0 + 6.2, () => 0xe03a6a, id, { noEdges: true });
    return;
  }
  if (L.pearls) {   // bubble tea: pärlor i botten, brett sugrör
    disc(R, cu, cv, z0, z0 + 4.0, 1.4, (f, x, y, W, Hh, d) => (f === 'top' ? (d > 0.85 ? 0xdde6ee : shade(drink, 1.05)) : (y < 0.3 ? 0xdde6ee : Hh - y < 1.1 && hash(x * 3 | 0, y * 3 | 0) > 0.45 ? 0x2a1a14 : shade(drink, 0.98))), id);
    R.box(cu - 0.2, cu + 0.3, cv - 0.4, cv - 0.1, z0 + 4.0, z0 + 6.0, () => 0xf0a0c0, id, { noEdges: true });
    return;
  }
  const hgt = L.shake ? 4.6 : 4.0;
  disc(R, cu, cv, z0, z0 + hgt * 0.35, 1.35, (f, x, y, W, Hh) => (f === 'top' ? -1 : (hash(x * 3 | 0, y * 3 | 0) > 0.9 ? shade(cup, 0.85) : cup)), id);
  disc(R, cu, cv, z0 + hgt * 0.35, z0 + hgt, 1.55, (f, x, y, W, Hh, d) => (f === 'top' ? (L.shake ? (d < 0.7 ? 0xfaf6ee : cup) : d > 0.9 ? cup : d < 0.12 ? 0xffffff : shade(cup, 0.95)) : (y < 0.25 ? shade(cup, 1.1) : hash(x * 3 | 0, y * 3 | 0) > 0.9 ? shade(cup, 0.85) : L.ice && y > 1 && y < 2 ? drink : cup)), id);
  if (L.shake) disc(R, cu, cv, z0 + hgt, z0 + hgt + 0.7, 0.9, (f, x, y, W, Hh, d) => (f === 'top' ? (d < 0.4 ? 0xe0392e : 0xfaf6ee) : 0xfaf6ee), id);
  R.box(cu + 0.4, cu + 0.62, cv - 0.6, cv - 0.4, z0 + hgt, z0 + hgt + 2.0, () => (L.shake ? 0xe0392e : 0xd8dce0), id, { noEdges: true });   // sugrör
}
export function drawDessert(R, part, cu, cv, z0, id) {
  const L = part.look || {}, col = H(L.color || '#d8a050'), top = H(L.top || shade(col, 0.8)), cream = 0xfaf6ee;
  const swirl = (z, n, r0) => { for (let i = 0; i < n; i++) disc(R, cu, cv, z + i * 0.6, z + 0.6 + i * 0.6, r0 - i * 0.3, (f, x, y, W, Hh, d) => (f === 'top' ? (L.sprinkles && hash(x * 3 | 0, y * 3 | 0) > 0.8 ? [0xe04a8a, 0x3a8ae0, 0xf0c030][(x * 5 | 0) % 3] : L.dip && i >= n - 2 ? H(L.dip) : col) : (L.dip && i >= n - 2 ? H(L.dip) : shade(col, 0.92))), id); };
  switch (L.form) {
    case 'cone': disc(R, cu, cv, z0, z0 + 2.2, 0.9, (f) => (f === 'top' ? -1 : (f === 'left' ? shade(H(L.cone || '#d8a050'), 0.9) : H(L.cone || '#d8a050'))), id); swirl(z0 + 2.2, 4, 1.4); return;
    case 'scoops': disc(R, cu, cv, z0, z0 + 2.2, 0.9, (f) => (f === 'top' ? -1 : (f === 'left' ? shade(0xd8a050, 0.9) : 0xd8a050)), id); disc(R, cu, cv, z0 + 2.2, z0 + 3.4, 1.3, (f, x, y) => (hash(x * 3 | 0, y * 3 | 0) > 0.85 ? shade(col, 0.9) : col), id); disc(R, cu, cv, z0 + 3.4, z0 + 4.5, 1.1, (f, x, y) => (hash(x * 3 | 0, y * 3 | 0) > 0.85 ? shade(top, 0.9) : top), id); return;
    case 'ring': disc(R, cu, cv, z0, z0 + 1.0, 2.0, (f, x, y, W, Hh, d) => (f === 'top' ? (d > 0.5 && hash(x * 3 | 0, y * 3 | 0) > 0.9 ? 0xffffff : top) : col), id, { hole: 0.4 }); return;
    case 'slab': R.box(cu - 1.8, cu + 1.8, cv - 1.4, cv + 1.4, z0, z0 + 1.1, (f, x, y) => (hash(x * 3 | 0, y * 3 | 0) > 0.85 ? top : col), id, { noEdges: true }); if (L.scoop) disc(R, cu + 0.4, cv - 0.2, z0 + 1.1, z0 + 2.2, 1.0, (f) => (f === 'top' ? top : shade(top, 0.9)), id); return;
    case 'disc': disc(R, cu, cv, z0, z0 + 0.5, 2.0, (f, x, y, W, Hh) => (hash(x * 2.5 | 0, y * 2.5 | 0) > 0.82 ? top : col), id); return;
    case 'sticks': for (let i = 0; i < 3; i++) R.box(cu - 2.5, cu + 2.5, cv - 1.2 + i * 0.9, cv - 0.6 + i * 0.9, z0 + i * 0.1, z0 + 0.6 + i * 0.1, (f, x, y) => ((x * 3 | 0) % 2 ? shade(col, 0.85) : col), id, { noEdges: true }); R.box(cu + 0.5, cu + 2.4, cv - 0.5, cv + 1.6, z0, z0 + 1.6, (f, x, y, W, Hh) => (f === 'top' ? top : 0xf4f1ea), id, { noEdges: true }); return;
    case 'cup': disc(R, cu, cv, z0, z0 + 1.6, 1.4, (f, x, y, W, Hh) => (f === 'top' ? -1 : 0xdfe4ea), id); disc(R, cu, cv, z0 + 1.4, z0 + 2.6, 1.5, (f, x, y, W, Hh, d) => (f === 'top' ? (d < 0.5 ? top : hash(x * 4 | 0, y * 4 | 0) > 0.85 ? 0xe0392e : col) : col), id); return;
    case 'wedge': R.box(cu - 1.5, cu + 1.5, cv - 1.8, cv + 1.8, z0, z0 + 1.2, (f, x, y, W, Hh) => (f === 'top' ? (x + y * 0.8 > W ? -1 : hash(x * 3 | 0, y * 3 | 0) > 0.75 ? top : col) : (y < 0.25 ? col : shade(col, 0.85))), id, { noEdges: true }); return;
    case 'bun': disc(R, cu, cv, z0, z0 + 1.2, 1.9, (f, x, y, W, Hh, d) => (f === 'top' ? (((d * 6) % 2) < 0.7 ? top : hash(x * 3 | 0, y * 3 | 0) > 0.85 ? 0xffffff : col) : shade(col, 0.85)), id); return;
    case 'ball': for (let i = 0; i < 3; i++) disc(R, cu, cv, z0 + i * 0.5, z0 + 0.5 + i * 0.5, 1.4 - i * 0.45, (f, x, y) => (hash(x * 3 | 0, y * 3 | 0) > 0.7 ? top : col), id); return;
    case 'stick': R.box(cu - 0.2, cu + 0.2, cv - 0.15, cv + 0.15, z0, z0 + 1.6, () => 0xd8b880, id, { noEdges: true }); R.box(cu - 1.0, cu + 1.0, cv - 0.5, cv + 0.5, z0 + 1.4, z0 + 4.6, (f, x, y, W, Hh) => (L.inner && f !== 'top' && y > 2.0 && x > 0.5 && x < W - 0.5 ? H(L.inner) : hash(x * 3 | 0, y * 3 | 0) > 0.9 ? shade(col, 1.1) : col), id, { noEdges: true }); return;
    case 'roll': R.box(cu - 2.2, cu + 2.2, cv - 0.7, cv + 0.7, z0, z0 + 1.3, (f, x, y, W) => (f !== 'top' && (x < 0.7 || x > W - 0.7) ? top : x < 0.7 || x > W - 0.7 ? top : hash(x * 3 | 0, y * 3 | 0) > 0.9 ? shade(col, 1.1) : col), id, { noEdges: true }); return;
    case 'split': R.box(cu - 2.6, cu + 2.6, cv - 1.3, cv + 1.3, z0, z0 + 0.6, (f, x, y, W, Hh) => (f === 'top' ? (Math.min(x, W - x, y, Hh - y) < 0.3 ? 0xdfe4ea : 0xf0e060) : 0xdfe4ea), id, { noEdges: true }); for (let i = 0; i < 3; i++) disc(R, cu - 1.5 + i * 1.5, cv, z0 + 0.6, z0 + 1.7, 0.8, (f, x, y, W, Hh, d) => (f === 'top' && d < 0.4 ? top : [col, 0xf0a0c0, 0x5a3a2a][i]), id); return;
    case 'waffle': R.box(cu - 2.2, cu + 2.2, cv - 1.6, cv + 1.6, z0, z0 + 0.5, (f, x, y) => (f === 'top' && ((x * 2.2 | 0) % 2 === 0 && (y * 2.2 | 0) % 2 === 0) ? shade(col, 0.7) : col), id, { noEdges: true }); disc(R, cu + 0.6, cv, z0 + 0.5, z0 + 1.6, 1.0, (f) => (f === 'top' ? top : shade(top, 0.9)), id); disc(R, cu - 1.2, cv + 0.4, z0 + 0.5, z0 + 0.75, 0.6, () => 0xc82a3a, id); return;
    case 'muffin': R.box(cu - 1.2, cu + 1.2, cv - 1.2, cv + 1.2, z0, z0 + 1.4, (f, x) => (f === 'top' ? shade(col, 1.05) : ((x * 3 | 0) % 2 ? 0xf4f1ea : 0xe8e0d0)), id, { noEdges: true }); disc(R, cu, cv, z0 + 1.4, z0 + 2.4, 1.5, (f, x, y, W, Hh, d) => (f === 'top' ? (hash(x * 3 | 0, y * 3 | 0) > 0.8 ? shade(top, 0.9) : top) : shade(top, 0.9)), id); return;
    case 'macaron': for (let i = 0; i < 3; i++) { const c = [col, top, 0xf0e060][i], x = cu - 1.4 + i * 1.4; disc(R, x, cv, z0, z0 + 0.35, 0.75, (f) => c, id); disc(R, x, cv, z0 + 0.35, z0 + 0.55, 0.65, () => cream, id); disc(R, x, cv, z0 + 0.55, z0 + 0.9, 0.75, (f) => c, id); } return;
  }
  disc(R, cu, cv, z0, z0 + 1, 1.8, () => col, id);
}

// ---------- Köket runt burgaren ----------
export function drawTray(R, u0, u1, v0, v1, era = null, z1 = 0, id = 0) {
  const red = era?.trim ?? 0xc9322a;
  R.box(u0, u1, v0, v1, z1 - 0.35, z1, (f, x, y, W, Hh) => {
    if (f === 'top') {
      const e = Math.min(x, W - x, y, Hh - y);
      if (e < 0.35) return shade(red, 1.15);
      if (e < 0.6) return shade(red, 0.78);
      // brickunderlägg i papper
      if (x > 1.4 && x < W - 1.4 && y > 1.1 && y < Hh - 1.1) return hash(x * 2 | 0, y * 2 | 0) > 0.93 ? 0xe8e0d0 : 0xf4efe4;
      return red;
    }
    return y < 0.1 ? shade(red, 1.1) : shade(red, 0.8);
  }, id, { noEdges: true });
}
export function drawToaster(R, u0, v0, id, on) {
  const chrome = 0xd8dce0;
  R.box(u0, u0 + 4, v0, v0 + 4, 0, 2.2, (f, x, y, W, Hh) => {
    if (f === 'top') { if ((x > 0.6 && x < 1.4) || (x > 2.6 && x < 3.4)) return y > 0.4 && y < Hh - 0.4 ? (on ? 0xe07a2a : 0x1a1a1e) : chrome; return chrome; }
    if (f === 'left' && x > 3.3 && x < 3.8 && y > 1.2 && y < 1.9) return 0x1a1a1e;   // spak
    return y < 0.15 ? 0xffffff : shade(chrome, 0.9 - y * 0.05);
  }, id, { noEdges: true });
  if (on) for (const x of [u0 + 1, u0 + 3]) R.box(x - 0.35, x + 0.35, v0 + 0.6, v0 + 3.4, 2.2, 3.0, (f) => (f === 'top' ? 0xd9a55d : 0xb8823f), id, { noEdges: true });
}
export function drawGrill(R, u0, v0, id, patty, state) {
  const iron = 0x2a2b2e;
  R.box(u0, u0 + 5.5, v0, v0 + 6, 0, 0.9, (f, x, y, W, Hh) => {
    if (f === 'top') { if (x < 0.25 || x > W - 0.25 || y < 0.25 || y > Hh - 0.25) return 0x4a4c50; return ((y * 2) % 1) < 0.28 ? 0x111214 : (hash(x * 4 | 0, y * 4 | 0) > 0.9 ? 0x3a3b3e : iron); }
    return 0x4a4c50;
  }, id, { noEdges: true });
  if (patty && state > 0) {
    const L = patty.look || {}, raw = state < 2, col = raw ? mix(H(L.color), 0xe08080, 0.55) : H(L.color), dark = H(L.dark || shade(col, 0.6));
    disc(R, u0 + 2.75, v0 + 3, 0.9, 0.9 + layerHeight(patty), burgerRadius(patty) * 0.95, (f, x, y, W, Hh) => (f === 'top' ? (!raw && ((x + y) % 1.1) < 0.18 ? shade(dark, 0.7) : hash(x * 3 | 0, y * 3 | 0) > 0.9 ? dark : col) : shade(col, 0.9)), id);
    if (!raw) for (let i = 0; i < 3; i++) R.box(u0 + 1.5 + i * 1.2, u0 + 1.7 + i * 1.2, v0 + 2.6, v0 + 2.8, 1.8 + i * 0.4, 2.4 + i * 0.4, () => 0xd8dce0, id, { alpha: 0.35, noEdges: true });   // ånga
  }
}

// ---------- Ikoner ----------
const ICONS = new Map();
export function iconCanvas(part, W = 64, H = 54) {
  const key = part.id + ':' + W + 'x' + H;
  let src = ICONS.get(key);
  if (!src) {
    const R = new Raster(200, 150); Object.assign(R, { k: 12, hz: 10, ox: 100, oy: 40, edges: false });
    R.clear();
    const at = [5, 5, 0], o = { id: 1, at, r: 3 };
    if (['brod', 'biff', 'ost', 'extra', 'gront', 'sas'].includes(part.cat)) {
      if (part.cat === 'brod') { drawBunBottom(R, part, 5, 5, 0, 3, 1); drawBunTop(R, part, 5, 5, layerHeight(part) + 0.35, 3, 1); }
      else drawLayer(R, part, o);
    } else drawSide(R, part, o);
    R.flush();
    // beskär till innehållet
    const d = R.data; let x0 = R.w, y0 = R.h, x1 = -1, y1 = -1;
    for (let y = 0; y < R.h; y++) for (let x = 0; x < R.w; x++) if (d[(y * R.w + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) { x0 = 0; y0 = 0; x1 = R.w - 1; y1 = R.h - 1; }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, f = Math.min((W - 2) / bw, (H - 2) / bh);
    const up = f >= 2 ? Math.min(4, Math.floor(f)) : f;
    const dw = Math.min(W, bw * up), dh = Math.min(H, bh * up);
    src = document.createElement('canvas'); src.width = W; src.height = H;
    const cx = src.getContext('2d'); cx.imageSmoothingEnabled = up < 1;
    cx.drawImage(R.canvas, x0, y0, bw, bh, Math.round((W - dw) / 2), Math.round((H - dh) / 2), dw, dh);
    ICONS.set(key, src);
  }
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  c.getContext('2d').drawImage(src, 0, 0);
  return c;
}

// ---------- Köksstationerna: fritös och dryckesmaskin (epokens stil) ----------
// fritös: rostfri låda med två oljekar; korgen hänger på kroken (state 0), ligger i oljan (1)
// eller är upplyft med gyllene pommes (2)
export function drawFryer(R, u0, v0, id, era, state = 0, fries = true) {
  const steel = era?.steel ?? 0xc8ccd6, trim = era?.trim ?? 0xc92a2a;
  R.box(u0, u0 + 4.5, v0, v0 + 4.5, 0, 2.2, (f, x, y, W, Hh) => {
    if (f === 'top') {
      const inVat = (x > 0.5 && x < 2.0 && y > 0.6 && y < 3.9) || (x > 2.5 && x < 4.0 && y > 0.6 && y < 3.9);
      if (inVat) return hash(x * 4 | 0, y * 4 | 0) > 0.85 ? 0xe8b850 : 0xd8a040;   // olja
      return x < 0.15 || y < 0.15 || x > W - 0.15 || y > Hh - 0.15 ? shade(steel, 0.8) : steel;
    }
    if (f === 'left' && y > 1.6 && y < 2.0 && x > 0.4 && x < 4.1) return trim;   // reglagelist
    if (f === 'left' && y > 1.7 && y < 1.9 && ((x > 0.8 && x < 1.1) || (x > 1.6 && x < 1.9))) return 0x2a2d36;
    return y < 0.12 ? shade(steel, 1.15) : shade(steel, 0.92 - y * 0.03);
  }, id, { noEdges: true });
  // korgen
  const bu = u0 + 0.6, bv = v0 + 0.8;
  const basket = (z0, golden) => {
    R.box(bu, bu + 1.3, bv, bv + 3.0, z0, z0 + 0.8, (f, x, y, W, Hh) => {
      if (f === 'top') return golden && !(x < 0.15 || y < 0.15 || x > W - 0.15 || y > Hh - 0.15) ? (hash(x * 5 | 0, y * 5 | 0) > 0.5 ? 0xf0c050 : 0xe8b040) : ((x * 4 | 0) % 2 === (y * 4 | 0) % 2 ? 0x8a8f9c : -1);
      return ((x * 4 | 0) + (y * 4 | 0)) % 2 ? 0x8a8f9c : 0x6a6f7a;
    }, id, { noEdges: true });
    // handtag
    R.box(bu + 0.55, bu + 0.75, bv + 3.0, bv + 4.4, z0 + 0.6, z0 + 0.75, () => 0x2a2d36, id, { noEdges: true });
  };
  if (!fries) return;
  if (state === 0) basket(2.6, false);          // hänger på kroken ovanför oljan
  else if (state === 1) { basket(1.6, false); for (let i = 0; i < 5; i++) R.box(bu + 0.2 + i * 0.22, bu + 0.32 + i * 0.22, bv + 0.4 + (i % 3) * 0.8, bv + 0.52 + (i % 3) * 0.8, 2.2, 2.32, () => 0xfff0c0, id, { noEdges: true }); }   // bubblor
  else basket(2.8, true);                       // upplyft med gyllene pommes
}
// dryckesmaskin: torn med tre kranar, droppbricka och (när man tappat upp) en fylld mugg under
export function drawDrinkTower(R, u0, v0, id, era, filled = false, drink = null) {
  const steel = era?.steel ?? 0xc8ccd6, trim = era?.trim ?? 0xc92a2a, neon = era?.neon ? hex(era.neon) : 0xff6f9c;
  // sockel/droppbricka
  R.box(u0, u0 + 4.5, v0, v0 + 4.5, 0, 0.35, (f, x, y, W, Hh) => (f === 'top' ? ((x * 3 | 0) % 2 ? shade(steel, 0.75) : shade(steel, 0.6)) : shade(steel, 0.85)), id, { noEdges: true });
  // tornet baktill
  R.box(u0, u0 + 4.5, v0, v0 + 1.6, 0.35, 4.2, (f, x, y, W, Hh) => {
    if (f === 'top') return steel;
    if (f === 'left') {   // frontpanelen med skylt och tre kranar
      if (y > 0.2 && y < 1.2) return hash(x * 3 | 0, y * 3 | 0) > 0.92 ? shade(trim, 1.2) : trim;
      if (y > 1.25 && y < 1.4 && x > 0.3 && x < W - 0.3) return neon;
      if (y > 2.4 && y < 3.2) { const k = ((x - 0.4) % 1.35); if (x > 0.4 && k < 0.5) return 0x2a2d36; }
      return shade(steel, 0.95);
    }
    return shade(steel, 0.85);
  }, id, { noEdges: true });
  // kranarnas pipar
  for (let i = 0; i < 3; i++) R.box(u0 + 0.55 + i * 1.35, u0 + 0.95 + i * 1.35, v0 + 1.6, v0 + 2.2, 2.0, 2.3, () => 0x2a2d36, id, { noEdges: true });
  if (filled && drink) drawCup(R, drink, u0 + 2.1, v0 + 3.2, 0.35, id);
}

// ---------- Tallriken och luckan ----------
// oval tallrik: vit med en rand i epokens färg och en lätt upphöjd kant
export function drawPlate(R, cu, cv, rx, ry, era, id = 0, dz = 0) {
  const trim = era?.trim ?? 0xc92a2a, white = 0xf6f3ec;
  disc(R, cu, cv, -0.3 + dz, dz, rx, (f, x, y, W, Hh, d) => (f === 'top' ? (d > 0.96 ? shade(white, 0.85) : d > 0.86 ? trim : d > 0.8 ? shade(white, 0.92) : hash(x * 2 | 0, y * 2 | 0) > 0.94 ? shade(white, 0.96) : white) : shade(white, 0.8)), id, { ry });
}
// luckan/serveringsdisken: rostfri hylla med värmelampor där färdiga tallrikar ställs
export function drawPass(R, u0, u1, v0, v1, era, id = 0) {
  const steel = era?.steel ?? 0xc8ced6, trim = era?.trim ?? 0xc92a2a;
  R.box(u0, u1, v0, v1, -0.4, 0, (f, x, y, W, Hh) => (f === 'top' ? (Math.min(x, W - x, y, Hh - y) < 0.2 ? shade(steel, 0.8) : hash(x * 2 | 0, y * 2 | 0) > 0.95 ? shade(steel, 1.08) : steel) : shade(steel, 0.85)), id, { noEdges: true });
  // stolpar och lampbåge med tre värmelampor
  for (const u of [u0 + 0.3, u1 - 0.7]) R.box(u, u + 0.4, v1 - 0.6, v1 - 0.2, 0, 5.2, () => 0x3a3d44, id, { noEdges: true });
  R.box(u0 + 0.3, u1 - 0.3, v1 - 0.9, v1 - 0.1, 5.2, 5.7, (f, x, y, W, Hh) => (f === 'top' ? trim : shade(trim, 0.8)), id, { noEdges: true });
  const n = 3, span = (u1 - u0 - 2) / (n - 1);
  for (let i = 0; i < n; i++) { const u = u0 + 1 + i * span; R.box(u - 0.5, u + 0.5, v1 - 0.9, v1 - 0.1, 4.4, 5.2, (f) => (f === 'top' ? 0x2a2d36 : 0xffb347), id, { noEdges: true }); R.box(u - 0.3, u + 0.3, v1 - 0.8, v1 - 0.2, 4.2, 4.4, () => 0xfff0c0, id, { noEdges: true, alpha: 0.8 }); }
}
