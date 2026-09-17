// Kundbeställningar för alla epoker (1983–2026). Kunderna beställer datorer som
// passar sin tid, helst av delar man har hemma – men ibland något man saknar.
import { retail, CAT_ORDER } from './catalog.js';
import { DB, onSale } from './parts/index.js';
import * as C from './compat.js';

// gpu: 'need' = alltid grafikkort, 'auto' = bara om kortet/processorn saknar grafik
const TEMPLATES = [
  // ---- 1980-talet ----
  { id: 'dos-kontor', name: 'Kontorsdator (MS-DOS)', years: [1983, 1991], tier: [1, 2], gpu: 'need', fee: 600, xp: 12,
    msgs: ['Vi ska skriva brev i WordPerfect på kontoret.', 'Jag behöver en PC till bokföringen – den ska köra MS-DOS.'] },
  { id: 'lotus', name: 'Kalkyldator (Lotus 1-2-3)', years: [1983, 1990], tier: [2, 3], gpu: 'need', fee: 700, xp: 14,
    msgs: ['Chefen vill räkna i Lotus 1-2-3 – helst en snabb maskin!'] },
  { id: 'hemdator', name: 'Hemdator för spel', years: [1984, 1992], tier: [1, 3], gpu: 'need', sound: 0.6, fee: 650, xp: 14,
    msgs: ["Barnen vill spela King's Quest och Prince of Persia!", 'Kan du bygga en PC med färggrafik? Grannens har bara grön skärm.'] },
  { id: 'cad', name: 'CAD-arbetsstation', years: [1985, 1995], tier: [4, 5], gpu: 'need', fee: 1200, xp: 24,
    msgs: ['Arkitektbyrån ska rita i AutoCAD – den måste vara riktigt snabb.'] },
  // ---- 1990-talet ----
  { id: 'win31', name: 'Windows 3.1-dator', years: [1991, 1996], tier: [2, 3], gpu: 'need', fee: 700, xp: 16,
    msgs: ['Vi vill köra Windows 3.1 med mus och allt!'] },
  { id: 'doom', name: 'DOOM-dator', years: [1993, 1997], tier: [3, 5], gpu: 'need', sound: 1, fee: 900, xp: 22,
    msgs: ['DOOM! Jag måste ha en snabb 486:a med ljudkort!'] },
  { id: 'multimedia', name: 'Multimedia-PC', years: [1993, 1999], tier: [2, 4], gpu: 'need', sound: 1, optical: 1, fee: 900, xp: 20,
    msgs: ['Jag vill ha CD-ROM och Sound Blaster – så man kan spela Myst!'] },
  { id: 'win95', name: 'Windows 95-dator', years: [1995, 1999], tier: [2, 3], gpu: 'need', optical: 0.8, fee: 800, xp: 18,
    msgs: ['Start-knappen! Vi vill ha Windows 95.'] },
  { id: 'quake', name: 'Quake-dator', years: [1996, 2001], tier: [3, 5], gpu: 'need', sound: 1, optical: 1, fee: 1000, xp: 26,
    msgs: ['Quake med ett riktigt 3D-kort, tack!'] },
  { id: 'internet', name: 'Internetdator', years: [1997, 2004], tier: [1, 3], gpu: 'need', optical: 1, fee: 700, xp: 16,
    msgs: ['Vi ska koppla upp oss på internet och skicka e-post.'] },
  // ---- 2000-talet ----
  { id: 'cs', name: 'Counter-Strike-dator', years: [2000, 2007], tier: [3, 4], gpu: 'need', optical: 1, fee: 1000, xp: 24,
    msgs: ['Vi ska lira Counter-Strike på LAN i helgen!'] },
  { id: 'kontor2000', name: 'Kontorsdator', years: [2000, 2012], tier: [1, 2], gpu: 'auto', optical: 0.7, fee: 600, xp: 12,
    msgs: ['En stabil dator för Word och Excel.'] },
  { id: 'wow', name: 'World of Warcraft-dator', years: [2004, 2011], tier: [3, 4], gpu: 'need', optical: 0.8, fans: 0.3, fee: 1100, xp: 26,
    msgs: ['Min guild väntar – jag behöver en dator till World of Warcraft!'] },
  { id: 'htpc', name: 'Mediacenter (HTPC)', years: [2006, 2015], tier: [2, 3], gpu: 'auto', optical: 1, fee: 900, xp: 20,
    msgs: ['Datorn ska stå under tv:n och spela film.'] },
  { id: 'crysis', name: 'Crysis-dator', years: [2007, 2012], tier: [4, 5], gpu: 'need', fans: 0.6, fee: 1400, xp: 32,
    msgs: ['"Can it run Crysis?" Den här måste kunna!'] },
  // ---- 2010-talet och framåt ----
  { id: 'kontor', name: 'Kontorsdator', years: [2013, 2026], tier: [1, 1], gpu: 'auto', fee: 700, xp: 12,
    msgs: ['Jag behöver en enkel dator till jobbet – mejl och kalkylark.', 'Något stabilt för att betala räkningar och ringa videosamtal.'] },
  { id: 'skola', name: 'Skoldator', years: [2010, 2026], tier: [1, 2], gpu: 'auto', fee: 700, xp: 14,
    msgs: ['Jag börjar gymnasiet och behöver en dator att plugga på.', 'Jag ska lära mig programmera!'] },
  { id: 'minecraft', name: 'Minecraft-dator', years: [2011, 2026], tier: [1, 2], gpu: 'need', fee: 800, xp: 18,
    msgs: ['Jag vill spela Minecraft med shaders!', 'Kan du bygga en dator till Roblox och Minecraft?'] },
  { id: 'gaming', name: 'Gamingdator', years: [2010, 2026], tier: [2, 3], gpu: 'need', fans: 0.4, rgb: true, fee: 950, xp: 22,
    msgs: ['Fortnite i hög fps, tack!', 'Jag vill spela nya spel med kompisarna.'] },
  { id: 'stream', name: 'Streamingdator', years: [2014, 2026], tier: [3, 4], gpu: 'need', fans: 0.7, rgb: true, fee: 1100, xp: 28,
    msgs: ['Jag ska börja streama! Den måste klara spel och sändning samtidigt.'] },
  { id: 'vr', name: 'VR-dator', years: [2016, 2026], tier: [4, 5], gpu: 'need', fans: 0.6, fee: 1300, xp: 30,
    msgs: ['Vi har köpt VR-glasögon – nu behövs en dator som orkar!'] },
  { id: 'ai', name: '3D- & AI-arbetsstation', years: [2020, 2026], tier: [4, 5], gpu: 'need', fans: 0.6, fee: 1500, xp: 34,
    msgs: ['Jag renderar 3D-filmer och tränar AI-modeller.', 'Min forskargrupp behöver en riktig räknemaskin.'] },
  { id: 'drom', name: 'Drömdatorn', years: [2008, 2026], tier: [5, 5], gpu: 'need', fans: 0.9, rgb: true, fee: 1800, xp: 40,
    msgs: ['Pengar spelar ingen roll. Jag vill ha det bästa som finns!'] },
];
export const TEMPLATE = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));
export const templatesFor = (year) => TEMPLATES.filter((t) => year >= t.years[0] && year <= t.years[1]);

