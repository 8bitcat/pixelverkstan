// Byta delar: lägg till grafikkort i kundens beställning vid disken, byt ur lagret i bygget,
// och de sex lokalerna – en skärmdump per lokal. node tools/byt.mjs [url] [år]
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const URL = process.argv[2] || "http://localhost:8777/index.html";
const YEAR = +(process.argv[3] || 2021);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}\n${e.stack}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FEL  ') + m); if (!c) errors.push(m); };
await page.goto(URL);
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300);
await page.click('[data-shop="dator"]'); await page.click(`[data-year="${YEAR}"]`);
await page.waitForFunction(() => window.PV?.game, null, { timeout: 30000 }); await page.waitForTimeout(1200);
// 1) startlokalen ska vara sunkig
ok(await page.evaluate(() => PV.floor.lokal === 1 && PV.floor.openSlots === 5), 'startar i Källarhålan (5 platser, 3 hyllor)');
await page.screenshot({ path: OUT + "lokal1-kallarhalan.png" });
// startpaketet ska innehålla ett grafikkort, eller tredje guidade kunden vill ha ett
const gpuStart = await page.evaluate(() => { const g = PV.game; const kit = g.startInfo.builds.some((b) => b.some((p) => p.cat === 'gpu')); g.money = 100000; const o = g.shop.tutorialOrder(2, g); return { kit, third: o?.items.some((it) => it.cat === 'gpu'), msg: o?.msg }; });
ok(gpuStart.kit || gpuStart.third, `grafikkort tidigt: startpaket ${gpuStart.kit}, tredje kunden ${gpuStart.third} («${gpuStart.msg}»)`);
// 2) kund vid disken utan grafikkort → lägg till ett ur lagret
const r1 = await page.evaluate(() => {
  const g = PV.game; g.tutorialStep = 99;
  // ett par grafikkort och en dyrare processor hemma
  const y = g.year, C = g.shop.compat;
  let o = null; for (let i = 0; i < 80 && !o; i++) { const t = g.shop.generateOrder(g, ['Gunnar']); if (t && !t.product && !t.repair && !t.items.some((it) => it.cat === 'gpu')) o = t; }
  if (!o) return { none: true };
  const mb = g.shop.part[o.items.find((it) => it.cat === 'mb').part];
  const gpus = g.shop.onSale(y).filter((p) => p.cat === 'gpu' && C.cardsFit([p.bus], mb) && g.canSell(p)).sort((a, b) => a.cost - b.cost).slice(0, 3);
  for (const p of gpus) { g.stock[p.id] = 1; g.shown[p.id] = 1; }
  const c = g.spawn(o); c.phase = 'queue'; c.x = 318; c.y = 176; c._fl = true; c._path = []; c._tkey = 'q0'; g.emit('change');
  return { title: o.title, gpus: gpus.map((p) => p.name), price: g.shop.priceFor(o, {}) };
});
ok(!r1.none && r1.gpus.length > 0, `kund utan grafikkort: ${r1.title}, ${r1.gpus.length} kort hemma`);
await page.evaluate(() => PV.floor.onCustomerClick(PV.game.queue()[0]));
await page.waitForSelector('[data-addgpu]', { timeout: 5000 }); await page.waitForTimeout(200);
await page.screenshot({ path: OUT + "byt1-dialog.png" });
await page.click('[data-addgpu]');
await page.waitForSelector('[data-pick]', { timeout: 5000 }); await page.waitForTimeout(200);
await page.screenshot({ path: OUT + "byt2-lagret.png" });
await page.click('[data-pick]'); await page.waitForTimeout(400);
const r2 = await page.evaluate(() => { const o = PV.game.queue()[0].order; return { gpu: o.items.find((it) => it.cat === 'gpu')?.part, price: PV.game.shop.priceFor(o, {}), dlg: document.querySelector('.dlg h2')?.textContent }; });
ok(!!r2.gpu && r2.price > r1.price, `grafikkort tillagt (${r2.gpu}), priset steg ${r1.price} → ${r2.price} kr`);
await page.screenshot({ path: OUT + "byt3-med-gpu.png" });
// byt ut grafikkortet mot ett annat via "Byt del ur lagret"
await page.click('[data-stockpick]'); await page.waitForSelector('[data-pick]', { timeout: 5000 });
const swapped = await page.evaluate(() => { const b = [...document.querySelectorAll('[data-pick]')].find((x) => x.dataset.pick.startsWith('gpu') || PV.game.shop.part[x.dataset.pick]?.cat === 'gpu'); if (!b) return null; b.click(); return b.dataset.pick; });
await page.waitForTimeout(400);
const r3 = await page.evaluate(() => PV.game.queue()[0].order.items.find((it) => it.cat === 'gpu')?.part);
ok(swapped && r3 === swapped, `bytt grafikkort ur lagret → ${r3}`);
// ta emot, bygg: lagerknappen i lådan
await page.evaluate(() => { const g = PV.game; const o = g.queue()[0].order; for (const it of o.items) if (it.part) { g.stock[it.part] = (g.stock[it.part] || 0) + 1; } g.emit('change'); });
await page.click('button:has-text("Ta emot beställningen")'); await page.waitForTimeout(500);
await page.evaluate(() => PV.openBuild(PV.game.orders[0])); await page.waitForTimeout(500);
const modeBtn = await page.$('button:has-text("Med hjälp")'); if (modeBtn) { await modeBtn.click(); await page.waitForTimeout(400); }
ok(await page.evaluate(() => !!document.querySelector('.tray-stock')), 'lagerknappen finns i lådan');
await page.click('.tray-stock'); await page.waitForSelector('.dlg', { timeout: 5000 }); await page.waitForTimeout(200);
await page.screenshot({ path: OUT + "byt4-bygg-lagret.png" });
const picks = await page.evaluate(() => [...document.querySelectorAll('[data-pick]')].map((b) => ({ id: b.dataset.pick, idx: b.dataset.idx })));
ok(picks.length > 0, `${picks.length} delar går att byta in i bygget`);
if (picks.length) {
  const before = await page.evaluate(() => PV.game.orders[0].items.map((it) => it.part).join(','));
  await page.click(`[data-pick="${picks[0].id}"]`); await page.waitForTimeout(500);
  const after = await page.evaluate(() => ({ items: PV.game.orders[0].items.map((it) => it.part).join(','), reserved: PV.game.orders[0].reserved.includes(document.body.dataset.screen ? PV.game.orders[0].items[0].part : ''), phase: PV.build.phase, rig: !!PV.build.rig }));
  ok(after.items !== before && after.items.includes(picks[0].id) && after.phase === 'build', `delen bytt i bygget (${picks[0].id})`);
}
await page.screenshot({ path: OUT + "byt5-bygg.png" });
// 3) lokalerna 2–6 i bild
await page.click('#build-back'); await page.waitForTimeout(300);
for (const n of [2, 3, 4, 5, 6]) {
  await page.evaluate((n) => { PV.game.money = 500000; PV.game.buyItem('lokal' + n); }, n);
  await page.waitForTimeout(700);
  const st = await page.evaluate(() => ({ lokal: PV.floor.lokal, open: PV.floor.openSlots }));
  ok(st.lokal === n, `lokal ${n}: ${st.open} platser`);
  await page.screenshot({ path: OUT + `lokal${n}.png` });
}
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
