// Validerar deldatabasen: fält, uppräkningar, årtal, unika id och täckning per år.
// node tools/validate-parts.mjs            → alla kategorier som finns + korskontroller
// node tools/validate-parts.mjs gpu sound  → bara de kategorierna
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import * as K from '../js/shops/dator/parts/canon.js';

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'js', 'shops', 'dator', 'parts');
const TARGET = { cpu: 650, cooler: 280, mb: 900, ram: 900, fans: 150, gpu: 1100, sound: 80, storage: 700, media: 160, psu: 450, case: 420 };
const args = process.argv.slice(2);
const cats = args.length ? args : K.CATEGORIES.filter((c) => fs.existsSync(path.join(dir, c + '.js')));

const errors = [], warnings = [];
const err = (p, msg) => errors.push(`${p?.cat || '?'}:${p?.id || '?'} – ${msg}`);
const isInt = (v) => Number.isInteger(v);
const isNum = (v) => typeof v === 'number' && isFinite(v);
const isHex = (v) => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);
const inEnum = (v, list) => list.includes(v);
const keys = (o) => Object.keys(o);

const all = {};
for (const cat of cats) {
  const file = path.join(dir, cat + '.js');
  if (!fs.existsSync(file)) { errors.push(`saknar fil ${cat}.js`); continue; }
  try {
    const mod = await import(pathToFileURL(file).href + '?t=' + Date.now());
    const arr = mod.default;
    if (!Array.isArray(arr)) { errors.push(`${cat}.js exporterar inte en array`); continue; }
    all[cat] = arr;
  } catch (e) { errors.push(`${cat}.js går inte att läsa: ${e.message}`); }
}

