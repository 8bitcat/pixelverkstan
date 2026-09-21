// Byggreglerna för EN beställning i hamburgerbaren: burgaren byggs lager för lager på brickan,
// underifrån. Brödet rostas i brödrosten, biffen steks och kryddas på grillen, tillbehören
// läggs i fickan och drycken på brickan. Samma API som datorbutikens rigg (core/build.js
// pratar bara med riggen), men utan kablar och uttag.
import { DB, layerHeight, bunTopHeight, burgerRadius, BURGER_CATS, CATS } from './menu.js';
import { drawPlate, drawTray, drawToaster, drawGrill, drawShakers, drawCrate, drawLayer, drawSide, drawFryer, drawDrinkTower } from './art.js';
import { eraLook } from './era.js';

export const VIEW = { w: 872, h: 504, k: 16, hz: 13, ox: 400, oy: 80 };
export const MAX_K = 64;
export const CONN = {};
export const connectorIcon = (conn, W = 40, H = 30) => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };

// var sakerna står (enheter): brödrost och grill till vänster, brickan till höger
// (brödrost och grill står en aning längre åt vänster än förr för att ge plats åt brickan)
export const K = { toaster: [-1, 1], grill: [-1, 8.5], salt: [3.0, 6.4], fryer: [-4.5, 15], crate: [1.3, 15.7], tower: [24, 17], tray: [4.7, 30, 1, 15], plate: [13, 8, 8, 5.8], burger: [13, 8], basket: [19.5, 3.5], cup: [24.5, 11.5], dessert: [26.5, 6.5] };
// brickans ovansida ligger strax under arbetsytan (tallriken är nedsänkt lika mycket) – allt annat står på den
export const TRAY_Z = -0.3;
export const TRAY_ID = 900;   // brickans egen träff-id: i 3D klickar man på den färdiga brickan för att ta den
// 2D-serveringen: brickan lyfts ur bild när den bärs ut
export const LIFT_DZ = 26;
// delarna på brickan som egna föremål (3D: ta, bär, kasta): var de står och hur stora de är (enheter)
export const TRAY_PARTS = { tray: { at: [(K.tray[0] + K.tray[1]) / 2, (K.tray[2] + K.tray[3]) / 2, TRAY_Z - 0.35], half: [(K.tray[1] - K.tray[0]) / 2, (K.tray[3] - K.tray[2]) / 2] }, burger: { at: [K.plate[0], K.plate[1], TRAY_Z], r: K.plate[2] }, pommes: { at: [K.basket[0], K.basket[1], TRAY_Z], r: 2.6 }, dryck: { at: [K.cup[0], K.cup[1], TRAY_Z], r: 1.8 }, dessert: { at: [K.dessert[0], K.dessert[1], TRAY_Z], r: 2.2 } };
// Tillagningen tar tid (sekunder i köket): en sida av biffen bryns på SIDE, pommesen friteras på FRY. Ligger
// det kvar längre än BURN / FRY_BURN blir det bränt – det märker gästen.
export const COOK = { SIDE: 5, BURN: 17, FRY: 6, FRY_BURN: 19 };
// tillbehör som friteras och drycker som tappas upp ur maskinen (flaskor och burkar tas ur kylen under)
export const isFried = (p) => ['fries', 'nuggets', 'ringbasket'].includes(p?.look?.shape);
export const isPoured = (p) => p?.look?.shape === 'cup' && !p.look.bottle && !p.look.can && !p.look.box;

