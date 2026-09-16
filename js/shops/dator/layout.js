// Byggregler för datorbutiken: platser (slots), handgrepp, kablar,
// kompatibilitet, uppstartskontroll och fakta. Byggvyn (core/build.js) är generisk
// och frågar bara detta API.
import { G, VIEW } from './geom.js';
import { drawPart, drawMat } from './art.js';

export { VIEW };

export const SLOTS = [
  { id: 'case', cat: 'case', name: 'Chassi', requires: [], anchor: [13, 19, 1], hl: [0, 26, 0, 20, 0.5] },
  { id: 'mb', cat: 'mb', name: 'Moderkort', requires: ['case'], anchor: [9, 16, 0.8], hl: [1.5, 17.5, 1.5, 17, 0.55] },
  { id: 'cpu', cat: 'cpu', name: 'Processor', requires: ['mb'], anchor: [6.8, 5.6, 1.2], hl: [5, 8.6, 3.8, 7.4, 0.95] },
  { id: 'cooler', cat: 'cooler', name: 'CPU-kylare', requires: ['cpu', 'act:paste'], anchor: [6.8, 5.6, 4.5], hl: [4.3, 9.3, 3.1, 8.1, 1.2] },
  { id: 'ram', cat: 'ram', name: 'RAM-minne', requires: ['mb'], anchor: [11.6, 6.3, 2.8], hl: [10.2, 12.75, 3, 9.6, 1.1] },
  { id: 'm2', cat: 'storage', kinds: ['nvme'], name: 'M.2-plats', requires: ['mb'], anchor: [6, 9.9, 1], hl: [3.5, 9, 9.4, 10.4, 0.85] },
  { id: 'bay', cat: 'storage', kinds: ['hdd', 'ssd'], name: 'Hårddiskbur', requires: ['case'], anchor: [22, 5.5, 1.5], hl: [19, 25, 2, 9, 0.55] },
  { id: 'gpu', cat: 'gpu', name: 'PCIe x16-slot', requires: ['mb'], anchor: [7, 14.6, 3], hl: [3, 13, 14.2, 14.8, 1.15] },
  { id: 'psu', cat: 'psu', name: 'Nätaggregat', requires: ['case'], anchor: [22, 16, 3.7], hl: [18.5, 25.5, 12.5, 19.5, 0.55] },
];
export const SLOT = Object.fromEntries(SLOTS.map((s, i) => [s.id, { ...s, n: i + 1 }]));
SLOTS.forEach((s, i) => (s.n = i + 1));

export const ACTIONS = [
  { id: 'paste', name: 'Stryk på kylpasta', requires: ['cpu'], anchor: [6.8, 5.6, 1.3], icon: '🧴' },
];

export const CABLES = [
  { id: 'atx24', name: '24-pin ström → moderkortet', requires: ['psu', 'mb'], need: () => true, from: [19.5, 13.5, 3.8], to: [13.9, 5.2, 1.3] },
  { id: 'eps8', name: '8-pin ström → processorn', requires: ['psu', 'mb'], need: () => true, from: [19, 14.5, 3.8], to: [3.8, 2.1, 1.3] },
  { id: 'pcie', name: 'PCIe-ström → grafikkortet', requires: ['psu', 'gpu'], need: (b) => b.placed.gpu && b.placed.gpu.watt > 75, from: [19, 16, 3.8], to: null },
  { id: 'sata', name: 'SATA-ström → lagringen', requires: ['psu', 'bay'], need: () => true, from: [22, 12.8, 3.8], to: [22, 8.2, 1.6] },
];

export function cableTo(c, b) {
  if (c.id !== 'pcie') return c.to;
  const U = [6.5, 9.5, 12.5][(b.placed.gpu?.len || 1) - 1];
  return [G.gpu.u0 + U - 1.5, 14.6, 3.9];
}

const has = (b, req) => req.startsWith('act:') ? b.acts.has(req.slice(4)) : !!b.placed[req];

