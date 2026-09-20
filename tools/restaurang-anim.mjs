// Gästernas rörelser i 3D: Mixamo-klippen (sitta, äta, dricka, resa sig, bära) laddas ur
// assets/3d/anim/manifest.json, läggs på figurerna och väljs efter vad gästen gör. Skärmdumpar
// tools/out/rest-anim-*.png. node tools/restaurang-anim.mjs [url]
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
const waitFrames = async (n = 2) => { const f0 = await page.evaluate(() => PV.view3d.frames); await page.waitForFunction((f) => PV.view3d.frames >= f, f0 + n, { timeout: 180000 }); };
await page.goto(URL);
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300);
await page.click('[data-shop="restaurang"]'); await page.click('[data-year="1996"]');
await page.waitForFunction(() => window.PV?.game && PV.game.shop.id === 'restaurang', null, { timeout: 30000 }); await page.waitForTimeout(600);
await page.evaluate(() => {
  const g = PV.game; g.money = 90000; g.tutorialStep = 99; g.stats.served = 9;
  for (const id of ['lokal2', 'lokal3']) g.fit.items[id] = true;
  g.emit('change'); PV.floor.build(); PV.floor.sig = null; PV.floor.refreshStock();
  // gäster: två som äter vid bord, en som bär tallriken, en som väntar vid luckan
  const names = ['Nils', 'Maja', 'Ali', 'Sara'];
  for (let i = 0; i < 4; i++) {
    const o = g.shop.generateOrder(g, [names[i]]); if (!o) continue;
    const c = g.spawn(o); c.patience = 9999; c.meal = g.shop.mealOf(c.order);
    if (i < 2) { const seat = PV.floor.pickSeat(c); c.phase = 'eating'; c._spot = seat; c._eatMax = 200; c._eatT = 200 - i * 60; }
    else if (i === 2) { c.phase = 'eating'; c._carry = true; c._eatMax = 200; c._eatT = 200; c.x = 453; c.y = 200; }
    else { c.phase = 'ready'; c.x = 453; c.y = 176; c.payout = { total: 90, price: 80, tip: 10, xp: 0, stars: 3 }; }
  }
  for (let k = 0; k < 200; k++) PV.floor.update(0.05);
});
const st2d = await page.evaluate(() => PV.game.customers.map((c) => ({ n: c.name, ph: c.phase, sit: !!c._sit, carry: !!c._carry, moving: c.moving })));
console.log('2D', JSON.stringify(st2d));
ok(st2d.filter((c) => c.sit).length >= 2, 'två gäster sitter vid borden');
const t0 = Date.now();
await page.click('[data-h="view3d"]');
await page.waitForFunction(() => PV.view3d?.ready, null, { timeout: 240000 });
console.log(`laddade 3D på ${((Date.now() - t0) / 1000).toFixed(1)} s`);
await page.waitForTimeout(1500);
const clips = await page.evaluate(() => Object.keys(PV.view3d.people.clips));
ok(['sit', 'sitIdle', 'eat', 'drink', 'stand', 'carry'].every((k) => clips.includes(k)), `klippen laddade: ${clips.join(', ')}`);
// ställ dig så att borden syns
await page.evaluate(() => { const v = PV.view3d; v.setPose(2.6, 3.2, 0.9, -0.25); });
for (let i = 0; i < 12; i++) { await waitFrames(3); await page.evaluate(() => { for (let k = 0; k < 10; k++) PV.floor.update(0.05); }); }
const act = await page.evaluate(() => {
  const P = PV.view3d.people, out = [];
  for (const c of PV.game.customers) { const ac = P.actors.get('c' + c.id); out.push({ n: c.name, ph: c.phase, sit: !!c._sit, carry: !!c._carry, moving: c.moving, cur: ac?.cur, has: ac ? Object.keys(ac.actions || {}).filter((k) => ['sitIdle', 'eat', 'carry'].includes(k)) : [], y: ac ? +ac.g.position.y.toFixed(2) : null, char: ac?.char || 'xbot' }); }
  return out;
});
console.log('3D', JSON.stringify(act));
ok(act.filter((a) => a.sit).every((a) => ['sitIdle', 'eat', 'drink'].includes(a.cur)), 'de som sitter spelar sitt-/ätklipp');
ok(act.filter((a) => a.sit).every((a) => a.y === 0), 'ingen nedsänkning när riktiga sittklipp finns');
const carrier = act.find((a) => a.carry && a.moving);
ok(!carrier || carrier.cur === 'carry', `den som bär tallriken spelar bärklippet (${carrier ? carrier.cur : 'står stilla'})`);
await page.screenshot({ path: OUT + 'rest-anim-1.png', timeout: 180000 });
await page.evaluate(() => { const v = PV.view3d; v.setPose(1.2, 3.4, 1.6, -0.15); });
await waitFrames(3);
await page.screenshot({ path: OUT + 'rest-anim-2.png', timeout: 180000 });
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
