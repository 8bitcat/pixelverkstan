// Spelmotorn: pengar, lager, erfarenhet, kunder och beställningar.
// Känner inte till datorer – allt specifikt kommer från shop-modulen.
import { FIRST_NAMES, makeLook } from './people.js';

const QUEUE_PATIENCE = 75;   // sekunder i kön
const MAX_QUEUE = 3;
const MAX_ORDERS = 3;
export const XP_PER_YEAR = 30;   // erfarenhet per år som går

// Sparningar: en per butik och startår (slot), t.ex. pixelverkstan_dator_1983
export const saveKeyFor = (shopId, slot) => 'pixelverkstan_' + shopId + (slot != null ? '_' + slot : '');
export function readSave(shopId, slot, lastYear = 2026) {
  try {
    const d = JSON.parse(localStorage.getItem(saveKeyFor(shopId, slot)) || 'null');
    if (!d || (d.v !== 1 && d.v !== 2)) return null;
    const startYear = d.startYear ?? 2021;
    return { ...d, year: Math.min(lastYear, startYear + Math.floor((d.xp || 0) / XP_PER_YEAR)), served: d.stats?.served || 0 };
  } catch { return null; }
}

export class Game {
  constructor(shop, opts = {}) {
    this.shop = shop;
    this.listeners = [];
    this.customers = [];
    this.orders = [];
    this.nextId = 1;
    this.spawnTimer = 1.5;
    this.time = 0;
    this.slot = opts.slot ?? null;
    if (opts.fresh || !this.load()) this.reset(opts.startYear ?? shop.defaultStartYear ?? 2021);
  }

  on(fn) { this.listeners.push(fn); }
  emit(type, data) { for (const fn of this.listeners) fn(type, data); }

  // ---------- Sparning ----------
  get saveKey() { return saveKeyFor(this.shop.id, this.slot); }
  reset(startYear = 2021) {
    this.startYear = startYear; this.xp = 0;
    const s = this.shop.startFor ? this.shop.startFor(startYear) : this.shop.start;
    this.startInfo = s;
    this.money = s.money; this.stock = { ...s.stock };
    this.stats = { served: 0, declined: 0, lost: 0, earned: 0, stars: 0 };
    this.tutorialStep = 0;
    this.customers = []; this.orders = [];
    this.save();
  }
  save() {
    // reserverade delar räknas tillbaka till lagret – pågående bygge sparas inte
    const stock = { ...this.stock };
    for (const o of this.orders) for (const id of this.heldParts(o)) stock[id] = (stock[id] || 0) + 1;
    // betalningar som väntar vid utlämningen räknas som mottagna
    const pending = this.customers.filter((c) => c.payout);
    const money = this.money + pending.reduce((s, c) => s + c.payout.total, 0);
    const xp = this.xp + pending.reduce((s, c) => s + c.payout.xp, 0);
    const tutorialStep = this.tutorialStep + pending.filter((c) => c.order.tutorial !== undefined).length;
    const start = this.startInfo ? { template: this.startInfo.template, builds: (this.startInfo.builds || []).map((b) => (b || []).map((p) => p.id)) } : null;
    const data = { v: 2, money, xp, stock, stats: this.stats, tutorialStep, startYear: this.startYear, start };
    try { localStorage.setItem(this.saveKey, JSON.stringify(data)); } catch { /* privat läge */ }
  }
  load() {
    try {
      const d = JSON.parse(localStorage.getItem(this.saveKey) || 'null');
      if (!d || (d.v !== 1 && d.v !== 2)) return false;
      const stock = Object.fromEntries(Object.entries(d.stock || {}).filter(([id]) => this.shop.part[id]));
      Object.assign(this, { money: d.money, xp: d.xp, stock, stats: d.stats, tutorialStep: d.tutorialStep, startYear: d.startYear ?? 2021 });
      if (d.start?.builds) this.startInfo = { template: d.start.template, builds: d.start.builds.map((ids) => ids.map((id) => this.shop.part[id]).filter(Boolean)) };
      return true;
    } catch { return false; }
  }
  hasSave() { try { return !!localStorage.getItem(this.saveKey); } catch { return false; } }

