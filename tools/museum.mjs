// Butiken i hög upplösning + museivyn (klick på monter och stjärnobjekt).
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const dpr = +(process.argv[2] || 2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 860 }, deviceScaleFactor: dpr });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto("http://localhost:8777/index.html?year=2024");
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(400);
await page.click('[data-shop="dator"]'); await page.waitForFunction(() => window.PV?.game, null, { timeout: 30000 }); await page.waitForTimeout(300);
await page.evaluate(() => {
  const g = PV.game; g.tutorialStep = 9; g.xp = 500; g.spawnTimer = 9999;
  for (const id of ['astral-5080', 'rtx-5070ti-trio', 'rx-9060xt', 'r7-9800x3d', 'ultra9-285k', 'i3-12100', 'tridentz5-64-ddr5', 'vengeance-rgb-32-ddr5', 'fury-16-ddr5']) g.stock[id] = 2;
  PV.floor.sig = null;
});
await page.waitForTimeout(1200);
console.log('RES', await page.evaluate(() => PV.floor.RES));
await page.screenshot({ path: OUT + `mu0-shop-${dpr}x.png` });
const click = async (what) => {
  const pt = await page.evaluate((what) => {
    const f = PV.floor, r = f.canvas.getBoundingClientRect();
    const LYv = f.vits.find((v) => v.sc.cat === what);
    if (LYv) return { x: r.left + f.offX + (LYv.v.x0 + LYv.v.x1) / 2 * f.scale, y: r.top + f.offY + (LYv.v.base - 20) * f.scale };
    return null;
  }, what);
  await page.mouse.click(pt.x, pt.y); await page.waitForTimeout(900);
};
await click('gpu');
await page.screenshot({ path: OUT + `mu1-gpu-${dpr}x.png` });
await page.click('button:has-text("Stäng")'); await page.waitForTimeout(200);
// stjärnobjektet
const hp = await page.evaluate(() => { const f = PV.floor, r = f.canvas.getBoundingClientRect(); const e = { clientX: 0, clientY: 0 }; for (let y = 200; y < 384; y += 4) for (let x = 100; x < 400; x += 4) { e.clientX = r.left + f.offX + x * f.scale; e.clientY = r.top + f.offY + y * f.scale; const s = f.showcaseAt(e); if (s && s.hero) return { x: e.clientX, y: e.clientY }; } return null; });
await page.mouse.click(hp.x, hp.y); await page.waitForTimeout(900);
await page.screenshot({ path: OUT + `mu2-hero-${dpr}x.png` });
console.log(errors.join("\n") || "inga fel");
await browser.close();