const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const cheapest = (a) => a.reduce((m, p) => (!m || p.cost < m.cost ? p : m), null);

// Bygger en sammanhängande dator av delar som säljs år `year`.
// pick(list) väljer bland kandidaterna (slump eller billigast).
export function composeBuild(t, year, pick = rnd) {
  const pool = onSale(year);
  const byCat = {};
  for (const p of pool) (byCat[p.cat] ||= []).push(p);
  const [lo, hi] = t.tier;
  const choose = (cat, f = () => true, strictTier = true) => {
    const all = (byCat[cat] || []).filter(f);
    if (!all.length) return null;
    let c = all.filter((p) => p.tier >= lo && p.tier <= hi);
    if (!c.length && strictTier) c = all.filter((p) => p.tier >= lo - 1 && p.tier <= hi + 1);
    if (!c.length) c = all;
    if (t.rgb && Math.random() < 0.6) { const r = c.filter((p) => p.rgb); if (r.length) c = r; }
    return pick(c);
  };
  const cpu = choose('cpu', (p) => (byCat.mb || []).some((m) => C.cpuFitsMb(p, m)));
  if (!cpu) return null;
  const mb = choose('mb', (m) => C.cpuFitsMb(cpu, m) && (byCat.ram || []).some((r) => C.ramFitsMb(r, m)) && (byCat.case || []).some((c) => C.caseFitsMb(c, m)));
  if (!mb) return null;
  const ram = choose('ram', (r) => C.ramFitsMb(r, mb));
  const cooler = cpu.needs !== 'none' ? choose('cooler', (c) => C.coolerFitsCpu(c, cpu), false) : null;
  if (cpu.needs !== 'none' && !cooler) return null;
  const cs = choose('case', (c) => C.caseFitsMb(c, mb), false);
  const cards = [];
  const storage = choose('storage', (s) => C.storageFitsMb(s, mb));
  if (!storage) return null;
  let ctrl = C.storageNeedsCard(storage, mb);
  if (ctrl) cards.push(ctrl);
  let floppy = null, optical = null;
  if (year <= 2002) {
    floppy = choose('media', (m) => m.kind.startsWith('floppy') && C.mediaFitsMb(m, mb), false);
    const need = floppy && C.mediaNeedsCard(floppy, mb);
    if (need && !ctrl) { ctrl = need; cards.push(need); }
  }
  if (t.optical && Math.random() < t.optical) {
    optical = choose('media', (m) => !m.kind.startsWith('floppy') && C.mediaFitsMb(m, mb), false);
  }
  let gpu = null;
  if (t.gpu === 'need' || C.needsGpu(mb, cpu)) {
    gpu = choose('gpu', (g) => C.cardsFit([...cards, g.bus], mb));
    if (!gpu) return null;
    cards.push(gpu.bus);
  }
  let sound = null;
  if (t.sound && Math.random() < t.sound && !(mb.audio && year > 2001)) {
    sound = choose('sound', (s) => C.cardsFit([...cards, s.bus], mb), false);
    if (sound) cards.push(sound.bus);
  }
  const psu = choose('psu', (p) => C.psuFits(p, mb, cpu, gpu).ok && p.watt >= C.wattNeed(cpu, gpu, 0, year), false);
  if (!psu || !cs || !ram) return null;
  let fans = null;
  if (year >= 2005 && t.fans && Math.random() < t.fans) fans = choose('fans', () => cooler?.look.type !== 'aio', false);
  return [cs, mb, cpu, cooler, ram, storage, floppy, optical, gpu, sound, psu, fans].filter(Boolean);
}

