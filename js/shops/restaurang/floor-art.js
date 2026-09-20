// Hamburgerbarens inredning på butiksgolvet: väggen bakom disken (kylhylla, menytavla, köksdörr),
// den rostfria köksbänken (läskmaskin, milkshakemaskin, fritös, grill), sakerna på disken
// (kassa, bricka med burgare, sugrör), brickor som väntar vid luckan, läskkyl och dessertdisk som
// montrar samt jukebox, såsbar och lekhörna. Motorn (core/floor*.js) anropar det här via
// shop.floorArt; datorbutiken har ingen sådan och ritas som förut.
import { Pix, mix, mul, hash, bayer, hex, SMALL, BIG, textW, text, css } from '../../core/floor-pix.js';
import { templatesFor, composeBuild, priceFor } from './orders.js';
import { ERA_LOOK, eraLook, themeFor } from './era.js';

export const noShelf = true;     // lagerhyllan ritas statiskt här (kylhyllan) i stället för lådor per kategori
export const noPoster = true;    // menytavlan sitter där affischen satt
export const noDemoPc = true;    // inga rgb-fläktar på disken

// ---------- Små sprites (x, y = övre vänstra hörnet; base = underkant) ----------
export function burgerSprite(P, x, y, cheese = true) {
  P.hl(x + 2, y, 8, 0xd9a55d); P.rect(x + 1, y + 1, 10, 2, 0xd9a55d); P.px(x + 4, y + 1, 0xf6ecd0); P.px(x + 7, y, 0xf6ecd0); P.px(x + 1, y + 1, 0xe8c07a);
  P.hl(x, y + 3, 12, 0x7fc44a); P.px(x + 3, y + 4, 0x4f9a2a);
  P.hl(x + 1, y + 4, 10, cheese ? 0xf5b52a : 0xe0392e);
  P.rect(x + 1, y + 5, 10, 2, 0x6e3a26); P.px(x + 3, y + 5, 0x4a2016);
  P.rect(x + 1, y + 7, 10, 2, 0xc48a3a); P.hl(x + 1, y + 8, 10, 0xa8702a);
}
export function friesSprite(P, x, y) {
  for (const [dx, h] of [[1, 6], [3, 8], [5, 5], [7, 7], [9, 6]]) P.rect(x + dx, y + 8 - h, 1, h, 0xf0c050);
  P.rect(x, y + 6, 11, 6, 0xc9322a); P.hl(x, y + 6, 11, 0xe04a3a); P.hl(x, y + 11, 11, 0x8a1a14);
}
export function cupSprite(P, x, y, col = 0xf4f1ea, lid = 0xc8ccd0) {
  P.rect(x + 3, y, 1, 4, 0xe0392e);
  P.rect(x, y + 3, 7, 2, lid); P.rect(x + 1, y + 5, 5, 8, col); P.vl(x + 1, y + 5, 8, mix(col, 0xffffff, 0.4)); P.vl(x + 5, y + 5, 8, mul(col, 0.8)); P.hl(x + 1, y + 12, 5, mul(col, 0.7));
}
export function traySprite(P, x, y, w = 20) { P.rect(x, y, w, 3, 0xc9322a); P.hl(x, y, w, 0xe04a3a); P.hl(x, y + 2, w, 0x8a1a14); }
function bottle(P, x, base, col) {
  P.rect(x + 1, base - 10, 3, 2, mul(col, 0.6)); P.rect(x, base - 8, 5, 8, col); P.vl(x, base - 8, 8, mix(col, 0xffffff, 0.4)); P.vl(x + 4, base - 8, 8, mul(col, 0.7));
  P.rect(x + 1, base - 5, 3, 2, 0xf4f1ea);
}
function jar(P, x, base, col) {
  P.rect(x + 1, base - 11, 8, 2, 0x8a8f9c); P.hl(x + 1, base - 11, 8, 0xc8ccd6);
  P.rect(x, base - 9, 10, 9, col); P.vl(x + 1, base - 8, 7, mix(col, 0xffffff, 0.45)); P.vl(x + 8, base - 8, 7, mul(col, 0.7));
  P.rect(x + 2, base - 6, 6, 3, 0xf4f1ea); P.hl(x + 3, base - 5, 4, mul(col, 0.8));
}
function can(P, x, base, col) { P.rect(x, base - 8, 6, 8, col); P.hl(x, base - 8, 6, 0xc8ccd0); P.hl(x, base - 1, 6, mul(col, 0.6)); P.vl(x, base - 7, 6, mix(col, 0xffffff, 0.35)); P.rect(x + 1, base - 5, 4, 2, 0xf4f1ea); }
function bunBag(P, x, base) {
  P.rect(x, base - 9, 16, 9, 0xe6c48a); P.hl(x + 1, base - 10, 14, 0xe6c48a); P.hl(x + 2, base - 11, 12, 0xd9a55d);
  P.rect(x + 2, base - 6, 12, 3, 0xe05a8a); P.hl(x + 3, base - 5, 10, 0xffffff, 0.6);
  P.px(x + 4, base - 9, 0xf6ecd0); P.px(x + 10, base - 8, 0xf6ecd0); P.vl(x + 15, base - 9, 9, 0xb8823f);
}
function cupStack(P, x, base) { for (let i = 0; i < 5; i++) { P.rect(x, base - 3 - i * 3, 9, 3, i % 2 ? 0xe8e4da : 0xf4f1ea); P.hl(x, base - 3 - i * 3, 9, 0xffffff); P.px(x + 3, base - 2 - i * 3, 0xc9322a); P.px(x + 4, base - 2 - i * 3, 0xc9322a); } }

