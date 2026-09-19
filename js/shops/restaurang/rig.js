// Byggreglerna för EN beställning i hamburgerbaren: burgaren byggs lager för lager på brickan,
// underifrån. Brödet rostas i brödrosten, biffen steks och kryddas på grillen, tillbehören
// läggs i fickan och drycken på brickan. Samma API som datorbutikens rigg (core/build.js
// pratar bara med riggen), men utan kablar och uttag.
import { DB, layerHeight, bunTopHeight, burgerRadius, BURGER_CATS, CATS } from './menu.js';
import { drawTray, drawToaster, drawGrill, drawLayer, drawSide } from './art.js';

export const VIEW = { w: 872, h: 504, k: 16, hz: 13, ox: 400, oy: 80 };
export const MAX_K = 64;
export const CONN = {};
export const connectorIcon = (conn, W = 40, H = 30) => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };

// var sakerna står (enheter): brödrost och grill till vänster, brickan till höger
export const K = { toaster: [0.5, 1], grill: [0.5, 8.5], tray: [7, 0.5, 29, 15.5], burger: [13, 8], basket: [22, 5], cup: [22, 12] };

const CACHE = new WeakMap();
export function resetRig(order) { CACHE.delete(order); }
export function rigFor(order) {
  if (CACHE.has(order)) return CACHE.get(order);
  const rig = makeRig(order);
  CACHE.set(order, rig);
  return rig;
}

