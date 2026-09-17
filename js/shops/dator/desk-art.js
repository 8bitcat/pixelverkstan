// Skrivbordsscenens 2D-pixelgrafik: datorns insida bakom glaset, baksidan med uttag
// och kontakterna man kopplar in. Skärmens innehåll ritas i desk-screen.js.
import { drawText } from '../../core/pixfont.js';
import { rainbow, hex, shade, mix } from '../../core/raster.js';

export { drawScreen } from './desk-screen.js';

const css = (c) => '#' + (c >>> 0).toString(16).padStart(6, '0').slice(-6);
const R = (x, a, b, w, h, c) => { x.fillStyle = typeof c === 'number' ? css(c) : c; x.fillRect(a, b, w, h); };
const P = (x, a, b, c) => R(x, a, b, 1, 1, c);
const hash = (a, b) => { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const lum = (c) => ((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + (c & 255) * 0.11;
const hx = (s, d) => (typeof s === 'string' && s[0] === '#' ? hex(s) : typeof s === 'number' ? s : d);
function disc(x, cx, cy, r, c) {
  x.fillStyle = typeof c === 'number' ? css(c) : c;
  for (let dy = -Math.floor(r); dy <= Math.floor(r); dy++) { const w = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)) + 0.5); x.fillRect(cx - w, cy + dy, w * 2 + 1, 1); }
}
function ring(x, cx, cy, r, c) {
  x.fillStyle = typeof c === 'number' ? css(c) : c;
  const n = Math.max(12, Math.round(r * 7));
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; x.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r), 1, 1); }
}
const ZINC = 0xb9bec3, ZINC_D = 0x8a8f95, ZINC_L = 0xdfe3e6;

// ======================= Baksidan, 90×160 px =======================
// Strömbrytarens plats: nätagget sitter uppe i klassiska chassin, nere i moderna
export const switchRect = (kind) => (kind === 'classic' ? { x: 30, y: 12, w: 9, h: 13 } : { x: 30, y: 131, w: 9, h: 13 });

const overlaps = (a, b, m = 1) => a.x < b.x + b.w + m && a.x + a.w + m > b.x && a.y < b.y + b.h + m && a.y + a.h + m > b.y;
function freeSpot(ports, w, h, x0, y0, x1, y1, taken = []) {
  for (let y = y0; y + h <= y1; y++) for (let x = x0; x + w <= x1; x++) {
    const r = { x, y, w, h };
    if (!ports.some((p) => overlaps(r, p)) && !taken.some((p) => overlaps(r, p))) return r;
  }
  return null;
}

const REAR_CACHE = new Map();
export function drawRear(x, b, st, t, plugged, ctx) {
  const p = b.placed, W = 90, H = 160, ports = ctx.ports, rig = ctx.rig, era = ctx.era || {};
  const classic = rig.geo.kind === 'classic', year = era.year || rig.year || 2020;
  const cs = p.case || { look: {} };
  const key = [cs.id, cs.look?.color, year, rig.geo.kind, era.at, ports.map((q) => q.key + q.x + ',' + q.y).join(';'), p.gpu?.id || p.gpu?.name, p.gpu?.std, p.gpu?.len, p.snd?.id || p.snd?.name, !!(rig.ACTION?.ctrl_card && rig.actDone(b, 'ctrl_card')), p.mb?.audio, (cs.fans || []).join()].join('|');
  let base = REAR_CACHE.get(key);
  if (!base) {
    if (REAR_CACHE.size > 12) REAR_CACHE.clear();
    base = document.createElement('canvas'); base.width = W; base.height = H;
    const g = base.getContext('2d');
    base.info = drawRearBase(g, b, ctx, classic, year);
    REAR_CACHE.set(key, base);
  }
  x.save();
  x.setTransform(x.canvas.width / W, 0, 0, x.canvas.height / H, 0, 0);
  x.imageSmoothingEnabled = false;
  x.drawImage(base, 0, 0);
  // rörligt: fläktar, lampor, strömbrytare
  const info = base.info;
  if (info.psuFan) fanBlades(x, info.psuFan, st.powered && st.psuOn !== false ? t * 16 : 0.3, info.psuFan.guard, info.psuFan.metal);
  if (info.caseFan) {
    const on = st.powered && b.cables?.has?.('case_fans');
    fanBlades(x, info.caseFan, on ? t * 14 : 0.9, info.caseFan.guard, info.caseFan.metal);
    if (cs.rgb && st.powered && st.lit?.case) ring(x, info.caseFan.cx, info.caseFan.cy, info.caseFan.r - 0.5, rainbow(t, 9));
  }
  for (const port of ports) {
    if (port.type === 'lan') {
      P(x, port.x + 1, port.y + 1, st.powered ? 0x45ff7a : 0x1e4a24); P(x, port.x + 2, port.y + 1, st.powered ? 0x45ff7a : 0x1e4a24);
      const act = st.powered && Math.floor(t * 7) % 3 !== 0;
      P(x, port.x + port.w - 3, port.y + 1, act ? 0xffc030 : 0x4a3a10); P(x, port.x + port.w - 2, port.y + 1, act ? 0xffc030 : 0x4a3a10);
    }
  }
  if (info.ctrlLed) P(x, info.ctrlLed[0], info.ctrlLed[1], st.powered && Math.floor(t * 9) % 4 === 0 ? 0xff3020 : 0x4a1010);
  drawSwitch(x, rig.geo.kind, !!era.at, !!st.psuOn, year);
  for (const [id, pk] of Object.entries(plugged || {})) {
    const port = ports.find((q) => q.key === pk);
    if (!port || !ctx.plugs?.[id]) continue;
    drawPlugHead(x, ctx.plugs[id].type, port.x + port.w / 2, port.y + port.h / 2, era);
  }
  x.restore();
}

function drawRearBase(x, b, ctx, classic, year) {
  const p = b.placed, W = 90, H = 160, { ports, rig, era } = ctx;
  const cs = p.case || { look: {} };
  const beige = cs.look?.front?.startsWith('beige');
  const col = hx(cs.look?.color, beige ? 0xd9d2bc : 0x2a2b2f), light = lum(col) > 130;
  const info = {};
  // plåten
  R(x, 0, 0, W, H, col);
  for (let i = 0; i < 260; i++) P(x, Math.floor(hash(i, 1) * W), Math.floor(hash(i, 2) * H), shade(col, hash(i, 3) > 0.5 ? 1.05 : 0.94));
  R(x, 0, 0, W, 1, shade(col, 1.25)); R(x, 0, 0, 1, H, shade(col, 1.15)); R(x, W - 1, 0, 1, H, shade(col, 0.7)); R(x, 0, H - 1, W, 1, shade(col, 0.65));
  R(x, 83, 0, 1, H, shade(col, 0.82)); R(x, 84, 0, 1, H, shade(col, 1.08));
  for (const sy of [3, 76, 152]) thumbScrew(x, 86, sy, light ? 0xa8acb0 : 0x6a6e74);
  // nätagget
  const psuY = classic ? 5 : 124;
  info.psuFan = psuBody(x, psuY, era, year, classic);
  // I/O
  const mbPorts = ports.filter((q) => q.owner === 'mb' || q.owner === 'io');
  if (classic && era.at) atIO(x, col, ports);
  else info.shield = ioShield(x, mbPorts, ports, classic, year, p.mb);
  // bakre chassifläkt
  if ((cs.fans || []).includes('rear')) info.caseFan = placeCaseFan(x, ports, info.shield, classic, year, col);
  // kortplatser och kort
  slotsAndCards(x, b, ctx, classic, year, col, info);
  for (const port of ports) drawPort(x, port, year, rig.geo.kind);
  return info;
}
function thumbScrew(x, cx, cy, c) {
  R(x, cx - 2, cy, 4, 4, shade(c, 0.7)); R(x, cx - 1, cy - 1, 2, 6, shade(c, 0.7));
  R(x, cx - 1, cy, 2, 4, c); P(x, cx - 1, cy, shade(c, 1.3)); P(x, cx, cy + 3, shade(c, 0.5));
}
function screw(x, cx, cy) { R(x, cx - 1, cy - 1, 3, 3, 0x9aa0a6); P(x, cx, cy - 1, 0x4a4e52); P(x, cx - 1, cy, 0x4a4e52); P(x, cx, cy, 0x4a4e52); P(x, cx + 1, cy, 0x4a4e52); P(x, cx, cy + 1, 0x4a4e52); P(x, cx - 1, cy - 1, 0xe0e4e8); }