// ---------- Väggen bakom disken ----------
const SHORT = { klassiker: 'ORIGINAL', cheese: 'CHEESE', bacon: 'BACON', 'dubbel-cheese': 'DUBBEL', barn: 'BARN', fisk: 'FISK', kyckling: 'KYCKL', vego: 'VEGO', smash: 'SMASH', kiosk: 'KIOSK', plain: 'ENKEL', flask: 'FLÄSK', 'diner-deluxe': 'DELUXE' };
const shortName = (t) => (SHORT[t.id] || t.name.toUpperCase().split(/\s|-/)[0]).slice(0, 6);
// tre rader till menytavlan: cheeseburgaren, originalet och den billigaste till – med årets pris
export function menuLines(game) {
  const y = game.year, pool = templatesFor(y).filter((t) => t.tier[0] <= 2);
  const first = ['cheese', 'klassiker'].map((id) => pool.find((t) => t.id === id)).filter(Boolean);
  const rest = pool.filter((t) => !first.includes(t)).sort((a, b) => a.fee - b.fee);
  const out = [];
  for (const t of [...first, ...rest]) {
    let b = null;
    for (let i = 0; i < 8 && !b; i++) b = composeBuild(t, y, (a) => [...a].sort((p, q) => p.cost - q.cost)[0]);
    if (!b) continue;
    out.push([shortName(t), priceFor({ template: t.id, items: b.map((p) => ({ cat: p.cat, part: p.id })), year: y })]);
    if (out.length >= 3) break;
  }
  return out;
}
function menuBoard(P, lines, lit, style = 'felt') {
  const x0 = 334, y0 = 34, w = 38, h = 38;
  const chalk = style === 'chalk', digital = style === 'digital', backlit = style === 'lit' || lit;
  const frame = chalk ? 0x6a4a2a : digital ? 0x2a2a30 : backlit ? 0xd8b24a : 0x2a2018;
  P.rect(x0 - 1, y0 - 1, w + 2, h + 2, frame);
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const d = (bayer(x, y) - 0.5) * 0.3 + 0.5;
    P.px(x, y, chalk ? mix(0x1e3a2a, 0x2a4a36, d) : digital ? mix(0x0a0a10, 0x141420, d) : backlit ? mix(0x2a2a30, 0x3c3c48, d) : mix(0x1a1a1e, 0x26262c, d));
  }
  P.hl(x0, y0, w, chalk ? 0x3a5a46 : digital ? 0x2a2a40 : backlit ? 0x4a4a54 : 0x2e2e34);
  const head = chalk ? 0xf4f1ea : digital ? 0x7ee8a0 : backlit ? 0xffd23a : 0xe8b230, ink = chalk ? 0xf4f1ea : digital ? 0xf4f1ea : 0xf4f1ea, price = chalk ? 0xf0dc9a : digital ? 0x7ee8a0 : backlit ? 0xffd23a : 0xd8c8a0;
  text(P, SMALL, 'MENY', x0 + 3, y0 + 3, head);
  burgerSprite(P, x0 + 22, y0 + 1, true);
  P.hl(x0 + 3, y0 + 10, w - 6, head, 0.6);
  lines.slice(0, 3).forEach(([name, pr], i) => {
    const y = y0 + 13 + i * 7, ps = String(pr);
    text(P, SMALL, name, x0 + 3, y, ink); text(P, SMALL, ps, x0 + w - 3 - textW(SMALL, ps), y, price);
  });
  if (backlit) { for (let x = x0 + 2; x < x0 + w - 2; x += 4) P.px(x, y0 + h - 2, 0xffd23a); P.hl(x0 - 1, y0 - 2, w + 2, 0xfff2a0, 0.5); }
  if (digital) { for (let y = y0; y < y0 + h; y += 2) P.hl(x0, y, w, 0x000000, 0.15); P.px(x0 + w - 3, y0 + h - 3, 0x45e06a); }
  if (chalk) { P.hl(x0 - 1, y0 + h + 1, w + 2, 0x8a6a3a); P.rect(x0 + 2, y0 + h - 1, 6, 1, 0xf4f1ea); P.rect(x0 + 10, y0 + h - 1, 4, 1, 0xf0a0c0); }
}
export function paintWallDecor(P, c) {
  const { items, WALL, SHELF: S, menuLines: lines, theme, year } = c, era = eraLook(year || 1990);
  WALL.neonPlate(P);
  // kylhyllan: bröd och muggar upptill, såser, burkar och konserver nedtill
  WALL.shelf(P, items, ['', 'SKAFFERI', 'KYLRUM 2', 'KYLRUM 3', 'RESTAURANGKÖK']);
  bunBag(P, S.x0 + 5, S.boards[0]); bunBag(P, S.x0 + 24, S.boards[0]); cupStack(P, S.x0 + 46, S.boards[0]); can(P, S.x0 + 60, S.boards[0], 0x2c6fb7); can(P, S.x0 + 67, S.boards[0], 0xe0392e);
  bottle(P, S.x0 + 5, S.boards[1], 0xc92a2a); bottle(P, S.x0 + 11, S.boards[1], 0xe8b820); bottle(P, S.x0 + 17, S.boards[1], 0xf0eed0);
  jar(P, S.x0 + 26, S.boards[1], 0x5a8a2a); jar(P, S.x0 + 40, S.boards[1], 0xc03a6a); can(P, S.x0 + 55, S.boards[1], 0xf2c84a); can(P, S.x0 + 63, S.boards[1], 0x8ab84a);
  WALL.ac(P, items);
  menuBoard(P, lines, !!items.menytavla, era.board);
  WALL.clock(P); WALL.tv(P); WALL.extinguisher(P);
  WALL.door(P, theme?.workshopSign || 'KÖKET');
  WALL.socket(P); WALL.radio(P, items);
}

