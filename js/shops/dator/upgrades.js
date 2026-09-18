// Bås, hyllor och inredning som går att köpa till butiken.
//
// Två sorters saker:
//   enheter  står på en PLATS på golvet (kategorihylla, märkesbås, kaffeautomat …)
//   prylar   har en fast plats i rummet (skyltar, växter, stereo, extra kassa …)
//
// Båsen styr sortimentet: en kategorihylla får visa och köpa in instegsvaror (tier 1–2),
// ett märkesbås höjer taket för just det märket – nivå 1 → tier 3, nivå 2 → 4, nivå 3 → 5.
// Kategorier utan montrar (chassin, moderkort, nätagg …) styrs av lagerhyllan bakom disken.
//
// Ingen DOM här – filen körs även i Node (tools/).
import { ARKAD, hypeAt, isProduct } from './products.js';
export { ARKAD };
export const arkadInfo = (id) => ARKAD.find((a) => a.id === id) || null;

export const CAP = [2, 3, 4, 5];                 // tier-tak per nivå 0..3
export const SHOWCASE_CATS = ['gpu', 'cpu', 'ram', 'storage', 'sound'];   // kategorier som får egna montrar
export const LEVEL_NAME = ['hylla', 'märkeshylla', 'belyst monter', 'flaggskeppsmonter'];

// Märken som kan få egna bås (år = när märket fanns att sälja)
export const BRANDS = {
  gpu: [
    { key: 'ibm', name: 'IBM', color: '#1f70c1', years: [1983, 1991] },
    { key: 'hercules', name: 'Hercules', color: '#c8a24a', years: [1983, 1995] },
    { key: 'tseng', name: 'Tseng Labs', color: '#2f8f6f', years: [1984, 1998] },
    { key: 'ati', name: 'ATI', color: '#d52b1e', years: [1986, 2012] },
    { key: 'matrox', name: 'Matrox', color: '#1b4f9c', years: [1986, 2004] },
    { key: 's3', name: 'S3', color: '#6a3fb8', years: [1991, 2001] },
    { key: '3dfx', name: '3dfx', color: '#f58220', years: [1998, 2002] },
    { key: 'nvidia', name: 'NVIDIA', color: '#76b900', years: [1997, 2026] },
    { key: 'amd', name: 'AMD Radeon', color: '#ed1c24', years: [2010, 2026] },
    { key: 'intel', name: 'Intel Arc', color: '#0071c5', years: [2022, 2026] },
  ],
  cpu: [
    { key: 'intel', name: 'Intel', color: '#0071c5', years: [1983, 2026] },
    { key: 'amd', name: 'AMD', color: '#ed1c24', years: [1983, 2026] },
    { key: 'cyrix', name: 'Cyrix', color: '#2a9d8f', years: [1992, 2001] },
  ],
  ram: [
    { key: 'samsung', name: 'Samsung', color: '#1428a0', years: [1985, 2026] },
    { key: 'kingston', name: 'Kingston', color: '#c8102e', years: [1988, 2026] },
    { key: 'crucial', name: 'Crucial', color: '#0b57a4', years: [1997, 2026] },
    { key: 'corsair', name: 'Corsair', color: '#e8c030', years: [2000, 2026] },
    { key: 'gskill', name: 'G.Skill', color: '#d12f2f', years: [2004, 2026] },
  ],
  storage: [
    { key: 'seagate', name: 'Seagate', color: '#6fb43f', years: [1983, 2026] },
    { key: 'maxtor', name: 'Maxtor', color: '#005baa', years: [1984, 2009] },
    { key: 'quantum', name: 'Quantum', color: '#7a3fb8', years: [1988, 2002] },
    { key: 'wd', name: 'Western Digital', color: '#0b5fb0', years: [1990, 2026] },
    { key: 'samsung', name: 'Samsung', color: '#1428a0', years: [1998, 2026] },
  ],
  sound: [
    { key: 'creative', name: 'Creative', color: '#e06a1a', years: [1987, 2026] },
  ],
};
export const brandInfo = (cat, key) => (BRANDS[cat] || []).find((b) => b.key === key) || null;

// Vilket märke en del räknas till: kretstillverkaren för grafik/processor, annars lådans märke
const BRAND_ALIAS = { 'western digital': 'wd', 'g.skill': 'gskill', 'g skill': 'gskill' };
export function brandKey(p) {
  if (!p) return null;
  if (p.cat === 'gpu' || p.cat === 'cpu') return p.look?.brand || null;
  const k = String(p.brand || '').toLowerCase().trim();
  return BRAND_ALIAS[k] || k || null;
}

