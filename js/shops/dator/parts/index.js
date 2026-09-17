// Laddar deldatabasen (en fil per kategori), fyller i standardvärden och
// bygger index per år. Saknas en kategorifil används delarna från catalog.js.
import * as K from './canon.js';
import { PARTS as LEGACY } from '../catalog.js';
import { PRODUCTS } from '../products.js';

export const DB = { parts: [], part: {}, byYear: new Map(), loaded: false };

const LEGACY_FIX = {
  mb: (p) => ({ form: p.size, ramSlots: 4, ramMaxMB: 192000, slots: { isa8: 0, isa16: 0, vlb: 0, pci: 0, agp: 0, pcie: 2 }, storage: ['SATA', 'NVMe'], floppy: false, power: 'ATX24', cpuPower: 'EPS8', video: false, audio: true, chipset: '', year: 2022, cost: p.cost, tier: p.tier }),
  ram: (p) => ({ mb: p.gb * 1024, speed: p.type === 'DDR5' ? 'DDR5-5600' : 'DDR4-3200', year: p.type === 'DDR5' ? 2021 : 2018 }),
  storage: (p) => ({ mb: p.gb * 1000, iface: p.kind === 'nvme' ? 'NVMe' : 'SATA', form: p.kind === 'nvme' ? 'M.2' : p.kind === 'hdd' ? '3.5' : '2.5', year: 2019 }),
  case: (p) => ({ forms: p.fits, style: 'midi', bays: { ext525: 0, ext35: 0, int35: 2, int25: 2 }, year: 2020 }),
  cpu: (p) => ({ mhz: 4000, needs: 'fan', year: 2022 }),
  cooler: (p) => ({ sockets: ['AM4', 'AM5', 'LGA1700', 'LGA1851', 'LGA1200'], year: 2020 }),
  gpu: (p) => ({ bus: 'PCIe', std: '3D', vram: 8192, out: ['HDMI', 'DP'], year: 2023 }),
  psu: (p) => ({ form: 'ATX', main: 'ATX24', cpu: 'EPS8', pcie: ['pcie8', 'pcie8'], v12vhpwr: p.watt >= 850, sata: 6, molex: 2, berg: 0, modular: p.watt >= 750, eff: 'gold', year: 2021 }),
  fans: (p) => ({ size: 120, year: 2020 }),
};

// Fält som äldre kod förväntar sig (size, fits, gb) räknas fram från det nya schemat
function normalize(p) {
  const q = { rgb: false, ...p };
  q.until = p.until ?? Math.min(K.LAST_YEAR, p.year + (K.DEFAULT_LIFESPAN[p.cat] ?? 5));
  if (q.cat === 'mb') q.size = q.form;
  if (q.cat === 'case') { q.fits = q.forms; q.profile = K.BOARD_FORMS[q.forms[0]]?.profile || 'ATX'; }
  if (q.cat === 'mb') q.profile = K.BOARD_FORMS[q.form]?.profile || 'ATX';
  if (q.cat === 'ram' || q.cat === 'storage') q.gb = q.mb / (q.cat === 'ram' ? 1024 : 1000);
  if (q.cat === 'storage' && !q.look?.style) q.look = { ...q.look, style: q.kind === 'nvme' ? 'm2' : q.kind === 'hdd' ? 'hdd35' : 'ssd25' };
  q.lvl = 1;
  return q;
}

export async function loadParts() {
  if (DB.loaded) return DB;
  const out = [];
  for (const cat of K.CATEGORIES) {
    let arr = null;
    try { arr = (await import(`./${cat}.js`)).default; } catch { arr = null; }
    if (!Array.isArray(arr)) arr = LEGACY.filter((p) => p.cat === cat).map((p) => ({ ...p, ...(LEGACY_FIX[cat]?.(p) || {}) }));
    for (const p of arr) out.push(normalize(p));
  }
  // färdiga produkter (konsoler, spel, arkadmaskiner) ligger i samma databas men byggs aldrig in
  for (const p of PRODUCTS) out.push({ rgb: false, lvl: 1, ...p });
  DB.parts = out;
  DB.part = Object.fromEntries(out.map((p) => [p.id, p]));
  DB.byYear = new Map();
  for (let y = K.FIRST_YEAR; y <= K.LAST_YEAR; y++) DB.byYear.set(y, out.filter((p) => p.year <= y && p.until >= y));
  DB.loaded = true;
  return DB;
}

export const onSale = (y) => DB.byYear.get(Math.max(K.FIRST_YEAR, Math.min(K.LAST_YEAR, y))) || [];
