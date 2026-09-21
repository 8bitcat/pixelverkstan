// Hamburgerbaren i 3D: starta 2016, ta emot en stor beställning, bygg burgaren i 2D-köket (skärmdump),
// gå in i 3D, öppna köket vid arbetsbänken, bygg samma sorts burgare lager för lager på bänken,
// servera i 3D. Skärmdumpar tools/out/rest3d-*.png. node tools/restaurang3d.mjs [url]
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const URL = process.argv.find((a) => a.startsWith('http')) || "http://localhost:8777/index.html";
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}\n${e.stack}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FEL  ') + m); if (!c) errors.push(m); };
const crash = async (e) => { const NL = String.fromCharCode(10); console.log('KRASCH ' + String(e.message).split(NL)[0]); console.log(errors.join(NL)); try { await page.screenshot({ path: OUT + 'rest3d-krasch.png' }); } catch {} process.exit(1); };
process.on('unhandledRejection', crash); process.on('uncaughtException', crash);
const waitFrames = async (n = 2) => { const f0 = await page.evaluate(() => PV.view3d.frames); await page.waitForFunction((f) => PV.view3d.frames >= f, f0 + n, { timeout: 120000 }); };
const shot = async (name) => { await page.screenshot({ path: OUT + `rest3d-${name}.png`, timeout: 120000 }); };
// bygger den öppna beställningen via byggvyns egna funktioner i hjälpens ordning
const buildAll = () => page.evaluate(async () => {
  const v = PV.build, L = v.L, log = [];
  for (let guard = 0; guard < 60; guard++) {
    const s = v.nextStep(); if (!s || s.kind === 'stand') break;
    if (s.kind === 'act') { const a = L.ACTION[s.id]; const done = L.actSet(v.b, a.id); const i = a.points.findIndex((p, k) => !done.has(k)); v.doAction(a, i); log.push('act:' + a.id); }
    else if (s.kind === 'slot') { const e = v.trayEntries().find((x) => x.key === s.entryKey) || v.partEntries().find((x) => L.slotsFor(x.part).some((sl) => sl.id === s.id)); if (!e) { log.push('ingen del för ' + s.id); break; } v.place(e, L.SLOT[s.id]); log.push(s.id); }
    await new Promise((r) => setTimeout(r, 20));
  }
  return { log, built: v.isBuilt(), placed: Object.keys(v.b.placed).length, slots: L.SLOTS.length };
});
// en stor beställning (många lager, tillbehör och dryck) med alla delar hemma
const bigOrder = () => page.evaluate(() => {
  const g = PV.game;
  let best = null;
  for (let i = 0; i < 60; i++) { const o = g.shop.generateOrder(g, ['Nils']); if (!o || o.product || !o.items.every((it) => it.part)) continue; if (!best || o.items.length > best.items.length) best = o; }
  if (!best) return null;
  const c = g.spawn(best);
  for (const it of c.order.items) { g.stock[it.part] = (g.stock[it.part] || 0) + 2; g.shown[it.part] = g.stock[it.part]; }
  c.phase = 'queue'; c.x = 453; c.y = 176; c.patience = 9999;
  const o = g.accept(c);
  if (!o || !o.id) return { err: 'accept misslyckades' };
  o.guided = true;
  return { id: o.id, title: o.title, items: o.items.map((it) => it.part) };
});

