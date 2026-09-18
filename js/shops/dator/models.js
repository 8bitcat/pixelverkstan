// Egna datormodeller – butikens "projekt" à la Game Dev Story. Användning × målgrupp har en
// dold kompatibilitet, delarna ger en spec-poäng mot vad året erbjuder, priset vägs mot
// målgruppens plånbok, och Datormagazins fyra kritiker sätter betyget som styr försäljningen.
// Ingen DOM här – körs även i Node (tools/handelser.mjs).
import { retail, CATS, CAT_ORDER } from './catalog.js';
import { DB, onSale } from './parts/index.js';
import * as C from './compat.js';
import { composeBuild, fitsWith, fixOrder } from './orders.js';
import { priceFor as indexPrice } from './upgrades.js';

// vikterna säger vad kritikerna tittar på; tier = vilka delar auto-förslaget siktar på
export const USES = [
  { id: 'gamer', name: 'Speldator', suffix: 'Game', icon: '🎮', desc: 'Grafikkort, ljud och fläkt – snabbast vinner.', gpu: 2.2, cpu: 1.2, ram: 0.8, storage: 0.4, sound: 0.6, cheap: 0, tier: [3, 5] },
  { id: 'kontor', name: 'Kontorsdator', suffix: 'Office', icon: '💼', desc: 'Stabil, tyst och lagom – till brev och kalkyler.', gpu: 0.2, cpu: 0.9, ram: 0.9, storage: 1.0, sound: 0, cheap: 0.8, tier: [1, 3] },
  { id: 'skola', name: 'Skoldator', suffix: 'Edu', icon: '🎒', desc: 'Tålig och billig – många ska ha en.', gpu: 0.4, cpu: 0.7, ram: 0.8, storage: 0.6, sound: 0.2, cheap: 1.2, tier: [1, 2] },
  { id: 'budget', name: 'Budgetdator', suffix: 'Eco', icon: '🪙', desc: 'Så billig som möjligt – men den ska funka.', gpu: 0.1, cpu: 0.5, ram: 0.5, storage: 0.5, sound: 0, cheap: 2.0, tier: [1, 1] },
  { id: 'media', name: 'Mediastudio', suffix: 'Studio', icon: '🎬', desc: 'Minne, lagring och ljud – till musik, bild och film.', gpu: 1.0, cpu: 1.3, ram: 1.6, storage: 1.5, sound: 1.2, cheap: 0, tier: [3, 5] },
];
export const AUDS = [
  { id: 'tonaring', name: 'Tonåringar', icon: '🧑‍🎤', wallet: 0.8, desc: 'Vill ha det snabbaste – har veckopeng.' },
  { id: 'familj', name: 'Familjer', icon: '👨‍👩‍👧', wallet: 1.0, desc: 'En dator som alla ska dela på.' },
  { id: 'student', name: 'Studenter', icon: '🎓', wallet: 0.7, desc: 'Plugg på dagen, spel på natten. Tomma fickor.' },
  { id: 'foretag', name: 'Företag', icon: '🏢', wallet: 1.5, desc: 'Betalar bra – om den bara funkar.' },
  { id: 'pensionar', name: 'Pensionärer', icon: '👴', wallet: 0.9, desc: 'Enkelt och billigt, tack. Ingen krångelmaskin.' },
];
export const USE = Object.fromEntries(USES.map((u) => [u.id, u]));
export const AUD = Object.fromEntries(AUDS.map((a) => [a.id, a]));

// dold kompatibilitet (−2 … 3) – det man lär sig genom att prova, precis som i Game Dev Story
const COMPAT = {
  gamer:  { tonaring: 3, familj: 1, student: 3, foretag: -1, pensionar: -2 },
  kontor: { tonaring: -1, familj: 1, student: 1, foretag: 3, pensionar: 2 },
  skola:  { tonaring: 1, familj: 2, student: 3, foretag: 0, pensionar: 0 },
  budget: { tonaring: 0, familj: 2, student: 2, foretag: 0, pensionar: 3 },
  media:  { tonaring: 1, familj: 0, student: 2, foretag: 2, pensionar: -1 },
};
export const compatOf = (use, aud) => COMPAT[use]?.[aud] ?? 0;