const NEED_MSG = {
  case: 'Börja med chassit – allt annat monteras i det.',
  mb: 'Moderkortet måste sitta i först.',
  cpu: 'Processorn måste sitta i först.',
  psu: 'Nätaggregatet måste sitta i först.',
  bay: 'Lagringen i hårddiskburen måste sitta i först.',
  gpu: 'Grafikkortet måste sitta i först.',
  'act:paste': 'Stryk på kylpasta på processorn först! Tryck på CPU:n.',
};

export function missingReq(reqs, b) {
  for (const r of reqs) if (!has(b, r)) return NEED_MSG[r] || 'Något saknas först.';
  return null;
}

export function slotsFor(part) {
  return SLOTS.filter((s) => s.cat === part.cat && (!s.kinds || s.kinds.includes(part.kind)));
}

// Får delen sättas i sloten? → { ok, msg }
export function canPlace(slot, part, b) {
  if (slot.cat !== part.cat) return { ok: false, msg: `${part.name} hör inte hemma i ${slot.name.toLowerCase()}.` };
  if (slot.kinds && !slot.kinds.includes(part.kind)) {
    return { ok: false, msg: slot.id === 'm2' ? 'M.2-platsen tar bara NVMe-SSD:er. Den här ska i hårddiskburen.' : 'NVMe-SSD:n ska sitta i M.2-platsen på moderkortet.' };
  }
  if (b.placed[slot.id]) return { ok: false, msg: 'Det sitter redan en del där.' };
  const miss = missingReq(slot.requires, b);
  if (miss) return { ok: false, msg: miss };
  const mb = b.placed.mb, cs = b.placed.case;
  if (part.cat === 'mb' && cs && !cs.fits.includes(part.size))
    return { ok: false, msg: `Passar inte! ${part.name} är ${part.size}, men ${cs.name} rymmer bara ${cs.fits.join('/')}.` };
  if (part.cat === 'cpu' && mb.socket !== part.socket)
    return { ok: false, msg: `Fel sockel! ${part.name} har sockel ${part.socket}, men moderkortet har ${mb.socket}.` };
  if (part.cat === 'ram' && mb.ram !== part.type)
    return { ok: false, msg: `Fel minnestyp! ${part.name} är ${part.type}, men moderkortet tar ${mb.ram}. Hacket i kontakten sitter på olika ställen.` };
  if (part.cat === 'storage' && (b.placed.m2 || b.placed.bay)) return { ok: false, msg: 'Datorn har redan lagring.' };
  return { ok: true };
}

// Får delen tas bort? (inget som bygger på den får sitta kvar)
export function canRemove(slot, b) {
  for (const s of SLOTS) if (b.placed[s.id] && s.requires.includes(slot.id)) return { ok: false, msg: `Ta bort ${s.name.toLowerCase()} först.` };
  if (slot.id === 'cpu' && b.acts.has('paste') && b.placed.cooler) return { ok: false, msg: 'Ta bort kylaren först.' };
  return { ok: true };
}

export function wattNeed(b) {
  return (b.placed.cpu?.watt || 0) + (b.placed.gpu?.watt || 0) + 150;
}

// Uppstartskontroll när alla delar sitter i → lista med problem (tom = allt ok)
export function bootCheck(b) {
  const p = b.placed, out = [];
  if (p.cpu && !p.cpu.igpu && !p.gpu) out.push(`Ingen bild! ${p.cpu.name} saknar inbyggd grafik (modeller med F eller utan G). Ett grafikkort behövs.`);
  if (p.cpu && p.cooler && p.cooler.maxW < p.cpu.watt) out.push(`Överhettning! ${p.cpu.name} blir ${p.cpu.watt} W varm, men ${p.cooler.name} klarar bara ${p.cooler.maxW} W.`);
  if (p.psu && p.psu.watt < wattNeed(b)) out.push(`Datorn stängs av direkt! Delarna behöver runt ${wattNeed(b)} W, men ${p.psu.name} ger bara ${p.psu.watt} W.`);
  return out;
}

