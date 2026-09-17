// Skrivbordsgalleri: node tools/desk-gallery.mjs [sektioner=screens,templates,...] [extra query]
// Skärmdump per sektion i tools/out/dg-<sektion>.png + fel från konsolen.
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const secs = process.argv[2] || 'screens,templates,tints,monitors,props,rear,icons,internals,scene';
const extra = process.argv[3] || '';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1800, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message + '\n' + e.stack));
page.on("console", (m) => { if (m.text().startsWith("PERF")) console.log(m.text()); else if (m.type() === "error" || m.type() === "warning") errors.push(m.type() + ': ' + m.text()); });
await page.goto(`http://localhost:8777/tools/desk-gallery.html?sec=${secs}&v=${Date.now()}${extra ? '&' + extra : ''}`);
await page.waitForFunction(() => window.done === true, null, { timeout: 120000 });
const ids = await page.evaluate(() => [...document.querySelectorAll('.sec')].map((s) => s.id));
for (const id of ids) {
  const el = page.locator('#' + id);
  await el.screenshot({ path: OUT + 'dg-' + id.replace('sec-', '') + '.png' });
  console.log('skärmdump', 'dg-' + id.replace('sec-', '') + '.png');
}
console.log(errors.join("\n") || "inga fel");
await browser.close();