// ---------- fältkontroll ----------
const ids = new Map();
const SPECS = {
  cpu(p) {
    if (!inEnum(p.socket, keys(K.SOCKETS))) err(p, `okänd socket ${p.socket}`);
    if (p.fits && (!Array.isArray(p.fits) || p.fits.some((s) => !inEnum(s, keys(K.SOCKETS))))) err(p, 'fits måste vara array av socklar');
    if (!isNum(p.mhz) || p.mhz <= 0) err(p, 'mhz');
    if (!isInt(p.cores) || p.cores < 1) err(p, 'cores');
    if (!isNum(p.watt)) err(p, 'watt');
    if (typeof p.igpu !== 'boolean') err(p, 'igpu bool');
    if (!inEnum(p.needs, ['none', 'heatsink', 'fan'])) err(p, 'needs');
    if (!inEnum(p.look?.pkg, ['dip', 'plcc', 'pga', 'slot', 'lga', 'am-pga', 'am-lga'])) err(p, 'look.pkg');
    if (!inEnum(p.look?.brand, ['intel', 'amd', 'cyrix', 'nec', 'harris', 'siemens', 'ibm', 'ti', 'umc', 'idt', 'via', 'rise'])) err(p, 'look.brand');
  },
  cooler(p) {
    if (!Array.isArray(p.sockets) || !p.sockets.length || p.sockets.some((s) => !inEnum(s, keys(K.SOCKETS)))) err(p, 'sockets');
    if (!isNum(p.maxW)) err(p, 'maxW');
    if (!inEnum(p.look?.type, ['heatsink', 'heatsink-fan', 'low', 'tower', 'aio'])) err(p, 'look.type');
    for (const f of ['fan', 'blade', 'fin']) if (!isHex(p.look?.[f])) err(p, 'look.' + f);
  },
  mb(p) {
    if (!inEnum(p.socket, keys(K.SOCKETS))) err(p, `okänd socket ${p.socket}`);
    if (typeof p.chipset !== 'string' || !p.chipset) err(p, 'chipset');
    if (!inEnum(p.form, keys(K.BOARD_FORMS))) err(p, 'form');
    if (!inEnum(p.ram, keys(K.MEMORY))) err(p, 'ram');
    if (!isInt(p.ramSlots)) err(p, 'ramSlots');
    if (!isInt(p.ramMaxMB)) err(p, 'ramMaxMB');
    const s = p.slots || {};
    for (const b of ['isa8', 'isa16', 'vlb', 'pci', 'agp', 'pcie']) if (!isInt(s[b])) err(p, 'slots.' + b);
    if (!Array.isArray(p.storage) || p.storage.some((x) => !inEnum(x, ['IDE', 'SATA', 'NVMe']))) err(p, 'storage');
    for (const f of ['floppy', 'video', 'audio']) if (typeof p[f] !== 'boolean') err(p, f + ' bool');
    if (!inEnum(p.power, ['AT', 'ATX20', 'ATX24'])) err(p, 'power');
    if (!inEnum(p.cpuPower, [null, 'ATX12V4', 'EPS8'])) err(p, 'cpuPower');
    if (!isHex(p.look?.pcb) || !isHex(p.look?.accent)) err(p, 'look.pcb/accent');
    const prof = K.BOARD_FORMS[p.form]?.profile;
    if (prof === 'AT' && p.power !== 'AT') err(p, 'AT-kort måste ha power AT');
    if (prof === 'ATX' && p.power === 'AT') err(p, 'ATX-kort kan inte ha AT-ström');
  },
  ram(p) {
    if (!inEnum(p.type, keys(K.MEMORY))) err(p, 'type');
    if (!isNum(p.mb) || p.mb <= 0) err(p, 'mb');
    if (!isInt(p.sticks) || p.sticks < 1) err(p, 'sticks');
    if (typeof p.speed !== 'string') err(p, 'speed');
    if (!isHex(p.look?.color) || !isHex(p.look?.accent)) err(p, 'look.color/accent');
    if (!inEnum(p.look?.style, ['bare', 'spreader', 'fury', 'lpx', 'rgbbar', 'trident', 'dominator', 'ballistix', 'hyperx', 'ripjaws', 'ecc'])) err(p, 'look.style');
  },
  gpu(p) {
    if (!inEnum(p.bus, keys(K.BUSES))) err(p, 'bus');
    if (!inEnum(p.std, keys(K.GPU_STD))) err(p, 'std');
    if (!isNum(p.vram)) err(p, 'vram');
    if (!isNum(p.watt)) err(p, 'watt');
    if (!inEnum(p.pwr, [null, 'molex', 'pcie6', 'pcie8', '2xpcie8', '3xpcie8', '12vhpwr'])) err(p, 'pwr');
    if (![1, 2, 3].includes(p.len)) err(p, 'len');
    if (!Array.isArray(p.out) || !p.out.length || p.out.some((o) => !inEnum(o, keys(K.VIDEO_OUT)))) err(p, 'out');
    const L = p.look || {};
    if (!inEnum(L.brand, ['nvidia', 'amd', 'ati', '3dfx', 'matrox', 's3', 'tseng', 'cirrus', 'trident', 'ibm', 'hercules', 'paradise', 'intel', 'rendition', 'powervr'])) err(p, 'look.brand');
    if (!inEnum(L.style, ['isa-short', 'isa-full', 'vlb', 'pci-bare', 'agp-bare', 'agp-heatsink', 'agp-fan', 'single-fan', 'blower', 'dual', 'triple', 'fe', 'astral'])) err(p, 'look.style');
    if (!isHex(L.color) || !isHex(L.pcb)) err(p, 'look.color/pcb');
    if (!isInt(L.fans) || L.fans < 0 || L.fans > 4) err(p, 'look.fans');
  },
  sound(p) {
    if (!inEnum(p.bus, ['ISA8', 'ISA16', 'PCI', 'PCIe'])) err(p, 'bus');
    if (!inEnum(p.look?.style, ['isa', 'pci', 'pcie']) || !isHex(p.look?.pcb) || !isHex(p.look?.accent)) err(p, 'look');
  },
  storage(p) {
    if (!inEnum(p.iface, keys(K.STORAGE_IF))) err(p, 'iface');
    if (!inEnum(p.kind, ['hdd', 'ssd', 'nvme'])) err(p, 'kind');
    if (!isNum(p.mb) || p.mb <= 0) err(p, 'mb');
    if (!inEnum(p.form, ['5.25', '3.5', '2.5', 'M.2'])) err(p, 'form');
    if (!isHex(p.look?.label) || !inEnum(p.look?.style, ['mfm-fh', 'hdd-hh', 'hdd35', 'ssd25', 'm2', 'm2-heatsink'])) err(p, 'look');
    if (p.kind === 'nvme' && p.iface !== 'NVMe') err(p, 'nvme måste ha iface NVMe');
  },
  media(p) {
    if (!inEnum(p.kind, keys(K.MEDIA))) err(p, 'kind');
    if (!inEnum(p.iface, ['floppy', 'IDE', 'SATA'])) err(p, 'iface');
    if (!inEnum(p.look?.color, ['beige', 'black', 'white', 'grey']) || !inEnum(p.look?.style, ['floppy525', 'floppy35', 'optical'])) err(p, 'look');
  },
  psu(p) {
    if (!inEnum(p.form, ['AT', 'ATX', 'SFX'])) err(p, 'form');
    if (!isNum(p.watt)) err(p, 'watt');
    if (!inEnum(p.main, ['AT', 'ATX20', 'ATX24'])) err(p, 'main');
    if (!inEnum(p.cpu, [null, 'ATX12V4', 'EPS8'])) err(p, 'cpu');
    if (!Array.isArray(p.pcie) || p.pcie.some((x) => !inEnum(x, ['pcie6', 'pcie8']))) err(p, 'pcie');
    for (const f of ['sata', 'molex', 'berg']) if (!isInt(p[f])) err(p, f);
    for (const f of ['v12vhpwr', 'modular']) if (typeof p[f] !== 'boolean') err(p, f + ' bool');
    if (!inEnum(p.eff, ['none', '80plus', 'bronze', 'silver', 'gold', 'platinum', 'titanium'])) err(p, 'eff');
    if (!isHex(p.look?.color) || !isHex(p.look?.accent) || !inEnum(p.look?.style, ['at-silver', 'at-beige', 'atx-silver', 'atx-black', 'modular'])) err(p, 'look');
    if (p.form === 'AT' && p.main !== 'AT') err(p, 'AT-nätagg måste ha main AT');
  },
  case(p) {
    if (!Array.isArray(p.forms) || !p.forms.length || p.forms.some((f) => !inEnum(f, keys(K.BOARD_FORMS)))) err(p, 'forms');
    if (!inEnum(p.style, ['desktop', 'minitower', 'tower', 'midi', 'full', 'sff'])) err(p, 'style');
    const b = p.bays || {};
    for (const f of ['ext525', 'ext35', 'int35', 'int25']) if (!isInt(b[f])) err(p, 'bays.' + f);
    if (!Array.isArray(p.fans) || p.fans.some((f) => !inEnum(f, ['front1', 'front2', 'front3', 'rear', 'top1', 'top2', 'top3']))) err(p, 'fans');
    const L = p.look || {};
    if (!isHex(L.color) || !isHex(L.inner)) err(p, 'look.color/inner');
    if (!inEnum(L.front, ['beige-xt', 'beige-at', 'beige-tower', 'beige-atx', 'black-atx', 'silver-atx', 'solid', 'mesh', 'glass', 'honeycomb', 'triangles', 'perforated'])) err(p, 'look.front');
    if (typeof L.window !== 'boolean') err(p, 'look.window bool');
    const profs = new Set(p.forms.map((f) => K.BOARD_FORMS[f]?.profile));
    if (profs.size > 1) err(p, 'ett chassi kan inte blanda AT- och ATX-format');
  },
  fans(p) {
    if (!isInt(p.count) || p.count < 1) err(p, 'count');
    if (![80, 92, 120, 140].includes(p.size)) err(p, 'size');
    if (!isHex(p.look?.frame) || !isHex(p.look?.blade)) err(p, 'look');
  },
};

