// Gemensamma texturbyggstenar för datordelarna.
// Alla funktioner körs per pixel i R.box-texturer: inga allokeringar, ingen Math.hypot
// (sqrt räcker), förberäkna allt som går utanför texturen.
import { shade, mix, rainbow } from '../../core/raster.js';
import { textBitmap } from '../../core/pixfont.js';

export const C = {
  gold: 0xd8b24a, goldDark: 0x9c7a28, steel: 0xc3c7cc, steelDark: 0x8a9097, black: 0x141416,
  rubber: 0x202022, white: 0xefefec, pcbGreen: 0x2e6b3c, copper: 0xc87533, brass: 0xc9a13a,
  // 1983–2026-utbyggnaden
  tin: 0xb9bdc2, epoxy: 0x1b1b1e, ceramic: 0xd9d6cc, solder: 0xa7abb0, silk: 0xe8ecdf,
  beige: 0xd8cfb4, beigeDark: 0xb9ae90, zinc: 0xb7bcc0, alu: 0xc9cdd1,
  wireRed: 0xc8282a, wireYellow: 0xe0b020, wireBlack: 0x18181a, wireOrange: 0xe07a20, wireBlue: 0x2a5ac8, wireWhite: 0xe8e8e2,
  ledRed: 0xff3b2f, ledGreen: 0x3cff5a, ledAmber: 0xffb020, ledBlue: 0x3aa8ff,
};

// Är RGB-delen tänd? showroom = ikoner/montrar (alltid tänd)
export function isLit(o, key) {
  if (o.showroom) return true;
  return !!(o.powered && o.lit && o.lit[key]);
}
// LED-färg: tänd = regnbåge, släckt = mjölkvit diffusor
export function led(o, key, offset = 0, l = 0.6) {
  return isLit(o, key) ? rainbow(o.t || 0, offset, l) : 0xd9d9d4;
}

