// Statisk bakgrund för butiksgolvet: gatan utanför fönstren och själva rummet
// (golv, väggar, fönster, dörrkarmar, vägghyllor, affisch, klocka, verkstadsdörr).
// Ritas en gång till offscreen-canvasar.
import { Pix, hex, mul, mix, hash, bayer, SMALL, textW, text } from './floor-pix.js';
import { FW, FH, WALL_Y, DOOR, SLOTS, SLOT_DEPTH, HERO, ROPE, SOFA, TABLE, ARMCHAIR, COUNTER, QUEUE, PICKUP } from './floor-layout.js';

export const WIN = [[12, 18, 87, 71], [96, 18, 171, 71]]; // glas [x0, y0, x1, y1)
export const TRANSOM = [DOOR.x0, 12, DOOR.x1, 22];
export const DOOR_OPEN = [DOOR.x0, 26, DOOR.x1, WALL_Y];
export const STREET_W = 252;
export const NEON_BOX = [294, 9, 448, 34];
export const SHELF = { x0: 256, x1: 332, boards: [50, 74] };
export const POSTER = [338, 36, 366, 70];
export const CLOCK = [382, 46, 8];
export const TV = [398, 34, 444, 62];
export const SPOT_X = [52, 132, 214, 318, 420, 478];

const T = (theme, k, fb) => hex(theme && theme[k], fb);

// ---------- Gatan ----------
export function paintStreet(opts = {}) {
  const P = new Pix(STREET_W, WALL_Y);
  // himmel
  for (let y = 0; y < 44; y++) for (let x = 0; x < STREET_W; x++) {
    const f = y / 44 + (bayer(x, y) - 0.5) * 0.09;
    P.px(x, y, mix(0x6fb0e2, 0xd9eef3, f));
  }
  // hus på andra sidan gatan
  const houses = [
    [0, 40, 13, 0xa9573c, 'brick'], [40, 84, 22, 0xe3d4b2, 'plaster'], [84, 122, 8, 0x6c9ea6, 'plaster'],
    [122, 170, 17, 0xd6ad55, 'plaster'], [170, 208, 11, 0x9b8f9f, 'plaster'], [208, 252, 19, 0xa9573c, 'brick'],
  ];
  for (const [x0, x1, top, col, kind] of houses) {
    for (let y = top; y < 54; y++) for (let x = x0; x < x1; x++) {
      let c = col;
      if (kind === 'brick') {
        const row = Math.floor((y - top) / 3), mortar = (y - top) % 3 === 2 || ((x + (row % 2) * 3) % 6 === 0);
        c = mortar ? mix(col, 0xd8cbb8, 0.45) : mul(col, 0.94 + hash(x >> 1, y, 3) * 0.12);
      } else c = mul(col, 0.96 + hash(x, y, 4) * 0.06);
      if (x === x1 - 1) c = mul(c, 0.8);
      P.px(x, y, c);
    }
    P.hl(x0, top, x1 - x0, mix(col, 0xffffff, 0.35)); P.hl(x0, top + 1, x1 - x0, mul(col, 0.7));
    // fönster
    for (let wy = top + 5; wy < 38; wy += 10) for (let wx = x0 + 4; wx + 5 < x1 - 2; wx += 9) {
      P.rect(wx - 1, wy - 1, 7, 8, mix(col, 0xffffff, 0.3));
      P.rect(wx, wy, 5, 6, 0x2d4a6b);
      P.px(wx, wy, 0x9fc7e0); P.px(wx + 1, wy, 0x7fb0d0); P.px(wx, wy + 1, 0x7fb0d0);
      if (hash(wx, wy, 9) > 0.7) P.rect(wx + 1, wy + 3, 3, 3, 0xf3d68a);
      P.hl(wx - 1, wy + 7, 7, mul(col, 0.7));
    }
    // butik i bottenplan med markis
    P.rect(x0 + 3, 44, x1 - x0 - 6, 10, 0x33424f);
    P.rect(x0 + 4, 45, (x1 - x0 - 8) >> 1, 8, 0x4f6a7c); P.px(x0 + 4, 45, 0x9fc7e0);
    const aw = hash(x0, 1, 2) > 0.5 ? 0xc9323a : 0x2f8f6f;
    for (let x = x0 + 2; x < x1 - 2; x++) {
      const stripe = ((x - x0) >> 2) % 2 ? aw : 0xf4efe6;
      P.rect(x, 40, 1, 3, stripe); if ((x - x0) % 4 !== 3) P.px(x, 43, mul(stripe, 0.85));
    }
  }
  // träd
  for (const tx of [30, 150, 230]) {
    P.rect(tx - 1, 40, 3, 14, 0x5a3d2b); P.vl(tx - 1, 40, 14, 0x3e2a1d);
    for (let y = 18; y < 44; y++) for (let x = tx - 12; x <= tx + 12; x++) {
      const dd = Math.hypot((x - tx) / 12, (y - 31) / 13) + (hash(x, y, 5) - 0.5) * 0.25;
      if (dd < 1) P.px(x, y, dd < 0.45 && (x - tx) + (y - 31) < 0 ? 0x6fbf5a : dd < 0.8 ? 0x3f9447 : 0x2c6e3a);
    }
  }
  // väg
  P.rect(0, 52, STREET_W, 2, 0xb9b3a6);
  for (let y = 54; y < 66; y++) for (let x = 0; x < STREET_W; x++) P.px(x, y, mul(0x4b4e57, 0.92 + hash(x, y, 7) * 0.16));
  for (let x = 0; x < STREET_W; x += 16) P.rect(x, 59, 9, 1, 0xe6dfc4);
  // trottoarkant + trottoar (här går kunderna)
  P.hl(0, 66, STREET_W, 0xd4d0c6); P.hl(0, 67, STREET_W, 0x8e8a83);
  for (let y = 68; y < WALL_Y; y++) for (let x = 0; x < STREET_W; x++) {
    const row = Math.floor((y - 68) / 6), joint = (y - 68) % 6 === 5 || (x + row * 7) % 14 === 0;
    let c = joint ? 0x9e998f : mul(0xc3beb3, 0.95 + hash(x, y, 8) * 0.08);
    if (!joint && (y - 68) % 6 === 0) c = mix(c, 0xffffff, 0.15);
    P.px(x, y, c);
  }
  // gatlykta
  P.rect(118, 26, 2, 42, 0x2a2d36); P.rect(114, 23, 10, 3, 0x2a2d36); P.rect(115, 26, 8, 2, 0xf7e6a8);
  // trottoarskylt utanför dörren (prylen "trottoarskylt")
  if (opts.items?.askylt) {
    P.rect(141, 60, 15, 16, 0x6b4a33); P.rect(142, 61, 13, 12, 0x223328);
    text(P, SMALL, 'NYHET', 142, 62, 0xf4efe6); P.hl(143, 69, 11, 0xe8b230); P.hl(144, 71, 8, 0x9fd8ef);
    P.vl(141, 76, 3, 0x4a3324); P.vl(155, 76, 3, 0x4a3324);
  }
  return P.flush();
}