// ---------- Köksbänken bakom disken (rostfritt) ----------
function sodaFountain(P, x, base) {
  P.rect(x, base - 16, 26, 16, 0x9aa0aa); P.hl(x, base - 16, 26, 0xd8dce2); P.vl(x, base - 16, 16, 0xc8ced6); P.vl(x + 25, base - 16, 16, 0x6a7078);
  P.rect(x + 2, base - 14, 22, 5, 0x2c6fb7); P.hl(x + 2, base - 14, 22, 0x7fb0f0); P.rect(x + 4, base - 12, 18, 1, 0xffffff, 0.7);
  [0xc92a2a, 0xf0902a, 0x4aa84a].forEach((col, i) => { const tx = x + 4 + i * 8; P.rect(tx, base - 8, 3, 3, 0x2a2d36); P.px(tx + 1, base - 5, col); P.px(tx + 1, base - 4, col); });
  P.rect(x + 11, base - 6, 4, 4, 0xf4f1ea); P.hl(x + 11, base - 6, 4, 0xffffff);
  P.rect(x + 2, base - 2, 22, 2, 0x5a6068); for (let i = x + 3; i < x + 23; i += 2) P.px(i, base - 2, 0x8a9098);
}
function shakeMachine(P, x, base) {
  P.rect(x + 3, base - 18, 8, 10, 0xc8ced6); P.vl(x + 3, base - 18, 10, 0xf4f6f8); P.vl(x + 10, base - 18, 10, 0x8a9098); P.hl(x + 3, base - 18, 8, 0xe8ecf0);
  P.rect(x, base - 8, 14, 8, 0x8a9098); P.hl(x, base - 8, 14, 0xb8bec8); P.px(x + 2, base - 6, 0xe0392e); P.px(x + 4, base - 6, 0x45e06a);
  P.rect(x + 6, base - 8, 2, 2, 0x2a2d36); P.rect(x + 5, base - 5, 4, 5, 0xf2c8d8); P.hl(x + 5, base - 5, 4, 0xffffff);
}
function trayStack(P, x, base) { for (let i = 0; i < 6; i++) { P.rect(x, base - 2 - i * 2, 16, 2, i % 2 ? 0xc9322a : 0xd93a30); P.hl(x, base - 2 - i * 2, 16, 0xe86a60); } }
function napkins(P, x, base) { P.rect(x, base - 7, 6, 7, 0x8a9098); P.hl(x, base - 7, 6, 0xc8ced6); P.rect(x + 1, base - 9, 4, 3, 0xf4f1ea); P.hl(x + 1, base - 9, 4, 0xffffff); }
function fryer(P, x, base, big) {
  const w = big ? 26 : 18, vats = big ? 3 : 2;
  P.rect(x, base - 14, w, 14, 0xb0b6c0); P.hl(x, base - 14, w, 0xe8ecf0); P.vl(x, base - 14, 14, 0xd8dce2); P.vl(x + w - 1, base - 14, 14, 0x7a8090);
  for (let i = 0; i < vats; i++) { const vx = x + 2 + i * 8; P.rect(vx, base - 12, 7, 5, 0x3a2a18); P.hl(vx, base - 12, 7, 0xd8a040); P.px(vx + 2, base - 12, 0xf0c050); P.rect(vx + 3, base - 16, 1, 4, 0x2a2d36); P.rect(vx + 2, base - 17, 3, 1, 0x2a2d36); }
  P.rect(x + 2, base - 5, w - 4, 3, 0x6a7078); P.px(x + 3, base - 4, 0xe0392e); P.px(x + 5, base - 4, 0x45e06a);
  if (big) P.px(x + w - 4, base - 4, 0xffd23a);
}
function grill(P, x, base, dbl) {
  const w = dbl ? 30 : 24;
  P.rect(x, base - 10, w, 10, 0x2a2b2e); P.hl(x, base - 10, w, 0x4a4c50); P.vl(x + w - 1, base - 10, 10, 0x1a1b1e);
  for (let y = base - 8; y < base - 1; y += 2) P.hl(x + 1, y, w - 2, 0x1a1b1e);
  const patties = dbl ? [x + 3, x + 16] : [x + 8];
  for (const px of patties) { P.rect(px, base - 12, 9, 3, 0x6e3a26); P.hl(px, base - 12, 9, 0x8a4a30); P.px(px + 2, base - 11, 0x4a2016); P.px(px + 6, base - 10, 0x4a2016); P.px(px + 4, base - 14, 0xd8dce0, 0.6); P.px(px + 6, base - 15, 0xd8dce0, 0.4); }
  P.rect(x + w - 5, base - 14, 1, 5, 0x2a2d36); P.rect(x + w - 7, base - 15, 5, 1, 0x8a9098);
}
export function makeBackCabinet(items = {}, year = 1990) {
  const OX = 298, OY = 44, P = new Pix(150, 52, OX, OY);
  const x0 = 300, x1 = 444, top = 76, fr = 84, base = 96;
  for (let y = top; y < fr; y++) for (let x = x0; x < x1; x++) P.px(x, y, mix(0xd8dce2, 0xb0b6c0, (y - top) / 8 + (hash(x, y, 51) - 0.5) * 0.08));
  P.hl(x0, top, x1 - x0, 0xf4f6f8); P.hl(x0, fr - 1, x1 - x0, 0x8a9098);
  for (let y = fr; y < base; y++) for (let x = x0; x < x1; x++) { let c = mix(0x9aa0aa, 0x8a9099, (bayer(x, y) - 0.5) * 0.3 + 0.5); if ((x - x0) % 36 === 0) c = 0x5a6068; else if ((x - x0) % 36 === 1) c = 0xc8ced6; P.px(x, y, c); }
  for (let i = 0; i < 4; i++) P.rect(x0 + 14 + i * 36, fr + 3, 8, 1, 0x3a3f48);
  sodaFountain(P, 304, top);
  if (items.milkshake) shakeMachine(P, 334, top);
  trayStack(P, 352, top);
  napkins(P, 371, top); bottle(P, 379, top, 0xc92a2a); bottle(P, 385, top, 0xe8b820);
  fryer(P, 392, top, !!items.fritos);
  grill(P, items.dubbelgrill ? 412 : 416, top, !!items.dubbelgrill);
  return { img: P.flush(), x: OX, y: OY, sort: base };
}

