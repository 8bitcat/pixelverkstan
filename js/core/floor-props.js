// Möbler och montrar för butiksgolvet, ritade pixel för pixel till egna canvasar.
// Varje funktion returnerar { img, x, y } (scenkoordinater för övre vänstra hörnet)
// eller, för montrar, separata lager under/över innehållet.
import { Pix, hex, mul, mix, hash, bayer, SMALL, BIG, textW, text } from './floor-pix.js';
import { COUNTER, SOFA, ARMCHAIR, TABLE, ROPE } from './floor-layout.js';

// ---------- Museimonter (bordsmonter med glashuv) ----------
export const VIT = { GH: 16, D: 40, BH: 20, PL: 3 };
VIT.H = VIT.D + VIT.GH + VIT.BH + VIT.PL; // baslinjen = rad H-1
// skylthöjd ovanför huven per båsnivå (0 = kategorihylla utan skylt)
export const HEAD_H = [0, 12, 14, 18];

// brand = { name, color }, level 1–3 ger en skylt ovanför huven (märkeshylla, belyst monter,
// flaggskeppsmonter). Bilderna blir HEAD_H[level] högre; baslinjen ligger fortfarande sist.
export function makeVitrine(W, title, velvet, brand = null, level = 0) {
  const { GH, D, BH, PL } = VIT;
  const HH = brand ? HEAD_H[level] || 0 : 0, H = VIT.H + HH;
  const U0 = new Pix(W, H, 0, -HH), O0 = new Pix(W, H, 0, -HH);
  paintVitrineBody(U0, O0, W, title, velvet, brand, level);
  if (brand && HH) paintBoothHead(U0, O0, W, HH, brand, level);
  return { under: U0.flush(), over: O0.flush(), W, H, HH, level, brand };
}

// skylten ovanför huven (ritas i negativa y, ovanför glaset)
function paintBoothHead(U, O, W, HH, brand, level) {
  const c = hex(brand.color, 0x76b900), y0 = -HH, name = String(brand.name).toUpperCase();
  const lit = level >= 2;
  // stolpar som håller skylten
  for (const x of [3, W - 5]) { U.rect(x, y0 + HH - 3, 2, 4, 0x2a2730); U.px(x, y0 + HH - 3, 0x55505e); }
  // panel
  const px0 = 1, pw = W - 2, ph = HH - 3;
  if (lit) {
    for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) {
      const t = y / ph;
      U.px(px0 + x, y0 + y, mix(mix(c, 0xffffff, 0.35), c, t + (bayer(x, y) - 0.5) * 0.12));
    }
    U.hl(px0, y0, pw, mix(c, 0xffffff, 0.6));
    // glöd uppåt
    for (let i = 1; i <= 3; i++) U.dith(px0 + i, y0 - i, pw - i * 2, 1, c, 0.7 - i * 0.2, 0.5);
  } else {
    for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) U.px(px0 + x, y0 + y, mix(0x1c1e26, 0x2a2d38, (bayer(x, y) - 0.5) * 0.4 + 0.5));
    U.hl(px0, y0, pw, 0x3a3f4c);
  }
  U.box(px0, y0, pw, ph, level >= 3 ? 0xd8b24a : 0x0f1016);
  if (level >= 3) { U.hl(px0 + 1, y0 + 1, pw - 2, 0xfbe7a0); U.hl(px0 + 1, y0 + ph - 2, pw - 2, 0x8a6a24); }
  // texten: stor på breda skyltar, liten på smala
  const F = textW(BIG, name) + 8 <= pw - (level >= 3 ? 30 : 0) ? BIG : SMALL;
  const tw = textW(F, name), tx = Math.round((W - tw) / 2) - (level >= 3 ? 12 : 0), ty = y0 + Math.round((ph - F.h) / 2) + (F === SMALL ? 1 : 0);
  const ink = lit ? 0xffffff : c;
  if (lit) text(U, F, name, tx + 1, ty + 1, mul(c, 0.55));
  text(U, F, name, tx, ty, ink);
  // nivå 3: liten demoskärm till höger och spotlights i kanten
  if (level >= 3) {
    const sx = W - 27, sy = y0 + 2;
    U.rect(sx, sy, 24, ph - 4, 0x0b0c10); U.box(sx, sy, 24, ph - 4, 0x3a3d48);
    for (const lx of [10, W - 12]) { U.rect(lx, y0 - 4, 4, 4, 0x2a2d36); U.hl(lx, y0 - 4, 4, 0x55505e); U.hl(lx, y0, 4, 0xfff2c0); }
  }
  // ljusstrimma på glaset från skylten
  if (lit) O.dith(2, 0, W - 4, 3, c, 0.5, 0.35);
}

