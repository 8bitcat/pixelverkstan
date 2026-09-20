// Inredning, kök och lokaler som går att köpa till hamburgerbaren. Samma form som datorbutikens
// upgrades.js: enheter står på en PLATS på golvet (läskkyl, dessertdisk, jukebox …), prylar har
// fast plats (skyltar, sittbås, kylrum, lokal). Ingen DOM här – filen körs även i Node.
import { openIndices } from '../../core/floor-plans.js';
import { hypeAt, isProduct } from './products.js';

export const ARKAD = [];
export const arkadInfo = () => null;
export const CAP = [2, 3, 4, 5];
export const SHOWCASE_CATS = [];   // inga montrar i restaurangen – dryck och efterrätt görs i köket
export const LEVEL_NAME = ['disk', 'kyl', 'belyst kyl', 'flaggskeppskyl'];
export const BRANDS = {};
export const brandInfo = () => null;
export const brandKey = () => null;

// ---------- Priser (1990 års kronor, skalas efter år) ----------
export function priceIndex(year) {
  const pts = [[1955, 0.22], [1965, 0.3], [1975, 0.45], [1985, 0.7], [1990, 1], [2000, 1.25], [2010, 1.5], [2026, 1.95]];
  if (year <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (year <= pts[i][0]) { const [y0, v0] = pts[i - 1], [y1, v1] = pts[i]; return v0 + (v1 - v0) * (year - y0) / (y1 - y0); }
  return pts[pts.length - 1][1];
}
export const priceFor = (base, year) => Math.max(50, Math.round(base * priceIndex(year) / 50) * 50);

// ---------- Enheter (står på en plats) ----------
export const BOOTH_COST = [400, 900, 2200, 5000];
export const CAT_NAME = { dryck: 'Läskkyl', dessert: 'Dessertdisk' };
export const UNITS = [
  { id: 'jukebox', name: 'Jukebox', icon: '🎵', size: 'small', year: 1955, cost: 900, trivsel: 3, drag: 1, desc: 'Rock’n’roll medan man väntar. Kunderna stannar längre.' },
  { id: 'godis', name: 'Godisautomat', icon: '🍬', size: 'small', year: 1955, cost: 400, trivsel: 1, desc: 'Barnen tjatar sig kvar.' },
  { id: 'sasbar', name: 'Såsbar', icon: '🥫', size: 'small', year: 1990, cost: 300, trivsel: 1, desc: 'Ketchup, senap och dressing – ta själv.' },
  { id: 'lekhorna', name: 'Lekhörna', icon: '🧸', size: 'booth', year: 1985, cost: 1200, trivsel: 2, drag: 1, desc: 'Bollhav och klätterställning. Familjerna kommer tillbaka.' },
  { id: 'kaffe', name: 'Kaffeautomat', icon: '☕', size: 'small', year: 1970, cost: 500, trivsel: 2, desc: 'Påtår gratis.' },
];
export const TV_CAP = { medium: 3, wide: 4 };
export const SHELF_CAP = { medium: 14, wide: 20 };
export const unitInfo = (id) => UNITS.find((u) => u.id === id) || null;

// ---------- Prylar (fast plats i rummet) ----------
export const ITEMS = [
  // skyltning → dragningskraft
  { id: 'askylt', name: 'Trottoarskylt', icon: '🪧', group: 'skylt', year: 1955, cost: 150, drag: 1, desc: '"Dagens: cheeseburgare" på trottoaren.' },
  { id: 'affisch', name: 'Affisch i fönstret', icon: '📰', group: 'skylt', year: 1955, cost: 100, drag: 1, desc: 'En läskande bild på veckans burgare.' },
  { id: 'logoskylt', name: 'Neonskylt på fasaden', icon: '💡', group: 'skylt', year: 1955, cost: 1800, drag: 4, desc: 'Röd neon som syns från hela gatan.' },
  { id: 'annons', name: 'Annons i lokaltidningen', icon: '📖', group: 'skylt', year: 1955, cost: 700, drag: 3, rykte: 1, desc: 'En kvartssida i lördagsnumret.' },
  { id: 'hemsida', name: 'Hemsida med meny', icon: '🌐', group: 'skylt', year: 1997, cost: 1200, drag: 3, desc: 'Menyn på nätet – och öppettider.' },
  { id: 'sociala', name: 'Sociala medier', icon: '📱', group: 'skylt', year: 2010, cost: 500, drag: 2, desc: 'Bilder på burgarna går varma.' },
  // trivsel
  { id: 'vaxter', name: 'Krukväxter', icon: '🪴', group: 'trivsel', year: 1955, cost: 150, trivsel: 1, desc: 'Grönt i hörnen.' },
  { id: 'tidningar', name: 'Serietidningar', icon: '📚', group: 'trivsel', year: 1955, cost: 80, trivsel: 1, desc: 'Något att läsa medan burgaren steks.' },
  { id: 'stereo', name: 'Radio', icon: '📻', group: 'trivsel', year: 1955, cost: 350, trivsel: 2, desc: 'Musik i lokalen.' },
  { id: 'matta', name: 'Nya sittbås', icon: '🟥', group: 'trivsel', year: 1955, cost: 600, trivsel: 2, desc: 'Röda skinnsoffor som på en riktig diner.' },
  { id: 'ac', name: 'Luftkonditionering', icon: '❄️', group: 'trivsel', year: 1990, cost: 1500, trivsel: 2, desc: 'Svalt även när grillen går för fullt.' },
  { id: 'kassa2', name: 'Extra kassa', icon: '🧾', group: 'trivsel', year: 1965, cost: 1200, queue: 1, desc: 'Plats för en kund till i kön.' },
  // lokalen: alla börjar i Korvkiosken och jobbar sig upp genom sex lokaler
  { id: 'lokal2', name: 'Gatuköket', icon: '🧹', group: 'lokal', year: 1955, cost: 2000, lokal: 2, desc: 'Ta bort bräderna, skura grillen, måla. Enkelt – men en plats till.' },
  { id: 'lokal3', name: 'Kvartersbaren', icon: '🏗️', group: 'lokal', year: 1955, cost: 5000, lokal: 3, needs: 'lokal2', desc: 'Nytt golv, bås och ordentlig belysning.' },
  { id: 'lokal4', name: 'Hörnrestaurangen', icon: '🏪', group: 'lokal', year: 1955, cost: 10000, lokal: 4, needs: 'lokal3', desc: 'Fönster åt två håll, fler bås, fler spotlights.' },
  { id: 'lokal5', name: 'Burgarpalatset', icon: '🏢', group: 'lokal', year: 1955, cost: 20000, lokal: 5, needs: 'lokal4', desc: 'Hela huset: tio platser och stengolv.' },
  { id: 'lokal6', name: 'Megaburger', icon: '🏬', group: 'lokal', year: 1970, cost: 45000, lokal: 6, needs: 'lokal5', drag: 4, rykte: 2, desc: 'Drive-in, neon och ljus överallt. Kunderna kommer från hela stan.' },
  // köket
  { id: 'dubbelgrill', name: 'Dubbelgrill', icon: '🔥', group: 'verkstad', year: 1975, cost: 1500, desc: 'Steker två biffar samtidigt – bygget går fortare.' },
  { id: 'fritos', name: 'Ny fritös', icon: '🍟', group: 'verkstad', year: 1955, cost: 900, desc: 'Större korgar, jämnare värme – knaprigare pommes.' },
  { id: 'milkshake', name: 'Milkshakemaskin', icon: '🥤', group: 'verkstad', year: 1955, cost: 1200, desc: 'Tjocka shakes i tre smaker.' },
  { id: 'menytavla', name: 'Lysande menytavla', icon: '📋', group: 'verkstad', year: 1965, cost: 800, drag: 2, desc: 'Menyn med bilder ovanför disken – kunderna beställer snabbare.' },
  // kylrummet (nivåer = vilka råvaror du får ta hem)
  { id: 'lager2', name: 'Kylrum nivå 2', icon: '🧊', group: 'lager', year: 1955, cost: 1200, lager: 2, desc: 'Plats för finare råvaror (tier 3).' },
  { id: 'lager3', name: 'Kylrum nivå 3', icon: '🧊', group: 'lager', year: 1955, cost: 3500, lager: 3, needs: 'lager2', desc: 'Lammfärs, räkor, lax och tryffel (tier 4).' },
  { id: 'lager4', name: 'Restaurangkök', icon: '👨‍🍳', group: 'lager', year: 1955, cost: 9000, lager: 4, needs: 'lager3', desc: 'Allt går att ta hem – även wagyu och dry aged (tier 5).' },
];
export const itemInfo = (id) => ITEMS.find((i) => i.id === id) || null;

export const LOKAL_NAME = ['', 'Korvkiosken', 'Gatuköket', 'Kvartersbaren', 'Hörnrestaurangen', 'Burgarpalatset', 'Megaburger'];
export const LOKAL_MAX = 6;
export const SLOTS_PER_LOKAL = [0, 5, 7, 8, 9, 10, 11];
export const lokalOf = (fit) => { for (let n = LOKAL_MAX; n >= 2; n--) if (fit.items['lokal' + n]) return n; return 1; };
export const ARCADE_LOKAL = 99;
export const slotOpen = (fit, i) => openIndices(lokalOf(fit)).includes(i);

// ---------- Beräkningar på butikens läge ----------
export function emptyFit(showcases = []) {
  return { slots: showcases.map((sc) => (sc ? { kind: 'cat', cat: sc.cat, level: 0 } : null)), items: {}, arcade: [] };
}
export const ARCADE_MAX = 0;
const lagerLevel = (fit) => (fit.items.lager4 ? 4 : fit.items.lager3 ? 3 : fit.items.lager2 ? 2 : 1);
export const hasUnit = (fit, unit) => fit.slots.some((s) => s && s.kind === 'unit' && s.unit === unit);
const hasCase = (fit, cat) => fit.slots.some((s) => s && s.kind === 'cat' && s.cat === cat);
export function capFor(fit, p) {
  if (!p) return 0;
  const lagerCap = lagerLevel(fit) + 1;   // 2, 3, 4, 5
  if (isProduct(p)) {
    if (p.look?.shake && !fit.items.milkshake) return 0;
    return p.tier <= lagerCap ? lagerCap + 4 : 0;
  }
  return lagerCap;
}
export function needFor(fit, p) {
  if (!p) return '';
  if (p.cat === 'dryck') return p.look?.shake && !fit.items.milkshake ? 'kräver en milkshakemaskin' : `kräver kylrum nivå ${p.tier - 1}`;
  if (p.cat === 'dessert') return `kräver kylrum nivå ${p.tier - 1}`;
  const lvl = p.tier - 1;
  return lvl >= 4 ? 'kräver restaurangkök' : `kräver kylrum nivå ${lvl}`;
}
export function statsFor(fit) {
  const out = { drag: 0, trivsel: 0, rykte: 0, queue: 0 };
  for (const [id, n] of Object.entries(fit.items)) {
    if (!n) continue;
    const it = itemInfo(id); if (!it) continue;
    out.drag += it.drag || 0; out.trivsel += it.trivsel || 0; out.rykte += it.rykte || 0; out.queue += it.queue || 0;
  }
  for (const s of fit.slots) {
    if (!s) continue;
    if (s.kind === 'cat') out.drag += 1;
    if (s.kind === 'unit') { const u = unitInfo(s.unit); if (u) { out.trivsel += u.trivsel || 0; out.drag += u.drag || 0; } }
  }
  out.drag = Math.min(20, out.drag); out.trivsel = Math.min(20, out.trivsel);
  return out;
}
export function slotTitle(s) {
  if (!s) return 'Ledig plats';
  if (s.kind === 'cat') return CAT_NAME[s.cat] || s.cat;
  if (s.kind === 'unit') return unitInfo(s.unit)?.name || s.unit;
  return '?';
}
export function slotValue(s, year) {
  if (!s) return 0;
  if (s.kind === 'cat') return priceFor(BOOTH_COST[0], year);
  if (s.kind === 'unit') return priceFor(unitInfo(s.unit)?.cost || 0, year);
  return 0;
}
export function optionsFor(fit, slotIndex, size, year) {
  const cur = fit.slots[slotIndex];
  const out = [];
  const holdsBooth = size !== 'small';
  if (holdsBooth) for (const cat of SHOWCASE_CATS) {
    out.push({ id: `cat:${cat}`, title: CAT_NAME[cat], kind: 'cat', cat, level: 0, cost: priceFor(BOOTH_COST[0], year), cap: 9,
      desc: cat === 'dryck' ? 'Kall läsk, vatten och shakes framme i kylen – kunder köper över disk.' : 'Pajer, glass och kakor i disken – kunder köper över disk.' });
  }
  for (const u of UNITS) {
    const fits = u.size === size || (u.size === 'booth' && holdsBooth);
    if (!fits || year < u.year) continue;
    out.push({ id: `unit:${u.id}`, title: u.name, kind: 'unit', unit: u.id, cost: priceFor(u.cost, year), desc: u.desc, icon: u.icon, drag: u.drag, trivsel: u.trivsel, year });
  }
  const tradeIn = Math.round(slotValue(cur, year) * 0.4 / 50) * 50;
  for (const o of out) {
    o.current = !!cur && ((o.kind === 'cat' && cur.kind === 'cat' && cur.cat === o.cat) || (o.kind === 'unit' && cur.kind === 'unit' && cur.unit === o.unit));
    o.pay = o.current ? 0 : Math.max(0, o.cost - tradeIn);
    o.upgrade = false;
  }
  return out;
}
export function applyOption(fit, slotIndex, o) {
  if (o.kind === 'cat') fit.slots[slotIndex] = { kind: 'cat', cat: o.cat, level: 0 };
  else if (o.kind === 'unit') fit.slots[slotIndex] = { kind: 'unit', unit: o.unit };
}
