// Reparationsuppdrag: kunden kommer med en färdigbyggd dator där något är fel.
// Datorn börjar på bänken – man kopplar in den, startar, ser symptomet och öppnar
// sedan lådan för att hitta felet. Symptomen kommer ur samma motor som vid ett nybygge
// (desk.js evaluate), så varje fel här motsvarar ett läge den redan känner igen.
// Ingen DOM – körs även i Node (tools/repair.mjs).
import { rigFor } from './rig.js';
import { newBuild } from '../../core/build-ops.js';
import { DB } from './parts/index.js';
import { templatesFor, composeBuild } from './orders.js';
import { CAT_ORDER } from './catalog.js';

// kind: cable = kabeln är urdragen · act = ett handgrepp är ogjort · part = delen sitter inte i · swap = två kablar bytta
export const FAULTS = [
  { id: 'main_pwr', kind: 'cable', cable: 'main_pwr', stars: 1, name: 'Moderkortets strömkabel sitter löst', msgs: ['Den bara dog i natt.', 'Ingenting händer när jag trycker på knappen.', 'Det är helt dött. Kan det vara säkringen?'] },
  { id: 'fpanel', kind: 'cable', cable: 'fpanel', stars: 3, name: 'Frontpanelens kabel sitter fel', msgs: ['Startknappen gör ingenting – men lampan på nätagget lyser.', 'Min kusin "servade" den. Nu startar den inte.'] },
  { id: 'cpu_pwr', kind: 'cable', cable: 'cpu_pwr', stars: 2, name: 'Processorns strömkabel är urdragen', msgs: ['Fläktarna snurrar men skärmen är svart.', 'Den låter som vanligt men visar ingenting.'] },
  { id: 'gpu_pwr', kind: 'cable', cable: 'gpu_pwr', stars: 2, name: 'Grafikkortets extra ström saknas', msgs: ['Den startar men skärmen får ingen bild.', 'Fläktarna går och det står "no signal".'] },
  { id: 'bay_data', kind: 'cable', cable: 'bay_data', stars: 2, name: 'Hårddiskens datakabel har lossnat', msgs: ['Den hittar inte Windows längre.', 'Det står något om boot device på skärmen.'] },
  { id: 'bay_pwr', kind: 'cable', cable: 'bay_pwr', stars: 2, name: 'Hårddisken har ingen ström', msgs: ['Disken snurrar inte igång. Det bara står still.', 'Alla mina bilder! Den säger att det inte finns någon disk.'] },
  { id: 'cpu_fan', kind: 'cable', cable: 'cpu_fan', stars: 2, name: 'Kylarens fläkt är urkopplad', msgs: ['Det står FAN ERROR när den startar.', 'Den stänger av sig efter en stund och är jättevarm.'] },
  { id: 'jumpers', kind: 'act', act: 'jumpers', stars: 3, name: 'Byglarna på moderkortet står fel', msgs: ['Efter att grannen satte i mer minne tutar den bara.', 'Vi bytte processor och nu startar den inte.'] },
  { id: 'ctrl_card', kind: 'act', act: 'ctrl_card', stars: 3, name: 'Kontrollerkortet har glappat ur', msgs: ['Den funkade innan vi flyttade.', 'Det står controller failure.'] },
  { id: 'ram', kind: 'part', slot: 'ram', stars: 2, name: 'Minnet sitter inte i', msgs: ['Den piper och piper!', 'Den tutar och vägrar.', 'Barnen har pillat i den. Nu piper den bara.'] },
  { id: 'p8p9', kind: 'swap', cables: ['p8', 'p9'], stars: 4, name: 'P8 och P9 sitter omvända', msgs: ['Grannen bytte nätagg – nu luktar det bränt när jag startar.', 'Det small till och luktade!'] },
];
export const FAULT = Object.fromEntries(FAULTS.map((f) => [f.id, f]));