// lanseringskampanjer: hype direkt, mot pengar
export const CAMPAIGNS = [
  { id: 'ingen', name: 'Ingen kampanj', icon: '🤫', cost: 0, hype: 0, desc: 'Ryktet får sprida sig av sig självt.' },
  { id: 'flygblad', name: 'Flygblad', icon: '📄', cost: 500, hype: 0.15, desc: 'Lappar i brevlådorna och på Konsums anslagstavla.' },
  { id: 'annons', name: 'Tidningsannons', icon: '📰', cost: 2500, hype: 0.35, desc: 'Helsida i Datormagazin.' },
  { id: 'tv', name: 'TV-reklam', icon: '📺', cost: 15000, hype: 0.8, year: 1992, desc: 'Reklamfilm mellan programmen.' },
  { id: 'natet', name: 'Nätkampanj', icon: '💻', cost: 4000, hype: 0.6, year: 2005, desc: 'Banners, forum och sociala medier.' },
];
export const CAMPAIGN = Object.fromEntries(CAMPAIGNS.map((c) => [c.id, c]));
export const campaignsFor = (year) => CAMPAIGNS.filter((c) => !c.year || year >= c.year).map((c) => ({ ...c, cost: indexPrice(c.cost, year) }));

export const MODEL_CATS = ['case', 'mb', 'cpu', 'cooler', 'ram', 'storage', 'media', 'gpu', 'sound', 'psu', 'fans'];
export const OPTIONAL_CATS = ['gpu', 'sound', 'media', 'fans'];
const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const cheapest = (a) => a.reduce((m, p) => (!m || p.cost < m.cost ? p : m), null);
const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
const isFloppy = (p) => String(p.kind || '').startsWith('floppy');

export const partsOf = (ids) => (ids || []).map((id) => DB.part[id]).filter(Boolean);
// en del per kategori (för mediakortet räknas CD/DVD före disketten)
export function byCat(list) {
  const P = {};
  for (const p of list) if (!P[p.cat] || (p.cat === 'media' && isFloppy(P[p.cat]) && !isFloppy(p))) P[p.cat] = p;
  return P;
}
export function requiredCats(P) {
  const need = ['case', 'mb', 'cpu', 'ram', 'storage', 'psu'];
  if (P.cpu && P.cpu.needs !== 'none') need.push('cooler');
  if (P.mb && P.cpu && C.needsGpu(P.mb, P.cpu)) need.push('gpu');
  return need;
}
export const sortIds = (ids) => [...ids].sort((a, b) => CAT_ORDER.indexOf(DB.part[a]?.cat) - CAT_ORDER.indexOf(DB.part[b]?.cat));

// Vad som hindrar modellen från att lanseras (tom lista = klar)
export function problems(ids, year, allow = null) {
  const out = [];
  const list = [];
  for (const id of ids || []) { const p = DB.part[id]; if (!p) out.push(`Okänd del: ${id}`); else list.push(p); }
  const P = byCat(list);
  for (const cat of requiredCats(P)) if (!P[cat]) out.push(`Saknar ${CATS[cat].name.toLowerCase()}`);
  const seen = {};
  for (const p of list) {
    const key = p.cat === 'media' ? (isFloppy(p) ? 'floppy' : 'optical') : p.cat;
    if (seen[key]) out.push(`Två av samma sort: ${CATS[p.cat].name.toLowerCase()}`);
    seen[key] = 1;
    if (!(p.year <= year && (p.until ?? 9999) >= year)) out.push(`${p.name} säljs inte ${year}`);
    else if (allow && !allow(p)) out.push(`${p.name} får butiken inte sälja än`);
    if (!fitsWith(p, list.filter((q) => q !== p), year)) out.push(`${p.name} passar inte ihop med resten`);
  }
  return out;
}

