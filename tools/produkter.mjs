// Konsoler, spel och arkadmaskiner: TV-hörna + spelhylla + kabinett, köp in, ställ ut, sälj över disk.
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const URL = process.argv[2] || "http://localhost:8777/index.html";
const YEAR = +(process.argv[3] || 1991);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}\n${e.stack}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FEL  ') + m); if (!c) errors.push(m); };
await page.goto(URL);
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300);
await page.click('[data-shop="dator"]'); await page.click(`[data-year="${YEAR}"]`);
await page.waitForFunction(() => window.PV?.game, null, { timeout: 30000 }); await page.waitForTimeout(1200);
// pengar, renovering, TV-hörna, spelhylla, spelbord och en arkadmaskin
const r0 = await page.evaluate(() => {
  const g = PV.game; g.money = 400000;
  g.buyItem('lokal2'); g.buyItem('lokal3'); g.buyItem('lokal4'); g.buyItem('lokal5');
  const F = g.shop.fit, y = g.year;
  const opt = (i, re) => F.optionsFor(g.fit, i, ['wide', 'medium', 'medium', 'medium', 'wide', 'small', 'wide', 'small'][i], y).find((o) => re.test(o.id));
  const a = g.buySlot(3, opt(3, /unit:tv/).id);
  const b = g.buySlot(4, opt(4, /unit:spelhylla/).id);
  const c = g.buySlot(6, opt(6, /unit:spelbord/).id);
  const arc = opt(5, /arkad:/); const d = arc ? g.buySlot(5, arc.id) : false;
  const arc2 = F.optionsFor(g.fit, 7, 'small', y).filter((o) => /arkad:/.test(o.id)).sort((p, q) => q.hype - p.hype)[0]; const e = arc2 ? g.buySlot(7, arc2.id) : false;
  return { a, b, c, d, e, arc: arc?.title, arc2: arc2?.title, slots: g.fit.slots.map((s) => s && (s.unit || s.kind)) };
});
ok(r0.a && r0.b && r0.c && r0.d && r0.e, `enheter köpta (${JSON.stringify(r0)})`);
// konsoler och spel i grossisten
await page.click('[data-h="shop"]'); await page.waitForSelector('[data-tab="konsol"]');
await page.click('[data-tab="konsol"]'); await page.waitForTimeout(300);
const kons = await page.evaluate(() => [...document.querySelectorAll('[data-buy]')].map((b) => b.dataset.buy));
ok(kons.length > 0 && kons.every((id) => id.startsWith('k-')), `konsoler att köpa ${YEAR}: ${kons.join(', ')}`);
await page.screenshot({ path: OUT + "pr1-grossist-konsoler.png" });
await page.click('[data-tab="spel"]'); await page.waitForTimeout(300);
await page.screenshot({ path: OUT + "pr2-grossist-spel.png" });
await page.click('[data-close]');
// köp in allt som är på tapeten och ställ ut
const r1 = await page.evaluate(() => {
  const g = PV.game, y = g.year;
  const list = g.shop.onSale(y).filter((p) => (p.cat === 'konsol' || p.cat === 'spel') && g.canSell(p));
  for (const p of list) g.buy(p.id, 2);
  for (const d of g.deliveries) { d.state = 'arrived'; g.unpack(d.id, true); }
  return { n: list.length, shown: Object.keys(g.shown).filter((id) => id.startsWith('k-') || id.startsWith('s-')).length };
});
ok(r1.n > 0 && r1.shown === r1.n, `köpt in och ställt ut ${r1.n} produkter`);
await page.waitForTimeout(900);
await page.screenshot({ path: OUT + "pr3-tv-hylla-arkad.png" });
// zooma in på bottenraden
const clip = await page.evaluate(() => { const f = PV.floor, r = f.canvas.getBoundingClientRect(); return { x: r.left + f.offX, y: r.top + f.offY + 330 * f.scale, width: 512 * f.scale, height: 150 * f.scale }; });
await page.screenshot({ path: OUT + "pr4-bottenrad.png", clip });
// produktkund: framkalla en och sälj
const r2 = await page.evaluate(async () => {
  const g = PV.game;
  let o = null; for (let i = 0; i < 40 && !o; i++) { const t = g.shop.generateOrder(g, ['Test']); if (t?.product) o = t; }
  if (!o) return { none: true };
  const c = g.spawn(o); c.phase = 'queue';
  const before = g.money, stock = g.stockFree(o.product);
  const res = g.accept(c);
  return { title: o.title, msg: o.msg, res, phase: c.phase, payout: c.payout?.total, stockAfter: g.stockFree(o.product), stock };
});
ok(!r2.none && r2.res?.id === 'sale' && r2.phase === 'ready' && r2.payout > 0 && r2.stockAfter === r2.stock - 1, `såld över disk (${JSON.stringify(r2)})`);
// kunddialogen för en produktkund
await page.evaluate(() => { const g = PV.game; g.customers = g.customers.filter((c) => c.phase !== 'ready'); let o = null; for (let i = 0; i < 40 && !o; i++) { const t = g.shop.generateOrder(g, ['Samos']); if (t?.product) o = t; } const c = g.spawn(o); c.phase = 'queue'; c.x = 318; c.y = 176; c._fl = true; c._path = []; c._tkey = 'q0'; g.emit('change'); });
await page.waitForTimeout(600);
await page.screenshot({ path: OUT + "pr5-kund-bubbla.png" });
await page.evaluate(() => { const g = PV.game; const c = g.queue()[0]; PV.floor.onCustomerClick(c); });
await page.waitForSelector('.dlg', { timeout: 5000 }); await page.waitForTimeout(300);
const dlg = await page.evaluate(() => ({ title: document.querySelector('.dlg h2')?.textContent, btn: [...document.querySelectorAll('.dlg-foot .btn')].map((b) => b.textContent) }));
ok(dlg.btn.some((b) => /Sälj|saknas|Köp in/.test(b)), `kunddialog för produkt (${JSON.stringify(dlg)})`);
await page.screenshot({ path: OUT + "pr6-kunddialog.png" });
await page.click('[data-close]');
// Butiken: väljaren för en liten plats visar arkadmaskiner med förhandsvisning
await page.click('[data-h="fit"]'); await page.waitForSelector('[data-slot="7"]'); await page.click('[data-slot="7"]'); await page.waitForSelector('[data-opt^="arkad:"]');
await page.screenshot({ path: OUT + "pr7-arkadval.png" });
await page.click('[data-close]');
// omladdning
await page.reload(); await page.click('[data-shop="dator"]'); await page.click(`[data-year="${YEAR}"]`);
await page.waitForFunction(() => window.PV?.game, null, { timeout: 30000 }); await page.waitForTimeout(800);
const r3 = await page.evaluate(() => ({ slots: PV.game.fit.slots.map((s) => s && (s.product || s.unit || s.kind)), units: PV.floor.units.map((u) => u.unit || (u.frame ? 'booth' : u.closed ? 'closed' : 'empty')) }));
ok(r3.slots[5]?.startsWith('a-') && r3.units[3] === 'tv' && r3.units[4] === 'spelhylla', `sparat och laddat (${JSON.stringify(r3)})`);
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
