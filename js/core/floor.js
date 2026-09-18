// Butiksgolvet: ritar butiken i 512×384 logiska pixlar (skarpt uppskalat) och
// flyttar kunderna: trottoaren → glasdörren → kön vid BESTÄLL → väntplats (soffa
// eller glasmonter) → UTLÄMNING → ut genom dörren.
//
// Koordinater: kundens (x, y) = fötterna i den logiska scenen. Skärmposition:
//   rect.left + offX + x*scale, rect.top + offY + y*scale. Bröstet ligger ca 12–20 px
//   ovanför fötterna (y-12 träffar kunden).
import { drawPerson, SHOPKEEPER, makeLook } from './people.js';
import { Pix, hex, mix, mul, hsl, bayer, SMALL, BIG, textW, ctxText, eachTextPixel, css } from './floor-pix.js';
import * as LY from './floor-layout.js';
import * as SC from './floor-scene.js';
import * as PR from './floor-props.js';
import * as WK from './floor-walk.js';
import { consoleSprite, coverSprite, spineSprite, cabinetSprite, cabinetScreen, attractFrame, ATTRACT_FOR_ENGINE, CONSOLE_BOX, COVER_BOX, CAB_BOX } from '../shops/dator/art-products.js';

export const FW = LY.FW, FH = LY.FH;
const SPEED = 58, OUT_SPEED = 66;
const WALK_SEQ = [1, 3, 2, 3];
const OVERFLOW = [[268, 210], [290, 236], [262, 186], [300, 330]];