// ---------- Sakerna på disken ----------
export function counterItems(P, C, year, items = {}) {
  // kassan: mekanisk (till 1979), elektronisk med lysdioder (till 2004), pekskärm (2005–)
  if (year < 1980) {
    P.rect(300, 108, 20, 16, 0x2a2d33); P.hl(300, 108, 20, 0x5a5f6a); P.vl(300, 108, 16, 0x4a4f5a);
    P.rect(303, 103, 14, 6, 0xf4f1ea); P.box(303, 103, 14, 6, 0x8a6a24); P.rect(305, 105, 4, 2, 0x2a2d33); P.rect(311, 105, 4, 2, 0x2a2d33);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) P.px(302 + c * 3, 112 + r * 3, r === 2 && c === 4 ? 0xe0392e : 0xd8dce0);
    P.rect(300, 121, 20, 3, 0x8a6a24); P.hl(300, 121, 20, 0xd8b24a); P.rect(308, 122, 4, 1, 0x2a2d33);
  } else if (year < 2005) {
    P.rect(300, 110, 20, 14, 0xd8d0b8); P.hl(300, 110, 20, 0xf0ece0); P.vl(319, 110, 14, 0xa8a090);
    P.rect(302, 112, 16, 4, 0x1a2a1a); P.hl(303, 113, 9, 0x45e06a); P.px(314, 113, 0x45e06a); P.px(316, 113, 0x45e06a);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) P.px(302 + c * 3, 118 + r * 2, 0x5a5f6a);
    P.rect(300, 122, 20, 2, 0x8a8478);
  } else {
    P.rect(304, 122, 12, 3, 0x2a2d33); P.rect(309, 116, 2, 6, 0x3a3d44);
    P.rect(301, 104, 18, 13, 0x23262b); P.rect(302, 105, 16, 10, 0x3c78d8); P.hl(302, 105, 16, 0x7fb0f0);
    P.rect(304, 107, 7, 1, 0xdfefff); P.rect(304, 109, 10, 1, 0x9fc7f0); P.rect(304, 111, 5, 2, 0x45b964); P.rect(311, 111, 5, 2, 0xe8b230);
  }
  if (year >= 1995) { P.rect(324, 116, 7, 9, 0x2a2d33); P.rect(325, 117, 5, 3, 0x6ad26a); P.hl(325, 121, 5, 0x5a5f6a); P.hl(325, 123, 5, 0x5a5f6a); }
  // en bricka med burgare, pommes och läsk
  traySprite(P, 340, 121, 42);
  burgerSprite(P, 343, 112, true); friesSprite(P, 358, 109); cupSprite(P, 372, 106, 0xf4f1ea, 0xc92a2a);
  // sugrörshållare och servetter
  P.rect(388, 112, 6, 12, 0xd8dce0); P.hl(388, 112, 6, 0xf4f6f8); P.vl(393, 112, 12, 0x8a9098);
  P.rect(389, 108, 1, 4, 0xe0392e); P.rect(391, 107, 1, 5, 0xf4f1ea); P.rect(393, 109, 1, 3, 0x3a78d8);
  napkins(P, 398, 124);
  // bordsställ med menyn
  P.rect(440, 113, 11, 11, 0xf4f1ea); P.vl(450, 113, 11, 0xb8b4aa); P.rect(442, 115, 7, 2, 0xe8b230); P.rect(442, 118, 7, 1, 0x2a2d36); P.rect(442, 120, 5, 1, 0x2a2d36); P.rect(442, 122, 6, 1, 0x2a2d36);
  // ketchup och senap vid luckan
  bottle(P, 488, 124, 0xc92a2a); bottle(P, 495, 124, 0xe8b820);
}
// bricka som väntar på att hämtas vid luckan (ritas på canvas, inte Pix)
export function readyItem(ctx, i, bx, by) {
  const P = { rect: (x, y, w, h, c) => { ctx.fillStyle = css(c); ctx.fillRect(x, y, w, h); }, hl: (x, y, w, c) => { ctx.fillStyle = css(c); ctx.fillRect(x, y, w, 1); }, vl: (x, y, h, c) => { ctx.fillStyle = css(c); ctx.fillRect(x, y, 1, h); }, px: (x, y, c) => { ctx.fillStyle = css(c); ctx.fillRect(x, y, 1, 1); } };
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(bx - 1, by + 23, 22, 2);
  plateRows(P, bx - 2, by + 15, 22);
  burgerSprite(P, bx, by + 8, i % 2 === 0); cupSprite(P, bx + 13, by + 5, i % 3 === 1 ? 0xf2c8d8 : 0xf4f1ea, 0xc92a2a);
}

