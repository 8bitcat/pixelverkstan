// Hamburgerbarens inredning på butiksgolvet: väggen bakom disken (kylhylla, menytavla, köksdörr),
// den rostfria köksbänken (läskmaskin, milkshakemaskin, fritös, grill), sakerna på disken
// (kassa, bricka med burgare, sugrör), brickor som väntar vid luckan, läskkyl och dessertdisk som
// montrar samt jukebox, såsbar och lekhörna. Motorn (core/floor*.js) anropar det här via
// shop.floorArt; datorbutiken har ingen sådan och ritas som förut.
import { Pix, mix, mul, hash, bayer, hex, SMALL, BIG, textW, text, css, ctxText } from '../../core/floor-pix.js';
import { templatesFor, composeBuild, priceFor } from './orders.js';
import { ERA_LOOK, eraLook, themeFor } from './era.js';
import { DB } from './menu.js';

export const noShelf = true;     // ingen lagerhylla på väggen – råvarorna ligger i kyldisken på disken (renderDisplay)
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
// väggen där lagerhyllan satt: fläktkåpa i rostfritt, kakel som stänkskydd och bongskenan med dagens bongar
function kitchenWall(P, x0, y0, w, h, items = {}) {
  for (let y = y0 + 16; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { const g = (x - x0) % 8 === 0 || (y - y0) % 8 === 0; P.px(x, y, g ? 0xc8c4bc : mix(0xf4f1ea, 0xe4e0d8, (bayer(x, y) - 0.5) * 0.3 + 0.5)); }
  // fläktkåpa med galler, lysrör under och fläktknapp
  P.rect(x0, y0, w, 14, 0xb0b6c0); P.hl(x0, y0, w, 0xe8ecf0); P.hl(x0, y0 + 13, w, 0x6a7078); P.vl(x0, y0, 14, 0xd8dce2); P.vl(x0 + w - 1, y0, 14, 0x7a8090);
  for (let x = x0 + 4; x < x0 + w - 4; x += 3) P.px(x, y0 + 11, 0x4a5058);
  P.rect(x0 + 6, y0 + 14, w - 12, 2, 0xfff4c0); P.hl(x0 + 6, y0 + 16, w - 12, 0xfff4c0, 0.35);
  P.rect(x0 + w - 12, y0 + 3, 6, 4, 0x2a2d36); P.px(x0 + w - 10, y0 + 4, 0x45e06a);
  // bongskenan: fler bongar med större kök
  P.rect(x0 + 2, y0 + 24, w - 4, 2, 0x8a9098); P.hl(x0 + 2, y0 + 24, w - 4, 0xc8ced6);
  const n = items.lager4 ? 5 : items.lager3 ? 4 : items.lager2 ? 3 : 2;
  for (let i = 0; i < n; i++) {
    const bx = x0 + 5 + i * 14;
    P.rect(bx, y0 + 26, 11, 13, 0xfdfbf4); P.vl(bx + 10, y0 + 26, 13, 0xd8d4cc); P.hl(bx, y0 + 38, 11, 0xd8d4cc); P.px(bx + 5, y0 + 25, 0x2a2d36);
    for (let r = 0; r < 4; r++) P.rect(bx + 2, y0 + 29 + r * 2, 3 + ((i * 7 + r * 3) % 5), 1, r === 0 ? 0xe23b5a : 0x5a5f6a);
  }
}
// kyldisken på disken (vänstra ytan, ut mot kunderna): rostfri ovansida där tallrikarna ställs fram (luckan),
// glasfront med kallt ljus och skålarna med råvarorna (renderDisplay ritar dem efter lagret), vit sockel med
// termometer och UTLÄMNING-skylt. Kunden hämtar tallriken ovanpå disken och betalar där.
export const DISPLAY = { x0: 288, x1: 398, top: 105, glassTop: 113, glassBot: 139, base: 150 };
function coldDisplay(P) {
  const { x0, x1, top, glassTop, glassBot, base } = DISPLAY, w = x1 - x0;
  // ovansidan (rostfri) med perspektiv
  for (let y = top; y < glassTop - 1; y++) for (let x = x0; x < x1; x++) P.px(x, y, mix(0xd8dce2, 0xeef0f4, (y - top) / (glassTop - top) + (bayer(x, y) - 0.5) * 0.15));
  P.hl(x0, top, w, 0xf8fafc); P.hl(x0, glassTop - 2, w, 0x9aa0aa); P.vl(x0, top, glassTop - top, 0xf4f6f8); P.vl(x1 - 1, top, glassTop - top, 0x9aa0aa);
  // glasram och insidan (kallt ljus, hyllplan mellan raderna)
  P.rect(x0, glassTop - 1, w, glassBot - glassTop + 2, 0x2a2a30);
  for (let y = glassTop; y < glassBot; y++) for (let x = x0 + 1; x < x1 - 1; x++) P.px(x, y, mix(0xdfeefc, 0xb8d4ec, (y - glassTop) / (glassBot - glassTop) + (bayer(x, y) - 0.5) * 0.1));
  P.hl(x0 + 1, glassTop, w - 2, 0xffffff, 0.9);
  P.hl(x0 + 1, glassTop + 12, w - 2, 0xc8ced6); P.hl(x0 + 1, glassBot - 1, w - 2, 0xc8ced6);
  // sockel med kompressorgaller, termometer och skylt
  for (let y = glassBot + 1; y < base; y++) for (let x = x0; x < x1; x++) P.px(x, y, mix(0xf0f0ec, 0xd8d8d4, (bayer(x, y) - 0.5) * 0.3 + 0.5));
  P.hl(x0, glassBot + 1, w, 0xffffff); P.rect(x0, base - 2, w, 2, 0x2a2a30); for (let x = x0 + 3; x < x1 - 3; x += 3) P.px(x, base - 1, 0x4a4a52);
  P.rect(x0 + 3, glassBot + 3, 12, 5, 0x1a1a1e); text(P, SMALL, '-2', x0 + 5, glassBot + 4, 0xe23b5a);
  const txt = 'UTLÄMNING', tw = textW(SMALL, txt) + 6, sx = Math.round((x0 + x1) / 2 - tw / 2) + 6;
  P.rect(sx, glassBot + 2, tw, 7, 0x16181f); P.box(sx, glassBot + 2, tw, 7, 0x3a3f4d); text(P, SMALL, txt, sx + 3, glassBot + 3, 0xfff6e0);
}
// skålarna i kyldisken: en per råvara i lagret (bröd, biffar, ost, grönt, extra, såser), fyllda i råvarans
// färg – högen växer med antalet. Ritas om när lagret ändras (floor.refreshStock → floor.display, ritas i drawCounter
// ovanpå diskbilden, innanför glaset).
const DISPLAY_CATS = ['brod', 'biff', 'ost', 'gront', 'extra', 'sas'];
export function renderDisplay(floor) {
  const g = floor.game;
  const W = DISPLAY.x1 - DISPLAY.x0 - 2, H = DISPLAY.glassBot - DISPLAY.glassTop, c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d'), P = ctxPix(ctx);
  const parts = floor.owned().filter((p) => DISPLAY_CATS.includes(p.cat)).map((p) => ({ p, n: g.stockFree(p.id) })).filter((x) => x.n > 0)
    .sort((a, b) => DISPLAY_CATS.indexOf(a.p.cat) - DISPLAY_CATS.indexOf(b.p.cat) || b.n - a.n).slice(0, 10);
  parts.forEach(({ p, n }, i) => {
    const col = i % 5, row = Math.floor(i / 5), bx = 2 + col * 21, by = row * 13;
    // skålen (vit, rund) med kant
    P.rect(bx + 1, by + 7, 17, 5, 0xf6f3ec); P.hl(bx + 2, by + 6, 15, 0xffffff); P.hl(bx + 1, by + 11, 17, 0xc8c4bc); P.px(bx, by + 8, 0xf6f3ec); P.px(bx, by + 11, 0xc8c4bc); P.px(bx + 18, by + 8, 0xf6f3ec); P.px(bx + 18, by + 11, 0xc8c4bc);
    // högen: fler bitar ju mer som finns (1–4 rader)
    const L = p.look || {}, base = hex(L.color, 0xc8a060), rows = Math.min(4, 1 + Math.floor(Math.log2(Math.max(1, n))));
    const shape = L.shape;
    for (let r = 0; r < rows; r++) {
      const y = by + 8 - r * 2, w = 13 - r * 2, x = bx + 3 + r;
      for (let k = 0; k < w; k++) {
        const jitter = hash(k * 7 + r * 13, p.id.length + r, 5);
        const cc = shape === 'patty' ? (jitter > 0.8 ? hex(L.dark, 0x4a2016) : base) : shape === 'leaf' ? (jitter > 0.7 ? hex(L.edge, base) : base) : shape === 'slice' ? (k % 3 === 1 ? hex(L.inner, base) : base) : shape === 'bun' ? (jitter > 0.85 ? hex(L.crust, base) : base) : shape === 'sauce' ? base : jitter > 0.8 ? mix(base, 0xffffff, 0.35) : base;
        if (shape === 'sauce' || shape === 'cheese' || shape === 'drizzle') { if (r === 0 || k % 2 === 0) P.px(x + k, y, cc); }
        else if (k % 2 === r % 2 || jitter > 0.3) P.px(x + k, y, cc);
      }
    }
    // antal
    const label = String(n), tw = textW(SMALL, label) + 2;
    ctx.fillStyle = '#17151a'; ctx.fillRect(bx + 19 - tw, by + 8, tw, 6); ctxText(ctx, SMALL, label, bx + 20 - tw, by + 8, '#f4efe2');
  });
  // glasets reflexer ovanpå
  for (let y = 0; y < H; y++) for (const o of [3, 43, 83]) { P.px(o + y, y, 0xffffff, 0.28); P.px(o + y + 1, y, 0xffffff, 0.14); }
  return { img: c, x: DISPLAY.x0 + 1, y: DISPLAY.glassTop };
}
export function paintWallDecor(P, c) {
  const { items, WALL, SHELF: S, menuLines: lines, theme, year } = c, era = eraLook(year || 1990);
  WALL.neonPlate(P);
  // köksväggen där lagerhyllan satt: fläktkåpa, kakel och bongskena (kyldisken står på disken – counterItems)
  kitchenWall(P, S.x0 - 3, 22, S.x1 - S.x0 + 6, 60, items);
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
  // vänstra ytan: kyldisken med luckan (utlämning) ovanpå
  coldDisplay(P);
  // högra ytan: kassan – mekanisk (till 1979), elektronisk med lysdioder (till 2004), pekskärm (2005–)
  const kx = 436;
  if (year < 1980) {
    P.rect(kx, 108, 20, 16, 0x2a2d33); P.hl(kx, 108, 20, 0x5a5f6a); P.vl(kx, 108, 16, 0x4a4f5a);
    P.rect(kx + 3, 103, 14, 6, 0xf4f1ea); P.box(kx + 3, 103, 14, 6, 0x8a6a24); P.rect(kx + 5, 105, 4, 2, 0x2a2d33); P.rect(kx + 11, 105, 4, 2, 0x2a2d33);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) P.px(kx + 2 + c * 3, 112 + r * 3, r === 2 && c === 4 ? 0xe0392e : 0xd8dce0);
    P.rect(kx, 121, 20, 3, 0x8a6a24); P.hl(kx, 121, 20, 0xd8b24a); P.rect(kx + 8, 122, 4, 1, 0x2a2d33);
  } else if (year < 2005) {
    P.rect(kx, 110, 20, 14, 0xd8d0b8); P.hl(kx, 110, 20, 0xf0ece0); P.vl(kx + 19, 110, 14, 0xa8a090);
    P.rect(kx + 2, 112, 16, 4, 0x1a2a1a); P.hl(kx + 3, 113, 9, 0x45e06a); P.px(kx + 14, 113, 0x45e06a); P.px(kx + 16, 113, 0x45e06a);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) P.px(kx + 2 + c * 3, 118 + r * 2, 0x5a5f6a);
    P.rect(kx, 122, 20, 2, 0x8a8478);
  } else {
    P.rect(kx + 4, 122, 12, 3, 0x2a2d33); P.rect(kx + 9, 116, 2, 6, 0x3a3d44);
    P.rect(kx + 1, 104, 18, 13, 0x23262b); P.rect(kx + 2, 105, 16, 10, 0x3c78d8); P.hl(kx + 2, 105, 16, 0x7fb0f0);
    P.rect(kx + 4, 107, 7, 1, 0xdfefff); P.rect(kx + 4, 109, 10, 1, 0x9fc7f0); P.rect(kx + 4, 111, 5, 2, 0x45b964); P.rect(kx + 11, 111, 5, 2, 0xe8b230);
  }
  if (year >= 1995) { P.rect(kx + 24, 116, 7, 9, 0x2a2d33); P.rect(kx + 25, 117, 5, 3, 0x6ad26a); P.hl(kx + 25, 121, 5, 0x5a5f6a); P.hl(kx + 25, 123, 5, 0x5a5f6a); }
  // bordsställ med menyn vid kassan
  P.rect(420, 113, 11, 11, 0xf4f1ea); P.vl(430, 113, 11, 0xb8b4aa); P.rect(422, 115, 7, 2, 0xe8b230); P.rect(422, 118, 7, 1, 0x2a2d36); P.rect(422, 120, 5, 1, 0x2a2d36); P.rect(422, 122, 6, 1, 0x2a2d36);
  // sugrörshållare och servetter
  P.rect(474, 112, 6, 12, 0xd8dce0); P.hl(474, 112, 6, 0xf4f6f8); P.vl(479, 112, 12, 0x8a9098);
  P.rect(475, 108, 1, 4, 0xe0392e); P.rect(477, 107, 1, 5, 0xf4f1ea); P.rect(479, 109, 1, 3, 0x3a78d8);
  napkins(P, 484, 124);
  // ketchup och senap
  bottle(P, 494, 124, 0xc92a2a); bottle(P, 501, 124, 0xe8b820);
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
const ctxPix = (ctx) => ({ rect: (a, b, w, h, c) => { ctx.fillStyle = css(c); ctx.fillRect(a, b, w, h); }, hl: (a, b, w, c) => { ctx.fillStyle = css(c); ctx.fillRect(a, b, w, 1); }, vl: (a, b, h, c) => { ctx.fillStyle = css(c); ctx.fillRect(a, b, 1, h); }, px: (a, b, c) => { ctx.fillStyle = css(c); ctx.fillRect(a, b, 1, 1); } });
const colOf = (id, fb) => { const p = DB.part[id]; return hex(p?.look?.color || fb, fb); };
// höjd i pixlar per lager i den lilla burgaren
const layerPx = (p) => { const L = p?.look || {}; return L.shape === 'bun' ? 2 : L.shape === 'patty' ? 2 : L.shape === 'cheese' || L.shape === 'sauce' || L.shape === 'drizzle' ? 1 : 1; };
// den byggda måltiden i litet format: burgaren lager för lager (samma färger som i köket), pommes,
// mugg i dryckens färg och efterrätt. eaten 0..1 = hur mycket som är uppätet (burgaren krymper,
// pommesen blir färre, sist bara smulor); x,y = tallrikens mitt / underkant
export function mealSprite(P, x, y, meal, eaten = 0, plate = true) {
  if (plate) plateRows(P, x - 12, y - 6, 24);
  const layers = (meal?.layers || []).map((id) => DB.part[id]).filter(Boolean);
  const drink = meal?.dryck ? DB.part[meal.dryck] : null;
  if (drink) { const L = drink.look || {}; cupSprite(P, x + 6, y - 17, hex(L.cup || '#f4f1ea', 0xf4f1ea), L.can || L.bottle ? hex(L.color, 0x3a1a12) : 0xc8ccd0); }
  if (eaten >= 0.95) { P.px(x - 8, y - 5, 0xd9a55d); P.px(x - 5, y - 6, 0xd9a55d); P.rect(x - 9, y - 9, 4, 3, 0xf4f1ea); return; }
  // burgaren: full bredd 12, tuggas från höger
  const w = Math.max(3, Math.round(12 * (1 - eaten * 0.8)));
  let yy = y - 4, bx = x - 10;
  const n = layers.length;
  layers.forEach((p, i) => {
    const L = p.look || {}, h = layerPx(p), top = i === n - 1 && L.shape === 'bun';
    const c = hex(L.color, 0xc8a060);
    if (top) { P.rect(bx + 1, yy - h, w - 2, h, c); P.hl(bx + 2, yy - h - 1, Math.max(1, w - 4), c); if (L.sesame) { P.px(bx + 3, yy - h - 1, 0xf6ecd0); P.px(bx + 6, yy - h, 0xf6ecd0); } }
    else if (L.shape === 'leaf') { P.hl(bx - 1, yy - h, w + 2, c); P.px(bx + 2, yy, hex(L.edge, c)); }
    else if (L.shape === 'cheese' && !L.round) { P.hl(bx, yy - h, w + 1, c); }
    else P.rect(bx + (L.shape === 'bun' ? 1 : 0), yy - h, w - (L.shape === 'bun' ? 2 : 0), h, c);
    if (L.shape === 'patty') P.px(bx + 2, yy - 1, hex(L.dark, 0x4a2016));
    yy -= h;
  });
  if (eaten > 0.05 && w > 3) { P.rect(bx + w - 2, y - 8, 2, 4, 0xf0dcb0); }   // tuggan: ljust inkråm i kanten
  // pommes: färre stavar ju mer som ätits
  if (meal?.pommes) {
    const side = DB.part[meal.pommes], fried = side?.look?.shape === 'fries';
    const left = Math.max(0, Math.round(5 * (1 - eaten)));
    if (fried) { for (let i = 0; i < left; i++) P.rect(x + 3 + i * 2, y - 10 + (i % 2), 1, 5, 0xf0c050); P.rect(x + 2, y - 6, 9, 4, 0xc9322a); P.hl(x + 2, y - 6, 9, 0xe04a3a); }
    else if (left) { P.rect(x + 3, y - 7, 8, 4, hex(side?.look?.color, 0xe0a84a)); P.hl(x + 3, y - 7, 8, 0xf0c060); }
  }
  if (meal?.dessert && eaten < 0.7) { const d = DB.part[meal.dessert]; P.rect(x - 9, y - 16, 5, 4, hex(d?.look?.color, 0xf0a0c0)); P.hl(x - 9, y - 16, 5, hex(d?.look?.top, 0xffffff)); }
}
// när i tuggcykeln gästen är: bite = burgaren lyfts mot munnen, munch = käkarna går
export function eatPhase(t, seed = 0) {
  const k = (t * 0.9 + seed * 0.37) % 3.2;
  return { bite: k < 0.6, munch: k >= 0.6 && k < 1.7 && Math.floor(t * 6) % 2 === 0 };
}
// tallriken på bordet framför den som äter: den byggda måltiden, lyfts mot munnen vid tuggan
export function eatSprite(ctx, x, y, stage, seed = 0, t = 0, chew = null, meal = null) {
  const P = ctxPix(ctx);
  if (!meal) { plateRows(P, x - 12, y - 6, 24); cupSprite(P, x + 6, y - 17, 0xf4f1ea, 0xc8ccd0); if (stage < 0.9) burgerSprite(P, x - 10, y - 12, seed % 2 === 0); return; }
  if (chew?.bite && stage < 0.9) {
    plateRows(P, x - 12, y - 6, 24);
    const m2 = { ...meal, layers: [] };   // tallriken utan burgaren – burgaren är vid munnen
    mealSprite(P, x, y, m2, stage, false);
    mealSprite(P, x, y - 16, { layers: meal.layers }, stage, false);
  } else mealSprite(P, x, y, meal, stage, true);
  if (stage > 0.15 && stage < 0.95) { P.rect(x - 2, y - 9, 6, 6, 0xf4f1ea); P.hl(x - 2, y - 9, 6, 0xffffff); }   // servett
}
// gästen bär tallriken (den byggda måltiden) från luckan till bordet
export function carrySprite(ctx, x, y, dir = 'down', seed = 0, meal = null) {
  const P = ctxPix(ctx);
  if (dir === 'up') return;   // ryggen mot oss – tallriken skyms
  const dx = dir === 'left' ? -8 : dir === 'right' ? 8 : 0, dy = dir === 'down' ? 0 : -2;
  if (meal) mealSprite(P, x + dx, y + dy - 12, meal, 0, true);
  else { plateRows(P, x + dx - 8, y + dy - 16, 16); burgerSprite(P, x + dx - 6, y + dy - 24, seed % 2 === 0); }
}
// tallrik som väntar på att hämtas vid luckan (den byggda måltiden om kunden har en)
export function readyItem(ctx, i, bx, by, c = null) {
  const P = ctxPix(ctx);
  by -= 8;   // tallrikarna står ovanpå kyldisken (DISPLAY.top), inte på diskens bänkskiva
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(bx - 1, by + 23, 22, 2);
  if (c?.meal) mealSprite(P, bx + 9, by + 21, c.meal, 0, true);
  else { plateRows(P, bx - 2, by + 15, 22); burgerSprite(P, bx, by + 8, i % 2 === 0); cupSprite(P, bx + 13, by + 5, i % 3 === 1 ? 0xf2c8d8 : 0xf4f1ea, 0xc92a2a); }
}