  // ---------- Årtal ----------
  get lastYear() { return this.shop.lastYear ?? 2026; }
  get year() { return Math.min(this.lastYear, (this.startYear ?? 2021) + Math.floor(this.xp / XP_PER_YEAR)); }
  get progress() { return (this.year - this.startYear) / Math.max(1, this.lastYear - this.startYear); }
  get level() { return 1 + Math.min(4, Math.floor(this.progress * 5)); }
  onSale(p) { return p.year <= this.year && (p.until ?? 9999) >= this.year; }
  levelInfo() {
    const y = this.year, era = this.shop.eraOf ? this.shop.eraOf(y) : { title: '' };
    const done = y >= this.lastYear;
    return { level: this.level, year: y, title: `${y} · ${era.title}`, era, frac: done ? 1 : (this.xp % XP_PER_YEAR) / XP_PER_YEAR, next: done ? null : { title: String(y + 1) } };
  }

  // ---------- Lager & grossist ----------
  stockFree(id) { return this.stock[id] || 0; }
  buy(id, n = 1) {
    const p = this.shop.part[id], cost = p.cost * n;
    if (!this.onSale(p)) { this.emit('toast', { text: p.year > this.year ? `${p.name} finns inte förrän ${p.year}.` : `${p.name} säljs inte längre.`, kind: 'bad' }); return false; }
    if (this.money < cost) { this.emit('toast', { text: 'Inte tillräckligt med pengar!', kind: 'bad' }); return false; }
    this.money -= cost;
    this.stock[id] = (this.stock[id] || 0) + n;
    this.save(); this.emit('change');
    return true;
  }
  takeStock(id) { if (!this.stock[id]) return false; this.stock[id]--; this.emit('change'); return true; }
  returnStock(id) { this.stock[id] = (this.stock[id] || 0) + 1; this.emit('change'); }

  // Delar som behövs men saknas för en beställning → [{id, need, have}]
  missingFor(order) {
    const need = {};
    for (const it of order.items) if (it.part) need[it.part] = (need[it.part] || 0) + 1;
    const out = [];
    for (const [id, n] of Object.entries(need)) if (this.stockFree(id) < n) out.push({ id, need: n, have: this.stockFree(id), buy: n - this.stockFree(id) });
    return out;
  }
  missingChoices(order) {
    return order.items.filter((it) => it.choice && !Object.keys(this.stock).some((id) => this.stock[id] > 0 && this.shop.part[id]?.cat === it.cat)).map((it) => it.cat);
  }
  buyMissing(order) {
    const miss = this.missingFor(order);
    const cost = miss.reduce((s, m) => s + this.shop.part[m.id].cost * m.buy, 0);
    if (cost > this.money) { this.emit('toast', { text: 'Du har inte råd just nu.', kind: 'bad' }); return false; }
    for (const m of miss) this.buy(m.id, m.buy);
    return true;
  }

  // ---------- Kunder ----------
  spawn(order) {
    if (!order) return null;
    const c = {
      id: this.nextId++, name: order.name, look: makeLook(), order,
      phase: 'arriving', patience: QUEUE_PATIENCE, patienceMax: QUEUE_PATIENCE,
      x: 262, y: 170, dir: 'left', walk: 0, mood: null, bubbleT: 0,
    };
    if (order.tutorial !== undefined) { c.patience = c.patienceMax = Infinity; }
    this.customers.push(c);
    this.emit('change');
    return c;
  }
  queue() { return this.customers.filter((c) => c.phase === 'arriving' || c.phase === 'queue'); }