function paintVitrineBody(U, O, W, title, velvet, brand, level) {
  const { GH, D, BH, PL } = VIT;
  const bc = brand ? hex(brand.color, 0x76b900) : null;
  const vel = level >= 2 && bc ? mix(velvet, bc, 0.35) : velvet, velDk = mix(mul(vel, 0.45), 0x0a0612, 0.3);
  // bakre sammetspanel
  for (let y = 1; y <= GH; y++) for (let x = 1; x < W - 1; x++) {
    U.px(x, y, mix(velDk, mul(vel, 0.8), (y - 1) / GH + (bayer(x, y) - 0.5) * 0.15));
  }
  U.hl(1, GH, W - 2, mul(velDk, 0.7));
  // botten (sammet) med ljusfläck
  for (let y = GH + 1; y < GH + D; y++) for (let x = 1; x < W - 1; x++) {
    const t = Math.hypot((x - W / 2) / (W * 0.5), (y - GH - D * 0.45) / (D * 0.7));
    let c = mix(mix(vel, 0xfff0d8, 0.16), mul(vel, 0.7), Math.min(1, t) + (bayer(x, y) - 0.5) * 0.14);
    if (hash(x, y, 21) > 0.9) c = mul(c, 1.08);
    U.px(x, y, c);
  }
  // led-list inne i taket (i märkets färg på belysta montrar)
  const led = level >= 2 && bc ? mix(bc, 0xffffff, 0.55) : 0xfff6d8;
  U.hl(2, 1, W - 4, led); U.hl(2, 2, W - 4, led, 0.35);
  // underskåp
  const b0 = GH + D;
  U.hl(0, b0, W, 0x2a2018); U.hl(0, b0 + 1, W, 0xe0c28e); U.hl(0, b0 + 2, W, 0xb8955f);
  for (let y = b0 + 3; y < b0 + BH; y++) for (let x = 0; x < W; x++) {
    const grain = Math.sin(x * 0.18 + Math.sin(y * 0.9 + x * 0.05) * 2.2 + y * 0.35);
    let c = mix(0x5a3a26, 0x7a5236, 0.5 + grain * 0.35 + (hash(x, y, 22) - 0.5) * 0.2);
    if (x === 0) c = 0x8a6446; if (x === W - 1) c = 0x3a2618;
    U.px(x, y, c);
  }
  U.hl(0, b0 + 3, W, 0xc8a24a); U.hl(0, b0 + 4, W, 0x7a5a24);
  U.hl(0, b0 + BH - 2, W, 0xc8a24a); U.hl(0, b0 + BH - 1, W, 0x3a2618);
  U.bevel(4, b0 + 6, W - 8, BH - 9, 0x3a2618, 0x9a7050);
  // mässingsskylt
  const tw = textW(SMALL, title), pw = Math.max(40, tw + 10), px0 = Math.round((W - pw) / 2), py0 = b0 + 7;
  U.rect(px0, py0, pw, 9, 0xd8b85a); U.box(px0, py0, pw, 9, 0x8a6a2a); U.hl(px0 + 1, py0 + 1, pw - 2, 0xf6e2a0);
  U.px(px0 + 2, py0 + 4, 0x8a6a2a); U.px(px0 + pw - 3, py0 + 4, 0x8a6a2a);
  text(U, SMALL, title, Math.round((W - tw) / 2), py0 + 2, 0x3a2a10);
  // sockel
  U.rect(2, b0 + BH, W - 4, PL, 0x1b1a1f); U.hl(2, b0 + BH, W - 4, 0x0e0d12);

  // glaset (över innehållet)
  for (let y = 0; y < D + GH; y++) for (let x = 1; x < W - 1; x++) {
    const front = y >= D;
    const s = (x + y + 7) % 58;
    let a = front ? 0.11 : 0.06;
    if (s < 3) a += front ? 0.2 : 0.16; else if (s === 6 || s === 7) a += 0.1;
    O.px(x, y, 0xe8f6ff, a);
  }
  O.hl(1, D, W - 2, 0xffffff, 0.6); O.hl(1, D + 1, W - 2, 0xffffff, 0.15);
  O.hl(1, D + GH - 1, W - 2, 0x0e0a14, 0.25);
  // metallram
  const fr = 0x3a3228, frHi = 0xd9c088;
  O.hl(0, 0, W, fr); O.hl(1, 0, W - 2, mix(fr, frHi, 0.5));
  O.vl(0, 0, D + GH, fr); O.vl(W - 1, 0, D + GH, fr);
  O.vl(0, D, GH, frHi); O.vl(1, D, GH, 0xffffff, 0.2); O.vl(W - 2, D, GH, 0x0e0a14, 0.2);
  O.hl(0, D - 1, W, frHi, 0.8);
  O.px(0, D - 1, 0xfff4c0); O.px(W - 1, D - 1, 0xfff4c0);
}

