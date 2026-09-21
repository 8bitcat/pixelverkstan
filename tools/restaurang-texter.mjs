// Hamburgerbaren får inte prata om datorer. Går igenom det en spelare ser – årsvalet, HUD:en, Butiken med alla
// flikar, lagret, grossisten, beställningsdialogen, lägesvalet, köket med och utan hjälp, serveringen – och
// letar efter datorbutikens ord i den synliga texten. Kollar också två rörelsefel: avataren går till kassan
// (till höger) när man klickar på en kund, och maten ritas PÅ bordet. node tools/restaurang-texter.mjs [url]
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const URL = process.argv.find((a) => a.startsWith('http')) || "http://localhost:8777/index.html";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FEL  ') + m); if (!c) errors.push(m); };
const BAD = /dator|verkstad|chassi|moderkort|kabel|skruv|tekniker|nätagg|grafikkort|processor/i;
const found = [];
const scan = async (where) => {
  const hits = await page.evaluate((src) => {
    const re = new RegExp(src, 'i'), out = [];
    const walk = (el) => { for (const n of el.childNodes) { if (n.nodeType === 3) { const t = n.textContent.trim(); if (t && re.test(t) && n.parentElement?.offsetParent !== null) out.push(t.slice(0, 110)); } else if (n.nodeType === 1 && !['SCRIPT', 'STYLE'].includes(n.tagName)) walk(n); } };
    walk(document.body);
    for (const el of document.querySelectorAll('[title]')) if (re.test(el.title) && el.offsetParent !== null) out.push('title: ' + el.title.slice(0, 100));
    return out;
  }, BAD.source);
  for (const h of hits) found.push(`${where}: ${h}`);
  return hits.length;
};
const closeModal = async () => { await page.evaluate(() => { const b = document.querySelector('#modal .close, #modal [data-close]'); b?.click(); }); await page.keyboard.press('Escape'); await page.waitForTimeout(150); };

await page.goto(URL);
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300);
await page.click('[data-shop="restaurang"]'); await page.waitForTimeout(300);
// (butiksvalet bakom dialogen får nämna datorbutiken – bara själva årsvalet granskas)
{ const t = await page.evaluate(() => document.querySelector('#modal')?.innerText || ''); if (BAD.test(t)) found.push('årsvalet: ' + t.match(BAD)[0]); }
await page.click('[data-year="1996"]');
await page.waitForFunction(() => window.PV?.game && PV.game.shop.id === 'restaurang', null, { timeout: 30000 }); await page.waitForTimeout(600);
await page.evaluate(() => { const g = PV.game; g.money = 90000; g.tutorialStep = 99; g.stats.served = 9; g.spawnTimer = 9999; g.customers.length = 0; g.orders.length = 0; g.emit('change'); PV.floor.build(); });
await page.waitForTimeout(300);
await scan('butiken (HUD, beställningar)');
// Butiken med alla flikar
await page.click('[data-h="fit"]'); await page.waitForTimeout(300);
const tabs = await page.evaluate(() => [...document.querySelectorAll('#modal [data-tab]')].map((b) => b.dataset.tab));
for (const t of tabs) { await page.evaluate((t) => document.querySelector(`#modal [data-tab="${t}"]`)?.click(), t); await page.waitForTimeout(150); await scan('Butiken › ' + t); }
const tabNames = await page.evaluate(() => [...document.querySelectorAll('#modal [data-tab]')].map((b) => b.textContent.trim()));
ok(tabNames.some((n) => /Kök/.test(n)) && !tabNames.some((n) => /Verkstad/.test(n)), `fliken heter Kök, inte Verkstad: ${tabNames.join(' · ')}`);
await closeModal();
for (const h of ['stock', 'shop']) { const has = await page.evaluate((h) => !!document.querySelector(`[data-h="${h}"]`), h); if (!has) continue; await page.click(`[data-h="${h}"]`); await page.waitForTimeout(300); await scan(h === 'stock' ? 'lagret' : 'grossisten'); await closeModal(); }
// en gäst: beställningsdialogen, och var avataren ställer sig
const walk = await page.evaluate(async () => {
  const WK = await import('./js/core/floor-walk.js'), LY = await import('./js/core/floor-layout.js');
  const g = PV.game; const o = g.shop.generateOrder(g, ['Nils']); const c = g.spawn(o);
  for (const it of c.order.items) if (it.part) { g.stock[it.part] = (g.stock[it.part] || 0) + 3; g.shown[it.part] = g.stock[it.part]; }
  c.phase = 'queue'; c.x = LY.QUEUE[0][0]; c.y = LY.QUEUE[0][1]; c._path = []; c._tkey = 'q0'; c.moving = false; c.patience = 9999; c._fl = true;
  return { counter: WK.SPOTS.counter, queueX: LY.QUEUE[0][0], split: LY.COUNTER.split };
});
ok(walk.counter[0] > walk.split && Math.abs(walk.counter[0] - walk.queueX) < 20, `avataren tar emot beställningen vid kassan till höger (x ${walk.counter[0]}, kön står vid ${walk.queueX})`);
await page.evaluate(() => PV.floor.onCustomerClick(PV.game.customers[0])); await page.waitForTimeout(400);
await scan('beställningsdialogen');
await page.evaluate(() => { const b = [...document.querySelectorAll('#modal .btn')].find((x) => /Ta emot/.test(x.textContent)); b?.click(); }); await page.waitForTimeout(400);
await page.evaluate(() => PV.openBuild(PV.game.orders[0])); await page.waitForTimeout(600);
await scan('lägesvalet');
await page.evaluate(() => { const b = [...document.querySelectorAll('#modal .btn, #modal button')].find((x) => /Utan hjälp/.test(x.textContent)); b?.click(); }); await page.waitForTimeout(500);
await scan('köket utan hjälp');
await page.evaluate(() => { PV.build.b.help = true; PV.build.refresh(); }); await page.waitForTimeout(300);
await scan('köket med hjälp');
console.log(found.length ? 'datorord som syns i hamburgerbaren:\n  ' + found.join('\n  ') : 'inga datorord');
ok(found.length === 0, `inga datorord i det spelaren ser (${found.length} träffar)`);

