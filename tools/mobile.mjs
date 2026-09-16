// Mobilvy: startar spelet, tar emot första kunden och öppnar bygget (390×844)
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium, devices } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices["iPhone 13"] });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:8777/index.html");
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(500);
await page.screenshot({ path: OUT + "m0-menu.png" });
await page.tap('[data-shop="dator"]');
await page.waitForTimeout(5500);
await page.screenshot({ path: OUT + "m1-shop.png" });
const pos = await page.evaluate(() => { const f = PV.floor, c = PV.game.customers[0], r = f.canvas.getBoundingClientRect(); return { x: r.left + f.offX + c.x * f.scale, y: r.top + f.offY + (c.y - 12) * f.scale }; });
await page.touchscreen.tap(pos.x, pos.y);
await page.waitForTimeout(400);
await page.screenshot({ path: OUT + "m2-order.png" });
await page.tap('button:has-text("Ta emot")');
await page.waitForTimeout(600);
// tryck-välj-läge: tryck på delen i lådan, sedan på platsen
for (let i = 0; i < 3; i++) {
  await page.tap(".tray-item >> nth=0", { force: true });
  await page.waitForTimeout(150);
  const t = await page.evaluate(() => { const b = PV.build, st = b.nextStep(), r = b.canvas.getBoundingClientRect(); const [u0,u1,v0,v1,z] = st.slot.hl; const [x,y] = b.R.proj((u0+u1)/2,(v0+v1)/2,z); return { x: r.left + b.ox + x*b.s, y: r.top + b.oy + y*b.s }; });
  await page.touchscreen.tap(t.x, t.y);
  await page.waitForTimeout(300);
}
await page.screenshot({ path: OUT + "m3-build.png" });
console.log(errors.join("\n") || "inga fel");
await browser.close();