// game: { year, stockFree(id), progress }
export function generateOrder(game, names) {
  const year = game.year;
  const pool = templatesFor(year);
  if (!pool.length) return null;
  const t = rnd(pool);
  const wantMissing = Math.random() < 0.28;
  let best = null, bestScore = -1e9;
  for (let i = 0; i < 30; i++) {
    const b = composeBuild(t, year);
    if (!b) continue;
    const missing = b.filter((p) => (game.shownFree ? game.shownFree(p.id) : game.stockFree(p.id)) < 1).length;
    const score = wantMissing ? -Math.abs(missing - 1) * 10 + Math.random() : -missing * 10 + Math.random();
    if (score > bestScore) { bestScore = score; best = b; }
  }
  if (!best) return null;
  const items = best.map((p) => ({ cat: p.cat, part: p.id }));
  // efter ett tag låter kunden dig välja vissa delar själv
  if ((game.progress || 0) > 0.08 && Math.random() < 0.35) {
    const pick = Object.fromEntries(best.map((p) => [p.cat, p]));
    const gpu = pick.gpu || null;
    const fits = {
      case: (p) => C.caseFitsMb(p, pick.mb),
      psu: (p) => C.psuFits(p, pick.mb, pick.cpu, gpu).ok && p.watt >= C.wattNeed(pick.cpu, gpu, 0, year),
      cooler: (p) => C.coolerFitsCpu(p, pick.cpu),
    };
    const choosable = ['case', 'psu', 'cooler'].filter((c) => pick[c] && !(c === 'cooler' && pick.fans) && onSale(year).some((p) => p.cat === c && game.stockFree(p.id) > 0 && fits[c](p)));
    for (const c of choosable) if (Math.random() < 0.5) { const it = items.find((x) => x.cat === c); if (it) { it.part = null; it.choice = true; } }
  }
  items.sort((a, b) => CAT_ORDER.indexOf(a.cat) - CAT_ORDER.indexOf(b.cat));
  let msg = rnd(t.msgs);
  const choice = items.filter((x) => x.choice);
  if (choice.length) msg += ' ' + choice.map((x) => ({ case: 'chassit', psu: 'nätagget', cooler: 'kylaren' })[x.cat]).join(' och ') + ' får du välja!';
  return { template: t.id, title: t.name, name: rnd(names), msg, items, year };
}

