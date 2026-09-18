// Co-op: håller värdens och klienternas spel i takt.
//
// Värden kör spelet (kunder, pengar, lager, beställningar) och skickar läget:
//   econ    pengar, år, lager, skyltning, lådor (när något ändrats)
//   orders  beställningarna (utan byggen)
//   cust    kunder som är nya för klienten (utseende + beställning)
//   tick    10 ggr/s: kundernas och spelarnas positioner
//   players spelarlistan med utseenden
//   bop     en byggoperation från någon spelare
//   bsnap   hela bygget (när man kliver in i verkstaden)
//   cur     en spelares muspekare i verkstaden
//   toast / ev  meddelanden och händelser (låda, nytt år)
// Klienten skickar: hello, cmd, pos, bop, breq, cur.
import { runCommand } from './session.js';
import { serializeBuild, deserializeBuild } from './build-ops.js';

const DIRS = ['down', 'up', 'left', 'right'];
const PHASES = ['arriving', 'queue', 'waiting', 'ready', 'leaving'];
export const PLAYER_COLORS = ['#7ee8fa', '#f5c542', '#ff7ab6', '#8be36b', '#b58cff', '#ff9a4d'];

export function econSnap(g) {
  return {
    money: g.money, xp: g.xp, stock: g.stock, shown: g.shown, stats: g.stats, tutorialStep: g.tutorialStep, startYear: g.startYear, fit: g.fit, demand: g.demand, deskPc: g.deskPc, models: g.models, events: g.events, bulk: g.bulk, staff: g.staff, staffing: g.staffing, rival: g.rival, years: g.years, awards: g.awards, supplier: g.supplier, partners: g.partners,
    deliveries: g.deliveries.map((d) => ({ id: d.id, items: d.items, state: d.state, left: Math.max(0, (d.eta ?? 0) - g.time) })),
    start: g.startInfo ? { template: g.startInfo.template, builds: (g.startInfo.builds || []).map((b) => (b || []).map((p) => p.id)) } : null,
  };
}
export function applyEcon(g, e) {
  Object.assign(g, { money: e.money, xp: e.xp, stock: e.stock, shown: e.shown, stats: e.stats, tutorialStep: e.tutorialStep, startYear: e.startYear });
  if (e.fit) { const before = JSON.stringify(g.fit); g.fit = g.cleanFit(e.fit); if (JSON.stringify(g.fit) !== before) g.emit('fit'); }
  if (e.demand) g.demand = e.demand;
  if (e.models) g.models = e.models;
  if (e.events) g.events = e.events;
  if (e.bulk) g.bulk = e.bulk;
  if (e.staff) g.staff = e.staff;
  if (e.staffing) g.staffing = e.staffing;
  if (e.rival) g.rival = e.rival;
  if (e.years) g.years = e.years;
  if (e.awards) g.awards = e.awards;
  if (e.supplier) g.supplier = e.supplier;
  if (e.partners) g.partners = e.partners;
  if (e.deskPc !== undefined) { const before = JSON.stringify(g.deskPc); g.deskPc = e.deskPc; if (JSON.stringify(e.deskPc) !== before) g.emit('fit'); }
  g.deliveries = e.deliveries.map((d) => ({ ...d, eta: g.time + d.left }));
  if (e.start) g.startInfo = { template: e.start.template, builds: e.start.builds.map((ids) => ids.map((id) => g.shop.part[id]).filter(Boolean)) };
}
const orderSnap = (o) => ({ id: o.id, customerId: o.customerId, template: o.template, title: o.title, name: o.name, msg: o.msg, items: o.items, guided: o.guided, tutorial: o.tutorial, year: o.year, reserved: o.reserved, chosen: o.chosen, startedAt: o.startedAt, staff: o.staff, touched: o.touched, model: o.model, price: o.price, fee: o.fee, service: o.service, serviceT: o.serviceT, opts: o.opts });
const custFull = (c) => ({ id: c.id, name: c.name, look: c.look, order: c.order, phase: c.phase, patience: isFinite(c.patience) ? c.patience : -1, patienceMax: isFinite(c.patienceMax) ? c.patienceMax : -1, x: c.x, y: c.y, dir: c.dir });
const num = (v) => (v === -1 ? Infinity : v);

