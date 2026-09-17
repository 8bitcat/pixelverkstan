// Kundbeställningar. Kunder beställer helst det man har hemma, men ibland något
// man saknar (då kan man köpa in det om man har råd).
import { PARTS, PART, retail, CAT_ORDER } from './catalog.js';

const TEMPLATES = [
  { id: 'kontor', name: 'Kontorsdator', lvl: 1, gpu: false, tier: [1, 1], fee: 400, xp: 12,
    msgs: ['Jag behöver en enkel dator till jobbet – mejl och kalkylark.', 'Något stabilt för att betala räkningar och ringa videosamtal.'] },
  { id: 'skola', name: 'Skoldator', lvl: 1, gpu: false, tier: [1, 2], fee: 450, xp: 14,
    msgs: ['Jag börjar gymnasiet och behöver en dator att plugga på.', 'Jag ska lära mig programmera!'] },
  { id: 'minecraft', name: 'Minecraft-dator', lvl: 2, gpu: true, tier: [1, 2], fee: 600, xp: 18,
    msgs: ['Jag vill spela Minecraft med shaders!', 'Kan du bygga en dator till Roblox och Minecraft?'] },
  { id: 'gaming', name: 'Gamingdator', lvl: 2, gpu: true, tier: [2, 3], fee: 750, xp: 22, fans: 0.4, rgb: true,
    msgs: ['Fortnite i hög fps, tack!', 'Jag vill spela nya spel med kompisarna.'] },
  { id: 'stream', name: 'Streamingdator', lvl: 3, gpu: true, tier: [3, 4], ramMin: 32, fee: 950, xp: 28, fans: 0.7, rgb: true,
    msgs: ['Jag ska börja streama! Den måste klara spel och sändning samtidigt.'] },
  { id: 'ai', name: '3D- & AI-arbetsstation', lvl: 4, gpu: true, tier: [4, 5], ramMin: 32, fee: 1200, xp: 34, fans: 0.6,
    msgs: ['Jag renderar 3D-filmer och tränar AI-modeller.', 'Min forskargrupp behöver en riktig räknemaskin.'] },
  { id: 'drom', name: 'Drömdatorn', lvl: 5, gpu: true, tier: [5, 5], ramMin: 64, fee: 1600, xp: 40, fans: 0.9, rgb: true,
    msgs: ['Pengar spelar ingen roll. Jag vill ha det bästa som finns!'] },
];
export const TEMPLATE = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));

// Guidade första beställningar (lär ut grunderna steg för steg)
const TUTORIAL = [
  { template: 'kontor', name: 'Birgitta', guided: true,
    msg: 'Hej! Jag vill ha en enkel dator för att betala räkningar och ringa videosamtal med barnbarnen.',
    parts: ['pop-mini-air', 'prime-h610m-e', 'i3-12100', 'freezer-7x', 'fury-8-ddr4', 'nv2-500', 'cv550'] },
  { template: 'skola', name: 'Oscar', guided: false,
    msg: 'Tjena! Jag börjar plugga och behöver plats för massor av filer. Gärna AMD – och tyst!',
    parts: ['pop-mini-silent', 'b550m-pro-vdh', 'r5-5600g', 'freezer-7x', 'lpx-16-ddr4', 'barracuda-1tb', 'cv550'] },
  { template: 'minecraft', name: 'Wilma', guided: false,
    msg: 'Jag vill spela Minecraft med shaders! Då behövs ett riktigt grafikkort, va?',
    parts: ['pop-mini-air', 'prime-h610m-e', 'i3-12100', 'freezer-7x', 'fury-8-ddr4', 'nv2-500', 'gtx-1650', 'cv550'] },
];

export const START = {
  money: 2000,
  stock: {
    'pop-mini-air': 2, 'pop-mini-silent': 1, 'prime-h610m-e': 2, 'b550m-pro-vdh': 1, 'i3-12100': 2, 'r5-5600g': 1,
    'freezer-7x': 3, 'fury-8-ddr4': 2, 'lpx-16-ddr4': 1, 'nv2-500': 2, 'barracuda-1tb': 1, 'cv550': 3,
  },
};

export function tutorialOrder(i) {
  const t = TUTORIAL[i];
  if (!t) return null;
  return { template: t.template, title: TEMPLATE[t.template].name, name: t.name, msg: t.msg, guided: t.guided, tutorial: i,
    items: t.parts.map((id) => ({ cat: PART[id].cat, part: id })) };
}
export const TUTORIAL_COUNT = TUTORIAL.length;