// moln som driver (ritas förskjutet och upprepat)
export function paintClouds() {
  const P = new Pix(STREET_W, 30);
  for (const [cx, cy, r] of [[30, 12, 9], [44, 14, 7], [20, 15, 6], [140, 8, 8], [152, 10, 6], [128, 11, 5], [210, 16, 7], [222, 14, 5]]) {
    for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r * 1.6; x <= cx + r * 1.6; x++) {
      const dd = Math.hypot((x - cx) / (r * 1.6), (y - cy) / r);
      if (dd < 1 && y < cy + r * 0.45) P.px(x, y, y > cy + r * 0.1 ? 0xdfe8ee : dd < 0.6 && y < cy ? 0xffffff : 0xf2f6f8, 0.95);
    }
  }
  return P.flush();
}

// ---------- Rummet ----------
// opts: { lokal: 1|2|3, items: { … }, sign, openSlots }  – lokalen styr hur slitet eller fint rummet är
export function paintRoom(theme, opts = {}) {
  const P = new Pix(FW, FH);
  const lokal = opts.lokal || 1, items = opts.items || {};
  let wall = T(theme, 'wall', 0x3d5a80), wallDk = T(theme, 'wallDark', 0x2c4463);
  let flA = T(theme, 'floorA', 0xe9e1d2), flB = T(theme, 'floorB', 0xd8ccb6);
  // 1 Källarhålan: smutsigt och mörkt · 2 Gatuplan: rent men slitet · 3 Kvartersbutiken: som det ska vara
  // 4 Hörnbutiken: finare matta och mer ljus · 5 Datorhuset: stengolv · 6 Megastore: marmor och mässing
  if (lokal === 1) { wall = mix(wall, 0x5a5a4a, 0.45); wallDk = mix(wallDk, 0x3a3a30, 0.45); flA = mix(flA, 0x7a7468, 0.4); flB = mix(flB, 0x5f5a50, 0.4); }
  if (lokal === 2) { wall = mix(wall, 0x6a6a5a, 0.22); wallDk = mix(wallDk, 0x4a4a40, 0.22); flA = mix(flA, 0x8a8478, 0.15); flB = mix(flB, 0x6f6a60, 0.15); }
  if (lokal >= 5) { flA = mix(flA, 0xffffff, 0.35); flB = mix(flB, 0xd9d0c8, 0.3); }
  if (lokal === 6) { flA = mix(flA, 0xfff8f0, 0.5); flB = mix(flB, 0xe8e0d8, 0.4); }
  paintFloor(P, flA, flB, lokal, items, opts.openSlots ?? 3);
  paintWalls(P, wall, wallDk, lokal);
  paintStorefront(P, wall, items, opts.sign, lokal);
  paintWallDecor(P, wall, wallDk, theme, items, lokal);
  if (lokal === 1) { paintWorn(P, wall); paintShabby(P); }
  if (lokal === 2) paintPlain(P, wall);
  if (lokal === 6) paintLuxury(P);
  return P;
}
// Gatuplan: rent men enkelt – några lagade fläckar, en spricka kvar, sparsamt ljus
function paintPlain(P, wall) {
  for (const [x0, y0, w, h] of [[250, 60, 8, 6], [444, 62, 6, 5]]) for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) P.px(x, y, mix(wall, 0xffffff, 0.12));
  let x = 300, y = 36;
  for (let i = 0; i < 14; i++) { P.px(x, y, 0x1a1a24, 0.35); y += 1; x += hash(i, 1, 97) > 0.6 ? 1 : 0; }
  P.darken(6, 7, 500, FH - 7, 0.94);
}
// Megastore: mässingslister, extra spotlights och en röd matta från dörren
function paintLuxury(P) {
  P.hl(6, 55, 500, 0xf0d070); P.hl(6, 56, 500, 0xc8a24a); P.hl(6, 80, 500, 0xf0d070);
  for (const sx of [52, 132, 214, 318, 420, 478, 92, 173, 266, 369, 449]) { P.rect(sx - 3, 3, 7, 6, 0xd8b24a); P.hl(sx - 3, 3, 7, 0xfbe7a0); P.hl(sx - 2, 9, 5, 0xfff8e0); }
  for (let y = WALL_Y + 16; y < WALL_Y + 90; y++) for (let x = DOOR.cx - 18; x < DOOR.cx + 18; x++) { const e = x === DOOR.cx - 18 || x === DOOR.cx + 17; P.px(x, y, e ? 0xd8b24a : mix(0x7a1a2a, 0x9e1b22, (bayer(x, y) - 0.5) * 0.3 + 0.5)); }
  P.rect(DOOR.cx - 18, WALL_Y + 90, 36, 2, 0xd8b24a);
}