export class Floor {
  constructor(canvas, game) {
    this.canvas = canvas; this.game = game; this.shop = game.shop;
    this.buf = document.createElement('canvas'); this.buf.width = FW; this.buf.height = FH;
    this.ctx = this.buf.getContext('2d');
    this.particles = [];
    this.onCustomerClick = null;
    this.t = 0;
    this.offX = 0; this.offY = 0; this.scale = 1; this.dpr = 1;
    this.icons = new Map();
    this.RES = 1;  // buffertens pixlar per logisk pixel (följer skärmen)
    this.door = 0;
    this.keeper = { x: LY.KEEPER_HOME[0], y: LY.KEEPER_HOME[1], dir: 'down', walk: 0, moving: false, lookT: 3, look: 'down' };
    this.cars = []; this.carT = 1.5;
    this.walkers = []; this.walkerT = 4;
    this.sig = null; this.sigT = 0;
    // spelarnas avatarer: { id, name, look, color, x, y, dir, walk, moving, path, local, away, act }
    this.players = [];
    this.boxDrop = new Map(); this.hoverBox = null; this.vans = [];
    this.onBoxClick = null;
    this.build();
    if (canvas._floorOff) canvas._floorOff();
    const down = (e) => this.click(e);
    const move = (e) => {
      const c = this.hit(e), bx = this.boxAt(e);
      this.hoverBox = bx ? bx.id : null;
      canvas.style.cursor = (c && this.clickable(c)) || this.showcaseAt(e) || bx ? 'pointer' : this.inFloor(e) ? 'crosshair' : 'default';
    };
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas._floorOff = () => { canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); };
  }

  icon(part, w, h) {
    const key = part.id + ':' + w + 'x' + h;
    let c = this.icons.get(key);
    if (!c) {
      try { c = this.shop.icon(part, w, h); } catch { c = null; }
      if (!c) { c = document.createElement('canvas'); c.width = w; c.height = h; }
      this.icons.set(key, c);
    }
    return c;
  }

  // ---------- Förberedelse (statiska lager) ----------
  build() {
    const shop = this.shop, th = shop.theme || {}, g = this.game, F = shop.fit;
    const fit = g.fit || { slots: [], items: {} }, items = fit.items || {};
    const lokal = F ? F.lokalOf(fit) : 3, open = F ? F.SLOTS_PER_LOKAL[lokal] : LY.SLOTS.length;
    this.lokal = lokal; this.openSlots = open;
    this.fitSig = JSON.stringify(fit);
    this.street = SC.paintStreet({ items });
    this.clouds = SC.paintClouds();
    // stjärnobjektet
    const byCost = (a, b) => (b.cost || 0) - (a.cost || 0);
    this.heroYear = this.game.year;
    this.heroPart = shop.heroFor?.(this.game) || shop.part?.[shop.hero] || [...shop.parts.filter((p) => p.cat === 'gpu')].sort(byCost)[0];
    const [title, sub] = heroTitle(this.heroPart ? this.heroPart.name : '');
    const hero = PR.makeHero(title, sub);
    this.heroUnder = hero.under; this.heroOver = hero.over;
    this.heroIcon = this.heroPart ? this.icon(this.heroPart, 78, 52) : null;
    this.heroTitle = title;
    this.ropeBack = PR.makeRope(LY.ROPE.back, [LY.ROPE.x0, LY.ROPE.x1]);
    this.ropeFront = PR.makeRope(LY.ROPE.front, [LY.ROPE.x0, LY.HERO.cx, LY.ROPE.x1], true);
    // rummet
    const room = SC.paintRoom(th, { lokal, items, sign: shop.sign, openSlots: open });
    const neon = hex(th.neon, 0x7ee8fa);
    this.room = room.flush();
    const rc = this.room.getContext('2d');
    rc.imageSmoothingEnabled = false;
    if (this.heroPart) {
      const [x0, y0, x1] = SC.POSTER, ic = this.icon(this.heroPart, 26, 20);
      rc.drawImage(ic, Math.round((x0 + x1 - 26) / 2), y0 + 5);
    }
    this.neon = neonSign(shop.sign || '', neon, 2, 4);
    this.open = neonSign('ÖPPET', 0xff4d6d, 1, 3);
    this.counter = PR.makeCounter(th);
    this.back = PR.makeBackCabinet();
    this.furniture = [this.back, PR.makeSofa(), PR.makeArmchair(), PR.makeTable(), ...LY.PLANTS.map(([x, y]) => PR.makePlant(x, y)), ...LY.GATES.map((x) => PR.makeGate(x))];
    if (items.vaxter) this.furniture.push(...LY.EXTRA_PLANTS.map(([x, y]) => PR.makePlant(x, y)));
    if (items.tidningar) this.furniture.push(PR.makeMagRack());
    this.buildUnits();
    this.shelfImg = null;
    this.cars = [];
    this.carImgs = [0xc9323a, 0x2c6fb7, 0xf0f0ea, 0x2a2d33, 0xe8b230, 0x46a35a].map((c, i) => PR.makeCar(c, i === 4 ? 1 : 0));
    this.beams = makeBeams();
  }

  // Enheterna på platserna: montrar (kategori eller märke), torn, automater – eller tomt/stängt
  buildUnits() {
    const shop = this.shop, g = this.game, F = shop.fit, fit = g.fit || { slots: [], items: {} };
    this.units = LY.SLOTS.map((slot, i) => {
      const def = fit.slots[i], W = slot.x1 - slot.x0, D = LY.SLOT_DEPTH[slot.size];
      if (i >= this.openSlots) return { i, slot, closed: true, img: PR.makeClosedSlot(W, D), x: slot.x0, y: slot.base - D - 34 + 1, sort: slot.base };
      if (!def) return { i, slot, empty: true, img: PR.makeEmptySlot(W, D, i + 1), x: slot.x0, y: slot.base - D, sort: slot.base - D - 1 };
      if (def.kind === 'unit') {
        if (def.unit === 'tv') { const frame = PR.makeTvCorner(W, g.year); return { i, slot, def, frame, unit: 'tv', img: null, x: slot.x0, y: slot.base - frame.H + 1, sort: slot.base }; }
        if (def.unit === 'spelhylla') { const frame = PR.makeGameShelf(W); return { i, slot, def, frame, unit: 'spelhylla', img: null, x: slot.x0, y: slot.base - frame.H + 1, sort: slot.base }; }
        if (def.unit === 'spelbord') { const frame = PR.makeGameDesk(W, g.year); return { i, slot, def, frame, unit: 'spelbord', img: null, x: slot.x0, y: slot.base - frame.H + 1, sort: slot.base }; }
        if (def.unit === 'arkad') { const prod = shop.part[def.product]; return { i, slot, def, unit: 'arkad', prod, img: null, x: Math.round(slot.x0 + (W - CAB_BOX.w) / 2), y: slot.base - CAB_BOX.h + 1, sort: slot.base }; }
        const img = PR.makeVendor(def.unit); return { i, slot, def, img, x: Math.round(slot.x0 + (W - img.width) / 2), y: slot.base - img.height + 1, sort: slot.base };
      }
      const cat = shop.cats?.[def.cat], brand = def.kind === 'brand' && F ? F.brandInfo(def.cat, def.brand) : null;
      const velvet = mix(mul(hex(brand?.color || cat?.color, 0x7a2e3e), 0.5), 0x1a1030, 0.35);
      const catName = (F?.CAT_NAME?.[def.cat] || cat?.name || def.cat).toUpperCase();
      const frame = slot.size === 'small' ? PR.makeTower(catName, velvet, brand, def.level) : PR.makeVitrine(W, catName, velvet, brand, def.level);
      const x = slot.size === 'small' ? Math.round(slot.x0 + (W - frame.W) / 2) : slot.x0;
      return { i, slot, def, frame, brand, cat: def.cat, img: null, x, y: slot.base - frame.H + 1, sort: slot.base };
    });
    this.sig = null;
  }

  // ---------- Logik ----------
  update(dt) {
    this.t += dt;
    const g = this.game;
    for (const c of g.customers) {
      if (c._fl) continue;
      c._fl = true; c._path = null; c._tkey = '';
      if (c.phase === 'arriving') {
        const left = Math.random() < 0.65;
        c.x = left ? LY.SPAWN_X[0] : LY.SPAWN_X[1]; c.y = LY.SIDEWALK_Y; c.dir = left ? 'right' : 'left';
      }
    }
    if (!this.mirror) for (const c of [...g.customers]) this.moveCustomer(c, dt);
    else this.followCustomers(dt);
    for (const pl of this.players) this.movePlayer(pl, dt);
    for (const v of this.vans) { v.t += dt; if (v.stop > 0 && Math.abs(v.x - LY.DOOR.cx + 15) < 3) { v.stop -= dt; } else v.x += v.v * dt; }
    this.vans = this.vans.filter((v) => v.x < SC.STREET_W + 40);
    this.updateStreet(dt);
    // automatdörren
    const near = [...g.customers, ...this.walkers.filter((w) => w.enter)].some((c) => Math.abs(c.x - LY.DOOR.cx) < 24 && c.y > LY.SIDEWALK_Y - 4 && c.y < LY.WALL_Y + 20);
    this.door = Math.max(0, Math.min(1, this.door + (near ? 3.2 : -1.6) * dt));
    for (const p of this.particles) { p.vy += 520 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  // ---------- Spelarna ----------
  localPlayer() { return this.players.find((p) => p.local); }
  movePlayer(pl, dt) {
    if (!pl.local) {
      // andra spelare: glid mot senaste kända position
      if (pl.tx === undefined) return;
      const dx = pl.tx - pl.x, dy = pl.ty - pl.y, d = Math.hypot(dx, dy);
      pl.moving = d > 0.6;
      if (d > 60) { pl.x = pl.tx; pl.y = pl.ty; }
      else if (pl.moving) { const k = Math.min(1, dt * 10); pl.x += dx * k; pl.y += dy * k; pl.walk = (pl.walk || 0) + dt * 8.5; if (Math.abs(dx) + Math.abs(dy) > 0.3) pl.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'); }
      else pl.dir = pl.tdir || pl.dir;
      return;
    }
    const path = pl.path;
    if (path && path.length) {
      const [tx, ty] = path[0];
      const dx = tx - pl.x, dy = ty - pl.y, d = Math.hypot(dx, dy), sp = 92 * dt;
      if (d > 0.01) pl.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
      if (d <= sp) { pl.x = tx; pl.y = ty; path.shift(); } else { pl.x += dx / d * sp; pl.y += dy / d * sp; }
      pl.moving = true; pl.walk = (pl.walk || 0) + dt * 10;
      return;
    }
    pl.moving = false;
    if (pl.act) { const fn = pl.act; pl.act = null; if (pl.faceDir) pl.dir = pl.faceDir; fn(); }
  }
  // gå till (x,y) och gör sedan fn (direkt om man redan står där)
  goTo(x, y, fn = null, faceDir = null) {
    const pl = this.localPlayer();
    if (!pl) { fn?.(); return; }
    pl.away = null;
    const [nx, ny] = WK.nearestFree(x, y);
    if (Math.hypot(nx - pl.x, ny - pl.y) < 6) { pl.path = []; pl.act = null; if (faceDir) pl.dir = faceDir; fn?.(); return; }
    pl.path = WK.findPath(pl.x, pl.y, nx, ny);
    pl.act = fn; pl.faceDir = faceDir;
  }
  // klienten i co-op: kunderna flyttas av värden, här glider vi bara mot deras position
  followCustomers(dt) {
    for (const c of this.game.customers) {
      if (c.tx === undefined) continue;
      const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy);
      if (d > 50 || c.x === undefined) { c.x = c.tx; c.y = c.ty; }
      else { const k = Math.min(1, dt * 9); c.x += dx * k; c.y += dy * k; }
      if (c.moving) c.walk = (c.walk || 0) + dt * 8.5;
    }
  }
  spawnVan() {
    this.vans.push({ x: -40, v: 70, stop: 1.4, t: 0 });
  }
  boxPos(i) { return WK.DELIVERY[i % WK.DELIVERY.length]; }
  arrivedBoxes() { return this.game.deliveries.filter((d) => d.state === 'arrived'); }

  pickSpot(c) {
    const g = this.game;
    const used = new Set(g.customers.filter((x) => x !== c && x.phase === 'waiting' && x._spot >= 0).map((x) => x._spot));
    const kid = c.look && c.look.kid;
    const cand = [];
    LY.SPOTS.forEach((s, i) => {
      if (used.has(i) || i === c._spot) return;
      if (s.kind === 'case' && !this.units?.[s.slot]?.frame) return;
      const w = s.kind === 'seat' ? (kid ? 0.6 : 1.2) : s.kind === 'hero' ? (kid ? 3 : 1.2) : 1;
      cand.push([i, w]);
    });
    if (!cand.length) return used.has(c._spot) || c._spot === undefined ? -1 : c._spot;
    let r = Math.random() * cand.reduce((s, x) => s + x[1], 0);
    for (const [i, w] of cand) { r -= w; if (r <= 0) return i; }
    return cand[cand.length - 1][0];
  }

  targetFor(c) {
    const g = this.game;
    if (c.phase === 'arriving' || c.phase === 'queue') {
      const i = Math.min(Math.max(0, g.queue().indexOf(c)), LY.QUEUE.length - 1);
      return { x: LY.QUEUE[i][0], y: LY.QUEUE[i][1], dir: 'up', key: 'q' + i };
    }
    if (c.phase === 'waiting') {
      if (c._spot === undefined || c._spot === null) { c._spot = this.pickSpot(c); c._stay = 12 + Math.random() * 14; }
      if (c._spot < 0) { const o = OVERFLOW[c.id % OVERFLOW.length]; return { x: o[0], y: o[1], dir: 'down', key: 'o' + c.id }; }
      const s = LY.SPOTS[c._spot];
      return { x: s.x, y: s.y, dir: s.dir, sit: !!s.sit, via: s.via, key: 's' + c._spot };
    }
    c._spot = null;
    if (c.phase === 'ready') {
      const i = Math.min(g.customers.filter((x) => x.phase === 'ready').indexOf(c), LY.PICKUP.length - 1);
      return { x: LY.PICKUP[i][0], y: LY.PICKUP[i][1], dir: 'up', key: 'p' + i };
    }
    if (c._exitX === undefined) c._exitX = LY.SPAWN_X[Math.random() < 0.5 ? 0 : 1];
    return { x: c._exitX, y: LY.SIDEWALK_Y, out: true, key: 'out' };
  }

  plan(c, T) {
    const D = LY.DOOR, pts = [];
    let sx = c.x, sy = c.y;
    const outside = c.y < LY.WALL_Y;
    const inQueue = c.phase === 'arriving' || c.phase === 'queue';
    const lane = inQueue ? [] : LY.queueLane(this.game.queue().filter((x) => x.y >= LY.WALL_Y).length);
    if (c._seat && c._seat.via) { pts.push(c._seat.via); [sx, sy] = c._seat.via; }
    c._seat = null;
    if (T.out) {
      if (!outside) { pts.push(...LY.route(sx, sy, D.cx, D.inY, lane)); pts.push([D.cx, LY.SIDEWALK_Y]); }
      pts.push([T.x, T.y]);
      return pts;
    }
    if (outside) { pts.push([D.cx, LY.SIDEWALK_Y], [D.cx, D.inY]); sx = D.cx; sy = D.inY; }
    const goal = T.via || [T.x, T.y];
    pts.push(...LY.route(sx, sy, goal[0], goal[1], lane));
    if (T.via) pts.push([T.x, T.y]);
    return pts;
  }

  moveCustomer(c, dt) {
    const g = this.game;
    if (c.bubbleT > 0) c.bubbleT -= dt;
    if (c.phase === 'waiting' && !c.moving && c._spot >= 0) {
      c._stay = (c._stay ?? 15) - dt;
      if (c._stay <= 0) {
        c._stay = 12 + Math.random() * 16;
        if (Math.random() < 0.55) { const n = this.pickSpot(c); if (n >= 0) c._spot = n; }
      }
    }
    const T = this.targetFor(c);
    if (c._tkey !== T.key || !c._path) { c._path = this.plan(c, T); c._tkey = T.key; }
    const path = c._path;
    if (path.length) {
      const [tx, ty] = path[0];
      const dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy);
      const sp = (c.y < LY.WALL_Y ? OUT_SPEED : SPEED) * (c.look && c.look.kid ? 1.08 : 1) * dt;
      if (d > 0.01) c.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
      if (d <= sp) { c.x = tx; c.y = ty; path.shift(); } else { c.x += dx / d * sp; c.y += dy / d * sp; }
      c.moving = true; c._sit = false;
      c.walk = (c.walk || 0) + dt * 8.5;
      return;
    }
    // framme
    c.moving = false;
    if (T.dir) c.dir = T.dir;
    c._sit = !!T.sit;
    if (T.sit && c._spot >= 0) c._seat = LY.SPOTS[c._spot];
    if (c.phase === 'arriving' && T.key.startsWith('q')) c.phase = 'queue';
    if (c.phase === 'ready' && T.key === 'p0') {
      if (c.payout) {
        const p = c.payout; c.payout = null;
        this.coins(c.x, c.y - 42, Math.min(18, 5 + Math.floor(p.total / 1500)));
        g.pay(p, c);
      }
      c.phase = 'leaving'; c.mood = c.mood === 'angry' ? c.mood : 'happy'; c.bubbleT = 3;
    }
    if (c.phase === 'leaving' && T.out && c.y < LY.WALL_Y) {
      const i = g.customers.indexOf(c);
      if (i >= 0) g.customers.splice(i, 1);
    }
  }

  updateKeeper(dt) {
    const k = this.keeper, g = this.game;
    const ready = g.customers.some((c) => c.phase === 'ready' && c.y > LY.WALL_Y && Math.hypot(c.x - LY.PICKUP[0][0], c.y - LY.PICKUP[0][1]) < 110);
    const tx = ready ? LY.KEEPER_PICKUP[0] : LY.KEEPER_HOME[0];
    const dx = tx - k.x;
    if (Math.abs(dx) > 0.5) {
      k.x += Math.sign(dx) * Math.min(Math.abs(dx), 46 * dt);
      k.dir = dx < 0 ? 'left' : 'right'; k.moving = true; k.walk += dt * 8;
      return;
    }
    k.moving = false;
    const front = g.queue()[0];
    k.lookT -= dt;
    if (k.lookT <= 0) {
      k.look = ['down', 'down', 'left', 'right', 'up'][Math.floor(Math.random() * 5)];
      k.lookT = k.look === 'down' ? 3 + Math.random() * 4 : 1.2 + Math.random();
    }
    k.dir = (front && front.phase === 'queue') || ready ? 'down' : k.look;
  }

  updateStreet(dt) {
    this.carT -= dt;
    if (this.carT <= 0) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      this.cars.push({ x: dir > 0 ? -34 : SC.STREET_W + 4, dir, img: this.carImgs[Math.floor(Math.random() * this.carImgs.length)], v: 55 + Math.random() * 35 });
      this.carT = 2.5 + Math.random() * 6;
    }
    for (const c of this.cars) c.x += c.dir * c.v * dt;
    this.cars = this.cars.filter((c) => c.x > -40 && c.x < SC.STREET_W + 10);
    this.walkerT -= dt;
    if (this.walkerT <= 0 && this.walkers.length < 2) {
      const dir = Math.random() < 0.5 ? 1 : -1;
      this.walkers.push({ x: dir > 0 ? -16 : SC.STREET_W + 14, y: LY.SIDEWALK_Y - 3, dir, look: makeLook(), v: 30 + Math.random() * 14, walk: 0 });
      this.walkerT = 7 + Math.random() * 14;
    }
    for (const w of this.walkers) { w.x += w.dir * w.v * dt; w.walk += dt * 7; }
    this.walkers = this.walkers.filter((w) => w.x > -20 && w.x < SC.STREET_W + 20);
  }

  coins(x, y, n) {
    for (let i = 0; i < n; i++) this.particles.push({ x, y, vx: (Math.random() - 0.5) * 140, vy: -180 - Math.random() * 140, life: 0.9 + Math.random() * 0.4 });
  }

  // ---------- Input ----------
  toLocal(e) {
    const r = this.canvas.getBoundingClientRect();
    return [(e.clientX - r.left - this.offX) / this.scale, (e.clientY - r.top - this.offY) / this.scale];
  }
  hit(e) {
    const [x, y] = this.toLocal(e);
    let best = null, bestScore = -1;
    for (const c of this.game.customers) {
      if (c.y < LY.WALL_Y) continue;
      const cl = this.clickable(c), kid = c.look && c.look.kid;
      const hw = cl ? 14 : 9, top = c.y - (kid ? 30 : 39) - (cl ? 18 : 0);
      if (x > c.x - hw && x < c.x + hw && y > top && y < c.y + 4) {
        const score = (cl ? 1000 : 0) + c.y;
        if (score > bestScore) { best = c; bestScore = score; }
      }
    }
    return best;
  }
  clickable(c) { return c.phase === 'queue' && this.game.queue()[0] === c; }
  inFloor(e) { const [x, y] = this.toLocal(e); return x > 0 && x < FW && y > LY.WALL_Y && y < FH; }
  boxAt(e) {
    const [x, y] = this.toLocal(e);
    const boxes = this.arrivedBoxes();
    for (let i = boxes.length - 1; i >= 0; i--) {
      const [bx, by] = this.boxPos(i);
      if (x > bx - 14 && x < bx + 14 && y > by - 26 && y < by + 4) return boxes[i];
    }
    return null;
  }
  click(e) {
    const bx = this.boxAt(e);
    if (bx) {
      const i = this.arrivedBoxes().indexOf(bx), [x, y] = this.boxPos(i);
      return this.goTo(x - 18, y + 2, () => this.onBoxClick?.(bx), 'right');
    }
    const c = this.hit(e);
    if (c && this.onCustomerClick) {
      if (this.clickable(c)) return this.goTo(WK.SPOTS.counter[0], WK.SPOTS.counter[1], () => this.onCustomerClick(c), 'down');
      return this.onCustomerClick(c);
    }
    const sc = this.showcaseAt(e);
    if (sc && this.onShowcaseClick) {
      const [x, y] = this.toLocal(e);
      return this.goTo(x, y + 26, () => this.onShowcaseClick(sc), 'up');
    }
    if (this.inFloor(e)) { const [x, y] = this.toLocal(e); this.goTo(x, y); }
  }
  // Monter, enhet, plats eller stjärnobjekt under pekaren → { slot, cat, brand, title } | { unit } | { empty } | { closed } | { hero }
  showcaseAt(e) {
    const [x, y] = this.toLocal(e);
    for (const u of this.units || []) {
      const sl = u.slot;
      if (u.unit && u.frame) {
        // TV-hörna, spelhylla, spelbord
        const y0 = sl.base - u.frame.H + 1;
        if (x >= u.x && x < u.x + u.frame.W && y >= y0 && y <= sl.base + 2) return { slot: u.i, unit: u.unit, title: this.shop.fit?.slotTitle(u.def) };
      } else if (u.unit === 'arkad') {
        if (x >= u.x && x < u.x + CAB_BOX.w && y >= u.y && y <= sl.base + 2) return { slot: u.i, unit: 'arkad', title: this.shop.fit?.slotTitle(u.def) };
      } else if (u.frame) {
        const y0 = sl.base - u.frame.H + 1;
        if (x >= u.x && x < u.x + u.frame.W && y >= y0 && y <= sl.base + 2) return { slot: u.i, cat: u.cat, brand: u.def.brand || null, title: this.shop.fit?.slotTitle(u.def) };
      } else if (u.def) {
        if (x >= u.x && x < u.x + u.img.width && y >= u.y && y <= sl.base + 2) return { slot: u.i, unit: u.def.unit, title: this.shop.fit?.slotTitle(u.def) };
      } else if (u.empty) {
        if (x >= sl.x0 && x < sl.x1 && y >= sl.base - LY.SLOT_DEPTH[sl.size] && y <= sl.base + 2) return { slot: u.i, empty: true };
      } else if (u.closed) {
        if (x >= sl.x0 && x < sl.x1 && y >= u.y && y <= sl.base + 2) return { slot: u.i, closed: true };
      }
    }
    if (this.heroPart && this.heroUnder) {
      const B = PR.HERO_BOX, hx = LY.HERO.cx - B.ax, hy = LY.HERO.base - B.ay;
      if (x >= hx && x < hx + this.heroUnder.width && y >= hy && y < hy + this.heroUnder.height) return { hero: this.heroPart.id };
    }
    return null;
  }

  // ---------- Skalning ----------
  resize() {
    const dpr = window.devicePixelRatio || 1;
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight;
    this.canvas.width = Math.round(w * dpr); this.canvas.height = Math.round(h * dpr);
    const wide = w >= 760;
    const hud = document.getElementById('hud');
    const top = Math.max(52, hud && hud.offsetHeight ? hud.offsetHeight + 4 : 52), bottom = wide ? 10 : Math.min(h * 0.36, 230);
    const availW = wide ? w - 330 : w - 8, availH = h - top - bottom;
    let sc = Math.max(0.2, Math.min(availW / FW, availH / FH));
    if (sc >= 2) sc = Math.floor(sc * 2) / 2;
    else if (sc >= 1 && dpr >= 2) sc = Math.floor(sc * dpr) / dpr;
    this.scale = sc;
    this.offX = Math.round((w - FW * sc) / 2);
    this.offY = Math.round(top + Math.max(0, availH - FH * sc) / 2);
    if (wide) this.offX = Math.max(10, Math.min(this.offX, w - 320 - FW * sc));
    this.dpr = dpr;
    const res = Math.max(1, Math.min(4, Math.round(sc * dpr)));
    if (res !== this.RES) {
      this.RES = res;
      this.buf.width = FW * res; this.buf.height = FH * res;
      this.ctx = this.buf.getContext('2d');
      this.sig = null;
      this.heroIcon = this.heroPart ? this.icon(this.heroPart, 78 * res, 52 * res) : null;
    }
  }

  // ---------- Rendering ----------
  draw() {
    const ctx = this.ctx, g = this.game, t = this.t;
    ctx.setTransform(this.RES, 0, 0, this.RES, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    this.refreshStock();

    // gatan bakom fönstren
    ctx.drawImage(this.street, 0, 0);
    const cx = -((t * 2.5) % SC.STREET_W);
    ctx.drawImage(this.clouds, Math.round(cx), 6); ctx.drawImage(this.clouds, Math.round(cx) + SC.STREET_W, 6);
    for (const car of this.cars) {
      const y = car.dir > 0 ? 52 : 46;
      if (car.dir > 0) ctx.drawImage(car.img, Math.round(car.x), y);
      else { ctx.save(); ctx.translate(Math.round(car.x) + 30, y); ctx.scale(-1, 1); ctx.drawImage(car.img, 0, 0); ctx.restore(); }
    }
    for (const v of this.vans) this.drawVan(ctx, v);
    ctx.drawImage(this.street, 0, 66, SC.STREET_W, LY.WALL_Y - 66, 0, 66, SC.STREET_W, LY.WALL_Y - 66);
    const outside = [
      ...this.walkers.map((w) => ({ y: w.y, x: w.x, look: w.look, dir: w.dir > 0 ? 'right' : 'left', f: WALK_SEQ[Math.floor(w.walk) % 4] })),
      ...g.customers.filter((c) => c.y < LY.WALL_Y).map((c) => ({ y: c.y, x: c.x, look: c.look, dir: c.dir, f: c.moving ? WALK_SEQ[Math.floor(c.walk) % 4] : 0 })),
    ].sort((a, b) => a.y - b.y);
    for (const p of outside) drawPerson(ctx, p.x, p.y, p.look, p.dir, p.f);

    // rummet
    ctx.drawImage(this.room, 0, 0);
    this.drawWallLife(ctx);
    this.drawDoor(ctx);

    // y-sorterade möbler och personer
    const S = [];
    for (const f of this.furniture) S.push([f.sort, () => ctx.drawImage(f.img, f.x, f.y)]);
    for (const pl of this.players) {
      if (pl.away) continue;
      S.push([pl.y, () => drawPerson(ctx, pl.x, pl.y, pl.look || SHOPKEEPER, pl.dir || 'down', pl.moving ? WALK_SEQ[Math.floor(pl.walk || 0) % 4] : (Math.sin(t * 2.1 + (pl.seed || 0)) > 0.7 ? 4 : 0))]);
    }
    this.arrivedBoxes().forEach((d, i) => {
      const [bx, by] = this.boxPos(i);
      if (!this.boxDrop.has(d.id)) this.boxDrop.set(d.id, t);
      const age = t - this.boxDrop.get(d.id), drop = Math.max(0, 1 - age * 2.2);
      S.push([by, () => this.drawBox(ctx, d, bx, by - Math.round(drop * drop * 60))]);
    });
    S.push([LY.COUNTER.base, () => this.drawCounter(ctx)]);
    for (const u of this.units || []) {
      if (u.frame || u.unit === 'arkad') S.push([u.sort, () => { if (u.img) ctx.drawImage(u.img, u.x, u.y, u.img.width / this.RES, u.img.height / this.RES); this.drawUnitFx(ctx, u); }]);
      else S.push([u.sort, () => ctx.drawImage(u.img, u.x, u.y)]);
    }
    S.push([LY.ROPE.back, () => ctx.drawImage(this.ropeBack.img, this.ropeBack.x, this.ropeBack.y)]);
    S.push([LY.HERO.base, () => this.drawHero(ctx)]);
    S.push([LY.ROPE.front, () => ctx.drawImage(this.ropeFront.img, this.ropeFront.x, this.ropeFront.y)]);
    for (const c of g.customers) {
      if (c.y < LY.WALL_Y) continue;
      const frame = c.moving ? WALK_SEQ[Math.floor(c.walk) % 4] : c._sit ? 5 : (Math.sin(t * 1.9 + c.id * 1.7) > 0.72 ? 4 : 0);
      S.push([c._sit ? c.y + 2 : c.y, () => drawPerson(ctx, c.x, c.y, c.look, c._sit ? 'down' : c.dir, frame)]);
    }
    S.sort((a, b) => a[0] - b[0]);
    for (const s of S) s[1]();

    // ljuskäglor
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.85 + 0.15 * Math.sin(t * 0.7);
    ctx.drawImage(this.beams, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

    for (const c of g.customers) if (c.y >= LY.WALL_Y) this.drawBubble(ctx, c);
    this.drawNameTags(ctx);
    if (this.hoverBox) { const i = this.arrivedBoxes().findIndex((d) => d.id === this.hoverBox); if (i >= 0) this.drawBoxTip(ctx, this.arrivedBoxes()[i], ...this.boxPos(i)); }
    for (const p of this.particles) {
      const x = p.x | 0, y = p.y | 0, spin = Math.floor((p.life * 10) % 3);
      ctx.fillStyle = '#8a5a0b'; ctx.fillRect(x - 1, y - 1, spin === 1 ? 3 : 6, 6);
      ctx.fillStyle = '#f5c542'; ctx.fillRect(x, y, spin === 1 ? 1 : 4, 4);
      ctx.fillStyle = '#fff4b0'; ctx.fillRect(x, y, 1, 1);
    }

    // ut till skärmen
    const out = this.canvas.getContext('2d');
    out.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    out.fillStyle = '#2a2433'; out.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const W = FW * this.scale, H = FH * this.scale;
    out.fillStyle = 'rgba(0,0,0,.35)'; out.fillRect(this.offX + 6, this.offY + 6, W, H);
    out.fillStyle = '#17151a'; out.fillRect(this.offX - 3, this.offY - 3, W + 6, H + 6);
    out.imageSmoothingEnabled = false;
    out.drawImage(this.buf, this.offX, this.offY, W, H);
    this.drawSpeech(out);
  }

  // Pratbubblor (chatt) ritas i skärmens upplösning så att texten blir läsbar
  drawSpeech(out) {
    const now = performance.now();
    for (const pl of this.players) {
      if (!pl.say || now > pl.say.until) continue;
      const px = pl.away ? 470 : pl.x, py = pl.away ? 84 : pl.y - (pl.look?.kid ? 44 : 54);
      const sx = this.offX + px * this.scale, sy = this.offY + py * this.scale;
      const fs = Math.max(15, Math.min(22, Math.round(8 * this.scale)));
      out.font = `${fs}px "VT323", monospace`;
      const words = String(pl.say.text).split(/\s+/), lines = [];
      let line = '';
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (out.measureText(test).width > 190 && line) { lines.push(line); line = w; } else line = test;
      }
      if (line) lines.push(line);
      const w = Math.min(220, Math.max(...lines.map((l) => out.measureText(l).width))) + 14, h = lines.length * (fs + 1) + 10;
      const bx = Math.round(Math.max(4, Math.min(this.canvas.clientWidth - w - 4, sx - w / 2))), by = Math.round(sy - h - 10);
      const fade = Math.min(1, (pl.say.until - now) / 600);
      out.save(); out.globalAlpha = fade;
      out.fillStyle = '#17151a'; out.fillRect(bx - 2, by - 2, w + 4, h + 4);
      out.fillStyle = '#ffffff'; out.fillRect(bx, by, w, h);
      out.fillStyle = pl.color || '#7ee8fa'; out.fillRect(bx, by, 4, h);
      // pil ner mot avataren
      const tx = Math.round(Math.max(bx + 8, Math.min(bx + w - 8, sx)));
      out.fillStyle = '#17151a'; out.fillRect(tx - 5, by + h, 10, 4); out.fillRect(tx - 3, by + h + 4, 6, 3); out.fillRect(tx - 1, by + h + 7, 2, 2);
      out.fillStyle = '#ffffff'; out.fillRect(tx - 3, by + h, 6, 3); out.fillRect(tx - 1, by + h + 3, 2, 3);
      out.fillStyle = '#17151a'; out.textBaseline = 'top';
      lines.forEach((l, i) => out.fillText(l, bx + 9, by + 5 + i * (fs + 1)));
      out.restore();
    }
  }

  // delar i lager (lagret är glest – snabbare än att gå igenom alla delar)
  owned() { const g = this.game; return Object.keys(g.shown).filter((id) => g.shownFree(id) > 0).map((id) => this.shop.part[id]).filter(Boolean); }

  // lagret ändras → rita om montrar och vägghylla
  refreshStock() {
    this.sigT -= 1 / 60;
    if (this.sig !== null && this.sigT > 0) return;
    this.sigT = 0.25;
    const g = this.game, shop = this.shop;
    const fitSig = JSON.stringify(g.fit || null);
    if (g.year !== this.heroYear || fitSig !== this.fitSig) { this.build(); this.sig = null; }
    const sig = Object.keys(g.shown).map((id) => id + ':' + g.shownFree(id)).join(',');
    if (sig === this.sig) return;
    this.sig = sig;
    for (const u of this.units) {
      if (u.unit === 'tv') u.img = this.renderTv(u);
      else if (u.unit === 'spelhylla') u.img = this.renderGameShelf(u);
      else if (u.unit === 'spelbord') u.img = this.renderDesk(u);
      else if (u.unit === 'arkad') u.img = u.prod ? cabinetSprite(u.prod, this.RES) : null;
      else if (u.frame) u.img = u.frame.tower ? this.renderTower(u) : this.renderVitrine(u);
    }
    this.shelfImg = this.renderShelf();
  }

  // produkter som står framme, hetast först
  productsShown(cat, cap) {
    const g = this.game, shop = this.shop;
    return this.owned().filter((p) => p.cat === cat).sort((a, b) => shop.hypeAt(b, g.year) - shop.hypeAt(a, g.year)).slice(0, cap);
  }
  unitCanvas(u) {
    const RES = this.RES, c = document.createElement('canvas'); c.width = u.frame.W * RES; c.height = u.frame.H * RES;
    const x = c.getContext('2d'); x.setTransform(RES, 0, 0, RES, 0, 0); x.imageSmoothingEnabled = false;
    x.drawImage(u.frame.img, 0, 0);
    return [c, x];
  }
  renderTv(u) {
    const [c, x] = this.unitCanvas(u), f = u.frame, RES = this.RES, g = this.game;
    const cons = this.productsShown('konsol', f.spots.length);
    u.shownCons = cons;
    cons.forEach((p, i) => {
      const sp = f.spots[i], img = consoleSprite(p, RES);
      x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(sp.x + 2, sp.y - 1, CONSOLE_BOX.w - 4, 2);
      x.drawImage(img, sp.x, sp.y - CONSOLE_BOX.h, CONSOLE_BOX.w, CONSOLE_BOX.h);
      const label = PLATE[p.look.shape] || p.name.toUpperCase().slice(0, 6), tw = textW(SMALL, label) + 4, tx = Math.round(sp.x + (CONSOLE_BOX.w - tw) / 2);
      x.fillStyle = '#f4efe2'; x.fillRect(tx, sp.y, tw, 7); x.fillStyle = '#17151a'; x.fillRect(tx, sp.y + 7, tw, 1);
      ctxText(x, SMALL, label, tx + 2, sp.y + 1, '#17151a');
      const n = g.shownFree(p.id); if (n > 1) { const t = '×' + n; ctxText(x, SMALL, t, sp.x + CONSOLE_BOX.w - textW(SMALL, t) - 1, sp.y - CONSOLE_BOX.h + 1, '#f4efe2'); }
    });
    if (!cons.length) { const t = 'INGA KONSOLER'; x.fillStyle = 'rgba(244,239,226,.85)'; x.fillRect(Math.round((f.W - textW(SMALL, t) - 8) / 2), f.cav.y + 6, textW(SMALL, t) + 8, 9); ctxText(x, SMALL, t, Math.round((f.W - textW(SMALL, t)) / 2), f.cav.y + 8, '#9e1b22'); }
    return c;
  }
  renderGameShelf(u) {
    const [c, x] = this.unitCanvas(u), f = u.frame, RES = this.RES, g = this.game;
    const games = this.productsShown('spel', f.fronts + f.spines * 2);
    u.shownGames = games;
    // översta hyllplanet: omslagen utåt
    const fronts = games.slice(0, f.fronts);
    fronts.forEach((p, i) => {
      const px = 4 + i * 14, py = f.boards[0] - COVER_BOX.h;
      x.drawImage(coverSprite(p, RES), px, py, COVER_BOX.w, COVER_BOX.h);
      const n = g.shownFree(p.id); if (n > 1) { x.fillStyle = '#17151a'; x.fillRect(px + 8, py - 1, 5, 6); ctxText(x, SMALL, String(Math.min(9, n)), px + 9, py, '#f4efe2'); }
    });
    // två hyllplan med ryggar
    const rest = games.slice(f.fronts);
    rest.forEach((p, i) => {
      const row = Math.floor(i / f.spines), col = i % f.spines;
      if (row > 1) return;
      const px = 3 + col * 4, py = f.boards[row + 1] - COVER_BOX.h;
      x.drawImage(spineSprite(p, RES), px, py, 3, COVER_BOX.h);
    });
    if (!games.length) { const t = 'TOM HYLLA'; x.fillStyle = 'rgba(244,239,226,.85)'; x.fillRect(Math.round((f.W - textW(SMALL, t) - 8) / 2), 34, textW(SMALL, t) + 8, 9); ctxText(x, SMALL, t, Math.round((f.W - textW(SMALL, t)) / 2), 36, '#9e1b22'); }
    return c;
  }
  renderDesk(u) {
    const [c, x] = this.unitCanvas(u), f = u.frame, g = this.game, parts = g.deskParts?.() || {};
    if (parts.case) {
      // datorlådan i chassits färg ovanpå bordet, till vänster om skärmen
      const col = parts.case.look?.color || '#d8d0b8', W = f.W;
      const bx = Math.round(W * 0.62) - 42, by = 38 - 22;
      x.fillStyle = '#17151a'; x.fillRect(bx - 1, by - 1, 14, 23);
      x.fillStyle = col; x.fillRect(bx, by, 12, 21);
      x.fillStyle = 'rgba(255,255,255,.25)'; x.fillRect(bx, by, 12, 1); x.fillRect(bx, by, 1, 21);
      x.fillStyle = '#2a2d33'; x.fillRect(bx + 2, by + 3, 8, 2); x.fillRect(bx + 2, by + 7, 8, 1);
      x.fillStyle = Math.floor(this.t * 2) % 2 ? '#45e06a' : '#2f8f46'; x.fillRect(bx + 9, by + 16, 1, 1);
      if (parts.gpu?.rgb || parts.case.rgb) { x.fillStyle = css(hsl(this.t * 90, 0.9, 0.6)); x.fillRect(bx + 1, by + 11, 10, 1); }
      const label = 'SPELDATOR', tw = textW(SMALL, label) + 4;
      x.fillStyle = '#f4efe2'; x.fillRect(bx - 4, by + 22, tw, 7); ctxText(x, SMALL, label, bx - 2, by + 23, '#17151a');
    }
    return c;
  }

  // delarna som hör hemma i en monter: rätt kategori, rätt märke (märkesbås) och tillåtna att sälja;
  // en kategorihylla visar inte märken som har ett eget bås
  partsFor(u) {
    const g = this.game, F = this.shop.fit, def = u.def;
    const boothBrands = new Set((g.fit?.slots || []).filter((s) => s && s.kind === 'brand' && s.cat === def.cat).map((s) => s.brand));
    return this.owned().filter((p) => {
      if (p.cat !== def.cat || !g.canSell(p)) return false;
      const key = F ? F.brandKey(p) : null;
      return def.kind === 'brand' ? key === def.brand : !boothBrands.has(key);
    }).sort((a, b) => (b.cost || 0) - (a.cost || 0));
  }

  renderTower(u) {
    const { frame } = u, g = this.game, RES = this.RES, W = frame.W, H = frame.H;
    const c = document.createElement('canvas'); c.width = W * RES; c.height = H * RES;
    const x = c.getContext('2d'); x.setTransform(RES, 0, 0, RES, 0, 0); x.imageSmoothingEnabled = false;
    x.drawImage(frame.under, 0, 0);
    const parts = this.partsFor(u).slice(0, 3);
    parts.forEach((p, i) => {
      const bottom = frame.top + (i + 1) * frame.shelfH - 2, iw = 30, ih = 18;
      x.fillStyle = 'rgba(8,4,14,.45)'; x.fillRect(Math.round(W / 2 - iw * 0.3), bottom - 2, Math.round(iw * 0.6), 2);
      x.drawImage(this.icon(p, iw * RES, ih * RES), Math.round((W - iw) / 2), bottom - ih, iw, ih);
      const label = '×' + g.shownFree(p.id), tw = textW(SMALL, label) + 3;
      x.fillStyle = '#17151a'; x.fillRect(W - tw - 4, bottom - 7, tw + 2, 8); x.fillStyle = '#f4efe2'; x.fillRect(W - tw - 3, bottom - 6, tw, 6);
      ctxText(x, SMALL, label, W - tw - 2, bottom - 6, '#17151a');
    });
    if (!parts.length) { x.fillStyle = 'rgba(244,239,226,.85)'; x.fillRect(4, frame.top + frame.shelfH + 4, W - 8, 9); ctxText(x, SMALL, 'TOM', Math.round((W - textW(SMALL, 'TOM')) / 2), frame.top + frame.shelfH + 6, '#9e1b22'); }
    x.drawImage(frame.over, 0, 0);
    return c;
  }

  renderVitrine(u) {
    const { frame, slot: v } = u, g = this.game, W = frame.W, { GH, D } = PR.VIT, H = frame.H, HH = frame.HH || 0;
    const RES = this.RES;
    const c = document.createElement('canvas'); c.width = W * RES; c.height = H * RES;
    const x = c.getContext('2d'); x.setTransform(RES, 0, 0, RES, 0, 0); x.imageSmoothingEnabled = false;
    x.drawImage(frame.under, 0, 0);
    x.translate(0, HH);
    const parts = this.partsFor(u).slice(0, 6);
    const wide = W > 140;
    const [iw, ih] = wide ? [46, 30] : [34, 26];
    // upp till 3 i en rad, annars bakre rad (3) + främre rad förskjuten som tegel
    const n = parts.length, two = n > 3, cols = two ? 3 : Math.max(1, n), cell = (W - 8) / (two ? 3.5 : cols);
    const placed = parts.map((p, i) => {
      const r = two && i >= 3 ? 1 : 0, k = r ? i - 3 : i;
      const cx = two ? 4 + cell * (k + (r ? 1 : 0.5)) : 4 + (W - 8) * (k + 0.5) / cols;
      const bottom = GH + (two ? (r ? D - 3 : D * 0.5) : D * 0.78);
      return { p, cx, bottom };
    });
    for (const it of placed) {
      x.fillStyle = 'rgba(8,4,14,.45)';
      x.fillRect(Math.round(it.cx - iw * 0.3), Math.round(it.bottom - 3), Math.round(iw * 0.6), 2);
      x.drawImage(this.icon(it.p, iw * RES, ih * RES), Math.round(it.cx - iw / 2), Math.round(it.bottom - ih + 1), iw, ih);
    }
    for (const it of placed) {
      const label = '×' + g.shownFree(it.p.id), tw = textW(SMALL, label) + 3;
      const tx = Math.round(it.cx + iw * 0.18), ty = Math.round(it.bottom - 8);
      x.fillStyle = '#17151a'; x.fillRect(tx - 1, ty - 1, tw + 2, 9);
      x.fillStyle = '#f4efe2'; x.fillRect(tx, ty, tw, 7);
      ctxText(x, SMALL, label, tx + 2, ty + 1, '#17151a');
    }
    if (!parts.length) {
      const label = 'TOM MONTER', tw = textW(SMALL, label) + 8, tx = Math.round((W - tw) / 2), ty = GH + 12;
      x.fillStyle = 'rgba(8,4,14,.45)'; x.fillRect(tx + 2, ty + 2, tw, 11);
      x.fillStyle = '#f4efe2'; x.fillRect(tx, ty, tw, 11);
      x.fillStyle = '#c9323a'; x.fillRect(tx, ty, tw, 1); x.fillRect(tx, ty + 10, tw, 1);
      ctxText(x, SMALL, label, tx + 4, ty + 3, '#9e1b22');
    }
    x.translate(0, -HH);
    x.drawImage(frame.over, 0, 0);
    return c;
  }

  // rörligt på montrarna: demoskärmen på flaggskeppsmontern och pulsande ljus på belysta bås
  drawUnitFx(ctx, u) {
    const f = u.frame, t = this.t, RES = this.RES, shop = this.shop;
    // skärmar: attract-läge i skärmpixlar
    const screenAt = (sx, sy, sw, sh, kind) => {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      attractFrame(ctx, kind, (u.x + sx) * RES, (u.y + sy) * RES, sw * RES, sh * RES, t + u.i * 3.7);
      ctx.restore();
    };
    if (u.unit === 'arkad') { if (u.prod) { const s = cabinetScreen(u.prod); screenAt(s.x, s.y, s.w, s.h, u.prod.attract); } return; }
    if (u.unit === 'tv') {
      const cons = u.shownCons || [], top = cons[0];
      const game = top ? this.owned().find((p) => p.cat === 'spel' && p.platform === top.look.shape) || shop.products?.gamesFor(top.look.shape)[0] : null;
      const kind = !cons.length ? 'off' : game ? (ATTRACT_FOR_ENGINE[game.engine] || 'default') : 'default';
      if (kind === 'off') { ctx.fillStyle = '#0b0c10'; ctx.fillRect(u.x + f.screen.x, u.y + f.screen.y, f.screen.w, f.screen.h); if (Math.floor(t) % 2) { ctx.fillStyle = '#3a3a44'; ctx.fillRect(u.x + f.screen.x + 2, u.y + f.screen.y + f.screen.h - 3, 3, 1); } }
      else screenAt(f.screen.x, f.screen.y, f.screen.w, f.screen.h, kind);
      return;
    }
    if (u.unit === 'spelbord') {
      const s = f.screen;
      if (this.game.deskPc) {
        const parts = this.game.deskParts?.() || {}, y = this.game.year;
        const g = shop.parts.filter((p) => p.cat === 'spel' && p.platform === 'pc' && p.year <= y).sort((a, b) => b.year - a.year)[0];
        screenAt(s.x, s.y, s.w, s.h, g ? (ATTRACT_FOR_ENGINE[g.engine] || 'default') : 'default');
        return;
      }
      const msg = 'BYGG DIN DATOR  ', tw = textW(SMALL, msg), off = Math.round((t * 14) % tw);
      ctx.fillStyle = '#0b0c10'; ctx.fillRect(u.x + s.x, u.y + s.y, s.w, s.h);
      ctx.save(); ctx.beginPath(); ctx.rect(u.x + s.x, u.y + s.y, s.w, s.h); ctx.clip();
      ctxText(ctx, SMALL, msg + msg, u.x + s.x + 2 - off, u.y + s.y + Math.round(s.h / 2) - 2, Math.floor(t * 2) % 2 ? '#3fb04a' : '#8fd49a');
      ctx.restore();
      return;
    }
    if (u.unit) return;
    if (!f.brand || f.level < 2) return;
    const col = hex(f.brand.color, 0x76b900);
    if (f.level >= 3 && !f.tower) {
      // demoskärm uppe till höger på skylten
      const sx = u.x + f.W - 26, sy = u.y + 3, sw = 22, sh = PR.HEAD_H[3] - 8;
      ctx.fillStyle = '#0b0c10'; ctx.fillRect(sx, sy, sw, sh);
      const phase = (t * 0.5) % 3;
      if (phase < 1) { for (let i = 0; i < 4; i++) { ctx.fillStyle = css(hsl(t * 60 + i * 40, 0.9, 0.55)); ctx.fillRect(sx + 1 + i * 5, sy + 1 + Math.round(Math.sin(t * 3 + i) * 2) + 2, 4, sh - 6); } }
      else if (phase < 2) { const p = this.partsFor(u)[0]; if (p) ctx.drawImage(this.icon(p, 20 * this.RES, Math.max(1, (sh - 2) * this.RES)), sx + 1, sy + 1, 20, sh - 2); else { ctx.fillStyle = css(col); ctx.fillRect(sx + 2, sy + Math.round(sh / 2), sw - 4, 1); } }
      else { const name = String(f.brand.name).toUpperCase(), tw = textW(SMALL, name); const off = Math.round(((t * 18) % (tw + sw))); ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip(); ctxText(ctx, SMALL, name, sx + sw - off, sy + Math.round((sh - 5) / 2), css(mix(col, 0xffffff, 0.5))); ctx.restore(); }
      ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(sx, sy, sw, 1);
    }
    // pulsande led-list under skylten
    const a = 0.25 + 0.2 * Math.sin(t * 2.2 + u.i);
    ctx.globalAlpha = a; ctx.fillStyle = css(col);
    if (f.tower) ctx.fillRect(u.x + 1, u.y + f.HH, f.W - 2, 1); else ctx.fillRect(u.x + 2, u.y + (f.HH || 0) + 1, f.W - 4, 1);
    ctx.globalAlpha = 1;
  }

  renderShelf() {
    const shop = this.shop, g = this.game, S = SC.SHELF;
    const shown = new Set([...(shop.showcases || []).map((s) => s.cat), ...(shop.productCats || []), ...(shop.fit?.SHOWCASE_CATS || [])]);
    const cats = (shop.catOrder || Object.keys(shop.cats || {})).filter((c) => !shown.has(c)).slice(0, 6);
    const c = document.createElement('canvas'); c.width = S.x1 - S.x0; c.height = 60;
    const x = c.getContext('2d');
    const oy = 20, gw = (S.x1 - S.x0 - 8) / 3;
    const SIZE = { case: [10, 15], mb: [14, 10], psu: [11, 8], cooler: [9, 11], storage: [9, 6], fans: [11, 11] };
    cats.forEach((cat, i) => {
      const board = S.boards[i < 3 ? 0 : 1], gx = 4 + (i % 3) * gw;
      const col = shop.cats?.[cat]?.color || '#8a8f9c';
      x.fillStyle = col; x.fillRect(Math.round(gx + gw / 2 - 3), board + 2 - oy, 6, 2);
      const parts = this.owned().filter((p) => p.cat === cat).sort((a, b) => (b.cost || 0) - (a.cost || 0));
      const boxes = [];
      for (const p of parts) for (let n = 0; n < Math.min(2, g.shownFree(p.id)) && boxes.length < 3; n++) boxes.push(p);
      const [bw, bh] = SIZE[cat] || [10, 10];
      const span = bw + (boxes.length - 1) * Math.max(4, Math.min(bw - 2, (gw - 2 - bw) / Math.max(1, boxes.length - 1)));
      boxes.forEach((p, j) => {
        const L = p.look || {};
        const base = hex(L.color || L.pcb || L.fan || L.label || L.frame, hex(col, 0x8a8f9c));
        const bx = Math.round(gx + (gw - span) / 2 + j * (boxes.length > 1 ? (span - bw) / (boxes.length - 1) : 0)), by = board - bh - oy;
        x.fillStyle = css(mul(base, 0.55)); x.fillRect(bx - 1, by - 1, bw + 2, bh + 1);
        x.fillStyle = css(base); x.fillRect(bx, by, bw, bh);
        x.fillStyle = css(mix(base, 0xffffff, 0.35)); x.fillRect(bx, by, bw, 1); x.fillRect(bx, by, 1, bh);
        x.fillStyle = col; x.fillRect(bx, by + Math.round(bh * 0.55), bw, 2);
        x.fillStyle = '#f4f1ea'; x.fillRect(bx + 2, by + 2, 2, 2);
        x.fillStyle = css(mul(base, 0.7)); x.fillRect(bx + bw - 1, by + 1, 1, bh - 1);
      });
    });
    return c;
  }

  drawWallLife(ctx) {
    const t = this.t, [nx0, ny0, nx1, ny1] = SC.NEON_BOX;
    // neonskylt med flimmer
    const flick = (Math.sin(t * 23) > 0.985 || (t % 11) < 0.08) ? 0.55 : 0.93 + 0.07 * Math.sin(t * 3);
    ctx.globalAlpha = flick;
    const n = this.neon;
    ctx.drawImage(n.img, Math.round((nx0 + nx1 - n.img.width) / 2), Math.round((ny0 + ny1 - n.img.height) / 2) + 1);
    ctx.globalAlpha = (t % 7) < 0.15 ? 0.35 : 0.95;
    ctx.drawImage(this.open.img, 146 - (this.open.img.width >> 1), 21);
    ctx.globalAlpha = 1;
    if (this.shelfImg) ctx.drawImage(this.shelfImg, SC.SHELF.x0, 20);
    // klockan (riktig tid)
    const [cx, cy] = SC.CLOCK, now = new Date();
    const hand = (ang, len, col) => {
      ctx.fillStyle = col;
      for (let i = 1; i <= len; i++) ctx.fillRect(Math.round(cx + Math.sin(ang) * i), Math.round(cy - Math.cos(ang) * i), 1, 1);
    };
    const mins = now.getMinutes() + now.getSeconds() / 60;
    hand((now.getHours() % 12 + mins / 60) / 12 * Math.PI * 2, 4, '#17151a');
    hand(mins / 60 * Math.PI * 2, 6, '#3a3d48');
    hand(now.getSeconds() / 60 * Math.PI * 2, 5, '#c9323a');
    ctx.fillStyle = '#17151a'; ctx.fillRect(cx, cy, 1, 1);
    this.drawTv(ctx);
  }

  drawTv(ctx) {
    const [x0, y0, x1, y1] = SC.TV, w = x1 - x0, h = y1 - y0, t = this.t, scene = Math.floor(t / 5) % 3, lt = t % 5;
    for (let y = 0; y < h; y++) { ctx.fillStyle = css(mix(0x0c1030, scene === 1 ? 0x4a0f1c : 0x1f3a2a, y / h)); ctx.fillRect(x0, y0 + y, w, 1); }
    if (scene === 0 && this.heroPart) {
      const ic = this.icon(this.heroPart, 30 * this.RES, 20 * this.RES), sx = Math.round(x0 + w / 2 - 15 + Math.max(0, 1 - lt * 1.5) * 30);
      ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
      ctx.drawImage(ic, sx, y0 + 1, 30, 20);
      ctx.restore();
      const title = this.heroTitle.split(' ').slice(0, 2).join(' ');
      ctxText(ctx, SMALL, title, x0 + Math.round((w - textW(SMALL, title)) / 2), y1 - 7, lt % 0.8 < 0.6 ? '#76ff4a' : '#ffffff');
    } else if (scene === 1) {
      const on = lt % 0.7 < 0.5;
      ctxText(ctx, BIG, 'REA', x0 + Math.round((w - textW(BIG, 'REA')) / 2), y0 + 5, on ? '#ffd23a' : '#ff6a6a');
      ctxText(ctx, SMALL, 'BYGG DIN PC', x0 + Math.round((w - textW(SMALL, 'BYGG DIN PC')) / 2), y0 + 17, '#ffffff');
    } else {
      const txt = (this.shop.sign || '') + '   ', tw = textW(SMALL, txt);
      const off = Math.round((lt * 22) % (tw + 4));
      ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.clip();
      ctxText(ctx, SMALL, txt + txt, x0 + 2 - off, y0 + 11, '#7ee8fa');
      ctx.restore();
      for (let i = 0; i < 5; i++) { ctx.fillStyle = css(hsl(t * 90 + i * 60, 0.9, 0.6)); ctx.fillRect(x0 + 6 + i * 8, y0 + 4, 5, 2); }
    }
    ctx.fillStyle = 'rgba(255,255,255,.10)'; ctx.fillRect(x0, y0, w, 1);
    for (let y = y0; y < y1; y += 2) { ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(x0, y, w, 1); }
  }

  drawDoor(ctx) {
    const { x0, x1 } = LY.DOOR, y0 = 26, y1 = LY.WALL_Y, half = (x1 - x0) / 2;
    const e = this.door * this.door * (3 - 2 * this.door), open = Math.round(e * (half - 3));
    ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
    const panel = (px, flipH) => {
      const pw = Math.ceil(half);
      ctx.fillStyle = 'rgba(214,236,255,.2)'; ctx.fillRect(px, y0, pw, y1 - y0);
      ctx.fillStyle = 'rgba(255,255,255,.28)';
      for (let y = y0; y < y1; y++) { const k = (y - y0) % 38; if (k < 14) ctx.fillRect(px + ((y * 1) % pw + (flipH ? 9 : 3)) % pw, y, k < 11 ? 2 : 1, 1); }
      ctx.fillStyle = '#3b4150'; ctx.fillRect(px, y0, pw, 2); ctx.fillRect(px, y1 - 3, pw, 3); ctx.fillRect(px, y0, 2, y1 - y0); ctx.fillRect(px + pw - 2, y0, 2, y1 - y0);
      ctx.fillStyle = '#6d7486'; ctx.fillRect(px, y0, pw, 1); ctx.fillRect(px, y0, 1, y1 - y0);
      ctx.fillStyle = '#c8ccd6'; ctx.fillRect(flipH ? px + 4 : px + pw - 6, y0 + 22, 2, 14);
      ctx.fillStyle = '#e8b230'; ctx.fillRect(px + 2, y0 + 38, pw - 4, 1);
    };
    panel(x0 - open, false);
    panel(x0 + Math.floor(half) + open, true);
    // öppettider-dekal
    ctx.fillStyle = '#f4f1ea'; ctx.fillRect(x0 - open + 6, y0 + 8, 11, 12);
    ctx.fillStyle = '#9aa0aa'; for (let i = 0; i < 4; i++) ctx.fillRect(x0 - open + 8, y0 + 10 + i * 2, 7, 1);
    ctx.restore();
  }

  drawCounter(ctx) {
    const c = this.counter, t = this.t;
    ctx.drawImage(c.img, c.x, c.y);
    // demodatorns rgb-fläktar
    for (const [fx, fy, ph] of [[386, 101, 0], [386, 114, 120]]) {
      for (let a = 0; a < 8; a++) {
        const ang = a / 8 * Math.PI * 2;
        ctx.fillStyle = css(hsl(t * 120 + ph + a * 45, 0.95, 0.6));
        ctx.fillRect(Math.round(fx + Math.cos(ang) * 4), Math.round(fy + Math.sin(ang) * 4), 1, 1);
      }
      ctx.fillStyle = '#2a2d33'; ctx.fillRect(fx - 1, fy - 1, 3, 3);
      const sp = t * 12;
      ctx.fillStyle = '#5a5f6a'; ctx.fillRect(Math.round(fx + Math.cos(sp) * 2), Math.round(fy + Math.sin(sp) * 2), 1, 1);
    }
    ctx.fillStyle = css(hsl(t * 120, 0.9, 0.55)); ctx.fillRect(381, 94, 1, 26);
    // extra kassa (prylen "extra kassadisk")
    if (this.game.fit?.items?.kassa2) {
      ctx.fillStyle = '#23262b'; ctx.fillRect(337, 104, 18, 13); ctx.fillStyle = '#3c78d8'; ctx.fillRect(338, 105, 16, 10); ctx.fillStyle = '#7fb0f0'; ctx.fillRect(338, 105, 16, 1);
      ctx.fillStyle = '#dfefff'; ctx.fillRect(340, 107, 7, 1); ctx.fillStyle = '#45b964'; ctx.fillRect(340, 111, 5, 2); ctx.fillStyle = '#2a2d33'; ctx.fillRect(340, 122, 12, 3); ctx.fillStyle = '#3a3d44'; ctx.fillRect(345, 117, 2, 5);
    }
    // färdiga datorer som väntar på upphämtning
    const ready = this.game.customers.filter((x) => x.phase === 'ready').length;
    for (let i = 0; i < Math.min(3, ready); i++) {
      const bx = 428 + i * 22, by = 98;
      ctx.fillStyle = '#17151a'; ctx.fillRect(bx - 1, by - 1, 20, 25);
      ctx.fillStyle = '#c9a36b'; ctx.fillRect(bx, by + 4, 18, 19);
      ctx.fillStyle = '#e0c08a'; ctx.fillRect(bx, by, 18, 4);
      ctx.fillStyle = '#9e7a48'; ctx.fillRect(bx + 16, by + 4, 2, 19);
      ctx.fillStyle = '#2c6fb7'; ctx.fillRect(bx + 3, by + 9, 11, 7);
      ctx.fillStyle = '#7ee8fa'; ctx.fillRect(bx + 5, by + 11, 3, 3);
      ctx.fillStyle = '#e8b230'; ctx.fillRect(bx, by + 2, 18, 1);
    }
  }

  drawHero(ctx) {
    const B = PR.HERO_BOX, t = this.t, x = LY.HERO.cx - B.ax, y = LY.HERO.base - B.ay;
    const [c0, ct, c1, cb] = B.cube;
    const hue = (t * 70) % 360;
    // färgat sken bakom kuben
    for (let r = 4; r >= 1; r--) {
      ctx.fillStyle = css(hsl(hue + r * 20, 0.95, 0.6));
      ctx.globalAlpha = 0.07 * (5 - r);
      ctx.fillRect(x + c0 - r, y + ct - 3 - r, c1 - c0 + r * 2, cb - ct + 3 + r * 2);
    }
    ctx.globalAlpha = 1;
    ctx.drawImage(this.heroUnder, x, y);
    // rgb-ljus på kubens botten
    const floorY = y + cb - 9;
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = css(hsl(hue + i * 12, 1, 0.55));
      ctx.globalAlpha = 0.18 - i * 0.03;
      ctx.fillRect(x + c0 + 4 + i * 3, floorY - i, c1 - c0 - 8 - i * 6, 4 + i * 2);
    }
    ctx.globalAlpha = 1;
    if (this.heroIcon) {
      const bob = Math.round(Math.sin(t * 1.6) * 1.2);
      ctx.drawImage(this.heroIcon, x + Math.round((c0 + c1 - 78) / 2), y + cb - 52 - 3 + bob, 78, 52);
    }
    ctx.drawImage(this.heroOver, x, y);
    // kanter i rgb
    ctx.fillStyle = css(hsl(hue, 1, 0.62));
    ctx.globalAlpha = 0.75;
    ctx.fillRect(x + c0, y + ct + B.cubeD, 1, cb - ct - B.cubeD); ctx.fillRect(x + c1 - 1, y + ct + B.cubeD, 1, cb - ct - B.cubeD);
    ctx.fillRect(x + c0, y + cb - 1, c1 - c0, 1);
    ctx.globalAlpha = 1;
    // ljussvep över glaset
    const cycle = t % 4.5;
    if (cycle < 0.9) {
      const k = cycle / 0.9, sweep = x + c0 - 50 + k * (c1 - c0 + 100);
      ctx.save(); ctx.beginPath(); ctx.rect(x + c0 + 1, y + ct, c1 - c0 - 2, cb - ct); ctx.clip();
      for (let yy = y + ct; yy < y + cb; yy++) {
        const sx = Math.round(sweep - (yy - y - ct) * 0.8);
        ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(sx, yy, 4, 1);
        ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(sx + 7, yy, 2, 1);
      }
      ctx.restore();
    }
    // gnistor
    for (const [sx, sy, ph] of [[c0 - 3, ct - 4, 0], [c1 + 2, ct + 20, 2.1], [c0 + 8, cb - 6, 4.2]]) {
      const a = Math.max(0, Math.sin(t * 2.3 + ph));
      if (a < 0.2) continue;
      ctx.globalAlpha = a;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + sx, y + sy - 2, 1, 5); ctx.fillRect(x + sx - 2, y + sy, 5, 1);
      ctx.globalAlpha = 1;
    }
    // led-list i podiet
    const [p0, , p1, pb] = B.ped;
    for (let i = p0 + 2; i < p1 - 2; i++) { ctx.fillStyle = css(hsl(hue - i * 6, 1, 0.58)); ctx.fillRect(x + i, y + pb - 5, 1, 2); }
  }

  // Kartong från grossisten med etikett: antal delar och kategoriernas färger
  drawBox(ctx, d, x, y) {
    const shop = this.shop, INK = '#17151a';
    const x0 = Math.round(x - 12), y0 = Math.round(y - 20), w = 24, h = 20;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x0 + 2, y0 + h - 2, w + 2, 4);
    ctx.fillStyle = INK; ctx.fillRect(x0 - 1, y0 - 1, w + 2, h + 2);
    ctx.fillStyle = '#c9a36b'; ctx.fillRect(x0, y0 + 5, w, h - 5);
    ctx.fillStyle = '#e0c08a'; ctx.fillRect(x0, y0, w, 5);
    ctx.fillStyle = '#9e7a48'; ctx.fillRect(x0 + w - 3, y0 + 5, 3, h - 5); ctx.fillRect(x0, y0 + 5, w, 1);
    ctx.fillStyle = '#d8b67a'; ctx.fillRect(x0 + w / 2 - 2, y0, 4, 5);           // tejp
    ctx.fillStyle = '#b89058'; ctx.fillRect(x0 + w / 2 - 2, y0 + 5, 4, 3);
    // etikett
    const items = Object.entries(d.items), count = items.reduce((s, [, n]) => s + n, 0);
    ctx.fillStyle = '#f4f1ea'; ctx.fillRect(x0 + 3, y0 + 9, 16, 9);
    ctx.fillStyle = '#c9c3b4'; ctx.fillRect(x0 + 3, y0 + 17, 16, 1);
    const cats = [...new Set(items.map(([id]) => shop.part[id]?.cat).filter(Boolean))].slice(0, 4);
    cats.forEach((cat, i) => { ctx.fillStyle = shop.cats?.[cat]?.color || '#888'; ctx.fillRect(x0 + 4 + i * 3, y0 + 10, 2, 2); });
    ctxText(ctx, SMALL, String(count), x0 + 5, y0 + 12, INK);
    if (Math.floor(this.t * 2) % 2 && this.hoverBox !== d.id) { ctx.fillStyle = '#e8b230'; ctx.fillRect(x0 + w - 5, y0 - 5, 4, 4); ctx.fillStyle = INK; ctx.fillRect(x0 + w - 4, y0 - 4, 2, 2); }
  }
  drawBoxTip(ctx, d, x, y) {
    const shop = this.shop, INK = '#17151a';
    const lines = Object.entries(d.items).map(([id, n]) => `${n}× ${(shop.part[id]?.name || id).toUpperCase()}`.slice(0, 26));
    const shown = lines.slice(0, 6);
    if (lines.length > 6) shown.push(`+${lines.length - 6} TILL`);
    const head = 'FRÅN GROSSISTEN: TRYCK FÖR ATT PACKA UPP';
    const w = Math.max(textW(SMALL, head), ...shown.map((l) => textW(SMALL, l))) + 8, h = 9 + shown.length * 7 + 4;
    const bx = Math.max(2, Math.min(FW - w - 2, Math.round(x - w / 2))), by = Math.max(LY.WALL_Y - 30, Math.round(y - 28 - h));
    ctx.fillStyle = INK; ctx.fillRect(bx - 1, by - 1, w + 2, h + 2);
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(bx, by, w, h);
    ctx.fillStyle = '#c9a36b'; ctx.fillRect(bx, by, w, 8);
    ctxText(ctx, SMALL, head, bx + 4, by + 2, INK);
    shown.forEach((l, i) => ctxText(ctx, SMALL, l, bx + 4, by + 11 + i * 7, INK));
  }
  drawNameTags(ctx) {
    if (this.players.length < 2) return;
    for (const pl of this.players) {
      if (pl.away) continue;
      const name = (pl.name || '?').toUpperCase().slice(0, 12), w = textW(SMALL, name) + 4;
      const x = Math.round(pl.x - w / 2), y = Math.round(pl.y - (pl.look?.kid ? 40 : 50));
      ctx.fillStyle = '#17151a'; ctx.fillRect(x - 1, y - 1, w + 2, 9);
      ctx.fillStyle = pl.color || '#7ee8fa'; ctx.fillRect(x, y, w, 7);
      ctxText(ctx, SMALL, name, x + 2, y + 1, '#17151a');
    }
    // spelare i verkstaden: skylt vid dörren
    const away = this.players.filter((p) => p.away === 'workshop');
    away.forEach((pl, i) => {
      const x = 454 + i * 9, y = 88;
      ctx.fillStyle = '#17151a'; ctx.fillRect(x - 1, y - 1, 8, 8);
      ctx.fillStyle = pl.color || '#7ee8fa'; ctx.fillRect(x, y, 6, 6);
      ctx.fillStyle = '#17151a'; ctx.fillRect(x + 2, y + 1, 2, 4); ctx.fillRect(x + 1, y + 1, 4, 1);
    });
  }
  drawVan(ctx, v) {
    const x = Math.round(v.x), y = 44;
    ctx.fillStyle = '#17151a'; ctx.fillRect(x - 1, y - 1, 38, 18);
    ctx.fillStyle = '#e8e3d6'; ctx.fillRect(x, y, 26, 14);
    ctx.fillStyle = '#c9323a'; ctx.fillRect(x, y + 7, 26, 3);
    ctx.fillStyle = '#e8e3d6'; ctx.fillRect(x + 26, y + 4, 10, 10);
    ctx.fillStyle = '#9fc7e0'; ctx.fillRect(x + 28, y + 5, 6, 4);
    ctx.fillStyle = '#c9a36b'; ctx.fillRect(x + 4, y + 2, 6, 4); ctx.fillStyle = '#e0c08a'; ctx.fillRect(x + 4, y + 2, 6, 1);
    for (const wx of [6, 29]) { ctx.fillStyle = '#1b1b1f'; ctx.fillRect(x + wx - 2, y + 13, 5, 4); ctx.fillStyle = '#9a9ea6'; ctx.fillRect(x + wx, y + 14, 1, 1); }
  }

  drawBubble(ctx, c) {
    const t = this.t, x = Math.round(c.x), kid = c.look && c.look.kid;
    const head = Math.round(c.y) - (kid ? 29 : 38) + (c._sit ? 4 : 0);
    const INK = '#17151a';
    if (this.clickable(c) && !c.moving) {
      const bob = Math.round(Math.sin(t * 6) * 1.5), by = head - 21 + bob;
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - 7, by + 2, 17, 17);
      ctx.fillStyle = INK; ctx.fillRect(x - 9, by, 17, 17); ctx.fillRect(x - 2, by + 17, 3, 2); ctx.fillRect(x - 1, by + 19, 1, 1);
      ctx.fillStyle = '#e8b230'; ctx.fillRect(x - 8, by + 1, 15, 15); ctx.fillRect(x - 1, by + 16, 1, 2);
      ctx.fillStyle = '#ffe28a'; ctx.fillRect(x - 8, by + 1, 15, 2); ctx.fillRect(x - 8, by + 1, 2, 15);
      ctx.fillStyle = '#b88418'; ctx.fillRect(x - 8, by + 14, 15, 2);
      ctx.fillStyle = INK; ctx.fillRect(x - 2, by + 4, 3, 7); ctx.fillRect(x - 2, by + 12, 3, 2);
    } else if (c.phase === 'queue' && !c.moving) {
      const bx = x + 7, by = head - 4;
      ctx.fillStyle = INK; ctx.fillRect(bx, by, 17, 10); ctx.fillRect(bx - 2, by + 7, 3, 2);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(bx + 1, by + 1, 15, 8); ctx.fillRect(bx - 1, by + 7, 2, 1);
      ctx.fillStyle = INK;
      for (let i = 0; i < 3; i++) if (Math.floor(t * 2.5 + c.id) % 4 > i) ctx.fillRect(bx + 3 + i * 4, by + 4, 2, 2);
    }
    // produktkunder: en liten bubbla med det de vill ha
    if (c.order?.product && (c.phase === 'queue' || c.phase === 'arriving') && !c.moving && !(this.clickable(c))) {
      const p = this.shop.part[c.order.product], label = (p ? (PLATE[p.look?.shape] || p.name.toUpperCase().slice(0, 9)) : '?') + '?';
      const w = textW(SMALL, label) + 6, bx = x - Math.round(w / 2), by = head - 18;
      ctx.fillStyle = INK; ctx.fillRect(bx - 1, by - 1, w + 2, 10); ctx.fillRect(x - 1, by + 9, 3, 2);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(bx, by, w, 8); ctx.fillRect(x, by + 8, 1, 2);
      ctxText(ctx, SMALL, label, bx + 3, by + 2, INK);
    }
    if ((c.phase === 'queue' || c.phase === 'waiting') && isFinite(c.patienceMax) && !c.moving) {
      const f = Math.max(0, Math.min(1, c.patience / c.patienceMax));
      const px = x - 17, py = head + 2, ph = 20;
      ctx.fillStyle = INK; ctx.fillRect(px, py, 6, ph + 2);
      ctx.fillStyle = '#3a3440'; ctx.fillRect(px + 1, py + 1, 4, ph);
      const hh = Math.round(ph * f);
      ctx.fillStyle = f > 0.5 ? '#45b964' : f > 0.25 ? '#e8b230' : '#e0474f';
      ctx.fillRect(px + 1, py + 1 + ph - hh, 4, hh);
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(px + 1, py + 1 + ph - hh, 1, hh);
    }
    if (c.phase === 'waiting' && !c.moving) {
      const bx = x - 7, by = head - 14 + Math.round(Math.sin(t * 2 + c.id) * 0.8);
      ctx.fillStyle = INK; ctx.fillRect(bx, by, 15, 12); ctx.fillRect(bx + 6, by + 12, 3, 2);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(bx + 1, by + 1, 13, 10); ctx.fillRect(bx + 7, by + 11, 1, 2);
      ctx.fillStyle = '#3a3d48'; ctx.fillRect(bx + 3, by + 3, 9, 5); ctx.fillRect(bx + 6, by + 8, 3, 1);
      ctx.fillStyle = Math.floor(t * 2) % 2 ? '#7ee8fa' : '#45b964'; ctx.fillRect(bx + 4, by + 4, 7, 3);
    }
    if (c.mood && c.bubbleT > 0) {
      const y = head - 10 - Math.round((3 - c.bubbleT) * 5);
      if (c.mood === 'happy') {
        ctx.fillStyle = INK; ctx.fillRect(x - 6, y - 1, 5, 4); ctx.fillRect(x + 1, y - 1, 5, 4); ctx.fillRect(x - 7, y + 1, 14, 4); ctx.fillRect(x - 5, y + 5, 10, 2); ctx.fillRect(x - 3, y + 7, 6, 2); ctx.fillRect(x - 1, y + 9, 2, 1);
        ctx.fillStyle = '#e23b5a'; ctx.fillRect(x - 5, y, 3, 3); ctx.fillRect(x + 2, y, 3, 3); ctx.fillRect(x - 6, y + 2, 12, 3); ctx.fillRect(x - 4, y + 5, 8, 2); ctx.fillRect(x - 2, y + 7, 4, 2);
        ctx.fillStyle = '#ff9aae'; ctx.fillRect(x - 5, y + 1, 1, 1);
      }
      if (c.mood === 'sad') { ctx.fillStyle = INK; ctx.fillRect(x - 3, y - 1, 6, 9); ctx.fillStyle = '#58a6c9'; ctx.fillRect(x - 1, y, 2, 2); ctx.fillRect(x - 2, y + 2, 4, 5); ctx.fillStyle = '#bfe6f5'; ctx.fillRect(x - 1, y + 3, 1, 1); }
      if (c.mood === 'angry') {
        ctx.fillStyle = '#c9323a';
        for (const [dx, dy] of [[-6, 0], [4, 0], [-6, 6], [4, 6]]) { ctx.fillRect(x + dx, y + dy, 3, 1); ctx.fillRect(x + dx + (dx < 0 ? 2 : 0), y + dy + (dy ? -1 : 1), 1, 2); }
      }
    }
  }
}

