// Logiktest för alla epoker: sätter ihop kundbyggen år för år, bygger dem "perfekt"
// via riggens API (platser, handgrepp, kablar), ställer upp dem och startar dem i
// skrivbordets utvärdering. Kör: node tools/era-logic.mjs [från] [till] [antal per år]
import { loadParts, DB } from '../js/shops/dator/parts/index.js';
import { composeBuild, templatesFor } from '../js/shops/dator/orders.js';
import { buildPerfect, deskFor } from './era-sim.mjs';

const [from = 1983, to = 2026, per = 6] = process.argv.slice(2).map(Number);
await loadParts();
console.log(`Delar: ${DB.parts.length}`);

const problems = new Map();
const note = (y, msg) => { const k = msg.slice(0, 140); if (!problems.has(k)) problems.set(k, { n: 0, years: new Set() }); const p = problems.get(k); p.n++; p.years.add(y); };
let built = 0, okCount = 0, noBuild = 0;
const kinds = {};

for (let year = from; year <= to; year++) {
  const tpls = templatesFor(year);
  if (!tpls.length) { note(year, 'inga kundmallar'); continue; }
  for (let i = 0; i < per; i++) {
    const t = tpls[i % tpls.length];
    let parts = null;
    for (let k = 0; k < 20 && !parts; k++) parts = composeBuild(t, year);
    if (!parts) { noBuild++; note(year, `kan inte sätta ihop ${t.id}`); continue; }
    const order = { template: t.id, year, items: parts.map((p) => ({ cat: p.cat, part: p.id })), chosen: {} };
    let rig, b, left;
    try { ({ rig, b, left } = buildPerfect(order, parts, (m) => note(year, m))); } catch (e) { note(year, 'bygget kraschar: ' + e.stack.split(String.fromCharCode(10)).slice(0, 2).join(' ')); continue; }
    kinds[`${rig.kind}/${rig.profile}`] = (kinds[`${rig.kind}/${rig.profile}`] || 0) + 1;
    built++;
    if (left.length) continue;
    const stand = rig.standCheck(b);
    if (stand.length) { note(year, 'standCheck: ' + stand.map((s) => s.msg).join(' | ')); continue; }
    const desk = deskFor(rig, b, order, (m) => note(year, m));
    let r;
    try { r = desk.evaluate(); } catch (e) { note(year, 'evaluate kraschar: ' + e.stack.split('\n').slice(0, 2).join(' ')); continue; }
    if (r.kind !== 'ok') note(year, `startar inte (${r.kind}): ${r.fail.cause}`);
    else if (r.warnings.length) note(year, 'varningar: ' + r.warnings.join(' '));
    else okCount++;
  }
}

console.log(`Byggen: ${built}, startade felfritt: ${okCount}, kunde inte sättas ihop: ${noBuild}`);
console.log('Upplägg:', kinds);
const list = [...problems.entries()].sort((a, b) => b[1].n - a[1].n);
for (const [msg, p] of list.slice(0, 40)) {
  const ys = [...p.years].sort();
  console.log(`  ${String(p.n).padStart(4)}× [${ys[0]}–${ys[ys.length - 1]}] ${msg}`);
}
process.exit(list.length ? 1 : 0);
