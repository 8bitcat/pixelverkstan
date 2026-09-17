// Byggregler för datorbutiken: platser, handgrepp (spak/kylpasta/skruvar), kablar
// till uttag, kompatibilitet och kontroll innan datorn ställs upp.
// core/build.js är generisk och frågar bara detta API.
import { G, VIEW, PORTS, SCREWS, driveBox } from './geom.js';
import { drawPart, drawMat, drawScrews } from './art.js';
import { gpuBox } from './art-parts.js';
import { CONN, connectorIcon, drawCablePixels, cableCurve } from './connectors.js';

export { VIEW, CONN, connectorIcon };

export const SLOTS = [
  { id: 'case', cat: 'case', name: 'Chassi', requires: [], anchor: [13, 23, 1], hl: [0, 26, 0, 24, 0.5] },
  { id: 'mb', cat: 'mb', name: 'Moderkort', requires: ['case'], anchor: [9, 16, 0.8], hl: [1.5, 17.5, 1.5, 17, 0.55] },
  { id: 'cpu', cat: 'cpu', name: 'Processor', requires: ['mb'], anchor: [6.8, 5.6, 1.2], hl: [5, 8.6, 3.8, 7.4, 0.95] },
  { id: 'cooler', cat: 'cooler', name: 'CPU-kylare', requires: ['cpu', 'act:lever', 'act:paste'], anchor: [6.8, 5.6, 4.5], hl: [4.3, 9.3, 3.1, 8.1, 1.2] },
  { id: 'ram', cat: 'ram', name: 'RAM-minne', requires: ['mb'], anchor: [11.6, 6.3, 2.8], hl: [10.2, 12.75, 3, 9.6, 1.1] },
  { id: 'm2', cat: 'storage', kinds: ['nvme'], name: 'M.2-plats', requires: ['mb'], anchor: [6, 9.9, 1], hl: [3.5, 9, 9.4, 10.4, 0.85] },
  { id: 'bay', cat: 'storage', kinds: ['hdd', 'ssd'], name: 'Hårddiskbur', requires: ['case'], anchor: [21, 20.8, 1.5], hl: [16.5, 25, 18.3, 23.3, 0.55] },
  { id: 'gpu', cat: 'gpu', name: 'PCIe x16-slot', requires: ['mb'], anchor: [7, 14.6, 3], hl: [3, 13, 14.2, 14.8, 1.15] },
  { id: 'psu', cat: 'psu', name: 'Nätaggregat', requires: ['case'], anchor: [4.3, 20.8, 3.4], hl: [0.8, 7.8, 18.3, 23.3, 0.55] },
  { id: 'fans', cat: 'fans', name: 'Takfläktar', requires: ['case'], anchor: [13, 1, 4], hl: [5.4, 21.4, 0.5, 1.5, 0.6] },
];
SLOTS.forEach((s, i) => (s.n = i + 1));
export const SLOT = Object.fromEntries(SLOTS.map((s) => [s.id, s]));

// Handgrepp med en eller flera punkter (varje punkt trycks)
export const ACTIONS = [
  { id: 'lever', name: 'Lås sockelspaken', icon: '🔒', requires: ['cpu'], points: [[8.85, 3.95, 3.6]] },
  { id: 'paste', name: 'Stryk på kylpasta', icon: '🧴', requires: ['cpu', 'act:lever'], points: [[6.8, 5.6, 1.35]] },
  { id: 'mb_screws', name: 'Skruva fast moderkortet', icon: '🪛', requires: ['mb'], points: SCREWS.mb },
  { id: 'm2_screw', name: 'Skruva fast M.2-disken', icon: '🪛', requires: ['m2'], points: SCREWS.m2 },
  { id: 'gpu_screw', name: 'Skruva fast grafikkortet', icon: '🪛', requires: ['gpu'], points: SCREWS.gpu },
  { id: 'psu_screws', name: 'Skruva fast nätagget', icon: '🪛', requires: ['psu'], points: SCREWS.psu },
];
export const ACTION = Object.fromEntries(ACTIONS.map((a) => [a.id, a]));
export const actSet = (b, id) => b.acts.get(id) || new Set();
export const actCount = (b, id) => actSet(b, id).size;
export const actDone = (b, id) => actCount(b, id) >= ACTION[id].points.length;

