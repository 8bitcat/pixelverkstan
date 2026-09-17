// Skärmens innehåll i skrivbordsfinalen: BIOS/POST, uppstart och skrivbord per epok,
// operativsystem och kundens program. Ritas i en liten canvas (120×90 för 4:3-skärmar,
// 160×90 för bredbild) som desk.js lägger på skärmglaset.
// Färgerna går genom skärmens palett: grön fosfor (mono), CGA (4 färger i grafik,
// 16 i text), EGA (16 färger). Bildrör får sveplinjer, vinjett och rundade hörn.
import { rainbow, mix, shade } from '../../core/raster.js';

// ---------- Typsnitt: 3×5 som pixfont, plus tecken som behövs på en datorskärm ----------
const G = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '1000111011101011000110001', N: '10011101101110011001', O: '010101101101010',
  P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '1000110001101011101110001', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111', Å: '010010101111101', Ä: '101010101111101', Ö: '101010101101010', Ü: '101000101101111',
  0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110', 4: '101101111001001',
  5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001110',
  ' ': '000000000000000', '-': '000000111000000', '!': '010010010000010', ':': '000010000010000', '.': '000000000000010',
  '+': '000010111010000', '?': '110001010000010', '/': '001001010100100', '\\': '100100010001001', '>': '100010001010100',
  '<': '001010100010001', '_': '000000000000111', '=': '000111000111000', '(': '010100100100010', ')': '010001001001010',
  '[': '110100100100110', ']': '011001001001011', ',': '000000000010100', ';': '000010000010100', "'": '010010000000000',
  '"': '101101000000000', '%': '101001010100101', '#': '101111101111101', '*': '000101010101000', '|': '010010010010010',
  '$': '011110111011110', '@': '010101111100011', '&': '010101010101011', '^': '010101000000000', '~': '000011110000000',
  '°': '111101111000000', '█': '111111111111111', '▶': '100110111110100', '·': '000000010000000',
  '↑': '010111010010010', '↓': '010010010111010', '→': '0010000010111110001000100', '←': '0010001000111110100000100',
};
const gw = (g) => g.length / 5;
const up = (s) => String(s).toUpperCase();
export function tw(s) { let w = 0; for (const ch of up(s)) w += gw(G[ch] || G['?']) + 1; return Math.max(0, w - 1); }

