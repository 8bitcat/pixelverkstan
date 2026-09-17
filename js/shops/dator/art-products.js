// Högupplösta sprites för konsoler, spelomslag och arkadkabinett.
// Allt ritas med S skärmpixlar per logisk pixel så att formerna känns igen på håll:
// NES:ens grå låda med lucka, Mega Drives runda kassettöppning, Switch-dockans röda och
// blå joy-cons. Ingen 3D-raster här – rena rektanglar med kant och glans.
import { SMALL, BIG, textW, eachTextPixel } from '../../core/floor-pix.js';

const hex = (s, fb = '#888888') => (typeof s === 'string' && /^#[0-9a-f]{6}$/i.test(s) ? s : fb);
function shade(h, f) {
  const n = parseInt(hex(h).slice(1), 16);
  const r = Math.min(255, (n >> 16 & 255) * f) | 0, g = Math.min(255, (n >> 8 & 255) * f) | 0, b = Math.min(255, (n & 255) * f) | 0;
  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}
function mixh(a, b, t) {
  const A = parseInt(hex(a).slice(1), 16), B = parseInt(hex(b).slice(1), 16);
  const ch = (s) => ((A >> s) & 255) + (((B >> s) & 255) - ((A >> s) & 255)) * t;
  return '#' + (((ch(16) | 0) << 16) | ((ch(8) | 0) << 8) | (ch(0) | 0)).toString(16).padStart(6, '0');
}

// Penna i logiska koordinater (bråkdelar tillåtna) som ritar i skärmpixlar
class Pen {
  constructor(ctx, S, ox = 0, oy = 0) { this.c = ctx; this.S = S; this.ox = ox; this.oy = oy; }
  r(x, y, w, h, col) { const S = this.S; this.c.fillStyle = col; this.c.fillRect(Math.round((this.ox + x) * S), Math.round((this.oy + y) * S), Math.max(1, Math.round(w * S)), Math.max(1, Math.round(h * S))); }
  // låda med ljus kant uppe/vänster och mörk nere/höger
  box(x, y, w, h, col, k = 1 / this.S) {
    this.r(x, y, w, h, col);
    this.r(x, y, w, k, shade(col, 1.25)); this.r(x, y, k, h, shade(col, 1.18));
    this.r(x, y + h - k, w, k, shade(col, 0.62)); this.r(x + w - k, y, k, h, shade(col, 0.7));
  }
  // rundad låda (hörnen avfasade)
  rbox(x, y, w, h, col, rad = 1) {
    const k = 1 / this.S;
    this.r(x + rad, y, w - rad * 2, h, col); this.r(x, y + rad, w, h - rad * 2, col);
    this.r(x + rad, y, w - rad * 2, k, shade(col, 1.25)); this.r(x, y + rad, k, h - rad * 2, shade(col, 1.18));
    this.r(x + rad, y + h - k, w - rad * 2, k, shade(col, 0.62)); this.r(x + w - k, y + rad, k, h - rad * 2, shade(col, 0.7));
  }
  dot(x, y, col, d = 1) { this.r(x, y, d, d, col); }
  // text i skärmpixlar (scale = skärmpixlar per fontpixel)
  text(F, s, x, y, col, scale = 1) {
    const S = this.S; this.c.fillStyle = col;
    eachTextPixel(F, s, 0, 0, 1, (px, py) => this.c.fillRect(Math.round((this.ox + x) * S) + px * scale, Math.round((this.oy + y) * S) + py * scale, scale, scale));
  }
  ell(cx, cy, rx, ry, col) {
    const S = this.S;
    for (let y = -ry; y <= ry; y += 1 / S) for (let x = -rx; x <= rx; x += 1 / S) if ((x / rx) ** 2 + (y / ry) ** 2 <= 1) this.r(cx + x, cy + y, 1 / S, 1 / S, col);
  }
}

// ---------- Konsoler (28×14 logiska pixlar, handhållna 16×20, datorer 30×12) ----------
export const CONSOLE_BOX = { w: 30, h: 20 };
const SHAPES = {
  atari2600(p, L) { p.box(3, 8, 24, 6, L.body); p.r(4, 9, 22, 2, L.wood); for (let i = 0; i < 6; i++) p.r(5 + i * 3.6, 9.3, 1.6, 1.4, shade(L.wood, 0.8)); p.r(5, 12, 3, 1, L.panel); p.r(9, 12, 3, 1, L.panel); p.r(20, 11, 2, 2, '#c9323a'); p.r(24, 11, 2, 2, L.panel); p.r(8, 5, 2, 3, '#1a1816'); p.r(12, 6, 1.5, 2, '#1a1816'); },
  c64(p, L) { p.box(1, 9, 28, 5, L.body); p.r(2, 7, 26, 2.4, shade(L.body, 0.94)); for (let r = 0; r < 3; r++) for (let i = 0; i < 14; i++) p.r(2.6 + i * 1.85, 7.3 + r * 1.6, 1.4, 1.1, L.keys); p.r(6, 12.2, 16, 1, L.keys); p.r(25, 12.5, 3, 1, L.badge); p.text(SMALL, 'C64', 23.6, 10.2, '#f4f1ea', 1); },
  amiga500(p, L) { p.box(0.5, 8, 29, 6, L.body); p.r(1.5, 6.4, 27, 2.2, shade(L.body, 0.94)); for (let r = 0; r < 3; r++) for (let i = 0; i < 16; i++) p.r(2 + i * 1.7, 6.7 + r * 1.55, 1.3, 1.05, L.keys); p.r(25, 12.4, 3.5, 1, L.badge); p.r(1.5, 12.2, 5, 1.2, shade(L.body, 0.8)); },
  nes(p, L) { p.box(2, 5, 26, 9, L.body); p.r(2, 5, 26, 2.2, shade(L.body, 1.08)); p.r(4, 8.5, 22, 4, L.flap); p.r(4, 8.5, 22, 0.8, shade(L.flap, 1.3)); p.r(21, 6.2, 5, 1.2, L.stripe); p.r(4, 6.4, 3, 1.4, '#6a6764'); p.r(8, 6.4, 3, 1.4, '#6a6764'); p.dot(6.8, 6.6, '#e23b5a', 0.6); p.r(3, 13, 3, 1, '#2a2724'); p.r(9, 13, 3, 1, '#2a2724'); },
  sms(p, L) { p.box(2, 6, 26, 8, L.body); p.r(2, 9, 26, 1, L.stripe); p.r(6, 6.6, 14, 2, L.slot); p.r(22, 7, 4, 1.2, '#e8e6e0'); p.r(4, 11, 2.5, 1.2, '#3a3a40'); p.r(8, 11, 2.5, 1.2, '#3a3a40'); p.dot(26, 11.5, '#e23b5a', 0.7); },
  megadrive(p, L) { p.rbox(1, 6, 28, 8, L.body, 1); p.ell(14.5, 8.6, 8.5, 2.6, L.ring); p.ell(14.5, 8.6, 6.5, 1.8, shade(L.body, 0.9)); p.r(3, 6.8, 6, 1.2, L.gold); p.text(SMALL, '16', 3.2, 6.6, '#1a1a1e', 1); p.r(4, 11.2, 4, 1.4, '#3a3a40'); p.r(10, 11.4, 6, 1, '#3a3a40'); p.dot(24, 11.6, '#e23b5a', 0.8); p.r(20, 11, 5, 1.6, shade(L.body, 1.2)); },
  snes(p, L) { p.rbox(2, 5, 26, 9, L.body, 1); p.r(2, 5, 26, 2.5, L.top); p.r(9, 7.2, 12, 1.6, '#4a4a54'); p.r(4, 10, 5, 2, '#8a8f9c'); p.r(11, 10.5, 3, 1.2, L.btn); p.r(15, 10.5, 3, 1.2, L.btn); p.dot(20, 10.8, L.btn2, 0.8); p.r(23, 9.5, 3.5, 3, L.btn); p.r(23.5, 10, 2.5, 2, shade(L.btn, 1.2)); },
  neogeo(p, L) { p.box(2, 5, 26, 9, L.body); p.r(2, 5, 26, 1.2, L.gold); p.r(5, 7, 20, 2.6, '#101014'); p.r(3, 11, 7, 1.4, '#3a3a40'); p.r(12, 11, 7, 1.4, '#3a3a40'); p.r(21, 11, 5, 1.4, L.stripe); p.text(SMALL, 'NEO', 20.5, 6.2, L.gold, 1); },
  playstation(p, L) { p.rbox(3, 7, 24, 7, L.body, 1); p.ell(13, 8.6, 6.5, 3, L.lid); p.ell(13, 8.6, 5, 2.2, shade(L.lid, 0.95)); p.dot(13, 8.6, '#2c2c30', 1); p.r(22, 8, 3, 1.4, L.btn); p.r(22, 10.2, 3, 1.4, L.btn); p.r(4, 11.5, 3, 1.5, '#4a4a54'); p.r(8, 11.5, 3, 1.5, '#4a4a54'); p.dot(21, 12, '#3fb04a', 0.6); },
  saturn(p, L) { p.rbox(3, 6, 24, 8, L.body, 1); p.r(7, 6.5, 16, 4, L.lid); p.r(7, 6.5, 16, 0.8, shade(L.lid, 1.3)); p.r(4, 11.5, 3, 1.4, '#4a4a54'); p.r(8, 11.5, 3, 1.4, '#4a4a54'); p.r(22, 11, 3.5, 1.4, L.btn); p.dot(20, 11.6, '#3fb04a', 0.6); },
  n64(p, L) { p.rbox(4, 7, 22, 6, L.body, 1); p.r(7, 5, 16, 3, L.top); p.r(10, 4, 10, 1.6, shade(L.top, 1.2)); p.r(10, 4.3, 10, 0.8, '#1a1a1e'); for (let i = 0; i < 4; i++) p.r(6 + i * 4.8, 11.2, 2.4, 1.6, '#4a4a54'); p.dot(24, 8, L.btn, 0.9); p.r(8, 8.5, 3, 1, '#3a3a44'); },
  dreamcast(p, L) { p.rbox(3, 7, 24, 7, L.body, 1); p.ell(14, 8.5, 6, 3, L.lid); p.ell(14, 8.5, 3.5, 1.8, shade(L.lid, 0.95)); p.text(SMALL, 'S', 13, 7.3, L.swirl, 1); for (let i = 0; i < 4; i++) p.r(5 + i * 4.6, 12, 2.6, 1.4, '#8a8f9c'); p.dot(24, 12.5, '#f0a020', 0.7); },
  ps2(p, L) { p.box(6, 1, 8, 13, L.body); p.r(6.5, 1.5, 7, 1, L.stripe); p.r(7, 3, 6, 0.6, L.stripe); p.r(7, 4.5, 6, 0.6, L.stripe); p.r(6, 6, 8, 0.5, '#0a0a0e'); p.dot(12.5, 12, L.btn, 0.8); p.dot(8, 12, '#3fb04a', 0.6); p.r(15, 11, 12, 3, shade(L.body, 1.1)); p.r(15.5, 11.5, 11, 0.6, L.stripe); p.dot(17, 12.6, L.btn, 0.7); p.r(15, 9.8, 12, 0.5, '#0a0a0e'); },
  gamecube(p, L) { p.box(8, 5, 14, 9, L.body); p.r(8, 5, 14, 1.4, L.top); p.r(10, 6.5, 10, 4, shade(L.body, 0.85)); p.r(13, 3.2, 4, 2, L.handle); p.r(13, 3.2, 4, 0.6, shade(L.handle, 1.3)); for (let i = 0; i < 4; i++) p.r(9 + i * 3.2, 11.5, 2, 1.6, '#c8c8d0'); p.dot(14.5, 8.5, '#c8c8d0', 1); },
  xbox(p, L) { p.box(3, 6, 24, 8, L.body); p.r(3, 6, 24, 1.2, shade(L.body, 1.3)); p.ell(15, 9.5, 4, 2.2, L.jewel); p.text(SMALL, 'X', 14, 8.3, L.x, 1); p.r(5, 8, 6, 3, '#2a2a30'); p.r(5.5, 8.5, 5, 2, '#101014'); for (let i = 0; i < 4; i++) p.r(21 + (i % 2) * 2.5, 8 + Math.floor(i / 2) * 2.2, 2, 1.6, '#3a3a40'); },
  xbox360(p, L) { p.rbox(3, 5, 24, 9, L.body, 1); p.r(5, 5.5, 20, 1.4, L.side); p.ell(20, 9.5, 2.2, 2.2, '#c8c6c0'); p.ell(20, 9.5, 1.3, 1.3, L.ring); p.r(6, 8, 9, 3.5, shade(L.body, 0.9)); p.r(6.5, 8.5, 8, 2.5, '#101014'); p.r(6, 12, 3, 1.2, '#8a8f9c'); p.r(10, 12, 3, 1.2, '#8a8f9c'); },
  wii(p, L) { p.box(11, 2, 6, 12, L.body); p.r(11.5, 3, 5, 0.6, '#0a0a0e'); p.dot(14, 5.5, L.light, 1); p.r(12, 8, 4, 1, '#c8c6c0'); p.r(12, 10, 4, 1, '#c8c6c0'); p.r(9, 13, 10, 1.2, L.stand); p.r(10, 12.4, 8, 0.8, shade(L.stand, 1.2)); },
  ps3(p, L) { p.rbox(3, 6, 24, 8, L.body, 2); p.r(6, 6.5, 18, 2.5, L.gloss); p.r(6, 6.5, 18, 0.6, shade(L.gloss, 1.5)); p.r(4, 10.5, 12, 0.5, '#0a0a0e'); p.dot(22, 11, L.btn, 0.7); p.dot(24.5, 11, '#3fb04a', 0.7); p.r(5, 12, 4, 1.2, '#3a3a44'); p.r(10, 12, 4, 1.2, '#3a3a44'); },
  wiiu(p, L) { p.rbox(3, 8, 20, 6, L.body, 1); p.r(4, 9, 18, 0.6, '#0a0a0e'); p.dot(6, 11.5, L.light, 0.9); p.rbox(22, 3, 7, 10, L.pad, 1); p.r(23, 4.5, 5, 6, '#3a6a9a'); p.r(23.2, 4.8, 4.6, 0.8, '#7ab0e0'); p.dot(22.5, 3.5, '#c8c8d0', 0.6); },
  ps4(p, L) { p.rbox(3, 7, 24, 7, L.body, 1); p.r(3, 7, 24, 3.2, L.slant); p.r(4, 8.8, 22, 0.5, L.light); p.r(5, 11.5, 3, 1.4, '#3a3a44'); p.r(9, 11.5, 3, 1.4, '#3a3a44'); p.r(20, 8, 5, 0.6, '#0a0a0e'); },
  xboxone(p, L) { p.box(3, 6, 24, 8, L.body); p.r(15, 6.5, 11, 6.5, L.vent); for (let i = 0; i < 5; i++) p.r(16 + i * 2, 7, 1, 5.5, shade(L.vent, 0.8)); p.r(5, 8.5, 8, 0.6, '#0a0a0e'); p.dot(13.5, 11, L.light, 0.9); p.r(4, 6.5, 10, 1.4, shade(L.body, 1.15)); },
  switch(p, L) { p.box(9, 6, 12, 8, L.dock); p.r(9.5, 6.5, 11, 0.7, '#0a0a0e'); p.r(10.5, 3, 9, 4.5, L.body); p.r(11, 3.5, 8, 3.5, '#3a6a9a'); p.r(11.2, 3.8, 7.6, 0.8, '#7ab0e0'); p.rbox(8, 3, 2.5, 8, L.blue, 0.5); p.rbox(19.5, 3, 2.5, 8, L.red, 0.5); p.dot(8.8, 5.5, '#2a2a30', 0.8); p.dot(20.3, 5.5, '#2a2a30', 0.8); p.dot(20.3, 7.5, '#2a2a30', 0.8); p.dot(11, 12, '#3fb04a', 0.6); },
  switch2(p, L) { p.box(8, 6, 14, 8, L.dock); p.r(8.5, 6.5, 13, 0.7, '#0a0a0e'); p.r(9.5, 2.5, 11, 5, L.body); p.r(10, 3, 10, 4, '#3a6a9a'); p.r(10.2, 3.3, 9.6, 0.8, '#7ab0e0'); p.rbox(7, 2.5, 2.5, 8.5, L.blue, 0.5); p.rbox(20.5, 2.5, 2.5, 8.5, L.red, 0.5); p.dot(7.8, 5, '#2a2a30', 0.8); p.dot(21.3, 5, '#2a2a30', 0.8); p.dot(21.3, 7, '#2a2a30', 0.8); p.dot(10, 12, '#3fb04a', 0.6); },
  ps5(p, L) { p.rbox(11, 1, 8, 13, L.core, 1); p.r(7, 1, 4, 13, L.body); p.r(19, 1, 4, 13, L.body); p.r(7.5, 1.5, 3, 12, shade(L.body, 0.97)); p.r(19.5, 1.5, 3, 12, shade(L.body, 0.97)); p.r(11, 1, 8, 0.6, L.light); p.dot(15, 12, L.light, 0.7); p.r(6, 13.5, 18, 0.8, '#c8c6c0'); },
  seriesx(p, L) { p.box(9, 0.5, 11, 13.5, L.body); p.r(9.5, 1, 10, 1.5, L.vent); for (let i = 0; i < 4; i++) for (let j = 0; j < 8; j++) p.dot(10 + j * 1.2, 1.2 + i * 0.4, L.top, 0.35); p.dot(11, 9, '#e8e6e0', 0.7); p.r(10, 4, 9, 0.5, '#0a0a0e'); },
  // handhållna: stående (16×20)
  gameboy(p, L) { p.rbox(4, 0, 12, 20, L.body, 1); p.r(5.5, 1.5, 9, 7.5, '#4a4a54'); p.r(6.5, 2.5, 7, 5.5, L.screen); p.r(6.7, 2.8, 6.6, 0.6, shade(L.screen, 1.25)); p.r(6, 11, 3.6, 1.2, '#2a2a30'); p.r(7.2, 9.8, 1.2, 3.6, '#2a2a30'); p.dot(11.5, 12.2, L.btn, 1.4); p.dot(13.5, 11.2, L.btn, 1.4); p.r(7.5, 15.5, 2, 0.8, '#5a5a60'); p.r(10.5, 15.5, 2, 0.8, '#5a5a60'); for (let i = 0; i < 4; i++) p.r(12.5, 17 + i * 0.6, 3, 0.3, '#5a5a60'); },
  gamegear(p, L) { p.rbox(0, 4, 20, 12, L.body, 1); p.r(5, 5.5, 10, 8, '#0a0a0e'); p.r(5.8, 6.3, 8.4, 6.4, L.screen); p.r(6, 6.6, 8, 0.6, shade(L.screen, 1.4)); p.r(1.5, 8, 2.8, 1, '#3a3a40'); p.r(2.4, 7.1, 1, 2.8, '#3a3a40'); p.dot(16, 9.5, L.btn, 1.3); p.dot(17.8, 8.3, L.btn, 1.3); p.dot(2.5, 12.5, '#e23b5a', 0.6); },
  gbc(p, L) { p.rbox(4, 0, 12, 20, L.body, 1); p.r(5.5, 1.5, 9, 7.5, '#3a3a44'); p.r(6.5, 2.5, 7, 5.5, L.screen); p.r(6.7, 2.8, 6.6, 0.6, shade(L.screen, 1.25)); p.r(6, 11, 3.6, 1.2, L.btn); p.r(7.2, 9.8, 1.2, 3.6, L.btn); p.dot(11.5, 12.2, '#3a3a44', 1.4); p.dot(13.5, 11.2, '#3a3a44', 1.4); p.r(7.5, 15.5, 2, 0.8, '#3a3a44'); p.r(10.5, 15.5, 2, 0.8, '#3a3a44'); },
  gba(p, L) { p.rbox(0, 5, 20, 10, L.body, 1); p.r(5.5, 6, 9, 8, '#3a3a44'); p.r(6.2, 6.7, 7.6, 6.6, L.screen); p.r(6.4, 7, 7.2, 0.6, shade(L.screen, 1.3)); p.r(1.5, 9, 2.8, 1, L.btn); p.r(2.4, 8.1, 1, 2.8, L.btn); p.dot(16, 10.5, L.btn, 1.2); p.dot(17.8, 9.3, L.btn, 1.2); p.r(1, 5, 4, 0.8, shade(L.body, 0.8)); p.r(15, 5, 4, 0.8, shade(L.body, 0.8)); },
  ds(p, L) { p.rbox(2, 3, 16, 7, L.body, 1); p.r(3, 3.6, 14, 5.6, '#3a3a44'); p.r(3.6, 4.2, 12.8, 4.4, L.screen); p.rbox(2, 10.5, 16, 7, shade(L.body, 0.96), 1); p.r(6, 11.2, 8, 5.4, '#3a3a44'); p.r(6.6, 11.8, 6.8, 4.2, L.screen); p.r(2.8, 13, 2.2, 0.8, L.btn); p.r(3.5, 12.3, 0.8, 2.2, L.btn); p.dot(15, 13.5, L.btn, 1); p.dot(16.5, 12.5, L.btn, 1); p.r(2, 10.2, 16, 0.5, '#8a8f9c'); },
  psp(p, L) { p.rbox(0, 5, 20, 10, L.body, 1); p.r(4.5, 6, 11, 8, '#0a0a0e'); p.r(5, 6.5, 10, 7, L.screen); p.r(5.2, 6.8, 9.6, 0.7, shade(L.screen, 1.4)); p.r(1.2, 9.2, 2.6, 0.9, L.btn); p.r(2.05, 8.35, 0.9, 2.6, L.btn); p.dot(16.5, 10.2, L.btn, 1.1); p.dot(18.2, 9, L.btn, 1.1); p.dot(2.5, 12.5, '#3a78d8', 0.7); },
  '3ds'(p, L) { p.rbox(2, 2, 16, 8, L.body, 1); p.r(3, 2.6, 14, 6.6, '#2a2a34'); p.r(3.6, 3.2, 12.8, 5.4, L.screen); p.r(3.8, 3.5, 12.4, 0.6, shade(L.screen, 1.3)); p.rbox(2, 10.5, 16, 7, shade(L.body, 1.05), 1); p.r(6, 11.2, 8, 5.4, '#2a2a34'); p.r(6.6, 11.8, 6.8, 4.2, shade(L.screen, 0.9)); p.dot(3.6, 12.6, '#8a8f9c', 1.4); p.dot(15, 13.5, L.btn, 1); p.dot(16.5, 12.5, L.btn, 1); },
  steamdeck(p, L) { p.rbox(0, 4, 20, 11, L.body, 1); p.r(5, 5, 10, 9, '#0a0a0e'); p.r(5.5, 5.5, 9, 8, L.screen); p.r(5.7, 5.8, 8.6, 0.8, shade(L.screen, 1.4)); p.dot(2.2, 7, '#3a3a44', 1.6); p.dot(16.8, 7, '#3a3a44', 1.6); p.r(1.5, 10.5, 2.6, 0.9, L.btn); p.r(2.35, 9.65, 0.9, 2.6, L.btn); p.dot(16.5, 11, L.btn, 1); p.dot(18, 10, L.btn, 1); p.r(1, 4, 4, 0.8, shade(L.body, 0.8)); p.r(15, 4, 4, 0.8, shade(L.body, 0.8)); },
  quest2(p, L) { p.rbox(2, 6, 20, 9, L.body, 2); p.r(3, 7, 18, 7, shade(L.body, 0.97)); p.r(4, 8, 16, 4.5, L.lens); p.dot(7, 10.2, '#3a3a44', 1.5); p.dot(15.5, 10.2, '#3a3a44', 1.5); p.r(0.5, 8, 2, 5, L.strap); p.r(21.5, 8, 2, 5, L.strap); p.r(4, 3, 16, 2, L.strap); p.r(4, 3, 1.5, 4, L.strap); p.r(18.5, 3, 1.5, 4, L.strap); },
};

const SPRITES = new Map();
export function consoleSprite(p, S = 3) {
  const key = p.id + '|' + S;
  if (SPRITES.has(key)) return SPRITES.get(key);
  const c = document.createElement('canvas');
  c.width = CONSOLE_BOX.w * S; c.height = CONSOLE_BOX.h * S;
  const ctx = c.getContext('2d');
  const fn = SHAPES[p.look.shape] || SHAPES.nes;
  const tall = p.handheld || p.vr, box = tall ? [20, 20] : [30, 14];
  const pen = new Pen(ctx, S, (CONSOLE_BOX.w - box[0]) / 2, CONSOLE_BOX.h - box[1]);
  fn(pen, p.look);
  SPRITES.set(key, c);
  return c;
}

// ---------- Spelomslag (12×16 logiska pixlar; kassett/kartong/fodral efter epok) ----------
export const COVER_BOX = { w: 12, h: 16 };
const MOTIFS = {
  plumber(p, fg) { p.r(4, 3, 4, 1.5, fg); p.r(3.5, 4.5, 5, 1, fg); p.r(4, 5.5, 4, 2, '#f6d7bf'); p.dot(5, 6, '#1a1a1e', 0.7); p.dot(6.5, 6.5, '#3b2619', 1.5); p.r(3.5, 7.5, 5, 3, fg); p.r(4.5, 8, 3, 2.5, '#3a78d8'); p.dot(4.5, 8.8, '#f0b429', 0.7); p.dot(6.8, 8.8, '#f0b429', 0.7); p.r(3.5, 10.5, 2, 1.5, '#5a3d2b'); p.r(6.5, 10.5, 2, 1.5, '#5a3d2b'); },
  hedgehog(p, fg) { p.dot(4, 6, fg, 4); p.r(2, 5, 2, 1, fg); p.r(1.5, 6.5, 2, 1, fg); p.r(2, 8, 2, 1, fg); p.r(6, 7.5, 3, 2.5, '#f6d7bf'); p.dot(7, 6, '#f4f2ec', 1.4); p.dot(7.4, 6.4, '#1a1a1e', 0.6); p.r(4, 10.5, 2, 1.5, '#e23b5a'); p.r(7, 10.5, 2, 1.5, '#e23b5a'); },
  sword(p, fg) { p.r(5.5, 2, 1, 8, '#e8e6e0'); p.r(5.5, 2, 0.4, 8, '#ffffff'); p.r(4, 9.5, 4, 1, fg); p.r(5.5, 10.5, 1, 2, '#6b4226'); p.dot(5.5, 12.5, fg, 1); },
  bigsword(p, fg) { p.r(5, 1, 2, 9, '#c8ccd6'); p.r(5, 1, 0.7, 9, '#ffffff'); p.r(3.5, 10, 5, 1.2, fg); p.r(5.5, 11.2, 1, 3, '#3a3a44'); },
  fighter(p, fg) { p.dot(3.5, 4, '#f6d7bf', 1.6); p.r(3, 5.6, 2.4, 3, fg); p.r(5.4, 6, 2, 1, '#f6d7bf'); p.r(3, 8.6, 1, 2.5, fg); p.r(4.4, 8.6, 1, 2.5, fg); p.dot(8.5, 4.5, '#e0a97f', 1.6); p.r(8, 6.1, 2.4, 3, '#f4f2ec'); p.r(6, 6.5, 2, 1, '#e0a97f'); p.r(8, 9.1, 1, 2.5, '#f4f2ec'); p.r(9.4, 9.1, 1, 2.5, '#f4f2ec'); p.r(2, 2, 8, 0.8, '#f0b429'); },
  dragon(p, fg) { p.dot(6, 6, fg, 4.5); p.dot(6, 6, '#1a1a1e', 2.5); p.r(4, 5, 4, 1, fg); p.r(4.5, 6.5, 1, 1, fg); p.r(6.5, 6.5, 1, 1, fg); },
  ape(p, fg) { p.dot(6, 5, fg, 5); p.r(4, 7, 4, 2, '#e0a97f'); p.dot(5, 7.6, '#1a1a1e', 0.6); p.dot(7, 7.6, '#1a1a1e', 0.6); p.r(3, 9.5, 6, 2.5, fg); p.r(4.5, 9.8, 3, 1, '#e23b5a'); },
  ball(p, fg) { p.dot(6, 6.5, '#f4f2ec', 5); p.r(3.5, 6, 5, 1, fg); p.r(3.5, 3.6, 5, 2.4, fg); p.dot(6, 6.5, '#1a1a1e', 1.2); },
  blocks(p, fg) { const cols = [fg, '#3a78d8', '#e23b5a', '#3fb04a']; for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2 === 0) p.box(2 + i * 2, 4 + j * 2.5, 2, 2.5, cols[(i + j) % 4], 0.3); },
  gem(p, fg) { p.r(4.5, 4, 3, 1, fg); p.r(3.5, 5, 5, 2, fg); p.r(4.5, 7, 3, 2, fg); p.r(5.5, 9, 1, 1.5, fg); p.r(4.5, 5, 1, 1, '#ffffff'); },
  ninja(p, fg) { p.dot(6, 4.5, '#1a1a1e', 2); p.r(5, 4.2, 2, 0.7, '#f6d7bf'); p.r(4.5, 6.5, 3, 3, '#1a1a1e'); p.r(7.5, 5.5, 3, 0.8, fg); p.r(3.5, 9.5, 1.5, 2.5, '#1a1a1e'); p.r(6.5, 9.5, 1.5, 2.5, '#1a1a1e'); },
  jungle(p, fg) { p.r(2, 9, 8, 3, '#2f6f3a'); p.r(3, 3, 1, 6, '#5a3d2b'); p.r(8, 4, 1, 5, '#5a3d2b'); p.dot(3.5, 3, '#3fb04a', 2.5); p.dot(8.5, 4, '#3fb04a', 2.5); p.dot(6, 8, fg, 1.5); },
  castle(p, fg) { p.r(3, 6, 6, 6, fg); for (let i = 0; i < 3; i++) p.r(3 + i * 2.2, 5, 1.2, 1.2, fg); p.r(5.5, 9, 1.2, 3, '#1a1a1e'); p.r(5.5, 1.5, 0.5, 4, '#8a8f9c'); p.r(6, 1.5, 2, 1.2, '#e23b5a'); },
  prince(p, fg) { p.dot(6, 4, '#e0a97f', 1.6); p.r(5, 5.6, 2, 3.5, '#f4f2ec'); p.r(4, 6, 1, 1, '#e0a97f'); p.r(7, 5, 2.5, 0.6, fg); p.r(5, 9.1, 0.9, 2.5, '#f4f2ec'); p.r(6.2, 9.1, 0.9, 2.5, '#f4f2ec'); p.r(2, 11.6, 8, 0.6, fg); },
  soldier(p, fg) { p.dot(6, 4, fg, 2.2); p.r(5, 4, 2, 1, '#1a1a1e'); p.r(4.5, 6, 3, 4, fg); p.r(7.5, 6.5, 3, 1, '#3a3a44'); p.r(4.5, 10, 1.2, 2.5, shade(fg, 0.8)); p.r(6.3, 10, 1.2, 2.5, shade(fg, 0.8)); },
  marine(p, fg) { p.dot(6, 4, '#3fb04a', 2.2); p.r(5, 3.6, 2, 1.2, '#1a1a1e'); p.r(4.3, 6, 3.4, 4, '#3fb04a'); p.r(2, 7, 8, 1.4, '#3a3a44'); p.r(2, 7, 1.5, 1.4, '#8a8f9c'); p.r(4.3, 10, 1.3, 2.5, '#2f6f3a'); p.r(6.4, 10, 1.3, 2.5, '#2f6f3a'); p.dot(9, 3, fg, 1.2); p.dot(2.5, 4, fg, 0.8); },
  island(p, fg) { p.r(2, 9, 8, 3, '#3a6a9a'); p.dot(6, 9, '#2f6f3a', 3.5); p.r(5.5, 4.5, 1, 4, '#5a3d2b'); p.dot(6, 4, '#3fb04a', 2); p.r(3, 6, 1.5, 1.5, fg); },
  quake(p, fg) { p.r(3, 5, 6, 5, fg); p.r(4, 6, 4, 3, '#1a1a1e'); p.r(5.5, 4, 1, 1, fg); p.r(4.5, 9.5, 3, 2.5, fg); p.dot(6, 6.5, '#e23b5a', 1); },
  lambda(p, fg) { p.r(3, 3, 6, 9, fg); p.r(4.5, 4.5, 3, 6, '#f0b429'); p.r(5.5, 5, 1, 4, fg); p.r(4.5, 8.5, 1, 2, fg); p.r(6.5, 8.5, 1, 2, fg); },
  car(p, fg) { p.r(2, 7, 8, 3, fg); p.r(3.5, 5, 5, 2.2, fg); p.r(4, 5.4, 4, 1.4, '#7ab0e0'); p.dot(3.5, 10, '#1a1a1e', 1.4); p.dot(8.5, 10, '#1a1a1e', 1.4); p.r(2, 7.5, 1, 0.8, '#f0e030'); },
  kart(p, fg) { p.r(3, 7, 6, 2.5, fg); p.dot(6, 5.5, '#f6d7bf', 1.6); p.r(5, 4, 2, 1.2, '#e23b5a'); p.dot(3, 9.5, '#1a1a1e', 1.6); p.dot(9, 9.5, '#1a1a1e', 1.6); p.r(2, 11, 8, 0.6, '#8a8f9c'); },
  gun(p, fg) { p.r(2, 6, 7, 1.6, '#3a3a44'); p.r(8, 5.5, 2, 2.6, '#3a3a44'); p.r(3, 7.6, 1.5, 2.5, '#3a3a44'); p.dot(6, 3, fg, 2); p.dot(6, 3, '#1a1a1e', 0.8); },
  city(p, fg) { for (const [x, h] of [[2, 6], [4.5, 8], [7, 5], [9, 7]]) { p.r(x, 12 - h, 2, h, '#3a3a44'); for (let y = 12 - h + 1; y < 11; y += 1.5) p.dot(x + 0.5, y, fg, 0.6); } p.r(2, 12, 8, 0.6, '#8a8f9c'); },
  skull(p, fg) { p.dot(6, 6, '#e8e6e0', 3.5); p.dot(4.8, 5.8, '#1a1a1e', 1); p.dot(7.2, 5.8, '#1a1a1e', 1); p.r(5.5, 7.5, 1, 1, '#1a1a1e'); p.r(4.5, 8.5, 3, 1.5, '#e8e6e0'); p.r(3, 10.5, 6, 0.6, fg); },
  dog(p, fg) { p.dot(6, 6.5, fg, 3.5); p.dot(3.5, 5, fg, 1.5); p.dot(8.5, 5, fg, 1.5); p.dot(5, 6.5, '#1a1a1e', 0.6); p.dot(7, 6.5, '#1a1a1e', 0.6); p.dot(6, 8, '#1a1a1e', 0.8); p.r(4, 10, 4, 2, fg); },
  hockey(p, fg) { p.r(2, 10, 8, 2, '#dff0ff'); p.dot(5, 5.5, '#f6d7bf', 1.4); p.r(4.5, 7, 1.6, 3, fg); p.r(6, 6, 3.5, 0.6, '#5a3d2b'); p.r(9, 6.5, 1, 1.5, '#5a3d2b'); p.dot(3, 10.5, '#1a1a1e', 0.8); },
  bus(p, fg) { p.r(2, 5, 8, 4, fg); p.r(2.5, 5.5, 7, 1.6, '#7ab0e0'); p.dot(3.5, 9.5, '#1a1a1e', 1.2); p.dot(8.5, 9.5, '#1a1a1e', 1.2); p.r(4, 2, 4, 3, '#e8e6e0'); p.r(5.8, 1, 0.5, 1.5, '#8a8f9c'); },
};
// förpackningens form efter epok: kassettkartong, jättekartong (PC), juvelfodral, DVD/BD-fodral, kodkort
export function coverKind(p) {
  const y = p.year, pl = p.platform;
  if (pl === 'pc') return y < 1996 ? 'bigbox' : y < 2006 ? 'jewel' : y < 2014 ? 'dvd' : 'code';
  if (['nes', 'snes', 'megadrive', 'sms', 'atari2600', 'c64', 'amiga500', 'n64', 'gameboy', 'gamegear', 'gbc', 'gba', 'neogeo'].includes(pl)) return 'cart';
  if (['playstation', 'saturn', 'dreamcast'].includes(pl)) return 'jewel';
  if (['ds', 'psp', '3ds', 'switch', 'switch2'].includes(pl)) return 'small';
  if (['quest2', 'steamdeck'].includes(pl)) return 'code';
  return 'dvd';
}
const CASE_COLOR = { ps2: '#2a3a6a', ps3: '#1a1a24', ps4: '#2a3a6a', ps5: '#e8e6e0', xbox: '#2f6f3a', xbox360: '#2f6f3a', xboxone: '#2f6f3a', seriesx: '#2f6f3a', wii: '#f4f2ec', wiiu: '#3a78d8', gamecube: '#1a1a24', switch: '#e23b5a', switch2: '#e23b5a', ds: '#f4f2ec', '3ds': '#e23b5a', psp: '#1a1a24' };
export function coverSprite(p, S = 3) {
  const key = p.id + '|c|' + S;
  if (SPRITES.has(key)) return SPRITES.get(key);
  const c = document.createElement('canvas'); c.width = COVER_BOX.w * S; c.height = COVER_BOX.h * S;
  const ctx = c.getContext('2d'), pen = new Pen(ctx, S), L = p.look.cover, kind = coverKind(p);
  const bg = hex(L.bg), fg = hex(L.fg);
  const edge = kind === 'dvd' ? (CASE_COLOR[p.platform] || '#2a2a34') : kind === 'jewel' ? '#c8ccd6' : kind === 'code' ? '#e8e6e0' : '#3a3a44';
  pen.box(0, 0, 12, 16, edge);
  // omslagsbilden
  const ix = kind === 'dvd' || kind === 'jewel' ? 1.2 : 0.8, iy = 0.8, iw = 12 - ix - 0.8, ih = 16 - iy - (kind === 'code' ? 4 : 2.6);
  pen.r(ix, iy, iw, ih, bg);
  for (let y = 0; y < ih; y += 1) pen.r(ix, iy + y, iw, 0.5, mixh(bg, '#ffffff', 0.08 * (1 - y / ih)));
  ctx.save(); ctx.beginPath(); ctx.rect(ix * S, iy * S, iw * S, ih * S); ctx.clip();
  const sub = new Pen(ctx, S, ix - 0.5, iy - 1);
  (MOTIFS[L.motif] || MOTIFS.ball)(sub, fg);
  ctx.restore();
  // titelband
  const by = iy + ih + 0.3;
  pen.r(ix, by, iw, 1.8, kind === 'code' ? '#3a3a44' : fg);
  pen.text(SMALL, p.name.toUpperCase().slice(0, 6), ix + 0.4, by + 0.25, kind === 'code' ? '#ffffff' : (parseInt(fg.slice(1), 16) > 0x808080 ? '#1a1a1e' : '#ffffff'), Math.max(1, Math.floor(S / 3)));
  if (kind === 'code') { pen.r(ix, by + 2, iw, 1.4, '#ffffff'); for (let i = 0; i < 8; i++) pen.r(ix + 0.5 + i * 1.2, by + 2.2, 0.5, 1, '#1a1a1e'); }
  if (kind === 'bigbox') { pen.r(0, 0, 12, 0.8, shade(edge, 1.3)); pen.r(11.2, 0, 0.8, 16, shade(edge, 0.7)); }
  if (kind === 'jewel') for (let i = 0; i < 16; i += 3) pen.r(0.3, i, 0.4, 1.5, '#ffffff');
  if (kind === 'cart') pen.r(0, 14.5, 12, 1.5, shade(edge, 0.8));
  SPRITES.set(key, c);
  return c;
}
// ryggen på en kartong/ett fodral (3×16) med titeln i färg
export function spineSprite(p, S = 3) {
  const key = p.id + '|s|' + S;
  if (SPRITES.has(key)) return SPRITES.get(key);
  const c = document.createElement('canvas'); c.width = 3 * S; c.height = COVER_BOX.h * S;
  const pen = new Pen(c.getContext('2d'), S), L = p.look.cover;
  pen.box(0, 0, 3, 16, hex(L.bg));
  pen.r(0.6, 1, 1.8, 10, hex(L.fg)); pen.r(0.6, 12, 1.8, 3, mixh(hex(L.bg), '#ffffff', 0.3));
  SPRITES.set(key, c);
  return c;
}