function makeRig(order) {
  const items = order.items || [];
  const layers = [];
  items.forEach((it, i) => { if (BURGER_CATS.includes(it.cat)) layers.push({ i, it }); });
  const [cu, cv] = K.burger;
  const bread0 = layers[0]?.it.part ? DB.part[layers[0].it.part] : null;
  const r = burgerRadius(bread0);
  const rig = { lastB: null };

  // ---------- Platser: lagren underifrån, sedan tillbehör och dryck ----------
  const S = [];
  layers.forEach((l, k) => {
    const part = l.it.part ? DB.part[l.it.part] : null;
    const id = 'l' + k, prev = k ? 'l' + (k - 1) : null;
    const top = k > 0 && k === layers.length - 1 && l.it.cat === 'brod';
    const name = k === 0 ? 'Underbrödet' : top ? 'Toppbrödet' : `Lager ${k}: ${(CATS[l.it.cat]?.name || l.it.cat).toLowerCase()}`;
    const requires = k === 0 ? ['act:rosta'] : [prev];
    if (l.it.cat === 'biff' && !layers.slice(0, k).some((x) => x.it.cat === 'biff')) requires.push('act:salt');
    S.push({ id, cat: l.it.cat, name, requires, k, top, part, accept: (p) => p.cat === l.it.cat });
  });
  if (items.some((it) => it.cat === 'tillbehor')) S.push({ id: 'pommes', cat: 'tillbehor', name: 'Tillbehörsfickan', requires: [], anchor: [K.basket[0], K.basket[1], 3.2], hl: [K.basket[0] - 2.6, K.basket[0] + 2.6, K.basket[1] - 1.8, K.basket[1] + 1.8, 0.02] });
  if (items.some((it) => it.cat === 'dryck')) S.push({ id: 'dryck', cat: 'dryck', name: 'Drycken', requires: [], anchor: [K.cup[0], K.cup[1], 4.8], hl: [K.cup[0] - 1.9, K.cup[0] + 1.9, K.cup[1] - 1.9, K.cup[1] + 1.9, 0.02] });
  S.forEach((s, i) => (s.n = i + 1));
  const SLOT = Object.fromEntries(S.map((s) => [s.id, s]));
  // höjden där lager k börjar: summan av lagren under (det som ligger där, annars det beställda)
  const zOf = (b, k) => { let z = 0; for (let j = 0; j < k; j++) { const s = S[j], p = b?.placed?.[s.id] || s.part; z += p ? (s.top ? bunTopHeight(p) : layerHeight(p)) : 0.5; } return z; };
  for (const s of S) if (s.k !== undefined) {
    Object.defineProperty(s, 'hl', { get() { const z = zOf(rig.lastB, s.k); return [cu - r - 0.3, cu + r + 0.3, cv - r - 0.3, cv + r + 0.3, z + 0.02]; } });
    Object.defineProperty(s, 'anchor', { get() { const z = zOf(rig.lastB, s.k); return [cu, cv, z + 0.5]; } });
  }

  // ---------- Handgrepp ----------
  const A = [{ id: 'rosta', name: 'Rosta brödet', icon: '🍞', requires: [], points: [[K.toaster[0] + 2, K.toaster[1] + 2, 2.4]] }];
  const firstBiff = layers.find((l) => l.it.cat === 'biff');
  if (firstBiff) {
    A.push({ id: 'grill', name: 'Stek biffen (lägg på, vänd)', icon: '🔥', requires: ['l0'], points: [[K.grill[0] + 1.6, K.grill[1] + 2.0, 1.15], [K.grill[0] + 4.0, K.grill[1] + 4.0, 1.15]] });
    A.push({ id: 'salt', name: 'Salta och peppra', icon: '🧂', requires: ['act:grill'], points: [[K.grill[0] + 2.75, K.grill[1] + 3, 1.9]] });
  }
  const ACTION = Object.fromEntries(A.map((a) => [a.id, a]));
  const actSet = (b, id) => b.acts.get(id) || new Set();
  const actCount = (b, id) => actSet(b, id).size;
  const actDone = (b, id) => !!ACTION[id] && actCount(b, id) >= ACTION[id].points.length;

  // ---------- Ordning i hjälpen ----------
  const STEPS = ['act:rosta', 'slot:l0', 'act:grill', 'act:salt', ...S.filter((s) => s.k !== undefined && s.k > 0).map((s) => 'slot:' + s.id), 'slot:pommes', 'slot:dryck']
    .filter((k) => { const [kd, id] = k.split(':'); return kd === 'slot' ? !!SLOT[id] : !!ACTION[id]; });

  // ---------- Regler ----------
  const has = (b, req) => (req.startsWith('act:') ? actDone(b, req.slice(4)) : !!b.placed[req]);
  const NEED_MSG = { 'act:rosta': 'Rosta brödet i brödrosten först!', 'act:grill': 'Stek biffen på grillen först – lägg på och vänd.', 'act:salt': 'Salta och peppra biffen på grillen först.' };
  function missingReq(reqs, b) {
    rig.lastB = b;
    for (const r of reqs) if (!has(b, r)) return NEED_MSG[r] || `${SLOT[r]?.name || r} måste ligga på först.`;
    return null;
  }
  const slotsFor = (part) => S.filter((s) => s.cat === part.cat && (!s.accept || s.accept(part)));
  function canPlace(slot, part, b) {
    rig.lastB = b;
    if (slot.cat !== part.cat) return { ok: false, msg: `${part.name} hör inte hemma i ${slot.name.toLowerCase()}.` };
    if (b.placed[slot.id]) return { ok: false, msg: 'Det ligger redan något där.' };
    const miss = missingReq(slot.requires, b);
    if (miss) return { ok: false, msg: miss };
    if (slot.top && b.placed.l0 && part.id !== b.placed.l0.id) return { ok: false, msg: `Toppbrödet ska vara samma sort som underbrödet (${b.placed.l0.name.toLowerCase()}).` };
    if (part.cat === 'dryck' && slot.id !== 'dryck') return { ok: false, msg: 'Drycken ställs på brickan, inte i burgaren.' };
    return { ok: true };
  }
  function canRemove(slot, b) {
    rig.lastB = b;
    for (const s of S) if (b.placed[s.id] && s.requires.includes(slot.id)) return { ok: false, msg: `Ta av ${s.name.toLowerCase()} först.` };
    return { ok: true };
  }
  function onRemove() {}
  const wattNeed = () => 0;
  function actionReady(a, b) { rig.lastB = b; return !actDone(b, a.id) && !missingReq(a.requires, b); }

  // inga uttag och kablar i köket
  const PORTS = {}, CABLES = [], CABLE = {};
  const portPos = () => [0, 0, 0], portType = () => null, availablePorts = () => [], portLabel = (k) => k, portBusy = () => false;
  const cableConn = () => null, cableNeeded = () => false, cableReady = () => false, cableOk = () => false, cableFrom = () => [0, 0, 0];
  const canConnect = () => ({ ok: false, msg: 'Inga kablar i köket.' });
  const SCREW_OF = {};
  const screwStatus = () => null;
  const standCheck = (b) => { rig.lastB = b; return []; };

  // ---------- Fakta ----------
  const FACTS = {
    brod: (p) => p.look?.lettuce ? 'Salladsblad i stället för bröd: samma burgare, nästan inga kolhydrater.' : p.look?.gloss ? 'Brioche är gjort på smör och ägg – därför är det så mjukt och blankt.' : 'Brödet rostas på snittytan så att det inte suger åt sig sås och blir blött.',
    biff: (p) => ({ not: 'Nötfärs ska stekas till 70 °C inuti. Tryck inte på biffen med stekspaden – då rinner saften ut!', kyckling: 'Kyckling måste alltid vara genomstekt: 72 °C i mitten. Ingen rosa!', fisk: 'Fisk är klar när den blir ogenomskinlig och faller isär lätt. Panering håller den saftig.', vego: 'Vegobiffar innehåller mindre fett – stek dem försiktigt så de inte torkar.', lamm: 'Lammfärs är fetare än nöt och tål högre värme – då blir kanten knaprig.', flask: 'Fläsk ska vara genomstekt, minst 70 °C.' })[p.look?.kind] || 'Biffen steks på grillen.',
    ost: (p) => (p.look?.melt === false ? `${p.name} smälter inte – den läggs på för smaken.` : 'Osten läggs på biffen medan den ligger på grillen så att den hinner smälta.'),
    extra: (p) => p.desc || 'Toppingen ger burgaren dess karaktär.',
    gront: () => 'Grönsakerna läggs överst, långt från den varma biffen – då håller de sig krispiga.',
    sas: (p) => p.desc || 'Såsen läggs närmast toppbrödet.',
    tillbehor: (p) => (p.look?.shape === 'fries' ? 'Pommes friteras två gånger: först i 150 °C så de blir mjuka, sedan i 180 °C så de blir knapriga.' : p.desc || 'Läggs i fickan på brickan.'),
    dryck: (p) => p.desc || 'Drycken ställs på brickan.',
    rosta: 'Rostat bröd får en yta som håller för sås och köttsaft – utan rostning blir underbrödet blött.',
    grill: 'Vänd biffen bara en gång. Då får den fin stekyta (Maillard-reaktionen) och behåller saften.',
    salt: 'Salta precis före eller under stekningen – saltar du färsen långt innan drar saltet ur vätskan och biffen blir seg.',
  };
  function fact(key, part) { const f = FACTS[key]; return typeof f === 'function' ? f(part || {}) : f || ''; }

  // ---------- Rita ----------
  function drawScene(R, b, anim = {}) {
    rig.lastB = b;
    const ids = Object.fromEntries(S.map((s) => [s.id, s.n]));
    drawTray(R, K.tray[0], K.tray[2], K.tray[1], K.tray[3], 0);
    drawToaster(R, K.toaster[0], K.toaster[1], 0, actDone(b, 'rosta') && !b.placed.l0);
    const fb = firstBiff ? S.find((s) => s.cat === 'biff') : null;
    const pattyPart = fb ? (b.placed[fb.id] || fb.part || DB.parts.find((p) => p.cat === 'biff')) : null;
    drawGrill(R, K.grill[0], K.grill[1], 0, pattyPart, fb && !b.placed[fb.id] ? actCount(b, 'grill') : 0);
    // burgaren
    let z = 0;
    for (const s of S) {
      if (s.k === undefined) continue;
      const p = b.placed[s.id];
      if (!p) break;
      drawLayer(R, p, { id: ids[s.id], at: [cu, cv, z], r, top: s.top, bottom: s.k === 0 });
      z += s.top ? bunTopHeight(p) : layerHeight(p);
    }
    // tillbehör och dryck
    if (SLOT.pommes) { const p = b.placed.pommes; if (p) drawSide(R, p, { id: ids.pommes, at: [K.basket[0], K.basket[1], 0] }); else R.box(K.basket[0] - 2.3, K.basket[0] + 2.3, K.basket[1] - 1.5, K.basket[1] + 1.5, 0, 0.02, (f, x, y, W, H) => (Math.min(x, W - x, y, H - y) < 0.15 ? 0xd0c4b0 : -1), ids.pommes, { noEdges: true }); }
    if (SLOT.dryck) { const p = b.placed.dryck; if (p) drawSide(R, p, { id: ids.dryck, at: [K.cup[0], K.cup[1], 0] }); else R.box(K.cup[0] - 1.6, K.cup[0] + 1.6, K.cup[1] - 1.6, K.cup[1] + 1.6, 0, 0.02, (f, x, y, W, H) => { const d = Math.hypot(x - W / 2, y - H / 2) / (W / 2); return d < 1 && d > 0.85 ? 0xd0c4b0 : -1; }, ids.dryck, { noEdges: true }); }
  }
  const drawCables = (ctx) => ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  Object.assign(rig, {
    VIEW, MAX_K, CONN, connectorIcon, order, year: order.year, layers, r, cu, cv,
    SLOTS: S, SLOT, ACTIONS: A, ACTION, CABLES, CABLE, STEPS, PORTS,
    actSet, actCount, actDone, missingReq, slotsFor, canPlace, canRemove, onRemove, wattNeed, actionReady,
    portPos, portType, availablePorts, portLabel, portBusy, cableConn, cableNeeded, cableReady, cableOk, cableFrom, canConnect,
    SCREW_OF, screwStatus, standCheck, fact, drawScene, drawCables,
  });
  return rig;
}