// ---------- Paletter ----------
const EGA = [0x000000, 0x0000aa, 0x00aa00, 0x00aaaa, 0xaa0000, 0xaa00aa, 0xaa5500, 0xaaaaaa, 0x555555, 0x5555ff, 0x55ff55, 0x55ffff, 0xff5555, 0xff55ff, 0xffff55, 0xffffff];
const lumOf = (c) => ((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + (c & 255) * 0.11;
function nearest(c, pal) {
  const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255;
  let best = pal[0], bd = 1e9;
  for (const p of pal) {
    const dr = r - ((p >> 16) & 255), dg = g - ((p >> 8) & 255), db = b - (p & 255);
    const d = dr * dr * 3 + dg * dg * 4 + db * db * 2;
    if (d < bd) { bd = d; best = p; }
  }
  return best;
}
// CGA-grafik (palett 1): svart, cyan, magenta, vit – färgerna väljs efter ton, inte avstånd
function cga4(c) {
  const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255, l = lumOf(c);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (l < 42) return 0x000000;
  if (mx - mn < 50) return l > 120 ? 0xffffff : l > 70 ? 0x55ffff : 0x000000;
  if (r >= g && r >= b) return l > 190 ? 0xffffff : 0xff55ff;
  if (b > r && b > g && r > g * 0.8) return 0xff55ff;
  return l > 200 ? 0xffffff : 0x55ffff;
}
// grön fosfor, fyra nivåer
function phosphor(c) {
  const l = lumOf(c);
  return l < 20 ? 0x020c05 : l < 80 ? 0x0f5424 : l < 150 ? 0x27a347 : l < 215 ? 0x4fd870 : 0x9dffb6;
}
// grön fosfor för grafik (Hercules): himmel/vatten mörkt, växtlighet dovt, jord och sten ljust
function phosphorGfx(c) {
  const r = (c >> 16) & 255, g = (c >> 8) & 255, b = c & 255, l = lumOf(c);
  if (l < 24) return 0x020c05;
  if (b > r + 40 && b > g + 40) return l > 150 ? 0x27a347 : 0x020c05;
  if (g > r + 40 && g > b + 40) return l > 170 ? 0x27a347 : 0x0f5424;
  return l < 80 ? 0x0f5424 : l < 150 ? 0x27a347 : l < 215 ? 0x4fd870 : 0x9dffb6;
}
const MAPS = { mono: phosphor, monoGfx: phosphorGfx, ega: (c) => nearest(c, EGA), cga4 };
let MAPF = null, MAPC = null;
const MAPCACHE = { mono: new Map(), monoGfx: new Map(), ega: new Map(), cga4: new Map() };
function setMap(kind) { MAPF = MAPS[kind] || null; MAPC = MAPF ? MAPCACHE[kind] : null; }
function col(c) {
  if (!MAPF) return c;
  let m = MAPC.get(c);
  if (m === undefined) { m = MAPF(c); MAPC.set(c, m); }
  return m;
}
const CSS = new Map();
function css(c) { let s = CSS.get(c); if (!s) { s = '#' + (c >>> 0).toString(16).padStart(6, '0').slice(-6); CSS.set(c, s); } return s; }

// ---------- Rit-primitiver (alla färger som heltal 0xRRGGBB) ----------
function R(x, a, b, w, h, c) { x.fillStyle = css(col(c)); x.fillRect(Math.floor(a), Math.floor(b), Math.floor(w), Math.floor(h)); }
function RA(x, a, b, w, h, c, al) { x.globalAlpha = al; R(x, a, b, w, h, c); x.globalAlpha = 1; }
function P(x, a, b, c) { x.fillStyle = css(col(c)); x.fillRect(Math.floor(a), Math.floor(b), 1, 1); }
const TXT = new Map();
function textImg(s, c) {
  const key = c + '|' + s;
  let img = TXT.get(key);
  if (img) return img;
  if (TXT.size > 900) TXT.clear();
  img = document.createElement('canvas'); img.width = Math.max(1, tw(s)); img.height = 5;
  const g = img.getContext('2d'); g.fillStyle = css(c);
  let cx = 0;
  for (const ch of up(s)) {
    const gl = G[ch] || G['?'], w = gw(gl);
    for (let i = 0; i < gl.length; i++) if (gl[i] === '1') g.fillRect(cx + (i % w), (i / w) | 0, 1, 1);
    cx += w + 1;
  }
  TXT.set(key, img);
  return img;
}
function T(x, s, a, b, c, sc = 1) {
  s = String(s); if (!s) return;
  const img = textImg(s, col(c));
  if (sc === 1) x.drawImage(img, Math.floor(a), Math.floor(b));
  else x.drawImage(img, Math.floor(a), Math.floor(b), img.width * sc, 5 * sc);
}
const TC = (x, s, cx, b, c, sc = 1) => T(x, s, Math.round(cx - tw(s) * sc / 2), b, c, sc);
const TR = (x, s, rx, b, c, sc = 1) => T(x, s, rx - tw(s) * sc, b, c, sc);
function L(x, x0, y0, x1, y1, c) {
  x.fillStyle = css(col(c));
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx + dy, n = 0;
  for (;;) {
    x.fillRect(x0, y0, 1, 1);
    if ((x0 === x1 && y0 === y1) || n++ > 400) break;
    const e2 = 2 * e;
    if (e2 >= dy) { e += dy; x0 += sx; }
    if (e2 <= dx) { e += dx; y0 += sy; }
  }
}
function disc(x, cx, cy, r, c) {
  x.fillStyle = css(col(c));
  for (let dy = -Math.floor(r); dy <= Math.floor(r); dy++) {
    const w = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)) + 0.5);
    x.fillRect(Math.round(cx - w), Math.round(cy + dy), w * 2 + 1, 1);
  }
}
function ellipse(x, cx, cy, rx, ry, c) {
  x.fillStyle = css(col(c));
  for (let dy = -Math.floor(ry); dy <= Math.floor(ry); dy++) {
    const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))) + 0.5);
    x.fillRect(Math.round(cx - w), Math.round(cy + dy), w * 2 + 1, 1);
  }
}
// vertikal toning i band (palettsäker)
function vgrad(x, a, b, w, h, c0, c1, bands = 0) {
  const n = bands || Math.max(1, h);
  for (let i = 0; i < n; i++) {
    const y0 = b + Math.floor((i * h) / n), y1 = b + Math.floor(((i + 1) * h) / n);
    if (y1 > y0) R(x, a, y0, w, y1 - y0, mix(c0, c1, n === 1 ? 0 : i / (n - 1)));
  }
}
// upphöjd/nedsänkt 3D-ruta i Windows 3.1/95-stil
function bevel(x, a, b, w, h, face = 0xc0c0c0, sunk = false, deep = true) {
  const hi = sunk ? 0x808080 : 0xffffff, lo = sunk ? 0xffffff : 0x404040, lo2 = sunk ? 0xdfdfdf : 0x808080;
  R(x, a, b, w, h, face);
  R(x, a, b, w, 1, hi); R(x, a, b, 1, h, hi);
  R(x, a, b + h - 1, w, 1, lo); R(x, a + w - 1, b, 1, h, lo);
  if (deep && w > 4 && h > 4) { R(x, a + 1, b + h - 2, w - 2, 1, lo2); R(x, a + w - 2, b + 1, 1, h - 2, lo2); }
}
// "grekisk" text: små ordstreck som ser ut som finstilt på håll
function greek(x, a, b, w, c, seed = 1, gap = 1) {
  let cx = a;
  for (let i = 0; cx < a + w; i++) {
    const len = 2 + ((seed * 7 + i * 13) % 5);
    R(x, cx, b, Math.min(len, a + w - cx), 1, c);
    cx += len + gap + 1;
  }
}
// hash för deterministiska småslumptal
const hsh = (a, b = 0) => { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

// ---------- Cachade lager ----------
const LAYERS = new Map();
function layer(key, W, H, draw) {
  const k = key + '|' + W + '|' + H + '|' + (MAPF ? Object.keys(MAPS).find((n) => MAPS[n] === MAPF) : 'rgb');
  let c = LAYERS.get(k);
  if (c) return c;
  if (LAYERS.size > 80) LAYERS.clear();
  c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  draw(g, W, H);
  LAYERS.set(k, c);
  return c;
}

// ---------- Muspekare ----------
const ARROW = ['1', '11', '121', '1221', '12221', '122221', '1222221', '122111', '1121', '1  121', '    11'];
const HAND = ['  11', ' 1221', ' 1221', ' 12211', '1122221', '12222221', '12222221', ' 122221', '  1111'];
const HOURGLASS = ['1111111', '1222221', ' 12221', '  121', ' 12221', '1222221', '1111111'];
function sprite(x, rows, a, b, c1 = 0x000000, c2 = 0xffffff) {
  for (let y = 0; y < rows.length; y++) for (let i = 0; i < rows[y].length; i++) {
    const ch = rows[y][i];
    if (ch === '1') P(x, a + i, b + y, c1); else if (ch === '2') P(x, a + i, b + y, c2);
  }
}
const pointerPos = (W, H, t) => [Math.round(W * 0.55 + Math.sin(t * 0.9) * W * 0.22), Math.round(H * 0.45 + Math.sin(t * 1.3 + 1) * H * 0.2)];

// ---------- Logotyper ----------
const FLAG = [0xf25022, 0x7fba00, 0x00a4ef, 0xffb900];
// "Fönster"-flaggan: fyra rutor. style 'wave' (3.1–XP), 'flat' (10), 'squares' (11)
function flag(x, cx, cy, s, style = 'wave', cols = FLAG) {
  const gap = Math.max(1, Math.round(s / 5));
  for (let q = 0; q < 4; q++) {
    const qx = q % 2, qy = (q / 2) | 0;
    const x0 = Math.round(cx - s - gap / 2 + qx * (s + gap)), y0 = Math.round(cy - s - gap / 2 + qy * (s + gap));
    if (style === 'wave') {
      for (let i = 0; i < s; i++) {
        const off = Math.round(Math.sin((x0 + i - cx) * 0.35) * s * 0.12);
        R(x, x0 + i, y0 + off, 1, s, cols[q]);
      }
    } else if (style === 'flat') {
      const k = qx === 0 ? 0.28 : 0.16;
      for (let i = 0; i < s; i++) { const sh = Math.round((s - i) * k * (qx === 0 ? 1 : 0.7)); R(x, x0 + i, y0 + (qy === 0 ? sh : 0), 1, s - sh * (qy === 0 ? 1 : 0.4), cols[q]); }
    } else R(x, x0, y0, s, s, cols[q]);
  }
}
// Energisparlogga i 90-talsstil: båge + stjärna
function ecoLogo(x, a, b) {
  for (let i = 0; i <= 16; i++) {
    const ang = Math.PI * (0.95 + i / 16 * 0.85);
    P(x, a + 11 + Math.cos(ang) * 10, b + 10 + Math.sin(ang) * 8, i < 8 ? 0x00aaaa : 0x55ff55);
  }
  sprite(x, ['  2', '22222', ' 222', ' 2 2', '2   2'], a + 16, b + 1, 0, 0xffff55);
  T(x, 'ENERGI', a, b + 12, 0x55ffff);
}
function vendorLogo(x, cx, b, sc = 1) {
  TC(x, 'PIXELTECH', cx, b, 0xf2f2f2, sc);
  const w = tw('PIXELTECH') * sc;
  for (let i = 0; i < w; i++) { const yy = b + 6 * sc + Math.round(Math.sin((i / w) * Math.PI) * -2 * sc) + sc; R(x, cx - w / 2 + i, yy, 1, sc, i < w * 0.55 ? 0xd8343c : 0xf08030); }
}

// ---------- Hjälp för text i textläge ----------
function wrap(s, cols) {
  const out = []; let line = '';
  for (const w of String(s).split(/\s+/)) {
    if (!w) continue;
    if ((line + ' ' + w).trim().length > cols) { if (line) out.push(line); line = w; }
    else line = (line + ' ' + w).trim();
  }
  if (line) out.push(line);
  return out;
}
const blink = (t, hz = 2) => Math.floor(t * hz) % 2 === 0;

// ---------- Ingång ----------
const PHASE = new WeakMap();
function localTime(x, st, t) {
  if (st.lt != null) return st.lt;
  let p = PHASE.get(x.canvas);
  if (!p || p.screen !== st.screen) { p = { screen: st.screen, t0: t }; PHASE.set(x.canvas, p); }
  return t - p.t0;
}
const CRT = new Set(['mono', 'cga', 'ega', 'crt14', 'crt17']);

export function drawScreen(x, st, info, t) {
  const W = x.canvas.width, H = x.canvas.height;
  const mon = info.monitor || 'lcd169', s = st.screen;
  const crt = CRT.has(mon);
  const lt = localTime(x, st, t);
  x.save();
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.imageSmoothingEnabled = false;
  x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  setMap(mon === 'mono' ? 'mono' : mon === 'cga' || mon === 'ega' ? 'ega' : null);
  const ctx = { W, H, mon, crt, info, st, t, lt, year: info.year || 2020, os: info.os || 'win11' };
  if (s === 'off') offGlass(x, ctx);
  else if (s === 'black') blackScreen(x, ctx);
  else if (s === 'nosignal') noSignal(x, ctx);
  else if (s === 'post' || s === 'error') post(x, ctx, s === 'error');
  else if (s === 'loading') loading(x, ctx);
  else if (s === 'overheat') overheat(x, ctx);
  else desktop(x, ctx);
  setMap(null);
  if (crt) {
    if (s !== 'off' && s !== 'black') glow(x, W, H, mon === 'mono' ? 0.45 : 0.22);
    x.drawImage(crtOverlay(W, H, mon, s === 'off'), 0, 0);
  } else if (s === 'off' || s === 'black') x.drawImage(lcdGlare(W, H), 0, 0);
  x.restore();
}

// ---------- Glas, sveplinjer, glöd ----------
let GLOW = null;
function glow(x, W, H, a) {
  const w = Math.ceil(W / 4), h = Math.ceil(H / 4);
  if (!GLOW) { GLOW = document.createElement('canvas'); }
  if (GLOW.width !== w || GLOW.height !== h) { GLOW.width = w; GLOW.height = h; }
  const g = GLOW.getContext('2d');
  g.imageSmoothingEnabled = true; g.clearRect(0, 0, w, h); g.drawImage(x.canvas, 0, 0, W, H, 0, 0, w, h);
  x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = a; x.imageSmoothingEnabled = true;
  x.drawImage(GLOW, 0, 0, w, h, 0, 0, W, H);
  x.restore();
  x.imageSmoothingEnabled = false;
}
const OVER = new Map();
function crtOverlay(W, H, mon, off) {
  const key = W + 'x' + H + mon + off;
  let c = OVER.get(key);
  if (c) return c;
  c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  if (!off) { g.fillStyle = `rgba(0,0,0,${mon === 'mono' ? 0.28 : 0.16})`; for (let y = 1; y < H; y += 2) g.fillRect(0, y, W, 1); }
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${off ? 0.35 : 0.55})`);
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  // välvt glas: ljusreflex uppe till vänster
  const hl = g.createRadialGradient(W * 0.3, H * 0.22, 1, W * 0.3, H * 0.22, W * 0.45);
  hl.addColorStop(0, `rgba(255,255,255,${off ? 0.13 : 0.06})`); hl.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = hl; g.fillRect(0, 0, W, H);
  if (off) { g.fillStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.moveTo(W * 0.12, H * 0.08); g.lineTo(W * 0.42, H * 0.08); g.lineTo(W * 0.2, H * 0.55); g.lineTo(W * 0.06, H * 0.55); g.fill(); }
  // rundade hörn och mörk kant (bildrörets ram)
  const r = mon === 'crt17' ? 6 : mon === 'mono' ? 9 : 8;
  g.fillStyle = '#0b0b0c';
  for (let y = 0; y < r; y++) {
    const d = r - Math.sqrt(Math.max(0, r * r - (r - y - 0.5) * (r - y - 0.5)));
    const w = Math.ceil(d);
    if (w > 0) { g.fillRect(0, y, w, 1); g.fillRect(W - w, y, w, 1); g.fillRect(0, H - 1 - y, w, 1); g.fillRect(W - w, H - 1 - y, w, 1); }
  }
  g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(0, 0, W, 1); g.fillRect(0, H - 1, W, 1); g.fillRect(0, 0, 1, H); g.fillRect(W - 1, 0, 1, H);
  OVER.set(key, c);
  return c;
}
let GLARE = null;
function lcdGlare(W, H) {
  if (GLARE && GLARE.width === W) return GLARE;
  GLARE = document.createElement('canvas'); GLARE.width = W; GLARE.height = H;
  const g = GLARE.getContext('2d');
  g.fillStyle = 'rgba(255,255,255,.045)'; g.beginPath(); g.moveTo(W * 0.1, 0); g.lineTo(W * 0.38, 0); g.lineTo(W * 0.14, H); g.lineTo(-W * 0.14, H); g.fill();
  g.fillStyle = 'rgba(255,255,255,.025)'; g.beginPath(); g.moveTo(W * 0.45, 0); g.lineTo(W * 0.52, 0); g.lineTo(W * 0.28, H); g.lineTo(W * 0.21, H); g.fill();
  return GLARE;
}

function offGlass(x, c) {
  const glass = c.mon === 'mono' ? 0x1b2620 : c.crt ? 0x25282a : 0x0b0c0e;
  setMap(null);
  R(x, 0, 0, c.W, c.H, glass);
  if (c.crt) { RA(x, 0, 0, c.W, 2, 0x000000, 0.4); }
}
function blackScreen(x, c) {
  setMap(null);
  if (c.crt) {
    R(x, 0, 0, c.W, c.H, c.mon === 'mono' ? 0x07120b : 0x0c0d0e);
    RA(x, 4, 3, c.W - 8, c.H - 6, c.mon === 'mono' ? 0x0d2014 : 0x141618, 0.6);
  } else {
    R(x, 0, 0, c.W, c.H, 0x08090b);
    RA(x, 0, 0, c.W, 3, 0x1a1c22, 0.6); RA(x, 0, c.H - 3, c.W, 3, 0x1a1c22, 0.5);
  }
}

// ---------- Ingen signal ----------
function noSignal(x, c) {
  const { W, H, mon, t } = c;
  if (mon === 'mono' || mon === 'cga' || mon === 'ega') {
    // 80-talsskärm utan synk: tom bild, bara glöd och ett rullande svep
    setMap(null);
    R(x, 0, 0, W, H, mon === 'mono' ? 0x061109 : 0x0b0c0e);
    const y = Math.floor((t * 23) % (H + 20)) - 10;
    RA(x, 0, y, W, 6, mon === 'mono' ? 0x1f5a2c : 0x2a2c30, 0.35);
    return;
  }
  R(x, 0, 0, W, H, 0x000000);
  const bw = Math.min(W - 8, 96), bh = 26;
  const bx = Math.round((W - bw) / 2 + Math.sin(t * 0.6) * (W - bw) * 0.4), by = Math.round((H - bh) / 2 + Math.cos(t * 0.45) * (H - bh) * 0.35);
  const port = { hdmi: 'HDMI', dp: 'DISPLAYPORT', dvi: 'DVI-D', vga: 'D-SUB', de9: '9-PIN' }[c.info.era?.videoType] || 'VGA';
  if (mon === 'crt14' || mon === 'crt17') {
    R(x, bx, by, bw, bh, 0x101018); R(x, bx, by, bw, 1, 0x8080c0); R(x, bx, by + bh - 1, bw, 1, 0x8080c0);
    TC(x, 'INGEN SIGNAL', bx + bw / 2, by + 5, 0xffff55);
    TC(x, 'KONTROLLERA KABELN', bx + bw / 2, by + 15, 0x55ff55);
  } else if (mon === 'lcd43') {
    R(x, bx, by, bw, bh, 0x2c3440); R(x, bx + 1, by + 1, bw - 2, 7, 0x4a78c0);
    TC(x, 'PIXELVIEW', bx + bw / 2, by + 2, 0xffffff);
    TC(x, 'INGEN SIGNAL', bx + bw / 2, by + 11, 0xf0f0f0);
    TC(x, port, bx + bw / 2, by + 18, 0x9fb8f0);
  } else {
    R(x, bx, by, bw, bh, 0x16181e); R(x, bx, by, 2, bh, 0x2c6fb7);
    // liten skärmikon med kabel
    R(x, bx + 7, by + 7, 12, 9, 0x9fb8f0); R(x, bx + 8, by + 8, 10, 7, 0x16181e); R(x, bx + 12, by + 16, 2, 3, 0x9fb8f0);
    T(x, port + (port === 'HDMI' ? ' 1' : ''), bx + 25, by + 6, 0xffffff);
    T(x, 'INGEN SIGNAL', bx + 25, by + 14, 0x9aa4b4);
  }
}

// ---------- BIOS / POST ----------
const bootEra = (y) => (y < 1990 ? 'xt' : y < 2000 ? 'award' : y < 2011 ? 'award2k' : 'uefi');
const ERR_CODE = { KEYBOARD: '301', 'HDD CONTROLLER': '1701' };

function post(x, c, isError) {
  const { W, H, info, st, t } = c;
  const era = bootEra(c.year), tt = isError ? 99 : st.t || 0;
  const cols = Math.floor((W - 4) / 4);
  const ram = Math.max(64, info.ramKB || 640);
  const lines = (info.postLines || []).map((l) => up(l).slice(0, cols));
  const err = isError ? wrap(up(st.errorText || 'CPU FAN ERROR! PRESS F1'), cols) : [];
  const blinkOn = blink(t, 2);
  if (era === 'xt') {
    R(x, 0, 0, W, H, 0x000000);
    const grey = 0xaaaaaa, hi = 0xffffff;
    T(x, 'PIXEL-BIOS V1.02', 2, 2, hi);
    T(x, `(C) 1983-${String(c.year).slice(2)} PIXELVERKSTAN`, 2, 8, grey);
    const f = Math.min(1, tt / 1.15), n = Math.floor((ram * f) / 64) * 64;
    T(x, `${String(f < 1 ? n : ram).padStart(5, ' ')} KB${f >= 1 ? ' OK' : ''}`, 2, 18, hi);
    const shown = Math.min(lines.length, Math.max(0, Math.floor((tt - 1.15) / 0.16)));
    let y = 28;
    for (let i = 0; i < shown; i++, y += 6) T(x, lines[i], 2, y, grey);
    if (isError) {
      y += 2;
      const code = Object.keys(ERR_CODE).find((k) => up(st.errorText).includes(k));
      if (code) { T(x, ERR_CODE[code], 2, y, hi); y += 6; }
      for (const l of err) { T(x, l, 2, y, hi); y += 6; }
      if (!code && !up(st.errorText).includes('PRESS')) { T(x, 'TRYCK F1 FÖR ATT FORTSÄTTA', 2, y, grey); y += 6; }
    }
    if (blinkOn) R(x, 2, Math.min(H - 3, y + 3), 3, 1, hi);
    return;
  }
  if (era === 'uefi') {
    R(x, 0, 0, W, H, 0x000000);
    if (!isError) {
      uefiEmblem(x, W / 2, 30, 1);
      vendorLogo(x, W / 2, 50, 1);
      const f = Math.min(1, tt / 1.8);
      R(x, W / 2 - 20, 66, 40, 1, 0x2a2a2a); R(x, W / 2 - 20, 66, Math.round(40 * f), 1, 0xd8343c);
      T(x, 'DEL/F2: UEFI', 3, H - 7, 0x8a8a8a); TR(x, 'F8: STARTMENY', W - 3, H - 7, 0x8a8a8a);
      return;
    }
    uefiEmblem(x, W / 2, 14, 0.6);
    let y = 30;
    for (const l of err) { TC(x, l, W / 2, y, 0xffffff); y += 7; }
    if (blinkOn) TC(x, 'TRYCK F1 FÖR UEFI-SETUP', W / 2, y + 6, 0xd8a030);
    T(x, lines[0] || '', 3, H - 7, 0x6a6a6a);
    return;
  }
  // award / award2k
  R(x, 0, 0, W, H, 0x000000);
  if (era === 'award2k' && !isError && tt < 1.0) {
    vendorLogo(x, W / 2, 28, 2);
    T(x, 'DEL: SETUP', 3, H - 7, 0xaaaaaa); TR(x, 'F8: STARTMENY', W - 3, H - 7, 0xaaaaaa);
    return;
  }
  if (era === 'award') {
    R(x, 2, 2, 11, 10, 0x0000aa); R(x, 3, 3, 9, 8, 0x5555ff); T(x, 'PX', 4, 4, 0xffffff);
    T(x, 'PIXELBIOS V4.51PG', 16, 2, 0xffffff);
    T(x, 'ENERGISMART BIOS', 16, 8, 0xaaaaaa);
    if (W >= 120) ecoLogo(x, W - 25, 1);
    T(x, `(C) 1984-${String(c.year).slice(2)}`, 16, 14, 0xaaaaaa);
  } else {
    T(x, 'PIXELBIOS V6.00PG', 2, 2, 0xffffff);
    T(x, `(C) ${c.year} PIXELTECH`, 2, 8, 0xaaaaaa);
    R(x, W - 30, 2, 28, 10, 0x1a1a1a); T(x, 'PIXEL', W - 26, 4, 0xd8343c);
  }
  let y = era === 'award' ? 24 : 18;
  const t0 = era === 'award' ? 0 : 1.0;
  const shown = Math.min(lines.length, Math.max(0, Math.floor((tt - t0) / 0.12)));
  const memAt = 1;
  for (let i = 0; i < shown; i++, y += 6) {
    if (i === memAt) {
      const f = Math.min(1, (tt - t0 - 0.12) / 0.7), n = Math.floor((ram * Math.max(0, f)) / 256) * 256;
      T(x, `MINNESTEST: ${f < 1 ? n : ram}K${f >= 1 ? ' OK' : ''}`, 2, y, 0xaaaaaa);
      continue;
    }
    T(x, lines[i], 2, y, 0xaaaaaa);
  }
  if (isError) {
    y += 2;
    for (const l of err) { T(x, l, 2, y, 0xffffff); y += 6; }
    if (blinkOn) T(x, 'F1: FORTSÄTT  DEL: SETUP', 2, y + 1, 0xffff55);
  }
  T(x, 'TRYCK DEL FÖR SETUP', 2, H - 12, 0xffffff);
  T(x, `${era === 'award' ? '09/17/' + String(c.year).slice(2) + '-I486-PX' : '09/17/' + String(c.year).slice(2) + '-NF-PX-6A'}`, 2, H - 6, 0x555555);
}
function uefiEmblem(x, cx, cy, s) {
  const r = Math.round(11 * s);
  for (let i = 0; i < 6; i++) {
    const a0 = (i / 6) * Math.PI * 2 + Math.PI / 6, a1 = ((i + 1) / 6) * Math.PI * 2 + Math.PI / 6;
    L(x, cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, 0xc8ccd2);
    L(x, cx + Math.cos(a0) * (r - 2), cy + Math.sin(a0) * (r - 2), cx + Math.cos(a1) * (r - 2), cy + Math.sin(a1) * (r - 2), 0xd8343c);
  }
  TC(x, 'P', cx, cy - 2 * Math.max(1, Math.round(s * 1.6)) - 1, 0xffffff, Math.max(1, Math.round(s * 1.6)));
}

// ---------- Uppstart per operativsystem ----------
const DOS_CMD = { 'dos-kontor': 'WP', lotus: '123', hemdator: 'SIERRA', cad: 'ACAD', doom: 'DOOM', multimedia: 'MYST', win31: 'WIN' };
function dosVersion(y) { return y < 1987 ? '3.10' : y < 1991 ? '3.30' : y < 1994 ? '5.00' : '6.22'; }
function loading(x, c) {
  switch (c.os) {
    case 'dos': return dosBoot(x, c, DOS_CMD[c.info.template] || '', c.lt);
    case 'win31': return c.lt < 0.8 ? dosBoot(x, c, 'WIN', c.lt + 1.1) : win31Splash(x, c);
    case 'win95': case 'win98': return cloudSplash(x, c);
    case 'xp': return xpSplash(x, c);
    case 'vista': case 'win7': return orbSplash(x, c);
    default: return modernSplash(x, c);
  }
}
function dosBoot(x, c, cmd, lt) {
  const { W, H, t } = c;
  R(x, 0, 0, W, H, 0x000000);
  const grey = 0xaaaaaa;
  const rows = [['STARTAR PIXEL-DOS...', 0.05], ['', 0], [`PIXEL-DOS VERSION ${dosVersion(c.year)}`, 0.45], [`(C) PIXEL AB 1981-${String(Math.max(c.year, 1987)).slice(2)}`, 0.5]];
  if (c.year >= 1991) rows.push(['HIMEM ÄR INSTALLERAT', 0.7]);
  let y = 2;
  for (const [s, at] of rows) { if (lt >= at && s) T(x, s, 2, y, grey); y += 6; }
  if (lt < 0.95) return;
  y += 6;
  const typed = cmd.slice(0, Math.max(0, Math.floor((lt - 1.25) * 7)));
  T(x, 'C:\\>' + typed, 2, y, grey);
  if (blink(t, 2.5)) R(x, 3 + tw('C:\\>' + typed), y + 4, 3, 1, grey);
}
function win31Splash(x, c) {
  const { W, H } = c;
  R(x, 0, 0, W, H, 0x000000);
  flag(x, W / 2 - 26, 36, 8, 'wave', [0xff5555, 0x55ff55, 0x5555ff, 0xffff55]);
  T(x, 'FÖNSTER', W / 2 - 12, 27, 0xffffff, 2);
  T(x, 'VERSION 3.1', W / 2 - 12, 42, 0xaaaaaa);
  TC(x, '(C) 1985-1992 PIXELSOFT', W / 2, H - 12, 0x808080);
}
function cloudSplash(x, c) {
  const { W, H, lt, os } = c;
  x.drawImage(layer('clouds-' + os, W, H, (g) => {
    vgrad(g, 0, 0, W, H, 0x1a4fc0, 0x9cc8f4);
    const blobs = [[0.15, 0.2, 14, 5], [0.3, 0.16, 18, 6], [0.72, 0.24, 20, 6], [0.88, 0.3, 12, 4], [0.1, 0.72, 16, 5], [0.45, 0.8, 22, 6], [0.8, 0.76, 18, 6], [0.6, 0.12, 10, 3]];
    for (const [bx, by, rx, ry] of blobs) {
      ellipse(g, bx * W, by * H + 1, rx, ry, 0xb8d4f4);
      ellipse(g, bx * W - rx * 0.35, by * H - ry * 0.3, rx * 0.55, ry * 0.9, 0xf4f8ff);
      ellipse(g, bx * W + rx * 0.3, by * H - ry * 0.1, rx * 0.6, ry * 0.8, 0xe6effc);
    }
    flag(g, W / 2 - 22, H / 2 - 6, 7, 'wave');
    for (let i = 1; i <= 3; i++) R(g, W / 2 - 38 - i * 5, H / 2 - 8 + i * 2, 4 - i, 4 - i, FLAG[i % 4]);
    T(g, 'FÖNSTER', W / 2 - 8, H / 2 - 12, 0x0a1a3a); T(g, 'FÖNSTER', W / 2 - 9, H / 2 - 13, 0xffffff);
    const v = os === 'win98' ? '98' : '95';
    T(g, v, W / 2 - 9, H / 2 - 5, 0x0a1a3a, 2); T(g, v, W / 2 - 10, H / 2 - 6, 0xffffff, 2);
  }), 0, 0);
  // rullande färgband längst ned
  const off = Math.floor(lt * 60);
  for (let i = 0; i < W; i++) {
    const p = ((i + off) % 60) / 60;
    R(x, i, H - 4, 1, 3, p < 0.33 ? mix(0x0a2a8a, 0x2c8ff0, p * 3) : p < 0.66 ? mix(0x2c8ff0, 0xbfe4ff, (p - 0.33) * 3) : mix(0xbfe4ff, 0x0a2a8a, (p - 0.66) * 3));
  }
}
function xpSplash(x, c) {
  const { W, H, lt } = c;
  R(x, 0, 0, W, H, 0x000000);
  flag(x, W / 2 - 18, 34, 6, 'wave');
  T(x, 'FÖNSTER', W / 2 - 6, 30, 0xffffff);
  T(x, 'XP', W / 2 + 22, 26, 0xf07a1a);
  T(x, 'PIXELSOFT', W / 2 - 6, 38, 0x9a9a9a);
  const bw = 34, bx = Math.round(W / 2 - bw / 2), by = 56;
  R(x, bx - 1, by - 1, bw + 2, 7, 0xb0b0b0); R(x, bx, by, bw, 5, 0x000000);
  const p = Math.floor(((lt * 30) % (bw + 12)) - 12);
  for (let i = 0; i < 3; i++) { const bx2 = bx + p + i * 4; if (bx2 >= bx && bx2 + 3 <= bx + bw) { R(x, bx2, by + 1, 3, 3, 0x3a6ed8); R(x, bx2, by + 1, 3, 1, 0x8ab4ff); } }
  T(x, '(C) PIXELSOFT', 3, H - 7, 0x7a7a7a);
}
function orbSplash(x, c) {
  const { W, H, lt, os } = c;
  R(x, 0, 0, W, H, 0x000000);
  if (os === 'vista') {
    orb(x, W / 2, 34, 12, 0.8);
    TC(x, 'FÖNSTER VISTA', W / 2, 52, 0xd8d8d8);
    const bw = 40, bx = Math.round(W / 2 - bw / 2), by = 64;
    R(x, bx, by, bw, 3, 0x0d1a0d);
    const p = Math.floor(((lt * 26) % (bw + 14)) - 14);
    for (let i = 0; i < 14; i++) { const px = bx + p + i; if (px >= bx && px < bx + bw) R(x, px, by, 1, 3, mix(0x0a3a0a, 0x6aff6a, 1 - Math.abs(i - 7) / 7)); }
    T(x, '(C) PIXELSOFT', 3, H - 7, 0x6a6a6a);
    return;
  }
  // fyra ljuspunkter som virvlar ihop till flaggan
  const f = Math.min(1, lt / 1.6);
  x.save(); x.globalCompositeOperation = 'lighter';
  for (let q = 0; q < 4; q++) {
    const a = lt * 3 + (q * Math.PI) / 2, r = (1 - f) * 26 + 3;
    const px = W / 2 + Math.cos(a) * r, py = 34 + Math.sin(a) * r * 0.6;
    for (let k = 4; k >= 0; k--) { x.globalAlpha = 0.15 + (4 - k) * 0.12; disc(x, px - Math.cos(a) * k * 2, py - Math.sin(a) * k * 1.2, 2.2 - k * 0.3, FLAG[q]); }
  }
  x.restore(); x.globalAlpha = 1;
  if (f > 0.85) { x.globalAlpha = (f - 0.85) / 0.15; flag(x, W / 2, 34, 6, 'wave'); x.globalAlpha = 1; }
  TC(x, 'STARTAR FÖNSTER', W / 2, 58, 0xe0e0e0);
  T(x, '(C) PIXELSOFT', 3, H - 7, 0x6a6a6a);
}
function orb(x, cx, cy, r, glowA = 0.5) {
  x.globalAlpha = glowA * 0.35; disc(x, cx, cy, r + 3, 0x3a8ad8); x.globalAlpha = 1;
  disc(x, cx, cy, r, 0x0a2a4a); disc(x, cx, cy, r - 1, 0x10406a);
  flag(x, cx, cy + 1, Math.max(2, Math.round(r / 3)), 'wave');
  x.globalAlpha = 0.35; ellipse(x, cx, cy - r * 0.45, r * 0.7, r * 0.35, 0xffffff); x.globalAlpha = 1;
}
function modernSplash(x, c) {
  const { W, H, lt, os } = c;
  R(x, 0, 0, W, H, 0x000000);
  if (os === 'win11') flag(x, W / 2, 30, 8, 'squares', [0x0a64d8, 0x2c86f0, 0x1a78e8, 0x4aa2ff]);
  else flag(x, W / 2, 30, 8, 'flat', [0x1a8ef0, 0x1a8ef0, 0x1a8ef0, 0x1a8ef0]);
  spinner(x, W / 2, 62, 6, lt);
}
function spinner(x, cx, cy, r, lt) {
  for (let i = 0; i < 6; i++) {
    const a = lt * 5.2 - i * 0.42 - Math.sin(lt * 5.2) * 0.25;
    x.globalAlpha = 1 - i * 0.15;
    R(x, Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1, 0xffffff);
  }
  x.globalAlpha = 1;
}

// ---------- Överhettning: varningen innan datorn stängs av ----------
function overheat(x, c) {
  const { W, H, os, t } = c;
  const on = blink(t, 3);
  if (os === 'dos' || os === 'win31') {
    dosBoot(x, c, '', 3);
    for (let i = 0; i < 18; i++) T(x, String.fromCharCode(33 + Math.floor(hsh(i, Math.floor(t * 8)) * 58)), Math.floor(hsh(i, 3) * (W - 4)), Math.floor(hsh(i, 5) * 40) + 30, 0x55ff55);
    if (on) { R(x, 8, H / 2 - 10, W - 16, 20, 0xaa0000); R(x, 9, H / 2 - 9, W - 18, 18, 0xff5555); TC(x, 'CPU 105°C', W / 2, H / 2 - 6, 0xffffff); TC(x, 'DATORN STÄNGS AV!', W / 2, H / 2 + 2, 0xffffff); }
    return;
  }
  if (os === 'win10' || os === 'win11') {
    R(x, 0, 0, W, H, os === 'win11' ? 0x0f4fa8 : 0x0078d7);
    T(x, ':(', 6, 8, 0xffffff, 3);
    T(x, 'DIN DATOR STÖTTE PÅ ETT', 6, 30, 0xffffff);
    T(x, 'PROBLEM: CPU:N ÄR FÖR', 6, 37, 0xffffff);
    T(x, 'VARM. STÄNGER AV...', 6, 44, 0xffffff);
    T(x, `${Math.min(100, Math.floor(c.lt * 40))}% KLART`, 6, 54, 0xffffff);
    for (let i = 0; i < 12; i++) for (let j = 0; j < 12; j++) if (hsh(i, j) > 0.5 || (i < 3 && j < 3)) P(x, 6 + i, 64 + j, 0xffffff);
    T(x, 'STOPPKOD: CPU_HOT', 22, 70, 0xffffff);
    return;
  }
  R(x, 0, 0, W, H, 0x0000aa);
  if (os === 'win95' || os === 'win98') {
    R(x, W / 2 - 20, 12, 40, 7, 0xaaaaaa); TC(x, 'FÖNSTER', W / 2, 13, 0x0000aa);
    ['ETT ALLVARLIGT FEL HAR', 'UPPSTÅTT: CPU:N ÄR', 'ÖVERHETTAD (105°C).', '', 'DATORN STÄNGS AV FÖR', 'ATT SKYDDA PROCESSORN.'].forEach((l, i) => T(x, l, 8, 25 + i * 7, 0xffffff));
    if (on) TC(x, 'TRYCK VALFRI TANGENT _', W / 2, H - 12, 0xffffff);
    return;
  }
  ['ETT PROBLEM HAR UPPTÄCKTS', 'OCH FÖNSTER HAR STÄNGTS AV', 'FÖR ATT SKYDDA DATORN.', '', 'CPU_OVERHEAT', '', '*** STOP: 0X0000007F', '', 'SPARAR MINNESDUMP...'].forEach((l, i) => T(x, l.slice(0, Math.floor((W - 4) / 4)), 3, 3 + i * 7, 0xffffff));
  if (on) T(x, `${Math.min(100, Math.floor(c.lt * 45))}%`, 3, 3 + 9 * 7, 0xffffff);
}

// ---------- Fönstermiljöer ----------
const TASKBAR_H = 9;
function wallpaper(x, c) {
  const { W, H, os } = c;
  x.drawImage(layer('wall-' + os, W, H, (g) => {
    switch (os) {
      case 'win31': R(g, 0, 0, W, H, 0xc0c0c0); break;
      case 'win95': case 'win98': R(g, 0, 0, W, H, 0x008080); break;
      case 'xp': {
        vgrad(g, 0, 0, W, H, 0x1d5fc9, 0x9ccaf4);
        for (const [bx, by, rx, ry] of [[0.2, 0.18, 16, 4], [0.55, 0.12, 22, 5], [0.85, 0.22, 14, 3], [0.4, 0.3, 12, 3]]) { g.globalAlpha = 0.55; ellipse(g, bx * W, by * H, rx, ry, 0xffffff); g.globalAlpha = 0.35; ellipse(g, bx * W + 4, by * H + 2, rx * 0.8, ry, 0xeaf4ff); g.globalAlpha = 1; }
        for (let i = 0; i < W; i++) {
          const top = Math.round(H * 0.5 + Math.sin((i / W) * Math.PI * 1.1 + 0.2) * -9 + Math.sin(i * 0.09) * 1.5);
          vgrad(g, i, top, 1, H - top, 0x7cc83c, 0x2a6a14, 6);
          R(g, i, top, 1, 1, 0x9ee05a);
        }
        break;
      }
      case 'vista': {
        vgrad(g, 0, 0, W, H, 0x04141c, 0x0a3030);
        g.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 5; k++) for (let i = 0; i < W; i++) {
          const yy = H * 0.3 + k * 6 + Math.sin(i * 0.035 + k) * 14 + Math.sin(i * 0.11) * 2;
          g.globalAlpha = 0.18 - k * 0.025; R(g, i, yy, 1, 6 + k * 3, k % 2 ? 0x20a0a0 : 0x40d060);
        }
        g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
        break;
      }
      case 'win7': {
        vgrad(g, 0, 0, W, H, 0x1e64b8, 0x0a2458);
        g.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; g.globalAlpha = 0.09; L(g, W * 0.5, H * 0.42, W * 0.5 + Math.cos(a) * W, H * 0.42 + Math.sin(a) * W, 0x9fd0ff); }
        g.globalAlpha = 0.25; disc(g, W * 0.5, H * 0.42, 16, 0x5aa8f0); g.globalAlpha = 1;
        g.globalCompositeOperation = 'source-over';
        flag(g, W * 0.5, H * 0.42, 7, 'wave');
        g.globalAlpha = 0.25; for (let i = 0; i < W; i++) R(g, i, H * 0.72 + Math.sin(i * 0.05) * 4, 1, 2, 0x7ac8ff); g.globalAlpha = 1;
        break;
      }
      case 'win10': {
        vgrad(g, 0, 0, W, H, 0x001030, 0x002a5a);
        g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 26; i++) { g.globalAlpha = 0.05; const y0 = H * 0.18 + i * 1.6; L(g, W * 0.62, y0 + 12, 0, y0 * 1.6 - 20, 0x3aa0ff); }
        g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
        const cx = W * 0.72, cy = H * 0.42;
        for (let q = 0; q < 4; q++) {
          const qx = q % 2, qy = (q / 2) | 0, s = 13;
          for (let i = 0; i < s; i++) { const sh = Math.round((s - i) * (qx ? 0.12 : 0.3)); R(g, cx - s - 1 + qx * (s + 2) + i, cy - s - 1 + qy * (s + 2) + (qy ? 0 : sh), 1, s - Math.round(sh * (qy ? 0.4 : 1)), mix(0x1a8cff, 0x9ad4ff, 1 - i / s)); }
        }
        break;
      }
      default: { // win11: blomman
        vgrad(g, 0, 0, W, H, 0xcfe2f8, 0x7eb0ec);
        const cx = W / 2, cy = H * 0.46;
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * Math.PI * 2 + 0.3;
          for (let s = 0; s < 3; s++) { g.globalAlpha = 0.55 + s * 0.15; ellipse(g, cx + Math.cos(a) * (9 - s * 2), cy + Math.sin(a) * (7 - s * 2), 10 - s * 2.5, 5 - s, [0x2a6fe0, 0x1a56c8, 0x5a9cf8][s]); }
        }
        g.globalAlpha = 1; disc(g, cx, cy, 3, 0xdcecff);
      }
    }
  }), 0, 0);
}
function icon(x, kind, a, b) {
  switch (kind) {
    case 'pc': R(x, a + 1, b, 8, 6, 0xd8d0b8); R(x, a + 2, b + 1, 6, 4, 0x0080a0); R(x, a + 3, b + 6, 4, 1, 0x808080); R(x, a, b + 7, 10, 2, 0xc8c0a8); break;
    case 'net': R(x, a, b + 1, 5, 4, 0xd8d0b8); R(x, a + 1, b + 2, 3, 2, 0x0080a0); R(x, a + 5, b + 4, 5, 4, 0xd8d0b8); R(x, a + 6, b + 5, 3, 2, 0x0080a0); R(x, a + 2, b + 6, 4, 1, 0x404040); break;
    case 'bin': R(x, a + 2, b, 6, 1, 0x808080); R(x, a + 2, b + 1, 6, 8, 0xc0c0c0); for (let i = 0; i < 3; i++) R(x, a + 3 + i * 2, b + 2, 1, 6, 0x808080); break;
    case 'folder': R(x, a, b + 1, 4, 1, 0xe0b030); R(x, a, b + 2, 10, 6, 0xf0c848); R(x, a, b + 7, 10, 1, 0xb08820); break;
    case 'doc': R(x, a + 2, b, 6, 8, 0xffffff); R(x, a + 3, b + 2, 4, 1, 0x3a6ad8); R(x, a + 3, b + 4, 4, 1, 0x808080); R(x, a + 3, b + 6, 3, 1, 0x808080); break;
    case 'globe': disc(x, a + 5, b + 4, 3.6, 0x2c78d8); R(x, a + 3, b + 2, 3, 2, 0x45b964); R(x, a + 5, b + 5, 3, 2, 0x45b964); break;
    case 'sheet': R(x, a + 1, b, 8, 8, 0x1e7a44); R(x, a + 2, b + 1, 6, 6, 0xffffff); R(x, a + 2, b + 3, 6, 1, 0x1e7a44); R(x, a + 4, b + 1, 1, 6, 0x1e7a44); break;
    case 'code': R(x, a + 1, b, 8, 8, 0x2a6ac8); T(x, '<>', a + 1, b + 2, 0xffffff); break;
  }
}
function desktopIcons(x, c, list) {
  list.forEach(([kind, label], i) => {
    const b = 3 + i * 16;
    icon(x, kind, 7, b);
    if (label.length <= 6) TC(x, label, 12, b + 10, 0xffffff);
    else greek(x, 3, b + 12, 18, 0xffffff, i);
  });
}
function taskbar(x, c, opts = {}) {
  const { W, H, os, info } = c, y = H - TASKBAR_H, clock = info.clock || '12:00';
  switch (os) {
    case 'win95': case 'win98': {
      R(x, 0, y, W, TASKBAR_H, 0xc0c0c0); R(x, 0, y, W, 1, 0xdfdfdf); R(x, 0, y + 1, W, 1, 0xffffff);
      bevel(x, 1, y + 2, 29, 7, 0xc0c0c0, !!opts.startOpen, false);
      flag(x, 6, y + 5, 2, 'wave'); T(x, 'START', 10, y + 3, 0x000000);
      let bx = 33;
      if (os === 'win98') { R(x, bx, y + 2, 1, 6, 0x808080); R(x, bx + 1, y + 2, 1, 6, 0xffffff); icon98(x, bx + 3, y + 3); bx += 22; }
      if (opts.task) { const w2 = Math.min(40, W - bx - 30); bevel(x, bx, y + 2, w2, 7, 0xd8d8d8, true, false); R(x, bx + 2, y + 4, 3, 3, 0x000080); T(x, opts.task.slice(0, Math.floor((w2 - 8) / 4)), bx + 7, y + 3, 0x000000); }
      bevel(x, W - 25, y + 2, 24, 7, 0xc0c0c0, true, false); T(x, clock, W - 22, y + 3, 0x000000);
      break;
    }
    case 'xp': {
      vgrad(x, 0, y, W, TASKBAR_H, 0x3c7ee8, 0x1a4ab8, 3); R(x, 0, y, W, 1, 0x6a9cf4);
      vgrad(x, 0, y, 30, TASKBAR_H, 0x4aa84a, 0x2a7a2a, 3); R(x, 30, y + 1, 1, TASKBAR_H - 2, 0x2a6a2a); R(x, 0, y, 30, 1, 0x7ad07a);
      flag(x, 5, y + 5, 2, 'wave'); T(x, 'START', 10, y + 2, 0xffffff);
      if (opts.task) { R(x, 34, y + 1, 38, 7, 0x1a48a8); R(x, 34, y + 1, 38, 1, 0x4a7ad8); R(x, 36, y + 3, 3, 3, 0xffffff); T(x, opts.task.slice(0, 7), 41, y + 2, 0xffffff); }
      R(x, W - 26, y, 26, TASKBAR_H, 0x1290e8); R(x, W - 26, y, 1, TASKBAR_H, 0x0a60b0); T(x, clock, W - 22, y + 2, 0xffffff);
      break;
    }
    case 'vista': case 'win7': {
      x.globalAlpha = 0.9; vgrad(x, 0, y, W, TASKBAR_H, os === 'vista' ? 0x2a3038 : 0x2a4868, os === 'vista' ? 0x080a0c : 0x10223a, 3); x.globalAlpha = 1;
      R(x, 0, y, W, 1, os === 'vista' ? 0x5a6470 : 0x6a9ad0);
      orb(x, 6, y + 4, 4, 0.9);
      const pins = os === 'win7' ? ['folder', 'globe', 'media'] : ['globe', 'folder'];
      pins.forEach((k, i) => { const px = 16 + i * 12; if (k === 'media') { disc(x, px + 5, y + 5, 3, 0xf08020); R(x, px + 4, y + 4, 2, 2, 0xffffff); } else icon(x, k, px, y + 1); });
      if (opts.task) { RA(x, 15 + pins.length * 12, y + 1, 12, 8, 0xffffff, 0.3); icon(x, opts.taskIcon || 'doc', 16 + pins.length * 12, y + 1); }
      T(x, clock, W - 22, y + 2, 0xffffff);
      break;
    }
    case 'win10': {
      R(x, 0, y, W, TASKBAR_H, 0x101418);
      flag(x, 5, y + 5, 2, 'squares', [0xffffff, 0xffffff, 0xffffff, 0xffffff]);
      R(x, 11, y + 1, 36, 7, 0xf2f2f2); T(x, 'SÖK HÄR', 14, y + 2, 0x6a6a6a);
      ['folder', 'globe', opts.taskIcon || 'doc'].forEach((k, i) => { const px = 51 + i * 12; icon(x, k, px, y); if (i === 2 && opts.task) R(x, px, y + TASKBAR_H - 1, 10, 1, 0x3aa0ff); });
      T(x, clock, W - 22, y + 2, 0xffffff);
      break;
    }
    default: { // win11
      x.globalAlpha = 0.95; R(x, 0, y, W, TASKBAR_H, 0xeef2f8); x.globalAlpha = 1; R(x, 0, y, W, 1, 0xd8dde6);
      const bx = Math.round(W / 2 - 30);
      flag(x, bx + 5, y + 5, 2, 'squares', [0x0a64d8, 0x2c86f0, 0x1a78e8, 0x4aa2ff]);
      disc(x, bx + 16, y + 4, 2, 0x404040); disc(x, bx + 16, y + 4, 1, 0xeef2f8); P(x, bx + 18, y + 6, 0x404040);
      icon(x, 'folder', bx + 22, y); icon(x, 'globe', bx + 34, y);
      icon(x, opts.taskIcon || 'doc', bx + 46, y);
      if (opts.task) R(x, bx + 49, y + TASKBAR_H - 1, 4, 1, 0x0a64d8);
      T(x, clock, W - 22, y + 2, 0x202020);
    }
  }
  return y;
}
function icon98(x, a, b) { disc(x, a + 2, b + 2, 2, 0x2c78d8); R(x, a + 1, b + 2, 3, 1, 0xffffff); R(x, a + 7, b, 5, 4, 0x008080); R(x, a + 7, b + 4, 5, 1, 0x808080); R(x, a + 14, b, 4, 4, 0xf0f0f0); R(x, a + 14, b + 1, 4, 1, 0xd8343c); }
// Programfönster i operativsystemets stil. Returnerar klientytan {x,y,w,h}
function osWindow(x, c, a, b, w, h, title, opts = {}) {
  const { os } = c;
  switch (os) {
    case 'win31': {
      R(x, a, b, w, h, 0x000000); R(x, a + 1, b + 1, w - 2, h - 2, 0xc0c0c0); R(x, a + 2, b + 2, w - 4, h - 4, 0x000000);
      const tb = b + 3, act = opts.active !== false;
      R(x, a + 3, tb, w - 6, 7, act ? 0x000080 : 0xffffff);
      bevel(x, a + 3, tb, 7, 7, 0xc0c0c0, false, false); R(x, a + 4, tb + 3, 5, 1, 0x000000);
      bevel(x, a + w - 17, tb, 7, 7, 0xc0c0c0, false, false); P(x, a + w - 14, tb + 4, 0); R(x, a + w - 15, tb + 3, 3, 1, 0);
      bevel(x, a + w - 10, tb, 7, 7, 0xc0c0c0, false, false); P(x, a + w - 7, tb + 2, 0); R(x, a + w - 8, tb + 3, 3, 1, 0);
      TC(x, title.slice(0, Math.floor((w - 26) / 4)), a + w / 2 - 3, tb + 1, act ? 0xffffff : 0x000000);
      let cy = tb + 7;
      if (opts.menu) { R(x, a + 3, cy, w - 6, 7, 0xffffff); opts.menu.reduce((mx, m) => { if (mx + tw(m) < a + w - 4) T(x, m, mx, cy + 1, 0x000000); return mx + tw(m) + 4; }, a + 5); R(x, a + 3, cy + 7, w - 6, 1, 0x000000); cy += 8; }
      R(x, a + 3, cy, w - 6, h - (cy - b) - 3, 0xffffff);
      return { x: a + 3, y: cy, w: w - 6, h: h - (cy - b) - 3 };
    }
    case 'win95': case 'win98': {
      bevel(x, a, b, w, h, 0xc0c0c0);
      const act = opts.active !== false;
      if (os === 'win98' && act) for (let i = 0; i < w - 6; i++) R(x, a + 3 + i, b + 3, 1, 7, mix(0x000080, 0x1084d0, i / (w - 6)));
      else R(x, a + 3, b + 3, w - 6, 7, act ? 0x000080 : 0x808080);
      R(x, a + 4, b + 4, 5, 5, opts.iconCol ?? 0xf0c848);
      T(x, title.slice(0, Math.floor((w - 34) / 4)), a + 11, b + 4, 0xffffff);
      bevel(x, a + w - 23, b + 4, 6, 5, 0xc0c0c0, false, false); R(x, a + w - 22, b + 7, 3, 1, 0);
      bevel(x, a + w - 17, b + 4, 6, 5, 0xc0c0c0, false, false); R(x, a + w - 16, b + 5, 4, 3, 0); R(x, a + w - 15, b + 6, 2, 1, 0xc0c0c0);
      bevel(x, a + w - 10, b + 4, 6, 5, 0xc0c0c0, false, false); P(x, a + w - 9, b + 5, 0); P(x, a + w - 7, b + 5, 0); P(x, a + w - 8, b + 6, 0); P(x, a + w - 9, b + 7, 0); P(x, a + w - 7, b + 7, 0);
      let cy = b + 11;
      if (opts.menu !== false) { (opts.menu || ['ARKIV', 'REDIGERA', 'VISA', 'HJÄLP']).reduce((mx, m) => { if (mx + tw(m) < a + w - 4) T(x, m, mx, cy + 1, 0x000000); return mx + tw(m) + 4; }, a + 4); cy += 8; }
      R(x, a + 3, cy, w - 6, 1, 0x808080); R(x, a + 3, cy, 1, h - (cy - b) - 3, 0x808080);
      R(x, a + 4, cy + 1, w - 7, h - (cy - b) - 4, 0xffffff);
      return { x: a + 4, y: cy + 1, w: w - 7, h: h - (cy - b) - 4 };
    }
    case 'xp': {
      R(x, a, b, w, h, 0x0842c6);
      vgrad(x, a, b, w, 9, 0x3a8cf8, 0x0a4ad8, 4); R(x, a + 1, b, w - 2, 1, 0x8ab8ff);
      T(x, title.slice(0, Math.floor((w - 30) / 4)), a + 4, b + 2, 0xffffff);
      for (let i = 0; i < 2; i++) { const bx = a + w - 23 + i * 7; R(x, bx, b + 2, 6, 5, 0xffffff); R(x, bx + 1, b + 3, 4, 3, 0x2a6ae8); }
      R(x, a + w - 9, b + 2, 7, 5, 0xffffff); R(x, a + w - 8, b + 3, 5, 3, 0xe0501e); P(x, a + w - 7, b + 4, 0xffffff); P(x, a + w - 5, b + 4, 0xffffff);
      let cy = b + 9;
      if (opts.menu !== false) { R(x, a + 2, cy, w - 4, 7, 0xece9d8); (opts.menu || ['ARKIV', 'REDIGERA', 'VISA']).reduce((mx, m) => { if (mx + tw(m) < a + w - 4) T(x, m, mx, cy + 1, 0x000000); return mx + tw(m) + 4; }, a + 4); cy += 7; }
      R(x, a + 2, cy, w - 4, h - (cy - b) - 2, 0xffffff);
      return { x: a + 2, y: cy, w: w - 4, h: h - (cy - b) - 2 };
    }
    case 'vista': case 'win7': {
      x.globalAlpha = 0.85; R(x, a, b, w, h, os === 'vista' ? 0x7aa0b8 : 0x98c0e8); x.globalAlpha = 1;
      RA(x, a, b, w, 3, 0xffffff, 0.35); R(x, a, b, w, 1, 0x3a5a78); R(x, a, b, 1, h, 0x3a5a78); R(x, a + w - 1, b, 1, h, 0x3a5a78); R(x, a, b + h - 1, w, 1, 0x3a5a78);
      T(x, title.slice(0, Math.floor((w - 32) / 4)), a + 4, b + 2, 0x10202a);
      R(x, a + w - 14, b + 1, 11, 6, 0xc83a2a); R(x, a + w - 14, b + 1, 11, 2, 0xe88070); P(x, a + w - 10, b + 3, 0xffffff); P(x, a + w - 8, b + 3, 0xffffff); P(x, a + w - 9, b + 4, 0xffffff); P(x, a + w - 10, b + 5, 0xffffff); P(x, a + w - 8, b + 5, 0xffffff);
      RA(x, a + w - 26, b + 1, 11, 6, 0xffffff, 0.35);
      const cy = b + 9;
      R(x, a + 3, cy, w - 6, h - 12, 0xffffff);
      return { x: a + 3, y: cy, w: w - 6, h: h - 12 };
    }
    case 'win10': {
      R(x, a, b, w, h, 0x1883d7); R(x, a + 1, b + 1, w - 2, 7, 0xffffff);
      T(x, title.slice(0, Math.floor((w - 34) / 4)), a + 4, b + 2, 0x000000);
      R(x, a + w - 27, b + 4, 4, 1, 0x000000);
      R(x, a + w - 18, b + 2, 4, 4, 0x000000); R(x, a + w - 17, b + 3, 2, 2, 0xffffff);
      P(x, a + w - 8, b + 2, 0); P(x, a + w - 6, b + 2, 0); P(x, a + w - 7, b + 3, 0); P(x, a + w - 8, b + 4, 0); P(x, a + w - 6, b + 4, 0);
      R(x, a + 1, b + 8, w - 2, h - 9, 0xffffff);
      return { x: a + 1, y: b + 8, w: w - 2, h: h - 9 };
    }
    default: { // win11
      R(x, a + 1, b, w - 2, h, 0xc8ccd4); R(x, a, b + 1, w, h - 2, 0xc8ccd4);
      R(x, a + 1, b + 1, w - 2, 7, 0xf3f5f8);
      T(x, title.slice(0, Math.floor((w - 34) / 4)), a + 4, b + 2, 0x1a1a1a);
      R(x, a + w - 27, b + 4, 4, 1, 0x303030);
      R(x, a + w - 18, b + 2, 4, 4, 0x303030); R(x, a + w - 17, b + 3, 2, 2, 0xf3f5f8);
      P(x, a + w - 8, b + 2, 0x303030); P(x, a + w - 6, b + 2, 0x303030); P(x, a + w - 7, b + 3, 0x303030); P(x, a + w - 8, b + 4, 0x303030); P(x, a + w - 6, b + 4, 0x303030);
      R(x, a + 1, b + 8, w - 2, h - 9, 0xffffff);
      return { x: a + 1, y: b + 8, w: w - 2, h: h - 9 };
    }
  }
}
function drawPointer(x, c, kind = 'arrow') {
  if (!c.st.mouse) return;
  const [mx, my] = pointerPos(c.W, c.H, c.t);
  if (kind === 'hand') sprite(x, HAND, mx - 3, my - 1);
  else if (kind === 'hourglass') sprite(x, HOURGLASS, mx, my, 0x000000, 0xffffff);
  else sprite(x, ARROW, mx, my);
}

// ---------- Skrivbord: kundens program ----------
function desktop(x, c) {
  const app = APPS[c.info.template];
  if (c.os === 'dos' && !(app && DOS_APPS.has(c.info.template))) return dosPrompt(x, c);
  if (app) return app(x, c);
  return genericDesktop(x, c);
}
const gfxOn = (c) => { if (c.mon === 'cga') setMap('cga4'); else if (c.mon === 'mono') setMap('monoGfx'); };
const gfxOff = (c) => { if (c.mon === 'cga') setMap('ega'); else if (c.mon === 'mono') setMap('mono'); };

function dosPrompt(x, c) {
  const { W, H, t } = c;
  R(x, 0, 0, W, H, 0x000000);
  const rows = ['C:\\>DIR', '', ' VOLYM I ENHET C: PIXEL', ' KATALOG C:\\', '', 'COMMAND  COM   25308', 'AUTOEXEC BAT     128', 'CONFIG   SYS      96', 'DOS         <DIR>', 'SPEL        <DIR>', '  6 FIL(ER) 2 048 KB LEDIGT', '', 'C:\\>'];
  rows.forEach((l, i) => T(x, l.slice(0, Math.floor((W - 2) / 4)), 2, 2 + i * 6, 0xaaaaaa));
  if (blink(t, 2.5)) R(x, 2 + tw('C:\\>') + 1, 2 + 12 * 6 + 4, 3, 1, 0xaaaaaa);
}

// --- WordPerfect-liknande ordbehandlare (DOS) ---
const LETTER = ['KÄRA KUND,', '', 'TACK FÖR ER BESTÄLLNING AV', 'EN NY PERSONDATOR. DEN HAR', 'GOTT OM MINNE OCH EN SNABB', 'PROCESSOR. VI LEVERERAR', 'DATORN PÅ FREDAG.', '', 'MED VÄNLIG HÄLSNING', 'PIXELVERKSTAN AB'];
function wordPerfect(x, c) {
  const { W, H, lt, t } = c;
  R(x, 0, 0, W, H, 0x0000aa);
  const cols = Math.floor((W - 4) / 4);
  const total = LETTER.reduce((s, l) => s + l.length + 1, 0);
  let left = Math.floor((lt * 14 + 70) % (total + 40)), cx = 2, cy = 3, row = 1;
  for (let i = 0; i < LETTER.length; i++) {
    const l = LETTER[i].slice(0, cols), k = Math.min(l.length, left);
    if (k > 0) T(x, l.slice(0, k), 2, 3 + i * 7, i === 0 || i >= 8 ? 0xffffff : 0xaaaaaa);
    cx = 2 + (k ? tw(l.slice(0, k)) + 1 : 0); cy = 3 + i * 7; row = i + 1;
    if (left <= l.length) break;
    left -= l.length + 1;
  }
  if (blink(t, 3)) R(x, cx, cy + 5, 3, 1, 0xffffff);
  R(x, 0, H - 8, W, 1, 0x5555ff);
  T(x, 'C:\\BREV.TXT', 2, H - 6, 0xaaaaaa);
  TR(x, `SID 1 RAD ${(row * 0.17 + 1).toFixed(1)}`, W - 2, H - 6, 0xaaaaaa);
}

// --- Lotus 1-2-3-liknande kalkylprogram (DOS) ---
const SHEET = [['', 'JAN', 'FEB', 'MAR', 'SUMMA'], ['INTÄKT', 1200, 1350, 1580], ['LÖNER', -600, -600, -650], ['HYRA', -250, -250, -250], ['EL', -45, -52, -38], [], ['VINST']];
function lotus(x, c) {
  const { W, H, lt, t } = c;
  const phase = lt % 15;
  if (phase > 10) return lotusGraph(x, c);
  R(x, 0, 0, W, H, 0x000000);
  const cols = 5, cw = Math.floor((W - 9) / cols), top = 21;
  const val = (r, k) => {
    if (r === 6) { let s = 0; for (let rr = 1; rr <= 4; rr++) s += k === 4 ? SHEET[rr].slice(1).reduce((a, b) => a + b, 0) : SHEET[rr][k]; return k ? s : 'VINST'; }
    if (k === 4 && r >= 1 && r <= 4) return SHEET[r].slice(1).reduce((a, b) => a + b, 0);
    return SHEET[r]?.[k] ?? '';
  };
  const cells = [[1, 1], [1, 2], [1, 3], [1, 4], [2, 4], [6, 1], [6, 4], [3, 2]];
  const [cr, ck] = cells[Math.floor(lt * 1.2) % cells.length];
  const v = val(cr, ck);
  const addr = String.fromCharCode(65 + ck) + (cr + 1);
  T(x, `${addr}: ${typeof v === 'number' ? (ck === 4 || cr === 6 ? '@SUM(B' + (cr + 1) + '..D' + (cr + 1) + ')' : v) : "'" + v}`.slice(0, Math.floor((W - 26) / 4)), 2, 1, 0xaaaaaa);
  const menu = phase > 6;
  R(x, W - 22, 0, 22, 7, 0x00aaaa); T(x, menu ? 'MENY' : 'KLAR', W - 20, 1, 0x000000);
  if (menu) {
    const items = ['KALKYL', 'OMRÅDE', 'KOPIERA', 'FLYTTA', 'FIL'];
    let mx = 2; const hl = Math.floor(lt * 1.5) % items.length;
    items.forEach((s, i) => { if (mx + tw(s) > W) return; if (i === hl) R(x, mx - 1, 7, tw(s) + 2, 7, 0x00aaaa); T(x, s, mx, 8, i === hl ? 0x000000 : 0xaaaaaa); mx += tw(s) + 5; });
    greek(x, 2, 16, W - 30, 0x555555, 3);
  }
  R(x, 0, top - 7, W, 7, 0x00aaaa);
  for (let k = 0; k < cols; k++) TC(x, String.fromCharCode(65 + k), 9 + k * cw + cw / 2, top - 6, 0x000000);
  for (let r = 0; r < 10; r++) {
    const y = top + r * 6;
    if (y > H - 14) break;
    R(x, 0, y, 8, 6, 0x00aaaa); TC(x, String(r + 1), 4, y, 0x000000);
    for (let k = 0; k < cols; k++) {
      const cxp = 9 + k * cw, vv = r <= 6 ? val(r, k) : '';
      const sel = r === cr && k === ck;
      if (sel) R(x, cxp, y, cw - 1, 6, 0x00aaaa);
      const s = typeof vv === 'number' ? String(vv) : String(vv).slice(0, Math.floor(cw / 4));
      const colr = sel ? 0x000000 : typeof vv === 'number' && vv < 0 ? 0xff5555 : r === 0 || r === 6 ? 0xffffff : 0xaaaaaa;
      if (typeof vv === 'number') TR(x, s, cxp + cw - 2, y + 1, colr); else T(x, s, cxp + 1, y + 1, colr);
    }
  }
  T(x, '17-SEP-' + String(c.year).slice(2) + ' 09:41', 2, H - 7, 0xaaaaaa);
  if (blink(t, 1)) TR(x, 'NUM', W - 2, H - 7, 0x55ffff);
}
function lotusGraph(x, c) {
  const { W, H } = c;
  gfxOn(c);
  R(x, 0, 0, W, H, 0x000000);
  TC(x, 'RESULTAT ' + c.year, W / 2, 3, 0xffffff);
  const x0 = 16, y0 = H - 16, h = H - 34;
  R(x, x0, 12, 1, y0 - 12, 0xffffff); R(x, x0, y0, W - x0 - 6, 1, 0xffffff);
  for (let i = 0; i <= 4; i++) { const yy = y0 - (h * i) / 4; R(x, x0 - 2, yy, 2, 1, 0xffffff); TR(x, String(i * 400), x0 - 3, yy - 2, 0xaaaaaa); }
  const data = [[1200, 895], [1350, 1048], [1580, 1062]], bw = Math.floor((W - x0 - 20) / 7);
  data.forEach(([a, b], i) => {
    const bx = x0 + 5 + i * bw * 2.2;
    const ha = Math.round((a / 1600) * h), hb = Math.round((b / 1600) * h);
    R(x, bx, y0 - ha, bw, ha, 0x55ffff);
    for (let yy = y0 - hb; yy < y0; yy++) for (let xx = bx + bw; xx < bx + bw * 2; xx++) if ((xx + yy) % 3 === 0) P(x, xx, yy, 0xff55ff);
    R(x, bx + bw, y0 - hb, bw, 1, 0xff55ff);
    TC(x, ['JAN', 'FEB', 'MAR'][i], bx + bw, y0 + 3, 0xffffff);
  });
  R(x, W - 38, 13, 4, 4, 0x55ffff); T(x, 'INTÄKT', W - 32, 13, 0xffffff);
  R(x, W - 38, 20, 4, 4, 0xff55ff); T(x, 'VINST', W - 32, 20, 0xffffff);
  gfxOff(c);
}

// --- Äventyrsspel à la King's Quest (EGA/CGA) ---
function adventure(x, c) {
  const { W, H, lt, t } = c;
  gfxOn(c);
  x.drawImage(layer('kq', W, H, (g) => {
    R(g, 0, 7, W, 34, 0x5555ff);
    for (const [cx, cy, w] of [[20, 13, 14], [70, 11, 18], [100, 17, 10], [140, 12, 16]]) { R(g, cx, cy, w, 2, 0xffffff); R(g, cx + 3, cy - 1, w - 6, 1, 0xffffff); }
    for (let i = 0; i < W; i++) { const hy = Math.round(33 + Math.sin(i * 0.07) * 3 + Math.sin(i * 0.19) * 1.5); R(g, i, hy, 1, 45 - hy, 0x00aa00); }
    // slottet
    const sx = Math.round(W * 0.56), sw = Math.round(W * 0.34), sy = 20;
    R(g, sx, sy + 6, sw, 20, 0xaaaaaa);
    for (let i = 0; i < sw; i += 3) R(g, sx + i, sy + 4, 2, 2, 0xaaaaaa);
    for (let yy = sy + 9; yy < sy + 26; yy += 3) for (let i = (yy % 6 ? 0 : 2); i < sw; i += 4) R(g, sx + i, yy, 1, 1, 0x555555);
    for (const tx of [sx - 3, sx + sw - 4]) {
      R(g, tx, sy - 2, 8, 28, 0xaaaaaa); R(g, tx + 6, sy - 2, 2, 28, 0x555555);
      for (let r = 0; r < 6; r++) R(g, tx + 3 - Math.floor(r / 2), sy - 8 + r, 2 + r, 1, 0xaa0000);
      R(g, tx + 4, sy - 13, 1, 5, 0x555555); R(g, tx + 5, sy - 13, 3, 2, 0x5555ff);
      R(g, tx + 3, sy + 6, 2, 3, 0x000000);
    }
    const gx = sx + Math.round(sw / 2) - 4;
    R(g, gx, sy + 14, 8, 12, 0x000000); R(g, gx + 1, sy + 13, 6, 1, 0x000000); R(g, gx + 2, sy + 12, 4, 1, 0x000000);
    for (let i = 1; i < 8; i += 2) R(g, gx + i, sy + 14, 1, 12, 0x555555);
    R(g, sx - 6, sy + 26, sw + 12, 4, 0x0000aa);
    for (let i = 0; i < sw + 10; i += 5) R(g, sx - 5 + i, sy + 27, 2, 1, 0x5555ff);
    R(g, gx - 1, sy + 26, 10, 4, 0xaa5500);
    // gräs, stig, träd och stenar
    R(g, 0, 45, W, H - 53, 0x00aa00);
    for (let i = 0; i < 90; i++) P(g, hsh(i, 1) * W, 45 + hsh(i, 2) * (H - 54), hsh(i, 3) > 0.5 ? 0x55ff55 : 0x005500);
    for (let yy = sy + 30; yy < H - 8; yy++) {
      const f = (yy - sy - 30) / (H - 8 - sy - 30), w = 8 + f * 26, cx = gx + 4 - f * (W * 0.25) + Math.sin(f * 4) * 6;
      R(g, cx - w / 2, yy, w, 1, 0xaa5500); if (yy % 3 === 0) R(g, cx - w / 2 + hsh(yy, 9) * w, yy, 2, 1, 0xffff55);
    }
    R(g, 7, 34, 7, 36, 0xaa5500); R(g, 9, 34, 1, 36, 0x555555); R(g, 12, 40, 1, 20, 0x555555); R(g, 4, 68, 13, 3, 0xaa5500);
    for (const [bx, by, r] of [[10, 26, 11], [2, 32, 8], [19, 31, 8], [11, 18, 7]]) disc(g, bx, by, r, 0x00aa00);
    for (let i = 0; i < 40; i++) { const a = hsh(i, 4) * 6.28, d = hsh(i, 5) * 14; P(g, 10 + Math.cos(a) * d, 26 + Math.sin(a) * d * 0.8, hsh(i, 6) > 0.4 ? 0x55ff55 : 0x005500); }
    for (const [rx, ry] of [[W * 0.36, 62], [W * 0.92, 70]]) { ellipse(g, rx, ry, 5, 3, 0xaaaaaa); R(g, rx - 3, ry + 1, 6, 2, 0x555555); }
    for (let i = 0; i < 14; i++) P(g, 22 + hsh(i, 7) * (W * 0.3), 72 + hsh(i, 8) * 8, i % 2 ? 0xff5555 : 0xffff55);
  }), 0, 0);
  // Graham går omkring
  const px = Math.round(((lt * 7) % (W + 16)) - 8), py = 58 + Math.round(Math.sin(lt * 0.4) * 3), fr = Math.floor(lt * 5) % 2;
  R(x, px + 1, py, 3, 2, 0xaa0000); R(x, px + 3, py - 1, 2, 1, 0xffffff);
  R(x, px + 1, py + 2, 3, 2, 0xff5555);
  R(x, px, py + 4, 5, 4, 0x0000aa); R(x, px + 1, py + 4, 3, 1, 0xffff55);
  R(x, px + (fr ? 0 : 1), py + 8, 1, 3, 0xaa5500); R(x, px + (fr ? 3 : 4), py + 8, 1, 3, 0xaa5500);
  if (Math.floor(t * 3) % 4 === 0) P(x, W * 0.6 + (Math.floor(t) % 5) * 7, 47, 0xffffff);
  gfxOff(c);
  R(x, 0, 0, W, 7, 0xffffff); T(x, 'POÄNG: 12 AV 158', 2, 1, 0x000000); TR(x, 'LJUD:PÅ', W - 2, 1, 0x000000);
  R(x, 0, H - 8, W, 8, 0x000000);
  const cmd = 'TITTA PÅ SLOTTET', k = Math.floor((lt * 6) % (cmd.length + 14));
  T(x, '>' + cmd.slice(0, k), 2, H - 6, 0xffffff);
  if (blink(t, 3)) R(x, 3 + tw('>' + cmd.slice(0, k)), H - 6, 3, 5, 0xffffff);
}

// --- CAD-program med trådmodell ---
function cad(x, c) {
  const { W, H, lt, t } = c;
  const menuW = 27, vw = W - menuW, top = 8, bot = H - 15;
  R(x, 0, 0, W, H, 0x000000);
  for (let gy = top + 3; gy < bot; gy += 6) for (let gx = 3; gx < vw; gx += 6) P(x, gx, gy, 0x555555);
  // hus i trådmodell som snurrar
  const ang = lt * 0.45, ca = Math.cos(ang), sa = Math.sin(ang), s = Math.min(vw, bot - top) * 0.26, ox = vw / 2, oy = (top + bot) / 2 + s * 0.7;
  const pr = ([vx, vy, vz]) => [ox + (vx * ca - vz * sa) * s, oy - vy * s + (vx * sa + vz * ca) * s * 0.38];
  const V = [[-1, 0, -1.3], [1, 0, -1.3], [1, 0, 1.3], [-1, 0, 1.3], [-1, 1.1, -1.3], [1, 1.1, -1.3], [1, 1.1, 1.3], [-1, 1.1, 1.3], [0, 1.8, -1.3], [0, 1.8, 1.3]].map(pr);
  const E = (i, j, col) => L(x, V[i][0], V[i][1], V[j][0], V[j][1], col);
  [[0, 1], [1, 2], [2, 3], [3, 0]].forEach(([a, b]) => E(a, b, 0xffff55));
  [[0, 4], [1, 5], [2, 6], [3, 7], [4, 5], [6, 7]].forEach(([a, b]) => E(a, b, 0xffffff));
  [[4, 8], [5, 8], [7, 9], [6, 9], [8, 9], [5, 6], [4, 7]].forEach(([a, b]) => E(a, b, 0xff5555));
  const door = [[-0.25, 0, 1.3], [0.25, 0, 1.3], [0.25, 0.7, 1.3], [-0.25, 0.7, 1.3]].map(pr);
  for (let i = 0; i < 4; i++) L(x, door[i][0], door[i][1], door[(i + 1) % 4][0], door[(i + 1) % 4][1], 0x55ffff);
  const win = [[1, 0.45, -0.8], [1, 0.45, -0.2], [1, 0.85, -0.2], [1, 0.85, -0.8]].map(pr);
  for (let i = 0; i < 4; i++) L(x, win[i][0], win[i][1], win[(i + 1) % 4][0], win[(i + 1) % 4][1], 0x55ffff);
  // hårkors
  const hx = Math.round(vw * 0.5 + Math.sin(lt * 0.7) * vw * 0.3), hy = Math.round((top + bot) / 2 + Math.cos(lt * 0.9) * (bot - top) * 0.3);
  R(x, 1, hy, vw - 2, 1, 0xaaaaaa); R(x, hx, top, 1, bot - top, 0xaaaaaa);
  R(x, hx - 2, hy - 2, 5, 1, 0xffffff); R(x, hx - 2, hy + 2, 5, 1, 0xffffff); R(x, hx - 2, hy - 2, 1, 5, 0xffffff); R(x, hx + 2, hy - 2, 1, 5, 0xffffff);
  // statusrad, sidomeny, kommandorad
  R(x, 0, 0, W, 7, 0x0000aa);
  T(x, 'LAGER 0', 2, 1, 0xffffff); T(x, 'SNAP', 34, 1, 0xffff55);
  TR(x, `${((hx / vw) * 40).toFixed(1)},${(((bot - hy) / (bot - top)) * 30).toFixed(1)}`, W - 2, 1, 0xffffff);
  R(x, vw, top, 1, bot - top, 0xaaaaaa);
  const items = ['PIXCAD', '* * *', 'BLOCK', 'MÅTT', 'VISA', 'RITA', 'ÄNDRA', 'LAGER', 'SPARA'], hl = 2 + (Math.floor(lt * 0.8) % 7);
  items.forEach((it, i) => { const yy = top + 1 + i * 7; if (yy > bot - 6) return; if (i === hl) R(x, vw + 1, yy - 1, menuW - 1, 7, 0xaaaaaa); T(x, it, vw + 3, yy, i === hl ? 0x000000 : i < 2 ? 0x55ffff : 0xffffff); });
  R(x, 0, bot + 1, W, 1, 0xaaaaaa);
  T(x, 'KOMMANDO: LINJE', 2, bot + 3, 0xffffff);
  T(x, 'FRÅN PUNKT:', 2, bot + 9, 0xffffff);
  if (blink(t, 3)) R(x, 3 + tw('FRÅN PUNKT:') + 1, bot + 9, 3, 5, 0xffffff);
}

// --- Fönster 3.1: Programhanteraren ---
function win31Desk(x, c) {
  const { W, H, lt } = c;
  wallpaper(x, c);
  icon31(x, 'clock', 4, H - 11); greek(x, 2, H - 2, 14, 0x000000, 5);
  const pmW = W - 4, pmH = H - 14;
  const pm = osWindow(x, c, 2, 2, pmW, pmH, 'PROGRAMHANTERAREN', { active: false, menu: ['ARKIV', 'ALTERNATIV', 'FÖNSTER'] });
  const gwin = osWindow(x, c, pm.x + 2, pm.y + 2, Math.min(pm.w - 4, 74), 38, 'HUVUDGRUPP', { active: false });
  ['files', 'panel', 'print', 'clip', 'dos', 'setup', 'pif', 'readme'].forEach((k, i) => {
    const ix = gwin.x + 3 + (i % 4) * 17, iy = gwin.y + 2 + Math.floor(i / 4) * 13;
    if (ix + 10 < gwin.x + gwin.w && iy + 10 < gwin.y + gwin.h) { icon31(x, k, ix, iy); greek(x, ix - 1, iy + 10, 12, 0x000000, i); }
  });
  ['TILLBEHÖR', 'SPEL', 'AUTOSTART'].forEach((s, i) => {
    const ix = pm.x + 4 + i * 20, iy = pm.y + pm.h - 11;
    R(x, ix + 1, iy, 9, 7, 0x000000); R(x, ix + 2, iy + 1, 7, 1, 0x000080); R(x, ix + 2, iy + 2, 7, 4, 0xffffff);
    for (let k = 0; k < 3; k++) R(x, ix + 3 + k * 2, iy + 3, 1, 2, [0xff0000, 0x00aa00, 0x0000ff][k]);
    greek(x, ix, iy + 8, 12, 0x000000, i + 3);
  });
  if (W >= 110) {
    const sw = osWindow(x, c, W - 60, H - 47, 57, 43, 'PATIENS', { menu: ['SPEL', 'HJÄLP'] });
    R(x, sw.x, sw.y, sw.w, sw.h, 0x008000);
    R(x, sw.x + 2, sw.y + 2, 6, 8, 0xffffff); R(x, sw.x + 3, sw.y + 3, 4, 6, 0x0000aa); for (let i = 0; i < 4; i++) P(x, sw.x + 3 + (i % 2) * 2, sw.y + 4 + i, 0x5555ff);
    for (let k = 0; k < 4; k++) R(x, sw.x + 28 + k * 7, sw.y + 2, 6, 8, 0x00aa00);
    for (let k = 0; k < 6; k++) for (let j = 0; j <= Math.min(k, 3); j++) {
      const cx = sw.x + 2 + k * 9, cy = sw.y + 13 + j * 3;
      R(x, cx, cy, 7, 9, 0x000000); R(x, cx, cy, 6, 8, j === Math.min(k, 3) ? 0xffffff : 0x0000aa);
      if (j === Math.min(k, 3)) { const red = (k + j) % 2 === 0; R(x, cx + 1, cy + 1, 1, 2, red ? 0xff0000 : 0x000000); R(x, cx + 3, cy + 4, 2, 2, red ? 0xff0000 : 0x000000); }
    }
    // kortet som dras
    const f = (lt * 0.5) % 1, dx = sw.x + 2 + 5 * 9 + (sw.x + 28 - (sw.x + 47)) * f, dy = sw.y + 22 + (sw.y + 2 - (sw.y + 22)) * f;
    R(x, dx, dy, 7, 9, 0x000000); R(x, dx, dy, 6, 8, 0xffffff); R(x, dx + 2, dy + 3, 2, 2, 0xff0000);
    if (c.st.mouse) { sprite(x, ARROW, dx + 3, dy + 4); return; }
  }
  drawPointer(x, c);
}
function icon31(x, k, a, b) {
  switch (k) {
    case 'files': R(x, a, b, 9, 8, 0x808000); R(x, a + 1, b + 1, 7, 3, 0xffff00); R(x, a + 1, b + 5, 7, 2, 0xc0c0c0); R(x, a + 4, b + 2, 1, 1, 0x000000); break;
    case 'panel': R(x, a, b, 9, 6, 0x000000); R(x, a + 1, b + 1, 7, 4, 0x00ffff); R(x, a + 2, b + 6, 5, 2, 0xc0c0c0); R(x, a + 2, b + 2, 1, 2, 0xff0000); R(x, a + 5, b + 3, 1, 2, 0x0000ff); break;
    case 'print': R(x, a + 2, b, 5, 3, 0xffffff); R(x, a, b + 3, 9, 4, 0x808080); R(x, a + 1, b + 4, 7, 1, 0xc0c0c0); R(x, a + 6, b + 5, 1, 1, 0x00ff00); break;
    case 'clip': R(x, a + 1, b + 1, 7, 7, 0x804000); R(x, a + 2, b + 2, 5, 5, 0xffffff); R(x, a + 3, b, 3, 2, 0xc0c0c0); break;
    case 'dos': R(x, a, b, 9, 8, 0x000000); T(x, 'C:', a + 1, b + 2, 0xffffff); break;
    case 'setup': R(x, a, b + 2, 6, 5, 0xc0c0c0); R(x, a + 1, b + 3, 4, 3, 0x0000ff); R(x, a + 5, b, 4, 8, 0x808080); break;
    case 'pif': R(x, a + 1, b, 7, 8, 0xffffff); R(x, a + 1, b, 7, 2, 0x0000aa); R(x, a + 2, b + 3, 5, 1, 0x000000); R(x, a + 2, b + 5, 3, 1, 0x000000); break;
    case 'readme': R(x, a + 1, b, 7, 8, 0xffffc0); for (let i = 0; i < 3; i++) R(x, a + 2, b + 2 + i * 2, 5, 1, 0x000080); break;
    case 'clock': disc(x, a + 4, b + 4, 4, 0x000000); disc(x, a + 4, b + 4, 3, 0xffffff); R(x, a + 4, b + 2, 1, 3, 0x000000); R(x, a + 4, b + 4, 2, 1, 0x000000); break;
  }
}

// --- DOOM-liknande (DOS) ---
function doom(x, c) {
  const { W, H, lt, t } = c;
  const vh = H - 15;
  x.drawImage(layer('doom', W, vh, (g) => {
    vgrad(g, 0, 0, W, vh / 2, 0x201c18, 0x4a4238, 5);
    vgrad(g, 0, vh / 2, W, vh - vh / 2, 0x3a2c1c, 0x6a5234, 6);
    for (let i = 0; i < 60; i++) P(g, hsh(i, 1) * W, vh / 2 + hsh(i, 2) * vh / 2, 0x2a2014);
    const xl = Math.round(W * 0.34), xr = Math.round(W * 0.66), fh = Math.round(vh * 0.36), fy = Math.round(vh / 2 - fh * 0.55);
    for (let i = 0; i < xl; i++) {
      const f = i / xl, top = Math.round(f * fy), bot = Math.round(vh - f * (vh - fy - fh));
      const seam = Math.floor(Math.pow(f, 0.6) * 9) !== Math.floor(Math.pow((i + 1) / xl, 0.6) * 9);
      const colr = shade(0x7a7a6a, 0.55 + f * 0.25);
      R(g, i, top, 1, bot - top, seam ? shade(colr, 0.6) : colr);
      R(g, i, top + Math.round((bot - top) * 0.35), 1, 1, shade(colr, 0.7));
      if (Math.floor(Math.pow(f, 0.6) * 9) % 3 === 1) R(g, i, top + Math.round((bot - top) * 0.2), 1, 2, 0x9ab0c0);
      R(g, W - 1 - i, top, 1, bot - top, seam ? shade(0x6a5a3a, 0.5 + f * 0.2) : shade(0x8a6a44, 0.5 + f * 0.25));
      if (Math.floor(Math.pow(f, 0.6) * 9) % 2 === 0) R(g, W - 1 - i, top + Math.round((bot - top) * 0.5), 1, 1, 0x3a2a18);
    }
    R(g, xl, fy, xr - xl, fh, 0x5a4a38);
    for (let yy = fy; yy < fy + fh; yy += 3) R(g, xl, yy, xr - xl, 1, 0x4a3a2a);
    for (let yy = fy; yy < fy + fh; yy += 6) for (let i = xl + (yy % 12 ? 0 : 3); i < xr; i += 6) R(g, i, yy, 1, 3, 0x3a2a1a);
    const dw = Math.round((xr - xl) * 0.4), dx = Math.round(W / 2 - dw / 2);
    R(g, dx, fy + 3, dw, fh - 3, 0x6a6a64); for (let i = 1; i < dw; i += 3) R(g, dx + i, fy + 3, 1, fh - 3, 0x5a5a54);
    R(g, dx - 1, fy + 3, 1, fh - 3, 0xc8a030); R(g, dx + dw, fy + 3, 1, fh - 3, 0xc8a030);
    R(g, dx + 2, fy + 5, dw - 4, 2, 0xd02020);
  }), 0, 0);
  // imp i korridoren
  const ix = Math.round(W / 2 + Math.sin(lt * 0.8) * 10), iy = Math.round(vh * 0.42), bob = Math.floor(lt * 4) % 2;
  R(x, ix - 3, iy + bob, 7, 8, 0x8a5a3a); R(x, ix - 2, iy - 3 + bob, 5, 3, 0x7a4a2a);
  P(x, ix - 1, iy - 2 + bob, 0xff3020); P(x, ix + 1, iy - 2 + bob, 0xff3020);
  P(x, ix - 3, iy - 4 + bob, 0xe8e0c8); P(x, ix + 3, iy - 4 + bob, 0xe8e0c8);
  R(x, ix - 5, iy + 2 + bob, 2, 4, 0x8a5a3a); R(x, ix + 4, iy + 2 + bob, 2, 4, 0x8a5a3a);
  R(x, ix - 3, iy + 8, 2, 4, 0x6a4020); R(x, ix + 2, iy + 8, 2, 4, 0x6a4020);
  const fb = (lt * 0.7) % 1;
  if (fb > 0.3) { const k = (fb - 0.3) / 0.7, fx = ix + (W * 0.45 - ix) * k * 0.3, fy = iy + 2 + k * 30, r = 1 + k * 4; disc(x, fx, fy, r, 0xff8020); disc(x, fx, fy, r * 0.5, 0xfff080); }
  // pistol och mynningsflamma
  const shoot = (lt * 1.6) % 1 < 0.12, sway = Math.round(Math.sin(lt * 3) * 2);
  const gx = Math.round(W / 2 + sway), gy = vh - 16 + Math.abs(sway);
  if (shoot) { disc(x, gx, gy - 3, 5, 0xffd040); disc(x, gx, gy - 3, 2, 0xffffff); }
  R(x, gx - 3, gy, 6, 16, 0x5a5a5a); R(x, gx - 2, gy, 1, 16, 0x8a8a8a); R(x, gx - 2, gy - 1, 4, 2, 0x3a3a3a);
  R(x, gx - 6, gy + 8, 12, 8, 0xc88850); R(x, gx - 7, gy + 10, 3, 6, 0xa86838); R(x, gx + 4, gy + 9, 3, 7, 0xa86838);
  // statusfält
  const sy = vh;
  R(x, 0, sy, W, H - sy, 0x5a5448); R(x, 0, sy, W, 1, 0x8a8478);
  const seg = [0, 20, 51, 64, 78, 100, 120].map((v) => Math.round((v * W) / 120));
  seg.slice(1, -1).forEach((sx) => { R(x, sx, sy + 1, 1, H - sy - 1, 0x2a2620); R(x, sx + 1, sy + 1, 1, H - sy - 1, 0x8a8478); });
  const big = (s, cx) => { TC(x, s, cx + 1, sy + 3, 0x3a0a0a, 2); TC(x, s, cx, sy + 2, 0xd82818, 2); };
  big('50', (seg[0] + seg[1]) / 2); TC(x, 'AMMO', (seg[0] + seg[1]) / 2, sy + 12, 0xc8c0b0);
  big('100', (seg[1] + seg[2]) / 2 - 3); T(x, '%', seg[2] - 6, sy + 6, 0xd82818); TC(x, 'HÄLSA', (seg[1] + seg[2]) / 2, sy + 12, 0xc8c0b0);
  for (let i = 0; i < 6; i++) T(x, String(i + 2), seg[2] + 2 + (i % 3) * 5, sy + 2 + Math.floor(i / 3) * 6, i < 2 ? 0xf0e040 : 0x6a6458);
  const fx0 = Math.round((seg[3] + seg[4]) / 2) - 5, look = Math.floor(lt * 0.7) % 3;
  R(x, fx0 - 1, sy + 1, 12, H - sy - 1, 0x2a2620);
  R(x, fx0 + 1, sy + 3, 8, 10, 0xc89060); R(x, fx0 + 1, sy + 2, 8, 3, 0x6a4a28);
  R(x, fx0 + 2 + (look === 0 ? 0 : look === 1 ? 1 : 0), sy + 6, 2, 1, 0x000000); R(x, fx0 + 5 + (look === 2 ? 1 : 0), sy + 6, 2, 1, 0x000000);
  R(x, fx0 + 3, sy + 10, 4, 1, 0x7a3a20);
  big('0', (seg[4] + seg[5]) / 2 - 3); T(x, '%', seg[5] - 6, sy + 6, 0xd82818); TC(x, 'RUSTN', (seg[4] + seg[5]) / 2, sy + 12, 0xc8c0b0);
  for (let k = 0; k < 3; k++) R(x, seg[5] + 3, sy + 2 + k * 4, 3, 3, k === 1 ? 0xd8c020 : 0x3a3630);
  T(x, '50', seg[5] + 8, sy + 3, 0xf0e040);
}

// --- Myst-liknande ö (multimedia) ---
function myst(x, c) {
  const { W, H, lt, t } = c;
  R(x, 0, 0, W, H, 0x000000);
  const vx = 6, vy = 10, vw = W - 12, vh = H - 24;
  x.drawImage(layer('myst', vw, vh, (g) => {
    vgrad(g, 0, 0, vw, vh * 0.55, 0x5a7ab0, 0xe8d0a8);
    for (const [cx, cy, rx] of [[0.25, 0.18, 12], [0.7, 0.12, 16], [0.5, 0.3, 9]]) { g.globalAlpha = 0.5; ellipse(g, cx * vw, cy * vh, rx, 2, 0xf8e8d0); g.globalAlpha = 1; }
    vgrad(g, 0, vh * 0.55, vw, vh * 0.45, 0x3a6a88, 0x1a3a50);
    for (let i = 0; i < 40; i++) R(g, hsh(i, 1) * vw, vh * 0.56 + hsh(i, 2) * vh * 0.4, 3 + hsh(i, 3) * 6, 1, 0x6a9ab8);
    for (let i = 0; i < vw; i++) {
      const top = vh * 0.5 - Math.max(0, Math.sin((i / vw) * Math.PI) * 14 + Math.sin(i * 0.2) * 2 - 3);
      vgrad(g, i, top, 1, vh * 0.62 - top, 0x5a6a3a, 0x3a3a2a, 4);
    }
    const tx = Math.round(vw * 0.62);
    R(g, tx, vh * 0.12, 3, vh * 0.4, 0x9a9488); R(g, tx + 2, vh * 0.12, 1, vh * 0.4, 0x6a665e);
    R(g, tx - 2, vh * 0.1, 7, 3, 0xb8b0a0); R(g, tx - 1, vh * 0.06, 5, 2, 0x8a3a2a);
    R(g, vw * 0.28, vh * 0.34, 16, 10, 0x9a8a70); R(g, vw * 0.28, vh * 0.34, 16, 1, 0xc8b898);
    for (let i = 0; i < 3; i++) R(g, vw * 0.28 + 3 + i * 5, vh * 0.34 + 3, 2, 5, 0x3a3228);
    ellipse(g, vw * 0.28 + 8, vh * 0.34, 7, 3, 0xa8b8b8); R(g, vw * 0.28 + 1, vh * 0.34, 15, 1, 0x9a8a70);
    for (let i = 0; i < 12; i++) { const px = vw * 0.12 + Math.floor(i / 2) * 1; R(g, px + 5 - i * 0.45, vh * 0.3 + i * 1.7, i * 0.9 + 1, 2, 0x1a3a22); }
    R(g, vw * 0.12 + 5, vh * 0.5, 1, 4, 0x3a2a1a);
    for (let r = 0; r < vh * 0.36; r++) {
      const f = r / (vh * 0.36), w = 6 + f * vw * 0.5, cx = vw * 0.45 + f * 6;
      R(g, cx - w / 2, vh * 0.64 + r, w, 1, (Math.floor(Math.pow(f, 0.6) * 12) % 2) ? 0x7a5a38 : 0x8a6a44);
    }
    R(g, vw * 0.72, vh * 0.7, 5, vh * 0.3, 0x8a8478); R(g, vw * 0.72 - 1, vh * 0.68, 7, 3, 0xa8a090); R(g, vw * 0.72 + 1, vh * 0.66, 3, 2, 0xc8b060);
  }), vx, vy);
  if (blink(t, 0.7)) P(x, vx + vw * 0.2 + (Math.floor(t) % 7) * 6, vy + vh * 0.7, 0xb8d8e8);
  if (c.st.mouse) { const [mx, my] = pointerPos(W, H, c.t); sprite(x, HAND, Math.max(vx, Math.min(vx + vw - 8, mx)), Math.max(vy, Math.min(vy + vh - 9, my)), 0x000000, 0xffffff); }
}

// --- Fönster 95/98 ---
function startMenu(x, c) {
  const { H, os, lt } = c, w = 52, h = 60, a = 1, b = H - TASKBAR_H - h;
  bevel(x, a, b, w, h, 0xc0c0c0);
  if (os === 'win98') vgrad(x, a + 2, b + 2, 8, h - 4, 0x0000a0, 0x000040); else R(x, a + 2, b + 2, 8, h - 4, 0x808080);
  x.save(); x.translate(a + 4, b + h - 4); x.rotate(-Math.PI / 2);
  T(x, 'FÖNSTER', 0, 0, os === 'win98' ? 0xc0c0ff : 0xc0c0c0); T(x, os === 'win98' ? '98' : '95', tw('FÖNSTER') + 2, 0, 0xffffff);
  x.restore();
  const items = [['PROGRAM', 1, 0x008080], ['DOKUMENT', 1, 0xf0c848], ['INSTÄLLN.', 1, 0x808080], ['SÖK', 1, 0x3060d0], ['HJÄLP', 0, 0xe0e030], ['KÖR...', 0, 0x404040], null, ['STÄNG AV', 0, 0xd02020]];
  const hl = Math.floor(lt * 1.6) % 6;
  let y = b + 3;
  items.forEach((it, i) => {
    if (!it) { R(x, a + 12, y + 1, w - 14, 1, 0x808080); R(x, a + 12, y + 2, w - 14, 1, 0xffffff); y += 4; return; }
    if (i === hl) R(x, a + 11, y, w - 13, 7, 0x000080);
    R(x, a + 12, y + 1, 5, 5, it[2]);
    T(x, it[0], a + 19, y + 1, i === hl ? 0xffffff : 0x000000);
    if (it[1]) T(x, '▶', a + w - 6, y + 1, i === hl ? 0xffffff : 0x000000);
    y += 7;
  });
  return [a + 30, b + 4 + hl * 7];
}
function win95Desk(x, c) {
  const { W, H, lt } = c;
  wallpaper(x, c);
  desktopIcons(x, c, [['pc', 'DATORN'], ['net', 'NÄTVERK'], ['bin', 'PAPPERSKORG']]);
  const win = osWindow(x, c, 26, 5, W - 29, H - 20, 'DEN HÄR DATORN', { iconCol: 0x008080 });
  const drives = [['A:', 'floppy'], ['C:', 'hdd'], ['D:', 'cd'], ['', 'panel'], ['', 'printers']];
  drives.forEach(([lbl, k], i) => {
    const ix = win.x + 3 + (i % 4) * 21, iy = win.y + 2 + Math.floor(i / 4) * 17;
    if (iy + 14 > win.y + win.h) return;
    driveIcon(x, k, ix + 3, iy);
    if (lbl) TC(x, lbl, ix + 8, iy + 10, 0x000000); else greek(x, ix + 1, iy + 11, 14, 0x000000, i);
  });
  R(x, win.x, win.y + win.h - 6, win.w, 6, 0xc0c0c0); T(x, '5 OBJEKT', win.x + 2, win.y + win.h - 6, 0x000000);
  const open = lt % 9 > 5.5;
  taskbar(x, c, { task: 'DATORN', startOpen: open });
  if (open) { const p = startMenu(x, c); if (c.st.mouse) sprite(x, ARROW, p[0], p[1]); return; }
  drawPointer(x, c);
}
function driveIcon(x, k, a, b) {
  switch (k) {
    case 'floppy': R(x, a, b + 3, 10, 5, 0xc0c0c0); R(x, a, b + 7, 10, 1, 0x404040); R(x, a + 2, b + 5, 6, 1, 0x000000); break;
    case 'hdd': R(x, a, b + 3, 10, 5, 0xc0c0c0); R(x, a, b + 7, 10, 1, 0x404040); R(x, a + 7, b + 5, 2, 1, 0x00ff00); break;
    case 'cd': R(x, a, b + 4, 10, 4, 0xc0c0c0); disc(x, a + 5, b + 2, 3, 0xe0e0f0); P(x, a + 5, b + 2, 0x808080); R(x, a + 6, b + 1, 2, 1, 0xf0a0f0); break;
    case 'panel': icon(x, 'folder', a, b); R(x, a + 3, b + 3, 4, 3, 0x0000ff); break;
    case 'printers': icon(x, 'folder', a, b); R(x, a + 3, b + 3, 5, 3, 0x808080); break;
  }
}

// --- Quake-liknande (brun 3D-bana, med 3D-kort mjukare ljus) ---
function quake(x, c) {
  const { W, H, lt, t, year } = c;
  const vh = H - 14, gl = year >= 1998;
  x.drawImage(layer('quake' + (gl ? 'gl' : ''), W, vh, (g) => {
    vgrad(g, 0, 0, W, vh / 2, 0x140e0a, 0x3a2a1c, gl ? 0 : 4);
    vgrad(g, 0, vh / 2, W, vh - vh / 2, 0x2a1e12, 0x5a4028, gl ? 0 : 5);
    for (let i = -7; i <= 7; i++) L(g, W / 2 + i * 3, vh / 2 + 3, W / 2 + i * 24, vh, 0x1e140c);
    for (let r = 1; r < 6; r++) R(g, 0, Math.round(vh / 2 + 3 + Math.pow(r / 6, 2) * (vh / 2)), W, 1, 0x1e140c);
    const xl = Math.round(W * 0.3), xr = W - xl, ft = Math.round(vh * 0.26), fb = Math.round(vh * 0.74);
    for (let i = 0; i < xl; i++) {
      const f = i / xl, top = Math.round(f * ft), bot = Math.round(vh - f * (vh - fb));
      const seam = Math.floor(Math.pow(f, 0.7) * 6) !== Math.floor(Math.pow((i + 1) / xl, 0.7) * 6);
      const lit = gl ? 0.45 + 0.5 * Math.exp(-Math.pow((f - 0.75) * 4, 2)) : 0.55 + f * 0.25;
      R(g, i, top, 1, bot - top, seam ? 0x1a100a : shade(0x6a4a2c, lit));
      R(g, i, top + Math.round((bot - top) * 0.62), 1, 2, shade(0x3a3a38, lit));
      R(g, xr + xl - 1 - i, top, 1, bot - top, seam ? 0x1a100a : shade(0x4a4a44, lit * 0.95));
      if (i % 4 === 0) R(g, xr + xl - 1 - i, top + Math.round((bot - top) * 0.3), 1, 1, 0x7a7a70);
    }
    R(g, xl, ft, xr - xl, fb - ft, 0x3a2c1e);
    for (let yy = ft; yy < fb; yy += 4) { R(g, xl, yy, xr - xl, 1, 0x241a10); for (let i = xl + (yy % 8 ? 0 : 4); i < xr; i += 8) R(g, i, yy, 1, 4, 0x241a10); }
    const aw = Math.round((xr - xl) * 0.44), ax = Math.round(W / 2 - aw / 2), ah = Math.round((fb - ft) * 0.72);
    R(g, ax - 2, fb - ah - 2, aw + 4, ah + 2, 0x5a5048);
    R(g, ax, fb - ah, aw, ah, 0x0c0806);
    for (let i = 0; i < aw; i += 2) R(g, ax + i, fb - ah - 4, 1, 2, 0x8a6a30);
  }), 0, 0);
  const xl = Math.round(W * 0.3), xr = W - xl, ft = Math.round(vh * 0.26);
  // facklor
  for (const fx of [xl - 3, xr + 2]) {
    R(x, fx, ft + 14, 2, 5, 0x3a2a18);
    const fl = Math.floor(t * 10) % 3;
    R(x, fx - 1, ft + 9 + fl % 2, 4, 5 - fl % 2, 0xe86a10); R(x, fx, ft + 10, 2, 3, 0xffd040);
    if (gl) { x.save(); x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.18; disc(x, fx + 1, ft + 12, 8, 0xc86010); x.restore(); x.globalAlpha = 1; }
  }
  // riddare i porten
  const kx = Math.round(W / 2 + Math.sin(lt * 0.6) * 4), ky = Math.round(vh * 0.52);
  R(x, kx - 3, ky, 6, 11, 0x3a3a34); R(x, kx - 2, ky - 4, 4, 4, 0x4a4a40); P(x, kx - 1, ky - 3, 0xff4020); P(x, kx + 1, ky - 3, 0xff4020);
  R(x, kx + 3, ky + 1 + (Math.floor(lt * 3) % 2), 1, 8, 0xb8b8b0);
  // spikpistol
  const sway = Math.round(Math.sin(lt * 2.4) * 2), shoot = (lt * 2) % 1 < 0.1;
  const gx = Math.round(W / 2 + 6 + sway), gy = vh - 14 + Math.abs(sway);
  R(x, gx - 5, gy + 2, 14, 12, 0x4a4238); R(x, gx - 4, gy, 3, 14, 0x6a6258); R(x, gx + 3, gy, 3, 14, 0x6a6258); R(x, gx - 3, gy - 1, 1, 3, 0x2a2622); R(x, gx + 4, gy - 1, 1, 3, 0x2a2622);
  if (shoot) { R(x, gx - 4, gy - 4, 2, 3, 0xffe080); R(x, gx + 4, gy - 4, 2, 3, 0xffe080); }
  // HUD
  const sy = vh;
  R(x, 0, sy, W, H - sy, 0x3a2a1a); R(x, 0, sy, W, 1, 0x6a5238);
  for (let i = 0; i < W; i += 7) R(x, i, sy + 1, 1, H - sy - 1, 0x2e2014);
  const num = (s, a) => { T(x, s, a + 1, sy + 3, 0x1a1008, 2); T(x, s, a, sy + 2, 0xd89a38, 2); };
  R(x, 2, sy + 3, 6, 8, 0x2a8a3a); R(x, 3, sy + 4, 4, 3, 0x4aba5a);
  num('100', 10);
  const fx = Math.round(W / 2 - 6);
  R(x, fx, sy + 2, 9, 10, 0xb08058); R(x, fx, sy + 2, 9, 2, 0x5a3a20); P(x, fx + 2, sy + 6, 0); P(x, fx + 6, sy + 6, 0); R(x, fx + 3, sy + 9, 3, 1, 0x6a2a18);
  num('100', fx + 11);
  R(x, W - 30, sy + 3, 5, 8, 0x8a8a80); R(x, W - 29, sy + 4, 3, 1, 0xd8d8c8);
  num('87', W - 22);
}

// --- Uppringt internet: webbläsare i 90-talsstil ---
function internet(x, c) {
  const { W, H, lt, t, os } = c;
  wallpaper(x, c);
  if (os !== 'xp') desktopIcons(x, c, [['pc', 'DATORN'], ['globe', 'INTERNET']]);
  const dial = lt % 22 < 3.2;
  const win = osWindow(x, c, os === 'xp' ? 2 : 26, 2, os === 'xp' ? W - 4 : W - 28, H - 13, 'PIXELSURF - WWW.PIXEL.SE', { menu: ['ARKIV', 'REDIGERA', 'VISA', 'GÅ'] });
  const cx = win.x, cw = win.w;
  // verktygsrad
  R(x, cx, win.y, cw, 9, os === 'xp' ? 0xece9d8 : 0xc0c0c0);
  [['←', 0x2a8a2a], ['→', 0x808080], ['X', 0xc02020], ['↑', 0x2a60c8]].forEach(([s, col2], i) => { bevel(x, cx + 1 + i * 9, win.y + 1, 8, 7, os === 'xp' ? 0xf4f2e8 : 0xc0c0c0, false, false); TC(x, s, cx + 5 + i * 9, win.y + 2, col2); });
  bevel(x, cx + cw - 11, win.y + 1, 10, 8, 0x000000, true, false);
  const spin = Math.floor(t * 8) % 4;
  if (!dial) { disc(x, cx + cw - 6, win.y + 5, 3, 0x2c78d8); R(x, cx + cw - 8 + spin, win.y + 3, 2, 3, 0x45b964); }
  R(x, cx, win.y + 9, cw, 7, os === 'xp' ? 0xece9d8 : 0xc0c0c0);
  T(x, 'ADRESS', cx + 1, win.y + 10, 0x000000);
  R(x, cx + 26, win.y + 9, cw - 28, 7, 0xffffff); T(x, 'HTTP://WWW.PIXEL.SE/'.slice(0, Math.floor((cw - 30) / 4)), cx + 28, win.y + 10, 0x000000);
  const py = win.y + 17, ph = win.h - 17 - 6;
  const loaded = dial ? 0 : Math.min(1, (lt % 22 - 3.2) / 5);
  // sidan: rutig bakgrund, rubrik, "under uppbyggnad", räknare
  R(x, cx, py, cw, ph, 0xfff8dc);
  for (let yy = py; yy < py + ph; yy += 6) for (let xx = cx + ((yy - py) % 12 ? 3 : 0); xx < cx + cw; xx += 6) P(x, xx, yy, 0xf0d8a0);
  const reveal = py + Math.round(ph * loaded);
  x.save(); x.beginPath(); x.rect(cx, py, cw, reveal - py); x.clip();
  TC(x, 'VÄLKOMMEN TILL', cx + cw / 2, py + 3, 0xc02020);
  TC(x, 'MIN HEMSIDA!', cx + cw / 2, py + 10, 0x1a3ac8, 1);
  for (let i = 0; i < cw - 8; i++) R(x, cx + 4 + i, py + 17, 1, 1, rainbow(0, i * 0.3));
  if (blink(t, 2)) { R(x, cx + 4, py + 21, 13, 7, 0xff2020); T(x, 'NY!', cx + 5, py + 22, 0xffff00); }
  for (let i = 0; i < 3; i++) { T(x, ['LÄNKAR', 'GÄSTBOK', 'OM MIG'][i], cx + 22, py + 21 + i * 7, 0x0000ee); R(x, cx + 22, py + 26 + i * 7, tw(['LÄNKAR', 'GÄSTBOK', 'OM MIG'][i]), 1, 0x0000ee); }
  const sx = cx + cw - 30, syy = py + 21;
  for (let i = 0; i < 26; i++) R(x, sx + i, syy, 1, 8, Math.floor((i + (syy % 2)) / 3) % 2 ? 0xf0d020 : 0x101010);
  R(x, sx, syy + 9, 26, 7, 0xffffff); T(x, 'BYGGS', sx + 3, syy + 10, 0x000000);
  R(x, cx + 4, py + ph - 9, 34, 7, 0x000000); T(x, 'BESÖK', cx + 5, py + ph - 8, 0xa0a0a0); T(x, '004711', cx + 26 - 12, py + ph - 8, 0x30ff30);
  const at = Math.floor(t * 6) % 4; T(x, '@', cx + cw - 10, py + ph - 9 + (at === 1 ? -1 : at === 3 ? 1 : 0), 0x3060ff);
  x.restore();
  // statusrad
  R(x, cx, win.y + win.h - 6, cw, 6, os === 'xp' ? 0xece9d8 : 0xc0c0c0);
  if (dial) T(x, 'RINGER UPP...', cx + 1, win.y + win.h - 6, 0x000000);
  else if (loaded < 1) { T(x, 'HÄMTAR', cx + 1, win.y + win.h - 6, 0x000000); R(x, cx + 28, win.y + win.h - 5, Math.round(30 * loaded), 4, 0x000080); }
  else T(x, 'KLAR', cx + 1, win.y + win.h - 6, 0x000000);
  taskbar(x, c, { task: 'PIXELSURF', taskIcon: 'globe' });
  // modemikon som blinkar i facket
  R(x, W - 34, H - 7, 3, 3, blink(t, 5) ? 0x30ff30 : 0x0a4a0a); R(x, W - 30, H - 5, 3, 3, blink(t + 0.1, 7) ? 0x30ff30 : 0x0a4a0a);
  if (dial) {
    const dw = Math.min(80, W - 16), dx = Math.round(W / 2 - dw / 2), dy = 22;
    const d = osWindow(x, c, dx, dy, dw, 46, 'ANSLUTER', { menu: false, iconCol: 0x2c78d8 });
    R(x, d.x, d.y, d.w, d.h, os === 'xp' ? 0xece9d8 : 0xc0c0c0);
    R(x, d.x + 3, d.y + 3, 6, 5, 0x808080); R(x, d.x + 4, d.y + 4, 4, 3, 0x00a0a0);
    R(x, d.x + 14, d.y + 5, 6, 5, 0x808080); R(x, d.x + 15, d.y + 6, 4, 3, 0x00a0a0);
    const dots = Math.floor(lt * 4) % 4; for (let i = 0; i < dots; i++) P(x, d.x + 10 + i, d.y + 7, 0x000000);
    T(x, 'RINGER UPP', d.x + 23, d.y + 3, 0x000000);
    T(x, lt % 22 > 1.8 ? '56000 BPS' : 'PIIIP-KRSCH', d.x + 23, d.y + 10, 0x000000);
    bevel(x, d.x + d.w / 2 - 12, d.y + d.h - 9, 24, 7, os === 'xp' ? 0xf4f2e8 : 0xc0c0c0, false, false); TC(x, 'AVBRYT', d.x + d.w / 2, d.y + d.h - 8, 0x000000);
  }
  drawPointer(x, c);
}

// --- Counter-Strike-liknande ---
function cs(x, c) {
  const { W, H, lt, t } = c;
  x.drawImage(layer('cs', W, H, (g) => {
    vgrad(g, 0, 0, W, H * 0.42, 0x5a90d0, 0xc8dcec);
    R(g, 0, H * 0.62, W, H * 0.38, 0xb89868);
    for (let r = 0; r < 6; r++) R(g, 0, Math.round(H * 0.62 + Math.pow(r / 6, 1.6) * H * 0.38), W, 1, 0xa08050);
    for (let i = -8; i <= 8; i++) L(g, W / 2 + i * 4, H * 0.62, W / 2 + i * 22, H, 0xa88858);
    const wall = (a, b, w, h, col2) => { R(g, a, b, w, h, col2); for (let yy = b + 3; yy < b + h; yy += 4) { R(g, a, yy, w, 1, shade(col2, 0.85)); for (let xx = a + ((yy - b) % 8 < 4 ? 2 : 6); xx < a + w; xx += 8) R(g, xx, yy - 3, 1, 3, shade(col2, 0.88)); } };
    wall(0, H * 0.22, W * 0.3, H * 0.4, 0xd0b080);
    wall(W * 0.7, H * 0.18, W * 0.3, H * 0.44, 0xc8a878);
    wall(W * 0.3, H * 0.3, W * 0.4, H * 0.32, 0xc09a68);
    const ax = Math.round(W * 0.42), aw = Math.round(W * 0.16), ay = Math.round(H * 0.4);
    R(g, ax, ay, aw, H * 0.62 - ay, 0x2a2018); ellipse(g, ax + aw / 2, ay, aw / 2, 4, 0x2a2018);
    R(g, W * 0.73, H * 0.24, 6, 7, 0x3a3020); R(g, W * 0.86, H * 0.24, 6, 7, 0x3a3020);
    const crate = (a, b, s) => { R(g, a, b, s, s, 0x9a6a38); R(g, a, b, s, 1, 0xc08a50); R(g, a, b, 1, s, 0xb07a44); R(g, a + s - 1, b, 1, s, 0x6a4420); R(g, a, b + s - 1, s, 1, 0x6a4420); L(g, a + 1, b + 1, a + s - 2, b + s - 2, 0x7a5028); L(g, a + s - 2, b + 1, a + 1, b + s - 2, 0x7a5028); };
    crate(4, H * 0.62 - 16, 16); crate(20, H * 0.62 - 12, 12); crate(8, H * 0.62 - 28, 12);
    crate(W * 0.74, H * 0.62 - 10, 10);
  }), 0, 0);
  // motståndare i valvet
  if ((lt % 5) < 3.5) { const ex = Math.round(W * 0.47 + Math.sin(lt * 1.3) * 3), ey = Math.round(H * 0.45); R(x, ex, ey + 4, 5, 9, 0x3a3a2a); R(x, ex + 1, ey, 3, 4, 0x1a1a1a); P(x, ex + 2, ey + 1, 0xd8b890); R(x, ex + 5, ey + 6, 4, 1, 0x1a1a1a); }
  // gevär
  const sway = Math.round(Math.sin(lt * 2) * 1.5), kick = (lt * 2.5) % 1 < 0.1 ? 2 : 0;
  const gx = W - 44 + sway, gy = H - 22 + kick;
  x.fillStyle = css(col(0x2a2a2a)); x.beginPath(); x.moveTo(gx + 10, gy + 4); x.lineTo(gx + 44, gy + 16); x.lineTo(gx + 44, gy + 24); x.lineTo(gx + 6, gy + 8); x.fill();
  x.fillStyle = css(col(0x8a4a20)); x.beginPath(); x.moveTo(gx + 16, gy + 8); x.lineTo(gx + 30, gy + 14); x.lineTo(gx + 29, gy + 17); x.lineTo(gx + 15, gy + 11); x.fill();
  R(x, gx + 26, gy + 16, 4, 8, 0x1a1a1a); R(x, gx + 5, gy + 5, 5, 2, 0x3a3a3a);
  if (kick) { disc(x, gx + 6, gy + 5, 3, 0xffd060); P(x, gx + 6, gy + 5, 0xffffff); }
  // hårkors
  const gap = 2 + kick * 2, cxh = Math.round(W / 2), cyh = Math.round(H / 2);
  R(x, cxh - gap - 4, cyh, 4, 1, 0x40ff40); R(x, cxh + gap + 1, cyh, 4, 1, 0x40ff40); R(x, cxh, cyh - gap - 4, 1, 4, 0x40ff40); R(x, cxh, cyh + gap + 1, 1, 4, 0x40ff40);
  // HUD
  const hud = 0xffb030;
  x.globalAlpha = 0.35; R(x, 0, H - 11, W, 11, 0x000000); R(x, W - 32, H - 19, 32, 8, 0x000000); R(x, W - 50, 1, 50, 8, 0x000000);
  x.globalAlpha = 0.9;
  R(x, 3, H - 7, 5, 1, hud); R(x, 5, H - 9, 1, 5, hud); T(x, '100', 10, H - 9, hud, 1);
  R(x, 26, H - 9, 5, 4, hud); R(x, 27, H - 5, 3, 1, hud); T(x, '100', 33, H - 9, hud);
  TC(x, `${1 + Math.floor((95 - (lt % 95)) / 60)}:${String(Math.floor((95 - (lt % 95)) % 60)).padStart(2, '0')}`, W / 2, H - 9, hud);
  TR(x, '$ 3400', W - 3, H - 17, hud);
  TR(x, `${30 - (Math.floor(lt * 2.5) % 30)} | 90`, W - 3, H - 9, hud);
  x.globalAlpha = 0.5; disc(x, 12, 12, 10, 0x1a1a1a); x.globalAlpha = 1;
  R(x, 12, 12, 1, 1, 0xffffff); P(x, 8, 9, 0x40a0ff); P(x, 15, 16, 0x40a0ff); if (blink(t, 2)) P(x, 17, 7, 0xff4040);
  TR(x, 'BERTIL', W - 30, 3, 0x40a0ff); R(x, W - 28, 4, 6, 2, 0xffffff); T(x, 'OLLE', W - 20, 3, 0xff6040);
}

// --- Kontorsdator 2000-tal: ordbehandlare ---
function kontor2000(x, c) {
  const { W, H, lt, t, os } = c;
  wallpaper(x, c);
  if (os === 'xp') { icon(x, 'bin', W - 14, H - 25); }
  const ribbon = os === 'vista' || os === 'win7';
  const win = osWindow(x, c, 4, 3, W - 8, H - 14, 'BREV.DOC - PIXELORD', { menu: ribbon ? false : ['ARKIV', 'REDIGERA', 'VISA', 'INFOGA'] });
  const bar = ribbon ? 0xdfe9f5 : os === 'xp' ? 0xece9d8 : 0xc0c0c0;
  let y = win.y;
  if (ribbon) {
    R(x, win.x, y, win.w, 6, 0xd5e3f3); ['START', 'INFOGA', 'SIDLAYOUT'].forEach((s, i) => { if (i === 0) R(x, win.x + 2, y, tw(s) + 4, 6, bar); T(x, s, win.x + 4 + [0, 26, 54][i], y + 1, 0x15428b); });
    y += 6; R(x, win.x, y, win.w, 14, bar);
    R(x, win.x + 2, y + 2, 9, 10, 0xfff4c8); R(x, win.x + 3, y + 3, 7, 5, 0xe8c040);
    for (let i = 0; i < 6; i++) T(x, ['F', 'K', 'U', 'A', 'B', 'C'][i], win.x + 16 + i * 6, y + 2, [0x000000, 0x000000, 0x000000, 0xd02020, 0x1060c0, 0x208020][i]);
    R(x, win.x + 16, y + 9, 30, 3, 0xffffff);
    for (let i = 0; i < 3; i++) { R(x, win.x + 54 + i * 14, y + 2, 12, 9, 0xffffff); R(x, win.x + 55 + i * 14, y + 4, 8, 1, [0x1a3a8a, 0x3a3a3a, 0x7a7a7a][i]); }
    y += 14;
  } else {
    R(x, win.x, y, win.w, 8, bar);
    const tools = [[0xffffff, 0x808080], [0xf0c848, 0xb08820], [0x3060c0, 0x203080], [0xffffff, 0x404040], [0x404040, 0x000000]];
    tools.forEach(([a, b], i) => { R(x, win.x + 2 + i * 7, y + 1, 6, 6, b); R(x, win.x + 3 + i * 7, y + 2, 4, 4, a); });
    R(x, win.x + 40, y + 1, 30, 6, 0xffffff); T(x, 'TIMES', win.x + 41, y + 2, 0x000000);
    ['F', 'K', 'U'].forEach((s, i) => T(x, s, win.x + 74 + i * 6, y + 2, 0x000000));
    y += 8;
  }
  R(x, win.x, y, win.w, 3, 0xffffff); for (let i = 4; i < win.w; i += 4) R(x, win.x + i, y + (i % 16 === 0 ? 0 : 1), 1, i % 16 === 0 ? 3 : 2, 0x808080);
  y += 3;
  const area = { x: win.x, y, w: win.w, h: win.y + win.h - y - 6 };
  R(x, area.x, area.y, area.w, area.h, ribbon ? 0x9fb4cc : 0x808080);
  const pw = Math.min(area.w - 16, 72), pgx = Math.round(area.x + area.w / 2 - pw / 2);
  R(x, pgx + 1, area.y + 3, pw, area.h, 0x404040); R(x, pgx, area.y + 2, pw, area.h, 0xffffff);
  T(x, 'OFFERT', pgx + 6, area.y + 6, 0x1a3a8a);
  const nLines = Math.floor((area.h - 14) / 4), typed = Math.floor((lt * 1.5) % (nLines + 4));
  for (let i = 0; i < Math.min(nLines, typed); i++) {
    const len = i === nLines - 1 ? pw * 0.4 : pw - 12 - (hsh(i, 2) * 10 | 0);
    greek(x, pgx + 6, area.y + 14 + i * 4, len, 0x303030, i * 3);
    if (i === 1) for (let k = 0; k < 10; k++) P(x, pgx + 20 + k, area.y + 15 + i * 4 + (k % 2), 0xff2020);
  }
  if (blink(t, 2.5)) R(x, pgx + 6 + (typed % 3) * 9, area.y + 13 + Math.min(nLines - 1, typed) * 4, 1, 3, 0x000000);
  R(x, win.x, win.y + win.h - 6, win.w, 6, bar); T(x, 'SID 1 AV 1', win.x + 2, win.y + win.h - 6, 0x000000);
  taskbar(x, c, { task: 'BREV.DOC', taskIcon: 'doc' });
  drawPointer(x, c);
}

// --- World of Warcraft-liknande ---
function wow(x, c) {
  const { W, H, lt, t } = c;
  x.drawImage(layer('wow', W, H, (g) => {
    vgrad(g, 0, 0, W, H * 0.45, 0x5a8ad8, 0xd8e8f4);
    for (let i = 0; i < W; i++) { const m = Math.round(H * 0.3 + Math.sin(i * 0.05) * 5 + Math.sin(i * 0.13) * 2); R(g, i, m, 1, H * 0.45 - m, 0x8a9ab8); R(g, i, m, 1, 1, 0xd8e0ec); }
    for (let i = 0; i < W; i++) { const hgt = Math.round(H * 0.42 + Math.sin(i * 0.04 + 1) * 4); vgrad(g, i, hgt, 1, H - hgt, 0x5aa03a, 0x2a5a1a, 5); }
    for (let r = 0; r < H * 0.55; r++) { const f = r / (H * 0.55), w = 3 + f * W * 0.3, cx = W * 0.52 + Math.sin(f * 3) * W * 0.12 * (1 - f); R(g, cx - w / 2, H * 0.45 + r, w, 1, mix(0xb89a68, 0x9a7a48, f)); }
    R(g, W * 0.7, H * 0.2, 6, 20, 0x9a9488); for (let i = 0; i < 6; i += 2) R(g, W * 0.7 + i, H * 0.2 - 2, 1, 2, 0x9a9488); R(g, W * 0.7 + 2, H * 0.26, 2, 3, 0x2a2a2a);
    const tree = (a, b, s) => { R(g, a - 1, b, 2, s, 0x5a3a1a); disc(g, a, b - s * 0.1, s * 0.55, 0x2a6a1a); disc(g, a - s * 0.2, b - s * 0.3, s * 0.35, 0x4a9a2a); };
    [[8, 50, 16], [22, 44, 10], [W - 14, 52, 18], [W - 30, 46, 11], [W * 0.35, 40, 7]].forEach(([a, b, s]) => tree(a, b, s));
  }), 0, 0);
  // NPC med utropstecken och en varg
  const nx = Math.round(W * 0.3), ny = Math.round(H * 0.5);
  R(x, nx, ny, 3, 6, 0x6a4a9a); R(x, nx, ny - 2, 3, 2, 0xd8a878);
  if (blink(t, 1.5)) { R(x, nx + 1, ny - 9, 1, 4, 0xffd800); P(x, nx + 1, ny - 4, 0xffd800); } else { R(x, nx + 1, ny - 8, 1, 3, 0xffd800); P(x, nx + 1, ny - 4, 0xffd800); }
  const wx = Math.round(W * 0.62 + Math.sin(lt * 0.5) * 6), wy = Math.round(H * 0.55);
  R(x, wx, wy, 8, 3, 0x6a6a6a); R(x, wx + 7, wy - 2, 3, 3, 0x5a5a5a); R(x, wx, wy + 3, 1, 2, 0x5a5a5a); R(x, wx + 6, wy + 3, 1, 2, 0x5a5a5a); P(x, wx - 1, wy, 0x5a5a5a);
  TC(x, 'VARG', wx + 4, wy - 9, 0xff4040);
  // hjälten bakifrån
  const hx = Math.round(W / 2 - 5), hy = Math.round(H * 0.66 + Math.sin(lt * 2) * 0.6);
  R(x, hx + 1, hy + 4, 8, 11, 0xa02020); R(x, hx, hy + 3, 3, 3, 0x9a9aa8); R(x, hx + 7, hy + 3, 3, 3, 0x9a9aa8);
  R(x, hx + 3, hy, 4, 4, 0x6a4a2a); R(x, hx + 2, hy + 15, 2, 4, 0x4a3a2a); R(x, hx + 6, hy + 15, 2, 4, 0x4a3a2a);
  L(x, hx + 2, hy + 2, hx + 8, hy + 12, 0xc8c8d0); R(x, hx + 4, hy + 7, 2, 2, 0xe8c020);
  // gränssnitt
  disc(x, 7, 7, 5, 0x1a1a1a); disc(x, 7, 7, 4, 0xd8a878); P(x, 6, 6, 0); P(x, 8, 6, 0); R(x, 5, 3, 5, 2, 0x6a4a2a);
  R(x, 13, 3, 26, 9, 0x1a1a1a); R(x, 14, 4, 24, 3, 0x20b020); R(x, 14, 8, 17 + Math.round(Math.sin(lt) * 3), 3, 0x2040d0);
  disc(x, W - 12, 12, 10, 0xc8a040); disc(x, W - 12, 12, 9, 0x3a6a2a);
  R(x, W - 16, 10, 5, 3, 0x9a7a48); P(x, W - 12, 12, 0xffffff); P(x, W - 12, 11, 0xffd800); P(x, W - 8, 15, 0xffd800);
  T(x, 'HOGGER 0/1', W - 48, 26, 0xffd800);
  const n = W >= 150 ? 12 : 9, bw2 = n * 7 + 2, bx = Math.round(W / 2 - bw2 / 2), by = H - 11;
  R(x, bx - 2, by - 1, bw2 + 4, 10, 0x4a3a20); R(x, bx - 1, by, bw2 + 2, 8, 0x1a1408);
  const ab = [0xe86a20, 0x3a8ae8, 0xb8b8c0, 0xd02020, 0x9a40d0, 0x30b050, 0xe8c040, 0x6a4a2a, 0x40c0d0, 0xd06a90, 0x8a8a40, 0x4a6ab0];
  for (let i = 0; i < n; i++) { R(x, bx + 1 + i * 7, by + 1, 6, 6, ab[i]); R(x, bx + 1 + i * 7, by + 1, 6, 1, shade(ab[i], 1.4)); if (i === Math.floor(lt * 1.3) % n) { x.globalAlpha = 0.5; R(x, bx + 1 + i * 7, by + 1, 6, 6, 0x000000); x.globalAlpha = 1; } }
  R(x, bx - 2, by + 9, bw2 + 4, 2, 0x1a1a1a); R(x, bx - 2, by + 9, Math.round((bw2 + 4) * 0.63), 2, 0x9a40d0);
  x.globalAlpha = 0.45; R(x, 1, H - 30, 40, 17, 0x000000); x.globalAlpha = 1;
  const chat = [0xffffff, 0x40ff40, 0xff80ff, 0xffd800];
  for (let i = 0; i < 4; i++) greek(x, 3, H - 28 + i * 4, 30 + (i % 2) * 6, chat[(i + Math.floor(lt * 0.5)) % 4], i + Math.floor(lt * 0.5));
}

// --- Mediacenter (HTPC) ---
function htpc(x, c) {
  const { W, H, lt, t, info } = c;
  if (lt % 16 > 9) return movie(x, c);
  x.drawImage(layer('mce', W, H, (g) => {
    vgrad(g, 0, 0, W, H, 0x0c3c80, 0x061838);
    g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) for (let i = 0; i < W; i++) { g.globalAlpha = 0.06; R(g, i, H * 0.62 + Math.sin(i * 0.04 + k) * 8 + k * 4, 1, 3, 0x40c0d0); }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    disc(g, 8, 8, 5, 0x1a8a2a); disc(g, 8, 8, 4, 0x3ab84a); flag(g, 8, 8, 2, 'wave', [0xffffff, 0xffffff, 0xffffff, 0xffffff]);
    T(g, 'MEDIACENTER', 16, 6, 0xffffff);
  }), 0, 0);
  T(x, info.clock || '12:00', W - 22, 6, 0xffffff);
  const items = ['BILDER', 'MUSIK', 'FILM', 'TV', 'UPPGIFTER'], sel = 2 + Math.round(Math.sin(lt * 0.5) * 0);
  const cy = Math.round(H * 0.48);
  items.forEach((s, i) => {
    const dy = (i - sel) * 11, a = 1 - Math.min(0.75, Math.abs(i - sel) * 0.35);
    x.globalAlpha = a;
    if (i === sel) { R(x, 12, cy + dy - 3, W - 24, 11, 0x1a6ad0); R(x, 12, cy + dy - 3, W - 24, 1, 0x7ac0ff); x.globalAlpha = 1; T(x, s, 18, cy + dy, 0xffffff, 1); }
    else T(x, s, 18, cy + dy, 0xc8d8f0);
  });
  x.globalAlpha = 1;
  const tiles = [0x8a3a2a, 0x2a6a8a, 0xd8a030, 0x5a2a7a];
  const tw2 = Math.min(18, Math.floor((W - 60) / 4));
  tiles.forEach((col2, i) => { const tx = 50 + i * (tw2 + 3), hl = i === Math.floor(lt * 0.8) % 4; R(x, tx - (hl ? 1 : 0), cy - 5 - (hl ? 1 : 0), tw2 + (hl ? 2 : 0), 14 + (hl ? 2 : 0), hl ? 0xffffff : 0x0a1a3a); R(x, tx, cy - 5, tw2, 14, col2); R(x, tx + 2, cy + 3, tw2 - 4, 2, shade(col2, 1.5)); });
  T(x, 'FILMBIBLIOTEK', 50, cy + 12, 0x9ac0e8);
  drawPointer(x, c);
}
function movie(x, c) {
  const { W, H, lt, t } = c;
  R(x, 0, 0, W, H, 0x000000);
  const vy = 10, vh = H - 20;
  x.drawImage(layer('movie', W, vh, (g) => {
    vgrad(g, 0, 0, W, vh * 0.6, 0x2a1a4a, 0xf08a40);
    disc(g, W * 0.6, vh * 0.55, 9, 0xffd890);
    for (let i = 0; i < W; i++) { const m = Math.round(vh * 0.55 + Math.sin(i * 0.08) * 3); R(g, i, m, 1, vh - m, 0x1a1020); }
    R(g, 0, vh * 0.8, W, vh * 0.2, 0x2a2030);
  }), 0, vy);
  const carX = Math.round(((lt * 12) % (W + 30)) - 20);
  R(x, carX, vy + vh * 0.8 - 5, 16, 4, 0x0a0a10); R(x, carX + 3, vy + vh * 0.8 - 8, 8, 3, 0x0a0a10); P(x, carX + 16, vy + vh * 0.8 - 4, 0xfff0a0);
  if ((lt % 16) - 9 < 3) {
    x.globalAlpha = 0.7; R(x, 6, H - 19, W - 12, 12, 0x0a1a3a); x.globalAlpha = 1;
    T(x, '▶', 9, H - 16, 0xffffff);
    R(x, 16, H - 14, W - 50, 2, 0x3a4a6a); R(x, 16, H - 14, Math.round((W - 50) * (0.3 + ((lt % 16) - 9) * 0.01)), 2, 0x40a0ff);
    TR(x, '0:42:13', W - 8, H - 16, 0xffffff);
  }
}

// --- Crysis-liknande djungel ---
function crysis(x, c) {
  const { W, H, lt, t } = c;
  x.drawImage(layer('crysis', W, H, (g) => {
    vgrad(g, 0, 0, W, H * 0.5, 0x3a8ae0, 0xe0f0fa);
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35; disc(g, W * 0.75, H * 0.18, 16, 0xfff0c0); g.globalAlpha = 0.8; disc(g, W * 0.75, H * 0.18, 5, 0xffffff); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    R(g, 0, H * 0.6, W, H * 0.4, 0xe0cc98); vgrad(g, 0, H * 0.66, W, H * 0.34, 0xe8d8a8, 0xc8b078, 6);
    vgrad(g, 0, H * 0.5, W, H * 0.14, 0x1a78a8, 0x40c8c0);
    for (let i = 0; i < 30; i++) R(g, hsh(i, 1) * W, H * 0.5 + hsh(i, 2) * H * 0.13, 4, 1, 0xa8f0f0);
    for (let i = 0; i < W; i++) { const s = Math.round(H * 0.62 + Math.sin(i * 0.05) * 2); R(g, i, s, 1, 4, 0xe8d8a8); }
    for (let i = 0; i < W; i++) { const j = Math.round(H * 0.46 + Math.sin(i * 0.09) * 3 + hsh(i, 3) * 2); if (i < W * 0.3 || i > W * 0.85) vgrad(g, i, j, 1, H * 0.2, 0x3a7a2a, 0x1a4a1a, 3); }
    const palm = (a, b, hgt, lean) => {
      for (let k = 0; k < hgt; k++) R(g, Math.round(a + lean * (k / hgt) * (k / hgt) * hgt), b - k, 2, 1, k % 3 ? 0x8a6a40 : 0x6a4a2a);
      const tx = a + lean * hgt, ty = b - hgt;
      for (let f = 0; f < 7; f++) { const ang = -Math.PI * (0.05 + f / 7.5); for (let r = 0; r < hgt * 0.5; r++) { const px = tx + Math.cos(ang) * r, py = ty + Math.sin(ang) * r * 0.5 + (r * r) / (hgt * 0.9); R(g, px, py, 2, 1, r % 2 ? 0x3a8a2a : 0x6ab83a); } }
    };
    palm(W * 0.14, H * 0.8, 34, 0.3); palm(W * 0.3, H * 0.72, 24, -0.25); palm(W * 0.9, H * 0.78, 30, -0.35); palm(W * 0.8, H * 0.66, 18, 0.2);
    for (let i = 0; i < W; i++) { const b = Math.round(H * 0.82 + Math.sin(i * 0.2) * 3 + Math.sin(i * 0.53) * 2); vgrad(g, i, b, 1, H - b, 0x2a5a1a, 0x0a200a, 3); }
    for (let i = 0; i < 50; i++) R(g, hsh(i, 5) * W, H * 0.8 + hsh(i, 6) * H * 0.2, 3, 1, 0x4a8a2a);
  }), 0, 0);
  const sway = Math.round(Math.sin(lt * 1.8) * 1.5), gx = W - 40 + sway, gy = H - 18;
  x.fillStyle = css(0x2a2e32); x.beginPath(); x.moveTo(gx + 6, gy + 2); x.lineTo(gx + 40, gy + 12); x.lineTo(gx + 40, gy + 20); x.lineTo(gx + 2, gy + 8); x.fill();
  R(x, gx + 14, gy + 1, 8, 3, 0x1a1c20); P(x, gx + 16, gy + 2, 0xff3020); R(x, gx + 22, gy + 10, 4, 6, 0x3a3e42);
  R(x, Math.round(W / 2) - 1, Math.round(H / 2), 3, 1, 0x80f0ff); R(x, Math.round(W / 2), Math.round(H / 2) - 1, 1, 3, 0x80f0ff);
  x.globalAlpha = 0.8;
  R(x, W - 38, H - 24, 34, 3, 0x0a2a3a); R(x, W - 38, H - 24, Math.round(34 * (0.7 + Math.sin(lt * 0.6) * 0.3)), 3, 0x60e0ff);
  for (let i = 0; i < 4; i++) { disc(x, W - 34 + i * 8, H - 31, 2, i === 0 ? 0x60e0ff : 0x2a5a6a); }
  x.globalAlpha = 1;
  TR(x, '30 | 120', W - 4, H - 19, 0x9af0ff);
  x.globalAlpha = 0.5; R(x, W / 2 - 25, 2, 50, 6, 0x0a2a3a); x.globalAlpha = 1;
  const hd = (lt * 8) % 20;
  for (let i = 0; i < 6; i++) R(x, Math.round(W / 2 - 24 + ((i * 10 - hd + 60) % 50)), 6, 1, 2, 0x9af0ff);
  TC(x, 'N', W / 2 + ((30 - hd + 50) % 50) - 25, 2, 0x9af0ff);
  x.globalAlpha = 0.5; R(x, 3, H - 20, 17, 17, 0x0a2a3a); x.globalAlpha = 1;
  P(x, 11, H - 12, 0xffffff); P(x, 7, H - 16, 0xff4040); P(x, 16, H - 8, 0xff4040);
}

// --- Kontor 2010-tal: kalkylark med diagram ---
function kontor(x, c) {
  const { W, H, lt, t, os } = c;
  wallpaper(x, c);
  const win = osWindow(x, c, 3, 2, W - 6, H - 13, 'BUDGET.XLSX - KALKYL', {});
  let y = win.y;
  R(x, win.x, y, win.w, 6, 0x217346); ['ARKIV', 'START', 'INFOGA', 'FORMLER'].forEach((s, i) => { if (i === 1) R(x, win.x + 23, y, tw(s) + 4, 6, 0xf3f3f3); T(x, s, win.x + 2 + [0, 25, 48, 75][i], y + 1, i === 1 ? 0x217346 : 0xffffff); });
  y += 6; R(x, win.x, y, win.w, 11, 0xf3f3f3);
  R(x, win.x + 2, y + 1, 7, 9, 0xe8e8e8); R(x, win.x + 3, y + 2, 5, 5, 0xd8b048);
  ['F', 'K', 'U'].forEach((s, i) => T(x, s, win.x + 13 + i * 6, y + 2, 0x202020));
  R(x, win.x + 13, y + 8, 16, 1, 0xd02020);
  for (let i = 0; i < 4; i++) R(x, win.x + 34 + i * 5, y + 2 + (i % 2), 4, 1, 0x505050);
  R(x, win.x + 58, y + 2, 7, 7, 0x2a6ad0); R(x, win.x + 60, y + 5, 1, 3, 0xffffff); R(x, win.x + 62, y + 3, 1, 5, 0xffffff);
  y += 11; R(x, win.x, y, win.w, 7, 0xffffff); R(x, win.x, y + 6, win.w, 1, 0xd0d0d0);
  T(x, 'FX', win.x + 2, y + 1, 0x707070); T(x, '=SUMMA(B2:B6)', win.x + 14, y + 1, 0x202020);
  y += 7;
  const gridH = win.y + win.h - y - 7, rh = 6, cw = 17, rows = Math.floor(gridH / rh);
  R(x, win.x, y, win.w, gridH, 0xffffff);
  R(x, win.x, y, win.w, rh, 0xe6e6e6);
  for (let k = 0; k * cw + 8 < win.w; k++) { TC(x, String.fromCharCode(65 + k), win.x + 8 + k * cw + cw / 2, y + 1, 0x404040); R(x, win.x + 8 + k * cw, y, 1, gridH, 0xdadada); }
  const data = [['', 'JAN', 'FEB', 'MAR'], ['LÖN', 3200, 3200, 3400], ['HYRA', -950, -950, -950], ['MAT', -780, -820, -760], ['EL', -310, -280, -190], ['SUMMA', 1160, 1150, 1500]];
  for (let r = 1; r < rows; r++) {
    const yy = y + r * rh;
    R(x, win.x, yy, 8, rh, 0xe6e6e6); TC(x, String(r), win.x + 4, yy + 1, 0x404040); R(x, win.x + 8, yy + rh - 1, win.w - 8, 1, 0xececec);
    const d = data[r - 1];
    if (!d) continue;
    d.forEach((v, k) => { const cx = win.x + 8 + k * cw; if (typeof v === 'number') TR(x, String(Math.abs(v)), cx + cw - 2, yy + 1, v < 0 ? 0xc02020 : 0x202020); else T(x, String(v).slice(0, 4), cx + 1, yy + 1, r === 1 || r === 6 ? 0x217346 : 0x202020); });
  }
  const sel = [[1, 1], [2, 2], [3, 3], [6, 1]][Math.floor(lt * 0.9) % 4];
  const sx = win.x + 8 + sel[1] * cw, sy = y + sel[0] * rh;
  R(x, sx - 1, sy - 1, cw + 1, 1, 0x217346); R(x, sx - 1, sy + rh - 1, cw + 1, 1, 0x217346); R(x, sx - 1, sy - 1, 1, rh + 1, 0x217346); R(x, sx + cw - 1, sy - 1, 1, rh + 1, 0x217346);
  // diagram
  const chX = win.x + 8 + 4 * cw + 4, chW = win.x + win.w - chX - 3, chY = y + rh + 2, chH = Math.min(gridH - rh - 6, 36);
  if (chW > 24) {
    R(x, chX, chY, chW, chH, 0xffffff); R(x, chX, chY, chW, 1, 0xc8c8c8); R(x, chX, chY + chH - 1, chW, 1, 0xc8c8c8); R(x, chX, chY, 1, chH, 0xc8c8c8); R(x, chX + chW - 1, chY, 1, chH, 0xc8c8c8);
    T(x, 'SPARAT', chX + 3, chY + 2, 0x404040);
    const bw = Math.max(3, Math.floor((chW - 12) / 7));
    [1160, 1150, 1500].forEach((v, i) => { const hgt = Math.round(((chH - 14) * v) / 1600); R(x, chX + 5 + i * bw * 2, chY + chH - 3 - hgt, bw, hgt, 0x4472c4); R(x, chX + 5 + i * bw * 2 + bw, chY + chH - 3 - Math.round(hgt * 0.6), Math.max(2, bw - 1), Math.round(hgt * 0.6), 0xed7d31); });
  }
  R(x, win.x, win.y + win.h - 7, win.w, 7, 0xf3f3f3); R(x, win.x + 2, win.y + win.h - 7, 20, 6, 0xffffff); T(x, 'BLAD1', win.x + 3, win.y + win.h - 6, 0x217346);
  taskbar(x, c, { task: 'KALKYL', taskIcon: 'sheet' });
  drawPointer(x, c);
}

// --- Skoldator: kodredigerare ---
const CODE = [
  [['# MITT FÖRSTA SPEL', 0x6a9955]],
  [['IMPORT ', 0xc586c0], ['RANDOM', 0x4ec9b0]],
  [],
  [['DEF ', 0x569cd6], ['HEJ', 0xdcdcaa], ['(NAMN):', 0xd4d4d4]],
  [['    PRINT', 0xdcdcaa], ['("HEJ", ', 0xce9178], ['NAMN)', 0x9cdcfe]],
  [],
  [['FOR ', 0xc586c0], ['I ', 0x9cdcfe], ['IN ', 0xc586c0], ['RANGE', 0xdcdcaa], ['(3):', 0xb5cea8]],
  [['    HEJ', 0xdcdcaa], ['("VÄRLDEN")', 0xce9178]],
];
function skola(x, c) {
  const { W, H, lt, t } = c;
  wallpaper(x, c);
  const win = osWindow(x, c, 3, 2, W - 6, H - 13, 'HEJ.PY - KODREDIGERARE', {});
  R(x, win.x, win.y, win.w, win.h, 0x1e1e1e);
  R(x, win.x, win.y, 7, win.h, 0x333333);
  for (let i = 0; i < 3; i++) R(x, win.x + 2, win.y + 3 + i * 8, 3, 4, i === 0 ? 0xffffff : 0x858585);
  const side = W >= 150 ? 30 : 0;
  if (side) {
    R(x, win.x + 7, win.y, side, win.h, 0x252526); T(x, 'FILER', win.x + 9, win.y + 2, 0xbbbbbb);
    ['HEJ.PY', 'SPEL.PY', 'NOTER'].forEach((s, i) => { if (i === 0) R(x, win.x + 7, win.y + 9 + i * 7, side, 7, 0x37373d); T(x, s, win.x + 11, win.y + 10 + i * 7, i === 0 ? 0xffffff : 0xcccccc); });
  }
  const ex = win.x + 7 + side;
  R(x, ex, win.y, win.w - 7 - side, 6, 0x252526); R(x, ex, win.y, 30, 6, 0x1e1e1e); T(x, 'HEJ.PY', ex + 3, win.y + 1, 0xffffff);
  const total = CODE.reduce((s, l) => s + l.reduce((a, [tx]) => a + tx.length, 0) + 1, 0);
  let left = Math.floor((lt * 16) % (total + 60));
  let cursor = null;
  CODE.forEach((line, i) => {
    const yy = win.y + 8 + i * 6;
    if (yy > win.y + win.h - 22) return;
    TR(x, String(i + 1), ex + 8, yy, 0x858585);
    let xx = ex + 11;
    for (const [tx, colr] of line) {
      if (left <= 0) break;
      const s = tx.slice(0, left); left -= s.length;
      T(x, s, xx, yy, colr); xx += tw(s) + (s.length ? 1 : 0);
    }
    if (left > 0) left -= 1; else if (!cursor) cursor = [xx, yy];
  });
  if (cursor && blink(t, 2.5)) R(x, cursor[0], cursor[1], 1, 5, 0xaeafad);
  const ty = win.y + win.h - 20;
  R(x, ex, ty, win.w - 7 - side, 14, 0x1e1e1e); R(x, ex, ty, win.w - 7 - side, 1, 0x3c3c3c);
  T(x, 'TERMINAL', ex + 2, ty + 2, 0xcccccc);
  T(x, '> PYTHON HEJ.PY', ex + 2, ty + 8, 0xcccccc);
  if (lt % 8 > 6) T(x, 'HEJ VÄRLDEN', ex + 70, ty + 8, 0x4ec94e);
  R(x, win.x, win.y + win.h - 6, win.w, 6, 0x007acc); T(x, 'PYTHON 3', win.x + 3, win.y + win.h - 6, 0xffffff);
  taskbar(x, c, { task: 'KOD', taskIcon: 'code' });
  drawPointer(x, c);
}

// --- Minecraft-liknande ---
function minecraft(x, c) {
  const { W, H, lt, t } = c;
  x.drawImage(layer('mc', W, H, (g) => {
    vgrad(g, 0, 0, W, H * 0.55, 0x6a9eff, 0xb8d4ff);
    R(g, W * 0.78, 8, 9, 9, 0xfff8d0); R(g, W * 0.78 - 2, 6, 13, 13, 0xfffae8); R(g, W * 0.78, 8, 9, 9, 0xffffff);
    const layerRow = (base, s, amp, seed, cols) => {
      for (let i = 0; i * s < W; i++) {
        const hgt = Math.round(base + Math.round((Math.sin(i * 0.5 + seed) + hsh(i, seed) * 0.8) * amp) * s);
        for (let yy = hgt; yy < H; yy += s) {
          const d = (yy - hgt) / s, col2 = d < 1 ? cols[0] : d < 3 ? cols[1] : cols[2];
          R(g, i * s, yy, s, s, col2);
          if (s >= 5) { R(g, i * s, yy, s, 1, shade(col2, 1.15)); for (let k = 0; k < 2; k++) R(g, i * s + Math.floor(hsh(i * 7 + k, yy) * (s - 1)), yy + 1 + Math.floor(hsh(yy + k, i) * (s - 2)), 1, 1, shade(col2, 0.8)); }
        }
        if (d0(i, seed) && s >= 5) { const tx = i * s; for (let k = 1; k <= 3; k++) R(g, tx, hgt - k * s, s, s, 0x6a4a28); for (let a = -1; a <= 1; a++) for (let b = 4; b <= 5; b++) R(g, tx + a * s, hgt - b * s, s, s, (a + b) % 2 ? 0x3a8a2a : 0x2f7a22); }
      }
    };
    const d0 = (i, seed) => hsh(i, seed + 40) > 0.86;
    layerRow(H * 0.5, 3, 1.5, 1, [0x8ab0a8, 0x9ab0b0, 0xa8b8c0].map((v) => mix(v, 0xb8d4ff, 0.3)));
    layerRow(H * 0.58, 5, 1.2, 2, [0x5cb033, 0x8a5a30, 0x7a7a7a]);
    for (let i = Math.round(W * 0.2); i < W * 0.45; i += 5) R(g, i, H * 0.72, 5, 5, 0x3a6ad8);
    layerRow(H * 0.78, 9, 0.8, 3, [0x6cc03a, 0x8a5a30, 0x7a7a7a]);
  }), 0, 0);
  const cl = Math.floor((lt * 2) % (W + 40)) - 30;
  x.globalAlpha = 0.9; R(x, cl, 10, 24, 5, 0xffffff); R(x, cl + 6, 7, 12, 3, 0xffffff); R(x, (cl + 70) % (W + 40) - 30, 16, 18, 4, 0xffffff); x.globalAlpha = 1;
  // creeper
  const kx = Math.round(W * 0.62), ky = Math.round(H * 0.5);
  R(x, kx, ky, 5, 5, 0x5ab84a); P(x, kx + 1, ky + 1, 0); P(x, kx + 3, ky + 1, 0); R(x, kx + 2, ky + 3, 1, 2, 0);
  R(x, kx + 1, ky + 5, 3, 6, 0x4aa83a); R(x, kx, ky + 11, 2, 2, 0x3a982a); R(x, kx + 3, ky + 11, 2, 2, 0x3a982a);
  // hand med hacka
  const swing = Math.max(0, Math.sin(lt * 6)) * 4;
  const hx = W - 26 - Math.round(swing), hy = H - 22 + Math.round(swing);
  L(x, hx + 4, hy + 14, hx + 16, hy + 2, 0x8a6a3a); L(x, hx + 5, hy + 14, hx + 17, hy + 2, 0x6a4a2a);
  R(x, hx + 11, hy - 1, 12, 3, 0x40d8d0); R(x, hx + 11, hy - 1, 2, 5, 0x40d8d0); R(x, hx + 21, hy - 1, 2, 5, 0x40d8d0);
  R(x, hx + 6, hy + 10, 12, 14, 0xc89870); R(x, hx + 6, hy + 10, 12, 2, 0xd8a880);
  // hårkors och snabbfält
  R(x, W / 2 - 3, H / 2, 7, 1, 0xffffff); R(x, W / 2, H / 2 - 3, 1, 7, 0xffffff);
  const n = 9, sw = 8, bx = Math.round(W / 2 - (n * sw) / 2), by = H - 10;
  x.globalAlpha = 0.6; R(x, bx - 1, by - 1, n * sw + 2, sw + 2, 0x000000); x.globalAlpha = 1;
  const items = [0x40d8d0, 0x8a8a8a, 0x8a5a30, 0x7a7a7a, 0xf0a020, 0xc89040, 0xd02020, 0x3a6ad8, 0x6cc03a];
  for (let i = 0; i < n; i++) { R(x, bx + i * sw, by, sw - 1, sw - 1, 0x8b8b8b); R(x, bx + i * sw + 1, by + 1, sw - 3, sw - 3, 0x5a5a5a); R(x, bx + i * sw + 2, by + 2, sw - 5, sw - 5, items[i]); }
  const selI = Math.floor(lt * 0.7) % n;
  R(x, bx + selI * sw - 1, by - 1, sw + 1, 1, 0xffffff); R(x, bx + selI * sw - 1, by + sw - 1, sw + 1, 1, 0xffffff); R(x, bx + selI * sw - 1, by - 1, 1, sw + 1, 0xffffff); R(x, bx + selI * sw + sw - 1, by - 1, 1, sw + 1, 0xffffff);
  for (let i = 0; i < 10; i++) { const hx2 = bx + i * 3.5, hy2 = by - 5; R(x, hx2, hy2, 3, 2, 0xd02020); P(x, hx2 + 1, hy2 + 2, 0xd02020); P(x, hx2, hy2, 0xff8080); }
  for (let i = 0; i < 10; i++) { const fx = bx + n * sw - 4 - i * 3.5, fy = by - 5; R(x, fx, fy, 3, 2, 0xb07030); P(x, fx + 2, fy + 2, 0xe8e8e8); }
}

// --- Battle royale-liknande (gamingdator) ---
function gaming(x, c) {
  const { W, H, lt, t } = c;
  x.drawImage(layer('br', W, H, (g) => {
    vgrad(g, 0, 0, W, H * 0.55, 0x3a90f0, 0xc0e4ff);
    for (const [bx, by, r] of [[0.2, 0.2, 9], [0.28, 0.17, 7], [0.65, 0.12, 10], [0.74, 0.16, 7]]) { disc(g, bx * W, by * H, r, 0xffffff); disc(g, bx * W + 3, by * H + 3, r * 0.8, 0xe8f2ff); }
    for (let i = 0; i < W; i++) { const h1 = Math.round(H * 0.46 + Math.sin(i * 0.035) * 6 + Math.sin(i * 0.11) * 2); vgrad(g, i, h1, 1, H - h1, 0x6ad050, 0x2a8a2a, 5); }
    const tree = (a, b, r) => { R(g, a - 1, b, 3, r, 0x7a4a24); disc(g, a, b - r * 0.4, r, 0x2aa03a); disc(g, a - r * 0.3, b - r * 0.7, r * 0.6, 0x4ac05a); };
    tree(W * 0.08, H * 0.52, 7); tree(W * 0.88, H * 0.5, 8); tree(W * 0.95, H * 0.56, 5); tree(W * 0.4, H * 0.44, 4);
    const wx = Math.round(W * 0.58), wy = Math.round(H * 0.3);
    for (let k = 0; k < 3; k++) {
      const x0 = wx + k * 10, y0 = wy + 16 - k * 8;
      R(g, x0, y0, 10, 12, 0xb07840); for (let yy = y0 + 3; yy < y0 + 12; yy += 3) R(g, x0, yy, 10, 1, 0x8a5a2a); R(g, x0, y0, 10, 1, 0xd89a58);
    }
    for (let i = 0; i < 16; i++) R(g, wx - 18 + i, wy + 28 - Math.round(i * 0.7), 1, Math.round(i * 0.7) + 1, i % 3 ? 0xa06a38 : 0x7a4a24);
  }), 0, 0);
  // stormväggen
  x.save(); x.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 18; i++) { x.globalAlpha = 0.03 + (18 - i) * 0.006; R(x, i, 0, 1, H, 0x9040ff); }
  if ((t * 1.3) % 3 < 0.08) { x.globalAlpha = 0.6; L(x, 6, 0, 10, 30, 0xe0c0ff); }
  x.restore(); x.globalAlpha = 1;
  // spelaren bakifrån
  const px = Math.round(W / 2 - 6), py = Math.round(H * 0.6 + Math.abs(Math.sin(lt * 4)) * 1);
  R(x, px + 2, py + 5, 8, 10, 0xf07820); R(x, px + 3, py + 6, 6, 6, 0x3a3a50);
  R(x, px + 3, py, 6, 6, 0x5a3a2a); R(x, px + 2, py + 15, 3, 6, 0x2a3a6a); R(x, px + 7, py + 15, 3, 6, 0x2a3a6a);
  R(x, px + 10, py + 6, 2, 6, 0xd8a070); L(x, px + 11, py + 5, px + 15, py - 2, 0x8a8a9a); R(x, px + 13, py - 3, 4, 2, 0xc0c0d0);
  // HUD
  R(x, W - 24, 2, 22, 22, 0x2a4a2a); R(x, W - 23, 3, 20, 20, 0x5aa050); R(x, W - 18, 8, 6, 4, 0x3a8ad0);
  disc(x, W - 13, 13, 8, 0xffffff); disc(x, W - 13, 13, 7, 0x5aa050); R(x, W - 16, 8, 6, 4, 0x3a8ad0); P(x, W - 12, 14, 0xffffff); P(x, W - 11, 13, 0xffffff);
  T(x, '42', W - 24, 27, 0xffffff); R(x, W - 13, 27, 3, 5, 0xffffff);
  TC(x, '0:45', W / 2, 2, 0xffffff); R(x, W / 2 - 14, 3, 3, 3, 0x9040ff);
  x.globalAlpha = 0.5; R(x, 3, H - 13, 40, 11, 0x000000); x.globalAlpha = 1;
  R(x, 5, H - 11, 36, 3, 0x1a3a6a); R(x, 5, H - 11, 36, 3, 0x40a0ff); R(x, 5, H - 6, 36, 3, 0x1a4a1a); R(x, 5, H - 6, 28, 3, 0x40e040);
  const rar = [0x9a9a9a, 0x40c040, 0x3a8ae8, 0xa040e0, 0xe8a020];
  for (let i = 0; i < 5; i++) { const sx = W - 58 + i * 11; x.globalAlpha = 0.6; R(x, sx, H - 12, 10, 10, 0x000000); x.globalAlpha = 1; R(x, sx, H - 3, 10, 1, rar[i]); R(x, sx + 2, H - 9, 6, 3, shade(rar[i], 0.8)); if (i === 2) { R(x, sx - 1, H - 13, 12, 1, 0xffffff); } }
  TR(x, '30', W - 4, H - 19, 0xffffff);
  R(x, W / 2 - 1, H / 2 - 4, 1, 2, 0xffffff); R(x, W / 2 - 1, H / 2 + 2, 1, 2, 0xffffff); R(x, W / 2 - 5, H / 2, 2, 1, 0xffffff); R(x, W / 2 + 3, H / 2, 2, 1, 0xffffff);
}

// --- Streaming: sändning med chatt ---
const CHAT = [[0xff4a4a, 'KALLE99'], [0x40d060, 'MIRA'], [0x5a9aff, 'OSSE'], [0xff7ad8, 'LINN_G'], [0xffa030, 'GAMERPAPPA'], [0x9a6aff, 'NOOB42']];
function stream(x, c) {
  const { W, H, lt, t } = c;
  R(x, 0, 0, W, H, 0x0e0e10);
  R(x, 0, 0, W, 7, 0x18181b); R(x, 2, 1, 6, 5, 0x9146ff); T(x, 'PIXELSTREAM', 11, 1, 0xefeff1);
  const chatW = Math.min(46, Math.round(W * 0.3)), pw = W - chatW - 2, ph = Math.round(pw * 9 / 16);
  const px = 1, py = 8;
  // spelet i spelaren
  x.save(); x.beginPath(); x.rect(px, py, pw, ph); x.clip(); x.translate(px, py);
  const sub = { ...c, W: pw, H: ph };
  (c.year >= 2018 ? gaming : minecraft)(x, sub);
  x.restore();
  // webbkamera
  const cw = Math.round(pw * 0.26), ch = Math.round(cw * 0.75), cx = px + 2, cy = py + ph - ch - 2;
  R(x, cx - 1, cy - 1, cw + 2, ch + 2, 0x9146ff); vgrad(x, cx, cy, cw, ch, 0x2a2a4a, 0x4a2a5a);
  const fx = cx + Math.round(cw / 2), fy = cy + Math.round(ch * 0.55);
  R(x, fx - 5, fy + 3, 10, ch - (fy - cy) - 3, 0x2a2a2a);
  disc(x, fx, fy, 3.5, 0xe0b090); R(x, fx - 4, fy - 5, 8, 3, 0x4a2a1a);
  R(x, fx - 5, fy - 3, 2, 5, 0x1a1a1a); R(x, fx + 4, fy - 3, 2, 5, 0x1a1a1a); R(x, fx - 5, fy - 4, 11, 1, 0x1a1a1a);
  P(x, fx - 1, fy - 1, 0); P(x, fx + 1, fy - 1, 0); R(x, fx - 1, fy + 2, 3, blink(t, 4) ? 1 : 2, 0x8a3a3a);
  R(x, px + 2, py + 2, 16, 7, 0xe91916); T(x, 'LIVE', px + 3, py + 3, 0xffffff);
  x.globalAlpha = 0.6; R(x, px + 20, py + 2, 28, 7, 0x000000); x.globalAlpha = 1;
  R(x, px + 22, py + 5, 3, 1, 0xff4a4a); T(x, String(1337 + Math.floor(lt * 3) % 40), px + 27, py + 3, 0xffffff);
  const iy = py + ph + 2;
  disc(x, px + 5, iy + 5, 4, 0x9146ff); T(x, 'PIXELSTREAMER', px + 12, iy + 1, 0xefeff1); greek(x, px + 12, iy + 9, 40, 0x9146ff, 2);
  R(x, px + pw - 22, iy + 1, 20, 8, 0x9146ff); T(x, 'FÖLJ', px + pw - 19, iy + 2, 0xffffff);
  // chatten
  const chx = W - chatW;
  R(x, chx, 7, chatW, H - 7, 0x18181b); R(x, chx, 7, 1, H - 7, 0x2a2a2e);
  T(x, 'CHATT', chx + 3, 9, 0xadadb8); R(x, chx, 15, chatW, 1, 0x2a2a2e);
  const scroll = Math.floor(lt * 1.2);
  for (let i = 0; i < 9; i++) {
    const k = scroll + i, [col2, name] = CHAT[k % CHAT.length], yy = 18 + i * 7;
    if (yy > H - 16) break;
    T(x, name.slice(0, 6), chx + 2, yy, col2);
    greek(x, chx + 4 + tw(name.slice(0, 6)), yy + 2, chatW - tw(name.slice(0, 6)) - 8, 0xdedee3, k);
    if (k % 4 === 1) { disc(x, chx + chatW - 6, yy + 2, 2, 0xffd040); P(x, chx + chatW - 7, yy + 1, 0); P(x, chx + chatW - 5, yy + 1, 0); }
  }
  R(x, chx + 2, H - 14, chatW - 4, 6, 0x3a3a3d); T(x, 'SKRIV', chx + 4, H - 13, 0x8a8a8a);
  R(x, chx + chatW - 20, H - 7, 18, 6, 0x9146ff); T(x, 'SÄND', chx + chatW - 18, H - 7, 0xffffff);
}

// --- VR-spegling: två ögon med neonkuber ---
function vr(x, c) {
  const { W, H, lt, t } = c;
  R(x, 0, 0, W, H, 0x000000);
  const ew = Math.floor((W - 6) / 2), eh = H - 16;
  for (let e = 0; e < 2; e++) {
    const ex = 2 + e * (ew + 2), ey = 2;
    x.save(); x.beginPath(); x.ellipse(ex + ew / 2, ey + eh / 2, ew / 2, eh / 2, 0, 0, Math.PI * 2); x.clip();
    const vx = ex + ew / 2 + (e ? -2 : 2), vy = ey + eh * 0.45;
    R(x, ex, ey, ew, eh, 0x06040f);
    for (let i = -8; i <= 8; i++) L(x, vx + i * 2, vy, vx + i * 14, ey + eh, i % 2 ? 0x3a0a2a : 0x0a2a4a);
    for (let r = 0; r < 6; r++) { const f = ((r + (lt * 2) % 1) / 6); R(x, ex, Math.round(vy + f * f * (eh - (vy - ey))), ew, 1, 0x103050); }
    R(x, vx - 30, vy - 1, 20, 1, 0xff2a8a); R(x, vx + 10, vy - 1, 20, 1, 0x2ad8ff);
    for (let k = 0; k < 4; k++) {
      const ph = ((lt * 0.6 + k * 0.25) % 1), s = 1 + ph * ph * 14, lane = (k % 2 ? 1 : -1) * (4 + ph * 18), hgt = (k % 3 - 1) * ph * 8;
      const cx = vx + lane, cy = vy + hgt + ph * 6;
      const colr = k % 2 ? 0x2a8aff : 0xff2a4a;
      R(x, cx - s / 2, cy - s / 2, s, s, colr); R(x, cx - s / 2, cy - s / 2, s, Math.max(1, s * 0.15), shade(colr, 1.5));
      if (s > 5) { R(x, cx - s * 0.25, cy - s * 0.1, s * 0.5, Math.max(1, s * 0.12), 0xffffff); }
    }
    const sw = Math.sin(lt * 3) * 10;
    x.save(); x.globalCompositeOperation = 'lighter';
    L(x, ex + ew * 0.25, ey + eh, ex + ew * 0.35 + sw, ey + eh * 0.55, 0xff3050); L(x, ex + ew * 0.25 + 1, ey + eh, ex + ew * 0.35 + sw + 1, ey + eh * 0.55, 0xff8090);
    L(x, ex + ew * 0.75, ey + eh, ex + ew * 0.62 - sw, ey + eh * 0.55, 0x3070ff); L(x, ex + ew * 0.75 + 1, ey + eh, ex + ew * 0.62 - sw + 1, ey + eh * 0.55, 0x90c0ff);
    x.restore();
    x.restore();
  }
  R(x, W / 2 - 34, H - 12, 68, 11, 0x1e2126); R(x, W / 2 - 34, H - 12, 68, 1, 0x3a3e46);
  R(x, W / 2 - 30, H - 9, 9, 5, 0x40c060); R(x, W / 2 - 29, H - 8, 3, 2, 0x1e2126); R(x, W / 2 - 25, H - 8, 3, 2, 0x1e2126);
  R(x, W / 2 - 16, H - 9, 2, 6, 0x40c060); R(x, W / 2 - 12, H - 9, 2, 6, 0x40c060);
  T(x, 'VR REDO', W / 2 - 6, H - 9, 0xdddddd);
}

// --- 3D & AI: rendering och träning ---
function ai(x, c) {
  const { W, H, lt, t } = c;
  wallpaper(x, c);
  const win = osWindow(x, c, 2, 2, W - 4, H - 13, 'PIXELRENDER + AI-TRÄNING', {});
  R(x, win.x, win.y, win.w, win.h, 0x1e1f22);
  const vw = Math.round(win.w * 0.55), vh = win.h - 2;
  R(x, win.x + 1, win.y + 1, vw, vh, 0x2b2d31);
  const hx = win.x + 1 + vw / 2, hy = win.y + vh * 0.72;
  for (let i = -5; i <= 5; i++) { L(x, hx + i * 4, hy - 8, hx + i * 9, hy + 12, 0x3a3d44); }
  for (let r = 0; r < 4; r++) R(x, win.x + 1, hy - 8 + r * r * 1.4, vw, 1, 0x3a3d44);
  // renderad kula som fylls i rutor
  const tiles = 6, ts = Math.floor(Math.min(vw, vh) * 0.6 / tiles), ox = Math.round(hx - (ts * tiles) / 2), oy = Math.round(win.y + vh * 0.12);
  const done = Math.floor((lt * 5) % (tiles * tiles + 10));
  const rr = (ts * tiles) / 2 - 2, ccx = ox + (ts * tiles) / 2, ccy = oy + (ts * tiles) / 2;
  for (let k = 0; k < tiles * tiles; k++) {
    const tx = ox + (k % tiles) * ts, ty = oy + Math.floor(k / tiles) * ts;
    if (k < done) {
      for (let yy = 0; yy < ts; yy++) for (let xx = 0; xx < ts; xx += 1) {
        const dx = tx + xx - ccx, dy = ty + yy - ccy, d2 = dx * dx + dy * dy;
        if (d2 < rr * rr) { const nz = Math.sqrt(1 - d2 / (rr * rr)), l = Math.max(0, (-dx * 0.5 - dy * 0.6) / rr + nz * 0.6); R(x, tx + xx, ty + yy, 1, 1, mix(0x1a3a6a, 0x7ad8ff, Math.min(1, l))); }
      }
    } else if (k < done + 2) { R(x, tx, ty, ts, 1, 0xf08a30); R(x, tx, ty + ts - 1, ts, 1, 0xf08a30); R(x, tx, ty, 1, ts, 0xf08a30); R(x, tx + ts - 1, ty, 1, ts, 0xf08a30); }
  }
  T(x, 'RENDER', win.x + 3, win.y + 3, 0xbcbec4);
  // träningspanel
  const rx = win.x + vw + 3, rw = win.w - vw - 5;
  T(x, `EPOK ${1 + Math.floor(lt * 0.5) % 50}/50`, rx, win.y + 3, 0xdcdcdc);
  R(x, rx, win.y + 10, rw, 2, 0x3a3d44); R(x, rx, win.y + 10, Math.round(rw * (((lt * 0.5) % 50) / 50)), 2, 0x40c070);
  const gy = win.y + 15, gh = Math.round(win.h * 0.38);
  R(x, rx, gy, rw, gh, 0x16171a);
  let prev = null;
  for (let i = 0; i < rw; i++) {
    const v = Math.exp(-i / (rw * 0.3)) * 0.85 + 0.08 + hsh(i, Math.floor(lt)) * 0.06;
    const yy = gy + gh - 2 - Math.round(v * (gh - 4));
    if (prev != null) L(x, rx + i - 1, prev, rx + i, yy, 0x3fd0c0);
    prev = yy;
  }
  T(x, 'LOSS', rx + 2, gy + 2, 0x7a7c84);
  const by = gy + gh + 3;
  ['GPU', 'VRAM'].forEach((s, i) => {
    T(x, s, rx, by + i * 8, 0xbcbec4);
    const f = i ? 0.9 : 0.97 + Math.sin(t * 7) * 0.03;
    R(x, rx + 18, by + i * 8 + 1, rw - 18, 3, 0x3a3d44); R(x, rx + 18, by + i * 8 + 1, Math.round((rw - 18) * f), 3, i ? 0x9a6aff : 0x76b900);
  });
  T(x, `${Math.round(97 + Math.sin(t * 7) * 2)}%`, rx, by + 17, 0x76b900);
  taskbar(x, c, { task: 'RENDER', taskIcon: 'code' });
  drawPointer(x, c);
}

// --- Drömdatorn: neonstad i regn ---
function drom(x, c) {
  const { W, H, lt, t, year } = c;
  x.drawImage(layer('neon', W, H, (g) => {
    R(g, 0, 0, W, H, 0x120a22); vgrad(g, 0, 0, W, H * 0.6, 0x0a0620, 0x4a1a5a);
    for (let i = 0; i < 30; i++) P(g, hsh(i, 1) * W, hsh(i, 2) * H * 0.3, 0xc8b8ff);
    for (let i = 0; i < W; i += 7) { const hgt = 20 + hsh(i, 3) * 30; R(g, i, H * 0.62 - hgt, 6, hgt, 0x1a1030); for (let k = 0; k < 10; k++) if (hsh(i, k + 9) > 0.55) P(g, i + 1 + (k % 2) * 3, H * 0.62 - hgt + 3 + k * 3, hsh(i, k) > 0.5 ? 0xffd070 : 0x70e0ff); }
    for (let i = -4; i < W; i += 16) {
      const hgt = 38 + hsh(i + 50, 3) * 22;
      R(g, i, H * 0.72 - hgt, 14, hgt, 0x0c0818);
      for (let yy = H * 0.72 - hgt + 3; yy < H * 0.72 - 2; yy += 4) for (let xx = i + 2; xx < i + 13; xx += 3) if (hsh(xx, yy) > 0.6) R(g, xx, yy, 2, 2, hsh(yy, xx) > 0.5 ? 0x3a2a5a : 0xffc860);
    }
    R(g, 0, H * 0.72, W, H * 0.28, 0x0a0812);
    for (let r = 0; r < H * 0.28; r++) { g.globalAlpha = 0.25 * (1 - r / (H * 0.28)); R(g, 0, H * 0.72 + r, W, 1, 0x6a2a8a); }
    g.globalAlpha = 1;
    for (let i = 0; i < 9; i++) { const lx = W / 2 + (i - 4) * (6 + i); L(g, W / 2, H * 0.72, lx * 1.6 - W * 0.3, H, 0x1a1428); }
  }), 0, 0);
  // neonskyltar med sken och reflexer
  const signs = [[0.12, 0.28, 0xff3ea5, 14], [0.7, 0.24, 0x3ae8ff, 18], [0.45, 0.36, 0xffe03a, 10], [0.88, 0.4, 0xff3ea5, 9]];
  x.save(); x.globalCompositeOperation = 'lighter';
  for (const [sx, sy, colr, w] of signs) {
    const flick = hsh(Math.floor(t * 12), sx * 100) > 0.06 ? 1 : 0.3;
    x.globalAlpha = 0.25 * flick; R(x, sx * W - 3, sy * H - 3, w + 6, 9, colr);
    x.globalAlpha = flick; R(x, sx * W, sy * H, w, 3, colr); R(x, sx * W + 1, sy * H + 1, w - 2, 1, 0xffffff);
    x.globalAlpha = 0.18 * flick; R(x, sx * W, H * 0.74 + (sy * H) * 0.3, w, 10, colr);
  }
  x.restore(); x.globalAlpha = 1;
  // bil med bakljus
  const carW = Math.round(W * 0.2), cx = Math.round(W / 2 - carW / 2 + Math.sin(lt * 0.7) * 3), cy = Math.round(H * 0.8);
  R(x, cx, cy, carW, 7, 0x14101c); R(x, cx + 3, cy - 4, carW - 6, 4, 0x1c1828); R(x, cx + 4, cy - 3, carW - 8, 2, 0x3a4a6a);
  x.save(); x.globalCompositeOperation = 'lighter';
  x.globalAlpha = 0.35; R(x, cx - 3, cy + 1, 10, 5, 0xff2020); R(x, cx + carW - 7, cy + 1, 10, 5, 0xff2020);
  x.globalAlpha = 1; R(x, cx + 1, cy + 2, 5, 2, 0xff4040); R(x, cx + carW - 6, cy + 2, 5, 2, 0xff4040);
  x.globalAlpha = 0.2; R(x, cx + 1, cy + 8, 5, 8, 0xff2020); R(x, cx + carW - 6, cy + 8, 5, 8, 0xff2020);
  x.restore(); x.globalAlpha = 1;
  // regn
  x.globalAlpha = 0.35;
  for (let i = 0; i < 40; i++) { const rx = (hsh(i, 1) * W + lt * 30) % W, ry = (hsh(i, 2) * H + lt * 140) % H; L(x, rx, ry, rx - 1, ry + 3, 0xb0c0ff); }
  x.globalAlpha = 1;
  const fps = year < 2013 ? ['1080P', '60 FPS'] : year < 2019 ? ['1440P', '144 FPS'] : ['4K', '240 FPS'];
  x.globalAlpha = 0.6; R(x, 1, 1, 42, 14, 0x000000); x.globalAlpha = 1;
  T(x, fps[1], 3, 3, 0x45ff7a); T(x, fps[0] + (year >= 2019 ? ' RT PÅ' : ' ULTRA'), 3, 9, 0xffffff);
}

// --- Allmänt skrivbord (när kundens program saknas) ---
function genericDesktop(x, c) {
  const { W, H, os } = c;
  if (os === 'win31') return win31Desk(x, c);
  wallpaper(x, c);
  if (os === 'win95' || os === 'win98') desktopIcons(x, c, [['pc', 'DATORN'], ['bin', 'KORGEN']]);
  else if (os === 'xp') icon(x, 'bin', W - 14, H - 25);
  else desktopIcons(x, c, [['bin', 'KORGEN']]);
  const win = osWindow(x, c, Math.round(W * 0.22), 6, Math.round(W * 0.7), H - 26, 'DOKUMENT', {});
  ['folder', 'folder', 'doc', 'doc', 'sheet'].forEach((k, i) => { const ix = win.x + 3 + (i % 4) * 16, iy = win.y + 2 + Math.floor(i / 4) * 16; if (iy + 12 < win.y + win.h) { icon(x, k, ix, iy); greek(x, ix, iy + 11, 11, 0x303030, i); } });
  taskbar(x, c, { task: 'DOKUMENT', taskIcon: 'folder' });
  drawPointer(x, c);
}

const DOS_APPS = new Set(['dos-kontor', 'lotus', 'hemdator', 'cad', 'doom', 'multimedia']);
const APPS = {
  'dos-kontor': wordPerfect, lotus, hemdator: adventure, cad, win31: (x, c) => (c.os === 'win31' ? win31Desk(x, c) : win95Desk(x, c)),
  doom, multimedia: myst, win95: (x, c) => (c.os === 'win95' || c.os === 'win98' ? win95Desk(x, c) : genericDesktop(x, c)), quake, internet,
  cs, kontor2000, wow, htpc, crysis, kontor, skola, minecraft, gaming, stream, vr, ai, drom,
};
