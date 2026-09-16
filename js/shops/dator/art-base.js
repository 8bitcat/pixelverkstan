// Pixelgrafik: arbetsbänk, chassi och moderkort (inkl. sockel/slots som är klickbara).
import { hex, shade, mix } from '../../core/raster.js';
import { G, BOARD_TOP } from './geom.js';

const STANDOFFS = [[2.5, 2.5], [2.5, 9], [2.5, 16], [9.5, 2.5], [9.5, 9], [9.5, 16], [13.8, 2.5], [13.8, 9], [13.8, 16]];

export function drawMat(R, id) {
  const m = G.mat;
  R.box(m.u0, m.u1, m.v0, m.v1, -0.4, 0, (f, x, y) => {
    if (f !== 'top') return 0x2b323c;
    const line = (x % 2) < 0.13 || (y % 2) < 0.13;
    return line ? 0x4a5462 : 0x3b4451;
  }, id);
}

export function drawCase(R, part, o) {
  const c = G.case, col = hex(part.look.color), inner = hex(part.look.inner);
  const id = o.ids.case || 0;
  // golvplåt med standoffs och ventilationshål under nätagget
  R.box(c.u0, c.u1, c.v0, c.v1, c.z0, c.z1, (f, x, y) => {
    if (f !== 'top') return col;
    for (const [su, sv] of STANDOFFS) if (Math.abs(x - su) < 0.28 && Math.abs(y - sv) < 0.28) return 0xd8b24a;
    const p = G.psu;
    if (x > p.u0 + 0.6 && x < p.u1 - 0.6 && y > p.v0 + 0.6 && y < p.v1 - 0.6 && (x * 2.5 | 0) % 2 === 0 && (y * 2.5 | 0) % 2 === 0) return shade(inner, 0.55);
    if (x < 0.25 || y < 0.25 || x > c.u1 - 0.25 || y > c.v1 - 0.25) return shade(col, 1.1);
    return inner;
  }, id);
  // bakre vägg (v = 0) – fläktgaller
  R.box(c.u0, c.u1, c.v0, c.v0 + 0.5, c.z1, c.wall, (f, x, y, W, H) => {
    if (f === 'top') return shade(col, 1.15);
    if (f === 'left') {
      for (const cx of [7, 13, 19]) {
        const d = Math.hypot(x - cx, (y - H / 2) * 1.6);
        if (d < 1.9) return (Math.floor(x * 3) + Math.floor(y * 4)) % 2 ? shade(inner, 0.45) : shade(col, 0.85);
      }
    }
    return col;
  }, id);
  // vänster vägg (u = 0) – bakre I/O-öppning, fläkt och expansionsluckor
  R.box(c.u0, c.u0 + 0.5, c.v0 + 0.5, c.v1, c.z1, c.wall, (f, x, y, W, H) => {
    if (f === 'top') return shade(col, 1.15);
    if (f === 'right') {
      const v = x + 0.5; // sx går längs v
      if (v > 1.6 && v < 7 && y > 0.6 && y < 2.6) return 0x151515;
      if (Math.hypot(v - 10.3, (y - H / 2) * 1.6) < 1.9) return (Math.floor(v * 3) + Math.floor(y * 4)) % 2 ? shade(inner, 0.45) : shade(col, 0.85);
      if (v > 13.3 && v < 16.5 && y > 0.3 && y < H - 0.4 && Math.floor(v * 4) % 4 === 0) return shade(col, 0.6);
    }
    return col;
  }, id);
  // hårddiskbur (slot "bay")
  const b = G.bay, bid = o.ids.bay || id;
  R.box(b.u0, b.u1, b.v0, b.v1, c.z1, c.z1 + 0.05, (f, x, y, W, H) => {
    const edge = x < 0.3 || y < 0.3 || x > W - 0.3 || y > H - 0.3;
    return edge ? 0x9aa0a6 : shade(inner, 0.9);
  }, bid);
  R.box(b.u0 - 0.3, b.u0, b.v0, b.v1, c.z1, c.z1 + 1.8, () => 0x8b9197, bid);
  R.box(b.u0, b.u1, b.v0 - 0.3, b.v0, c.z1, c.z1 + 1.8, () => 0x8b9197, bid);
  // nätaggsplats (slot "psu")
  const p = G.psu, pid = o.ids.psu || id;
  if (!o.psuPlaced) R.box(p.u0, p.u1, p.v0, p.v1, c.z1, c.z1 + 0.04, (f, x, y, W, H) => {
    const edge = (x < 0.2 || y < 0.2 || x > W - 0.2 || y > H - 0.2);
    return edge ? ((Math.floor((x + y) * 2) % 2) ? 0xe0a02a : 0x222222) : -1;
  }, pid);
}