// korta namn på skyltarna under konsolerna
const PLATE = { atari2600: 'ATARI', c64: 'C64', amiga500: 'AMIGA', nes: 'NES', sms: 'MASTER', gameboy: 'G.BOY', megadrive: 'MEGA D', gamegear: 'G.GEAR', neogeo: 'NEOGEO', snes: 'SNES', playstation: 'PS1', saturn: 'SATURN', n64: 'N64', gbc: 'GBC', dreamcast: 'DREAMC', ps2: 'PS2', gba: 'GBA', gamecube: 'G.CUBE', xbox: 'XBOX', ds: 'DS', psp: 'PSP', xbox360: 'X360', wii: 'WII', ps3: 'PS3', '3ds': '3DS', wiiu: 'WII U', ps4: 'PS4', xboxone: 'XB ONE', switch: 'SWITCH', quest2: 'QUEST', ps5: 'PS5', seriesx: 'SERIES', steamdeck: 'DECK', switch2: 'SW 2' };

// "ASUS ROG Astral GeForce RTX 5080 OC" → ["RTX 5080 OC", "ASUS ROG ASTRAL"]
function heroTitle(name) {
  const up = name.toUpperCase().replace(/[()]/g, ' ');
  const stop = new Set(['GRAPHICS', 'CARD', 'ADAPTER', 'DISPLAY', 'AND', 'PRINTER', 'THE', 'VIDEO', 'BOARD', 'BLASTER', 'NVIDIA', 'GEFORCE', 'AMD', 'RADEON', 'ATI', 'EDITION']);
  const clean = (t) => t.split(/\s+/).filter((w) => w && !stop.has(w)).join(' ');
  const pats = [
    /\b(RTX|GTX|GTS|GT|RX|ARC)\s*[A-Z]?\d{3,4}\w*(\s+(XTX|XT|TI|SUPER|OC|ULTRA|GRE))*/,
    /\b(HD|R9|R7|X|FX)\s*\d{3,4}\w*(\s+(XT|PRO|GTO|ULTRA))?/,
    /\b\d{4}\s+(PRO|XT|SE|LE)\b/,
    /\b(VOODOO\s*\d?|RIVA\s+TNT\d?|RADEON\s+\d{4}\w*(\s+(PRO|XT))?|G\d{3}(\s+MAX)?|MYSTIQUE|PARHELIA|VERITE\s*\w*|GEFORCE\s*\d?\s*\w+)/,
  ];
  for (const re of pats) {
    const m = up.match(re);
    if (m && m[0].trim().length <= 12) return [m[0].trim(), (clean(up.slice(0, m.index)) || up.slice(0, m.index).trim() || clean(up.slice(m.index + m[0].length))).slice(0, 18)];
  }
  // äldre kort: förkortningen och tillverkaren
  const ACR = [[/ENHANCED GRAPHICS ADAPTER/, 'EGA'], [/COLOR GRAPHICS ADAPTER/, 'CGA'], [/MONOCHROME DISPLAY/, 'MDA'], [/VIDEO GRAPHICS ARRAY/, 'VGA']];
  const words = up.split(/\s+/).filter(Boolean), keep = words.filter((w) => !stop.has(w));
  for (const [re, t] of ACR) if (re.test(up)) return [t, (keep[0] || '').slice(0, 18)];
  const brand = keep[0] || words[0] || '', model = keep.slice(1).join(' ');
  if (model && model.length <= 12) return [model, brand.slice(0, 18)];
  if (brand.length <= 12) return [brand, model.slice(0, 18)];
  return [(keep.slice(-1)[0] || 'STJÄRNAN').slice(0, 12), brand.slice(0, 18)];
}