// ---------- Montrar: läskkyl och dessertdisk (innehållet ritas av floor.js via frame.grid) ----------
// Ramen har samma kontrakt som core/floor-props makeVitrine: { under, over, W, H, HH } plus
// grid = { cols, rows, x0, cellW, top, shelfH, iw, ih } som talar om var produkterna ställs.
export function makeShowcase(def, W, size, look = {}, title = '') {
  if (def.cat === 'dryck') return fridge(W, size, title);
  if (def.cat === 'dessert') return dessertCase(W, size, title);
  return null;
}
function fridge(W, size, title) {
  const small = size === 'small';
  if (small) W = 40;
  const H = small ? 96 : 92, top = 14, shelfH = small ? 24 : 22, rows = 3, cols = small ? 1 : Math.max(2, Math.floor((W - 8) / 34));
  const U = new Pix(W, H), O = new Pix(W, H);
  // kåpa: vit med röd toppband och skylt
  for (let y = 0; y < H - 3; y++) for (let x = 0; x < W; x++) U.px(x, y, mix(0xf0f0ec, 0xd8d8d4, (bayer(x, y) - 0.5) * 0.3 + 0.5));
  U.hl(0, 0, W, 0xffffff); U.vl(0, 0, H - 3, 0xffffff); U.vl(W - 1, 0, H - 3, 0xa8a8a4); U.hl(0, H - 4, W, 0xb8b8b4);
  U.rect(2, 2, W - 4, 10, 0xc9323a); U.hl(2, 2, W - 4, 0xe86a70); U.hl(2, 11, W - 4, 0x7a1a20);
  const t = String(title).toUpperCase(), F = textW(BIG, t) + 8 <= W - 8 ? BIG : SMALL, tw = textW(F, t);
  text(U, F, t.slice(0, small ? 7 : 20), Math.round((W - Math.min(tw, W - 8)) / 2), F === BIG ? 3 : 5, 0xffffff);
  // insidan: kallt ljus och hyllplan
  const ix0 = 3, ix1 = W - 3, iy0 = top, iy1 = top + rows * shelfH;
  for (let y = iy0; y < iy1; y++) for (let x = ix0; x < ix1; x++) U.px(x, y, mix(0xdfeefc, 0x9ec4e6, ((y - iy0) % shelfH) / shelfH * 0.8 + (bayer(x, y) - 0.5) * 0.1));
  for (let i = 1; i <= rows; i++) { const sy = iy0 + i * shelfH; U.hl(ix0, sy - 2, ix1 - ix0, 0xf4f8ff); U.hl(ix0, sy - 1, ix1 - ix0, 0x6a8aa8); U.hl(ix0 + 1, iy0 + (i - 1) * shelfH + 1, ix1 - ix0 - 2, 0xffffff, 0.8); }
  // sockel med kompressorgaller
  U.rect(0, H - 3, W, 3, 0x2a2a30); for (let x = 3; x < W - 3; x += 3) U.px(x, H - 2, 0x4a4a52);
  // glasdörr: reflexer, ram och handtag (ritas över innehållet)
  for (let y = iy0; y < iy1; y++) for (let x = ix0; x < ix1; x++) { const s = (x + y + 5) % 40; O.px(x, y, 0xe8f6ff, s < 3 ? 0.22 : s === 7 ? 0.1 : 0.05); }
  O.box(ix0 - 1, iy0 - 1, ix1 - ix0 + 2, iy1 - iy0 + 2, 0x8a8f9c); O.hl(ix0 - 1, iy0 - 1, ix1 - ix0 + 2, 0xc8ccd6);
  if (!small && cols >= 2) { const mx = Math.round(W / 2); O.vl(mx - 1, iy0, iy1 - iy0, 0x8a8f9c); O.vl(mx, iy0, iy1 - iy0, 0xc8ccd6); O.rect(mx - 4, iy0 + Math.round((iy1 - iy0) / 2) - 6, 2, 12, 0x3a3d44); O.rect(mx + 2, iy0 + Math.round((iy1 - iy0) / 2) - 6, 2, 12, 0x3a3d44); }
  else O.rect(ix1 - 4, iy0 + Math.round((iy1 - iy0) / 2) - 6, 2, 12, 0x3a3d44);
  O.px(W - 5, 7, 0x45e06a);
  const cellW = (ix1 - ix0) / cols;
  return { under: U.flush(), over: O.flush(), W, H, HH: 0, grid: { cols, rows, x0: ix0, cellW, top, shelfH, iw: Math.min(26, cellW - 4), ih: shelfH - 4 }, tower: small };
}
function dessertCase(W, size, title) {
  const small = size === 'small';
  if (small) W = 40;
  const top = 6, shelfH = small ? 26 : 28, rows = small ? 3 : 2, cols = small ? 1 : Math.max(2, Math.floor((W - 8) / 40));
  const H = top + rows * shelfH + 24;
  const U = new Pix(W, H), O = new Pix(W, H);
  // glasmontern: ljus botten med vita hyllplan, rosa sockel med skylt
  const ix0 = 3, ix1 = W - 3, iy0 = top, iy1 = top + rows * shelfH;
  for (let y = iy0; y < iy1; y++) for (let x = ix0; x < ix1; x++) U.px(x, y, mix(0xfff6f0, 0xf0d8dc, ((y - iy0) % shelfH) / shelfH * 0.7 + (bayer(x, y) - 0.5) * 0.1));
  for (let i = 1; i <= rows; i++) { const sy = iy0 + i * shelfH; U.hl(ix0, sy - 2, ix1 - ix0, 0xffffff); U.hl(ix0, sy - 1, ix1 - ix0, 0xc8b0b8); }
  U.hl(ix0, iy0, ix1 - ix0, 0xfff0a0, 0.8);
  const b0 = iy1 + 1;
  for (let y = b0; y < H - 3; y++) for (let x = 0; x < W; x++) U.px(x, y, mix(0xe86a90, 0xc94a70, (y - b0) / (H - 3 - b0) + (bayer(x, y) - 0.5) * 0.12));
  U.hl(0, b0, W, 0xf8a8c0); U.hl(0, b0 + 1, W, 0xffffff, 0.5);
  U.rect(0, H - 3, W, 3, 0x2a2a30);
  const t = String(title).toUpperCase(), F = textW(BIG, t) + 12 <= W - 6 ? BIG : SMALL, tw = textW(F, t), pw = Math.min(W - 6, tw + 10), px0 = Math.round((W - pw) / 2), py0 = b0 + 5;
  U.rect(px0, py0, pw, F === BIG ? 11 : 9, 0xfff4f8); U.box(px0, py0, pw, F === BIG ? 11 : 9, 0x8a2a48);
  text(U, F, t.slice(0, small ? 7 : 20), Math.round((W - Math.min(tw, pw - 4)) / 2), py0 + 2, 0x8a2a48);
  // välvt glas
  for (let y = 0; y < iy1 + 1; y++) for (let x = 1; x < W - 1; x++) { const s = (x + y + 3) % 46; O.px(x, y, 0xe8f6ff, s < 3 ? 0.2 : s === 8 || s === 9 ? 0.1 : 0.06); }
  O.hl(1, 0, W - 2, 0xffffff, 0.7); O.hl(1, 1, W - 2, 0xffffff, 0.25); O.vl(0, 0, iy1 + 1, 0xd9c088); O.vl(W - 1, 0, iy1 + 1, 0x8a7a48); O.hl(0, iy1, W, 0xd9c088);
  const cellW = (ix1 - ix0) / cols;
  return { under: U.flush(), over: O.flush(), W, H, HH: 0, grid: { cols, rows, x0: ix0, cellW, top, shelfH, iw: Math.min(34, cellW - 4), ih: shelfH - 6 }, tower: small };
}