// ---------- Måltiden som eget föremål: på luckan, i kundens händer och på bordet (3D) ----------
// Samma bricka och samma voxlar som i köket, ritad ur kundens måltid (shop.mealOf). `eaten` 0..1: kunden tar
// tuggor ur burgaren från sin sida (−v), pommesen sjunker i fickan och efterrätten äts sist. När sista
// tuggan är tagen ligger bara smulor kvar på tallriken.
const BITES = [[0, -1], [-0.75, -0.7], [0.75, -0.7], [0, -0.35], [-0.95, -0.05], [0.95, -0.05], [0, 0.3], [-0.7, 0.65], [0.7, 0.65], [0, 0.95]];
const GRID = 0.25;
const snap = (x) => Math.round(x / GRID) * GRID;
// lådsamlare som skär bort runda tuggor (cirklar i u/v, genom hela höjden) ur allt som ritas genom den
function biteClip(R, bites) {
  const P = Object.create(R);
  P.box = (u0, u1, v0, v1, z0, z1, tex, id, opt) => {
    const hit = bites.filter((b) => u1 > b.u - b.r && u0 < b.u + b.r && v1 > b.v - b.r && v0 < b.v + b.r);
    if (!hit.length) return R.box(u0, u1, v0, v1, z0, z1, tex, id, opt);
    const W0 = u1 - u0, H0 = v1 - v0;
    // texturen ska ligga kvar där den låg: bitarna får samma koordinater som den hela lådan hade
    const piece = (a, b, va, vb) => {
      if (b - a < 0.02) return;
      const du = a - u0, dv = va - v0;
      R.box(a, b, va, vb, z0, z1, (f, x, y, w, h) => (f === 'top' ? tex(f, x + du, y + dv, W0, H0) : f === 'left' ? tex(f, x + du, y, W0, h) : tex(f, x + dv, y, H0, h)), id, opt);
    };
    for (let va = v0; va < v1 - 1e-9; va += GRID) {
      const vb = Math.min(v1, va + GRID), vm = (va + vb) / 2;
      let segs = [[u0, u1]];
      for (const b of hit) {
        const d = vm - b.v; if (Math.abs(d) >= b.r) continue;
        const hw = Math.sqrt(b.r * b.r - d * d), a = snap(b.u - hw), c = snap(b.u + hw);
        segs = segs.flatMap(([s, e]) => (c <= s || a >= e ? [[s, e]] : [[s, Math.max(s, a)], [Math.min(e, c), e]]));
      }
      for (const [s, e] of segs) piece(s, e, va, vb);
    }
  };
  return P;
}
// lådsamlare som kapar allt ovanför en höjd (pommesen som tar slut, efterrätten som äts upp)
function heightClip(R, draw, z0, keep, left) {
  const boxes = [], P = Object.create(R);
  P.box = (...a) => boxes.push(a);
  draw(P);
  const top = boxes.reduce((m, b) => Math.max(m, b[5]), z0), cut = z0 + Math.max(keep, (top - z0) * left);
  for (const b of boxes) { if (b[4] >= cut - 1e-6) continue; b[5] = Math.min(b[5], cut); R.box(...b); }
}
export function drawMeal(R, meal, { eaten = 0 } = {}) {
  const era = eraLook(meal.year || 1990), part = (id) => DB.part[id];
  if (meal.tray) drawTray(R, K.tray[0], K.tray[1], K.tray[2], K.tray[3], era, TRAY_Z, 0);
  drawPlate(R, K.plate[0], K.plate[1], K.plate[2], K.plate[3], era, 0, 0);
  const layers = (meal.layers || []).map(part).filter(Boolean), [cu, cv] = K.burger;
  const r = burgerRadius(layers[0]);
  const n = Math.min(BITES.length, Math.floor(eaten / 0.075 + 1e-6));
  if (layers.length && n < BITES.length) {
    const B = n ? biteClip(R, BITES.slice(0, n).map(([x, y]) => ({ u: cu + x * r, v: cv + y * r, r: r * 0.55 }))) : R;
    let z = 0;
    layers.forEach((p, i) => {
      const top = i > 0 && i === layers.length - 1 && p.cat === 'brod';
      drawLayer(B, p, { id: 0, at: [cu, cv, z], r, top, bottom: i === 0 });
      z += top ? bunTopHeight(p) : layerHeight(p);
    });
  } else if (layers.length) {
    // smulor och en klick sås där burgaren låg
    const crumb = parseInt(String(layers[0].look?.color || '#d9a55d').replace('#', ''), 16);
    [[-0.9, -0.3], [0.5, -0.8], [1.1, 0.4], [-0.3, 0.9], [0.1, 0.1], [-1.3, 0.5]].forEach(([x, y], i) => R.box(cu + x, cu + x + 0.3, cv + y, cv + y + 0.3, 0, 0.15, () => (i % 3 === 2 ? 0xb8402a : crumb), 0, { noEdges: true }));
  }
  const side = (id, Kp, keep, left) => {
    const p = part(id); if (!p) return;
    if (left >= 0.999) drawSide(R, p, { id: 0, at: [Kp[0], Kp[1], TRAY_Z] });
    else heightClip(R, (Q) => drawSide(Q, p, { id: 0, at: [Kp[0], Kp[1], TRAY_Z] }), TRAY_Z, keep, left);
  };
  const clamp = (x) => Math.max(0, Math.min(1, x));
  if (meal.pommes) side(meal.pommes, K.basket, isFried(part(meal.pommes)) ? 2.05 : 0.35, 1 - clamp((eaten - 0.1) / 0.7));
  if (meal.dryck) side(meal.dryck, K.cup, 0, 1);
  if (meal.dessert) side(meal.dessert, K.dessert, 0.3, 1 - clamp((eaten - 0.7) / 0.25));
}
// var måltidens fot ligger (enheter): brickans mitt, eller tallrikens om den serverades utan bricka
export const mealAnchor = (meal) => (meal?.tray ? TRAY_PARTS.tray.at : [K.plate[0], K.plate[1], TRAY_Z]);