const rnd = (a) => a[Math.floor(Math.random() * a.length)];

// Slumpar en sammanhängande dator som passar ihop
function randomBuild(t, maxLvl) {
  const ok = (p) => p.lvl <= maxLvl && p.tier >= t.tier[0] - 1 && p.tier <= t.tier[1];
  const of = (cat, f = () => true) => {
    let c = PARTS.filter((p) => p.cat === cat && ok(p) && f(p));
    if (t.rgb && Math.random() < 0.6) { const rgbC = c.filter((p) => p.rgb); if (rgbC.length) c = rgbC; }
    if (!c.length) c = PARTS.filter((p) => p.cat === cat && p.lvl <= maxLvl && f(p));
    return c.length ? rnd(c) : null;
  };
  const cpu = of('cpu', (p) => t.gpu || p.igpu);
  if (!cpu) return null;
  const mb = of('mb', (p) => p.socket === cpu.socket);
  if (!mb) return null;
  const ram = of('ram', (p) => p.type === mb.ram && p.gb >= (t.ramMin || 0));
  const cooler = of('cooler', (p) => p.maxW >= cpu.watt);
  const gpu = t.gpu ? of('gpu') : null;
  const need = cpu.watt + (gpu?.watt || 0) + 150;
  const psu = of('psu', (p) => p.watt >= need);
  const cs = of('case', (p) => p.fits.includes(mb.size));
  const st = of('storage');
  const fans = cooler?.look.type !== 'aio' && Math.random() < (t.fans || 0) ? of('fans', (p) => !t.rgb || p.rgb) : null;
  const all = [cs, mb, cpu, cooler, ram, st, gpu, psu, fans].filter(Boolean);
  if (!ram || !cooler || !psu || !cs || !st || (t.gpu && !gpu)) return null;
  return all;
}

// game: { level, stockFree(id) }
export function generateOrder(game, names) {
  const level = game.level;
  const pool = TEMPLATES.filter((t) => t.lvl <= level);
  // senare nivåer: fler avancerade kunder
  const t = Math.random() < 0.4 ? pool[pool.length - 1] : rnd(pool);
  const wantMissing = Math.random() < 0.28;
  let best = null, bestScore = -1e9;
  for (let i = 0; i < 40; i++) {
    const b = randomBuild(t, Math.min(5, level + (wantMissing ? 1 : 0)));
    if (!b) continue;
    const missing = b.filter((p) => game.stockFree(p.id) < 1).length;
    const score = wantMissing ? -Math.abs(missing - 1) * 10 + Math.random() : -missing * 10 + Math.random();
    if (score > bestScore) { bestScore = score; best = b; }
  }
  if (!best) return null;
  const items = best.map((p) => ({ cat: p.cat, part: p.id }));
  // från nivå 3: kunden låter dig välja vissa delar själv
  if (level >= 3 && Math.random() < 0.4) {
    const pick = Object.fromEntries(best.map((p) => [p.cat, p]));
    const need = pick.cpu.watt + (pick.gpu?.watt || 0) + 150;
    const fits = { case: (p) => p.fits.includes(pick.mb.size), psu: (p) => p.watt >= need, cooler: (p) => p.maxW >= pick.cpu.watt };
    const choosable = ['case', 'psu', 'cooler'].filter((c) => !(c === 'cooler' && pick.fans) && PARTS.some((p) => p.cat === c && game.stockFree(p.id) > 0 && fits[c](p)));
    for (const c of choosable) if (Math.random() < 0.5) { const it = items.find((x) => x.cat === c); if (it) { it.part = null; it.choice = true; } }
  }
  items.sort((a, b) => CAT_ORDER.indexOf(a.cat) - CAT_ORDER.indexOf(b.cat));
  const anyChoice = items.some((x) => x.choice);
  let msg = rnd(t.msgs);
  if (anyChoice) msg += ' ' + items.filter((x) => x.choice).map((x) => ({ case: 'chassit', psu: 'nätagget', cooler: 'kylaren' })[x.cat]).join(' och ') + ' får du välja!';
  return { template: t.id, title: t.name, name: rnd(names), msg, items };
}

export function feeFor(order) { return TEMPLATE[order.template].fee; }
export function xpFor(order) { return TEMPLATE[order.template].xp; }

// Vad kunden betalar: delarnas butikspris + montering
export function priceFor(order, chosen = {}) {
  let sum = feeFor(order);
  for (const it of order.items) {
    const id = it.part || chosen[it.cat];
    if (id) sum += retail(PART[id]);
  }
  return sum;
}
