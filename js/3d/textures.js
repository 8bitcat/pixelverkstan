// Tryckt grafik som ritas på canvas och blir texturer: produktkartonger, spelomslag,
// skyltar, neon och namnlappar. Pixelikonerna från 2D-butiken används som "tryck" på lådorna.
import * as THREE from 'three';

const cache = new Map();
export function canvasTex(c, { srgb = true, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  return t;
}
const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function rgb(hex) { const n = parseInt(String(hex || '#888888').replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const css = (c, k = 1) => { const [r, g, b] = rgb(c); return `rgb(${clamp(r * k, 0, 255) | 0},${clamp(g * k, 0, 255) | 0},${clamp(b * k, 0, 255) | 0})`; };
const luma = (c) => { const [r, g, b] = rgb(c); return (r * 0.299 + g * 0.587 + b * 0.114) / 255; };
const FONT = '"Segoe UI", "Helvetica Neue", Arial, sans-serif';
const HEAD = '"Jersey 10", Impact, "Arial Black", sans-serif';

function wrap(ctx, text, maxW, maxLines = 2) {
  const words = String(text).split(' '), lines = [];
  let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}
function barcode(ctx, x, y, w, h, seed = 7) {
  let s = seed;
  for (let i = 0; i < w; ) { s = (s * 1103515245 + 12345) & 0x7fffffff; const bw = 1 + (s % 3); if (s & 8) { ctx.fillRect(x + i, y, bw, h); } i += bw + 1; }
}

// Kartong: vänster halva = framsidan, höger halva = sidor/baksida (samma tryck på alla sidor)
export function boxArt(part, { catName = '', color = '#3a78d8', brandName = '', icon = null, year = null, sub = '' } = {}) {
  const key = 'box:' + part.id;
  if (cache.has(key)) return cache.get(key);
  const W = 512, H = 512, c = mk(W, H), x = c.getContext('2d');
  const dark = luma(color) > 0.55;
  const ink = dark ? '#17151a' : '#ffffff';
  // framsidan
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, css(color, 1.15)); g.addColorStop(1, css(color, 0.55));
  x.fillStyle = g; x.fillRect(0, 0, 256, H);
  // diagonalt ljusstråk
  x.save(); x.globalAlpha = 0.14; x.fillStyle = '#ffffff'; x.beginPath(); x.moveTo(0, 0); x.lineTo(256, 0); x.lineTo(256, 160); x.lineTo(0, 300); x.closePath(); x.fill(); x.restore();
  x.fillStyle = 'rgba(0,0,0,.28)'; x.fillRect(0, 0, 256, 48);
  x.fillStyle = ink; x.font = `bold 26px ${FONT}`; x.textBaseline = 'middle'; x.textAlign = 'left';
  x.fillText((brandName || catName || '').toUpperCase().slice(0, 16), 14, 24);
  if (year) { x.textAlign = 'right'; x.font = `18px ${FONT}`; x.fillText(String(year), 244, 24); }
  // ikonen (pixeltryck)
  if (icon && icon.width) {
    x.imageSmoothingEnabled = false;
    const s = Math.min(220 / icon.width, 190 / icon.height);
    const iw = icon.width * s, ih = icon.height * s;
    x.save(); x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 18; x.shadowOffsetY = 10;
    x.drawImage(icon, (256 - iw) / 2, 70 + (190 - ih) / 2, iw, ih); x.restore();
    x.imageSmoothingEnabled = true;
  }
  // produktnamn
  x.textAlign = 'left'; x.textBaseline = 'alphabetic';
  x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(0, 286, 256, 128);
  x.fillStyle = '#ffffff'; x.font = `bold 30px ${FONT}`;
  const lines = wrap(x, part.name || '', 232, 2);
  lines.forEach((l, i) => x.fillText(l, 12, 322 + i * 36));
  x.font = `17px ${FONT}`; x.fillStyle = 'rgba(255,255,255,.85)';
  x.fillText((sub || catName).slice(0, 30), 12, 400);
  // botten: streckkod + specar
  x.fillStyle = '#ffffff'; x.fillRect(12, 430, 232, 68);
  x.fillStyle = '#17151a'; barcode(x, 22, 440, 120, 40, (part.name || '').length * 31 + 7);
  x.font = `12px ${FONT}`; x.fillText('MADE FOR PIXELVERKSTAN', 22, 492);
  x.font = `bold 14px ${FONT}`; x.textAlign = 'right';
  x.fillText((part.tier ? 'TIER ' + part.tier : '').toString(), 236, 456);
  x.fillText(catName.toUpperCase().slice(0, 18), 236, 476);
  // sidorna: mörkare, med namnet stående
  x.fillStyle = css(color, 0.62); x.fillRect(256, 0, 256, H);
  x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(256, 0, 256, 40); x.fillRect(256, H - 40, 256, 40);
  x.save(); x.translate(384, 256); x.rotate(-Math.PI / 2); x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = '#ffffff'; x.font = `bold 34px ${FONT}`; x.fillText((part.name || '').slice(0, 22), 0, -30);
  x.font = `20px ${FONT}`; x.fillStyle = 'rgba(255,255,255,.8)'; x.fillText((brandName || catName).toUpperCase().slice(0, 20), 0, 14);
  x.restore();
  const t = canvasTex(c);
  cache.set(key, t);
  return t;
}

// Spelomslag/konsolkartong: pixelomslaget uppskalat som tryck + titel
export function coverArt(product, sprite, { color = '#3a78d8', label = '' } = {}) {
  const key = 'cover:' + product.id;
  if (cache.has(key)) return cache.get(key);
  const W = 512, H = 512, c = mk(W, H), x = c.getContext('2d');
  x.fillStyle = css(color, 0.5); x.fillRect(0, 0, W, H);
  if (sprite && sprite.width) {
    x.imageSmoothingEnabled = false;
    const s = Math.min(240 / sprite.width, 440 / sprite.height);
    const iw = sprite.width * s, ih = sprite.height * s;
    x.drawImage(sprite, (256 - iw) / 2, (H - ih) / 2, iw, ih);
    x.imageSmoothingEnabled = true;
    // glans
    const g = x.createLinearGradient(0, 0, 256, 0); g.addColorStop(0, 'rgba(255,255,255,.18)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,.1)');
    x.fillStyle = g; x.fillRect(0, 0, 256, H);
  } else {
    x.fillStyle = '#ffffff'; x.font = `bold 34px ${FONT}`; x.textAlign = 'center';
    wrap(x, product.name, 230, 3).forEach((l, i) => x.fillText(l, 128, 200 + i * 40));
  }
  x.fillStyle = css(color, 0.6); x.fillRect(256, 0, 256, H);
  x.save(); x.translate(384, 256); x.rotate(-Math.PI / 2); x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = '#ffffff'; x.font = `bold 36px ${FONT}`; x.fillText((product.name || '').slice(0, 22), 0, -10);
  x.font = `20px ${FONT}`; x.fillStyle = 'rgba(255,255,255,.8)'; x.fillText(label.toUpperCase().slice(0, 22), 0, 30);
  x.restore();
  const t = canvasTex(c);
  cache.set(key, t);
  return t;
}

// Affisch: stjärnobjektet med pixelikon, "NYHET!" och namn
export function poster(part, icon, color = '#7ee8fa', tagline = 'NYHET!') {
  const key = 'poster:' + (part?.id || 'x') + color;
  if (cache.has(key)) return cache.get(key);
  const W = 512, H = 720, c = mk(W, H), x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1b1a22'); g.addColorStop(1, css(color, 0.35));
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.strokeStyle = color; x.lineWidth = 10; x.strokeRect(24, 24, W - 48, H - 48);
  x.fillStyle = color; x.font = `bold 92px ${HEAD}`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(tagline, W / 2, 110);
  if (icon && icon.width) {
    x.imageSmoothingEnabled = false;
    const s = Math.min(380 / icon.width, 300 / icon.height), iw = icon.width * s, ih = icon.height * s;
    x.save(); x.shadowColor = color; x.shadowBlur = 40; x.drawImage(icon, (W - iw) / 2, 190 + (300 - ih) / 2, iw, ih); x.restore();
    x.imageSmoothingEnabled = true;
  }
  x.fillStyle = '#ffffff'; x.font = `bold 44px ${FONT}`;
  wrap(x, part?.name || '', W - 90, 2).forEach((l, i) => x.fillText(l, W / 2, 560 + i * 50));
  x.font = `26px ${FONT}`; x.fillStyle = 'rgba(255,255,255,.75)'; x.fillText('Fråga oss i butiken', W / 2, 670);
  const t = canvasTex(c);
  cache.set(key, t);
  return t;
}

// Skylt: text på färgad platta (kategorinamn, BESTÄLL, Ledig plats …)
export function plate(text, { bg = '#3a78d8', fg = null, w = 512, h = 128, sub = '', font = HEAD, size = 0 } = {}) {
  const key = 'plate:' + text + '|' + sub + '|' + bg + '|' + w + 'x' + h;
  if (cache.has(key)) return cache.get(key);
  const c = mk(w, h), x = c.getContext('2d');
  const ink = fg || (luma(bg) > 0.55 ? '#17151a' : '#ffffff');
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  x.fillStyle = 'rgba(255,255,255,.12)'; x.fillRect(0, 0, w, h * 0.45);
  x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = Math.max(4, h * 0.05); x.strokeRect(x.lineWidth / 2, x.lineWidth / 2, w - x.lineWidth, h - x.lineWidth);
  x.fillStyle = ink; x.textAlign = 'center'; x.textBaseline = 'middle';
  const fs = size || Math.min(h * (sub ? 0.5 : 0.66), (w - 40) / Math.max(1, String(text).length * 0.5));
  x.font = `${fs}px ${font}`;
  x.fillText(String(text), w / 2, sub ? h * 0.38 : h / 2);
  if (sub) { x.font = `${fs * 0.42}px ${FONT}`; x.fillStyle = ink; x.globalAlpha = 0.85; x.fillText(sub, w / 2, h * 0.76); x.globalAlpha = 1; }
  const t = canvasTex(c);
  cache.set(key, t);
  return t;
}

// Neon: glödande text på genomskinlig botten (ritas med bloom)
export function neon(text, color = '#7ee8fa', { w = 1024, h = 256 } = {}) {
  const key = 'neon:' + text + color;
  if (cache.has(key)) return cache.get(key);
  const c = mk(w, h), x = c.getContext('2d');
  x.clearRect(0, 0, w, h);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  const fs = Math.min(h * 0.72, (w - 60) / Math.max(1, text.length * 0.55));
  x.font = `${fs}px ${HEAD}`;
  // rör: mörk bakgrundskontur, glöd, ljus kärna
  x.lineJoin = 'round';
  x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = fs * 0.16; x.strokeText(text, w / 2, h / 2);
  x.shadowColor = color; x.shadowBlur = fs * 0.45;
  x.strokeStyle = color; x.lineWidth = fs * 0.09; x.strokeText(text, w / 2, h / 2); x.strokeText(text, w / 2, h / 2);
  x.shadowBlur = 0; x.strokeStyle = '#ffffff'; x.lineWidth = fs * 0.035; x.strokeText(text, w / 2, h / 2);
  const t = canvasTex(c);
  cache.set(key, t);
  return t;
}

// Namnlapp/pratbubbla som sprite ovanför huvudet
export function tag(text, { color = '#7ee8fa', big = false } = {}) {
  const fs = big ? 44 : 34;
  const c0 = mk(8, 8), m = c0.getContext('2d'); m.font = `${fs}px ${HEAD}`;
  const tw = Math.min(520, Math.ceil(m.measureText(text).width) + 36), th = fs + 28;
  const c = mk(tw, th), x = c.getContext('2d');
  x.fillStyle = '#17151a'; x.fillRect(0, 0, tw, th);
  x.fillStyle = '#ffffff'; x.fillRect(4, 4, tw - 8, th - 8);
  x.fillStyle = color; x.fillRect(4, 4, 10, th - 8);
  x.fillStyle = '#17151a'; x.font = `${fs}px ${HEAD}`; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, tw / 2 + 4, th / 2);
  const t = canvasTex(c);
  t.userData = { w: tw, h: th };
  return t;
}
// Markör "!" över kunden som står först i kön
export function marker(text = '!', color = '#f5c542') {
  const key = 'mark:' + text + color;
  if (cache.has(key)) return cache.get(key);
  const c = mk(128, 128), x = c.getContext('2d');
  x.fillStyle = color; x.beginPath(); x.arc(64, 64, 56, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#17151a'; x.font = `100px ${HEAD}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 64, 70);
  const t = canvasTex(c);
  cache.set(key, t);
  return t;
}

// Kartonggeometri där framsidan (+z) får vänstra texturhalvan och övriga sidor den högra
const geoCache = new Map();
export function boxGeo(w, h, d) {
  const key = w.toFixed(3) + 'x' + h.toFixed(3) + 'x' + d.toFixed(3);
  let g = geoCache.get(key);
  if (g) return g;
  g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    const front = i >= 16 && i < 20;
    uv.setX(i, front ? uv.getX(i) * 0.5 : 0.5 + uv.getX(i) * 0.5);
  }
  uv.needsUpdate = true;
  geoCache.set(key, g);
  return g;
}
