// Datorbutiken – samlar allt som är specifikt för just den här verksamheten.
// En ny verksamhet (restaurang, bilverkstad …) exporterar samma form.
import * as catalog from './catalog.js';
import * as layout from './layout.js';
import * as orders from './orders.js';
import * as upgrades from './upgrades.js';
import { iconCanvas } from './art.js';
import { Desk } from './desk.js';
import { DB, loadParts, onSale } from './parts/index.js';
import { FIRST_YEAR, LAST_YEAR } from './parts/canon.js';

export default {
  id: 'dator',
  name: 'Datorbutiken',
  sign: 'DATORBUTIKEN',
  product: 'dator',
  worker: 'datorbyggare',
  theme: { wall: '#3d5a80', wallDark: '#2c4463', floorA: '#e9e1d2', floorB: '#d8ccb6', counter: '#9e1b22', neon: '#7ee8fa' },
  // glasmontrar på butiksgolvet (kategorier ur lagret) + stjärnobjektet i egen monter
  showcases: [
    { cat: 'gpu', title: 'Grafikkort' },
    { cat: 'cpu', title: 'Processorer' },
    { cat: 'ram', title: 'RAM-minnen' },
  ],
  hero: 'astral-5080',
  // bås, hyllor, prylar och lokalstorlek (se upgrades.js)
  fit: upgrades,
  // Stjärnobjektet: årets finaste grafikkort (RTX 5080 Astral när det finns)
  heroFor(game) {
    const list = onSale(game.year).filter((p) => p.cat === 'gpu');
    return list.find((p) => p.id === 'astral-5080') || list.sort((a, b) => b.tier - a.tier || b.cost - a.cost)[0] || null;
  },
  cats: catalog.CATS,
  catOrder: catalog.CAT_ORDER,
  init: loadParts,
  get parts() { return DB.parts; },
  get part() { return DB.part; },
  onSale,
  eraOf: catalog.eraOf,
  firstYear: FIRST_YEAR,
  lastYear: LAST_YEAR,
  defaultStartYear: 1983,
  startYears: [
    { year: 1983, title: 'PC-klonernas tid', desc: 'IBM PC-kloner, 8088, disketter och grön skärm' },
    { year: 1991, title: 'Multimedia och DOOM', desc: '486:or, Sound Blaster och CD-ROM' },
    { year: 1999, title: '3D-kort och internet', desc: 'Pentium III, Voodoo och GeForce' },
    { year: 2008, title: 'Flera kärnor', desc: 'Core 2, DDR2 och Crysis' },
    { year: 2016, title: 'GTX 1000 och VR', desc: 'GeForce GTX 1060/1070/1080, Skylake, DDR4 och VR-glasögon' },
    { year: 2021, title: 'AI och ray tracing', desc: 'Ryzen, RTX och RGB' },
  ],
  levels: catalog.LEVELS,
  specLine: catalog.specLine,
  // extra uppgift som alltid visas i byggaren (grafikkortets videominne)
  partTag: (p) => (p.cat === 'gpu' && p.vram ? `${catalog.sizeText(p.vram)} videominne` : ''),
  retail: catalog.retail,
  icon: iconCanvas,
  layout,
  Finale: Desk,
  start: orders.START,
  // Startpaketet: delarna till de guidade kundernas datorer
  starterKit(game) {
    const kit = {};
    for (const b of game.startInfo?.builds || []) for (const p of b || []) kit[p.id] = (kit[p.id] || 0) + 1;
    return Object.entries(kit).map(([id, n]) => [id, Math.max(0, n - game.stockFree(id) - game.incoming(id))]).filter(([id, n]) => n > 0 && DB.part[id] && onSale(game.year).includes(DB.part[id]) && (!game.canSell || game.canSell(DB.part[id])));
  },
  startFor: orders.startFor,
  tutorialOrder: orders.tutorialOrder,
  tutorialCount: orders.TUTORIAL_COUNT,
  generateOrder: orders.generateOrder,
  replacementFor: orders.replacementFor,
  fixOrder: orders.fixOrder,
  priceFor: orders.priceFor,
  xpFor: orders.xpFor,
  feeFor: orders.feeFor,
};