const until = (p) => p.until ?? Math.min(K.LAST_YEAR, p.year + (K.DEFAULT_LIFESPAN[p.cat] ?? 5));
for (const [cat, arr] of Object.entries(all)) {
  for (const p of arr) {
    if (!p || typeof p !== 'object') { errors.push(`${cat}: ogiltig post`); continue; }
    if (p.cat !== cat) err(p, `cat måste vara ${cat}`);
    if (typeof p.id !== 'string' || !/^[a-z0-9][a-z0-9.\-]*$/.test(p.id)) err(p, 'ogiltigt id');
    if (ids.has(p.id)) err(p, `dubblett-id (även i ${ids.get(p.id)})`); else ids.set(p.id, cat);
    if (typeof p.name !== 'string' || p.name.length < 3) err(p, 'name');
    if (typeof p.brand !== 'string' || !p.brand) err(p, 'brand');
    if (!isInt(p.year) || p.year < K.FIRST_YEAR || p.year > K.LAST_YEAR) err(p, `year ${p.year}`);
    if (p.until !== undefined && (!isInt(p.until) || p.until < p.year || p.until > K.LAST_YEAR)) err(p, `until ${p.until}`);
    if (!isInt(p.cost) || p.cost <= 0) err(p, 'cost');
    if (![1, 2, 3, 4, 5].includes(p.tier)) err(p, 'tier');
    if (p.rgb !== undefined && typeof p.rgb !== 'boolean') err(p, 'rgb bool');
    if (!p.look || typeof p.look !== 'object') err(p, 'look saknas');
    SPECS[cat]?.(p);
  }
  // dubbla namn
  const names = new Map();
  for (const p of arr) { if (names.has(p.name)) warnings.push(`${cat}: samma namn två gånger: "${p.name}"`); names.set(p.name, 1); }
}