function psuBody(x, y0, era, year, classic) {
  const at = !!era.at;
  const zinc = at || year < 2003;
  const body = zinc ? (at && year < 1990 ? 0xa9aeb3 : ZINC) : 0x1c1c1f;
  R(x, 5, y0, 80, 32, 0x0e0e10);
  R(x, 6, y0 + 1, 78, 30, body);
  if (zinc) for (let i = 0; i < 30; i += 2) R(x, 6, y0 + 1 + i, 78, 1, shade(body, hash(i, 7) > 0.5 ? 1.03 : 0.97));
  else for (let i = 0; i < 90; i++) P(x, 6 + Math.floor(hash(i, 8) * 78), y0 + 1 + Math.floor(hash(i, 9) * 30), 0x26262a);
  R(x, 6, y0 + 1, 78, 1, shade(body, 1.3)); R(x, 6, y0 + 30, 78, 1, shade(body, 0.6));
  for (const [sx, sy] of [[8, y0 + 3], [81, y0 + 3], [8, y0 + 28], [81, y0 + 28]]) screw(x, sx, sy);
  // intag (C14)
  // (själva uttaget ritas som port)
  // fläkt: galler
  const modernPsu = !classic;
  const fan = { cx: 64, cy: y0 + 16, r: 12, metal: body };
  if (modernPsu) {
    R(x, 46, y0 + 3, 36, 26, 0x0a0a0c);
    fan.guard = 'hex';
  } else {
    disc(x, fan.cx, fan.cy, fan.r + 1, 0x0a0a0c);
    fan.guard = zinc ? (at ? 'wire' : 'holes') : 'wire';
  }
  // 115/230 V-väljare, skärmuttag och dekal
  if (classic && year < 2004) {
    R(x, 42, y0 + 21, 5, 9, 0x2a2a2a); R(x, 43, y0 + 22, 3, 7, 0xc9323a); R(x, 43, y0 + 22, 3, 3, 0xf2f2ee);
  }
  if (classic && (at || year < 2001)) {
    R(x, 11, y0 + 22, 13, 9, 0x141416); R(x, 12, y0 + 23, 11, 7, 0x242428); P(x, 12, y0 + 23, 0x141416); P(x, 22, y0 + 23, 0x141416);
    R(x, 14, y0 + 25, 1, 3, 0x050505); R(x, 20, y0 + 25, 1, 3, 0x050505); R(x, 17, y0 + 27, 1, 2, 0x050505);
  }
  const sx = classic ? 48 : 8, sy = classic ? y0 + 4 : y0 + 23;
  if (classic) { R(x, 41, y0 + 3, 8, 16, 0xf2f0e6); R(x, 41, y0 + 3, 8, 3, 0x2c6fb7); for (let i = 0; i < 4; i++) R(x, 42, y0 + 8 + i * 3, 5 - (i % 2) * 2, 1, 0x6a6a6a); void sx; void sy; }
  else { R(x, 8, y0 + 24, 14, 6, 0xf2f2ee); R(x, 8, y0 + 24, 14, 2, 0xc8a040); R(x, 10, y0 + 27, 8, 1, 0x6a6a6a); R(x, 10, y0 + 28, 5, 1, 0x9a9a9a); }
  return fan;
}
function fanBlades(x, f, ang, guard, metal = ZINC) {
  const { cx, cy, r } = f;
  if (guard === 'hex') {
    // modernt nätagg: bikakegaller över fläkten
    x.save(); x.beginPath(); x.rect(46, cy - 13, 36, 26); x.clip();
    R(x, 46, cy - 13, 36, 26, 0x0a0a0c);
    x.fillStyle = '#26262a';
    for (let k = 0; k < 7; k++) { x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, r, ang + k * 0.9, ang + k * 0.9 + 0.5); x.fill(); }
    for (let yy = cy - 13; yy < cy + 14; yy += 3) for (let xx = 46; xx < 82; xx += 4) { const off = ((yy - cy + 13) / 3) & 1 ? 2 : 0; R(x, xx + off, yy, 1, 3, 0x1a1a1e); R(x, xx + off - 1, yy + 2, 4, 1, 0x1a1a1e); }
    x.restore();
    return;
  }
  x.save(); x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.clip();
  R(x, cx - r, cy - r, r * 2, r * 2, 0x0a0a0c);
  x.fillStyle = '#2e2e32';
  for (let k = 0; k < 7; k++) { x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, r - 1, ang + k * 0.9, ang + k * 0.9 + 0.48); x.fill(); }
  x.restore();
  disc(x, cx, cy, 2, 0x3a3a3e);
  if (guard === 'wire') {
    for (const rr of [4, 8, r - 0.5]) ring(x, cx, cy, rr, 0x9a9ea4);
    R(x, cx - r, cy, r * 2 + 1, 1, 0x9a9ea4); R(x, cx, cy - r, 1, r * 2 + 1, 0x9a9ea4);
  } else if (guard === 'holes') {
    // stansade hål i plåten: rita plåt med runda hål ovanpå
    x.save(); x.beginPath(); x.arc(cx, cy, r + 1, 0, Math.PI * 2); x.clip();
    for (let yy = cy - r - 1; yy <= cy + r + 1; yy += 4) for (let xx = cx - r - 1; xx <= cx + r + 1; xx += 4) { R(x, xx + 3, yy, 1, 4, metal); R(x, xx, yy + 3, 4, 1, metal); P(x, xx + 2, yy, metal); P(x, xx, yy + 2, metal); }
    x.restore();
  } else {
    for (let yy = cy - r; yy <= cy + r; yy += 3) R(x, cx - r, yy, r * 2, 1, 'rgba(120,124,130,.55)');
  }
}
function drawSwitch(x, kind, at, on, year) {
  const S = switchRect(kind);
  if (at) {
    R(x, S.x - 2, S.y - 2, S.w + 4, S.h + 4, 0x141414);
    R(x, S.x, S.y, S.w, S.h, on ? 0xe8343c : 0xa01c24);
    if (on) { R(x, S.x, S.y, S.w, 6, 0xc02a30); R(x, S.x, S.y + 6, S.w, 1, 0x7a1418); R(x, S.x, S.y + 7, S.w, 1, 0xff6a70); }
    else { R(x, S.x, S.y + 7, S.w, 6, 0xc02a30); R(x, S.x, S.y + 6, S.w, 1, 0xff6a70); R(x, S.x, S.y + 5, S.w, 1, 0x7a1418); }
    drawText(x, 'I', S.x + 3, S.y + 1, '#fff'); R(x, S.x + 3, S.y + 8, 3, 3, '#fff'); R(x, S.x + 4, S.y + 9, 1, 1, on ? 0xc02a30 : 0xa01c24);
    return;
  }
  R(x, S.x - 1, S.y - 1, S.w + 2, S.h + 2, 0x050505);
  R(x, S.x, S.y, S.w, S.h, 0x161618);
  if (on) { R(x, S.x + 1, S.y + 1, S.w - 2, 6, 0x3a3a3e); R(x, S.x + 1, S.y + 1, S.w - 2, 1, 0x5a5a60); R(x, S.x + 1, S.y + 7, S.w - 2, 5, 0x242428); }
  else { R(x, S.x + 1, S.y + 6, S.w - 2, 6, 0x3a3a3e); R(x, S.x + 1, S.y + 11, S.w - 2, 1, 0x5a5a60); R(x, S.x + 1, S.y + 1, S.w - 2, 5, 0x242428); }
  drawText(x, 'I', S.x + 3, S.y + 1 + (on ? 1 : 0), on ? '#f0f0f0' : '#8a8a8a');
  R(x, S.x + 3, S.y + 7 + (on ? 0 : 1), 3, 3, on ? '#8a8a8a' : '#f0f0f0'); R(x, S.x + 4, S.y + 8 + (on ? 0 : 1), 1, 1, on ? 0x242428 : 0x3a3a3e);
  void year;
}