// ---------- Text ----------
// Gör en sträng läsbar för 3×5-fonten (versaler, siffror, några tecken)
export function clean(s, max = 14) {
  return String(s ?? '').toUpperCase().replace(/[()/,_®™'"]/g, ' ').replace(/[^A-Z0-9ÅÄÖ .:+\-!?]/g, '')
    .replace(/\s+/g, ' ').trim().slice(0, max);
}
export const TB = (s, max) => textBitmap(clean(s, max) || ' ');
// Modellbeteckning: produktnamnet utan märket, t.ex. "Intel 80486DX2-66" → "80486DX2-66"
export function modelText(p, max = 12) {
  const brand = String(p.brand || p.look?.brand || '').toLowerCase();
  const words = String(p.name || '').split(/\s+/).filter((w) => w && w.toLowerCase() !== brand);
  const digit = words.filter((w) => /\d/.test(w));
  return clean(digit.length ? digit.join(' ') : words.slice(-1).join(' '), max);
}
// Stämplar text: (x,y) på ytan, texten börjar i (x0,y0), px = enheter per textpixel
export const txt = (bm, x, y, x0, y0, px) => bm.on(Math.floor((x - x0) / px), Math.floor((y - y0) / px));
// Textpixelstorlek så att texten får plats i bredden w (högst max)
export const fitPx = (bm, w, max) => Math.min(max, w / (bm.w + 0.5));

// ---------- Former ----------
export function inRound(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || y < y0 || x > x1 || y > y1) return false;
  const dx = x < x0 + r ? x0 + r - x : x > x1 - r ? x - x1 + r : 0;
  const dy = y < y0 + r ? y0 + r - y : y > y1 - r ? y - y1 + r : 0;
  return dx * dx + dy * dy <= r * r;
}
// Fasad kant: ljus överkant/vänster, mörk underkant/höger. Returnerar skuggfaktor.
export function bevel(x, y, W, H, w = 0.06) {
  if (x < w || y < w) return 1.22;
  if (x > W - w || y > H - w) return 0.72;
  return 1;
}
// Brus i plast/pulverlack
export function speckle(c, x, y, s = 40, amt = 0.05) {
  const n = hash((x * s) | 0, (y * s) | 0);
  return n > 0.9 ? shade(c, 1 + amt) : n < 0.1 ? shade(c, 1 - amt) : c;
}

// ---------- Fläkt ----------
// Fläkt sedd rakt framifrån i en yta. Returnerar färg eller -1 (utanför fläkten).
// (cx,cy) mitt, r radie, f = { spin, frame, blade, hub, blades, ring (färg|-1), struts? }
export function fan(x, y, cx, cy, r, f) {
  const dx = x - cx, dy = y - cy;
  const ax = dx < 0 ? -dx : dx, ay = dy < 0 ? -dy : dy, R0 = r + 0.2;
  if (ax > R0 || ay > R0) return -1;
  const rc = 0.32;
  if (ax > R0 - rc && ay > R0 - rc) { const qx = ax - R0 + rc, qy = ay - R0 + rc; if (qx * qx + qy * qy > rc * rc) return -1; }
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d > r) {
    // ramen: skruvhål i hörnen, fasad ytterkant, gjuten kant mot rotorn
    const hc = r * 0.955, hr = r * 0.05 + 0.04, hx = ax - hc, hy = ay - hc, h2 = hx * hx + hy * hy;
    if (h2 < hr * hr) return hx + hy < 0 ? 0x050506 : shade(f.frame, 0.45);
    if (h2 < hr * hr * 2.3) return shade(f.frame, 1.18);
    if (ax > R0 - 0.05 || ay > R0 - 0.05) return shade(f.frame, 1.25);
    if (d < r + 0.06) return shade(f.frame, 0.62);
    return (ax + ay) % 0.5 < 0.05 ? shade(f.frame, 1.08) : f.frame;
  }
  if (f.ring >= 0 && d > r - 0.22) return d > r - 0.05 ? shade(f.ring, 0.8) : f.ring;
  if (d > r - 0.1) return shade(f.frame, 0.55);
  if (d < r * 0.3) {
    // nav med dekal
    if (d > r * 0.27) return shade(f.hub, 0.6);
    if (d < r * 0.2) return d > r * 0.18 ? shade(f.hub, 0.8) : (dy < -d * 0.4 ? shade(f.hub, 1.15) : f.hub);
    return shade(f.hub, 1.08);
  }
  const ang0 = Math.atan2(dy, dx);
  const n = f.blades || 7;
  let p = ((ang0 + (f.spin || 0)) * n / 6.2832 + d * 0.9) % 1; if (p < 0) p += 1;
  if (p < 0.55) {
    // blad: ljus framkant, toning över bladet, ljusare mot spetsen
    if (p < 0.07) return shade(f.blade, 1.32);
    return shade(f.blade, (1.08 - p * 0.45) * (d > r * 0.8 ? 1.06 : 1));
  }
  if (p < 0.6) return shade(f.blade, 0.2);                   // bladets skugga
  // mellan bladen: motorstagen bakom rotorn
  if (f.struts !== false) {
    let s = ((ang0 + 0.4) * 4 / 6.2832) % 1; if (s < 0) s += 1;
    const w = 0.035 / (d + 0.01);
    if (s < w || s > 1 - w) return shade(f.frame, 0.75);
  }
  return shade(f.blade, 0.3);
}
// Radialfläkt (blower) sedd framifrån: rund öppning med många smala skovlar
export function blower(x, y, cx, cy, r, f) {
  const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
  if (d2 > r * r) return -1;
  const d = Math.sqrt(d2);
  if (d > r - 0.08) return shade(f.frame, 0.5);
  if (d < r * 0.45) return d < r * 0.12 ? shade(f.hub, 1.2) : (d > r * 0.42 ? shade(f.hub, 0.7) : f.hub);
  let p = ((Math.atan2(dy, dx) + (f.spin || 0)) * 32 / 6.2832) % 1; if (p < 0) p += 1;
  return p < 0.3 ? shade(f.blade, 1.1) : p < 0.45 ? shade(f.blade, 0.7) : 0x0a0a0c;
}

