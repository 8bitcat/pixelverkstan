// Stående, stängt chassi (till ikoner, montrar och skrivbordet).
// Vänster yta = sidopanel (glas/plåt), höger yta = front, topp = tak.
// Ankare `at` = lådans minsta hörn [u0, v0, z0]; måtten per stil ger standDims(p).
// Fronter: modern ('solid'|'mesh'|'glass'|'honeycomb'|'triangles'|'perforated') och retro
// ('beige-xt'|'beige-at' = liggande skrivbordslåda, 'beige-tower'|'beige-atx'|'black-atx'|'silver-atx').
// Enheterna i 5,25"/3,5"-platserna tas från o.drives = [delar] eller o.placed (cat 'media');
// i butiksmontrar (o.showroom) visas en typisk uppsättning för frontens tid.
import { hex, shade, mix } from '../../core/raster.js';
import { textBitmap } from '../../core/pixfont.js';
import { C, fan, honeycomb, mesh, dots, led, isLit, TB, txt, inRound, speckle, brushed, vents, seg7, jack, screwHead, perforated } from './art-common.js';
import { mediaFront, mediaStyle } from './art-parts.js';

export const STAND = { D: 10, W: 4.8, H: 11 };
const DIMS = {
  desktop: { D: 8.6, W: 10.4, H: 3.3 }, minitower: { D: 8.6, W: 4.4, H: 8.2 }, tower: STAND, midi: STAND,
  full: { D: 11, W: 5.2, H: 13 }, sff: { D: 7.4, W: 4.0, H: 7.0 },
};
export function standDims(p) {
  const L = p.look || {};
  const st = p.style || (L.front === 'beige-xt' || L.front === 'beige-at' ? 'desktop' : 'midi');
  return DIMS[st] || STAND;
}
const FRONT_FANS = { front1: 2.3, front2: 5.4, front3: 8.5 };

export function frontFanRing(p, o, key) {
  return p.rgb ? led(o, 'case', FRONT_FANS[key]) : -1;
}

// Typiska enheter i montern
const demo = (kind, color) => ({ kind, look: { color, style: kind === 'cdrom' || kind === 'dvdrw' ? 'optical' : kind }, brand: '' });
const DEMO = {
  'beige-xt': [[demo('floppy525', 'black'), null], []],
  'beige-at': [[demo('floppy525', 'beige'), null], [demo('floppy35', 'beige')]],
  'beige-tower': [[demo('cdrom', 'beige'), demo('floppy525', 'beige'), null], [demo('floppy35', 'beige'), null]],
  'beige-atx': [[demo('cdrom', 'beige'), null, null, null], [demo('floppy35', 'beige'), null]],
  'black-atx': [[demo('dvdrw', 'black'), null, null, null], [demo('floppy35', 'black')]],
  'silver-atx': [[demo('dvdrw', 'grey'), null, null], [demo('floppy35', 'grey'), null]],
};
const BAYS = { 'beige-xt': [2, 0], 'beige-at': [2, 1], 'beige-tower': [3, 2], 'beige-atx': [4, 2], 'black-atx': [4, 1], 'silver-atx': [3, 2] };

