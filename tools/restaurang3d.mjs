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
// servera i 3D
await page.click('#build-boot'); await page.waitForTimeout(500);
const fin = await page.evaluate(() => ({ phase: PV.build.phase, desk: PV.build.gl.info().desk, faces: PV.build.gl.info().faces, hint: PV.build.finale.hintText() }));
ok(fin.phase === 'desk' && fin.faces > 0, `serveringen i 3D: ${JSON.stringify(fin)}`);
await waitFrames(3); await page.waitForTimeout(300);
await shot('7-servering3d');
await page.evaluate(() => { const f = PV.build.finale; f.onPointerDown([f.serveBtn[0] + 10, f.serveBtn[1] + 10]); });
try { await page.waitForFunction(() => PV.game.orders.length === 0 || PV.build.finale.run?.done, null, { timeout: 180000 }); } /* SwiftShader ritar långsamt – animationen tar realtid */ catch (e) { const dbg = await page.evaluate(() => { const f = PV.build.finale; return { run: f.run && { t: f.run.t, done: f.run.done }, btn: f.serveBtn, success: f.d.success, phase: PV.build.phase, cw: PV.build.cw, help: PV.build.b.help, screen: document.body.dataset.screen, t: f.t }; }); ok(false, 'servering i 3D blev inte klar: ' + JSON.stringify(dbg)); }
await page.waitForTimeout(300);
await shot('8-omdome3d');
await page.waitForFunction(() => document.body.dataset.screen === 'shop', null, { timeout: 240000 }); await page.waitForTimeout(600);   /* SwiftShader: tallriken glider i realtid */
const after = await page.evaluate(() => ({ screen: document.body.dataset.screen, mode: PV.view3d.mode, kitchen: !!PV.view3d.kitchen, modal: document.querySelector('#modal h2')?.textContent, gl: !!PV.build.gl }));
ok(after.screen === 'shop' && after.mode === 'walk' && !after.gl && !after.kitchen && /disken|nöjd/i.test(after.modal || ''), `tillbaka i restaurangen efter servering: ${JSON.stringify(after)}`);
await page.evaluate(() => { const b = [...document.querySelectorAll('#modal .btn')].find((x) => /butiken|ok|stäng|klar/i.test(x.textContent)); b?.click(); });
await waitFrames(2); await page.waitForTimeout(300);
await shot('9-tillbaka');
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