// ---------- Mönster ----------
// Honeycomb-/nätmönster: true på gallret
export function honeycomb(x, y, s = 0.5) {
  const row = Math.floor(y / (s * 0.866));
  const xx = x / s + (row % 2) * 0.5;
  const fx = xx - Math.floor(xx), fy = (y / (s * 0.866)) - row;
  return fx < 0.18 || fy < 0.2;
}
export const mesh = (x, y, p = 0.3) => ((x / p) | 0) % 2 === 0 || ((y / p) | 0) % 2 === 0;
export const dots = (x, y, p = 0.4, r = 0.13) => { const a = (x % p) - p / 2, b = (y % p) - p / 2; return a * a + b * b < r * r; };
// Luftspalter i rader: true i spalten
export function vents(x, y, px, py, lx, ly) {
  const fx = ((x % px) + px) % px, fy = ((y % py) + py) % py;
  return fx < lx && fy < ly;
}
// Räfflat hjul/kant
export const knurl = (x, p = 0.06) => ((x / p) | 0) % 2 === 0;

// Skruvhuvud (krysspår) sett uppifrån
export function screwHead(x, y, cx, cy, r = 0.28) {
  const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
  if (d2 > r * r) return -1;
  const w = r * 0.16, l = r * 0.62;
  if ((dx < w && dx > -w && dy < l && dy > -l) || (dy < w && dy > -w && dx < l && dx > -l)) return dx + dy < 0 ? 0x2c2f33 : 0x5a5f66;
  const d = Math.sqrt(d2);
  if (d > r * 0.78) return dx + dy < 0 ? 0xdfe3e7 : C.steelDark;
  return mix(C.steel, 0xffffff, 0.25 * (1 - d / r) + (dx + dy < 0 ? 0.1 : 0));
}
// Tomt skruvhål (mässingsdistans)
export function screwHole(x, y, cx, cy, r = 0.3) {
  const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
  if (d2 > r * r) return -1;
  return d2 < r * r * 0.2 ? 0x2a2418 : C.brass;
}

// Guldkontakter / stift-rader
export const pins = (x, y, pitch = 0.2) => ((x / pitch) | 0) % 2 === 0 && ((y / pitch) | 0) % 2 === 0;
// Kontaktfingrar på kortkant: guld med glapp
export function fingers(x, pitch = 0.1) {
  const f = ((x % pitch) + pitch) % pitch / pitch;
  return f < 0.2 ? 0x1f3a22 : f < 0.32 ? C.goldDark : f > 0.82 ? 0xf0d27a : C.gold;
}

// Små "kretsar": ger ett pseudo-slumpvärde per cell
export function hash(x, y) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