// ---------- Tornmonter (smal, hög glasmonter för de små platserna) ----------
export const TOWER = { W: 40, H: 96, D: 24, SH: 3 };   // tre hyllplan
export function makeTower(title, velvet, brand = null, level = 0) {
  const { W, H, D } = TOWER, HH = brand ? 10 : 0;
  const U = new Pix(W, H, 0, 0), O = new Pix(W, H, 0, 0);
  const bc = brand ? hex(brand.color, 0x76b900) : null;
  const vel = level >= 2 && bc ? mix(velvet, bc, 0.35) : velvet;
  const top = HH, glassH = H - top - 14, shelfH = Math.floor(glassH / 3);
  // insida: sammet bak och tre hyllplan
  for (let y = top + 1; y < top + glassH; y++) for (let x = 2; x < W - 2; x++) {
    const k = ((y - top) % shelfH) / shelfH;
    U.px(x, y, mix(mul(vel, 0.55), mul(vel, 0.9), k + (bayer(x, y) - 0.5) * 0.15));
  }
  for (let i = 1; i <= 3; i++) {
    const sy = top + i * shelfH;
    U.hl(2, sy - 1, W - 4, 0xd9c088); U.hl(2, sy, W - 4, 0x6a5a30); U.hl(2, sy - 2, W - 4, mix(vel, 0xffffff, 0.25));
    const led = level >= 2 && bc ? mix(bc, 0xffffff, 0.5) : 0xfff6d8;
    U.hl(3, top + (i - 1) * shelfH + 1, W - 6, led, 0.8);
  }
  // sockel med skylt
  const b0 = top + glassH;
  U.rect(0, b0, W, 14, 0x2a2730); U.hl(0, b0, W, 0x55505e); U.hl(0, b0 + 13, W, 0x0e0d12);
  U.rect(3, b0 + 3, W - 6, 8, 0xd8b85a); U.box(3, b0 + 3, W - 6, 8, 0x8a6a2a);
  const t = String(title).toUpperCase().slice(0, 7), tw = textW(SMALL, t);
  text(U, SMALL, t, Math.round((W - tw) / 2), b0 + 5, 0x3a2a10);
  // skylt upptill
  if (brand) {
    const lit = level >= 2, name = String(brand.name).toUpperCase();
    for (let y = 0; y < HH - 1; y++) for (let x = 1; x < W - 1; x++) U.px(x, y, lit ? mix(mix(bc, 0xffffff, 0.35), bc, y / HH) : mix(0x1c1e26, 0x2a2d38, bayer(x, y)));
    U.box(1, 0, W - 2, HH - 1, level >= 3 ? 0xd8b24a : 0x0f1016);
    const F = SMALL, tw2 = textW(F, name), short = tw2 > W - 6 ? name.slice(0, 6) : name;
    text(U, F, short, Math.round((W - textW(F, short)) / 2), 2, lit ? 0xffffff : bc);
    if (lit) for (let i = 1; i <= 2; i++) U.dith(1 + i, -i, W - 2 - i * 2, 1, bc, 0.6 - i * 0.2, 0.5);
  }
  // glas och ram
  for (let y = top; y < b0; y++) for (let x = 2; x < W - 2; x++) {
    const s = (x + y) % 34;
    O.px(x, y, 0xe8f6ff, s < 2 ? 0.26 : s === 5 ? 0.16 : 0.09);
  }
  const fr = 0x3a3228, frHi = 0xd9c088;
  O.vl(0, top, b0 - top, fr); O.vl(1, top, b0 - top, frHi); O.vl(W - 1, top, b0 - top, fr); O.vl(W - 2, top, b0 - top, mul(frHi, 0.6));
  O.hl(0, top, W, frHi); O.hl(0, b0 - 1, W, fr);
  if (level >= 2 && bc) { O.vl(1, top, b0 - top, bc, 0.6); O.vl(W - 2, top, b0 - top, bc, 0.6); }
  return { under: U.flush(), over: O.flush(), W, H, HH, level, brand, tower: true, shelfH, top };
}

// ---------- Automater (kaffe, godis) ----------
export function makeVendor(kind) {
  const W = 34, H = 58, P = new Pix(W, H);
  if (kind === 'kaffe') {
    P.rect(2, 4, W - 4, H - 6, 0x2a2d33); P.hl(2, 4, W - 4, 0x5a5f6a); P.vl(2, 4, H - 6, 0x4a4f5a);
    P.rect(4, 6, W - 8, 18, 0x17181c); P.box(4, 6, W - 8, 18, 0x3a3d44);
    text(P, SMALL, 'KAFFE', 6, 9, 0xffd23a); P.rect(7, 17, 14, 4, 0x8a5a2a); P.hl(7, 17, 14, 0xc98a4a);
    P.rect(6, 27, W - 12, 3, 0xe23b5a); P.rect(6, 32, W - 12, 3, 0x45b964); P.rect(6, 37, W - 12, 3, 0x3a78d8);
    P.rect(10, 42, 14, 10, 0x0b0c10); P.rect(14, 46, 6, 5, 0xf4f1ea); P.px(15, 45, 0x6b4226);
    P.rect(4, H - 4, W - 8, 2, 0x0e0d12);
    P.px(W - 6, 8, 0x45e06a);
  } else {
    P.rect(2, 4, W - 4, H - 6, 0xc9323a); P.hl(2, 4, W - 4, 0xe86a70); P.vl(W - 3, 4, H - 6, 0x7a1a20);
    P.rect(5, 8, W - 10, 30, 0xdff0ff); P.box(5, 8, W - 10, 30, 0x2a2d33);
    const cols = [0xffd23a, 0xe23b5a, 0x45b964, 0x3a78d8, 0xff9a4d, 0xb58cff];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const k = cols[(r * 3 + c) % cols.length]; P.rect(7 + c * 6, 10 + r * 7, 5, 5, k); P.px(7 + c * 6, 10 + r * 7, mix(k, 0xffffff, 0.5)); }
    for (let r = 0; r < 4; r++) P.hl(6, 15 + r * 7, W - 12, 0x8a8f9c);
    text(P, SMALL, 'GODIS', 6, 41, 0xffffff);
    P.rect(8, 48, 18, 6, 0x2a2d33); P.px(27, 44, 0x2a2d33); P.px(28, 44, 0xd8b24a);
    P.rect(4, H - 4, W - 8, 2, 0x0e0d12);
  }
  return P.flush();
}

// tidningsställ bredvid soffan (prylen "datortidningar")
export function makeMagRack() {
  const x = 344, base = 304, OX = x - 8, OY = base - 30, P = new Pix(18, 32, OX, OY);
  P.rect(x - 6, base - 28, 12, 28, 0x8a6446); P.hl(x - 6, base - 28, 12, 0xb08a58); P.vl(x + 5, base - 28, 28, 0x5a3d2b);
  const covers = [0x2c6fb7, 0xc9323a, 0xe8b230, 0x45b964];
  covers.forEach((c, i) => { const y = base - 26 + i * 7; P.rect(x - 5, y, 10, 6, 0xf4f1ea); P.rect(x - 4, y + 1, 8, 2, c); P.hl(x - 4, y + 4, 5, 0x9a9ea6); });
  P.rect(x - 6, base - 2, 12, 2, 0x5a3d2b);
  return { img: P.flush(), x: OX, y: OY, sort: base };
}