// ---------- täckning per år ----------
const years = (r) => { const out = []; for (let y = Math.max(K.FIRST_YEAR, r[0]); y <= Math.min(K.LAST_YEAR, r[1]); y++) out.push(y); return out; };
const avail = (arr, y) => arr.filter((p) => p.year <= y && until(p) >= y);
const gaps = (cat, label, range, filter, min = 2) => {
  if (!all[cat]) return;
  const missing = years(range).filter((y) => avail(all[cat], y).filter(filter).length < min);
  if (missing.length) errors.push(`täckning ${cat} ${label}: färre än ${min} delar år ${compact(missing)}`);
};
const compact = (ys) => { const out = []; let s = ys[0], p = ys[0]; for (const y of ys.slice(1).concat([null])) { if (y !== p + 1) { out.push(s === p ? `${s}` : `${s}–${p}`); s = y; } p = y; } return out.join(', '); };

for (const [s, v] of Object.entries(K.SOCKETS)) {
  gaps('cpu', `socket ${s}`, v.years, (p) => p.socket === s || p.fits?.includes(s));
  gaps('mb', `socket ${s}`, v.years, (p) => p.socket === s);
  if (v.years[0] >= 1989) gaps('cooler', `socket ${s}`, [Math.max(1993, v.years[0]), v.years[1]], (p) => p.sockets.includes(s), 1);
}
for (const [m, v] of Object.entries(K.MEMORY)) { gaps('ram', `typ ${m}`, v.years, (p) => p.type === m); gaps('mb', `minne ${m}`, v.years, (p) => p.ram === m, 1); }
const GPU_BUS = { ISA8: [1983, 1992], ISA16: [1986, 1996], VLB: [1992, 1995], PCI: [1994, 2004], AGP: [1997, 2007], PCIe: [2004, 2026] };
for (const [b, r] of Object.entries(GPU_BUS)) gaps('gpu', `buss ${b}`, r, (p) => p.bus === b);
gaps('sound', 'ISA', [1987, 1999], (p) => p.bus.startsWith('ISA'));
gaps('sound', 'PCI/PCIe', [1998, 2026], (p) => p.bus === 'PCI' || p.bus === 'PCIe');
for (const [i, v] of Object.entries(K.STORAGE_IF)) gaps('storage', `iface ${i}`, v.years, (p) => p.iface === i);
gaps('media', 'diskett', [1983, 2007], (p) => p.kind.startsWith('floppy'));
gaps('media', 'optisk', [1992, 2020], (p) => !p.kind.startsWith('floppy'));
gaps('psu', 'AT', [1983, 1999], (p) => p.form === 'AT');
gaps('psu', 'ATX20', [1996, 2005], (p) => p.main === 'ATX20');
gaps('psu', 'ATX24', [2004, 2026], (p) => p.main === 'ATX24');
gaps('psu', 'ATX12V4', [2000, 2009], (p) => p.cpu === 'ATX12V4');
gaps('psu', 'EPS8', [2007, 2026], (p) => p.cpu === 'EPS8');
gaps('psu', 'PCIe-kontakter', [2004, 2026], (p) => p.pcie.length > 0);
gaps('psu', '12V-2x6', [2022, 2026], (p) => p.v12vhpwr, 1);
gaps('case', 'AT-format', [1983, 1999], (p) => p.forms.some((f) => K.BOARD_FORMS[f].profile === 'AT'));
gaps('case', 'ATX-format', [1996, 2026], (p) => p.forms.some((f) => K.BOARD_FORMS[f].profile === 'ATX'));
gaps('fans', 'alla', [1997, 2026], () => true);
for (const [f, v] of Object.entries(K.BOARD_FORMS)) gaps('mb', `format ${f}`, v.years, (p) => p.form === f, 1);