// ---------- Automater och möbler på platserna ----------
export function makeUnit(kind, W, year) {
  if (kind === 'jukebox') return jukebox();
  if (kind === 'sasbar') return sauceBar();
  if (kind === 'lekhorna') return playCorner(W);
  return null;   // kaffe och godis: motorns automater duger
}
function jukebox() {
  const W = 34, H = 58, P = new Pix(W, H);
  // rundad topp i trä med kromlister, färgade ljusbågar, skivfönster, högtalargaller
  P.ell(17, 14, 15, 13, 0x8a4a2a, 1, 1); P.rect(2, 14, W - 4, H - 18, 0x8a4a2a);
  P.ell(17, 14, 13, 11, 0xd8b24a, 1, 1); P.ell(17, 14, 11, 9, 0xe23b5a, 1, 1); P.ell(17, 14, 9, 7, 0x3a78d8, 1, 1); P.ell(17, 14, 7, 5, 0x45b964, 1, 1);
  P.rect(8, 12, 18, 12, 0x17181c); P.box(8, 12, 18, 12, 0xd8b24a);
  P.ell(17, 18, 5, 4, 0x2a2d33, 1, 1); P.ell(17, 18, 2, 2, 0xe23b5a, 1, 1); P.px(19, 15, 0xffffff);
  P.rect(4, 26, W - 8, 8, 0xf4e0a0); P.hl(4, 26, W - 8, 0xffffff); for (let i = 0; i < 8; i++) P.rect(6 + i * 3, 28, 2, 4, i % 2 ? 0x2a2d33 : 0xc9323a);
  P.rect(4, 36, W - 8, 16, 0x2a1a10); for (let y = 38; y < 50; y += 2) for (let x = 6; x < W - 6; x += 2) P.px(x, y, 0x5a3a20);
  P.vl(2, 14, H - 18, 0xd8b24a); P.vl(W - 3, 14, H - 18, 0x8a6a24); P.hl(2, H - 5, W - 4, 0xd8b24a);
  P.rect(3, H - 4, W - 6, 2, 0x0e0d12);
  P.px(6, 20, 0xffd23a); P.px(W - 7, 20, 0xffd23a); P.px(6, 44, 0xe23b5a); P.px(W - 7, 44, 0x45b964);
  return P.flush();
}
function sauceBar() {
  const W = 34, H = 44, P = new Pix(W, H);
  P.rect(2, 20, W - 4, 20, 0xb8bec8); P.hl(2, 20, W - 4, 0xe8ecf0); P.vl(W - 3, 20, 20, 0x7a8090); P.rect(3, H - 4, W - 6, 2, 0x0e0d12);
  P.rect(4, 22, W - 8, 6, 0xf4f1ea); text(P, SMALL, 'SÅS', 9, 23, 0xc9323a);
  [[0xc92a2a, 6], [0xe8b820, 14], [0xf0c48a, 22]].forEach(([col, x]) => {
    P.rect(x, 8, 7, 12, col); P.vl(x, 8, 12, mix(col, 0xffffff, 0.4)); P.vl(x + 6, 8, 12, mul(col, 0.7)); P.hl(x, 19, 7, mul(col, 0.6));
    P.rect(x + 2, 4, 3, 4, 0x2a2d36); P.rect(x + 3, 2, 1, 2, 0x2a2d36); P.rect(x + 1, 1, 5, 2, 0x8a8f9c); P.rect(x + 1, 12, 5, 3, 0xf4f1ea);
  });
  P.rect(6, 30, 6, 8, 0xf4f1ea); P.rect(14, 32, 6, 6, 0xf4f1ea); P.rect(22, 31, 6, 7, 0xf4f1ea);
  return P.flush();
}
function playCorner(W) {
  const H = 44, P = new Pix(W, H);
  // bollhav med kant, en liten rutschkana och en skylt
  P.rect(2, 12, W - 4, 28, 0x2c6fb7); P.hl(2, 12, W - 4, 0x7fb0f0); P.vl(W - 3, 12, 28, 0x1a4a8a);
  const cols = [0xe23b5a, 0xffd23a, 0x45b964, 0x3a78d8, 0xff9a4d];
  for (let i = 0; i < Math.floor(W * 1.2); i++) { const x = 5 + Math.floor(hash(i, 1, 71) * (W - 12)), y = 15 + Math.floor(hash(i, 2, 72) * 20); const c = cols[i % cols.length]; P.rect(x, y, 3, 3, c); P.px(x, y, mix(c, 0xffffff, 0.5)); }
  P.rect(W - 16, 2, 4, 14, 0xd8dce0); P.rect(W - 13, 4, 10, 2, 0xe23b5a); for (let i = 0; i < 8; i++) P.px(W - 12 + i, 6 + i, 0xe23b5a);
  P.rect(4, 2, 22, 8, 0xffd23a); P.box(4, 2, 22, 8, 0x8a6a24); text(P, SMALL, 'LEK', 9, 4, 0x2a2d36);
  P.rect(3, H - 4, W - 6, 2, 0x0e0d12);
  return P.flush();
}

