// Skrivbordsscenens 2D-pixelgrafik: datorns insida bakom glaset, skärmens innehåll,
// baksidan med uttag och kontakterna man kopplar in.
import { drawText, textWidth } from '../../core/pixfont.js';
import { rainbow, hex } from '../../core/raster.js';
import { GPU_LEN } from './geom.js';

const css = (c) => '#' + (c >>> 0).toString(16).padStart(6, '0').slice(-6);
const R = (x, a, b, w, h, c) => { x.fillStyle = typeof c === 'number' ? css(c) : c; x.fillRect(a | 0, b | 0, w | 0, h | 0); };

// fin pixel (halva enheter i 2×-canvasen)
const F = (x, a, b, w, h, c) => { x.fillStyle = typeof c === 'number' ? css(c) : c; x.fillRect(a, b, w, h); };
const hash2 = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967295; };

// ---------- Insidan (sidovy bakom glaset), ritas i 100×107 enheter på en 200×214-canvas ----------
export function drawInternals(x, b, st, t) {
  x.save();
  x.setTransform(x.canvas.width / 100, 0, 0, x.canvas.height / 107, 0, 0);
  drawInternalsBase(x, b, st, t);
  x.restore();
}
function drawInternalsBase(x, b, st, t) {
  const p = b.placed, W = 100, H = 107;
  const cs = p.case, inner = hex(cs.look.inner), col = hex(cs.look.color);
  const on = st.powered;
  R(x, 0, 0, W, H, inner);
  for (let i = 0; i < W; i += 4) R(x, i, 0, 1, H, 'rgba(0,0,0,.08)');
  const glow = [];
  const rgbAt = (key, off) => (on && st.lit[key] ? css(rainbow(t, off)) : null);

  // moderkort
  if (p.mb) {
    const L = p.mb.look;
    R(x, 6, 8, 62, 72, L.pcb); R(x, 6, 8, 62, 1, 'rgba(255,255,255,.15)');
    R(x, 6, 8, 11, 34, L.accent);
    if (p.mb.rgb) { const c = rgbAt('mb', 1); R(x, 7, 10, 2, 30, c || '#ddd'); if (c) glow.push([8, 25, 18, c]); }
    for (let i = 0; i < 4; i++) R(x, 20, 12 + i * 3, 30, 1, 'rgba(0,0,0,.25)');
    R(x, 8, 58, 56, 2, '#111'); // PCIe-slot
  }
  // RAM
  if (p.ram) {
    for (const [i, rx] of [[0, 54], [1, 58]].slice(0, p.ram.sticks)) {
      R(x, rx, 12, 3, 28, p.ram.look.color);
      const c = p.ram.rgb ? rgbAt('ram', i + 2) : null;
      R(x, rx, 11, 3, 3, c || (p.ram.rgb ? '#ccc' : p.ram.look.accent));
      if (c) glow.push([rx + 1, 12, 12, c]);
    }
  }
  // kylare
  if (p.cooler) {
    const L = p.cooler.look;
    if (L.type === 'tower') {
      for (let i = 0; i < 22; i += 2) R(x, 24 + i, 16, 1, 30, L.fin);
      R(x, 24, 16, 22, 30, 'rgba(0,0,0,.25)'); R(x, 24, 14, 22, 3, L.fin);
      R(x, 46, 15, 5, 32, L.fan);
      const c = p.cooler.rgb ? rgbAt('cooler', 3) : null;
      if (c) { R(x, 50, 16, 1, 30, c); glow.push([50, 31, 22, c]); }
    } else if (L.type === 'low') {
      R(x, 22, 34, 26, 8, L.fin); R(x, 21, 29, 28, 5, L.fan);
    } else {
      R(x, 30, 28, 14, 10, L.fan);
      const c = p.cooler.rgb ? rgbAt('cooler', 3) : null;
      R(x, 32, 27, 10, 2, c || '#bbb'); if (c) glow.push([37, 32, 14, c]);
      R(x, 33, 8, 3, 20, '#161616'); R(x, 38, 8, 3, 20, '#161616');
      R(x, 16, 1, 68, 5, '#1a1a1a');
      for (const fx of [18, 40, 62]) { R(x, fx, 6, 20, 4, L.fan); const cc = p.cooler.rgb ? rgbAt('cooler', fx) : null; if (cc) { R(x, fx, 9, 20, 1, cc); glow.push([fx + 10, 10, 14, cc]); } }
    }
  }
  // grafikkort
  if (p.gpu) {
    const len = [40, 62, 84][p.gpu.len - 1], L = p.gpu.look;
    R(x, 4, 55, len, 14, L.color); R(x, 4, 55, len, 1, 'rgba(255,255,255,.2)');
    R(x, 4, 67, len, 2, 'rgba(0,0,0,.35)');
    const c = p.gpu.rgb ? rgbAt('gpu', 4) : null;
    if (c) { R(x, 10, 56, len - 14, 2, c); glow.push([len / 2, 58, 26, c]); }
    drawText(x, L.brand === 'nvidia' ? 'GEFORCE RTX' : 'RADEON', 12, 60, L.fe ? '#e8e8e8' : (L.brand === 'nvidia' ? '#76b900' : '#d8343c'));
    R(x, 0, 55, 4, 16, '#b9bdc2');
  }
  // takfläktar
  if (p.fans) for (const fx of [20, 42, 64]) {
    R(x, fx, 0, 20, 5, p.fans.look.frame);
    const c = p.fans.rgb ? rgbAt('fans', fx / 10) : null;
    if (c) { R(x, fx + 2, 4, 16, 1, c); glow.push([fx + 10, 5, 16, c]); }
  }
  // kablar
  if (b.cables.has('atx24')) { for (let i = 0; i < 4; i++) R(x, 70 + i, 20, 1, 64, i % 2 ? '#2a2a2a' : '#141414'); }
  if (b.cables.has('eps8')) { R(x, 10, 5, 58, 2, '#161616'); R(x, 66, 5, 2, 80, '#161616'); }
  if (b.cables.has('gpu_pwr') && p.gpu) R(x, 30, 50, 2, 34, '#161616');
  // nätaggskåpa
  R(x, 0, 84, W, H - 84, col);
  R(x, 0, 84, W, 1, 'rgba(255,255,255,.18)');
  drawText(x, cs.name.split(' ')[0].toUpperCase(), 8, 94, css((((col >> 16) & 255) > 150) ? 0x555555 : 0xcfcfcf));
  // fläktar fram och bak
  for (const [k, fy] of [['front1', 12], ['front2', 36], ['front3', 60]]) {
    if (!cs.fans.includes(k)) continue;
    R(x, 92, fy, 7, 22, '#151515');
    const c = cs.rgb ? rgbAt('case', fy / 12) : null;
    if (c) { R(x, 92, fy + 1, 1, 20, c); glow.push([92, fy + 11, 22, c]); }
  }
  if (cs.fans.includes('rear')) { R(x, 0, 26, 5, 22, '#151515'); const c = cs.rgb ? rgbAt('case', 9) : null; if (c) { R(x, 4, 27, 1, 20, c); glow.push([4, 37, 16, c]); } }

  // ---- finare detaljer i halv-pixlar ----
  if (p.mb) {
    for (let i = 0; i < 40; i++) {                       // ytmonterade komponenter
      const sx = 18 + hash2(i, 1) * 48, sy = 44 + hash2(i, 2) * 10;
      F(x, Math.round(sx * 2) / 2, Math.round(sy * 2) / 2, 1, 0.5, hash2(i, 3) > 0.5 ? '#c9ccd0' : '#1b1b1e');
    }
    for (let i = 0; i < 12; i++) F(x, 20 + i * 2.5, 9.5, 0.5, 2.5, 'rgba(255,255,255,.18)');   // VRM-fenor
    for (const dx of [53, 57, 61]) F(x, dx, 11, 0.5, 30, '#0c0c0e');                            // RAM-slots
    for (let i = 0; i < 14; i++) F(x, 20 + i * 0.5 * 3, 42.5, 0.5, 0.5, '#d8b24a');           // kretsbanor
    F(x, 62.5, 57.5, 1.5, 3, '#e9e9e6');                                                       // PCIe-spärr
    F(x, 66, 20, 2, 12, '#161616'); for (let i = 0; i < 12; i++) F(x, 66.5, 20.5 + i, 0.5, 0.5, '#3a3a3a'); // 24-pin-uttag
  }
  if (p.cooler?.look.type === 'tower') {
    for (let i = 0; i < 4; i++) { F(x, 27 + i * 5, 12.5, 2, 1.5, '#c87533'); F(x, 27.5 + i * 5, 12.5, 0.5, 0.5, '#f0a060'); } // värmerör
    for (let i = 0; i < 30; i++) F(x, 24, 16 + i, 22, 0.5, 'rgba(255,255,255,.07)');
  }
  if (p.ram) for (const rx of [54, 58].slice(0, p.ram.sticks)) {
    for (let i = 0; i < 5; i++) F(x, rx + 0.5, 16 + i * 5, 2, 3, 'rgba(0,0,0,.35)');          // kretsar
    F(x, rx, 39.5, 3, 0.5, '#d8b24a');                                                        // guldkant
  }
  if (p.gpu) {
    const len = [40, 62, 84][p.gpu.len - 1];
    for (let i = 0; i < len - 4; i += 1.5) F(x, 6 + i, 68.5, 0.5, 1, 'rgba(0,0,0,.5)');        // kylflänsar
    F(x, 0.5, 57, 1, 1, '#1a1a1a'); F(x, 0.5, 60, 1, 1.5, '#1a1a1a'); F(x, 0.5, 64, 1, 1, '#1a1a1a'); // uttag i brackets
    if (p.gpu.pwr && b.cables.has('gpu_pwr')) { F(x, len - 12, 53.5, 4, 1.5, '#0c0c0c'); for (let i = 0; i < 4; i++) F(x, len - 11.5 + i, 54, 0.5, 0.5, '#e8c030'); }
  }
  if (b.cables.has('atx24')) for (let i = 0; i < 64; i += 1) F(x, 70, 20 + i, 4, 0.5, i % 3 ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.14)');
  for (let i = 2; i < W - 2; i += 2.5) F(x, i, 86, 1, 1, 'rgba(0,0,0,.35)');                   // perforering på kåpan
  for (const [k, fy] of [['front1', 12], ['front2', 36], ['front3', 60]]) {
    if (!cs.fans.includes(k)) continue;
    for (let i = 0; i < 20; i += 2) F(x, 93.5, fy + 1 + i, 3, 0.5, '#2a2a2e');                 // fläktblad i profil
  }

  // RGB-sken
  if (glow.length) {
    x.save(); x.globalCompositeOperation = 'lighter';
    for (const [gx, gy, r, c] of glow) {
      const g = x.createRadialGradient(gx, gy, 0, gx, gy, r);
      g.addColorStop(0, c + '66'); g.addColorStop(1, c + '00');
      x.fillStyle = g; x.fillRect(gx - r, gy - r, r * 2, r * 2);
    }
    x.restore();
  }
  if (!on) R(x, 0, 0, W, H, 'rgba(0,0,0,.18)');
  // glasreflex
  x.save(); x.globalAlpha = 0.12; x.fillStyle = '#fff';
  for (const off of [10, 16, 60]) { x.beginPath(); x.moveTo(off, 0); x.lineTo(off + 4, 0); x.lineTo(off - 36, H); x.lineTo(off - 40, H); x.fill(); }
  x.restore();
}

