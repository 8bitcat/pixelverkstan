// Hamburgerbaren i Node: menyn, beställningar för alla startår, byggreglerna (rostning → bröd →
// grill → salt → lager → toppbröd → tillbehör/dryck) och att scenen ritar lådor. node tools/restaurang-rig.mjs
import * as M from '../js/shops/restaurang/menu.js';
import * as O from '../js/shops/restaurang/orders.js';
import * as F from '../js/shops/restaurang/upgrades.js';
import { rigFor } from '../js/shops/restaurang/rig.js';
import { newBuild, applyBuildOp } from '../js/core/build-ops.js';

const errors = [];
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FEL  ') + m); if (!c) errors.push(m); };
const shop = { part: M.DB.part, layout: { rigFor } };
console.log(`ingredienser ${M.DB.parts.length}, menyer ${O.TEMPLATES.length}`);
ok(M.DB.parts.length >= 400 && O.TEMPLATES.length >= 150, 'katalogen är stor');
for (const y of [1955, 1965, 1975, 1985, 1996, 2005, 2016, 2022]) {
  const game = { year: y, stock: {}, stockFree: () => 2, shownFree: () => 2, canSell: () => true, money: 1000 };
  let n = 0, prod = 0, sides = 0;
  for (let i = 0; i < 200; i++) { const o = O.generateOrder(game, ['Nils']); if (!o) continue; n++; if (o.product) prod++; if (o.items.some((it) => it.cat === 'tillbehor' || it.cat === 'dryck')) sides++; if (!o.product) { const r = rigFor(o); if (r.SLOTS.length < 3) errors.push('för få platser ' + o.title); } }
  const st = O.startFor(y);
  ok(n === 200 && st.builds[0] && st.money > 0, `${y}: ${O.templatesFor(y).length} menyer, ${M.onSale(y).length} i sortiment, ${n} beställningar (${prod} över disk, ${sides} med tillbehör), start ${st.money} kr, mall ${st.template}`);
}
// tutorial 1996: bygg steg för steg enligt reglerna
const st = O.startFor(1996), game = { year: 1996, startInfo: st, stockFree: () => 0, money: 500 };
const order = { ...O.tutorialOrder(0, game), id: 1 };
console.log('tutorial 0:', order.title, order.items.map((i) => i.part).join(' → '));
const b = order.build = newBuild(); b.help = true;
const L = rigFor(order), P = M.DB.part;
const first = (cat, used) => order.items.find((it, k) => it.cat === cat && !used.has(k));
ok(!L.canPlace(L.SLOT.l0, P[order.items[0].part], b).ok, 'underbrödet kräver rostning: ' + L.canPlace(L.SLOT.l0, P[order.items[0].part], b).msg);
applyBuildOp(shop, order, { t: 'act', id: 'rosta', i: 0 });
ok(L.canPlace(L.SLOT.l0, P[order.items[0].part], b).ok, 'rostat bröd får läggas');
ok(L.pickups(b).some((p) => p.id === 'rosta' && p.part?.cat === 'brod' && p.from === 'brödrosten'), 'det rostade brödet ligger på brödrosten och går att ta med handen');
applyBuildOp(shop, order, { t: 'act', id: 'rosta', i: 0, part: order.items[0].part });
ok(b.station?.rosta === order.items[0].part && L.pickups(b)[0].part.id === order.items[0].part, 'stationen minns vilken råvara som lades på');
applyBuildOp(shop, order, { t: 'place', slot: 'l0', part: order.items[0].part });
const biffSlot = L.SLOTS.find((s) => s.cat === 'biff'), biff = P[order.items.find((i) => i.cat === 'biff').part];
ok(!L.canPlace(biffSlot, biff, b).ok, 'biffen kräver grill: ' + L.canPlace(biffSlot, biff, b).msg);
ok(L.actionReady(L.ACTION.grill, b) && !L.actionReady(L.ACTION.salt, b), 'grillen är redo, saltet inte än');
applyBuildOp(shop, order, { t: 'act', id: 'grill', i: 0 });
ok(!L.actDone(b, 'grill') && L.actCount(b, 'grill') === 1, 'första tryck: biffen ligger på (1/2)');
applyBuildOp(shop, order, { t: 'act', id: 'grill', i: 1 });
ok(!L.canPlace(biffSlot, biff, b).ok, 'kryddning krävs: ' + L.canPlace(biffSlot, biff, b).msg);
ok(!L.pickups(b).some((p) => p.id === 'grill'), 'biffen går inte att ta från grillen innan den är kryddad (saltet har samma klickyta)');
applyBuildOp(shop, order, { t: 'act', id: 'salt', i: 0 });
ok(L.canPlace(biffSlot, biff, b).ok, 'stekt och kryddad biff får läggas');
ok(L.pickups(b).some((p) => p.id === 'grill' && p.part?.cat === 'biff'), 'kryddad biff går att ta från grillen med handen');
const top = L.SLOTS.filter((s) => s.cat === 'brod').at(-1);
ok(!L.canPlace(top, P[order.items[0].part], b).ok, 'toppbrödet kräver lagren under: ' + L.canPlace(top, P[order.items[0].part], b).msg);
// fel sort på toppen
const used = new Set([0]);
for (const s of L.SLOTS) {
  if (b.placed[s.id]) continue;
  const k = order.items.findIndex((it, i) => it.cat === s.cat && !used.has(i));
  const res = L.canPlace(s, P[order.items[k].part], b);
  if (!res.ok) { errors.push(`kunde inte lägga ${s.name}: ${res.msg}`); break; }
  used.add(k); applyBuildOp(shop, order, { t: 'place', slot: s.id, part: order.items[k].part });
}
ok(Object.keys(b.placed).length === L.SLOTS.length, `alla ${L.SLOTS.length} lager på plats (${L.STEPS.join(' ')})`);
ok(!L.canRemove(L.SLOT.l1, b).ok, 'ett lager mitt i kan inte tas bort: ' + L.canRemove(L.SLOT.l1, b).msg);
ok(L.standCheck(b).length === 0, 'standCheck ok');
{ // måltiden äts upp tugga för tugga (3D-tallrikarna): volymen ovanför tallriken krymper för varje steg
  const meal = { layers: L.SLOTS.filter((x) => x.k !== undefined).map((x) => b.placed[x.id].id), pommes: b.placed.pommes?.id || null, dryck: b.placed.dryck?.id || null, dessert: b.placed.dessert?.id || null, tray: true, year: order.year };
  const rigMod = await import('../js/shops/restaurang/rig.js');
  const vol = (eaten) => { const bx = []; rigMod.drawMeal({ box: (...a) => bx.push(a) }, meal, { eaten }); return { n: bx.length, v: +bx.filter((q) => q[4] >= -0.01).reduce((s, q) => s + (q[1] - q[0]) * (q[3] - q[2]) * (q[5] - q[4]), 0).toFixed(1) }; };
  const steps = [0, 0.1, 0.3, 0.5, 0.7, 0.9, 1].map(vol);
  ok(steps.every((x, i) => !i || x.v <= steps[i - 1].v) && steps[1].v < steps[0].v && steps[3].v < steps[1].v && steps[0].v > steps.at(-1).v * 4, `kunden tar tuggor: volymen på tallriken ${steps.map((x) => x.v).join(' → ')}`);
  const last = []; rigMod.drawMeal({ box: (...a) => last.push(a) }, meal, { eaten: 1 });
  ok(last.length < steps[0].n * 0.5, `när allt är uppätet ligger bara bricka, tallrik och smulor kvar (${last.length} lådor mot ${steps[0].n} för hela måltiden)`);
}
let boxes = 0; const R = { k: 16, hz: 13, ox: 0, oy: 0, defaultId: 0, box: () => boxes++, proj: (u, v, z) => [u - v, (u + v) / 2 - z] };
L.drawScene(R, b, {}); ok(boxes > 10, `drawScene ritar ${boxes} lådor`);
// varje obligatoriskt lager i ett recept ska ha ingredienser i sortimentet redan från menyns första år
for (const t of O.TEMPLATES) {
  const sale = M.onSale(t.years[0]);
  const bread = t.bread || ((p) => !(p.look.mini || p.look.flat || p.look.lettuce || p.look.hole || p.look.novelty || p.look.square));
  if (!sale.some((p) => p.cat === 'brod' && bread(p))) errors.push(`${t.name}: inget bröd ${t.years[0]}`);
  t.recipe.forEach((r, i) => { if (r.p === undefined && !sale.some((p) => p.cat === r.cat && (!r.pick || r.pick(p)))) errors.push(`${t.name}: lager ${i} (${r.cat}) saknar ingrediens ${t.years[0]}`); });
  t.recipe.forEach((r, i) => { if (r.pick && !M.DB.parts.some((p) => p.cat === r.cat && r.pick(p))) errors.push(`${t.name}: lager ${i} pekar på okänd ingrediens`); });
}
ok(!errors.some((e) => /saknar ingrediens|okänd ingrediens|inget bröd/.test(e)), 'alla recept pekar på ingredienser som finns från menyns första år');
// alla former ritas (ikonritningen i Node med en stub-raster)
{
  const A = await import('../js/shops/restaurang/art.js');
  let n = 0, fail = [];
  const R = { k: 12, hz: 10, ox: 100, oy: 40, defaultId: 0, box: () => n++, proj: (u, v, z) => [u - v, (u + v) / 2 - z] };
  for (const p of M.DB.parts) { const before = n; try { if (M.BURGER_CATS.includes(p.cat)) { A.drawLayer(R, p, { id: 1, at: [5, 5, 0], r: 3, top: p.cat === 'brod' }); A.drawLayer(R, p, { id: 1, at: [5, 5, 0], r: 3 }); } else A.drawSide(R, p, { id: 1, at: [5, 5, 0] }); } catch (e) { fail.push(p.id + ': ' + e.message); } if (n === before) fail.push(p.id + ': ritar inget'); }
  ok(!fail.length, `alla ${M.DB.parts.length} ingredienser ritar lådor (${n} st)` + (fail.length ? ': ' + fail.slice(0, 5).join(', ') : ''));
}
// varje meny går att sätta ihop varje år den finns på menyn
for (const t of O.TEMPLATES) for (const y of [t.years[0], Math.min(t.years[1], t.years[0] + 10), t.years[1]]) { let got = null; for (let i = 0; i < 20 && !got; i++) got = O.composeBuild(t, y); if (!got) errors.push(`${t.name} går inte att göra ${y}`); }
ok(!errors.some((e) => e.includes('går inte att göra')), 'alla menyer går att göra under hela sin tid');
ok(top.hl[4] > 2 && top.anchor[2] > 2, `toppbrödets markering ligger högt upp i stapeln (z ${top.hl[4].toFixed(2)})`);
// prissättning och inredning
ok(O.priceFor(order) > 20, `pris ${O.priceFor(order)} kr, avgift ${O.feeFor(order)} kr, xp ${O.xpFor(order)}`);
const fit = F.emptyFit([]);
ok(F.capFor(fit, P.cola) >= 2 && F.capFor(fit, P.applepaj) >= 2 && F.capFor(fit, P['biff-wagyu']) === 2 && F.capFor(fit, P['milkshake-vanilj']) === 0, `cola och äppelpaj görs i köket utan montrar, wagyu kräver kylrum (${F.needFor(fit, P['biff-wagyu'])}), milkshake kräver maskin`);
ok(!F.optionsFor(fit, 4, 'wide', 1996).some((o) => o.kind === 'cat') && F.optionsFor(fit, 5, 'small', 1996).some((o) => o.id === 'unit:jukebox') && F.optionsFor(fit, 4, 'wide', 1996).some((o) => o.id === 'unit:lekhorna'), 'inga montrar att köpa – bara jukebox, såsbar, lekhörna m.m.');
// fritösen och dryckesmaskinen: pommes kräver fritering (två steg), en mugg läsk kräver tappning, en flaska inte
{
  const o = { id: 7, items: [{ cat: 'brod', part: 'brod-klassiskt' }, { cat: 'biff', part: 'biff-90' }, { cat: 'brod', part: 'brod-klassiskt' }, { cat: 'tillbehor', part: 'pommes' }, { cat: 'dryck', part: 'cola' }, { cat: 'dessert', part: 'applepaj' }], year: 1996 };
  const b = o.build = newBuild(); b.help = true; const L2 = rigFor(o);
  ok(L2.ACTION.fritera && L2.ACTION.tappa && L2.SLOT.dessert && L2.STEPS.indexOf('act:fritera') < L2.STEPS.indexOf('slot:pommes') && L2.STEPS.indexOf('act:tappa') < L2.STEPS.indexOf('slot:dryck'), `köket har fritös, dryckesmaskin och efterrättsplats (${L2.STEPS.join(' ')})`);
  ok(!L2.canPlace(L2.SLOT.pommes, P.pommes, b).ok && !L2.canPlace(L2.SLOT.dryck, P.cola, b).ok, 'pommesen måste friteras och colan tappas upp först: ' + L2.canPlace(L2.SLOT.pommes, P.pommes, b).msg);
  applyBuildOp(shop, o, { t: 'act', id: 'fritera', i: 0 }); ok(!L2.actDone(b, 'fritera'), 'korgen nere (1/2)');
  applyBuildOp(shop, o, { t: 'act', id: 'fritera', i: 1 }); applyBuildOp(shop, o, { t: 'act', id: 'tappa', i: 0 });
  ok(L2.canPlace(L2.SLOT.pommes, P.pommes, b).ok && L2.canPlace(L2.SLOT.dryck, P.cola, b).ok && L2.canPlace(L2.SLOT.dessert, P.applepaj, b).ok, 'friterat, upptappat och efterrätten får läggas på brickan');
  let n = 0; const R3 = { k: 16, hz: 13, ox: 0, oy: 0, defaultId: 0, box: () => n++, proj: (u, v, z) => [u - v, (u + v) / 2 - z] };
  L2.drawScene(R3, b, {}); ok(n > 30, `köksscenen med fritös och dryckesmaskin ritar ${n} lådor`);
  const o2 = { id: 8, items: [{ cat: 'brod', part: 'brod-klassiskt' }, { cat: 'biff', part: 'biff-90' }, { cat: 'brod', part: 'brod-klassiskt' }, { cat: 'tillbehor', part: 'sallad-skal' }, { cat: 'dryck', part: 'julmust' }], year: 1996 };
  o2.build = newBuild(); const L3 = rigFor(o2);
  ok(!L3.ACTION.fritera && !L3.ACTION.tappa, 'sallad friteras inte och julmust på flaska tappas inte upp');
}
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
process.exit(errors.length ? 1 : 0);
