// Byggläget i 3D: tar emot en beställning, öppnar bygget i 3D-läget (arbetsbänken bakom disken),
// kollar att kameran projicerar exakt som 2D-byggvyn (så att pekarlogiken stämmer), sätter i
// delar, klicktestar, zoomar och går ut igen. Skärmdumpar tools/out/3d-bygg-*.png.
// node tools/bygg3d.mjs [url]
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
const crash = async (e) => { const NL = String.fromCharCode(10); console.log('KRASCH ' + String(e.message).split(NL)[0]); console.log(errors.join(NL)); try { await page.screenshot({ path: OUT + '3d-bygg-krasch.png' }); } catch {} process.exit(1); };
process.on('unhandledRejection', crash); process.on('uncaughtException', crash);
const waitFrames = async (n = 2) => { const f0 = await page.evaluate(() => PV.view3d.frames); await page.waitForFunction((f) => PV.view3d.frames >= f, f0 + n, { timeout: 120000 }); };
const shot = async (name) => { const t = Date.now(); await page.screenshot({ path: OUT + `3d-bygg-${name}.png`, timeout: 120000 }); console.log(`skärmdump ${name}: ${((Date.now() - t) / 1000).toFixed(1)} s`); };

await page.goto(URL);
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300);
await page.click('[data-shop="dator"]'); await page.click('[data-year="1999"]');
await page.waitForFunction(() => window.PV?.game, null, { timeout: 30000 }); await page.waitForTimeout(600);
await page.evaluate(() => { const g = PV.game; g.money = 900000; g.tutorialStep = 99; g.stats.served = 9; for (const e of g.shop.events.EVENTS) if (!g.events.seen.includes(e.id)) g.events.seen.push(e.id); g.emit('change'); });
// en beställning med alla delar hemma
const ord = await page.evaluate(() => {
  const g = PV.game;
  let c = null;
  for (let i = 0; i < 30 && !c; i++) { const o = g.shop.generateOrder(g, ['Nils']); if (o.items.every((it) => it.part) && !o.repair && !o.product && !o.service) c = g.spawn(o); }
  if (!c) return null;
  for (const it of c.order.items) g.stock[it.part] = (g.stock[it.part] || 0) + 2;
  c.phase = 'queue'; c.x = 318; c.y = 176;
  const o = g.accept(c);
  if (!o || !o.id) return { err: 'accept misslyckades' };
  o.guided = true;   // hoppa över "Välj byggläge"
  return { id: o.id, title: o.title, items: o.items.length };
});
ok(ord && ord.id, `beställning mottagen: ${JSON.stringify(ord)}`);
const t0 = Date.now();
await page.click('[data-h="view3d"]');
await page.waitForFunction(() => PV.view3d?.ready, null, { timeout: 240000 });
console.log(`laddade 3D på ${((Date.now() - t0) / 1000).toFixed(1)} s`);
await page.waitForTimeout(1500);
ok(await page.evaluate(() => !!PV.view3d.room.bench && !!PV.view3d.bench), 'arbetsbänken finns i rummet');
// gå till bänken i förstaperson och titta på den
await page.evaluate(() => { const v = PV.view3d, b = v.room.bench; v.setPose(b.stand[0], b.stand[1], 0, -0.72); });
await waitFrames(2);
await page.evaluate(() => PV.view3d.updateHover());
const hov = await page.evaluate(() => ({ type: PV.view3d.hover?.type, text: document.querySelector('#hint3d')?.textContent }));
ok(hov.type === 'bench', `siktet träffar arbetsbänken: ${JSON.stringify(hov)}`);
await shot('0-bank');
// klick på bänken med en enda beställning → bygget öppnas i 3D
await page.evaluate(() => PV.view3d.interact());
await page.waitForFunction(() => document.body.dataset.screen === 'build' && PV.build.gl, null, { timeout: 20000 });
await waitFrames(3);
await page.waitForTimeout(400);
const i1 = await page.evaluate(() => ({ mode: PV.view3d.mode, bench: PV.build.gl.info(), body: document.body.className, board: !!document.querySelector('#board'), hud3d: document.querySelector('#hud3d').classList.contains('hidden') }));
console.log('bygg', JSON.stringify(i1));
ok(i1.mode === 'bench' && i1.bench.faces > 0 && /bench3d/.test(i1.body), `byggläget i 3D: ${i1.bench.boxes} lådor, ${i1.bench.faces} sidor, atlas ${i1.bench.atlas.join('×')}, ${i1.bench.ms} ms`);
// projektionen: 2D-byggvyns P.proj och 3D-kameran ska ge samma skärmpunkt (inom en pixel)
const proj = await page.evaluate(() => {
  const v = PV.build, r = v.canvas.getBoundingClientRect(), out = [];
  for (const [u, w, z] of [[13, 23, 1], [0, 0, 0], [26, 24, 5], [7, 5.6, 0.8], [1, 14, 3.9]]) {
    const [x, y] = v.P.proj(u, w, z), [sx, sy] = v.gl.screenOf(u, w, z);
    out.push({ p: [u, w, z], d: +Math.hypot(r.left + x - sx, r.top + y - sy).toFixed(2) });
  }
  return out;
});
ok(proj.every((p) => p.d < 1.5), `kameran matchar 2D-projektionen: ${proj.map((p) => p.d).join(', ')} px`);
await shot('1-tom');
// klick på mattan (chassit ligger inte i än) → chassits platsnummer, som i 2D
const idMat = await page.evaluate(() => { const v = PV.build, [x, y] = v.P.proj(13, 12, 0); return { id: v.gl.idAt(x, y), want: v.L.SLOT.case.n }; });
ok(idMat.id === idMat.want, `klicktest mot mattan ger chassits id (${JSON.stringify(idMat)})`);
// sätt i chassi, moderkort och processor via byggvyns egna funktioner
const placed = await page.evaluate(() => {
  const v = PV.build, done = [];
  for (const cat of ['case', 'mb', 'cpu', 'ram', 'psu']) {
    const e = v.partEntries().find((x) => x.part.cat === cat); if (!e) continue;
    const s = v.L.slotsFor(e.part).find((sl) => !v.b.placed[sl.id]); if (!s) continue;
    if (v.place(e, s)) done.push(cat);
  }
  return done;
});
ok(placed.includes('case') && placed.includes('mb'), `delar isatta: ${placed.join(', ')}`);
await waitFrames(3); await page.waitForTimeout(300);
const i2 = await page.evaluate(() => PV.build.gl.info());
console.log('efter delar', JSON.stringify(i2));
ok(i2.faces > i1.bench.faces, `scenen byggdes om (${i1.bench.faces} → ${i2.faces} sidor, ${i2.ms} ms, ${i2.cached} ur cachen)`);
const idMb = await page.evaluate(() => { const v = PV.build, s = v.L.SLOT.mb, [x, y] = v.P.proj(...s.anchor); return { id: v.gl.idAt(x, y), want: s.n, placed: !!v.b.placed.mb }; });
ok(idMb.id === idMb.want, `klick på moderkortet träffar rätt (${JSON.stringify(idMb)})`);
await shot('2-delar');
// zooma in – kameran följer
await page.evaluate(() => { PV.build.zoomBy(1.7); });
await waitFrames(2); await page.waitForTimeout(200);
const projZ = await page.evaluate(() => { const v = PV.build, r = v.canvas.getBoundingClientRect(), [x, y] = v.P.proj(7, 5.6, 0.8), [sx, sy] = v.gl.screenOf(7, 5.6, 0.8); return +Math.hypot(r.left + x - sx, r.top + y - sy).toFixed(2); });
ok(projZ < 1.5, `zoomad kamera matchar (${projZ} px)`);
await shot('3-zoom');
await page.evaluate(() => PV.build.zoomFit());
// finalen: datorn på skrivbordet – på bänken i 3D (tvingas fram utan att bygget är klart)
await page.evaluate(() => { const v = PV.build; v.op({ t: 'phase', v: 'desk' }); v.selected = null; v.msg = null; v.finale.enter(); v.refresh(); });
await waitFrames(3); await page.waitForTimeout(400);
const dk = await page.evaluate(() => { const v = PV.build, f = v.finale, i = v.gl.info(); const [bx, by] = f.powerButton(); const [gx, gy] = v.gl.project(...[f.constructor.CASE_AT[0] + f.dims.D - 0.55, f.constructor.CASE_AT[1] + 1.0, f.constructor.CASE_AT[2] + f.dims.H]); return { phase: v.phase, desk: i.desk, faces: i.faces, quads: i.quads, projOverride: Object.prototype.hasOwnProperty.call(f, 'proj'), d: +Math.hypot(bx - gx, by - gy).toFixed(2) }; });
ok(dk.phase === 'desk' && dk.desk && dk.faces > 30 && dk.quads >= 1 && dk.projOverride && dk.d < 0.5, `finalen i 3D: ${JSON.stringify(dk)}`);
await shot('5-skrivbord');
// koppla in strömkabeln → en sladd i 3D; tillbaka till bygget → chassit igen
const cb = await page.evaluate(async () => { const v = PV.build, f = v.finale; const port = f.ports().find((p) => p.type === f.PLUGS.pc_power.type); if (port) v.op({ t: 'plug', id: 'pc_power', key: port.key }); v.op({ t: 'plug', id: 'mon_power', key: 'STRIP' }); v.refresh(); await new Promise((r) => setTimeout(r, 300)); return { port: !!port }; });
await waitFrames(2);
const cb2 = await page.evaluate(() => PV.build.gl.info());
ok(cb2.cables >= 2, `sladdar i 3D efter inkoppling: ${cb2.cables} (${JSON.stringify(cb)})`);
await shot('6-sladdar');
await page.evaluate(() => PV.build.backToBuild());
await waitFrames(2);
const bk = await page.evaluate(() => { const i = PV.build.gl.info(); return { phase: PV.build.phase, desk: i.desk, faces: i.faces, quads: i.quads, cables: i.cables }; });
ok(bk.phase === 'build' && !bk.desk && bk.faces > 30 && bk.quads === 0 && bk.cables === 0, `tillbaka till chassit på bänken (${JSON.stringify(bk)})`);
// ut ur bygget: tillbaka i butiken, vid bänken
await page.click('#build-back');
await page.waitForTimeout(400);
const i3 = await page.evaluate(() => ({ screen: document.body.dataset.screen, mode: PV.view3d.mode, body: document.body.className, gl: !!PV.build.gl, pos: [PV.view3d.pos.x.toFixed(2), PV.view3d.pos.z.toFixed(2)], hud: !document.querySelector('#hud3d').classList.contains('hidden') }));
ok(i3.screen === 'shop' && i3.mode === 'walk' && !i3.gl && !/bench3d/.test(i3.body) && i3.hud, `tillbaka i butiken vid bänken (${JSON.stringify(i3)})`);
await waitFrames(2);
await shot('4-tillbaka');
// öppna igen via beställningslistan (knappen Bygg) – ska också gå till bänken
await page.evaluate(() => PV.openBuild(PV.game.orders[0]));
await page.waitForFunction(() => document.body.dataset.screen === 'build' && PV.view3d.mode === 'bench', null, { timeout: 20000 });
ok(true, 'Bygg-knappen öppnar bygget vid bänken');
await page.click('#build-back'); await page.waitForTimeout(300);
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
