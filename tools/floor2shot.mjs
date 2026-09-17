// Skärmdumpar av det nya butiksgolvet (port 8778): tom butik, kö, väntande, fyllda montrar, mobil.
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium, devices } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const only = process.argv[2] || "all";
const browser = await chromium.launch();

async function open(ctxOpts) {
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.text())) errors.push("console: " + m.text()); });
  await page.goto("http://127.0.0.1:8778/index.html", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-shop="dator"]');
  await page.click('[data-shop="dator"]');
  await page.waitForTimeout(300);
  await page.evaluate(() => { const g = PV.game; g.tutorialStep = g.shop.tutorialCount; g.xp = 500; g.spawnTimer = 9999; });
  return { page, errors, ctx };
}
const spawn = (page, n) => page.evaluate((n) => {
  const g = PV.game, names = ['Alva', 'Hugo', 'Saga', 'Kenji', 'Leila', 'Sven', 'Mira'];
  for (let i = 0; i < n; i++) g.spawn(g.shop.generateOrder(g, names));
}, n);
const stockUp = (page, cats) => page.evaluate((cats) => {
  const g = PV.game;
  for (const p of g.shop.parts) if (!cats || cats.includes(p.cat)) g.stock[p.id] = 1 + (p.id.length % 3);
}, cats);
const shot = async (page, name) => { await page.screenshot({ path: OUT + name }); console.log("sparad", name); };

for (const [label, opts] of [["d", { viewport: { width: 1400, height: 860 } }], ["m", { ...devices["iPhone 13"] }]]) {
  if (only !== "all" && only !== label) continue;
  const { page, errors, ctx } = await open(opts);
  await page.waitForTimeout(600);
  await shot(page, `fl2-${label}1-empty.png`);
  await spawn(page, 3);
  await page.waitForTimeout(9000);
  await shot(page, `fl2-${label}2-queue.png`);
  console.log(await page.evaluate(() => PV.game.customers.map((c) => `${c.name}:${c.phase}:${Math.round(c.x)},${Math.round(c.y)}`).join(" | ")));
  // klick på främsta kunden (testernas formel)
  const pos = await page.evaluate(() => { const f = PV.floor, c = PV.game.queue()[0], r = f.canvas.getBoundingClientRect(); return { x: r.left + f.offX + c.x * f.scale, y: r.top + f.offY + (c.y - 12) * f.scale, hit: !!f.hit({ clientX: r.left + f.offX + c.x * f.scale, clientY: r.top + f.offY + (c.y - 12) * f.scale }) }; });
  console.log("klickpunkt", JSON.stringify(pos));
  // alla tre accepteras → väntar
  await stockUp(page);
  await page.evaluate(() => { const g = PV.game; for (const c of [...g.queue()]) { c.phase = 'queue'; const o = g.accept(c); if (!o) { c.phase = 'waiting'; c.patience = c.patienceMax = 300; } } });
  await spawn(page, 2);
  await page.waitForTimeout(9000);
  await shot(page, `fl2-${label}3-waiting.png`);
  // en kund blir klar och hämtar
  await page.evaluate(() => { const g = PV.game, c = g.customers.find((x) => x.phase === 'waiting'); if (c) { g.orders = g.orders.filter((o) => o.customerId !== c.id); c.phase = 'ready'; c.payout = { price: 9000, tip: 500, total: 9500, xp: 5, stars: 3 }; c.patience = Infinity; } });
  await page.waitForTimeout(3500);
  await shot(page, `fl2-${label}4-pickup.png`);
  await page.waitForTimeout(1200);
  await shot(page, `fl2-${label}5-paid.png`);
  if (label === "d") {
    await page.evaluate(() => { const r = PV.floor.canvas.getBoundingClientRect(); });
    const clip = await page.evaluate(() => { const f = PV.floor; return { x: f.offX, y: f.offY, width: Math.round(512 * f.scale), height: Math.round(384 * f.scale) }; });
    await page.screenshot({ path: OUT + "fl2-d6-scene.png", clip });
    console.log("sparad fl2-d6-scene.png", JSON.stringify(clip), await page.evaluate(() => PV.floor.scale));
  }
  console.log(label, errors.join("\n") || "inga fel");
  await ctx.close();
}
await browser.close();