// neonrör: kärna + glöd, förrenderat
function neonSign(textStr, color, scale, pad) {
  const w = textW(BIG, textStr, scale) + pad * 2, h = (BIG.h + 2) * scale + pad * 2;
  const mask = new Uint8Array(w * h);
  eachTextPixel(BIG, textStr, pad, pad + 2 * scale, scale, (x, y) => { if (x >= 0 && y >= 0 && x < w && y < h) mask[y * w + x] = 1; });
  const P = new Pix(w, h);
  const core = mix(color, 0xffffff, 0.6);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (mask[y * w + x]) { P.px(x, y, core); continue; }
    let d = 99;
    for (let yy = Math.max(0, y - pad); yy <= Math.min(h - 1, y + pad); yy++) for (let xx = Math.max(0, x - pad); xx <= Math.min(w - 1, x + pad); xx++) {
      if (mask[yy * w + xx]) d = Math.min(d, Math.hypot(xx - x, yy - y));
    }
    if (d <= 1.01) P.px(x, y, color, 0.95);
    else if (d < pad + 0.5) { const a = 0.5 * Math.pow(1 - (d - 1) / pad, 1.6); if (bayer(x, y) < 0.85) P.px(x, y, color, a); }
  }
  return { img: P.flush() };
}

// svaga ljuskäglor från taket (adderas)
function makeBeams() {
  const P = new Pix(FW, FH);
  const beam = (sx, y0, y1, w0, w1, a0) => {
    for (let y = y0; y < y1; y++) {
      const t = (y - y0) / (y1 - y0), half = (w0 + (w1 - w0) * t) / 2, a = a0 * Math.sin(Math.PI * Math.min(1, t * 1.15)) * Math.min(1, t * 2.5);
      for (let x = Math.floor(sx - half); x <= sx + half; x++) {
        const e = 1 - Math.abs(x - sx) / half;
        if (bayer(x, y) < Math.min(1, e * 2.2)) P.px(x, y, 0x3a3222, a * 2.4);
      }
    }
  };
  beam(LY.HERO.cx, 96, LY.HERO.base - 8, 40, 118, 0.3);
  return P.flush();
}