// ---------- Skärmen, 160×90 px ----------
const WALL = { kontor: ['#2c6fb7', '#9fd0f5'], skola: ['#2f8f46', '#bde8a8'], minecraft: ['#5ab4f0', '#8ed05c'], gaming: ['#1a1433', '#d8343c'], stream: ['#2a0f3a', '#9146ff'], ai: ['#0e1a2a', '#3fd0c0'], drom: ['#0b0b12', '#ff3ea5'] };

export function drawScreen(x, st, info, t) {
  const W = 160, H = 90;
  const s = st.screen;
  if (s === 'off' || s === 'black') {
    R(x, 0, 0, W, H, s === 'off' ? '#07080a' : '#000');
    x.fillStyle = 'rgba(255,255,255,.05)'; x.beginPath(); x.moveTo(20, 0); x.lineTo(60, 0); x.lineTo(20, H); x.lineTo(-20, H); x.fill();
    return;
  }
  if (s === 'nosignal') {
    R(x, 0, 0, W, H, '#000');
    const bx = 40 + Math.round(Math.sin(t * 0.7) * 20), by = 34 + Math.round(Math.cos(t * 0.5) * 12);
    R(x, bx, by, 80, 22, '#1b3a8a'); R(x, bx + 1, by + 1, 78, 20, '#0f2560');
    drawText(x, 'INGEN SIGNAL', bx + 17, by + 5, '#fff');
    drawText(x, 'HDMI 1', bx + 28, by + 13, '#9fb8f0');
    return;
  }
  if (s === 'post' || s === 'error') {
    R(x, 0, 0, W, H, '#000');
    drawText(x, 'PIXELVERKSTAN BIOS V2.6', 4, 4, '#9fd0f5');
    const lines = info.postLines;
    const n = Math.min(lines.length, Math.floor(st.t * 3.2));
    for (let i = 0; i < n; i++) drawText(x, lines[i], 4, 16 + i * 8, '#d8d8d8');
    if (s === 'error' && Math.floor(t * 2) % 2 === 0) drawText(x, st.errorText, 4, 16 + lines.length * 8 + 6, '#ff4d4d');
    return;
  }
  if (s === 'loading' || s === 'overheat') {
    R(x, 0, 0, W, H, '#05060b');
    const cx = W / 2, cy = 34;
    [[-7, -7, '#d8343c'], [1, -7, '#45b964'], [-7, 1, '#2c6fb7'], [1, 1, '#e8c030']].forEach(([dx, dy, c]) => R(x, cx + dx, cy + dy, 6, 6, c));
    drawText(x, 'PIXEL OS', cx - textWidth('PIXEL OS') / 2, 50, '#e8e8e8');
    for (let i = 0; i < 6; i++) { const a = t * 5 + i; R(x, cx + Math.cos(a) * 9 - 1, 66 + Math.sin(a) * 4, 2, 2, `rgba(255,255,255,${0.3 + (i / 6) * 0.7})`); }
    if (s === 'overheat' && Math.floor(t * 4) % 2) { R(x, 30, 76, 100, 10, '#8a1a20'); drawText(x, 'CPU 105 GRADER - AV!', 36, 78, '#fff'); }
    return;
  }
  // skrivbord
  const [c1, c2] = WALL[info.template] || WALL.kontor;
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, c1); g.addColorStop(1, c2);
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  if (info.template === 'minecraft') { for (let i = 0; i < W; i += 8) { const hgt = 60 + ((i * 7) % 3) * 4; R(x, i, hgt, 8, H - hgt, '#7a5230'); R(x, i, hgt, 8, 3, '#5cb033'); } }
  // app-fönster
  const win = (wx, wy, ww, wh, title) => { R(x, wx, wy, ww, wh, '#f2f2f2'); R(x, wx, wy, ww, 7, '#2a2d34'); drawText(x, title, wx + 2, wy + 1, '#fff'); R(x, wx + ww - 6, wy + 1, 5, 5, '#d8343c'); };
  switch (info.template) {
    case 'kontor': win(22, 10, 100, 58, 'KALKYL'); for (let r = 0; r < 6; r++) for (let q = 0; q < 6; q++) R(x, 24 + q * 16, 20 + r * 7, 15, 6, r === 0 ? '#cfe3f7' : '#fff'); break;
    case 'skola': win(24, 10, 104, 58, 'KOD.PY'); ['PRINT HEJ', 'FOR I IN 5:', '  RITA I'].forEach((l, i) => drawText(x, l, 28, 22 + i * 9, ['#2c6fb7', '#9e1b22', '#2f8f46'][i])); break;
    case 'minecraft': R(x, 60, 30, 12, 12, '#8a8a8a'); R(x, 72, 38, 10, 10, '#c8a060'); break;
    case 'stream': R(x, 6, 6, 110, 64, '#101018'); R(x, 10, 40, 100, 26, '#3a2a5a'); R(x, 8, 8, 18, 7, '#e91916'); drawText(x, 'LIVE', 9, 9, '#fff'); R(x, 120, 6, 34, 64, '#18181b'); for (let i = 0; i < 6; i++) R(x, 122, 10 + i * 10, 20 + ((i * 13) % 10), 3, '#9146ff'); break;
    case 'ai': win(20, 8, 120, 62, 'RENDER'); for (let i = 0; i < 8; i++) { x.strokeStyle = '#3fd0c0'; x.beginPath(); x.moveTo(80 + Math.cos(t + i) * 30, 40 + Math.sin(t + i * 2) * 20); x.lineTo(80 + Math.cos(t + i + 2) * 30, 40 + Math.sin(t + i * 2 + 2) * 20); x.stroke(); } break;
    default: { R(x, 0, 0, W, 76, '#141020'); for (let i = 0; i < 12; i++) R(x, (i * 37 + t * 20) % W, 30 + (i * 11) % 30, 3, 3, css(rainbow(t, i))); R(x, W / 2 - 4, 38, 8, 1, '#fff'); R(x, W / 2, 34, 1, 8, '#fff'); drawText(x, info.template === 'drom' ? 'ULTRA 4K 240 FPS' : '144 FPS', 4, 4, '#45ff7a'); }
  }
  // aktivitetsfält + muspekare
  R(x, 0, H - 8, W, 8, 'rgba(10,12,18,.9)');
  [['#d8343c', 4], ['#2c6fb7', 12], ['#45b964', 20]].forEach(([c, ix]) => R(x, ix, H - 6, 5, 4, c));
  drawText(x, info.clock, W - 22, H - 7, '#ddd');
  if (st.mouse) {
    const mx = 90 + Math.round(Math.sin(t * 1.3) * 30), my = 50 + Math.round(Math.cos(t * 0.9) * 15);
    for (let i = 0; i < 6; i++) { R(x, mx, my + i, i + 1, 1, '#fff'); R(x, mx + i + 1, my + i, 1, 1, '#000'); }
  }
}