function atIO(x, col, ports) {
  // AT-lådan: DIN-hålet i plåten och utstansade D-sub-hål (några tomma)
  R(x, 6, 42, 72, 20, shade(col, 0.92));
  R(x, 6, 42, 72, 1, shade(col, 1.12)); R(x, 6, 61, 72, 1, shade(col, 0.75));
  for (const [kx, ky, kw] of [[28, 55, 14], [46, 55, 26], [8, 58, 14]]) {
    const r = { x: kx, y: ky, w: kw, h: 5 };
    if (ports.some((q) => overlaps(r, q, 0))) continue;
    R(x, kx, ky, kw, 1, shade(col, 0.7)); R(x, kx, ky + 4, kw, 1, shade(col, 1.15)); R(x, kx, ky, 1, 5, shade(col, 0.7)); R(x, kx + kw - 1, ky, 1, 5, shade(col, 1.15));
    P(x, kx - 2, ky + 2, shade(col, 0.6)); P(x, kx + kw + 1, ky + 2, shade(col, 0.6));
  }
}
function ioShield(x, mbPorts, ports, classic, year, mb) {
  let x0 = 7, y0 = classic ? 42 : 9, x1 = 39, y1 = classic ? 92 : 79;
  for (const q of mbPorts) { x0 = Math.min(x0, q.x - 3); y0 = Math.min(y0, q.y - 3); x1 = Math.max(x1, q.x + q.w + 3); y1 = Math.max(y1, q.y + q.h + 3); }
  const decor = [];
  const shieldCol = year >= 2013 ? 0x2c2e33 : year >= 2006 ? 0x9ea3a8 : ZINC;
  const dark = lum(shieldCol) < 90;
  // inbyggt ljud och moderna extrauttag
  const hasAudio = mb?.audio !== false && (mb?.audio || year >= 2002);
  if (hasAudio) {
    const n = classic ? 3 : 6, w = classic ? 6 : 13, h = classic ? 16 : 17;
    const spot = freeSpot(ports, w, h, x0 + 2, y0 + 2, x1 + 12, Math.min(classic ? 96 : 82, y1 + 16));
    if (spot) { decor.push({ ...spot, kind: 'audio', n }); x1 = Math.max(x1, spot.x + w + 2); y1 = Math.max(y1, spot.y + h + 2); }
  }
  if (!classic && year >= 2015) { const s = freeSpot(ports, 6, 5, x0 + 2, y0 + 2, x1 - 2, y1 - 2, decor); if (s) decor.push({ ...s, kind: 'bios' }); }
  if (!classic && year >= 2017) { const s = freeSpot(ports, 7, 4, x0 + 2, y0 + 2, x1 - 2, y1 - 2, decor); if (s) decor.push({ ...s, kind: 'usbc' }); }
  if (!classic && year >= 2016) { const s = freeSpot(ports, 5, 11, x0 + 2, y0 + 2, x1 - 2, y1 - 2, decor); if (s) decor.push({ ...s, kind: 'wifi' }); }
  R(x, x0 - 1, y0 - 1, x1 - x0 + 2, y1 - y0 + 2, 0x101012);
  R(x, x0, y0, x1 - x0, y1 - y0, shieldCol);
  R(x, x0, y0, x1 - x0, 1, shade(shieldCol, 1.3)); R(x, x0, y0, 1, y1 - y0, shade(shieldCol, 1.2)); R(x, x0, y1 - 1, x1 - x0, 1, shade(shieldCol, 0.7));
  // ventilationshål där det är tomt
  for (let yy = y0 + 3; yy < y1 - 3; yy += 3) for (let xx = x0 + 3; xx < x1 - 3; xx += 3) {
    const r = { x: xx - 1, y: yy - 1, w: 3, h: 3 };
    if (!ports.some((q) => overlaps(r, q, 1)) && !decor.some((d) => overlaps(r, d, 1)) && (xx + yy) % 2 === 0) P(x, xx, yy, shade(shieldCol, dark ? 0.55 : 0.62));
  }
  // prägling runt uttagen
  for (const q of mbPorts) { R(x, q.x - 1, q.y - 1, q.w + 2, 1, shade(shieldCol, dark ? 1.4 : 0.8)); R(x, q.x - 1, q.y + q.h, q.w + 2, 1, shade(shieldCol, dark ? 0.7 : 1.15)); }
  for (const d of decor) {
    if (d.kind === 'audio') {
      const cols = year >= 1999 ? [0x3aa0e8, 0x7ac83a, 0xe86aa0, 0xf08a20, 0x2a2a2a, 0x9a9aa0] : [0x1a1a1a, 0x1a1a1a, 0x1a1a1a];
      for (let i = 0; i < d.n; i++) {
        const cx = d.x + 3 + (d.n > 3 ? (i % 2) * 7 : 0), cy = d.y + 3 + (d.n > 3 ? Math.floor(i / 2) : i) * 5;
        if (d.n > 3 && i === 5) { R(x, cx - 2, cy - 2, 5, 4, 0x2a2a2a); P(x, cx, cy - 1, 0xd83030); continue; }
        disc(x, cx, cy, 2, cols[i]); P(x, cx, cy, 0x050505); P(x, cx - 1, cy - 1, shade(cols[i], 1.4));
      }
    } else if (d.kind === 'bios') { R(x, d.x, d.y, 6, 5, 0x1a1a1a); R(x, d.x + 1, d.y + 1, 4, 3, 0x6a6a70); P(x, d.x + 5, d.y, 0x3aa0ff); }
    else if (d.kind === 'usbc') { R(x, d.x, d.y, 7, 4, 0xa8acb0); R(x, d.x + 1, d.y + 1, 5, 2, 0x0c0c0c); R(x, d.x + 2, d.y + 1, 3, 1, 0x3a3a3a); P(x, d.x, d.y, shieldCol); P(x, d.x + 6, d.y, shieldCol); P(x, d.x, d.y + 3, shieldCol); P(x, d.x + 6, d.y + 3, shieldCol); }
    else if (d.kind === 'wifi') { for (const dy of [0, 6]) { R(x, d.x, d.y + dy, 5, 5, 0xc8a040); R(x, d.x + 1, d.y + dy + 1, 3, 3, 0xe8c860); P(x, d.x + 2, d.y + dy + 2, 0x3a2a10); } }
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
function placeCaseFan(x, ports, shield, classic, year, col) {
  const cands = classic ? [[64, 64, 15], [65, 70, 13], [66, 60, 12], [68, 72, 10]] : [[62, 40, 19], [63, 44, 17], [65, 48, 14], [67, 50, 12]];
  for (const [cx, cy, r] of cands) {
    const rect = { x: cx - r - 2, y: cy - r - 2, w: r * 2 + 5, h: r * 2 + 5 };
    if (rect.x + rect.w > 83 || ports.some((q) => overlaps(rect, q, 0)) || (shield && overlaps(rect, shield, 0))) continue;
    // ram och skruvar
    R(x, rect.x, rect.y, rect.w, rect.h, shade(col, 0.85));
    const frame = 0x141416;
    R(x, cx - r - 1, cy - r - 1, r * 2 + 3, r * 2 + 3, frame);
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const px = cx + sx * (r - 1), py = cy + sy * (r - 1); R(x, px - 1, py - 1, 3, 3, 0x2a2a2e); P(x, px, py, 0x050505); }
    return { cx, cy, r, guard: year >= 2006 ? 'wire' : 'holes', metal: col };
  }
  return null;
}

function slotsAndCards(x, b, ctx, classic, year, col, info) {
  const p = b.placed, { ports, rig } = ctx;
  const rows = rig.geo.rows, step = classic ? 8 : 7, slotY = classic ? 98 : 84, n = classic ? rows.length : 5;
  const dark = lum(col) < 90;
  R(x, 6, slotY - 2, 74, n * step + 2, shade(col, 0.7));
  const used = new Map();
  const idx = (v) => Math.max(0, rows.indexOf(v));
  if (p.gpu) {
    const i = classic ? idx(rig.rowOf('gpu').v) : 0;
    const dual = classic ? year >= 2004 && (p.gpu.len || 2) >= 2 : true;
    used.set(i, 'gpu'); if (dual && i + 1 < n) used.set(i + 1, 'gpu2');
  }
  if (p.snd) used.set(classic ? idx(rig.rowOf('snd').v) : 2, 'snd');
  const ctrl = rig.ACTION?.ctrl_card && rig.actDone(b, 'ctrl_card');
  if (ctrl) used.set(idx(rig.ACTION.ctrl_card.row.v), 'ctrl');
  for (let i = 0; i < n; i++) {
    const y0 = slotY + i * step, u = used.get(i);
    if (u === 'gpu2') continue;
    if (!u) {
      const cover = dark && !classic ? 0x1e1e22 : ZINC;
      R(x, 8, y0, 68, step - 2, cover); R(x, 8, y0, 68, 1, shade(cover, 1.25)); R(x, 8, y0 + step - 3, 68, 1, shade(cover, 0.7));
      if (!classic) for (let k = 0; k < 11; k++) R(x, 14 + k * 5, y0 + 2, 3, 1, 0x050505);
      else if (year >= 1995) { R(x, 20, y0 + 2, 18, 1, shade(cover, 0.6)); R(x, 44, y0 + 2, 18, 1, shade(cover, 0.6)); }
      else disc(x, 60, y0 + 2, 1, shade(cover, 0.5));
      screw(x, 79, y0 + 2);
      continue;
    }
    const dual = u === 'gpu' && used.get(i + 1) === 'gpu2';
    const h = dual ? step * 2 : step;
    const bc = u === 'gpu' && !classic && year >= 2016 ? 0x1c1c20 : 0xc8ccd0;
    R(x, 7, y0 - 1, 71, h, 0x0e0e10);
    R(x, 8, y0 - 1, 69, h - 1, bc); R(x, 8, y0 - 1, 69, 1, shade(bc, 1.2)); R(x, 76, y0 - 1, 1, h - 1, shade(bc, 0.7));
    screw(x, 79, y0 + 2);
    const mine = ports.filter((q) => q.owner === u);
    let fx = Math.max(12, ...mine.map((q) => q.x + q.w + 2));
    if (u === 'gpu') {
      const std = p.gpu.std || '3D';
      const room = 74 - fx;
      if ((std === 'MDA' || std === 'HGC') && room >= 26) dsubDecor(x, fx, y0 + (h - 7) / 2 | 0, 26, 7, 0x1a1a1a, 12, true);
      else if (std === 'CGA' && room >= 12) { disc(x, fx + 3, y0 + 3, 2, 0xe8c030); P(x, fx + 3, y0 + 3, 0x101010); drawDip(x, fx + 8, y0 + 1, 2); }
      else if (std === 'EGA' && room >= 12) drawDip(x, fx, y0 + 1, 4);
      else if (std === '3D' && year < 2010 && room >= 6) { disc(x, fx + 3, y0 + 3, 2, 0x1a1a1a); P(x, fx + 2, y0 + 2, 0xb0b0b0); P(x, fx + 4, y0 + 2, 0xb0b0b0); P(x, fx + 3, y0 + 4, 0xb0b0b0); fx += 7; }
      if (dual || (year >= 2004 && std === '3D')) {
        const vy0 = dual ? y0 + 7 : y0 + 1, vy1 = y0 + h - 3;
        for (let yy = vy0; yy < vy1; yy += 2) for (let xx = (dual ? 12 : fx + 2); xx < 72; xx += 4) R(x, xx, yy, 3, 1, bc === 0x1c1c20 ? 0x050505 : 0x3a3e42);
      }
    } else if (u === 'snd') {
      const jy = y0 + 2;
      const colored = year >= 1998;
      [[20, colored ? 0xe86aa0 : 0x1a1a1a], [26, colored ? 0x3aa0e8 : 0x1a1a1a]].forEach(([jx, c]) => { if (!ports.some((q) => overlaps({ x: jx - 2, y: jy - 2, w: 5, h: 5 }, q, 0))) { disc(x, jx, jy + 1, 2, c); P(x, jx, jy + 1, 0x050505); } });
      if (fx < 60) { R(x, 60, y0, 6, 5, 0x2a2a2a); for (let k = 0; k < 6; k++) P(x, 60 + k, y0 + 1 + (k % 2), 0x5a5a5a); }
    } else if (u === 'ctrl') {
      for (let k = 0; k < 6; k++) R(x, 16 + k * 6, y0 + 2, 4, 1, 0x5a5e62);
      disc(x, 62, y0 + 2, 1, 0x1a1a1a); info.ctrlLed = [62, y0 + 2];
    }
  }
}
function drawDip(x, a, b2, n) {
  R(x, a, b2, n * 3 + 1, 5, 0xc02a2a);
  for (let i = 0; i < n; i++) { R(x, a + 1 + i * 3, b2 + 1, 2, 3, 0xf2f2ee); R(x, a + 1 + i * 3, b2 + (i % 2 ? 1 : 2), 2, 2, 0xe8e8e0); P(x, a + 1 + i * 3, b2 + (i % 2 ? 3 : 1), 0x5a1010); }
}
function dsubDecor(x, a, b2, w, h, insert, holes, female) {
  dsub(x, { x: a, y: b2, w, h }, insert, [Math.ceil(holes / 2), Math.floor(holes / 2)], !female);
}

// ---------- Uttag ----------
function dsub(x, port, insert, rows, male, shell = 0xb4b9be) {
  const { x: px, y: py, w, h } = port;
  // sexkantsbultar
  const my = py + Math.floor(h / 2) - 1;
  R(x, px, my, 2, 2, 0x6a6e74); P(x, px, my, 0xc8ccd0); R(x, px + w - 2, my, 2, 2, 0x6a6e74); P(x, px + w - 2, my, 0xc8ccd0);
  const sx0 = px + 2, sw = w - 4;
  R(x, sx0, py, sw, h, shell); R(x, sx0, py, sw, 1, shade(shell, 1.2));
  R(x, sx0 + 1, py + 1, sw - 2, h - 2, insert);
  P(x, sx0 + 1, py + h - 2, shell); P(x, sx0 + sw - 2, py + h - 2, shell);
  P(x, sx0, py + h - 1, 0x2a2a2a); P(x, sx0 + sw - 1, py + h - 1, 0x2a2a2a);
  const inner = sw - 4;
  rows.forEach((n, r) => {
    const yy = py + 2 + Math.round((r * (h - 5)) / Math.max(1, rows.length - 1));
    for (let i = 0; i < n; i++) {
      const xx = sx0 + 2 + r + Math.round((i * (inner - r * 2)) / Math.max(1, n - 1 + (r ? 0 : 0)));
      if (xx >= sx0 + sw - 2) continue;
      P(x, xx, yy, male ? 0xe8e8e8 : 0x050505);
    }
  });
}
function drawPort(x, port, year, kind) {
  const { x: px, y: py, w, h, type } = port;
  const pc99 = year >= 1999;
  switch (type) {
    case 'usb': {
      R(x, px, py, w, h, 0xc8ccd0); R(x, px, py + h - 1, w, 1, 0x8a8e94);
      R(x, px + 1, py + 1, w - 2, h - 2, 0x0a0a0a);
      const usb3 = kind === 'modern' && year >= 2011 && (year >= 2015 || /USB_[12]/.test(port.key));
      R(x, px + 1, py + 1, w - 2, 2, usb3 ? 0x2d63c8 : year >= 2004 ? 0x1e1e1e : 0xe8e8e8);
      break;
    }
    case 'hdmi':
      R(x, px, py, w, h - 2, 0xc8ccd0); R(x, px + 1, py + h - 2, w - 2, 1, 0xc8ccd0); R(x, px + 2, py + h - 1, w - 4, 1, 0xc8ccd0);
      R(x, px + 1, py + 1, w - 2, h - 3, 0x0a0a0a); R(x, px + 2, py + h - 2, w - 4, 1, 0x0a0a0a);
      R(x, px + 3, py + 2, w - 6, 1, 0x2a2a2a); break;
    case 'dp':
      R(x, px, py, w, h, 0xc8ccd0); R(x, px + w - 2, py + h - 2, 2, 2, 0x2a2a2e); P(x, px + w - 3, py + h - 1, 0x2a2a2e);
      R(x, px + 1, py + 1, w - 2, h - 2, 0x0a0a0a); R(x, px + w - 3, py + h - 3, 2, 2, 0xc8ccd0);
      R(x, px + 2, py + 2, w - 5, 1, 0x2a2a2a); break;
    case 'dvi': {
      R(x, px, py + 2, 2, 2, 0x6a6e74); R(x, px + w - 2, py + 2, 2, 2, 0x6a6e74);
      R(x, px + 2, py, w - 4, h, 0xc8ccd0); R(x, px + 3, py + 1, w - 6, h - 2, 0xf2f0e6);
      R(x, px + 4, py + 2, 3, 1, 0x1a1a1a); P(x, px + 4, py + 1, 0x1a1a1a); P(x, px + 6, py + 1, 0x1a1a1a); P(x, px + 4, py + 3, 0x1a1a1a); P(x, px + 6, py + 3, 0x1a1a1a);
      for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) P(x, px + 8 + i * 2, py + 1 + r + (r > 0 ? 0 : 0), 0x3a3a3a);
      break;
    }
    case 'vga': dsub(x, port, pc99 ? 0x1f3a9a : 0x1a1a1a, [5, 5], false, 0xb4b9be); break;
    case 'de9': dsub(x, port, 0x1a1a1a, [5, 4], false); break;
    case 'serial': dsub(x, port, pc99 ? 0x1e8a8a : 0x2a2a2a, [5, 4], true); break;
    case 'parallel': dsub(x, port, pc99 ? 0xb0306a : 0x1a1a1a, [9, 8], false); break;
    case 'gameport': dsub(x, port, pc99 ? 0xd8a82a : 0x1a1a1a, [8, 7], false); break;
    case 'din5': {
      const cx = px + Math.floor(w / 2), cy = py + Math.floor(h / 2);
      disc(x, cx, cy, 5, 0x6a6e74); disc(x, cx, cy, 4, 0xb4b9be); disc(x, cx, cy, 3, 0x141414);
      for (const [dx, dy] of [[-2, 0], [2, 0], [-1, 2], [1, 2], [0, 2]]) P(x, cx + dx, cy + dy - 1, dx === 0 && dy === 2 ? 0x141414 : 0x9a9a9a);
      P(x, cx - 2, cy + 1, 0x9a9a9a); P(x, cx + 2, cy + 1, 0x9a9a9a); P(x, cx, cy + 2, 0x9a9a9a);
      R(x, cx - 1, cy - 4, 3, 2, 0xb4b9be);
      break;
    }
    case 'ps2k': case 'ps2m': {
      const c = type === 'ps2k' ? 0x7a4fb0 : 0x3f9b3a;
      R(x, px, py, w, h, c); R(x, px, py, w, 1, shade(c, 1.3)); R(x, px, py + h - 1, w, 1, shade(c, 0.7));
      const cx = px + w / 2 - 0.5, cy = py + h / 2 - 0.5;
      disc(x, Math.round(cx), Math.round(cy), 3, 0x141414);
      for (const [dx, dy] of [[-2, -1], [2, -1], [-2, 1], [2, 1], [-1, 2], [1, 2]]) P(x, Math.round(cx + dx), Math.round(cy + dy), 0x8a8a8a);
      R(x, Math.round(cx) - 1, Math.round(cy) - 1, 2, 2, 0x2a2a2a);
      break;
    }
    case 'jack': { const c = year >= 1998 ? 0x7ac83a : 0x1a1a1a; R(x, px, py, w, h, 0x2a2a2a); disc(x, px + 3, py + 2, 2, c); P(x, px + 3, py + 2, 0x050505); P(x, px + 2, py + 1, shade(c, 1.5)); break; }
    case 'lan':
      R(x, px, py, w, h, 0xb4b9be); R(x, px + 1, py + 2, w - 2, h - 3, 0x0c0c0c);
      R(x, px + 3, py + h - 1, w - 6, 1, 0x0c0c0c); R(x, px + 2, py + 3, w - 4, 1, 0x3a3a3a);
      for (let i = 0; i < 4; i++) P(x, px + 2 + i * 2, py + 3, 0xc8a040);
      break;
    case 'c13': {
      R(x, px, py, w, h, 0x0e0e10); R(x, px + 1, py + 1, w - 2, h - 2, 0x1c1c1f);
      R(x, px + 3, py + 3, w - 6, h - 6, 0x050506); P(x, px + 3, py + 3, 0x1c1c1f); P(x, px + w - 4, py + 3, 0x1c1c1f);
      R(x, px + 4, py + 7, 1, 3, 0xd0d4d8); R(x, px + w - 5, py + 7, 1, 3, 0xd0d4d8); R(x, px + Math.floor(w / 2), py + 4, 1, 3, 0xd0d4d8);
      break;
    }
  }
}

