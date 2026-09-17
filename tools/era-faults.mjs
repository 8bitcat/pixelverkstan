// Felsökningstest per epok: bygger en komplett dator, tar bort en sak i taget
// (kabel, handgrepp, kontakt) och skriver ut vad skrivbordet säger.
// node tools/era-faults.mjs [år …]
import { loadParts } from '../js/shops/dator/parts/index.js';
import { composeBuild, templatesFor } from '../js/shops/dator/orders.js';
import { buildPerfect, deskFor } from './era-sim.mjs';

const years = process.argv.slice(2).map(Number);
if (!globalThis.__fixture) await loadParts();
const say = (r) => r.kind === 'ok' ? (r.warnings.length ? `OK men: ${r.warnings.join(' ')}` : 'OK') : `${r.kind}: ${r.fail.cause}`;
let bad = 0;
for (const year of years.length ? years : [1985, 1990, 1994, 1998, 2003, 2007, 2015, 2024]) {
  const tpls = templatesFor(year).sort((a, b) => b.tier[1] - a.tier[1]);
  let parts = null, t = null;
  for (const tt of tpls) { for (let i = 0; i < 25 && !parts; i++) parts = composeBuild(tt, year); if (parts) { t = tt; break; } }
  console.log(`\n===== ${year} ${t ? t.id : '(ingen mall gick)'} =====`);
  if (!parts) { bad++; continue; }
  const order = { template: t.id, year, items: parts.map((p) => ({ cat: p.cat, part: p.id })), chosen: {} };
  const notes = [];
  const { rig, b } = buildPerfect(order, parts, (m) => notes.push(m));
  console.log(`${rig.kind}/${rig.profile} · ${parts.map((p) => p.name).join(' · ')}`);
  if (notes.length) { console.log('  BYGGFEL:', notes.join(' | ')); bad++; continue; }
  const desk = deskFor(rig, b, order, (m) => notes.push(m));
  const base = desk.evaluate();
  console.log(`  komplett → ${say(base)}  [video ${desk.era.video}, tangentbord ${desk.era.kb}, mus ${desk.era.mouse}, OS ${desk.era.os}]`);
  if (base.kind !== 'ok' || base.warnings.length) bad++;
  const check = (label, mutate, restore) => {
    mutate();
    const r = desk.evaluate();
    restore();
    const flag = r.kind === 'ok' && !r.warnings.length ? '  ⚠ INGEN EFFEKT' : '';
    if (flag) bad++;
    console.log(`  ${label.padEnd(24)} → ${say(r)}${flag}`);
  };
  for (const [id, port] of [...b.cables]) check(`utan kabel ${id}`, () => b.cables.delete(id), () => b.cables.set(id, port));
  for (const [id, set] of [...b.acts]) if (!['psu_screws', 'mb_screws', 'gpu_screw', 'snd_screw', 'm2_screw', 'lever', 'paste'].includes(id)) check(`utan handgrepp ${id}`, () => b.acts.delete(id), () => b.acts.set(id, set));
  for (const [id, key] of Object.entries(desk.d.plugs)) check(`utan kontakt ${id}`, () => delete desk.d.plugs[id], () => (desk.d.plugs[id] = key));
  if (rig.profile === 'AT') check('P8/P9 omvända', () => { b.cables.set('p8', 'P9'); b.cables.set('p9', 'P8'); }, () => { b.cables.set('p8', 'P8'); b.cables.set('p9', 'P9'); });
  const mbVid = desk.ports().find((q) => q.owner === 'mb' && q.type === desk.PLUGS.video.type);
  if (b.placed.gpu && mbVid) { const k = desk.d.plugs.video; check('skärm i moderkortet', () => (desk.d.plugs.video = mbVid.key), () => (desk.d.plugs.video = k)); }
  check('nätagget avslaget', () => (desk.d.psuOn = false), () => (desk.d.psuOn = true));
}
console.log(`\n${bad ? bad + ' problem' : 'Alla fel ger rätt symptom.'}`);
process.exit(bad ? 1 : 0);