// Kablar: från en del till ett uttag. wants = rätt uttag.
const ALL_SYS = ['SYS_FAN1', 'SYS_FAN2'], ALL_ARGB = ['ARGB_1', 'ARGB_2', 'ARGB_3'];
export const CABLES = [
  { id: 'atx24', name: '24-pin ström → moderkortet', conn: 'atx24', from: 'psu', requires: ['psu', 'mb'], wants: ['ATX_24PIN'] },
  { id: 'eps8', name: '8-pin CPU-ström', conn: 'eps8', from: 'psu', requires: ['psu', 'mb'], wants: ['CPU_PWR'] },
  { id: 'gpu_pwr', name: 'Ström → grafikkortet', conn: (b) => b.placed.gpu?.pwr, from: 'psu', requires: ['psu', 'gpu'], need: (b) => !!b.placed.gpu?.pwr, wants: ['GPU_PWR'] },
  { id: 'sata_pwr', name: 'SATA-ström → hårddisken', conn: 'satap', from: 'psu', requires: ['psu', 'bay'], wants: ['DRIVE_PWR'] },
  { id: 'sata_data', name: 'SATA-data → moderkortet', conn: 'satad', from: 'bay', requires: ['bay', 'mb'], wants: ['SATA_1', 'SATA_2'] },
  { id: 'cpu_fan', name: 'Kylarens fläktkabel', conn: 'fan4', from: 'cooler', requires: ['cooler', 'mb'], wants: ['CPU_FAN'] },
  { id: 'argb_cooler', name: 'RGB → kylaren', conn: 'argb', from: 'cooler', requires: ['cooler', 'mb'], need: (b) => b.placed.cooler?.rgb, wants: ALL_ARGB },
  { id: 'case_fans', name: 'Chassifläktarnas kabel', conn: 'fan4', from: 'case', requires: ['case', 'mb'], need: (b) => b.placed.case?.fans.length > 0, wants: ALL_SYS },
  { id: 'argb_case', name: 'RGB → chassifläktarna', conn: 'argb', from: 'case', requires: ['case', 'mb'], need: (b) => b.placed.case?.rgb && b.placed.case.fans.length > 0, wants: ALL_ARGB },
  { id: 'top_fans', name: 'Takfläktarnas kabel', conn: 'fan4', from: 'fans', requires: ['fans', 'mb'], wants: ALL_SYS },
  { id: 'argb_fans', name: 'RGB → takfläktarna', conn: 'argb', from: 'fans', requires: ['fans', 'mb'], need: (b) => b.placed.fans?.rgb, wants: ALL_ARGB },
  { id: 'fpanel', name: 'Frontpanel (startknappen)', conn: 'fpanel', from: 'case', requires: ['case', 'mb'], wants: ['F_PANEL'] },
  { id: 'usb3', name: 'USB 3.0 fram', conn: 'usb3', from: 'case', requires: ['case', 'mb'], wants: ['USB3_FRONT'] },
  { id: 'audio', name: 'Ljud fram (HD Audio)', conn: 'audio', from: 'case', requires: ['case', 'mb'], wants: ['HD_AUDIO'] },
];
export const CABLE = Object.fromEntries(CABLES.map((c) => [c.id, c]));
export const cableConn = (c, b) => (typeof c.conn === 'function' ? c.conn(b) : c.conn);
export const cableNeeded = (c, b) => (c.need ? !!c.need(b) : true);
export const cableReady = (c, b) => c.requires.every((r) => b.placed[r]) && cableNeeded(c, b);
export const cableOk = (b, id) => b.cables.has(id) && CABLE[id].wants.includes(b.cables.get(id));

// Ordningen hjälpen föreslår
export const STEPS = [
  'slot:case', 'slot:mb', 'act:mb_screws', 'slot:cpu', 'act:lever', 'act:paste', 'slot:cooler', 'slot:ram',
  'slot:m2', 'act:m2_screw', 'slot:gpu', 'act:gpu_screw', 'slot:psu', 'act:psu_screws', 'slot:bay', 'slot:fans',
  'cable:atx24', 'cable:eps8', 'cable:gpu_pwr', 'cable:cpu_fan', 'cable:argb_cooler', 'cable:sata_pwr', 'cable:sata_data',
  'cable:case_fans', 'cable:argb_case', 'cable:top_fans', 'cable:argb_fans', 'cable:fpanel', 'cable:usb3', 'cable:audio',
];