// ---------- Kontakter (sedda bakifrån, kabeln hänger nedåt) ----------
export function drawPlugHead(x, type, cx, cy, era = {}) {
  cx = Math.round(cx); cy = Math.round(cy);
  const year = era.year || 2000, pc99 = year >= 1999;
  const k = (a, b, w, h, c) => R(x, cx + a, cy + b, w, h, c);
  const cable = (w, c, len = 10, from = 4) => { k(-Math.floor(w / 2), from, w, len, c); k(-Math.floor(w / 2), from, 1, len, shade(c, 1.35)); k(Math.ceil(w / 2) - 1, from, 1, len, shade(c, 0.6)); };
  const thumb = (dx, c) => { k(dx - 1, -2, 3, 5, shade(c, 0.6)); k(dx - 1, -2, 3, 1, shade(c, 1.3)); for (let i = 0; i < 2; i++) k(dx - 1 + i * 2, 0, 1, 2, shade(c, 0.8)); k(dx, -1, 1, 3, c); };
  switch (type) {
    case 'c13':
      cable(4, 0x151517, 12, 6);
      k(-8, -7, 17, 14, 0x0c0c0e); k(-7, -6, 15, 12, 0x1e1e22); k(-7, -6, 15, 1, 0x3a3a40);
      for (let i = 0; i < 5; i++) k(-6, -3 + i * 2, 13, 1, 0x141418);
      k(-3, 6, 7, 3, 0x1e1e22); break;
    case 'hdmi':
      cable(3, 0x141416, 10, 4);
      k(-7, -4, 15, 8, 0x0c0c0e); k(-6, -3, 13, 6, 0x222226); k(-6, -3, 13, 1, 0x44444a); k(-3, -1, 7, 2, 0x303036);
      k(-2, 4, 5, 2, 0x222226); break;
    case 'dp':
      cable(3, 0x141416, 10, 4);
      k(-6, -4, 13, 8, 0x0c0c0e); k(-5, -3, 11, 6, 0x222226); k(-5, -3, 11, 1, 0x44444a); k(-2, -2, 5, 2, 0x5a5a62);
      k(-2, 4, 5, 2, 0x222226); break;
    case 'dvi': {
      const c = year < 2011 ? 0xe8e6de : 0x1c1c20;
      cable(4, year < 2011 ? 0xd8d6ce : 0x141416, 10, 4);
      k(-8, -4, 17, 8, shade(c, 0.7)); k(-7, -3, 15, 6, c); k(-7, -3, 15, 1, shade(c, 1.15));
      thumb(-10, year < 2011 ? 0xd8d6ce : 0x2a2a30); thumb(10, year < 2011 ? 0xd8d6ce : 0x2a2a30);
      break;
    }
    case 'vga': {
      const c = pc99 ? 0x2a4ab8 : 0x1c1c20;
      cable(4, pc99 ? 0x1a2a6a : 0x141416, 10, 4);
      k(-2, 8, 5, 3, 0x2a2a2e);
      k(-7, -4, 15, 8, shade(c, 0.65)); k(-6, -3, 13, 6, c); k(-6, -3, 13, 1, shade(c, 1.35));
      thumb(-9, pc99 ? 0x3a5ac8 : 0x6a6e74); thumb(9, pc99 ? 0x3a5ac8 : 0x6a6e74);
      break;
    }
    case 'de9': case 'serial': {
      const c = type === 'serial' ? 0xd8cfb4 : year < 1988 ? 0xc8c4b8 : 0x8a8e94;
      cable(3, type === 'serial' ? 0xcfc6a8 : 0xa8a49a, 10, 4);
      k(-6, -4, 13, 8, shade(c, 0.7)); k(-5, -3, 11, 6, c); k(-5, -3, 11, 1, shade(c, 1.15));
      for (let i = 0; i < 3; i++) k(-3, -1 + i * 2, 7, 1, shade(c, 0.9));
      thumb(-8, 0xb4b9be); thumb(8, 0xb4b9be);
      break;
    }
    case 'din5':
      cable(3, 0xcfc6a8, 10, 4);
      disc(x, cx, cy, 6, 0x8a8e94); disc(x, cx, cy, 5, 0xd0c8b0); disc(x, cx, cy, 2, 0xa8a090); k(-1, -6, 3, 2, 0x6a6e74);
      P(x, cx - 2, cy - 3, 0xece6d4); break;
    case 'ps2k': case 'ps2m': {
      const c = type === 'ps2k' ? 0x8a5ac8 : 0x46b040;
      cable(3, pc99 || year >= 1996 ? 0x1c1c20 : 0xcfc6a8, 10, 3);
      disc(x, cx, cy, 5, shade(c, 0.65)); disc(x, cx, cy, 4, c); disc(x, cx, cy, 2, shade(c, 0.8)); P(x, cx - 2, cy - 2, shade(c, 1.4));
      break;
    }
    case 'usb':
      cable(3, 0x1a1a1c, 10, 4);
      k(-5, -4, 11, 8, 0x101012); k(-4, -3, 9, 6, 0x2a2a2e); k(-4, -3, 9, 1, 0x4a4a52);
      P(x, cx, cy - 1, 0xb8b8c0); P(x, cx - 1, cy, 0xb8b8c0); P(x, cx + 1, cy, 0xb8b8c0); P(x, cx, cy + 1, 0xb8b8c0);
      k(-2, 4, 5, 2, 0x2a2a2e); break;
    case 'mains':
      disc(x, cx, cy, 5, 0xc8c8c4); disc(x, cx, cy, 4, 0xecece8); P(x, cx - 2, cy, 0x6a6a6a); P(x, cx + 2, cy, 0x6a6a6a); break;
  }
}