// ---------- Baksidan, 90×160 px ----------
export function rearPorts(b) {
  const p = b.placed, ports = [];
  for (const [i, [px, py]] of [[11, 14], [22, 14], [11, 22], [22, 22]].entries()) ports.push({ key: 'USB_' + (i + 1), type: 'usb', x: px, y: py, w: 9, h: 5, label: 'USB' });
  ports.push({ key: 'HDMI_MB', type: 'hdmi', x: 10, y: 31, w: 13, h: 6, label: 'HDMI (moderkort)' });
  ports.push({ key: 'DP_MB', type: 'dp', x: 25, y: 31, w: 10, h: 6, label: 'DisplayPort (moderkort)' });
  ports.push({ key: 'LAN', type: 'lan', x: 11, y: 42, w: 10, h: 9, label: 'Nätverk' });
  if (p.gpu) {
    const n = p.gpu.len >= 2 ? 3 : 2;
    for (let i = 0; i < n; i++) ports.push({ key: 'DP_GPU' + i, type: 'dp', x: 12 + i * 12, y: 88, w: 10, h: 6, label: 'DisplayPort (grafikkort)' });
    ports.push({ key: 'HDMI_GPU', type: 'hdmi', x: 12 + n * 12, y: 88, w: 13, h: 6, label: 'HDMI (grafikkort)' });
  }
  ports.push({ key: 'PSU_IN', type: 'c13', x: 10, y: 131, w: 15, h: 13, label: 'Ström in' });
  return ports;
}
export const SWITCH = { x: 30, y: 131, w: 9, h: 13 };

