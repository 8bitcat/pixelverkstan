// Arkadrummet: ett mörkt rum bakom butiken (Datorhuset) med kabinetten i rad längs
// väggen. Allt ljus kommer från maskinerna – marquiserna glöder, skärmarna kör
// attract-läge och varje skåp kastar sin egen färgade ljuspöl på neonmattan.
// Förebild: amerikanska arkadhallar 1978–1999 (docs/KONSOLER.md del 3).
import { drawPerson, makeLook, SHOPKEEPER } from './people.js';
import { Pix, hex, mix, mul, hash, bayer, SMALL, BIG, textW, text, ctxText, css } from './floor-pix.js';
import { cabinetSprite, cabinetScreen, attractFrame, CAB_BOX } from '../shops/dator/art-products.js';

export const AW = 512, AH = 300;
const FLOOR_Y = 150;            // väggens fot
const SLOT_X = (i) => 26 + i * 58;   // åtta skåp i rad
export const ARCADE_MAX = 8;
const WALK_SEQ = [1, 3, 2, 3];

export class ArcadeRoom {
  constructor(canvas, game, hooks) {
    this.canvas = canvas; this.game = game; this.shop = game.shop; this.hooks = hooks;
    this.buf = document.createElement('canvas'); this.RES = 1; this.buf.width = AW; this.buf.height = AH;
    this.ctx = this.buf.getContext('2d');
    this.t = 0; this.kids = []; this.sig = null;
    this.me = { x: 256, y: 250, dir: 'up', walk: 0, moving: false, path: null, act: null };
    this.room = this.paintRoom();
    if (canvas._arcadeOff) canvas._arcadeOff();
    const down = (e) => this.click(e);
    const move = (e) => { canvas.style.cursor = this.cabAt(e) !== null || this.exitAt(e) ? 'pointer' : 'default'; };
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move);
    canvas._arcadeOff = () => { canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); };
  }
  get list() { return (this.game.fit?.arcade || []).map((id) => this.shop.part[id]).filter(Boolean); }

  // ---------- statiskt: vägg, matta, inventarier ----------
  paintRoom() {
    const P = new Pix(AW, AH);
    // vägg och tak
    for (let y = 0; y < FLOOR_Y; y++) for (let x = 0; x < AW; x++) P.px(x, y, mix(0x0d0a1a, 0x1a1030, y / FLOOR_Y + (bayer(x, y) - 0.5) * 0.08));
    for (let x = 0; x < AW; x += 3) P.px(x, 6, 0x2a2440);
    // takarmaturer (en trasig)
    for (const lx of [90, 260, 430]) { P.rect(lx - 10, 3, 20, 4, 0x2a2a34); P.hl(lx - 9, 7, 18, lx === 430 ? 0x3a3a44 : 0x8a8a70); }
    // neonmattan: mörk botten med sicksack, konfetti och trianglar i neon
    const neon = [0x2fd8e8, 0xe83fb8, 0xf0e030, 0x7de83a, 0xff8a2a];
    for (let y = FLOOR_Y; y < AH; y++) for (let x = 0; x < AW; x++) {
      let c = mix(0x080614, 0x120c22, hash(x >> 1, y >> 1, 3) * 0.6);
      const zz = Math.abs(((x + (y - FLOOR_Y) * 0.6) % 48) - 24) - (y - FLOOR_Y) % 48;
      if (Math.abs(zz) < 1.2) c = neon[Math.floor((x / 48 + y / 48) % neon.length)];
      const h = hash(x >> 2, y >> 2, 4);
      if (h > 0.975) c = neon[Math.floor(hash(x >> 2, y >> 2, 5) * neon.length)];
      if ((x % 64) < 6 && (y % 40) < 6 && ((x >> 6) + (y >> 5)) % 2 === 0 && (x % 64) + (y % 40) < 6) c = neon[2];
      // nött framför skåpen
      if (y < FLOOR_Y + 30 && hash(x, y, 6) > 0.55) c = mul(c, 0.7);
      P.px(x, y, c);
    }
    P.hl(0, FLOOR_Y, AW, 0x2a2440); P.hl(0, FLOOR_Y + 1, AW, 0x05040a);
    // växlingsautomat på väggen till vänster
    P.rect(6, 88, 22, 48, 0x9a9ea6); P.hl(6, 88, 22, 0xc8ccd6); P.vl(27, 88, 48, 0x5a5f6a);
    P.rect(9, 92, 16, 8, 0x1a1a24); text(P, SMALL, 'VÄXEL', 10, 94, 0xf0e030);
    P.rect(11, 104, 12, 3, 0x3a3a44); P.rect(9, 118, 16, 10, 0x2a2a34); P.rect(11, 121, 12, 6, 0x0a0a0e);
    P.px(21, 110, 0x45e06a);
    // utgången till butiken, till höger
    P.rect(470, 62, 36, 88, 0x1a1a24); P.box(470, 62, 36, 88, 0x3a3a48);
    P.rect(474, 66, 28, 80, 0x2a2436); P.hl(474, 66, 28, 0x3a3448);
    P.rect(478, 100, 2, 6, 0xd8b24a);
    P.rect(464, 46, 48, 12, 0x1a1a24); P.box(464, 46, 48, 12, 0x3fb04a);
    text(P, SMALL, 'BUTIKEN', 470, 49, 0x7de83a);
    // prisdisk-skylt och "1 KR PER SPEL"
    P.rect(300, 20, 90, 12, 0x1a1030); P.box(300, 20, 90, 12, 0xe83fb8);
    text(P, SMALL, 'ARKADRUMMET', 306, 23, 0xff8ad8);
    return P.flush();
  }

  // ---------- logik ----------
  refresh() {
    const sig = (this.game.fit?.arcade || []).join(',');
    if (sig === this.sig) return;
    this.sig = sig;
    const n = this.list.length;
    // ungar som hänger vid maskinerna: fler ju fler och hetare skåp
    const want = Math.min(6, Math.round(n * 0.8));
    while (this.kids.length < want) { const i = Math.floor(Math.random() * Math.max(1, n)); this.kids.push({ look: makeLook(), at: i, x: SLOT_X(i) + 20 + (Math.random() - 0.5) * 14, y: FLOOR_Y + 28 + Math.random() * 10, t: Math.random() * 6 }); }
    this.kids = this.kids.slice(0, want).filter((k) => k.at < n);
  }
  update(dt) {
    this.t += dt;
    this.refresh();
    for (const k of this.kids) { k.t += dt; if (Math.random() < dt * 0.05) { k.at = Math.floor(Math.random() * Math.max(1, this.list.length)); k.tx = SLOT_X(k.at) + 20 + (Math.random() - 0.5) * 14; } if (k.tx !== undefined) { const d = k.tx - k.x; if (Math.abs(d) > 1) { k.x += Math.sign(d) * 30 * dt; k.moving = true; k.walk = (k.walk || 0) + dt * 8; } else { k.moving = false; } } }
    const me = this.me;
    if (me.path && me.path.length) {
      const [tx, ty] = me.path[0], dx = tx - me.x, dy = ty - me.y, d = Math.hypot(dx, dy), sp = 92 * dt;
      if (d > 0.01) me.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
      if (d <= sp) { me.x = tx; me.y = ty; me.path.shift(); } else { me.x += dx / d * sp; me.y += dy / d * sp; }
      me.moving = true; me.walk += dt * 10;
    } else { me.moving = false; if (me.act) { const fn = me.act; me.act = null; me.dir = 'up'; fn(); } }
  }
  goTo(x, y, fn) { const me = this.me; me.path = [[x, y]]; me.act = fn; }

  // ---------- input ----------
  toLocal(e) { const r = this.canvas.getBoundingClientRect(); return [(e.clientX - r.left - this.offX) / this.scale, (e.clientY - r.top - this.offY) / this.scale]; }
  cabAt(e) {
    const [x, y] = this.toLocal(e), n = this.list.length;
    for (let i = 0; i < n; i++) { const cx = SLOT_X(i); if (x >= cx && x < cx + CAB_BOX.w && y >= FLOOR_Y - CAB_BOX.h + 8 && y <= FLOOR_Y + 10) return i; }
    return null;
  }
  exitAt(e) { const [x, y] = this.toLocal(e); return x >= 468 && x <= 508 && y >= 46 && y <= 160; }
  click(e) {
    const i = this.cabAt(e);
    if (i !== null) { const p = this.list[i]; return this.goTo(SLOT_X(i) + 20, FLOOR_Y + 22, () => this.hooks.onPlay?.(p)); }
    if (this.exitAt(e)) return this.goTo(488, FLOOR_Y + 12, () => this.hooks.onExit?.());
    const [x, y] = this.toLocal(e);
    if (y > FLOOR_Y + 6 && y < AH - 6 && x > 6 && x < AW - 6) this.goTo(x, y, null);
  }

  // ---------- skalning & rendering ----------
  resize() {
    const dpr = window.devicePixelRatio || 1, w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr); this.dpr = dpr;
    let sc = Math.max(0.2, Math.min((w - 16) / AW, (h - 16) / AH));
    if (sc >= 2) sc = Math.floor(sc * 2) / 2;
    this.scale = sc; this.offX = Math.round((w - AW * sc) / 2); this.offY = Math.round((h - AH * sc) / 2);
    const res = Math.max(1, Math.min(4, Math.round(sc * dpr)));
    if (res !== this.RES) { this.RES = res; this.buf.width = AW * res; this.buf.height = AH * res; this.ctx = this.buf.getContext('2d'); }
  }
  draw() {
    const ctx = this.ctx, t = this.t, RES = this.RES, list = this.list;
    ctx.setTransform(RES, 0, 0, RES, 0, 0); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.room, 0, 0);
    // takarmaturens flimmer
    const flick = (t % 5) < 0.12 || Math.sin(t * 31) > 0.97;
    ctx.fillStyle = flick ? '#8a8a70' : '#3a3a44'; ctx.fillRect(421, 7, 18, 1);
    // ljuspölar på golvet (adderas, pulserar svagt)
    ctx.globalCompositeOperation = 'lighter';
    list.forEach((p, i) => {
      const cx = SLOT_X(i) + 20, col = hex(p.look.text, 0xf0e030), a = 0.14 + 0.05 * Math.sin(t * 1.3 + i);
      for (let r = 3; r >= 1; r--) { ctx.globalAlpha = a / r; ctx.fillStyle = css(col); ctx.beginPath(); ctx.ellipse(cx, FLOOR_Y + 14, 22 * r, 9 * r, 0, 0, Math.PI * 2); ctx.fill(); }
      // marquisens sken på väggen
      ctx.globalAlpha = 0.18; ctx.fillStyle = css(hex(p.look.marquee, 0xf0e030)); ctx.fillRect(SLOT_X(i) - 6, FLOOR_Y - CAB_BOX.h - 10, CAB_BOX.w + 12, 14);
    });
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    // skåpen med attract-läge
    const S = [];
    list.forEach((p, i) => {
      const x = SLOT_X(i), y = FLOOR_Y - CAB_BOX.h + 1;
      S.push([FLOOR_Y, () => {
        const img = cabinetSprite(p, RES);
        ctx.drawImage(img, x, y, CAB_BOX.w, CAB_BOX.h);
        const s = cabinetScreen(p);
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
        attractFrame(ctx, p.attract, (x + s.x) * RES, (y + s.y) * RES, s.w * RES, s.h * RES, t + i * 2.3);
        ctx.restore();
        // staplade mynt på kontrollpanelen (kö)
        if (i % 3 === 1) { ctx.fillStyle = '#d8b24a'; ctx.fillRect(x + 30, y + 47, 3, 1); ctx.fillRect(x + 30, y + 45, 3, 1); ctx.fillStyle = '#8a6a24'; ctx.fillRect(x + 30, y + 46, 3, 1); }
      }]);
    });
    for (const k of this.kids) S.push([k.y, () => drawPerson(ctx, k.x, k.y, k.look, k.moving ? (k.tx > k.x ? 'right' : 'left') : 'up', k.moving ? WALK_SEQ[Math.floor(k.walk || 0) % 4] : (Math.sin(k.t * 2) > 0.6 ? 4 : 0))]);
    const me = this.me, av = this.hooks.avatar?.() || { look: SHOPKEEPER, name: 'Du' };
    S.push([me.y, () => drawPerson(ctx, me.x, me.y, av.look, me.dir, me.moving ? WALK_SEQ[Math.floor(me.walk) % 4] : 0)]);
    S.sort((a, b) => a[0] - b[0]);
    for (const s of S) s[1]();
    // blått CRT-flimmer på folk nära skärmarna
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.06 + 0.04 * Math.sin(t * 17);
    ctx.fillStyle = '#7ab0ff'; ctx.fillRect(0, FLOOR_Y - 20, AW, 60);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    // tom rad: skylt
    if (!list.length) { const s = 'INGA MASKINER ÄN – KÖP UNDER 🏪 BUTIKEN'; ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(120, 100, 272, 14); ctxText(ctx, SMALL, 'INGA MASKINER AN - KOP UNDER BUTIKEN', 130, 104, '#f0e030'); }
    // ut till skärmen
    const out = this.canvas.getContext('2d');
    out.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    out.fillStyle = '#05040a'; out.fillRect(0, 0, this.canvas.clientWidth, this.canvas.clientHeight);
    out.imageSmoothingEnabled = false;
    out.drawImage(this.buf, this.offX, this.offY, AW * this.scale, AH * this.scale);
  }
}
