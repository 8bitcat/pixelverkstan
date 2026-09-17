// Skärmdump av en fullastad RGB-dator: byggvy + igång på skrivbordet.
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const ids = (process.argv[2] || '4000x-rgb,x870e-hero,r9-9950x3d,hyper-212-rgb,tridentz5-64-ddr5,990pro-2tb,astral-5080,dark-power-13,sp120-rgb-3').split(',');
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
  v.dirty = true; v.refresh();
}, ids);
await page.waitForTimeout(900);
await page.screenshot({ path: OUT + "sc1-build.png" });
await page.evaluate(() => { const v = PV.build; v.topAction(); const d = v.finale.d; d.plugs = { pc_power: 'PSU_IN', hdmi: v.b.placed.gpu ? 'HDMI_GPU' : 'HDMI_MB', mon_power: 'STRIP', kb: 'USB_1', mouse: 'USB_2' }; d.psuOn = true; v.finale.pressPower(); });
await page.waitForTimeout(7500);
await page.screenshot({ path: OUT + "sc2-desk.png" });
await page.screenshot({ path: OUT + "sc3-case.png", clip: { x: 980, y: 180, width: 380, height: 380 } });
console.log(errors.join("\n") || "inga fel");
await browser.close();
