// Stående, stängt chassi (till ikoner, montrar och skrivbordet).
// Vänster yta = sidopanel (glas), höger yta = front, topp = tak med knappar.
import { hex, shade, mix } from '../../core/raster.js';
import { textBitmap } from '../../core/pixfont.js';
import { C, fan, honeycomb, mesh, dots, led, isLit } from './art-common.js';

export const STAND = { D: 10, W: 4.8, H: 11 };
const FRONT_FANS = { front1: 2.3, front2: 5.4, front3: 8.5 };

export function frontFanRing(p, o, key) {
  return p.rgb ? led(o, 'case', FRONT_FANS[key]) : -1;
}

export function drawCaseStanding(R, p, o, at = [0, 0, 0]) {
  const [u0, v0, z0] = at, { D, W, H } = STAND;
  const L = p.look, col = hex(L.color), inner = hex(L.inner);
  const light = ((col >> 16) & 255) > 150, edge = shade(col, light ? 0.82 : 1.4);
  const glassSide = p.id !== 'pop-mini-silent';
  const fansFront = p.fans.filter((f) => f.startsWith('front'));
  const brand = textBitmap(p.name.split(' ')[0].toUpperCase().slice(0, 7));
  const id = o.id || 0;

  // fötter
  for (const fu of [0.6, D - 1.4]) for (const fv of [0.4, W - 1.2]) R.box(u0 + fu, u0 + fu + 0.8, v0 + fv, v0 + fv + 0.8, z0, z0 + 0.35, () => 0x111111, id);

  R.box(u0, u0 + D, v0, v0 + W, z0 + 0.35, z0 + H, (f, x, y, FW, FH) => {
    if (f === 'top') {
      // tak: ventilation + knappar längst fram
      if (x > FW - 1.1) {
        if (Math.hypot(x - (FW - 0.55), y - 1.0) < 0.28) return isLit(o, 'power') ? 0x7ee8fa : 0xd8d8d8;
        if (y > 1.8 && y < 2.3 && x > FW - 0.9 && x < FW - 0.3) return 0x1a1a1a;
        if (y > 2.6 && y < 3.1 && x > FW - 0.9 && x < FW - 0.3) return 0x2c6fb7;
        return edge;
      }
      if (x > 1 && x < FW - 1.6 && y > 0.6 && y < FH - 0.6) return mesh(x, y, 0.22) ? shade(col, 0.95) : 0x0e0e10;
      return edge;
    }
    if (f === 'right') {
      // front (sx går åt vänster på skärmen → spegla)
      const sx = FW - x, fh = FH;
      if (sx < 0.25 || sx > FW - 0.25 || y < 0.25 || y > fh - 0.25) return edge;
      let fanC = -1;
      for (const k of fansFront) {
        const c = fan(sx, y, FW / 2, FRONT_FANS[k], 1.75, { spin: o.spin || 0, frame: 0x151515, blade: 0x2a2a2a, hub: 0x333333, blades: 9, ring: frontFanRing(p, o, k) });
        if (c >= 0) { fanC = c; break; }
      }
      const behind = fanC >= 0 ? fanC : shade(inner, 0.35);
      switch (L.front) {
        case 'glass': return fanC >= 0 ? mix(fanC, 0xffffff, 0.08) : ((sx + y * 0.7) % 3 < 0.3 ? 0x5a646c : 0x14161a);
        case 'honeycomb': return honeycomb(sx, y, 0.34) ? col : behind;
        case 'triangles': return (((sx * 3) | 0) + ((y * 2.6) | 0)) % 2 === 0 && ((sx * 3) % 1 > (y * 2.6) % 1) ? col : behind;
        case 'perforated': return dots(sx, y, 0.3, 0.1) ? behind : col;
        case 'mesh': return mesh(sx, y, 0.18) ? shade(col, 1.1) : behind;
        default: // solid med luftspalter vid kanterna
          if ((sx < 0.55 || sx > FW - 0.55) && ((y * 4) | 0) % 2) return 0x0e0e10;
          if (brand.on(((sx - 1.1) / 0.12) | 0, ((y - fh + 1.2) / 0.12) | 0)) return shade(col, 1.6);
          return (((sx + y) * 2) | 0) % 9 === 0 ? shade(col, 1.06) : col;
      }
    }
    // sidopanel
    if (x < 0.25 || x > FW - 0.25 || y < 0.25 || y > FH - 0.25) return edge;
    if (!glassSide) return ((x * 1.5 + y) % 4 < 0.08) ? shade(col, 1.15) : col;
    const shroud = y > FH - 2.3;
    if (shroud) {
      if (brand.on(((x - 1) / 0.13) | 0, ((y - FH + 1.6) / 0.13) | 0)) return shade(col, light ? 0.6 : 1.8);
      return col;
    }
    const refl = ((x * 0.8 + y) % 5) < 0.35;
    let c = inner;
    if (x > 0.8 && x < 6.8 && y > 0.8 && y < 7.8) c = 0x202226;               // moderkort-silhuett
    if (x > FW - 1.3 && fansFront.length) {
      const fy = [2.3, 5.4, 8.5].find((cy) => Math.abs(y - cy) < 1.5);
      if (fy !== undefined) c = p.rgb ? mix(led(o, 'case', fy), 0x000000, 0.25) : 0x1a1a1a;
    }
    if (p.fans.includes('rear') && x < 1.1 && y > 1.3 && y < 4.3) c = p.rgb ? led(o, 'case', 9) : 0x1a1a1a;
    return refl ? mix(c, 0xffffff, 0.35) : mix(c, 0x0b0d10, 0.35);
  }, id);
}
