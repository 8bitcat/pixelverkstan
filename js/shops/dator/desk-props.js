// Skrivbordets saker efter epok: skärm, tangentbord, mus, musmatta och prylar på bordet.
// era kommer från desk-era.js (monitor, keyboard, mouseKind, videoType, year …).
// Skärmens bild ritas i en canvas (screenSize) och läggs på glasytan som monitorFace ger.
// Bordsytan är z = 6. Tangentbordet u 3–14 × v 6–9, musen u 15–19,5 × v 6–10,5,
// skärmen håller sig inom u 0,5–17 × v 0–6. Ritordning = bakifrån och fram.
import { shade, mix, rainbow } from '../../core/raster.js';
import { textBitmap } from '../../core/pixfont.js';

// ---------- småhjälp ----------
const hash = (a, b) => { let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
const speck = (c, x, y, s = 30, amt = 0.035) => { const n = hash((x * s) | 0, (y * s) | 0); return n > 0.9 ? shade(c, 1 + amt) : n < 0.1 ? shade(c, 1 - amt) : c; };
const brushed = (c, a) => { const n = hash((a * 60) | 0, 7); return n > 0.82 ? shade(c, 1.06) : n < 0.12 ? shade(c, 0.95) : c; };
const txt = (bm, x, y, x0, y0, px) => bm.on(Math.floor((x - x0) / px), Math.floor((y - y0) / px));
// avrundat hörn på en yta: true = utanför (ska inte ritas)
function outCorner(x, y, W, H, r) {
  const dx = x < r ? r - x : x > W - r ? x - (W - r) : 0, dy = y < r ? r - y : y > H - r ? y - (H - r) : 0;
  return dx > 0 && dy > 0 && dx * dx + dy * dy > r * r;
}
const inRect = (x, y, x0, y0, x1, y1) => x >= x0 && x < x1 && y >= y0 && y < y1;
const disc2 = (x, y, cx, cy, r) => (x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r;

// ---------- Skärmmodeller ----------
// g = bildytans avstånd från framsidans kanter: l, r, t (uppe), b (nere). vf = framsidans v.
const CU = 8.5;
const M = {
  mono:  { u0: CU - 4.05, u1: CU + 4.05, z0: 6.35, z1: 13.3, vf: 5.8, g: { l: 0.75, r: 0.75, t: 0.7, b: 1.3 } },
  cga:   { u0: CU - 4.4, u1: CU + 4.4, z0: 6.35, z1: 13.65, vf: 5.8, g: { l: 0.8, r: 0.8, t: 0.7, b: 1.2 } },
  ega:   { u0: CU - 4.5, u1: CU + 4.5, z0: 6.35, z1: 13.85, vf: 5.8, g: { l: 0.8, r: 0.8, t: 0.7, b: 1.2 } },
  crt14: { u0: CU - 4.8, u1: CU + 4.8, z0: 6.85, z1: 14.85, vf: 5.85, g: { l: 0.7, r: 0.7, t: 0.6, b: 1.25 } },
  crt17: { u0: CU - 5.35, u1: CU + 5.35, z0: 6.8, z1: 15.55, vf: 5.9, g: { l: 0.65, r: 0.65, t: 0.6, b: 1.1 } },
  lcd43: { u0: CU - 5.35, u1: CU + 5.35, z0: 8.0, z1: 16.6, vf: 4.2, g: { l: 0.55, r: 0.55, t: 0.55, b: 0.85 } },
  lcd169: { u0: CU - 7.05, u1: CU + 7.05, z0: 8.1, z1: 16.73, vf: 3.2, g: { l: 0.45, r: 0.45, t: 0.45, b: 0.75 } },
  'lcd-slim': { u0: CU - 7.62, u1: CU + 7.62, z0: 7.9, z1: 16.86, vf: 3.05, g: { l: 0.12, r: 0.12, t: 0.12, b: 0.4 } },
};
const modelOf = (era) => M[era?.monitor] || M.lcd169;

export function screenSize(era) {
  return era.monitor === 'lcd169' || era.monitor === 'lcd-slim' ? { w: 160, h: 90 } : { w: 120, h: 90 };
}
// Tre hörn av bildytan: [överkant vänster, överkant höger, nederkant vänster]
export function monitorFace(era) {
  const m = modelOf(era), g = m.g;
  return [[m.u0 + g.l, m.vf, m.z1 - g.t], [m.u1 - g.r, m.vf, m.z1 - g.t], [m.u0 + g.l, m.vf, m.z0 + g.b]];
}

// Framsida med infälld bildyta. detail(sx, sy, W, H) → färg eller -1 för knappar och märken
function bezel(m, col, o = {}) {
  const g = m.g, W = m.u1 - m.u0, H = m.z1 - m.z0;
  const gx0 = g.l, gx1 = W - g.r, gy0 = g.t, gy1 = H - g.b, rim = o.rim ?? 0.16, round = o.round ?? 0.22;
  const frame = o.frame ?? -1, frameW = o.frameW ?? 0;
  return (sx, sy) => {
    if (round && outCorner(sx, sy, W, H, round)) return -1;
    if (sx >= gx0 && sx < gx1 && sy >= gy0 && sy < gy1) return 0x0c0e0d;
    if (frame >= 0 && sx >= gx0 - frameW && sx < gx1 + frameW && sy >= gy0 - frameW && sy < gy1 + frameW) return sy < gy0 ? shade(frame, 0.8) : frame;
    if (rim && sx >= gx0 - rim && sx < gx1 + rim && sy >= gy0 - rim && sy < gy1 + rim) {
      if (sy < gy0) return shade(col, 0.6);
      if (sx < gx0) return shade(col, 0.7);
      if (sy >= gy1) return shade(col, 1.1);
      return shade(col, 0.95);
    }
    if (o.detail) { const d = o.detail(sx, sy, W, H); if (d >= 0) return d; }
    if (sx < 0.06 || sy < 0.06) return shade(col, 1.12);
    if (sx > W - 0.06 || sy > H - 0.06) return shade(col, 0.82);
    return o.plain ? col : o.gloss ? gloss(col, sx, sy) : speck(col, sx, sy);
  };
}
const gloss = (c, x, y) => { let r = (x * 0.6 - y) % 3.2; if (r < 0) r += 3.2; return r < 0.25 ? mix(c, 0xffffff, 0.12) : r < 0.32 ? mix(c, 0xffffff, 0.05) : c; };
const LOGO = () => textBitmap('PIXELVIEW');
function ledCol(st, lcd) {
  if (!st.monPower) return 0x2a2a2a;
  if (!st.powered) return 0xe8a030;
  return lcd ? 0x4aa8ff : 0x45ff7a;
}

// Bakre, avsmalnande del av ett bildrör (trattformad i n steg) med ventilationsspringor
function crtBack(R, m, col, vBack, vFront, n, du1, dzt1, dzb1) {
  for (let i = 0; i < n; i++) {
    const s = n === 1 ? 1 : i / (n - 1);
    const du = du1 * (1 - s) + 0.3 * s, dzt = dzt1 * (1 - s) + 0.2 * s, dzb = dzb1 * (1 - s) + 0.2 * s;
    const v0 = vBack + ((vFront - vBack) * i) / n, v1 = vBack + ((vFront - vBack) * (i + 1)) / n;
    const vented = i < Math.ceil(n / 2);
    R.box(m.u0 + du, m.u1 - du, v0, v1, m.z0 + dzb, m.z1 - dzt, (f, x, y, FW, FH) => {
      if (f === 'top') {
        if (vented && x > 0.45 && x < FW - 0.45 && y > 0.15 && y < FH - 0.15 && ((x * 4) | 0) % 2 === 0) return shade(col, 0.68);
        return y < 0.05 ? shade(col, 1.08) : speck(col, x, y);
      }
      if (f === 'right') {
        if (vented && y > 0.35 && y < FH - 0.35 && x > 0.15 && x < FW - 0.15 && ((y * 5) | 0) % 2 === 0) return shade(col, 0.74);
        if (i === n - 1 && x > 0.2 && x < 0.95 && y > 0.4 && y < 0.95) return y < 0.52 ? 0x3a3a3a : 0xe8e4d6;
        return speck(shade(col, 0.96), x, y);
      }
      return speck(shade(col, 0.9), x, y);
    });
  }
}
// Vrid- och tippfot under bildrörsskärmar
function swivel(R, cu, v0, v1, w, col) {
  R.box(cu - w, cu + w, v0, v1, 6, 6.28, (f, x, y, W, H) => {
    if (f === 'top') { if (outCorner(x, y, W, H, 0.9)) return -1; return (x - W / 2) * (x - W / 2) / (W * W / 4) + (y - H / 2) * (y - H / 2) / (H * H / 4) < 0.35 ? shade(col, 0.9) : col; }
    return x < 0.9 || x > W - 0.9 ? -1 : shade(col, 0.85);
  });
}

export function drawMonitor(R, era, st) {
  const kind = era.monitor || 'lcd169', m = modelOf(era);
  const led = ledCol(st, kind.startsWith('lcd'));
  const logo = LOGO();
  switch (kind) {
    case 'mono': case 'cga': case 'ega': {
      const col = kind === 'mono' ? 0xd0cbbd : kind === 'cga' ? 0xd6ceb4 : 0xd2cab2;
      // låg sockel, bakre del och framsida
      R.box(m.u0 + 0.5, m.u1 - 0.5, 1.4, 5.5, 6, 6.35, (f, x) => (f === 'top' ? 0x2a2826 : shade(0x3a3834, x % 1.2 < 0.6 ? 1 : 0.9)));
      crtBack(R, m, col, 1.0, 4.6, 4, 2.0, 1.9, 1.0);
      const face = bezel(m, col, {
        detail: (sx, sy, FW, FH) => {
          const by = FH - m.g.b / 2;
          if (kind === 'mono') {
            for (const kx of [FW - 1.9, FW - 1.1]) if (disc2(sx, sy, kx, by, 0.24)) return disc2(sx, sy, kx - 0.05, by - 0.05, 0.1) ? 0x6a665e : 0x2e2c28;
            if (inRect(sx, sy, 0.6, by - 0.2, 0.6 + logo.w * 0.05, by + 0.1)) return txt(logo, sx, sy, 0.6, by - 0.15, 0.05) ? 0x3a3a3a : -1;
            if (disc2(sx, sy, FW - 2.6, by, 0.07)) return led;
          } else {
            if (inRect(sx, sy, FW - 1.7, by - 0.25, FW - 1.0, by + 0.25)) return sy < by ? 0x3a3a38 : 0x1e1e1c;
            for (const kx of [FW - 2.5, FW - 3.2]) if (disc2(sx, sy, kx, by, 0.2)) return disc2(sx, sy, kx - 0.04, by - 0.04, 0.08) ? 0x8a867c : 0x4a4640;
            if (disc2(sx, sy, FW - 0.7, by, 0.07)) return led;
            if (inRect(sx, sy, 0.7, by - 0.2, 0.7 + 1.6, by + 0.18)) return txt(logo, sx, sy, 0.75, by - 0.15, 0.05) ? 0xe8e4d8 : 0x3a3a3a;
            if (kind === 'ega' && inRect(sx, sy, 2.6, by - 0.04, FW - 3.6, by + 0.03)) return shade(col, 0.8);
          }
          return -1;
        },
      });
      R.box(m.u0, m.u1, 4.6, m.vf, m.z0, m.z1, (f, x, y, FW, FH) => {
        if (f === 'left') return face(x, y);
        if (f === 'top') return x > FW - 0.05 ? shade(col, 0.85) : speck(shade(col, 1.03), x, y);
        return y > FH - 0.5 && x > FW - 0.5 ? shade(col, 0.8) : speck(shade(col, 0.95), x, y);
      });
      break;
    }
    case 'crt14': case 'crt17': {
      const col = kind === 'crt14' ? 0xdcd4bc : 0xdedbd0, big = kind === 'crt17';
      swivel(R, CU, 2.0, 5.4, big ? 2.7 : 2.4, shade(col, 0.9));
      R.box(CU - 1.3, CU + 1.3, 2.6, 4.9, 6.28, m.z0 + 0.1, () => shade(col, 0.78));
      crtBack(R, m, col, big ? 0.3 : 0.6, big ? 4.3 : 4.6, big ? 5 : 4, big ? 2.5 : 2.2, big ? 2.5 : 2.1, big ? 1.4 : 1.2);
      const face = bezel(m, col, {
        rim: 0.2, round: 0.3,
        detail: (sx, sy, FW, FH) => {
          const by = FH - m.g.b * 0.45;
          if (inRect(sx, sy, m.g.l, FH - m.g.b + 0.28, FW - m.g.r, FH - m.g.b + 0.33)) return shade(col, 0.82);
          const lw = logo.w * 0.05;
          if (inRect(sx, sy, FW / 2 - lw / 2, by - 0.15, FW / 2 + lw / 2, by + 0.12)) return txt(logo, sx, sy, FW / 2 - lw / 2, by - 0.12, 0.05) ? 0x6a6660 : -1;
          for (let i = 0; i < 4; i++) { const bx = FW - 3.3 + i * 0.42; if (inRect(sx, sy, bx, by - 0.1, bx + 0.28, by + 0.12)) return sy < by - 0.05 ? shade(col, 1.12) : shade(col, 0.8); }
          if (big) { if (disc2(sx, sy, FW - 1.1, by, 0.24)) return disc2(sx, sy, FW - 1.1, by, 0.17) ? shade(col, 1.05) : shade(col, 0.72); }
          else if (inRect(sx, sy, FW - 1.35, by - 0.14, FW - 0.85, by + 0.16)) return sy < by - 0.08 ? shade(col, 1.15) : shade(col, 0.78);
          if (disc2(sx, sy, FW - 1.6, by, 0.065)) return led;
          if (sx > 0.5 && sx < 1.6 && sy > by - 0.2 && sy < by + 0.2 && ((sx * 10) | 0) % 2 === 0) return shade(col, 0.72);
          return -1;
        },
      });
      R.box(m.u0, m.u1, big ? 4.3 : 4.6, m.vf, m.z0, m.z1, (f, x, y, FW, FH) => {
        if (f === 'left') return face(x, y);
        if (f === 'top') { if (outCorner(x, y, FW, FH, 0.2)) return -1; return y > FH - 0.08 ? shade(col, 1.1) : speck(shade(col, 1.02), x, y); }
        return speck(shade(col, 0.95), x, y);
      });
      break;
    }
    case 'lcd43': {
      const silver = 0xbfc3c9, black = 0x17181a;
      // rund silverfot + hals + bakstycke
      R.box(CU - 2.2, CU + 2.2, 2.2, 5.4, 6, 6.22, (f, x, y, FW, FH) => {
        if (f === 'top') { const dx = (x - FW / 2) / (FW / 2), dy = (y - FH / 2) / (FH / 2), d = dx * dx + dy * dy; if (d > 1) return -1; return d > 0.8 ? shade(silver, 0.85) : brushed(silver, x + y); }
        return -1;
      });
      R.box(CU - 0.55, CU + 0.55, 3.0, 3.55, 6.22, 11.5, (f, x, y) => (f === 'left' ? brushed(0xa8adb3, x) : shade(0x9a9ea4, y < 0.2 ? 1.1 : 1)));
      R.box(CU - 3.6, CU + 3.6, 3.55, 3.75, m.z0 + 1.3, m.z1 - 1.6, (f, x) => (f === 'top' ? 0x2a2b2e : ((x * 5) | 0) % 2 ? 0x1e1f22 : 0x242528));
      const face = bezel(m, silver, {
        rim: 0, round: 0.12, frame: black, frameW: 0.14,
        detail: (sx, sy, FW, FH) => {
          const by = FH - m.g.b * 0.5, lw = logo.w * 0.045;
          if (inRect(sx, sy, FW / 2 - lw / 2, by - 0.12, FW / 2 + lw / 2, by + 0.12)) return txt(logo, sx, sy, FW / 2 - lw / 2, by - 0.11, 0.045) ? 0x2a2c30 : -1;
          for (let i = 0; i < 5; i++) { const bx = FW - 2.6 + i * 0.38; if (disc2(sx, sy, bx, by + 0.05, 0.08)) return 0x5a5e64; }
          if (disc2(sx, sy, FW - 0.55, by + 0.05, 0.07)) return led;
          return -1;
        },
      });
      R.box(m.u0, m.u1, 3.75, m.vf, m.z0, m.z1, (f, x, y, FW) => {
        if (f === 'left') { const c = face(x, y); return c === silver ? brushed(silver, x) : c; }
        if (f === 'top') return x < 0.1 || x > FW - 0.1 ? shade(silver, 0.8) : 0x2a2b2e;
        return y < 0.1 ? shade(silver, 1.1) : shade(silver, 0.85);
      });
      break;
    }
    case 'lcd169': {
      const black = 0x121214;
      R.box(CU - 2.7, CU + 2.7, 1.2, 4.6, 6, 6.2, (f, x, y, FW, FH) => {
        if (f === 'top') { const dx = (x - FW / 2) / (FW / 2), dy = (y - FH / 2) / (FH / 2), d = dx * dx + dy * dy; if (d > 1) return -1; return d > 0.82 ? 0x2a2a2e : gloss(0x1a1a1d, x, y); }
        return -1;
      });
      R.box(CU - 0.7, CU + 0.7, 1.9, 2.5, 6.2, 11.2, (f, x, y) => (f === 'left' ? gloss(0x1a1a1d, x, y) : 0x151517));
      R.box(CU - 4.6, CU + 4.6, 2.5, 2.6, m.z0 + 1.2, m.z1 - 1.8, () => 0x19191c);
      const face = bezel(m, black, {
        rim: 0, round: 0.1, frame: 0x060607, frameW: 0.06, gloss: true,
        detail: (sx, sy, FW, FH) => {
          const by = FH - m.g.b * 0.5, lw = logo.w * 0.04;
          if (inRect(sx, sy, FW / 2 - lw / 2, by - 0.1, FW / 2 + lw / 2, by + 0.1)) return txt(logo, sx, sy, FW / 2 - lw / 2, by - 0.1, 0.04) ? 0x8a8a92 : -1;
          for (let i = 0; i < 4; i++) { const bx = FW - 2.4 + i * 0.4; if (inRect(sx, sy, bx, by - 0.02, bx + 0.12, by + 0.04)) return 0x4a4a52; }
          if (disc2(sx, sy, FW - 0.6, by, 0.06)) return !st.monPower ? 0x2a2a2a : st.powered ? 0xe8f0ff : 0xe8a030;
          return -1;
        },
      });
      R.box(m.u0, m.u1, 2.6, m.vf, m.z0, m.z1, (f, x, y) => {
        if (f === 'left') return face(x, y);
        if (f === 'top') return 0x1c1c20;
        return y < 0.08 ? 0x2c2c32 : 0x141417;
      });
      break;
    }
    default: { // lcd-slim
      const alu = 0xa4a9b0, chin = 0x2a2c31;
      R.box(CU - 2.4, CU + 2.4, 0.9, 4.5, 6, 6.12, (f, x, y, FW, FH) => {
        if (f === 'top') { if (outCorner(x, y, FW, FH, 0.5)) return -1; return y < 0.06 || x < 0.06 ? shade(alu, 1.15) : brushed(alu, y); }
        return shade(alu, 0.8);
      });
      R.box(CU - 0.85, CU + 0.85, 1.2, 1.75, 6.12, 12.5, (f, x, y, FW) => (f === 'left' ? (x < 0.08 || x > FW - 0.08 ? shade(alu, 0.85) : brushed(alu, x)) : f === 'top' ? shade(alu, 1.1) : shade(alu, 0.78)));
      R.box(CU - 4.2, CU + 4.2, 1.75, 2.8, m.z0 + 1.6, m.z1 - 2.2, (f, x, y) => (f === 'top' ? 0x3a3c40 : f === 'right' ? 0x2a2c30 : ((x * 3 + y) % 2 < 0.1 ? 0x34363a : 0x303236)));
      const face = bezel(m, 0x0e0e10, {
        rim: 0, round: 0.08, plain: true,
        detail: (sx, sy, FW, FH) => {
          if (sy > FH - m.g.b) {
            if (sy > FH - 0.05) return shade(alu, 0.9);
            const lw = logo.w * 0.035;
            if (inRect(sx, sy, FW / 2 - lw / 2, FH - 0.28, FW / 2 + lw / 2, FH - 0.1)) return txt(logo, sx, sy, FW / 2 - lw / 2, FH - 0.27, 0.035) ? 0x9a9ea6 : chin;
            if (disc2(sx, sy, FW - 0.5, FH - 0.2, 0.05)) return st.powered && st.monPower ? 0xf0f4ff : st.monPower ? 0xe8a030 : 0x3a3a3a;
            return chin;
          }
          return -1;
        },
      });
      R.box(m.u0, m.u1, 2.8, m.vf, m.z0, m.z1, (f, x, y, FW) => {
        if (f === 'left') return face(x, y);
        if (f === 'top') return x < 0.08 || x > FW - 0.08 ? 0x4a4c50 : 0x26282c;
        return y < 0.06 ? 0x4a4c52 : 0x303236;
      });
    }
  }
}

// ---------- Tangentbord ----------
// Rader i tangentenheter: [bredd, typ] där a = bokstav, m = modifierare, f = funktion,
// e = Esc, s = mellanslag, n = numeriska, g = mellanrum.
const K = (n, w = 1, t = 'a') => Array.from({ length: n }, () => [w, t]);
const FULL_MAIN = (win) => [
  [...K(13), [2, 'm']],
  [[1.5, 'm'], ...K(12), [1.5, 'm']],
  [[1.75, 'm'], ...K(11), [2.25, 'm']],
  [[2.25, 'm'], ...K(10), [2.75, 'm']],
  win ? [[1.25, 'm'], [1.25, 'm'], [1.25, 'm'], [6.25, 's'], [1.25, 'm'], [1.25, 'm'], [1.25, 'm'], [1.25, 'm']]
    : [[1.5, 'm'], [1, 'g'], [1.5, 'm'], [7, 's'], [1.5, 'm'], [1, 'g'], [1.5, 'm']],
];
function layoutFull(win, ledBlock) {
  const keys = [];
  const put = (x, y, w, h, t) => keys.push({ x, y, w, h, t });
  put(0, 0, 1, 1, 'e');
  for (let i = 0; i < 12; i++) put(2 + i + Math.floor(i / 4) * 0.5, 0, 1, 1, 'f');
  for (let i = 0; i < 3; i++) put(15.25 + i, 0, 1, 1, 'm');
  FULL_MAIN(win).forEach((row, r) => { let x = 0; for (const [w, t] of row) { if (t !== 'g') put(x, 1.25 + r, w, 1, t); x += w; } });
  for (let i = 0; i < 3; i++) { put(15.25 + i, 1.25, 1, 1, 'm'); put(15.25 + i, 2.25, 1, 1, 'm'); put(15.25 + i, 5.25, 1, 1, 'm'); }
  put(16.25, 4.25, 1, 1, 'm');
  const nx = 18.5;
  for (let i = 0; i < 4; i++) put(nx + i, 1.25, 1, 1, i === 0 ? 'm' : 'n');
  for (let r = 0; r < 3; r++) for (let i = 0; i < 3; i++) put(nx + i, 2.25 + r, 1, 1, 'n');
  put(nx + 3, 2.25, 1, 2, 'n'); put(nx + 3, 4.25, 1, 2, 'm');
  put(nx, 5.25, 2, 1, 'n'); put(nx + 2, 5.25, 1, 1, 'n');
  return { keys, w: 22.5, h: 6.25, led: ledBlock ? { x: nx, y: 0, w: 4, h: 1 } : null };
}
function layoutXT() {
  const keys = [];
  const put = (x, y, w, h, t) => keys.push({ x, y, w, h, t });
  for (let r = 0; r < 5; r++) for (let i = 0; i < 2; i++) put(i, r, 1, 1, 'f');
  const rows = [[[1, 'e'], ...K(12), [2, 'm']], [[1.5, 'm'], ...K(12), [1.5, 'm']], [[1.75, 'm'], ...K(12), [1.25, 'm']], [[1.25, 'm'], ...K(11), [1.75, 'm'], [1, 'm']], [[1.5, 'm'], [0.25, 'g'], [11.5, 's'], [1.75, 'm']]];
  rows.forEach((row, r) => { let x = 2.5; for (const [w, t] of row) { if (t !== 'g') put(x, r, w, 1, t); x += w; } });
  const nx = 18;
  put(nx, 0, 2, 1, 'm'); put(nx + 2, 0, 2, 1, 'm');
  for (let r = 1; r < 4; r++) for (let i = 0; i < 3; i++) put(nx + i, r, 1, 1, 'n');
  put(nx + 3, 1, 1, 1, 'n'); put(nx + 3, 2, 1, 2, 'n');
  put(nx, 4, 2, 1, 'n'); put(nx + 2, 4, 1, 1, 'n'); put(nx + 3, 4, 1, 1, 'n');
  return { keys, w: 22, h: 5, led: null };
}
const KB = {
  'pc-83': { lay: layoutXT(), m: [0.4, 0.4, 0.3], body: 0xcfc6ae, a: 0xe2dccb, mod: 0x9b958a, f: 0x9b958a, legend: 0x3a3833, legendDark: 0xe8e4d8, keyH: 0.19, thick: 0.34, rim: 0.42 },
  'model-m': { lay: layoutFull(false, true), m: [0.32, 0.62, 0.24], body: 0xd4cfbf, a: 0xe9e6da, mod: 0xaeaca2, f: 0xaeaca2, legend: 0x2e2e2e, legendDark: 0x2e2e2e, keyH: 0.18, thick: 0.3, rim: 0.46 },
  'beige-104': { lay: layoutFull(true, true), m: [0.3, 0.52, 0.22], body: 0xd9d1b7, a: 0xebe4cc, mod: 0xcbc2a6, f: 0xcbc2a6, legend: 0x3a382e, legendDark: 0x3a382e, keyH: 0.16, thick: 0.27, rim: 0.38 },
  'black-104': { lay: layoutFull(true, true), m: [0.28, 0.48, 0.22], body: 0x1c1c1f, a: 0x2e2e33, mod: 0x26262a, f: 0x26262a, legend: 0xb8b8bc, legendDark: 0xb8b8bc, keyH: 0.15, thick: 0.25, rim: 0.34 },
  'rgb-mech': { lay: layoutFull(true, false), m: [0.2, 0.22, 0.18], body: 0x141417, a: 0x1d1d21, mod: 0x1d1d21, f: 0x1d1d21, legend: 0x9a9aa0, legendDark: 0x9a9aa0, keyH: 0.24, thick: 0.22, rim: 0.3 },
};
const KB_U = [3, 14], KB_V = [6, 9];

export function drawKeyboard(R, era, lit, t) {
  const S = KB[era.keyboard] || KB['black-104'];
  const [side, back, front] = S.m, lay = S.lay;
  const u0 = KB_U[0], u1 = KB_U[1], v0 = KB_V[0], v1 = KB_V[1], z0 = 6;
  const zc = z0 + S.thick;
  const rgb = era.keyboard === 'rgb-mech';
  const beige = S.body !== 0x1c1c1f && !rgb;
  const badge = textBitmap('PIXEL');
  // bakre list (lysdioder/märke) och själva lådan
  R.box(u0, u1, v0, v0 + back, z0, z0 + S.rim, (f, x, y, W, H) => {
    if (f === 'top') {
      if (outCorner(x, y, W, H + 1, 0.12)) return -1;
      if (lay.led) {
        const lx = side + lay.led.x * ((u1 - u0 - side * 2) / lay.w);
        for (let i = 0; i < 3; i++) { const cx = lx + 0.35 + i * 0.5; if (disc2(x, y, cx, H * 0.5, 0.07)) return lit && i === 0 ? 0x5aff6a : beige ? 0x3a4a30 : 0x2a3a2a; }
        if (era.keyboard === 'model-m' && inRect(x, y, lx + 1.9, H * 0.3, lx + 2.9, H * 0.7)) return txt(badge, x, y, lx + 1.95, H * 0.35, 0.045) ? 0xe8e8ec : 0x2a4a8a;
      }
      return y < 0.05 ? shade(S.body, 1.12) : speck(S.body, x, y, 40, 0.03);
    }
    return shade(S.body, 0.94);
  });
  R.box(u0, u1, v0 + back, v1, z0, zc, (f, x, y, W, H) => {
    if (f === 'top') { if (outCorner(x, y, W, H, 0.12)) return -1; return rgb && lit ? mix(0x18181c, rainbow(t, u0 + x * 0.45), 0.22) : speck(S.body, x, y, 40, 0.03); }
    if (f === 'left') { if (y > H - 0.06) return shade(S.body, 0.6); return rgb && lit && y > H - 0.12 ? rainbow(t, u0 + x * 0.45) : S.body; }
    return S.body;
  });
  // tangenterna, bakifrån och fram
  const pu = (u1 - u0 - side * 2) / lay.w, pv = (v1 - v0 - back - front) / lay.h, gap = Math.min(pu, pv) * 0.12;
  const keys = lay.sorted || (lay.sorted = [...lay.keys].sort((a, b) => a.y + a.h - (b.y + b.h) || a.x - b.x));
  for (const k of keys) {
    const ku0 = u0 + side + k.x * pu + gap / 2, ku1 = u0 + side + (k.x + k.w) * pu - gap / 2;
    const kv0 = v0 + back + k.y * pv + gap / 2, kv1 = v0 + back + (k.y + k.h) * pv - gap / 2;
    const kz1 = zc + S.keyH + (lay.h - k.y) * 0.018;
    const base = k.t === 'a' || k.t === 'n' || k.t === 's' ? S.a : k.t === 'e' ? (beige ? S.mod : S.a) : k.t === 'f' ? S.f : S.mod;
    const glow = rgb && lit ? rainbow(t, ku0 * 0.45 + kv0 * 0.2) : -1;
    const legend = rgb ? (lit ? mix(glow, 0xffffff, 0.35) : 0x5a5a60) : base === S.a ? S.legend : S.legendDark;
    const space = k.t === 's', wide = k.w >= 1.5;
    R.box(ku0, ku1, kv0, kv1, zc, kz1, (f, x, y, W, H) => {
      if (f !== 'top') return glow >= 0 && y > H - 0.05 ? glow : shade(base, 0.86);
      if (x < 0.035 || y < 0.03) return shade(base, 1.14);
      if (x > W - 0.035 || y > H - 0.03) return shade(base, 0.82);
      if (!space && x > 0.07 && x < 0.07 + Math.min(0.14, W * 0.35) && y > 0.05 && y < 0.1) return legend;
      if (wide && !space && x > W - 0.2 && x < W - 0.08 && y > H - 0.12 && y < H - 0.08) return legend;
      return base;
    });
  }
}

// ---------- Mus och musmatta ----------
const PAD = { u0: 15, u1: 19.5, v0: 6, v1: 10.5 };
function drawPad(R, era, lit, t) {
  const kind = era.mouseKind;
  const pixel = textBitmap('PIXEL');
  R.box(PAD.u0, PAD.u1, PAD.v0, PAD.v1, 6, kind === 'gaming' ? 6.05 : 6.07, (f, x, y, W, H) => {
    if (f === 'top') {
      if (outCorner(x, y, W, H, kind === 'gaming' ? 0.25 : 0.45)) return -1;
      const edge = x < 0.1 || y < 0.1 || x > W - 0.1 || y > H - 0.1;
      switch (kind) {
        case 'ball-beige': {
          if (edge) return 0x2a3a5a;
          if (inRect(x, y, 0.25, 0.25, W - 0.25, H - 0.25) && !inRect(x, y, 0.3, 0.3, W - 0.3, H - 0.3)) return 0x8aa0c8;
          if (inRect(x, y, 0.6, H - 1.0, 2.6, H - 0.55)) return txt(pixel, x, y, 0.65, H - 0.95, 0.08) ? 0xf0d040 : 0x3a5a8a;
          return speck(0x3a5a8a, x, y, 25, 0.05);
        }
        case 'ball-grey': {
          if (edge) return 0x1a2a3a;
          const horizon = H * 0.45 + Math.sin(x * 2) * 0.1;
          if (y < horizon) return disc2(x, y, W * 0.72, H * 0.22, 0.45) ? 0xfff0a0 : mix(0x7ab8f0, 0xc8e4ff, y / horizon);
          if (Math.abs(y - horizon - 0.6 - Math.sin(x * 3) * 0.15) < 0.05) return 0xe8f4ff;
          return mix(0x2a78b8, 0x0a3a6a, (y - horizon) / (H - horizon));
        }
        case 'optical': {
          if (edge) return 0x2a2a30;
          if (inRect(x, y, W - 1.6, H - 0.7, W - 0.3, H - 0.4)) return txt(pixel, x, y, W - 1.55, H - 0.66, 0.05) ? 0x5a5a62 : 0x1c1c20;
          return ((x * 12) | 0) % 2 === ((y * 12) | 0) % 2 ? 0x1e1e22 : 0x1a1a1e;
        }
        default: {
          if (edge) return lit ? rainbow(t, (x + y) * 0.6) : 0x3a3a42;
          if ((x < 0.18 || y < 0.18 || x > W - 0.18 || y > H - 0.18) && ((x + y) * 8 | 0) % 2) return 0x4a4a52;
          return ((x * 10) | 0) % 2 === ((y * 10) | 0) % 2 ? 0x151518 : 0x121215;
        }
      }
    }
    return kind === 'gaming' && lit ? rainbow(t, x * 0.6) : kind === 'ball-grey' ? 0x1a2a3a : kind === 'ball-beige' ? 0x2a3a5a : 0x18181c;
  }, 0, { noEdges: true });
}
export function drawMouse(R, era, lit, t) {
  const kind = era.mouseKind || 'optical';
  drawPad(R, era, lit, t);
  const cu = 16.95, cv = 8.35;
  const body = kind === 'ball-beige' ? 0xd8cfb4 : kind === 'ball-grey' ? 0xd2d3cf : kind === 'optical' ? 0x2a2b30 : 0x1b1b1f;
  const btn = kind === 'ball-beige' ? 0xcbc1a4 : kind === 'ball-grey' ? 0xc4c5c1 : kind === 'optical' ? 0xa8acb4 : 0x232328;
  const zb = 6.07;
  if (kind === 'optical' && lit) R.box(cu - 0.75, cu + 0.75, cv - 1.1, cv + 1.2, zb, zb + 0.005, (f, x, y, W, H) => (f === 'top' && !outCorner(x, y, W, H, 0.55) ? 0xff2020 : -1), 0, { alpha: 0.28, noEdges: true, flat: true });
  const w = kind === 'gaming' ? 0.7 : 0.62, len0 = kind === 'gaming' ? 1.15 : 1.05;
  // nedre skal
  R.box(cu - w, cu + w, cv - len0, cv + len0, zb, zb + 0.22, (f, x, y, W, H) => {
    if (f === 'top') { if (outCorner(x, y, W, H, 0.4)) return -1; return shade(body, 0.92); }
    if (f === 'left') { if (x < 0.25 || x > W - 0.25) return -1; if (kind === 'gaming' && lit && y > 0.12 && y < 0.17) return rainbow(t, 3 + x); return shade(body, 0.95); }
    if (x < 0.3 || x > W - 0.3) return -1;
    if (kind === 'gaming' && lit && y > 0.12 && y < 0.17) return rainbow(t, 3 + x);
    if (kind === 'optical' && y < 0.07) return 0xc8ccd2;
    return body;
  });
  // övre skal med knappar
  const w2 = w - 0.1, bv0 = cv - len0 + 0.12, bv1 = cv + len0 - 0.12, split = cv - 0.15;
  R.box(cu - w2, cu + w2, bv0, bv1, zb + 0.22, zb + 0.42, (f, x, y, W, H) => {
    if (f === 'top') {
      if (outCorner(x, y, W, H, 0.38)) return -1;
      const vy = bv0 + y;
      if (vy < split) {
        if (Math.abs(x - W / 2) < 0.035) return shade(body, 0.55);
        if (Math.abs(vy - split) < 0.04) return shade(body, 0.65);
        return y < 0.06 ? shade(btn, 1.1) : btn;
      }
      if (kind === 'optical' && (x < 0.12 || x > W - 0.12)) return 0xa8acb4;
      return body;
    }
    if (f === 'left') return x < 0.28 || x > W - 0.28 ? -1 : shade(body, 1.02);
    return x < 0.3 || x > W - 0.3 ? -1 : (kind === 'optical' && x < H * 1.5 ? 0xa8acb4 : body);
  });
  // handflatebula med märke/RGB-logga
  R.box(cu - w2 + 0.14, cu + w2 - 0.14, split + 0.15, bv1 - 0.1, zb + 0.42, zb + 0.5, (f, x, y, W, H) => {
    if (f === 'top') {
      if (outCorner(x, y, W, H, 0.3)) return -1;
      if (kind === 'gaming' && disc2(x, y, W / 2, H * 0.55, 0.16)) return lit ? rainbow(t, 1) : 0x2c2c32;
      if (kind === 'ball-beige' && inRect(x, y, W / 2 - 0.2, H - 0.35, W / 2 + 0.2, H - 0.25)) return shade(body, 0.75);
      if (kind === 'ball-grey' && inRect(x, y, W / 2 - 0.14, H - 0.4, W / 2 + 0.14, H - 0.32)) return 0x6a6c70;
      return y < 0.05 ? shade(body, 1.08) : body;
    }
    return x < 0.25 || x > W - 0.25 ? -1 : body;
  });
  if (kind !== 'ball-beige') {
    const wheel = kind === 'gaming' ? (lit ? rainbow(t, 5) : 0x3a3a40) : kind === 'optical' ? 0x1a1a1c : 0x5a5c60;
    R.box(cu - 0.08, cu + 0.08, cv - 0.75, cv - 0.35, zb + 0.34, zb + 0.52, (f, x, y) => (f === 'top' ? (((y * 20) | 0) % 2 ? wheel : shade(wheel, 0.7)) : shade(wheel, 0.8)));
    if (kind === 'gaming') for (let i = 0; i < 2; i++) R.box(cu - 0.06, cu + 0.06, cv - 0.25 + i * 0.16, cv - 0.15 + i * 0.16, zb + 0.42, zb + 0.46, () => 0x4a4a52);
  }
}

// ---------- Prylar på bordet (statiskt lager, ritas EFTER drawMonitor) ----------
// Zoner som syns oavsett skärm och chassi: vänster om tangentbordet (u 0,4–2,4 × v 5,9–7,6,
// höga saker), främre raden framför tangentbordet (u 3,5–13,6 × v 10–12,6, låga saker)
// och – på 80-talet utan mus – musens plats. Bakom skärmen/datorn syns inget.
export function drawDeskDecor(R, era, t = 0, template = '') {
  const y = era.year || 2020;
  if (y < 1990) {
    manuals(R, 0.4, 5.9, [[0xc8a878, 'DOS'], [0xb89a6a, 'BASIC'], [0x8a3a2a, 'PC']]);
    if (!era.mouse) floppyBox525(R, 17.2, 6.4);
    if (template === 'hemdator') joystick(R, 15.4, 8.9);
    else if (!era.mouse) floppy525(R, 15.5, 9.0, 0x1a1a1a, 0xf2f0e6, 0x2c6fb7);
    if (template === 'dos-kontor') fanfold(R, 4.2, 10.0);
    else if (template === 'lotus') { calculator(R, 11.6, 10.2); fanfold(R, 4.2, 10.0); }
    else if (template === 'cad') blueprint(R, 4.0, 9.9);
    else floppy525(R, 5.6, 10.2, 0x1a1a1a, 0xf2f0e6, 0xd8343c);
    return;
  }
  if (y < 2000) {
    const sound = ['doom', 'multimedia', 'quake', 'win95', 'internet'].includes(template);
    if (sound) speaker(R, 0.4, 5.9, 0xdcd4bc, 0x3a3a38);
    else manuals(R, 0.4, 5.9, [[0x1a4a8a, 'FÖNSTER'], [0xe8e4d6, 'DOS'], [0x2a7a3a, 'KALKYL']]);
    if (['multimedia', 'quake', 'internet', 'win95'].includes(template) && y >= 1994) jewelStack(R, 3.6, 10.3);
    else diskBox35(R, 3.6, 10.2);
    if (template === 'internet') modem(R, 9.6, 10.2);
    else if (template === 'doom') diskette35(R, 6.2, 10.4, 0x1a1a1a, 0xd8343c);
    else if (template === 'quake' || template === 'multimedia') jewelCase(R, 6.2, 10.3, template === 'quake' ? 0x5a3a1a : 0x2a6a8a);
    else book(R, 6.0, 10.1, 0x1a4a8a, 'HANDBOK');
    return;
  }
  if (y < 2010) {
    speaker(R, 0.8, 6.0, 0x1c1c20, 0xa8acb4, true);
    cdSpindle(R, 3.6, 10.2);
    if (template === 'htpc') remote(R, 6.4, 10.6);
    else if (template === 'kontor2000') notepad(R, 6.2, 10.0);
    else if (template === 'cs' || template === 'wow') diskette35(R, 6.4, 10.5, 0x2a2a6a, 0xe8e8e8);
    can(R, 12.8, 11.2, 0x1a8a3a);
    return;
  }
  if (template === 'stream') micStand(R, 1.4, 6.8);
  else if (['gaming', 'drom', 'vr', 'minecraft'].includes(template)) headphoneStand(R, 1.4, 6.7);
  else plant(R, 1.4, 6.8);
  phone(R, 3.8, 10.4);
  if (template === 'vr') vrHeadset(R, 9.8, 10.4);
  else if (template === 'minecraft' || template === 'gaming') gamepad(R, 6.0, 10.4);
  else if (template === 'kontor' || template === 'skola' || template === 'ai') notepad(R, 6.0, 10.0);
  if (['gaming', 'drom', 'stream'].includes(template)) can(R, 12.8, 11.2, template === 'drom' ? 0x2a2a30 : 0xd8343c);
}

function floppyBox525(R, u, v) {
  R.box(u, u + 1.9, v, v + 2.3, 6, 6.35, (f, x, y) => (f === 'top' ? 0x6a6458 : shade(0x7a7468, y < 0.05 ? 1.2 : 1)));
  for (let i = 0; i < 6; i++) {
    const dv = v + 0.3 + i * 0.3, lab = [0xe84a4a, 0x4a8ae8, 0xf2f0e6, 0xe8c040, 0x4ac06a, 0xf2f0e6][i];
    R.box(u + 0.15, u + 1.75, dv, dv + 0.12, 6.35, 7.9, (f, x, y) => (f === 'left' ? (y < 0.35 && x > 0.2 && x < 1.1 ? lab : 0x1a1a1a) : f === 'top' ? 0x2a2a2a : 0x151515));
  }
  R.box(u, u + 1.9, v, v + 2.3, 6.35, 7.2, (f, x, y) => (f === 'top' ? ((x + y) % 1.4 < 0.1 ? 0x9a8a78 : 0x5a4a3a) : f === 'left' ? (y < 0.06 ? 0x8a7a68 : 0x4a3a2a) : 0x3e3226), 0, { alpha: 0.55 });
}
function floppy525(R, u, v, sleeve, label, stripe) {
  R.box(u, u + 1.35, v, v + 1.35, 6, 6.04, (f, x, y, W, H) => {
    if (f !== 'top') return 0x111111;
    if (disc2(x, y, W / 2, H / 2, 0.17)) return disc2(x, y, W / 2, H / 2, 0.1) ? 0x0a0a0a : 0x8a7a50;
    if (inRect(x, y, W / 2 - 0.08, H / 2 + 0.25, W / 2 + 0.08, H - 0.12)) return 0x3a3020;
    if (inRect(x, y, 0.15, 0.1, W - 0.15, 0.45)) return y < 0.18 ? stripe : label;
    return sleeve;
  }, 0, { noEdges: true });
}
function diskette35(R, u, v, body, label) {
  R.box(u, u + 1.0, v, v + 1.05, 6, 6.06, (f, x, y, W, H) => {
    if (f !== 'top') return shade(body, 0.8);
    if (inRect(x, y, 0.25, 0, 0.75, 0.38)) return x > 0.55 && x < 0.65 && y > 0.08 && y < 0.3 ? 0x3a3a3a : 0xc0c4c8;
    if (inRect(x, y, 0.12, 0.5, W - 0.12, H - 0.05)) return y < 0.6 ? 0x2a2a2a : label;
    return body;
  }, 0, { noEdges: true });
}
function manuals(R, u, v, list) {
  list.forEach(([col, name], i) => {
    const bm = textBitmap(name);
    R.box(u + i * 0.02, u + 1.9, v + i * 0.62, v + i * 0.62 + 0.55, 6, 8.4 - i * 0.2, (f, x, y, W, H) => {
      if (f === 'left') { if (y < 0.12 || y > H - 0.12) return shade(col, 0.8); return txt(bm, x, y, 0.25, 0.5, 0.07) ? (col === 0xe8e4d6 ? 0x2a2a2a : 0xf2f0e6) : col; }
      if (f === 'top') return x > 0.1 && x < W - 0.1 ? 0xefe9d8 : col;
      return shade(col, 0.9);
    });
  });
}
function joystick(R, u, v) {
  R.box(u, u + 1.2, v, v + 1.2, 6, 6.35, (f, x, y) => {
    if (f === 'top') { if (disc2(x, y, 0.25, 0.25, 0.14)) return 0xd8343c; return x < 0.05 || y < 0.05 ? 0x4a4a4a : 0x2a2a2a; }
    return 0x1c1c1c;
  });
  R.box(u + 0.53, u + 0.67, v + 0.53, v + 0.67, 6.35, 7.4, (f) => (f === 'left' ? 0x3a3a3a : 0x2a2a2a));
  R.box(u + 0.44, u + 0.76, v + 0.44, v + 0.76, 7.4, 7.7, (f, x, y) => (f === 'top' ? (x < 0.12 && y < 0.12 ? 0x5a5a5a : 0x222222) : 0x181818));
  R.box(u + 0.5, u + 0.7, v + 0.44, v + 0.52, 7.55, 7.62, () => 0xd8343c);
}
function fanfold(R, u, v) {
  R.box(u, u + 3.6, v, v + 2.4, 6, 6.18, (f, x, y, W) => {
    if (f !== 'top') return ((y * 30) | 0) % 2 ? 0xe8e8e0 : 0xd0d0c8;
    if (x < 0.22 || x > W - 0.22) return ((y * 5) | 0) % 2 === 0 && Math.abs((x < 0.22 ? x : W - x) - 0.11) < 0.05 ? 0xb8b8b0 : 0xf4f4ec;
    if (((y * 2.5) | 0) % 2 === 0) return ((y * 25) | 0) % 3 === 0 && x > 0.4 && x < W - 0.6 ? 0x6a8a6a : 0xcfe8cf;
    return ((y * 25) | 0) % 3 === 0 && x > 0.4 && x < W - 0.8 ? 0x5a5a5a : 0xf4f4ec;
  });
}
function calculator(R, u, v) {
  R.box(u, u + 1.3, v, v + 1.9, 6, 6.2, (f, x, y) => {
    if (f !== 'top') return 0x2a2a2e;
    if (inRect(x, y, 0.15, 0.15, 1.15, 0.55)) return inRect(x, y, 0.2, 0.22, 1.1, 0.48) ? 0x9aa880 : 0x1a1a1a;
    if (y > 0.7 && y < 1.8 && x > 0.12 && x < 1.18) { const kx = ((x - 0.12) / 0.265) % 1, ky = ((y - 0.7) / 0.275) % 1; if (kx < 0.75 && ky < 0.7) return y > 1.5 && x > 0.9 ? 0xd8343c : 0xc8c8cc; }
    return 0x3a3a40;
  });
}
function blueprint(R, u, v) {
  R.box(u, u + 3.8, v, v + 2.6, 6, 6.03, (f, x, y, W, H) => {
    if (f !== 'top') return 0x1a4a8a;
    if (x < 0.1 || y < 0.1 || x > W - 0.1 || y > H - 0.1) return 0xe8f0ff;
    if ((Math.abs(x - 1.2) < 0.03 && y > 0.5 && y < 2.0) || (Math.abs(y - 2.0) < 0.03 && x > 1.2 && x < 3.2) || (Math.abs(y - 0.5) < 0.03 && x > 1.2 && x < 2.2) || (Math.abs((x - 2.2) - (y - 0.5) * 0.66) < 0.04 && x > 2.2 && x < 3.2)) return 0xe8f0ff;
    if (inRect(x, y, W - 1.0, H - 0.5, W - 0.2, H - 0.2)) return 0xa8c0e8;
    return ((x * 5) | 0) % 5 === 0 || ((y * 5) | 0) % 5 === 0 ? 0x2a5a9a : 0x1e4e8e;
  }, 0, { noEdges: true });
}
function diskBox35(R, u, v) {
  R.box(u, u + 1.4, v, v + 2.0, 6, 6.9, (f, x, y, W, H) => {
    if (f === 'top') return inRect(x, y, 0.1, 0.1, W - 0.1, H - 0.1) ? (((y * 7) | 0) % 2 ? 0x2a2a2a : [0xd8343c, 0x2c6fb7, 0xe8c030, 0x45b964][((y * 7) | 0) % 4]) : 0x6a6a70;
    if (f === 'left') return y < 0.1 ? 0x8a8a90 : inRect(x, y, 0.2, 0.25, W - 0.2, 0.55) ? 0xf2f0e6 : 0x5a5a60;
    return 0x4a4a50;
  });
}
function jewelCase(R, u, v, art) {
  R.box(u, u + 1.45, v, v + 1.3, 6, 6.12, (f, x, y, W, H) => {
    if (f !== 'top') return y < 0.04 ? 0xe8eef4 : 0x2a2a2a;
    if (x < 0.12) return 0x2a2a2a;
    if (x > 0.14 && x < W - 0.06 && y > 0.06 && y < H - 0.06) return disc2(x, y, 0.95, 0.65, 0.3) ? shade(art, 1.6) : ((x + y) % 0.9 < 0.08 ? 0xffffff : art);
    return 0xc8d0d8;
  });
}
function jewelStack(R, u, v) {
  [0x5a3a1a, 0x2a6a8a, 0x8a2a4a, 0x2a2a2a].forEach((a, i) => R.box(u + (i % 2) * 0.05, u + 1.45 + (i % 2) * 0.05, v, v + 1.3, 6 + i * 0.12, 6.12 + i * 0.12, (f, x, y) => (f === 'top' ? (x < 0.12 ? 0x2a2a2a : x > 0.14 && y > 0.06 ? a : 0xc8d0d8) : f === 'left' ? (x < 0.12 ? 0x1a1a1a : 0xb8c0c8) : 0x9aa0a8)));
}
const flagish = (x, y) => (x < 0.5 ? (y < 0.28 ? 0xf25022 : 0x00a4ef) : (y < 0.28 ? 0x7fba00 : 0xffb900));
function book(R, u, v, col, title) {
  const bm = textBitmap(title);
  R.box(u, u + 2.4, v, v + 1.8, 6, 6.3, (f, x, y) => {
    if (f === 'top') { if (inRect(x, y, 0.3, 0.3, 0.3 + bm.w * 0.07, 0.65)) return txt(bm, x, y, 0.3, 0.3, 0.07) ? 0xf2f0e6 : col; if (inRect(x, y, 0.3, 0.9, 1.4, 1.5)) return flagish(x - 0.3, y - 0.9); return col; }
    if (f === 'left') return y < 0.05 || y > 0.25 ? col : 0xefe9d8;
    return x < 0.05 ? col : 0xefe9d8;
  });
}
function modem(R, u, v) {
  const bm = textBitmap('56K');
  R.box(u, u + 3.0, v, v + 1.7, 6, 6.45, (f, x, y, W, H) => {
    if (f === 'top') { if (inRect(x, y, 0.3, 0.3, 1.6, 0.55)) return txt(bm, x, y, 0.35, 0.3, 0.06) ? 0x3a3a38 : 0xdcd4bc; return ((y * 6) | 0) % 2 && x > 1.8 ? 0xcfc7ae : 0xdcd4bc; }
    if (f === 'left') { for (let i = 0; i < 7; i++) if (disc2(x, y, 0.4 + i * 0.35, H / 2, 0.05)) return [0x45ff7a, 0x45ff7a, 0xff4a4a, 0x3a3a3a, 0x45ff7a, 0xffb020, 0x3a3a3a][i]; return 0xd4ccb2; }
    return 0xc8c0a6;
  });
}
const gloss2 = (c, x, y) => (((x - y) % 1.3) + 1.3) % 1.3 < 0.1 ? mix(c, 0xffffff, 0.15) : c;
function speaker(R, u, v, col, cone, black = false) {
  const w = black ? 1.3 : 1.8, d = black ? 1.2 : 1.5, h = black ? 3.2 : 2.9;
  R.box(u, u + w, v, v + d, 6, 6 + h, (f, x, y, W, H) => {
    if (f === 'left') {
      const cx = W / 2;
      if (disc2(x, y, cx, H * 0.62, W * 0.36)) return disc2(x, y, cx, H * 0.62, W * 0.12) ? shade(cone, 0.7) : disc2(x, y, cx, H * 0.62, W * 0.3) ? cone : shade(cone, 1.2);
      if (disc2(x, y, cx, H * 0.2, W * 0.15)) return disc2(x, y, cx, H * 0.2, W * 0.08) ? 0xe8e8e8 : shade(cone, 0.8);
      if (!black && inRect(x, y, W - 0.45, H - 0.35, W - 0.25, H - 0.2)) return 0x45ff7a;
      return y < 0.06 ? shade(col, 1.15) : speck(col, x, y);
    }
    if (f === 'top') return black ? gloss2(col, x, y) : speck(shade(col, 1.03), x, y);
    return !black && y > H * 0.2 && y < H * 0.4 && x > 0.2 && x < 0.5 ? 0x5a5a58 : shade(col, 0.95);
  });
}
function cdSpindle(R, u, v) {
  R.box(u, u + 1.6, v, v + 1.6, 6, 6.15, (f, x, y, W, H) => (f === 'top' && outCorner(x, y, W, H, 0.7) ? -1 : 0x141414));
  R.box(u + 0.08, u + 1.52, v + 0.08, v + 1.52, 6.15, 7.0, (f, x, y, W, H) => {
    if (f === 'top') { if (outCorner(x, y, W, H, 0.65)) return -1; return disc2(x, y, W / 2, H / 2, 0.14) ? 0x2a2a2a : disc2(x, y, W / 2, H / 2, 0.2) ? 0xd8dce0 : mix(0xc8ccd8, 0xe8d8f8, (x + y) / 3); }
    if (x < 0.25 || x > W - 0.25) return -1;
    return ((y * 28) | 0) % 2 ? 0xb8bcc4 : 0xe8ecf0;
  });
  R.box(u + 0.08, u + 1.52, v + 0.08, v + 1.52, 6.15, 7.3, (f, x, y, W, H) => (f === 'top' ? (outCorner(x, y, W, H, 0.65) ? -1 : (x - y) % 0.9 < 0.08 ? 0xffffff : 0xa8b0bc) : (x < 0.25 || x > W - 0.25) ? -1 : x % 0.6 < 0.06 ? 0xf0f4f8 : 0x8a94a0), 0, { alpha: 0.35 });
}
function can(R, u, v, col) {
  R.box(u, u + 0.6, v, v + 0.6, 6, 7.35, (f, x, y, W, H) => {
    if (f === 'top') { if (outCorner(x, y, W, H, 0.25)) return -1; return disc2(x, y, W / 2, H * 0.4, 0.1) ? 0x6a6a6a : 0xc0c4c8; }
    if (x < 0.07 || x > W - 0.07) return -1;
    if (y < 0.08 || y > H - 0.06) return 0xb8bcc0;
    if (y > 0.4 && y < 0.8) return x > 0.15 && x < 0.45 ? 0xf0f0f0 : shade(col, 1.3);
    return x > W * 0.55 && x < W * 0.65 ? shade(col, 1.4) : col;
  });
}
function remote(R, u, v) {
  R.box(u, u + 2.4, v, v + 0.65, 6, 6.16, (f, x, y) => {
    if (f !== 'top') return 0x121214;
    if (x > 0.2 && x < 2.1 && y > 0.12 && y < 0.53) { const kx = ((x - 0.2) / 0.24) % 1, ky = ((y - 0.12) / 0.2) % 1; if (kx < 0.6 && ky < 0.6) return x < 0.45 ? 0x45b964 : x > 1.8 ? 0xd8343c : 0x5a5a62; }
    return 0x1e1e22;
  });
}
function notepad(R, u, v) {
  R.box(u, u + 2.0, v, v + 2.4, 6, 6.08, (f, x, y) => {
    if (f !== 'top') return 0xe0dcd0;
    if (y < 0.18) return ((x * 8) | 0) % 2 ? 0x8a8a8a : 0x3a3a3a;
    if (x > 0.25 && Math.abs((y - 0.3) % 0.22) < 0.025) return 0x9ab8d8;
    if (x > 0.3 && x < 1.5 && y > 0.3 && y < 1.5 && Math.abs((y - 0.4) % 0.22) < 0.03 && hash((x * 20) | 0, (y * 5) | 0) > 0.3) return 0x2a3a6a;
    return 0xf6f3ea;
  });
  R.box(u + 2.2, u + 3.6, v + 0.8, v + 0.92, 6, 6.1, (f, x) => (x < 0.2 ? 0xd8b060 : x > 1.2 ? 0x2a2a2a : 0x1a4a8a));
}
function phone(R, u, v) {
  R.box(u, u + 0.85, v, v + 1.7, 6, 6.08, (f, x, y, W, H) => {
    if (f !== 'top') return 0x2a2a2e;
    if (outCorner(x, y, W, H, 0.15)) return -1;
    if (inRect(x, y, 0.06, 0.08, W - 0.06, H - 0.08)) return (x - y * 0.5) % 0.9 < 0.1 && x - y * 0.5 > -0.4 ? 0x2a2e36 : 0x0a0c10;
    return 0x1a1a1e;
  });
}
function plant(R, u, v) {
  R.box(u - 0.55, u + 0.55, v - 0.55, v + 0.55, 6, 7.0, (f, x, y, W, H) => {
    if (f === 'top') return disc2(x, y, W / 2, H / 2, 0.45) ? 0x4a3020 : 0xb8643a;
    if (y < 0.15) return 0xc8744a;
    return shade(0xb05a32, 1 - y * 0.15);
  });
  for (const [du, dv, h] of [[0, 0, 1.0], [0.3, -0.2, 0.7], [-0.3, 0.2, 0.8], [0.2, 0.3, 0.5], [-0.2, -0.3, 0.6]]) R.box(u + du - 0.12, u + du + 0.12, v + dv - 0.12, v + dv + 0.12, 7.0, 7.0 + h + 0.4, (f, x, y) => (f === 'top' ? 0x6ac04a : y < 0.2 ? 0x5ab03a : 0x3a8a2a));
  R.box(u - 0.4, u + 0.4, v - 0.4, v + 0.4, 7.0, 7.3, (f, x, y, W, H) => (f === 'top' ? (outCorner(x, y, W, H, 0.3) ? -1 : ((x + y) * 5 | 0) % 2 ? 0x4aa03a : 0x3a8a2a) : 0x2f7a22));
}
function headphoneStand(R, u, v) {
  R.box(u - 0.7, u + 0.7, v - 0.7, v + 0.7, 6, 6.12, (f, x, y, W, H) => (f === 'top' ? (outCorner(x, y, W, H, 0.4) ? -1 : 0x2a2a30) : 0x1a1a1e));
  R.box(u - 0.08, u + 0.08, v - 0.08, v + 0.08, 6.12, 9.6, () => 0x3a3a42);
  R.box(u - 0.95, u - 0.6, v - 0.35, v + 0.35, 8.0, 9.0, (f, x, y, W, H) => (f === 'left' ? (disc2(x, y, W / 2, H / 2, 0.14) ? 0xd8343c : 0x18181c) : 0x121216));
  R.box(u - 0.75, u + 0.75, v - 0.12, v + 0.12, 9.6, 9.85, (f, x, y) => (f === 'top' ? 0x2a2a30 : y < 0.06 ? 0x5a5a62 : 0x1e1e24));
  R.box(u + 0.6, u + 0.95, v - 0.35, v + 0.35, 8.0, 9.0, (f, x, y, W, H) => (f === 'right' ? (disc2(x, y, W / 2, H / 2, 0.16) ? 0xd8343c : 0x18181c) : 0x121216));
  R.box(u - 0.72, u - 0.62, v - 0.1, v + 0.1, 9.0, 9.6, () => 0x2a2a30);
  R.box(u + 0.62, u + 0.72, v - 0.1, v + 0.1, 9.0, 9.6, () => 0x2a2a30);
}
function micStand(R, u, v) {
  R.box(u - 0.6, u + 0.6, v - 0.6, v + 0.6, 6, 6.15, (f, x, y, W, H) => (f === 'top' ? (outCorner(x, y, W, H, 0.5) ? -1 : 0x2a2a30) : 0x1a1a1e));
  R.box(u - 0.07, u + 0.07, v - 0.07, v + 0.07, 6.15, 8.6, () => 0x4a4a52);
  R.box(u - 0.3, u + 0.3, v - 0.3, v + 0.3, 8.6, 10.2, (f, x, y, W, H) => {
    if (f === 'top') return outCorner(x, y, W, H, 0.22) ? -1 : 0x3a3a42;
    if (x < 0.06 || x > W - 0.06) return -1;
    if (y > H - 0.35) return 0x2a2a30;
    return ((y * 12) | 0) % 2 ? 0x5a5a62 : 0x3a3a42;
  });
}
function gamepad(R, u, v) {
  R.box(u, u + 2.2, v, v + 1.2, 6, 6.35, (f, x, y, W, H) => {
    if (f !== 'top') return f === 'left' && (x < 0.3 || x > W - 0.3) && y > 0.2 ? -1 : 0x16161a;
    if (outCorner(x, y, W, H, 0.4)) return -1;
    if (disc2(x, y, 0.55, 0.55, 0.2)) return disc2(x, y, 0.55, 0.55, 0.12) ? 0x3a3a42 : 0x0e0e10;
    if (disc2(x, y, 1.45, 0.8, 0.2)) return disc2(x, y, 1.45, 0.8, 0.12) ? 0x3a3a42 : 0x0e0e10;
    for (const [bx, by, c] of [[1.75, 0.35, 0x45b964], [1.95, 0.55, 0xd8343c], [1.55, 0.55, 0x2c6fb7], [1.75, 0.2, 0xe8c030]]) if (disc2(x, y, bx, by + 0.05, 0.06)) return c;
    if (inRect(x, y, 0.95, 0.35, 1.05, 0.65) || inRect(x, y, 0.85, 0.45, 1.15, 0.55)) return 0x3a3a42;
    return 0x222228;
  });
}
function vrHeadset(R, u, v) {
  R.box(u, u + 2.6, v + 0.55, v + 1.05, 6, 6.12, () => 0x2a2a30);
  R.box(u + 0.4, u + 2.2, v, v + 1.3, 6.12, 6.9, (f, x, y, W, H) => {
    if (f === 'top') { if (outCorner(x, y, W, H, 0.3)) return -1; return (x - y) % 1.1 < 0.08 ? 0x3a3a42 : 0x1a1a1e; }
    if (f === 'left') { if (x < 0.15 || x > W - 0.15) return -1; return disc2(x, y, 0.45, 0.4, 0.1) || disc2(x, y, W - 0.45, 0.4, 0.1) ? 0x3a3a42 : 0x18181c; }
    return 0x141418;
  });
}