function paintFloor(P, flA, flB, lokal = 2, items = {}, openSlots = 3) {
  const TW = lokal >= 5 ? 48 : 32, TH = lokal >= 5 ? 30 : 20;
  for (let y = WALL_Y; y < FH; y++) for (let x = 0; x < FW; x++) {
    const tx = Math.floor(x / TW), ty = Math.floor((y - WALL_Y) / TH);
    const lx = x - tx * TW, ly = (y - WALL_Y) - ty * TH;
    let c = mix(flA, flB, ((tx + ty) & 1) ? 0.18 : 0.62);
    c = mul(c, 0.97 + hash(tx, ty, 1) * 0.05);
    const h = hash(x, y, 2);
    if (h > 0.94) c = mul(c, 0.95); else if (h < 0.02) c = mix(c, 0xffffff, 0.25);
    if (lokal >= 5) { const vein = Math.sin(x * 0.17 + y * 0.31 + Math.sin(x * 0.05) * 4); if (vein > 0.96) c = mix(c, lokal === 6 ? 0xd8b24a : 0xb8b0c4, lokal === 6 ? 0.25 : 0.3); }
    if (lx === 0 || ly === 0) c = mul(c, 0.84);
    else if (lx === 1 || ly === 1) c = mix(c, 0xffffff, 0.2);
    else if (lx + ly > 9 && lx + ly < 12 && ly < 8) c = mix(c, 0xffffff, lokal === 1 ? 0.03 : 0.07); // glans
    P.px(x, y, c);
  }
  // Hörnbutiken och uppåt: extra ljuskäglor på golvet
  if (lokal >= 4) for (const sx of [92, 173, 266, 369, 449]) P.ell(sx, WALL_Y + 40, 30, 14, 0xfff3d0, 0.08, 4);
  // sliten lokal: sprickor, fläckar och skräp
  if (lokal === 1) {
    for (const [cx, cy, len, seed] of [[60, 200, 40, 1], [230, 380, 60, 2], [430, 400, 36, 3], [150, 300, 28, 4], [340, 190, 44, 5]]) {
      let x = cx, y = cy;
      for (let i = 0; i < len; i++) { P.px(x, y, 0x5a5348, 0.8); P.px(x + 1, y, 0x5a5348, 0.4); x += hash(i, seed, 90) > 0.4 ? 1 : 0; y += hash(i, seed, 91) > 0.45 ? 1 : (hash(i, seed, 92) > 0.7 ? -1 : 0); }
    }
    for (const [cx, cy, r] of [[120, 420, 12], [300, 330, 9], [470, 190, 8], [200, 150, 7]]) P.ell(cx, cy, r, r * 0.6, 0x4a4238, 0.35, 3);
    for (let i = 0; i < 40; i++) { const x = Math.floor(hash(i, 1, 93) * FW), y = WALL_Y + Math.floor(hash(i, 2, 94) * (FH - WALL_Y)); P.px(x, y, 0x3a3530, 0.5); }
  }
  // personalgolv bakom disken (gummimatta)
  for (let y = WALL_Y; y < COUNTER.front; y++) for (let x = COUNTER.x0; x < COUNTER.x1; x++) {
    P.px(x, y, ((x + y) % 4 === 0 && (x >> 1) % 2 === 0) ? 0x3a3c44 : 0x2c2e35);
  }
  // ljusfläckar från fönstren
  for (const [x0, , x1] of [[12, 0, 87], [96, 0, 171], [DOOR.x0, 0, DOOR.x1]]) {
    for (let y = WALL_Y; y < WALL_Y + 70; y++) {
      const s = (y - WALL_Y) * 0.55, fade = 1 - (y - WALL_Y) / 70;
      for (let x = Math.round(x0 + s); x < x1 + s; x++) if (bayer(x, y) < fade * 0.9) P.px(x, y, 0xfff6dc, 0.11);
    }
  }
  // dörrmatta
  const mx0 = DOOR.cx - 22, mx1 = DOOR.cx + 22;
  for (let y = WALL_Y + 1; y < WALL_Y + 16; y++) for (let x = mx0; x < mx1; x++) P.px(x, y, (x + y) % 2 ? 0x34363d : 0x2d2f35);
  P.box(mx0, WALL_Y + 1, 44, 15, 0x1f2026);
  text(P, SMALL, 'VÄLKOMMEN', DOOR.cx - (textW(SMALL, 'VÄLKOMMEN') >> 1), WALL_Y + 6, 0xb9b3a6);
  P.hl(DOOR.x0, WALL_Y, DOOR.x1 - DOOR.x0, 0xa9aeb8);
  // museimatta under stjärnobjektet
  paintRug(P, ROPE.x0 - 10, ROPE.back - 12, ROPE.x1 + 10, ROPE.front + 12, 0x5e1622, 0xd8b24a, 'museum');
  // väntrumsmatta (finare med prylen "ny matta")
  if (items.matta || lokal >= 4) paintRug(P, SOFA.x0 - 14, SOFA.base - 36, ARMCHAIR.x1 + 10, TABLE.base + 26, lokal >= 6 ? 0x2a2a4a : 0x7a2a3e, lokal >= 6 ? 0xd8b24a : 0xe8c26a, 'museum');
  else paintRug(P, SOFA.x0 - 10, SOFA.base - 32, ARMCHAIR.x1 + 8, TABLE.base + 22, lokal <= 2 ? 0x5a5a52 : 0x3f5667, lokal <= 2 ? 0x8a8478 : 0xd9d2c3, 'stripe');
  // ljuskäglor på golvet
  P.ell(HERO.cx, HERO.base - 22, 88, 42, 0xfff3d0, 0.22, 6);
  SLOTS.forEach((v, i) => { if (i < openSlots) P.ell((v.x0 + v.x1) / 2, v.base - 8, (v.x1 - v.x0) * 0.62, 26, 0xfff3d0, 0.14); });
  P.ell(QUEUE[0][0], QUEUE[0][1] + 16, 46, 36, 0xfff3d0, 0.09);
  P.ell(PICKUP[0][0], PICKUP[0][1] + 16, 46, 36, 0xfff3d0, 0.09);
  // golvdekaler: stå här
  for (const [fx, fy, col] of [[QUEUE[0][0], QUEUE[0][1], 0xe8b230], [PICKUP[0][0], PICKUP[0][1], 0x45b964]]) {
    P.rect(fx - 12, fy - 5, 24, 9, col, 0.85); P.box(fx - 12, fy - 5, 24, 9, mul(col, 0.6), 0.9);
    for (const sx of [-6, 3]) { P.rect(fx + sx, fy - 3, 3, 3, 0x2a2430, 0.7); P.rect(fx + sx, fy + 1, 3, 1, 0x2a2430, 0.7); }
  }
  // kontaktskuggor under möbler
  for (const v of SLOTS) shadowRect(P, v.x0 + 1, v.base, v.x1 - v.x0 - 2, 4);
  shadowRect(P, COUNTER.x0, COUNTER.base, COUNTER.x1 - COUNTER.x0, 4);
  shadowRect(P, SOFA.x0 + 2, SOFA.base, SOFA.x1 - SOFA.x0 - 4, 3);
  shadowRect(P, ARMCHAIR.x0 + 2, ARMCHAIR.base, ARMCHAIR.x1 - ARMCHAIR.x0 - 4, 3);
  shadowRect(P, TABLE.x0 + 2, TABLE.base, TABLE.x1 - TABLE.x0 - 4, 3);
  P.ell(HERO.cx, HERO.base + 1, 54, 5, 0x140c1c, 0.35, 3);
  // mörkare golv längs väggen (ambient occlusion)
  for (let y = WALL_Y; y < WALL_Y + 7; y++) for (let x = 0; x < FW; x++) {
    if (x >= DOOR.x0 && x < DOOR.x1) continue;
    if (bayer(x, y) < 1 - (y - WALL_Y) / 7) P.px(x, y, 0x1a1426, 0.18);
  }
}

