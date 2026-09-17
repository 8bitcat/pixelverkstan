// Pixel-rastrering för isometriska lådor. Allt ritas pixel för pixel i en
// lågupplöst buffert (skarpa kanter, ingen kantutjämning) som sedan skalas upp.
// Varje pixel minns också vilket objekt som ritade den → exakt klicktest.

export const rgb = (r, g, b) => (r << 16) | (g << 8) | b;
export const hex = (s) => parseInt(s.replace('#', ''), 16);
export function shade(c, f) {
  const r = Math.min(255, ((c >> 16) & 255) * f) | 0;
  const g = Math.min(255, ((c >> 8) & 255) * f) | 0;
  const b = Math.min(255, (c & 255) * f) | 0;
  return (r << 16) | (g << 8) | b;
}
export function mix(a, b, t) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return rgb(ar + (br - ar) * t | 0, ag + (bg - ag) * t | 0, ab + (bb - ab) * t | 0);
}
export const css = (c) => '#' + c.toString(16).padStart(6, '0');
export function hsl(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return ((f(0) * 255 | 0) << 16) | ((f(8) * 255 | 0) << 8) | (f(4) * 255 | 0);
}
// RGB-regnbåge som vandrar med tiden
export const rainbow = (t, offset = 0, l = 0.6) => hsl(t * 90 + offset * 40, 0.95, l);

const FACE_SHADE = { top: 1, left: 0.8, right: 0.64 };