// ---------- Ikoner i lådan: prylen + kontaktens framsida ----------
function plugFace(x, type, cx, cy, era) {
  const year = era?.year || 2000, pc99 = year >= 1999;
  const k = (a, b, w, h, c) => R(x, cx + a, cy + b, w, h, c);
  const dface = (w, h, shell, insert, rows, male, thumbCol) => {
    const a = -Math.floor(w / 2), b2 = -Math.floor(h / 2);
    if (thumbCol >= 0) { k(a - 3, b2 + 1, 3, h - 2, thumbCol); k(a + w, b2 + 1, 3, h - 2, thumbCol); k(a - 2, b2 + 2, 1, h - 4, shade(thumbCol, 1.4)); k(a + w + 1, b2 + 2, 1, h - 4, shade(thumbCol, 1.4)); }
    k(a, b2, w, h, shell); k(a + 1, b2 + 1, w - 2, h - 2, insert);
    k(a, b2 + h - 1, 1, 1, 0); k(a + w - 1, b2 + h - 1, 1, 1, 0);
    rows.forEach((n, r) => { for (let i = 0; i < n; i++) k(a + 2 + r + i * 2, b2 + 2 + r * 2, 1, 1, male ? 0xf0f0f0 : 0x050505); });
  };
  switch (type) {
    case 'c13': k(-7, -5, 14, 11, 0x141416); k(-6, -4, 12, 9, 0x2a2a2e); k(-7, -5, 2, 2, 0); k(5, -5, 2, 2, 0); k(-4, 0, 1, 3, 0x050505); k(3, 0, 1, 3, 0x050505); k(-1, -3, 2, 2, 0x050505); break;
    case 'mains': disc(x, cx, cy, 6, 0xb8b8b4); disc(x, cx, cy, 5, 0xecece8); k(-3, -1, 2, 2, 0x9a9ea4); k(2, -1, 2, 2, 0x9a9ea4); k(-1, -6, 3, 1, 0x9a9ea4); k(-1, 5, 3, 1, 0x9a9ea4); break;
    case 'vga': dface(13, 7, 0xb4b9be, pc99 ? 0x2a4ab8 : 0x2a2a2e, [5, 5, 5].slice(0, 2), true, pc99 ? 0x3a5ac8 : 0x8a8e94); break;
    case 'de9': dface(11, 6, 0xb4b9be, 0x2a2a2e, [5, 4], true, 0x8a8e94); break;
    case 'serial': dface(11, 6, 0xb4b9be, 0xd8cfb4, [5, 4], false, 0x8a8e94); break;
    case 'dvi': dface(15, 7, 0xb4b9be, year < 2011 ? 0xece8dc : 0x2a2a2e, [6, 6], true, year < 2011 ? 0xd8d6ce : 0x3a3a40); k(-6, -1, 3, 1, 0xf0f0f0); break;
    case 'hdmi': k(-7, -3, 14, 5, 0xb4b9be); k(-6, 2, 12, 1, 0xb4b9be); k(-6, -2, 12, 3, 0x141416); k(-4, -1, 8, 1, 0xd8b040); k(-9, -5, 18, 2, 0x141416); break;
    case 'dp': k(-6, -3, 12, 6, 0xb4b9be); k(4, 1, 2, 2, 0); k(-5, -2, 10, 4, 0x141416); k(-3, -1, 6, 1, 0xd8b040); k(-8, -5, 16, 2, 0x141416); break;
    case 'din5':
      disc(x, cx, cy, 6, 0x9a9ea4); disc(x, cx, cy, 5, 0x2a2a2e);
      for (const a of [-160, -110, -70, -20, 90].map((d) => (d * Math.PI) / 180)) P(x, Math.round(cx + Math.cos(a) * 3), Math.round(cy + Math.sin(a) * 3), 0xf0e8c8);
      k(-1, -6, 3, 2, 0x9a9ea4); break;
    case 'ps2k': case 'ps2m': {
      const c = type === 'ps2k' ? 0x8a5ac8 : 0x46b040;
      disc(x, cx, cy, 6, c); disc(x, cx, cy, 4, 0x9a9ea4); disc(x, cx, cy, 3, 0x2a2a2e);
      for (const [dx, dy] of [[-2, -1], [2, -1], [-2, 1], [2, 1], [-1, 2], [1, 2]]) P(x, cx + dx, cy + dy, 0xf0e8c8);
      k(-1, -1, 2, 2, 0x9a9ea4); break;
    }
    case 'usb': k(-6, -3, 12, 7, 0xc8ccd0); k(-5, -2, 10, 5, 0x141416); k(-4, -2, 8, 2, 0xf0f0f0); for (let i = 0; i < 4; i++) P(x, cx - 3 + i * 2, cy - 1, 0xd8b040); break;
  }
}
export function plugIcon(id, W, H, type, era) {
  const c = document.createElement('canvas'); c.width = 32; c.height = 27;
  const x = c.getContext('2d');
  const year = era?.year || ({ din5: 1986, serial: 1993, de9: 1986, ps2k: 1999, ps2m: 1999 }[type] || 2012);
  const e = { year };
  const beige = year < 2003 && type !== 'hdmi' && type !== 'dp';
  // sladd i en mjuk båge från prylen till kontakten
  const cableCol = type === 'mains' ? 0xe0e0dc : type === 'c13' ? 0x151517 : type === 'vga' && year >= 1999 ? 0x1a2a6a : beige ? 0xcfc6a8 : 0x18181a;
  for (let i = 0; i <= 14; i++) { const t = i / 14, px = 8 + t * 12, py = 12 + Math.sin(t * Math.PI) * 9; R(x, Math.round(px), Math.round(py), 2, 2, cableCol); }
  // prylen
  if (id === 'kb') {
    const body = beige ? 0xd8cfb4 : 0x1e1e22, key = beige ? 0xebe4cc : 0x3a3a40;
    R(x, 0, 3, 15, 8, shade(body, 0.7)); R(x, 0, 2, 15, 8, body);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) R(x, 1 + i * 2 + (r % 2), 3 + r * 2, 1, 1, key);
    R(x, 4, 8, 7, 1, key);
  } else if (id === 'mouse') {
    const body = beige ? 0xd8cfb4 : 0x1e1e22;
    R(x, 2, 2, 8, 11, shade(body, 0.7)); R(x, 2, 1, 8, 11, body); R(x, 3, 0, 6, 1, body); R(x, 5, 1, 1, 4, shade(body, 0.6)); R(x, 2, 5, 8, 1, shade(body, 0.8));
  } else if (id === 'video') {
    const crt = year < 2004;
    const body = crt ? 0xd8cfb4 : 0x1c1c20;
    R(x, 0, 0, 16, 12, body); R(x, 2, 2, 12, 8, year < 1990 ? 0x0a2a14 : 0x2a5aa8); R(x, 3, 3, 4, 2, year < 1990 ? 0x3ad06a : 0x8ac0f0);
    R(x, 6, 12, 4, 2, shade(body, 0.8)); R(x, 4, 14, 8, 1, shade(body, 0.7));
  } else {
    R(x, 1, 1, 11, 11, id === 'mon_power' ? 0x3a3a40 : 0x2a2a2e); R(x, 1, 1, 11, 1, 0x5a5a62);
    x.fillStyle = '#f5c542'; x.beginPath(); x.moveTo(8, 2); x.lineTo(3, 7); x.lineTo(6, 7); x.lineTo(4, 11); x.lineTo(10, 5); x.lineTo(7, 5); x.fill();
  }
  // kontaktens framsida (så man ser stiften)
  R(x, 17, 7, 15, 13, 'rgba(255,255,255,.0)');
  plugFace(x, type, 24, 14, e);
  const out = document.createElement('canvas'); out.width = W; out.height = H;
  const o = out.getContext('2d'); o.imageSmoothingEnabled = false;
  const s = Math.max(1, Math.floor(Math.min(W / 32, H / 27)));
  o.drawImage(c, Math.floor((W - 32 * s) / 2), Math.floor((H - 27 * s) / 2), 32 * s, 27 * s);
  return out;
}

// ======================= Insidan bakom glaset =======================
// Ritas i 100×107 enheter (x: 0 = bakpanelen, 100 = fronten; y: 0 = taket) på en
// 200×214-canvas. Det statiska (kort, kablar, enheter) cachas; fläktar, RGB och
// ljusslingor ritas varje bildruta.
const F = (x, a, b, w, h, c) => { x.fillStyle = typeof c === 'number' ? css(c) : c; x.fillRect(a, b, w, h); };
// text i halv storlek (en canvaspixel per typsnittspixel)
const tiny = (x, s, a, b, c) => { x.save(); x.translate(a, b); x.scale(0.5, 0.5); drawText(x, s, 0, 0, c); x.restore(); };
const AT_FORMS = new Set(['XT', 'AT', 'BabyAT']);
const INT_CACHE = new Map();