// ---------- Start för ett valt år ----------
export function startFor(year) {
  const t = templatesFor(year).sort((a, b) => a.tier[0] - b.tier[0])[0] || TEMPLATES[0];
  let a = null, b = null;
  for (let i = 0; i < 12 && !a; i++) a = composeBuild(t, year, cheapest);
  for (let i = 0; i < 20 && !b; i++) b = composeBuild(t, year);
  b ||= a;
  // butiken börjar tom: startkassan räcker till startpaketet (båda byggena) och lite till
  const kit = {};
  for (const p of [...(a || []), ...(b || [])]) kit[p.id] = (kit[p.id] || 0) + 1;
  const kitCost = Object.entries(kit).reduce((s, [id, n]) => s + DB.part[id].cost * n, 0);
  const cost = (a || []).reduce((s, p) => s + p.cost, 0);
  return { money: Math.round((kitCost + Math.max(2000, cost * 0.6)) / 500) * 500, stock: {}, kit, builds: [a, b], template: t.id };
}

const TUTOR_NAMES = ['Birgitta', 'Oscar', 'Wilma'];
export const TUTORIAL_COUNT = 3;
export function tutorialOrder(i, game) {
  if (i >= TUTORIAL_COUNT) return null;
  const year = game.year, st = game.startInfo || startFor(year);
  const tpl = TEMPLATE[st.template] || TEMPLATES[0];
  let build = st.builds?.[Math.min(i, 1)];
  if (!build) return null;
  build = build.map((p) => DB.part[p.id] || p);
  if (i === 2) {
    // tredje kunden vill ha ett bättre grafikkort som inte finns i lagret
    const find = (cat, f = () => true) => build.find((p) => p.cat === cat && f(p));
    const gpu = find('gpu'), mb = find('mb'), cpu = find('cpu'), psu = find('psu');
    const cards = [];
    const st = find('storage'), ctl = st && C.storageNeedsCard(st, mb);
    if (ctl) cards.push(ctl);
    const fl = find('media', (m) => m.kind.startsWith('floppy'));
    if (!ctl && fl && C.mediaNeedsCard(fl, mb)) cards.push(C.mediaNeedsCard(fl, mb));
    const snd = find('sound');
    if (snd) cards.push(snd.bus);
    const better = onSale(year).filter((g) => g.cat === 'gpu' && game.stockFree(g.id) < 1 && (!gpu || g.cost > gpu.cost)
      && C.cardsFit([...cards, g.bus], mb) && C.psuFits(psu, mb, cpu, g).ok && psu.watt >= C.wattNeed(cpu, g, 0, year)
      && g.cost <= (game.money || 0) * 0.8).sort((x, y) => x.cost - y.cost)[0];
    if (better && gpu) build = build.map((p) => (p === gpu ? better : p));
  }
  const msgs = {
    0: `Hej! Jag behöver min första dator – ${tpl.name.toLowerCase()}. Kan du hjälpa mig?`,
    1: 'Tjena! Jag vill ha en likadan dator som grannen fick.',
    2: 'Jag vill ha en dator med ett bättre grafikkort – går det?',
  };
  return {
    template: tpl.id, title: tpl.name, name: TUTOR_NAMES[i], msg: msgs[i], guided: i === 0, tutorial: i, year,
    items: build.map((p) => ({ cat: p.cat, part: p.id })).sort((x, y) => CAT_ORDER.indexOf(x.cat) - CAT_ORDER.indexOf(y.cat)),
  };
}

