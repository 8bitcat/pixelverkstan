// Kontakttyper: pixlade ikoner (för lådan) + hur kablarna ritas i byggvyn.
import { shade, rainbow } from '../../core/raster.js';

// type → { name, pins (text), color, width (px i lågupplöst lager), fits (förklaring) }
export const CONN = {
  atx24:   { name: '24-pin ATX', color: 0x1c1c1c, stripe: 0x3a3a3a, width: 4, desc: 'bred kontakt med 24 stift i två rader' },
  eps8:    { name: '8-pin CPU (EPS)', color: 0x1c1c1c, stripe: 0xe8c030, width: 3, desc: '8 stift, fyrkantiga och rundade hål i ett visst mönster' },
  pcie8:   { name: '8-pin PCIe', color: 0x1c1c1c, stripe: 0x45b964, width: 3, desc: '6+2 stift – ser ut som CPU-kontakten men hacken sitter annorlunda' },
  '12vhpwr': { name: '12V-2x6 (16-pin)', color: 0x1c1c1c, stripe: 0x7ee8fa, width: 3, desc: 'liten kontakt med 12 stift + 4 små signalstift' },
  satap:   { name: 'SATA-ström', color: 0x1c1c1c, stripe: 0xe07a2e, width: 2, desc: 'platt L-formad kontakt, 15 stift' },
  satad:   { name: 'SATA-data', color: 0xc9323a, stripe: 0xe85a60, width: 2, desc: 'smal L-formad kontakt, 7 stift' },
  fan4:    { name: '4-pin fläkt', color: 0x1c1c1c, stripe: 0x6a6a6a, width: 1, desc: 'liten vit kontakt med 4 stift' },
  argb:    { name: '3-pin ARGB (5 V)', color: 0xdcdcdc, stripe: 0x9a9a9a, width: 1, desc: '3 stift med ett tomt hål (5 V-D-G)' },
  fpanel:  { name: 'Frontpanel', color: 0xc9323a, stripe: 0x2c6fb7, width: 2, rainbow: true, desc: 'små sladdar för startknapp, reset och lampor' },
  usb3:    { name: 'USB 3.0 (19-pin)', color: 0x2d63c8, stripe: 0x6f9be8, width: 2, desc: 'tjock blå kontakt med 19 stift' },
  audio:   { name: 'HD Audio', color: 0x1c1c1c, stripe: 0x9a9a9a, width: 1, desc: '9 stift med ett spärrat hål' },
};

// Pixelikon för en kontakt (ritas 2D, rakt framifrån)
export function connectorIcon(type, W = 64, H = 54) {
  const c = document.createElement('canvas');
  c.width = 32; c.height = 27;
  const x = c.getContext('2d');
  const R = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
  const cable = CONN[type];
  const cc = '#' + cable.color.toString(16).padStart(6, '0');
  // kabel som slingrar in från vänster
  for (let i = 0; i < 12; i++) R(i, 16 + Math.round(Math.sin(i / 2) * 2), 2, Math.max(1, cable.width - 1), cc);
  const pinGrid = (x0, y0, cols, rows, body, hole, pw = 2, gap = 1, skip = -1) => {
    R(x0 - 1, y0 - 1, cols * (pw + gap) + 1, rows * (pw + gap) + 1, body);
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) if (r * cols + q !== skip) R(x0 + q * (pw + gap), y0 + r * (pw + gap), pw, pw, hole);
  };
  switch (type) {
    case 'atx24': pinGrid(10, 11, 7, 2, '#161616', '#3c3c3c', 2, 1); R(14, 8, 8, 2, '#161616'); R(16, 7, 4, 1, '#2a2a2a'); break;
    case 'eps8': pinGrid(12, 11, 4, 2, '#161616', '#4a4a4a'); R(14, 8, 6, 2, '#161616'); R(12, 18, 3, 1, '#e8c030'); break;
    case 'pcie8': pinGrid(12, 11, 3, 2, '#161616', '#4a4a4a'); pinGrid(22, 11, 1, 2, '#161616', '#4a4a4a'); R(14, 8, 6, 2, '#161616'); R(12, 18, 3, 1, '#45b964'); break;
    case '12vhpwr': pinGrid(11, 12, 6, 2, '#161616', '#555', 1, 1); for (let i = 0; i < 4; i++) R(12 + i * 2, 9, 1, 1, '#7ee8fa'); R(15, 7, 4, 1, '#161616'); break;
    case 'satap': R(10, 11, 16, 5, '#161616'); R(10, 11, 3, 8, '#161616'); R(13, 13, 12, 1, '#c79a3a'); break;
    case 'satad': R(12, 11, 11, 5, '#c9323a'); R(12, 11, 3, 8, '#c9323a'); R(15, 13, 7, 1, '#f0c040'); break;
    case 'fan4': pinGrid(13, 12, 4, 1, '#efefea', '#1a1a1a', 2, 1); R(12, 15, 13, 1, '#c8c8c2'); break;
    case 'argb': pinGrid(14, 12, 3, 1, '#efefea', '#1a1a1a', 2, 1, 1); R(18, 10, 1, 2, '#e04040'); break;
    case 'fpanel': {
      const cols = ['#c9323a', '#efefea', '#2c6fb7', '#45b964', '#e8c030'];
      cols.forEach((col, i) => { R(11 + i * 4, 10, 3, 5, '#141414'); R(12 + i * 4, 11, 1, 1, col); R(11 + i * 4, 15, 3, 1, col); });
      break;
    }
    case 'usb3': R(11, 9, 16, 9, '#2d63c8'); pinGrid(13, 11, 5, 2, '#2d63c8', '#0e1a33'); R(17, 7, 4, 2, '#2d63c8'); break;
    case 'audio': pinGrid(13, 11, 5, 2, '#161616', '#555', 2, 1, 9); break;
  }
  const out = document.createElement('canvas');
  out.width = W; out.height = H;
  const o = out.getContext('2d'); o.imageSmoothingEnabled = false;
  const s = Math.floor(Math.min(W / 32, H / 27));
  o.drawImage(c, (W - 32 * s) / 2, (H - 27 * s) / 2, 32 * s, 27 * s);
  return out;
}