// ---------- Finare detaljer (för högupplöst rastrering) ----------
// Borstad metall: tunna ljusare/mörkare streck längs en axel
export function brushed(c, x, y, along = 'x') {
  const a = along === 'x' ? y : x;
  const n = hash((a * 60) | 0, 7);
  return n > 0.82 ? shade(c, 1.07) : n < 0.12 ? shade(c, 0.94) : c;
}
// Små ytmonterade komponenter (motstånd/kondensatorer) utspridda i ett rutnät
export function smd(x, y, density = 0.35, cell = 0.3) {
  const cx = Math.floor(x / cell), cy = Math.floor(y / cell);
  if (hash(cx * 3 + 11, cy * 5 + 3) > density) return -1;
  const fx = x / cell - cx, fy = y / cell - cy;
  const horiz = hash(cx, cy) > 0.5;
  const w = horiz ? 0.5 : 0.26, h = horiz ? 0.26 : 0.5;
  if (fx < 0.25 || fy < 0.25 || fx > 0.25 + w || fy > 0.25 + h) return -1;
  const end = horiz ? (fx < 0.33 || fx > 0.25 + w - 0.08) : (fy < 0.33 || fy > 0.25 + h - 0.08);
  if (end) return 0xc9ccd0;
  return hash(cx + 5, cy + 9) > 0.6 ? 0x2a2a2e : 0x6b4a2a;
}
// Tunna kretsbanor i ett knippe: parallella linjer
export function traces(x, y, pitch = 0.11, width = 0.035) {
  return ((y % pitch) + pitch) % pitch < width;
}
// Kretsbanor på ett kretskort: knippen längs/tvärs + diagonaler och vior (färg eller -1)
export function pcbArt(x, y, pcb, cell = 0.9) {
  const cx = Math.floor(x / cell), cy = Math.floor(y / cell);
  const h = hash(cx * 7 + 1, cy * 13 + 5);
  const fx = x / cell - cx, fy = y / cell - cy;
  if (h < 0.3) { if (((fy * 7) % 1) < 0.3 && fy > 0.2 && fy < 0.8 && fx > 0.05) return mix(pcb, 0xd8c070, 0.2); }
  else if (h < 0.52) { if (((fx * 7) % 1) < 0.3 && fx > 0.25 && fx < 0.75) return mix(pcb, 0xd8c070, 0.2); }
  else if (h < 0.64) { if ((((fx + fy) * 5) % 1) < 0.25 && fx > 0.1 && fy > 0.1 && fx < 0.9) return mix(pcb, 0xd8c070, 0.2); }
  const v = hash((x * 9) | 0, (y * 9) | 0);
  if (v > 0.988) return 0xc9b16a;
  if (v > 0.978) return shade(pcb, 0.55);
  return -1;
}
// Perforerad plåt (små runda hål)
export const perforated = (x, y, p = 0.22, r = 0.06) => { const a = ((x % p) + p) % p - p / 2, b = ((y % p) + p) % p - p / 2; return a * a + b * b < r * r; };
// Streckkod
export function barcode(x, y, x0, y0, w, h) {
  if (x < x0 || x > x0 + w || y < y0 || y > y0 + h) return -1;
  return hash(((x - x0) * 55) | 0, 3) > 0.45 ? 0x111111 : 0xf4f4f0;
}
// 2D-kod (datamatris) – kvadrat med sida s
export function matrix(x, y, x0, y0, s, cells = 10, seed = 1) {
  if (x < x0 || y < y0 || x > x0 + s || y > y0 + s) return -1;
  const i = ((x - x0) / s * cells) | 0, j = ((y - y0) / s * cells) | 0;
  if (i === 0 || j === cells - 1) return 0x111111;
  return hash(i * 31 + seed, j * 17) > 0.5 ? 0x111111 : 0xf2f2ee;
}
// "Text"-rader (små streck som ser ut som finstilt)
export function fineLines(x, y, x0, y0, w, rows, pitch = 0.13) {
  if (x < x0 || x > x0 + w || y < y0 || y > y0 + rows * pitch) return false;
  const r = Math.floor((y - y0) / pitch), fy = (y - y0) / pitch - r;
  if (fy > 0.45) return false;
  const len = 0.45 + hash(r, 17) * 0.55;
  return (x - x0) / w < len && hash(((x - x0) * 30) | 0, r) > 0.25;
}
// Dekal/etikett: ram, rubrikband, finstilt, streckkod, 2D-kod. Färg eller -1.
export function sticker(x, y, x0, y0, w, h, bg = 0xf2f2ec, band = 0x2c6fb7, seed = 3) {
  if (x < x0 || y < y0 || x > x0 + w || y > y0 + h) return -1;
  const lx = x - x0, ly = y - y0;
  if (lx < 0.03 || ly < 0.03 || lx > w - 0.03 || ly > h - 0.03) return shade(bg, 0.82);
  if (ly < h * 0.22) return band;
  if (ly > h * 0.68 && lx > w * 0.08 && lx < w * 0.62) { const b = barcode(lx, ly, w * 0.08, h * 0.7, w * 0.54, h * 0.2); if (b >= 0) return b; }
  if (lx > w * 0.72 && ly > h * 0.6) { const m = matrix(lx, ly, w * 0.72, h * 0.6, Math.min(w * 0.2, h * 0.32), 8, seed); if (m >= 0) return m; }
  if (fineLines(lx, ly, w * 0.08, h * 0.3, w * 0.84, 3, h * 0.11)) return 0x3a3a3a;
  return bg;
}