// ---------- Laga en beställning ----------
// Delar som slutat säljas (eller inte längre passar ihop) byts mot likvärdiga som
// finns i år. Moderkort och processor byts tillsammans när båda gått ur tiden.
const sellable = (p, year) => !!p && p.year <= year && (p.until ?? 9999) >= year;

export function fitsWith(p, others, year) {
  const by = {};
  for (const q of others) by[q.cat] ||= q;
  const cards = others.filter((q) => q.cat === 'gpu' || q.cat === 'sound').map((q) => q.bus).filter((bus) => bus !== p.bus);
  switch (p.cat) {
    case 'cpu': return !by.mb || C.cpuFitsMb(p, by.mb);
    case 'mb': return (!by.cpu || C.cpuFitsMb(by.cpu, p)) && (!by.ram || C.ramFitsMb(by.ram, p)) && (!by.case || C.caseFitsMb(by.case, p))
      && (!by.gpu || C.cardFitsMb(by.gpu, p)) && (!by.storage || C.storageFitsMb(by.storage, p)) && (!by.media || C.mediaFitsMb(by.media, p));
    case 'ram': return !by.mb || C.ramFitsMb(p, by.mb);
    case 'case': return !by.mb || C.caseFitsMb(p, by.mb);
    case 'cooler': return !by.cpu || C.coolerFitsCpu(p, by.cpu);
    case 'gpu': case 'sound': return !by.mb || C.cardsFit([...cards, p.bus], by.mb);
    case 'storage': return !by.mb || C.storageFitsMb(p, by.mb);
    case 'media': return !by.mb || C.mediaFitsMb(p, by.mb);
    case 'psu': return !by.mb || (C.psuFits(p, by.mb, by.cpu || {}, by.gpu).ok && p.watt >= C.wattNeed(by.cpu, by.gpu, 0, year));
    default: return true;
  }
}

export function replacementFor(order, item, year, others = null) {
  const old = item.part ? DB.part[item.part] : null;
  const rest = others || order.items.filter((x) => x !== item && x.part).map((x) => DB.part[x.part]).filter((p) => sellable(p, year));
  const same = (p) => item.cat !== 'media' || !old || String(p.kind).startsWith('floppy') === String(old.kind).startsWith('floppy');
  const cand = onSale(year).filter((p) => p.cat === item.cat && same(p) && fitsWith(p, rest, year));
  if (!cand.length) return null;
  const tier = old?.tier ?? 3, cost = old?.cost ?? 0;
  return cand.sort((a, b) => Math.abs(a.tier - tier) - Math.abs(b.tier - tier) || Math.abs(a.cost - cost) - Math.abs(b.cost - cost))[0];
}

// Ser över hela beställningen: [[gammalt namn, nytt namn], …]. it.gone = går inte att få tag på.
export function fixOrder(order, year, stockFree = () => 0) {
  const swaps = [];
  const keep = (p) => sellable(p, year) || stockFree(p.id) > 0;
  for (let pass = 0; pass < 4; pass++) {
    let changed = false;
    for (const it of order.items) {
      if (!it.part) continue;
      const p = DB.part[it.part];
      const others = order.items.filter((x) => x !== it && x.part && !x.gone).map((x) => DB.part[x.part]).filter((q) => q && keep(q));
      if (p && keep(p) && fitsWith(p, others, year)) { delete it.gone; continue; }
      const rep = replacementFor(order, it, year, others);
      if (rep && rep.id !== it.part) { swaps.push([p?.name || it.part, rep.name]); it.part = rep.id; delete it.gone; changed = true; }
      else if (!rep) it.gone = true;
      else delete it.gone;
    }
    if (!changed) break;
  }
  return swaps;
}

export function feeFor(order) { return TEMPLATE[order.template]?.fee || 700; }
export function xpFor(order) { return TEMPLATE[order.template]?.xp || 14; }

// Vad kunden betalar: delarnas butikspris + montering
export function priceFor(order, chosen = {}) {
  let sum = feeFor(order);
  for (const it of order.items) {
    const id = it.part || chosen[it.cat];
    if (id && DB.part[id]) sum += retail(DB.part[id]);
  }
  return sum;
}

// Bakåtkompatibla namn
export const START = { money: 2000, stock: {} };