export function drawCaseStanding(R, p, o, at = [0, 0, 0]) {
  const [u0, v0, z0] = at, L = p.look || {}, front = L.front || 'solid';
  const retro = !!BAYS[front], desktop = standDims(p) === DIMS.desktop || (!p.style && (front === 'beige-xt' || front === 'beige-at'));
  const { D, W, H } = standDims(p);
  const col = hx(L.color, front.startsWith('beige') ? C.beige : front === 'silver-atx' ? 0xc4c8cc : front === 'black-atx' ? 0x1c1c1e : 0x26282c);
  const inner = hx(L.inner, shade(col, 0.8));
  const light = lum(col) > 150, edge = shade(col, light ? 0.82 : 1.4);
  const glassSide = L.window ?? (!retro && p.id !== 'pop-mini-silent');
  const fans = p.fans || [];
  const fansFront = retro ? [] : fans.filter((f) => f.startsWith('front'));
  const brandName = String(p.brand || p.name || '').split(' ')[0].toUpperCase().slice(0, 8);
  const brand = textBitmap(brandName.replace(/[^A-Z0-9ÅÄÖ .\-!]/g, '') || ' ');
  const id = o.id || 0;
  const powered = isLit(o, 'power');
  const feet = retro ? 0.3 : 0.35;

  // fötter
  if (desktop) {
    for (const fu of [0.5, D - 1.1]) for (const fv of [0.5, W - 1.1]) R.box(u0 + fu, u0 + fu + 0.6, v0 + fv, v0 + fv + 0.6, z0, z0 + feet, () => 0x151515, id);
  } else if (retro) {
    for (const fu of [0.3, D - 1.5]) R.box(u0 + fu, u0 + fu + 1.2, v0 - 0.3, v0 + W + 0.3, z0, z0 + feet, (f, x, y, FW, FH) => f === 'top' ? shade(col, 0.9) : shade(col, 0.7), id);
  } else {
    for (const fu of [0.6, D - 1.4]) for (const fv of [0.4, W - 1.2]) R.box(u0 + fu, u0 + fu + 0.8, v0 + fv, v0 + fv + 0.8, z0, z0 + feet, () => 0x111111, id);
  }

  // enheter i platserna
  const [n525, n35] = !desktop && front === 'beige-at' ? [3, 2] : BAYS[front] || [0, 0];
  const fs = (H - feet) / (STAND.H - 0.35), fr = Math.min(1.75, (W - 0.9) / 2, 1.75 * fs);
  const d525 = [], d35 = [];
  if (retro) {
    const list = o.drives || (o.placed ? Object.values(o.placed).filter((q) => q && q.cat === 'media') : null);
    if (list) {
      for (const q of list) (mediaStyle(q) === 'floppy35' ? d35 : d525).push(mediaFront(q, o));
    } else if (o.showroom) {
      const [a, b] = DEMO[front];
      for (const q of a) d525.push(q ? mediaFront(q, o) : null);
      for (const q of b) d35.push(q ? mediaFront(q, o) : null);
    }
  }
  const mhz = o.placed?.cpu?.mhz ? String(Math.round(o.placed.cpu.mhz)).slice(0, 3) : '66';
  const frontTex = retro ? retroFront(front, desktop, col, brand, n525, n35, d525, d35, powered, mhz, o) : null;

  R.box(u0, u0 + D, v0, v0 + W, z0 + feet, z0 + H, (f, x, y, FW, FH) => {
    if (f === 'top') {
      if (retro) {
        if (x > FW - 0.3) return x > FW - 0.05 ? shade(col, 0.8) : shade(col, 1.08);
        if (x < 0.25 && (y < 0.5 || y > FH - 0.5)) { const s = screwHead(x, y, 0.13, y < 0.5 ? 0.25 : FH - 0.25, 0.1); if (s >= 0) return s; }
        if (desktop && x > 0.5 && x < 1.4 && y > 1.2 && y < FH - 1.2) return vents(x, y, 0.25, 0.7, 0.1, 0.55) ? shade(col, 0.45) : speckle(col, x, y, 30, 0.04);
        return (y % 2.4) < 0.03 ? shade(col, 0.92) : speckle(col, x, y, 30, 0.04);
      }
      // tak: filter + frontpanel med knappar och uttag
      if (x > FW - 1.1) {
        const bx = FW - 0.55;
        { const dx = x - bx, dy = y - 1.0, d2 = dx * dx + dy * dy; if (d2 < 0.08) return d2 > 0.055 ? (powered ? 0x7ee8fa : 0x3a3a3a) : d2 < 0.012 ? 0x2a2a2a : 0xc8c8c8; }
        { const dx = x - bx, dy = y - 1.65, d2 = dx * dx + dy * dy; if (d2 < 0.02) return 0x3a3a3a; }
        if (x > bx - 0.25 && x < bx + 0.25 && y > 2.05 && y < 2.45) return x > bx - 0.2 && x < bx + 0.2 && y > 2.12 && y < 2.2 ? 0x2c6fb7 : 0x0e0e0e;   // USB-A
        if (x > bx - 0.25 && x < bx + 0.25 && y > 2.65 && y < 3.05) return x > bx - 0.2 && x < bx + 0.2 && y > 2.72 && y < 2.8 ? 0x2c6fb7 : 0x0e0e0e;
        if (inRound(x, y, bx - 0.16, 3.25, bx + 0.16, 3.5, 0.08)) return 0x0e0e0e;                                                                // USB-C
        { const j = jack(x, y, bx, 3.85, 0.12, 0x1a1a1a); if (j >= 0) return j; }
        return x < FW - 1.05 ? shade(edge, 0.8) : edge;
      }
      if (x > 1 && x < FW - 1.6 && y > 0.6 && y < FH - 0.6) {
        if (x < 1.08 || y < 0.68 || x > FW - 1.68 || y > FH - 0.68) return shade(col, 0.7);
        return mesh(x, y, 0.2) ? shade(col, 0.95) : 0x0e0e10;
      }
      return edge;
    }
    if (f === 'right') {
      const sx = FW - x;
      if (retro) return frontTex(sx, y, FW, FH);
      if (sx < 0.25 || sx > FW - 0.25 || y < 0.25 || y > FH - 0.25) return sx < 0.05 || y < 0.05 ? shade(edge, 1.1) : edge;
      let fanC = -1;
      for (let i = 0; i < fansFront.length; i++) {
        const c = fan(sx, y, FW / 2, FRONT_FANS[fansFront[i]] * fs, fr, { spin: o.spin || 0, frame: 0x151515, blade: 0x2a2a2a, hub: 0x333333, blades: 9, ring: frontFanRing(p, o, fansFront[i]) });
        if (c >= 0) { fanC = c; break; }
      }
      const behind = fanC >= 0 ? fanC : shade(inner, 0.35);
      switch (front) {
        case 'glass': { if (fanC >= 0) return mix(fanC, 0xffffff, 0.08); let r = (sx + y * 0.7) % 3; return r < 0.3 ? 0x5a646c : r < 0.36 ? 0x8a949c : 0x14161a; }
        case 'honeycomb': return honeycomb(sx, y, 0.34) ? col : behind;
        case 'triangles': return (((sx * 3) | 0) + ((y * 2.6) | 0)) % 2 === 0 && ((sx * 3) % 1 > (y * 2.6) % 1) ? col : behind;
        case 'perforated': return dots(sx, y, 0.3, 0.1) ? behind : col;
        case 'mesh': return mesh(sx, y, 0.18) ? shade(col, 1.1) : behind;
        default: // solid med luftspalter vid kanterna
          if ((sx < 0.55 || sx > FW - 0.55) && ((y * 4) | 0) % 2) return 0x0e0e10;
          if (txt(brand, sx, y, 1.1, FH - 1.2, 0.12)) return shade(col, 1.6);
          return (((sx + y) * 2) | 0) % 9 === 0 ? shade(col, 1.06) : col;
      }
    }
    // sidopanel
    if (x < 0.25 || x > FW - 0.25 || y < 0.25 || y > FH - 0.25) return x < 0.05 || y < 0.05 ? shade(edge, 1.1) : edge;
    if (!glassSide) {
      if (retro) {
        if (desktop) {
          if (x > FW - 1.8 && x < FW - 0.6 && y > 0.6 && y < FH - 0.5) return vents(x, y, 0.22, 1, 0.1, 0.9) ? shade(col, 0.4) : speckle(col, x, y, 30, 0.04);
          return speckle(col, x, y, 30, 0.04);
        }
        if (x > FW - 1.6 && x < FW - 0.6 && y > FH - 3 && y < FH - 0.6) return vents(x, y, 0.2, 0.6, 0.1, 0.45) ? shade(col, 0.4) : speckle(col, x, y, 30, 0.04);
        if (x > 0.5 && x < 0.62 && y > 0.5 && y < FH - 0.5) return shade(col, 0.9);
        return speckle(col, x, y, 30, 0.04);
      }
      return ((x * 1.5 + y) % 4 < 0.08) ? shade(col, 1.15) : col;
    }
    // glas med skruvar i hörnen, reflex och insidan
    { const sx0 = x < 0.7 ? 0.45 : x > FW - 0.7 ? FW - 0.45 : -9, sy0 = y < 0.7 ? 0.45 : y > FH - 0.7 ? FH - 0.45 : -9; if (sx0 > -9 && sy0 > -9) { const s = screwHead(x, y, sx0, sy0, 0.14); if (s >= 0) return s; } }
    const shroud = !retro && y > FH - 2.3;
    if (shroud) {
      if (txt(brand, x, y, 1, FH - 1.6, 0.13)) return shade(col, light ? 0.6 : 1.8);
      return col;
    }
    let r = (x * 0.8 + y) % 5; if (r < 0) r += 5;
    const refl = r < 0.35;
    let c = inner;
    if (x > 0.8 && x < 6.8 && y > 0.8 && y < 7.8) c = 0x202226;                              // moderkort-silhuett
    if (x > FW - 1.3 && fansFront.length) {
      for (let i = 0; i < 3; i++) { const cy = (2.3 + i * 3.1) * fs; if (y > cy - 1.5 * fs && y < cy + 1.5 * fs) { c = p.rgb ? mix(led(o, 'case', cy), 0x000000, 0.25) : 0x1a1a1a; break; } }
    }
    if (fans.includes('rear') && x < 1.1 && y > 1.3 && y < 4.3) c = p.rgb ? led(o, 'case', 9) : 0x1a1a1a;
    return refl ? mix(c, 0xffffff, 0.35) : mix(c, 0x0b0d10, 0.35);
  }, id);
}