const has = (b, req) => req.startsWith('act:') ? actDone(b, req.slice(4)) : !!b.placed[req];

const NEED_MSG = {
  case: 'Börja med chassit – allt annat monteras i det.',
  mb: 'Moderkortet måste sitta i först.',
  cpu: 'Processorn måste sitta i först.',
  cooler: 'Kylaren måste sitta i först.',
  psu: 'Nätaggregatet måste sitta i först.',
  bay: 'Hårddisken måste sitta i först.',
  gpu: 'Grafikkortet måste sitta i först.',
  fans: 'Fläktarna måste sitta i först.',
  m2: 'M.2-disken måste sitta i först.',
  'act:lever': 'Lås sockelspaken först – annars sitter processorn löst.',
  'act:paste': 'Stryk på kylpasta på processorn först!',
};
export function missingReq(reqs, b) {
  for (const r of reqs) if (!has(b, r)) return NEED_MSG[r] || 'Något saknas först.';
  return null;
}

export function slotsFor(part) {
  return SLOTS.filter((s) => s.cat === part.cat && (!s.kinds || s.kinds.includes(part.kind)));
}

// ---------- Delar ----------
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
  if (part.cat === 'fans' && b.placed.cooler?.look.type === 'aio') return { ok: false, msg: 'Taket är upptaget av vattenkylarens radiator.' };
  if (part.cat === 'cooler' && part.look.type === 'aio' && b.placed.fans) return { ok: false, msg: 'Radiatorn ska sitta i taket – ta bort takfläktarna först.' };
  return { ok: true };
}

export function canRemove(slot, b) {
  for (const s of SLOTS) if (b.placed[s.id] && s.requires.includes(slot.id)) return { ok: false, msg: `Ta bort ${s.name.toLowerCase()} först.` };
  return { ok: true };
}
// Vad som nollställs när en del tas ur
export function onRemove(slot, b) {
  for (const a of ACTIONS) if (a.requires.includes(slot.id)) b.acts.delete(a.id);
  for (const c of CABLES) if (c.requires.includes(slot.id)) b.cables.delete(c.id);
}

export function wattNeed(b) {
  return (b.placed.cpu?.watt || 0) + (b.placed.gpu?.watt || 0) + 150;
}

// ---------- Handgrepp ----------
export function actionReady(a, b) {
  if (actDone(b, a.id) || missingReq(a.requires, b)) return false;
  if (a.id === 'paste' && b.placed.cooler) return false;
  return true;
}

// ---------- Uttag & kablar ----------
const mbPortPos = (p) => { const [u0, u1, v0, v1, h] = p.box; return [(u0 + u1) / 2, (v0 + v1) / 2, G.board.z1 + h]; };

export function portPos(key, b) {
  const p = PORTS[key];
  if (p.owner === 'mb') return mbPortPos(p);
  if (key === 'GPU_PWR') { const g = gpuBox(b.placed.gpu); return [g.u1 - 1.6, 14.6, g.z1]; }
  const d = driveBox(b.placed.bay);
  return [d.u1, d.v0 + (d.v1 - d.v0) * (key === 'DRIVE_DATA' ? 0.21 : 0.61), (d.z0 + d.z1) / 2];
}
export function portType(key, b) {
  return key === 'GPU_PWR' ? b.placed.gpu?.pwr : PORTS[key].type;
}
// Uttag som finns just nu (ägaren monterad, och har en kontakt)
export function availablePorts(b) {
  return Object.keys(PORTS).filter((k) => b.placed[PORTS[k].owner] && portType(k, b));
}
export const portLabel = (k) => PORTS[k].label;
export function portBusy(key, b) { for (const v of b.cables.values()) if (v === key) return true; return false; }

export function cableFrom(c, b) {
  const { cu, cv } = G.cpu;
  switch (c.from) {
    case 'psu': return [7.8, { atx24: 19.1, eps8: 20.1, gpu_pwr: 21.1, sata_pwr: 22.4 }[c.id] || 20, 2.4];
    case 'bay': return portPos('DRIVE_DATA', b);
    case 'cooler': {
      const t = b.placed.cooler.look.type;
      const base = t === 'aio' ? [cu + 1.3, cv + 0.6, 1.6] : t === 'low' ? [cu + 2.1, cv + 1.6, 1.8] : [cu + 1.7, cv + 2.4, 1.4];
      return c.id === 'argb_cooler' ? [base[0], base[1] + 0.4, base[2]] : base;
    }
    case 'case': return { case_fans: [24.2, 17.3, 1.0], argb_case: [24.2, 16.8, 1.0], fpanel: [25.4, 12.5, 1.4], usb3: [25.4, 11.0, 1.4], audio: [25.4, 14.0, 1.4] }[c.id];
    case 'fans': return c.id === 'argb_fans' ? [20.8, 1.5, 1.4] : [21.4, 1.5, 1.2];
  }
  return [13, 12, 1];
}