// ---------- Tom plats / stängd plats ----------
// tom plats: streckad ram på golvet med skylt
export function makeEmptySlot(W, D, n) {
  const P = new Pix(W, D + 12);
  for (let x = 0; x < W; x += 3) { P.px(x, 0, 0x8a6a2a, 0.7); P.px(x, D - 1, 0x8a6a2a, 0.7); }
  for (let y = 0; y < D; y += 3) { P.px(0, y, 0x8a6a2a, 0.7); P.px(W - 1, y, 0x8a6a2a, 0.7); }
  const label = `PLATS ${n}`, tw = textW(SMALL, label) + 8, tx = Math.round((W - tw) / 2), ty = Math.round(D / 2) - 5;
  P.rect(tx, ty, tw, 11, 0xf4efe2, 0.9); P.box(tx, ty, tw, 11, 0x8a6a2a);
  text(P, SMALL, label, tx + 4, ty + 3, 0x8a6a2a);
  return P.flush();
}
// stängd plats (hör till en större lokal): kartonger under en dammig presenning
export function makeClosedSlot(W, D) {
  const H = D + 34, P = new Pix(W, H);
  const base = H - 1;
  const box = (x, y, w, h, c) => { P.rect(x, y, w, h, c); P.hl(x, y, w, mix(c, 0xffffff, 0.3)); P.vl(x + w - 1, y, h, mul(c, 0.75)); P.hl(x + 2, y + Math.round(h * 0.4), w - 4, mul(c, 0.7)); P.rect(x + (w >> 1) - 2, y, 4, 3, mix(c, 0xffffff, 0.15)); };
  const n = Math.max(2, Math.floor(W / 30));
  for (let i = 0; i < n; i++) {
    const x = 4 + i * ((W - 8) / n), w = Math.min(28, (W - 8) / n - 3);
    box(Math.round(x), base - 20, Math.round(w), 20, i % 2 ? 0xb58f5a : 0xc9a36b);
    if (i % 3 === 0) box(Math.round(x) + 3, base - 34, Math.round(w) - 6, 14, 0xa07a48);
  }
  // presenning över
  for (let y = base - 36; y < base - 6; y++) for (let x = 2; x < W - 2; x++) {
    const edge = Math.sin(x * 0.35) * 2 + Math.sin(y * 0.5) * 1.5;
    if (y > base - 36 + 6 + edge && x > 4 + edge && x < W - 6 - edge) P.px(x, y, mix(0x6a7480, 0x8791a0, (bayer(x, y) - 0.5) * 0.6 + 0.5 + (y - base) * 0.01), 0.92);
  }
  P.hl(6, base - 30, W - 12, 0x9aa4b0, 0.5);
  // dammlager och en skylt
  for (let i = 0; i < W; i += 2) if (hash(i, 3, 77) > 0.6) P.px(i, base - 5 - Math.floor(hash(i, 4, 78) * 30), 0xd8d2c6, 0.5);
  const label = 'BYGG UT', tw = textW(SMALL, label) + 8, tx = Math.round((W - tw) / 2), ty = base - 16;
  P.rect(tx, ty, tw, 11, 0xe8b230); P.box(tx, ty, tw, 11, 0x17151a); text(P, SMALL, label, tx + 4, ty + 3, 0x17151a);
  P.rect(tx + (tw >> 1) - 1, ty + 11, 2, 5, 0x5a3d2b);
  return P.flush();
}

// ---------- Stjärnobjektet: podium + glaskub ----------
export const HERO_BOX = { W: 124, H: 150, ax: 62, ay: 146, cube: [20, 39, 104, 103], cubeD: 16, ped: [16, 99, 108, 134] };

