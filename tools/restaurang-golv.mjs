// Hamburgerbarens golv med inredning: Kvartersbaren (lokal 3) med läskkyl och dessertdisk fyllda,
// jukebox, såsbar, lekhörna, kaffe- och godisautomat, köksprylar (milkshake, fritös, dubbelgrill,
// menytavla) och brickor vid luckan. Skärmdump tools/out/rest-golv-*.png. node tools/restaurang-golv.mjs [url]
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const URL = process.argv.find((a) => a.startsWith('http')) || "http://localhost:8777/index.html";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}\n${e.stack}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FEL  ') + m); if (!c) errors.push(m); };
await page.goto(URL);
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300);
await page.click('[data-shop="restaurang"]'); await page.click('[data-year="2016"]');
await page.waitForFunction(() => window.PV?.game && PV.game.shop.id === 'restaurang', null, { timeout: 30000 }); await page.waitForTimeout(600);
const st = await page.evaluate(() => {
  const g = PV.game, F = g.shop.fit;
  g.money = 90000; g.tutorialStep = 99; g.stats.served = 9;
  // lokal 3 med alla prylar och enheter
  for (const id of ['lokal2', 'lokal3', 'milkshake', 'fritos', 'dubbelgrill', 'menytavla', 'lager2', 'kassa2', 'stereo', 'vaxter']) g.fit.items[id] = true;
  g.fit.slots = [];
  g.fit.slots[0] = { kind: 'cat', cat: 'dryck', level: 0 };
  g.fit.slots[1] = { kind: 'cat', cat: 'dessert', level: 0 };
  g.fit.slots[2] = { kind: 'unit', unit: 'lekhorna' };
  g.fit.slots[4] = { kind: 'cat', cat: 'dryck', level: 0 };
  g.fit.slots[5] = { kind: 'unit', unit: 'jukebox' };
  g.fit.slots[6] = { kind: 'cat', cat: 'dessert', level: 0 };
  g.fit.slots[7] = { kind: 'unit', unit: 'sasbar' };
  // varor framme
  const sale = g.shop.onSale(g.year);
  for (const p of sale.filter((p) => p.cat === 'dryck').slice(0, 14)) { g.stock[p.id] = 3; g.shown[p.id] = 3; }
  for (const p of sale.filter((p) => p.cat === 'dessert').slice(0, 10)) { g.stock[p.id] = 2; g.shown[p.id] = 2; }
  g.emit('change');
  PV.floor.build(); PV.floor.sig = null; PV.floor.refreshStock();
  return { lokal: F.lokalOf(g.fit), units: PV.floor.unitList.map((u) => u.unit || u.cat || (u.empty ? 'tom' : '?')), grid: PV.floor.unitList.filter((u) => u.frame?.grid).length };
});
ok(st.lokal === 3 && st.grid >= 4, `Kvartersbaren med enheter: ${JSON.stringify(st)}`);
await page.waitForTimeout(700);
await page.screenshot({ path: OUT + 'rest-golv-1.png' });
// brickor som väntar vid luckan
await page.evaluate(() => { const g = PV.game; for (let i = 0; i < 2; i++) { const o = g.shop.generateOrder(g, ['Nils']); if (!o) continue; const c = g.spawn(o); c.phase = 'ready'; c.x = 453; c.y = 176 + i * 34; c.patience = 9999; c.payout = { total: 90, price: 80, tip: 10, xp: 0, stars: 3 }; } });
await page.waitForTimeout(400);
await page.screenshot({ path: OUT + 'rest-golv-2.png' });
const crop = await page.evaluate(() => { const r = document.querySelector('#floor').getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; });
console.log('golvet', JSON.stringify(crop));
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
