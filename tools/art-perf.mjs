// Prestandajämförelse för delarnas grafik: HEAD mot arbetskopian (samma chassi/kort från HEAD).
// Förbered: git archive HEAD js | tar -x -C tools/out/head   Kör: node tools/art-perf.mjs [show=gpu|cpu|fit|ram]
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const show = process.argv[2] || '';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 760 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message + '\n' + e.stack));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
for (const [label, parts] of [['HEAD', '/tools/out/head/js'], ['nu', '/js'], ['HEAD', '/tools/out/head/js'], ['nu', '/js']]) {
  await page.goto(`http://localhost:8777/tools/art-perf.html?parts=${parts}&show=${show}&v=${Date.now()}`);
  await page.waitForFunction(() => window.done === true, null, { timeout: 120000 });
  console.log(label.padEnd(5), JSON.stringify(await page.evaluate(() => window.result)));
  if (show) await page.screenshot({ path: OUT + `perf-${show}-${label}.png` });
}
console.log(errors.join("\n") || "inga fel");
await browser.close();