export function makeHero(title, sub) {
  const { W, H } = HERO_BOX;
  const U = new Pix(W, H), O = new Pix(W, H);
  const gold = 0xd8b24a, goldHi = 0xfbe7a0, goldLo = 0x8a6a24;
  // plattform (svart marmor)
  for (let y = 118; y < 146; y++) for (let x = 3; x < 121; x++) {
    const top = y < 140;
    const cut = top ? Math.max(0, 6 - (y - 118)) : 0; // avfasade hörn
    if (x < 3 + cut || x >= 121 - cut) continue;
    let c = top ? mix(0x2a2833, 0x1a1920, (y - 118) / 22) : 0x121117;
    const vein = Math.sin(x * 0.21 + y * 0.6 + Math.sin(x * 0.07) * 3);
    if (top && vein > 0.93) c = mix(c, 0xb8b4c4, 0.35);
    if (top && (x + y) % 7 === 0 && hash(x, y, 31) > 0.6) c = mix(c, 0xffffff, 0.08);
    U.px(x, y, c);
  }
  U.hl(5, 139, 114, gold); U.hl(5, 140, 114, goldHi); U.hl(3, 145, 118, 0x07060a);
  // pelare
  const [p0, pt, p1, pb] = HERO_BOX.ped;
  U.rect(p0, pt, p1 - p0, 7, 0x2e2c36); U.hl(p0, pt, p1 - p0, 0x55525f);
  for (let y = pt + 7; y < pb; y++) for (let x = p0; x < p1; x++) {
    const g = (x - p0) / (p1 - p0);
    let c = mix(0x24222b, 0x0f0e13, g);
    if (x - p0 === 5 || x - p0 === 6) c = mix(c, 0xffffff, 0.12);
    U.px(x, y, c);
  }
  U.hl(p0, pt + 7, p1 - p0, goldHi); U.hl(p0, pt + 8, p1 - p0, gold);
  U.hl(p0, pb - 2, p1 - p0, gold); U.hl(p0, pb - 1, p1 - p0, goldLo);
  const cx = (p0 + p1) / 2;
  const tW = textW(BIG, title), tx = Math.round(cx - tW / 2);
  text(U, BIG, title, tx + 1, 113, 0x3a2a08); text(U, BIG, title, tx, 112, gold);
  text(U, BIG, title, tx, 112, goldHi, 0.35);
  if (sub) { const sW = textW(SMALL, sub); text(U, SMALL, sub, Math.round(cx - sW / 2), 122, 0xc9c2d6); }
  // glaskubens insida
  const [c0, ct, c1, cb] = HERO_BOX.cube, D = HERO_BOX.cubeD, GH = cb - ct - D;
  const mid = (c0 + c1) / 2;
  for (let y = ct + 1; y < ct + GH; y++) for (let x = c0 + 1; x < c1 - 1; x++) {
    const spot = Math.max(0, 1 - Math.hypot((x - mid) / ((c1 - c0) * 0.55), (y - ct) / GH));
    U.px(x, y, mix(mix(0x0c0b16, 0x2a2748, (y - ct) / GH), 0x6a6490, spot * 0.55 + (bayer(x, y) - 0.5) * 0.12));
  }
  for (let y = ct + GH; y < cb; y++) for (let x = c0 + 1; x < c1 - 1; x++) U.px(x, y, mix(0x4a4660, 0x24222e, (y - ct - GH) / D + (bayer(x, y) - 0.5) * 0.1));
  U.hl(c0 + 2, ct + 1, c1 - c0 - 4, 0xfff6d8); U.hl(c0 + 2, ct + 2, c1 - c0 - 4, 0xfff0c8, 0.4);
  U.hl(c0 + 1, ct + GH, c1 - c0 - 2, 0x0a0a10);
  // glas + ram (över)
  for (let y = ct; y < cb; y++) for (let x = c0 + 1; x < c1 - 1; x++) {
    const front = y >= ct + D, s = (x + y) % 40;
    let a = front ? 0.07 : 0.05;
    if (s < 2) a += 0.16; else if (s === 5) a += 0.08;
    O.px(x, y, 0xeaf6ff, a);
  }
  O.hl(c0, ct, c1 - c0, 0x6a6f7c); O.hl(c0, ct + D, c1 - c0, 0xffffff, 0.7);
  O.vl(c0, ct, cb - ct, 0xc8ccd6, 0.9); O.vl(c1 - 1, ct, cb - ct, 0x6a6f7c, 0.9);
  O.rect(c0 - 2, ct - 3, c1 - c0 + 4, 3, gold); O.hl(c0 - 2, ct - 3, c1 - c0 + 4, goldHi); O.hl(c0 - 2, ct - 1, c1 - c0 + 4, goldLo);
  return { under: U.flush(), over: O.flush() };
}

// ---------- Avspärrning med mässingsstolpar och sammetsrep ----------
export function makeRope(y, posts, withSides = false) {
  const x0 = ROPE.x0 - 4, w = ROPE.x1 - ROPE.x0 + 8, top = y - (withSides ? 90 : 22);
  const P = new Pix(w, y - top + 3, x0, top);
  const rope = (ax, bx, ry) => {
    for (let x = ax + 2; x < bx; x++) {
      const t = (x - ax) / (bx - ax), sag = Math.round(Math.sin(t * Math.PI) * 6);
      P.px(x, ry + sag, 0xb3203a); P.px(x, ry + sag + 1, 0x6e1022); if (x % 3 === 0) P.px(x, ry + sag, 0xe0506a);
    }
  };
  if (withSides) for (const sx of [ROPE.x0, ROPE.x1]) {
    for (let yy = ROPE.back - 16; yy < y - 16; yy++) {
      const t = (yy - (ROPE.back - 16)) / (y - ROPE.back), bulge = Math.round(Math.sin(t * Math.PI) * 5);
      P.px(sx + 1, yy + bulge, 0xb3203a); P.px(sx + 2, yy + bulge, 0x6e1022);
    }
  }
  for (let i = 0; i + 1 < posts.length; i++) rope(posts[i], posts[i + 1], y - 16);
  for (const px of posts) {
    P.ell(px + 1, y, 5, 2, 0x140c1c, 0.3, 2);
    P.rect(px - 2, y - 1, 6, 2, 0x8a6a24); P.hl(px - 2, y - 1, 6, 0xd8b24a);
    P.rect(px, y - 17, 2, 16, 0xd8b24a); P.vl(px, y - 17, 16, 0xfbe7a0); P.vl(px + 1, y - 17, 16, 0x9a7a30);
    P.rect(px - 1, y - 20, 4, 3, 0xd8b24a); P.hl(px - 1, y - 20, 4, 0xfff4c0); P.px(px + 2, y - 18, 0x8a6a24);
  }
  return { img: P.flush(), x: x0, y: top };
}