// Bygger ihop hela datorn som den ska vara (alla delar, skruvar, kablar)
export function completeBuild(order) {
  const L = rigFor(order), b = newBuild();
  b.help = null;
  for (const it of order.items) {
    const part = it.part ? DB.part[it.part] : null;
    if (!part) continue;
    const slot = L.slotsFor(part).find((s) => !b.placed[s.id]);
    if (slot) b.placed[slot.id] = part;
  }
  for (const a of L.ACTIONS) b.acts.set(a.id, new Set(a.points.map((_, i) => i)));
  // kablar i några varv: vissa blir tillgängliga först när andra sitter
  for (let pass = 0; pass < 4; pass++) {
    for (const c of L.CABLES) {
      if (b.cables.has(c.id) || !L.cableReady(c, b)) continue;
      const port = c.wants.find((k) => !L.portBusy(k, b) && L.availablePorts(b).includes(k)) || c.wants.find((k) => !L.portBusy(k, b));
      if (port) b.cables.set(c.id, port);
    }
  }
  return b;
}

// vilka fel som går att lägga in i just den här datorn
export function applicableFaults(order, b) {
  const L = rigFor(order);
  return FAULTS.filter((f) => {
    // på AT-datorer styr frontpanelen bara reset, turbolampa och högtalare – ingen startknapp, inget fel
    if (f.id === 'fpanel' && L.profile === 'AT') return false;
    if (f.kind === 'cable') return b.cables.has(f.cable) && L.cableOk(b, f.cable);
    if (f.kind === 'act') return !!L.ACTION[f.act] && L.actDone(b, f.act);
    if (f.kind === 'part') return !!b.placed[f.slot];
    if (f.kind === 'swap') return f.cables.every((id) => b.cables.has(id));
    return false;
  });
}
export function applyFault(order, b, f) {
  if (f.kind === 'cable') b.cables.delete(f.cable);
  else if (f.kind === 'act') b.acts.delete(f.act);
  else if (f.kind === 'part') delete b.placed[f.slot];
  else if (f.kind === 'swap') { const [a, c] = f.cables, pa = b.cables.get(a), pc = b.cables.get(c); b.cables.set(a, pc); b.cables.set(c, pa); }
  return b;
}
// är felet lagat? (används av testerna – i spelet avgör bänken)
export function faultFixed(order, b, f) {
  const L = rigFor(order);
  if (f.kind === 'cable') return L.cableOk(b, f.cable);
  if (f.kind === 'act') return L.actDone(b, f.act);
  if (f.kind === 'part') return !!b.placed[f.slot];
  if (f.kind === 'swap') return f.cables.every((id) => L.cableOk(b, id));
  return false;
}

// Bygget som kunden lämnar in: färdigt, med felet inlagt, och det står på bänken
export function makeRepairBuild(order) {
  const f = FAULT[order.repair?.fault];
  const b = completeBuild(order);
  if (f) applyFault(order, b, f);
  b.phase = 'desk';
  b.desk = { plugs: {}, psuOn: false, attempts: {}, success: false };
  b.repair = true;
  return b;
}

const rnd = (a) => a[Math.floor(Math.random() * a.length)];
// En kund med en trasig dator. year = butikens år; datorn är från något år bakåt.
export function repairOrder(game, names) {
  const year = game.year, age = Math.floor(Math.random() * 4);
  const y = Math.max(1983, year - age);
  const pool = templatesFor(y);
  if (!pool.length) return null;
  for (let tries = 0; tries < 12; tries++) {
    const t = rnd(pool), build = composeBuild(t, y);
    if (!build) continue;
    const items = build.map((p) => ({ cat: p.cat, part: p.id, own: true })).sort((a, c) => CAT_ORDER.indexOf(a.cat) - CAT_ORDER.indexOf(c.cat));
    const order = { template: 'reparation', tpl: t.id, title: `Reparation: ${t.name}`, name: rnd(names), items, year: y, repair: { fault: null } };
    const full = completeBuild(order);
    const cands = applicableFaults(order, full);
    if (!cands.length) continue;
    const f = rnd(cands);
    order.repair = { fault: f.id, stars: f.stars, name: f.name };
    order.msg = rnd(f.msgs) + (age ? ` Den är från ${y}.` : '');
    return order;
  }
  return null;
}