  update(dt, { shopVisible }) {
    this.time += dt;
    // nya kunder
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      if (this.tutorialStep < this.shop.tutorialCount) {
        const tutActive = this.customers.some((c) => c.order.tutorial !== undefined);
        if (!tutActive && this.orders.length === 0) this.spawn(this.shop.tutorialOrder(this.tutorialStep, this));
        this.spawnTimer = 2;
      } else {
        if (this.queue().length < MAX_QUEUE && this.orders.length < MAX_ORDERS && this.customers.length < 7) {
          this.spawn(this.shop.generateOrder(this, FIRST_NAMES));
        }
        this.spawnTimer = Math.max(14, 40 - this.level * 5) + Math.random() * 12;
      }
    }
    // tålamod
    for (const c of this.customers) {
      if (c.phase === 'queue' && shopVisible) c.patience -= dt;
      if (c.phase === 'waiting' && c.order.tutorial === undefined) c.patience -= dt * 0.5;
      if (c.patience <= 0 && (c.phase === 'queue' || c.phase === 'waiting')) this.walkOut(c, 'angry');
    }
  }

  walkOut(c, mood) {
    if (c.phase === 'waiting') {
      const o = this.orders.find((x) => x.customerId === c.id);
      if (o) this.cancelOrder(o);
      this.stats.lost++;
      this.emit('toast', { text: `${c.name} tröttnade och gick!`, kind: 'bad' });
    } else if (mood === 'angry') {
      this.stats.lost++;
      this.emit('toast', { text: `${c.name} tröttnade på att köa.`, kind: 'bad' });
    }
    c.phase = 'leaving'; c.mood = mood; c.bubbleT = 2.5;
    this.save(); this.emit('change');
  }

  // ---------- Beställningar ----------
  accept(c) {
    const order = c.order;
    if (this.missingFor(order).length || this.missingChoices(order).length) return false;
    const reserved = [];
    for (const it of order.items) if (it.part) { this.stock[it.part]--; reserved.push(it.part); }
    const nParts = order.items.length;
    const o = { id: this.nextId++, customerId: c.id, ...order, reserved, chosen: {}, build: null, startedAt: this.time };
    this.orders.push(o);
    c.phase = 'waiting';
    if (order.tutorial === undefined) { c.patience = c.patienceMax = 240 + nParts * 25; }
    this.save(); this.emit('change');
    return o;
  }
  decline(c) {
    this.stats.declined++;
    if (c.order.tutorial !== undefined) this.tutorialStep++;
    this.walkOut(c, 'sad');
  }
  // delar som ordern "håller" (reserverade + valda ur lagret i bygget)
  heldParts(o) { return [...o.reserved, ...Object.values(o.chosen)]; }
  cancelOrder(o) {
    for (const id of this.heldParts(o)) this.stock[id] = (this.stock[id] || 0) + 1;
    this.orders = this.orders.filter((x) => x !== o);
  }

  // Bygget klart och startat → kunden kommer och hämtar
  complete(o, result) {
    const c = this.customers.find((x) => x.id === o.customerId);
    const price = this.shop.priceFor(o, o.chosen);
    const tip = result.stars >= 3 ? Math.round(this.shop.feeFor(o) * 0.5 / 10) * 10 : result.stars === 2 ? Math.round(this.shop.feeFor(o) * 0.2 / 10) * 10 : 0;
    const bonus = result.help === false ? Math.round(price * 0.15 / 10) * 10 : 0;
    o.payout = { price, tip, bonus, total: price + tip + bonus, xp: this.shop.xpFor(o) + result.stars * 2 + (bonus ? 5 : 0), stars: result.stars };
    this.orders = this.orders.filter((x) => x !== o);
    if (c) { c.phase = 'ready'; c.payout = o.payout; c.patience = Infinity; }
    else this.pay(o.payout);
    this.emit('change');
    return o.payout;
  }
  pay(p, c) {
    const before = this.year;
    this.money += p.total; this.xp += p.xp;
    this.stats.served++; this.stats.earned += p.total; this.stats.stars += p.stars;
    if (c?.order.tutorial !== undefined) {
      this.tutorialStep++;
      if (this.tutorialStep === this.shop.tutorialCount) setTimeout(() => this.emit('toast', { text: 'Nu kör du på egen hand! Fyll på lagret hos 🛒 Grossisten.', kind: '' }), 3500);
    }
    this.emit('toast', { text: `+${fmt(p.total)} kr${p.tip ? ` (varav ${fmt(p.tip)} kr dricks)` : ''}`, kind: 'good' });
    if (this.year > before) this.emit('levelup', { ...this.levelInfo(), from: before });
    this.save(); this.emit('change');
  }
}

export const fmt = (n) => Math.round(n).toLocaleString('sv-SE');