// ---------- Arkadkabinett (40×90 logiska pixlar) ----------
export const CAB_BOX = { w: 40, h: 90 };
const SHORT = { 'Space Invaders': 'INVADER', 'Street Fighter II': 'SF II', 'Mortal Kombat': 'MK', 'Donkey Kong': 'D.KONG', 'Double Dragon': 'DBL DRGN', 'Operation Wolf': 'OP.WOLF', 'Golden Axe': 'GLD AXE', 'Final Fight': 'F.FIGHT', 'Daytona USA': 'DAYTONA', 'Sega Rally': 'RALLY', 'Time Crisis': 'T.CRISIS', 'House of the Dead': 'H.O.T.D.', 'Dancing Stage': 'DANCING', 'Initial D Arcade Stage': 'INITIAL D', 'Arcade1Up retrokabinett': 'ARCADE', 'Neo Geo MVS': 'NEO GEO', 'Mario Bros.': 'MARIO', 'Space': 'SPACE' };
export const marqueeText = (p) => (SHORT[p.name] || p.name).toUpperCase();
// skärmens plats i kabinettet (logiska px) – attract-läget ritas dynamiskt där
export function cabinetScreen(p) {
  return p.cab === 'dance' ? { x: 6, y: 16, w: 28, h: 20 } : p.cab === 'sitdown' ? { x: 6, y: 20, w: 28, h: 20 } : { x: 6, y: 18, w: 28, h: 22 };
}
export function cabinetSprite(p, S = 3) {
  const key = p.id + '|cab|' + S;
  if (SPRITES.has(key)) return SPRITES.get(key);
  const c = document.createElement('canvas'); c.width = CAB_BOX.w * S; c.height = CAB_BOX.h * S;
  const pen = new Pen(c.getContext('2d'), S), L = p.look, side = hex(L.side), cab = p.cab;
  const scr = cabinetScreen(p);
  const body = '#2a2a34', bodyHi = '#3a3a48';
  if (cab === 'dance') {
    // lågt skåp med stor skärm och dansmatta framför
    pen.box(3, 4, 34, 50, body); pen.r(3, 4, 34, 1, bodyHi); pen.r(3, 4, 2, 50, side); pen.r(35, 4, 2, 50, shade(side, 0.7));
    pen.box(4, 0, 32, 11, hex(L.marquee));
    pen.r(6, scr.y - 2, 28, scr.h + 4, '#0a0a0e');
    for (let i = 0; i < 6; i++) pen.r(5 + i * 5.2, 40, 4, 2, ['#e23b5a', '#3a78d8', '#3fb04a', '#f0e030', '#e23b5a', '#3a78d8'][i]);
    pen.box(6, 44, 28, 8, '#3a3a48');
    // dansmatta
    pen.box(0, 56, 40, 34, '#5a5a66'); pen.r(0, 56, 40, 1, '#7a7a88');
    const cell = (x, y, col) => { pen.r(x, y, 12, 10, col); pen.r(x, y, 12, 0.6, shade(col, 1.3)); };
    cell(2, 58, '#2a2a34'); cell(14, 58, '#3a78d8'); cell(26, 58, '#2a2a34');
    cell(2, 69, '#e23b5a'); cell(14, 69, '#3a3a48'); cell(26, 69, '#e23b5a');
    cell(2, 80, '#2a2a34'); cell(14, 80, '#3fb04a'); cell(26, 80, '#2a2a34');
    const arrow = (x, y, dir, col) => { if (dir === 'up') { pen.r(x + 4, y + 2, 4, 6, col); pen.r(x + 2, y + 4, 8, 1.5, col); pen.r(x + 3, y + 3, 6, 1, col); } else if (dir === 'down') { pen.r(x + 4, y + 2, 4, 6, col); pen.r(x + 2, y + 5, 8, 1.5, col); pen.r(x + 3, y + 6.5, 6, 1, col); } else if (dir === 'left') { pen.r(x + 3, y + 3.5, 6, 3, col); pen.r(x + 2, y + 3, 1.5, 4, col); pen.r(x + 3, y + 2, 1, 6, col); } else { pen.r(x + 3, y + 3.5, 6, 3, col); pen.r(x + 8.5, y + 3, 1.5, 4, col); pen.r(x + 8, y + 2, 1, 6, col); } };
    arrow(14, 58, 'up', '#f4f2ec'); arrow(2, 69, 'left', '#f4f2ec'); arrow(26, 69, 'right', '#f4f2ec'); arrow(14, 80, 'down', '#f4f2ec');
  } else if (cab === 'sitdown') {
    // brett skåp med säte framför
    pen.box(2, 6, 36, 46, body); pen.r(2, 6, 36, 1, bodyHi); pen.r(2, 6, 3, 46, side); pen.r(35, 6, 3, 46, shade(side, 0.7));
    pen.box(3, 0, 34, 13, hex(L.marquee));
    pen.r(scr.x, scr.y - 2, scr.w, scr.h + 4, '#0a0a0e');
    // ratt och pedaler
    pen.box(8, 44, 24, 8, '#3a3a48'); pen.ell(20, 47, 5, 2.2, '#1a1a1e'); pen.ell(20, 47, 3.5, 1.4, '#3a3a48'); pen.r(19.4, 45, 1.2, 4, '#e23b5a');
    pen.r(12, 45, 3, 1.5, '#e23b5a'); pen.r(25, 45, 3, 1.5, '#3a78d8');
    // säte
    pen.box(9, 54, 22, 14, side); pen.r(9, 54, 22, 1.2, shade(side, 1.3)); pen.r(11, 56, 18, 5, shade(side, 0.85));
    pen.box(7, 68, 26, 12, shade(side, 0.9)); pen.r(7, 68, 26, 1.2, shade(side, 1.25)); pen.r(9, 71, 22, 6, shade(side, 0.8));
    pen.r(8, 80, 24, 3, '#1a1a1e'); pen.r(6, 83, 28, 7, '#3a3a48'); pen.r(6, 83, 28, 1, '#5a5a66');
    pen.r(4, 52, 32, 2, '#1a1a1e');
  } else {
    // stående skåp (upright / gun)
    pen.box(3, 8, 34, 82, body);
    pen.r(3, 8, 3, 82, side); pen.r(34, 8, 3, 82, shade(side, 0.7));
    pen.r(4, 9, 32, 1, bodyHi);
    // marquis
    pen.box(4, 0, 32, 12, hex(L.marquee));
    // skärmram
    pen.r(scr.x - 1, scr.y - 3, scr.w + 2, scr.h + 6, '#1a1a1e'); pen.r(scr.x, scr.y - 2, scr.w, scr.h + 4, '#0a0a0e');
    // kontrollpanel (lutande)
    pen.box(5, 44, 30, 10, '#3a3a48'); pen.r(5, 44, 30, 1.2, '#5a5a66');
    if (cab === 'gun') {
      // pistol i hållare + sladd
      pen.r(9, 46, 9, 2.4, '#e23b5a'); pen.r(9, 46, 9, 0.7, '#ff8a9a'); pen.r(15, 48, 2.6, 4, '#e23b5a'); pen.r(9, 47, 2, 1, '#1a1a1e');
      for (let i = 0; i < 8; i++) pen.dot(19 + i * 1.6, 48 + Math.sin(i) * 1.2, '#1a1a1e', 0.7);
      pen.r(24, 46, 4, 1.6, '#f0e030'); pen.r(29, 46, 4, 1.6, '#3a78d8');
    } else {
      // joystick + knappar
      pen.r(11.4, 45, 1.2, 4, '#1a1a1e'); pen.dot(11, 44, '#e23b5a', 2.2); pen.dot(11.4, 44.4, '#ff8a9a', 0.7);
      pen.r(9, 49, 5, 1.2, '#1a1a1e');
      const cols = ['#e23b5a', '#f0e030', '#3a78d8', '#3fb04a', '#e23b5a', '#f0e030'];
      for (let i = 0; i < 6; i++) pen.dot(17 + (i % 3) * 4, 46 + Math.floor(i / 3) * 3.2, cols[i], 2);
      if (p.id === 'a-nbajam' || p.id === 'a-ddragon' || p.id === 'a-sf2' || p.id === 'a-mk') { pen.r(28.4, 45, 1.2, 4, '#1a1a1e'); pen.dot(28, 44, '#3a78d8', 2.2); }
    }
    // myntinkast och sparklåda
    pen.box(11, 60, 18, 12, '#3a3a48'); pen.r(11, 60, 18, 1, '#5a5a66');
    pen.r(14, 62, 3, 4, '#1a1a1e'); pen.r(23, 62, 3, 4, '#1a1a1e'); pen.r(14.8, 63, 1.4, 2, '#f0e030'); pen.r(23.8, 63, 1.4, 2, '#f0e030');
    pen.r(13, 68, 14, 1.4, '#1a1a1e'); pen.r(18, 66.6, 4, 1, '#c8ccd6');
    pen.text(SMALL, 'INSERT COIN', 9, 56, '#f0e030', Math.max(1, Math.floor(S / 3)));
    // sparkplåt
    pen.r(4, 84, 32, 6, '#1a1a1e'); pen.r(4, 84, 32, 1, '#3a3a48');
    // sidokonst: en färgad rand och ett par figurer
    pen.r(3.5, 20, 2, 40, shade(side, 1.2)); pen.r(34.5, 20, 2, 40, shade(side, 0.9));
  }
  // marquistext i logisk upplösning (samma läsbarhet som skyltarna i butiken)
  const my = cab === 'sitdown' ? 3.5 : cab === 'dance' ? 3 : 3;
  let mtxt = marqueeText(p);
  const mx0 = cab === 'sitdown' ? 3 : 4, mwid = cab === 'sitdown' ? 34 : 32;
  const F = textW(BIG, mtxt) <= mwid - 4 ? BIG : SMALL;
  while (textW(F, mtxt) > mwid - 4 && mtxt.length > 3) mtxt = mtxt.slice(0, -1);
  const tw = textW(F, mtxt), tx = mx0 + (mwid - tw) / 2;
  pen.text(F, mtxt, tx, my + (F === SMALL ? 1 : 0), hex(L.text), S);
  // glöd runt marquisen
  const glow = hex(L.text);
  pen.r(4, 12, 32, 0.6, mixh(glow, hex(L.marquee), 0.5));
  SPRITES.set(key, c);
  return c;
}