// Ritar en kabel i det lågupplösta kabellagret: pts = lista med [x,y], progress 0..1
export function drawCablePixels(ctx, pts, type, progress = 1, scale = 1) {
  const cable = CONN[type], w = Math.round(cable.width * scale);
  const n = Math.max(2, Math.floor((pts.length - 1) * progress) + 1);
  const hex = (c) => '#' + c.toString(16).padStart(6, '0');
  const outline = hex(shade(cable.color, cable.color > 0x808080 ? 0.55 : 0.35));
  // kontur
  ctx.fillStyle = outline;
  for (let i = 0; i < n; i++) { const [x, y] = pts[i]; ctx.fillRect(Math.round(x - w / 2) - 1, Math.round(y - w / 2) - 1, w + 2, w + 2); }
  // fyllning med ränder (sleeve)
  for (let i = 0; i < n; i++) {
    const [x, y] = pts[i];
    ctx.fillStyle = cable.rainbow ? hex(rainbow(0, i * 0.2, 0.5)) : hex(((i >> 2) % 3 === 0) ? cable.stripe : cable.color);
    ctx.fillRect(Math.round(x - w / 2), Math.round(y - w / 2), w, w);
    if (w >= 3 && !cable.rainbow) { ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(Math.round(x - w / 2), Math.round(y - w / 2), w, 1); }
  }
  if (progress >= 1) {
    const [x, y] = pts[pts.length - 1];
    const hh = Math.round(3 * scale);
    ctx.fillStyle = outline; ctx.fillRect(Math.round(x) - w - 1, Math.round(y) - hh, w * 2 + 3, hh * 2);
    ctx.fillStyle = hex(cable.color); ctx.fillRect(Math.round(x) - w, Math.round(y) - hh + 1, w * 2 + 1, hh * 2 - 2);
    ctx.fillStyle = hex(cable.stripe); ctx.fillRect(Math.round(x) - w, Math.round(y) - hh + 1, w * 2 + 1, Math.max(1, scale | 0));
    for (let i = 0; i < w * 2; i += 2) { ctx.fillStyle = '#d8b24a'; ctx.fillRect(Math.round(x) - w + i + 1, Math.round(y) + hh - 2, 1, 1); }
  }
}

// Punkter längs en kurva mellan två punkter som bågnar uppåt (i buffertkoordinater)
export function cableCurve(a, b, lift = 18) {
  const pts = [];
  const dist = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const steps = Math.max(6, Math.round(dist));
  const c1 = [a[0], a[1] - lift], c2 = [b[0], b[1] - lift];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, it = 1 - t;
    pts.push([
      it * it * it * a[0] + 3 * it * it * t * c1[0] + 3 * it * t * t * c2[0] + t * t * t * b[0],
      it * it * it * a[1] + 3 * it * it * t * c1[1] + 3 * it * t * t * c2[1] + t * t * t * b[1],
    ]);
  }
  return pts;
}