// ---------- Epoken (era.js) ----------
export { ERA_LOOK, eraLook, themeFor };

// ---------- Matbord med stolar eller sittbås, och en lampa över bordet ----------
function lamp(P, cx, y, kind) {
  P.vl(cx, y, 10, 0x3a3a40);
  if (kind === 'cone') { for (let i = 0; i < 6; i++) P.hl(cx - i, y + 10 + i, i * 2 + 1, i % 2 ? 0xf4ecd0 : 0xfff6e0); P.hl(cx - 5, y + 16, 11, 0xc8a860); P.hl(cx - 3, y + 17, 7, 0xfff2c0, 0.7); }
  else if (kind === 'globe' || kind === 'orange') { const c = kind === 'orange' ? 0xf08a2a : 0xf4f1ea; P.ell(cx, y + 14, 5, 5, c, 1, 1); P.px(cx - 2, y + 12, 0xffffff); P.hl(cx - 3, y + 19, 7, 0xfff2c0, 0.5); }
  else if (kind === 'tube') { P.rect(cx - 12, y + 8, 24, 3, 0xdfe6ec); P.hl(cx - 12, y + 8, 24, 0xffffff); P.hl(cx - 10, y + 11, 20, 0xfff6e0, 0.6); }
  else if (kind === 'pendant') { P.rect(cx - 5, y + 10, 11, 6, 0x2a2d36); P.hl(cx - 5, y + 10, 11, 0x5a5f6a); P.hl(cx - 4, y + 16, 9, 0xfff2c0); }
  else if (kind === 'edison') { P.rect(cx - 1, y + 10, 3, 3, 0x8a8f9c); P.ell(cx, y + 16, 3, 4, 0xffc860, 1, 1); P.px(cx, y + 15, 0xfff4c0); P.px(cx, y + 17, 0xf0a030); }
  else { P.rect(cx - 8, y + 10, 17, 2, 0xf4f1ea); P.hl(cx - 8, y + 12, 17, 0xc8ffe0, 0.8); P.hl(cx - 6, y + 13, 13, 0xe0fff0, 0.4); }
}
export function makeTable(t, year, style = 'glass', items = {}) {
  const e = eraLook(year), W = t.x1 - t.x0, booth = t.booth || items.matta;
  // stolar/bås bakom bordet (ritas bakom den som sitter)
  const B = new Pix(W + 8, 30, t.x0 - 4, t.base - 36);
  if (booth) {
    B.rect(t.x0 - 4, t.base - 34, W + 8, 14, e.chair); B.hl(t.x0 - 4, t.base - 34, W + 8, e.chairHi); B.vl(t.x0 - 4, t.base - 34, 14, e.chairHi);
    for (let x = t.x0; x < t.x1 + 2; x += 8) B.vl(x, t.base - 33, 12, mul(e.chair, 0.8));
    B.rect(t.x0 - 4, t.base - 21, W + 8, 3, mul(e.chair, 0.7));
  } else {
    for (const cx of [t.x0 + 11, t.x0 + 33]) {
      B.rect(cx - 7, t.base - 34, 14, 12, e.chair); B.hl(cx - 7, t.base - 34, 14, e.chairHi); B.vl(cx - 7, t.base - 34, 12, e.chairHi);
      if (e.name === 'diner' || e.name === 'eighties') { B.hl(cx - 7, t.base - 26, 14, 0xdfe6ec); }
      if (e.name === 'industrial') { B.rect(cx - 6, t.base - 33, 12, 10, 0x1a1a1e); B.hl(cx - 6, t.base - 28, 12, 0x3a3a40); }
      B.rect(cx - 7, t.base - 22, 14, 2, mul(e.chair, 0.7));
    }
  }
  const chairs = { img: B.flush(), x: t.x0 - 4, y: t.base - 36, sort: t.base - 36 };
  // bordet: skiva, kant, ben och lampa
  const P = new Pix(W + 8, 76, t.x0 - 4, t.base - 76);
  lamp(P, t.x0 + W / 2, t.base - 76, e.lamp);
  const top = t.base - 18;
  for (let y = top; y < top + 12; y++) for (let x = t.x0; x < t.x1; x++) {
    let c = mix(e.table, mix(e.table, 0xffffff, 0.2), (y - top) / 12 + (bayer(x, y) - 0.5) * 0.1);
    if (e.name === 'seventies' || e.name === 'fresh' || e.name === 'industrial' || e.name === 'nordic') c = mul(c, 0.94 + hash(x >> 2, y, 91) * 0.1);
    if (e.name === 'eighties' && ((x + y) & 3) === 0) c = mix(c, 0x2a2a30, 0.35);
    P.px(x, y, c);
  }
  P.hl(t.x0, top, W, mix(e.table, 0xffffff, 0.45));
  P.rect(t.x0, top + 12, W, 3, e.edge); P.hl(t.x0, top + 14, W, mul(e.edge, 0.7));
  if (e.name === 'diner') { P.hl(t.x0, top + 12, W, 0xdfe6ec); P.hl(t.x0, top + 13, W, 0x8a8f9c); }
  // pelarfot (diner/kedja) eller fyra ben
  if (e.name === 'diner' || e.name === 'chain' || e.name === 'eighties') { P.rect(t.x0 + W / 2 - 3, top + 15, 6, 8, 0x8a8f9c); P.vl(t.x0 + W / 2 - 3, top + 15, 8, 0xc8ccd6); P.rect(t.x0 + W / 2 - 8, top + 22, 16, 2, 0x5a5f6a); }
  else { for (const lx of [t.x0 + 3, t.x1 - 6]) { P.rect(lx, top + 15, 3, 9, mul(e.edge, 0.8)); P.vl(lx, top + 15, 9, e.edge); } }
  // ketchup, senap och servetter mitt på bordet
  P.rect(t.x0 + 20, top + 2, 3, 6, 0xc92a2a); P.rect(t.x0 + 21, top, 1, 2, 0x8a1a14); P.rect(t.x0 + 24, top + 3, 3, 5, 0xe8b820); P.rect(t.x0 + 25, top + 1, 1, 2, 0x8a6a10);
  P.rect(t.x0 + 16, top + 5, 3, 4, 0xf4f1ea); P.hl(t.x0 + 16, top + 5, 3, 0xffffff);
  return [chairs, { img: P.flush(), x: t.x0 - 4, y: t.base - 76, sort: t.base }];
}