const hx = (s, d) => (typeof s === 'string' && s[0] === '#' ? hex(s) : d);
const lum = (c) => ((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + (c & 255) * 0.11;

// Blindlucka för en tom plats
function blank(a, b, A, B, base) {
  if (a < 0.03 || b < 0.03) return shade(base, 1.2);
  if (a > A - 0.03 || b > B - 0.03) return shade(base, 0.7);
  if ((b > B * 0.3 && b < B * 0.34) || (b > B * 0.66 && b < B * 0.7)) return shade(base, 0.88);
  if (a > A * 0.46 && a < A * 0.54 && b > B * 0.84) return shade(base, 0.6);
  return speckle(base, a, b, 40, 0.035);
}

// Retrofronter i verkliga koordinater (sx vänster→höger, y uppifrån)
function retroFront(front, desktop, col, brand, n525, n35, d525, d35, powered, mhz, o) {
  const silver = front === 'silver-atx', black = front === 'black-atx';
  const trim = silver ? 0xdde0e3 : black ? 0x8a8e94 : shade(col, 0.9);
  const ledOn = powered;
  const smallTxt = TB('POWER'), turboTxt = TB('TURBO'), hddTxt = TB('HDD');
  return (sx, y, FW, FH) => {
    // yttre fasad ram
    if (sx < 0.06 || y < 0.06) return shade(col, 1.2);
    if (sx > FW - 0.06 || y > FH - 0.06) return shade(col, 0.68);
    let bays525x0, bays525y0, A5, B5, A3, B3, bays35x0, bays35y0, gap = 0.1;
    if (desktop) {
      A5 = FW * 0.3; B5 = front === 'beige-xt' ? FH * 0.62 : FH * 0.36;
      bays525x0 = FW - 0.35 - A5; bays525y0 = front === 'beige-xt' ? FH * 0.16 : FH * 0.1;
      A3 = A5 * 0.7; B3 = A3 * 0.25; bays35x0 = bays525x0 - A3 - 0.4; bays35y0 = FH * 0.2;
      if (front === 'beige-xt') { bays525x0 = FW - 0.35 - 2 * A5 - 0.2; }
    } else {
      A5 = FW * 0.77; B5 = A5 * 0.283; bays525x0 = (FW - A5) / 2; bays525y0 = 0.6;
      A3 = A5 * 0.696; B3 = A3 * 0.25; bays35x0 = (FW - A3) / 2; bays35y0 = bays525y0 + n525 * (B5 + gap) + 0.35;
    }
    // 5,25"-platser (XT: bredvid varandra, annars staplade)
    for (let i = 0; i < n525; i++) {
      const bx = desktop && front === 'beige-xt' ? bays525x0 + i * (A5 + 0.2) : bays525x0;
      const by = desktop && front === 'beige-xt' ? bays525y0 : bays525y0 + i * (B5 + gap);
      if (sx >= bx - 0.04 && sx < bx + A5 + 0.04 && y >= by - 0.04 && y < by + B5 + 0.04) {
        if (sx < bx || y < by || sx >= bx + A5 || y >= by + B5) return shade(col, 0.5);
        const d = d525[i];
        return d ? d(sx - bx, y - by, A5, B5) : blank(sx - bx, y - by, A5, B5, silver ? brushed(col, sx, y) : col);
      }
    }
    for (let i = 0; i < n35; i++) {
      const bx = bays35x0, by = bays35y0 + i * (B3 + gap);
      if (sx >= bx - 0.04 && sx < bx + A3 + 0.04 && y >= by - 0.04 && y < by + B3 + 0.04) {
        if (sx < bx || y < by || sx >= bx + A3 || y >= by + B3) return shade(col, 0.5);
        const d = d35[i];
        return d ? d(sx - bx, y - by, A3, B3) : blank(sx - bx, y - by, A3, B3, silver ? brushed(col, sx, y) : col);
      }
    }
    if (desktop) {
      // märkesskylt nere till vänster
      if (sx > 0.45 && sx < 2.1 && y > FH - 0.75 && y < FH - 0.35) return txt(brand, sx, y, 0.6, FH - 0.66, 0.045) ? 0xf2f2f2 : 0x3a3c40;
      if (front === 'beige-at') {
        // nyckellås, lysdioder, turbo/reset, MHz-display
        { const dx = sx - 0.8, dy = y - 0.8, d2 = dx * dx + dy * dy; if (d2 < 0.06) return d2 < 0.012 && Math.abs(dx) < 0.03 ? 0x1a1a1a : d2 > 0.045 ? 0x8a8e94 : 0xd8dce0; }
        if (sx > 1.5 && sx < 2.9 && y > 0.5 && y < 1.15) { const s = seg7(mhz, sx, y, 1.62, 0.6, 0.28, 0.45); return s === 1 ? (ledOn || o.showroom ? C.ledRed : 0x4a1010) : s === 0 ? 0x2a0808 : 0x120404; }
        for (let i = 0; i < 3; i++) { const lx = 3.3 + i * 0.62; if (sx > lx && sx < lx + 0.18 && y > 0.6 && y < 0.7) return i === 0 ? (ledOn ? C.ledGreen : 0x1e4a24) : i === 1 ? (ledOn ? C.ledAmber : 0x4a3a10) : 0x4a1010; }
        if (txt(smallTxt, sx, y, 3.24, 0.78, 0.022) || txt(turboTxt, sx, y, 3.86, 0.78, 0.022) || txt(hddTxt, sx, y, 4.5, 0.78, 0.022)) return 0x6a6458;
        for (let i = 0; i < 2; i++) { const bx = 3.35 + i * 0.6; if (inRound(sx, y, bx, 1.1, bx + 0.35, 1.45, 0.05)) return y < 1.14 ? shade(col, 1.2) : shade(col, 0.82); }
      }
      if ((y > FH * 0.5 && y < FH * 0.53) && sx < bays525x0 - 0.3 && sx > 0.3) return shade(col, 0.88);
      return speckle(col, sx, y, 30, 0.035);
    }
    // torn: kontrollpanel under platserna
    const py = bays35y0 + n35 * (B3 + gap) + 0.35;
    const cx = FW / 2;
    if (front === 'beige-tower' || front === 'beige-at') {
      if (sx > 0.55 && sx < 2.0 && y > py && y < py + 0.75) { const s = seg7(mhz, sx, y, 0.7, py + 0.12, 0.3, 0.5); return s === 1 ? (ledOn || o.showroom ? C.ledRed : 0x4a1010) : s === 0 ? 0x2a0808 : 0x120404; }
      for (let i = 0; i < 3; i++) { const lx = 2.2 + i * 0.52; if (sx > lx + 0.1 && sx < lx + 0.3 && y > py + 0.1 && y < py + 0.2) return i === 0 ? (ledOn ? C.ledGreen : 0x1e4a24) : i === 1 ? (ledOn ? C.ledAmber : 0x4a3a10) : 0x4a1010; }
      if (txt(smallTxt, sx, y, 2.2, py + 0.28, 0.021) || txt(turboTxt, sx, y, 2.72, py + 0.28, 0.021) || txt(hddTxt, sx, y, 3.29, py + 0.28, 0.021)) return 0x6a6458;
      for (let i = 0; i < 2; i++) { const bx = 2.4 + i * 0.7; if (inRound(sx, y, bx, py + 0.5, bx + 0.4, py + 0.85, 0.05)) return y < py + 0.54 ? shade(col, 1.2) : y > py + 0.8 ? shade(col, 0.7) : shade(col, 0.9); }
      { const dx = sx - (FW - 0.8), dy = y - (py + 0.45), d2 = dx * dx + dy * dy; if (d2 < 0.07) return d2 < 0.012 && Math.abs(dx) < 0.03 ? 0x1a1a1a : d2 > 0.05 ? 0x8a8e94 : brushed(0xd8dce0, sx, y); }
      const by = py + 1.3;
      if (inRound(sx, y, cx - 0.8, by, cx + 0.8, by + 0.7, 0.08)) return y < by + 0.05 ? shade(col, 1.25) : y > by + 0.64 ? shade(col, 0.65) : shade(col, 0.95);
      if (txt(smallTxt, sx, y, cx - 0.3, by + 0.82, 0.04)) return 0x6a6458;
      if (sx > 0.55 && sx < 2.3 && y > FH - 1.55 && y < FH - 1.15) return txt(brand, sx, y, 0.65, FH - 1.48, 0.05) ? 0xe8e8e8 : brushed(0x9aa0a6, sx, y);
      if (y > FH - 0.95 && y < FH - 0.3 && sx > 0.5 && sx < FW - 0.5) return vents(sx, y, 1, 0.16, 0.9, 0.07) ? shade(col, 0.4) : speckle(col, sx, y, 30, 0.035);
      return speckle(col, sx, y, 30, 0.035);
    }
    // ATX-torn: rund startknapp med ring, reset, lysdioder, USB/ljud, intag nedtill
    const by = py + 0.6;
    { const dx = sx - cx, dy = y - by, d2 = dx * dx + dy * dy;
      if (d2 < 0.2) {
        if (d2 > 0.14) return black || silver ? (powered || o.showroom ? C.ledBlue : 0x1a3a5a) : shade(col, 0.7);
        return dy < -0.15 ? mix(silver || black ? 0xd8dce0 : col, 0xffffff, 0.3) : (silver || black ? brushed(0xb8bcc0, sx, y) : shade(col, 0.95));
      }
    }
    { const dx = sx - cx, dy = y - (by + 0.75), d2 = dx * dx + dy * dy; if (d2 < 0.025) return d2 > 0.015 ? shade(col, 0.6) : shade(col, 1.05); }
    if (sx > cx - 0.9 && sx < cx - 0.7 && y > by + 0.72 && y < by + 0.8) return ledOn ? C.ledGreen : 0x1e4a24;
    if (sx > cx + 0.7 && sx < cx + 0.9 && y > by + 0.72 && y < by + 0.8) return 0x4a2a10;
    if (!front.startsWith('beige')) {
      const iy = by + 1.2;
      for (let i = 0; i < 2; i++) { const ux = cx - 0.85 + i * 0.55; if (sx > ux && sx < ux + 0.42 && y > iy && y < iy + 0.18) return y > iy + 0.04 && y < iy + 0.09 && sx > ux + 0.05 && sx < ux + 0.37 ? 0xe8e8e8 : 0x0a0a0a; }
      { const j = jack(sx, y, cx + 0.45, iy + 0.09, 0.1, 0x3aa84a); if (j >= 0) return j; }
      { const j = jack(sx, y, cx + 0.75, iy + 0.09, 0.1, 0xd86aa0); if (j >= 0) return j; }
    }
    if (sx > cx - 0.8 && sx < cx + 0.8 && y > FH - 3.1 && y < FH - 2.75) return txt(brand, sx, y, cx - brand.w * 0.025, FH - 3.04, 0.05) ? (black ? 0xe8e8e8 : 0x3a3a3a) : (black ? 0x2a2a2c : silver ? brushed(0xd8dce0, sx, y) : shade(col, 1.05));
    if (y > FH - 2.4 && y < FH - 0.35 && sx > 0.45 && sx < FW - 0.45) {
      if (black) return mesh(sx, y, 0.12) ? 0x2a2a2c : 0x080808;
      if (silver) return perforated(sx, y, 0.2, 0.06) ? 0x101012 : brushed(col, sx, y);
      return vents(sx + Math.sin(y * 3) * 0.2, y, 0.5, 0.3, 0.32, 0.12) ? shade(col, 0.45) : speckle(col, sx, y, 30, 0.035);
    }
    if (black && (sx < 0.3 || sx > FW - 0.3)) return brushed(trim, sx, y, 'y');
    if (silver) return brushed(col, sx, y, 'x');
    if (black) { let r = (sx * 0.5 + y) % 4; if (r < 0) r += 4; return r < 0.12 ? 0x3a3a3e : col; }
    return speckle(col, sx, y, 30, 0.035);
  };
}