function shadowRect(P, x, y, w, h) {
  for (let j = 0; j < h; j++) for (let i = -2; i < w + 2; i++) {
    const edge = i < 0 || i >= w;
    if (bayer(x + i, y + j) < (1 - j / h) * (edge ? 0.5 : 1)) P.px(x + i, y + j, 0x140c1c, 0.28);
  }
}

function paintRug(P, x0, y0, x1, y1, base, trim, kind) {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const bx = Math.min(x - x0, x1 - 1 - x), by = Math.min(y - y0, y1 - 1 - y), b = Math.min(bx, by);
    let c = mul(base, 0.95 + hash(x, y, 11) * 0.08);
    if (b === 0) c = mul(base, 0.6);
    else if (b === 2 || b === 3) c = trim;
    else if (kind === 'museum' && b > 6) {
      const u = Math.abs(((x - x0) % 16) - 8) + Math.abs(((y - y0) % 12) - 6);
      if (u === 5) c = mix(base, trim, 0.45);
      if (u === 0) c = trim;
    } else if (kind === 'stripe' && b > 5 && ((y - y0) >> 2) % 3 === 0) c = mix(base, trim, 0.18);
    if (b === 1 && (x + y) % 2) c = mix(c, 0x000000, 0.2);
    P.px(x, y, c);
  }
  for (let x = x0 + 1; x < x1 - 1; x += 2) { P.px(x, y1, mix(trim, base, 0.4)); }
}