// ---------- Beställnings- och utlämningsdisk ----------
export function makeCounter(theme) {
  const OX = 280, OY = 60, P = new Pix(232, 92, OX, OY);
  const red = hex(theme && theme.counter, 0x9e1b22), { x0, x1, top, front, base } = COUNTER;
  // bänkskiva (kvarts)
  for (let y = top; y < front; y++) for (let x = x0; x < x1; x++) {
    let c = mix(0xd9d2c3, 0xf1ece2, (y - top) / (front - top));
    if (hash(x, y, 41) > 0.9) c = mul(c, 0.93);
    if (x === x0) c = 0xbdb5a5;
    P.px(x, y, c);
  }
  P.hl(x0, top, x1 - x0, 0xb3ab9b); P.hl(x0, front - 1, x1 - x0, 0xffffff);
  // front
  for (let y = front; y < base - 3; y++) for (let x = x0; x < x1; x++) {
    let c = red;
    const k = (x - x0) % 8;
    if (k === 0) c = mul(red, 0.72); else if (k === 1) c = mix(red, 0xffffff, 0.14);
    if (y < front + 2) c = mul(c, 0.62);
    if (x === x0) c = mix(red, 0xffffff, 0.25);
    P.px(x, y, c);
  }
  P.hl(x0, base - 5, x1 - x0, 0xd8b24a); P.hl(x0, base - 4, x1 - x0, 0x7a5a24);
  P.rect(x0 + 1, base - 3, x1 - x0 - 1, 3, 0x1d1a20); P.hl(x0 + 1, base - 3, x1 - x0 - 1, 0x0d0b10);
  // mellanstolpe
  const sp = COUNTER.split;
  P.rect(sp - 1, front, 3, base - 3 - front, 0x2a2730); P.vl(sp - 1, front, base - 3 - front, 0x55505e);
  // skyltar
  const plate = (label, cx) => {
    const w = textW(BIG, label) + 10, px0 = Math.round(cx - w / 2), py0 = front + 2;
    P.rect(px0, py0, w, 13, 0x16181f); P.box(px0, py0, w, 13, 0x3a3f4d); P.hl(px0 + 1, py0 + 12, w - 2, 0x000000, 0.4);
    text(P, BIG, label, px0 + 5, py0 + 4, 0xfff6e0);
    P.hl(px0 + 3, py0 + 12, w - 6, hex(theme && theme.neon, 0x7ee8fa), 0.7);
  };
  plate('BESTÄLL', 360);
  plate('UTLÄMNING', (sp + x1) / 2);
  // saker på disken
  // kassaskärm mot kunden
  P.rect(304, 122, 12, 3, 0x2a2d33); P.rect(309, 116, 2, 6, 0x3a3d44);
  P.rect(301, 104, 18, 13, 0x23262b); P.rect(302, 105, 16, 10, 0x3c78d8); P.hl(302, 105, 16, 0x7fb0f0);
  P.rect(304, 107, 7, 1, 0xdfefff); P.rect(304, 109, 10, 1, 0x9fc7f0); P.rect(304, 111, 5, 2, 0x45b964); P.rect(311, 111, 5, 2, 0xe8b230);
  // kortläsare
  P.rect(324, 116, 7, 9, 0x2a2d33); P.rect(325, 117, 5, 3, 0x6ad26a); P.hl(325, 121, 5, 0x5a5f6a); P.hl(325, 123, 5, 0x5a5f6a);
  // kvittoskrivare
  P.rect(360, 115, 14, 9, 0xd8dade); P.hl(360, 115, 14, 0xf4f5f7); P.rect(363, 110, 8, 5, 0xffffff); P.hl(363, 112, 6, 0xb0b0b0);
  // demodator (glassida med fläktar – ljus läggs på dynamiskt)
  P.rect(378, 92, 16, 32, 0x17181c); P.box(378, 92, 16, 32, 0x3a3d44); P.rect(380, 94, 12, 28, 0x0b0c10);
  P.hl(378, 92, 16, 0x6a6f7a);
  // ringklocka
  P.rect(410, 121, 10, 2, 0x5a4a2a); P.rect(411, 116, 8, 5, 0xd8b24a); P.hl(412, 115, 6, 0xd8b24a); P.px(413, 116, 0xfff4c0); P.px(415, 113, 0xd8b24a); P.px(415, 114, 0x8a6a24);
  // succulent
  P.rect(492, 118, 9, 6, 0xe8e4da); P.hl(492, 118, 9, 0xffffff);
  for (const [dx, dy] of [[0, -4], [3, -6], [6, -4], [2, -3], [5, -2]]) { P.rect(492 + dx, 118 + dy, 3, 4, 0x5aa36a); P.px(492 + dx, 118 + dy, 0x8fd49a); }
  return { img: P.flush(), x: OX, y: OY };
}

