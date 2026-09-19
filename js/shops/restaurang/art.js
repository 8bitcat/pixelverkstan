// Pixelgrafik för hamburgerbaren: brickan, grillen, brödrosten, burgarens lager, tillbehör,
// drycker och efterrätter. Allt ritas som isometriska lådor (core/raster.js) – runda saker
// får sin form genom att texturen svarar -1 utanför cirkeln. Ingen DOM utom i iconCanvas.
import { Raster, shade, mix, hex } from '../../core/raster.js';
import { layerHeight, bunTopHeight, burgerRadius } from './menu.js';

const hash = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
const H = (c) => (typeof c === 'number' ? c : hex(c));

// ---------- Byggnadsblock ----------
// rund låda: toppen är en cirkel (radie r kring mitten), sidorna skuggas mot kanterna
export function disc(R, cu, cv, z0, z1, r, tex, id = 0, opt = {}) {
  const hole = opt.hole || 0, ry = opt.ry || r;
  R.box(cu - r, cu + r, cv - ry, cv + ry, z0, z1, (f, x, y, W, Hh) => {
    if (f === 'top') {
      const dx = (x - r) / r, dy = (y - ry) / ry, d = Math.hypot(dx, dy);
      const edge = opt.wave ? 1 + opt.wave * Math.sin(Math.atan2(dy, dx) * (opt.waveN || 6) + (opt.seed || 0)) : 1;
      if (d > edge || (hole && d < hole)) return -1;
      return tex('top', x, y, W, Hh, d);
    }
    const t = Math.abs(x - W / 2) / (W / 2);
    const c = tex(f, x, y, W, Hh, t);
    return c < 0 ? c : shade(c, 1 - t * t * 0.35);
  }, id, { noEdges: true, ...opt.box });
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
      if (sq) R.box(cu - r * 0.9, cu + r * 0.9, cv - r * 0.9, cv + r * 0.9, z0, z0 + h, (f, x, y, W, Hh) => tex(f, x, y, W, Hh, 0), id, { noEdges: true });
      else disc(R, cu, cv, z0, z0 + h, r * 0.98, tex, id, { wave: L.crispy ? 0.05 : 0.02, waveN: 9, seed: 1 });
      return;
    }
    case 'cheese': {
      const s = L.round ? r * 0.7 : r * 1.06, h = layerHeight(part);
      const spots = L.spots ? H(L.spots) : null;
      const tex = (f, x, y, W, Hh) => {
        if (spots && hash(x * 2 | 0, y * 2 | 0) > 0.86) return spots;
        if (L.holes && hash(x * 1.5 | 0, y * 1.5 | 0) > 0.9) return shade(col, 0.75);
        return f === 'top' ? col : shade(col, 0.88);
      };
      if (L.round) disc(R, cu, cv, z0, z0 + h, s, tex, id);
      else R.box(cu - s, cu + s, cv - s, cv + s, z0, z0 + h, (f, x, y, W, Hh) => {
        // smält ost: hörnen droppar av
        if (L.melt !== false && f === 'top') { const c = Math.min(x, W - x, y, Hh - y); if (c < 0.4 && hash(x * 3 | 0, y * 3 | 0) > 0.55) return -1; }
        return tex(f, x, y, W, Hh);
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
        const a = i * (Math.PI * 2 / n) + 0.7, x = n === 1 ? cu : cu + Math.cos(a) * r * 0.42, y = n === 1 ? cv : cv + Math.sin(a) * r * 0.42;
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
      disc(R, cu, cv, z0, z0 + h, r * 0.9, (f, x, y, W, Hh, d) => (spots && hash(x * 3 | 0, y * 3 | 0) > 0.9 ? spots : f === 'top' ? (d < 0.3 ? shade(col, 1.12) : col) : shade(col, 0.85)), id, { wave: L.drops ? 0.15 : 0.06, waveN: 5, seed: 5 });
      return;
    }
    case 'chunky': {
      const light = H(L.light || shade(col, 1.3)), h = layerHeight(part);
      disc(R, cu, cv, z0, z0 + h, r * 0.9, (f, x, y, W, Hh, d) => (hash(x * 2.5 | 0, y * 2.5 | 0) > (L.crisp ? 0.45 : 0.6) ? light : col), id, { wave: 0.12, waveN: 11, seed: 6 });
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
      return hash(x * 3 | 0, y * 3 | 0) > 0.85 ? shade(0xf0dcb0, 0.92) : 0xf0dcb0;
    }
    if (L.lettuce) return hash(x * 2 | 0, y * 2 | 0) > 0.8 ? shade(col, 0.8) : col;
    if (L.sesame && hash(x * 2.5 | 0, y * 2.5 | 0) > 0.86) return 0xf6ecd0;
    if (L.seeds && hash(x * 3 | 0, y * 3 | 0) > 0.85) return 0x6a4a2a;
    if (L.salt && hash(x * 3 | 0, y * 3 | 0) > 0.9) return 0xffffff;
    if (L.flour && hash(x * 1.5 | 0, y * 1.5 | 0) > 0.7) return shade(col, 1.15);
    return d < 0.35 && L.gloss ? shade(col, 1.18) : col;
  };
}
function drawBunBottom(R, part, cu, cv, z0, r, id) {
  const L = part.look || {}, col = H(L.color), crust = H(L.crust || shade(col, 0.8)), h = layerHeight(part);
  if (L.lettuce) { disc(R, cu, cv, z0, z0 + h, r * 1.1, bunTex(part, L, col, crust, true), id, { wave: 0.14, waveN: 7, seed: 7 }); return; }
  disc(R, cu, cv, z0, z0 + h, r, bunTex(part, L, col, crust, false), id, { hole: L.hole ? 0.3 : 0 });
}
function drawBunTop(R, part, cu, cv, z0, r, id) {
  const L = part.look || {}, col = H(L.color), crust = H(L.crust || shade(col, 0.8)), tex = bunTex(part, L, col, crust, true);
  if (L.lettuce) { disc(R, cu, cv, z0, z0 + 0.5, r * 1.1, tex, id, { wave: 0.14, waveN: 7, seed: 8 }); return; }
  if (L.flat) { disc(R, cu, cv, z0, z0 + 0.5, r, tex, id); return; }
  const total = bunTopHeight(part), steps = [[1, 0.36], [0.92, 0.26], [0.78, 0.2], [0.58, 0.12], [0.34, 0.06]];
  let z = z0;
  for (const [f, hf] of steps) { const h = total * hf; disc(R, cu, cv, z, z + h, r * f, (ff, x, y, W, Hh, d) => (ff === 'top' && f < 1 ? tex('top', x, y, W, Hh, d * f) : ff === 'top' ? tex('top', x, y, W, Hh, d) : crust), id, { hole: L.hole && f === 1 ? 0.3 : 0 }); z += h; }
}