export function drawInternals(x, b, st, t) {
  const p = b.placed;
  const mb = p.mb || {};
  const year = mb.year || p.case?.year || 2020;
  const at = AT_FORMS.has(mb.form) || mb.power === 'AT';
  const classic = at || year < 2009;
  const key = [classic, at, year, ...['case', 'mb', 'cpu', 'cooler', 'ram', 'gpu', 'snd', 'psu', 'bay', 'm2', 'media', 'media2', 'floppy', 'fans'].map((k) => p[k] ? (p[k].id || p[k].name || k) + (p[k].look?.color || '') : '-'), [...(b.cables?.keys?.() || [])].sort().join(',')].join('|');
  let base = INT_CACHE.get(key);
  if (!base) {
    if (INT_CACHE.size > 8) INT_CACHE.clear();
    base = document.createElement('canvas'); base.width = 200; base.height = 214;
    const g = base.getContext('2d');
    g.setTransform(2, 0, 0, 2, 0, 0);
    base.dyn = classic ? classicInside(g, b, year, at) : modernInside(g, b, year);
    INT_CACHE.set(key, base);
  }
  x.save();
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.imageSmoothingEnabled = false;
  x.drawImage(base, 0, 0, x.canvas.width, x.canvas.height);
  x.setTransform(x.canvas.width / 100, 0, 0, x.canvas.height / 107, 0, 0);
  const on = st.powered;
  const glow = [];
  const rgbOn = (k) => on && st.lit?.[k];
  for (const f of base.dyn.fans) {
    const spin = on && (!f.cable || b.cables?.has?.(f.cable)) ? t * 12 : 0.4;
    sideFan(x, f, spin);
    if (f.rgb && rgbOn(f.rgb)) { const c = css(rainbow(t, f.y / 10)); F(x, f.vertical ? f.x : f.x + 0.5, f.vertical ? f.y + 0.5 : f.y, f.vertical ? 1 : f.w - 1, f.vertical ? f.h - 1 : 1, c); glow.push([f.x + f.w / 2, f.y + f.h / 2, 16, c]); }
  }
  for (const s of base.dyn.strips) {
    if (!rgbOn(s.key)) { F(x, s.x, s.y, s.w, s.h, s.off || '#d8d8d4'); continue; }
    const n = Math.max(1, Math.round((s.w > s.h ? s.w : s.h) / 2));
    for (let i = 0; i < n; i++) F(x, s.w > s.h ? s.x + (i * s.w) / n : s.x, s.w > s.h ? s.y : s.y + (i * s.h) / n, s.w > s.h ? s.w / n + 0.05 : s.w, s.w > s.h ? s.h : s.h / n + 0.05, css(rainbow(t, s.off2 + i * 0.25)));
    glow.push([s.x + s.w / 2, s.y + s.h / 2, s.r || 18, css(rainbow(t, s.off2))]);
  }
  for (const l of base.dyn.leds) if (on) { F(x, l.x, l.y, l.w || 1, l.h || 1, l.col); glow.push([l.x + 0.5, l.y + 0.5, l.r || 5, l.col]); }
  if (base.dyn.ccfl && on) { F(x, base.dyn.ccfl.x, base.dyn.ccfl.y, base.dyn.ccfl.w, 1, '#bfe0ff'); glow.push([50, base.dyn.ccfl.y, 60, '#4a8aff']); }
  if (glow.length) {
    x.save(); x.globalCompositeOperation = 'lighter';
    for (const [gx, gy, r, c] of glow) {
      const g = x.createRadialGradient(gx, gy, 0, gx, gy, r);
      g.addColorStop(0, c.length === 7 ? c + '55' : c); g.addColorStop(1, c.length === 7 ? c + '00' : 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(gx - r, gy - r, r * 2, r * 2);
    }
    x.restore();
  }
  if (!on) F(x, 0, 0, 100, 107, 'rgba(0,0,0,.2)');
  // glasreflex
  x.save(); x.globalAlpha = 0.1; x.fillStyle = '#fff';
  for (const off of [12, 18, 64]) { x.beginPath(); x.moveTo(off, 0); x.lineTo(off + 4, 0); x.lineTo(off - 36, 107); x.lineTo(off - 40, 107); x.fill(); }
  x.restore();
  x.restore();
}
// fläkt sedd från sidan (profil) – med bladen som skymtar
function sideFan(x, f, spin) {
  F(x, f.x, f.y, f.w, f.h, '#151517');
  const n = 5;
  if (f.vertical) {
    for (let i = 0; i < n; i++) { const yy = f.y + 1 + ((((i / n + spin * 0.05) % 1) + 1) % 1) * (f.h - 2); F(x, f.x + 1, yy, f.w - 2, 1, '#2e2e34'); }
    F(x, f.x, f.y, 0.5, f.h, '#2a2a30'); F(x, f.x + f.w - 0.5, f.y, 0.5, f.h, '#2a2a30');
  } else {
    for (let i = 0; i < n; i++) { const xx = f.x + 1 + ((((i / n + spin * 0.05) % 1) + 1) % 1) * (f.w - 2); F(x, xx, f.y + 1, 1, f.h - 2, '#2e2e34'); }
    F(x, f.x, f.y, f.w, 0.5, '#2a2a30'); F(x, f.x, f.y + f.h - 0.5, f.w, 0.5, '#2a2a30');
  }
}
// platt kabel (flatkabel) längs en polyline med raka och diagonala steg
function ribbon(x, pts, w, col, stripe) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) * 2));
    for (let s = 0; s <= steps; s++) {
      const px = ax + ((bx - ax) * s) / steps, py = ay + ((by - ay) * s) / steps;
      const vert = Math.abs(by - ay) > Math.abs(bx - ax);
      if (vert) { F(x, px - w / 2, py, w, 0.5, css(col)); F(x, px - w / 2, py, 0.5, 0.5, css(stripe)); for (let k = 1; k < w * 2 - 1; k += 2) F(x, px - w / 2 + k * 0.5, py, 0.5, 0.5, css(shade(col, 0.9))); }
      else { F(x, px, py - w / 2, 0.5, w, css(col)); F(x, px, py - w / 2, 0.5, 0.5, css(stripe)); for (let k = 1; k < w * 2 - 1; k += 2) F(x, px, py - w / 2 + k * 0.5, 0.5, 0.5, css(shade(col, 0.9))); }
    }
  }
}
// kabelknippe av tunna ledare
function wires(x, pts, cols, gap = 0.5) {
  cols.forEach((c, i) => {
    const off = (i - (cols.length - 1) / 2) * gap;
    for (let j = 0; j < pts.length - 1; j++) {
      const [ax, ay] = pts[j], [bx, by] = pts[j + 1];
      const vert = Math.abs(by - ay) > Math.abs(bx - ax);
      const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) * 2));
      for (let s = 0; s <= steps; s++) F(x, ax + ((bx - ax) * s) / steps + (vert ? off : 0), ay + ((by - ay) * s) / steps + (vert ? 0 : off), 0.5, 0.5, css(c));
    }
  });
}
function chip(x, a, b2, w, h, c = 0x1b1b1e) { F(x, a, b2, w, h, css(c)); F(x, a, b2, w, 0.5, css(shade(c, 1.6))); for (let i = a + 0.5; i < a + w - 0.5; i += 1) { F(x, i, b2 - 0.5, 0.5, 0.5, '#c8ccd0'); F(x, i, b2 + h, 0.5, 0.5, '#c8ccd0'); } }
function cap(x, a, b2, r, c = 0x1a1a3a) { F(x, a - r, b2 - r, r * 2, r * 2, css(c)); F(x, a - r * 0.5, b2 - r * 0.5, r, r, '#c8ccd0'); }
function heatsink(x, a, b2, w, h, c) { F(x, a, b2, w, h, css(shade(c, 0.7))); for (let i = 0; i < w; i += 1) F(x, a + i, b2, 0.5, h, css(c)); F(x, a, b2, w, 0.5, css(shade(c, 1.3))); }
function card(x, a, b2, len, h, pcb, opts = {}) {
  F(x, a, b2, len, h, css(pcb)); F(x, a, b2, len, 0.5, css(shade(pcb, 1.3)));
  F(x, a + 6, b2 + h - 1, len - 12, 1, '#d8b24a');
  for (let i = 0; i < (opts.chips ?? Math.floor(len / 9)); i++) chip(x, a + 5 + i * 8 + (hash(i, len) * 2 | 0), b2 + 1.5, 5, Math.min(3, h - 3.5));
  F(x, 0, b2 - 1, 4, h + 2, '#c4c8cc');
}