// tallrik (oval, vit med kant) ritad med rektangelrader – på canvas (ctx) eller Pix (P)
function plateRows(P, x, y, w) {
  const h = Math.max(4, Math.round(w * 0.38)), rows = [];
  for (let j = 0; j < h; j++) { const t = (j + 0.5) / h * 2 - 1, half = Math.round(w / 2 * Math.sqrt(Math.max(0, 1 - t * t))); rows.push([x + Math.round(w / 2) - half, y + j, half * 2]); }
  for (const [rx, ry, rw] of rows) P.hl(rx, ry + 1, rw, 0xc8c4bc);   // skugga/kant under
  for (const [rx, ry, rw] of rows) P.hl(rx, ry, rw, 0xf6f3ec);
  P.hl(rows[0][0], rows[0][1], rows[0][2], 0xffffff);
}
// när i tuggcykeln gästen är: bite = burgaren lyfts mot munnen, munch = käkarna går
export function eatPhase(t, seed = 0) {
  const k = (t * 0.9 + seed * 0.37) % 3.2;
  return { bite: k < 0.6, munch: k >= 0.6 && k < 1.7 && Math.floor(t * 6) % 2 === 0 };
}
// tallriken på bordet framför den som äter: burgaren blir mindre för varje tugga, lyfts mot munnen
// när gästen tar en tugga, muggen står kvar
export function eatSprite(ctx, x, y, stage, seed = 0, t = 0, chew = null) {
  const P = { rect: (a, b, w, h, c) => { ctx.fillStyle = css(c); ctx.fillRect(a, b, w, h); }, hl: (a, b, w, c) => { ctx.fillStyle = css(c); ctx.fillRect(a, b, w, 1); }, vl: (a, b, h, c) => { ctx.fillStyle = css(c); ctx.fillRect(a, b, 1, h); }, px: (a, b, c) => { ctx.fillStyle = css(c); ctx.fillRect(a, b, 1, 1); } };
  plateRows(P, x - 12, y - 6, 24);
  const cup = seed % 3 === 1 ? 0xf2c8d8 : seed % 3 === 2 ? 0xc92a2a : 0xf4f1ea;
  cupSprite(P, x + 6, y - 17, cup, 0xc8ccd0);
  const lift = chew?.bite && stage < 0.9 ? 16 : 0;   // tuggan: burgaren vid munnen
  if (stage < 0.3) burgerSprite(P, x - 10, y - 12 - lift, seed % 2 === 0);
  else if (stage < 0.6) { // halväten: en bit borta till höger
    ctx.save(); ctx.beginPath(); ctx.rect(x - 10, y - 13 - lift, 8, 10); ctx.clip(); burgerSprite(P, x - 10, y - 12 - lift, seed % 2 === 0); ctx.restore();
    P.rect(x - 3, y - 10 - lift, 2, 6, 0xf0dcb0);
  } else if (stage < 0.9) { P.rect(x - 9, y - 6 - lift, 5, 3, 0xd9a55d); P.px(x - 6, y - 7 - lift, 0x6e3a26); P.px(x - 4, y - 5 - lift, 0x7fc44a); }
  else { P.px(x - 8, y - 5, 0xd9a55d); P.px(x - 5, y - 6, 0xd9a55d); P.rect(x - 9, y - 9, 4, 3, 0xf4f1ea); }
  if (stage > 0.15 && stage < 0.95) { P.rect(x - 2, y - 9, 6, 6, 0xf4f1ea); P.hl(x - 2, y - 9, 6, 0xffffff); }   // servett
}
// gästen bär tallriken (med burgaren) från luckan till bordet
export function carrySprite(ctx, x, y, dir = 'down', seed = 0) {
  const P = { rect: (a, b, w, h, c) => { ctx.fillStyle = css(c); ctx.fillRect(a, b, w, h); }, hl: (a, b, w, c) => { ctx.fillStyle = css(c); ctx.fillRect(a, b, w, 1); }, vl: (a, b, h, c) => { ctx.fillStyle = css(c); ctx.fillRect(a, b, 1, h); }, px: (a, b, c) => { ctx.fillStyle = css(c); ctx.fillRect(a, b, 1, 1); } };
  const dx = dir === 'left' ? -7 : dir === 'right' ? 7 : 0, dy = dir === 'up' ? -4 : 0;
  if (dir === 'up') return;   // ryggen mot oss – tallriken skyms
  plateRows(P, x + dx - 8, y + dy - 16, 16);
  burgerSprite(P, x + dx - 6, y + dy - 24, seed % 2 === 0);
}
