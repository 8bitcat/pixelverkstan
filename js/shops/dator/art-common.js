// Gemensamma texturbyggstenar för datordelarna.
import { shade, mix, rainbow } from '../../core/raster.js';

export const C = {
  gold: 0xd8b24a, goldDark: 0x9c7a28, steel: 0xc3c7cc, steelDark: 0x8a9097, black: 0x141416,
  rubber: 0x202022, white: 0xefefec, pcbGreen: 0x2e6b3c, copper: 0xc87533, brass: 0xc9a13a,
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

// Fläkt sedd rakt framifrån i en yta. Returnerar färg eller -1 (utanför fläkten).
// W,H = ytans storlek, (cx,cy) mitt, r radie, o = { spin, frame, blade, hub, ring (färg|-1) }
export function fan(x, y, cx, cy, r, f) {
  const dx = x - cx, dy = y - cy;
  // fyrkantig ram med rundade hörn
  const ax = Math.abs(dx), ay = Math.abs(dy);
  if (ax > r + 0.2 || ay > r + 0.2) return -1;
  const corner = ax > r - 0.1 && ay > r - 0.1 && Math.hypot(ax - (r - 0.1), ay - (r - 0.1)) > 0.3;
  if (corner) return -1;
  const d = Math.hypot(dx, dy);
  if (d > r) {
    // ramens skruvhål i hörnen
    if (ax > r - 0.05 && ay > r - 0.05) return shade(f.frame, 0.55);
    return (ax + ay) % 0.5 < 0.08 ? shade(f.frame, 1.15) : f.frame;
  }
  if (f.ring >= 0 && d > r - 0.22) return f.ring;
  if (d > r - 0.12) return shade(f.frame, 0.7);
  if (d < r * 0.3) {
    if (d < r * 0.12) return shade(f.hub, 1.3);
    return d > r * 0.26 ? shade(f.hub, 0.7) : f.hub;
  }
  const ang = Math.atan2(dy, dx) + (f.spin || 0);
  const n = f.blades || 7;
  const phase = (ang * n / (Math.PI * 2) + d * 0.9) % 1;
  const p = phase < 0 ? phase + 1 : phase;
  if (p < 0.55) return p < 0.12 ? shade(f.blade, 1.25) : f.blade;
  return shade(f.blade, 0.32);
}

// Honeycomb-/nätmönster: true på gallret
export function honeycomb(x, y, s = 0.5) {
  const row = Math.floor(y / (s * 0.866));
  const xx = x / s + (row % 2) * 0.5;
  const fx = xx - Math.floor(xx), fy = (y / (s * 0.866)) - row;
  return fx < 0.18 || fy < 0.2;
}
export const mesh = (x, y, p = 0.3) => ((x / p) | 0) % 2 === 0 || ((y / p) | 0) % 2 === 0;
export const dots = (x, y, p = 0.4, r = 0.13) => Math.hypot((x % p) - p / 2, (y % p) - p / 2) < r;

// Skruvhuvud (krysspår) sett uppifrån
export function screwHead(x, y, cx, cy, r = 0.28) {
  const d = Math.hypot(x - cx, y - cy);
  if (d > r) return -1;
  if (Math.abs(x - cx) < 0.05 || Math.abs(y - cy) < 0.05) return 0x4d5157;
  return d > r - 0.07 ? C.steelDark : mix(C.steel, 0xffffff, 0.2 * (1 - d / r));
}
// Tomt skruvhål (mässingsdistans)
export function screwHole(x, y, cx, cy, r = 0.3) {
  const d = Math.hypot(x - cx, y - cy);
  if (d > r) return -1;
  return d < r * 0.45 ? 0x2a2418 : C.brass;
}

// Guldkontakter / stift-rader
export const pins = (x, y, pitch = 0.2) => ((x / pitch) | 0) % 2 === 0 && ((y / pitch) | 0) % 2 === 0;

// Små "kretsar": ger ett pseudo-slumpvärde per cell
export function hash(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}