export function drawRear(x, b, st, t, plugged) {
  const p = b.placed, W = 90, H = 160;
  const col = hex(p.case.look.color), light = ((col >> 16) & 255) > 150;
  R(x, 0, 0, W, H, col);
  R(x, 0, 0, W, 1, 'rgba(255,255,255,.2)'); R(x, 0, 0, 1, H, 'rgba(255,255,255,.12)');
  // I/O-skölden
  R(x, 7, 9, 32, 70, '#3c4047'); R(x, 8, 10, 30, 68, '#565b63');
  for (const port of rearPorts(b)) {
    const { x: px, y: py, w, h } = port;
    if (port.type === 'usb') { R(x, px, py, w, h, '#1d1d1d'); R(x, px + 1, py + 1, w - 2, 2, '#2d63c8'); }
    if (port.type === 'hdmi') { R(x, px, py, w, h, '#101010'); R(x, px + 1, py + 1, w - 2, h - 3, '#2a2a2a'); R(x, px + 2, py + h - 2, w - 4, 1, '#101010'); }
    if (port.type === 'dp') { R(x, px, py, w, h, '#101010'); R(x, px + 1, py + 1, w - 2, h - 2, '#2a2a2a'); R(x, px + w - 2, py + h - 2, 2, 2, port.key.includes('GPU') ? '#a3a8ad' : '#565b63'); }
    if (port.type === 'lan') { R(x, px, py, w, h, '#101010'); R(x, px + 2, py + 2, w - 4, h - 3, '#3a3a3a'); R(x, px, py, 2, 2, st.powered ? '#45ff7a' : '#335533'); R(x, px + w - 2, py, 2, 2, st.powered && Math.floor(t * 6) % 2 ? '#ffd23a' : '#554a22'); }
    if (port.type === 'c13') { R(x, px, py, w, h, '#101010'); R(x, px + 2, py + 2, w - 4, h - 4, '#262626'); for (const dx of [4, 7, 10]) R(x, px + dx, py + 5, 1, 3, '#b9bdc2'); }
  }
  for (const [i, c] of ['#45b964', '#e85aa0', '#3a8fd8'].entries()) { R(x, 12 + i * 8, 62, 6, 6, '#111'); R(x, 13 + i * 8, 63, 4, 4, c); }
  // bakre fläkt
  const fanOn = st.powered && b.cables.has('case_fans');
  if (p.case.fans.includes('rear')) {
    const cx = 63, cy = 40, r = 19;
    x.save(); x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.clip();
    R(x, cx - r, cy - r, r * 2, r * 2, '#0c0c0e');
    const a0 = fanOn ? t * 14 : 0.4;
    for (let k = 0; k < 7; k++) { x.fillStyle = '#2b2b2e'; x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, r - 2, a0 + k * 0.9, a0 + k * 0.9 + 0.45); x.fill(); }
    if (p.case.rgb && st.powered && st.lit.case) { x.strokeStyle = css(rainbow(t, 9)); x.lineWidth = 2; x.beginPath(); x.arc(cx, cy, r - 1, 0, Math.PI * 2); x.stroke(); }
    x.restore();
    for (let yy = cy - r; yy < cy + r; yy += 3) R(x, cx - r, yy, r * 2, 1, 'rgba(0,0,0,.35)');
  }
  // expansionsluckor + grafikkortets bracket
  for (let i = 0; i < 5; i++) R(x, 7, 84 + i * 7, 70, 5, shadeCss(col, 0.8));
  if (p.gpu) R(x, 8, 84, 60, p.gpu.len >= 2 ? 13 : 6, '#b9bdc2');
  for (const port of rearPorts(b).filter((q) => q.key.includes('GPU'))) R(x, port.x, port.y, port.w, port.h, port.type === 'hdmi' ? '#101010' : '#1a1a1a');
  // nätagget
  R(x, 5, 124, 80, 32, '#1b1b1d'); R(x, 6, 125, 78, 30, '#232326');
  for (let yy = 127; yy < 153; yy += 3) for (let xx = 46 + ((yy / 3) % 2) * 1.5; xx < 82; xx += 3) R(x, xx, yy, 2, 2, '#0a0a0a');
  const S = SWITCH;
  R(x, S.x, S.y, S.w, S.h, '#0e0e0e');
  R(x, S.x + 1, st.psuOn ? S.y + 1 : S.y + 6, S.w - 2, 6, st.psuOn ? '#3a3a3a' : '#2a2a2a');
  drawText(x, st.psuOn ? 'I' : 'O', S.x + 3, st.psuOn ? S.y + 2 : S.y + 7, '#ddd');
  // inkopplade kontakter
  for (const [id, key] of Object.entries(plugged)) {
    const port = rearPorts(b).find((q) => q.key === key);
    if (!port) continue;
    drawPlugHead(x, PLUGS[id].type, port.x + port.w / 2, port.y + port.h / 2);
  }
  x.fillStyle = light ? 'rgba(0,0,0,.25)' : 'rgba(255,255,255,.15)';
}
const shadeCss = (c, f) => css(((Math.min(255, ((c >> 16) & 255) * f) | 0) << 16) | ((Math.min(255, ((c >> 8) & 255) * f) | 0) << 8) | (Math.min(255, (c & 255) * f) | 0));