// ---------- korskontroller (när flera kategorier finns) ----------
if (all.cpu && all.mb) {
  for (const b of all.mb) {
    const ok = all.cpu.some((c) => (c.socket === b.socket || c.fits?.includes(b.socket)) && c.year <= until(b) && until(c) >= b.year);
    if (!ok) err(b, `ingen processor passar socket ${b.socket} under kortets år`);
  }
}
if (all.ram && all.mb) {
  for (const b of all.mb) if (!all.ram.some((r) => r.type === b.ram && r.year <= until(b) && until(r) >= b.year)) err(b, `inget RAM av typ ${b.ram} under kortets år`);
}
if (all.cooler && all.cpu) {
  for (const c of all.cpu) {
    if (c.needs === 'none') continue;
    if (!all.cooler.some((k) => (k.sockets.includes(c.socket) || c.fits?.some((s) => k.sockets.includes(s))) && k.maxW >= c.watt && k.year <= until(c) && until(k) >= c.year)) err(c, `ingen kylare klarar ${c.watt} W på ${c.socket} under processorns år`);
  }
}
if (all.psu && all.gpu) {
  for (const g of all.gpu) if (g.pwr === '12vhpwr' && !all.psu.some((p) => p.v12vhpwr && p.year <= until(g) && until(p) >= g.year)) err(g, 'inget nätagg med 12V-2x6 under kortets år');
}

// ---------- rapport ----------
let total = 0;
console.log('Antal delar:');
for (const cat of K.CATEGORIES) {
  if (!all[cat]) continue;
  const n = all[cat].length; total += n;
  const t = TARGET[cat];
  console.log(`  ${cat.padEnd(8)} ${String(n).padStart(5)}${t ? `  (mål ${t}${n < t ? ' – FÖR FÅ' : ''})` : ''}`);
  if (t && n < t) warnings.push(`${cat}: ${n} av målet ${t}`);
}
console.log(`  totalt   ${String(total).padStart(5)}`);
if (warnings.length) { console.log(`\nVarningar (${warnings.length}):`); for (const w of warnings.slice(0, 40)) console.log('  ' + w); }
if (errors.length) { console.log(`\nFEL (${errors.length}):`); for (const e of errors.slice(0, 80)) console.log('  ' + e); if (errors.length > 80) console.log(`  … och ${errors.length - 80} till`); process.exit(1); }
console.log('\nOK – inga fel.');