function paintWalls(P, wall, wallDk, lokal = 2) {
  for (let y = 7; y < 80; y++) for (let x = 6; x < 506; x++) {
    let c = mix(mul(wall, 0.8), wall, Math.min(1, (y - 7) / 26) + (bayer(x, y) - 0.5) * 0.12);
    if (x % 40 === 0) c = mul(c, 0.9); else if (x % 40 === 1) c = mix(c, 0xffffff, 0.05);
    if (y >= 57) { // bröstpanel
      const px = (x - 6) % 36, py = y - 57;
      c = wallDk;
      if (py === 0) c = mul(wallDk, 0.75);
      else if (px === 3 || py === 3) c = mix(wallDk, 0xffffff, 0.12);
      else if (px === 32 || py === 19) c = mul(wallDk, 0.78);
      else if (px > 3 && px < 32 && py > 3 && py < 19) c = mix(wallDk, wall, 0.18 + (bayer(x, y) - 0.5) * 0.06);
    }
    P.px(x, y, c);
  }
  // listverk
  P.hl(6, 55, 500, 0xd4b27c); P.hl(6, 56, 500, 0x8a6a45);
  // väggbelysning från spotlights (i den slitna lokalen är två trasiga)
  for (const sx of SPOT_X) for (let y = 9; y < 70; y++) {
    if (lokal <= 2 && (sx === 132 || sx === 420)) break;
    const half = 2 + (y - 9) * 0.42, fade = 1 - (y - 9) / 61;
    for (let x = Math.floor(sx - half); x <= sx + half; x++) {
      const e = 1 - Math.abs(x - sx) / half;
      if (bayer(x, y) < e * fade * 1.1) P.px(x, y, 0xfff4d6, 0.07 + 0.05 * fade);
    }
  }
  // sockel
  P.rect(6, 80, 500, 6, 0x2b2a33); P.hl(6, 80, 500, 0x4c4a58); P.hl(6, 85, 500, 0x1b1a21);
  // tak + skenor + spotlights
  P.rect(0, 0, FW, 7, 0x1c1f2b); P.hl(0, 6, FW, 0x0f1118); P.hl(6, 3, 500, 0x5a5f6e); P.hl(6, 4, 500, 0x3a3e4a);
  for (const sx of SPOT_X) {
    const dead = lokal <= 2 && (sx === 132 || sx === 420);
    P.rect(sx - 2, 4, 5, 5, 0x2a2d36); P.vl(sx - 2, 4, 5, 0x4a4f5c); P.hl(sx - 2, 9, 5, dead ? 0x6a6a60 : 0xfff2c0); if (!dead) P.px(sx, 9, 0xffffff);
  }
  if (lokal >= 4) for (const sx of [92, 173, 266, 369, 449]) { P.rect(sx - 2, 4, 5, 5, 0x2a2d36); P.hl(sx - 2, 9, 5, 0xfff2c0); P.px(sx, 9, 0xffffff); }
  // sidoväggar
  for (const x0 of [0, 506]) { P.rect(x0, 0, 6, FH, 0x1c1f2b); P.vl(x0 === 0 ? 5 : 506, 7, FH - 7, 0x363c50); }
}

function glass(P, x0, y0, x1, y1, a = 0.16) {
  P.erase(x0, y0, x1 - x0, y1 - y0);
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const s = (x - x0 + (y - y0)) % 46;
    P.px(x, y, 0xdff0ff, s < 3 ? a + 0.2 : s === 6 ? a + 0.13 : a);
  }
}

function frameRect(P, x0, y0, x1, y1, t = 3) {
  P.rect(x0 - t, y0 - t, x1 - x0 + t * 2, t, 0x3b4150); P.rect(x0 - t, y1, x1 - x0 + t * 2, t, 0x2b303b);
  P.rect(x0 - t, y0, t, y1 - y0, 0x353a48); P.rect(x1, y0, t, y1 - y0, 0x2b303b);
  P.hl(x0 - t, y0 - t, x1 - x0 + t * 2, 0x6d7486); P.vl(x0 - t, y0 - t, y1 - y0 + t * 2, 0x5d6476);
  P.hl(x0 - 1, y0 - 1, x1 - x0 + 2, 0x23262f);
}

function paintStorefront(P, wall, items = {}, sign = '', lokal = 3) {
  for (const [x0, y0, x1, y1] of WIN) {
    glass(P, x0, y0, x1, y1);
    frameRect(P, x0, y0, x1, y1);
    const mx = (x0 + x1) >> 1;
    P.rect(mx - 1, y0, 2, y1 - y0, 0x3b4150); P.vl(mx - 1, y0, y1 - y0, 0x6d7486);
    // fönsterbräda
    P.rect(x0 - 5, y1 + 3, x1 - x0 + 10, 2, 0xdcbf92); P.rect(x0 - 5, y1 + 5, x1 - x0 + 10, 2, 0x8e6d4a); P.hl(x0 - 4, y1 + 7, x1 - x0 + 8, 0x3a2c22);
  }
  // krukväxt + liten robotfigur på fönsterbrädorna
  plantSmall(P, 28, 74);
  // skyltfönsteraffisch (prylen "affisch")
  if (items.affisch) {
    P.rect(104, 28, 30, 38, 0xf4efe2); P.box(104, 28, 30, 38, 0x17151a);
    for (let y = 30; y < 50; y++) for (let x = 106; x < 132; x++) P.px(x, y, mix(0x2c6fb7, 0x7ee8fa, (y - 30) / 20 + (bayer(x, y) - 0.5) * 0.2));
    P.rect(112, 36, 14, 9, 0x2a2d33); P.rect(114, 38, 10, 5, 0x76b900);
    P.rect(104, 52, 30, 14, 0xc9323a); text(P, SMALL, 'NYHET!', 106, 55, 0xffffff);
    P.hl(104, 27, 30, 0x8a8f9c);
  }
  // lysande fasadskylt ovanför fönstren (prylen "lysande fasadskylt" – ingår från Hörnbutiken)
  if (items.logoskylt || lokal >= 4) {
    const x0 = 14, x1 = 170, y0 = 8, y1 = 17;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) P.px(x, y, mix(0x1a1a24, 0x2a2a36, bayer(x, y)));
    P.box(x0, y0, x1 - x0, y1 - y0, 0xd8b24a);
    const t = String(sign || 'BUTIKEN').toUpperCase(), tw = textW(SMALL, t);
    text(P, SMALL, t, Math.round((x0 + x1 - tw) / 2), y0 + 2, 0xfff2a0);
    for (let x = x0 + 3; x < x1 - 3; x += 4) P.px(x, y1 - 2, 0xffd23a);
  }
  // dörr: karm, överljus och öppning
  const { x0, x1 } = DOOR;
  glass(P, TRANSOM[0], TRANSOM[1], TRANSOM[2], TRANSOM[3], 0.14);
  P.rect(x0 - 3, 9, x1 - x0 + 6, 3, 0x3b4150); P.hl(x0 - 3, 9, x1 - x0 + 6, 0x6d7486);
  P.rect(x0, 22, x1 - x0, 4, 0x3b4150); P.hl(x0, 22, x1 - x0, 0x5d6476); P.hl(x0, 25, x1 - x0, 0x23262f);
  P.erase(x0, 26, x1 - x0, WALL_Y - 26);
  P.rect(x0 - 3, 9, 3, WALL_Y - 9, 0x353a48); P.vl(x0 - 3, 9, WALL_Y - 9, 0x6d7486);
  P.rect(x1, 9, 3, WALL_Y - 9, 0x2b303b); P.vl(x1 + 2, 9, WALL_Y - 9, 0x1f232b);
  text(P, SMALL, 'INGÅNG', DOOR.cx - 11, 15, 0xffffff, 0.75);
  // pelare mellan skyltfönster och innervägg
  for (let y = 7; y < 86; y++) for (let x = 238; x < 250; x++) {
    let c = mix(wall, 0xffffff, 0.08);
    if (x === 238) c = mix(wall, 0xffffff, 0.25); if (x >= 248) c = mul(wall, 0.72);
    if (y >= 80) c = y === 80 ? 0x4c4a58 : 0x2b2a33;
    P.px(x, y, c);
  }
}