// ---------- Kontakter ----------
export const PLUGS = {
  pc_power: { type: 'c13', name: 'Strömkabel till datorn', sub: 'C13 · 230 V', target: 'rear' },
  mon_power: { type: 'mains', name: 'Skärmens strömkabel', sub: 'till grenuttaget', target: 'strip' },
  hdmi: { type: 'hdmi', name: 'Skärmkabel (HDMI)', sub: 'skärm → datorn', target: 'rear' },
  kb: { type: 'usb', name: 'Tangentbord', sub: 'USB-A', target: 'rear' },
  mouse: { type: 'usb', name: 'Mus', sub: 'USB-A', target: 'rear' },
};

export function drawPlugHead(x, type, cx, cy) {
  const k = (a, b, w, h, c) => R(x, cx + a, cy + b, w, h, c);
  switch (type) {
    case 'c13': k(-7, -6, 15, 12, '#0c0c0c'); k(-5, -4, 11, 8, '#1f1f1f'); k(-9, 6, 19, 5, '#0c0c0c'); break;
    case 'hdmi': k(-6, -3, 13, 6, '#0c0c0c'); k(-5, -2, 11, 3, '#8a9097'); k(-2, 3, 5, 6, '#0c0c0c'); break;
    case 'usb': k(-4, -2, 9, 5, '#b9bdc2'); k(-3, -1, 7, 2, '#2d63c8'); k(-3, 3, 7, 6, '#1a1a1a'); break;
    case 'mains': k(-5, -5, 11, 10, '#e9e9e6'); k(-3, -1, 2, 2, '#555'); k(2, -1, 2, 2, '#555'); break;
  }
}

