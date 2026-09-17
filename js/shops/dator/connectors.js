// Kontakttyper: pixlade ikoner (för lådan) + hur kablarna ritas i byggvyn.
import { shade, rainbow } from '../../core/raster.js';

// type → { name, pins (text), color, width (px i lågupplöst lager), fits (förklaring) }
export const CONN = {
  // ---- ström från nätagget ----
  at6:     { name: 'P8/P9 (AT-ström)', color: 0xf2f2ee, stripe: 0x1c1c1c, width: 4, wires: [0x1c1c1c, 0x1c1c1c, 0xd83030, 0xe8c030, 0x2c6fb7, 0xf2f2ee], desc: 'två vita 6-stiftskontakter – de svarta sladdarna ska mötas i mitten' },
  atx20:   { name: '20-pin ATX', color: 0xf2f2ee, stripe: 0xe8c030, width: 4, wires: [0xe8c030, 0xd83030, 0x1c1c1c, 0xf07a1a, 0x8a3fc0], desc: 'vit kontakt med 20 stift i två rader och en hake' },
  atx24:   { name: '24-pin ATX', color: 0x1c1c1c, stripe: 0x3a3a3a, width: 4, desc: 'bred kontakt med 24 stift i två rader' },
  atx12v4: { name: '4-pin ATX12V (P4)', color: 0xf2f2ee, stripe: 0xe8c030, width: 3, wires: [0xe8c030, 0x1c1c1c], desc: 'fyrkantig vit kontakt med 4 stift – gul och svart sladd' },
  eps8:    { name: '8-pin CPU (EPS)', color: 0x1c1c1c, stripe: 0xe8c030, width: 3, desc: '8 stift, fyrkantiga och rundade hål i ett visst mönster' },
  molex:   { name: 'Molex (4-pin)', color: 0xf2f2ee, stripe: 0xe8c030, width: 3, wires: [0xe8c030, 0x1c1c1c, 0x1c1c1c, 0xd83030], desc: 'stor vit kontakt med 4 runda stift och avfasade hörn' },
  berg:    { name: 'Diskettström (Berg)', color: 0xf2f2ee, stripe: 0xd83030, width: 2, wires: [0xe8c030, 0x1c1c1c, 0xd83030], desc: 'liten vit kontakt med 4 stift' },
  pcie6:   { name: '6-pin PCIe', color: 0x1c1c1c, stripe: 0xe8c030, width: 3, desc: '6 stift i två rader' },
  pcie8:   { name: '8-pin PCIe', color: 0x1c1c1c, stripe: 0x45b964, width: 3, desc: '6+2 stift – ser ut som CPU-kontakten men hacken sitter annorlunda' },
  '2xpcie8': { name: '2× 8-pin PCIe', color: 0x1c1c1c, stripe: 0x45b964, width: 4, desc: 'två 8-pin PCIe-kontakter bredvid varandra' },
  '3xpcie8': { name: '3× 8-pin PCIe', color: 0x1c1c1c, stripe: 0x45b964, width: 5, desc: 'tre 8-pin PCIe-kontakter i rad' },
  '12vhpwr': { name: '12V-2x6 (16-pin)', color: 0x1c1c1c, stripe: 0x7ee8fa, width: 3, desc: 'liten kontakt med 12 stift + 4 små signalstift' },
  satap:   { name: 'SATA-ström', color: 0x1c1c1c, stripe: 0xe07a2e, width: 2, desc: 'platt L-formad kontakt, 15 stift' },
  // ---- data ----
  mfm:     { name: 'MFM-flatkablar (34+20)', color: 0xa9a9a2, stripe: 0xc9323a, width: 5, ribbon: true, desc: 'två grå flatkablar: 34 stift för styrning och 20 stift för data' },
  ide:     { name: 'IDE-flatkabel (40-pin)', color: 0xa9a9a2, stripe: 0xc9323a, width: 5, ribbon: true, desc: 'bred grå flatkabel – den röda kanten ska mot stift 1' },
  floppy:  { name: 'Diskettkabel (34-pin)', color: 0xa9a9a2, stripe: 0xc9323a, width: 4, ribbon: true, desc: 'grå flatkabel med ett tvinnat parti – den tvinnade änden går till A:' },
  satad:   { name: 'SATA-data', color: 0xc9323a, stripe: 0xe85a60, width: 2, desc: 'smal L-formad kontakt, 7 stift' },
  cdaudio: { name: 'CD-ljud (4-pin)', color: 0x1c1c1c, stripe: 0xd83030, width: 1, wires: [0xd83030, 0x1c1c1c, 0xf2f2ee], desc: 'tunn kabel med liten svart 4-stiftskontakt' },
  // ---- fläktar, lampor, front ----
  fan3:    { name: '3-pin fläkt', color: 0x1c1c1c, stripe: 0xd83030, width: 1, wires: [0x1c1c1c, 0xd83030, 0xe8c030], desc: 'liten kontakt med 3 stift och styrkant – passar även i 4-pin' },
  fan4:    { name: '4-pin fläkt', color: 0x1c1c1c, stripe: 0x6a6a6a, width: 1, desc: 'liten vit kontakt med 4 stift' },
  argb:    { name: '3-pin ARGB (5 V)', color: 0xdcdcdc, stripe: 0x9a9a9a, width: 1, desc: '3 stift med ett tomt hål (5 V-D-G)' },
  fpanel:  { name: 'Frontpanel', color: 0xc9323a, stripe: 0x2c6fb7, width: 2, rainbow: true, desc: 'små sladdar för startknapp, reset och lampor' },
  fpanel_at: { name: 'Frontpanel (AT)', color: 0xc9323a, stripe: 0x2c6fb7, width: 2, rainbow: true, desc: 'små sladdar för reset, turbo, lampor och högtalaren' },
  usb2:    { name: 'USB 2.0 (9-pin)', color: 0x1c1c1c, stripe: 0x9a9a9a, width: 1, desc: 'liten svart kontakt, 9 stift i två rader' },
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
    case 'at6': {
      const w6 = ['#1c1c1c', '#1c1c1c', '#d83030', '#e8c030', '#2c6fb7', '#efefea'];
      pinGrid(8, 11, 3, 1, '#efefea', '#1a1a1a', 2, 1); pinGrid(19, 11, 3, 1, '#efefea', '#1a1a1a', 2, 1);
      R(12, 8, 3, 2, '#efefea'); R(23, 8, 3, 2, '#efefea');
      for (let i = 0; i < 3; i++) { R(8 + i * 3, 15, 2, 4, w6[i]); R(19 + i * 3, 15, 2, 4, w6[2 - i]); }
      break;
    }
    case 'atx20': pinGrid(11, 11, 6, 2, '#efefea', '#3c3c3c', 2, 1); R(15, 8, 8, 2, '#efefea'); R(17, 7, 4, 1, '#d8d8d2'); for (let i = 0; i < 6; i++) R(11 + i * 3, 17, 2, 2, ['#e8c030', '#d83030', '#1c1c1c', '#f07a1a', '#8a3fc0', '#1c1c1c'][i]); break;
    case 'atx24': pinGrid(10, 11, 7, 2, '#161616', '#3c3c3c', 2, 1); R(14, 8, 8, 2, '#161616'); R(16, 7, 4, 1, '#2a2a2a'); break;
    case 'atx12v4': pinGrid(14, 11, 2, 2, '#efefea', '#4a4a4a'); R(15, 8, 4, 2, '#efefea'); R(14, 17, 2, 2, '#e8c030'); R(17, 17, 2, 2, '#1c1c1c'); break;
    case 'eps8': pinGrid(12, 11, 4, 2, '#161616', '#4a4a4a'); R(14, 8, 6, 2, '#161616'); R(12, 18, 3, 1, '#e8c030'); break;
    case 'molex':
      R(10, 10, 17, 8, '#efefea'); R(10, 10, 2, 2, '#1a1a1a'); R(25, 10, 2, 2, '#1a1a1a');
      for (let i = 0; i < 4; i++) { R(12 + i * 4, 12, 3, 3, '#c9a24a'); R(13 + i * 4, 13, 1, 1, '#7a5a1a'); R(12 + i * 4, 18, 3, 2, ['#e8c030', '#1c1c1c', '#1c1c1c', '#d83030'][i]); }
      break;
    case 'berg': R(13, 11, 11, 5, '#efefea'); for (let i = 0; i < 4; i++) R(14 + i * 3, 13, 1, 1, '#1a1a1a'); R(13, 16, 2, 2, '#e8c030'); R(17, 16, 2, 2, '#1c1c1c'); R(21, 16, 2, 2, '#d83030'); break;
    case 'pcie6': pinGrid(13, 11, 3, 2, '#161616', '#4a4a4a'); R(15, 8, 5, 2, '#161616'); R(13, 18, 3, 1, '#e8c030'); break;
    case 'pcie8': pinGrid(12, 11, 3, 2, '#161616', '#4a4a4a'); pinGrid(22, 11, 1, 2, '#161616', '#4a4a4a'); R(14, 8, 6, 2, '#161616'); R(12, 18, 3, 1, '#45b964'); break;
    case '2xpcie8': pinGrid(6, 11, 4, 2, '#161616', '#4a4a4a'); pinGrid(19, 11, 4, 2, '#161616', '#4a4a4a'); R(8, 8, 6, 2, '#161616'); R(21, 8, 6, 2, '#161616'); break;
    case '3xpcie8': pinGrid(3, 12, 3, 2, '#161616', '#4a4a4a', 2, 1); pinGrid(13, 12, 3, 2, '#161616', '#4a4a4a', 2, 1); pinGrid(23, 12, 3, 2, '#161616', '#4a4a4a', 2, 1); for (const q of [4, 14, 24]) R(q, 9, 5, 2, '#161616'); break;
    case '12vhpwr': pinGrid(11, 12, 6, 2, '#161616', '#555', 1, 1); for (let i = 0; i < 4; i++) R(12 + i * 2, 9, 1, 1, '#7ee8fa'); R(15, 7, 4, 1, '#161616'); break;
    case 'satap': R(10, 11, 16, 5, '#161616'); R(10, 11, 3, 8, '#161616'); R(13, 13, 12, 1, '#c79a3a'); break;
    case 'satad': R(12, 11, 11, 5, '#c9323a'); R(12, 11, 3, 8, '#c9323a'); R(15, 13, 7, 1, '#f0c040'); break;
    case 'ide': case 'floppy': case 'mfm': {
      const n = type === 'ide' ? 10 : type === 'floppy' ? 9 : 7;
      R(3, 17, 26, 5, '#a9a9a2'); R(3, 17, 26, 1, '#c9323a'); for (let i = 3; i < 29; i += 2) R(i, 18, 1, 4, '#8f8f88');
      if (type === 'floppy') { R(12, 16, 4, 7, '#9a9a92'); R(13, 15, 2, 9, '#b9b9b2'); }
      R(6, 8, n * 2 + 2, 7, '#2a2a2a'); pinGrid(7, 9, n, 2, '#2a2a2a', '#707070', 1, 1); R(6 + n, 6, 3, 2, '#2a2a2a');
      if (type === 'mfm') { R(22, 9, 7, 6, '#2a2a2a'); pinGrid(23, 10, 3, 2, '#2a2a2a', '#707070', 1, 1); }
      break;
    }
    case 'cdaudio': pinGrid(14, 12, 4, 1, '#161616', '#b9b9b2', 1, 1); R(13, 15, 9, 1, '#161616'); R(14, 16, 1, 3, '#d83030'); R(16, 16, 1, 3, '#1c1c1c'); R(18, 16, 1, 3, '#efefea'); break;
    case 'fan3': pinGrid(14, 12, 3, 1, '#1c1c1c', '#c8c8c2', 2, 1); R(13, 15, 11, 1, '#1c1c1c'); R(14, 16, 2, 3, '#1c1c1c'); R(17, 16, 2, 3, '#d83030'); R(20, 16, 2, 3, '#e8c030'); break;
    case 'fan4': pinGrid(13, 12, 4, 1, '#efefea', '#1a1a1a', 2, 1); R(12, 15, 13, 1, '#c8c8c2'); break;
    case 'argb': pinGrid(14, 12, 3, 1, '#efefea', '#1a1a1a', 2, 1, 1); R(18, 10, 1, 2, '#e04040'); break;
    case 'fpanel': case 'fpanel_at': {
      const cols = ['#c9323a', '#efefea', '#2c6fb7', '#45b964', '#e8c030'];
      cols.forEach((col, i) => { R(11 + i * 4, 10, 3, 5, '#141414'); R(12 + i * 4, 11, 1, 1, col); R(11 + i * 4, 15, 3, 1, col); });
      if (type === 'fpanel_at') { R(3, 6, 6, 5, '#e8c030'); R(4, 7, 4, 3, '#141414'); }
      break;
    }
    case 'usb2': pinGrid(13, 11, 5, 2, '#161616', '#555', 2, 1, 9); R(12, 17, 15, 1, '#2d63c8'); break;
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
    if (cable.wires) {
      // lösa färgade sladdar: en färg per tråd tvärs över kabeln
      // parallella trådar: varje tråd behåller sin färg längs hela kabeln
      const n = cable.wires.length, bw = Math.max(1, Math.floor(w / n));
      for (let k = 0; k < n; k++) { ctx.fillStyle = hex(cable.wires[k]); ctx.fillRect(Math.round(x - w / 2) + k * bw, Math.round(y - w / 2), bw, w); }
      continue;
    }
    if (cable.ribbon) {
      // grå flatkabel med röd kant (stift 1)
      ctx.fillStyle = hex(cable.color); ctx.fillRect(Math.round(x - w / 2), Math.round(y - w / 2), w, w);
      ctx.fillStyle = hex(cable.stripe); ctx.fillRect(Math.round(x - w / 2), Math.round(y - w / 2), Math.max(1, scale | 0), w);
      if (i % 2) { ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(Math.round(x - w / 2), Math.round(y - w / 2), w, w); }
      continue;
    }
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
