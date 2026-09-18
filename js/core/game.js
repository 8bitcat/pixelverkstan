// Spelmotorn: pengar, lager, erfarenhet, kunder och beställningar.
// Känner inte till datorer – allt specifikt kommer från shop-modulen.
import { FIRST_NAMES, makeLook } from './people.js';
import { SLOTS as FLOOR_SLOTS } from './floor-layout.js';

const QUEUE_PATIENCE = 75;   // sekunder i kön
const MAX_QUEUE = 3;
const MAX_ORDERS = 3;
export const XP_PER_YEAR = 30;   // erfarenhet per år som går
const DELIVERY_TIME = 12;        // sekunder från köp till att lådan står i butiken
const PACK_WINDOW = 8;           // köp inom så här många sekunder hamnar i samma låda
const SAVE_VERSIONS = [1, 2, 3, 4, 5];

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
    const data = { v: 5, money, xp, stock, shown: this.shown, deliveries, stats: this.stats, tutorialStep, startYear: this.startYear, start, nextId: this.nextId, fit: this.fit, demand: this.demand, deskPc: this.deskPc };
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
  buy(id, n = 1) {
    const p = this.shop.part[id], cost = p.cost * n;
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
  get patienceMul() { return 1 + 0.05 * this.fitStats.trivsel; }
  get spawnMul() { return 1 / (1 + 0.12 * this.fitStats.drag); }
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
      const fee = this.shop.diagnosisFee || 150;
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
