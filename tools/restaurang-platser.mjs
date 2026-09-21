// Sittplatserna är restaurangens kapacitet: en gäst får sin stol när beställningen tas emot och behåller
// den tills hen ätit klart. Fulla bord → ingen ny beställning kan tas emot → kön växer → full kö →
// inga nya kunder. Större lokal = fler bord. Testar också att varje stol i varje lokal går att nå.
// node tools/restaurang-platser.mjs [url]
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const URL = process.argv.find((a) => a.startsWith('http')) || "http://localhost:8777/index.html";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}\n${e.stack}`));
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FEL  ') + m); if (!c) errors.push(m); };

await page.goto(URL);
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300);
await page.click('[data-shop="restaurang"]'); await page.click('[data-year="1996"]');
await page.waitForFunction(() => window.PV?.game && PV.game.shop.id === 'restaurang', null, { timeout: 30000 }); await page.waitForTimeout(600);
await page.evaluate(() => {
  const g = PV.game; g.money = 90000; g.tutorialStep = 99; g.stats.served = 9; g.spawnTimer = 9999;
  g.customers.length = 0; g.orders.length = 0; g.emit('change'); PV.floor.build();
  // en gäst i kön med en beställning där allt finns hemma
  window.__guest = (name) => {
    const o = g.shop.generateOrder(g, [name]); const c = g.spawn(o);
    for (const it of c.order.items) if (it.part) { g.stock[it.part] = (g.stock[it.part] || 0) + 3; g.shown[it.part] = g.stock[it.part]; }
    c.phase = 'queue'; c.x = 453; c.y = 176; c._path = []; c._tkey = 'q0'; c.moving = false; c.patience = 9999; c._fl = true;
    return c;
  };
  window.__run = (s) => { for (let k = 0; k < s * 20; k++) PV.floor.update(0.05); };
});

const start = await page.evaluate(() => ({ seats: PV.game.seatInfo(), lokal: PV.floor.lokal, hud: document.querySelector('#hud')?.textContent.replace(/\s+/g, ' ') }));
ok(start.seats.total === 4 && start.seats.used === 0 && /🪑 0\/4/.test(start.hud), `minsta lokalen har fyra sittplatser och HUD:en visar dem: ${JSON.stringify(start.seats)}`);

// fyra gäster beställer och sätter sig – sedan är det fullt
const full = await page.evaluate(() => {
  const g = PV.game, got = [];
  for (const n of ['Anna', 'Bo', 'Cia', 'Dan']) { const c = __guest(n); got.push(!!g.accept(c)); }
  __run(25);
  const seats = g.seatInfo(), sitting = g.customers.filter((c) => c._sit && c._res >= 0).length, distinct = new Set(g.customers.map((c) => c._res)).size;
  const c5 = __guest('Eva');
  const denied = g.accept(c5);
  return { got, seats, sitting, distinct, denied, seatsFull: g.seatsFull, orders: g.orders.length, phase5: c5.phase };
});
ok(full.got.every(Boolean) && full.seats.used === 4 && full.seats.free === 0 && full.sitting === 4 && full.distinct === 4, `fyra gäster har fått varsin stol: ${JSON.stringify(full)}`);
ok(full.denied === false && full.seatsFull && full.orders === 4 && full.phase5 === 'queue', 'den femte gästen kan inte tas emot – hen står kvar i kön');

// dialogen säger varför, knappen är spärrad, HUD:en visar fullt
await page.evaluate(() => { const c = PV.game.customers.find((x) => x.name === 'Eva'); PV.floor.onCustomerClick(c); });
await page.waitForTimeout(400);
const dlg = await page.evaluate(() => { const b = [...document.querySelectorAll('#modal .btn')].find((x) => /bord|Ta emot/.test(x.textContent)); return { btn: b?.textContent.trim(), disabled: !!b?.disabled, tip: document.querySelector('#modal')?.textContent.includes('platser är upptagna'), hud: document.querySelector('#hud')?.textContent.replace(/\s+/g, ' ') }; });
ok(/Inget ledigt bord/.test(dlg.btn || '') && dlg.disabled && dlg.tip && /🪑 4\/4/.test(dlg.hud), `beställningsdialogen förklarar och är spärrad: ${JSON.stringify({ btn: dlg.btn, disabled: dlg.disabled, tip: dlg.tip })}`);
await page.evaluate(() => document.querySelector('#modal .close, #modal [data-close]')?.click());
await page.keyboard.press('Escape'); await page.waitForTimeout(200);

// full kö → inga nya kunder
const queue = await page.evaluate(() => {
  const g = PV.game;
  while (g.queue().length < g.maxQueue) __guest('Kö' + g.queue().length);
  const before = g.customers.length;
  g.spawnTimer = 0; g.update(0.1, { shopVisible: true }); g.spawnTimer = 0; g.update(0.1, { shopVisible: true });
  return { queue: g.queue().length, max: g.maxQueue, before, after: g.customers.length };
});
ok(queue.queue === queue.max && queue.after === queue.before, `kön är full (${queue.queue}/${queue.max}) – inga nya kunder kommer: ${JSON.stringify(queue)}`);

// stolen hålls medan gästen hämtar maten vid luckan, och hen äter på samma stol
const keep = await page.evaluate(() => {
  const g = PV.game, c = g.customers.find((x) => x.name === 'Anna'), o = g.orders.find((x) => x.customerId === c.id), seat = c._res;
  g.complete(o, { stars: 3, time: 10, errors: 0, help: true, warnings: [] });
  const duringPickup = g.seatInfo().used, phase1 = c.phase;
  for (let k = 0; k < 800 && c.phase !== 'eating'; k++) PV.floor.update(0.05);   // går till luckan, betalar
  for (let k = 0; k < 200 && !c._sit; k++) PV.floor.update(0.05);                 // och tillbaka till sin stol
  return { seat, duringPickup, phase1, phase2: c.phase, spot: c._spot, sit: !!c._sit, used: g.seatInfo().used };
});
ok(keep.phase1 === 'ready' && keep.duringPickup === 4 && keep.phase2 === 'eating' && keep.spot === keep.seat && keep.sit, `stolen är reserverad medan gästen hämtar vid luckan, och hen äter på samma stol: ${JSON.stringify(keep)}`);

// när hen ätit klart blir stolen ledig och nästa i kön kan tas emot
const freed = await page.evaluate(() => {
  const g = PV.game, c = g.customers.find((x) => x.name === 'Anna');
  c._eatT = 0.1; __run(3);
  const seats = g.seatInfo(), eva = g.customers.find((x) => x.name === 'Eva');
  const okd = !!g.accept(eva); __run(25);
  return { leaving: c.phase, seats, accepted: okd, evaSits: !!eva._sit, used: g.seatInfo().used };
});
ok(freed.leaving === 'leaving' && freed.seats.free === 1 && freed.accepted && freed.evaSits && freed.used === 4, `en ledig stol släpper fram nästa gäst: ${JSON.stringify(freed)}`);

// större lokal = fler platser, och varje stol går att nå från dörren
const lokaler = await page.evaluate(async () => {
  const LY = await import('./js/core/floor-layout.js');
  const g = PV.game, out = [];
  for (let lokal = 1; lokal <= 6; lokal++) {
    for (let k = 2; k <= lokal; k++) g.fit.items['lokal' + k] = true;
    g.customers.length = 0; g.orders.length = 0; g.emit('change'); PV.floor.build();
    const seats = PV.floor.seatSpots();
    const cs = seats.map((i, n) => { const c = __guest('G' + n); c.phase = 'waiting'; c._res = i; c._spot = i; c.x = LY.DOOR.cx; c.y = LY.DOOR.inY + 4; c._path = null; c._tkey = ''; return c; });
    __run(60);
    out.push({ lokal, name: LY.PLAN.name, seats: seats.length, sitting: cs.filter((c) => c._sit).length, stuck: cs.filter((c) => !c._sit).map((c) => c._res) });
  }
  return out;
});
console.log(lokaler.map((l) => `lokal ${l.lokal} ${l.name}: ${l.sitting}/${l.seats} sitter`).join(' · '));
ok(lokaler.every((l, i) => !i || l.seats > lokaler[i - 1].seats), `fler sittplatser för varje utbyggnad: ${lokaler.map((l) => l.seats).join(' → ')}`);
ok(lokaler.every((l) => l.sitting === l.seats), `varje stol i varje lokal går att nå: ${JSON.stringify(lokaler.filter((l) => l.sitting !== l.seats))}`);

console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