export function plantSmall(P, x, y) {
  P.rect(x - 4, y - 6, 9, 6, 0xb5652f); P.hl(x - 4, y - 6, 9, 0xd88a50); P.vl(x + 4, y - 5, 5, 0x8c4a22);
  const leaves = [[-5, -12, 0x2f8f46], [2, -14, 0x2f8f46], [-2, -16, 0x45b964], [3, -10, 0x45b964], [-4, -9, 0x3a9f50]];
  for (const [dx, dy, c] of leaves) { P.rect(x + dx, y + dy, 3, 5, c); P.px(x + dx, y + dy, mix(c, 0xffffff, 0.3)); }
}

function paintWallDecor(P, wall, wallDk, theme, items = {}, lokal = 2) {
  // neonskyltens bakplatta
  const [nx0, ny0, nx1, ny1] = NEON_BOX;
  for (let y = ny0; y < ny1; y++) for (let x = nx0; x < nx1; x++) P.px(x, y, mul(0x1e2029, 0.9 + ((x * 7) % 5) * 0.03));
  P.box(nx0, ny0, nx1 - nx0, ny1 - ny0, 0x3a3d4a); P.hl(nx0 + 1, ny1, nx1 - nx0 - 1, 0x10111a, 0.6);
  for (const [bx, by] of [[nx0 + 3, ny0 + 3], [nx1 - 5, ny0 + 3], [nx0 + 3, ny1 - 5], [nx1 - 5, ny1 - 5]]) { P.rect(bx, by, 2, 2, 0x8a8f9c); P.px(bx, by, 0xd0d4dc); }
  // vägghylla (lådor ritas dynamiskt efter lagret) – grövre ställning med större lager
  const S = SHELF;
  const lager = items.lager4 ? 4 : items.lager3 ? 3 : items.lager2 ? 2 : 1;
  P.rect(S.x0 + 2, 28, 2, 52, 0x2f323b); P.rect(S.x1 - 4, 28, 2, 52, 0x2f323b); P.vl(S.x0 + 2, 28, 52, 0x5a5f6e); P.vl(S.x1 - 4, 28, 52, 0x5a5f6e);
  if (lager >= 2) { P.rect(S.x0 + 2, 30, 2, 2, 0xe8b230); P.rect(S.x1 - 4, 30, 2, 2, 0xe8b230); }
  if (lager >= 3) { P.rect(S.x0 + 1, 28, 1, 52, 0xe8b230); P.rect(S.x1 - 2, 28, 1, 52, 0xe8b230); }
  if (lager >= 4) { P.rect(S.x0 - 2, 26, 4, 56, 0xd8b24a); P.rect(S.x1 - 2, 26, 4, 56, 0xd8b24a); }
  for (const by of S.boards) {
    P.rect(S.x0, by, S.x1 - S.x0, 2, 0xd9b98a); P.rect(S.x0, by + 2, S.x1 - S.x0, 2, 0x8a6446); P.hl(S.x0, by + 4, S.x1 - S.x0, 0x1a1426, 0.35);
    for (let x = S.x0; x < S.x1; x++) if (hash(x, by, 12) > 0.8) P.px(x, by + 1, 0xc4a276);
  }
  const lagerTxt = ['', 'LAGER', 'LAGER 2', 'LAGER 3', 'PROFFSLAGER'][lager], lagerW = textW(SMALL, lagerTxt) + 6;
  P.rect(S.x0 + 1, 21, lagerW, 7, 0x1b1f2a); P.box(S.x0 + 1, 21, lagerW, 7, 0x3a3f4d); text(P, SMALL, lagerTxt, S.x0 + 4, 22, 0xe8b230);
  // luftkonditionering på väggen
  if (items.ac) { P.rect(256, 9, 32, 9, 0xe8e4da); P.hl(256, 9, 32, 0xffffff); P.hl(256, 17, 32, 0xb8b4aa); for (let x = 258; x < 286; x += 2) P.px(x, 14, 0x9aa0aa); P.px(284, 11, 0x45e06a); }
  // affisch med stjärnobjektet (ikonen läggs på av floor.js)
  const [px0, py0, px1, py1] = POSTER;
  P.rect(px0 - 1, py0 - 1, px1 - px0 + 2, py1 - py0 + 2, 0x15151a);
  for (let y = py0; y < py1; y++) for (let x = px0; x < px1; x++) P.px(x, y, mix(0x151b3a, 0x4a1f4a, (y - py0) / (py1 - py0) + (bayer(x, y) - 0.5) * 0.15));
  for (let i = 0; i < 20; i++) P.px(px0 + ((i * 11) % 26) + 1, py0 + ((i * 7) % 14) + 1, 0xffffff, 0.5);
  P.rect(px0, py1 - 9, px1 - px0, 9, 0x76b900); text(P, SMALL, 'NYHET', px0 + 4, py1 - 7, 0x10140a);
  P.hl(px0 - 1, py1 + 1, px1 - px0 + 2, 0x0e0a14, 0.35);
  // klocka
  const [cx, cy, r] = CLOCK;
  for (let y = -r - 1; y <= r + 1; y++) for (let x = -r - 1; x <= r + 1; x++) {
    const dd = Math.hypot(x, y);
    if (dd < r + 0.5) P.px(cx + x, cy + y, dd > r - 1.2 ? 0x2a2d36 : (x + y < -4 ? 0xffffff : 0xf1ece2));
    else if (dd < r + 1.5 && x + y > 0) P.px(cx + x, cy + y, 0x0e0a14, 0.3);
  }
  for (const [dx, dy] of [[0, -6], [6, 0], [0, 6], [-6, 0]]) P.px(cx + dx, cy + dy, 0x2a2d36);
  // tv-skärm på väggarm
  const [tx0, ty0, tx1, ty1] = TV;
  P.rect(((tx0 + tx1) >> 1) - 3, ty1, 6, 3, 0x2a2d36);
  P.rect(tx0 - 2, ty0 - 2, tx1 - tx0 + 4, ty1 - ty0 + 4, 0x15161b); P.hl(tx0 - 2, ty0 - 2, tx1 - tx0 + 4, 0x3a3d48);
  P.hl(tx0 - 1, ty1 + 2, tx1 - tx0 + 2, 0x0e0a14, 0.35); P.px(tx1, ty1 + 1, 0x45e06a);
  // brandsläckare
  P.rect(446, 60, 5, 15, 0xc9323a); P.vl(447, 61, 13, 0xe86a70); P.rect(447, 57, 3, 3, 0x2a2d36); P.rect(445, 66, 7, 2, 0x2a2d36);
  // verkstadsdörren
  const dx0 = 456, dx1 = 500, dy0 = 38;
  P.rect(dx0 - 3, dy0 - 3, dx1 - dx0 + 6, WALL_Y - dy0 + 3, 0x2b2f38); P.hl(dx0 - 3, dy0 - 3, dx1 - dx0 + 6, 0x4a5060);
  for (let y = dy0; y < WALL_Y; y++) for (let x = dx0; x < dx1; x++) {
    let c = mul(0x5c6b7a, 0.95 + hash(x, y >> 2, 13) * 0.08);
    if (x === dx0) c = 0x7d8c9b; if (x === dx1 - 1) c = 0x46525e;
    P.px(x, y, c);
  }
  P.rect(469, 44, 18, 15, 0x23262f); // fönster med varmt ljus
  for (let y = 45; y < 58; y++) for (let x = 470; x < 486; x++) P.px(x, y, mix(0xffd27a, 0xe0873a, (y - 45) / 13 + (bayer(x, y) - 0.5) * 0.2));
  P.hl(470, 50, 16, 0x7a4a26); P.hl(470, 55, 16, 0x7a4a26); P.rect(472, 47, 3, 3, 0x5a3d2b); P.rect(479, 52, 4, 3, 0x2c6fb7);
  P.px(470, 45, 0xfff4d0); P.px(471, 45, 0xfff4d0);
  P.rect(490, 60, 4, 10, 0xc8ccd2); P.vl(490, 60, 10, 0xeef0f3);
  for (let y = 77; y < WALL_Y; y++) for (let x = dx0; x < dx1; x++) P.px(x, y, ((x + y) >> 2) % 2 ? 0xe8b230 : 0x23232a);
  P.rect(452, 24, 52, 10, 0x1b1f2a); P.box(452, 24, 52, 10, 0xe8b230, 0.8);
  text(P, SMALL, 'VERKSTAD', 478 - (textW(SMALL, 'VERKSTAD') >> 1), 27, 0xe8b230);
  // eluttag
  P.rect(268, 68, 6, 6, 0xe8e4da); P.px(270, 70, 0x555555); P.px(272, 70, 0x555555);
  // stereo på bänken bakom disken
  if (items.stereo) {
    P.rect(334, 64, 22, 12, 0x2a2d33); P.hl(334, 64, 22, 0x5a5f6a); P.rect(336, 66, 6, 6, 0x0b0c10); P.rect(348, 66, 6, 6, 0x0b0c10);
    P.px(338, 68, 0x3a78d8); P.px(350, 68, 0x3a78d8); P.rect(343, 67, 4, 2, 0x45e06a); P.rect(343, 70, 4, 1, 0xe8b230); P.rect(343, 72, 4, 1, 0xe23b5a);
    P.rect(340, 62, 1, 2, 0x8a8f9c); P.rect(354, 60, 1, 4, 0x8a8f9c);
  }
}

