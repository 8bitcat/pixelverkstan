// Mobilvy (iPhone 13): byggvy med tryck-välj, sedan skrivbordet.
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
await page.tap('[data-shop="dator"]'); await page.waitForTimeout(400);
await page.evaluate(() => {
  const g = PV.game; g.tutorialStep = 9; g.spawnTimer = 9999;
  const c = g.spawn(g.shop.tutorialOrder(0)); c.phase = 'queue';
  PV.openBuild(g.accept(c));
});
await page.waitForTimeout(500);
// tryck-välj: del i lådan → plats
for (let i = 0; i < 4; i++) {
  const st = await page.evaluate(() => { const v = PV.build, s = v.nextStep(), r = v.canvas.getBoundingClientRect(); if (s.kind !== 'slot') return { kind: s.kind }; const [u0, u1, v0, v1, z] = v.L.SLOT[s.id].hl; const [x, y] = v.R.proj((u0 + u1) / 2, (v0 + v1) / 2, z); return { kind: 'slot', idx: v.trayEntries().findIndex((e) => e.key === s.entryKey), x: r.left + v.ox + x * v.s, y: r.top + v.oy + y * v.s }; });
  if (st.kind !== 'slot') { await page.evaluate(() => { const v = PV.build, s = v.nextStep(); if (s.kind === 'act') { const a = v.L.ACTION[s.id]; a.points.forEach((_, i) => v.doAction(a, i)); } }); continue; }
  await page.tap(`.tray-item >> nth=${st.idx}`, { force: true }); await page.waitForTimeout(120);
  await page.touchscreen.tap(st.x, st.y); await page.waitForTimeout(200);
}
await page.screenshot({ path: OUT + "m3-build.png" });
// gör klart via API och gå till skrivbordet
await page.evaluate(() => {
  const v = PV.build, L = v.L, b = v.b;
  for (const e of v.partEntries()) b.placed[L.slotsFor(e.part)[0].id] = e.part;
  for (const a of L.ACTIONS) if (!L.missingReq(a.requires.filter((r) => !r.startsWith('act:')), b)) b.acts.set(a.id, new Set(a.points.map((_, i) => i)));
  for (const c of L.CABLES) if (L.cableReady(c, b)) b.cables.set(c.id, c.wants[0]);
  v.dirty = true; v.topAction();
});
await page.waitForTimeout(600);
await page.screenshot({ path: OUT + "m4-desk.png" });
console.log(errors.join("\n") || "inga fel");
await browser.close();