// ---------- Värden ----------
export class CoopHost {
  constructor(net, app) {
    this.net = net; this.app = app;
    this.players = new Map();   // peerId → { id, name, look, color }
    this.known = new Map();     // peerId → Set(kund-id) som klienten fått
    this.tickT = 0; this.econDirty = true; this.ordersDirty = true; this.econT = 0;
    net.on('peer-join', (m, from) => { this.known.set(from, new Set()); });
    net.on('hello', (m, from) => this.hello(m, from));
    net.on('peer-leave', (m, from) => this.leave(from));
    net.on('cmd', (m, from) => this.cmd(m, from));
    net.on('pos', (m, from) => this.pos(m, from));
    net.on('bop', (m, from) => this.bop(m, from));
    net.on('breq', (m, from) => this.breq(m, from));
    net.on('cur', (m, from) => { this.app.build?.remoteCursor?.(from, m, this.playerInfo(from)); this.net.broadcast({ ...m, from }, from); });
    net.on('ping', (m, from) => this.seen.set(from, Date.now()));
    net.on('chat', (m, from) => {
      const text = String(m.text || '').slice(0, 80);
      if (!text || !this.players.has(from)) return;
      this.net.broadcast({ t: 'chat', from, text }, from);
      this.app.onChat?.(from, text);
    });
    net.on('bye', (m, from) => { this.net.drop(from); this.leave(from); });
    net.on('err', (m, from) => { const p = this.players.get(from); this.app.toast?.(`⚠️ ${p?.name || 'En spelare'} fick ett fel: ${String(m.msg).slice(0, 80)}`, 'bad'); });
    // spelare som inte hörts av på länge (stängd flik, tappad uppkoppling) tas bort
    this.seen = new Map();
    this.timer = setInterval(() => {
      const now = Date.now();
      this.net.broadcast({ t: 'ping' });
      for (const id of [...this.players.keys()]) {
        if (now - (this.seen.get(id) || now) > 12000) { this.net.drop(id); this.leave(id, 'tappade kontakten'); }
      }
    }, 2000);
  }
  close() { clearInterval(this.timer); }
  get game() { return this.app.game; }
  playerInfo(id) { return id === 'host' ? this.app.me() : this.players.get(id); }
  nextColor() {
    const used = new Set([this.app.me().color, ...[...this.players.values()].map((p) => p.color)]);
    return PLAYER_COLORS.find((c) => !used.has(c)) || PLAYER_COLORS[this.players.size % PLAYER_COLORS.length];
  }
  playerList() {
    const me = this.app.me();
    return [{ id: 'host', name: me.name, look: me.look, color: me.color, host: true }, ...[...this.players.values()]];
  }
  hello(m, from) {
    this.seen.set(from, Date.now());
    // samma webbläsare som anslöt igen: ta bort den gamla anslutningen
    for (const [id, p] of this.players) if (m.pid && p.pid === m.pid && id !== from) { this.net.drop(id); this.leave(id, null); }
    let color = m.color;
    if (!color || [this.app.me().color, ...[...this.players.values()].map((p) => p.color)].includes(color)) color = this.nextColor();
    const clean = this.app.clean ? this.app.clean({ name: m.name, look: m.look, color }) : m;
    const taken = new Set([this.app.me().name, ...[...this.players.values()].map((x) => x.name)].map((n) => String(n).toLowerCase()));
    let name = String(clean.name || '').trim().slice(0, 12) || 'Kompis';
    for (let n = 2; taken.has(name.toLowerCase()); n++) name = `${String(clean.name || 'Kompis').slice(0, 9)} ${n}`;
    const p = { id: from, pid: m.pid || null, name, look: clean.look, color: clean.color || color };
    this.players.set(from, p);
    this.known.set(from, new Set());
    this.app.onPlayers?.(this.playerList());
    this.net.broadcast({ t: 'players', list: this.playerList() });
    if (this.game) {
      this.welcome(from);
      // syns direkt i dörren medan kompisen laddar
      const f = this.app.floor;
      if (f && !f.players.some((x) => x.id === from)) f.players.push({ id: from, name: p.name, look: p.look, color: p.color, x: 206, y: 104, tx: 206, ty: 110, dir: 'down', seed: Math.random() * 6 });
    }
    else this.net.sendTo(from, { t: 'lobby', code: this.net.code, list: this.playerList() });
    this.app.toast?.(`👋 ${p.name} är med!`);
  }
  // spelet har startat: skicka allt till en spelare
  welcome(id) {
    const g = this.game;
    this.known.set(id, new Set(g.customers.map((c) => c.id)));
    this.net.sendTo(id, {
      t: 'welcome', you: id, color: this.players.get(id)?.color, shop: g.shop.id, slot: g.slot, startYear: g.startYear,
      econ: econSnap(g), orders: g.orders.map(orderSnap), cust: g.customers.map(custFull), list: this.playerList(),
    });
  }
  started() { for (const id of this.players.keys()) this.welcome(id); }
  leave(id, why = 'lämnade butiken') {
    const p = this.players.get(id);
    this.players.delete(id); this.known.delete(id); this.seen.delete(id);
    this.app.floor && (this.app.floor.players = this.app.floor.players.filter((x) => x.id !== id));
    this.app.build?.removeCursor?.(id);
    this.app.onPlayers?.(this.playerList());
    this.net.broadcast({ t: 'players', list: this.playerList() });
    if (p && why) this.app.toast?.(`${p.name} ${why}.`);
  }
  cmd(m, from) {
    const g = this.game;
    if (!g) return;
    const result = runCommand(g, m.name, m.args, from);
    this.net.sendTo(from, { t: 'cmdres', req: m.req, result: result ?? null });
    this.econDirty = true; this.ordersDirty = true;
  }
  pos(m, from) {
    this.seen.set(from, Date.now());
    const f = this.app.floor;
    if (!f) return;
    let pl = f.players.find((x) => x.id === from);
    const info = this.players.get(from);
    if (!pl && info) { pl = { id: from, name: info.name, look: info.look, color: info.color, x: m.x, y: m.y, dir: m.dir, seed: Math.random() * 6 }; f.players.push(pl); }
    if (!pl) return;
    Object.assign(pl, { tx: m.x, ty: m.y, tdir: m.dir, moving: !!m.mv, away: m.away || null, orderId: m.order || null });
  }
  bop(m, from) {
    const o = this.game?.orders.find((x) => x.id === m.orderId);
    if (!o) return;
    this.app.build.remoteOp(o, m.op);
    this.net.broadcast({ t: 'bop', orderId: m.orderId, op: m.op }, from);
  }
  breq(m, from) {
    const o = this.game?.orders.find((x) => x.id === m.orderId);
    this.net.sendTo(from, { t: 'bsnap', orderId: m.orderId, build: o ? serializeBuild(o.build) : null });
  }
  // värdens egna byggoperationer och muspekare
  localOp(order, op) { this.net.broadcast({ t: 'bop', orderId: order.id, op }); }
  localCursor(data) { this.net.broadcast({ t: 'cur', ...data, from: 'host' }); }
  onGameEvent(type, data) {
    if (type === 'change') { this.econDirty = true; this.ordersDirty = true; }
    if (type === 'toast') {
      const g = this.game;
      if (g.actor && g.actor !== 'me' && g.actor !== 'host') { this.net.sendTo(g.actor, { t: 'toast', text: data.text, kind: data.kind }); return false; }
      this.net.broadcast({ t: 'toast', text: data.text, kind: data.kind });
    }
    if (type === 'delivery') this.net.broadcast({ t: 'ev', type: 'delivery' });
    if (type === 'levelup') this.net.broadcast({ t: 'ev', type: 'levelup', data });
    return true;
  }
  update(dt) {
    const g = this.game, f = this.app.floor;
    if (!g || !this.players.size) return;
    this.econT -= dt;
    if (this.econDirty && this.econT <= 0) { this.net.broadcast({ t: 'econ', econ: econSnap(g) }); this.econDirty = false; this.econT = 0.15; }
    if (this.ordersDirty) {
      this.net.broadcast({ t: 'orders', orders: g.orders.map(orderSnap) });
      this.ordersDirty = false;
    }
    this.tickT -= dt;
    if (this.tickT > 0) return;
    this.tickT = 0.1;
    // nya kunder till de klienter som inte sett dem
    for (const [id, set] of this.known) {
      const fresh = g.customers.filter((c) => !set.has(c.id));
      if (fresh.length) { this.net.sendTo(id, { t: 'cust', list: fresh.map(custFull) }); for (const c of fresh) set.add(c.id); }
    }
    const cust = g.customers.map((c) => [c.id, Math.round(c.x), Math.round(c.y), DIRS.indexOf(c.dir), c.moving ? 1 : 0, PHASES.indexOf(c.phase),
      isFinite(c.patience) ? Math.round(c.patience) : -1, c.mood || 0, Math.round((c.bubbleT || 0) * 10), c._sit ? 1 : 0, isFinite(c.patienceMax) ? c.patienceMax : -1]);
    const me = f?.localPlayer();
    const pls = (f?.players || []).map((p) => [p === me ? 'host' : p.id, Math.round(p.local ? p.x : (p.tx ?? p.x)), Math.round(p.local ? p.y : (p.ty ?? p.y)), DIRS.indexOf(p.dir), p.moving ? 1 : 0, p.away || 0, p.orderId || 0]);
    this.net.broadcast({ t: 'tick', cust, pls });
  }
}