export function drawBoard(R, part, o) {
  const b = G.board, L = part.look, pcb = hex(L.pcb), acc = hex(L.accent);
  const u1 = part.size === 'ATX' ? b.u1ATX : b.u1mATX;
  const id = o.ids.mb || 0, zt = BOARD_TOP;
  R.box(b.u0, u1, b.v0, b.v1, b.z0, b.z1, (f, x, y, W, H) => {
    if (f !== 'top') return shade(pcb, 0.9);
    const u = x + b.u0, v = y + b.v0;
    for (const [su, sv] of STANDOFFS) {
      const d = Math.hypot(u - su, v - sv);
      if (d < 0.32) return d < 0.16 ? shade(pcb, 0.5) : 0xc9ccd0;
    }
    // kretsbanor (systembussen)
    if ((Math.floor(v * 5) === 44 || Math.floor(v * 5) === 45) && u > 4 && u < 13) return mix(pcb, 0xd8b24a, 0.35);
    if (Math.abs(u - 9.6) < 0.08 && v > 3 && v < 13) return mix(pcb, 0xd8b24a, 0.35);
    if (Math.abs(v - 12.8) < 0.08 && u > 9.6 && u < 14) return mix(pcb, 0xd8b24a, 0.3);
    if ((Math.floor(u * 3) + Math.floor(v * 3)) % 23 === 0) return shade(pcb, 1.25);
    if (x < 0.12 || y < 0.12 || x > W - 0.12 || y > H - 0.12) return shade(pcb, 0.7);
    return pcb;
  }, id);

  // bakre I/O-kåpa och VRM-kylflänsar
  R.box(1.6, 3, 1.6, 7, zt, zt + 1.6, (f, x, y) => f === 'top' ? (Math.floor(y * 3) % 3 === 0 ? shade(acc, 0.8) : acc) : shade(acc, 0.85), id);
  R.box(4.8, 9, 2, 2.9, zt, zt + 1, (f, x, y) => f === 'top' ? ((Math.floor(x * 4) % 2) ? acc : shade(acc, 0.75)) : acc, id);
  R.box(3.3, 4.3, 3.1, 8, zt, zt + 1, (f, x, y) => f === 'top' ? ((Math.floor(y * 4) % 2) ? acc : shade(acc, 0.75)) : acc, id);
  // EPS 8-pin + 24-pin
  R.box(G.eps8.u0, G.eps8.u1, G.eps8.v0, G.eps8.v1, zt, zt + 0.45, (f, x, y) => f === 'top' && ((x * 3.3 | 0) + (y * 3 | 0)) % 2 ? 0x3a3a3a : 0x161616, id);
  const a = G.atx24;
  R.box(a.u0, a.u1, a.v0, a.v1, zt, zt + 0.5, (f, x, y) => f === 'top' && ((x * 3.3 | 0) + (y * 3 | 0)) % 2 ? 0x3a3a3a : 0x161616, id);
  // chipset-kylfläns + SATA-portar + BIOS-batteri
  R.box(10.8, 13.2, 10.4, 12.3, zt, zt + 0.35, (f, x, y, W, H) => f === 'top' && x > 0.6 && x < 1.8 && y > 0.7 && y < 1.1 ? 0xe9e9e9 : acc, id);
  R.box(13.4, 14.2, 11.4, 13, zt, zt + 0.35, (f, x, y) => f === 'top' && (y * 2.5 | 0) % 2 ? 0xb03030 : 0x202020, id);
  R.box(9.3, 10.3, 15.3, 16.3, zt, zt + 0.1, (f, x, y) => Math.hypot(x - 0.5, y - 0.5) < 0.5 ? 0xd4d7db : -1, id);

  // CPU-sockel (slot "cpu")
  const s = G.socket, am4 = part.socket === 'AM4';
  R.box(s.u0, s.u1, s.v0, s.v1, zt, zt + 0.15, (f, x, y, W, H) => {
    if (f !== 'top') return am4 ? 0xd9d2bf : 0x6d7178;
    const e = 0.3;
    if (x < e || y < e || x > W - e || y > H - e) return am4 ? 0xe8e1ce : 0x9aa0a6;
    if (am4) return ((x * 5 | 0) + (y * 5 | 0)) % 2 ? 0xe8e1ce : 0x7b7465;
    if (x > W / 2 - 0.4 && x < W / 2 + 0.4 && y > H / 2 - 0.4 && y < H / 2 + 0.4) return 0x3a3d42;
    return ((x * 6 | 0) + (y * 6 | 0)) % 2 ? 0xc79a3a : 0x2c2e33;
  }, o.ids.cpu || id);
  if (!am4) R.box(s.u1 + 0.1, s.u1 + 0.3, s.v0, s.v1, zt, zt + 0.3, () => 0xb9bdc2, o.ids.cpu || id); // spak

  // RAM-slots (slot "ram")
  G.ramSlots.forEach((su, i) => {
    R.box(su, su + 0.45, G.ramV[0], G.ramV[1], zt, zt + 0.3, (f, x, y, W, H) => {
      if (f === 'top' && (y < 0.35 || y > H - 0.35)) return 0xe9e9e9;
      return i % 2 ? 0x2a2a2a : shade(acc, 0.6);
    }, o.ids.ram || id);
  });
  // M.2-plats (slot "m2")
  const m = G.m2;
  R.box(m.u0, m.u1 + 0.5, m.v0, m.v1, zt, zt + 0.02, (f, x, y, W, H) => {
    if (x > W - 0.5) return 0x2a2a2a;
    if (x < 0.25 && Math.abs(y - H / 2) < 0.2) return 0xd8b24a;
    return (x < 0.08 || y < 0.08 || y > H - 0.08) ? 0xe9e9e9 : shade(pcb, 1.12);
  }, o.ids.m2 || id);
  R.box(m.u1, m.u1 + 0.5, m.v0 + 0.1, m.v1 - 0.1, zt, zt + 0.25, () => 0x2a2a2a, o.ids.m2 || id);
  // PCIe x16 (slot "gpu")
  const p = G.pcie;
  R.box(p.u0, p.u1, p.v0, p.v1, zt, zt + 0.35, (f, x, y, W, H) => {
    if (f === 'top') return (y < 0.12 || y > H - 0.12) ? 0xc9ccd0 : 0x1a1a1a;
    return 0xaeb2b7;
  }, o.ids.gpu || id);
}