export const FACTS = {
  case: 'Chassit är datorns skal. Fläktarna blåser in kall luft fram och ut varm luft bak.',
  mb: 'Moderkortet kopplar ihop allt. Kopparbanorna är SYSTEMBUSSEN – vägarna där data åker mellan CPU, minne och I/O.',
  cpu: (p) => `Processorn är hjärnan: STYRENHETEN bestämmer, ALU:n räknar och REGISTREN minns det allra viktigaste. Sockeln ${p.socket} måste passa moderkortet.`,
  paste: 'Kylpasta fyller mikroskopiska luftbubblor mellan CPU och kylare, så värmen leds bort bättre.',
  cooler: (p) => `Kylaren tar bort värmen. ${p.name} klarar ${p.maxW} W – en för varm CPU saktar ner eller stängs av!`,
  ram: (p) => `RAM är ARBETSMINNET. CPU:n hämtar instruktioner och data härifrån. Snabbt – men glömmer allt när strömmen går. ${p.type} passar bara i ${p.type}-slots.`,
  storage: (p) => ({
    nvme: 'M.2 NVMe-SSD minns allt även utan ström och pratar direkt med processorn via PCIe – supersnabbt!',
    hdd: 'Hårddisken har en snurrande skiva och en läsarm. Billig och rymlig, men mycket långsammare än en SSD.',
    ssd: 'SATA-SSD har inga rörliga delar. Snabbare än en hårddisk, långsammare än NVMe.',
  })[p.kind],
  gpu: 'Grafikkortet har tusentals små kärnor som räknar samtidigt (parallellt). Perfekt för spel, video och AI.',
  psu: (p) => `Nätaggregatet gör om 230 V från väggen till 12 V, 5 V och 3,3 V. ${p.watt} W – räkna CPU + grafikkort + marginal.`,
  cables: 'Kablarna ger ström. Utan 24-pin vaknar inte moderkortet, och utan 8-pin får processorn ingen kraft.',
};
export const fact = (key, part) => { const f = FACTS[key]; return typeof f === 'function' ? f(part) : f; };

// Datavägar som lyser under uppstarten (systembussen)
export const BUS = [
  { name: 'CPU ↔ RAM', pts: [[6.8, 5.6, 1.3], [9.6, 5.6, 0.9], [11.6, 6.3, 1.2]] },
  { name: 'CPU ↔ lagring', pts: [[6.8, 5.6, 1.3], [6.8, 9.9, 0.9]] },
  { name: 'CPU ↔ GPU', pts: [[6.8, 5.6, 1.3], [9.6, 9, 0.9], [9.6, 13, 0.9], [8, 14.5, 1]] },
  { name: 'Chipset ↔ I/O', pts: [[9.6, 9, 0.9], [12, 11.3, 1], [13.8, 12.2, 1], [17, 10, 0.6], [22, 8.2, 1.6]] },
];

// Konceptetiketter (som i referensbilden) som tänds under uppstarten
export const CONCEPTS = [
  { title: 'Pipeline: IF, ID, EX, MEM, WB', text: 'Hämta → avkoda → utför → minne → skriv tillbaka. Som ett löpande band!', anchor: [6.8, 5.6, 1.5], side: 'left' },
  { title: 'Minneshierarki & cache', text: 'Register → L1/L2/L3-cache → RAM → SSD. Närmare CPU:n = snabbare men mindre.', anchor: [11.6, 6.3, 3], side: 'right' },
  { title: 'Systembuss & I/O', text: 'Von Neumann: program och data delar samma minne och samma buss.', anchor: [12, 11.3, 1], side: 'left' },
  { title: 'Styrenhet & datapath', text: 'Styrenheten skickar signaler som styr hur data flyttas mellan register och ALU.', anchor: [8, 14.5, 3], side: 'right' },
];

// Ritar hela bygget i rastern
export function drawScene(R, b, anim = {}) {
  const ids = Object.fromEntries(SLOTS.map((s) => [s.id, s.n]));
  drawMat(R, b.placed.case ? 0 : ids.case);
  const o = (slot) => ({ ids, id: ids[slot], spin: anim.spin || 0, t: anim.t || 0, paste: b.acts.has('paste'), psuPlaced: !!b.placed.psu });
  for (const s of SLOTS) {
    const p = b.placed[s.id];
    if (p) drawPart(R, p, o(s.id));
  }
}
