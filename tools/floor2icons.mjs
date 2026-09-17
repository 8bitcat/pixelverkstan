// Förhandsvisning av delikoner i små storlekar (för montrarna i butiken).
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
const errors = []; page.on("pageerror", (e) => errors.push(e.message));
console.log("goto"); await page.goto("http://127.0.0.1:8778/index.html", { waitUntil: "domcontentloaded", timeout: 20000 }); console.log("loaded");
await page.waitForTimeout(500);
await page.evaluate(async () => {
  const { PARTS } = await import('/js/shops/dator/catalog.js');
  const { iconCanvas } = await import('/js/shops/dator/art.js');
  document.body.innerHTML = ''; document.body.style.cssText = 'display:flex;flex-wrap:wrap;align-items:flex-start;overflow:visible;height:auto;margin:0';
  document.body.style.background = '#3a2030';
  const sizes = { gpu: [[44, 30], [72, 48]], cpu: [[24, 20], [30, 24]], ram: [[24, 22], [34, 26]], case: [[20, 24]], mb: [[24, 20]], psu: [[20, 16]], cooler: [[20, 20]], storage: [[20, 14]] };
  for (const p of PARTS) {
    for (const [w, h] of sizes[p.cat] || []) {
      const c = iconCanvas(p, w, h);
      c.style.cssText = `width:${w * 4}px;height:${h * 4}px;image-rendering:pixelated;display:inline-block;margin:3px;background:#5a2a40`;
      c.title = p.id; document.body.append(c);
    }
  }
});
console.log("drawn"); await page.waitForTimeout(300);
await page.screenshot({ path: "D:/GamesProjects/pixelverkstan/tools/out/fl2-icons.png", fullPage: true });
console.log(errors.join("\n") || "inga fel");
await browser.close();