// ---------- Tillbehör, drycker, efterrätter ----------
export function drawSide(R, part, o) {
  const L = part.look || {}, [cu, cv, z0] = o.at, id = o.id || 0, col = H(L.color || '#f0c050');
  const paper = 0xd9322a;
  if (L.shape === 'fries' || L.shape === 'nuggets') {
    // röd pappersficka
    R.box(cu - 2.2, cu + 2.2, cv - 1.4, cv + 1.4, z0, z0 + 2.0, (f, x, y, W, Hh) => (f === 'top' ? -1 : (Hh - y < 0.25 ? shade(paper, 0.7) : y < 0.3 ? shade(paper, 1.15) : hash(x * 4 | 0, y * 4 | 0) > 0.9 ? shade(paper, 1.1) : paper)), id, { noEdges: true });
    if (L.shape === 'fries') {
      const n = L.wedges ? 6 : 11, w = L.wedges ? 0.8 : 0.42;
      for (let i = 0; i < n; i++) {
        const x = cu - 1.7 + (i % 6) * 0.68 + hash(i, 1) * 0.2, y = cv - 0.8 + Math.floor(i / 6) * 0.9 + hash(i, 2) * 0.5, h = 2.6 + hash(i, 3) * 1.1;
        R.box(x, x + w, y, y + w * 0.8, z0 + 0.6, z0 + h, (f, xx, yy) => (f === 'top' ? shade(col, 1.15) : (L.curly && (yy * 3 | 0) % 2 ? shade(col, 0.8) : hash(xx * 6 | 0, yy * 6 | 0) > 0.85 ? shade(col, 0.8) : col)), id, { noEdges: true });
      }
      if (L.truffle) for (let i = 0; i < 6; i++) { const x = cu - 1.5 + hash(i, 7) * 3, y = cv - 1 + hash(i, 8) * 2; R.box(x, x + 0.25, y, y + 0.25, z0 + 3.2, z0 + 3.3, () => 0x3a2a1a, id, { noEdges: true }); }
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
    disc(R, cu, cv, z0, z0 + 1.2, 2.2, (f, x, y, W, Hh, d) => (f === 'top' ? (d > 0.86 ? 0xf0ece0 : hash(x * 2 | 0, y * 2 | 0) > 0.7 ? shade(col, 0.75) : hash(x * 3 | 0, y * 3 | 0) > 0.9 ? 0xe0392e : col) : 0xf0ece0), id);
    return;
  }
  if (L.shape === 'corn') {
    R.box(cu - 2.4, cu + 2.4, cv - 0.7, cv + 0.7, z0, z0 + 1.2, (f, x, y) => ((x * 4 | 0) % 2 === (y * 4 | 0) % 2 ? col : shade(col, 0.85)), id, { noEdges: true });
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
  const hgt = L.shake ? 4.6 : 4.0;
  disc(R, cu, cv, z0, z0 + hgt * 0.35, 1.35, (f, x, y, W, Hh) => (f === 'top' ? -1 : (hash(x * 3 | 0, y * 3 | 0) > 0.9 ? shade(cup, 0.85) : cup)), id);
  disc(R, cu, cv, z0 + hgt * 0.35, z0 + hgt, 1.55, (f, x, y, W, Hh, d) => (f === 'top' ? (L.shake ? (d < 0.7 ? 0xfaf6ee : cup) : d > 0.9 ? cup : d < 0.12 ? 0xffffff : shade(cup, 0.95)) : (y < 0.25 ? shade(cup, 1.1) : hash(x * 3 | 0, y * 3 | 0) > 0.9 ? shade(cup, 0.85) : L.ice && y > 1 && y < 2 ? drink : cup)), id);
  if (L.shake) disc(R, cu, cv, z0 + hgt, z0 + hgt + 0.7, 0.9, (f, x, y, W, Hh, d) => (f === 'top' ? (d < 0.4 ? 0xe0392e : 0xfaf6ee) : 0xfaf6ee), id);
  R.box(cu + 0.4, cu + 0.62, cv - 0.6, cv - 0.4, z0 + hgt, z0 + hgt + 2.0, () => (L.shake ? 0xe0392e : 0xd8dce0), id, { noEdges: true });   // sugrör
}
export function drawDessert(R, part, cu, cv, z0, id) {
  const L = part.look || {}, col = H(L.color || '#d8a050'), top = H(L.top || shade(col, 0.8));
  switch (part.id) {
    case 'mjukglass': disc(R, cu, cv, z0, z0 + 2.2, 0.9, (f) => (f === 'top' ? -1 : (f === 'left' ? shade(0xd8a050, 0.9) : 0xd8a050)), id); for (let i = 0; i < 4; i++) disc(R, cu, cv, z0 + 2.2 + i * 0.6, z0 + 2.8 + i * 0.6, 1.4 - i * 0.3, (f) => (f === 'top' ? col : shade(col, 0.92)), id); return;
    case 'donut': disc(R, cu, cv, z0, z0 + 1.0, 2.0, (f, x, y, W, Hh, d) => (f === 'top' ? (d > 0.5 && hash(x * 3 | 0, y * 3 | 0) > 0.9 ? 0xffffff : top) : col), id, { hole: 0.4 }); return;
    case 'brownie': R.box(cu - 1.8, cu + 1.8, cv - 1.4, cv + 1.4, z0, z0 + 1.1, (f, x, y) => (hash(x * 3 | 0, y * 3 | 0) > 0.85 ? top : col), id, { noEdges: true }); return;
    case 'cookie': disc(R, cu, cv, z0, z0 + 0.5, 2.0, (f, x, y, W, Hh) => (hash(x * 2.5 | 0, y * 2.5 | 0) > 0.82 ? top : col), id); return;
    case 'churros': for (let i = 0; i < 3; i++) R.box(cu - 2.5, cu + 2.5, cv - 1.2 + i * 0.9, cv - 0.6 + i * 0.9, z0 + i * 0.1, z0 + 0.6 + i * 0.1, (f, x, y) => ((x * 3 | 0) % 2 ? shade(col, 0.85) : col), id, { noEdges: true }); R.box(cu + 0.5, cu + 2.4, cv - 0.5, cv + 1.6, z0, z0 + 1.6, (f, x, y, W, Hh) => (f === 'top' ? top : 0xf4f1ea), id, { noEdges: true }); return;
    case 'sundae': disc(R, cu, cv, z0, z0 + 1.6, 1.4, (f, x, y, W, Hh) => (f === 'top' ? -1 : 0xdfe4ea), id); disc(R, cu, cv, z0 + 1.4, z0 + 2.6, 1.5, (f, x, y, W, Hh, d) => (f === 'top' ? (d < 0.5 ? top : hash(x * 4 | 0, y * 4 | 0) > 0.85 ? 0xe0392e : col) : col), id); return;
    case 'cheesecake': case 'applepaj': R.box(cu - 1.5, cu + 1.5, cv - 1.8, cv + 1.8, z0, z0 + 1.2, (f, x, y, W, Hh) => (f === 'top' ? (hash(x * 3 | 0, y * 3 | 0) > 0.75 ? top : col) : (y < 0.25 ? col : shade(col, 0.85))), id, { noEdges: true }); return;
  }
  disc(R, cu, cv, z0, z0 + 1, 1.8, () => col, id);
}

// ---------- Köket runt burgaren ----------
export function drawTray(R, u0, u1, v0, v1, id = 0) {
  const red = 0xc9322a;
  R.box(u0, u1, v0, v1, -0.35, 0, (f, x, y, W, Hh) => {
    if (f === 'top') {
      const e = Math.min(x, W - x, y, Hh - y);
      if (e < 0.35) return shade(red, 1.15);
      if (e < 0.55) return shade(red, 0.8);
      // smörpapper i mitten
      if (x > 1.5 && x < W - 1.5 && y > 1 && y < Hh - 1) return hash(x * 2 | 0, y * 2 | 0) > 0.93 ? 0xe8e0d0 : 0xf4efe4;
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
