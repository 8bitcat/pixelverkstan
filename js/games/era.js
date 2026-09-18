// Era-filter: så som en C64, en Game Boy eller en CGA-PC faktiskt skulle ha visat spelet.
// Körs på bufferten efter att motorn ritat: palett, färgdjup och dubbelbreda pixlar.
import { W, H } from './common.js';

const C64 = [0x000000, 0xffffff, 0x880000, 0xaaffee, 0xcc44cc, 0x00cc55, 0x0000aa, 0xeeee77, 0xdd8855, 0x664400, 0xff7777, 0x333333, 0x777777, 0xaaff66, 0x0088ff, 0xbbbbbb];
const CGA = [0x000000, 0x55ffff, 0xff55ff, 0xffffff];
const ATARI = [0x000000, 0x404040, 0x6c6c6c, 0x909090, 0xb0b0b0, 0xd0d0d0, 0xececec, 0x444400, 0x707010, 0x9c9c30, 0xc8c850, 0xe8e870, 0x702800, 0x844414, 0xa86428, 0xc88440, 0xe8a058, 0x841800, 0xa83c10, 0xc86028, 0xe88040, 0x880000, 0xa81c10, 0xc83c28, 0xe85c40, 0x780058, 0xa42078, 0xc83c94, 0xe858b0, 0x24188c, 0x4838ac, 0x6c5cd0, 0x9080f0, 0x1c1c6c, 0x3c3c8c, 0x5c5cb0, 0x8080d0, 0x001c68, 0x004080, 0x1c60a0, 0x3c88c0, 0x003c40, 0x006050, 0x1c8070, 0x3ca090, 0x003c00, 0x006c00, 0x2c9020, 0x54b440, 0x14380c, 0x2c5c1c, 0x4c8c2c, 0x6cac3c, 0x2c3c00, 0x4c5c14, 0x6c7c28, 0x8c9c3c, 0x442800, 0x644814, 0x846828, 0xa4883c];
const GB = [0x0f380f, 0x306230, 0x8bac0f, 0x9bbc0f];
const cache = new Map();
function nearest(pal, r, g, b) {
  const key = (pal.length << 24) | (r << 16) | (g << 8) | b;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  let best = 0, bd = 1e12;
  for (let i = 0; i < pal.length; i++) { const c = pal[i], dr = (c >> 16) - r, dg = ((c >> 8) & 255) - g, db = (c & 255) - b, d = dr * dr * 2 + dg * dg * 4 + db * db; if (d < bd) { bd = d; best = c; } }
  if (cache.size > 20000) cache.clear();
  cache.set(key, best);
  return best;
}
export const ERA_NAME = { hd: '', '32bit': '32-bit', '16bit': '16-bit', '8bit': '8-bit', gb: 'Game Boy', c64: 'C64', atari: 'Atari', cga: 'CGA', ega: 'EGA' };
export function applyEra(ctx, era) {
  if (!era || era === 'hd') return;
  const img = ctx.getImageData(0, 0, W, H), d = img.data;
  const wide = era === 'c64' || era === 'atari' || era === 'cga';
  const pal = era === 'c64' ? C64 : era === 'atari' ? ATARI : era === 'cga' ? CGA : null;
  const lv = era === '8bit' ? 4 : era === 'ega' ? 3 : era === '16bit' ? 8 : 32, st = 255 / (lv - 1);
  for (let i = 0, px = 0; i < d.length; i += 4, px++) {
    let r = d[i], g = d[i + 1], b = d[i + 2];
    if (wide && (px % W) % 2 === 1 && px >= W * 10) { d[i] = d[i - 4]; d[i + 1] = d[i - 3]; d[i + 2] = d[i - 2]; continue; }   // dubbelbreda pixlar (HUD-raden överst hålls skarp)
    if (era === 'gb') { const l = (r * 3 + g * 6 + b) / 10, c = GB[l < 60 ? 0 : l < 120 ? 1 : l < 185 ? 2 : 3]; r = c >> 16; g = (c >> 8) & 255; b = c & 255; }
    else if (pal) { const c = nearest(pal, r, g, b); r = c >> 16; g = (c >> 8) & 255; b = c & 255; }
    else { r = Math.round(Math.round(r / st) * st); g = Math.round(Math.round(g / st) * st); b = Math.round(Math.round(b / st) * st); }
    d[i] = r; d[i + 1] = g; d[i + 2] = b;
  }
  ctx.putImageData(img, 0, 0);
}