// Sliten lokal, del två: plywood för ett fönster, spindelväv i hörnen, flagnande tapet och
// smutsigare ljus – det ska synas på tre meters håll att butiken behöver renoveras
function paintShabby(P) {
  // plywoodskivor spikade över högra fönstret
  const [x0, y0, x1, y1] = WIN[1];
  for (let y = y0 - 1; y < y1 + 1; y++) for (let x = x0 - 2; x < x1 + 2; x++) {
    const board = Math.floor((y - y0) / 12), edge = (y - y0) % 12 === 0 || (y - y0) % 12 === 11;
    let c = mix(0xb08a58, 0xc9a36b, hash(x >> 2, board, 61) * 0.6 + (bayer(x, y) - 0.5) * 0.1);
    if (edge) c = mul(c, 0.7);
    if (hash(x, y, 62) > 0.985) c = 0x5a3d2b;
    P.px(x, y, c);
  }
  for (let by = y0 + 3; by < y1; by += 12) { P.px(x0, by, 0x3a3a44); P.px(x1 - 2, by, 0x3a3a44); }
  P.rect(x0 + 8, y0 + 20, 26, 12, 0xf4efe2); P.box(x0 + 8, y0 + 20, 26, 12, 0x17151a); text(P, SMALL, 'TRASIG', x0 + 10, y0 + 23, 0xc9323a);
  // spindelväv i övre hörnen
  const web = (cx, cy, dir) => { for (let i = 0; i < 14; i++) { P.px(cx + dir * i, cy + Math.round(i * 0.55), 0x9a9a90, 0.5); P.px(cx + dir * Math.round(i * 0.5), cy + i, 0x9a9a90, 0.5); P.px(cx + dir * i, cy + Math.round(i * 0.2), 0x9a9a90, 0.35); } for (let i = 3; i < 13; i += 4) for (let j = 0; j <= i; j++) P.px(cx + dir * (i - Math.round(j * 0.55)), cy + Math.round(j * (i / 13) + i * 0.3), 0xb8b8b0, 0.35); };
  web(7, 8, 1); web(505, 8, -1); web(238, 8, 1);
  // flagnande tapet vid pelaren och bakom disken
  for (const [px, py, w, h] of [[250, 12, 8, 14], [300, 40, 10, 9], [446, 40, 7, 12]]) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w - Math.round(y * 0.4); x++) P.px(px + x, py + y, y < 2 ? 0xd8d0b8 : mix(0x6a5a4a, 0x8a7a5a, hash(x, y, 63)));
    P.hl(px, py + h, w, 0x1a1a24, 0.4);
  }
  // en trasig takspot hänger i sladden
  P.rect(131, 9, 3, 6, 0x2a2d36); P.px(132, 15, 0x4a4f5c); P.px(133, 16, 0x2a2d36);
  // smutsigare ljus: hela rummet lite dunklare
  P.darken(6, 7, 500, FH - 7, 0.86);
}

