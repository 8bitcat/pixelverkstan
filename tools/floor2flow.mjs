// Flödestest för butiksgolvet: klick på första kunden (testformeln) + snabbkörning
// där många kunder går igenom alla faser. Kollar fel och att ingen fastnar.
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error" && !/fonts\.g/.test(m.text())) errors.push("console: " + m.text()); });
await page.goto("http://127.0.0.1:8778/index.html", { waitUntil: "domcontentloaded" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-shop="dator"]');
await page.click('[data-shop="dator"]');
// vänta på guidad kund i kön
let ok = false;
for (let i = 0; i < 40 && !ok; i++) { await page.waitForTimeout(500); ok = await page.evaluate(() => { const c = PV.game.queue()[0]; return !!c && c.phase === 'queue' && !c.moving; }); }
console.log("kund i kön:", ok, await page.evaluate(() => { const c = PV.game.queue()[0]; return c && `${c.name} ${Math.round(c.x)},${Math.round(c.y)}`; }));
const pos = await page.evaluate(() => { const f = PV.floor, c = PV.game.queue()[0], r = f.canvas.getBoundingClientRect(); return { x: r.left + f.offX + c.x * f.scale, y: r.top + f.offY + (c.y - 12) * f.scale }; });
await page.mouse.click(pos.x, pos.y);
await page.waitForTimeout(500);
const modal = await page.evaluate(() => !document.getElementById('modal').classList.contains('hidden'));
console.log("dialog öppnad efter klick:", modal);
await page.screenshot({ path: OUT + "fl2-f1-dialog.png" });
await page.evaluate(() => { document.querySelector('#modal').classList.add('hidden'); document.querySelector('#modal').innerHTML = ''; });

// snabbkörning
await page.evaluate(() => {
  const g = PV.game; g.tutorialStep = g.shop.tutorialCount; g.xp = 500;
  for (const p of g.shop.parts) g.stock[p.id] = 5;
  g.customers.length = 0; g.orders.length = 0;
  window.__soak = { spawned: 0, paid: 0, maxT: 0 };
  const names = ['Alva', 'Hugo', 'Saga', 'Kenji', 'Leila', 'Sven', 'Mira'];
  const origPay = g.pay.bind(g); g.pay = (p, c) => { window.__soak.paid++; return origPay(p, c); };
  setInterval(() => {
    const s = window.__soak;
    if (g.queue().length < 3 && g.customers.length < 8) { g.spawn(g.shop.generateOrder(g, names)); s.spawned++; }
    const front = g.queue()[0];
    if (front && front.phase === 'queue' && !front.moving) { if (Math.random() < 0.8) { if (!g.accept(front)) g.decline(front); } else g.decline(front); }
    for (const c of g.customers) {
      c._age = (c._age || 0) + 0.7;
      if (c.phase === 'waiting' && !c.moving && c._age > 12 + (c.id % 5) * 3) {
        const o = g.orders.find((x) => x.customerId === c.id);
        if (o) g.complete(o, { stars: 1 + (c.id % 3) });
      }
      s.maxT = Math.max(s.maxT, c._age);
    }
  }, 700);
});
for (let i = 0; i < 6; i++) {
  await page.waitForTimeout(10000);
  const st = await page.evaluate(() => ({ ...window.__soak, now: PV.game.customers.map((c) => `${c.phase[0]}${c.moving ? '*' : ''}@${Math.round(c.x)},${Math.round(c.y)}`).join(' ') }));
  console.log(`t=${(i + 1) * 10}s`, JSON.stringify(st));
  if (i === 2) await page.screenshot({ path: OUT + "fl2-f2-soak.png" });
}
// fastnade någon? (ålder > 70 s)
console.log("äldsta kunder:", await page.evaluate(() => PV.game.customers.filter((c) => c._age > 70).map((c) => `${c.name}:${c.phase}:${Math.round(c.x)},${Math.round(c.y)}:${c.moving}:${c._tkey}`)));
console.log(errors.join("\n") || "inga fel");
await browser.close();