// ---------- poäng ----------
const T = (p) => (p ? (p.tier - 1) / 4 : 0);   // 0..1 inom sitt år
export function specScore(P, use) {
  const u = USE[use] || USES[0];
  let s = 0, max = 0;
  for (const cat of ['gpu', 'cpu', 'ram', 'storage']) { max += u[cat]; s += u[cat] * T(P[cat]); }
  if (u.sound) { max += u.sound; s += u.sound * (P.sound || P.mb?.audio ? 1 : 0); }
  if (P.media && !isFloppy(P.media)) { s += 0.2; }
  max += 0.2;
  return max ? clamp(s / max) : 0;
}
const refCache = new Map();
// billigaste och dyraste hela datorn i år – så att "billig" betyder något varje år
export function costRefs(year) {
  if (refCache.has(year)) return refCache.get(year);
  const lo = {}, hi = {};
  for (const p of onSale(year)) {
    if (!MODEL_CATS.includes(p.cat)) continue;
    if (!lo[p.cat] || p.cost < lo[p.cat]) lo[p.cat] = p.cost;
    if (!hi[p.cat] || p.cost > hi[p.cat]) hi[p.cat] = p.cost;
  }
  const base = ['case', 'mb', 'cpu', 'ram', 'storage', 'psu'];
  const r = { lo: base.reduce((s, c) => s + (lo[c] || 0), 0), hi: base.reduce((s, c) => s + (hi[c] || 0), 0) + (hi.gpu || 0) + (hi.cooler || 0) };
  refCache.set(year, r);
  return r;
}
export const costOf = (list) => list.reduce((s, p) => s + p.cost, 0);
export function cheapScore(list, year) {
  const r = costRefs(year), c = costOf(list);
  return r.hi > r.lo ? clamp(1 - (c - r.lo) / (r.hi - r.lo)) : 0.5;
}
// pris mot målgruppens plånbok: mul = hur mycket priset drar upp eller ner försäljningen
export function priceInfo(list, price, aud, year) {
  const cost = costOf(list);
  const suggested = Math.round((list.reduce((s, p) => s + retail(p), 0) + indexPrice(700, year)) / 100) * 100;
  const margin = cost ? price / cost - 1 : 0;
  const target = 0.3 + 0.25 * ((AUD[aud]?.wallet ?? 1) - 1);
  const mul = clamp(1 + (target - margin) * 2, 0.15, 1.5);
  return { cost, suggested, margin, target, mul };
}

