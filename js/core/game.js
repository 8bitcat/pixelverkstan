// Spelmotorn: pengar, lager, erfarenhet, kunder och beställningar.
// Känner inte till datorer – allt specifikt kommer från shop-modulen.
import { FIRST_NAMES, makeLook } from './people.js';

const QUEUE_PATIENCE = 75;   // sekunder i kön
const MAX_QUEUE = 3;
const MAX_ORDERS = 3;
export const XP_PER_YEAR = 30;   // erfarenhet per år som går
const DELIVERY_TIME = 12;        // sekunder från köp till att lådan står i butiken
const PACK_WINDOW = 8;           // köp inom så här många sekunder hamnar i samma låda

// Sparningar: en per butik och startår (slot), t.ex. pixelverkstan_dator_1983
export const saveKeyFor = (shopId, slot) => 'pixelverkstan_' + shopId + (slot != null ? '_' + slot : '');
export function readSave(shopId, slot, lastYear = 2026) {
  try {
    const d = JSON.parse(localStorage.getItem(saveKeyFor(shopId, slot)) || 'null');
    if (!d || ![1, 2, 3].includes(d.v)) return null;
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
    this.deliveries = [];   // lådor från grossisten: { id, items: {partId: n}, state: 'coming'|'arrived', eta, packUntil }
    this.shown = {};        // delar som står framme i butiken (resten ligger i förrådet)
    this.actor = null;      // spelaren som utför ett kommando (för meddelanden i co-op)
    // mirror = klient i co-op: läget kommer från värden, ingen egen simulering eller sparning
    this.mirror = !!opts.mirror;
    if (this.mirror) { this.startYear = opts.startYear ?? 2021; this.xp = 0; this.money = 0; this.stock = {}; this.stats = { served: 0, declined: 0, lost: 0, earned: 0, stars: 0 }; this.tutorialStep = 99; }
    else if (opts.fresh || !this.load()) this.reset(opts.startYear ?? shop.defaultStartYear ?? 2021);
  }

  on(fn) { this.listeners.push(fn); }
  emit(type, data) { for (const fn of this.listeners) fn(type, data); }

  // ---------- Sparning ----------
  get saveKey() { return saveKeyFor(this.shop.id, this.slot); }
  reset(startYear = 2021) {
    this.startYear = startYear; this.xp = 0;
    const s = this.shop.startFor ? this.shop.startFor(startYear) : this.shop.start;
    this.startInfo = s;
    this.money = s.money; this.stock = { ...s.stock }; this.shown = { ...s.stock }; this.deliveries = [];
    this.stats = { served: 0, declined: 0, lost: 0, earned: 0, stars: 0 };
    this.tutorialStep = 0;
    this.customers = []; this.orders = [];
    this.save();
  }
  save() {
    if (this.mirror) return;
    // reserverade delar räknas tillbaka till lagret – pågående bygge sparas inte
    const stock = { ...this.stock };
    for (const o of this.orders) for (const id of this.heldParts(o)) stock[id] = (stock[id] || 0) + 1;
    // betalningar som väntar vid utlämningen räknas som mottagna
    const pending = this.customers.filter((c) => c.payout);
    const money = this.money + pending.reduce((s, c) => s + c.payout.total, 0);
    const xp = this.xp + pending.reduce((s, c) => s + c.payout.xp, 0);
    const tutorialStep = this.tutorialStep + pending.filter((c) => c.order.tutorial !== undefined).length;
    const start = this.startInfo ? { template: this.startInfo.template, builds: (this.startInfo.builds || []).map((b) => (b || []).map((p) => p.id)) } : null;
    // lådor som är på väg sparas som framme
    const deliveries = this.deliveries.map((d) => ({ id: d.id, items: d.items, state: 'arrived' }));
    const data = { v: 3, money, xp, stock, shown: this.shown, deliveries, stats: this.stats, tutorialStep, startYear: this.startYear, start, nextId: this.nextId };
    try { localStorage.setItem(this.saveKey, JSON.stringify(data)); } catch { /* privat läge */ }
  }
  load() {
    try {
      const d = JSON.parse(localStorage.getItem(this.saveKey) || 'null');
      if (!d || ![1, 2, 3].includes(d.v)) return false;
      const stock = Object.fromEntries(Object.entries(d.stock || {}).filter(([id]) => this.shop.part[id]));
      Object.assign(this, { money: d.money, xp: d.xp, stock, stats: d.stats, tutorialStep: d.tutorialStep, startYear: d.startYear ?? 2021 });
      // äldre sparningar hade inget förråd: allt står framme
      this.shown = d.shown ? Object.fromEntries(Object.entries(d.shown).filter(([id]) => this.shop.part[id])) : { ...stock };
      this.deliveries = (d.deliveries || []).map((x) => ({ ...x, items: Object.fromEntries(Object.entries(x.items || {}).filter(([id]) => this.shop.part[id])), state: 'arrived' })).filter((x) => Object.keys(x.items).length);
      if (d.nextId) this.nextId = Math.max(this.nextId, d.nextId);
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
  // står framme i butiken (kunderna ser bara det)
  shownFree(id) { return Math.min(this.shown[id] || 0, this.stock[id] || 0); }
  // på väg från grossisten eller i en oöppnad låda
  incoming(id) { let n = 0; for (const d of this.deliveries) n += d.items[id] || 0; return n; }
  clampShown(id) { if ((this.shown[id] || 0) > (this.stock[id] || 0)) this.shown[id] = this.stock[id] || 0; if (!this.shown[id]) delete this.shown[id]; }

  // Köp: pengarna dras direkt, delarna kommer i en låda en stund senare
  buy(id, n = 1) {
    const p = this.shop.part[id], cost = p.cost * n;
    if (!this.onSale(p)) { this.emit('toast', { text: p.year > this.year ? `${p.name} finns inte förrän ${p.year}.` : `${p.name} säljs inte längre.`, kind: 'bad' }); return false; }
    if (this.money < cost) { this.emit('toast', { text: 'Inte tillräckligt med pengar!', kind: 'bad' }); return false; }
    this.money -= cost;
    let box = this.deliveries.find((d) => d.state === 'coming' && d.packUntil > this.time);
    if (!box) { box = { id: this.nextId++, items: {}, state: 'coming', eta: this.time + DELIVERY_TIME, packUntil: this.time + PACK_WINDOW }; this.deliveries.push(box); }
    box.items[id] = (box.items[id] || 0) + n;
    this.save(); this.emit('change');
    return true;
  }
  buyMany(list) {
    const cost = list.reduce((s, [id, n]) => s + this.shop.part[id].cost * n, 0);
    if (cost > this.money) { this.emit('toast', { text: 'Du har inte råd just nu.', kind: 'bad' }); return false; }
    for (const [id, n] of list) this.buy(id, n);
    return true;
  }
  // Packa upp en låda: allt till lagret, och ställ ut det i butiken om show
  unpack(boxId, show = true) {
    const d = this.deliveries.find((x) => x.id === boxId);
    if (!d || d.state !== 'arrived') return false;
    for (const [id, n] of Object.entries(d.items)) {
      this.stock[id] = (this.stock[id] || 0) + n;
      if (show) this.shown[id] = (this.shown[id] || 0) + n;
    }
    this.deliveries = this.deliveries.filter((x) => x !== d);
    const count = Object.values(d.items).reduce((s, n) => s + n, 0);
    this.emit('toast', { text: show ? `📦 ${count} ${count === 1 ? 'del' : 'delar'} står nu framme i butiken.` : `📦 ${count} ${count === 1 ? 'del' : 'delar'} ligger i förrådet.`, kind: 'good' });
    this.emit('unpacked', { box: d, show });
    this.save(); this.emit('change');
    return true;
  }
  // Ställ ut / ta in delar ur förrådet
  setShown(id, n) {
    this.shown[id] = Math.max(0, Math.min(this.stock[id] || 0, n));
    this.clampShown(id);
    this.save(); this.emit('change');
    return true;
  }
  takeStock(id) { if (!this.stock[id]) return false; this.stock[id]--; this.clampShown(id); this.emit('change'); return true; }
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
  // saknade delar som inte redan är på väg
  toBuyFor(order) { return this.missingFor(order).map((m) => ({ ...m, buy: Math.max(0, m.buy - this.incoming(m.id)) })).filter((m) => m.buy > 0 && this.onSale(this.shop.part[m.id])); }
  buyMissing(order) {
    const miss = this.toBuyFor(order);
    if (!this.buyMany(miss.map((m) => [m.id, m.buy]))) return false;
    this.emit('toast', { text: '🚚 Delarna är beställda – packa upp lådan när den kommer.', kind: 'good' });
    return true;
  }

  // ---------- Kunder ----------
  // Delar som slutat säljas byts mot likvärdiga som finns i år (kunden ändrar sig)
  refreshOrder(order) {
    if (!order || !this.shop.fixOrder) return null;
    return this.shop.fixOrder(order, this.year, (id) => this.stockFree(id));
  }
  hasGone(order) { return order.items.some((it) => it.gone); }

  spawn(order) {
    if (!order) return null;
    this.refreshOrder(order);
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
    if (this.mirror) return;
    // nya kunder
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      if (this.tutorialStep < this.shop.tutorialCount) {
        const tutActive = this.customers.some((c) => c.order.tutorial !== undefined);
        if (!tutActive && this.orders.length === 0) {
          const o = this.shop.tutorialOrder(this.tutorialStep, this);
          // första kunden kommer när startpaketet står framme; de andra kommer ändå (saknade delar köps in)
          if (o && this.tutorialReady(o)) { this.spawn(o); this.tutorWait = 0; }
          else if (this.tutorialStep > 0 || this.hasShown()) {
            // skyddsnät: kan den guidade kunden inte komma går vi vidare på egen hand
            this.tutorWait = (this.tutorWait || 0) + 2;
            if (this.tutorWait > 90 || !o) { this.tutorialStep = this.shop.tutorialCount; this.tutorWait = 0; this.emit('toast', { text: 'Nu kör du på egen hand! Kunderna kommer – fyll på lagret hos 🛒 Grossisten.', kind: '' }); this.save(); }
          }
        }
        this.spawnTimer = 2;
      } else {
        // kunder kommer även när butiken är tom (de beställer det man får köpa in), men mer sällan
        const empty = !this.hasShown();
        if (this.queue().length < MAX_QUEUE && this.orders.length < MAX_ORDERS && this.customers.length < 7 && (!empty || this.queue().length === 0)) {
          this.spawn(this.shop.generateOrder(this, FIRST_NAMES));
        }
        this.spawnTimer = (Math.max(14, 40 - this.level * 5) + Math.random() * 12) * (empty ? 1.6 : 1);
      }
    }
    // leveranser
    for (const d of this.deliveries) {
      if (d.state === 'coming' && this.time >= d.eta) {
        d.state = 'arrived';
        this.emit('toast', { text: '📦 En låda från grossisten har kommit!', kind: 'good' });
        this.emit('delivery', d);
        this.emit('change');
      }
    }
    // tålamod
    for (const c of this.customers) {
      if (c.phase === 'queue' && shopVisible) c.patience -= dt;
      if (c.phase === 'waiting' && c.order.tutorial === undefined) c.patience -= dt * 0.5;
      if (c.patience <= 0 && (c.phase === 'queue' || c.phase === 'waiting')) this.walkOut(c, 'angry');
    }
  }

  hasShown() { for (const id in this.shown) if (this.shownFree(id) > 0) return true; return false; }
  tutorialReady(o) {
    const need = {};
    for (const it of o.items) if (it.part) need[it.part] = (need[it.part] || 0) + 1;
    if (o.tutorial > 0) return true;               // andra och tredje kunden: köp in det som saknas
    const missingOk = 0;
    let missing = 0;
    for (const [id, n] of Object.entries(need)) if (this.shownFree(id) < n) missing += n - this.shownFree(id);
    return missing <= missingOk;
  }
  // Vad nya spelare ska göra härnäst (visas i beställningspanelen)
  guide() {
    if (this.tutorialStep >= this.shop.tutorialCount && this.hasShown()) return null;
    const arrived = this.deliveries.find((d) => d.state === 'arrived');
    if (arrived) return { icon: '📦', title: 'Lådan har kommit!', text: 'Tryck på lådan vid dörren för att packa upp den och ställa ut delarna.' };
    if (this.deliveries.some((d) => d.state === 'coming')) return { icon: '🚚', title: 'Leveransen är på väg', text: 'Grossisten kör hit lådan – den står vid dörren om en stund.' };
    if (!Object.keys(this.stock).some((id) => this.stock[id] > 0)) return { icon: '🛒', title: 'Butiken är tom!', text: 'Tryck på 🛒 Grossist och köp in delar – börja med Startpaketet.' };
    if (!this.hasShown()) return { icon: '🏛️', title: 'Ställ ut delarna', text: 'Kunderna ser bara det som står framme. Tryck på 📦 Lager och ställ ut delar.' };
    return null;
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
    for (const it of order.items) if (it.part) { this.stock[it.part]--; this.clampShown(it.part); reserved.push(it.part); }
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
    if (this.year > before) {
      for (const cu of this.customers) if (cu.phase === 'arriving' || cu.phase === 'queue') {
        const swaps = this.refreshOrder(cu.order);
        if (swaps?.length) this.emit('toast', { text: `${cu.name} bytte till ${swaps[0][1]} (${swaps[0][0]} säljs inte längre).`, kind: '' });
      }
      this.emit('levelup', { ...this.levelInfo(), from: before });
    }
    this.save(); this.emit('change');
  }
}

export const fmt = (n) => Math.round(n).toLocaleString('sv-SE');