function classicInside(x, b, year, at) {
  const p = b.placed, dyn = { fans: [], strips: [], leds: [], ccfl: null };
  const cs = p.case || { look: {} };
  const beige = cs.look?.front?.startsWith('beige') || at;
  const inner = hx(cs.look?.inner, beige ? 0x9aa0a6 : 0x1e1f22);
  F(x, 0, 0, 100, 107, css(inner));
  for (let i = 0; i < 100; i += 4) F(x, i, 0, 0.5, 107, 'rgba(0,0,0,.07)');
  for (let i = 0; i < 40; i++) F(x, hash(i, 3) * 100, hash(i, 4) * 107, 1, 1, 'rgba(0,0,0,.18)');
  // bakpanelens insida
  F(x, 0, 0, 4, 107, css(shade(inner, 1.12)));
  // enhetsburen fram
  const cage = shade(inner, beige ? 1.08 : 1.35);
  F(x, 66, 0, 34, 64, css(shade(inner, 0.8)));
  for (const yy of [0, 9, 18, 27, 36]) { F(x, 66, yy, 34, 1, css(cage)); for (let i = 68; i < 98; i += 5) F(x, i, yy + 0.25, 1, 0.5, 'rgba(0,0,0,.3)'); }
  F(x, 66, 0, 1.5, 64, css(cage)); F(x, 98.5, 0, 1.5, 64, css(cage));
  const media = p.media && !String(p.media.kind || '').startsWith('floppy') ? p.media : p.media2 && !String(p.media2.kind || '').startsWith('floppy') ? p.media2 : null;
  const floppy = p.floppy || [p.media, p.media2].find((m) => m && String(m.kind || '').startsWith('floppy'));
  const driveCol = (m) => (m?.look?.color === 'black' ? 0x1c1c1e : m?.look?.color === 'grey' ? 0x9a9ea4 : 0xd8cfb4);
  if (media) {
    // optisk enhet i översta platsen: plåtlåda med etikett
    F(x, 67.5, 1, 32, 7.5, css(0xa8adb3)); F(x, 67.5, 1, 32, 0.5, '#d0d4d8');
    F(x, 76, 2.5, 12, 4, '#f2f0e6'); F(x, 76, 2.5, 12, 1, '#2c6fb7'); for (let i = 0; i < 3; i++) F(x, 77, 4 + i, 8 - i * 2, 0.5, '#6a6a6a');
    F(x, 98, 1, 2, 7.5, css(driveCol(media)));
    F(x, 67.5, 3, 3, 3, '#141414');
  }
  const floppyAt = at ? 10 : 37;
  if (floppy) { const big = floppy.kind === 'floppy525'; F(x, big ? 67.5 : 72, floppyAt + 1, big ? 32 : 27, big ? 7.5 : 6.5, '#9aa0a6'); F(x, big ? 67.5 : 72, floppyAt + 1, big ? 32 : 27, 0.5, '#c8ccd0'); F(x, 98, floppyAt + 1, 2, 6.5, css(driveCol(floppy))); F(x, big ? 67.5 : 72, floppyAt + 3, 2, 3, '#141414'); }
  // hårddisk
  const hddY = at ? 44 : 48;
  if (p.bay) {
    const ssd = p.bay.kind === 'ssd';
    const hh = at ? 12 : ssd ? 4 : 7;
    F(x, 70, hddY, 29, hh, ssd ? '#2a2a30' : '#b9bdc2'); F(x, 70, hddY, 29, 0.5, '#e0e4e8');
    F(x, 78, hddY + 1, 14, Math.min(5, hh - 2), '#f2f2ec'); F(x, 78, hddY + 1, 14, 1, ssd ? '#d8343c' : '#1a8a3a');
    F(x, 70, hddY + 1, 2, hh - 2, '#141414');
    if (at) for (let i = 0; i < 4; i++) F(x, 73 + i * 6, hddY + hh - 2, 4, 1, '#6a6e74');
  }
  // nätagget i taket
  const zincPsu = at || year < 2003;
  const psuC = zincPsu ? 0xb4b9be : 0x1e1e20;
  F(x, 0, 0, 36, 22, css(psuC)); F(x, 0, 21.5, 36, 0.5, css(shade(psuC, 0.6)));
  for (let yy = 3; yy < 19; yy += 2) for (let xx = 26; xx < 34; xx += 2) F(x, xx, yy, 1, 1, css(shade(psuC, 0.5)));
  F(x, 6, 5, 16, 11, '#f2f0e6'); F(x, 6, 5, 16, 2.5, at ? '#c9323a' : '#2c6fb7');
  for (let i = 0; i < 4; i++) F(x, 7, 9 + i * 1.6, 13 - (i % 2) * 5, 0.5, '#6a6a6a');
  for (const [sx, sy] of [[1.5, 1.5], [33, 1.5], [1.5, 19.5], [33, 19.5]]) F(x, sx, sy, 1, 1, '#5a5e62');
  // moderkortet
  const pcb = hx(p.mb?.look?.pcb, 0x2e6b3c), acc = hx(p.mb?.look?.accent, shade(pcb, 0.7));
  const bx0 = 5, by0 = 24, bx1 = at ? 60 : 62, by1 = 103;
  if (p.mb) {
    F(x, bx0, by0, bx1 - bx0, by1 - by0, css(pcb)); F(x, bx0, by0, bx1 - bx0, 0.5, css(shade(pcb, 1.3)));
    for (let i = 0; i < 18; i++) { const yy = by0 + 4 + hash(i, 5) * 70, xx = bx0 + 6 + hash(i, 6) * 40; F(x, xx, yy, 6 + hash(i, 7) * 10, 0.5, css(mix(pcb, 0xd8c070, 0.25))); }
    for (const [hxx, hyy] of [[bx0 + 2, by0 + 2], [bx1 - 3, by0 + 2], [bx0 + 2, by1 - 3], [bx1 - 3, by1 - 3], [bx1 - 3, 62]]) { F(x, hxx, hyy, 1.5, 1.5, '#c9a13a'); F(x, hxx + 0.5, hyy + 0.5, 0.5, 0.5, '#3a2a10'); }
    if (!at) { F(x, bx0, by0 + 1, 6, 24, '#c4c8cc'); for (let i = 0; i < 5; i++) F(x, bx0 + 1, by0 + 3 + i * 4.5, 4, 3, i < 2 ? (i ? '#3f9b3a' : '#7a4fb0') : '#1a1a1a'); }
    else { disc(x, bx0 + 3, by0 + 6, 2.5, 0x1a1a1a); F(x, bx0 + 2, by0 + 5, 2, 2, '#9aa0a6'); }
    // BIOS, batteri, kondensatorer
    chip(x, 40, 88, 7, 3.5, 0x2a2a2e); F(x, 41, 88.5, 4, 1, '#c8c8c8');
    if (at && year < 1992) { F(x, 48, 84, 6, 9, '#2a5ab8'); F(x, 48, 84, 6, 1, '#6a8ae8'); }
    else { disc(x, 51, 90, 2.5, 0xb9bdc2); F(x, 50, 89, 1, 1, '#f0f0f0'); }
    for (let i = 0; i < 6; i++) cap(x, 10 + i * 3.5, 50, 1, 0x1a1a3a);
    if (at) for (let r = 0; r < 4; r++) for (let i = 0; i < 6; i++) chip(x, 36 + i * 4, 28 + r * 5, 3, 3);
  }
  // processor och kylare
  const cx0 = 14, cy0 = 29;
  const slot = /Slot|Pentium II\b|Pentium III 4|Celeron 3/.test(p.cpu?.socket || p.cpu?.name || '') && year >= 1997 && year <= 2000;
  if (p.cpu) {
    if (slot) { F(x, cx0, cy0 - 2, 18, 20, '#1a1a1c'); F(x, cx0 + 2, cy0 + 1, 14, 5, '#c8a040'); F(x, cx0 + 3, cy0 + 2, 8, 1, '#1a1a1c'); F(x, cx0 + 18, cy0, 3, 16, '#2a2a2a'); dyn.fans.push({ x: cx0 + 18, y: cy0, w: 3, h: 16, vertical: true, cable: 'cpu_fan' }); }
    else { F(x, cx0, cy0, 16, 16, at ? '#d9d6cc' : '#e8e4d8'); F(x, cx0 + 3, cy0 + 3, 10, 10, at ? '#2a2a2e' : '#c9c9c4'); if (!at) F(x, cx0 + 16, cy0 + 1, 1, 14, '#9a9ea4'); }
  }
  const cool = p.cooler?.look?.type;
  if (p.cooler && !slot) {
    const fin = hx(p.cooler.look.fin, 0xc8ccd0);
    if (cool === 'heatsink') heatsink(x, cx0 + 2, cy0 + 2, 12, 12, fin);
    else if (cool === 'tower') {
      heatsink(x, cx0 - 1, cy0 - 4, 20, 26, fin);
      for (let i = 0; i < 3; i++) F(x, cx0 + 3 + i * 5, cy0 - 5.5, 2, 2, '#c87533');
      F(x, cx0 + 19, cy0 - 3, 4, 24, css(hx(p.cooler.look.fan, 0x1a1a1a)));
      dyn.fans.push({ x: cx0 + 19, y: cy0 - 3, w: 4, h: 24, vertical: true, cable: 'cpu_fan', rgb: p.cooler.rgb ? 'cooler' : null });
    } else {
      heatsink(x, cx0, cy0, 16, 5, fin);
      F(x, cx0, cy0 + 5, 16, 5, '#161618'); dyn.fans.push({ x: cx0, y: cy0 + 5, w: 16, h: 5, cable: 'cpu_fan' });
    }
  }
  // minne
  if (p.ram) {
    const n = Math.min(4, Math.max(1, p.ram.sticks || 2)), rc = hx(p.ram.look?.color, 0x1a5a2a);
    const simm = /SIMM|DIP/.test(p.ram.type || '');
    for (let i = 0; i < 4; i++) {
      const rx = 38 + i * 3;
      F(x, rx, 25, 2, simm ? 16 : 24, i < n ? '#e8e4d8' : '#1a1a1a');
      if (i < n && !(p.ram.type === 'DIP')) { F(x, rx - 0.5, 24, 2, simm ? 16 : 24, css(rc)); for (let k = 0; k < (simm ? 3 : 5); k++) F(x, rx, 26 + k * 4.5, 1, 3, '#141416'); F(x, rx + 1, 24, 0.5, simm ? 16 : 24, '#d8b24a'); }
    }
  }
  // strömkontakt och flatkablar
  const ideX = 56;
  if (p.mb && !at) { F(x, 57, 30, 3, 14, '#f2f0e6'); for (let i = 0; i < 12; i++) F(x, 57.5, 30.5 + i * 1.1, 2, 0.5, '#9a9a90'); }
  if (p.mb && !at) { F(x, ideX, 50, 3.5, 11, '#1a1a1a'); F(x, ideX, 63, 3.5, 11, '#1a1a1a'); }
  const round = year >= 2002 && cs.look?.window;
  if (media) { if (round) wires(x, [[ideX + 2, 56], [64, 50], [64, 5], [68, 4.5]], [0x3a7ad8, 0x3a7ad8, 0x2a6ac8]); else ribbon(x, [[ideX + 2, 51], [63, 44], [63, 6], [68, 5]], 4, 0xc8c8c0, 0xc9323a); }
  if (p.bay && p.bay.iface !== 'SATA') { if (round) wires(x, [[ideX + 2, 68], [65, 60], [70, 52]], [0x40c040, 0x40c040, 0x30a030]); else ribbon(x, [[ideX + 2, 66], [66, 58], [70, hddY + 3]], 4, 0xc8c8c0, 0xc9323a); }
  else if (p.bay) wires(x, [[bx1 - 1, 80], [66, 70], [70, hddY + 3]], [0xd83030, 0xd83030]);
  // strömkablar från nätagget
  if (b.cables?.has?.('main_pwr') || b.cables?.has?.('p8')) {
    if (at) { wires(x, [[20, 22], [20, 26], [bx0 + 8, 26]], [0xf2f0e6, 0xe8c030, 0xd83030, 0x1a1a1a, 0x1a1a1a, 0xd83030]); F(x, bx0 + 7, 24.5, 10, 3, '#f2f0e6'); }
    else wires(x, [[30, 22], [48, 26], [58, 30]], [0xf07a1a, 0xd83030, 0x1a1a1a, 0xe8c030, 0x1a1a1a, 0xd83030]);
  }
  if (media) wires(x, [[34, 20], [64, 16], [68, 8]], [0xe8c030, 0x1a1a1a, 0x1a1a1a, 0xd83030]);
  if (floppy) wires(x, [[34, 21], [62, 30], [72, floppyAt + 4]], [0xe8c030, 0x1a1a1a, 0xd83030]);
  if (p.bay) wires(x, [[34, 21], [60, 40], [70, hddY + 5]], [0xe8c030, 0x1a1a1a, 0x1a1a1a, 0xd83030]);
  if (b.cables?.has?.('cpu_pwr')) wires(x, [[12, 22], [12, 26]], [0xe8c030, 0x1a1a1a]);
  // kortplatser och kort
  const slotRows = at ? [60, 67, 74, 81, 88, 95] : [64, 71, 77, 83, 89, 95];
  if (p.mb) slotRows.forEach((yy, i) => F(x, bx0 + 3, yy + 3, at ? 40 : 30, 1.5, at ? '#1a1a1a' : i === 0 && year >= 1998 ? '#7a4a20' : '#f2f0e6'));
  if (p.gpu) {
    const len = [28, 40, 52][Math.max(0, Math.min(2, (p.gpu.len || 2) - 1))];
    const gc = hx(p.gpu.look?.pcb || p.gpu.look?.color, 0x1f5a36);
    card(x, 4, slotRows[0] - 3, len, 6, gc, { chips: 2 });
    if (year >= 1998) {
      const fanned = (p.gpu.look?.fans || 0) > 0 || year >= 2002;
      heatsink(x, 12, slotRows[0] - 5, 12, 3, 0xc8ccd0);
      if (fanned) { F(x, 14, slotRows[0] - 7, 8, 2, '#141414'); dyn.fans.push({ x: 14, y: slotRows[0] - 7, w: 8, h: 2, cable: null }); }
    }
    if (p.gpu.pwr && b.cables?.has?.('gpu_pwr')) wires(x, [[34, 22], [len, 40], [len - 2, slotRows[0] - 3]], [0xe8c030, 0x1a1a1a, 0x1a1a1a]);
  }
  if (p.snd) { card(x, 4, slotRows[2] - 3, 30, 5, hx(p.snd.look?.pcb, 0x2a5a2a), { chips: 2 }); if (media) wires(x, [[20, slotRows[2] - 3], [40, 20], [68, 6]], [0x1a1a1a, 0xd83030]); }
  // fläktar
  if ((cs.fans || []).includes('rear')) { dyn.fans.push({ x: 0, y: 26, w: 5, h: 18, vertical: true, cable: 'case_fans', rgb: cs.rgb ? 'case' : null }); }
  if ((cs.fans || []).includes('front1')) { dyn.fans.push({ x: 95, y: 66, w: 5, h: 18, vertical: true, cable: 'case_fans', rgb: cs.rgb ? 'case' : null }); }
  if (year >= 2002 && cs.look?.window) dyn.ccfl = { x: 8, y: 104, w: 84 };
  if (p.mb) dyn.leds.push({ x: bx1 - 6, y: by1 - 3, col: '#45ff7a', r: 3 });
  return dyn;
}