// ---------- Datormagazins fyra kritiker ----------
export const CRITICS = [
  { id: 'teknik', name: 'Datormagazin', who: 'Teknikredaktionen', icon: '🧪', looks: 'delarna' },
  { id: 'pris', name: 'Mikrodatorn', who: 'Prisjägaren', icon: '💰', looks: 'priset' },
  { id: 'malgrupp', name: 'PC Hemma', who: 'Familjesidan', icon: '🎯', looks: 'målgruppen' },
  { id: 'helhet', name: 'Läsarna', who: 'Insändarsidan', icon: '💌', looks: 'helheten' },
];
const Q = {
  teknik: { hi: ['Snabbast vi mätt i år.', 'Här har någon valt delar med hjärnan.', 'Vi hittar inget att klaga på. Det är ovanligt.'], mid: ['Gör jobbet, men inget mer.', 'Helt okej – varken mer eller mindre.', 'Fungerar. Imponerar inte.'], lo: ['Grafikkortet hör hemma på museum.', 'Vi somnade under uppstarten.', 'Delarna verkar valda med ögonbindel.'] },
  pris: { hi: ['Mer dator för pengarna finns inte.', 'Ett fynd – köp innan de tar slut.', 'Lågt pris utan att det känns billigt.'], mid: ['Priset är … rimligt.', 'Man får vad man betalar för.', 'Varken rea eller rån.'], lo: ['Vem ska ha råd med den här?', 'Dyrt, för att uttrycka det snällt.', 'Vi räknade två gånger. Priset stämde tyvärr.'] },
  malgrupp: { hi: ['Precis vad {aud} vill ha.', 'Träffar mitt i prick för {aud}.', '{aud} kommer att stå i kö.'], mid: ['{aud} nickar – men jublar inte.', 'Duger åt {aud}, med lite god vilja.'], lo: ['Vem är den här till? Inte {aud} i alla fall.', 'En {use} till {aud}? Någon har inte tänkt klart.', '{aud} lär skaka på huvudet.'] },
  helhet: { hi: ['Årets dator!', 'Vi vill ha en. Var och en av oss.', 'Ring och beställ. Nu.'], mid: ['Bra, men inte minnesvärd.', 'En dator bland andra.', 'Vi har sett sämre. Och bättre.'], lo: ['Vi väntar på uppföljaren.', 'Nej.', 'Butiken kan bättre än så här.'] },
};
const band = (s) => (s >= 8 ? 'hi' : s >= 5 ? 'mid' : 'lo');
export function review(m, year, opts = {}) {
  const list = partsOf(m.parts), P = byCat(list);
  const spec = specScore(P, m.use), cheap = cheapScore(list, year), comp = compatOf(m.use, m.aud);
  const pi = priceInfo(list, m.price, m.aud, year);
  const rnd01 = opts.rnd || Math.random;
  const jitter = () => Math.round((rnd01() - 0.5) * 2);
  const s10 = (x) => Math.max(1, Math.min(10, Math.round(1 + 9 * clamp(x))));
  const u = USE[m.use] || USES[0];
  const cheapW = u.cheap / (1 + u.cheap);   // budget bryr sig om priset lika mycket som prestandan
  const teknik = s10(spec * (1 - cheapW * 0.5) + cheap * cheapW * 0.5) + jitter();
  const pris = s10(0.45 + (pi.target - pi.margin) * 1.3 + cheap * 0.3) + jitter();
  const malgrupp = s10(((comp + 2) / 5) * 0.8 + spec * 0.2) + jitter();
  const rykte = opts.rykte || 0;
  const helhet = s10(((teknik + pris + malgrupp) / 30) * 0.85 + rykte / 120 + (opts.prevHof ? 0.08 : 0)) + jitter();
  const scores = [teknik, pris, malgrupp, helhet].map((s) => Math.max(1, Math.min(10, s)));
  const total = scores.reduce((a, b) => a + b, 0);
  const fill = (t) => { const s = t.replace('{aud}', (AUD[m.aud]?.name || 'kunderna').toLowerCase()).replace('{use}', (USE[m.use]?.name || 'dator').toLowerCase()); return s[0].toUpperCase() + s.slice(1); };
  const quotes = CRITICS.map((c, i) => fill(rnd(Q[c.id][band(scores[i])])));
  return { scores, total, quotes, hof: total >= 32, spec: +spec.toFixed(2), cheap: +cheap.toFixed(2), comp, margin: +pi.margin.toFixed(2) };
}

// Förväntade sålda per försäljningstick (spelet drar slumpen)
export const LOKAL_MUL = [0, 0.6, 0.8, 1, 1.3, 1.7, 2.2];
export function salesRate(m, year, opts = {}) {
  if (m.state !== 'sale' || !m.review) return 0;
  const q = m.review.total / 40;
  const age = Math.max(0, year - m.year - 1);
  const list = partsOf(m.parts), pi = priceInfo(list, m.price, m.aud, year);
  return 1.2 * q * q * m.hype * Math.pow(0.5, age) * (LOKAL_MUL[opts.lokal || 1] || 1) * pi.mul * (opts.eventMul || 1);
}