// ---------- Klienten ----------
export class CoopClient {
  constructor(net, app) {
    this.net = net; this.app = app;
    this.req = 0; this.list = [];
    this.posT = 0; this.waitingBuild = null;
    net.on('lobby', (m) => { this.list = this.cleanList(m.list); app.onPlayers?.(this.list); });
    net.on('players', (m) => { this.list = this.cleanList(m.list); app.onPlayers?.(this.list); this.syncPlayers(); });
    net.on('welcome', (m) => { this.you = m.you; this.list = this.cleanList(m.list); app.onWelcome(m); });
    net.on('econ', (m) => { if (!this.game) return; applyEcon(this.game, m.econ); this.game.emit('change'); });
    net.on('orders', (m) => this.orders(m.orders));
    net.on('cust', (m) => this.custFull(m.list));
    net.on('tick', (m) => this.tick(m));
    net.on('toast', (m) => app.toast?.(m.text, m.kind));
    net.on('ev', (m) => app.onEvent?.(m.type, m.data));
    net.on('bop', (m) => { const o = this.game?.orders.find((x) => x.id === m.orderId); if (o) app.build.remoteOp(o, m.op); });
    net.on('bsnap', (m) => this.bsnap(m));
    net.on('cur', (m) => app.build?.remoteCursor?.(m.from, m, this.list.find((p) => p.id === m.from)));
    net.on('host-leave', () => app.onHostLeft?.());
    net.on('bye-host', () => app.onHostLeft?.());
    net.on('chat', (m) => app.onChat?.(m.from, String(m.text || '').slice(0, 80)));
    this.timer = setInterval(() => {
      if (!this.net.hostConn) return;
      this.net.send({ t: 'ping' });
      if (Date.now() - this.net.lastRecv > 15000) { clearInterval(this.timer); app.onHostLeft?.('lost'); }
    }, 2000);
  }
  close() { clearInterval(this.timer); }
  get game() { return this.app.game; }
  // samma objekt per spelare så att figurernas bilder cachas
  cleanList(list) {
    this.cache ||= new Map();
    return (list || []).map((p) => {
      const key = p.id + '|' + JSON.stringify([p.name, p.look, p.color]);
      if (!this.cache.has(key)) this.cache.set(key, this.app.clean ? this.app.clean(p) : p);
      return this.cache.get(key);
    });
  }
  act(name, args) { this.net.send({ t: 'cmd', name, args, req: ++this.req }); return null; }
  op(order, op) { this.net.send({ t: 'bop', orderId: order.id, op }); }
  cursor(data) { this.net.send({ t: 'cur', ...data }); }
  // kliv in i verkstaden: hämta bygget från värden först
  openBuild(order, then) {
    this.waitingBuild = { id: order.id, then };
    this.net.send({ t: 'breq', orderId: order.id });
  }
  bsnap(m) {
    const o = this.game?.orders.find((x) => x.id === m.orderId);
    if (o && m.build) o.build = deserializeBuild(m.build, this.game.shop);
    if (this.waitingBuild?.id === m.orderId) { const w = this.waitingBuild; this.waitingBuild = null; if (o) w.then(o); }
  }
  orders(list) {
    const g = this.game;
    if (!g) return;
    const byId = new Map(g.orders.map((o) => [o.id, o]));
    g.orders = list.map((s) => { const o = byId.get(s.id); if (o) { Object.assign(o, s); return o; } return { ...s, build: null }; });
    g.emit('change');
  }
  custFull(list) {
    const g = this.game;
    if (!g) return;
    for (const s of list) {
      let c = g.customers.find((x) => x.id === s.id);
      if (!c) { c = { walk: 0, bubbleT: 0, mood: null }; g.customers.push(c); }
      Object.assign(c, s, { patience: num(s.patience), patienceMax: num(s.patienceMax), tx: s.x, ty: s.y });
    }
    g.emit('change');
  }
  tick(m) {
    const g = this.game;
    if (!g) return;
    const seen = new Set();
    let changed = false;
    for (const [id, x, y, di, mv, ph, pat, mood, bub, sit, pmax] of m.cust) {
      const c = g.customers.find((q) => q.id === id);
      if (!c) continue;
      seen.add(id);
      const phase = PHASES[ph];
      if (c.phase !== phase) changed = true;
      Object.assign(c, { tx: x, ty: y, dir: DIRS[di] || 'down', moving: !!mv, phase, patience: num(pat), patienceMax: num(pmax), _sit: !!sit });
      if (mood && c.mood !== mood) { c.mood = mood; c.bubbleT = bub / 10; }
    }
    const before = g.customers.length;
    g.customers = g.customers.filter((c) => seen.has(c.id));
    if (changed || before !== g.customers.length) g.emit('change');
    // spelarna
    const f = this.app.floor;
    if (!f) return;
    for (const [id, x, y, di, mv, away, orderId] of m.pls) {
      if (id === this.you) continue;
      let pl = f.players.find((p) => p.id === id);
      const info = this.list.find((p) => p.id === id);
      if (!pl) { if (!info) continue; pl = { id, name: info.name, look: info.look, color: info.color, x, y, dir: DIRS[di], seed: Math.random() * 6 }; f.players.push(pl); }
      Object.assign(pl, { tx: x, ty: y, tdir: DIRS[di] || 'down', moving: !!mv, away: away || null, orderId: orderId || null });
    }
    const ids = new Set(m.pls.map((p) => p[0]));
    f.players = f.players.filter((p) => p.local || ids.has(p.id));
  }
  syncPlayers() {
    const f = this.app.floor;
    if (!f) return;
    for (const p of f.players) { const info = this.list.find((x) => x.id === p.id); if (info) Object.assign(p, { name: info.name, look: info.look, color: info.color }); }
  }
  update(dt) {
    const f = this.app.floor;
    if (!f) return;
    this.posT -= dt;
    if (this.posT > 0) return;
    this.posT = 0.1;
    const me = f.localPlayer();
    if (me) this.net.send({ t: 'pos', x: Math.round(me.x), y: Math.round(me.y), dir: me.dir, mv: me.moving ? 1 : 0, away: me.away || 0, order: me.orderId || 0 });
  }
}