// Bänk längs väggen bakom disken
export function makeBackCabinet() {
  const OX = 298, OY = 52, P = new Pix(150, 46, OX, OY);
  const x0 = 300, x1 = 444, top = 76, fr = 84, base = 96;
  for (let y = top; y < fr; y++) for (let x = x0; x < x1; x++) P.px(x, y, mix(0xc9a36b, 0xb08a58, (y - top) / 8 + (hash(x, y, 51) - 0.5) * 0.1));
  P.hl(x0, fr - 1, x1 - x0, 0xe6c894);
  for (let y = fr; y < base; y++) for (let x = x0; x < x1; x++) {
    let c = 0x3a3f4b;
    if ((x - x0) % 36 === 0) c = 0x23262f; else if ((x - x0) % 36 === 1) c = 0x565c6a;
    P.px(x, y, c);
  }
  for (let i = 0; i < 4; i++) P.rect(x0 + 14 + i * 36, fr + 3, 8, 1, 0xb8bec8);
  // skrivare
  P.rect(304, 66, 22, 10, 0xd8dade); P.hl(304, 66, 22, 0xf4f5f7); P.rect(306, 63, 18, 3, 0x9a9ea6); P.rect(308, 70, 12, 1, 0x2a2d33); P.px(322, 72, 0x45e06a);
  // kartonger
  const boxes = [[410, 68, 16, 8, 0xc9a36b], [428, 70, 14, 6, 0xb58f5a]];
  for (const [bx, by, bw, bh, c] of boxes) { P.rect(bx, by, bw, bh, c); P.hl(bx, by, bw, mix(c, 0xffffff, 0.3)); P.vl(bx + bw - 1, by, bh, mul(c, 0.75)); P.hl(bx + 2, by + 3, bw - 4, 0x7a5a38); }
  // verktygslåda
  P.rect(384, 68, 20, 8, 0xc9323a); P.hl(384, 68, 20, 0xe86a70); P.rect(390, 65, 8, 3, 0x2a2d36); P.hl(384, 71, 20, 0x7a1a20);
  // kaffemugg
  P.rect(360, 70, 5, 6, 0xf4f1ea); P.px(365, 72, 0xf4f1ea); P.px(361, 70, 0x5a3d2b);
  // rulle kabel
  P.ell(344, 73, 5, 3, 0x2a2d36, 1, 1); P.ell(344, 73, 2, 1, 0x3a3c44, 1, 1);
  return { img: P.flush(), x: OX, y: OY, sort: base };
}

// ---------- Väntrum ----------
function upholstery(P, x0, y0, w, h, c, seams = []) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    let k = mul(c, 0.96 + hash(x, y, 61) * 0.06);
    if (y === y0) k = mix(c, 0xffffff, 0.22);
    if (y === y0 + h - 1) k = mul(c, 0.72);
    if (x === x0) k = mix(k, 0xffffff, 0.1);
    if (x === x0 + w - 1) k = mul(k, 0.8);
    P.px(x, y, k);
  }
  for (const s of seams) { P.vl(s, y0 + 1, h - 2, mul(c, 0.7)); P.vl(s + 1, y0 + 1, h - 2, mix(c, 0xffffff, 0.12)); }
}
export function makeSofa() {
  const { x0, x1, base } = SOFA, OX = x0 - 2, OY = base - 48, P = new Pix(x1 - x0 + 4, 50, OX, OY);
  const c = 0x2f6f7a, cush = 0x3b8894;
  const inner0 = x0 + 8, inner1 = x1 - 8, third = (inner1 - inner0) / 3;
  const seams = [Math.round(inner0 + third), Math.round(inner0 + 2 * third)];
  upholstery(P, x0 + 2, base - 42, x1 - x0 - 4, 24, c, seams);            // ryggstöd
  upholstery(P, inner0, base - 19, inner1 - inner0, 9, cush, seams);      // sittdynor (ovansida)
  upholstery(P, inner0, base - 10, inner1 - inner0, 6, mul(cush, 0.8), seams);
  for (const ax of [x0, x1 - 8]) { upholstery(P, ax, base - 27, 8, 23, mul(c, 0.92)); P.hl(ax, base - 27, 8, mix(c, 0xffffff, 0.3)); }
  P.rect(x0 + 1, base - 4, x1 - x0 - 2, 2, mul(c, 0.55));
  for (const lx of [x0 + 3, x1 - 5]) P.rect(lx, base - 2, 2, 2, 0x2a2018);
  // kudde
  P.rect(inner0 + 3, base - 33, 12, 10, 0xe8b230); P.hl(inner0 + 3, base - 33, 12, 0xf6d880); P.vl(inner0 + 14, base - 32, 9, 0xb8861b);
  return { img: P.flush(), x: OX, y: OY, sort: base };
}
export function makeArmchair() {
  const { x0, x1, base } = ARMCHAIR, OX = x0 - 2, OY = base - 44, P = new Pix(x1 - x0 + 4, 46, OX, OY);
  const c = 0xb8452e, cush = 0xcf5a3f;
  upholstery(P, x0 + 2, base - 40, x1 - x0 - 4, 22, c);
  upholstery(P, x0 + 7, base - 19, x1 - x0 - 14, 9, cush);
  upholstery(P, x0 + 7, base - 10, x1 - x0 - 14, 6, mul(cush, 0.8));
  for (const ax of [x0, x1 - 7]) upholstery(P, ax, base - 26, 7, 22, mul(c, 0.9));
  P.rect(x0 + 1, base - 4, x1 - x0 - 2, 2, mul(c, 0.55));
  for (const lx of [x0 + 3, x1 - 5]) P.rect(lx, base - 2, 2, 2, 0x2a2018);
  return { img: P.flush(), x: OX, y: OY, sort: base };
}
export function makeTable() {
  const { x0, x1, base } = TABLE, OX = x0 - 2, OY = base - 30, P = new Pix(x1 - x0 + 4, 32, OX, OY);
  for (let y = base - 16; y < base - 8; y++) for (let x = x0; x < x1; x++) P.px(x, y, mix(0xd9b98a, 0xc4a276, (y - base + 16) / 8 + (hash(x, y, 71) - 0.5) * 0.12));
  P.hl(x0, base - 16, x1 - x0, 0xecd3a8); P.rect(x0, base - 8, x1 - x0, 3, 0x8a6446); P.hl(x0, base - 8, x1 - x0, 0xb08a58);
  for (const lx of [x0 + 2, x1 - 4]) P.rect(lx, base - 5, 2, 5, 0x5a3d2b);
  // tidningar
  P.rect(x0 + 5, base - 15, 14, 9, 0xf4f1ea); P.rect(x0 + 6, base - 14, 12, 3, 0x2c6fb7); P.hl(x0 + 6, base - 10, 10, 0x9a9ea6); P.hl(x0 + 6, base - 8, 8, 0x9a9ea6);
  P.rect(x0 + 9, base - 17, 13, 8, 0xe8e4da); P.rect(x0 + 10, base - 16, 11, 3, 0xc9323a); text(P, SMALL, 'PC', x0 + 11, base - 16, 0xffffff);
  // kaffekopp + kaktus
  P.rect(x1 - 16, base - 16, 6, 5, 0xffffff); P.px(x1 - 10, base - 15, 0xffffff); P.hl(x1 - 15, base - 16, 4, 0x6b4226); P.hl(x1 - 17, base - 11, 8, 0xd8d2c6);
  P.rect(x1 - 7, base - 14, 5, 4, 0xb5652f); P.rect(x1 - 6, base - 20, 3, 6, 0x4a9a58); P.px(x1 - 7, base - 18, 0x4a9a58); P.px(x1 - 5, base - 20, 0x8fd49a); P.px(x1 - 5, base - 21, 0xe23b5a);
  return { img: P.flush(), x: OX, y: OY, sort: base };
}