export class Raster {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.canvas = document.createElement('canvas');
    this.canvas.width = w; this.canvas.height = h;
    this.ctx = this.canvas.getContext('2d');
    this.img = this.ctx.createImageData(w, h);
    this.data = this.img.data;
    this.ids = new Int16Array(w * h);
    // isometrisk projektion: k px per enhet, hz px per höjdenhet
    this.k = 8; this.hz = 6.5; this.ox = w / 2; this.oy = 20;
  }
  clear(color = -1) {
    const d = this.data;
    for (let i = 0, p = 0; i < this.w * this.h; i++, p += 4) {
      if (color < 0) { d[p + 3] = 0; }
      else { d[p] = color >> 16 & 255; d[p + 1] = color >> 8 & 255; d[p + 2] = color & 255; d[p + 3] = 255; }
    }
    this.ids.fill(0);
  }
  px(x, y, c, id = 0, a = 1) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = y * this.w + x, p = i * 4, d = this.data;
    const r = c >> 16 & 255, g = c >> 8 & 255, b = c & 255;
    if (a >= 1 || d[p + 3] === 0) { d[p] = r; d[p + 1] = g; d[p + 2] = b; d[p + 3] = a >= 1 ? 255 : Math.max(d[p + 3], a * 255); }
    else { d[p] += (r - d[p]) * a; d[p + 1] += (g - d[p + 1]) * a; d[p + 2] += (b - d[p + 2]) * a; }
    if (id) this.ids[i] = id;
  }
  flush() { this.ctx.putImageData(this.img, 0, 0); return this.canvas; }
  idAt(x, y, radius = 2) {
    x |= 0; y |= 0;
    for (let r = 0; r <= radius; r++)
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= this.w || yy >= this.h) continue;
          const id = this.ids[yy * this.w + xx];
          if (id) return id;
        }
    return 0;
  }

  // världen (u,v,z) → buffertkoordinater
  proj(u, v, z = 0) {
    return [this.ox + (u - v) * this.k, this.oy + (u + v) * this.k / 2 - z * this.hz];
  }

  // Ritar en låda. tex(face, sx, sy, W, H) → färg eller -1. sx/sy i enheter på ytan.
  // Ytor: top (sx längs u, sy längs v), left (v=v1-ytan: sx längs u, sy nedåt från topp),
  // right (u=u1-ytan: sx längs v, sy nedåt från topp).
  box(u0, u1, v0, v1, z0, z1, tex, id = 0, opt = {}) {
    const { k, hz, ox, oy } = this;
    const H = z1 - z0;
    const alpha = opt.alpha ?? 1;
    const noShade = opt.flat;
    // vänster yta (v = v1)
    if (H > 0) {
      const [xa] = this.proj(u0, v1), [xb] = this.proj(u1, v1);
      const yTop = this.proj(u0, v1, z1)[1], yBot = this.proj(u1, v1, z0)[1];
      for (let y = Math.floor(yTop); y <= Math.ceil(yBot); y++)
        for (let x = Math.floor(xa); x < Math.ceil(xb); x++) {
          const u = (x + 0.5 - ox) / k + v1;
          if (u < u0 || u >= u1) continue;
          const z = (oy + (u + v1) * k / 2 - (y + 0.5)) / hz;
          if (z < z0 || z >= z1) continue;
          const c = tex('left', u - u0, z1 - z, u1 - u0, H);
          if (c >= 0) this.px(x, y, noShade ? c : shade(c, FACE_SHADE.left), id, alpha);
        }
      // höger yta (u = u1)
      const [xc] = this.proj(u1, v1), [xd] = this.proj(u1, v0);
      const yTop2 = this.proj(u1, v0, z1)[1], yBot2 = this.proj(u1, v1, z0)[1];
      for (let y = Math.floor(yTop2); y <= Math.ceil(yBot2); y++)
        for (let x = Math.floor(xc); x < Math.ceil(xd); x++) {
          const v = u1 - (x + 0.5 - ox) / k;
          if (v < v0 || v >= v1) continue;
          const z = (oy + (u1 + v) * k / 2 - (y + 0.5)) / hz;
          if (z < z0 || z >= z1) continue;
          const c = tex('right', v - v0, z1 - z, v1 - v0, H);
          if (c >= 0) this.px(x, y, noShade ? c : shade(c, FACE_SHADE.right), id, alpha);
        }
    }
    // topp (z = z1)
    const xs = [this.proj(u0, v1)[0], this.proj(u1, v0)[0]];
    const ys = [this.proj(u0, v0, z1)[1], this.proj(u1, v1, z1)[1]];
    for (let y = Math.floor(ys[0]); y <= Math.ceil(ys[1]); y++)
      for (let x = Math.floor(xs[0]); x < Math.ceil(xs[1]); x++) {
        const a = (x + 0.5 - ox) / k;
        const b = (y + 0.5 - oy + z1 * hz) * 2 / k;
        const u = (a + b) / 2, v = (b - a) / 2;
        if (u < u0 || u >= u1 || v < v0 || v >= v1) continue;
        const c = tex('top', u - u0, v - v0, u1 - u0, v1 - v0);
        if (c >= 0) this.px(x, y, c, id, alpha);
      }
  }
}

// Vanliga textur-byggstenar
export const T = {
  // text i en yta: (x,y) i enheter, texten börjar i (x0,y0), px = enheter per textpixel
  text(bm, x, y, x0, y0, px) { return bm.on(Math.floor((x - x0) / px), Math.floor((y - y0) / px)); },
  solid: (c) => () => c,
  // ram runt toppen
  bordered(c, edge, w = 0.25) {
    return (f, x, y, W, H) => (f === 'top' && (x < w || y < w || x > W - w || y > H - w)) ? edge : c;
  },
  // cirkel (fläkt) på en yta: returnerar true inne i ringen
  inCircle(x, y, cx, cy, r) { const dx = x - cx, dy = y - cy; return dx * dx + dy * dy <= r * r; },
  fan(x, y, cx, cy, r, frame, hub, blade, gap) {
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
    if (d > r) return -1;
    if (d > r - 0.18) return shade(gap, 0.7);
    if (d < r * 0.28) return hub;
    const ang = Math.atan2(dy, dx) + frame;
    return (Math.sin(ang * 7 + d * 2.2) > 0.1) ? blade : gap;
  },
};