function modernInside(x, b, year) {
  const p = b.placed, dyn = { fans: [], strips: [], leds: [], ccfl: null };
  const cs = p.case || { look: {} };
  const inner = hx(cs.look?.inner, 0x141416), col = hx(cs.look?.color, 0x1c1c1e);
  F(x, 0, 0, 100, 107, css(inner));
  for (let i = 0; i < 100; i += 4) F(x, i, 0, 0.5, 107, 'rgba(0,0,0,.08)');
  // kabelgenomföringar
  for (const gy of [14, 38, 62]) { F(x, 70, gy, 3, 10, '#0a0a0c'); F(x, 70, gy, 3, 0.5, '#2a2a2e'); }
  F(x, 0, 0, 4, 84, css(shade(inner, 1.2)));
  // moderkort
  const pcb = hx(p.mb?.look?.pcb, 0x1a1a1c), acc = hx(p.mb?.look?.accent, 0x3a3a40);
  if (p.mb) {
    F(x, 6, 6, 62, 74, css(pcb)); F(x, 6, 6, 62, 0.5, css(shade(pcb, 1.6)));
    for (let i = 0; i < 14; i++) F(x, 16 + hash(i, 1) * 40, 44 + hash(i, 2) * 10, 6 + hash(i, 3) * 8, 0.5, css(mix(pcb, 0xd8c070, 0.15)));
    // VRM-kylflänsar och I/O-kåpa
    F(x, 6, 7, 10, 34, css(acc)); for (let i = 0; i < 16; i++) F(x, 7, 9 + i * 2, 8, 0.5, css(shade(acc, 0.7)));
    F(x, 17, 7, 24, 5, css(shade(acc, 1.1))); for (let i = 0; i < 11; i++) F(x, 18 + i * 2, 7.5, 0.5, 4, css(shade(acc, 0.7)));
    if (p.mb.rgb || year >= 2017) dyn.strips.push({ key: 'mb', x: 7, y: 10, w: 1, h: 28, off: '#d8d8d4', off2: 1, r: 14 });
    // chipsetkylare och M.2-kåpa
    F(x, 46, 60, 14, 9, css(shade(acc, 1.2))); F(x, 46, 60, 14, 0.5, css(shade(acc, 1.6))); tiny(x, 'PX', 50, 63, '#9a9aa0');
    F(x, 16, 50, 26, 3, css(shade(acc, 1.1))); for (let i = 0; i < 12; i++) F(x, 17 + i * 2, 50.5, 1, 2, css(shade(acc, 0.75)));
    // 24-pin, SATA, ljudsektion, knappcell
    F(x, 63, 18, 4, 16, '#111'); for (let i = 0; i < 12; i++) F(x, 63.5, 18.5 + i * 1.3, 3, 0.5, '#2a2a2a');
    for (let i = 0; i < 4; i++) F(x, 63, 50 + i * 2.5, 4, 2, '#1a1a1a');
    for (let i = 0; i < 5; i++) cap(x, 10 + i * 3, 74, 1, 0xd8b030);
    disc(x, 44, 74, 2, 0xb9bdc2);
    // PCIe-platser (stålförstärkt översta)
    F(x, 8, 57, 50, 2, '#111'); F(x, 8, 56.5, 50, 0.5, '#b9bdc2'); F(x, 8, 59, 50, 0.5, '#b9bdc2');
    F(x, 8, 71, 18, 1.5, '#111');
    // 24-pin-kabel (flätad) mot genomföringen
    if (b.cables?.has?.('main_pwr')) { for (let i = 0; i < 6; i++) { F(x, 67, 19 + i * 2.5, 3.5, 2, i % 2 ? '#1a1a1a' : '#262626'); } F(x, 70, 20, 3, 12, '#1a1a1a'); }
    if (b.cables?.has?.('cpu_pwr')) { F(x, 10, 2, 50, 1.5, '#161616'); F(x, 58, 2, 2, 16, '#161616'); F(x, 10, 5, 4, 2, '#111'); }
  }
  // minne
  if (p.ram) {
    const n = Math.min(4, Math.max(1, p.ram.sticks || 2)), rc = hx(p.ram.look?.color, 0x1a1a1a), ra = hx(p.ram.look?.accent, 0xb9bcc0);
    for (let i = 0; i < 4; i++) {
      const rx = 48 + i * 3.5;
      F(x, rx, 12, 2.5, 30, '#0c0c0e');
      if (i >= n) continue;
      F(x, rx - 0.25, 11, 2.5, 30, css(rc)); F(x, rx - 0.25, 11, 0.5, 30, css(shade(rc, 1.4)));
      for (let k = 0; k < 5; k++) F(x, rx + 0.5, 16 + k * 5, 1.5, 3, 'rgba(0,0,0,.35)');
      if (p.ram.rgb) dyn.strips.push({ key: 'ram', x: rx - 0.25, y: 10, w: 2.5, h: 2, off: css(ra), off2: 2 + i * 0.4, r: 8 });
      else F(x, rx - 0.25, 10, 2.5, 1.5, css(ra));
    }
  }
  // kylare
  const L = p.cooler?.look;
  if (p.cooler) {
    if (L.type === 'tower') {
      heatsink(x, 22, 15, 22, 32, hx(L.fin, 0xc8ccd0));
      for (let i = 0; i < 4; i++) { F(x, 25 + i * 5, 12.5, 2, 3, '#c87533'); F(x, 25.5 + i * 5, 12.5, 0.5, 0.5, '#f0a060'); }
      F(x, 44, 14, 5, 34, css(hx(L.fan, 0x1a1a1a)));
      dyn.fans.push({ x: 44, y: 14, w: 5, h: 34, vertical: true, cable: 'cpu_fan', rgb: p.cooler.rgb ? 'cooler' : null });
    } else if (L.type === 'low') {
      heatsink(x, 20, 30, 26, 8, hx(L.fin, 0xc8ccd0)); F(x, 19, 24, 28, 6, css(hx(L.fan, 0x1a1a1a)));
      dyn.fans.push({ x: 19, y: 24, w: 28, h: 6, cable: 'cpu_fan', rgb: p.cooler.rgb ? 'cooler' : null });
    } else if (L.type === 'aio') {
      F(x, 26, 22, 16, 14, '#1a1a1c'); F(x, 26, 22, 16, 0.5, '#3a3a40'); disc(x, 34, 29, 5, 0x0e0e10);
      dyn.strips.push({ key: 'cooler', x: 29, y: 26, w: 10, h: 1, off: '#bbb', off2: 3, r: 14 });
      F(x, 31, 6, 2.5, 16, '#161616'); F(x, 36, 6, 2.5, 16, '#161616');
      F(x, 14, 0.5, 70, 5, '#1a1a1a'); for (let i = 16; i < 82; i += 1.5) F(x, i, 1, 0.5, 4, '#2a2a2a');
      for (const fx of [16, 39, 62]) dyn.fans.push({ x: fx, y: 5, w: 21, h: 4, cable: 'cpu_fan', rgb: p.cooler.rgb ? 'cooler' : null });
    } else { heatsink(x, 24, 22, 18, 8, 0xc8ccd0); F(x, 24, 30, 18, 4, '#161618'); dyn.fans.push({ x: 24, y: 30, w: 18, h: 4, cable: 'cpu_fan' }); }
  }
  // grafikkort
  if (p.gpu) {
    const len = [44, 64, 84][Math.max(0, Math.min(2, (p.gpu.len || 2) - 1))], gl = p.gpu.look || {};
    const gc = hx(gl.color, 0x2a2a2e);
    F(x, 4, 55, len, 13, css(gc)); F(x, 4, 55, len, 0.5, 'rgba(255,255,255,.25)');
    F(x, 4, 66, len, 2.5, css(shade(gc, 0.6)));
    for (let i = 0; i < len - 4; i += 1.5) F(x, 6 + i, 66.5, 0.5, 1.5, 'rgba(0,0,0,.5)');
    F(x, 4, 53.5, len, 1.5, css(shade(gc, 0.75)));
    const brand = gl.brand === 'amd' || gl.brand === 'ati' ? 'RADEON' : 'GEFORCE';
    tiny(x, brand + (gl.brand === 'amd' || gl.brand === 'ati' ? '' : ' RTX'), 10, 59, gl.brand === 'amd' || gl.brand === 'ati' ? '#e84a52' : '#8ad030');
    if (p.gpu.rgb) dyn.strips.push({ key: 'gpu', x: 10, y: 64, w: len - 16, h: 1, off: '#9a9aa0', off2: 4, r: 24 });
    F(x, 0, 53, 4, 18, '#b9bdc2');
    if (p.gpu.pwr && b.cables?.has?.('gpu_pwr')) { F(x, len - 12, 51.5, 6, 2, '#0c0c0c'); for (let i = 0; i < 5; i++) F(x, len - 11.5 + i, 52, 0.5, 0.5, '#e8c030'); F(x, len - 10, 45, 2, 7, '#161616'); F(x, len - 10, 45, 62 - len + 10, 2, '#161616'); }
  }
  // takfläktar
  if (p.fans && p.cooler?.look?.type !== 'aio') for (const fx of [18, 40, 62]) { F(x, fx, 0, 20, 5, css(hx(p.fans.look?.frame, 0x1a1a1a))); dyn.fans.push({ x: fx, y: 0, w: 20, h: 5, cable: 'top_fans', rgb: p.fans.rgb ? 'fans' : null }); }
  // nätaggskåpa med fönster mot nätagget
  F(x, 0, 84, 100, 23, css(col)); F(x, 0, 84, 100, 0.5, 'rgba(255,255,255,.2)');
  for (let i = 2; i < 98; i += 2.5) F(x, i, 86, 1, 1, 'rgba(0,0,0,.35)');
  F(x, 60, 90, 30, 12, '#0a0a0c'); F(x, 62, 92, 14, 6, '#1a1a1c'); tiny(x, (p.psu?.watt || 750) + 'W', 63, 94, '#8a8a90');
  const light = lum(col) > 150;
  tiny(x, String(cs.name || cs.brand || 'PIXEL').split(' ')[0].toUpperCase().slice(0, 10), 8, 94, light ? '#555' : '#cfcfcf');
  for (const [k, fy] of [['front1', 12], ['front2', 36], ['front3', 60]]) if ((cs.fans || []).includes(k)) dyn.fans.push({ x: 93, y: fy, w: 6, h: 22, vertical: true, cable: 'case_fans', rgb: cs.rgb ? 'case' : null });
  if ((cs.fans || []).includes('rear')) dyn.fans.push({ x: 0, y: 14, w: 5, h: 20, vertical: true, cable: 'case_fans', rgb: cs.rgb ? 'case' : null });
  if (p.mb) dyn.leds.push({ x: 60, y: 76, col: '#ff3a3a', r: 3 });
  return dyn;
}
