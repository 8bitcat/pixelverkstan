// Zoomtest: fullastad dator, skärmdumpar på olika zoomnivåer + ritningstid.
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const ids = '4000x-rgb,x870e-hero,r9-9950x3d,kraken-elite-360,tridentz5-64-ddr5,990pro-2tb,astral-5080,dark-power-13'.split(',');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 860 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:8777/index.html");
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(400);
await page.click('[data-shop="dator"]'); await page.waitForTimeout(300);
await page.evaluate((ids) => {
  const g = PV.game; g.tutorialStep = 9; g.spawnTimer = 9999;
  for (const id of ids) g.stock[id] = 1;
  const order = { template: 'drom', title: 'Drömdatorn', name: 'Carl', msg: '', guided: true, items: ids.map((id) => ({ cat: g.shop.part[id].cat, part: id })) };
  const c = g.spawn(order); c.phase = 'queue';
  PV.openBuild(g.accept(c));
  const v = PV.build, L = v.L, b = v.b;
  for (const id of ids) { const p = g.shop.part[id]; b.placed[L.slotsFor(p)[0].id] = p; }
  for (const a of L.ACTIONS) if (!L.missingReq(a.requires.filter((r) => !r.startsWith('act:')), b)) b.acts.set(a.id, new Set(a.points.map((_, i) => i)));
  for (const c2 of L.CABLES) if (L.cableReady(c2, b)) b.cables.set(c2.id, c2.wants.find((w) => !L.portBusy(w, b)));
  v.dirty = true; v.refresh(); v.say('Zoomtest', 'info');
}, ids);
await page.waitForTimeout(800);
const timeRender = () => page.evaluate(() => { const t0 = performance.now(); PV.build.render(); return Math.round(performance.now() - t0) + ' ms, buffer ' + PV.build.R.w + 'x' + PV.build.R.h + ' K=' + PV.build.R.k.toFixed(1); });
console.log('hela vyn:', await timeRender());
await page.screenshot({ path: OUT + "zm0-fit.png" });
for (const [name, u, v, z, zoom] of [['gpu', 6, 14.6, 3, 64], ['cpu-ram', 9.5, 5.5, 1.5, 64], ['nara-ram', 11.6, 5, 2, 150]]) {
  await page.evaluate(([u, v, z, zoom]) => {
    const view = PV.build, [x, y] = view.P.proj(u, v, z);
    view.zoomAt([x, y], zoom / view.cam.zoom);
    // centrera punkten
    const [x2, y2] = view.P.proj(u, v, z);
    view.cam.x += view.cw / 2 - x2; view.cam.y += view.ch / 2 - y2; view.applyCam(); view.renderDue = view.t;
  }, [u, v, z, zoom]);
  await page.waitForTimeout(500);
  console.log(name + ':', await timeRender());
  await page.screenshot({ path: OUT + `zm-${name}.png` });
}
console.log(errors.join("\n") || "inga fel");
await browser.close();