// ---------- Attract-läge: små animationer i en skärmyta (skärmpixlar) ----------
// ctx i skärmpixlar; (x, y, w, h) rutan; t = tid i sekunder
export function attractFrame(ctx, kind, x, y, w, h, t, tone = '#3fb04a') {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const u = w / 28, v = h / 22;   // enhet: bråkdel av en "standardskärm"
  const R = (px, py, pw, ph, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x + px * u), Math.round(y + py * v), Math.max(1, Math.round(pw * u)), Math.max(1, Math.round(ph * v))); };
  ctx.fillStyle = '#05060a'; ctx.fillRect(x, y, w, h);
  const blink = Math.floor(t * 2) % 2;
  switch (kind) {
    case 'invaders': {
      const step = Math.floor(t * 2) % 8, dx = step < 4 ? step : 8 - step;
      for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) { const ax = 3 + c * 4.6 + dx, ay = 2 + r * 3.2 + (t % 12) * 0.35; const open = (Math.floor(t * 2) + c) % 2; R(ax, ay, 3, 1, ['#3fb04a', '#f4f2ec', '#e23b5a'][r]); R(ax + (open ? 0 : 0.5), ay + 1, 3 - (open ? 0 : 1), 1, ['#3fb04a', '#f4f2ec', '#e23b5a'][r]); R(ax + 0.5, ay + 2, 0.8, 0.8, ['#3fb04a', '#f4f2ec', '#e23b5a'][r]); R(ax + 1.7, ay + 2, 0.8, 0.8, ['#3fb04a', '#f4f2ec', '#e23b5a'][r]); }
      const bx = 12 + Math.sin(t * 1.3) * 8; R(bx, 19, 4, 1.5, '#3fb04a'); R(bx + 1.5, 18, 1, 1, '#3fb04a');
      if (blink) R(bx + 1.8, 12 - (t * 9 % 6), 0.6, 2, '#f4f2ec');
      for (let i = 0; i < 3; i++) R(4 + i * 8, 16, 4, 1.2, '#3fb04a');
      break;
    }
    case 'maze': {
      for (let i = 0; i < 4; i++) { R(2, 3 + i * 5, 24, 0.6, '#2a4ad8'); }
      for (let i = 0; i < 4; i++) for (let j = 0; j < 8; j++) if ((i + j + Math.floor(t)) % 5) R(3.5 + j * 3, 5 + i * 5, 0.8, 0.8, '#f4d0a0');
      const px = 2 + ((t * 6) % 26), row = Math.floor(t / 4.3) % 4, py = 5 + row * 5, open = Math.floor(t * 6) % 2;
      R(px, py - 1, 2.6, 2.6, '#f0e030'); if (open) R(px + 1.6, py, 1.2, 0.8, '#05060a');
      const gx = px - 5 - Math.sin(t) * 1.5; R(gx, py - 1, 2.6, 2.4, '#e23b5a'); R(gx + 0.5, py - 0.4, 0.7, 0.7, '#f4f2ec'); R(gx + 1.5, py - 0.4, 0.7, 0.7, '#f4f2ec');
      break;
    }
    case 'kong': {
      for (let i = 0; i < 4; i++) { const yy = 5 + i * 4.5; for (let xx = 1; xx < 27; xx += 2) R(xx, yy + (i % 2 ? (xx - 1) * 0.08 : (26 - xx) * 0.08), 1.6, 1, '#e23b5a'); }
      for (let i = 0; i < 3; i++) { const k = (t * 5 + i * 9) % 27; const row = (Math.floor((t * 5 + i * 9) / 27) + i) % 4; R(1 + k, 3 + row * 4.5, 1.8, 1.6, '#c98a4a'); R(1.4 + k, 3.4 + row * 4.5, 0.8, 0.8, '#5a3d2b'); }
      const jump = Math.abs(Math.sin(t * 3)) * 2; R(6, 18.5 - jump, 1.6, 1, '#e23b5a'); R(6.2, 19.5 - jump, 1.2, 1.4, '#3a78d8'); R(5.6, 17.6 - jump, 2.2, 1, '#f6d7bf');
      R(20, 1, 6, 4, '#5a3d2b'); R(21, 2, 4, 2, '#c98a4a');
      break;
    }
    case 'road': {
      for (let i = 0; i < 11; i++) { const k = (i + t * 4) % 11, yy = 8 + k * 1.3, half = 2 + k * 1.4; R(14 - half, yy, half * 2, 1.3, k % 2 ? '#4a4a54' : '#5a5a66'); R(14 - half - 1.2, yy, 1.2, 1.3, k % 2 ? '#e23b5a' : '#f4f2ec'); R(14 + half, yy, 1.2, 1.3, k % 2 ? '#e23b5a' : '#f4f2ec'); R(13.7, yy, 0.6, 0.7, '#f0e030'); }
      R(0, 0, 28, 8, '#3a78d8'); R(0, 6, 28, 2, '#3fb04a'); R(20, 2, 3, 2, '#f0e030');
      const cx = 12 + Math.sin(t * 1.5) * 2; R(cx, 16, 5, 3, '#e23b5a'); R(cx + 1, 15, 3, 1.4, '#7ab0e0'); R(cx - 0.4, 18.6, 1.4, 1.2, '#1a1a1e'); R(cx + 4, 18.6, 1.4, 1.2, '#1a1a1e');
      break;
    }
    case 'fight': {
      R(0, 16, 28, 6, '#5a3d2b'); R(0, 0, 28, 16, '#1a2a4a'); R(2, 2, 9, 1.2, '#f0e030'); R(17, 2, 9, 1.2, '#f0e030'); R(2, 2, 9 * (0.5 + Math.abs(Math.sin(t * 0.7)) * 0.5), 1.2, '#3fb04a'); R(17, 2, 9 * (0.5 + Math.abs(Math.cos(t * 0.9)) * 0.5), 1.2, '#3fb04a');
      const a = 8 + Math.sin(t * 2) * 2, b = 17 - Math.sin(t * 2) * 2, kick = Math.floor(t * 3) % 3 === 0;
      R(a, 9, 2.4, 3.5, '#e8e6e0'); R(a + 0.4, 7, 1.6, 2, '#f6d7bf'); R(a + 2.4, 10, kick ? 3 : 1.5, 1, '#e8e6e0'); R(a, 12.5, 1, 3.5, '#e8e6e0'); R(a + 1.4, 12.5, 1, 3.5, '#e8e6e0');
      R(b, 9, 2.4, 3.5, '#e23b5a'); R(b + 0.4, 7, 1.6, 2, '#e0a97f'); R(b - 1.5, 10, 1.5, 1, '#e23b5a'); R(b, 12.5, 1, 3.5, '#e23b5a'); R(b + 1.4, 12.5, 1, 3.5, '#e23b5a');
      if (kick) R(a + 5.5, 9.5, 1.5, 1.5, '#f0e030');
      break;
    }
    case 'gun': {
      R(0, 0, 28, 22, '#2a3a2a'); R(0, 14, 28, 8, '#4a3a2a'); for (let i = 0; i < 3; i++) R(2 + i * 9, 8 + (i % 2) * 3, 5, 6, '#1a1a1e');
      const ex = 5 + ((Math.floor(t * 1.5) * 7) % 20); if (blink) { R(ex, 10, 2.5, 4, '#3a3a44'); R(ex + 0.5, 9, 1.5, 1.2, '#f6d7bf'); }
      const cx = 8 + Math.sin(t * 2.1) * 8, cy = 8 + Math.cos(t * 1.7) * 4; R(cx - 3, cy, 6, 0.6, '#e23b5a'); R(cx, cy - 3, 0.6, 6, '#e23b5a'); R(cx - 1.5, cy - 1.5, 3, 0.5, '#05060a'); R(cx - 1.5, cy + 1, 3, 0.5, '#05060a');
      break;
    }
    case 'basket': {
      R(0, 14, 28, 8, '#c98a4a'); R(0, 0, 28, 14, '#1a1a24'); R(24, 4, 1, 9, '#e8e6e0'); R(20, 7, 5, 0.8, '#e23b5a'); R(20.5, 7.8, 4, 2, '#f4f2ec');
      const k = (t * 1.2) % 1, bx = 4 + k * 17, by = 12 - Math.sin(k * Math.PI) * 9; R(bx, by, 1.8, 1.8, '#e07a2e');
      R(3, 9, 2, 5, '#e23b5a'); R(3.4, 7.4, 1.2, 1.6, '#f6d7bf'); R(10, 10, 2, 4, '#3a78d8'); R(10.4, 8.4, 1.2, 1.6, '#e0a97f');
      if (Math.floor(t * 4) % 4 === 0) R(1, 2, 6, 1, '#f0e030');
      break;
    }
    case 'dance': {
      R(0, 0, 28, 22, '#1a1030'); for (let i = 0; i < 4; i++) R(3 + i * 6, 3, 4, 3, '#4a4a66');
      for (let i = 0; i < 5; i++) { const yy = 20 - ((t * 9 + i * 5) % 20); const col = ['#e23b5a', '#3a78d8', '#3fb04a', '#f0e030'][i % 4]; R(3 + (i % 4) * 6, yy, 4, 2.5, col); }
      R(2, 1, 24 * ((t * 0.3) % 1), 1, '#f0e030');
      break;
    }
    case 'platform': {
      R(0, 0, 28, 16, '#3a78d8'); R(0, 16, 28, 6, '#5a8a3a'); for (let i = 0; i < 6; i++) R(((i * 5 - t * 6) % 30 + 30) % 30 - 2, 17, 3, 1, '#3fb04a');
      const cx = 4 + (t * 3 % 20), jump = Math.abs(Math.sin(t * 4)) * 4; R(cx, 12.5 - jump, 2, 2, '#e23b5a'); R(cx + 0.3, 14.5 - jump, 1.4, 1.5, '#3a78d8'); R(cx - 0.2, 11.2 - jump, 2.4, 1.2, '#f6d7bf');
      for (let i = 0; i < 3; i++) { const bx = ((i * 9 + 6 - t * 6) % 30 + 30) % 30; R(bx, 8, 3, 2, '#c98a4a'); R(bx + 1, 6.5, 1, 1.5, '#f0e030'); }
      R(20, 1, 3, 2, '#f4f2ec'); R(6, 2, 4, 2, '#f4f2ec');
      break;
    }
    case 'corridor': {
      for (let i = 0; i < 8; i++) { const k = (i + t * 2) % 8, d = 1 + k * 1.6; R(14 - d * 0.9, 11 - d * 0.7, 1, d * 1.4, k % 2 ? '#7a5a3a' : '#5a3d2b'); R(14 + d * 0.9, 11 - d * 0.7, 1, d * 1.4, k % 2 ? '#7a5a3a' : '#5a3d2b'); R(14 - d * 0.9, 11 + d * 0.7, d * 1.8, 0.8, '#3a3a44'); R(14 - d * 0.9, 11 - d * 0.7, d * 1.8, 0.6, '#2a2a34'); }
      R(13, 10, 2, 2, '#e23b5a'); R(12, 17, 4, 3, '#3a3a44'); R(13, 16, 2, 1.5, '#8a8f9c');
      if (blink) R(13.7, 14, 0.6, 2, '#f0e030');
      break;
    }
    case 'blocks': {
      R(9, 0, 10, 22, '#101018'); const cols = ['#e23b5a', '#3a78d8', '#3fb04a', '#f0e030', '#e07a2e'];
      for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if ((r * 3 + c * 5) % 4) R(9.5 + c * 1.9, 12 + r * 1.9, 1.7, 1.7, cols[(r + c) % 5]);
      const fy = (t * 5) % 11; R(11.4, fy, 1.7, 1.7, '#f0e030'); R(11.4, fy + 1.9, 1.7, 1.7, '#f0e030'); R(13.3, fy + 1.9, 1.7, 1.7, '#f0e030'); R(13.3, fy + 3.8, 1.7, 1.7, '#f0e030');
      break;
    }
    default: {
      for (let i = 0; i < 6; i++) R(i * 4.7, 0, 4.7, 22, ['#e23b5a', '#f0e030', '#3fb04a', '#3a78d8', '#b58cff', '#f4f2ec'][i]);
      R(0, 10 + Math.sin(t * 3) * 6, 28, 1, '#05060a');
    }
  }
  // skanlinjer
  ctx.fillStyle = 'rgba(0,0,0,.18)';
  for (let yy = y; yy < y + h; yy += 2) ctx.fillRect(x, yy, w, 1);
  ctx.restore();
}
// motorn i ett spel → attract-läge på TV:n
export const ATTRACT_FOR_ENGINE = { plattform: 'platform', raycast: 'corridor', racer: 'road', fight: 'fight', block: 'blocks', labyrint2d: 'maze', rpg: 'platform', aventyr: 'platform', city: 'road', sport: 'basket', sim: 'platform' };

// ---------- Ikoner till menyer ----------
export function productIcon(p, W = 64, H = 54) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
  let src;
  if (p.cat === 'konsol') src = consoleSprite(p, 4);
  else if (p.cat === 'spel') src = coverSprite(p, 4);
  else src = cabinetSprite(p, 2);
  const f = Math.min(W / src.width, H / src.height);
  const dw = src.width * f, dh = src.height * f;
  ctx.drawImage(src, (W - dw) / 2, (H - dh) / 2, dw, dh);
  return c;
}
