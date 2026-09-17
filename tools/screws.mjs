// Proffsläge: klicka exakt på skruvpunkterna för GPU, PSU och M.2 och se om de skruvas.
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 860 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:8777/index.html?year=2024");
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(400);
await page.click('[data-shop="dator"]'); await page.waitForFunction(() => window.PV?.game, null, { timeout: 30000 }); await page.waitForTimeout(300);
await page.evaluate(() => {
  const g = PV.game; g.tutorialStep = 9; g.spawnTimer = 9999;
  const order = g.shop.tutorialOrder(2, g); order.guided = false; delete order.tutorial;
  for (const it of order.items) g.stock[it.part] = (g.stock[it.part] || 0) + 1;
  const c = g.spawn(order); c.phase = 'queue';
  PV.openBuild(g.accept(c));
});
await page.click('button:has-text("Utan hjälp")'); await page.waitForTimeout(300);
await page.evaluate(() => {
  const v = PV.build, L = v.L, b = v.b;
  for (const e of v.partEntries()) { const sl = L.slotsFor(e.part).find((x) => !b.placed[x.id]); if (sl) b.placed[sl.id] = e.part; }
  b.acts.set('lever', new Set([0])); b.acts.set('paste', new Set([0]));
  v.dirty = true; v.refresh();
});
await page.waitForTimeout(600);
await page.screenshot({ path: OUT + "sw0.png" });
for (const id of ['gpu_screw', 'psu_screws', 'm2_screw'].filter((id) => true)) {
  if (!(await page.evaluate((id) => !!PV.build.L.ACTION[id], id))) { console.log(id, 'finns inte i den här datorn'); continue; }
  const pts = await page.evaluate((id) => { const v = PV.build, a = v.L.ACTION[id], r = v.canvas.getBoundingClientRect(); return a.points.map((p) => { const [x, y] = v.P.proj(...p); return { x: r.left + v.ox + x * v.s, y: r.top + v.oy + y * v.s }; }); }, id);
  for (const p of pts) { await page.mouse.click(p.x, p.y); await page.waitForTimeout(150); }
  const res = await page.evaluate((id) => ({ done: PV.build.L.actDone(PV.build.b, id), count: PV.build.L.actCount(PV.build.b, id), msg: PV.build.msg?.html.replace(/<[^>]+>/g, '').slice(0, 90) }), id);
  console.log(id, JSON.stringify(pts.map((p) => [Math.round(p.x), Math.round(p.y)])), JSON.stringify(res));
}
await page.screenshot({ path: OUT + "sw1.png" });
console.log(errors.join("\n") || "inga fel");
await browser.close();