await page.goto(URL);
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300);
await page.click('[data-shop="restaurang"]'); await page.click('[data-year="2016"]');
await page.waitForFunction(() => window.PV?.game && PV.game.shop.id === 'restaurang', null, { timeout: 30000 }); await page.waitForTimeout(600);
await page.evaluate(() => { const g = PV.game; g.money = 90000; g.tutorialStep = 99; g.stats.served = 9; g.emit('change'); });
// ---- 2D: en stor burgare i köket ----
const o1 = await bigOrder();
ok(o1 && o1.id, `stor beställning: ${JSON.stringify(o1)}`);
await page.evaluate(() => PV.openBuild(PV.game.orders[0]));
await page.waitForFunction(() => document.body.dataset.screen === 'build', null, { timeout: 10000 }); await page.waitForTimeout(500);
const b1 = await buildAll();
ok(b1.built, `2D: burgaren byggd (${b1.placed}/${b1.slots}): ${b1.log.join(' ')}`);
await page.evaluate(() => { PV.build.selected = null; PV.build.sel = null; PV.build.refresh(); });
await page.waitForTimeout(400);
await shot('1-kok2d');
await page.click('#build-boot'); await page.waitForTimeout(500);
await shot('2-servering2d');
await page.evaluate(() => { const f = PV.build.finale; f.onPointerDown([f.serveBtn[0] + 10, f.serveBtn[1] + 10]); });
await page.waitForFunction(() => PV.game.customers[0]?.phase === 'ready', null, { timeout: 60000 }); await page.waitForTimeout(500);
await page.evaluate(() => { const b = [...document.querySelectorAll('#modal .btn')].find((x) => /butiken|ok|stäng|klar/i.test(x.textContent)); b?.click(); });
await page.waitForTimeout(300);
// ---- 3D ----
const o2 = await bigOrder();
ok(o2 && o2.id, `beställning för 3D: ${JSON.stringify(o2)}`);
const t0 = Date.now();
await page.click('[data-h="view3d"]');
await page.waitForFunction(() => PV.view3d?.ready, null, { timeout: 240000 });
console.log(`laddade 3D på ${((Date.now() - t0) / 1000).toFixed(1)} s`);
await page.waitForTimeout(1500);
ok(await page.evaluate(() => !!PV.view3d.room.bench && !!PV.view3d.bench), 'arbetsbänken finns i rummet');
const dv = await page.evaluate(() => PV.view3d.units.displayVox?.stats || null);
ok(dv && dv.boxes > 0 && dv.faces > 0, `kyldiskens råvaror ritas som voxlar i kantinerna: ${JSON.stringify(dv)}`);
await page.evaluate(() => { const v = PV.view3d, b = v.room.bench; v.setPose(b.stand[0], b.stand[1], 0, -0.72); });
await waitFrames(2);
await shot('3-rum');
await page.evaluate(() => PV.view3d.setPose(-1.0, 1.0, 0, -0.15)); await waitFrames(2); await shot('3b-matsal');
await page.evaluate(() => PV.view3d.setPose(-1.0, 1.0, Math.PI, -0.15)); await waitFrames(2); await shot('3c-matsal');
await page.evaluate(() => PV.openBuild(PV.game.orders[0]));
await page.waitForFunction(() => document.body.dataset.screen === 'build' && PV.build.gl, null, { timeout: 20000 });
await waitFrames(3); await page.waitForTimeout(400);
const i1 = await page.evaluate(() => ({ mode: PV.view3d.mode, kitchen: PV.view3d.kitchen, free: PV.build.gl.free, info: PV.build.gl.info(), body: document.body.className, locked: PV.view3d.locked }));
ok(i1.mode === 'walk' && i1.kitchen && i1.free && i1.info.faces > 0 && /kitchen3d/.test(i1.body) && !i1.locked, `köket i 3D med fri kamera (ingen låst byggbild): ${i1.info.boxes} lådor, ${i1.info.faces} sidor, ${i1.info.ms} ms`);
// vänd dig om: dra i bilden vrider spelaren, och stationerna hamnar där byggvyn tror (projektionen går genom spelarens kamera)
const turn = await page.evaluate(() => { const v = PV.view3d, y0 = v.yaw; PV.build.orbit(-1.0, 0); return { before: +y0.toFixed(2), after: +v.yaw.toFixed(2) }; });
ok(Math.abs(turn.after - turn.before + 1.0) < 0.01, `drag i bilden vänder spelaren (${turn.before} → ${turn.after})`);
await page.evaluate(() => { const v = PV.view3d, b = v.room.bench; v.setPose(b.stand[0], b.stand[1], 0, -0.6); });
await waitFrames(2);
const proj = await page.evaluate(() => {
  const v = PV.build, r = v.canvas.getBoundingClientRect(), out = [];
  for (const [u, w, z] of [[13, 8, 1], [2.5, 3, 2.4], [22, 12, 0], [7, 0.5, 0], [29, 15.5, 0]]) { const [x, y] = v.P.proj(u, w, z), [sx, sy] = v.gl.screenOf(u, w, z); out.push(+Math.hypot(r.left + x - sx, r.top + y - sy).toFixed(2)); }
  return out;
});
ok(proj.every((d) => d < 1.5), `kameran matchar 2D-projektionen: ${proj.join(', ')} px`);
await shot('4-kok3d-tom');
// klick på brödrosten → handgreppets id (rosta)
const hit = await page.evaluate(() => { const v = PV.build, a = v.L.ACTION.rosta, [x, y] = v.P.proj(...a.points[0]); return { id: v.gl.idAt(x, y) }; });
console.log('klick brödrost', JSON.stringify(hit));
const b2 = await buildAll();
ok(b2.built, `3D: burgaren byggd (${b2.placed}/${b2.slots}): ${b2.log.join(' ')}`);
await page.evaluate(() => { PV.build.selected = null; PV.build.sel = null; PV.build.refresh(); });
await waitFrames(3); await page.waitForTimeout(400);
const i2 = await page.evaluate(() => PV.build.gl.info());
ok(i2.faces > i1.info.faces, `scenen byggdes om (${i1.info.faces} → ${i2.faces} sidor, ${i2.ms} ms)`);
await shot('5-kok3d-burgare');
await page.evaluate(() => { PV.build.zoomBy(1.8); }); await waitFrames(2); await page.waitForTimeout(200);
await shot('6-kok3d-zoom');
await page.evaluate(() => PV.build.zoomFit());
// ---- servera i 3D: brickan blir ett föremål i händerna och bärs ut till kunden ----
const before = await page.evaluate(() => ({ money: PV.game.money, orders: PV.game.orders.length }));
// klicka på den färdiga brickan i köket (inte på Servera-knappen) – den hamnar i händerna
const hint3d = await page.evaluate(() => PV.build.hintText().replace(/<[^>]+>/g, ''));
ok(/Klicka på brickan/.test(hint3d), `hjälpen i 3D-köket: "${hint3d}"`);
await page.evaluate(() => {
  const v = PV.build, r = v.canvas.getBoundingClientRect(), pt = v.P.proj(...v.L.SLOT.l0.anchor);
  const o = { clientX: r.left + pt[0], clientY: r.top + pt[1], pointerId: 7, bubbles: true, isPrimary: true };
  v.canvas.dispatchEvent(new PointerEvent('pointerdown', o)); v.canvas.dispatchEvent(new PointerEvent('pointerup', o));
});
await page.waitForTimeout(600);
const carried = await page.evaluate(() => { const c = PV.view3d.carry, h = c.held; return { screen: document.body.dataset.screen, kitchen: !!PV.view3d.kitchen, gl: !!PV.build.gl, held: h?.kind, kids: h ? [...h.kids].map((k) => k.kind).sort() : [], phase: PV.game.orders[0]?.build?.phase, orders: PV.game.orders.length }; });
ok(carried.screen === 'shop' && !carried.kitchen && carried.held === 'tray' && carried.kids.includes('burger') && carried.phase === 'desk' && carried.orders === before.orders, `Servera i 3D: brickan hamnar i händerna med allt på: ${JSON.stringify(carried)}`);
await waitFrames(3);
await page.evaluate(() => PV.view3d.setPose(PV.view3d.pos.x, PV.view3d.pos.z, Math.PI, -0.35));
await waitFrames(3);
await shot('7-brickan-i-handerna');
const inHand = await page.evaluate(() => { const v = PV.view3d, h = v.carry.held; return { d: +Math.hypot(h.pos.x - v.pos.x, h.pos.z - v.pos.z).toFixed(2), y: +h.pos.y.toFixed(2), text: v.carry.hoverText() }; });
ok(inHand.d > 0.4 && inHand.d < 1 && inHand.y > 0.6 && inHand.y < 1.5 && /bär|Ställ|släpp/i.test(inHand.text), `brickan hålls framför kroppen: ${JSON.stringify(inHand)}`);
// ställ ner den på arbetsbänken och ta upp den igen (fysiken får gå några steg)
const stepPhys = (n = 90) => page.evaluate((n) => { for (let i = 0; i < n; i++) PV.view3d.carry.update(1 / 60); }, n);
await page.evaluate(() => { const v = PV.view3d, c = v.carry, b = v.room.bench; c.setDown(c.held, { x: (b.x0 + b.x1) / 2, y: b.y, z: (b.z0 + b.z1) / 2 }); });
await stepPhys(60);
const onBench = await page.evaluate(() => { const c = PV.view3d.carry, t = [...c.props.values()].find((p) => p.kind === 'tray'); return { rest: t.rest, on: t.on?.kind, y: +t.pos.y.toFixed(2), held: c.held?.kind || null }; });
ok(onBench.rest && onBench.on === 'bench' && !onBench.held, `brickan ställd på arbetsbänken: ${JSON.stringify(onBench)}`);
// kasta: håll brickan, sväng med kameran och släpp – den flyger, landar hårt och tappar allt
const thrown = await page.evaluate(() => {
  const v = PV.view3d, c = v.carry, t = [...c.props.values()].find((p) => p.kind === 'tray');
  // kunden ställs i ett hörn: ett kast som träffar rätt kund fångas nämligen (det prövas längre ner)
  for (const cu of PV.game.customers) { cu.x = 40; cu.y = 440; cu._path = []; }
  c.take(t);
  v.setPose(1.5, 4.2, 0, 0.1);
  for (let i = 0; i < 10; i++) { v.yaw -= 0.11; c.update(1 / 60); }
  const speed = +c.handVel().length().toFixed(1);
  const p = c.throwHeld();
  const v0 = +p.vel.length().toFixed(1);
  for (let i = 0; i < 400; i++) c.update(1 / 60);
  const all = [...c.props.values()];
  return { speed, v0, held: c.held?.kind || null, trayRest: t.rest, trayOn: t.on?.kind, kids: t.kids.size, loose: all.filter((x) => x.kind !== 'tray' && !x.parent).map((x) => ({ k: x.kind, rest: x.rest, floor: x.floor, y: +x.pos.y.toFixed(2) })) };
});
ok(thrown.speed > 1.5 && thrown.v0 > 2 && !thrown.held && thrown.trayRest && thrown.kids === 0 && thrown.loose.length >= 1 && thrown.loose.every((x) => x.rest), `svängen med musen kastar brickan, den landar och allt far av: ${JSON.stringify(thrown)}`);
await waitFrames(2); await shot('8-kastad');
// kunden sitter vid ett bord och väntar; en ofullständig bricka tas inte emot
const refuse = await page.evaluate(() => {
  const g = PV.game, v = PV.view3d, c = v.carry, o = g.orders[0], cu = g.customers.find((x) => x.id === o.customerId);
  const seat = PV.floor.pickSeat(cu); cu.phase = 'waiting'; cu._spot = seat;
  for (let k = 0; k < 400; k++) PV.floor.update(0.05);
  const t = c.trayOf(o.id);
  const okd = c.deliver(t, cu, { direct: true });
  return { sit: !!cu._sit, table: PV.floor.constructor ? true : true, delivered: okd, yell: cu._yell?.text || '', orders: g.orders.length };
});
ok(refuse.sit && !refuse.delivered && /Var är/.test(refuse.yell) && refuse.orders === before.orders, `en bricka där maten saknas tas inte emot: ${JSON.stringify(refuse)}`);
// plocka upp allt från golvet, ställ tillbaka på brickan, bär ut och ställ på kundens bord
const served = await page.evaluate(() => {
  const g = PV.game, v = PV.view3d, c = v.carry, o = g.orders[0], cu = g.customers.find((x) => x.id === o.customerId);
  const t = c.trayOf(o.id);
  for (const p of [...c.props.values()]) if (p.kind !== 'tray' && !p.parent) { c.take(p); c.release(); c.attach(p, t); }
  const complete = c.complete(t).length === 0;
  c.take(t);
  const tables = c.surfaces().filter((s) => s.kind === 'table'), s = tables.find((x) => x.table === (PV.floor ? (window.__t = null, undefined) : undefined)) || tables[0];
  const spot = cu._spot, tableIx = spot >= 0 ? (PV.floor && (() => { let ix = -1; c.surfaces().forEach((x) => { if (x.kind === 'table' && c.customerAt(x.table, o.id)) ix = x.table; }); return ix; })()) : -1;
  const target = tables.find((x) => x.table === tableIx);
  c.setDown(t, { x: (target.x0 + target.x1) / 2, y: target.y, z: (target.z0 + target.z1) / 2 });
  for (let i = 0; i < 120; i++) c.update(1 / 60);
  for (let k = 0; k < 10; k++) PV.floor.update(0.05);
  return { complete, tableIx, orders: g.orders.length, props: c.props.size, phase: cu.phase, sit: !!cu._sit, money: g.money, meal: !!cu.meal?.tray, say: typeof cu.say === 'string' ? cu.say : '' };
});
ok(served.complete && served.orders === before.orders - 1 && served.props === 0 && served.phase === 'eating' && served.sit && served.money > before.money && served.meal, `brickan ställd på kundens bord: serverat, betalt och kunden äter på plats: ${JSON.stringify(served)}`);
ok(/golvet/.test(served.say), `maten hade legat på golvet – kunden märker det: "${served.say}"`);
await page.evaluate(() => PV.view3d.setPose(1.2, 3.4, 1.6, -0.2));
await waitFrames(4); await page.waitForTimeout(300);
await shot('9-serverat');
// en ny beställning: kasta brickan rakt på kunden – den fångas och räknas som serverad
const o3 = await bigOrder();
const caught = await page.evaluate(async (id) => {
  const g = PV.game, v = PV.view3d, c = v.carry, o = g.orders.find((x) => x.id === id), L = g.shop.layout.rigFor(o);
  // bygg klart utan byggvyn: alla platser och handgrepp
  const { applyBuildOp } = await import('./js/core/build-ops.js');
  applyBuildOp(g.shop, o, { t: 'mode', help: true });
  for (const a of L.ACTIONS) a.points.forEach((_, i) => applyBuildOp(g.shop, o, { t: 'act', id: a.id, i }));
  for (const s of L.SLOTS) { const part = s.part || g.shop.part[o.items.find((it) => it.cat === s.cat)?.part]; if (part) applyBuildOp(g.shop, o, { t: 'place', slot: s.id, part: part.id }); }
  applyBuildOp(g.shop, o, { t: 'phase', v: 'desk' });
  const money = g.money, cu = g.customers.find((x) => x.id === o.customerId);
  cu.phase = 'waiting'; cu.x = 256; cu.y = 300; cu._path = []; cu._spot = -1;
  const t = c.spawnOrder(o, { held: true });
  const C = await import('./js/3d/coords.js');
  const tx = C.toX(cu.x), tz = C.toZ(cu.y);
  v.setPose(tx, tz + 2.2, 0, 0); c.update(1 / 60);
  const p = c.release(new (t.vel.constructor)(0, 1.6, -4.2)); p.thrown = true;
  for (let i = 0; i < 200 && g.orders.includes(o); i++) c.update(1 / 60);
  for (let k = 0; k < 10; k++) PV.floor.update(0.05);
  return { built: Object.keys(o.build.placed).length, served: !g.orders.includes(o), money: g.money - money, phase: cu.phase, props: c.props.size, say: typeof cu.say === 'string' ? cu.say : '' };
}, o3.id);
ok(caught.served && caught.money > 0 && caught.props === 0 && /kast/i.test(caught.say), `en bricka som kastas till rätt kund fångas och räknas som serverad: ${JSON.stringify(caught)}`);

console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