// maten ritas på bordet i 2D: tallrikens pixlar ska synas ovanpå bordsskivan
const plate = await page.evaluate(async () => {
  const LY = await import('./js/core/floor-layout.js');
  document.querySelector('#build-back')?.click();
  await new Promise((r) => setTimeout(r, 300));
  const g = PV.game, c = g.customers[0];
  const seat = PV.floor.pickSeat(c); c._res = seat; c._spot = seat; c.phase = 'eating'; c._eatMax = 400; c._eatT = 380;
  c.meal = { layers: ['brod-klassiskt', 'biff-120', 'brod-klassiskt'].filter((id) => g.shop.part[id]), pommes: null, dryck: null, dessert: null, tray: true, year: 1996 };
  for (let k = 0; k < 500; k++) PV.floor.update(0.05);
  const sp = LY.SPOTS[seat], t = LY.TABLES[sp.table];
  // rita en bildruta med och utan måltiden och jämför pixlarna vid tallriken
  const cv = PV.floor.canvas || document.querySelector('#floor'), ctx = PV.floor.ctx;
  const grab = () => { PV.floor.draw?.(); const R = PV.floor.RES || 1; return ctx.getImageData(Math.round((sp.plate[0] - 14) * R), Math.round((sp.plate[1] - 22) * R), Math.round(28 * R), Math.round(24 * R)).data; };
  const withMeal = grab(); const m = c.meal; c.meal = null; c.phase = 'waiting'; const without = grab(); c.meal = m; c.phase = 'eating';
  let diff = 0; for (let i = 0; i < withMeal.length; i += 4) if (Math.abs(withMeal[i] - without[i]) + Math.abs(withMeal[i + 1] - without[i + 1]) + Math.abs(withMeal[i + 2] - without[i + 2]) > 40) diff++;
  return { sit: !!c._sit, table: sp.table, diff, px: withMeal.length / 4 };
});
ok(plate.sit && plate.diff > 40, `maten syns på bordet i 2D (${plate.diff} av ${plate.px} pixlar vid tallriken ändras när maten står där)`);
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