// ---------- förslag, namn, uppföljare ----------
export function suggestParts(use, year, allow = null) {
  const u = USE[use] || USES[0];
  const t = { id: 'modell', tier: u.tier, gpu: u.gpu >= 1 ? 'need' : 'auto', sound: u.sound >= 0.6 ? 1 : 0, optical: year >= 1993 ? 0.9 : 0, fans: use === 'gamer' ? 0.5 : 0.1, rgb: use === 'gamer' && year >= 2015 };
  const pick = u.cheap >= 1 ? cheapest : rnd;
  for (let i = 0; i < 40; i++) { const b = composeBuild(t, year, pick, allow); if (b) return sortIds(b.map((p) => p.id)); }
  for (let i = 0; i < 40; i++) { const b = composeBuild(t, year, rnd); if (b) return sortIds(b.map((p) => p.id)); }
  return null;
}
const FAMILY = [/(?:80)?(286|386|486)\w*/, /Pentium\s?(III|II|4|D|Pro|M|MMX)?/, /Celeron/, /Athlon(\s?(XP|64|II|FX))?/, /Core\s?(2|i\d)/, /Ryzen\s?\d/, /Duron/, /Phenom/, /K6(-\w+)?/, /Cyrix/, /(8088|8086|V20|V30)/, /Threadripper/];
export function nameFor(ids, use, brand = 'Pixel') {
  const P = byCat(partsOf(ids)), cpu = P.cpu;
  let fam = '';
  if (cpu) for (const r of FAMILY) { const mm = cpu.name.match(r); if (mm) { fam = mm[0].replace(/^80(\d86)/, '$1'); break; } }
  if (!fam && cpu) fam = cpu.name.split(' ').slice(1, 3).join(' ');
  return `${brand} ${fam} ${USE[use]?.suffix || ''}`.replace(/\s+/g, ' ').trim();
}
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
export function nextName(name) {
  const m = name.match(/\s(I|II|III|IV|V|VI|VII|VIII|IX|X)$/);
  if (!m) return name + ' II';
  const n = ROMAN.indexOf(m[1]);
  return name.slice(0, -m[1].length) + (ROMAN[n + 1] || `${n + 1}`);
}
// uppföljaren: samma idé med årets delar, och ett snäpp bättre grafikkort/processor/minne
export function sequelOf(m, year, allow = null) {
  const fake = { items: partsOf(m.parts).map((p) => ({ cat: p.cat, part: p.id })) };
  fixOrder(fake, year);
  let list = fake.items.filter((it) => !it.gone && it.part).map((it) => DB.part[it.part]);
  if (allow) {
    // det man inte får sälja byts mot det bästa man får
    list = list.map((p) => (allow(p) ? p : onSale(year).filter((q) => q.cat === p.cat && allow(q) && fitsWith(q, list.filter((o) => o !== p), year)).sort((a, b) => b.tier - a.tier || a.cost - b.cost)[0] || p));
  }
  const pool = onSale(year).filter((p) => !allow || allow(p));
  for (const cat of ['gpu', 'cpu', 'ram']) {
    const cur = list.find((p) => p.cat === cat);
    if (!cur) continue;
    const others = list.filter((p) => p !== cur);
    // den nya delen ska passa resten – och resten ska fortfarande passa den (kylaren mot processorn)
    const better = pool.filter((p) => p.cat === cat && p.tier === Math.min(5, cur.tier + 1) && fitsWith(p, others, year) && others.every((o) => fitsWith(o, [...others.filter((x) => x !== o), p], year))).sort((a, b) => a.cost - b.cost)[0];
    if (better) list[list.indexOf(cur)] = better;
  }
  // det som inte längre passar byts; det som saknas (t.ex. kylare till en ny processor) fylls på
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < list.length; i++) {
      const p = list[i], others = list.filter((x) => x !== p);
      if (fitsWith(p, others, year)) continue;
      const rep = pool.filter((q) => q.cat === p.cat && q !== p && fitsWith(q, others, year)).sort((a, b) => Math.abs(a.tier - p.tier) - Math.abs(b.tier - p.tier) || a.cost - b.cost)[0];
      if (rep) list[i] = rep; else if (OPTIONAL_CATS.includes(p.cat)) { list.splice(i, 1); i--; }
    }
    const P = byCat(list);
    for (const cat of requiredCats(P)) if (!P[cat]) { const c = pool.filter((q) => q.cat === cat && fitsWith(q, list, year)).sort((a, b) => a.cost - b.cost)[0]; if (c) list.push(c); }
  }
  let ids = sortIds(list.map((p) => p.id));
  // går det ändå inte ihop: ett färskt förslag med samma inriktning
  if (problems(ids, year, allow).length) { const fresh = suggestParts(m.use || 'kontor', year, allow); if (fresh && !problems(fresh, year, allow).length) ids = fresh; }
  return ids;
}
export const useName = (id) => USE[id]?.name || id;
export const audName = (id) => AUD[id]?.name || id;