export function makePlant(x, y, big = true) {
  const w = 34, h = 50, OX = x - 17, OY = y - 49, P = new Pix(w, h, OX, OY);
  // kruka
  P.rect(x - 7, y - 12, 14, 12, 0xe8e4da); P.hl(x - 8, y - 13, 16, 0xffffff); P.hl(x - 8, y - 12, 16, 0xcfc8b8);
  P.vl(x + 5, y - 11, 11, 0xbdb5a5); P.vl(x + 6, y - 11, 11, 0xa9a192); P.hl(x - 6, y - 1, 12, 0x9a9282);
  P.rect(x - 6, y - 12, 12, 1, 0x3a2a1c);
  // blad (monstera-lik)
  const leaves = [[-10, -30, 9, 6], [2, -38, 8, 7], [-4, -44, 7, 6], [6, -26, 9, 6], [-12, -20, 8, 5], [8, -16, 7, 5], [-2, -24, 8, 6]];
  for (const [dx, dy, rx, ry] of leaves) {
    for (let yy = -ry; yy <= ry; yy++) for (let xx = -rx; xx <= rx; xx++) {
      const dd = Math.hypot(xx / rx, yy / ry);
      if (dd >= 1) continue;
      let c = dd < 0.5 && xx + yy < 0 ? 0x5fbf6e : 0x2f8f46;
      if (dd > 0.8) c = 0x216b36;
      if (xx === 0 || Math.abs(xx - yy) === 0 && dd < 0.7) c = 0x7fd48a;
      P.px(x + dx + xx, y + dy + yy, c);
    }
    P.line(x, y - 12, x + dx, y + dy + ry, 0x2c6e3a);
  }
  return { img: P.flush(), x: OX, y: OY, sort: y };
}

export function makeGate(x) {
  const OX = x - 4, OY = 70, P = new Pix(9, 36, OX, OY), y1 = 104;
  P.rect(x - 3, y1 - 3, 7, 3, 0x6a6f7a); P.hl(x - 3, y1 - 3, 7, 0x9aa0aa);
  for (let y = 76; y < y1 - 3; y++) for (let xx = x - 2; xx < x + 3; xx++) P.px(xx, y, 0xdfe8f0, xx === x - 2 ? 0.9 : 0.55);
  P.vl(x, 78, y1 - 83, 0xa9b4c0, 0.8);
  P.rect(x - 3, 73, 7, 3, 0x6a6f7a); P.hl(x - 3, 73, 7, 0xb8bec8); P.px(x, 74, 0x3fb0ff);
  return { img: P.flush(), x: OX, y: OY, sort: y1 };
}

// liten bil i sidovy (höger); speglas vid behov
export function makeCar(color, kind = 0) {
  const P = new Pix(30, 14);
  const c = color, lo = mul(color, 0.7), hi = mix(color, 0xffffff, 0.35);
  if (kind === 1) { // skåpbil
    P.rect(1, 2, 26, 8, c); P.hl(1, 2, 26, hi); P.rect(20, 4, 6, 3, 0x9fc7e0); P.px(20, 4, 0xe0f0ff);
    P.hl(1, 9, 26, lo); P.rect(4, 4, 12, 3, mix(c, 0xffffff, 0.15));
  } else {
    P.rect(2, 6, 26, 5, c); P.hl(2, 6, 26, hi); P.rect(7, 2, 14, 4, c); P.hl(8, 2, 12, hi);
    P.rect(9, 3, 5, 3, 0x9fc7e0); P.rect(15, 3, 5, 3, 0x9fc7e0); P.px(9, 3, 0xe0f0ff);
    P.hl(2, 10, 26, lo); P.px(27, 7, 0xfff2a0); P.px(2, 7, 0xe23b3b);
  }
  for (const wx of [7, 22]) { P.rect(wx - 2, 10, 5, 4, 0x1b1b1f); P.px(wx, 11, 0x9a9ea6); }
  return P.flush();
}