// ---------- Elektronik ----------
// IC-kapsel sedd uppifrån: epoxi, pinne-1-prick, tryckt text (bmA/bmB, px = textpixel)
export function icTop(x, y, W, H, bmA, bmB, px, base = C.epoxy, ink = 0xc9c9c4) {
  if (x < 0.025 || y < 0.025) return shade(base, 1.6);
  if (x > W - 0.025 || y > H - 0.025) return shade(base, 0.7);
  const dx = x - Math.min(0.13, W * 0.18), dy = y - Math.min(0.13, H * 0.28), dr = Math.min(0.045, W * 0.1, H * 0.12);
  if (dx * dx + dy * dy < dr * dr) return shade(base, 0.5);
  const tx = Math.min(0.26, W * 0.2);
  if (bmA && txt(bmA, x, y, tx, H * 0.24, px)) return ink;
  if (bmB && txt(bmB, x, y, tx, H * 0.24 + px * 6.5, px)) return shade(ink, 0.8);
  return speckle(base, x, y, 50, 0.08);
}
// Elektrolytkondensator sedd uppifrån (cirkel med K-ventil) – färg eller -1
export function capTop(x, y, cx, cy, r, sleeve = 0x1a1a3a) {
  const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy;
  if (d2 > r * r) return -1;
  if (d2 > r * r * 0.72) return sleeve;
  const w = r * 0.08;
  if ((dx < w && dx > -w) || (dy < w && dy > -w && dx < 0)) return 0x6a6f76;
  return dx + dy < 0 ? 0xd6dade : 0xb1b6bc;
}
// Sju-segmentssiffra; returnerar -1 utanför, 0 släckt segment, 1 tänt
const SEG7 = { 0: 0x7e, 1: 0x30, 2: 0x6d, 3: 0x79, 4: 0x33, 5: 0x5b, 6: 0x5f, 7: 0x70, 8: 0x7f, 9: 0x7b, '-': 0x01, ' ': 0, H: 0x37 };
export function seg7(s, x, y, x0, y0, cw, ch) {
  const lx = x - x0, ly = y - y0;
  if (lx < 0 || ly < 0 || ly > ch) return -1;
  const i = (lx / (cw * 1.4)) | 0;
  if (i >= s.length) return -1;
  const cx = lx - i * cw * 1.4 + (ly - ch) * 0.12;       // lätt kursiv
  if (cx < 0 || cx > cw) return -1;
  const t = cw * 0.24, m = SEG7[s[i]] ?? 0;
  let seg = -1;
  if (ly < t) seg = 6; else if (ly > ch - t) seg = 3;
  else if (ly > ch / 2 - t / 2 && ly < ch / 2 + t / 2) seg = 0;
  if (seg >= 0 && (cx < t * 0.5 || cx > cw - t * 0.5)) return -1;
  if (seg < 0) {
    if (cx < t) seg = ly < ch / 2 ? 1 : 2;
    else if (cx > cw - t) seg = ly < ch / 2 ? 5 : 4;
    else return -1;
  }
  return (m >> seg) & 1;
}
// Rund jack (ljud) framifrån – färg eller -1
export function jack(x, y, cx, cy, r, body) {
  const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
  if (d2 > r * r) return -1;
  if (d2 < r * r * 0.2) return 0x050505;
  if (d2 < r * r * 0.4) return 0xd8dce0;
  return x - cx + y - cy < 0 ? shade(body, 1.15) : body;
}
// Liten lysdiod – färg eller -1 (on = tänd)
export function ledDot(x, y, cx, cy, r, col, on) {
  const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
  if (d2 > r * r) return -1;
  if (!on) return d2 < r * r * 0.3 ? shade(col, 0.55) : shade(col, 0.35);
  return d2 < r * r * 0.3 ? mix(col, 0xffffff, 0.6) : col;
}