// Får kabeln kopplas till uttaget? help = byggläge med hjälp
export function canConnect(c, key, b, help) {
  const conn = cableConn(c, b), type = portType(key, b);
  if (portBusy(key, b)) return { ok: false, msg: `${portLabel(key)} är redan upptaget.` };
  if (conn !== type) {
    return { ok: false, msg: `Fel kontakt! ${CONN[conn].name} passar inte i ${portLabel(key)}. Där sitter ${CONN[type].name} – ${CONN[type].desc}.` };
  }
  if (!c.wants.includes(key)) {
    if (help) return { ok: false, msg: `Den passar i formen, men ${c.name.toLowerCase()} ska sitta i ${c.wants.map(portLabel).join(' eller ')}.` };
    return { ok: true, wrongPort: true };
  }
  return { ok: true };
}

// ---------- Kontroll innan datorn ställs upp ----------
export function standCheck(b) {
  const p = b.placed, out = [];
  if (p.cpu && !actDone(b, 'lever')) out.push({ msg: 'Sockelspaken är inte låst – processorn sitter löst!', hint: 'Lås spaken bredvid processorn.' });
  if (p.mb && !actDone(b, 'mb_screws')) out.push({ msg: 'Det skramlar! Moderkortet är inte fastskruvat.', hint: `Skruva i alla ${SCREWS.mb.length} skruvar i moderkortet.` });
  if (p.gpu && !actDone(b, 'gpu_screw')) out.push({ msg: 'Grafikkortet hänger snett och glappar i sloten.', hint: 'Skruva fast grafikkortet i bakpanelen.' });
  if (p.psu && !actDone(b, 'psu_screws')) out.push({ msg: 'Nätagget glider runt i botten!', hint: 'Skruva fast nätagget i bakpanelen.' });
  if (p.m2 && !actDone(b, 'm2_screw')) out.push({ msg: 'M.2-disken står snett upp ur sin plats.', hint: 'Skruva fast M.2-disken.' });
  return out;
}

