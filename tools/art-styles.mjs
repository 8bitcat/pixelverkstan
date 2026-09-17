// Stilgalleri: node tools/art-styles.mjs [kategorier=cpu,cooler,...] [K=40] [at=0|1]
// Skärmdump per kategori i tools/out/as-<kat>.png (ikon + närbild av varje stil).
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const cats = (process.argv[2] || 'cpu,cooler,ram,storage,media,gpu,sound,psu,fans,case').split(',');
const K = process.argv[3] || '40', at = process.argv[4] || '0', crops = process.argv[5] === 'crops';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message + '\n' + e.stack));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
for (const cat of cats) {
  await page.goto(`http://localhost:8777/tools/art-styles.html?cat=${cat}&k=${K}&at=${at}&v=${Date.now()}`);
  await page.waitForFunction(() => window.done === true, null, { timeout: 120000 });
  const t = await page.evaluate(() => window.times);
  const vals = Object.values(t);
  console.log(cat, 'närbilder:', vals.length, 'st, max', Math.round(Math.max(...vals)), 'ms, summa', Math.round(vals.reduce((a, b) => a + b, 0)), 'ms');
  await page.screenshot({ path: OUT + `as-${cat}${at === '1' ? '-at' : ''}.png`, fullPage: true });
  if (crops) { const cards = page.locator('.card .cu'); const n = await cards.count(); for (let i = 0; i < n; i++) await cards.nth(i).screenshot({ path: OUT + `as-${cat}-${i}.png` }); }
}
console.log(errors.join("\n") || "inga fel");
await browser.close();