// ---------- Priser ----------
// Priserna nedan är i 1990 års kronor; skalas grovt efter år
export function priceIndex(year) {
  const pts = [[1983, 0.62], [1990, 1], [2000, 1.25], [2010, 1.5], [2026, 1.95]];
  if (year <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (year <= pts[i][0]) {
    const [y0, v0] = pts[i - 1], [y1, v1] = pts[i];
    return v0 + (v1 - v0) * (year - y0) / (y1 - y0);
  }
  return pts[pts.length - 1][1];
}
export const priceFor = (base, year) => Math.round(base * priceIndex(year) / 50) * 50;

// ---------- Enheter (står på en plats) ----------
export const BOOTH_COST = [1500, 3500, 9000, 22000];   // kategorihylla, märkesbås nivå 1–3
export const CAT_NAME = { gpu: 'Grafikkort', cpu: 'Processorer', ram: 'RAM-minnen', storage: 'Hårddiskar', sound: 'Ljudkort' };

// Enheter som inte är montrar
export const UNITS = [
  { id: 'kaffe', name: 'Kaffeautomat', icon: '☕', size: 'small', year: 1983, cost: 2200, trivsel: 3, desc: 'Kunderna väntar gladare med en kopp i handen. Ger lite dricks.' },
  { id: 'godis', name: 'Godisautomat', icon: '🍬', size: 'small', year: 1983, cost: 1600, trivsel: 2, desc: 'Barnen tjatar sig kvar i butiken.' },
  { id: 'tv', name: 'TV-hörna', icon: '📺', size: 'booth', year: 1983, cost: 4000, drag: 1, trivsel: 1, desc: 'En TV med konsolerna under – kunderna får prova, och du får sälja konsoler.' },
  { id: 'spelhylla', name: 'Spelhylla', icon: '🎮', size: 'booth', year: 1983, cost: 2000, drag: 1, desc: 'Spel med omslaget utåt. Den som köpte konsolen kommer tillbaka efter spel.' },
  { id: 'spelbord', name: 'Spelbord', icon: '🖥️', size: 'wide', year: 1983, cost: 3500, drag: 1, desc: 'Ett bord där du bygger butikens egen speldator – och spelar på den.' },
];
// hur många konsoler och spel som får plats på display
export const TV_CAP = { medium: 3, wide: 4 };
export const SHELF_CAP = { medium: 14, wide: 20 };
export const unitInfo = (id) => UNITS.find((u) => u.id === id) || null;

// ---------- Prylar (fast plats i rummet) ----------
export const ITEMS = [
  // skyltning → dragningskraft
  { id: 'askylt', name: 'Trottoarskylt', icon: '🪧', group: 'skylt', year: 1983, cost: 400, drag: 1, desc: 'En A-skylt på trottoaren. Folk som går förbi tittar in.' },
  { id: 'affisch', name: 'Skyltfönsteraffisch', icon: '📰', group: 'skylt', year: 1983, cost: 300, drag: 1, desc: '"NYHET!" i fönstret.' },
  { id: 'logoskylt', name: 'Lysande fasadskylt', icon: '💡', group: 'skylt', year: 1990, cost: 6000, drag: 4, desc: 'Butikens namn lyser ovanför fönstren – syns från hela gatan.' },
  { id: 'annons', name: 'Annons i datortidning', icon: '📖', group: 'skylt', year: 1985, cost: 2500, drag: 3, rykte: 1, desc: 'En helsida i månadens nummer.' },
  { id: 'hemsida', name: 'Hemsida', icon: '🌐', group: 'skylt', year: 1997, cost: 4000, drag: 3, desc: 'www.butiken.se – kunderna hittar hit via nätet.' },
  { id: 'sociala', name: 'Sociala medier', icon: '📱', group: 'skylt', year: 2010, cost: 1500, drag: 2, desc: 'Bilder på byggena går varma.' },
  // trivsel
  { id: 'vaxter', name: 'Fler krukväxter', icon: '🪴', group: 'trivsel', year: 1983, cost: 400, trivsel: 1, desc: 'Grönt i hörnen.' },
  { id: 'tidningar', name: 'Datortidningar', icon: '📚', group: 'trivsel', year: 1983, cost: 200, trivsel: 1, desc: 'Något att bläddra i medan man väntar.' },
  { id: 'stereo', name: 'Stereo', icon: '📻', group: 'trivsel', year: 1985, cost: 1200, trivsel: 2, desc: 'Musik i butiken.' },
  { id: 'matta', name: 'Ny matta i väntrummet', icon: '🟥', group: 'trivsel', year: 1983, cost: 1800, trivsel: 2, desc: 'Mjukare, finare, fräschare.' },
  { id: 'ac', name: 'Luftkonditionering', icon: '❄️', group: 'trivsel', year: 2000, cost: 5000, trivsel: 2, desc: 'Svalt även när alla fläktar går.' },
  { id: 'kassa2', name: 'Extra kassadisk', icon: '🧾', group: 'trivsel', year: 1990, cost: 4000, queue: 1, desc: 'Plats för en kund till i kön.' },
  // lokalen: alla börjar i Källarhålan och jobbar sig upp genom sex lokaler
  { id: 'lokal2', name: 'Gatuplan', icon: '🧹', group: 'lokal', year: 1983, cost: 8000, lokal: 2, desc: 'Ta bort bräderna för fönstret, skura golvet, laga taket. Fortfarande enkelt – men en plats till.' },
  { id: 'lokal3', name: 'Kvartersbutiken', icon: '🏗️', group: 'lokal', year: 1983, cost: 18000, lokal: 3, needs: 'lokal2', desc: 'Nytt golv, målade väggar och ordentlig belysning. Fem platser.' },
  { id: 'lokal4', name: 'Hörnbutiken', icon: '🏪', group: 'lokal', year: 1983, cost: 35000, lokal: 4, needs: 'lokal3', desc: 'Skyltfönster åt två håll, finare matta och fler spotlights. Sex platser.' },
  { id: 'lokal5', name: 'Datorhuset', icon: '🏢', group: 'lokal', year: 1983, cost: 70000, lokal: 5, needs: 'lokal4', desc: 'Hela huset: åtta platser, stengolv och ett eget rum för arkadmaskiner.' },
  { id: 'lokal6', name: 'Megastore', icon: '🏬', group: 'lokal', year: 1990, cost: 150000, lokal: 6, needs: 'lokal5', drag: 4, rykte: 2, desc: 'Marmor, mässing och ljus överallt. Kunderna kommer från hela stan.' },
  // verkstaden
  { id: 'skruvdragare', name: 'Elektrisk skruvdragare', icon: '🪛', group: 'verkstad', year: 1990, cost: 1400, desc: 'Alla skruvar i ett moment på ett klick – bygget går fortare.' },
  { id: 'testbank', name: 'Testbänk med POST-kort', icon: '🧪', group: 'verkstad', year: 1996, cost: 3000, desc: 'Visar felorsaken direkt vid första misslyckade starten – även i proffsläget.' },
  // lagerhyllan bakom disken (nivåer)
  { id: 'lager2', name: 'Lagerhylla nivå 2', icon: '🗄️', group: 'lager', year: 1983, cost: 4500, lager: 2, desc: 'Mellanklassens chassin, moderkort, nätagg och kylare får plats (tier 3).' },
  { id: 'lager3', name: 'Lagerhylla nivå 3', icon: '🗄️', group: 'lager', year: 1983, cost: 12000, lager: 3, needs: 'lager2', desc: 'Entusiastdelarna (tier 4).' },
  { id: 'lager4', name: 'Proffslager', icon: '🏭', group: 'lager', year: 1983, cost: 30000, lager: 4, needs: 'lager3', desc: 'Allt går att ta hem – även toppmodellerna (tier 5).' },
];
export const itemInfo = (id) => ITEMS.find((i) => i.id === id) || null;

// Lokalerna: 1 Källarhålan (3 platser) → 2 Gatuplan (4) → 3 Kvartersbutiken (5) → 4 Hörnbutiken (6)
// → 5 Datorhuset (8 + arkadrum) → 6 Megastore (8 + arkadrum, mer folk)
export const LOKAL_NAME = ['', 'Källarhålan', 'Gatuplan', 'Kvartersbutiken', 'Hörnbutiken', 'Datorhuset', 'Megastore'];
export const LOKAL_MAX = 6;
export const SLOTS_PER_LOKAL = [0, 3, 4, 5, 6, 8, 8];
export const lokalOf = (fit) => { for (let n = LOKAL_MAX; n >= 2; n--) if (fit.items['lokal' + n]) return n; return 1; };
export const ARCADE_LOKAL = 5;
export const slotOpen = (fit, i) => i < SLOTS_PER_LOKAL[lokalOf(fit)];

// ---------- Beräkningar på butikens läge ----------
// fit = { slots: [{ kind:'cat'|'brand'|'unit', cat, brand, level, unit } | null …], items: { id: 1 } }
export function emptyFit(showcases = []) {
  return { slots: showcases.map((sc) => (sc ? { kind: 'cat', cat: sc.cat, level: 0 } : null)), items: {}, arcade: [] };
}
export const ARCADE_MAX = 8;

// Vilken tier en del får ha för att köpas in och ställas ut
const lagerLevel = (fit) => (fit.items.lager4 ? 4 : fit.items.lager3 ? 3 : fit.items.lager2 ? 2 : 1);
export const hasUnit = (fit, unit) => fit.slots.some((s) => s && s.kind === 'unit' && s.unit === unit);
export function capFor(fit, p) {
  if (!p) return 0;
  if (isProduct(p)) return p.cat === 'konsol' ? (hasUnit(fit, 'tv') ? 9 : 0) : p.cat === 'spel' ? (hasUnit(fit, 'spelhylla') ? 9 : 0) : 0;
  const lagerCap = lagerLevel(fit) + 1;   // 2, 3, 4, 5
  if (SHOWCASE_CATS.includes(p.cat)) {
    const key = brandKey(p);
    let cap = 0, any = false;
    for (const s of fit.slots) {
      if (!s || s.cat !== p.cat) continue;
      any = true;
      if (s.kind === 'cat') cap = Math.max(cap, CAP[0]);
      else if (s.kind === 'brand' && s.brand === key) cap = Math.max(cap, CAP[s.level] ?? CAP[0]);
    }
    // utan egen monter säljs kategorin från lagerhyllan, men aldrig över tier 3
    return any ? cap : Math.min(3, lagerCap);
  }
  return lagerCap;
}
// Text som förklarar vad som krävs för att få sälja delen
export function needFor(fit, p) {
  if (!p) return '';
  if (p.cat === 'konsol') return 'kräver en TV-hörna';
  if (p.cat === 'spel') return 'kräver en spelhylla';
  if (p.cat === 'arkad') return 'köps under 🏪 Butiken';
  if (SHOWCASE_CATS.includes(p.cat)) {
    const has = fit.slots.some((s) => s && s.cat === p.cat);
    if (!has) return p.tier <= 3 ? `kräver lagerhylla nivå ${p.tier - 1} eller en ${CAT_NAME[p.cat]?.toLowerCase() || p.cat}-hylla` : `kräver ett märkesbås för ${CAT_NAME[p.cat]?.toLowerCase() || p.cat}`;
    if (p.tier <= CAP[0]) return '';
    const b = brandInfo(p.cat, brandKey(p));
    const lvl = Math.max(1, p.tier - 2);
    if (!b) return 'säljs bara som instegsvara';
    return `kräver ${b.name}-monter nivå ${lvl}`;
  }
  const lvl = p.tier - 1;
  return lvl >= 4 ? 'kräver proffslager' : `kräver lagerhylla nivå ${lvl}`;
}

export function statsFor(fit) {
  const out = { drag: 0, trivsel: 0, rykte: 0, queue: 0 };
  for (const [id, n] of Object.entries(fit.items)) {
    if (!n) continue;
    const it = itemInfo(id);
    if (!it) continue;
    out.drag += it.drag || 0; out.trivsel += it.trivsel || 0; out.rykte += it.rykte || 0; out.queue += it.queue || 0;
  }
  for (const s of fit.slots) {
    if (!s) continue;
    if (s.kind === 'brand') { out.drag += s.level; if (s.level >= 3) out.rykte += 2; }
    if (s.kind === 'unit') { const u = unitInfo(s.unit); if (u) { out.trivsel += u.trivsel || 0; out.drag += u.drag || 0; } if (s.unit === 'arkad') { const a = ARKAD.find((x) => x.id === s.product); if (a) out.drag += a.drag; } }
  }
  // arkadrummet: varje skåp drar lite folk, hallen som helhet ännu mer
  const n = (fit.arcade || []).length;
  if (n) out.drag += Math.min(8, n + (n >= 4 ? 2 : 0));
  out.drag = Math.min(20, out.drag); out.trivsel = Math.min(20, out.trivsel);
  return out;
}

// Namn på det som står på en plats
export function slotTitle(s) {
  if (!s) return 'Ledig plats';
  if (s.kind === 'cat') return `${CAT_NAME[s.cat] || s.cat}-hylla`;
  if (s.kind === 'brand') { const b = brandInfo(s.cat, s.brand); return `${b?.name || s.brand}-monter nivå ${s.level}`; }
  if (s.kind === 'unit') return s.unit === 'arkad' ? (ARKAD.find((x) => x.id === s.product)?.name || 'Arkadmaskin') : (unitInfo(s.unit)?.name || s.unit);
  return '?';
}
// Vad en plats är värd (för byte/rivning: 40 % tillbaka)
export function slotValue(s, year) {
  if (!s) return 0;
  if (s.kind === 'cat') return priceFor(BOOTH_COST[0], year);
  if (s.kind === 'brand') return priceFor(BOOTH_COST[s.level], year);
  if (s.kind === 'unit') return s.unit === 'arkad' ? (ARKAD.find((x) => x.id === s.product)?.cost || 0) : priceFor(unitInfo(s.unit)?.cost || 0, year);
  return 0;
}
// Alternativ som går att sätta på en plats i år: [{ id, title, kind, cat, brand, level, unit, cost, desc }]
export function optionsFor(fit, slotIndex, size, year) {
  const cur = fit.slots[slotIndex];
  const out = [];
  const holdsBooth = size !== 'small';
  if (holdsBooth) {
    for (const cat of SHOWCASE_CATS) {
      out.push({ id: `cat:${cat}`, title: `${CAT_NAME[cat]}-hylla`, kind: 'cat', cat, level: 0, cost: priceFor(BOOTH_COST[0], year), cap: CAP[0],
        desc: `Alla märken, instegsvaror (tier 1–2).` });
      for (const b of BRANDS[cat] || []) {
        if (year < b.years[0] || year > b.years[1]) continue;
        for (let level = 1; level <= 3; level++) {
          out.push({ id: `brand:${cat}:${b.key}:${level}`, title: `${b.name}-monter nivå ${level}`, kind: 'brand', cat, brand: b.key, level, color: b.color,
            cost: priceFor(BOOTH_COST[level], year), cap: CAP[level], desc: `${b.name} ${CAT_NAME[cat].toLowerCase()} upp till tier ${CAP[level]}. ${LEVEL_NAME[level][0].toUpperCase() + LEVEL_NAME[level].slice(1)} med ${b.name}-skylt.` });
        }
      }
    }
  }
  for (const u of UNITS) {
    const fits = u.size === size || (u.size === 'booth' && holdsBooth);
    if (!fits || year < u.year) continue;
    out.push({ id: `unit:${u.id}`, title: u.name, kind: 'unit', unit: u.id, cost: priceFor(u.cost, year), desc: u.desc, icon: u.icon, drag: u.drag, trivsel: u.trivsel, year });
  }
  // arkadmaskiner på de små platserna (priset är kabinettets pris det året)
  if (size === 'small') for (const a of ARKAD) {
    if (year < a.year || year > a.until) continue;
    out.push({ id: `arkad:${a.id}`, title: a.name, kind: 'unit', unit: 'arkad', product: a.id, cost: a.cost, desc: `${a.desc || ''} ${a.coin ? a.coin + ' kr per spel.' : ''}`.trim(), icon: '👾', drag: a.drag, color: a.look.marquee, hype: hypeAt(a, year) });
  }
  // det som redan står där kostar inget; ett byte ger 40 % tillbaka
  const tradeIn = Math.round(slotValue(cur, year) * 0.4 / 50) * 50;
  for (const o of out) {
    o.current = !!cur && ((o.kind === 'cat' && cur.kind === 'cat' && cur.cat === o.cat) || (o.kind === 'brand' && cur.kind === 'brand' && cur.cat === o.cat && cur.brand === o.brand && cur.level === o.level) || (o.kind === 'unit' && cur.kind === 'unit' && cur.unit === o.unit && (cur.product || null) === (o.product || null)));
    // uppgradering av samma märkesbås: betala mellanskillnaden
    const upgrade = cur && o.kind === 'brand' && cur.kind === 'brand' && cur.cat === o.cat && cur.brand === o.brand && o.level > cur.level;
    o.pay = o.current ? 0 : upgrade ? Math.max(0, o.cost - priceFor(BOOTH_COST[cur.level], year)) : Math.max(0, o.cost - tradeIn);
    o.upgrade = !!upgrade;
  }
  return out;
}
export function applyOption(fit, slotIndex, o) {
  if (o.kind === 'cat') fit.slots[slotIndex] = { kind: 'cat', cat: o.cat, level: 0 };
  else if (o.kind === 'brand') fit.slots[slotIndex] = { kind: 'brand', cat: o.cat, brand: o.brand, level: o.level };
  else if (o.kind === 'unit') fit.slots[slotIndex] = o.product ? { kind: 'unit', unit: o.unit, product: o.product } : { kind: 'unit', unit: o.unit };
}