// Sliten lokal: fläckar, avflagad färg, hink under läckan
function paintWorn(P, wall) {
  // fuktfläck uppe på väggen vid pelaren
  for (let y = 8; y < 30; y++) for (let x = 236; x < 262; x++) {
    const d = Math.hypot((x - 248) / 14, (y - 12) / 14) + (hash(x, y, 95) - 0.5) * 0.3;
    if (d < 1) P.px(x, y, 0x6a5a3a, 0.35 * (1 - d));
  }
  // avflagad färg
  for (const [x0, y0, w, h] of [[250, 60, 8, 6], [258, 44, 5, 9], [444, 62, 6, 5], [240, 30, 6, 4]]) {
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (hash(x, y, 96) > 0.3) P.px(x, y, mix(wall, 0xd8d0b8, 0.5));
  }
  // spricka i väggen
  let x = 300, y = 36;
  for (let i = 0; i < 22; i++) { P.px(x, y, 0x1a1a24, 0.6); y += 1; x += hash(i, 1, 97) > 0.6 ? 1 : hash(i, 2, 97) > 0.7 ? -1 : 0; }
  // hink på golvet under fläcken
  const bx = 252, by = WALL_Y + 24;
  P.ell(bx + 1, by + 1, 7, 2, 0x140c1c, 0.3, 2);
  P.rect(bx - 5, by - 10, 10, 10, 0x8a8f9c); P.hl(bx - 5, by - 10, 10, 0xc8ccd6); P.vl(bx + 4, by - 10, 10, 0x5a5f6a);
  P.hl(bx - 4, by - 8, 8, 0x3a78d8); P.hl(bx - 6, by - 12, 12, 0x2a2d36); P.px(bx - 6, by - 11, 0x2a2d36); P.px(bx + 5, by - 11, 0x2a2d36);
  // tejpad lapp på väggen
  P.rect(226, 60, 10, 8, 0xf4efe2); P.hl(226, 60, 10, 0xffd23a); P.hl(228, 63, 6, 0x8a8f9c); P.hl(228, 65, 5, 0x8a8f9c);
}
