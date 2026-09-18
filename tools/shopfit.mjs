// Butiken: sliten lokal → köp bås → hänglås i grossisten → renovera. Skärmdumpar i tools/out/fit-*.png
import { createRequire } from "module";
const require = createRequire("D:/Qisy/QISYFrontend/QISYFrontend-1/package.json");
const { chromium } = require("playwright");
const OUT = "D:/GamesProjects/pixelverkstan/tools/out/";
const URL = process.argv[2] || "http://localhost:8777/index.html";
const YEAR = +(process.argv[3] || 1999);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}\n${e.stack}`));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
const ok = (c, m) => { console.log((c ? 'OK   ' : 'FEL  ') + m); if (!c) errors.push(m); };
await page.goto(URL);
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300);
await page.click('[data-shop="dator"]'); await page.click(`[data-year="${YEAR}"]`);
await page.waitForFunction(() => window.PV?.game, null, { timeout: 30000 }); await page.waitForTimeout(1500);
// rikedom för testet
await page.evaluate(() => { PV.game.money = 200000; PV.game.emit('change'); });
const f0 = await page.evaluate(() => ({ lokal: PV.floor.lokal, open: PV.floor.openSlots, units: PV.floor.units.map((u) => u.closed ? 'closed' : u.empty ? 'empty' : u.frame ? 'booth' : 'unit'), fh: PV.floor.buf.height / PV.floor.RES }));
ok(f0.lokal === 1 && f0.open === 5 && f0.units.filter((u) => u === 'booth').length === 3 && f0.units.filter((u) => u === 'empty').length === 2, `sliten lokal med 3 hyllor och 2 lediga platser (${JSON.stringify(f0)})`);
ok(f0.fh === 480, `golvet är 480 px högt (${f0.fh})`);
await page.screenshot({ path: OUT + "fit0-sliten.png" });
// grossisten: hänglås på tier 3+
await page.click('[data-h="shop"]'); await page.waitForSelector('.shoprow');
await page.evaluate(() => { document.querySelector('[data-tab="gpu"]').click(); });
await page.waitForTimeout(300);
const locks = await page.evaluate(() => ({ locked: document.querySelectorAll('[data-lock]').length, buy: document.querySelectorAll('[data-buy]').length, need: document.querySelector('.lock-need')?.textContent }));
ok(locks.locked > 0 && locks.buy > 0, `grossisten visar hänglås (${JSON.stringify(locks)})`);
await page.screenshot({ path: OUT + "fit1-grossist-las.png" });
await page.click('[data-close]');
// Butiken-dialogen
await page.click('[data-h="fit"]'); await page.waitForSelector('.slot-card');
await page.screenshot({ path: OUT + "fit2-butiken.png" });
await page.click('[data-slot="0"]'); await page.waitForSelector('[data-opt]');
await page.screenshot({ path: OUT + "fit3-valjare.png" });
// köp ett Nvidia-bås nivå 2 på plats 1 (1999) – eller det första märkesbåset som finns
const optId = await page.evaluate(() => { const b = [...document.querySelectorAll('[data-opt]')].find((x) => /brand:gpu:(nvidia|ati|3dfx):2/.test(x.dataset.opt)) || document.querySelector('[data-opt^="brand:"]'); return b?.dataset.opt; });
ok(!!optId, `märkesbås att köpa: ${optId}`);
await page.click(`[data-opt="${optId}"]`); await page.waitForTimeout(250);
// plats 1 har en kategorihylla från start – spelet frågar innan den rivs
await page.click('button:has-text("Ja, byt ut")'); await page.waitForTimeout(400);
const f1 = await page.evaluate(() => ({ slot0: PV.game.fit.slots[0], drag: PV.game.fitStats.drag, money: PV.game.money }));
ok(f1.slot0?.kind === 'brand' && f1.slot0.level === 2 && f1.drag === 2, `bås köpt (${JSON.stringify(f1)})`);
// byta på en upptagen plats: spelet ska fråga först
await page.click('[data-opt="cat:gpu"]'); await page.waitForTimeout(250);
const q = await page.evaluate(() => ({ title: document.querySelector('.dlg h2')?.textContent, btns: [...document.querySelectorAll('.dlg-foot .btn')].map((b) => b.textContent), slot0: PV.game.fit.slots[0]?.kind }));
ok(/Byta ut/.test(q.title) && q.slot0 === 'brand' && q.btns.length === 2, `frågar innan byte på upptagen plats (${JSON.stringify(q)})`);
await page.screenshot({ path: OUT + "fit3b-byta-fraga.png" });
await page.click('button:has-text("Nej, välj")'); await page.waitForTimeout(250);
ok(await page.evaluate(() => !!document.querySelector('[data-slot="0"]') && PV.game.fit.slots[0]?.kind === 'brand'), 'Nej → alla platser visas, båset står kvar');
await page.click('[data-slot="0"]'); await page.waitForSelector('[data-opt="cat:gpu"]');
await page.click('[data-opt="cat:gpu"]'); await page.waitForTimeout(250);
await page.click('button:has-text("Ja, byt ut")'); await page.waitForTimeout(300);
ok(await page.evaluate(() => PV.game.fit.slots[0]?.kind === 'cat'), 'Ja → hyllan är bytt');
// och tillbaka till märkesbåset (frågan igen, eftersom hyllan står där)
await page.click(`[data-opt="${optId}"]`); await page.waitForTimeout(250);
await page.click('button:has-text("Ja, byt ut")'); await page.waitForTimeout(300);
ok(await page.evaluate(() => PV.game.fit.slots[0]?.kind === 'brand' && PV.game.fit.slots[0].level === 2), 'märkesbåset tillbaka på plats 1');
await page.click('button:has-text("Alla platser")'); await page.waitForTimeout(200);
await page.screenshot({ path: OUT + "fit4-platser.png" });
// lokal: renovera
await page.click('[data-tab="lager"]'); await page.waitForSelector('[data-item="lokal2"]');
await page.click('[data-item="lokal2"]'); await page.waitForTimeout(250);
await page.click('[data-item="lokal3"]'); await page.waitForTimeout(250);
await page.click('[data-item="lokal4"]'); await page.waitForTimeout(250);
await page.click('[data-item="lager2"]'); await page.waitForTimeout(300);
await page.click('[data-tab="skylt"]'); await page.waitForSelector('[data-item="askylt"]');
for (const id of ['askylt', 'affisch', 'logoskylt']) { await page.click(`[data-item="${id}"]`); await page.waitForTimeout(150); }
await page.click('[data-tab="trivsel"]'); await page.waitForSelector('[data-item="kaffe"], [data-item="vaxter"]');
for (const id of ['vaxter', 'tidningar', 'stereo', 'matta', 'kassa2']) { const b = await page.$(`[data-item="${id}"]`); if (b) { await b.click(); await page.waitForTimeout(150); } }
// kaffeautomat på en liten plats (plats 6)
await page.click('[data-tab="platser"]'); await page.waitForSelector('[data-slot="5"]');
await page.click('[data-slot="5"]'); await page.waitForSelector('[data-opt="unit:kaffe"]');
await page.click('[data-opt="unit:kaffe"]'); await page.waitForTimeout(300);
await page.click('button:has-text("Alla platser")'); await page.waitForTimeout(200);
// två hyllor till på plats 4 och 5
await page.click('[data-slot="3"]'); await page.waitForSelector('[data-opt="cat:storage"]'); await page.click('[data-opt="cat:storage"]'); await page.waitForTimeout(200);
await page.click('button:has-text("Alla platser")'); await page.waitForTimeout(200);
await page.click('[data-slot="4"]'); await page.waitForSelector('[data-opt]');
const opt2 = await page.evaluate(() => { const b = [...document.querySelectorAll('[data-opt]')].find((x) => /brand:cpu:(intel|amd):3/.test(x.dataset.opt)); return b?.dataset.opt; });
if (opt2) { await page.click(`[data-opt="${opt2}"]`); await page.waitForTimeout(200); }
await page.click('[data-close]'); await page.waitForTimeout(800);
const f2 = await page.evaluate(() => ({ lokal: PV.floor.lokal, open: PV.floor.openSlots, stats: PV.game.fitStats, units: PV.floor.units.map((u) => u.closed ? 'closed' : u.empty ? 'empty' : u.frame ? 'booth' : u.def?.unit) }));
ok(f2.lokal === 4 && f2.open === 9 && f2.stats.drag >= 6 && f2.stats.trivsel >= 6, `Hörnbutiken och inrett (${JSON.stringify(f2)})`);
await page.screenshot({ path: OUT + "fit5-renoverad.png" });
// ställ ut lite delar så montrarna får innehåll
await page.evaluate(() => { const g = PV.game; const list = g.shop.onSale(g.year).filter((p) => ['gpu', 'cpu', 'ram', 'storage'].includes(p.cat) && g.canSell(p)).sort((a, b) => b.tier - a.tier).slice(0, 40); for (const p of list) { g.stock[p.id] = 2; g.shown[p.id] = 2; } g.emit('change'); });
await page.waitForTimeout(900);
await page.screenshot({ path: OUT + "fit6-fyllda.png" });
// Datorhuset (fyll på kassan – lokalerna kostar)
await page.evaluate(() => { PV.game.money = 500000; PV.game.emit('change'); });
await page.click('[data-h="fit"]'); await page.waitForSelector('[data-tab="lager"]'); await page.click('[data-tab="lager"]'); await page.waitForSelector('[data-item="lokal5"]');
await page.click('[data-item="lokal5"]'); await page.waitForTimeout(300); await page.click('[data-close]'); await page.waitForTimeout(800);
const f3 = await page.evaluate(() => ({ lokal: PV.floor.lokal, open: PV.floor.openSlots, arcade: PV.game.hasArcadeRoom }));
ok(f3.lokal === 5 && f3.open === 10 && f3.arcade, `Datorhuset (${JSON.stringify(f3)})`);
await page.screenshot({ path: OUT + "fit7-datorhuset.png" });
await page.click('[data-h="fit"]'); await page.waitForSelector('[data-tab="lager"]'); await page.click('[data-tab="lager"]'); await page.waitForSelector('[data-item="lokal6"]');
await page.click('[data-item="lokal6"]'); await page.waitForTimeout(300); await page.click('[data-close]'); await page.waitForTimeout(800);
ok(await page.evaluate(() => PV.floor.lokal === 6), 'Megastore');
await page.screenshot({ path: OUT + "fit8-megastore.png" });
await page.screenshot({ path: OUT + "fit7-datorhuset.png" });
// omladdning behåller inredningen
await page.reload(); await page.click('[data-shop="dator"]'); await page.click(`[data-year="${YEAR}"]`);
await page.waitForFunction(() => window.PV?.game, null, { timeout: 30000 }); await page.waitForTimeout(800);
const f4 = await page.evaluate(() => ({ lokal: PV.floor.lokal, slot0: PV.game.fit.slots[0]?.kind, items: Object.keys(PV.game.fit.items).length }));
ok(f4.lokal === 6 && f4.slot0 === 'brand' && f4.items >= 8, `sparat och laddat (${JSON.stringify(f4)})`);
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