// ---------- Fakta ----------
export const FACTS = {
  case: (p) => `Chassit är datorns skal. ${p.name} har ${p.fans.length} fläktar som blåser in kall luft fram och ut varm luft bak.`,
  mb: 'Moderkortet kopplar ihop allt. Kopparbanorna är SYSTEMBUSSEN – vägarna där data åker mellan CPU, minne och I/O.',
  cpu: (p) => `Processorn är hjärnan: STYRENHETEN bestämmer, ALU:n räknar och REGISTREN minns det allra viktigaste. Sockeln ${p.socket} måste passa moderkortet.`,
  lever: 'Spaken trycker ner processorn mot de tusentals stiften i sockeln så att alla får kontakt.',
  paste: 'Kylpasta fyller mikroskopiska luftbubblor mellan CPU och kylare, så värmen leds bort bättre.',
  cooler: (p) => `Kylaren tar bort värmen. ${p.name} klarar ${p.maxW} W – en för varm CPU saktar ner eller stängs av!`,
  ram: (p) => `RAM är ARBETSMINNET. CPU:n hämtar instruktioner och data härifrån. Snabbt – men glömmer allt när strömmen går. ${p.type} passar bara i ${p.type}-slots.`,
  storage: (p) => ({
    nvme: 'M.2 NVMe-SSD minns allt även utan ström och pratar direkt med processorn via PCIe – supersnabbt!',
    hdd: 'Hårddisken har en snurrande skiva och en läsarm. Billig och rymlig, men mycket långsammare än en SSD. Den behöver två kablar: ström och data.',
    ssd: 'SATA-SSD har inga rörliga delar. Snabbare än en hårddisk, långsammare än NVMe. Den behöver ström- och datakabel.',
  })[p.kind],
  gpu: (p) => `Grafikkortet har tusentals små kärnor som räknar samtidigt (parallellt). ${p.name} drar ${p.watt} W${p.pwr ? ' och behöver egen strömkabel' : ''}.`,
  psu: (p) => `Nätaggregatet gör om 230 V från väggen till 12 V, 5 V och 3,3 V. ${p.watt} W – räkna CPU + grafikkort + marginal.`,
  fans: (p) => `Takfläktarna blåser ut varm luft uppåt – varm luft stiger!${p.rgb ? ' De har RGB och behöver en ARGB-kabel.' : ''}`,
  mb_screws: 'Skruvarna håller moderkortet på distanserna så att det inte nuddar chassits plåt – annars kan det bli kortslutning!',
  m2_screw: 'En liten skruv håller M.2-disken på plats.',
  gpu_screw: 'Grafikkort är tunga. Skruven håller kortet så det inte böjer sig och glappar.',
  psu_screws: 'Nätagget skruvas fast i bakpanelen så att det sitter stadigt.',
  atx24: '24-pin-kabeln ger moderkortet ström. Utan den händer ingenting när du trycker på startknappen.',
  eps8: '8-pin CPU-kabeln ger processorn extra kraft. Utan den snurrar fläktarna men skärmen förblir svart.',
  pcie8: 'Kraftiga grafikkort behöver egen ström direkt från nätagget via 8-pin PCIe.',
  '12vhpwr': 'Nya grafikkort använder 12V-2x6: en liten kontakt som klarar upp till 600 W. Tryck in den ordentligt!',
  satap: 'SATA-strömkabeln ger hårddisken ström från nätagget.',
  satad: 'SATA-datakabeln skickar data mellan hårddisken och moderkortet.',
  fan4: '4-pin-fläktkablar låter moderkortet styra fläkthastigheten. Kylarens fläkt MÅSTE sitta i CPU_FAN!',
  argb: 'ARGB-kabeln (5 V) styr RGB-lamporna. Utan den lyser inget.',
  fpanel: 'Frontpanelens små sladdar kopplar startknappen och lamporna till moderkortet – utan dem går datorn inte att starta.',
  usb3: 'USB 3.0-kabeln gör att USB-uttagen på framsidan fungerar.',
  audio: 'HD Audio gör att hörlursuttaget på framsidan fungerar.',
};
export const fact = (key, part) => { const f = FACTS[key]; return typeof f === 'function' ? f(part) : f; };

// ---------- Ritning ----------
export function drawScene(R, b, anim = {}) {
  const ids = Object.fromEntries(SLOTS.map((s) => [s.id, s.n]));
  drawMat(R, b.placed.case ? 0 : ids.case);
  const base = { ids, spin: anim.spin || 0, t: anim.t || 0, paste: actDone(b, 'paste'), leverClosed: actDone(b, 'lever'), placed: b.placed, powered: anim.powered, lit: anim.lit };
  for (const s of SLOTS) {
    const p = b.placed[s.id];
    if (!p) continue;
    drawPart(R, p, { ...base, id: ids[s.id] });
    if (s.id === 'mb') drawScrews(R, 'mb', actSet(b, 'mb_screws'), ids.mb);
    if (s.id === 'm2') drawScrews(R, 'm2', actSet(b, 'm2_screw'), ids.m2);
    if (s.id === 'gpu') drawScrews(R, 'gpu', actSet(b, 'gpu_screw'), ids.gpu);
    if (s.id === 'psu') drawScrews(R, 'psu', actSet(b, 'psu_screws'), ids.psu);
  }
}

// Kablar i ett lågupplöst lager (samma storlek som rastern). anim.plug = { id, t } för inkoppling
export function drawCables(ctx, R, b, anim = {}) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  for (const [id, key] of b.cables) {
    const c = CABLE[id];
    if (!c.requires.every((r) => b.placed[r])) continue;
    const a = R.proj(...cableFrom(c, b)), e = R.proj(...portPos(key, b));
    const sc = R.k / 8;
    const lift = Math.min(28 * sc, 8 * sc + Math.hypot(e[0] - a[0], e[1] - a[1]) * 0.18);
    const prog = anim.plug?.id === id ? Math.min(1, anim.plug.t) : 1;
    drawCablePixels(ctx, cableCurve(a, e, lift), cableConn(c, b), prog, sc);
  }
}
