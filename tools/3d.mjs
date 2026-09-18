// 3D-läget: slår på 🧊 3D i Kvartersbutiken (1999), väntar in laddningen, tar skärmdumpar från
// några ståplatser (tools/out/3d-*.png), kollar att kunder/montrar finns i scenen och att ett
// klick på kunden först i kön öppnar beställningen. node tools/3d.mjs [url]
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const URL = process.argv.find((a) => a.startsWith('http')) || "http://localhost:8777/index.html";
const QUICK = process.argv.includes('--snabb');   // färre skärmdumpar (live-kontroll)
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await browser.newPage({ viewport: { width: QUICK ? 900 : 1200, height: QUICK ? 600 : 760 } });
const waitFrames = async (n = 2) => { const f0 = await page.evaluate(() => PV.view3d.frames); await page.waitForFunction((f) => PV.view3d.frames >= f, f0 + n, { timeout: 120000 }); };
const errors = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}\n${e.stack}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FEL  ') + m); if (!c) errors.push(m); };
const crash = async (e) => { const NL = String.fromCharCode(10); console.log('KRASCH ' + String(e.message).split(NL)[0]); console.log(errors.join(NL)); try { await page.screenshot({ path: OUT + '3d-krasch.png' }); } catch {} process.exit(1); };
process.on('unhandledRejection', crash); process.on('uncaughtException', crash);
await page.goto(URL);
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300);
await page.click('[data-shop="dator"]'); await page.click('[data-year="1999"]');
await page.waitForFunction(() => window.PV?.game, null, { timeout: 30000 }); await page.waitForTimeout(600);
await page.evaluate(() => { const g = PV.game; g.money = 900000; g.tutorialStep = 99; g.stats.served = 9; for (const e of g.shop.events.EVENTS) if (!g.events.seen.includes(e.id)) g.events.seen.push(e.id); g.emit('change'); });
// lite varor och en kund i kön så att det finns något att se
await page.evaluate(() => { const g = PV.game; for (const p of g.shop.onSale(g.year).filter((p) => ['gpu', 'cpu', 'ram', 'storage', 'sound'].includes(p.cat) && p.tier <= 1).slice(0, 60)) { g.stock[p.id] = (g.stock[p.id] || 0) + 2; g.shown[p.id] = (g.shown[p.id] || 0) + 2; } const c = g.spawn(g.shop.generateOrder(g, ['Nils'])); c.phase = 'arriving'; g.emit('change'); });
await page.waitForTimeout(300);
const t0 = Date.now();
await page.click('[data-h="view3d"]');
await page.waitForFunction(() => PV.view3d?.ready, null, { timeout: 240000 });
console.log(`laddade 3D på ${((Date.now() - t0) / 1000).toFixed(1)} s`);
await page.waitForTimeout(2500);
const info = await page.evaluate(() => PV.view3d.info());
console.log('info', JSON.stringify(info));
ok(info.ready && info.pick >= 5, `scenen byggd: ${info.pick} klickbara enheter, ${info.people} personer, ${info.drawCalls} draw calls, ${info.tris} trianglar`);
ok(await page.evaluate(() => document.querySelector('#floor').classList.contains('hidden') && !document.querySelector('#floor3d').classList.contains('hidden')), '3D-canvasen visas, 2D-golvet gömt');
console.log('enheter', await page.evaluate(() => PV.floor.unitList.map((u) => u.i + ':' + (u.empty ? 'tom' : u.unit || u.cat) + (u.frame && PV.floor.partsFor ? '(' + PV.floor.partsFor(u).length + ')' : '')).join(' ')));
console.log('modeller', JSON.stringify(info.models));
ok(info.products > 3, `produktkartonger i montrarna: ${info.products}`);
const sz = await page.evaluate(async () => { const THREE = await import('three'); const v = PV.view3d; const hs = [...v.people.actors.values()].map((ac) => { const b = new THREE.Box3().setFromObject(ac.root, true); return +(b.max.y - b.min.y).toFixed(2); }); return { hs, height: +v.people.height.toFixed(2), canStand: v.canStand(v.pos.x, v.pos.z), fwd: v.canStand(v.pos.x + 0.3, v.pos.z), back: v.canStand(v.pos.x - 0.3, v.pos.z) }; });
ok(sz.hs.length && sz.hs.every((h) => h > 1.1 && h < 1.95), `figurerna är människostora: ${sz.hs.join(', ')} m (rigg ${sz.height})`);
ok(sz.canStand && sz.fwd && sz.back, `spelaren kan röra sig från startplatsen (${JSON.stringify(sz)})`);
// kameran tittar i riktningen (-sin yaw, -cos yaw)
const yawTo = (x, z, tx, tz) => Math.atan2(-(tx - x), -(tz - z));
const shoot = async (name, x, z, tx, tz, pitch = -0.06) => {
  await page.evaluate(([x, z, yaw, pitch]) => PV.view3d.setPose(x, z, yaw, pitch), [x, z, yawTo(x, z, tx, tz), pitch]);
  await waitFrames(2);
  const ts = Date.now(); await page.screenshot({ path: OUT + `3d-${name}.png`, timeout: 120000 }); console.log(`skärmdump ${name}: ${((Date.now() - ts) / 1000).toFixed(1)} s`);
};
// Källarhålan: från disken, från dörren mot montrarna, från bakre gången mot dörren
await shoot('k1-disk', 1.9, 1.3, 0.5, 6.0);
{ const c = await page.evaluate(async () => { const C = await import('./js/3d/coords.js'); const c = PV.game.customers[0]; return c && c.y > 100 ? [C.toX(c.x), C.toZ(c.y)] : null; }); if (c) await shoot('k1-kund', c[0] + 1.6, c[1] + 1.4, c[0], c[1], -0.05); }
if (!QUICK) { await shoot('k1-dorr', -0.9, 0.9, -0.3, 6.5); await shoot('k1-montrar', 2.6, 4.2, -0.9, 5.0); await shoot('k1-bak', 1.5, 8.9, 0.0, 1.5); }
// Kvartersbutiken (lokal 3): köp och bygg om
console.log('köper lokal', await page.evaluate(() => { const g = PV.game; const a = g.buyItem('lokal2'), b = g.buyItem('lokal3'); g.emit('change'); return [a, b, g.shop.fit.lokalOf(g.fit)]; }));
await page.waitForFunction(() => PV.view3d.lokal === 3, null, { timeout: 60000 });
await page.waitForTimeout(1500);
const info3 = await page.evaluate(() => PV.view3d.info());
console.log('info lokal 3', JSON.stringify({ ...info3, models: undefined }));
ok(info3.lokal === 3 && info3.pick >= 8, `Kvartersbutiken byggd: ${info3.pick} klickbara, ${info3.products} kartonger`);
await shoot('k3-hero', 1.8, 4.6, -0.9, 5.0);
if (!QUICK) { await shoot('k3-disk', 1.9, 1.3, -1.0, 6.0); await shoot('k3-dorr', -0.9, 1.0, 0.5, 7.0); await shoot('k3-vanster', -0.3, 3.2, -4.0, 4.6); await shoot('k3-soffa', 0.4, 6.8, 3.2, 4.9); await shoot('k3-bak', 0.5, 9.1, -1.0, 2.0); await shoot('k3-ut', 1.0, 3.5, -1.0, -3.0, 0.04); }
// kunden i kön: ställ oss bakom disken, sikta på kunden och klicka
const r = await page.evaluate(async () => {
  const g = PV.game, fl = PV.floor, v = PV.view3d;
  const c = g.customers[0];
  c.phase = 'queue'; c.x = 318; c.y = 176; c._path = []; c._tkey = 'q0'; c.moving = false; c.dir = 'up';
  c.patience = c.patienceMax = 9999;   // testet tar minuter i SwiftShader – kunden får inte tröttna och gå
  // kunden ska vara först i kön
  await new Promise((r) => setTimeout(r, 400));
  const C = await import('./js/3d/coords.js');
  const cx = C.toX(c.x), cz = C.toZ(c.y);
  v.setPose(cx + 0.5, cz - 1.7, Math.atan2(-(cx - (cx + 0.5)), -(cz - (cz - 1.7))), -0.12);
  const f0 = v.frames;
  await new Promise((r) => { const t = setInterval(() => { if (v.frames >= f0 + 2) { clearInterval(t); r(); } }, 100); });
  v.updateHover();
  const h = v.hover;
  let called = false; const orig = fl.onCustomerClick; fl.onCustomerClick = (x) => { called = true; return orig(x); };
  const toasts = []; const ot = v.hooks.toast; v.hooks.toast = (t, k) => { toasts.push(t); return ot(t, k); };
  v.interact();
  fl.onCustomerClick = orig; v.hooks.toast = ot;
  await new Promise((r) => setTimeout(r, 300));
  return { hover: h ? h.type : null, dist: h ? +h.dist.toFixed(2) : null, called, toasts, name: c.name, clickable: fl.clickable(c), modal: !document.querySelector('#modal').classList.contains('hidden'), title: document.querySelector('#modal h2, #modal .dlg h2, #modal b')?.textContent || '' };
});
ok(r.hover === 'customer' && r.modal, `siktet träffar kunden och klicket öppnar beställningen (${JSON.stringify(r)})`);
await page.screenshot({ path: OUT + '3d-kund.png', timeout: 120000 });
await page.evaluate(() => PV.view3d.hooks.modalOpen() && document.querySelector('#modal .btn')?.click());
// tillbaka till 2D och in igen
await page.evaluate(() => PV.disable3D());
await page.waitForTimeout(300);
ok(await page.evaluate(() => !document.querySelector('#floor').classList.contains('hidden') && document.querySelector('#floor3d').classList.contains('hidden')), 'tillbaka till 2D');
await page.evaluate(() => PV.enable3D()); await page.waitForTimeout(800);
ok(await page.evaluate(() => PV.view3d.active && PV.view3d.frames > 10), `in i 3D igen (${await page.evaluate(() => PV.view3d.frames)} bildrutor)`);
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