export function plugIcon(id, W, H) {
  const c = document.createElement('canvas'); c.width = 32; c.height = 27;
  const x = c.getContext('2d');
  const type = PLUGS[id].type;
  for (let i = 0; i < 14; i++) R(x, i, 17 + Math.round(Math.sin(i / 2) * 2), 2, 2, type === 'mains' ? '#e0e0dc' : '#151515');
  drawPlugHead(x, type, 20, 12);
  if (id === 'kb') { R(x, 1, 2, 14, 7, '#222'); for (let i = 0; i < 6; i++) R(x, 2 + i * 2, 3, 1, 1, '#888'); for (let i = 0; i < 5; i++) R(x, 3 + i * 2, 6, 1, 1, '#888'); }
  if (id === 'mouse') { R(x, 3, 1, 7, 10, '#222'); R(x, 6, 2, 1, 3, '#888'); }
  if (id === 'hdmi') { R(x, 1, 1, 13, 9, '#222'); R(x, 2, 2, 11, 6, '#3c78d8'); }
  if (id === 'pc_power' || id === 'mon_power') { R(x, 2, 2, 3, 6, '#e8c030'); R(x, 4, 4, 3, 4, '#e8c030'); }
  const out = document.createElement('canvas'); out.width = W; out.height = H;
  const o = out.getContext('2d'); o.imageSmoothingEnabled = false;
  const s = Math.floor(Math.min(W / 32, H / 27));
  o.drawImage(c, (W - 32 * s) / 2, (H - 27 * s) / 2, 32 * s, 27 * s);
  return out;
}
