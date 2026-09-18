// Avtal: grossister (pris, leveranstid, risk), märkesprogram (kräver bås nivå 2, rabatt + drag,
// avgift per månad, avslutas när båset säljs), omladdning. node tools/avtal.mjs [url] [år]
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
const crash = async (e) => { const NL = String.fromCharCode(10); console.log('KRASCH ' + String(e.message).split(NL)[0]); try { console.log('DIALOG: ' + (await page.evaluate(() => document.querySelector('.dlg')?.innerText?.slice(0, 300) || '(ingen)'))); } catch {} console.log(errors.join(NL)); process.exit(1); };
process.on('unhandledRejection', crash); process.on('uncaughtException', crash);
await page.goto(URL);
await page.evaluate(() => localStorage.clear()); await page.reload(); await page.waitForTimeout(300);
await page.click('[data-shop="dator"]'); await page.click(`[data-year="${YEAR}"]`);
await page.waitForFunction(() => window.PV?.game, null, { timeout: 30000 }); await page.waitForTimeout(800);
await page.evaluate(() => { const g = PV.game; g.money = 300000; g.tutorialStep = 99; for (const e of g.shop.events.EVENTS) if (!g.events.seen.includes(e.id)) g.events.seen.push(e.id); g.emit('change'); });
await page.waitForTimeout(300);
// 1) avtalsdialogen från grossisten
await page.click('[data-h="shop"]'); await page.waitForSelector('[data-avtal]'); await page.click('[data-avtal]'); await page.waitForSelector('[data-sup]'); await page.waitForTimeout(150);
const r1 = await page.evaluate(() => ({ sups: [...document.querySelectorAll('[data-sup]')].map((b) => b.dataset.sup), joins: [...document.querySelectorAll('[data-join]')].map((b) => ({ brand: b.dataset.join, disabled: b.disabled })), cur: PV.game.supplier }));
ok(r1.cur === 'lokal' && r1.sups.includes('import') && r1.sups.includes('kedja') && !r1.sups.includes('nat') && r1.joins.every((j) => j.disabled), `avtal 1999: ${JSON.stringify(r1)}`);
await page.screenshot({ path: OUT + "avtal1.png" });
// 2) byt till importgrossisten: billigare, långsammare
const gpu = await page.evaluate(() => { const g = PV.game; const p = g.shop.onSale(g.year).filter((q) => q.cat === 'gpu' && g.canSell(q)).sort((a, b) => b.cost - a.cost)[0]; return { id: p.id, cost: p.cost, before: g.costOf(p) }; });
await page.click('[data-sup="import"]'); await page.waitForTimeout(250);
const r2 = await page.evaluate((id) => { const g = PV.game, p = g.shop.part[id]; g.buy(id, 1); const box = g.deliveries.at(-1); return { sup: g.supplier, cost: g.costOf(p), eta: Math.round(box.eta - g.time), title: document.querySelector('.dlg h2')?.textContent }; }, gpu.id);
ok(r2.sup === 'import' && r2.cost === Math.round(gpu.cost * 0.88 / 10) * 10 && r2.eta >= 29, `import: ${gpu.cost} → ${r2.cost} kr, lådan tar ${r2.eta} s`);
// 3) märkesprogram kräver bås: köp NVIDIA-monter nivå 2 och gå med
await page.evaluate(() => { const g = PV.game, F = g.shop.fit; g.buyItem('lokal2'); const o = F.optionsFor(g.fit, 0, 'wide', g.year).find((x) => x.id === 'brand:gpu:nvidia:2'); g.buySlot(0, o.id); });
await page.waitForTimeout(300);
await page.click('[data-close]').catch(() => {});
await page.click('[data-h="shop"]'); await page.waitForSelector('[data-avtal]'); await page.click('[data-avtal]'); await page.waitForSelector('[data-join="nvidia"]'); await page.waitForTimeout(150);
ok(await page.evaluate(() => !document.querySelector('[data-join="nvidia"]').disabled), 'NVIDIA-programmet går att gå med i med ett bås nivå 2');
const dragBefore = await page.evaluate(() => PV.game.fitStats.drag), m0 = await page.evaluate(() => PV.game.money);
await page.click('[data-join="nvidia"]'); await page.waitForTimeout(250);
const r3 = await page.evaluate((id) => { const g = PV.game; const nv = g.shop.onSale(g.year).find((q) => q.cat === 'gpu' && g.shop.fit.brandKey(q) === 'nvidia'); return { partners: g.partners, drag: g.fitStats.drag, money: g.money, nvCost: nv && g.costOf(nv), nvBase: nv && nv.cost, fees: g.monthlyFees() }; }, gpu.id);
ok(r3.partners.includes('nvidia') && r3.drag === dragBefore + 1 && r3.money < m0 && r3.nvCost < r3.nvBase * 0.8 && r3.fees > 0, `medlem: ${JSON.stringify(r3)}`);
await page.screenshot({ path: OUT + "avtal2-medlem.png" });
await page.click('button:has-text("Grossisten")'); await page.waitForSelector('.shoprow'); await page.waitForTimeout(150);
ok(await page.evaluate(() => /📉/.test(document.querySelector('.plist').textContent)), 'grossisten markerar rabatterade delar');
await page.screenshot({ path: OUT + "avtal3-grossist.png" });
await page.click('[data-close]');
// 4) avgifterna dras varje månad
const m1 = await page.evaluate(() => { PV.game.feeT = 59.9; return PV.game.money; });
await page.waitForFunction((m) => PV.game.money < m, m1, { timeout: 8000 });
const paid = await page.evaluate((m) => m - PV.game.money, m1);
ok(paid === r3.fees, `avgifter drogs: ${paid} kr`);
// 5) sälj båset → programmet avslutas vid nästa avgiftstick
await page.evaluate(() => { PV.game.sellSlot(0); PV.game.feeT = 59.9; });
await page.waitForFunction(() => PV.game.partners.length === 0, null, { timeout: 8000 });
ok(await page.evaluate(() => PV.game.fitStats.drag === 0 || PV.game.partners.length === 0), 'programmet avslutades när båset såldes');
// 6) omladdning
await page.reload(); await page.click('[data-shop="dator"]'); await page.click(`[data-year="${YEAR}"]`);
await page.waitForFunction(() => window.PV?.game, null, { timeout: 30000 }); await page.waitForTimeout(800);
ok(await page.evaluate(() => PV.game.supplier === 'import'), 'grossisten sparad');
console.log(errors.length ? 'FEL:\n' + errors.join('\n') : 'Inga fel.');
await browser.close();
process.exit(errors.length ? 1 : 0);