const esc = (x) => String(x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
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
    S.push({ id, cat: l.it.cat, name, requires, k, top, part, ring: true, accept: (p) => p.cat === l.it.cat });
  });
  const sideItem = items.find((it) => it.cat === 'tillbehor'), sidePart = sideItem?.part ? DB.part[sideItem.part] : null;
  const drinkItem = items.find((it) => it.cat === 'dryck'), drinkPart = drinkItem?.part ? DB.part[drinkItem.part] : null;
  const fried = !!sidePart && isFried(sidePart), poured = !!drinkPart && isPoured(drinkPart);
  if (sideItem) S.push({ id: 'pommes', cat: 'tillbehor', name: 'Tillbehörsfickan', requires: fried ? ['act:fritera'] : [], anchor: [K.basket[0], K.basket[1], 3.2], hl: [K.basket[0] - 2.6, K.basket[0] + 2.6, K.basket[1] - 1.8, K.basket[1] + 1.8, TRAY_Z + 0.02] });
  if (drinkItem) S.push({ id: 'dryck', cat: 'dryck', name: 'Drycken', requires: poured ? ['act:tappa'] : [], anchor: [K.cup[0], K.cup[1], 4.8], hl: [K.cup[0] - 1.9, K.cup[0] + 1.9, K.cup[1] - 1.9, K.cup[1] + 1.9, TRAY_Z + 0.02] });
  if (items.some((it) => it.cat === 'dessert')) S.push({ id: 'dessert', cat: 'dessert', name: 'Efterrätten', requires: [], anchor: [K.dessert[0], K.dessert[1], 3.0], hl: [K.dessert[0] - 2.2, K.dessert[0] + 2.2, K.dessert[1] - 2.0, K.dessert[1] + 2.0, TRAY_Z + 0.02] });
  S.forEach((s, i) => (s.n = i + 1));
  const SLOT = Object.fromEntries(S.map((s) => [s.id, s]));
  // höjden där lager k börjar: summan av lagren under (det som ligger där, annars det beställda)
  const zOf = (b, k) => { let z = 0; for (let j = 0; j < k; j++) { const s = S[j], p = b?.placed?.[s.id] || s.part; z += p ? (s.top ? bunTopHeight(p) : layerHeight(p)) : 0.5; } return z; };
  for (const s of S) if (s.k !== undefined) {
    Object.defineProperty(s, 'hl', { get() { const z = zOf(rig.lastB, s.k); return [cu - r - 0.3, cu + r + 0.3, cv - r - 0.3, cv + r + 0.3, z + 0.02]; } });
    Object.defineProperty(s, 'anchor', { get() { const z = zOf(rig.lastB, s.k); return [cu, cv, z + 0.5]; } });
  }

  // ---------- Handgrepp ----------
  // Punkterna i ett handgrepp görs i ordning (pointReady). Stekbordet: lägg på biffen, vänd den när undersidan
  // fått färg. Fritösen: lägg råvaran i korgen, sänk ner korgen i oljan, lyft upp den när det är gyllene.
  // Saltet: klicka på salt- och pepparkaret bredvid stekbordet, eller på biffen (alts).
  const PATTY = [K.grill[0] + 2.75, K.grill[1] + 3, 1.6], BASKET = [K.fryer[0] + 1.35, K.fryer[1] + 3.2, 3.4], HANDLE = [K.fryer[0] + 1.35, K.fryer[1] + 5.6, 3.2];
  const A = [{ id: 'rosta', name: 'Rosta brödet', icon: '🍞', requires: [], points: [[K.toaster[0] + 2, K.toaster[1] + 2, 2.4]] }];
  const firstBiff = layers.find((l) => l.it.cat === 'biff');
  if (firstBiff) {
    A.push({ id: 'grill', name: 'Stek biffen på båda sidor (lägg på, vänd)', icon: '🔥', requires: [], points: [PATTY, PATTY] });
    A.push({ id: 'salt', name: 'Salta och peppra', icon: '🧂', requires: ['act:grill'], points: [[K.salt[0] + 0.65, K.salt[1] + 0.3, 1.3]], alts: [[PATTY]] });
  }
  if (fried) A.push({ id: 'fritera', name: 'Fritera (lägg i korgen, sänk ner, lyft upp)', icon: '🍟', requires: [], points: [BASKET, HANDLE, HANDLE] });
  if (poured) A.push({ id: 'tappa', name: 'Tappa upp drycken', icon: '🥤', requires: [], points: [[K.tower[0] + 2.2, K.tower[1] + 3.2, 3.0]] });
  const ACTION = Object.fromEntries(A.map((a) => [a.id, a]));
  const actSet = (b, id) => b.acts.get(id) || new Set();
  const actCount = (b, id) => actSet(b, id).size;
  const actDone = (b, id) => !!ACTION[id] && actCount(b, id) >= ACTION[id].points.length;

  // ---------- Tillagningen: hur brynt och hur friterat ----------
  // Tiderna kommer ur handgreppens tidsstämplar (b.actAt, sekunder i köket) och när biffen lades på burgaren
  // (b.placedAt). Äldre byggen och handgrepp utan tid räknas som färdiga.
  const fbSlot = () => S.find((s) => s.cat === 'biff');
  function cookInfo(b) {
    const now = b.time || 0, at = b.actAt || {}, g = at.grill || {}, f = at.fritera || {}, gs = actSet(b, 'grill'), fs = actSet(b, 'fritera');
    const on = gs.has(0), flipped = gs.has(1), fb = fbSlot(), taken = fb ? b.placedAt?.[fb.id] : undefined;
    const secA = !on ? 0 : g[0] === undefined ? COOK.SIDE : (flipped ? (g[1] ?? now) : now) - g[0];
    const secB = !flipped ? 0 : g[1] === undefined ? COOK.SIDE : (taken ?? now) - g[1];
    const loaded = fs.has(0), down = fs.has(1), up = fs.has(2);
    const secF = !down ? 0 : f[1] === undefined ? COOK.FRY : (up ? (f[2] ?? now) : now) - f[1];
    return {
      grill: { on, flipped, a: secA / COOK.SIDE, b: secB / COOK.SIDE, burnt: secA > COOK.BURN || secB > COOK.BURN, cooking: on && !(fb && b.placed[fb.id]), tick: Math.floor(now * 2) },
      fry: { loaded, down, up, prog: secF / COOK.FRY, burnt: secF > COOK.FRY_BURN, cooking: down && !up, tick: Math.floor(now * 2) },
    };
  }
  // vilket steg i ett handgrepp som går att göra just nu
  function pointReady(a, i, b) {
    const set = actSet(b, a.id), c = cookInfo(b);
    for (let k = 0; k < i; k++) if (!set.has(k)) return false;
    if (a.id === 'grill' && i === 1) return c.grill.a >= 1;
    if (a.id === 'fritera' && i === 2) return c.fry.prog >= 1;
    return true;
  }
  // ritas om när något ändras på stekbordet eller i fritösen (brynt i femtedelar, bubblor och fräs i halvsekunder)
  const step5 = (x) => Math.floor(Math.min(3.4, x) * 5);
  function cookSig(b) { const c = cookInfo(b); return `${step5(c.grill.a)}|${step5(c.grill.b)}|${step5(c.fry.prog)}|${c.grill.cooking || c.fry.cooking ? c.grill.tick : 0}`; }
  // vad som står i hjälprutan medan man väntar
  function actHint(a, b) {
    const c = cookInfo(b), set = actSet(b, a.id), pct = (x) => Math.round(Math.min(1, x) * 100);
    if (a.id === 'grill') {
      if (!set.has(0)) return 'Lägg biffen på <b>stekbordet</b> – släpp den på stekytan (eller tryck på 🔥).';
      if (!set.has(1)) return c.grill.a < 1 ? `Undersidan bryns … <b>${pct(c.grill.a)} %</b>. Vänta tills den fått färg.` : '<b>Vänd biffen nu!</b> Tryck på den.';
    }
    if (a.id === 'salt') return c.grill.b < 1 ? `Andra sidan bryns … <b>${pct(c.grill.b)} %</b>. Krydda under tiden: tryck på <b>salt- och pepparkaret</b>.` : 'Tryck på <b>salt- och pepparkaret</b> (eller på biffen) för att krydda.';
    if (a.id === 'fritera') {
      if (!set.has(0)) return `Lägg ${sidePart ? esc(sidePart.name.toLowerCase()) : 'råvaran'} i <b>fritöskorgen</b> – ta den ur backen bredvid fritösen eller ur lådan och släpp den i korgen.`;
      if (!set.has(1)) return '<b>Sänk ner korgen</b> i oljan – tryck på handtaget.';
      return c.fry.prog < 1 ? `Det fräser i oljan … <b>${pct(c.fry.prog)} %</b>. Vänta tills det är gyllene.` : '<b>Lyft korgen nu!</b> Tryck på handtaget.';
    }
    return null;
  }
  // varför ett klick på en station inte gör något (proffsläget ger annars inget besked)
  function whyNot(a, b) {
    const miss = missingReq(a.requires, b); if (miss) return miss;
    const c = cookInfo(b), set = actSet(b, a.id);
    if (a.id === 'grill' && set.has(0) && !set.has(1) && c.grill.a < 1) return 'Vänta – undersidan har inte fått färg än.';
    if (a.id === 'fritera' && set.has(1) && !set.has(2) && c.fry.prog < 1) return 'Vänta – det är inte gyllene än.';
    return null;
  }
  // anmärkningar på det som blev bränt
  function cookWarnings(b) { const c = cookInfo(b), out = []; if (firstBiff && c.grill.burnt) out.push('Biffen blev bränd.'); if (fried && c.fry.burnt) out.push('Det friterade blev bränt.'); return out; }

  // ---------- Ordning i hjälpen ----------
  const STEPS = ['act:rosta', 'slot:l0', 'act:grill', 'act:salt', ...S.filter((s) => s.k !== undefined && s.k > 0).map((s) => 'slot:' + s.id), 'act:fritera', 'slot:pommes', 'act:tappa', 'slot:dryck', 'slot:dessert']
    .filter((k) => { const [kd, id] = k.split(':'); return kd === 'slot' ? !!SLOT[id] : !!ACTION[id]; });

  // ---------- Regler ----------
  const has = (b, req) => (req.startsWith('act:') ? actDone(b, req.slice(4)) : !!b.placed[req]);
  const NEED_MSG = { 'act:rosta': 'Rosta brödet i brödrosten först!', 'act:grill': 'Stek biffen på stekbordet först – lägg på den och vänd när undersidan fått färg.', 'act:salt': 'Salta och peppra biffen först – tryck på salt- och pepparkaret.', 'act:fritera': 'Fritera först – sänk ner korgen i fritösen och lyft upp den.', 'act:tappa': 'Tappa upp drycken vid dryckesmaskinen först.' };
  function missingReq(reqs, b) {
    rig.lastB = b;
    for (const r of reqs) if (!has(b, r)) return NEED_MSG[r] || `${SLOT[r]?.name || r} måste ligga på först.`;
    return null;
  }
  // lagren tas i ordning: bara nästa lediga plats i stapeln för den här sortens råvara (så ligger inte gula rutor över hela burgaren)
  const slotsFor = (part) => { const all = S.filter((s) => s.cat === part.cat && (!s.accept || s.accept(part))); const stack = all.filter((s) => s.k !== undefined); const next = stack.find((s) => !rig.lastB?.placed?.[s.id]); return [...(next ? [next] : []), ...all.filter((s) => s.k === undefined)]; };
  // släpp råvaran på stationen = handgreppet: bröd på brödrosten, biff på grillen, pommes i fritösen, mugg vid dryckesmaskinen
  // det som ligger färdigt på stationerna och går att ta med handen: rostat bröd på brödrosten, stekt biff på
  // grillen, friterade pommes i korgen, tappad mugg vid maskinen (råvaran som lades på minns i b.station)
  const pickups = (b) => {
    rig.lastB = b;
    const st = b.station || {}, out = [];
    const partOf = (id, slot, cat) => DB.part[st[id]] || slot?.part || DB.parts.find((p) => p.cat === cat);
    if (S[0] && actDone(b, 'rosta') && !b.placed.l0) out.push({ id: 'rosta', part: partOf('rosta', S[0], 'brod'), at: [K.toaster[0] + 2, K.toaster[1] + 2, 2.4], name: 'brödet', from: 'brödrosten' });
    const fb = S.find((s) => s.cat === 'biff');
    // biffen tas först när den är kryddad – saltet har samma klickyta på grillen
    if (fb && actDone(b, 'grill') && cookInfo(b).grill.b >= 1 && (!ACTION.salt || actDone(b, 'salt')) && !b.placed[fb.id]) out.push({ id: 'grill', part: partOf('grill', fb, 'biff'), at: PATTY, name: 'biffen', from: 'stekbordet' });
    if (fried && actDone(b, 'fritera') && !b.placed.pommes) out.push({ id: 'fritera', part: DB.part[st.fritera] || sidePart, at: [BASKET[0], BASKET[1], 4.2], name: sidePart.name.toLowerCase(), from: 'fritöskorgen' });
    // råvaran till fritösen ligger i backen bredvid: ta den med handen och släpp den i korgen
    if (fried && sidePart && !actSet(b, 'fritera').has(0) && !b.placed.pommes) out.push({ id: 'back', part: sidePart, at: [K.crate[0] + 1.5, K.crate[1] + 1.6, 1.9], name: sidePart.look?.shape === 'fries' ? 'potatis' : sidePart.name.toLowerCase(), from: 'backen vid fritösen' });
    if (poured && actDone(b, 'tappa') && !b.placed.dryck) out.push({ id: 'tappa', part: DB.part[st.tappa] || drinkPart, at: [K.tower[0] + 2.2, K.tower[1] + 3.2, 2.2], name: 'muggen', from: 'dryckesmaskinen' });
    return out.filter((p) => p.part);
  };
  const dropAction = (part, a) => (a.id === 'rosta' && part.cat === 'brod') || (a.id === 'grill' && part.cat === 'biff') || (a.id === 'fritera' && part.cat === 'tillbehor' && isFried(part)) || (a.id === 'tappa' && part.cat === 'dryck' && isPoured(part));
  function canPlace(slot, part, b) {
    rig.lastB = b;
    if (slot.cat !== part.cat) return { ok: false, msg: `${part.name} hör inte hemma i ${slot.name.toLowerCase()}.` };
    if (b.placed[slot.id]) return { ok: false, msg: 'Det ligger redan något där.' };
    const miss = missingReq(slot.requires, b);
    if (miss) return { ok: false, msg: miss };
    if (slot === fbSlot() && cookInfo(b).grill.b < 1) return { ok: false, msg: 'Biffen är inte klar – låt den få färg på båda sidor.' };
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
    biff: (p) => ({ not: 'Nötfärs ska stekas till 70 °C inuti. Tryck inte på biffen med stekspaden – då rinner saften ut!', kyckling: 'Kyckling måste alltid vara genomstekt: 72 °C i mitten. Ingen rosa!', fisk: 'Fisk är klar när den blir ogenomskinlig och faller isär lätt. Panering håller den saftig.', vego: 'Vegobiffar innehåller mindre fett – stek dem försiktigt så de inte torkar.', lamm: 'Lammfärs är fetare än nöt och tål högre värme – då blir kanten knaprig.', flask: 'Fläsk ska vara genomstekt, minst 70 °C.', vilt: 'Viltkött är magert – stek det kort och låt det vila, annars blir det torrt.', kalv: 'Kalvfärs är mild och mager – stek på medelvärme så den inte torkar.' })[p.look?.kind] || 'Biffen steks på grillen.',
    ost: (p) => (p.look?.melt === false ? `${p.name} smälter inte – den läggs på för smaken.` : 'Osten läggs på biffen medan den ligger på grillen så att den hinner smälta.'),
    extra: (p) => p.desc || 'Toppingen ger burgaren dess karaktär.',
    gront: () => 'Grönsakerna läggs överst, långt från den varma biffen – då håller de sig krispiga.',
    sas: (p) => p.desc || 'Såsen läggs närmast toppbrödet.',
    tillbehor: (p) => (p.look?.shape === 'fries' ? 'Pommes friteras två gånger: först i 150 °C så de blir mjuka, sedan i 180 °C så de blir knapriga.' : p.desc || 'Läggs i fickan på brickan.'),
    dryck: (p) => p.desc || 'Drycken ställs på brickan.',
    rosta: 'Rostat bröd får en yta som håller för sås och köttsaft – utan rostning blir underbrödet blött.',
    fritera: 'Fritösen håller 175–180 °C. För mycket i korgen på en gång sänker temperaturen och pommesen blir mjuka och feta.',
    tappa: 'Dryckesmaskinen blandar sirap och kolsyrat vatten i kranen – därför smakar läsken lite olika på olika ställen.',
    dessert: (p) => p.desc || 'Efterrätten läggs på brickan sist så den inte hinner smälta.',
    grill: 'Vänd biffen bara en gång. Då får den fin stekyta (Maillard-reaktionen) och behåller saften.',
    salt: 'Salta precis före eller under stekningen – saltar du färsen långt innan drar saltet ur vätskan och biffen blir seg.',
  };
  function fact(key, part) { const f = FACTS[key]; return typeof f === 'function' ? f(part || {}) : f || ''; }

  // ---------- Rita ----------
  // Brickan med allt som står på den: brickan, tallriken med burgaren, tillbehöret, drycken och efterrätten.
  // `only` ritar en enda del (3D: varje del är ett eget föremål man kan ta, bära och kasta), `dz` lyfter
  // allt (2D-serveringen: brickan bärs ut ur bild), `marks` ritar konturerna för det som ännu saknas.
  function drawTrayScene(R, b, { only = null, dz = 0, marks = false } = {}) {
    rig.lastB = b;
    const ids = Object.fromEntries(S.map((s) => [s.id, s.n]));
    const era = eraLook(order.year || 1990), want = (k) => !only || only === k;
    if (want('tray')) drawTray(R, K.tray[0], K.tray[1], K.tray[2], K.tray[3], era, TRAY_Z + dz, TRAY_ID);
    if (want('burger')) {
      drawPlate(R, K.plate[0], K.plate[1], K.plate[2], K.plate[3], era, 0, dz);
      let z = dz;
      for (const s of S) {
        if (s.k === undefined) continue;
        const p = b.placed[s.id];
        if (!p) break;
        drawLayer(R, p, { id: ids[s.id], at: [cu, cv, z], r, top: s.top, bottom: s.k === 0 });
        z += s.top ? bunTopHeight(p) : layerHeight(p);
      }
    }
    const zs = TRAY_Z + dz;
    const side = (key, Kp, mark) => {
      if (!SLOT[key]) return;
      const p = b.placed[key];
      if (p) { if (want(key)) drawSide(R, p, { id: ids[key], at: [Kp[0], Kp[1], zs] }); }
      else if (marks && !only) mark();
    };
    side('pommes', K.basket, () => R.box(K.basket[0] - 2.3, K.basket[0] + 2.3, K.basket[1] - 1.5, K.basket[1] + 1.5, zs, zs + 0.02, (f, x, y, W, H) => (Math.min(x, W - x, y, H - y) < 0.15 ? 0xd0c4b0 : -1), ids.pommes, { noEdges: true }));
    side('dryck', K.cup, () => R.box(K.cup[0] - 1.6, K.cup[0] + 1.6, K.cup[1] - 1.6, K.cup[1] + 1.6, zs, zs + 0.02, (f, x, y, W, H) => { const d = Math.hypot(x - W / 2, y - H / 2) / (W / 2); return d < 1 && d > 0.85 ? 0xd0c4b0 : -1; }, ids.dryck, { noEdges: true }));
    side('dessert', K.dessert, () => R.box(K.dessert[0] - 2.0, K.dessert[0] + 2.0, K.dessert[1] - 1.8, K.dessert[1] + 1.8, zs, zs + 0.02, (f, x, y, W, H) => (Math.min(x, W - x, y, H - y) < 0.15 ? 0xd0c4b0 : -1), ids.dessert, { noEdges: true }));
  }
  function drawScene(R, b, anim = {}) {
    rig.lastB = b;
    const era = eraLook(order.year || 1990), t = anim.plateT || 0;
    drawToaster(R, K.toaster[0], K.toaster[1], 0, actDone(b, 'rosta') && !b.placed.l0);
    const fb = firstBiff ? S.find((s) => s.cat === 'biff') : null;
    const pattyPart = fb ? (b.placed[fb.id] || DB.part[b.station?.grill] || fb.part || DB.parts.find((p) => p.cat === 'biff')) : null;
    const ck = cookInfo(b);
    drawGrill(R, K.grill[0], K.grill[1], 0, pattyPart, fb && !b.placed[fb.id] ? ck.grill : null, era);
    if (firstBiff) drawShakers(R, K.salt[0], K.salt[1], 0);
    drawFryer(R, K.fryer[0], K.fryer[1], 0, era, b.placed.pommes ? {} : ck.fry, fried, sidePart);
    if (fried) drawCrate(R, K.crate[0], K.crate[1], 0, sidePart);
    drawDrinkTower(R, K.tower[0], K.tower[1], 0, era, poured && actDone(b, 'tappa') && !b.placed.dryck, drinkPart);
    // brickan lyfts mjukt (ease in) när den bärs ut
    drawTrayScene(R, b, { dz: t * t * LIFT_DZ, marks: true });
  }
  const drawCables = (ctx) => ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  Object.assign(rig, {
    VIEW, MAX_K, CONN, connectorIcon, order, year: order.year, layers, r, cu, cv, TRAY_ID,
    SLOTS: S, SLOT, ACTIONS: A, ACTION, CABLES, CABLE, STEPS, PORTS,
    actSet, actCount, actDone, missingReq, slotsFor, dropAction, pickups, pointReady, cookInfo, cookSig, actHint, whyNot, cookWarnings, canPlace, canRemove, onRemove, wattNeed, actionReady,
    portPos, portType, availablePorts, portLabel, portBusy, cableConn, cableNeeded, cableReady, cableOk, cableFrom, canConnect,
    SCREW_OF, screwStatus, standCheck, fact, drawScene, drawTrayScene, drawCables,
  });
  return rig;
}
