// Spelmotorn: pengar, lager, erfarenhet, kunder och beställningar.
// Känner inte till datorer – allt specifikt kommer från shop-modulen.
import { FIRST_NAMES, makeLook } from './people.js';
import { SLOTS as FLOOR_SLOTS } from './floor-layout.js';
import { tickStaff, hire as staffHire, fire as staffFire, train as staffTrain, release as staffRelease } from './staff.js';

const QUEUE_PATIENCE = 75;   // sekunder i kön
const MAX_QUEUE = 3;
const MAX_ORDERS = 3;
export const XP_PER_YEAR = 30;   // erfarenhet per år som går
const DELIVERY_TIME = 12;        // sekunder från köp till att lådan står i butiken
const PACK_WINDOW = 8;           // köp inom så här många sekunder hamnar i samma låda
const SAVE_VERSIONS = [1, 2, 3, 4, 5, 6, 7];
const MODEL_TICK = 40;           // sekunder mellan postorderförsäljningarna
const REVIEW_TIME = 25;          // sekunder från lansering till Datormagazins recension

// Sparningar: en per butik och startår (slot), t.ex. pixelverkstan_dator_1983
export const saveKeyFor = (shopId, slot) => 'pixelverkstan_' + shopId + (slot != null ? '_' + slot : '');
export function readSave(shopId, slot, lastYear = 2026) {
  try {
    const d = JSON.parse(localStorage.getItem(saveKeyFor(shopId, slot)) || 'null');
    if (!d || !SAVE_VERSIONS.includes(d.v)) return null;
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
    this.fit = this.emptyFit();   // butikens inredning: platser med montrar/bås och köpta prylar
    this.demand = {};
    this.deskPc = null;     // butikens egen speldator på spelbordet: { parts: { cat: partId } }       // vad kunder frågat efter som butiken inte kunnat sälja: { text: antal }
    this.models = [];       // egna datormodeller (shops/dator/models.js)
    this.events = { seen: [], active: [], pending: null };   // händelser med val (shops/dator/events.js)
    this.bulk = [];         // avtal: leverera n st av en modell
    this.staff = [];        // anställda (core/staff.js)
    this.staffing = { cands: [], candYear: null, payT: 0 };
    // mirror = klient i co-op: läget kommer från värden, ingen egen simulering eller sparning
    this.mirror = !!opts.mirror;
    if (this.mirror) { this.startYear = opts.startYear ?? 2021; this.xp = 0; this.money = 0; this.stock = {}; this.stats = { served: 0, declined: 0, lost: 0, earned: 0, stars: 0 }; this.tutorialStep = 99; }
    else if (opts.fresh || !this.load()) this.reset(opts.startYear ?? shop.defaultStartYear ?? 2021);
  }
  emptyFit() {
    const f = this.shop.fit ? this.shop.fit.emptyFit(this.shop.showcases || []) : { slots: [], items: {} };
    while (f.slots.length < FLOOR_SLOTS.length) f.slots.push(null);
    return f;
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
    this.fit = this.emptyFit(); this.demand = {}; this.deskPc = null;
    this.models = []; this.bulk = []; this.staff = []; this.staffing = { cands: [], candYear: null, payT: 0 };
    // händelser före startåret har redan hänt
    this.events = { seen: (this.shop.events?.EVENTS || []).filter((e) => e.year < startYear).map((e) => e.id), active: [], pending: null };
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
    const data = { v: 7, money, xp, stock, shown: this.shown, deliveries, stats: this.stats, tutorialStep, startYear: this.startYear, start, nextId: this.nextId, fit: this.fit, demand: this.demand, deskPc: this.deskPc, models: this.models, events: this.events, bulk: this.bulk, staff: this.staff, staffing: this.staffing };
    try { localStorage.setItem(this.saveKey, JSON.stringify(data)); } catch { /* privat läge */ }
  }
  load() {
    try {
      const d = JSON.parse(localStorage.getItem(this.saveKey) || 'null');
      if (!d || !SAVE_VERSIONS.includes(d.v)) return false;
      const stock = Object.fromEntries(Object.entries(d.stock || {}).filter(([id]) => this.shop.part[id]));
      Object.assign(this, { money: d.money, xp: d.xp, stock, stats: d.stats, tutorialStep: d.tutorialStep, startYear: d.startYear ?? 2021 });
      // äldre sparningar hade ingen inredning: de tre kategorihyllorna som förr
      this.fit = this.cleanFit(d.fit);
      // v4 hade tre lokaler (Renovera = 6 platser, Datorhuset = 8): översätt till den nya stegen
      if (d.v === 4 && this.fit.items) { const it = this.fit.items; if (it.lokal3) { it.lokal4 = 1; it.lokal5 = 1; } if (it.lokal2) { it.lokal3 = 1; it.lokal4 ||= it.lokal4; } }
      this.demand = d.demand && typeof d.demand === 'object' ? d.demand : {};
      this.deskPc = d.deskPc && d.deskPc.parts ? { parts: Object.fromEntries(Object.entries(d.deskPc.parts).filter(([, id]) => this.shop.part[id])) } : null;
      this.models = Array.isArray(d.models) ? d.models.filter((m) => m && Array.isArray(m.parts)).map((m) => ({ ...m, parts: m.parts.filter((id) => this.shop.part[id]), reviewAt: m.state === 'recension' ? Math.min(m.reviewAt || 0, REVIEW_TIME) : m.reviewAt })) : [];
      this.bulk = Array.isArray(d.bulk) ? d.bulk : [];
      // beställningar sparas inte, så ingen har ett jobb när man laddar
      this.staff = Array.isArray(d.staff) ? d.staff.filter((x) => x && x.stats && x.role).map((x) => ({ ...x, job: null, progress: 0, pct: 0 })) : [];
      this.staffing = d.staffing && typeof d.staffing === 'object' ? { cands: d.staffing.cands || [], candYear: d.staffing.candYear ?? null, payT: d.staffing.payT || 0 } : { cands: [], candYear: null, payT: 0 };
      const year = Math.min(this.lastYear, this.startYear + Math.floor((this.xp || 0) / XP_PER_YEAR));
      // äldre sparningar: det som redan hänt räknas som sett, så att inte alla händelser kommer på en gång
      this.events = d.events && typeof d.events === 'object' ? { seen: d.events.seen || [], active: d.events.active || [], pending: d.events.pending || null }
        : { seen: (this.shop.events?.EVENTS || []).filter((e) => e.year < year).map((e) => e.id), active: [], pending: null };
      // äldre sparningar hade inget förråd: allt står framme
      this.shown = d.shown ? Object.fromEntries(Object.entries(d.shown).filter(([id]) => this.shop.part[id])) : { ...stock };
      this.deliveries = (d.deliveries || []).map((x) => ({ ...x, items: Object.fromEntries(Object.entries(x.items || {}).filter(([id]) => this.shop.part[id])), state: 'arrived' })).filter((x) => Object.keys(x.items).length);
      if (d.nextId) this.nextId = Math.max(this.nextId, d.nextId);
      if (d.start?.builds) this.startInfo = { template: d.start.template, builds: d.start.builds.map((ids) => ids.map((id) => this.shop.part[id]).filter(Boolean)) };
      return true;
    } catch { return false; }
  }
  hasSave() { try { return !!localStorage.getItem(this.saveKey); } catch { return false; } }

  // ---------- Butikens inredning ----------
  // Platser med montrar/bås (fit.slots) och köpta prylar (fit.items) – se shops/dator/upgrades.js
  cleanFit(f) {
    const base = this.emptyFit();
    if (!f || typeof f !== 'object') return base;
    const slots = base.slots.map((s, i) => {
      const x = Array.isArray(f.slots) ? f.slots[i] : undefined;
      if (x === undefined) return s;
      if (!x || typeof x !== 'object' || !['cat', 'brand', 'unit'].includes(x.kind)) return null;
      return { kind: x.kind, cat: x.cat, brand: x.brand, level: Math.max(0, Math.min(3, x.level | 0)), unit: x.unit, ...(x.product ? { product: String(x.product) } : {}) };
    });
    const nSlots = FLOOR_SLOTS.length;
    while (slots.length < nSlots) { const x = f.slots?.[slots.length]; slots.push(x && typeof x === 'object' && ['cat', 'brand', 'unit'].includes(x.kind) ? { kind: x.kind, cat: x.cat, brand: x.brand, level: Math.max(0, Math.min(3, x.level | 0)), unit: x.unit, ...(x.product ? { product: String(x.product) } : {}) } : null); }
    const arcade = Array.isArray(f.arcade) ? f.arcade.filter((id) => typeof id === 'string' && this.shop.part[id]?.cat === 'arkad').slice(0, 8) : [];
    return { slots, items: f.items && typeof f.items === 'object' ? { ...f.items } : {}, arcade };
  }
  // ---------- Arkadrummet (Datorhuset) ----------
  get hasArcadeRoom() { return !!this.shop.fit && this.shop.fit.lokalOf(this.fit) >= (this.shop.fit.ARCADE_LOKAL || 5); }
  buyArcade(id) {
    const p = this.shop.part[id];
    if (!p || p.cat !== 'arkad' || !this.hasArcadeRoom) return false;
    if (!this.onSale(p)) { this.emit('toast', { text: `${p.name} finns inte att köpa ${this.year}.`, kind: 'bad' }); return false; }
    if ((this.fit.arcade || []).length >= 8) { this.emit('toast', { text: 'Arkadrummet är fullt – sälj en maskin först.', kind: 'bad' }); return false; }
    if (p.cost > this.money) { this.emit('toast', { text: 'Inte tillräckligt med pengar!', kind: 'bad' }); return false; }
    this.money -= p.cost;
    (this.fit.arcade ||= []).push(id);
    this.emit('toast', { text: `🕹️ ${p.name} står nu i arkadrummet!`, kind: 'good' });
    this.emit('fit'); this.save(); this.emit('change');
    return true;
  }
  sellArcade(i) {
    const list = this.fit.arcade || [], id = list[i], p = this.shop.part[id];
    if (!p) return false;
    const back = Math.round(p.cost * (this.shop.hypeAt(p, this.year) > 0.5 ? 0.5 : 0.3) / 50) * 50;
    this.money += back; list.splice(i, 1);
    this.emit('toast', { text: `${p.name} såld – ${fmt(back)} kr tillbaka.`, kind: '' });
    this.emit('fit'); this.save(); this.emit('change');
    return true;
  }
  get fitStats() { return this.shop.fit ? this.shop.fit.statsFor(this.fit) : { drag: 0, trivsel: 0, rykte: 0, queue: 0 }; }
  // ryktet växer med stjärnorna kunderna gett
  get rykte() { return Math.min(20, Math.floor((this.stats?.stars || 0) / 6) + this.fitStats.rykte); }
  capFor(p) { return this.shop.fit ? this.shop.fit.capFor(this.fit, p) : 9; }
  // får delen köpas in och ställas ut? (det billigaste i varje kategori går alltid)
  canSell(p) {
    if (!p || !this.shop.fit) return true;
    if (this.shop.isProduct?.(p)) return this.capFor(p) > 0;
    if (p.tier <= this.capFor(p)) return true;
    if (p.tier <= this.minTier(p.cat)) return true;
    // startpaketets delar får alltid säljas – annars fastnar de guidade kunderna
    return !!this.startInfo?.builds?.some((b) => (b || []).some((q) => q.id === p.id));
  }
  minTier(cat) {
    const y = this.year;
    if (this._minTierYear !== y) { this._minTierYear = y; this._minTier = {}; }
    if (this._minTier[cat] === undefined) {
      let m = 9;
      for (const q of this.shop.onSale(y)) if (q.cat === cat && q.tier < m) m = q.tier;
      this._minTier[cat] = m;
    }
    return this._minTier[cat];
  }
  needFor(p) { return this.canSell(p) ? '' : this.shop.fit.needFor(this.fit, p); }
  // kunden ville ha något butiken inte får sälja → efterfrågantavlan
  noteDemand(text) { if (!text) return; this.demand[text] = (this.demand[text] || 0) + 1; }
  demandFor(order) {
    const out = new Set();
    if (order.repair) return [];
    for (const it of order.items) if (it.part) { const n = this.needFor(this.shop.part[it.part]); if (n) out.add(n); }
    return [...out];
  }
  // köp/byt det som står på en plats
  buySlot(slotIndex, optionId) {
    const F = this.shop.fit;
    if (!F || slotIndex < 0 || slotIndex >= this.fit.slots.length) return false;
    if (!F.slotOpen(this.fit, slotIndex)) { this.emit('toast', { text: 'Platsen hör till en större lokal – bygg ut butiken först.', kind: 'bad' }); return false; }
    const size = FLOOR_SLOTS[slotIndex]?.size || 'medium';
    const o = F.optionsFor(this.fit, slotIndex, size, this.year).find((x) => x.id === optionId);
    if (!o || o.current) return false;
    if (o.pay > this.money) { this.emit('toast', { text: 'Inte tillräckligt med pengar!', kind: 'bad' }); return false; }
    this.money -= o.pay;
    F.applyOption(this.fit, slotIndex, o);
    this.emit('toast', { text: `🏪 ${o.title} står nu på plats ${slotIndex + 1}.`, kind: 'good' });
    this.emit('fit');
    this.save(); this.emit('change');
    return true;
  }
  sellSlot(slotIndex) {
    const F = this.shop.fit, s = this.fit.slots[slotIndex];
    if (!F || !s) return false;
    const back = Math.round(F.slotValue(s, this.year) * 0.4 / 50) * 50;
    this.money += back;
    this.fit.slots[slotIndex] = null;
    this.emit('toast', { text: `Platsen är tom igen – du fick tillbaka ${fmt(back)} kr.`, kind: '' });
    this.emit('fit');
    this.save(); this.emit('change');
    return true;
  }
  // ---------- Egna modeller (shops/dator/models.js) ----------
  get lokal() { return this.shop.fit ? this.shop.fit.lokalOf(this.fit) : 1; }
  modelOf(id) { return (this.models || []).find((m) => m.id === id) || null; }
  // hur många hela datorer lagret räcker till
  modelUnits(m) { let n = Infinity; for (const id of m.parts) n = Math.min(n, this.stockFree(id)); return isFinite(n) ? n : 0; }
  createModel(spec) {
    const MOD = this.shop.models;
    if (!MOD) return false;
    const y = this.year, parts = MOD.sortIds((spec.parts || []).filter((id) => this.shop.part[id]));
    const probs = MOD.problems(parts, y, (p) => this.canSell(p));
    if (probs.length) { this.emit('toast', { text: probs[0], kind: 'bad' }); return false; }
    if (!MOD.USE[spec.use] || !MOD.AUD[spec.aud]) return false;
    const camps = MOD.campaignsFor(y), camp = camps.find((c) => c.id === (spec.campaign || 'ingen')) || camps[0];
    if (camp.cost > this.money) { this.emit('toast', { text: 'Inte tillräckligt med pengar till kampanjen!', kind: 'bad' }); return false; }
    const name = String(spec.name || '').trim().slice(0, 32) || MOD.nameFor(parts, spec.use);
    const list = MOD.partsOf(parts), pi = MOD.priceInfo(list, 0, spec.aud, y);
    const price = Math.max(100, Math.round((+spec.price || pi.suggested) / 10) * 10);
    const prev = spec.prevId ? this.modelOf(spec.prevId) : null;
    this.money -= camp.cost;
    const m = { id: this.nextId++, name, use: spec.use, aud: spec.aud, parts, price, year: y, campaign: camp.id, state: 'recension', reviewAt: this.time + REVIEW_TIME,
      hype: 0.5 + camp.hype + (prev ? 0.25 * (prev.hype || 0) + (prev.review?.hof ? 0.2 : 0) : 0), prevHof: !!prev?.review?.hof, sold: 0, lost: 0, earned: 0, review: null, gen: prev ? (prev.gen || 1) + 1 : 1 };
    if (prev) { prev.state = 'retired'; prev.hype = 0; }
    this.models.push(m);
    this.stats.models = (this.stats.models || 0) + 1;
    this.emit('toast', { text: `🧩 ${m.name} är lanserad${camp.cost ? ` – ${camp.name.toLowerCase()} för ${fmt(camp.cost)} kr` : ''}. Datormagazin testar den nu.`, kind: 'good' });
    this.save(); this.emit('change');
    return m.id;
  }
  retireModel(id) {
    const m = this.modelOf(id);
    if (!m) return false;
    m.state = 'retired'; m.hype = 0;
    this.emit('toast', { text: `${m.name} har lagts ner.`, kind: '' });
    this.save(); this.emit('change');
    return true;
  }
  sequelModel(id, spec = {}) {
    const MOD = this.shop.models, prev = this.modelOf(id);
    if (!MOD || !prev) return false;
    const parts = spec.parts || MOD.sequelOf(prev, this.year, (p) => this.canSell(p));
    return this.createModel({ ...spec, use: prev.use, aud: spec.aud || prev.aud, parts, name: spec.name || MOD.nextName(prev.name), prevId: prev.id });
  }
  // köp in delar till n hela datorer av modellen
  buyForModel(id, n = 1) {
    const m = this.modelOf(id);
    if (!m || n < 1) return false;
    const list = [];
    for (const pid of m.parts) {
      const p = this.shop.part[pid];
      if (!this.onSale(p) || !this.canSell(p)) { this.emit('toast', { text: `${p.name} går inte att köpa ${this.year} – gör en uppföljare.`, kind: 'bad' }); return false; }
      const need = Math.max(0, n - this.stockFree(pid) - this.incoming(pid));
      if (need) list.push([pid, need]);
    }
    if (!list.length) { this.emit('toast', { text: 'Delarna finns redan i lagret.', kind: '' }); return true; }
    return this.buyMany(list);
  }
  reviewModel(m) {
    const MOD = this.shop.models;
    if (!MOD) return;
    m.review = MOD.review(m, this.year, { rykte: this.rykte, prevHof: m.prevHof });
    m.state = 'sale';
    m.hype = Math.max(0.1, m.hype + (m.review.total - 20) / 40);
    const d = m.review.hof ? 12 : m.review.total >= 26 ? 6 : m.review.total <= 14 ? -6 : 0;
    this.stats.stars = Math.max(0, (this.stats.stars || 0) + d);
    if (m.review.hof) this.stats.hof = (this.stats.hof || 0) + 1;
    this.emit('review', m);
    this.save(); this.emit('change');
  }
  // säljer en dator av modellen ur lagret (delarna dras); returnerar priset eller 0
  sellModelUnit(m, mul = 1) {
    if (this.modelUnits(m) < 1) return 0;
    for (const id of m.parts) { this.stock[id]--; this.clampShown(id); }
    const price = Math.round(m.price * mul / 10) * 10;
    this.money += price; this.stats.earned += price; this.xp += 2;
    m.sold++; m.earned += price;
    return price;
  }
  modelTick() {
    const MOD = this.shop.models;
    if (!MOD) return;
    const y = this.year, lokal = this.lokal, notes = [];
    // avtal först: leverera det som lovats
    for (const b of this.bulk) {
      if (b.left <= 0 || b.until < y) continue;
      const m = this.models.filter((x) => x.state === 'sale' && x.use === b.use).sort((a, c) => (c.review?.total || 0) - (a.review?.total || 0))[0];
      if (!m) continue;
      let got = 0, sum = 0;
      while (b.left > 0 && got < 3) { const p = this.sellModelUnit(m, b.mul || 0.9); if (!p) break; b.left--; got++; sum += p; }
      if (got) notes.push(`🏢 ${b.name} hämtade ${got} st ${m.name}: +${fmt(sum)} kr${b.left ? ` (${b.left} kvar)` : ' – avtalet är klart!'}`);
      else notes.push(`🏢 ${b.name} väntar på ${b.left} st ${m.name} – delarna saknas i lagret.`);
    }
    this.bulk = this.bulk.filter((b) => b.left > 0 && b.until >= y);
    for (const m of this.models) {
      if (m.state !== 'sale') continue;
      const rate = MOD.salesRate(m, y, { lokal, eventMul: this.eventMul('sales', m.use) });
      let n = Math.floor(rate);
      if (Math.random() < rate - n) n++;
      let sold = 0, sum = 0;
      for (let i = 0; i < n; i++) { const p = this.sellModelUnit(m); if (!p) { m.lost += n - i; break; } sold++; sum += p; }
      if (sold) { m.warned = false; notes.push(`📮 ${sold} st ${m.name} ${sold === 1 ? 'såld' : 'sålda'} via postorder: +${fmt(sum)} kr`); }
      else if (n && !m.warned) { m.warned = true; notes.push(`⚠️ ${m.name}: kunder ville köpa, men delarna saknas i lagret.`); }
      m.hype = Math.max(0.15, m.hype * 0.97);
      // delar som slutat säljas: modellen går ur tiden när lagret är tomt
      if (m.parts.some((id) => !this.onSale(this.shop.part[id])) && this.modelUnits(m) < 1) { m.state = 'utgangen'; notes.push(`🕰️ ${m.name} har gått ur tiden – gör en uppföljare med årets delar.`); }
    }
    for (const t of notes.slice(0, 3)) this.emit('toast', { text: t, kind: /^[⚠🕰]/u.test(t) ? 'bad' : 'good' });
    if (notes.length) { this.save(); this.emit('change'); }
  }
  // ---------- Personal (core/staff.js) ----------
  hire(id) { const ok = staffHire(this, id); if (ok) { this.save(); this.emit('change'); } return ok; }
  fire(id) { const ok = staffFire(this, id); if (ok) { this.save(); this.emit('change'); } return ok; }
  train(id, courseId) { const ok = staffTrain(this, id, courseId); if (ok) { this.save(); this.emit('change'); } return ok; }
  // spelaren tar över en beställning: teknikern släpper den
  touchOrder(orderId) {
    const o = this.orders.find((x) => x.id === orderId);
    if (!o) return false;
    o.touched = true;
    if (o.staff) { const s = this.staff.find((x) => x.id === o.staff); if (s) staffRelease(this, s); else delete o.staff; this.emit('change'); }
    return true;
  }
  // ---------- Händelser (shops/dator/events.js) ----------
  get activeEvents() { const E = this.shop.events; return E ? (this.events?.active || []).map((a) => ({ ...a, ev: E.EVENT[a.id] })).filter((a) => a.ev) : []; }
  // faktor för en nyckel ('spawn', 'price' + kategori, 'sales' + användning …) över alla pågående händelser
  eventMul(key, sub = null) {
    let f = 1;
    for (const a of this.events?.active || []) {
      const e = a.effect || {}, v = sub === null ? e[key] : e[key] && (e[key][sub] ?? e[key].all);
      if (typeof v === 'number') f *= v;
    }
    return f;
  }
  // 'repair' = största andelen, 'bonus' = summan; null om ingen händelse säger något
  eventVal(key) {
    let sum = 0, max = null;
    for (const a of this.events?.active || []) { const v = a.effect?.[key]; if (typeof v !== 'number') continue; sum += v; max = max === null ? v : Math.max(max, v); }
    return key === 'bonus' ? (max === null ? null : sum) : max;
  }
  eventCheck() {
    const E = this.shop.events;
    if (!E || this.mirror || !this.events) return;
    const before = this.events.active.length;
    this.events.active = this.events.active.filter((a) => a.until >= this.year);
    if (this.events.active.length !== before) { this.save(); this.emit('change'); }
    if (this.events.pending) {
      // efter omladdning: visa den väntande händelsen igen
      if (this._shownEvent !== this.events.pending) { this._shownEvent = this.events.pending; const ev = E.EVENT[this.events.pending]; if (ev) this.emit('event', ev); }
      return;
    }
    // första rubriken kommer efter första betalande kunden på egen hand – inte mitt i guiden
    if (this.tutorialStep < this.shop.tutorialCount || (this.stats.served || 0) <= this.shop.tutorialCount) return;
    const ev = E.nextEvent(this.year, this.events.seen);
    if (!ev) return;
    this.events.pending = ev.id; this._shownEvent = ev.id;
    this.save(); this.emit('event', ev);
  }
  chooseEvent(id, choiceId) {
    const E = this.shop.events, ev = E?.EVENT[id];
    if (!ev || this.events.pending !== id) return false;
    const ch = ev.choices.find((c) => c.id === choiceId) || ev.choices[ev.choices.length - 1];
    const need = E.needText(ch.need, this);
    if (need) { this.emit('toast', { text: `Går inte: ${need}.`, kind: 'bad' }); return false; }
    if ((ch.cost || 0) > this.money) { this.emit('toast', { text: 'Inte tillräckligt med pengar!', kind: 'bad' }); return false; }
    this.money -= ch.cost || 0;
    const eff = { ...(ev.effect || {}), ...(ch.effect || {}) };
    // det som händer direkt
    if (eff.money) { this.money += eff.money; if (eff.money > 0) this.stats.earned += eff.money; }
    if (eff.stars) this.stats.stars = Math.max(0, (this.stats.stars || 0) + eff.stars);
    if (eff.hype) for (const m of this.models) if (m.state === 'sale' || m.state === 'recension') m.hype += eff.hype[m.use] ?? eff.hype.all ?? 0;
    if (eff.stock) for (const [pid, n] of Object.entries(eff.stock)) if (this.shop.part[pid]) { this.stock[pid] = (this.stock[pid] || 0) + n; this.shown[pid] = (this.shown[pid] || 0) + n; }
    if (eff.stockCat) for (const [cat, n] of Object.entries(eff.stockCat)) {
      // n st av en mellanbillig del i kategorin, till dagens pris (innan händelsen slår igenom)
      const cand = this.shop.onSale(this.year).filter((q) => q.cat === cat && this.canSell(q)).sort((a, b) => a.cost - b.cost);
      const p = cand[Math.min(cand.length - 1, Math.floor(cand.length / 3))];
      if (p) { this.money -= p.cost * n; this.stock[p.id] = (this.stock[p.id] || 0) + n; this.shown[p.id] = (this.shown[p.id] || 0) + n; }
    }
    if (eff.bulk) this.bulk.push({ ...eff.bulk, left: eff.bulk.n, until: this.year + (ev.dur || 1) });
    const lasting = {};
    for (const k of [...E.MUL_KEYS, ...E.MAP_KEYS, 'repair', 'bonus']) if (eff[k] !== undefined) lasting[k] = eff[k];
    this.events.seen.push(id); this.events.pending = null;
    this.events.active.push({ id, choice: ch.id, until: this.year + (ev.dur || 1) - 1, effect: lasting });
    this.stats.events = (this.stats.events || 0) + 1;
    this.emit('toast', { text: `${ev.icon} ${ch.text || ch.label}`, kind: '' });
    this.save(); this.emit('change');
    return true;
  }
  // ---------- Speldatorn på spelbordet ----------
  deskParts() { const out = {}; for (const [cat, id] of Object.entries(this.deskPc?.parts || {})) if (this.shop.part[id]) out[cat] = this.shop.part[id]; return out; }
  // vad datorn får ihop: fel-lista (tom = ok)
  deskProblems(parts) {
    const C = this.shop.compat, P = {};
    for (const [cat, id] of Object.entries(parts || {})) if (id && this.shop.part[id]) P[cat] = this.shop.part[id];
    const out = [];
    for (const cat of ['case', 'mb', 'cpu', 'ram', 'storage', 'psu']) if (!P[cat]) out.push(`saknar ${this.shop.cats[cat]?.name?.toLowerCase() || cat}`);
    if (!C || out.length) return out;
    if (!C.cpuFitsMb(P.cpu, P.mb)) out.push('processorn passar inte moderkortets sockel');
    if (!C.ramFitsMb(P.ram, P.mb)) out.push('minnet är fel typ för moderkortet');
    if (!C.caseFitsMb(P.case, P.mb)) out.push('moderkortet får inte plats i chassit');
    if (!C.storageFitsMb(P.storage, P.mb)) out.push('lagringen passar inte moderkortet');
    if (C.needsGpu(P.mb, P.cpu) && !P.gpu) out.push('behöver ett grafikkort (ingen inbyggd grafik)');
    if (P.gpu && !C.cardsFit([P.gpu.bus], P.mb)) out.push('grafikkortet passar inte moderkortets kortplatser');
    if (P.cpu.needs && P.cpu.needs !== 'none' && !P.cooler) out.push('processorn behöver en kylare');
    if (P.cooler && !C.coolerFitsCpu(P.cooler, P.cpu)) out.push('kylaren passar inte processorn');
    if (!C.psuFits(P.psu, P.mb, P.cpu, P.gpu).ok) out.push('nätaggregatet har fel kontakter');
    else if (P.psu.watt < C.wattNeed(P.cpu, P.gpu, 0, this.year)) out.push('nätaggregatet är för svagt');
    return out;
  }
  deskBuild(parts) {
    const clean = {};
    for (const [cat, id] of Object.entries(parts || {})) if (id && this.shop.part[id]?.cat === cat && this.stockFree(id) > 0) clean[cat] = id;
    if (this.deskProblems(clean).length) return false;
    if (this.deskPc) this.deskUnbuild();
    for (const id of Object.values(clean)) this.takeStock(id);
    this.deskPc = { parts: clean };
    this.emit('toast', { text: '🖥️ Speldatorn står på bordet – gå dit och spela!', kind: 'good' });
    this.emit('fit'); this.save(); this.emit('change');
    return true;
  }
  deskUnbuild() {
    if (!this.deskPc) return false;
    for (const id of Object.values(this.deskPc.parts)) this.returnStock(id);
    this.deskPc = null;
    this.emit('fit'); this.save(); this.emit('change');
    return true;
  }
  buyItem(id) {
    const F = this.shop.fit, it = F?.itemInfo(id);
    if (!it || this.fit.items[id]) return false;
    if (it.year > this.year) return false;
    if (it.needs && !this.fit.items[it.needs]) return false;
    const cost = F.priceFor(it.cost, this.year);
    if (cost > this.money) { this.emit('toast', { text: 'Inte tillräckligt med pengar!', kind: 'bad' }); return false; }
    this.money -= cost;
    this.fit.items[id] = 1;
    this.emit('toast', { text: `✨ ${it.name} är på plats!`, kind: 'good' });
    this.emit('fit');
    this.save(); this.emit('change');
    return true;
  }

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
  costOf(p) { return Math.round(p.cost * this.eventMul('price', p.cat) / 10) * 10; }
  buy(id, n = 1) {
    const p = this.shop.part[id], cost = this.costOf(p) * n;
    if (!this.onSale(p)) { this.emit('toast', { text: p.year > this.year ? `${p.name} finns inte förrän ${p.year}.` : `${p.name} säljs inte längre.`, kind: 'bad' }); return false; }
    if (!this.canSell(p)) { this.emit('toast', { text: `🔒 ${p.name} ${this.needFor(p)}.`, kind: 'bad' }); return false; }
    if (this.money < cost) { this.emit('toast', { text: 'Inte tillräckligt med pengar!', kind: 'bad' }); return false; }
    this.money -= cost;
    let box = this.deliveries.find((d) => d.state === 'coming' && d.packUntil > this.time);
    if (!box) { box = { id: this.nextId++, items: {}, state: 'coming', eta: this.time + DELIVERY_TIME, packUntil: this.time + PACK_WINDOW }; this.deliveries.push(box); }
    box.items[id] = (box.items[id] || 0) + n;
    this.save(); this.emit('change');
    return true;
  }
  buyMany(list) {
    const cost = list.reduce((s, [id, n]) => s + this.costOf(this.shop.part[id]) * n, 0);
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
    if (order.repair) return [];   // kunden kommer med sina egna delar
    const need = {};
    for (const it of order.items) if (it.part) need[it.part] = (need[it.part] || 0) + 1;
    const out = [];
    for (const [id, n] of Object.entries(need)) if (this.stockFree(id) < n) out.push({ id, need: n, have: this.stockFree(id), buy: n - this.stockFree(id) });
    return out;
  }
  missingChoices(order) {
    if (order.repair) return [];
    return order.items.filter((it) => it.choice && !Object.keys(this.stock).some((id) => this.stock[id] > 0 && this.shop.part[id]?.cat === it.cat)).map((it) => it.cat);
  }
  // saknade delar som inte redan är på väg
  toBuyFor(order) { return this.missingFor(order).map((m) => ({ ...m, buy: Math.max(0, m.buy - this.incoming(m.id)) })).filter((m) => m.buy > 0 && this.onSale(this.shop.part[m.id]) && this.canSell(this.shop.part[m.id])); }
  buyMissing(order) {
    const miss = this.toBuyFor(order);
    if (!this.buyMany(miss.map((m) => [m.id, m.buy]))) return false;
    this.emit('toast', { text: '🚚 Delarna är beställda – packa upp lådan när den kommer.', kind: 'good' });
    return true;
  }

  // ---------- Byta delar i en beställning ----------
  // target = { customerId } (kunden står vid disken) eller { orderId } (jobbet är mottaget)
  orderOf(target) {
    if (target.orderId != null) return this.orders.find((x) => x.id === target.orderId) || null;
    return this.customers.find((c) => c.id === target.customerId)?.order || null;
  }
  // sitter delen redan i datorn?
  isPlaced(o, partId) { return !!o.build?.placed && Object.values(o.build.placed).some((q) => q.id === partId); }
  swapItem(target, index, partId) {
    const o = this.orderOf(target), p = this.shop.part[partId];
    if (!o || !p || o.repair || o.product) return false;
    const it = o.items[index];
    if (!it || it.cat !== p.cat || it.part === partId) return false;
    if (it.part && this.isPlaced(o, it.part)) { this.emit('toast', { text: 'Den delen sitter redan i datorn – ta ur den först.', kind: 'bad' }); return false; }
    const others = o.items.filter((x, i) => i !== index && x.part).map((x) => this.shop.part[x.part]).filter(Boolean);
    if (this.shop.fitsWith && !this.shop.fitsWith(p, others, this.year)) { this.emit('toast', { text: `${p.name} passar inte ihop med de andra delarna.`, kind: 'bad' }); return false; }
    if (target.orderId != null) {
      if (this.stockFree(partId) < 1) { this.emit('toast', { text: `${p.name} finns inte i lagret.`, kind: 'bad' }); return false; }
      const i = it.part ? o.reserved.indexOf(it.part) : -1;
      if (i >= 0) { o.reserved.splice(i, 1); this.returnStock(it.part); }
      if (o.chosen[p.cat]) { this.returnStock(o.chosen[p.cat]); delete o.chosen[p.cat]; }
      this.takeStock(partId); o.reserved.push(partId);
      this.shop.layout?.resetRig?.(o);
    }
    it.part = partId; delete it.choice; delete it.gone;
    this.emit('toast', { text: `🔁 ${p.name} i stället.`, kind: 'good' });
    this.save(); this.emit('change');
    return true;
  }
  addItem(target, partId) {
    const o = this.orderOf(target), p = this.shop.part[partId];
    if (!o || !p || o.repair || o.product) return false;
    if (!['gpu', 'sound'].includes(p.cat) || o.items.some((x) => x.cat === p.cat)) return false;
    const others = o.items.filter((x) => x.part).map((x) => this.shop.part[x.part]).filter(Boolean);
    if (this.shop.fitsWith && !this.shop.fitsWith(p, others, this.year)) { this.emit('toast', { text: `${p.name} passar inte i den här datorn.`, kind: 'bad' }); return false; }
    if (target.orderId != null) {
      if (this.stockFree(partId) < 1) { this.emit('toast', { text: `${p.name} finns inte i lagret.`, kind: 'bad' }); return false; }
      this.takeStock(partId); o.reserved.push(partId);
      this.shop.layout?.resetRig?.(o);
    }
    o.items.push({ cat: p.cat, part: partId });
    o.items.sort((a, b) => this.shop.catOrder.indexOf(a.cat) - this.shop.catOrder.indexOf(b.cat));
    this.emit('toast', { text: `➕ ${p.name} läggs till – kunden betalar ${fmt(this.shop.retail(p))} kr extra.`, kind: 'good' });
    this.save(); this.emit('change');
    return true;
  }

  // ---------- Kunder ----------
  // Delar som slutat säljas byts mot likvärdiga som finns i år (kunden ändrar sig)
  refreshOrder(order) {
    if (!order || !this.shop.fixOrder || order.product || order.repair) return null;
    return this.shop.fixOrder(order, this.year, (id) => this.stockFree(id));
  }
  hasGone(order) { return order.items.some((it) => it.gone); }

  spawn(order) {
    if (!order) return null;
    this.refreshOrder(order);
    const pat = Math.round(QUEUE_PATIENCE * this.patienceMul);
    const c = {
      id: this.nextId++, name: order.name, look: makeLook(), order,
      phase: 'arriving', patience: pat, patienceMax: pat,
      x: 262, y: 170, dir: 'left', walk: 0, mood: null, bubbleT: 0,
    };
    if (order.tutorial !== undefined) { c.patience = c.patienceMax = Infinity; }
    this.customers.push(c);
    this.emit('change');
    return c;
  }
  queue() { return this.customers.filter((c) => c.phase === 'arriving' || c.phase === 'queue'); }
  // trivsel ger tålamod, dragningskraft ger fler kunder, extra kassa längre kö
  get patienceMul() { return (1 + 0.05 * this.fitStats.trivsel) * this.eventMul('patience'); }
  get spawnMul() { return 1 / ((1 + 0.12 * this.fitStats.drag) * this.eventMul('spawn')); }
  get maxQueue() { return MAX_QUEUE + this.fitStats.queue; }

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
        if (this.queue().length < this.maxQueue && this.orders.length < MAX_ORDERS && this.customers.length < 7 && (!empty || this.queue().length === 0)) {
          this.spawn(this.shop.generateOrder(this, FIRST_NAMES));
        }
        this.spawnTimer = (Math.max(14, 40 - this.level * 5) + Math.random() * 12) * (empty ? 1.6 : 1) * this.spawnMul;
      }
    }
    // arkadmaskinerna drar in mynt
    if (this.shop.fit) {
      this.arcadeT = (this.arcadeT || 0) + dt;
      if (this.arcadeT >= 60) {
        this.arcadeT = 0;
        let earn = 0;
        for (const s of this.fit.slots) if (s && s.kind === 'unit' && s.unit === 'arkad') { const a = this.shop.part[s.product]; if (a) earn += Math.round(a.coin * 6 * (0.4 + this.shop.hypeAt(a, this.year))); }
        for (const id of this.fit.arcade || []) { const a = this.shop.part[id]; if (a) earn += Math.round(a.coin * 9 * (0.4 + this.shop.hypeAt(a, this.year))); }
        this.arcadeEarned = (this.arcadeEarned || 0) + earn;
        if (earn > 0) { this.money += earn; this.stats.earned += earn; this.emit('toast', { text: `🕹️ Arkadmaskinerna drog in ${fmt(earn)} kr.`, kind: 'good' }); this.save(); this.emit('change'); }
      }
    }
    // egna modeller säljer via postorder och får sin recension; händelser dyker upp
    if (this.shop.models) {
      this.modelT = (this.modelT || 0) + dt;
      if (this.modelT >= MODEL_TICK) { this.modelT = 0; this.modelTick(); }
      for (const m of this.models) if (m.state === 'recension' && this.time >= m.reviewAt) this.reviewModel(m);
    }
    this.eventT = (this.eventT || 0) + dt;
    if (this.eventT >= 1) { this.eventT = 0; this.eventCheck(); }
    // personalen jobbar
    if (this.staff?.length) tickStaff(this, dt);
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
    // färdiga produkter säljs direkt över disk: kunden går till utlämningen och betalar
    if (order.product) {
      const id = order.product;
      this.stock[id]--; this.clampShown(id);
      const price = this.shop.priceFor(order, {});
      c.payout = { price, tip: 0, bonus: 0, total: price, xp: this.shop.xpFor(order), stars: 3, product: true };
      c.phase = 'ready'; c.patience = Infinity;
      this.stats.sold = (this.stats.sold || 0) + 1;
      this.save(); this.emit('change');
      return { id: 'sale', product: id };
    }
    const reserved = [];
    if (!order.repair) for (const it of order.items) if (it.part) { this.stock[it.part]--; this.clampShown(it.part); reserved.push(it.part); }
    const nParts = order.items.length;
    const o = { id: this.nextId++, customerId: c.id, ...order, reserved, chosen: {}, build: null, startedAt: this.time };
    if (order.repair) {
      // datorn står på bänken med felet inlagt; diagnosavgiften betalas direkt
      o.build = this.shop.makeRepairBuild ? this.shop.makeRepairBuild(o) : null;
      const fee = Math.round((this.shop.diagnosisFee || 150) * this.eventMul('diag'));
      this.money += fee; this.stats.earned += fee;
      this.emit('toast', { text: `🔧 ${c.name} lämnar in datorn. Diagnosavgift +${fmt(fee)} kr.`, kind: 'good' });
    }
    this.orders.push(o);
    c.phase = 'waiting';
    if (order.tutorial === undefined) { c.patience = c.patienceMax = Math.round((240 + nParts * 25) * this.patienceMul); }
    this.save(); this.emit('change');
    return o;
  }
  decline(c) {
    this.stats.declined++;
    if (c.order.tutorial !== undefined) this.tutorialStep++;
    // ville kunden ha något butiken inte får sälja hamnar det på efterfrågantavlan
    for (const need of this.demandFor(c.order)) this.noteDemand(need);
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
    const tipMul = 1 + this.rykte / 40 + (this.fit.items.kaffe ? 0.05 : 0);
    const tip = result.stars >= 3 ? Math.round(this.shop.feeFor(o) * 0.5 * tipMul / 10) * 10 : result.stars === 2 ? Math.round(this.shop.feeFor(o) * 0.2 * tipMul / 10) * 10 : 0;
    const bonus = (result.help === false ? Math.round(price * 0.15 / 10) * 10 : 0) + (this.eventVal('bonus') || 0);
    if (o.model) { const m = this.modelOf(o.model); if (m) { m.sold++; m.earned += price; m.hype = Math.min(2, m.hype + 0.03); } }
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
