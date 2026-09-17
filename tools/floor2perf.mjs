// Mäter butiksgolvets update+draw-tid med full butik.
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 860 } });
const errors = []; page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:8778/index.html", { waitUntil: "domcontentloaded" });
await page.evaluate(() => localStorage.clear()); await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-shop="dator"]'); await page.click('[data-shop="dator"]');
await page.evaluate(() => { const g = PV.game; g.tutorialStep = g.shop.tutorialCount; g.xp = 500; g.spawnTimer = 9999; for (const p of g.shop.parts) g.stock[p.id] = 3; for (let i = 0; i < 7; i++) g.spawn(g.shop.generateOrder(g, ['A', 'B'])); });
await page.waitForTimeout(6000);
const r = await page.evaluate(() => {
  const f = PV.floor; const N = 300; let tu = 0, td = 0;
  for (let i = 0; i < N; i++) { let t0 = performance.now(); f.update(1 / 60); tu += performance.now() - t0; t0 = performance.now(); f.draw(); td += performance.now() - t0; }
  return { update: (tu / N).toFixed(3) + ' ms', draw: (td / N).toFixed(3) + ' ms', customers: PV.game.customers.length };
});
console.log(JSON.stringify(r), errors.join("\n") || "inga fel");
await browser.close();
