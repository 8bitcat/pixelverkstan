// Hamburgerbarens golv genom epokerna: Kvartersbaren (lokal 3) med läskkyl, dessertdisk, jukebox,
// såsbar, lekhörna, köksprylar och matbord där kunderna sitter och äter. En skärmdump per epok:
// tools/out/rest-golv-<år>.png. node tools/restaurang-golv.mjs [url]
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const URL = process.argv.find((a) => a.startsWith('http')) || "http://localhost:8777/index.html";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}\n${e.stack}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FEL  ') + m); if (!c) errors.push(m); };
await page.goto(URL);
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300);
await page.click('[data-shop="restaurang"]'); await page.click('[data-year="1996"]');
await page.waitForFunction(() => window.PV?.game && PV.game.shop.id === 'restaurang', null, { timeout: 30000 }); await page.waitForTimeout(600);
const setup = await page.evaluate(() => {
  const g = PV.game;
  g.money = 90000; g.tutorialStep = 99; g.stats.served = 9;
  for (const id of ['lokal2', 'lokal3', 'milkshake', 'fritos', 'dubbelgrill', 'menytavla', 'lager2', 'kassa2', 'stereo', 'vaxter']) g.fit.items[id] = true;
  g.fit.slots = [];
  g.fit.slots[2] = { kind: 'unit', unit: 'lekhorna' };
  g.fit.slots[5] = { kind: 'unit', unit: 'jukebox' };
  g.fit.slots[7] = { kind: 'unit', unit: 'sasbar' };
  g.emit('change');
  PV.floor.build(); PV.floor.sig = null; PV.floor.refreshStock();
  const L = PV.floor.constructor.LY || null;
  return { lokal: g.shop.fit.lokalOf(g.fit), units: PV.floor.unitList.map((u) => u.unit || u.def?.unit || u.cat || (u.empty ? 'tom' : '?')), tables: PV.floor.furniture.length, grid: PV.floor.unitList.filter((u) => u.frame?.grid).length };
});
ok(setup.lokal === 3 && setup.grid === 0 && setup.units.includes('jukebox'), `Kvartersbaren utan montrar men med jukebox, såsbar och lekhörna: ${JSON.stringify(setup)}`);
for (const year of [1955, 1975, 1996, 2016, 2022]) {
  const st = await page.evaluate((y) => {
    const g = PV.game;
    g.startYear = y; g.xp = 0; g.customers = [];
    const sale = g.shop.onSale(y);
    for (const id of Object.keys(g.stock)) { delete g.stock[id]; delete g.shown[id]; }
    for (const p of sale.filter((p) => p.cat === 'dryck').slice(0, 14)) { g.stock[p.id] = 3; g.shown[p.id] = 3; }
    for (const p of sale.filter((p) => p.cat === 'dessert').slice(0, 10)) { g.stock[p.id] = 2; g.shown[p.id] = 2; }
    g.emit('change');
    PV.floor.build(); PV.floor.sig = null; PV.floor.refreshStock();
    // gäster som sitter och äter vid borden i olika stadier, en som väntar vid luckan och en i kön
    const seats = PV.floor.unitList ? [] : [];
    let n = 0;
    for (let i = 0; i < 6; i++) {
      const o = g.shop.generateOrder(g, ['Nils', 'Maja', 'Ali', 'Sara', 'Olle', 'Ida']); if (!o) continue;
      const c = g.spawn(o); c.patience = 9999; c.meal = g.shop.mealOf(c.order);
      if (i < 4) { const seat = PV.floor.pickSeat(c); if (seat < 0) continue; c.phase = 'eating'; c._spot = seat; c._eatMax = 80; c._eatT = 80 - i * 18; c.x = PV.floor.constructor.name ? c.x : c.x; c._path = null; n++; }
      else if (i === 4) { c.phase = 'ready'; c.x = 453; c.y = 176; c.payout = { total: 90, price: 80, tip: 10, xp: 0, stars: 3 }; }
      else { c.phase = 'queue'; c.x = 318; c.y = 176; }
    }
    return { year: g.year, era: g.shop.themeFor(y).era, eating: n, tables: PV.floor.furniture.filter((f) => f.sort > 200).length };
  }, year);
  // låt dem gå till borden och sätta sig
  await page.evaluate(() => { for (let k = 0; k < 300; k++) PV.floor.update(0.05); });
  await page.waitForTimeout(300);
  const seated = await page.evaluate(() => PV.game.customers.filter((c) => c.phase === 'eating' && c._sit).length);
  ok(st.eating >= 3 && seated >= 3, `${year} ${st.era}: ${st.eating} gäster satte sig och äter (${seated} sitter), ${st.tables} möbler`);
  await page.screenshot({ path: OUT + `rest-golv-${year}.png` });
}
// den som ätit klart går hem
const left = await page.evaluate(() => { const g = PV.game; for (const c of g.customers) if (c.phase === 'eating') c._eatT = 0.01; for (let k = 0; k < 40; k++) PV.floor.update(0.05); return g.customers.filter((c) => c.phase === 'leaving').length; });
ok(left >= 3, `${left} gäster reser sig och går när de ätit klart`);
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
